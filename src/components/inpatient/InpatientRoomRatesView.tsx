import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bed,
  Building2,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  Tv,
  Wind,
  Bath,
  Coffee,
  HeartPulse,
  Activity,
  UserCheck,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  Lock,
  Unlock,
  ShieldAlert,
  Printer,
  Share2,
  MessageCircle,
  FileDown
} from 'lucide-react';
import { InpatientRoom, RoomCategoryFilter } from '../../types/inpatientRoomTypes';
import { INITIAL_INPATIENT_ROOMS, loadInpatientRooms, saveInpatientRooms, loadInpatientRoomsFromIdb } from '../../data/inpatientRoomData';
import { compressImage } from '../../utils/imageCompressor';
import { EditRoomModal } from './EditRoomModal';
import { PasswordLockModal } from './PasswordLockModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { DownloadRoomCardImageModal } from './DownloadRoomCardImageModal';
import { RSUMB_LOGO_BASE64 } from '../../assets/logoRsumbBase64';

interface InpatientRoomRatesViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const InpatientRoomRatesView: React.FC<InpatientRoomRatesViewProps> = ({
  showToast
}) => {
  const [rooms, setRooms] = useState<InpatientRoom[]>(() => loadInpatientRooms());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RoomCategoryFilter>('Semuanya');
  const [selectedPavilion, setSelectedPavilion] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<InpatientRoom | null>(null);
  const [quickUploadRoomId, setQuickUploadRoomId] = useState<string | null>(null);

  // Password Lock & Authorization States
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pendingActionTitle, setPendingActionTitle] = useState('perubahan data kamar');

  // Bilah Aksi Ekspor & Cetak States
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetRoomId, setWhatsAppTargetRoomId] = useState<string | null>(null);
  const [isDownloadImageModalOpen, setIsDownloadImageModalOpen] = useState(false);
  const [downloadImageTargetRoomId, setDownloadImageTargetRoomId] = useState<string | null>(null);

  const handlePrint = () => {
    if (showToast) {
      showToast('Menyiapkan pratinjau cetak PDF bersih resmi RSUMB...', 'info');
    }
    window.print();
  };

  // Protected Action Wrapper
  const executeProtectedAction = (action: () => void, actionTitle: string) => {
    if (isAdminUnlocked) {
      action();
    } else {
      setPendingAction(() => action);
      setPendingActionTitle(actionTitle);
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSuccess = () => {
    setIsAdminUnlocked(true);
    if (showToast) showToast('Verifikasi otorisasi berhasil! Mode editor tarif diaktifkan.', 'success');
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleLockSession = () => {
    setIsAdminUnlocked(false);
    if (showToast) showToast('Akses tarif dikunci kembali ke mode Read-Only.', 'info');
  };

  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Pavilions list
  const pavilions = useMemo(() => {
    const set = new Set(rooms.map((r) => r.pavilion));
    return Array.from(set);
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Category filter
      if (selectedCategory !== 'Semuanya') {
        if (selectedCategory === 'VVIP/VIP' && room.category !== 'VVIP/VIP') return false;
        if (selectedCategory === 'Kelas 1-3' && room.category !== 'Kelas 1-3') return false;
        if (selectedCategory === 'Intensif/Isolasi' && room.category !== 'Intensif/Isolasi') return false;
      }

      // Pavilion filter
      if (selectedPavilion !== 'ALL' && room.pavilion !== selectedPavilion) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = room.name.toLowerCase().includes(query);
        const matchPavilion = room.pavilion.toLowerCase().includes(query);
        const matchClass = room.classLevel.toLowerCase().includes(query);
        const matchFacilities = room.patientRoomFacilities.some((f) =>
          f.toLowerCase().includes(query)
        );
        const matchFamily = room.familyRoomFacilities?.some((f) =>
          f.toLowerCase().includes(query)
        );
        if (!matchName && !matchPavilion && !matchClass && !matchFacilities && !matchFamily) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, selectedCategory, selectedPavilion, searchTerm]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((acc, r) => acc + r.totalBeds, 0);
    const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
    const availableBeds = rooms.reduce((acc, r) => acc + r.availableBeds, 0);
    const bor = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return { totalRooms, totalBeds, occupiedBeds, availableBeds, bor };
  }, [rooms]);

  // Save changes
  const handleSaveRoom = (savedRoom: InpatientRoom) => {
    let updated: InpatientRoom[];
    const exists = rooms.some((r) => r.id === savedRoom.id);
    if (exists) {
      updated = rooms.map((r) => (r.id === savedRoom.id ? savedRoom : r));
      if (showToast) showToast(`Tarif dan fasilitas ${savedRoom.name} berhasil diperbarui`, 'success');
    } else {
      updated = [savedRoom, ...rooms];
      if (showToast) showToast(`Kelas kamar ${savedRoom.name} berhasil ditambahkan`, 'success');
    }
    setRooms(updated);
    saveInpatientRooms(updated);
  };

  // Delete Room
  const handleDeleteRoom = (room: InpatientRoom) => {
    const updated = rooms.filter((r) => r.id !== room.id);
    setRooms(updated);
    saveInpatientRooms(updated);
    if (showToast) showToast(`Kamar ${room.name} telah dihapus`, 'info');
  };

  // Reset to default seed catalog
  const handleResetCatalog = () => {
    setRooms(INITIAL_INPATIENT_ROOMS);
    saveInpatientRooms(INITIAL_INPATIENT_ROOMS);
    if (showToast) showToast('Katalog tarif kamar dikembalikan ke standar resmi RSUMB', 'success');
  };

  // Quick photo upload from card
  const handleTriggerQuickUpload = (roomId: string) => {
    setQuickUploadRoomId(roomId);
    quickFileInputRef.current?.click();
  };

  // Hydrate full resolution photos from IndexedDB if available
  useEffect(() => {
    loadInpatientRoomsFromIdb().then((idbRooms) => {
      if (idbRooms && Array.isArray(idbRooms) && idbRooms.length > 0) {
        setRooms((prev) => {
          let hasChange = false;
          const merged = prev.map((curr) => {
            const match = idbRooms.find((r) => r.id === curr.id);
            if (match && match.imageUrl && (!curr.imageUrl || curr.imageUrl.length < match.imageUrl.length)) {
              hasChange = true;
              return { ...curr, imageUrl: match.imageUrl };
            }
            return curr;
          });
          return hasChange ? merged : prev;
        });
      }
    });
  }, []);

  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !quickUploadRoomId) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Harap pilih berkas gambar valid', 'error');
      return;
    }

    try {
      if (showToast) showToast('Mengompresi foto ruangan...', 'info');
      const compressed = await compressImage(file, 900, 675, 0.76);
      const updated = rooms.map((r) =>
        r.id === quickUploadRoomId ? { ...r, imageUrl: compressed } : r
      );
      setRooms(updated);
      saveInpatientRooms(updated);
      if (showToast) showToast('Foto ruangan berhasil diunggah & dioptimalkan', 'success');
    } catch (err) {
      console.warn('Gagal memproses foto ruangan:', err);
      if (showToast) showToast('Gagal memproses foto ruangan', 'error');
    } finally {
      setQuickUploadRoomId(null);
      e.target.value = '';
    }
  };

  // Format IDR Currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Class badge color helper
  const getClassBadgeStyle = (cls: string) => {
    switch (cls.toUpperCase()) {
      case 'VVIP':
        return 'bg-amber-500/15 text-amber-900 border-amber-300 font-extrabold';
      case 'VIP':
        return 'bg-emerald-500/15 text-emerald-900 border-emerald-300 font-bold';
      case 'KELAS I':
      case 'KELAS 1':
        return 'bg-blue-500/15 text-blue-900 border-blue-300 font-bold';
      case 'KELAS II':
      case 'KELAS 2':
        return 'bg-teal-500/15 text-teal-900 border-teal-300 font-bold';
      case 'KELAS III':
      case 'KELAS 3':
        return 'bg-slate-200 text-slate-800 border-slate-300 font-medium';
      case 'ICU':
      case 'NICU':
        return 'bg-rose-500/15 text-rose-900 border-rose-300 font-extrabold';
      case 'ISOLASI':
        return 'bg-purple-500/15 text-purple-900 border-purple-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Quick Card Photo Upload */}
      <input
        type="file"
        ref={quickFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleQuickFileChange}
      />

      {/* 1. Header Hero Bar */}
      <div className="bg-gradient-to-r from-[#005d42] via-[#004732] to-emerald-950 text-white rounded-2xl p-5 sm:p-7 shadow-lg shadow-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-5 print:hidden no-print">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
            <Bed className="w-3.5 h-3.5" />
            <span>SIMRS RSUMB • Layanan Rawat Inap & Tarif Kamar</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Tarif Kamar Rawat Inap RSUMB
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Katalog resmi biaya sewa kamar per hari, jasa visite dokter umum & dokter spesialis, fasilitas ruangan, serta ketersediaan tempat tidur (bed) real-time.
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Status Mode Otorisasi / Read-Only */}
          {!isAdminUnlocked ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/25 border border-white/20 text-xs font-semibold text-amber-200">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Akses Read-Only (Terkunci)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-xs font-semibold text-emerald-100">
                <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                <span>Mode Editor Aktif</span>
              </div>
              <button
                type="button"
                onClick={handleLockSession}
                title="Kunci Akses Kembali"
                className="px-2.5 py-2 bg-black/35 hover:bg-black/55 border border-white/25 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-300" />
                <span>Kunci</span>
              </button>
            </div>
          )}

          {/* Tombol Utama: + Tambah Kelas Kamar (Protected) */}
          <button
            type="button"
            id="btn-add-room-rate"
            onClick={() => {
              executeProtectedAction(() => {
                setRoomToEdit(null);
                setIsEditModalOpen(true);
              }, 'menambah kelas kamar baru');
            }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>+ Tambah Kelas Kamar</span>
          </button>

          {/* Tombol Toggle View Mode */}
          <div className="flex items-center bg-white/15 p-1 rounded-xl border border-white/20">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#005d42] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#005d42] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Reset button (Protected) */}
          <button
            type="button"
            onClick={() => {
              executeProtectedAction(() => {
                handleResetCatalog();
              }, 'mereset katalog tarif kamar');
            }}
            title="Reset ke Katalog Bawaan (Otorisasi Diperlukan)"
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer border border-white/20"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Bilah Aksi Ekspor & Cetak (Export Action Bar) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-[#005d42] border border-emerald-100/80 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Bilah Aksi Ekspor, Cetak & Layanan Pasien</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                Resmi RSUMB
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Cetak katalog resmi PDF bersih, kirim ringkasan ke WhatsApp pasien, atau unduh gambar kartu tarif kamar HD.
            </p>
          </div>
        </div>

        {/* Tombol-Tombol Aksi di Header */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* [ 🖨️ Cetak / Print PDF ] */}
          <button
            type="button"
            id="btn-print-rates-pdf"
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300/90 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            title="Cetak PDF / Print Bersih Katalog Tarif Kamar RSUMB (CSS @media print)"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>🖨️ Cetak / Print PDF</span>
          </button>

          {/* [ 📲 Kirim Ringkasan ke WhatsApp ] */}
          <button
            type="button"
            id="btn-send-whatsapp-summary"
            onClick={() => {
              setWhatsAppTargetRoomId(null);
              setIsWhatsAppModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
            title="Kirim rincian tarif kamar & fasilitas langsung ke nomor WhatsApp pasien"
          >
            <MessageCircle className="w-4 h-4 text-white" />
            <span>📲 Kirim Ringkasan ke WhatsApp</span>
          </button>

          {/* [ 🖼️ Download Image (Kartu WA) ] */}
          <button
            type="button"
            id="btn-download-image-card"
            onClick={() => {
              setDownloadImageTargetRoomId(null);
              setIsDownloadImageModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 active:from-teal-700 active:to-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
            title="Download gambar PNG kartu tarif HD untuk dikirim ke WhatsApp (html2canvas)"
          >
            <ImageIcon className="w-4 h-4 text-teal-100" />
            <span>🖼️ Download Image (Kartu WA)</span>
          </button>
        </div>
      </div>

      {/* 3. Quick Stat Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-[#005d42] rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Kelas Kamar
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {stats.totalRooms} <span className="text-xs font-normal text-slate-500">Unit</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Kapasitas Bed
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {stats.totalBeds} <span className="text-xs font-normal text-slate-500">Tempat Tidur</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bed Terisi (BOR {stats.bor}%)
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {stats.occupiedBeds} <span className="text-xs font-normal text-amber-700">Pasien</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bed Tersedia (Siap)
            </div>
            <div className="text-xl font-extrabold text-emerald-800 mt-0.5">
              {stats.availableBeds} <span className="text-xs font-normal text-emerald-600">Kosong</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search Bar, Dropdown & Filter Kategori Cepat */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-inpatient-rooms"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama kamar, gedung, kelas (VVIP/VIP/Kelas 1), atau fasilitas..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Pavilion Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pl-1">
              <Building2 className="w-3.5 h-3.5 text-[#005d42]" />
              <span className="hidden sm:inline">Paviliun:</span>
            </div>
            <select
              value={selectedPavilion}
              onChange={(e) => setSelectedPavilion(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Paviliun / Gedung</option>
              {pavilions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Kategori Pills: [ Semuanya ] [ VVIP/VIP ] [ Kelas 1-3 ] [ Intensif/Isolasi ] */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#005d42]" />
            Kategori:
          </span>
          {(['Semuanya', 'VVIP/VIP', 'Kelas 1-3', 'Intensif/Isolasi'] as RoomCategoryFilter[]).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#005d42] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat === 'Semuanya'
                    ? rooms.length
                    : rooms.filter((r) => r.category === cat).length}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 4. Display Content: Cards Grid View vs Table View */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Tidak ada kamar yang sesuai
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba sesuaikan kata kunci pencarian atau ubah filter kategori kamar rawat inap.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Semuanya');
              setSelectedPavilion('ALL');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const occupancyRate =
              room.totalBeds > 0 ? Math.round((room.occupiedBeds / room.totalBeds) * 100) : 0;
            const isAvailable = room.availableBeds > 0;

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Image / Header Photo Slot */}
                <div className="relative h-44 bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950 overflow-hidden group/photo">
                  {room.imageUrl ? (
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center bg-radial from-slate-800 to-slate-950">
                      <div className="p-3 rounded-2xl bg-white/10 text-emerald-300 mb-2">
                        <Bed className="w-8 h-8" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        {room.name}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {room.pavilion}
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay for badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Bar Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs border shadow-xs backdrop-blur-xs ${getClassBadgeStyle(
                        room.classLevel
                      )}`}
                    >
                      {room.classLevel}
                    </span>

                    {/* Quick Photo Upload Button on hover (Protected) */}
                    <button
                      type="button"
                      onClick={() => {
                        executeProtectedAction(() => {
                          handleTriggerQuickUpload(room.id);
                        }, `mengunggah foto ruangan ${room.name}`);
                      }}
                      title="Unggah / Ganti Foto Ruangan"
                      className="px-2.5 py-1 bg-black/60 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 backdrop-blur-xs border border-white/20 transition-all cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{room.imageUrl ? 'Ganti Foto' : 'Upload Foto'}</span>
                    </button>
                  </div>

                  {/* Bottom Room Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                    <div className="text-[11px] font-semibold text-emerald-300">
                      {room.pavilion}
                    </div>
                    <div className="text-base font-bold text-white leading-snug drop-shadow-xs">
                      {room.name}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Price Banner */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Tarif Kamar
                      </span>
                      <span className="text-lg font-extrabold text-[#005d42]">
                        {formatRupiah(room.roomRatePerDay)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-1">/hari</span>
                    </div>

                    <div className="text-right border-l border-emerald-200 pl-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Visite Dokter
                      </span>
                      <div className="text-xs font-semibold text-slate-700">
                        Umum: <span className="font-bold text-slate-900">{formatRupiah(room.visiteGeneralDoctor)}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        Spesialis: <span className="font-bold text-slate-900">{formatRupiah(room.visiteSpecialistDoctor)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bed Capacity & Real-time Status */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-[#005d42]" />
                        Ketersediaan Bed:
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-red-100 text-red-900 border border-red-200'
                        }`}
                      >
                        {isAvailable ? `${room.availableBeds} Bed Tersedia` : 'Penuh'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          occupancyRate >= 90
                            ? 'bg-red-500'
                            : occupancyRate >= 70
                            ? 'bg-amber-500'
                            : 'bg-[#005d42]'
                        }`}
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Terisi: {room.occupiedBeds} bed</span>
                      <span>Total: {room.totalBeds} bed</span>
                    </div>
                  </div>

                  {/* Facilities list */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#005d42]" />
                      <span>Fasilitas Ruang Pasien:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {room.patientRoomFacilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-medium text-slate-700"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>

                    {/* Family Room facilities if present (e.g. VVIP) */}
                    {room.familyRoomFacilities && room.familyRoomFacilities.length > 0 && (
                      <div className="mt-2.5 p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-1">
                        <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                          <Coffee className="w-3 h-3 text-amber-700" />
                          <span>Fasilitas Ruang Penunggu Eksklusif:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {room.familyRoomFacilities.map((fac, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-white border border-amber-200 rounded text-[10.5px] font-semibold text-amber-800"
                            >
                              {fac}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {room.note && (
                      <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-2">
                        "{room.note}"
                      </p>
                    )}
                  </div>

                  {/* Card Actions (Protected) */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        executeProtectedAction(() => {
                          handleTriggerQuickUpload(room.id);
                        }, `mengunggah foto ruangan ${room.name}`);
                      }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Foto</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Tombol Cepat Kirim WA per Kamar */}
                      <button
                        type="button"
                        onClick={() => {
                          setWhatsAppTargetRoomId(room.id);
                          setIsWhatsAppModalOpen(true);
                        }}
                        title="Kirim rincian tarif kamar ini ke WhatsApp Pasien"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WA</span>
                      </button>

                      {/* Tombol Cepat Unduh Kartu Gambar PNG per Kamar */}
                      <button
                        type="button"
                        onClick={() => {
                          setDownloadImageTargetRoomId(room.id);
                          setIsDownloadImageModalOpen(true);
                        }}
                        title="Download gambar PNG kartu tarif kamar ini"
                        className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-xl transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          executeProtectedAction(() => {
                            setRoomToEdit(room);
                            setIsEditModalOpen(true);
                          }, `mengubah tarif & fasilitas ${room.name}`);
                        }}
                        className="px-3 py-1.5 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          executeProtectedAction(() => {
                            handleDeleteRoom(room);
                          }, `menghapus data kelas kamar ${room.name}`);
                        }}
                        title="Hapus Kelas Kamar"
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE DETAILED VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Kamar & Paviliun</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-4">Tarif / Hari</th>
                  <th className="py-3 px-4">Visite Dokter</th>
                  <th className="py-3 px-4">Kapasitas Bed</th>
                  <th className="py-3 px-4">Fasilitas Utama</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room) => {
                  const isAvailable = room.availableBeds > 0;
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{room.name}</div>
                        <div className="text-[11px] text-slate-500">{room.pavilion}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] border ${getClassBadgeStyle(
                            room.classLevel
                          )}`}
                        >
                          {room.classLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#005d42]">
                        {formatRupiah(room.roomRatePerDay)}
                        <span className="text-[10px] text-slate-400 block font-normal">/hari</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div>
                          <span className="text-slate-500">Umum:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {formatRupiah(room.visiteGeneralDoctor)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Spesialis:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {formatRupiah(room.visiteSpecialistDoctor)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {room.availableBeds} Siap
                          </span>
                          <span className="text-xs text-slate-500">
                            ({room.occupiedBeds}/{room.totalBeds})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-[11px] text-slate-600 line-clamp-2">
                          {room.patientRoomFacilities.join(', ')}
                        </div>
                        {room.familyRoomFacilities && (
                          <div className="text-[10.5px] text-amber-700 font-medium line-clamp-1 mt-0.5">
                            Penunggu: {room.familyRoomFacilities.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick WA Table button */}
                          <button
                            type="button"
                            onClick={() => {
                              setWhatsAppTargetRoomId(room.id);
                              setIsWhatsAppModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="Kirim ke WhatsApp Pasien"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Quick Download Image Table button */}
                          <button
                            type="button"
                            onClick={() => {
                              setDownloadImageTargetRoomId(room.id);
                              setIsDownloadImageModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-teal-50 text-teal-700 rounded-lg transition-colors cursor-pointer"
                            title="Download Gambar Kartu Tarif (PNG)"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              executeProtectedAction(() => {
                                setRoomToEdit(room);
                                setIsEditModalOpen(true);
                              }, `mengubah tarif & fasilitas ${room.name}`);
                            }}
                            className="p-1.5 hover:bg-emerald-50 text-[#005d42] rounded-lg transition-colors cursor-pointer"
                            title="Edit Tarif"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              executeProtectedAction(() => {
                                handleDeleteRoom(room);
                              }, `menghapus data kelas kamar ${room.name}`);
                            }}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Tampilan Cetak Resmi Bersih (@media print via .print-inpatient-container) */}
      <div className="print-inpatient-container hidden print:block text-slate-900 font-sans p-4 bg-white">
        {/* Kop Surat Resmi RSUMB */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-emerald-900">
          <div className="flex items-center gap-3.5">
            <img
              src={RSUMB_LOGO_BASE64}
              alt="Logo RSUMB"
              className="w-16 h-16 object-contain shrink-0"
            />
            <div>
              <div className="text-base font-black tracking-wide text-emerald-950 uppercase leading-tight">
                RUMAH SAKIT UMUM MUHAMMADIYAH BABAT
              </div>
              <div className="text-[11px] text-slate-700 leading-tight mt-0.5">
                Jl. KH. Ahmad Dahlan No. 14, Babat, Lamongan, Jawa Timur | Telp: (0322) 451121
              </div>
              <div className="text-[10.5px] text-slate-600">
                Hotline Admisi / IGD 24 Jam: 0812-3456-7890 | Website: rsumbabat.com
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-black text-[10px] tracking-wider uppercase border border-emerald-300">
              DOKUMEN RESMI
            </div>
            <div className="text-[9.5px] text-slate-500 mt-1">
              SIMRS RSUMB
            </div>
          </div>
        </div>

        {/* Judul Laporan */}
        <div className="text-center my-3">
          <h2 className="text-sm font-black uppercase text-slate-900 tracking-wide">
            DAFTAR TARIF SEWA KAMAR RAWAT INAP & JASA VISITE DOKTER
          </h2>
          <p className="text-[10.5px] text-slate-600 mt-0.5">
            Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} pk {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </p>
        </div>

        {/* Tabel Cetak Bersih */}
        <table className="w-full text-[10px] border-collapse border border-slate-300 my-3">
          <thead>
            <tr className="bg-emerald-800 text-white font-bold">
              <th className="border border-slate-300 p-1.5 text-center w-8">No.</th>
              <th className="border border-slate-300 p-1.5 text-left">Paviliun / Gedung</th>
              <th className="border border-slate-300 p-1.5 text-left">Kelas & Nama Ruangan</th>
              <th className="border border-slate-300 p-1.5 text-right">Tarif Kamar/Hari</th>
              <th className="border border-slate-300 p-1.5 text-right">Visite dr. Umum</th>
              <th className="border border-slate-300 p-1.5 text-right">Visite dr. Spesialis</th>
              <th className="border border-slate-300 p-1.5 text-center">Bed (Siap/Total)</th>
              <th className="border border-slate-300 p-1.5 text-left">Fasilitas Utama Ruangan</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room, idx) => (
              <tr key={room.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 p-1.5 text-center font-medium">{idx + 1}</td>
                <td className="border border-slate-300 p-1.5 font-semibold text-slate-800">{room.pavilion}</td>
                <td className="border border-slate-300 p-1.5">
                  <span className="font-bold text-slate-900">{room.name}</span>
                  <span className="text-[9px] text-emerald-800 font-semibold block uppercase">Kelas: {room.classLevel}</span>
                </td>
                <td className="border border-slate-300 p-1.5 text-right font-black text-emerald-950">
                  {formatRupiah(room.roomRatePerDay)}
                </td>
                <td className="border border-slate-300 p-1.5 text-right font-medium">
                  {formatRupiah(room.visiteGeneralDoctor)}
                </td>
                <td className="border border-slate-300 p-1.5 text-right font-medium">
                  {formatRupiah(room.visiteSpecialistDoctor)}
                </td>
                <td className="border border-slate-300 p-1.5 text-center font-semibold">
                  {room.availableBeds} / {room.totalBeds}
                </td>
                <td className="border border-slate-300 p-1.5 text-[9.5px] text-slate-700">
                  {room.patientRoomFacilities.join(', ')}
                  {room.familyRoomFacilities && room.familyRoomFacilities.length > 0 && (
                    <span className="block italic text-amber-900 font-normal mt-0.5">
                      Ruang Penunggu: {room.familyRoomFacilities.join(', ')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Catatan & Tanda Tangan */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex items-start justify-between text-[9.5px] text-slate-600">
          <div className="max-w-md space-y-0.5">
            <p className="font-bold text-slate-800">Catatan:</p>
            <p>1. Tarif sewa kamar dihitung per hari rawat inap dan belum termasuk obat, alat kesehatan, serta tindakan medis.</p>
            <p>2. Ketersediaan tempat tidur (bed) dapat berubah sewaktu-waktu sesuai pergerakan pasien masuk dan keluar.</p>
            <p>3. Informasi pemesanan & konfirmasi kamar hubungi Bagian Admisi di nomor 0812-3456-7890 / (0322) 451121.</p>
          </div>

          <div className="text-center w-52 space-y-12">
            <div>
              <p>Babat, Lamongan</p>
              <p className="font-bold text-slate-800">Petugas Admisi / Kasir RSUMB,</p>
            </div>
            <div>
              <p className="font-bold underline text-slate-900">( ............................................ )</p>
              <p className="text-[9px] text-slate-500">Unit Pelayanan Rawat Inap</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Lock Verification Modal */}
      <PasswordLockModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handlePasswordSuccess}
        actionTitle={pendingActionTitle}
      />

      {/* Edit / Add Room Modal */}
      <EditRoomModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setRoomToEdit(null);
        }}
        roomToEdit={roomToEdit}
        onSave={handleSaveRoom}
      />

      {/* WhatsApp Share Summary Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setWhatsAppTargetRoomId(null);
        }}
        rooms={rooms}
        initialSelectedRoomId={whatsAppTargetRoomId}
        showToast={showToast}
      />

      {/* Download Room Card Image Modal */}
      <DownloadRoomCardImageModal
        isOpen={isDownloadImageModalOpen}
        onClose={() => {
          setIsDownloadImageModalOpen(false);
          setDownloadImageTargetRoomId(null);
        }}
        rooms={rooms}
        initialSelectedRoomId={downloadImageTargetRoomId}
        showToast={showToast}
      />
    </div>
  );
};
