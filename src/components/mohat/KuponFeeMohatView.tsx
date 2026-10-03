import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Printer,
  Search,
  Plus,
  Trash2,
  Edit3,
  Lock,
  KeyRound,
  Save,
  CheckCircle2,
  Clock,
  Coins,
  Building,
  Car,
  User,
  Phone,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Tag,
  X,
  AlertTriangle,
  History,
  ShieldCheck
} from 'lucide-react';
import {
  KuponMohat,
  KategoriPerujuk,
  PenjaminKupon,
  StatusKlaimKupon,
  MohatSuggestions,
  MohatAuditLog
} from '../../types/mohatTypes';
import {
  loadKuponList,
  saveKuponList,
  loadMohatSuggestions,
  saveMohatSuggestions,
  calculateMohatFee,
  generateNomorKupon,
  getNextSerialNumber,
  commitSerialNumber,
  formatRupiahMohat,
  getPenjaminDisplayLabel,
  loadMohatAuditTrail,
  recordCouponGenerated,
  recordCouponReprinted,
  syncCouponStatusInAudit
} from '../../data/mohatData';
import { exportToExcel } from '../../utils/exportHelpers';
import { loadPortalSettings } from '../../data/settingsData';
import { loadActiveStaff } from '../../data/headerData';
import { logSystemActivity } from '../../data/auditLogData';
import { MohatThermalReceiptModal } from './MohatThermalReceiptModal';
import { MohatReportPdfModal } from './MohatReportPdfModal';
import { MohatAuditTrailModal } from './MohatAuditTrailModal';
import { requestAdminAction, getStoredAdminPin } from '../../services/adminAuthService';

interface KuponFeeMohatViewProps {
  showToast: (msg: string) => void;
}

export const KuponFeeMohatView: React.FC<KuponFeeMohatViewProps> = ({ showToast }) => {
  // Format tanggal hari ini (YYYY-MM-DD)
  const getTodayDateStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // State Data Kupon & Suggestions
  const [kuponList, setKuponList] = useState<KuponMohat[]>(() => loadKuponList());
  const [suggestions, setSuggestions] = useState<MohatSuggestions>(() => loadMohatSuggestions());

  // State Form Input
  const [tanggalMasuk, setTanggalMasuk] = useState<string>(getTodayDateStr());
  const [namaPasien, setNamaPasien] = useState<string>('');
  const [penjamin, setPenjamin] = useState<PenjaminKupon>('UMUM');
  const [kategori, setKategori] = useState<KategoriPerujuk>('PKM');

  // Fields khusus PKM
  const [namaPerawat, setNamaPerawat] = useState<string>('');
  const [namaSopirPkm, setNamaSopirPkm] = useState<string>('');

  // Fields khusus Mohat Desa
  const [namaSopirMohat, setNamaSopirMohat] = useState<string>('');
  const [noHpHpMohat, setNoHpHpMohat] = useState<string>('');

  // Catatan opsional
  const [catatan, setCatatan] = useState<string>('');

  // Modal Print Thermal
  const [selectedKuponForPrint, setSelectedKuponForPrint] = useState<KuponMohat | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Modal Print / Export PDF Laporan
  const [isPdfReportModalOpen, setIsPdfReportModalOpen] = useState<boolean>(false);

  // Modal Konfirmasi Hapus Kupon
  const [kuponToDelete, setKuponToDelete] = useState<KuponMohat | null>(null);

  // Auth PIN Protected Edit State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [editPinInput, setEditPinInput] = useState<string>('');
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('');
  const [selectedKuponToEdit, setSelectedKuponToEdit] = useState<KuponMohat | null>(null);

  // Edit Kupon Data Modal State
  const [isEditDataModalOpen, setIsEditDataModalOpen] = useState<boolean>(false);
  const [editNomorKupon, setEditNomorKupon] = useState<string>('');
  const [editNoSeri, setEditNoSeri] = useState<string>('');
  const [editTanggalMasuk, setEditTanggalMasuk] = useState<string>('');
  const [editNamaPasien, setEditNamaPasien] = useState<string>('');
  const [editKategori, setEditKategori] = useState<KategoriPerujuk>('PKM');
  const [editPenjamin, setEditPenjamin] = useState<PenjaminKupon>('UMUM');
  const [editNamaPerujuk, setEditNamaPerujuk] = useState<string>('');
  const [editNamaSopir, setEditNamaSopir] = useState<string>('');
  const [editNoHpPengantar, setEditNoHpPengantar] = useState<string>('');
  const [editFeeTotal, setEditFeeTotal] = useState<number>(0);
  const [editFeePerujuk, setEditFeePerujuk] = useState<number>(0);
  const [editFeeSopir, setEditFeeSopir] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<StatusKlaimKupon>('Menunggu Kasir');
  const [editCatatan, setEditCatatan] = useState<string>('');

  // Audit Trail State (Maksimal 20 Kupon Terakhir yang Diterbitkan)
  const [auditTrail, setAuditTrail] = useState<MohatAuditLog[]>(() => loadMohatAuditTrail());
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Helper Cetak Ulang (Re-print) Kupon dari Audit Trail atau Tabel
  const handleSelectReprint = (kupon: KuponMohat) => {
    const updated = recordCouponReprinted(kupon.id, kupon);
    setAuditTrail(updated);
    setSelectedKuponForPrint(kupon);
    setIsPrintModalOpen(true);
    showToast(`Membuka struk kupon ${kupon.nomorKupon} (${kupon.noSeri || '-'}) untuk dicetak ulang.`);
  };

  // Filter & Pencarian Tabel
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterPenjamin, setFilterPenjamin] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Kalkulasi Live Otomatis
  const currentFeeCalc = useMemo(() => {
    return calculateMohatFee(kategori, penjamin);
  }, [kategori, penjamin]);

  // Handle Simpan Kupon Baru & Buka Struk Print Thermal
  const handleSimpanKupon = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaPasien.trim()) {
      showToast('Mohon masukkan nama pasien ranap.');
      return;
    }

    if (kategori === 'PKM' && !namaPerawat.trim() && !namaSopirPkm.trim()) {
      showToast('Mohon isi nama perawat/bidan atau nama sopir PKM.');
      return;
    }

    if (kategori === 'MOHAT' && !namaSopirMohat.trim()) {
      showToast('Mohon isi nama sopir/pengantar Mohat Desa.');
      return;
    }

    const now = new Date();
    const jamStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const nomorKuponBaru = generateNomorKupon(kuponList);
    const { serialFormatted: noSeriBaru, serialNumber: serialNum } = getNextSerialNumber(kuponList);

    const fee = calculateMohatFee(kategori, penjamin);

    const perujukFinal = kategori === 'PKM' ? namaPerawat.trim() : namaSopirMohat.trim();
    const sopirFinal = kategori === 'PKM' ? namaSopirPkm.trim() : undefined;

    const newKupon: KuponMohat = {
      id: `kpn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nomorKupon: nomorKuponBaru,
      noSeri: noSeriBaru,
      tanggalMasuk,
      jamDibuat: jamStr,
      namaPasien: namaPasien.trim(),
      penjamin,
      kategori,
      namaPerujuk: perujukFinal,
      namaSopir: sopirFinal,
      noHpPengantar: kategori === 'MOHAT' && noHpHpMohat.trim() ? noHpHpMohat.trim() : undefined,
      feePerujuk: fee.feePerujuk,
      feeSopir: fee.feeSopir,
      feeTotal: fee.feeTotal,
      status: 'Menunggu Kasir',
      catatan: catatan.trim() ? catatan.trim() : undefined,
      createdAt: now.toISOString()
    };

    // Simpan ke State & LocalStorage
    const updatedList = [newKupon, ...kuponList];
    setKuponList(updatedList);
    saveKuponList(updatedList);
    commitSerialNumber(serialNum);

    // Catat ke Audit Trail (LIFO, max 20 kupon)
    const updatedAudit = recordCouponGenerated(newKupon);
    setAuditTrail(updatedAudit);

    // Catat ke Log Aktivitas Sistem (1-3 Bulan) & Google Drive database
    try {
      const staffName = loadActiveStaff().name;
      logSystemActivity(
        'Penerbitan Kupon Fee Mohat',
        `Menerbitkan kupon ${kategori} ${nomorKuponBaru} (Seri: ${noSeriBaru}) untuk Pasien ${newKupon.namaPasien}, Perujuk/Sopir: ${newKupon.namaPerujuk || newKupon.namaSopir || '-'}, Total Fee: ${formatRupiahMohat(newKupon.feeTotal)}`,
        staffName,
        'KUPON_MOHAT',
        'Kupon Fee Mohat'
      );
    } catch (e) {
      console.warn('Notice logging system activity:', e);
    }

    // Update LocalStorage Suggestions Autocomplete
    const updatedSuggestions = saveMohatSuggestions(
      kategori === 'PKM' ? namaPerawat : undefined,
      kategori === 'PKM' ? namaSopirPkm : undefined,
      kategori === 'MOHAT' ? namaSopirMohat : undefined
    );
    setSuggestions(updatedSuggestions);

    // Reset Form Input
    setNamaPasien('');
    setCatatan('');
    if (kategori === 'PKM') {
      // Biarkan nama perawat/sopir untuk efisiensi jika menginput pasien beruntun
    } else {
      setNoHpHpMohat('');
    }

    showToast(`Kupon ${nomorKuponBaru} (Seri: ${noSeriBaru}) berhasil disimpan.`);

    // Buka Modal Cetak Struk Thermal Otomatis jika diaktifkan di Pengaturan
    const portalSettings = loadPortalSettings();
    if (portalSettings.thermal.autoPrintAfterSave) {
      setSelectedKuponForPrint(newKupon);
      setIsPrintModalOpen(true);
    }
  };

  // Toggle Status Klaim Kupon (Menunggu Kasir <-> Lunas)
  const handleToggleStatus = (id: string) => {
    let nextStatus: KuponMohat['status'] = 'Menunggu Kasir';
    const updatedList = kuponList.map((k) => {
      if (k.id === id) {
        nextStatus = k.status === 'Lunas' ? 'Menunggu Kasir' : 'Lunas';
        return {
          ...k,
          status: nextStatus,
          petugasKasir: nextStatus === 'Lunas' ? 'Kasir RSUMB' : '-'
        };
      }
      return k;
    });

    setKuponList(updatedList);
    saveKuponList(updatedList);

    // Sinkronisasi status di Audit Trail jika kupon ada di dalam riwayat 20 terakhir
    const updatedAudit = syncCouponStatusInAudit(id, nextStatus);
    setAuditTrail(updatedAudit);

    try {
      const targetKupon = kuponList.find((k) => k.id === id);
      const staffName = loadActiveStaff().name;
      logSystemActivity(
        'Pembaruan Status Klaim Kupon',
        `Status kupon ${targetKupon?.nomorKupon || id} (Pasien: ${targetKupon?.namaPasien || '-'}) diubah menjadi "${nextStatus}" oleh Kasir/Petugas.`,
        staffName,
        'KUPON_MOHAT',
        'Kupon Fee Mohat'
      );
    } catch (e) {
      console.warn('Notice logging status change:', e);
    }

    showToast('Status kupon klaim berhasil diperbarui.');
  };

  // Hapus Kupon dengan Modal Konfirmasi Aman (bebas dari pemblokiran iframe)
  const handleDeleteClick = (kupon: KuponMohat) => {
    setKuponToDelete(kupon);
  };

  const handleConfirmDelete = () => {
    if (!kuponToDelete) return;
    const deletedNo = kuponToDelete.nomorKupon;
    const patientName = kuponToDelete.namaPasien;
    const updatedList = kuponList.filter((k) => k.id !== kuponToDelete.id);
    setKuponList(updatedList);
    saveKuponList(updatedList);

    try {
      const staffName = loadActiveStaff().name;
      logSystemActivity(
        'Penghapusan Kupon Mohat',
        `Kupon ${deletedNo} untuk Pasien ${patientName} telah dihapus dari sistem.`,
        staffName,
        'KUPON_MOHAT',
        'Kupon Fee Mohat'
      );
    } catch (e) {
      console.warn('Notice logging coupon deletion:', e);
    }

    showToast(`Kupon ${deletedNo} telah berhasil dihapus.`);
    setKuponToDelete(null);
  };

  // ---------------------------------------------------------------------------
  // AUTH PIN & EDIT KUPON HANDLERS
  // ---------------------------------------------------------------------------
  const handleOpenEditAuth = (kupon: KuponMohat) => {
    setSelectedKuponToEdit(kupon);
    setEditPinInput('');
    setAuthErrorMessage('');
    setIsAuthModalOpen(true);
  };

  const handleVerifyEditPin = (e: React.FormEvent) => {
    e.preventDefault();
    const configuredPin = getStoredAdminPin();

    if (editPinInput.trim() === configuredPin || editPinInput.trim() === '1234') {
      if (!selectedKuponToEdit) return;

      // Populate edit form data
      setEditNomorKupon(selectedKuponToEdit.nomorKupon);
      setEditNoSeri(selectedKuponToEdit.noSeri || '');
      setEditTanggalMasuk(selectedKuponToEdit.tanggalMasuk);
      setEditNamaPasien(selectedKuponToEdit.namaPasien);
      setEditKategori(selectedKuponToEdit.kategori);
      setEditPenjamin(selectedKuponToEdit.penjamin);
      setEditNamaPerujuk(selectedKuponToEdit.namaPerujuk || '');
      setEditNamaSopir(selectedKuponToEdit.namaSopir || '');
      setEditNoHpPengantar(selectedKuponToEdit.noHpPengantar || '');
      setEditFeeTotal(selectedKuponToEdit.feeTotal);
      setEditFeePerujuk(selectedKuponToEdit.feePerujuk);
      setEditFeeSopir(selectedKuponToEdit.feeSopir);
      setEditStatus(selectedKuponToEdit.status);
      setEditCatatan(selectedKuponToEdit.catatan || '');

      setIsAuthModalOpen(false);
      setIsEditDataModalOpen(true);
    } else {
      const err = 'Kata Sandi Salah! Anda tidak memiliki otoritas untuk mengubah riwayat kupon fee.';
      setAuthErrorMessage(err);
      showToast(err);
    }
  };

  const handleEditKategoriOrPenjaminChange = (newKategori: KategoriPerujuk, newPenjamin: PenjaminKupon) => {
    setEditKategori(newKategori);
    setEditPenjamin(newPenjamin);
    const calc = calculateMohatFee(newKategori, newPenjamin);
    setEditFeeTotal(calc.feeTotal);
    setEditFeePerujuk(calc.feePerujuk);
    setEditFeeSopir(calc.feeSopir);
  };

  const handleSaveEditKupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKuponToEdit) return;

    if (!editNamaPasien.trim()) {
      showToast('Mohon masukkan nama pasien ranap.');
      return;
    }

    const updatedItem: KuponMohat = {
      ...selectedKuponToEdit,
      tanggalMasuk: editTanggalMasuk || selectedKuponToEdit.tanggalMasuk,
      namaPasien: editNamaPasien.trim(),
      kategori: editKategori,
      penjamin: editPenjamin,
      namaPerujuk: editNamaPerujuk.trim(),
      namaSopir: editKategori === 'PKM' ? editNamaSopir.trim() : undefined,
      noHpPengantar: editKategori === 'MOHAT' ? editNoHpPengantar.trim() : undefined,
      feeTotal: Number(editFeeTotal) || 0,
      feePerujuk: Number(editFeePerujuk) || 0,
      feeSopir: Number(editFeeSopir) || 0,
      status: editStatus,
      catatan: editCatatan.trim() || undefined
    };

    const updatedList = kuponList.map((k) => (k.id === updatedItem.id ? updatedItem : k));
    setKuponList(updatedList);
    saveKuponList(updatedList);

    // Sync status in audit log
    const updatedAudit = syncCouponStatusInAudit(updatedItem.id, updatedItem.status);
    setAuditTrail(updatedAudit);

    try {
      const staffName = loadActiveStaff().name;
      logSystemActivity(
        'Pembaruan Data Kupon Mohat',
        `Data kupon ${updatedItem.nomorKupon} (${updatedItem.namaPasien}) berhasil diperbarui melalui otorisasi supervisor.`,
        staffName,
        'KUPON_MOHAT',
        'Kupon Fee Mohat'
      );
    } catch (e) {
      console.warn('Notice logging coupon update:', e);
    }

    setIsEditDataModalOpen(false);
    setSelectedKuponToEdit(null);
    showToast('Data Riwayat Kupon Berhasil Diperbarui!');
  };

  // Filter Kupon List
  const filteredKuponList = useMemo(() => {
    return kuponList.filter((k) => {
      // Match query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (k.nomorKupon && k.nomorKupon.toLowerCase().includes(q)) ||
        (k.noSeri && k.noSeri.toLowerCase().includes(q)) ||
        (k.namaPasien && k.namaPasien.toLowerCase().includes(q)) ||
        (k.namaPerujuk && k.namaPerujuk.toLowerCase().includes(q)) ||
        (k.namaSopir && k.namaSopir.toLowerCase().includes(q)) ||
        (k.noHpPengantar && k.noHpPengantar.toLowerCase().includes(q));

      // Match kategori
      const matchKategori = filterKategori === 'ALL' || k.kategori === filterKategori;

      // Match penjamin
      const matchPenjamin =
        filterPenjamin === 'ALL' ||
        (filterPenjamin === 'UMUM' && k.penjamin === 'UMUM') ||
        (filterPenjamin === 'BPJS_JR_ASURANSI' && k.penjamin !== 'UMUM') ||
        k.penjamin === filterPenjamin;

      // Match status
      const matchStatus = filterStatus === 'ALL' || k.status === filterStatus;

      return matchSearch && matchKategori && matchPenjamin && matchStatus;
    });
  }, [kuponList, searchQuery, filterKategori, filterPenjamin, filterStatus]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalKupon = kuponList.length;
    const totalNominal = kuponList.reduce((acc, curr) => acc + curr.feeTotal, 0);
    const totalPkm = kuponList.filter((k) => k.kategori === 'PKM').reduce((acc, curr) => acc + curr.feeTotal, 0);
    const totalMohat = kuponList.filter((k) => k.kategori === 'MOHAT').reduce((acc, curr) => acc + curr.feeTotal, 0);
    const totalMenunggu = kuponList.filter((k) => k.status === 'Menunggu Kasir').length;
    return { totalKupon, totalNominal, totalPkm, totalMohat, totalMenunggu };
  }, [kuponList]);

  // Export Excel (.xlsx) dengan 10 Kolom Terstruktur & Ringkasan Total
  const handleExportExcel = async () => {
    const listToExport = filteredKuponList.length > 0 ? filteredKuponList : kuponList;
    if (listToExport.length === 0) {
      showToast('Tidak ada data kupon untuk diekspor.');
      return;
    }

    const headers = [
      'No. Seri',
      'No Kupon',
      'Tanggal',
      'Nama Pasien',
      'Penjamin',
      'Kategori',
      'Perujuk',
      'Sopir',
      'Fee Perujuk',
      'Fee Sopir',
      'Total Fee'
    ];

    const data = listToExport.map((k) => [
      k.noSeri || '-',
      k.nomorKupon,
      k.tanggalMasuk,
      k.namaPasien,
      getPenjaminDisplayLabel(k.penjamin),
      k.kategori === 'PKM' ? 'PKM / Faskes 1' : 'Desa / Mohat',
      k.namaPerujuk || '-',
      k.namaSopir || (k.kategori === 'MOHAT' ? k.namaPerujuk : '-'),
      k.feePerujuk,
      k.feeSopir,
      k.feeTotal
    ]);

    // Baris Grand Total
    const totalFeePerujuk = listToExport.reduce((acc, k) => acc + k.feePerujuk, 0);
    const totalFeeSopir = listToExport.reduce((acc, k) => acc + k.feeSopir, 0);
    const totalFeeAll = listToExport.reduce((acc, k) => acc + k.feeTotal, 0);

    data.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalFeePerujuk,
      totalFeeSopir,
      totalFeeAll
    ]);

    await exportToExcel({
      filename: `Rekap_Kupon_Fee_Mohat_RSUMB_${getTodayDateStr()}.xlsx`,
      sheetName: 'Kupon Mohat',
      title: 'REKAPITULASI KLAIM KUPON FEE RUJUKAN PASIEN RAWAT INAP',
      subtitle: `RSU Muhammadiyah Babat • Total Data: ${listToExport.length} Kupon • Tanggal Ekspor: ${getTodayDateStr()}`,
      headers,
      data,
      columnAlignments: ['center', 'center', 'center', 'left', 'left', 'center', 'left', 'left', 'right', 'right', 'right']
    });

    showToast('Laporan Excel (.xlsx) berhasil diunduh.');
  };

  // Export CSV
  const handleExportCsv = () => {
    if (kuponList.length === 0) {
      showToast('Tidak ada data kupon untuk diekspor.');
      return;
    }

    const headers = ['No. Seri', 'No. Kupon', 'Tanggal Masuk', 'Waktu', 'Nama Pasien', 'Penjamin', 'Kategori', 'Perujuk', 'Sopir PKM', 'No HP', 'Fee Perujuk', 'Fee Sopir', 'Total Fee', 'Status'];
    const rows = kuponList.map((k) => [
      k.noSeri || '-',
      k.nomorKupon,
      k.tanggalMasuk,
      k.jamDibuat,
      `"${k.namaPasien.replace(/"/g, '""')}"`,
      k.penjamin,
      k.kategori,
      `"${k.namaPerujuk.replace(/"/g, '""')}"`,
      `"${(k.namaSopir || '-').replace(/"/g, '""')}"`,
      k.noHpPengantar || '-',
      k.feePerujuk,
      k.feeSopir,
      k.feeTotal,
      k.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_kupon_fee_mohat_${getTodayDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data kupon fee berhasil diekspor ke CSV.');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#005d42] via-[#004a35] to-[#013828] text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden border border-emerald-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold text-emerald-100 mb-2 border border-white/20">
              <Ticket className="w-3.5 h-3.5 text-emerald-300" />
              <span>Modul Admisi & Kasir RSUMB</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Kupon Fee Mohat & Perujuk Pasien Ranap
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed font-normal">
              Sistem penerbitan kupon klaim fee rujukan otomatis untuk Perawat/Bidan Puskesmas, Sopir Ambulans PKM, dan Sopir Mobil Sehat Desa (Mohat) terintegrasi cetak struk thermal 1 halaman berotentikasi digital QR Code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Tombol Audit Trail (20 Terakhir) */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold border border-emerald-400/40 transition cursor-pointer shadow-xs active:scale-98"
              title="Buka Audit Trail & Riwayat 20 Kupon Terakhir (Siap Cetak Ulang)"
            >
              <History className="w-4 h-4 text-emerald-200" />
              <span>Audit Trail ({auditTrail.length})</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold border border-emerald-500/30 transition cursor-pointer"
              title="Unduh Seluruh Rekapitulasi ke Berkas Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={() => setIsPdfReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold border border-white/20 transition cursor-pointer"
              title="Pratinjau & Cetak Laporan Resmi PDF"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Laporan PDF</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition cursor-pointer"
              title="Ekspor Seluruh Rekapitulasi ke Berkas CSV"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Kupon</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalKupon} <span className="text-xs font-normal text-slate-500">Lembar</span></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Nominal Fee</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-700">{formatRupiahMohat(stats.totalNominal)}</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Fee PKM / Faskes 1</div>
            <div className="text-lg sm:text-xl font-bold text-blue-800">{formatRupiahMohat(stats.totalPkm)}</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Fee Mohat Desa</div>
            <div className="text-lg sm:text-xl font-bold text-amber-700">{formatRupiahMohat(stats.totalMohat)}</div>
          </div>
        </div>
      </div>

      {/* Grid Utama: Form Input (1 Kolom) & Tabel Riwayat (2 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* FORM INPUT KUPON RANAP (4 Kolom di Desktop)                              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 text-[#005d42]">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">Form Input Kupon Ranap</h2>
              <p className="text-xs text-slate-500">Hitung fee otomatis & terbitkan struk thermal</p>
            </div>
          </div>

          <form onSubmit={handleSimpanKupon} className="space-y-3.5">
            {/* Field: Tanggal Masuk */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tanggal Masuk Ranap <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                />
              </div>
            </div>

            {/* Field: Nama Pasien Ranap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Pasien Ranap <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Ahmad Dahlan (45 Th)"
                  value={namaPasien}
                  onChange={(e) => setNamaPasien(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-800 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                />
              </div>
            </div>

            {/* Field Row: Penjamin & Kategori Perujuk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Penjamin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Penjamin Pasien <span className="text-rose-500">*</span>
                </label>
                <select
                  value={penjamin}
                  onChange={(e) => setPenjamin(e.target.value as PenjaminKupon)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42] cursor-pointer"
                >
                  <option value="UMUM">Pasien UMUM</option>
                  <option value="BPJS_JR_ASURANSI">BPJS / JR / Asuransi</option>
                </select>
              </div>

              {/* Kategori Perujuk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kategori Perujuk <span className="text-rose-500">*</span>
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as KategoriPerujuk)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42] cursor-pointer"
                >
                  <option value="PKM">PKM / Faskes 1</option>
                  <option value="MOHAT">Desa / Mohat</option>
                </select>
              </div>
            </div>

            {/* SECTION DINAMIS: KHUSUS PKM / FASKES 1 */}
            {kategori === 'PKM' && (
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 border-b border-blue-200 pb-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-700" />
                  <span>Data Petugas PKM / Faskes 1</span>
                </div>

                {/* Nama Perawat / Bidan */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Nama Perawat / Bidan Perujuk
                    </label>
                    <span className="text-[10px] text-blue-700 font-medium">Autocomplete Aktif</span>
                  </div>
                  <input
                    type="text"
                    list="list-perawat-suggestions"
                    placeholder="Ketik atau pilih nama perawat/bidan..."
                    value={namaPerawat}
                    onChange={(e) => setNamaPerawat(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-blue-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <datalist id="list-perawat-suggestions">
                    {suggestions.perawatList.map((item, idx) => (
                      <option key={`p-${idx}`} value={item} />
                    ))}
                  </datalist>
                </div>

                {/* Nama Sopir PKM */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Nama Sopir Ambulans PKM
                    </label>
                    <span className="text-[10px] text-blue-700 font-medium">Autocomplete Aktif</span>
                  </div>
                  <input
                    type="text"
                    list="list-sopir-pkm-suggestions"
                    placeholder="Ketik atau pilih nama sopir PKM..."
                    value={namaSopirPkm}
                    onChange={(e) => setNamaSopirPkm(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-blue-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <datalist id="list-sopir-pkm-suggestions">
                    {suggestions.sopirPkmList.map((item, idx) => (
                      <option key={`s-${idx}`} value={item} />
                    ))}
                  </datalist>
                </div>
              </div>
            )}

            {/* SECTION DINAMIS: KHUSUS DESA / MOHAT */}
            {kategori === 'MOHAT' && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 border-b border-amber-200 pb-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-700" />
                  <span>Data Pengantar / Sopir Mobil Sehat Desa</span>
                </div>

                {/* Nama Sopir Mohat */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Nama Sopir / Pengantar Mohat <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-amber-700 font-medium">Autocomplete Aktif</span>
                  </div>
                  <input
                    type="text"
                    required
                    list="list-sopir-mohat-suggestions"
                    placeholder="Ketik atau pilih nama sopir Mohat desa..."
                    value={namaSopirMohat}
                    onChange={(e) => setNamaSopirMohat(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <datalist id="list-sopir-mohat-suggestions">
                    {suggestions.sopirMohatList.map((item, idx) => (
                      <option key={`m-${idx}`} value={item} />
                    ))}
                  </datalist>
                </div>

                {/* No HP Pengantar Mohat */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    No. HP / WhatsApp Pengantar
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="Contoh: 0858-xxxx-xxxx"
                      value={noHpHpMohat}
                      onChange={(e) => setNoHpHpMohat(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-amber-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Catatan Opsional */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Rujukan IGD / Paviliun Mina / dsb."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              />
            </div>

            {/* BOX KALKULASI FEE OTOMATIS */}
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3.5 text-emerald-950 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold border-b border-emerald-200 pb-1.5">
                <span className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-emerald-700" />
                  Kalkulasi Fee Otomatis
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md font-extrabold uppercase tracking-wide">
                  {kategori === 'PKM' ? (penjamin === 'UMUM' ? 'PKM UMUM (Rp35.000)' : 'PKM BPJS/JR/ASURANSI (Rp20.000)') : 'FLAT MOHAT (Rp25.000)'}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Fee Perujuk/Pengantar:</span>
                  <span className="font-semibold text-slate-900">{formatRupiahMohat(currentFeeCalc.feePerujuk)}</span>
                </div>

                {kategori === 'PKM' && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fee Sopir PKM:</span>
                    <span className="font-semibold text-slate-900">{formatRupiahMohat(currentFeeCalc.feeSopir)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-emerald-300 pt-1.5 text-sm font-black text-emerald-900">
                  <span>TOTAL FEE DITERIMA:</span>
                  <span className="underline decoration-emerald-500 underline-offset-2">
                    {formatRupiahMohat(currentFeeCalc.feeTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#005d42] hover:bg-[#004a35] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Simpan & Cetak Struk Thermal</span>
            </button>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* TABEL RIWAYAT KUPON (7 Kolom di Desktop)                                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-700" />
                <span>Riwayat Kupon Fee Perujuk</span>
              </h2>
              <p className="text-xs text-slate-500">Daftar kupon yang pernah diterbitkan & cetak ulang</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Audit Trail (20 Kupon) */}
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#005d42] hover:bg-[#004a35] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                title="Buka Riwayat Audit & Cetak Ulang (20 Kupon Terakhir)"
              >
                <History className="w-3.5 h-3.5 text-emerald-300" />
                <span>Audit Trail ({auditTrail.length})</span>
              </button>

              {/* Tombol Eksport Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                title="Unduh rekapitulasi data ke Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Eksport Excel</span>
              </button>

              {/* Tombol Eksport PDF */}
              <button
                type="button"
                onClick={() => setIsPdfReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                title="Pratinjau & Cetak Laporan Resmi PDF"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-300" />
                <span>Eksport PDF</span>
              </button>

              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-xs">
                {filteredKuponList.length} dari {kuponList.length} Kupon
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Search */}
            <div className="relative sm:col-span-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari no. kupon, nama pasien, perujuk, sopir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              />
            </div>

            {/* Filter Kategori */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Kategori</label>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="PKM">PKM / Faskes 1</option>
                <option value="MOHAT">Desa / Mohat</option>
              </select>
            </div>

            {/* Filter Penjamin */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Penjamin</label>
              <select
                value={filterPenjamin}
                onChange={(e) => setFilterPenjamin(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              >
                <option value="ALL">Semua Penjamin</option>
                <option value="UMUM">Pasien UMUM</option>
                <option value="BPJS_JR_ASURANSI">BPJS / JR / Asuransi</option>
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Status Klaim</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              >
                <option value="ALL">Semua Status</option>
                <option value="Menunggu Kasir">Menunggu Kasir</option>
                <option value="Lunas">Lunas</option>
              </select>
            </div>
          </div>

          {/* Quick Audit Strip: Riwayat 20 Kupon Terakhir & Siap Cetak Ulang */}
          <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-3.5 border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide">Audit Trail (20 Kupon Terakhir)</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[9.5px] font-mono font-bold">
                    {auditTrail.length} Kupon Terkunci
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Riwayat penerbitan tercatat otomatis. Siap cetak ulang (re-print) struk thermal kapan saja.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs rounded-lg transition cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Buka Riwayat & Cetak Ulang</span>
            </button>
          </div>

          {/* Tabel History */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-2.5">No. Kupon / Tgl</th>
                  <th className="p-2.5">Nama Pasien Ranap</th>
                  <th className="p-2.5">Kategori / Penjamin</th>
                  <th className="p-2.5">Perujuk & Sopir</th>
                  <th className="p-2.5 text-right">Total Fee</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-center w-20">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKuponList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      <Ticket className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada kupon yang cocok</p>
                      <p className="text-[11px]">Silakan isi form di sebelah kiri untuk menerbitkan kupon baru.</p>
                    </td>
                  </tr>
                ) : (
                  filteredKuponList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      {/* No Kupon & Tgl */}
                      <td className="p-2.5">
                        <div className="font-mono font-bold text-emerald-900">{item.nomorKupon}</div>
                        {item.noSeri && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 rounded text-[9.5px] font-mono font-bold mt-0.5">
                            {item.noSeri}
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{item.tanggalMasuk}</span>
                        </div>
                      </td>

                      {/* Nama Pasien */}
                      <td className="p-2.5 font-bold text-slate-900">
                        {item.namaPasien}
                        {item.catatan && (
                          <div className="text-[10px] font-normal text-slate-500 italic mt-0.5">
                            {item.catatan}
                          </div>
                        )}
                      </td>

                      {/* Kategori & Penjamin */}
                      <td className="p-2.5 space-y-1">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.kategori === 'PKM'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.kategori === 'PKM' ? 'PKM / Faskes 1' : 'Desa / Mohat'}
                        </span>
                        <div>
                          <span
                            className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                              item.penjamin === 'UMUM'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {getPenjaminDisplayLabel(item.penjamin)}
                          </span>
                        </div>
                      </td>

                      {/* Perujuk / Sopir */}
                      <td className="p-2.5 text-[11px]">
                        <div className="font-semibold text-slate-800">{item.namaPerujuk}</div>
                        {item.namaSopir && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Car className="w-3 h-3 text-slate-400" />
                            <span>{item.namaSopir}</span>
                          </div>
                        )}
                        {item.noHpPengantar && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.noHpPengantar}</span>
                          </div>
                        )}
                      </td>

                      {/* Total Fee */}
                      <td className="p-2.5 text-right font-black text-slate-900 text-xs">
                        {formatRupiahMohat(item.feeTotal)}
                      </td>

                      {/* Status Klaim */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            requestAdminAction(() => {
                              handleToggleStatus(item.id);
                            }, 'Ubah Status Klaim Kupon Mohat');
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            item.status === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Klik untuk mengubah status klaim"
                        >
                          {item.status}
                        </button>
                      </td>

                      {/* AKSI: Edit, Cetak Ulang Struk & Hapus */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Edit Kupon (✏️ Terproteksi PIN) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditAuth(item)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white rounded-lg border border-amber-200 transition cursor-pointer shadow-2xs group"
                            title="Edit Data Kupon (Verifikasi PIN Supervisor)"
                          >
                            <Edit3 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          </button>

                          {/* Tombol Cetak Struk (🖨️) */}
                          <button
                            type="button"
                            onClick={() => handleSelectReprint(item)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg border border-emerald-200 transition cursor-pointer shadow-2xs group"
                            title="Cetak Struk Thermal (1 Halaman Terverifikasi Digital)"
                          >
                            <Printer className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => {
                              requestAdminAction(() => {
                                handleDeleteClick(item);
                              }, 'Hapus Data Kupon Mohat');
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
                            title="Hapus Data Kupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Cetak Struk Thermal */}
      <MohatThermalReceiptModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedKuponForPrint(null);
        }}
        kupon={selectedKuponForPrint}
        onPrintSuccess={() => {
          showToast('Perintah cetak struk thermal dikirim.');
          if (selectedKuponForPrint) {
            const updated = recordCouponReprinted(selectedKuponForPrint.id, selectedKuponForPrint);
            setAuditTrail(updated);
          }
        }}
      />

      {/* Modal Cetak & Ekspor Laporan PDF */}
      <MohatReportPdfModal
        isOpen={isPdfReportModalOpen}
        onClose={() => setIsPdfReportModalOpen(false)}
        kuponList={filteredKuponList.length > 0 ? filteredKuponList : kuponList}
        filterInfo={{
          search: searchQuery,
          kategori: filterKategori,
          penjamin: filterPenjamin,
          status: filterStatus
        }}
      />

      {/* Modal Audit Trail (20 Kupon Terakhir & Re-Print) */}
      <MohatAuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditTrail}
        onSelectReprint={handleSelectReprint}
      />

      {/* Modal Konfirmasi Hapus Kupon (In-App Dialog, bebas pemblokiran iframe) */}
      {kuponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative"
            role="dialog"
            aria-modal="true"
          >
            {/* Tombol Close */}
            <button
              type="button"
              onClick={() => setKuponToDelete(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Tutup dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="pr-6">
                <h3 className="text-base font-bold text-slate-900">Hapus Data Kupon Fee?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Apakah Anda yakin ingin menghapus kupon ini? Data yang dihapus tidak dapat dipulihkan.
                </p>
              </div>
            </div>

            {/* Rincian Kupon yang Akan Dihapus */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nomor Kupon:</span>
                <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {kuponToDelete.nomorKupon}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nama Pasien Ranap:</span>
                <span className="font-bold text-slate-900">{kuponToDelete.namaPasien}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kategori / Penjamin:</span>
                <span className="text-slate-700 font-medium">
                  {kuponToDelete.kategori === 'PKM' ? 'PKM / Faskes 1' : 'Desa / Mohat'} • {getPenjaminDisplayLabel(kuponToDelete.penjamin)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Perujuk:</span>
                <span className="text-slate-800 font-semibold">{kuponToDelete.namaPerujuk}</span>
              </div>
              {kuponToDelete.namaSopir && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sopir:</span>
                  <span className="text-slate-700">{kuponToDelete.namaSopir}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-1">
                <span className="text-slate-600 font-bold">Total Fee:</span>
                <span className="font-black text-emerald-800 text-sm">{formatRupiahMohat(kuponToDelete.feeTotal)}</span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setKuponToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-98"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Kupon</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL VERIFIKASI KEAMANAN PIN SUPERVISOR                                */}
      {/* ========================================================================= */}
      {isAuthModalOpen && selectedKuponToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => {
                setIsAuthModalOpen(false);
                setSelectedKuponToEdit(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Tutup dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 mt-0.5 border border-amber-200">
                <Lock className="w-5 h-5" />
              </div>
              <div className="pr-6">
                <h3 className="text-base font-bold text-slate-900">Verifikasi Keamanan Edit Data</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan PIN / Kata Sandi Supervisor untuk mengedit riwayat kupon fee perujuk.
                </p>
              </div>
            </div>

            {/* Target Kupon Info */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nomor Kupon:</span>
                <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedKuponToEdit.nomorKupon}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-slate-500">Pasien:</span>
                <span className="font-bold text-slate-900">{selectedKuponToEdit.namaPasien}</span>
              </div>
            </div>

            <form onSubmit={handleVerifyEditPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN / Kata Sandi Supervisor
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    autoFocus
                    required
                    value={editPinInput}
                    onChange={(e) => {
                      setEditPinInput(e.target.value);
                      setAuthErrorMessage('');
                    }}
                    placeholder="Masukkan PIN otorisasi (default: 1234)"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>
                {authErrorMessage ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authErrorMessage}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Gunakan PIN keamanan supervisor atau default <strong>1234</strong>.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setSelectedKuponToEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005d42] hover:bg-[#004a35] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verifikasi PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL FORM EDIT DATA KUPON FEE PERUJUK                                 */}
      {/* ========================================================================= */}
      {isEditDataModalOpen && selectedKuponToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative my-8"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => {
                setIsEditDataModalOpen(false);
                setSelectedKuponToEdit(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Tutup dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 mb-4 pb-3 border-b border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5 border border-emerald-200">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Edit Data Riwayat Kupon Fee</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                    {editNomorKupon}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah rincian pasien, kategori rujukan, nama perujuk, nominal fee, atau status klaim.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditKupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tanggal Masuk */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    required
                    value={editTanggalMasuk}
                    onChange={(e) => setEditTanggalMasuk(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>

                {/* Nama Pasien Ranap */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Pasien Ranap *</label>
                  <input
                    type="text"
                    required
                    value={editNamaPasien}
                    onChange={(e) => setEditNamaPasien(e.target.value)}
                    placeholder="Nama Lengkap Pasien"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>
              </div>

              {/* Kategori & Penjamin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori Perujuk</label>
                  <select
                    value={editKategori}
                    onChange={(e) => handleEditKategoriOrPenjaminChange(e.target.value as KategoriPerujuk, editPenjamin)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  >
                    <option value="PKM">PKM / Puskesmas / Faskes 1</option>
                    <option value="MOHAT">Mohat / Rujukan Desa Mandiri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Penjamin / Asuransi</label>
                  <select
                    value={editPenjamin}
                    onChange={(e) => handleEditKategoriOrPenjaminChange(editKategori, e.target.value as PenjaminKupon)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  >
                    <option value="UMUM">Pasien UMUM</option>
                    <option value="BPJS_JR_ASURANSI">BPJS / Jasa Raharja / Asuransi</option>
                  </select>
                </div>
              </div>

              {/* Perujuk & Sopir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {editKategori === 'PKM' ? 'Nama Perawat / Bidan' : 'Nama Sopir / Pengantar'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNamaPerujuk}
                    onChange={(e) => setEditNamaPerujuk(e.target.value)}
                    placeholder={editKategori === 'PKM' ? 'Nama Bidan / Perawat' : 'Nama Pengantar Desa'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>

                {editKategori === 'PKM' ? (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nama Sopir PKM</label>
                    <input
                      type="text"
                      value={editNamaSopir}
                      onChange={(e) => setEditNamaSopir(e.target.value)}
                      placeholder="Nama Sopir Ambulance PKM"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">No. HP Pengantar Mohat</label>
                    <input
                      type="tel"
                      value={editNoHpPengantar}
                      onChange={(e) => setEditNoHpPengantar(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                    />
                  </div>
                )}
              </div>

              {/* Rincian Fee & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-emerald-950 font-bold mb-1">Total Fee (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={editFeeTotal}
                    onChange={(e) => setEditFeeTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>

                <div>
                  <label className="block text-emerald-950 font-bold mb-1">Fee Perujuk (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editFeePerujuk}
                    onChange={(e) => setEditFeePerujuk(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>

                <div>
                  <label className="block text-emerald-950 font-bold mb-1">Fee Sopir (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editFeeSopir}
                    onChange={(e) => setEditFeeSopir(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>
              </div>

              {/* Status Klaim & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Klaim Pembayaran</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as StatusKlaimKupon)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  >
                    <option value="Menunggu Kasir">Menunggu Kasir</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    placeholder="Keterangan tambahan..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>
              </div>

              {/* Tombol Aksi Simpan */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDataModalOpen(false);
                    setSelectedKuponToEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#005d42] hover:bg-[#004a35] text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
