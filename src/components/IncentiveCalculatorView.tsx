import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Coins,
  FileSpreadsheet,
  FileText,
  Printer,
  Upload,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Info,
  Layers,
  ArrowUpDown,
  FileUp,
  RefreshCw,
  Eye,
  ReceiptText,
  AlertTriangle,
  X,
  Archive,
  Lock,
  Unlock,
  History,
  Check,
  RotateCcw,
  ShieldCheck,
  FolderClock,
  ExternalLink
} from 'lucide-react';
import {
  MonthlyScheduleData,
  StaffScheduleRow,
  StaffCalculatedSummary,
  IncentiveRates,
  MonthlyArchiveRecord,
  ArchiveIndexItem
} from '../types/incentiveTypes';
import {
  DEFAULT_INCENTIVE_RATES,
  INDONESIAN_DAY_NAMES,
  MONTH_NAMES_ID,
  createDefaultSchedule,
  createBlankSchedule,
  calculateStaffIncentive,
  calculateDepartmentTotals,
  loadSavedSchedule,
  saveScheduleToStorage,
  loadSavedRates,
  saveRatesToStorage,
  getDayOfWeek,
  getDaysInMonth,
  loadMonthlyArchive,
  saveMonthlyArchive,
  getAllMonthlyArchives,
  deleteMonthlyArchive,
  setArchiveLockStatus,
  seedDefaultAugustArchiveIfMissing,
  saveScheduleDraft,
  loadScheduleDraft,
  getArchiveStorageKey
} from '../data/incentiveData';
import {
  exportIncentiveToExcel,
  exportIncentiveToPdf,
  formatRupiah
} from '../utils/incentiveExport';
import {
  parseExcelSchedule,
  parseCsvSchedule,
  extractScheduleFromImage,
  normalizeShiftCode
} from '../utils/scheduleParser';
import { IncentiveSettingsModal } from './IncentiveSettingsModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';

interface IncentiveCalculatorViewProps {
  showToast?: (msg: string) => void;
}

export const IncentiveCalculatorView: React.FC<IncentiveCalculatorViewProps> = ({
  showToast = (msg: string) => console.log(msg)
}) => {
  // Pastikan arsip resmi Agustus 2026 selalu ter-seed jika belum ada
  useEffect(() => {
    seedDefaultAugustArchiveIfMissing();
  }, []);

  // State data jadwal dinas bulanan & tarif
  const [monthData, setMonthData] = useState<MonthlyScheduleData>(() => {
    // Cek apakah ada arsip September 2026 terlebih dahulu
    const sepArchive = loadMonthlyArchive(2026, 9);
    if (sepArchive && sepArchive.staffRows?.length > 0) {
      return {
        month: sepArchive.month,
        year: sepArchive.year,
        monthName: sepArchive.monthName,
        daysInMonth: sepArchive.daysInMonth,
        nationalHolidays: sepArchive.nationalHolidays || [],
        staffRows: sepArchive.staffRows
      };
    }
    return loadSavedSchedule();
  });
  const [rates, setRates] = useState<IncentiveRates>(() => loadSavedRates());

  // Status Kunci & Arsip Bulan Berjalan
  const [isCurrentMonthLocked, setIsCurrentMonthLocked] = useState<boolean>(() => {
    const arch = loadMonthlyArchive(2026, 9);
    return arch ? Boolean(arch.isLocked) : false;
  });
  const [currentArchive, setCurrentArchive] = useState<MonthlyArchiveRecord | null>(() => {
    return loadMonthlyArchive(2026, 9);
  });
  const [allArchives, setAllArchives] = useState<MonthlyArchiveRecord[]>(() => {
    return getAllMonthlyArchives();
  });
  const [archiveToDelete, setArchiveToDelete] = useState<MonthlyArchiveRecord | null>(null);

  // State UI
  const [viewMode, setViewMode] = useState<'summary' | 'matrix' | 'archive'>('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isThermalModalOpen, setIsThermalModalOpen] = useState(false);
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState<StaffCalculatedSummary | null>(null);

  // State Hapus Pegawai (Confirmation Modal)
  const [staffToDelete, setStaffToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // State tambah/edit pegawai
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Staf Pendaftaran');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // State upload file
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Muat ulang daftar arsip saat viewMode berpindah ke 'archive'
  useEffect(() => {
    if (viewMode === 'archive') {
      setAllArchives(getAllMonthlyArchives());
    }
  }, [viewMode]);

  // Sinkronisasi otomatis ke LocalStorage jika monthData berubah
  const handleUpdateMonthData = (newData: MonthlyScheduleData) => {
    setMonthData(newData);
    saveScheduleToStorage(newData);
    // Simpan juga draf bulanan
    saveScheduleDraft(newData);
  };

  // Simpan tarif
  const handleSaveRates = (newRates: IncentiveRates) => {
    setRates(newRates);
    saveRatesToStorage(newRates);
    showToast('Tarif insentif & jam kerja berhasil diperbarui.');
  };

  // Simpan tanggal merah
  const handleUpdateHolidays = (holidays: number[]) => {
    const updated = { ...monthData, nationalHolidays: holidays };
    handleUpdateMonthData(updated);
    showToast(`Tanggal merah berhasil disesuaikan (${holidays.length} hari libur nasional).`);
  };

  const safeStaffRows = useMemo(() => {
    return Array.isArray(monthData?.staffRows) ? monthData.staffRows : [];
  }, [monthData?.staffRows]);

  const safeNationalHolidays = useMemo(() => {
    return Array.isArray(monthData?.nationalHolidays) ? monthData.nationalHolidays : [];
  }, [monthData?.nationalHolidays]);

  // Hitung summary tiap staf
  const staffSummaries: StaffCalculatedSummary[] = useMemo(() => {
    return safeStaffRows.map((staff) =>
      calculateStaffIncentive(staff, monthData, rates)
    );
  }, [safeStaffRows, monthData, rates]);

  // Filter staf berdasarkan search
  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return staffSummaries;
    const q = searchTerm.toLowerCase();
    return staffSummaries.filter(
      (s) => (s.name || '').toLowerCase().includes(q) || (s.role && s.role.toLowerCase().includes(q))
    );
  }, [staffSummaries, searchTerm]);

  // Total Departemen Keseluruhan
  const departmentTotals = useMemo(() => {
    return calculateDepartmentTotals(staffSummaries);
  }, [staffSummaries]);

  // --------------------------------------------------------------------------
  // DYNAMIC MONTH & YEAR FILTER SWITCHING
  // --------------------------------------------------------------------------
  const handleSwitchPeriod = (targetYear: number, targetMonth: number) => {
    // 1. Simpan draf bulan yang sedang dibuka jika belum dikunci dan ada isinya
    if (!isCurrentMonthLocked && safeStaffRows.length > 0) {
      saveScheduleDraft(monthData);
    }

    // 2. Cek apakah ada arsip tersimpan resmi untuk periode target
    const savedArchive = loadMonthlyArchive(targetYear, targetMonth);
    if (savedArchive) {
      // Tampilkan data persis dari arsip tersimpan
      setMonthData({
        year: savedArchive.year,
        month: savedArchive.month,
        monthName: savedArchive.monthName,
        daysInMonth: savedArchive.daysInMonth || getDaysInMonth(targetYear, targetMonth),
        nationalHolidays: Array.isArray(savedArchive.nationalHolidays) ? savedArchive.nationalHolidays : [],
        staffRows: savedArchive.staffRows || []
      });
      if (savedArchive.ratesSnapshot) {
        setRates(savedArchive.ratesSnapshot);
      }
      setIsCurrentMonthLocked(Boolean(savedArchive.isLocked));
      setCurrentArchive(savedArchive);
      showToast(`Memuat arsip resmi ${savedArchive.monthName} ${savedArchive.year} (Tersimpan & Dikunci).`);
      return;
    }

    // 3. Jika bukan arsip resmi, cek apakah ada draf yang tersimpan
    const savedDraft = loadScheduleDraft(targetYear, targetMonth);
    if (savedDraft && Array.isArray(savedDraft.staffRows) && savedDraft.staffRows.length > 0) {
      setMonthData({
        ...savedDraft,
        daysInMonth: getDaysInMonth(targetYear, targetMonth),
        monthName: MONTH_NAMES_ID[targetMonth - 1]
      });
      setIsCurrentMonthLocked(false);
      setCurrentArchive(null);
      showToast(`Memuat draf kerja ${MONTH_NAMES_ID[targetMonth - 1]} ${targetYear}.`);
      return;
    }

    // 4. Jika tidak ada data sama sekali untuk bulan ini:
    // Inisialisasi workspace jadwal kosong/baru sesuai permintaan pengguna
    const blank = createBlankSchedule(targetYear, targetMonth);
    setMonthData(blank);
    setIsCurrentMonthLocked(false);
    setCurrentArchive(null);
    showToast(`Membuka ruang kerja jadwal baru ${blank.monthName} ${blank.year}.`);
  };

  const handleChangeMonth = (newMonth: number) => {
    handleSwitchPeriod(monthData.year, newMonth);
  };

  const handleChangeYear = (newYear: number) => {
    handleSwitchPeriod(newYear, monthData.month);
  };

  // Muat Template Standar RSUMB untuk bulan berjalan jika ruang kerja kosong
  const handleLoadTemplateForCurrentMonth = () => {
    const def = createDefaultSchedule(monthData.year, monthData.month);
    handleUpdateMonthData(def);
    showToast(`Template jadwal dinas 10 staf berhasil dimuat untuk ${monthData.monthName} ${monthData.year}.`);
  };

  // --------------------------------------------------------------------------
  // PERSISTENSI REKAPITULASI BULANAN & PENGUNCIAN
  // --------------------------------------------------------------------------
  const handleSaveCurrentMonthRecap = () => {
    if (safeStaffRows.length === 0) {
      showToast('Tidak ada data pegawai dalam rekapitulasi. Silakan unggah atau isi jadwal dinas terlebih dahulu.');
      return;
    }

    const key = getArchiveStorageKey(monthData.year, monthData.month);
    const now = new Date();
    const newArchive: MonthlyArchiveRecord = {
      id: key,
      month: monthData.month,
      year: monthData.year,
      monthName: monthData.monthName,
      savedAt: now.toISOString(),
      savedTimestamp: now.getTime(),
      savedBy: 'PJ Admisi & Kasir RSUMB',
      isLocked: true,
      notes: `Rekapitulasi insentif dinas malam & uang makan periode ${monthData.monthName} ${monthData.year} (Tersimpan & Terkunci).`,
      ratesSnapshot: rates,
      nationalHolidays: safeNationalHolidays,
      daysInMonth: monthData.daysInMonth,
      staffRows: safeStaffRows,
      staffSummaries,
      departmentTotals
    };

    saveMonthlyArchive(newArchive);
    setIsCurrentMonthLocked(true);
    setCurrentArchive(newArchive);
    setAllArchives(getAllMonthlyArchives());

    showToast(`✓ Rekapitulasi ${monthData.monthName} ${monthData.year} berhasil disimpan & dikunci ke database.`);
  };

  const handleToggleLockCurrentMonth = () => {
    const targetStatus = !isCurrentMonthLocked;
    setIsCurrentMonthLocked(targetStatus);
    setArchiveLockStatus(monthData.year, monthData.month, targetStatus);
    setAllArchives(getAllMonthlyArchives());

    if (targetStatus) {
      showToast(`Arsip ${monthData.monthName} ${monthData.year} telah dikunci kembali.`);
    } else {
      showToast(`Kunci arsip ${monthData.monthName} ${monthData.year} dibuka. Anda dapat mengedit atau menyesuaikan jadwal.`);
    }
  };

  // Handler Buka Arsip dari Riwayat
  const handleOpenArchivedRecord = (arch: MonthlyArchiveRecord) => {
    setMonthData({
      year: arch.year,
      month: arch.month,
      monthName: arch.monthName,
      daysInMonth: arch.daysInMonth || getDaysInMonth(arch.year, arch.month),
      nationalHolidays: Array.isArray(arch.nationalHolidays) ? arch.nationalHolidays : [],
      staffRows: arch.staffRows || []
    });
    if (arch.ratesSnapshot) {
      setRates(arch.ratesSnapshot);
    }
    setIsCurrentMonthLocked(Boolean(arch.isLocked));
    setCurrentArchive(arch);
    setViewMode('summary');
    showToast(`Membuka rekapitulasi ${arch.monthName} ${arch.year}.`);
  };

  // Handler Ekspor Arsip Spesifik ke Excel & PDF
  const handleExportArchiveExcel = async (arch: MonthlyArchiveRecord) => {
    try {
      const archMonthData: MonthlyScheduleData = {
        year: arch.year,
        month: arch.month,
        monthName: arch.monthName,
        daysInMonth: arch.daysInMonth,
        nationalHolidays: arch.nationalHolidays,
        staffRows: arch.staffRows
      };
      await exportIncentiveToExcel(archMonthData, arch.staffSummaries, arch.departmentTotals, arch.ratesSnapshot);
      showToast(`File Excel arsip ${arch.monthName} ${arch.year} berhasil diunduh.`);
    } catch (err: any) {
      showToast(`Gagal mengekspor Excel arsip: ${err.message}`);
    }
  };

  const handleExportArchivePdf = (arch: MonthlyArchiveRecord) => {
    try {
      const archMonthData: MonthlyScheduleData = {
        year: arch.year,
        month: arch.month,
        monthName: arch.monthName,
        daysInMonth: arch.daysInMonth,
        nationalHolidays: arch.nationalHolidays,
        staffRows: arch.staffRows
      };
      exportIncentiveToPdf(archMonthData, arch.staffSummaries, arch.departmentTotals, arch.ratesSnapshot);
      showToast(`File PDF arsip ${arch.monthName} ${arch.year} berhasil diunduh.`);
    } catch (err: any) {
      showToast(`Gagal mengekspor PDF arsip: ${err.message}`);
    }
  };

  const confirmDeleteArchive = () => {
    if (!archiveToDelete) return;
    deleteMonthlyArchive(archiveToDelete.id);
    setAllArchives(getAllMonthlyArchives());

    // Jika arsip yang dihapus adalah bulan yang sedang aktif
    if (archiveToDelete.year === monthData.year && archiveToDelete.month === monthData.month) {
      setIsCurrentMonthLocked(false);
      setCurrentArchive(null);
    }

    showToast(`Arsip ${archiveToDelete.monthName} ${archiveToDelete.year} berhasil dihapus.`);
    setArchiveToDelete(null);
  };

  // Handler update kode shift pada Matriks Harian
  const handleMatrixShiftChange = (staffId: string, day: number, newShift: string) => {
    if (isCurrentMonthLocked) {
      showToast('Rekapitulasi bulan ini telah dikunci. Buka kunci di tab Arsip jika ingin mengubah jadwal.');
      return;
    }
    const norm = normalizeShiftCode(newShift);
    const updatedStaffRows = safeStaffRows.map((st) => {
      if (st.id === staffId) {
        return {
          ...st,
          shifts: {
            ...(st.shifts || {}),
            [day]: norm
          }
        };
      }
      return st;
    });

    handleUpdateMonthData({
      ...monthData,
      staffRows: updatedStaffRows
    });
  };

  // Tambah / Edit Pegawai
  const handleSaveStaff = () => {
    if (isCurrentMonthLocked) {
      showToast('Rekapitulasi bulan ini telah dikunci. Buka kunci di tab Arsip jika ingin mengubah data pegawai.');
      return;
    }

    if (!newStaffName.trim()) {
      showToast('Nama pegawai tidak boleh kosong.');
      return;
    }

    if (editingStaffId) {
      // Edit nama
      const updated = safeStaffRows.map((st) =>
        st.id === editingStaffId ? { ...st, name: newStaffName.trim().toUpperCase(), role: newStaffRole } : st
      );
      handleUpdateMonthData({ ...monthData, staffRows: updated });
      showToast(`Data pegawai ${newStaffName} berhasil diperbarui.`);
    } else {
      // Tambah baru
      const defaultShifts: Record<number, string> = {};
      for (let d = 1; d <= monthData.daysInMonth; d++) {
        defaultShifts[d] = 'P';
      }
      const newStaff: StaffScheduleRow = {
        id: `staff-${Date.now()}`,
        name: newStaffName.trim().toUpperCase(),
        role: newStaffRole,
        shifts: defaultShifts
      };
      handleUpdateMonthData({
        ...monthData,
        staffRows: [...safeStaffRows, newStaff]
      });
      showToast(`Pegawai ${newStaff.name} berhasil ditambahkan ke jadwal.`);
    }

    setIsAddStaffModalOpen(false);
    setNewStaffName('');
    setNewStaffRole('Staf Pendaftaran');
    setEditingStaffId(null);
  };

  // Handler Hapus Pegawai (Memicu Confirmation Modal)
  const promptDeleteStaff = (id: string, name: string) => {
    if (isCurrentMonthLocked) {
      showToast('Rekapitulasi bulan ini telah dikunci. Buka kunci di tab Arsip jika ingin menghapus pegawai.');
      return;
    }
    setStaffToDelete({ id, name });
  };

  const confirmDeleteStaff = () => {
    if (!staffToDelete) return;
    const updated = safeStaffRows.filter((st) => st.id !== staffToDelete.id);
    handleUpdateMonthData({ ...monthData, staffRows: updated });
    showToast(`Pegawai ${staffToDelete.name} berhasil dihapus dari jadwal.`);
    setStaffToDelete(null);
  };

  // Reset ke Template Contoh Bawaan (Memicu Confirmation Modal)
  const promptResetToDefault = () => {
    if (isCurrentMonthLocked) {
      showToast('Rekapitulasi bulan ini telah dikunci. Buka kunci di tab Arsip terlebih dahulu.');
      return;
    }
    setIsResetConfirmOpen(true);
  };

  const confirmResetToDefault = () => {
    const def = createDefaultSchedule(monthData.year, monthData.month);
    handleUpdateMonthData(def);
    showToast('Contoh jadwal dinas pendaftaran berhasil dimuat ulang.');
    setIsResetConfirmOpen(false);
  };

  // Ekspor Excel
  const handleExportExcel = async () => {
    try {
      await exportIncentiveToExcel(monthData, staffSummaries, departmentTotals, rates);
      showToast('File Excel Rekapitulasi Insentif berhasil diunduh.');
    } catch (err: any) {
      showToast(`Gagal mengekspor Excel: ${err.message}`);
    }
  };

  // Ekspor PDF (Format Ringkas Finansial)
  const handleExportPdf = () => {
    try {
      exportIncentiveToPdf(monthData, staffSummaries, departmentTotals, rates);
      showToast('File PDF Rekapitulasi Insentif berhasil diunduh.');
    } catch (err: any) {
      showToast(`Gagal mengekspor PDF: ${err.message}`);
    }
  };

  // Handler Upload File (Excel, CSV, & Foto Jadwal dengan OCR Tesseract.js)
  const handleFileUpload = async (file: File) => {
    setIsProcessingUpload(true);
    setUploadStatusMsg(`Membaca file ${file.name}...`);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        const res = await parseExcelSchedule(file, monthData.year, monthData.month);
        if (res.success && res.staffRows.length > 0) {
          handleUpdateMonthData({
            ...monthData,
            staffRows: res.staffRows
          });
          showToast(res.message || 'Jadwal Excel berhasil diimpor!');
          setIsUploadModalOpen(false);
        } else {
          showToast(res.message || 'Gagal mengekstrak data dari Excel.');
        }
      } else if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const res = await parseCsvSchedule(text, monthData.year, monthData.month);
        if (res.success && res.staffRows.length > 0) {
          handleUpdateMonthData({
            ...monthData,
            staffRows: res.staffRows
          });
          showToast(res.message || 'Jadwal CSV berhasil diimpor!');
          setIsUploadModalOpen(false);
        } else {
          showToast(res.message || 'Gagal membaca CSV.');
        }
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        setUploadStatusMsg('Menginisialisasi Tesseract.js OCR untuk membaca foto jadwal...');
        const res = await extractScheduleFromImage(
          file,
          monthData.year,
          monthData.month,
          (pct, status) => {
            setUploadStatusMsg(status);
          }
        );
        if (res.success && res.staffRows.length > 0) {
          handleUpdateMonthData({
            ...monthData,
            staffRows: res.staffRows,
            nationalHolidays: res.detectedHolidays || monthData.nationalHolidays
          });
          showToast(res.message || `OCR berhasil mengekstrak ${res.staffRows.length} staf dari gambar!`);
          setIsUploadModalOpen(false);
        } else {
          showToast(res.message || 'Gagal mengenali struktur tabel pada foto jadwal dinas.');
        }
      } else {
        showToast('Format file tidak didukung. Harap gunakan file Excel (.xlsx/.xls), CSV, atau Foto Jadwal (.jpg/.png).');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast(`Terjadi kesalahan saat memproses file: ${err.message}`);
    } finally {
      setIsProcessingUpload(false);
      setUploadStatusMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Header Card */}
      <div className="bg-gradient-to-r from-[#005d42] via-[#006e4f] to-[#004e37] rounded-2xl p-6 text-white shadow-lg border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 skew-x-12 transform origin-top-right pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold tracking-wider uppercase border border-emerald-300/30 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                Modul Admisi & SDM Pendaftaran
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold">
                RSU Muhammadiyah Babat
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Kalkulator Insentif & Jam Dinas
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
              Perhitungan otomatis Uang Malam (Shift M x Rp 5.000) dan Uang Makan (Rp 6.000 khusus Shift M pada hari Selasa, Rabu, Jumat, Sabtu & Minggu).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-400/20 hover:bg-emerald-400/30 text-white rounded-xl text-xs font-bold border border-emerald-300/40 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calendar className="w-4 h-4 text-emerald-200" />
              <span>📅 Upload Jadwal Dinas Bulanan</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 shadow-xs transition-colors"
              title="Sesuaikan tarif dan durasi shift"
            >
              <Settings className="w-4 h-4 text-emerald-200" />
              <span>⚙️ Settings / Tarif Nominal</span>
            </button>
          </div>
        </div>

        {/* Info Strip */}
        <div className="mt-5 pt-4 border-t border-emerald-600/50 flex flex-wrap items-center gap-4 text-xs text-emerald-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>
              Tarif Uang Malam: <strong>{formatRupiah(rates.uangMalam)}</strong> / shift M
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
            <span>
              Tarif Uang Makan: <strong>{formatRupiah(rates.uangMakan)}</strong> / shift M (Selasa, Rabu, Jumat, Sabtu & Minggu)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-300" />
            <span>
              Durasi Shift: P/S = <strong>{rates.hoursP} Jam</strong>, M = <strong>{rates.hoursM} Jam</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>
              Tanggal Merah ({monthData.monthName}): <strong>{safeNationalHolidays.length} Hari</strong> (Senin-Sabtu memicu Ekstra Libur)
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Month, View Switcher, Filter, Save & Export */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Periode, Status Badge & View Mode */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <select
              value={monthData.month}
              onChange={(e) => handleChangeMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 py-1.5 px-2.5 focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES_ID.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={monthData.year}
              onChange={(e) => handleChangeYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 py-1.5 px-2 focus:outline-none cursor-pointer border-l border-slate-200"
            >
              {[2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Status Badge: Tersimpan & Dikunci */}
          {isCurrentMonthLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status: Tersimpan & Dikunci</span>
              <button
                onClick={handleToggleLockCurrentMonth}
                className="ml-1 px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md text-[10px] font-semibold cursor-pointer transition-colors"
                title="Buka kunci untuk mengoreksi jadwal/shift staf"
              >
                Buka Kunci
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Status: Draf Kerja (Belum Dikunci)</span>
            </div>
          )}

          {/* View Mode Toggle (3 Tabs: Summary, Matrix, Riwayat Arsip) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'summary'
                  ? 'bg-white text-[#005d42] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Rekapitulasi Insentif</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#005d42] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriks Shift Harian (1-{monthData.daysInMonth})</span>
            </button>
            <button
              onClick={() => setViewMode('archive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'archive'
                  ? 'bg-white text-[#005d42] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Arsip</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                viewMode === 'archive' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {allArchives.length}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Search, Add Staff, Save & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama staf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Add Staff Button */}
          <button
            onClick={() => {
              setEditingStaffId(null);
              setNewStaffName('');
              setNewStaffRole('Staf Pendaftaran');
              setIsAddStaffModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pegawai</span>
          </button>

          {/* Cetak Struk Thermal 80mm (Epson TM-T82X) */}
          <button
            onClick={() => setIsThermalModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Cetak Struk Thermal 80mm (Epson TM-T82X)"
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Struk Thermal</span>
          </button>

          {/* Tombol Simpan Rekapitulasi Bulan Ini */}
          <button
            onClick={handleSaveCurrentMonthRecap}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
              isCurrentMonthLocked
                ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                : 'bg-[#005d42] hover:bg-emerald-700 text-white ring-2 ring-emerald-400/40 shadow-emerald-200'
            }`}
            title={isCurrentMonthLocked ? 'Perbarui & simpan ulang rekapitulasi terkunci' : 'Simpan data rekapitulasi dan kunci ke database'}
          >
            {isCurrentMonthLocked ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                <span>Tersimpan & Dikunci</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 text-emerald-200" />
                <span>Simpan Rekapitulasi Bulan Ini</span>
              </>
            )}
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Download Excel Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Download PDF Resmi"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={promptResetToDefault}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Muat Ulang Contoh Data RSUMB"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Staf Aktif</span>
            <span className="p-1 rounded-lg bg-slate-100 text-slate-600">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-800">{departmentTotals.totalStaff} Pegawai</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {departmentTotals.totalHours} Total Jam Dinas
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Uang Malam</span>
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl font-black text-indigo-900">
            {formatRupiah(departmentTotals.totalUangMalam)}
          </p>
          <p className="text-[11px] text-indigo-600/80 mt-1">
            {departmentTotals.totalM} Shift Malam (x {formatRupiah(rates.uangMalam)})
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Uang Makan</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
              <Coins className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl font-black text-emerald-900">
            {formatRupiah(departmentTotals.totalUangMakan)}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-1">
            Hari Kerja Non-Senin & Non-Kamis
          </p>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs mb-1 font-semibold">
            <span>Grand Total Insentif</span>
            <span className="p-1 rounded-lg bg-emerald-200/60 text-emerald-900 font-bold">
              Total
            </span>
          </div>
          <p className="text-xl font-black text-[#005d42]">
            {formatRupiah(departmentTotals.grandTotalInsentif)}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Uang Malam + Uang Makan Staf
          </p>
        </div>
      </div>

      {/* VIEW 1: REKAPITULASI INSENTIF (FINANCIAL PAYROLL TABLE) */}
      {viewMode === 'summary' && (
        <div className="space-y-4">
          {/* Banner Ruang Kerja Baru jika belum ada staf / jadwal kosong */}
          {safeStaffRows.length === 0 && (
            <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-8 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 flex items-center justify-center text-[#005d42] shadow-xs">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Ruang Kerja Jadwal Baru: {monthData.monthName} {monthData.year}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
                Belum ada arsip atau jadwal dinas yang tersimpan untuk periode {monthData.monthName} {monthData.year}. Anda dapat mengunggah file roster baru, memuat template standar pendaftaran RSUMB, atau menambah staf secara manual.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#005d42] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
                >
                  <FileUp className="w-4 h-4 text-emerald-200" />
                  <span>Upload Jadwal (Excel / CSV / Foto)</span>
                </button>
                <button
                  onClick={handleLoadTemplateForCurrentMonth}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Muat Template Pendaftaran (10 Staf)</span>
                </button>
                <button
                  onClick={() => {
                    setEditingStaffId(null);
                    setNewStaffName('');
                    setNewStaffRole('Staf Pendaftaran');
                    setIsAddStaffModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Tambah Pegawai Manual</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-financial-container">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 no-print">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-bold text-slate-800 text-base">
                    Rekapitulasi Insentif & Pembayaran ({monthData.monthName} {monthData.year})
                  </h2>
                  {isCurrentMonthLocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Lock className="w-3 h-3 text-emerald-700" />
                      Status: Tersimpan & Dikunci
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Status: Draf Kerja
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tabel nominal insentif staf pendaftaran: akumulasi shift malam, uang malam, dan uang makan dinas
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                Menampilkan {filteredSummaries.length} dari {safeStaffRows.length} Staf
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print-financial-table">
                <thead>
                  <tr className="bg-[#005d42] text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-3 text-center w-12">No</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Nama Pegawai</th>
                    <th className="py-3.5 px-3 text-center" title="Akumulasi Shift Malam (M) Sebulan">
                      Shift Malam (M)
                    </th>
                    <th className="py-3.5 px-4 text-right" title="Total Shift M x Rp 5.000">
                      Uang Malam
                    </th>
                    <th className="py-3.5 px-4 text-right" title="Hari Kerja Non-Senin & Non-Kamis x Rp 6.000">
                      Uang Makan
                    </th>
                    <th className="py-3.5 px-5 text-right bg-emerald-800 font-black">
                      Grand Total
                    </th>
                    <th className="py-3.5 px-3 text-center w-24 no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {safeStaffRows.length === 0
                          ? `Belum ada staf pada periode ${monthData.monthName} ${monthData.year}. Gunakan opsi di atas untuk mengunggah jadwal.`
                          : `Tidak ada data staf yang cocok dengan pencarian "${searchTerm}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredSummaries.map((staff, idx) => (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3.5 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{staff.name}</div>
                        {staff.role && (
                          <div className="text-[10px] text-slate-400">{staff.role}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs">
                          {staff.countM} Shift
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-indigo-950">
                        {formatRupiah(staff.uangMalam)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-950">
                        {formatRupiah(staff.uangMakan)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-[#005d42] bg-emerald-50/40 text-[13px]">
                        {formatRupiah(staff.totalInsentif)}
                      </td>
                      <td className="py-3.5 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedStaffForDetail(staff)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Lihat Rincian Harian 1-31"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (isCurrentMonthLocked) {
                                showToast('Rekapitulasi bulan ini telah dikunci. Buka kunci di tab Arsip jika ingin mengedit.');
                                return;
                              }
                              setEditingStaffId(staff.id);
                              setNewStaffName(staff.name);
                              setNewStaffRole(staff.role || 'Staf Pendaftaran');
                              setIsAddStaffModalOpen(true);
                            }}
                            disabled={isCurrentMonthLocked}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrentMonthLocked
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer'
                            }`}
                            title={isCurrentMonthLocked ? 'Terkunci (Arsip Resmi)' : 'Edit Nama Pegawai'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (isCurrentMonthLocked) {
                                showToast('Rekapitulasi bulan ini telah dikunci. Buka kunci di tab Arsip jika ingin menghapus.');
                                return;
                              }
                              promptDeleteStaff(staff.id, staff.name);
                            }}
                            disabled={isCurrentMonthLocked}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrentMonthLocked
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={isCurrentMonthLocked ? 'Terkunci (Arsip Resmi)' : 'Hapus Pegawai dari Rekapitulasi'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Baris Total Ringkasan Departemen */}
              <tfoot>
                <tr className="bg-emerald-50/90 border-t-2 border-emerald-600 text-slate-900 font-bold text-xs">
                  <td colSpan={2} className="py-4 px-4 text-left uppercase text-emerald-950 tracking-wider">
                    TOTAL KESELURUHAN ({departmentTotals.totalStaff} Pegawai)
                  </td>
                  <td className="py-4 px-3 text-center text-indigo-900 font-black">
                    {departmentTotals.totalM} Shift
                  </td>
                  <td className="py-4 px-4 text-right font-black text-indigo-950">
                    {formatRupiah(departmentTotals.totalUangMalam)}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-emerald-950">
                    {formatRupiah(departmentTotals.totalUangMakan)}
                  </td>
                  <td className="py-4 px-5 text-right font-black text-white bg-[#005d42] text-sm shadow-inner">
                    {formatRupiah(departmentTotals.grandTotalInsentif)}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* VIEW 2: MATRIKS SHIFT HARIAN (1-31) */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Matriks Jadwal Shift Harian (1-{monthData.daysInMonth} {monthData.monthName} {monthData.year})
              </h2>
              <p className="text-xs text-slate-500">
                Klik sel untuk mengedit kode shift secara langsung (P, S, M, L, LE, C, I/P, I/S). Kolom merah menandai Libur Nasional / Ahad.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">P / IP = Pagi</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">S / IS = Sore</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold">M = Malam</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">L/LE = Libur</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[650px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-800 text-white font-bold text-[10px]">
                  <th className="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-800 w-10">No</th>
                  <th className="py-2.5 px-4 sticky left-10 z-30 bg-slate-800 min-w-[160px] shadow-sm">
                    Nama Pegawai
                  </th>
                  {Array.from({ length: monthData.daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dow = getDayOfWeek(monthData.year, monthData.month, day);
                    const isSunday = dow === 0;
                    const isHoliday = safeNationalHolidays.includes(day);

                    return (
                      <th
                        key={day}
                        className={`py-2 px-1 text-center min-w-[34px] border-l border-slate-700 ${
                          isHoliday
                            ? 'bg-rose-700 text-white font-black'
                            : isSunday
                            ? 'bg-rose-900/60 text-rose-200'
                            : 'bg-slate-800'
                        }`}
                        title={`${day} ${monthData.monthName} (${INDONESIAN_DAY_NAMES[dow]})${
                          isHoliday ? ' - Tanggal Merah' : ''
                        }`}
                      >
                        <div>{day}</div>
                        <div className="text-[9px] font-normal opacity-80">
                          {INDONESIAN_DAY_NAMES[dow].slice(0, 2)}
                        </div>
                      </th>
                    );
                  })}
                  {/* Metrik Operasional Shift yang diposisikan di tampilan Matriks */}
                  <th className="py-2.5 px-2 text-center bg-slate-900 border-l border-slate-700 min-w-[42px]" title="Pagi & Pagi IGD">P/IP</th>
                  <th className="py-2.5 px-2 text-center bg-slate-900 border-l border-slate-700 min-w-[42px]" title="Sore & Sore IGD">S/IS</th>
                  <th className="py-2.5 px-2 text-center bg-slate-900 border-l border-slate-700 min-w-[42px]" title="Malam">M</th>
                  <th className="py-2.5 px-2 text-center bg-slate-900 border-l border-slate-700 min-w-[42px]" title="Libur & Libur Ekstra">L/LE</th>
                  <th className="py-2.5 px-2 text-center bg-slate-900 border-l border-slate-700 min-w-[42px]" title="Cuti">Cuti</th>
                  <th className="py-2.5 px-2.5 text-center bg-rose-950 border-l border-slate-700 min-w-[55px]" title="Hak Libur Tambahan Tanggal Merah">Ekstra Libur</th>
                  <th className="py-2.5 px-2.5 text-center bg-emerald-950 border-l border-slate-700 min-w-[60px]" title="Total Jam Kerja Sebulan">Total Jam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeStaffRows.map((staff, idx) => {
                  const staffSummary = staffSummaries.find((s) => s.id === staff.id);

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-500 font-semibold sticky left-0 z-10 bg-white">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4 font-bold text-slate-900 sticky left-10 z-10 bg-white shadow-sm whitespace-nowrap">
                        <div className="flex items-center justify-between gap-2">
                          <span>{staff.name}</span>
                          <button
                            type="button"
                            onClick={() => promptDeleteStaff(staff.id, staff.name)}
                            className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition-colors no-print cursor-pointer"
                            title={`Hapus ${staff.name} dari jadwal`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      {Array.from({ length: monthData.daysInMonth }, (_, i) => i + 1).map((day) => {
                        const currentShift = staff.shifts?.[day] || '-';
                        const dow = getDayOfWeek(monthData.year, monthData.month, day);
                        const isSunday = dow === 0;
                        const isHoliday = safeNationalHolidays.includes(day);

                        // Style berdasarkan kode shift
                        let badgeColor = 'text-slate-600 bg-slate-50';
                        if (currentShift === 'P' || currentShift === 'I/P' || currentShift === 'P2') {
                          badgeColor = 'bg-emerald-100 text-emerald-800 font-bold';
                        } else if (currentShift === 'S' || currentShift === 'I/S') {
                          badgeColor = 'bg-amber-100 text-amber-800 font-bold';
                        } else if (currentShift === 'M') {
                          badgeColor = 'bg-indigo-600 text-white font-black';
                        } else if (currentShift === 'L' || currentShift === 'LE') {
                          badgeColor = 'bg-rose-100 text-rose-700 font-semibold';
                        } else if (currentShift === 'C') {
                          badgeColor = 'bg-purple-100 text-purple-700 font-semibold';
                        }

                        return (
                          <td
                            key={day}
                            className={`p-0.5 text-center border-l border-slate-100 ${
                              isHoliday ? 'bg-rose-50/40' : isSunday ? 'bg-slate-50/70' : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={currentShift}
                              disabled={isCurrentMonthLocked}
                              onChange={(e) =>
                                handleMatrixShiftChange(staff.id, day, e.target.value)
                              }
                              className={`w-7 h-7 text-center rounded text-[11px] uppercase transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-none ${badgeColor} ${
                                isCurrentMonthLocked ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                              maxLength={3}
                              title={isCurrentMonthLocked ? 'Jadwal terkunci (Buka kunci di tab Arsip untuk mengedit)' : 'Klik untuk mengubah kode shift'}
                            />
                          </td>
                        );
                      })}

                      {/* Kolom Metrik Operasional Eksklusif di Matriks */}
                      <td className="py-2 px-2 text-center border-l border-slate-200 font-semibold text-emerald-800 bg-emerald-50/30">
                        {staffSummary ? staffSummary.countP : '-'}
                      </td>
                      <td className="py-2 px-2 text-center border-l border-slate-200 font-semibold text-amber-800 bg-amber-50/30">
                        {staffSummary ? staffSummary.countS : '-'}
                      </td>
                      <td className="py-2 px-2 text-center border-l border-slate-200 font-bold text-indigo-800 bg-indigo-50/30">
                        {staffSummary ? staffSummary.countM : '-'}
                      </td>
                      <td className="py-2 px-2 text-center border-l border-slate-200 text-slate-600">
                        {staffSummary ? staffSummary.countL : '-'}
                      </td>
                      <td className="py-2 px-2 text-center border-l border-slate-200 text-slate-600">
                        {staffSummary ? staffSummary.countC : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-center border-l border-slate-200 font-bold text-rose-700 bg-rose-50/30">
                        {staffSummary && staffSummary.extraOffDays > 0 ? `★ +${staffSummary.extraOffDays}` : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-center border-l border-slate-200 font-bold text-slate-900 bg-slate-100/60">
                        {staffSummary ? `${staffSummary.totalHours}j` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 text-slate-800 font-bold text-[11px]">
                  <td colSpan={2} className="py-3 px-4 text-left uppercase sticky left-0 z-10 bg-slate-100">
                    TOTAL OPERASIONAL
                  </td>
                  {Array.from({ length: monthData.daysInMonth }, (_, i) => i + 1).map((day) => {
                    const activeStaffOnDay = safeStaffRows.filter((st) => {
                      const sh = (st.shifts?.[day] || '').toUpperCase();
                      return sh && sh !== 'L' && sh !== 'LE' && sh !== 'C' && sh !== '-';
                    }).length;

                    return (
                      <td key={day} className="py-3 px-1 text-center border-l border-slate-200 text-slate-600 font-medium">
                        {activeStaffOnDay || '-'}
                      </td>
                    );
                  })}
                  <td className="py-3 px-2 text-center border-l border-slate-300 text-emerald-800 font-bold">{departmentTotals.totalP}</td>
                  <td className="py-3 px-2 text-center border-l border-slate-300 text-amber-800 font-bold">{departmentTotals.totalS}</td>
                  <td className="py-3 px-2 text-center border-l border-slate-300 text-indigo-800 font-bold">{departmentTotals.totalM}</td>
                  <td className="py-3 px-2 text-center border-l border-slate-300 text-slate-600">{departmentTotals.totalL}</td>
                  <td className="py-3 px-2 text-center border-l border-slate-300 text-slate-600">{departmentTotals.totalC}</td>
                  <td className="py-3 px-2.5 text-center border-l border-slate-300 text-rose-700 font-black">+{departmentTotals.totalExtraOffDays}</td>
                  <td className="py-3 px-2.5 text-center border-l border-slate-300 text-slate-900 font-black">{departmentTotals.totalHours}j</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: RIWAYAT ARSIP & LOG PENGUNCIAN GAJI */}
      {viewMode === 'archive' && (
        <div className="space-y-4">
          {/* Header Card Riwayat Arsip */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#005d42] border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                <FolderClock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800 text-base">
                    Riwayat Arsip & Penguncian Rekapitulasi Gaji
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {allArchives.length} Arsip Tersimpan
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar rekapitulasi gaji insentif dinas malam & uang makan yang telah disetujui, disimpan, dan dikunci secara permanen di database.
                </p>
              </div>
            </div>

            {/* Tombol Simpan Bulan Berjalan jika belum diarsipkan */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveCurrentMonthRecap}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
                  isCurrentMonthLocked
                    ? 'bg-emerald-800 text-white'
                    : 'bg-[#005d42] hover:bg-emerald-700 text-white ring-2 ring-emerald-400/40'
                }`}
              >
                {isCurrentMonthLocked ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    <span>Bulan Ini ({monthData.monthName}) Telah Dikunci</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 text-emerald-200" />
                    <span>Arsipkan Bulan Ini ({monthData.monthName} {monthData.year})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* KPI Analytics Summary across all archives */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs mb-1">Periode Terarsip</div>
              <p className="text-xl font-black text-slate-800">{allArchives.length} Periode Bulan</p>
              <p className="text-[11px] text-slate-400 mt-1">Dokumen resmi tersimpan</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs mb-1">Akumulasi Total Insentif</div>
              <p className="text-xl font-black text-[#005d42]">
                {formatRupiah(
                  allArchives.reduce((acc, a) => acc + (a.departmentTotals?.grandTotalInsentif || 0), 0)
                )}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">Total pencairan tersimpan</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs mb-1">Rata-rata Insentif / Bulan</div>
              <p className="text-xl font-black text-indigo-900">
                {formatRupiah(
                  allArchives.length > 0
                    ? Math.round(
                        allArchives.reduce((acc, a) => acc + (a.departmentTotals?.grandTotalInsentif || 0), 0) /
                          allArchives.length
                      )
                    : 0
                )}
              </p>
              <p className="text-[11px] text-indigo-600/80 mt-1">Perkiraan biaya per periode</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs mb-1">Shift Malam Terlayani</div>
              <p className="text-xl font-black text-slate-800">
                {allArchives.reduce((acc, a) => acc + (a.departmentTotals?.totalM || 0), 0)} Shift (M)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Pelayanan admisi malam</p>
            </div>
          </div>

          {/* Table Riwayat Arsip */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Daftar Dokumen Arsip Rekapitulasi (Terurut Terbaru)
              </h3>
              <span className="text-xs text-slate-400">
                Klik &quot;Buka Rekapitulasi&quot; untuk memuat data bulan yang dipilih
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-4 min-w-[150px]">Periode</th>
                    <th className="py-3 px-4 min-w-[180px]">Tgl Simpan & Petugas</th>
                    <th className="py-3 px-3 text-center">Staf</th>
                    <th className="py-3 px-3 text-center">Shift M</th>
                    <th className="py-3 px-4 text-right">Uang Malam</th>
                    <th className="py-3 px-4 text-right">Uang Makan</th>
                    <th className="py-3 px-5 text-right font-black bg-slate-900">Grand Total</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center min-w-[200px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allArchives.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Belum ada dokumen rekapitulasi yang tersimpan di database. Silakan buka tab &quot;Rekapitulasi Insentif&quot; dan klik &quot;Simpan Rekapitulasi Bulan Ini&quot;.
                      </td>
                    </tr>
                  ) : (
                    allArchives
                      .slice()
                      .sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month))
                      .map((arch, idx) => {
                        const isCurrentlyActive = arch.year === monthData.year && arch.month === monthData.month;
                        const formattedDate = arch.savedAt
                          ? new Date(arch.savedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-';

                        return (
                          <tr
                            key={arch.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              isCurrentlyActive ? 'bg-emerald-50/40 font-medium' : ''
                            }`}
                          >
                            <td className="py-3.5 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{arch.monthName} {arch.year}</span>
                                {isCurrentlyActive && (
                                  <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-[#005d42] text-[10px] font-black">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {arch.daysInMonth || 31} Hari Kalender • ID: {arch.id}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-slate-800 font-semibold">{formattedDate} WIB</div>
                              <div className="text-[10px] text-slate-400">{arch.savedBy || 'PJ Admisi & Kasir RSUMB'}</div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                                {arch.staffRows?.length || 0} Staf
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                                {arch.departmentTotals?.totalM || 0} Shift
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                              {formatRupiah(arch.departmentTotals?.totalUangMalam || 0)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                              {formatRupiah(arch.departmentTotals?.totalUangMakan || 0)}
                            </td>
                            <td className="py-3.5 px-5 text-right font-black text-[#005d42] text-[13px] bg-emerald-50/30">
                              {formatRupiah(arch.departmentTotals?.grandTotalInsentif || 0)}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              {arch.isLocked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Lock className="w-3 h-3 text-emerald-600" />
                                  Tersimpan & Dikunci
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Unlock className="w-3 h-3 text-amber-600" />
                                  Kunci Terbuka
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenArchivedRecord(arch)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-[#005d42] hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                  title="Buka rekapitulasi bulan ini di dashboard"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Buka</span>
                                </button>
                                <button
                                  onClick={() => handleExportArchiveExcel(arch)}
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                                  title="Download Excel Arsip"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleExportArchivePdf(arch)}
                                  className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                                  title="Download PDF Arsip"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const nextStatus = !arch.isLocked;
                                    setArchiveLockStatus(arch.year, arch.month, nextStatus);
                                    setAllArchives(getAllMonthlyArchives());
                                    if (arch.year === monthData.year && arch.month === monthData.month) {
                                      setIsCurrentMonthLocked(nextStatus);
                                    }
                                    showToast(`Status arsip ${arch.monthName} ${arch.year} berhasil diubah.`);
                                  }}
                                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                                  title={arch.isLocked ? 'Buka Kunci' : 'Kunci Arsip'}
                                >
                                  {arch.isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>
                                <button
                                  onClick={() => setArchiveToDelete(arch)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                                  title="Hapus Arsip Rekapitulasi"
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
          </div>
        </div>
      )}

      {/* MODAL 1: Upload Jadwal Dinas Bulanan */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#005d42] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Upload Jadwal Dinas Bulanan</h3>
                  <p className="text-xs text-slate-500">
                    Periode: {monthData.monthName} {monthData.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#005d42] bg-slate-50 hover:bg-emerald-50/30 p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 bg-white rounded-2xl shadow-xs border border-slate-200 flex items-center justify-center text-[#005d42] group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Pilih File Jadwal Dinas
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Mendukung file Excel (.xlsx, .xls), CSV, atau Foto Jadwal (.png, .jpg).
                </p>
              </div>

              {isProcessingUpload && (
                <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Memproses Jadwal...</span>
                  </div>
                  <p className="text-xs text-slate-300">{uploadStatusMsg}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rincian Harian Staf */}
      {selectedStaffForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>Rincian Dinas Harian: {selectedStaffForDetail.name}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">
                    {monthData.monthName} {monthData.year}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Total Jam Kerja: <strong>{selectedStaffForDetail.totalHours} Jam</strong> • Uang Malam: <strong>{formatRupiah(selectedStaffForDetail.uangMalam)}</strong> • Uang Makan: <strong>{formatRupiah(selectedStaffForDetail.uangMakan)}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedStaffForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 border rounded-xl">
                  <div className="text-slate-500 text-[10px]">Shift Malam (M)</div>
                  <div className="font-bold text-indigo-700 text-sm">{selectedStaffForDetail.countM} Kali</div>
                </div>
                <div className="p-2 bg-slate-50 border rounded-xl">
                  <div className="text-slate-500 text-[10px]">Hari Dapat Uang Makan</div>
                  <div className="font-bold text-emerald-700 text-sm">{selectedStaffForDetail.eligibleMealDays} Hari</div>
                </div>
                <div className="p-2 bg-slate-50 border rounded-xl">
                  <div className="text-slate-500 text-[10px]">Ekstra Libur</div>
                  <div className="font-bold text-rose-700 text-sm">+{selectedStaffForDetail.extraOffDays} Hari</div>
                </div>
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-emerald-800 text-[10px] font-semibold">Total Insentif</div>
                  <div className="font-black text-[#005d42] text-sm">{formatRupiah(selectedStaffForDetail.totalInsentif)}</div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3 text-center">Tgl</th>
                      <th className="py-2 px-3">Hari</th>
                      <th className="py-2 px-3 text-center">Shift</th>
                      <th className="py-2 px-3 text-center">Jam</th>
                      <th className="py-2 px-3 text-center">Uang Malam</th>
                      <th className="py-2 px-3">Ket. Uang Makan</th>
                      <th className="py-2 px-3 text-center">Ekstra Libur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStaffForDetail.dailyDetails.map((day) => {
                      const isSeninKamis = day.dayOfWeek === 1 || day.dayOfWeek === 4;

                      let mealStatus = '';
                      if (day.hasMeal) {
                        mealStatus = `✅ Dapat (${formatRupiah(rates.uangMakan)})`;
                      } else if (day.shift === 'M' || day.shift === 'MALAM') {
                        mealStatus = `❌ Hari ${day.dayName} (Senin/Kamis Dikecualikan)`;
                      } else {
                        mealStatus = `❌ Bukan Shift M (${day.shift || '-'})`;
                      }

                      return (
                        <tr key={day.day} className={`hover:bg-slate-50 ${day.isNationalHoliday ? 'bg-rose-50/50' : ''}`}>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{day.day}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {day.dayName}
                            {day.isNationalHoliday && (
                              <span className="ml-1 text-[10px] font-bold text-rose-600">★ Tgl Merah</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 font-bold rounded-md bg-slate-100 text-slate-800">
                              {day.shift || '-'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-semibold text-slate-700">{day.hours} Jam</td>
                          <td className="py-2 px-3 text-center font-bold text-indigo-700">
                            {day.isNight ? formatRupiah(rates.uangMalam) : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-700 text-[11px]">{mealStatus}</td>
                          <td className="py-2 px-3 text-center">
                            {day.isExtraOffDay ? (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                +1 Hari
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setSelectedStaffForDetail(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#005d42] hover:bg-[#004a35] rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Tambah / Edit Pegawai */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStaffId ? 'Edit Nama Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pegawai (Huruf Kapital)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: HISYAM / ALIVIA / ABI"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Unit Penempatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Staf Loket Pendaftaran / Admisi IGD"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStaff}
                className="px-5 py-2 text-xs font-bold text-white bg-[#005d42] hover:bg-[#004a35] rounded-xl shadow-xs"
              >
                Simpan Pegawai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Pengaturan Tarif Nominal */}
      <IncentiveSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rates={rates}
        onSaveRates={handleSaveRates}
        monthData={monthData}
        onUpdateHolidays={handleUpdateHolidays}
      />

      {/* MODAL 5: Konfirmasi Hapus Pegawai */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hapus Pegawai dari Jadwal</h3>
                  <p className="text-xs text-slate-500">Konfirmasi penghapusan data baris pegawai</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-3">
                Apakah Anda yakin ingin menghapus data pegawai <strong className="text-slate-900 font-bold">{staffToDelete.name}</strong> dari daftar rekapitulasi jadwal dinas dan perhitungan insentif?
              </p>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700">
                Data shift harian 1-{monthData.daysInMonth} dan kalkulasi uang malam serta uang makan untuk pegawai ini akan dihapus secara permanen dari bulan ini.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaff}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Ya, Hapus Pegawai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Konfirmasi Reset ke Data Contoh RSUMB */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Muat Ulang Contoh Data RSUMB</h3>
                  <p className="text-xs text-slate-500">Reset jadwal ke template bawaan</p>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Apakah Anda ingin memuat ulang contoh jadwal dinas staf pendaftaran RSUMB (HISYAM, ALIVIA, ABI, dll)? Seluruh perubahan jadwal bulan ini yang belum dicadangkan akan ditimpa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmResetToDefault}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
              >
                Ya, Muat Ulang Contoh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: Konfirmasi Hapus Arsip Rekapitulasi */}
      {archiveToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hapus Dokumen Arsip?</h3>
                  <p className="text-xs text-slate-500">
                    Periode: {archiveToDelete.monthName} {archiveToDelete.year}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Apakah Anda yakin ingin menghapus arsip rekapitulasi gaji <strong>{archiveToDelete.monthName} {archiveToDelete.year}</strong> (Grand Total: {formatRupiah(archiveToDelete.departmentTotals?.grandTotalInsentif || 0)})? Data snapshot perhitungan ini akan dihapus dari database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setArchiveToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteArchive}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus Arsip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Cetak Struk Thermal 80mm (Epson TM-T82X) */}
      <ThermalReceiptModal
        isOpen={isThermalModalOpen}
        onClose={() => setIsThermalModalOpen(false)}
        monthData={monthData}
        staffSummaries={staffSummaries}
        departmentTotals={departmentTotals}
        rates={rates}
      />

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          nav, header, aside, .no-print, button, input {
            display: none !important;
          }
          .print-financial-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
            color: black !important;
          }
          .print-financial-table th, .print-financial-table td {
            border: 1px solid #888 !important;
            padding: 6px 8px !important;
          }
          .print-financial-table th {
            background-color: #f0f0f0 !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};
