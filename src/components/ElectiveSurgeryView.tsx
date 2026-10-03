import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import {
  CalendarCheck,
  Calendar,
  Plus,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  AlertTriangle,
  Building,
  Eye,
  X,
  Edit2,
  Trash2,
  FileText,
  ChevronDown,
  Stethoscope,
  Download,
  Copy
} from 'lucide-react';
import { ElectiveSurgerySchedule, MASTER_SURGEONS } from '../data/surgeryData';
import { ExportDropdown } from './ExportDropdown';
import { PrintHeaderKop } from './PrintHeaderKop';
import { PrintSignatureBlock } from './PrintSignatureBlock';
import { exportToExcel, exportToPdf } from '../utils/exportHelpers';
import { requestAdminAction } from '../services/adminAuthService';

interface ElectiveSurgeryViewProps {
  surgeryList: ElectiveSurgerySchedule[];
  onAddSchedule: (newSchedule: Omit<ElectiveSurgerySchedule, 'id' | 'no'>) => void;
  onUpdateSchedule: (id: string, updated: Partial<ElectiveSurgerySchedule>) => void;
  onDeleteSchedule: (id: string) => void;
  showToast: (msg: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const ElectiveSurgeryView: React.FC<ElectiveSurgeryViewProps> = ({
  surgeryList,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  showToast,
  searchTerm: externalSearchTerm,
  setSearchTerm: externalSetSearchTerm
}) => {
  // Filters (syncs with external prop or uses internal fallback)
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalSetSearchTerm !== undefined ? externalSetSearchTerm : setInternalSearchTerm;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hubungiFilter, setHubungiFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [selectedPoliFilter, setSelectedPoliFilter] = useState<string>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ElectiveSurgerySchedule | null>(null);
  const [detailItem, setDetailItem] = useState<ElectiveSurgerySchedule | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ElectiveSurgerySchedule | null>(null);

  // Datetime Format Helpers
  const getDefaultIsoDatetime = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}T08:30`;
  };

  const formatToIsoDatetime = (val: string): string => {
    if (!val) return getDefaultIsoDatetime();
    if (val.includes('T')) return val.slice(0, 16);
    const parts = val.trim().split(/\s+/);
    if (parts.length >= 1) {
      const datePart = parts[0];
      const timePart = parts[1] || '08:00';
      const dateSegments = datePart.split('/');
      if (dateSegments.length === 3) {
        const [d, m, y] = dateSegments;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timePart.slice(0, 5)}`;
      }
    }
    return getDefaultIsoDatetime();
  };

  const formatToDisplayDatetime = (val: string): string => {
    if (!val) return '';
    if (val.includes('T')) {
      const [datePart, timePart] = val.split('T');
      const dateSegments = datePart.split('-');
      if (dateSegments.length === 3) {
        const [y, m, d] = dateSegments;
        const time = timePart && timePart.length >= 4 ? timePart.slice(0, 5) : '08:00';
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${time}`;
      }
    }
    return val;
  };

  const formatRencanaOpDateOnly = (val: string): string => {
    if (!val) return '-';
    if (val.includes('T')) {
      const [datePart] = val.split('T');
      const dateSegments = datePart.split('-');
      if (dateSegments.length === 3) {
        const [y, m, d] = dateSegments;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    const parts = val.trim().split(/\s+/);
    if (parts.length >= 1 && parts[0].includes('/')) {
      const segs = parts[0].split('/');
      if (segs.length === 3) {
        return `${segs[0].padStart(2, '0')}/${segs[1].padStart(2, '0')}/${segs[2]}`;
      }
      return parts[0];
    }
    return val;
  };

  // Helper untuk styling badge Jenis Bayar
  const getJenisBayarBadgeStyle = (jenisBayar: string) => {
    if (jenisBayar === 'Jasa Raharja') {
      return 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs';
    }
    if (jenisBayar === 'BPJS Kesehatan' || jenisBayar === 'BPJS') {
      return 'bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold';
    }
    if (jenisBayar === 'Asuransi Swasta' || jenisBayar === 'Asuransi') {
      return 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold';
    }
    return 'bg-slate-100 text-slate-700 border border-slate-200 font-semibold';
  };

  // Helper untuk styling badge Status Hubungi Pasien sesuai spesifikasi
  const getHubungiPxBadgeStyle = (status: ElectiveSurgerySchedule['hubungiPx']) => {
    switch (status) {
      case 'Belum Dihubungi':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'Sudah Dihubungi':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Belum Dikonfirmasi':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Tidak Merespon':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  // Form State
  const [formData, setFormData] = useState<Omit<ElectiveSurgerySchedule, 'id' | 'no'>>({
    tglPoli: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    noRm: 'RM-',
    namaPasien: '',
    poli: 'Bedah',
    dokterOperator: 'dr. Rieski Widhanar, Sp. B',
    dokterAnestesi: '',
    spri: 'Sudah',
    jenisBayar: 'BPJS Kesehatan',
    rencanaOp: getDefaultIsoDatetime(),
    tindakanBedah: '',
    noHp: '',
    pendaftaran: 'Online',
    hubungiPx: 'Belum Dihubungi',
    pelayanan: 'Terjadwal',
    instruksiPreOp: 'Puasa mulai 6 jam pre-op, sedia darah jika diperlukan',
    kelas: 'Kelas 3',
    rencanaKamarOk: 'OK 1 (Major)',
    kamarRawatInap: ''
  });

  // Extract unique Poli list
  const uniquePolis = useMemo(() => {
    const set = new Set<string>();
    surgeryList.forEach((item) => set.add(item.poli));
    return Array.from(set).sort();
  }, [surgeryList]);

  // Filtered List (Real-time Search: Nama Pasien, No. RM, Dokter DPJP, Poli Asal, Tindakan + Active Date & Status Filters)
  const filteredList = useMemo(() => {
    return surgeryList.filter((item) => {
      // Search Box: Real-time filter by Nama Pasien, No. RM, Dokter Operator (DPJP), Poliklinik Asal, Tindakan Bedah
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          (item.namaPasien || '').toLowerCase().includes(q) ||
          (item.noRm || '').toLowerCase().includes(q) ||
          (item.dokterOperator || '').toLowerCase().includes(q) ||
          (item.poli || '').toLowerCase().includes(q) ||
          (item.tindakanBedah || '').toLowerCase().includes(q) ||
          (item.kamarRawatInap && item.kamarRawatInap.toLowerCase().includes(q)) ||
          (item.jenisBayar || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status Pelayanan Dropdown (Hadir, Terjadwal, Reschedule, Batal)
      if (statusFilter !== 'all' && item.pelayanan !== statusFilter) {
        return false;
      }

      // Status Hubungi Pasien Dropdown
      if (hubungiFilter !== 'all' && item.hubungiPx !== hubungiFilter) {
        return false;
      }

      // Tanggal Rencana OP from Datepicker (YYYY-MM-DD -> DD/MM/YYYY)
      if (selectedDateFilter) {
        const parts = selectedDateFilter.split('-');
        if (parts.length === 3) {
          const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          const itemDate = (item.rencanaOp || '').split(' ')[0];
          if (itemDate !== formattedDate) return false;
        }
      }

      // Poli Asal Dropdown
      if (selectedPoliFilter !== 'all' && item.poli !== selectedPoliFilter) {
        return false;
      }

      return true;
    });
  }, [surgeryList, searchTerm, statusFilter, hubungiFilter, selectedDateFilter, selectedPoliFilter]);

  // Helper parser datetime dari rencanaOp (format: DD/MM/YYYY HH:mm atau YYYY-MM-DDTHH:mm)
  const parseSurgeryDatetime = (rencanaOp: string) => {
    if (!rencanaOp) return { isoDate: '9999-99-99', time: '99:99', rawDate: '' };

    if (rencanaOp.includes('T')) {
      const [dPart, tPart] = rencanaOp.split('T');
      return {
        isoDate: dPart,
        time: (tPart || '00:00').slice(0, 5),
        rawDate: dPart
      };
    }

    const parts = rencanaOp.trim().split(/\s+/);
    const datePart = parts[0] || '';
    const timePart = parts[1] || '00:00';

    const segs = datePart.split('/');
    if (segs.length === 3) {
      const [d, m, y] = segs;
      const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      return {
        isoDate,
        time: timePart.slice(0, 5),
        rawDate: datePart
      };
    }

    const dashSegs = datePart.split('-');
    if (dashSegs.length === 3 && dashSegs[0].length === 4) {
      return {
        isoDate: datePart,
        time: timePart.slice(0, 5),
        rawDate: datePart
      };
    }

    return {
      isoDate: datePart || '9999-99-99',
      time: timePart.slice(0, 5),
      rawDate: datePart
    };
  };

  // Helper format tanggal lengkap Bahasa Indonesia untuk Group Header (e.g. Jumat, 04 September 2026)
  const formatIndonesianSurgeryDate = (isoDate: string): string => {
    if (!isoDate || isoDate === '9999-99-99') return 'Tanggal Belum Ditentukan';
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const dateObj = new Date(year, month - 1, day);
          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
          ];
          const dayName = dayNames[dateObj.getDay()] || 'Hari';
          const monthName = monthNames[month - 1] || '';
          const dayPad = String(day).padStart(2, '0');
          return `${dayName}, ${dayPad} ${monthName} ${year}`;
        }
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  // Helper format tanggal singkat untuk toast notifikasi (contoh: "17 September")
  const getDateLabelForToast = (dateStr: string): string => {
    if (!dateStr || dateStr === '9999-99-99') return 'terpilih';
    try {
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          const monthIdx = parseInt(parts[1], 10) - 1;
          const month = monthNames[monthIdx] || '';
          return `${day} ${month}`.trim();
        }
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const monthIdx = parseInt(parts[1], 10) - 1;
          const month = monthNames[monthIdx] || '';
          return `${day} ${month}`.trim();
        }
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Helper format tanggal DDMMYYYY untuk nama file PDF (contoh: "17092026")
  const getDdmmyyyy = (dateStr: string): string => {
    if (!dateStr || dateStr === '9999-99-99') return 'Semua';
    try {
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          return `${d.padStart(2, '0')}${m.padStart(2, '0')}${y}`;
        }
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return `${d.padStart(2, '0')}${m.padStart(2, '0')}${y}`;
        }
      }
    } catch {
      // fallback
    }
    return dateStr.replace(/[^0-9]/g, '');
  };

  // Pengelompokan & Pengurutan Data Operasi Berdasarkan Tanggal & Jam
  const groupedSurgeries = useMemo(() => {
    const groups: { [isoDate: string]: { rawDate: string; items: ElectiveSurgerySchedule[] } } = {};

    for (const item of filteredList) {
      const { isoDate, rawDate } = parseSurgeryDatetime(item.rencanaOp);
      if (!groups[isoDate]) {
        groups[isoDate] = {
          rawDate: rawDate || isoDate,
          items: []
        };
      }
      groups[isoDate].items.push(item);
    }

    // 1. Urutkan kelompok tanggal dari yang paling dekat/terbaru (secara kronologis)
    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return sortedDates.map((date) => {
      // 2. Di dalam kelompok tanggal yang sama, urutkan pasien berdasarkan Jam Rencana Operasi secara kronologis (dari pagi ke malam)
      const sortedItems = [...groups[date].items].sort((a, b) => {
        const timeA = parseSurgeryDatetime(a.rencanaOp).time;
        const timeB = parseSurgeryDatetime(b.rencanaOp).time;
        return timeA.localeCompare(timeB);
      });

      return {
        date,
        rawDate: groups[date].rawDate,
        items: sortedItems
      };
    });
  }, [filteredList]);

  // Data terurut berdasar tanggal & jam untuk ekspor Excel & PDF
  const sortedFilteredList = useMemo(() => {
    return groupedSurgeries.flatMap((g) => g.items);
  }, [groupedSurgeries]);

  // KPIs (Only 4 statuses + Total)
  const stats = useMemo(() => {
    const total = surgeryList.length;
    const hadir = surgeryList.filter((s) => s.pelayanan === 'Hadir').length;
    const terjadwal = surgeryList.filter((s) => s.pelayanan === 'Terjadwal').length;
    const reschedule = surgeryList.filter((s) => s.pelayanan === 'Reschedule').length;
    const batal = surgeryList.filter((s) => s.pelayanan === 'Batal').length;
    return { total, hadir, terjadwal, reschedule, batal };
  }, [surgeryList]);

  // Export to Excel (.xlsx) dengan styling resmi RSUMB
  const handleExportExcel = async () => {
    const filename = `Scheduling_Operasi_Elektif_RSUMB_${new Date().toISOString().slice(0, 10)}`;
    const title = 'SCHEDULING OPERASI ELEKTIF (IBS) - RSU MUHAMMADIYAH BABAT';
    const subtitle = `Status Pelayanan: ${statusFilter === 'all' ? 'Semua' : statusFilter} | Poli: ${
      selectedPoliFilter === 'all' ? 'Semua' : selectedPoliFilter
    } ${selectedDateFilter ? `| Tgl: ${selectedDateFilter}` : ''}`;
    const totalLabel = `Total Data: ${sortedFilteredList.length} Pasien Operasi Elektif`;
    const headers = [
      'NO',
      'TGL POLI',
      'NO RM',
      'NAMA PASIEN',
      'POLIKLINIK',
      'DOKTER OPERATOR',
      'DOKTER ANESTESI',
      'SPRI BPJS',
      'JENIS BAYAR',
      'RENCANA OP',
      'TINDAKAN BEDAH',
      'NO HP',
      'STATUS HUBUNGI',
      'STATUS PELAYANAN',
      'KELAS',
      'KAMAR RAWAT INAP',
      'RENCANA KAMAR / OK'
    ];

    const data = sortedFilteredList.map((s, idx) => [
      idx + 1,
      s.tglPoli,
      s.noRm,
      s.namaPasien,
      s.poli,
      s.dokterOperator,
      s.dokterAnestesi || '-',
      s.spri,
      s.jenisBayar,
      s.rencanaOp,
      s.tindakanBedah,
      s.noHp || '-',
      s.hubungiPx,
      s.pelayanan,
      s.kelas || '-',
      s.kamarRawatInap || '-',
      s.rencanaKamarOk || '-'
    ]);

    await exportToExcel({
      filename,
      sheetName: 'Operasi Elektif IBS',
      title,
      subtitle,
      totalLabel,
      headers,
      data,
      columnAlignments: [
        'center',
        'center',
        'center',
        'left',
        'left',
        'left',
        'left',
        'center',
        'center',
        'center',
        'left',
        'center',
        'center',
        'center',
        'left',
        'center'
      ]
    });
    showToast('Data Scheduling Operasi Elektif berhasil diekspor ke Excel (.xlsx).');
  };

  // Export to PDF (.pdf) dengan Kop Resmi RSUMB dan Tanda Tangan
  const handleExportPdf = async () => {
    const filename = `Scheduling_Operasi_Elektif_RSUMB_${new Date().toISOString().slice(0, 10)}`;
    const title = 'SCHEDULING OPERASI ELEKTIF (IBS)';
    const subtitle = `Penjadwalan Kamar Operasi & Verifikasi SPRI BPJS RSUMB ${
      statusFilter !== 'all' ? `| Status: ${statusFilter}` : ''
    }`;
    const totalLabel = `Total Data: ${sortedFilteredList.length} Pasien Operasi`;
    const headers = [
      'NO',
      'TGL POLI',
      'NO RM',
      'NAMA PASIEN',
      'POLI',
      'DOKTER OPERATOR',
      'DOKTER ANESTESI',
      'SPRI',
      'RENCANA OP',
      'TINDAKAN BEDAH',
      'STATUS',
      'KAMAR/OK'
    ];

    const data = sortedFilteredList.map((s, idx) => [
      String(idx + 1),
      s.tglPoli,
      s.noRm,
      s.namaPasien,
      s.poli,
      s.dokterOperator,
      s.dokterAnestesi ? s.dokterAnestesi.replace(/^dr\.\s*/i, '') : '-',
      s.spri,
      `${s.rencanaOp} WIB`,
      s.tindakanBedah,
      s.pelayanan,
      s.rencanaKamarOk || '-'
    ]);

    await exportToPdf({
      filename,
      title,
      subtitle,
      totalLabel,
      headers,
      data,
      orientation: 'landscape',
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 34 },
        4: { cellWidth: 20 },
        5: { cellWidth: 38 },
        6: { cellWidth: 26 },
        7: { cellWidth: 14, halign: 'center' },
        8: { cellWidth: 26, halign: 'center' },
        9: { cellWidth: 34 },
        10: { cellWidth: 20, halign: 'center' },
        11: { cellWidth: 18, halign: 'center' }
      },
      signatureTitle: 'Kepala Instalasi Bedah Sentral (IBS) / Petugas SIMRS'
    });
    showToast('File PDF resmi Scheduling Operasi Elektif berhasil diunduh.');
  };

  // Salin Teks Format WhatsApp Broadcast untuk konfirmasi pasien per tanggal
  const handleCopyDateGroupWa = (
    date: string,
    rawDate: string,
    items: ElectiveSurgerySchedule[]
  ) => {
    if (!items || items.length === 0) {
      showToast('Tidak ada data pasien untuk tanggal ini.');
      return;
    }

    const formattedDateTitle = formatIndonesianSurgeryDate(date).toUpperCase();
    const shortDate = getDateLabelForToast(date || rawDate);

    const lines = items.map((item, idx) => {
      const time = parseSurgeryDatetime(item.rencanaOp).time;
      const statusHub = item.hubungiPx || 'Belum Dihubungi';
      const dokter = item.dokterOperator || 'Operator -';
      return `${idx + 1}. ${item.namaPasien} (${item.noRm}) - ${item.poli}/${dokter} - Jam: ${time} WIB - Status: ${statusHub}`;
    });

    const waText = `*DAFTAR KONFIRMASI OPERASI ELEKTIF - ${formattedDateTitle}*\n${lines.join('\n')}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(waText).then(
        () => {
          showToast(`Data pasien ${shortDate} berhasil disalin!`);
        },
        () => {
          fallbackCopyText(waText, shortDate);
        }
      );
    } else {
      fallbackCopyText(waText, shortDate);
    }
  };

  // Fallback copy ke clipboard untuk browser yang membatasi API clipboard
  const fallbackCopyText = (text: string, shortDate: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(`Data pasien ${shortDate} berhasil disalin!`);
    } catch {
      showToast('Gagal menyalin data ke clipboard.');
    }
  };

  // Unduh PDF List Rekap Pasien Operasi Khusus Tanggal Tertentu
  const handleDownloadDateGroupPdf = async (
    date: string,
    rawDate: string,
    items: ElectiveSurgerySchedule[]
  ) => {
    if (!items || items.length === 0) {
      showToast('Tidak ada data pasien untuk tanggal ini.');
      return;
    }

    const ddmmyyyy = getDdmmyyyy(date || rawDate);
    const filename = `Jadwal_Operasi_Elektif_${ddmmyyyy}`;
    const fullDateLabel = formatIndonesianSurgeryDate(date);
    const shortDate = getDateLabelForToast(date || rawDate);
    const title = `JADWAL OPERASI ELEKTIF - ${fullDateLabel.toUpperCase()}`;
    const subtitle = `Daftar Pasien Konfirmasi Kamar Bedah Sentral (IBS) RSUMB | Tanggal: ${fullDateLabel}`;
    const totalLabel = `Total: ${items.length} Pasien Terjadwal`;

    const headers = [
      'NO',
      'NO RM',
      'NAMA PASIEN',
      'POLI',
      'DOKTER OPERATOR',
      'NO. TELEPON / WA',
      'SPRI',
      'RENCANA OP',
      'TINDAKAN BEDAH',
      'STATUS',
      'RENCANA KAMAR'
    ];

    const data = items.map((s, idx) => [
      String(idx + 1),
      s.noRm,
      s.namaPasien,
      s.poli,
      s.dokterOperator,
      s.noHp || '-',
      s.spri,
      formatRencanaOpDateOnly(s.rencanaOp),
      s.tindakanBedah,
      s.pelayanan,
      s.kamarRawatInap || s.rencanaKamarOk || '-'
    ]);

    await exportToPdf({
      filename,
      title,
      subtitle,
      totalLabel,
      headers,
      data,
      orientation: 'landscape',
      headFontSize: 7.5,
      fontSize: 7.0,
      cellPadding: 1.5,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },      // NO
        1: { cellWidth: 19, halign: 'center' },     // NO RM
        2: { cellWidth: 35, halign: 'left' },       // NAMA PASIEN
        3: { cellWidth: 20, halign: 'left' },       // POLI
        4: { cellWidth: 38, halign: 'left' },       // DOKTER OPERATOR
        5: { cellWidth: 27, halign: 'center' },     // NO. TELEPON / WA
        6: { cellWidth: 14, halign: 'center' },     // SPRI
        7: { cellWidth: 22, halign: 'center' },     // RENCANA OP
        8: { cellWidth: 36, halign: 'left' },       // TINDAKAN BEDAH
        9: { cellWidth: 21, halign: 'center' },     // STATUS
        10: { cellWidth: 29, halign: 'left' }       // RENCANA KAMAR
      },
      signatureTitle: 'Kepala Instalasi Bedah Sentral (IBS) / Petugas SIMRS'
    });

    showToast(`File PDF Jadwal Operasi ${shortDate} berhasil diunduh.`);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Official A4 Vector PDF Generator for Kartu Tanda Pasien Pre-Op (Immune to browser/iframe print blockers)
  const handleDownloadPdfCard = (item: ElectiveSurgerySchedule) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Kop Rumah Sakit
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(11, 28, 48);
      doc.text('RSU MUHAMMADIYAH BABAT', 105, 16, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur | Telp. (0322) 451111 / 451234',
        105,
        21,
        { align: 'center' }
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 93, 66);
      doc.text('KARTU TANDA PASIEN PRE-OPERASI (PRE-OP)', 105, 27, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('INSTALASI BEDAH SENTRAL (IBS) & PENJADWALAN OPERASI ELEKTIF', 105, 31, { align: 'center' });

      // Double Line Divider
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.6);
      doc.line(14, 34, 196, 34);
      doc.setLineWidth(0.2);
      doc.line(14, 35, 196, 35);

      // Section 1: Identitas Pasien
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 38, 182, 38, 2, 2, 'FD');

      // Title bar Section 1
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 38, 182, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('IDENTITAS PASIEN & REGISTRASI', 18, 43);

      doc.setFont('helvetica', 'bold');
      doc.text(`NO RM: ${item.noRm}`, 192, 43, { align: 'right' });

      // Content Section 1
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('NAMA PASIEN:', 18, 50);
      doc.text('PENJAMIN / BAYAR:', 110, 50);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.namaPasien, 18, 55);
      doc.setFontSize(8.5);
      doc.text(`${item.jenisBayar} (SPRI: ${item.spri})`, 110, 55);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('POLIKLINIK ASAL:', 18, 62);
      doc.text('PENDAFTARAN / STATUS:', 110, 62);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.poli.toLowerCase().startsWith('poli') ? item.poli : `Poli ${item.poli}`, 18, 67);
      doc.text(`${item.pendaftaran} / ${item.pelayanan}`, 110, 67);

      // Section 2: Rincian Jadwal & Ruang Bedah
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, 80, 182, 44, 2, 2, 'FD');

      // Title bar Section 2
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 80, 182, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('RINCIAN JADWAL OPERASI & RUANG BEDAH', 18, 85);

      // Garis pemisah vertikal antar kolom agar simetris & seimbang
      doc.setDrawColor(226, 232, 240);
      doc.line(105, 87, 105, 124);

      // Kolom Kiri: RENCANA WAKTU OPERASI, DOKTER OPERATOR (DPJP)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('RENCANA WAKTU OPERASI:', 18, 93);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 93, 66);
      doc.text(`${item.rencanaOp} WIB`, 18, 98);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('DOKTER OPERATOR (DPJP):', 18, 108);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.dokterOperator, 18, 113);

      // Kolom Kanan: KAMAR RAWAT INAP & KELAS, DOKTER ANESTESI, KONTAK KELUARGA / WA
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('KAMAR RAWAT INAP & KELAS:', 110, 92);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.kamarRawatInap || 'Belum Ditentukan'} (${item.kelas})`, 110, 96.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('DOKTER ANESTESI:', 110, 104);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.dokterAnestesi || '-', 110, 108.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('KONTAK KELUARGA / WA:', 110, 116);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.noHp || '-'} (${item.hubungiPx})`, 110, 120.5);

      // Section 3: Instruksi Pre-Op
      doc.setFillColor(254, 252, 232);
      doc.setDrawColor(254, 240, 138);
      doc.roundedRect(14, 128, 182, 22, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(133, 77, 14);
      doc.text('INSTRUKSI PRE-OP & PERSIAPAN TINDAKAN:', 18, 133);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(69, 26, 3);
      const splitInstructions = doc.splitTextToSize(
        item.instruksiPreOp || 'Persiapan pre-operasi standar IBS. Pasien puasa minimal 6-8 jam sebelum jadwal tindakan bedah, verifikasi informed consent, dan kelengkapan berkas BPJS/SPRI.',
        174
      );
      doc.text(splitInstructions, 18, 138);

      // Section 4: Checklist Serah Terima Pre-Op
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, 154, 182, 26, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('CHECKLIST SERAH TERIMA PASIEN PRE-OPERASI (IBS):', 18, 159);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text('[   ] Informed Consent Bedah & Anestesi Lengkap', 18, 166);
      doc.text('[   ] Gelang Identitas Pasien Terpasang Sesuai', 110, 166);
      doc.text('[   ] Pemeriksaan Penunjang (Lab / Rontgen) Terlampir', 18, 173);
      doc.text('[   ] Status Puasa & Tanda Vital Pasien Terverifikasi', 110, 173);

      // Section 5: Lembar Tanda Tangan Serah Terima
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('Petugas Pengirim (Poli / Ruangan)', 55, 192, { align: 'center' });
      doc.text(`Babat, ${currentDate}`, 155, 188, { align: 'center' });
      doc.text('Petugas Penerima (Kamar Bedah / IBS)', 155, 192, { align: 'center' });

      doc.line(30, 218, 80, 218);
      doc.text('( .................................................. )', 55, 222, { align: 'center' });

      doc.line(130, 218, 180, 218);
      doc.text('( .................................................. )', 155, 222, { align: 'center' });

      const safeName = item.namaPasien.replace(/[^a-zA-Z0-9]/g, '_');
      const safeRm = item.noRm.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Kartu_PreOp_${safeRm}_${safeName}.pdf`);
      showToast('Berhasil mengunduh Kartu Pre-Op Pasien (PDF).');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast('Gagal membuat file PDF. Silakan gunakan tombol Cetak Kartu.');
    }
  };

  // Print function (Kartu Tanda Pasien Pre-Op) with Fail-Safe Fallbacks
  const handlePrintCard = () => {
    if (!detailItem) return;
    showToast('Membuka dialog cetak kartu...');
    try {
      window.print();
    } catch (err) {
      console.warn('window.print failed, downloading PDF fallback:', err);
      handleDownloadPdfCard(detailItem);
    }
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPasien.trim() || !formData.noRm.trim() || !formData.tindakanBedah.trim()) {
      showToast('Mohon lengkapi Nama Pasien, No RM, dan Tindakan Bedah.');
      return;
    }

    const payload: Omit<ElectiveSurgerySchedule, 'id' | 'no'> = {
      ...formData,
      rencanaOp: formatToDisplayDatetime(formData.rencanaOp)
    };

    if (editingItem) {
      onUpdateSchedule(editingItem.id, payload);
      showToast(`Jadwal operasi untuk ${formData.namaPasien} berhasil diperbarui.`);
      if (detailItem && detailItem.id === editingItem.id) {
        setDetailItem({ ...editingItem, ...payload });
      }
    } else {
      onAddSchedule(payload);
      showToast(`Jadwal operasi baru untuk ${formData.namaPasien} berhasil ditambahkan.`);
      // Clear filters so the newly added item is immediately visible
      setSearchTerm('');
      setSelectedDateFilter('');
      setStatusFilter('all');
    }

    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const openEditModal = (item: ElectiveSurgerySchedule) => {
    setEditingItem(item);
    setFormData({
      tglPoli: item.tglPoli,
      noRm: item.noRm,
      namaPasien: item.namaPasien,
      poli: item.poli,
      dokterOperator: item.dokterOperator,
      dokterAnestesi: item.dokterAnestesi || '',
      spri: item.spri,
      jenisBayar: item.jenisBayar,
      rencanaOp: formatToIsoDatetime(item.rencanaOp),
      tindakanBedah: item.tindakanBedah,
      noHp: item.noHp,
      pendaftaran: item.pendaftaran,
      hubungiPx: item.hubungiPx,
      pelayanan: item.pelayanan,
      instruksiPreOp: item.instruksiPreOp,
      kelas: item.kelas,
      rencanaKamarOk: item.rencanaKamarOk || 'OK 1 (Major)',
      kamarRawatInap: item.kamarRawatInap || ''
    });
    setIsAddModalOpen(true);
  };

  const handleQuickStatusChange = (id: string, newStatus: ElectiveSurgerySchedule['pelayanan']) => {
    onUpdateSchedule(id, { pelayanan: newStatus });
    showToast(`Status pelayanan diperbarui ke ${newStatus}.`);
    if (detailItem && detailItem.id === id) {
      setDetailItem({ ...detailItem, pelayanan: newStatus });
    }
  };

  const handleQuickHubungiChange = (id: string, newHubungi: ElectiveSurgerySchedule['hubungiPx']) => {
    onUpdateSchedule(id, { hubungiPx: newHubungi });
    showToast(`Status hubungi diperbarui ke "${newHubungi}".`);
    if (detailItem && detailItem.id === id) {
      setDetailItem({ ...detailItem, hubungiPx: newHubungi });
    }
  };

  return (
    <div className="space-y-5">
      {/* Konten Utama Jadwal Operasi (Disembunyikan saat mencetak Kartu Pre-Op Pasien) */}
      <div className={`space-y-5 ${detailItem ? 'print:hidden no-print' : ''}`}>
        {/* Header Atas & Aksi */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#005d42] text-white shadow-xs">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              SCHEDULING OPERASI ELEKTIF
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Penjadwalan Kamar Operasi (IBS) & Verifikasi SPRI BPJS RSUMB
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              requestAdminAction(() => {
                setEditingItem(null);
                setFormData({
                  tglPoli: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                  noRm: `RM-${Math.floor(100000 + Math.random() * 900000)}`,
                  namaPasien: '',
                  poli: 'Bedah',
                  dokterOperator: 'dr. Rieski Widhanar, Sp. B',
                  dokterAnestesi: '',
                  spri: 'Sudah',
                  jenisBayar: 'BPJS Kesehatan',
                  rencanaOp: getDefaultIsoDatetime(),
                  tindakanBedah: '',
                  noHp: '08',
                  pendaftaran: 'Online',
                  hubungiPx: 'Belum Dihubungi',
                  pelayanan: 'Terjadwal',
                  instruksiPreOp: 'Puasa mulai 6 jam pre-op, sedia darah jika diperlukan',
                  kelas: 'Kelas 3',
                  rencanaKamarOk: 'OK 1 (Major)',
                  kamarRawatInap: ''
                });
                setIsAddModalOpen(true);
              }, 'Tambah Jadwal Operasi Elektif');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#005d42] hover:bg-[#004a35] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Jadwal OP</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Cetak Jadwal Operasi (PDF / Printer)"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>

          {/* Dropdown Menu Ekspor Data: Excel (.xlsx) & PDF (.pdf) */}
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 print:hidden no-print">
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Jadwal OP
          </span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{stats.total} Pasien</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">
            Hadir
          </span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{stats.hadir} Pasien</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block">
            Terjadwal
          </span>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{stats.terjadwal} Pasien</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-sky-700 uppercase tracking-wider block">
            Reschedule
          </span>
          <div className="text-lg font-bold text-sky-700 mt-0.5">{stats.reschedule} Pasien</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-rose-700 uppercase tracking-wider block">
            Batal
          </span>
          <div className="text-lg font-bold text-rose-700 mt-0.5">{stats.batal} Pasien</div>
        </div>
      </div>

      {/* Filter Cepat Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs print:hidden no-print">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-grow max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Nama Pasien, No. RM, Dokter DPJP, Poliklinik..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Pelayanan */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Terjadwal">Terjadwal</option>
                <option value="Reschedule">Reschedule</option>
                <option value="Batal">Batal</option>
              </select>
            </div>

            {/* Status Hubungi Pasien Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Hubungi:</span>
              <select
                value={hubungiFilter}
                onChange={(e) => setHubungiFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Hubungi</option>
                <option value="Belum Dihubungi">Belum Dihubungi</option>
                <option value="Sudah Dihubungi">Sudah Dihubungi</option>
                <option value="Belum Dikonfirmasi">Belum Dikonfirmasi</option>
                <option value="Tidak Merespon">Tidak Merespon</option>
              </select>
            </div>

            {/* Tanggal Rencana OP Datepicker */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Tgl OP:</span>
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
              />
              {selectedDateFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('')}
                  className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                  title="Reset Tanggal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action saat filter Tanggal Operasi aktif */}
            {selectedDateFilter && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-xl shadow-2xs animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => {
                    const groupMatch = groupedSurgeries.find((g) => g.date === selectedDateFilter);
                    const items = groupMatch ? groupMatch.items : sortedFilteredList;
                    handleDownloadDateGroupPdf(selectedDateFilter, selectedDateFilter, items);
                  }}
                  disabled={sortedFilteredList.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title={`Unduh PDF Jadwal Operasi ${selectedDateFilter}`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Unduh PDF List</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const groupMatch = groupedSurgeries.find((g) => g.date === selectedDateFilter);
                    const items = groupMatch ? groupMatch.items : sortedFilteredList;
                    handleCopyDateGroupWa(selectedDateFilter, selectedDateFilter, items);
                  }}
                  disabled={sortedFilteredList.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title={`Salin Broadcast WhatsApp Pasien ${selectedDateFilter}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks WA</span>
                </button>
              </div>
            )}

            {/* Poli */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Poli:</span>
              <select
                value={selectedPoliFilter}
                onChange={(e) => setSelectedPoliFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Poli</option>
                {uniquePolis.map((poli) => (
                  <option key={poli} value={poli}>
                    {poli}
                  </option>
                ))}
              </select>
            </div>

            {(searchTerm || statusFilter !== 'all' || hubungiFilter !== 'all' || selectedDateFilter || selectedPoliFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setHubungiFilter('all');
                  setSelectedDateFilter('');
                  setSelectedPoliFilter('all');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline px-1 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabel 6 Kolom Multi-line Minimalis (Muat Dalam Satu Layar, Tanpa Horizontal Scrollbar) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Kop Cetak Resmi RSUMB (Khusus Tampil saat Print PDF / window.print) */}
        <div className="px-4 pt-4">
          <PrintHeaderKop
            title="SCHEDULING OPERASI ELEKTIF (IBS)"
            subtitle={`Penjadwalan Kamar Operasi & Verifikasi SPRI BPJS RSUMB ${
              statusFilter !== 'all' ? `| Status: ${statusFilter}` : ''
            }`}
            totalDataCount={filteredList.length}
            totalDataLabel={`Total: ${filteredList.length} Pasien Operasi`}
          />
        </div>

        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 border-l-4 border-l-transparent">
              <th className="py-3 px-3 text-center w-12">NO</th>
              <th className="py-3 px-4 w-[24%]">PASIEN</th>
              <th className="py-3 px-4 w-[24%]">POLI & DOKTER</th>
              <th className="py-3 px-4 w-[24%]">RENCANA OP</th>
              <th className="py-3 px-3 text-center w-[13%]">STATUS</th>
              <th className="py-3 px-4 text-right w-[15%] print:hidden no-print">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedSurgeries.map((group) => (
              <React.Fragment key={`group-section-${group.date}`}>
                {/* ========================================================= */}
                {/* Group Header Pembatas Tanggal Operasi                     */}
                {/* ========================================================= */}
                <tr className="bg-emerald-50 border-y border-emerald-200 text-emerald-950 select-none">
                  <td colSpan={6} className="px-3 py-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Kiri: Ikon kalender dan Tanggal Operasi lengkap */}
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950">
                        <span className="text-sm leading-none">📅</span>
                        <span>Pelaksanaan: {formatIndonesianSurgeryDate(group.date)}</span>
                      </div>

                      {/* Kanan: Badge jumlah total pasien operasi pada hari tersebut & Tombol Aksi Cepat */}
                      <div className="flex items-center flex-wrap gap-1.5 print:hidden no-print">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                          <span className="text-[11px] leading-none">👥</span>
                          <span>Total: {group.items.length} Pasien</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDownloadDateGroupPdf(group.date, group.rawDate, group.items)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          title={`Unduh PDF Daftar Pasien Operasi ${formatIndonesianSurgeryDate(group.date)}`}
                        >
                          <FileText className="w-3 h-3 text-emerald-700" />
                          <span>Unduh PDF List</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyDateGroupWa(group.date, group.rawDate, group.items)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
                          title={`Salin Format Broadcast WhatsApp Pasien ${formatIndonesianSurgeryDate(group.date)}`}
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin Teks WA</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* ========================================================= */}
                {/* Baris Pasien Dalam Kelompok Tanggal Tersebut              */}
                {/* ========================================================= */}
                {group.items.map((item, itemIdx) => {
                  // Soft highlighting background row according to user specification
                  let rowStyle = 'bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent';
                  if (item.pelayanan === 'Hadir') {
                    rowStyle = 'bg-emerald-50/70 hover:bg-emerald-100/50 border-l-4 border-l-emerald-500';
                  } else if (item.pelayanan === 'Reschedule') {
                    rowStyle = 'bg-sky-50/70 hover:bg-sky-100/50 border-l-4 border-l-sky-500';
                  } else if (item.pelayanan === 'Batal') {
                    rowStyle = 'bg-rose-50/70 hover:bg-rose-100/50 border-l-4 border-l-rose-500';
                  }

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors border-b border-slate-100 ${rowStyle}`}
                    >
                      {/* Kolom 1 (NO): Nomor urut antrean/pelaksanaan hari ini */}
                      <td className="py-2 px-3 text-center text-xs font-semibold text-slate-400">
                        {itemIdx + 1}
                      </td>

                  {/* Kolom 2 (PASIEN): Nama Pasien (Bold, 13px) di baris atas, No RM • Kelas • Kamar • Status Hubungi di sub-row horizontal */}
                  <td className="py-2 px-3">
                    <div className="text-[13px] font-bold text-slate-900 leading-tight">
                      {item.namaPasien}
                    </div>
                    <div className="text-xs font-normal font-mono text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap leading-tight">
                      <span>{item.noRm}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-sans font-medium">{item.kelas}</span>
                      {item.kamarRawatInap && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-700 bg-slate-100 px-1 py-0.2 rounded text-[11px]">
                            {item.kamarRawatInap}
                          </span>
                        </>
                      )}
                      <span className="text-slate-300">•</span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10.5px] font-bold ${getHubungiPxBadgeStyle(
                          item.hubungiPx
                        )}`}
                        title="Status Hubungi Pasien"
                      >
                        {item.hubungiPx}
                      </span>
                    </div>
                  </td>

                  {/* Kolom 3 (POLI & DOKTER): Nama Dokter Operator di baris atas, dan Poliklinik / Anestesi di baris bawah */}
                  <td className="py-2 px-3">
                    <div className="text-[12.5px] font-semibold text-slate-800 leading-tight">
                      {item.dokterOperator}
                    </div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span className="font-medium text-slate-600">{item.poli}</span>
                      {item.dokterAnestesi && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 truncate max-w-[140px]" title={item.dokterAnestesi}>
                            Anestesi: {item.dokterAnestesi.replace('dr. ', '')}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Kolom 4 (RENCANA OP): Tanggal & Jam OP di baris atas, dan Jenis Tindakan Bedah di baris bawah */}
                  <td className="py-2 px-3">
                    <div className="text-[12.5px] font-bold text-slate-900 flex items-center gap-1 leading-tight">
                      <Clock className="w-3 h-3 text-[#005d42]" />
                      <span>{item.rencanaOp} WIB</span>
                    </div>
                    <div className="text-[11.5px] font-medium text-[#005d42] mt-0.5 leading-tight">
                      {item.tindakanBedah}
                    </div>
                  </td>

                  {/* Kolom 5 (STATUS): Badge SPRI & Jenis Bayar secara berdampingan (Horizontal Side-by-Side) */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-tight ${
                          item.spri === 'Sudah'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        SPRI: {item.spri}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${getJenisBayarBadgeStyle(
                          item.jenisBayar
                        )}`}
                      >
                        {item.jenisBayar}
                      </span>
                    </div>
                  </td>

                  {/* Kolom 6 (AKSI): Tombol aksi ringkas */}
                  <td className="py-2 px-3 text-right print:hidden no-print">
                    <div className="flex items-center justify-end gap-1">
                      {/* Status Pelayanan Quick Selector */}
                      <select
                        value={item.pelayanan}
                        onChange={(e) =>
                          handleQuickStatusChange(item.id, e.target.value as ElectiveSurgerySchedule['pelayanan'])
                        }
                        className={`text-[11px] font-bold py-1 px-1.5 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
                          item.pelayanan === 'Hadir'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : item.pelayanan === 'Reschedule'
                            ? 'bg-sky-100 text-sky-800 border-sky-300'
                            : item.pelayanan === 'Batal'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title="Ubah Status Pelayanan"
                      >
                        <option value="Hadir">Hadir</option>
                        <option value="Terjadwal">Terjadwal</option>
                        <option value="Reschedule">Reschedule</option>
                        <option value="Batal">Batal</option>
                      </select>

                      {/* Tombol Detail Minimalis */}
                      <button
                        onClick={() => setDetailItem(item)}
                        className="p-1.5 rounded-md text-slate-600 hover:text-[#005d42] hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors"
                        title="Buka Detail Info Lengkap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          requestAdminAction(() => {
                            openEditModal(item);
                          }, 'Edit Jadwal Operasi Elektif');
                        }}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                        title="Edit Data Jadwal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestAdminAction(() => {
                            setItemToDelete(item);
                          }, 'Hapus Jadwal Operasi Elektif');
                        }}
                        className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        title="Hapus Jadwal Pasien"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {filteredList.length === 0 && (
          <div className="p-8 text-center bg-white">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Tidak ditemukan jadwal operasi yang sesuai dengan filter atau kata kunci "{searchTerm}".
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSelectedDateFilter('');
                setSelectedPoliFilter('all');
              }}
              className="mt-3 px-4 py-1.5 text-xs font-bold text-[#005d42] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Reset Filter Pencarian
            </button>
          </div>
        )}

        {/* Kolom Tanda Tangan / Verifikasi Petugas IBS (Khusus Tampil saat Print) */}
        <div className="px-6 pb-6">
          <PrintSignatureBlock signTitle="Kepala Instalasi Bedah Sentral (IBS) / Petugas SIMRS" />
        </div>
      </div>
      </div>

      {/* Modal Detail Info Lengkap (No HP, Puasa Pre-Op, Kamar OK, dll.) */}
      {detailItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4 print:hidden no-print overflow-hidden">
          <div className="relative z-[100000] bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[85vh] my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#005d42] border border-emerald-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Detail Scheduling Operasi Pasien
                  </h3>
                  <p className="text-xs text-slate-500">
                    Informasi lengkap persiapan kamar operasi & kontak pasien
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto max-h-[75vh]">
              {/* Pasien & Status Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-[#005d42] font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                    {detailItem.noRm}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {detailItem.namaPasien}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Poli: <span className="font-semibold text-slate-700">{detailItem.poli}</span> | Pendaftaran:{' '}
                    <span className="font-semibold text-slate-700">{detailItem.pendaftaran}</span>
                  </p>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      detailItem.pelayanan === 'Hadir'
                        ? 'bg-emerald-600 text-white'
                        : detailItem.pelayanan === 'Reschedule'
                        ? 'bg-sky-600 text-white'
                        : detailItem.pelayanan === 'Batal'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-600 text-white'
                    }`}
                  >
                    Status: {detailItem.pelayanan}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded ${getJenisBayarBadgeStyle(detailItem.jenisBayar)}`}>
                      {detailItem.jenisBayar}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        detailItem.spri === 'Sudah' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      SPRI: {detailItem.spri}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Operasi Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Rencana Waktu Operasi
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#005d42]" />
                    <span>{detailItem.rencanaOp} WIB</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40">
                  <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">
                    Rencana Kamar Rawat Inap
                  </span>
                  <div className="font-bold text-[#005d42] mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#005d42] shrink-0" />
                    <span>{detailItem.kamarRawatInap || 'Belum Ditentukan'}</span>
                    <span className="text-slate-500 font-normal text-xs">({detailItem.kelas})</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Poliklinik Asal
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#005d42] shrink-0" />
                    <span>
                      {detailItem.poli
                        ? detailItem.poli.toLowerCase().startsWith('poli')
                          ? detailItem.poli
                          : `Poli ${detailItem.poli}`
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Dokter Operator (DPJP)
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.dokterOperator}</div>
                </div>
              </div>

              {/* Kontak Pasien & WhatsApp */}
              <div className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Nomor HP / Kontak Pasien & Keluarga
                  </span>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>{detailItem.noHp || 'Tidak ada nomor'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Status Hubungi:</span>
                    <select
                      value={detailItem.hubungiPx}
                      onChange={(e) =>
                        handleQuickHubungiChange(detailItem.id, e.target.value as ElectiveSurgerySchedule['hubungiPx'])
                      }
                      className={`text-[11px] font-bold py-0.5 px-2 rounded-lg border focus:outline-none cursor-pointer transition-colors ${getHubungiPxBadgeStyle(
                        detailItem.hubungiPx
                      )}`}
                    >
                      <option value="Belum Dihubungi">Belum Dihubungi</option>
                      <option value="Sudah Dihubungi">Sudah Dihubungi</option>
                      <option value="Belum Dikonfirmasi">Belum Dikonfirmasi</option>
                      <option value="Tidak Merespon">Tidak Merespon</option>
                    </select>
                  </div>
                </div>

                {detailItem.noHp && (
                  <a
                    href={`https://wa.me/${detailItem.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0"
                  >
                    <span>Hubungi WA</span>
                  </a>
                )}
              </div>

              {/* Instruksi Pre-Op (Puasa, Darah, dll) */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">
                  Instruksi Pre-Op & Persiapan
                </span>
                <p className="text-xs text-amber-950 font-medium mt-1 leading-relaxed">
                  {detailItem.instruksiPreOp || 'Belum ada instruksi khusus.'}
                </p>
              </div>

              {/* Keterangan Batal/Reschedule jika ada */}
              {detailItem.keteranganBatalReschedule && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-800 uppercase block">
                    Keterangan Batal / Reschedule
                  </span>
                  <p className="text-xs text-rose-950 mt-1 italic">
                    {detailItem.keteranganBatalReschedule}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = detailItem;
                    setDetailItem(null);
                    openEditModal(item);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCard}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#005d42] hover:bg-[#004833] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer"
                  title="Cetak Kartu Tanda Pasien Pre-Op (Dialog Cetak Browser)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kartu</span>
                </button>

                <button
                  type="button"
                  onClick={() => detailItem && handleDownloadPdfCard(detailItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#005d42] border border-emerald-300/80 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-98 cursor-pointer"
                  title="Unduh Lembar Kartu Pre-Op Format PDF Resmi"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STANDALONE PRINT VIEW: KARTU TANDA PASIEN PRE-OPERASI (PRE-OP)            */}
      {/* Khusus diformat bersih & dicetak saat window.print() dijalankan           */}
      {/* ========================================================================= */}
      {detailItem && (
        <div className="print-card-container w-full text-slate-900 bg-white p-6 font-sans">
          {/* KOP RESMI RUMAH SAKIT */}
          <div className="text-center pb-2.5 border-b-2 border-slate-900">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              RSU MUHAMMADIYAH BABAT
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur | Telp. (0322) 451111 / 451234
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-100 border border-slate-400 rounded font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
              KARTU TANDA PASIEN PRE-OPERASI (PRE-OP)
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              INSTALASI BEDAH SENTRAL (IBS) & PENJADWALAN OPERASI ELEKTIF
            </p>
          </div>

          {/* BLOK 1: IDENTITAS PASIEN & REGISTRASI */}
          <div className="mt-4 border border-slate-400 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-400 flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                Identitas Pasien & Registrasi
              </span>
              <span className="font-mono font-bold text-xs bg-white px-2.5 py-0.5 border border-slate-300 rounded">
                NO RM: {detailItem.noRm}
              </span>
            </div>

            <div className="p-3 grid grid-cols-2 gap-y-2.5 gap-x-6 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Nama Pasien</span>
                <span className="font-bold text-sm text-slate-900">{detailItem.namaPasien}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Penjamin / Jenis Bayar</span>
                <span className="font-bold text-slate-900">
                  {detailItem.jenisBayar} (SPRI: {detailItem.spri})
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Poliklinik Asal</span>
                <span className="font-semibold text-slate-900">
                  {detailItem.poli ? (detailItem.poli.toLowerCase().startsWith('poli') ? detailItem.poli : `Poli ${detailItem.poli}`) : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pendaftaran & Status</span>
                <span className="font-semibold text-slate-900">{detailItem.pendaftaran} / {detailItem.pelayanan}</span>
              </div>
            </div>
          </div>

          {/* BLOK 2: RINCIAN JADWAL OPERASI & RUANG BEDAH */}
          <div className="mt-3.5 border border-slate-400 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-400 flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                Rincian Jadwal Operasi & Ruang Bedah
              </span>
            </div>

            <div className="p-3.5 grid grid-cols-2 gap-x-8 text-[11px] divide-x divide-slate-200">
              {/* Kolom Kiri: RENCANA WAKTU OPERASI, DOKTER OPERATOR (DPJP) */}
              <div className="space-y-3.5 pr-4">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Rencana Waktu Operasi</span>
                  <span className="font-bold text-sm text-[#005d42]">{detailItem.rencanaOp} WIB</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Dokter Operator (DPJP)</span>
                  <span className="font-bold text-slate-900">{detailItem.dokterOperator}</span>
                </div>
              </div>

              {/* Kolom Kanan: KAMAR RAWAT INAP & KELAS, DOKTER ANESTESI, KONTAK KELUARGA / WA */}
              <div className="space-y-2.5 pl-6">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Kamar Rawat Inap & Kelas</span>
                  <span className="font-bold text-slate-900">
                    {detailItem.kamarRawatInap || 'Belum Ditentukan'} ({detailItem.kelas})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Dokter Anestesi</span>
                  <span className="font-semibold text-slate-900">{detailItem.dokterAnestesi || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Kontak Keluarga / WA</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-slate-900">{detailItem.noHp || '-'}</span>
                    <span className={`inline-flex items-center px-2 py-0.2 rounded text-[10px] font-bold border ${getHubungiPxBadgeStyle(detailItem.hubungiPx)}`}>
                      {detailItem.hubungiPx}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* INSTRUKSI PRE-OP */}
          <div className="mt-3.5 border border-slate-400 rounded-lg p-3 text-[11px]">
            <span className="font-bold uppercase tracking-wider text-slate-800 block mb-1">
              Instruksi Pre-Op & Persiapan Tindakan:
            </span>
            <p className="text-slate-800 leading-relaxed">
              {detailItem.instruksiPreOp || 'Persiapan pre-operasi standar IBS. Pasien puasa minimal 6-8 jam sebelum jadwal tindakan bedah, verifikasi surat izin tindakan medis (informed consent), dan konfirmasi kelengkapan berkas BPJS/SPRI.'}
            </p>
          </div>

          {detailItem.keteranganBatalReschedule && (
            <div className="mt-3 border border-slate-400 rounded-lg p-3 text-[11px]">
              <span className="font-bold uppercase tracking-wider text-slate-800 block mb-1">
                Catatan Batal / Reschedule:
              </span>
              <p className="text-slate-800 italic">{detailItem.keteranganBatalReschedule}</p>
            </div>
          )}

          {/* CHECKLIST SERAH TERIMA PRE-OP */}
          <div className="mt-3.5 border border-slate-300 rounded-lg p-3 text-[11px]">
            <span className="font-bold uppercase text-[10px] text-slate-800 block mb-1.5">
              Checklist Serah Terima Pasien Pre-Operasi (IBS):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>[ &nbsp; ] Informed Consent Bedah & Anestesi Lengkap</div>
              <div>[ &nbsp; ] Gelang Identitas Pasien Terpasang Sesuai</div>
              <div>[ &nbsp; ] Pemeriksaan Penunjang (Lab / Rontgen) Terlampir</div>
              <div>[ &nbsp; ] Status Puasa & Tanda Vital Terverifikasi</div>
            </div>
          </div>

          {/* LEMBAR SERAH TERIMA & TANDA TANGAN */}
          <div className="mt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-600 text-[11px]">Petugas Pengirim (Poli / Ruangan)</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[160px]">
                ( .................................................. )
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-[11px]">
                Babat, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-slate-600 font-semibold text-[11px]">Petugas Penerima (Kamar Bedah / IBS)</p>
              <div className="h-14"></div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[160px]">
                ( .................................................. )
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Jadwal OP */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4 print:hidden no-print overflow-hidden">
          <div className="relative z-[100000] bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingItem ? 'Edit Jadwal Operasi Elektif' : '+ Tambah Jadwal Operasi Elektif'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input data lengkap pasien dan persiapan kamar operasi (IBS)
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pasien *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaPasien}
                    onChange={(e) => setFormData({ ...formData, namaPasien: e.target.value })}
                    placeholder="Contoh: Tn. Bambang Sutrisno"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor RM *</label>
                  <input
                    type="text"
                    required
                    value={formData.noRm}
                    onChange={(e) => setFormData({ ...formData, noRm: e.target.value })}
                    placeholder="RM-482019"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Poliklinik Asal</label>
                  <select
                    value={formData.poli}
                    onChange={(e) => {
                      const newPoli = e.target.value;
                      const firstDocInPoli = MASTER_SURGEONS.find((d) => d.poli === newPoli);
                      setFormData((prev) => ({
                        ...prev,
                        poli: newPoli,
                        ...(firstDocInPoli ? { dokterOperator: firstDocInPoli.nama } : {})
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm bg-white cursor-pointer"
                  >
                    <option value="Bedah">Bedah</option>
                    <option value="Obgyn">Obgyn</option>
                    <option value="Mata">Mata</option>
                    <option value="Ortopedi">Ortopedi</option>
                    <option value="THT">THT</option>
                    <option value="Urologi">Urologi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dokter Operator (DPJP) *</label>
                  <select
                    required
                    value={formData.dokterOperator}
                    onChange={(e) => {
                      const selectedDoctor = e.target.value;
                      const matched = MASTER_SURGEONS.find((d) => d.nama === selectedDoctor);
                      setFormData((prev) => ({
                        ...prev,
                        dokterOperator: selectedDoctor,
                        ...(matched ? { poli: matched.poli } : {})
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm bg-white font-medium cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Dokter Operator (DPJP) --</option>
                    {formData.dokterOperator && !MASTER_SURGEONS.some((d) => d.nama === formData.dokterOperator) && (
                      <option value={formData.dokterOperator}>{formData.dokterOperator} (Kustom)</option>
                    )}
                    {MASTER_SURGEONS.map((doc) => (
                      <option key={doc.nama} value={doc.nama}>
                        {doc.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tindakan Bedah *</label>
                  <input
                    type="text"
                    required
                    value={formData.tindakanBedah}
                    onChange={(e) => setFormData({ ...formData, tindakanBedah: e.target.value })}
                    placeholder="Contoh: Laparoscopic Cholecystectomy"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rencana OP (Tgl & Jam) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.rencanaOp}
                    onChange={(e) => setFormData({ ...formData, rencanaOp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm font-medium bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Pilih tanggal dan jam rencana operasi langsung dari pemilih waktu kalender
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status SPRI BPJS</label>
                  <select
                    value={formData.spri}
                    onChange={(e) => setFormData({ ...formData, spri: e.target.value as 'Sudah' | 'Belum' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  >
                    <option value="Sudah">Sudah Terbit</option>
                    <option value="Belum">Belum Terbit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Bayar</label>
                  <select
                    value={formData.jenisBayar}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenisBayar: e.target.value as ElectiveSurgerySchedule['jenisBayar']
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  >
                    <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                    <option value="Umum / Pribadi">Umum / Pribadi</option>
                    <option value="Asuransi Swasta">Asuransi Swasta</option>
                    <option value="Jasa Raharja">Jasa Raharja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Pelayanan</label>
                  <select
                    value={formData.pelayanan}
                    onChange={(e) =>
                      setFormData({ ...formData, pelayanan: e.target.value as ElectiveSurgerySchedule['pelayanan'] })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  >
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Reschedule">Reschedule</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Rawat</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value as ElectiveSurgerySchedule['kelas'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  >
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Kamar Rawat Inap</label>
                  <input
                    type="text"
                    value={formData.kamarRawatInap || ''}
                    onChange={(e) => setFormData({ ...formData, kamarRawatInap: e.target.value })}
                    placeholder="Contoh: Ruang Flamboyan / Kamar 3B"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No HP Pasien / Keluarga</label>
                  <input
                    type="text"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Hubungi Pasien</label>
                  <select
                    value={formData.hubungiPx}
                    onChange={(e) =>
                      setFormData({ ...formData, hubungiPx: e.target.value as ElectiveSurgerySchedule['hubungiPx'] })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                  >
                    <option value="Belum Dihubungi">Belum Dihubungi</option>
                    <option value="Sudah Dihubungi">Sudah Dihubungi</option>
                    <option value="Belum Dikonfirmasi">Belum Dikonfirmasi</option>
                    <option value="Tidak Merespon">Tidak Merespon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi Pre-Op (Puasa, Darah, dll)</label>
                <textarea
                  rows={2}
                  value={formData.instruksiPreOp}
                  onChange={(e) => setFormData({ ...formData, instruksiPreOp: e.target.value })}
                  placeholder="Contoh: Puasa mulai jam 02.00 WIB, sedia darah PRC 2 kolf, cukur area op"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] text-xs sm:text-sm"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005d42] hover:bg-[#004a35] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Jadwal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4 print:hidden no-print overflow-hidden">
          <div className="relative z-[100000] bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Konfirmasi Hapus Jadwal
              </h3>
              <p className="text-sm text-slate-700 mb-4 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus jadwal pasien ini?
              </p>
              
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-600 mb-6 border border-slate-200 text-left space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-800">Nama Pasien:</span>{' '}
                  <span className="font-bold text-slate-900">{itemToDelete.namaPasien}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">No. RM:</span> {itemToDelete.noRm}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Tindakan:</span> {itemToDelete.tindakanBedah}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Waktu Operasi:</span> {itemToDelete.rencanaOp}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const patientName = itemToDelete.namaPasien;
                    onDeleteSchedule(itemToDelete.id);
                    if (detailItem && detailItem.id === itemToDelete.id) {
                      setDetailItem(null);
                    }
                    setItemToDelete(null);
                    showToast(`Jadwal operasi pasien ${patientName} berhasil dihapus.`);
                  }}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                >
                  Ya, Hapus Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
