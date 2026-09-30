import React, { useMemo, useState } from 'react';
import {
  Calendar,
  UserPlus,
  Edit2,
  Trash2,
  AlertCircle,
  Printer,
  Download,
  Plus,
  Info,
  Clock,
  ArrowUpRight,
  Sparkles,
  CalendarCheck,
  CheckCircle2,
  X,
  RotateCcw,
  CalendarDays,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  FileImage,
  Eye,
  Layers,
  Search,
  Building2,
  DoorOpen
} from 'lucide-react';
import { DoctorSchedule, DoctorLeaveAnnouncement } from '../types';
import {
  formatLeaveBadgeSummary,
  consolidateAndSortDoctorLeaves,
  isDoctorLeaveActiveOnDate,
  formatYMDToIndonesian,
  formatDoctorScheduleTime,
  formatHfisTime,
  getJamCetak,
  formatDoctorQuota,
  getScheduleStartMinutes,
  DAY_ORDER_MAP
} from '../utils/dateHelpers';
import { ExportDropdown } from './ExportDropdown';
import { PrintHeaderKop } from './PrintHeaderKop';
import { PrintSignatureBlock } from './PrintSignatureBlock';
import { exportToExcel, exportToPdf, getIndonesianCurrentDate } from '../utils/exportHelpers';
import { DoctorSchedulePreviewModal } from './DoctorSchedulePreviewModal';
import { BulkEditScheduleModal } from './BulkEditScheduleModal';

interface ScheduleTableProps {
  schedules: DoctorSchedule[];
  doctorLeaves: DoctorLeaveAnnouncement[];
  statusFilter?: string;
  searchTerm?: string;
  selectedPoli?: string;
  selectedLeaveDate?: string;
  onLeaveDateChange?: (date: string) => void;
  onAddNewDoctor?: () => void;
  onAddOrEditSchedule?: () => void;
  onAddNewSchedule: () => void;
  onEditSchedule: (sch: DoctorSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onBookPatient: (sch: DoctorSchedule) => void;
  onExport?: () => void;
  onPrint: () => void;
  onExportExcel?: () => void | Promise<void>;
  onExportPdf?: () => void | Promise<void>;
  showToast?: (message: string) => void;
  onHighlightDoctorLeave?: (dpjp: string) => void;
  onEditLeave?: (leave: DoctorLeaveAnnouncement) => void;
  onAddNewLeave?: () => void;
  onDeleteLeave?: (id: string) => void;
  onResetFilters?: () => void;
  onOpenPosterModal?: () => void;
  onOpenLeavePoster?: (leave: DoctorLeaveAnnouncement) => void;
  onBulkUpdateSchedules?: (ids: string[], updates: Partial<DoctorSchedule>) => void;
  onBulkDeleteSchedules?: (ids: string[]) => void;
  highlightedDoctor?: string | null;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  doctorLeaves,
  statusFilter = 'all',
  searchTerm = '',
  selectedPoli = '',
  selectedLeaveDate,
  onLeaveDateChange,
  onAddNewDoctor,
  onAddOrEditSchedule,
  onAddNewSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onBookPatient,
  onExport,
  onPrint,
  onExportExcel,
  onExportPdf,
  showToast,
  onHighlightDoctorLeave,
  onEditLeave,
  onAddNewLeave,
  onDeleteLeave,
  onResetFilters,
  onOpenPosterModal,
  onOpenLeavePoster,
  onBulkUpdateSchedules,
  onBulkDeleteSchedules,
  highlightedDoctor
}) => {
  // Local state fallback if not controlled by parent
  const [internalLeaveDate, setInternalLeaveDate] = useState('');
  const activeLeaveDate = selectedLeaveDate !== undefined ? selectedLeaveDate : internalLeaveDate;
  const [previewDoctor, setPreviewDoctor] = useState<DoctorSchedule | null>(null);

  const handleDateChange = (newDate: string) => {
    if (onLeaveDateChange) {
      onLeaveDateChange(newDate);
    } else {
      setInternalLeaveDate(newDate);
    }
  };

  // Normalize string helper
  const normalize = (str: string) =>
    str ? str.toLowerCase().replace(/['’`\.]/g, '').trim() : '';

  const isLeaveMode = statusFilter === 'libur';

  // Filtered leaves for Leave Mode (Deduplicated 1 doctor = 1 entry + Date Filter)
  const filteredLeaves = useMemo(() => {
    const consolidated = consolidateAndSortDoctorLeaves(doctorLeaves);
    const search = normalize(searchTerm);
    const poli = selectedPoli;

    return consolidated.filter((doc) => {
      // Date filter check
      if (activeLeaveDate && !isDoctorLeaveActiveOnDate(doc, activeLeaveDate)) {
        return false;
      }

      const dpjpNorm = normalize(doc.dpjp);
      const poliNorm = normalize(doc.poli);
      const matchesSearch =
        search === '' ||
        dpjpNorm.includes(search) ||
        poliNorm.includes(search) ||
        doc.jadwal.some(
          (j) =>
            normalize(j.keterangan || '').includes(search) ||
            normalize(j.tglLibur || '').includes(search) ||
            normalize(j.tglMasuk || '').includes(search)
        );

      const matchesPoli = poli === '' || doc.poli === poli;
      return matchesSearch && matchesPoli;
    });
  }, [doctorLeaves, searchTerm, selectedPoli, activeLeaveDate]);

  // Sorting state: default chronological by practice start time ('jadwal', 'asc')
  const [sortField, setSortField] = useState<'jadwal' | 'jamHfis'>('jadwal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'jadwal' | 'jamHfis') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorted schedules: chronological by practice start time, with day & poli tiebreakers
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const timeA = getScheduleStartMinutes(a, sortField);
      const timeB = getScheduleStartMinutes(b, sortField);

      if (timeA !== timeB) {
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      // Tiebreaker 1: Hari Praktik (Senin -> Ahad)
      const dayA = DAY_ORDER_MAP[a.hari?.toLowerCase().trim()] ?? 99;
      const dayB = DAY_ORDER_MAP[b.hari?.toLowerCase().trim()] ?? 99;
      if (dayA !== dayB) return dayA - dayB;

      // Tiebreaker 2: Poliklinik
      const poliDiff = (a.poli || '').localeCompare(b.poli || '');
      if (poliDiff !== 0) return poliDiff;

      // Tiebreaker 3: DPJP
      return (a.dpjp || '').localeCompare(b.dpjp || '');
    });
  }, [schedules, sortField, sortDirection]);

  // Kolom Pencarian Khusus Ruangan & Poli di dalam ScheduleTable
  const [roomOrPoliSearch, setRoomOrPoliSearch] = useState('');

  // Daftar Poliklinik unik untuk quick filter chips
  const quickPoliList = useMemo(() => {
    const list = new Set<string>();
    schedules.forEach((s) => {
      if (s.poli) {
        list.add(s.poli.replace(/^Poli\s+/i, '').trim());
      }
    });
    return Array.from(list).sort();
  }, [schedules]);

  // Daftar Ruangan unik untuk quick filter chips
  const quickRoomList = useMemo(() => {
    const list = new Set<string>();
    schedules.forEach((s) => {
      if (s.ruangan && s.ruangan.trim()) {
        list.add(s.ruangan.trim());
      }
    });
    return Array.from(list).sort();
  }, [schedules]);

  // Jadwal yang ditampilkan setelah difilter oleh kolom pencarian Ruangan / Poli
  const displaySchedules = useMemo(() => {
    if (!roomOrPoliSearch.trim()) return sortedSchedules;
    const query = normalize(roomOrPoliSearch);
    return sortedSchedules.filter((sch) => {
      const roomNorm = normalize(sch.ruangan || 'R. Praktik');
      const poliNorm = normalize(sch.poli || '');
      const dpjpNorm = normalize(sch.dpjp || '');
      const specNorm = normalize(sch.spesialisasi || '');
      return roomNorm.includes(query) || poliNorm.includes(query) || dpjpNorm.includes(query) || specNorm.includes(query);
    });
  }, [sortedSchedules, roomOrPoliSearch]);

  // Pengumuman libur yang difilter oleh pencarian Ruangan / Poli jika dalam mode libur
  const displayLeaves = useMemo(() => {
    if (!roomOrPoliSearch.trim()) return filteredLeaves;
    const query = normalize(roomOrPoliSearch);
    return filteredLeaves.filter((doc) => {
      const poliNorm = normalize(doc.poli || '');
      return poliNorm.includes(query);
    });
  }, [filteredLeaves, roomOrPoliSearch]);

  // Bulk selection state
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  // Toggle single item selection
  const handleToggleSelect = (id: string) => {
    setSelectedScheduleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all visible sorted schedules (respects active room/poli filter)
  const handleToggleSelectAll = () => {
    if (displaySchedules.length === 0) return;
    if (selectedScheduleIds.size >= displaySchedules.length) {
      setSelectedScheduleIds(new Set());
    } else {
      setSelectedScheduleIds(new Set(displaySchedules.map((s) => s.id)));
    }
  };

  // Clear all selection
  const handleClearSelection = () => {
    setSelectedScheduleIds(new Set());
  };

  const selectedScheduleObjects = useMemo(() => {
    return schedules.filter((s) => selectedScheduleIds.has(s.id));
  }, [schedules, selectedScheduleIds]);

  const isAllSelected = displaySchedules.length > 0 && selectedScheduleIds.size === displaySchedules.length;
  const isIndeterminate = selectedScheduleIds.size > 0 && selectedScheduleIds.size < displaySchedules.length;

  // Quick action: Set status for selected
  const handleQuickSetStatus = (newStatus: 'Tersedia' | 'Penuh' | 'Libur') => {
    if (selectedScheduleIds.size === 0) return;
    const ids = Array.from(selectedScheduleIds);
    if (onBulkUpdateSchedules) {
      onBulkUpdateSchedules(ids, { status: newStatus });
    }
    showToast?.(`${ids.length} jadwal dokter diset ke status "${newStatus}".`);
    setSelectedScheduleIds(new Set());
  };

  // Quick action: Reset kuota terisi = 0
  const handleQuickResetKuotaTerisi = () => {
    if (selectedScheduleIds.size === 0) return;
    const ids = Array.from(selectedScheduleIds);
    if (onBulkUpdateSchedules) {
      onBulkUpdateSchedules(ids, { kuotaTerisi: 0, status: 'Tersedia' });
    }
    showToast?.(`Kuota terisi untuk ${ids.length} jadwal berhasil di-reset ke 0.`);
    setSelectedScheduleIds(new Set());
  };

  // Quick action: Bulk delete
  const handleConfirmBulkDelete = () => {
    if (selectedScheduleIds.size === 0) return;
    const count = selectedScheduleIds.size;
    if (window.confirm(`Yakin ingin menghapus ${count} jadwal dokter yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) {
      const ids = Array.from(selectedScheduleIds);
      if (onBulkDeleteSchedules) {
        onBulkDeleteSchedules(ids);
      } else {
        ids.forEach((id) => onDeleteSchedule(id));
      }
      showToast?.(`${count} jadwal dokter berhasil dihapus.`);
      setSelectedScheduleIds(new Set());
    }
  };

  const handleExportExcel = async () => {
    if (onExportExcel) {
      await onExportExcel();
      return;
    }

    if (isLeaveMode) {
      const filename = `Rekap_Libur_Dokter_RSUMB_${new Date().toISOString().slice(0, 10)}`;
      const title = 'REKAPITULASI LIBUR & PERUBAHAN JADWAL DOKTER DPJP - RSUMB';
      const subtitle = `Poliklinik: ${selectedPoli || 'Semua Poliklinik'} ${
        activeLeaveDate ? `| Tanggal: ${formatYMDToIndonesian(activeLeaveDate)}` : ''
      }`;
      const totalLabel = `Total Data: ${filteredLeaves.length} Dokter DPJP Tercatat`;
      const headers = [
        'NO',
        'POLIKLINIK',
        'NAMA DOKTER / DPJP',
        'STATUS & TANGGAL LIBUR / MAJU',
        'TANGGAL MASUK KEMBALI',
        'KETERANGAN / DOKTER PENGGANTI'
      ];
      const data = filteredLeaves.map((doc, idx) => {
        const jadwalList = Array.isArray(doc.jadwal) ? doc.jadwal : [];
        const liburMajuStr = jadwalList
          .map((j) => `[${j.tipe}] ${j.tglLibur || '-'}`)
          .join('\n');
        const masukStr = jadwalList.map((j) => j.tglMasuk || '-').join('\n');
        const ketStr = jadwalList.map((j) => j.keterangan || '-').join('\n');
        return [
          idx + 1,
          doc.poli.replace(/^Poli\s+/i, ''),
          doc.dpjp,
          liburMajuStr,
          masukStr,
          ketStr
        ];
      });

      await exportToExcel({
        filename,
        sheetName: 'Libur Dokter RSUMB',
        title,
        subtitle,
        totalLabel,
        headers,
        data,
        columnAlignments: ['center', 'left', 'left', 'left', 'center', 'left']
      });
      showToast?.('Rekapitulasi libur dokter berhasil diekspor ke Excel (.xlsx).');
    } else {
      const filename = `Jadwal_Praktik_Dokter_RSUMB_${new Date().toISOString().slice(0, 10)}`;
      const title = 'JADWAL PRAKTIK DOKTER SPESIALIS RAWAT JALAN - RSUMB';
      const subtitle = `Poliklinik: ${selectedPoli || 'Semua Poliklinik'} | Filter: ${
        statusFilter === 'all' ? 'Semua Jadwal' : statusFilter
      }`;
      const totalLabel = `Total Data: ${sortedSchedules.length} Jadwal Praktik DPJP`;
      const headers = [
        'NO',
        'POLIKLINIK',
        'NAMA DOKTER / DPJP',
        'HARI',
        'JAM PRAKTIK',
        'JAM HFIS',
        'KUOTA BPJS'
      ];
      const data = sortedSchedules.map((s, idx) => {
        const jamHfis = formatHfisTime(s.jamHfis);
        const jamCetak = getJamCetak(s.jamHfis, s);
        const jamHfisCombined = jamCetak ? `${jamHfis} (${jamCetak})` : jamHfis;

        return [
          idx + 1,
          s.poli.replace(/^Poli\s+/i, ''),
          s.dpjp,
          s.hari,
          formatDoctorScheduleTime(s),
          jamHfisCombined,
          `${s.kuotaTerisi}/${s.kuotaTotal} (${s.status})`
        ];
      });

      await exportToExcel({
        filename,
        sheetName: 'Jadwal Dokter RSUMB',
        title,
        subtitle,
        totalLabel,
        headers,
        data,
        columnAlignments: [
          'center',
          'left',
          'left',
          'center',
          'center',
          'center',
          'center'
        ]
      });
      showToast?.('Jadwal praktik dokter berhasil diekspor ke Excel (.xlsx).');
    }
  };

  const handleExportPdf = async () => {
    if (onExportPdf) {
      await onExportPdf();
      return;
    }

    if (isLeaveMode) {
      const filename = `Rekap_Libur_Dokter_RSUMB_${new Date().toISOString().slice(0, 10)}`;
      const title = 'REKAPITULASI LIBUR & PERUBAHAN JADWAL DOKTER DPJP';
      const subtitle = `Poliklinik: ${selectedPoli || 'Semua'} ${
        activeLeaveDate ? `| Tanggal: ${formatYMDToIndonesian(activeLeaveDate)}` : ''
      }`;
      const totalLabel = `Total: ${filteredLeaves.length} Dokter Tercatat`;
      const headers = [
        'NO',
        'POLIKLINIK',
        'DOKTER / DPJP',
        'STATUS & TANGGAL LIBUR / MAJU',
        'TGL MASUK',
        'KETERANGAN / DOKTER PENGGANTI'
      ];
      const data = filteredLeaves.map((doc, idx) => {
        const jadwalList = Array.isArray(doc.jadwal) ? doc.jadwal : [];
        const liburMajuStr = jadwalList
          .map((j) => `[${j.tipe}] ${j.tglLibur || '-'}`)
          .join('\n');
        const masukStr = jadwalList.map((j) => j.tglMasuk || '-').join('\n');
        const ketStr = jadwalList.map((j) => j.keterangan || '-').join('\n');
        return [
          String(idx + 1),
          doc.poli.replace(/^Poli\s+/i, ''),
          doc.dpjp,
          liburMajuStr,
          masukStr,
          ketStr
        ];
      });

      await exportToPdf({
        filename,
        title,
        subtitle,
        totalLabel,
        headers,
        data,
        orientation: 'landscape',
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 32 },
          2: { cellWidth: 54 },
          3: { cellWidth: 58 },
          4: { cellWidth: 28, halign: 'center' }
        },
        signatureTitle: 'Petugas Verifikasi SIMRS & Rekam Medis'
      });
      showToast?.('File PDF resmi Rekap Libur Dokter berhasil diunduh.');
    } else {
      const filename = `Jadwal_Praktik_Dokter_RSUMB_${new Date().toISOString().slice(0, 10)}`;
      const title = 'JADWAL PRAKTIK DOKTER SPESIALIS RAWAT JALAN';
      const subtitle = `Poliklinik: ${selectedPoli || 'Semua Poliklinik'} | Filter: ${
        statusFilter === 'all' ? 'Semua Jadwal' : statusFilter
      }`;
      const totalLabel = `Total: ${sortedSchedules.length} Jadwal Praktik`;
      const headers = [
        'NO',
        'POLIKLINIK',
        'DOKTER / DPJP',
        'HARI',
        'JAM PRAKTIK',
        'JAM HFIS',
        'KUOTA BPJS'
      ];
      const data = sortedSchedules.map((s, idx) => {
        const jamHfis = formatHfisTime(s.jamHfis);
        const jamCetak = getJamCetak(s.jamHfis, s);
        const jamHfisCombined = jamCetak ? `${jamHfis}\n${jamCetak}` : jamHfis;

        return [
          String(idx + 1),
          s.poli.replace(/^Poli\s+/i, ''),
          s.dpjp,
          s.hari,
          formatDoctorScheduleTime(s),
          jamHfisCombined,
          `${s.kuotaTerisi}/${s.kuotaTotal} (${s.status})`
        ];
      });

      await exportToPdf({
        filename,
        title,
        subtitle,
        totalLabel,
        headers,
        data,
        orientation: 'landscape',
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' }, // NO
          1: { cellWidth: 42, halign: 'left' },   // POLIKLINIK
          2: { cellWidth: 78, halign: 'left' },   // DOKTER / DPJP
          3: { cellWidth: 26, halign: 'center' }, // HARI
          4: { cellWidth: 44, halign: 'center' }, // JAM PRAKTIK
          5: { cellWidth: 40, halign: 'center' }, // JAM HFIS
          6: { cellWidth: 35, halign: 'center' }  // KUOTA BPJS
        },
        signatureTitle: 'Petugas Verifikasi SIMRS & Rawat Jalan'
      });
      showToast?.('File PDF resmi Jadwal Praktik Dokter berhasil diunduh.');
    }
  };

  return (
    <>
      <div id="schedule-table-section" className="schedule-main-card bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col transition-all">
      {/* Kop Cetak Resmi RSUMB (Khusus Tampil saat Print PDF / window.print) */}
      <div className="px-4 pt-4">
        <PrintHeaderKop
          title={
            isLeaveMode
              ? 'REKAPITULASI LIBUR & PERUBAHAN JADWAL DOKTER DPJP'
              : 'JADWAL PRAKTIK DOKTER SPESIALIS RAWAT JALAN'
          }
          subtitle={
            isLeaveMode
              ? `Poliklinik: ${selectedPoli || 'Semua Poliklinik'} ${
                  activeLeaveDate ? `| Tanggal: ${formatYMDToIndonesian(activeLeaveDate)}` : ''
                }`
              : `Poliklinik: ${selectedPoli || 'Semua Poliklinik'} | Filter: ${
                  statusFilter === 'all' ? 'Semua Jadwal' : statusFilter
                }`
          }
          totalDataCount={isLeaveMode ? displayLeaves.length : displaySchedules.length}
          totalDataLabel={
            isLeaveMode
              ? `Total: ${displayLeaves.length} Dokter DPJP Tercatat`
              : `Total: ${displaySchedules.length} Jadwal Praktik DPJP`
          }
        />
      </div>

      {/* Table Card Header (Disembunyikan saat Cetak) */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden no-print">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              isLeaveMode
                ? 'bg-amber-100 text-amber-800'
                : 'bg-teal-50 text-teal-700'
            }`}
          >
            {isLeaveMode ? (
              <AlertCircle className="w-5 h-5 text-amber-700" />
            ) : (
              <Calendar className="w-5 h-5 text-teal-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-slate-800 tracking-tight flex items-center gap-2">
              {isLeaveMode
                ? 'Rekapitulasi Libur & Perubahan Jadwal Dokter'
                : 'Daftar Jadwal Praktik Dokter'}
              {isLeaveMode && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                  Mode Libur Aktif
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 hidden sm:block">
              {isLeaveMode
                ? activeLeaveDate
                  ? `Menampilkan perubahan jadwal untuk tanggal: ${formatYMDToIndonesian(activeLeaveDate)}`
                  : 'Informasi dokter yang sedang libur, cuti, atau mengalami perubahan jam praktik'
                : 'Informasi pelayanan poliklinik rumah sakit & HFIS BPJS'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold ${
              isLeaveMode
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isLeaveMode
              ? activeLeaveDate
                ? `${displayLeaves.length} Data Ditemukan (${formatYMDToIndonesian(activeLeaveDate, false)})`
                : `${displayLeaves.length} Data Ditemukan`
              : roomOrPoliSearch
              ? `${displaySchedules.length} dari ${schedules.length} Data Ditemukan`
              : `${displaySchedules.length} Data Ditemukan`}
          </span>

          {/* Active Sort Pill */}
          {!isLeaveMode && (
            <button
              type="button"
              onClick={() => handleSort(sortField)}
              className="text-xs px-3 py-1 rounded-full font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Klik untuk membalik urutan waktu (Pagi ke Sore / Sebaliknya)"
            >
              {sortDirection === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-teal-700" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-teal-700" />
              )}
              <span>
                Urutan: {sortField === 'jadwal' ? 'Jadwal Praktik' : 'Jam HFIS'} (
                {sortDirection === 'asc' ? 'Pagi → Malam' : 'Malam → Pagi'})
              </span>
            </button>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Tombol Generator Poster Jadwal Harian Resmi RSUMB */}
            {onOpenPosterModal && (
              <button
                type="button"
                id="btn-open-daily-poster-modal"
                onClick={onOpenPosterModal}
                className="px-3 py-2 bg-gradient-to-r from-[#005d42] to-[#00A859] hover:from-[#004732] hover:to-[#008f4c] text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                title="Buka Generator Poster Jadwal Harian Resmi RSUMB (Auto-Poster Siap Unduh PNG / Cetak)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Poster Jadwal Harian</span>
              </button>
            )}

            <button
              onClick={onPrint}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              title="Cetak Jadwal (PDF / Printer)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cetak</span>
            </button>

            {/* Dropdown Menu Ekspor Data: Excel (.xlsx) & PDF (.pdf) */}
            <ExportDropdown
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
            />

            {isLeaveMode ? (
              <div className="flex items-center gap-1.5">
                {/* FITUR FILTER KALENDER (DATE PICKER) */}
                <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-amber-400 transition-all">
                  <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
                  <label htmlFor="calendar-leave-date-filter" className="sr-only">
                    Filter Tanggal Libur
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="calendar-leave-date-filter"
                      type="date"
                      value={activeLeaveDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                      title="Pilih tanggal untuk memfilter perubahan jadwal dokter"
                    />
                    {activeLeaveDate ? (
                      <button
                        type="button"
                        id="btn-clear-calendar-filter"
                        onClick={() => handleDateChange('')}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Hapus Filter Tanggal"
                        aria-label="Hapus Filter Tanggal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 hidden lg:inline font-medium">
                        Pilih Tanggal
                      </span>
                    )}
                  </div>
                </div>

                {/* Tombol Tambah Catatan */}
                {onAddNewLeave && (
                  <button
                    onClick={onAddNewLeave}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    title="Tambah Catatan Libur / Perubahan Dokter"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Catatan</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {/* BUTTON A: + Tambah Dokter Baru (Primary Green Button) */}
                <button
                  onClick={onAddNewDoctor || onAddNewSchedule}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Pendaftaran dokter baru ke dalam sistem RSUMB"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Tambah Dokter Baru</span>
                </button>

                {/* BUTTON B: + Tambah / Edit Jadwal (Secondary / Outline Button) */}
                <button
                  onClick={onAddOrEditSchedule || onAddNewSchedule}
                  className="px-3 py-2 bg-white hover:bg-teal-50 text-teal-800 border-2 border-teal-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
                  title="Tambah hari praktik atau perbarui jam dokter yang sudah terdaftar"
                >
                  <Calendar className="w-4 h-4 text-teal-700 stroke-[2.5]" />
                  <span>+ Tambah / Edit Jadwal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH BAR KHUSUS DI DALAM SCHEDULETABLE: Filter Berdasarkan Nama Ruangan & Poli */}
      <div
        id="schedule-table-room-poli-search-bar"
        className="px-5 sm:px-6 py-2.5 bg-slate-50/90 border-b border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 print:hidden no-print"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Label & Ikon Ruangan / Poli */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 shrink-0">
            <span className="p-1 rounded-md bg-teal-100/90 text-teal-800 border border-teal-200/60 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
            </span>
            <label htmlFor="input-search-room-poli" className="cursor-pointer">
              Cari Ruangan / Poli:
            </label>
          </div>

          {/* Kolom Input Search Ruangan & Poliklinik */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              id="input-search-room-poli"
              type="text"
              value={roomOrPoliSearch}
              onChange={(e) => setRoomOrPoliSearch(e.target.value)}
              placeholder="Ketik ruangan (cth: R. 101, Ruang 3) atau poli (cth: Anak, Bedah, Saraf)..."
              className="w-full pl-8 pr-8 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition shadow-2xs"
            />
            {roomOrPoliSearch && (
              <button
                type="button"
                id="btn-clear-room-poli-search"
                onClick={() => setRoomOrPoliSearch('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian ruangan / poli"
                aria-label="Hapus pencarian ruangan / poli"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips (Pilihan Cepat Poliklinik & Ruangan) */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 custom-scrollbar max-w-full">
            <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline ml-1 font-medium">
              Filter Cepat:
            </span>
            {['Anak', 'Bedah', 'Dalam', 'Obgyn', 'Saraf', 'Mata'].map((p) => {
              const isSelected = roomOrPoliSearch.toLowerCase() === p.toLowerCase();
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setRoomOrPoliSearch(isSelected ? '' : p)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs font-semibold'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                  title={`Filter cepat Poliklinik ${p}`}
                >
                  {p}
                </button>
              );
            })}
            {quickRoomList.slice(0, 4).map((r) => {
              const isSelected = roomOrPoliSearch.toLowerCase() === r.toLowerCase();
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoomOrPoliSearch(isSelected ? '' : r)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition shrink-0 cursor-pointer border flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-semibold'
                      : 'bg-white text-emerald-800 hover:bg-emerald-50 border-emerald-200'
                  }`}
                  title={`Filter cepat Ruangan ${r}`}
                >
                  <DoorOpen className="w-3 h-3 text-emerald-600" />
                  <span>{r}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter Info & Reset Action */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          {roomOrPoliSearch && (
            <span className="text-xs text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 shadow-2xs">
              <span>Hasil:</span>
              <span className="font-bold text-teal-900">
                {isLeaveMode ? displayLeaves.length : displaySchedules.length}
              </span>
              <span>data</span>
            </span>
          )}

          {roomOrPoliSearch && (
            <button
              type="button"
              id="btn-reset-room-poli-search"
              onClick={() => setRoomOrPoliSearch('')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* BULK ACTION BAR: Tampil ketika 1 atau lebih jadwal dicentang */}
      {!isLeaveMode && selectedScheduleIds.size > 0 && (
        <div
          id="schedule-bulk-action-bar"
          className="px-5 sm:px-6 py-3 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-emerald-700 shadow-md animate-in slide-in-from-top-2 duration-200 print:hidden no-print"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-400/30 text-xs font-bold">
              <Layers className="w-4 h-4 text-emerald-300" />
              <span>{selectedScheduleIds.size} Jadwal Terpilih</span>
            </div>
            <button
              type="button"
              id="btn-select-all-toggle-bar"
              onClick={handleToggleSelectAll}
              className="text-xs text-emerald-200 hover:text-white underline font-semibold transition cursor-pointer"
            >
              {selectedScheduleIds.size === sortedSchedules.length ? 'Batal Pilih Semua' : `Pilih Semua (${sortedSchedules.length})`}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Utama: Buka Modal Edit Masal */}
            <button
              type="button"
              id="btn-open-bulk-edit-modal"
              onClick={() => setIsBulkEditModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer"
              title="Buka Form Edit Masal untuk Status, Kuota, Rerata & Ruangan"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Masal ({selectedScheduleIds.size})</span>
            </button>

            {/* Quick Status Buttons */}
            <div className="hidden lg:flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10">
              <span className="text-[11px] text-emerald-200/70 px-2 font-medium">Set Cepat:</span>
              <button
                type="button"
                onClick={() => handleQuickSetStatus('Tersedia')}
                className="px-2.5 py-1 text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 rounded transition cursor-pointer"
                title="Ubah status seluruh jadwal terpilih menjadi Tersedia"
              >
                Tersedia
              </button>
              <button
                type="button"
                onClick={() => handleQuickSetStatus('Penuh')}
                className="px-2.5 py-1 text-xs font-semibold bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded transition cursor-pointer"
                title="Ubah status seluruh jadwal terpilih menjadi Penuh"
              >
                Penuh
              </button>
              <button
                type="button"
                onClick={() => handleQuickSetStatus('Libur')}
                className="px-2.5 py-1 text-xs font-semibold bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded transition cursor-pointer"
                title="Ubah status seluruh jadwal terpilih menjadi Libur"
              >
                Libur
              </button>
              <button
                type="button"
                onClick={handleQuickResetKuotaTerisi}
                className="px-2.5 py-1 text-xs font-semibold bg-blue-900/80 hover:bg-blue-800 text-blue-200 rounded transition cursor-pointer flex items-center gap-1"
                title="Reset jumlah kuota terisi ke 0 untuk semua jadwal terpilih"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Terisi (0)</span>
              </button>
            </div>

            {/* Quick Delete */}
            <button
              type="button"
              id="btn-bulk-delete"
              onClick={handleConfirmBulkDelete}
              className="px-2.5 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Hapus jadwal dokter terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus</span>
            </button>

            {/* Deselect / Cancel */}
            <button
              type="button"
              id="btn-cancel-bulk-selection"
              onClick={handleClearSelection}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Batalkan Pilihan"
              aria-label="Batalkan Pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN TABEL KHUSUS: MODE LIBUR / PERUBAHAN JADWAL (POLI, DOKTER, LIBUR/MAJU, MASUK KEMBALI, KETERANGAN) */}
      {/* ========================================================================= */}
      {isLeaveMode ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3 text-center w-12 bg-slate-100 text-slate-600">NO</th>
                <th className="px-4 py-3 bg-slate-100 text-slate-600 w-40">POLIKLINIK</th>
                <th className="px-6 py-3 bg-slate-100 text-slate-700">NAMA DOKTER/DPJP</th>
                {/* Kolom LIBUR / PERUBAHAN */}
                <th className="px-5 py-3 bg-amber-100/80 text-amber-950 border-x border-amber-200/90 text-left">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>LIBUR / PERUBAHAN</span>
                  </div>
                </th>
                {/* Kolom MASUK KEMBALI */}
                <th className="px-5 py-3 bg-emerald-100/80 text-emerald-950 border-r border-emerald-200/90 text-left">
                  <div className="flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>MASUK KEMBALI</span>
                  </div>
                </th>
                <th className="px-4 py-3 bg-slate-100 text-slate-600">KETERANGAN</th>
                <th className="px-4 py-3 bg-slate-100 text-slate-600 text-right w-24 print:hidden no-print">AKSI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-sm">
              {displayLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto px-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3 shadow-2xs">
                        {activeLeaveDate ? (
                          <CalendarCheck className="w-6 h-6 text-teal-600" />
                        ) : (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        )}
                      </div>
                      <p className="font-semibold text-slate-800 text-base">Tidak ada data tersedia</p>
                      <p className="text-xs text-slate-500 mt-1.5 text-center leading-relaxed">
                        {activeLeaveDate ? (
                          <>
                            Pada tanggal <strong className="text-slate-700 font-semibold">{formatYMDToIndonesian(activeLeaveDate)}</strong>, tidak ada dokter yang terjadwal libur, cuti, atau mengalami perubahan jam praktik.
                          </>
                        ) : roomOrPoliSearch ? (
                          `Tidak ada data dokter libur untuk poliklinik atau ruangan "${roomOrPoliSearch}".`
                        ) : searchTerm || selectedPoli ? (
                          'Tidak ada data dokter libur yang cocok dengan kata kunci atau filter poli yang dipilih.'
                        ) : (
                          'Seluruh dokter beroperasi secara normal sesuai jadwal reguler.'
                        )}
                      </p>
                      
                      {activeLeaveDate ? (
                        <button
                          type="button"
                          id="btn-reset-empty-date"
                          onClick={() => handleDateChange('')}
                          className="mt-4 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          <span>Hapus Filter Tanggal & Tampilkan Semua</span>
                        </button>
                      ) : roomOrPoliSearch ? (
                        <button
                          type="button"
                          onClick={() => setRoomOrPoliSearch('')}
                          className="mt-3 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
                        >
                          Hapus Pencarian Ruangan/Poli
                        </button>
                      ) : (searchTerm || selectedPoli) && onResetFilters ? (
                        <button
                          onClick={onResetFilters}
                          className="mt-3 text-xs text-teal-700 font-semibold hover:underline cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                displayLeaves.map((doc, index) => {
                  const isDoctorHighlighted = Boolean(
                    highlightedDoctor &&
                      (normalize(doc.dpjp).includes(normalize(highlightedDoctor)) ||
                        normalize(highlightedDoctor).includes(normalize(doc.dpjp)))
                  );

                  return (
                    <tr
                      key={doc.id || doc.dpjp}
                      id={`leave-row-${doc.id || normalize(doc.dpjp)}`}
                      data-doctor-row={normalize(doc.dpjp)}
                      className={`transition-all duration-300 ${
                        isDoctorHighlighted
                          ? 'bg-amber-100/95 hover:bg-amber-100 border-l-4 border-l-amber-500 shadow-sm ring-2 ring-amber-400/80 animate-pulse'
                          : index % 2 === 0
                          ? 'bg-white hover:bg-slate-50/80 transition'
                          : 'bg-slate-50/40 hover:bg-slate-50/80 transition'
                      }`}
                    >
                      {/* No */}
                      <td className="px-4 py-3.5 text-center text-slate-400 text-xs font-medium align-top">
                        {index + 1}
                      </td>

                      {/* Poli */}
                      <td className="px-4 py-3.5 font-semibold text-slate-800 align-top">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200/60 shadow-2xs">
                          {doc.poli.startsWith('Poli ') ? doc.poli.replace('Poli ', '') : doc.poli}
                        </span>
                      </td>

                      {/* Dokter */}
                      <td className="px-6 py-3.5 align-top">
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-slate-900 text-sm">{doc.dpjp}</span>
                          <button
                            type="button"
                            onClick={() => onHighlightDoctorLeave?.(doc.dpjp)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-medium transition-colors hover:underline cursor-pointer"
                            title="Lihat detail dokter di papan pengumuman atas"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Lihat Detail</span>
                          </button>
                        </div>
                      </td>

                      {/* LIBUR / MAJU / GANTI JAM */}
                      <td className="px-5 py-3.5 bg-amber-50/70 border-x border-amber-100/90 align-top">
                        <div className="space-y-2">
                          {(Array.isArray(doc.jadwal) ? doc.jadwal : []).map((j, jIdx) => {
                            const isMaju = j.tipe === 'MAJU';
                            const isCuti = j.tipe === 'CUTI';
                            const isGanti = (j.tipe as string) === 'GANTI_JAM' || (j.tipe as string) === 'GANTI';

                            let badgeBg = 'bg-red-50 text-red-700 border-red-200';
                            let badgeLabel = 'Libur Praktik';

                            if (isMaju) {
                              badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                              badgeLabel = 'Maju';
                            } else if (isGanti) {
                              badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                              badgeLabel = 'Ganti Jam';
                            } else if (isCuti) {
                              badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                              badgeLabel = 'Cuti';
                            }

                            return (
                              <div
                                key={jIdx}
                                className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs"
                              >
                                <span
                                  className={`font-bold px-2 py-0.5 rounded text-[10px] tracking-wide border w-fit ${badgeBg}`}
                                >
                                  {badgeLabel}
                                </span>
                                <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                                  {j.tglLibur || '-'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* MASUK KEMBALI (background hijau muda lembut) */}
                      <td className="px-5 py-3.5 bg-emerald-50/70 border-r border-emerald-100/90 align-top">
                        <div className="space-y-2">
                          {(Array.isArray(doc.jadwal) ? doc.jadwal : []).map((j, jIdx) => (
                            <div key={jIdx} className="text-xs">
                              <span className="font-semibold text-emerald-950 text-xs sm:text-sm">
                                {j.tglMasuk || '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* KETERANGAN */}
                      <td className="px-4 py-3.5 text-slate-700 text-xs align-top">
                        <div className="space-y-2">
                          {(Array.isArray(doc.jadwal) ? doc.jadwal : []).map((j, jIdx) => (
                            <div key={jIdx} className="text-slate-600 font-medium">
                              {j.keterangan || '-'}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* AKSI */}
                      <td className="px-4 py-3.5 text-right align-top print:hidden no-print">
                        <div className="flex items-center justify-end gap-1">
                          {onOpenLeavePoster && (
                            <button
                              type="button"
                              onClick={() => onOpenLeavePoster(doc)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/80 active:bg-emerald-200/70 rounded-md transition-colors shadow-2xs cursor-pointer border border-transparent hover:border-emerald-300/50"
                              title={`Unduh Poster JPG ${doc.dpjp}`}
                              aria-label={`Unduh Poster JPG ${doc.dpjp}`}
                            >
                              <FileImage className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          )}
                          {onEditLeave && (
                            <button
                              type="button"
                              onClick={() => onEditLeave(doc)}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-100/80 active:bg-amber-200/70 rounded-md transition-colors shadow-2xs cursor-pointer border border-transparent hover:border-amber-300/50"
                              title={`Edit catatan ${doc.dpjp}`}
                              aria-label={`Edit catatan ${doc.dpjp}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteLeave && (
                            <button
                              type="button"
                              onClick={() => onDeleteLeave(doc.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-md transition-colors shadow-2xs cursor-pointer border border-transparent hover:border-rose-200"
                              title={`Hapus pengumuman ${doc.dpjp}`}
                              aria-label={`Hapus pengumuman ${doc.dpjp}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAMPILAN TABEL STANDAR: DAFTAR JADWAL PRAKTIK POLIKLINIK (HARI & HFIS BPJS) */
        /* ========================================================================= */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-3 py-3 text-center w-10 print:hidden no-print">
                  <input
                    id="checkbox-select-all-schedules"
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                    title={isAllSelected ? 'Batal pilih semua' : 'Pilih semua jadwal yang tampil'}
                  />
                </th>
                <th className="px-3 py-3 text-center w-12">NO</th>
                <th className="px-4 py-3 w-36">POLIKLINIK</th>
                <th className="px-5 py-3 min-w-[200px]">DOKTER / DPJP</th>
                <th className="px-3 py-3 text-center w-24">HARI</th>

                {/* JAM PRAKTIK (Clickable Sort Header) */}
                <th
                  onClick={() => handleSort('jadwal')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/90 transition-colors select-none group w-36"
                  title="Klik untuk mengurutkan berdasarkan Jam Mulai Praktik (Pagi ke Malam / Sebaliknya)"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'jadwal' ? 'text-teal-900 font-bold' : ''}>
                      JAM PRAKTIK
                    </span>
                    <span
                      className={`inline-flex items-center justify-center p-0.5 rounded transition ${
                        sortField === 'jadwal'
                          ? 'bg-teal-100 text-teal-800'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {sortField === 'jadwal' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-teal-700" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-teal-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      )}
                    </span>
                  </div>
                </th>

                {/* JAM HFIS (Clickable Sort Header) */}
                <th
                  onClick={() => handleSort('jamHfis')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/90 transition-colors select-none group w-36"
                  title="Klik untuk mengurutkan berdasarkan Jam HFIS BPJS (Pagi ke Malam / Sebaliknya)"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'jamHfis' ? 'text-rose-900 font-bold' : ''}>
                      JAM HFIS
                    </span>
                    <span
                      className={`inline-flex items-center justify-center p-0.5 rounded transition ${
                        sortField === 'jamHfis'
                          ? 'bg-rose-100 text-rose-800'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {sortField === 'jamHfis' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-rose-700" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-rose-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      )}
                    </span>
                  </div>
                </th>

                <th className="px-4 py-3 text-center w-28">KUOTA BPJS</th>
                <th className="px-4 py-3 text-right w-24 print:hidden no-print">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {displaySchedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-base">Tidak ada data tersedia</p>
                      <p className="text-xs text-slate-400 mt-1 text-center">
                        {roomOrPoliSearch
                          ? `Tidak ditemukan jadwal dokter untuk kata kunci ruangan atau poliklinik "${roomOrPoliSearch}".`
                          : 'Coba sesuaikan kata kunci pencarian, filter poliklinik, atau filter hari Anda.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                        {roomOrPoliSearch && (
                          <button
                            type="button"
                            onClick={() => setRoomOrPoliSearch('')}
                            className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-lg hover:bg-teal-100 transition cursor-pointer shadow-2xs"
                          >
                            Hapus Pencarian Ruangan/Poli
                          </button>
                        )}
                        {onResetFilters && (
                          <button
                            onClick={onResetFilters}
                            className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition cursor-pointer"
                          >
                            Reset Semua Filter
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                displaySchedules.map((sch, index) => {
                  const isFull = sch.status === 'Penuh' || sch.kuotaTerisi >= sch.kuotaTotal;
                  const isRowSelected = selectedScheduleIds.has(sch.id);

                  // Check if this row matched the active roomOrPoliSearch
                  const isPoliMatched =
                    Boolean(roomOrPoliSearch.trim()) &&
                    normalize(sch.poli || '').includes(normalize(roomOrPoliSearch));
                  const isRoomMatched =
                    Boolean(roomOrPoliSearch.trim()) &&
                    normalize(sch.ruangan || 'R. Praktik').includes(normalize(roomOrPoliSearch));

                  // Find if doctor has leave announcements
                  const docLeaves = doctorLeaves.filter((l) => {
                    const lDpjp = normalize(l.dpjp);
                    const sDpjp = normalize(sch.dpjp);
                    return lDpjp === sDpjp || lDpjp.includes(sDpjp) || sDpjp.includes(lDpjp);
                  });
                  const hasLeave = docLeaves.length > 0;

                  // Check if this doctor row is highlighted from search navigation or leave click
                  const isDoctorHighlighted = Boolean(
                    highlightedDoctor &&
                      (normalize(sch.dpjp).includes(normalize(highlightedDoctor)) ||
                        normalize(highlightedDoctor).includes(normalize(sch.dpjp)))
                  );

                  return (
                    <tr
                      key={sch.id}
                      id={`schedule-row-${sch.id}`}
                      data-doctor-row={normalize(sch.dpjp)}
                      className={`transition-all duration-300 ${
                        isDoctorHighlighted
                          ? 'bg-amber-100/95 hover:bg-amber-100 border-l-4 border-l-amber-500 shadow-sm ring-2 ring-amber-400/80 animate-pulse'
                          : isRowSelected
                          ? 'bg-emerald-50/80 hover:bg-emerald-100/70 border-l-4 border-l-emerald-600'
                          : index % 2 === 0
                          ? 'bg-white hover:bg-slate-50/80'
                          : 'bg-slate-50/40 hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox Kolom Pemilihan */}
                      <td className="px-3 py-3.5 text-center print:hidden no-print">
                        <input
                          id={`checkbox-schedule-${sch.id}`}
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleToggleSelect(sch.id)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                          title={`Pilih ${sch.dpjp} (${sch.hari})`}
                        />
                      </td>

                      {/* No */}
                      <td className="px-4 py-3.5 text-center text-slate-400 text-xs font-medium">
                        {index + 1}
                      </td>

                      {/* Poli */}
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-2xs transition ${
                            isPoliMatched
                              ? 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-300/60'
                              : 'bg-teal-50 text-teal-800 border-teal-200/60'
                          }`}
                        >
                          {sch.poli.startsWith('Poli ') ? sch.poli.replace('Poli ', '') : sch.poli}
                        </span>
                      </td>

                      {/* Dokter */}
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{sch.dpjp}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {/* Doctor Leave badge with dynamic specifics */}
                            {hasLeave && (
                              <button
                                type="button"
                                onClick={() => onHighlightDoctorLeave?.(sch.dpjp)}
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs transition cursor-pointer ${
                                  formatLeaveBadgeSummary(docLeaves[0]).bgClass
                                } ${formatLeaveBadgeSummary(docLeaves[0]).textClass} ${
                                  formatLeaveBadgeSummary(docLeaves[0]).borderClass
                                } ${formatLeaveBadgeSummary(docLeaves[0]).hoverClass}`}
                                title="Klik untuk menyorot pengumuman libur dokter ini di papan atas"
                              >
                                <Sparkles className="w-3 h-3 animate-pulse" />
                                <span>{formatLeaveBadgeSummary(docLeaves[0]).text}</span>
                              </button>
                            )}
                            <span
                              className={`text-[11px] print:hidden no-print transition ${
                                isRoomMatched
                                  ? 'font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded'
                                  : 'text-slate-400'
                              }`}
                            >
                              {sch.ruangan || 'R. Praktik'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Hari */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-semibold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          {sch.hari}
                        </span>
                      </td>

                      {/* Jadwal Praktik RS (Biru Muda Lembut, Sans-Serif Medium, Tanpa Border Tebal) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-sans text-xs font-medium tracking-normal border border-blue-100/60">
                          <Clock className="w-3.5 h-3.5 text-blue-500/80 shrink-0" />
                          <span>{formatDoctorScheduleTime(sch)}</span>
                        </div>
                      </td>

                      {/* Jam HFIS (Rose/Pink Muda Lembut, Sans-Serif Medium) & Keterangan Waktu Cetak */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-sans text-xs font-medium tracking-normal border border-rose-100/60 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-rose-500/80 shrink-0" />
                            <span>{formatHfisTime(sch.jamHfis)}</span>
                          </div>
                          {getJamCetak(sch.jamHfis, sch) && (
                            <span className="text-xs text-slate-500 font-medium pl-0.5 tracking-tight">
                              {getJamCetak(sch.jamHfis, sch)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kuota BPJS (Total Batas Kapasitas Pasien per Hari) */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center font-semibold text-slate-700 text-xs whitespace-nowrap">
                          {formatDoctorQuota(sch)}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3.5 text-right print:hidden no-print">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onBookPatient(sch)}
                            disabled={isFull}
                            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                              isFull
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 active:bg-teal-200 border border-teal-200 cursor-pointer'
                            }`}
                            title={isFull ? 'Kuota Penuh' : 'Daftarkan Pasien'}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Antrean</span>
                          </button>

                          {/* Eye Icon Button (👁 Preview): Open Doctor Schedule Preview Modal */}
                          <button
                            type="button"
                            onClick={() => setPreviewDoctor(sch)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 rounded-md transition cursor-pointer border border-transparent hover:border-emerald-200"
                            title={`Preview Jadwal Lengkap ${sch.dpjp}`}
                            aria-label={`Preview Jadwal Lengkap ${sch.dpjp}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          <button
                            onClick={() => onEditSchedule(sch)}
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteSchedule(sch.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Kolom Tanda Tangan / Verifikasi Petugas (Khusus Tampil saat Print) */}
      <div className="px-6 pb-6">
        <PrintSignatureBlock
          signTitle={
            isLeaveMode
              ? 'Petugas Verifikasi SIMRS & Rekam Medis'
              : 'Petugas Verifikasi SIMRS & Rawat Jalan'
          }
        />
      </div>
    </div>

    {/* DOCTOR SCHEDULE PREVIEW & PRINT MODAL */}
    {previewDoctor && (
      <DoctorSchedulePreviewModal
        isOpen={Boolean(previewDoctor)}
        onClose={() => setPreviewDoctor(null)}
        doctor={previewDoctor}
        allSchedules={schedules}
        doctorLeaves={doctorLeaves}
      />
    )}

    {/* MODAL BULK EDIT JADWAL DOKTER */}
    <BulkEditScheduleModal
      isOpen={isBulkEditModalOpen}
      onClose={() => setIsBulkEditModalOpen(false)}
      selectedSchedules={selectedScheduleObjects}
      onSaveBulk={(ids, updates) => {
        if (onBulkUpdateSchedules) {
          onBulkUpdateSchedules(ids, updates);
        }
        setSelectedScheduleIds(new Set());
      }}
    />
  </>
);
};

