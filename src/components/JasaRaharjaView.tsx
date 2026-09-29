import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Upload,
  FileImage,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Edit3,
  Trash2,
  Plus,
  Sparkles,
  Copy,
  Check,
  Shield,
  Layers,
  ArrowUpDown,
  Filter,
  Eye
} from 'lucide-react';
import { JasaRaharjaItem } from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  PLAFON_MAKSIMAL_DEFAULT,
  normalizeNoRm,
  parseNominal,
  upsertJasaRaharjaItems,
  JasaRaharjaOcrItem,
  UpsertResult,
  saveJasaRaharjaData
} from '../data/jasaRaharjaData';

interface JasaRaharjaViewProps {
  items: JasaRaharjaItem[];
  onAddItem: (item: Omit<JasaRaharjaItem, 'id'>) => void;
  onUpdateItem: (item: JasaRaharjaItem) => void;
  onDeleteItem: (id: string) => void;
  onBatchAddItems: (newItems: Omit<JasaRaharjaItem, 'id'>[]) => void;
  onUpsertItems?: (incomingItems: JasaRaharjaOcrItem[]) => UpsertResult;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

interface UploadedSheet {
  id: string;
  name: string;
  sheetNumber: number;
  previewUrl: string;
  base64: string;
  mimeType: string;
  size: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  extractedCount?: number;
  errorMsg?: string;
}

export const JasaRaharjaView: React.FC<JasaRaharjaViewProps> = ({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUpsertItems,
  showToast = (_message: string, _type?: 'success' | 'info' | 'error') => {}
}) => {
  // ---------------------------------------------------------------------------
  // 1. Search & Filter State
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'habis' | 'sisa' | 'ranap' | 'rujuk'>('all');
  const [sortField, setSortField] = useState<'no' | 'tanggal' | 'nama' | 'terpakai' | 'sisa'>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [copiedRm, setCopiedRm] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // 2. Multi-Upload State (1 - 4 Lembar)
  // ---------------------------------------------------------------------------
  const [uploadedSheets, setUploadedSheets] = useState<UploadedSheet[]>([]);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgressText, setOcrProgressText] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [lastUpsertSummary, setLastUpsertSummary] = useState<UpsertResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // 3. Edit & Manual Add Modal State
  // ---------------------------------------------------------------------------
  const [editingItem, setEditingItem] = useState<JasaRaharjaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JasaRaharjaItem | null>(null);

  // Form inputs for Add / Edit
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [formNoRm, setFormNoRm] = useState('');
  const [formNamaPasien, setFormNamaPasien] = useState('');
  const [formBiayaTerpakai, setFormBiayaTerpakai] = useState<number>(0);
  const [formPlafonMaksimal, setFormPlafonMaksimal] = useState<number>(PLAFON_MAKSIMAL_DEFAULT);
  const [formKeterangan, setFormKeterangan] = useState<string>('RANAP');
  const [formDiagnosa, setFormDiagnosa] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Global Ctrl+F / Cmd+F Keyboard Shortcut Interceptor
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // Quick Copy RM Handler
  // ---------------------------------------------------------------------------
  const handleCopyNoRm = (noRm: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(noRm);
    setCopiedRm(noRm);
    showToast(`No. RM ${noRm} disalin ke clipboard`, 'info');
    setTimeout(() => setCopiedRm(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // Helper: Read File to Base64
  // ---------------------------------------------------------------------------
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // ---------------------------------------------------------------------------
  // Trigger Automatic AI Extraction from Uploaded Sheets
  // ---------------------------------------------------------------------------
  const runExtractionOnSheets = useCallback(
    async (sheetsToProcess: UploadedSheet[]) => {
      if (sheetsToProcess.length === 0) return;

      setIsProcessingOcr(true);
      setOcrProgressText(`Sedang mengekstrak tabel dari ${sheetsToProcess.length} foto lembar dengan AI...`);
      setLastUpsertSummary(null);

      try {
        // Send batch payload to server OCR endpoint
        const payloadImages = sheetsToProcess.map((sheet) => ({
          imageBase64: sheet.base64,
          mimeType: sheet.mimeType,
          name: sheet.name,
          sheetNumber: sheet.sheetNumber
        }));

        const response = await fetch('/api/jasaraharja/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            images: payloadImages,
            // also provide first image for backward compatibility
            imageBase64: payloadImages[0]?.imageBase64 || '',
            mimeType: payloadImages[0]?.mimeType || 'image/jpeg'
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Gagal mengekstrak data dari foto');
        }

        const extractedList: JasaRaharjaOcrItem[] = Array.isArray(data.items) ? data.items : [];

        if (extractedList.length === 0) {
          showToast('Tidak ada baris data pasien yang dapat dikenali dari foto.', 'error');
          setIsProcessingOcr(false);
          return;
        }

        // Apply UPSERT logic based on No. RM
        let upsertResult: UpsertResult;
        if (onUpsertItems) {
          upsertResult = onUpsertItems(extractedList);
        } else {
          upsertResult = upsertJasaRaharjaItems(items, extractedList);
          saveJasaRaharjaData(upsertResult.updatedList);
        }

        setLastUpsertSummary(upsertResult);

        // Update sheet statuses
        setUploadedSheets((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'done',
            extractedCount: Math.round(extractedList.length / prev.length)
          }))
        );

        if (data.warning) {
          showToast(data.warning, 'info');
        } else {
          showToast(
            `Ekstraksi AI Sukses: ${upsertResult.updatedCount} pasien diperbarui, ${upsertResult.addedCount} pasien baru ditambahkan!`,
            'success'
          );
        }
      } catch (err: any) {
        console.error('Error saat ekstraksi OCR:', err);
        let errorDisplayMsg = 'Terjadi kesalahan saat memproses foto tabel.';
        const rawErr = String(err?.message || err || '');
        if (rawErr.includes('503') || rawErr.includes('high demand') || rawErr.includes('UNAVAILABLE')) {
          errorDisplayMsg = 'Layanan AI sedang mengalami lonjakan antrean (503). Silakan coba klik tombol Ekstrak Ulang.';
        } else if (rawErr.includes('{')) {
          try {
            const match = rawErr.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              errorDisplayMsg = parsed.error?.message || parsed.message || rawErr;
            }
          } catch {
            errorDisplayMsg = rawErr;
          }
        } else if (rawErr) {
          errorDisplayMsg = rawErr;
        }

        showToast(errorDisplayMsg, 'error');
        setUploadedSheets((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'error',
            errorMsg: errorDisplayMsg
          }))
        );
      } finally {
        setIsProcessingOcr(false);
        setOcrProgressText('');
      }
    },
    [items, onUpsertItems, showToast]
  );

  // ---------------------------------------------------------------------------
  // Handle Multi-File Selection (1 to 4 Images)
  // ---------------------------------------------------------------------------
  const handleFilesSelected = async (filesList: FileList | File[]) => {
    const rawFiles = Array.from(filesList);
    const validImageFiles = rawFiles
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 4); // Max 4 sheets per batch

    if (validImageFiles.length === 0) {
      showToast('Harap pilih file gambar (JPG, PNG, WEBP). Maksimal 4 lembar.', 'error');
      return;
    }

    const processedSheets: UploadedSheet[] = [];

    for (let i = 0; i < validImageFiles.length; i++) {
      const file = validImageFiles[i];
      try {
        const base64 = await readFileAsDataUrl(file);
        processedSheets.push({
          id: `sheet-${Date.now()}-${i}`,
          name: file.name,
          sheetNumber: i + 1,
          previewUrl: base64,
          base64: base64,
          mimeType: file.type || 'image/jpeg',
          size: file.size,
          status: 'processing'
        });
      } catch (readErr) {
        console.error('Gagal membaca file gambar:', readErr);
      }
    }

    if (processedSheets.length > 0) {
      setUploadedSheets(processedSheets);
      // Automatically run AI extraction as requested!
      runExtractionOnSheets(processedSheets);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedSheets((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllSheets = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedSheets([]);
    setLastUpsertSummary(null);
  };

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const totalPasien = items.length;
    const totalTerpakai = items.reduce((acc, curr) => acc + (curr.biayaTerpakai || 0), 0);
    const totalSisa = items.reduce((acc, curr) => acc + (curr.sisaPlafon || 0), 0);
    const pasienHabis = items.filter(
      (item) =>
        item.sisaPlafon <= 0 ||
        item.statusPlafon === 'HABIS' ||
        item.keterangan?.toUpperCase().includes('HABIS')
    ).length;

    return {
      totalPasien,
      totalTerpakai,
      totalSisa,
      pasienHabis
    };
  }, [items]);

  // ---------------------------------------------------------------------------
  // Reactive Instant Live Search & Filtering
  // ---------------------------------------------------------------------------
  const filteredAndSortedItems = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const filtered = items.filter((item) => {
      // 1. Live Instant Search (No. RM, Nama Pasien, Tanggal, Keterangan)
      if (query) {
        const matchNama = item.namaPasien?.toLowerCase().includes(query);
        const matchRm = item.noRm?.toLowerCase().includes(query) || normalizeNoRm(item.noRm).includes(normalizeNoRm(query));
        const matchKet = item.keterangan?.toLowerCase().includes(query);
        const matchTgl = item.tanggal?.toLowerCase().includes(query);
        const matchDiag = item.diagnosa?.toLowerCase().includes(query);

        if (!matchNama && !matchRm && !matchKet && !matchTgl && !matchDiag) {
          return false;
        }
      }

      // 2. Quick Category Filter
      if (activeFilter === 'habis') {
        const isHabis =
          item.sisaPlafon <= 0 ||
          item.statusPlafon === 'HABIS' ||
          item.keterangan?.toUpperCase().includes('HABIS');
        if (!isHabis) return false;
      } else if (activeFilter === 'sisa') {
        const hasSisa = item.sisaPlafon > 0 && !item.keterangan?.toUpperCase().includes('HABIS');
        if (!hasSisa) return false;
      } else if (activeFilter === 'ranap') {
        if (!item.keterangan?.toUpperCase().includes('RANAP')) return false;
      } else if (activeFilter === 'rujuk') {
        if (!item.keterangan?.toUpperCase().includes('RUJUK')) return false;
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'no') {
        comparison = (a.no || 0) - (b.no || 0);
      } else if (sortField === 'tanggal') {
        comparison = (a.tanggal || '').localeCompare(b.tanggal || '');
      } else if (sortField === 'nama') {
        comparison = (a.namaPasien || '').localeCompare(b.namaPasien || '');
      } else if (sortField === 'terpakai') {
        comparison = (a.biayaTerpakai || 0) - (b.biayaTerpakai || 0);
      } else if (sortField === 'sisa') {
        comparison = (a.sisaPlafon || 0) - (b.sisaPlafon || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, searchTerm, activeFilter, sortField, sortOrder]);

  // ---------------------------------------------------------------------------
  // Helper to Highlight Matching Search Text
  // ---------------------------------------------------------------------------
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // ---------------------------------------------------------------------------
  // Status Badge Renderer
  // ---------------------------------------------------------------------------
  const renderStatusBadge = (keterangan?: string) => {
    const rawKet = (keterangan || '').trim().toUpperCase();

    if (rawKet.includes('HABIS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          HABIS
        </span>
      );
    }
    if (rawKet.includes('RUJUK')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          RUJUK
        </span>
      );
    }
    if (rawKet.includes('RANAP')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
          RANAP
        </span>
      );
    }
    if (rawKet.includes('AFF KWIRE') || rawKet.includes('KWIRE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
          AFF KWIRE
        </span>
      );
    }
    if (rawKet.includes('MENINGGAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-white shadow-sm">
          MENINGGAL
        </span>
      );
    }
    if (rawKet.includes('KONTROL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
          KONTROL
        </span>
      );
    }

    if (rawKet) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {keterangan}
        </span>
      );
    }

    return <span className="text-slate-400 text-xs">-</span>;
  };

  // ---------------------------------------------------------------------------
  // Modal Handlers (Add / Edit / Delete)
  // ---------------------------------------------------------------------------
  const openEditModal = (item: JasaRaharjaItem) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal || new Date().toISOString().slice(0, 10));
    setFormNoRm(item.noRm || '');
    setFormNamaPasien(item.namaPasien || '');
    setFormBiayaTerpakai(item.biayaTerpakai || 0);
    setFormPlafonMaksimal(item.plafonMaksimal || PLAFON_MAKSIMAL_DEFAULT);
    setFormKeterangan(item.keterangan || 'RANAP');
    setFormDiagnosa(item.diagnosa || '');
    setFormCatatan(item.catatan || '');
    setIsAddModalOpen(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().slice(0, 10));
    setFormNoRm('');
    setFormNamaPasien('');
    setFormBiayaTerpakai(0);
    setFormPlafonMaksimal(PLAFON_MAKSIMAL_DEFAULT);
    setFormKeterangan('RANAP');
    setFormDiagnosa('');
    setFormCatatan('');
    setIsAddModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaPasien.trim()) {
      showToast('Nama Pasien wajib diisi.', 'error');
      return;
    }
    if (!formNoRm.trim()) {
      showToast('No. RM wajib diisi.', 'error');
      return;
    }

    const sisa = Math.max(0, formPlafonMaksimal - formBiayaTerpakai);
    const statusPlafon = sisa <= 0 || formKeterangan.toUpperCase().includes('HABIS') ? 'HABIS' : 'TERSEDIA';

    if (editingItem) {
      const updated: JasaRaharjaItem = {
        ...editingItem,
        tanggal: formTanggal,
        noRm: formNoRm.trim(),
        namaPasien: formNamaPasien.trim(),
        biayaTerpakai: formBiayaTerpakai,
        plafonMaksimal: formPlafonMaksimal,
        sisaPlafon: sisa,
        keterangan: formKeterangan,
        statusPlafon: statusPlafon,
        diagnosa: formDiagnosa,
        catatan: formCatatan
      };
      onUpdateItem(updated);
      showToast(`Data pasien ${updated.namaPasien} berhasil diperbarui.`, 'success');
    } else {
      const newItem: Omit<JasaRaharjaItem, 'id'> = {
        no: items.length + 1,
        tanggal: formTanggal,
        noRm: formNoRm.trim(),
        namaPasien: formNamaPasien.trim(),
        biayaTerpakai: formBiayaTerpakai,
        plafonMaksimal: formPlafonMaksimal,
        sisaPlafon: sisa,
        keterangan: formKeterangan,
        statusPlafon: statusPlafon,
        diagnosa: formDiagnosa,
        catatan: formCatatan
      };
      onAddItem(newItem);
      showToast(`Pasien baru ${newItem.namaPasien} berhasil ditambahkan.`, 'success');
    }

    setIsAddModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const targetName = itemToDelete.namaPasien;
    onDeleteItem(itemToDelete.id);
    setItemToDelete(null);
    showToast(`Data pasien ${targetName} berhasil dihapus.`, 'success');
  };

  return (
    <div id="jasa-raharja-module" className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* -------------------------------------------------------------------------
          HEADER & METRICS
      -------------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Plafon Jasa Raharja (KLL)
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tabel Digital Terintegrasi
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              RS Muhammadiyah Babat &bull; Rekapitulasi Plafon Santunan Korban Kecelakaan Lalu Lintas
            </p>
          </div>
        </div>

        {/* Top Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pasien Manual</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Total Pasien Terdata</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalPasien}</span>
            <span className="text-xs font-semibold text-slate-400">Kasus KLL</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Plafon Terpakai (Klaim)</span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {formatRupiah(stats.totalTerpakai)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-emerald-700">Total Sisa Plafon RSUMB</span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
              {formatRupiah(stats.totalSisa)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-between bg-rose-50/30">
          <span className="text-xs font-medium text-rose-700">Plafon Habis (Limit Rp 20Jt)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600 font-mono">{stats.pasienHabis}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
              Perlu BPJS/Umum
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          KOMPONEN UTAMA 1: AREA UPLOAD FOTO MULTI-FILE (LEMBAR 1-4)
      -------------------------------------------------------------------------- */}
      <div
        id="multi-sheet-upload-zone"
        className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-sm ${
          isDraggingOver
            ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10'
            : 'border-dashed border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesSelected(e.target.files);
            }
          }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                1. Upload Foto Lembar Tabel Jasa Raharja
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Multi-File (1 - 4 Foto)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Tarik & letakkan 1 sampai 4 foto sekaligus (Lembar 1 - Lembar 4). AI Gemini / OCR akan otomatis
                mengekstrak teks tabel dan menggabungkan seluruh baris pasien ke tabel digital dengan auto-upsert No. RM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            <button
              type="button"
              disabled={isProcessingOcr}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{uploadedSheets.length > 0 ? 'Ganti / Tambah Foto' : 'Pilih 1 - 4 Foto Lembar'}</span>
            </button>

            {uploadedSheets.length > 0 && !isProcessingOcr && (
              <button
                type="button"
                onClick={() => runExtractionOnSheets(uploadedSheets)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                title="Ekstrak ulang foto yang telah diupload"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekstrak Ulang</span>
              </button>
            )}

            {uploadedSheets.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllSheets}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Hapus semua foto lembar yang dipilih"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessingOcr && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold">{ocrProgressText}</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Memindai No. RM, nama pasien, tanggal klaim, plafon terpakai, dan sisa nominal...
              </p>
            </div>
          </div>
        )}

        {/* Upsert Feedback Banner */}
        {lastUpsertSummary && !isProcessingOcr && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Sinkronisasi Tabel Digital Selesai! ({lastUpsertSummary.updatedCount + lastUpsertSummary.addedCount} Pasien Diproses)
                </p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  &bull; <span className="font-semibold text-emerald-900">{lastUpsertSummary.updatedCount} pasien</span> diupdate nominalnya berdasarkan No. RM yang sudah ada di sistem.
                  <br />
                  &bull; <span className="font-semibold text-emerald-900">{lastUpsertSummary.addedCount} pasien baru</span> ditambahkan ke tabel digital.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastUpsertSummary(null)}
              className="text-emerald-600 hover:text-emerald-900 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Thumbnail Preview Slots (Lembar 1 - 4) */}
        {uploadedSheets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Pratinjau Foto Lembar ({uploadedSheets.length} file diunggah):</span>
              <span className="text-[11px] text-slate-400 font-normal">Tersambung ke Gemini AI OCR</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {uploadedSheets.map((sheet, idx) => (
                <div
                  key={sheet.id}
                  className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="relative h-24 sm:h-28 w-full bg-slate-900/5 overflow-hidden">
                    <img
                      src={sheet.previewUrl}
                      alt={sheet.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold">
                      Lembar {idx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleRemoveSheet(sheet.id, e)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-all"
                      title="Hapus lembar ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 text-[11px] flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-800 truncate" title={sheet.name}>
                      {sheet.name}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{(sheet.size / 1024).toFixed(0)} KB</span>
                      {sheet.status === 'done' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Berhasil
                        </span>
                      ) : sheet.status === 'processing' ? (
                        <span className="text-amber-600 font-medium">Mengekstrak...</span>
                      ) : sheet.status === 'error' ? (
                        <span className="text-rose-600 font-medium">Gagal</span>
                      ) : (
                        <span>Siap</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------------
          KOMPONEN UTAMA 2: KOTAK PENCARIAN UTAMA (INSTANT SEARCH / CTRL + F)
      -------------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Cari Nama Pasien atau No. RM... (misal: SUNARYO / 074218)"
              className="w-full pl-11 pr-24 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded bg-slate-200/70 border border-slate-300 text-[10px] font-mono text-slate-600">
                Ctrl + F
              </kbd>
            </div>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('habis')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'habis'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Habis ({stats.pasienHabis})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('sisa')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'sisa'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              Sisa Tersedia
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ranap')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'ranap'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              Ranap
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('rujuk')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'rujuk'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Rujuk
            </button>
          </div>
        </div>

        {/* Counter & Active Filter feedback */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredAndSortedItems.length}</span> dari total{' '}
            <span className="font-semibold text-slate-700">{items.length}</span> pasien
            {searchTerm && (
              <span className="ml-1.5 text-emerald-700 font-medium">
                (filter kata kunci: &ldquo;{searchTerm}&rdquo;)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Urutkan:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-');
                setSortField(f as any);
                setSortOrder(o as any);
              }}
              className="text-xs bg-transparent border-0 font-semibold text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="tanggal-desc">Tanggal Terbaru</option>
              <option value="tanggal-asc">Tanggal Terlama</option>
              <option value="terpakai-desc">Plafon Terpakai Tertinggi</option>
              <option value="sisa-asc">Sisa Plafon Terkecil (Habis)</option>
              <option value="nama-asc">Nama Pasien (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          KOMPONEN 3: TABEL DIGITAL INSTAN & RESPONSIF
          Kolom: [No, Tanggal, No. RM, Nama Pasien, Plafon Terpakai, Sisa Plafon, Status/Keterangan]
      -------------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">No. RM</th>
                <th className="py-3.5 px-4">Nama Pasien</th>
                <th className="py-3.5 px-4 text-right">Plafon Terpakai</th>
                <th className="py-3.5 px-4 text-right">Sisa Plafon</th>
                <th className="py-3.5 px-4 text-center">Status / Keterangan</th>
                <th className="py-3.5 px-4 text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-600">
                        Tidak ada data pasien yang cocok dengan kriteria pencarian.
                      </p>
                      <p className="text-xs text-slate-400">
                        Periksa ejaan No. RM atau Nama Pasien, atau klik tombol di bawah untuk reset.
                      </p>
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item, idx) => {
                  const isHabis =
                    item.sisaPlafon <= 0 ||
                    item.statusPlafon === 'HABIS' ||
                    item.keterangan?.toUpperCase().includes('HABIS');

                  return (
                    <tr
                      key={item.id || `jr-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isHabis ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-500 text-xs">
                        {idx + 1}
                      </td>

                      {/* 2. Tanggal */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 text-xs font-medium">
                        {formatTanggalIndo(item.tanggal)}
                      </td>

                      {/* 3. No. RM */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                          <span>{item.noRm}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyNoRm(item.noRm, e)}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            title="Salin No. RM"
                          >
                            {copiedRm === item.noRm ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 4. Nama Pasien */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {renderHighlightedText(item.namaPasien, searchTerm)}
                        </div>
                        {item.diagnosa && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={item.diagnosa}>
                            {item.diagnosa}
                          </div>
                        )}
                      </td>

                      {/* 5. Plafon Terpakai */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs font-bold text-slate-900">
                        {formatRupiah(item.biayaTerpakai)}
                      </td>

                      {/* 6. Sisa Plafon (Badge Merah jika HABIS, Teks Hijau jika masih ada) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isHabis ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                            HABIS (Rp 0)
                          </span>
                        ) : (
                          <span className="font-black text-emerald-600 font-mono text-xs sm:text-sm">
                            {formatRupiah(item.sisaPlafon)}
                          </span>
                        )}
                      </td>

                      {/* 7. Status / Keterangan */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(item.keterangan)}
                      </td>

                      {/* Aksi (Edit & Hapus) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
                            title="Edit Data Pasien"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Pasien"
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

        {/* Table Footer Summary */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Data otomatis disimpan di penyimpanan lokal browser (Local Storage) &amp; aman dari duplikasi berkat upsert No. RM.
          </div>
          <div className="flex items-center gap-4 font-mono font-semibold">
            <span>
              Total Plafon Terpakai:{' '}
              <strong className="text-slate-900">{formatRupiah(stats.totalTerpakai)}</strong>
            </span>
            <span>
              Total Sisa:{' '}
              <strong className="text-emerald-700">{formatRupiah(stats.totalSisa)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          MODAL: TAMBAH / EDIT PASIEN MANUAL
      -------------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                {editingItem ? 'Edit Data Plafon Pasien' : 'Tambah Pasien Jasa Raharja'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pelayanan / Entri
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Rekam Medis (No. RM) *
                  </label>
                  <input
                    type="text"
                    value={formNoRm}
                    onChange={(e) => setFormNoRm(e.target.value)}
                    placeholder="Contoh: 07-42-18"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pasien *
                </label>
                <input
                  type="text"
                  value={formNamaPasien}
                  onChange={(e) => setFormNamaPasien(e.target.value)}
                  placeholder="Nama korban kecelakaan..."
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plafon Maksimal JR (Rp)
                  </label>
                  <input
                    type="number"
                    value={formPlafonMaksimal}
                    onChange={(e) => setFormPlafonMaksimal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plafon Terpakai / Klaim (Rp)
                  </label>
                  <input
                    type="number"
                    value={formBiayaTerpakai}
                    onChange={(e) => setFormBiayaTerpakai(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Estimasi Sisa Plafon:</span>
                <span
                  className={`font-mono font-bold ${
                    formPlafonMaksimal - formBiayaTerpakai <= 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatRupiah(Math.max(0, formPlafonMaksimal - formBiayaTerpakai))}
                  {formPlafonMaksimal - formBiayaTerpakai <= 0 && ' (HABIS)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status / Keterangan
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {['RANAP', 'HABIS', 'RUJUK', 'AFF KWIRE', 'KONTROL', 'MENINGGAL'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormKeterangan(opt)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
                        formKeterangan === opt
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Atau ketik keterangan kustom..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnosa Medis / Indikasi
                </label>
                <input
                  type="text"
                  value={formDiagnosa}
                  onChange={(e) => setFormDiagnosa(e.target.value)}
                  placeholder="Misal: Fraktur Clavicula Dextra (KLL)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Pasien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          MODAL: KONFIRMASI HAPUS PASIEN
      -------------------------------------------------------------------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Hapus Data Pasien?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data pasien{' '}
                <strong className="text-slate-800">{itemToDelete.namaPasien}</strong> (No. RM: {itemToDelete.noRm})?
                Data yang dihapus tidak dapat dipulihkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
