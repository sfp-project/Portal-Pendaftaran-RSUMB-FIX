import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderArchive,
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  Filter,
  X,
  Calendar,
  AlertCircle,
  HardDrive,
  Check,
  Eye,
  Printer,
  Lock,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon,
  Cloud
} from 'lucide-react';
import {
  MasterDocumentItem
} from '../types/documentRepositoryTypes';
import {
  loadMasterDocuments,
  saveMasterDocuments,
  loadStoredCategories,
  saveStoredCategories,
  formatUploadDate
} from '../data/documentRepositoryData';
import {
  PosterPromoItem
} from '../types/posterPromoTypes';
import {
  loadMasterPosters,
  saveMasterPosters
} from '../data/posterPromoData';
import { PosterGalleryView } from './letters/PosterGalleryView';
import {
  MedicalLetterItem,
  LetterType,
  LetterCategory
} from '../types/letterTypes';
import {
  getLetterTypeLabel,
  getCategoryForType,
  loadMedicalLetters,
  saveMedicalLetters
} from '../data/letterData';
import {
  generateMedicalLetterPDF,
  formatIndonesianDate
} from '../utils/letterPdfGenerator';
import { UploadDocumentModal } from './letters/UploadDocumentModal';
import { DocumentPreviewModal } from './letters/DocumentPreviewModal';
import { AutoNumberedLetterModal } from './letters/AutoNumberedLetterModal';
import { LetterPrintPreviewModal } from './letters/LetterPrintPreviewModal';

interface MedicalLettersViewProps {
  showToast: (msg: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  letters?: MedicalLetterItem[];
  onAddLetter?: (letter: MedicalLetterItem) => void;
  onUpdateLetter?: (letter: MedicalLetterItem) => void;
  onDeleteLetter?: (id: string) => void;
}

export const MedicalLettersView: React.FC<MedicalLettersViewProps> = ({
  showToast,
  letters = [],
  onAddLetter,
  onDeleteLetter
}) => {
  // Module selection: 'REPOSITORY' (Bank Dokumen Master), 'POSTERS' (Poster Layanan & Promo) vs 'AUTO_GEN' (Pembuatan Surat Otomatis)
  const [activeModule, setActiveModule] = useState<'REPOSITORY' | 'POSTERS' | 'AUTO_GEN'>('REPOSITORY');

  // =========================================================================
  // STATE 1: REPOSITORY DOKUMEN MASTER (.DOCX / .PDF)
  // =========================================================================
  const [documents, setDocuments] = useState<MasterDocumentItem[]>(() => {
    return loadMasterDocuments();
  });
  const [categories, setCategories] = useState<string[]>(() => {
    return loadStoredCategories();
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [newCatError, setNewCatError] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<MasterDocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<MasterDocumentItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    saveMasterDocuments(documents);
  }, [documents]);

  // =========================================================================
  // STATE 2: POSTER LAYANAN & PROMO RSUMB
  // =========================================================================
  const [posters, setPosters] = useState<PosterPromoItem[]>(() => {
    return loadMasterPosters();
  });

  const handleUploadPoster = (newPoster: PosterPromoItem) => {
    const updated = [newPoster, ...posters];
    setPosters(updated);
    saveMasterPosters(updated);
  };

  const handleDeletePoster = (id: string) => {
    const updated = posters.filter((p) => p.id !== id);
    setPosters(updated);
    saveMasterPosters(updated);
  };

  // =========================================================================
  // STATE 2: SURAT RESMI OTOMATIS (SKBN & SURAT BAKU)
  // =========================================================================
  const [isAutoLetterModalOpen, setIsAutoLetterModalOpen] = useState(false);
  const [defaultLetterType, setDefaultLetterType] = useState<LetterType>('SKBN');
  const [selectedLetterForPrint, setSelectedLetterForPrint] = useState<MedicalLetterItem | null>(null);
  const [isPrintPreviewModalOpen, setIsPrintPreviewModalOpen] = useState(false);
  const [searchLetterQuery, setSearchLetterQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | LetterType>('ALL');
  const [letterToDelete, setLetterToDelete] = useState<MedicalLetterItem | null>(null);

  // Fallback letters list
  const activeLettersList = useMemo(() => {
    if (letters && letters.length > 0) return letters;
    return loadMedicalLetters();
  }, [letters]);

  // Filtered Letters list
  const filteredLetters = useMemo(() => {
    const q = searchLetterQuery.toLowerCase().trim();
    return activeLettersList.filter((item) => {
      // Filter by type
      if (selectedTypeFilter !== 'ALL' && item.jenisSurat !== selectedTypeFilter) {
        return false;
      }
      // Search query
      if (q) {
        const matchNo = (item.nomorSurat || '').toLowerCase().includes(q);
        const matchNama = (item.namaPasien || '').toLowerCase().includes(q);
        const matchRm = (item.noRm || '').toLowerCase().includes(q);
        const matchKeperluan = (item.keperluan || '').toLowerCase().includes(q);
        const matchDokter = (item.dokterNama || '').toLowerCase().includes(q);
        const matchAlamat = (item.alamat || '').toLowerCase().includes(q);
        return matchNo || matchNama || matchRm || matchKeperluan || matchDokter || matchAlamat;
      }
      return true;
    });
  }, [activeLettersList, selectedTypeFilter, searchLetterQuery]);

  // Handler: Save and Print from AutoNumberedLetterModal
  const handleSaveAndPrintLetter = (savedLetter: MedicalLetterItem) => {
    if (onAddLetter) {
      onAddLetter(savedLetter);
    } else {
      const updated = [savedLetter, ...activeLettersList];
      saveMedicalLetters(updated);
    }

    setIsAutoLetterModalOpen(false);
    showToast(`Surat resmi No. ${savedLetter.nomorSurat} berhasil dibuat, dikunci & disimpan!`);

    // Langsung buka modal cetak resmi / unduh PDF
    setSelectedLetterForPrint(savedLetter);
    setIsPrintPreviewModalOpen(true);
  };

  // Handler: Buka Print Modal
  const handleOpenPrintPreview = (letter: MedicalLetterItem) => {
    setSelectedLetterForPrint(letter);
    setIsPrintPreviewModalOpen(true);
  };

  // Handler: Unduh PDF Langsung
  const handleDownloadLetterPdf = async (letter: MedicalLetterItem) => {
    try {
      showToast(`Menyiapkan berkas PDF resmi: ${letter.nomorSurat}...`);
      await generateMedicalLetterPDF(letter);
      showToast(`Berkas PDF resmi ${letter.nomorSurat} berhasil diunduh!`);
    } catch (err: any) {
      console.error('Download PDF error:', err);
      showToast(`Gagal mengunduh PDF: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // Handler: Hapus Surat
  const handleConfirmDeleteLetter = () => {
    if (!letterToDelete) return;
    const no = letterToDelete.nomorSurat;
    if (onDeleteLetter) {
      onDeleteLetter(letterToDelete.id);
    } else {
      const updated = activeLettersList.filter((l) => l.id !== letterToDelete.id);
      saveMedicalLetters(updated);
    }
    setLetterToDelete(null);
    showToast(`Dokumen surat ${no} berhasil dihapus.`);
  };

  // =========================================================================
  // HANDLER REPOSITORY
  // =========================================================================
  const handleAddCategory = (newCategory: string) => {
    const clean = newCategory.trim().toUpperCase();
    if (!clean) return;
    if (!categories.includes(clean)) {
      const updated = [...categories, clean];
      setCategories(updated);
      saveStoredCategories(updated);
      showToast(`Kategori "${clean}" berhasil ditambahkan.`);
    }
  };

  const handleSaveCategoryModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newCatInput.trim().toUpperCase();
    if (!clean) {
      setNewCatError('Nama kategori tidak boleh kosong.');
      return;
    }
    if (categories.includes(clean)) {
      setNewCatError('Kategori ini sudah terdaftar.');
      setSelectedCategory(clean);
      setIsAddCatModalOpen(false);
      setNewCatInput('');
      return;
    }
    handleAddCategory(clean);
    setSelectedCategory(clean);
    setIsAddCatModalOpen(false);
    setNewCatInput('');
    setNewCatError(null);
  };

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return documents.filter((doc) => {
      if (selectedCategory !== 'ALL' && (doc.kategori || '').toUpperCase() !== selectedCategory.toUpperCase()) {
        return false;
      }
      if (q) {
        const matchTitle = (doc.judul || '').toLowerCase().includes(q);
        const matchKategori = (doc.kategori || '').toLowerCase().includes(q);
        const matchKeterangan = (doc.keterangan || '').toLowerCase().includes(q);
        const matchFilename = (doc.namaBerkas || '').toLowerCase().includes(q);
        return matchTitle || matchKategori || matchKeterangan || matchFilename;
      }
      return true;
    });
  }, [documents, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: documents.length };
    categories.forEach((cat) => { counts[cat] = 0; });
    documents.forEach((d) => {
      const cat = (d.kategori || '').toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    // POSTER & PROMO category displays count of posters
    counts['POSTER & PROMO'] = posters.length;
    return counts;
  }, [documents, categories, posters.length]);

  const handleUploadNewDocument = (newDoc: MasterDocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleConfirmDelete = () => {
    if (!docToDelete) return;
    const title = docToDelete.judul;
    setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
    setDocToDelete(null);
    showToast(`Berkas master "${title}" berhasil dihapus.`);
  };

  const handleOpenPreview = (doc: MasterDocumentItem) => {
    setPreviewDoc(doc);
    setIsPreviewModalOpen(true);
  };

  const handleDownload = (doc: MasterDocumentItem) => {
    showToast(`Mengunduh berkas master: ${doc.namaBerkas || doc.judul}...`);
    try {
      if (doc.fileData) {
        const a = document.createElement('a');
        a.href = doc.fileData;
        a.download = doc.namaBerkas || `${doc.judul}.${doc.formatBerkas}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const mimeType = doc.formatBerkas === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const fileContent = `RSU MUHAMMADIYAH BABAT (RSUMB)\nDokumen Master: ${doc.judul}\nKategori: ${doc.kategori}\nFormat: .${doc.formatBerkas}\nTanggal: ${formatUploadDate(doc.tanggalDiunggah)}\nKeterangan: ${doc.keterangan}`;
        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.namaBerkas || `${doc.judul}.${doc.formatBerkas}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('Gagal memproses unduhan berkas.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Pusat Dokumen Master RSUMB */}
      <div className="bg-gradient-to-r from-[#005d42] via-[#004732] to-emerald-950 text-white rounded-2xl p-5 sm:p-7 shadow-lg shadow-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-5 print:hidden no-print">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>SIMRS RSUMB • Bank Dokumen Master & Surat Baku</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Pusat Dokumen Master RSUMB
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Sistem penyimpanan dan unduhan terpusat untuk form dan dokumen master RSUMB. Menyediakan fitur pembuatan surat dengan penomoran otomatis sebagai opsi tambahan.
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Tombol Utama (Primary): [ + Upload Berkas ] */}
          <button
            type="button"
            id="btn-upload-master-form"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>+ Upload Berkas</span>
          </button>

          {/* Tombol Sekunder (Secondary): [ 📝 Buat Surat (Auto-Nomor) ] */}
          <button
            type="button"
            id="btn-open-auto-letter-modal"
            onClick={() => {
              setDefaultLetterType('SKBN');
              setIsAutoLetterModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>📝 Buat Surat (Auto-Nomor)</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Segmented Switcher */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Tab 1: Bank Dokumen Master (Utama) */}
        <button
          type="button"
          onClick={() => setActiveModule('REPOSITORY')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeModule === 'REPOSITORY'
              ? 'bg-[#005d42] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>📄 Bank Dokumen Master (.docx / .pdf)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
              activeModule === 'REPOSITORY'
                ? 'bg-emerald-500/30 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {documents.length}
          </span>
        </button>

        {/* Tab 2: Poster Layanan & Promo (Sub-tab Baru) */}
        <button
          type="button"
          onClick={() => setActiveModule('POSTERS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeModule === 'POSTERS'
              ? 'bg-[#005d42] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>🖼️ Poster Layanan & Promo</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
              activeModule === 'POSTERS'
                ? 'bg-emerald-500/30 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {posters.length}
          </span>
        </button>

        {/* Tab 3: Pembuatan Surat Otomatis (Sekunder) */}
        <button
          type="button"
          onClick={() => setActiveModule('AUTO_GEN')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeModule === 'AUTO_GEN'
              ? 'bg-[#005d42] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>🖨️ Pembuatan Surat Otomatis</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
              activeModule === 'AUTO_GEN'
                ? 'bg-emerald-500/30 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {activeLettersList.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* MODUL 1: PEMBUATAN & RIWAYAT SURAT RESMI (AUTO-NOMOR) */}
      {/* ===================================================================== */}
      {activeModule === 'AUTO_GEN' && (
        <div className="space-y-5">
          {/* Card Alur Otomasi */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 border border-emerald-200/90 shadow-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#005d42] text-white rounded-lg shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Alur Otomasi Penomoran Surat Resmi RSUMB (Langsung di Web)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  Tidak perlu lagi mengedit nomor dan titik-titik secara manual di Microsoft Word.
                  Sistem membaca nomor urut terakhir, mengunci nomor ke database (+1), dan langsung memproduksi dokumen resmi ber-kop RSUMB siap cetak atau unduh PDF.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDefaultLetterType('SKBN');
                  setIsAutoLetterModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Dokumen / SKBN Baru</span>
              </button>
            </div>

            {/* 3 Steps Visual Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3.5 border-t border-emerald-100">
              <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                    1
                  </span>
                  <p className="font-bold text-xs text-slate-800">Input via Web Form</p>
                </div>
                <p className="text-[11px] text-slate-600">
                  Petugas hanya perlu mengisi data pasien (Nama, TTL, Alamat, Keperluan).
                </p>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                    2
                  </span>
                  <p className="font-bold text-xs text-slate-800">Nomor Terisi Otomatis (Read-Only)</p>
                </div>
                <p className="text-[11px] text-slate-600">
                  Nomor surat terisi otomatis dari database sesuai urutan terakhir dan terlindungi dari manipulasi manual.
                </p>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                    3
                  </span>
                  <p className="font-bold text-xs text-slate-800">Auto-Generate & Lock (+1)</p>
                </div>
                <p className="text-[11px] text-slate-600">
                  Klik [ 🖨️ Cetak / Simpan Document ], nomor terkunci ke database (+1), output rapi siap cetak & unduh PDF.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Riwayat Surat */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchLetterQuery}
                  onChange={(e) => setSearchLetterQuery(e.target.value)}
                  placeholder="Cari nomor surat resmi, nama pasien, No RM, keperluan, atau dokter..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
                />
                {searchLetterQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchLetterQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Type Dropdown Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#005d42]" />
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] cursor-pointer"
                >
                  <option value="ALL">Semua Jenis Dokumen ({activeLettersList.length})</option>
                  <option value="SKBN">SKBN (Bebas Narkoba 6 Parameter)</option>
                  <option value="SEHAT">Surat Keterangan Sehat</option>
                  <option value="DOKTER">Surat Keterangan Sakit / Dokter</option>
                  <option value="KUASA_JR">Surat Kuasa Jasa Raharja</option>
                  <option value="EDUKASI_OP2">Surat Edukasi Operasi Kedua</option>
                  <option value="BPJS_KK1">Form KK1 BPJS Ketenagakerjaan</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Filter Cepat:</span>
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'SKBN', label: 'SKBN' },
                { id: 'SEHAT', label: 'Surat Sehat' },
                { id: 'DOKTER', label: 'Surat Sakit' },
                { id: 'KUASA_JR', label: 'Jasa Raharja' },
                { id: 'BPJS_KK1', label: 'BPJS TK' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedTypeFilter(pill.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedTypeFilter === pill.id
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabel Surat Resmi Tergenerate */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  Daftar Surat Resmi Ber-Nomor Terkunci
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menampilkan {filteredLetters.length} dokumen tersimpan di database SIMRS RSUMB
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Total Tersimpan: {activeLettersList.length}
              </span>
            </div>

            {filteredLetters.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-sm text-slate-800">Belum Ada Dokumen yang Sesuai</h5>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Gunakan tombol "Buat Surat Baru (Auto-Nomor)" di atas untuk membuat dokumen SKBN atau surat baku lainnya.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDefaultLetterType('SKBN');
                    setIsAutoLetterModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  + Buat Surat Sekarang
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] text-slate-600 uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Nomor Dokumen Resmi</th>
                      <th className="py-3 px-4">Jenis Surat</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Identitas Pasien</th>
                      <th className="py-3 px-4">Keperluan</th>
                      <th className="py-3 px-4">Dokter DPJP</th>
                      <th className="py-3 px-4 text-center">Aksi Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLetters.map((letter) => (
                      <tr key={letter.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Nomor Surat */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-md font-mono text-[11px] font-bold">
                            <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>{letter.nomorSurat}</span>
                          </div>
                          {letter.noRm && (
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              No. RM: {letter.noRm}
                            </p>
                          )}
                        </td>

                        {/* Jenis Surat */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="font-semibold text-slate-800 block text-xs">
                            {getLetterTypeLabel(letter.jenisSurat)}
                          </span>
                          <span className="text-[10.5px] text-slate-400 capitalize">
                            Kategori: {letter.kategori}
                          </span>
                        </td>

                        {/* Tanggal */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-slate-600">
                          {formatIndonesianDate(letter.tanggalSurat)}
                        </td>

                        {/* Data Pasien */}
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-bold text-slate-900 text-xs">{letter.namaPasien}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {letter.tempatLahir}, {letter.tanggalLahir} ({letter.umur || '-'} th)
                          </p>
                          <p className="text-[10.5px] text-slate-400 truncate max-w-xs mt-0.5" title={letter.alamat}>
                            {letter.alamat}
                          </p>
                        </td>

                        {/* Keperluan */}
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          <p className="text-slate-700 text-xs line-clamp-2" title={letter.keperluan}>
                            {letter.keperluan}
                          </p>
                        </td>

                        {/* Dokter */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <p className="font-semibold text-slate-800 text-xs">{letter.dokterNama}</p>
                          <p className="text-[10.5px] text-slate-400 font-mono">SIP: {letter.dokterSip}</p>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Cetak A4 / Folio */}
                            <button
                              type="button"
                              onClick={() => handleOpenPrintPreview(letter)}
                              className="p-1.5 bg-[#005d42] hover:bg-[#004732] text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                              title="Cetak Dokumen Resmi (A4 / Folio)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Unduh PDF */}
                            <button
                              type="button"
                              onClick={() => handleDownloadLetterPdf(letter)}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                              title="Unduh Berkas PDF Resmi"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Lihat Pratinjau */}
                            <button
                              type="button"
                              onClick={() => handleOpenPrintPreview(letter)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Pratinjau Dokumen"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => setLetterToDelete(letter)}
                              className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODUL 2: BANK DOKUMEN MASTER (.DOCX / .PDF) */}
      {/* ===================================================================== */}
      {activeModule === 'REPOSITORY' && (
        <div className="space-y-5">
          {/* Pencarian & Filter Cepat Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  id="search-master-form"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama dokumen, kategori, keterangan, atau nama berkas..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pl-1">
                  <Filter className="w-3.5 h-3.5 text-[#005d42]" />
                  <span className="hidden sm:inline">Pilih:</span>
                </div>
                <select
                  id="filter-category-select"
                  value={selectedCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'POSTER & PROMO') {
                      setActiveModule('POSTERS');
                    } else {
                      setSelectedCategory(val);
                    }
                  }}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] cursor-pointer"
                >
                  <option value="ALL">
                    Semua Kategori {categoryCounts['ALL'] !== undefined ? `(${categoryCounts['ALL']})` : ''}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} {categoryCounts[cat] !== undefined ? `(${categoryCounts[cat]})` : '(0)'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  id="btn-add-new-category"
                  onClick={() => {
                    setIsAddCatModalOpen(true);
                    setNewCatInput('');
                    setNewCatError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#005d42] border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Kategori Baru</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Kategori Pills (REKAM MEDIS, BPJS KETENAGAKERJAAN, dll.) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#005d42]" />
                Filter Kategori:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#005d42] text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({categoryCounts['ALL'] || 0})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (cat === 'POSTER & PROMO') {
                      setActiveModule('POSTERS');
                    } else {
                      setSelectedCategory(cat);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#005d42] text-white shadow-xs font-bold'
                      : cat === 'POSTER & PROMO'
                      ? 'bg-emerald-50 text-[#005d42] hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'POSTER & PROMO' ? '🖼️ ' : ''}{cat} ({categoryCounts[cat] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Tabel Dokumen Master */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  Daftar Berkas Master Resmi SIMRS RSUMB
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menampilkan {filteredDocuments.length} berkas master resmi (.docx / .pdf)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1.5 bg-[#005d42] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                + Upload Berkas
              </button>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <FolderArchive className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-sm text-slate-800">Tidak Ada Dokumen Master</h5>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Belum ada dokumen master dalam kategori ini atau tidak cocok dengan kata kunci pencarian.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] text-slate-600 uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Nama Dokumen Master</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-4">Keterangan</th>
                      <th className="py-3 px-4">Tanggal Diunggah</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {doc.judul}
                          {doc.namaBerkas && (
                            <span className="block text-[11px] font-mono font-normal text-slate-400 mt-0.5">
                              {doc.namaBerkas}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {doc.kategori}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600 uppercase">
                          .{doc.formatBerkas}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {doc.keterangan || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatUploadDate(doc.tanggalDiunggah)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {doc.driveViewLink && (
                              <a
                                href={doc.driveViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                                title="Buka Berkas di Google Drive (/RSUMB_Portal_Files/)"
                              >
                                <Cloud className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(doc)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Pratinjau Berkas"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 bg-[#005d42] hover:bg-[#004732] text-white rounded-lg transition-colors cursor-pointer"
                              title="Unduh Berkas Master"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocToDelete(doc)}
                              className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Berkas Master"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODUL 3: POSTER LAYANAN & PROMO */}
      {/* ===================================================================== */}
      {activeModule === 'POSTERS' && (
        <PosterGalleryView
          posters={posters}
          onUploadPoster={handleUploadPoster}
          onDeletePoster={handleDeletePoster}
          showToast={showToast}
        />
      )}

      {/* ===================================================================== */}
      {/* MODALS */}
      {/* ===================================================================== */}
      {/* 1. Modal Form Pembuatan Surat Resmi Otomatis (SKBN & Surat Baku) */}
      <AutoNumberedLetterModal
        isOpen={isAutoLetterModalOpen}
        onClose={() => setIsAutoLetterModalOpen(false)}
        existingLetters={activeLettersList}
        onSaveAndPrint={handleSaveAndPrintLetter}
        defaultType={defaultLetterType}
      />

      {/* 2. Modal Pratinjau & Cetak Resmi (Print Preview) */}
      <LetterPrintPreviewModal
        isOpen={isPrintPreviewModalOpen}
        onClose={() => setIsPrintPreviewModalOpen(false)}
        letter={selectedLetterForPrint}
      />

      {/* 3. Modal Upload Form Baru Master */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        categories={categories}
        onUploadSuccess={handleUploadNewDocument}
        showToast={showToast}
      />

      {/* 4. Modal Pratinjau Dokumen Master */}
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        document={previewDoc}
        onDownload={handleDownload}
        showToast={showToast}
      />

      {/* 5. Modal Tambah Kategori Baru */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Tambah Kategori Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kategori Baru
                </label>
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => {
                    setNewCatInput(e.target.value);
                    if (newCatError) setNewCatError(null);
                  }}
                  placeholder="Contoh: RADIOLOGI, FISIOTERAPI..."
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    newCatError ? 'border-rose-400' : 'border-slate-300'
                  } rounded-xl text-xs font-semibold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]`}
                  autoFocus
                />
                {newCatError && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {newCatError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal (Master Document) */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Hapus Berkas Master?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus berkas master <strong>"{docToDelete.judul}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-colors cursor-pointer"
              >
                Ya, Hapus Berkas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal (Official Letter) */}
      {letterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Hapus Dokumen Surat?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus surat resmi <strong>"{letterToDelete.nomorSurat}"</strong> atas nama pasien <strong>{letterToDelete.namaPasien}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLetterToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLetter}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-colors cursor-pointer"
              >
                Ya, Hapus Surat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
