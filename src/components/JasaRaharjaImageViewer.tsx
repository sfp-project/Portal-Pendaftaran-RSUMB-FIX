import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Crosshair,
  UploadCloud,
  FileText,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Move
} from 'lucide-react';
import { JasaRaharjaItem } from '../types';
import {
  JasaRaharjaOcrItem,
  JR_ACTIVE_PHOTO_KEY,
  JR_ACTIVE_PHOTO_TIME_KEY,
  JR_PHOTO_GALLERY_KEY,
  normalizeNoRm,
  UpsertResult
} from '../data/jasaRaharjaData';
import { generateSampleJasaRaharjaTableImage } from '../utils/jasaRaharjaCanvas';
import { compressImage } from '../utils/imageCompressor';
import { getIdbItem, setIdbItem } from '../utils/indexedDbStorage';

export interface GalleryPhotoItem {
  id: string;
  url: string;
  updatedAt: string;
  name: string;
}

interface JasaRaharjaImageViewerProps {
  items: JasaRaharjaItem[];
  onUpsertItems?: (items: JasaRaharjaOcrItem[]) => UpsertResult;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenTableModal?: () => void;
}

export const JasaRaharjaImageViewer: React.FC<JasaRaharjaImageViewerProps> = ({
  items,
  onUpsertItems,
  showToast
}) => {
  // State Foto Aktif
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState<boolean>(false);

  // Gallery Foto
  const [photoGallery, setPhotoGallery] = useState<GalleryPhotoItem[]>([]);
  const [showGalleryModal, setShowGalleryModal] = useState<boolean>(false);

  // Transformasi Image Viewer (Pan, Zoom, Rotate, Fullscreen)
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);

  // Dragging & Panning
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch Pinch
  const touchStartDistRef = useRef<number | null>(null);

  // Search State (Ctrl + F)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [matchedIndex, setMatchedIndex] = useState<number>(0);
  const [activeHighlightedPatient, setActiveHighlightedPatient] = useState<JasaRaharjaItem | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper Simpan Gallery ke LocalStorage & IndexedDB
  const saveGalleryToStorage = (gallery: GalleryPhotoItem[]) => {
    // 1. Simpan salinan lengkap ke IndexedDB tanpa batas quota
    setIdbItem('rsumb_jr_gallery', gallery).catch(() => {});

    try {
      // 2. Di localStorage, simpan hanya 2 foto terakhir untuk meminimalkan beban quota
      const safeGallery = gallery.slice(0, 2).map((item) => ({
        ...item,
        // Jika data URL sangat besar (> 50KB), simpan metadata saja di localStorage
        url: item.url.length > 50000 ? '' : item.url
      }));
      localStorage.setItem(JR_PHOTO_GALLERY_KEY, JSON.stringify(safeGallery));
    } catch (e) {
      console.warn('LocalStorage gallery save failed, stored safely in IndexedDB:', e);
    }
  };

  // Inisialisasi Foto Aktif dari localStorage atau generate sampel otomatis
  useEffect(() => {
    const initPhoto = async () => {
      try {
        const savedPhoto = localStorage.getItem(JR_ACTIVE_PHOTO_KEY);
        const savedTime = localStorage.getItem(JR_ACTIVE_PHOTO_TIME_KEY);
        const idbGallery = await getIdbItem<GalleryPhotoItem[]>('rsumb_jr_gallery');

        if (savedPhoto && savedTime) {
          setPhotoUrl(savedPhoto);
          setLastUpdatedTime(savedTime);
          if (idbGallery && idbGallery.length > 0) {
            setPhotoGallery(idbGallery);
          } else {
            setPhotoGallery([
              {
                id: 'active-1',
                url: savedPhoto,
                updatedAt: savedTime,
                name: 'Foto Utama Aktif'
              }
            ]);
          }
          return;
        }

        // Cek apakah ada di IndexedDB
        const idbActive = await getIdbItem<string>(JR_ACTIVE_PHOTO_KEY);
        if (idbActive) {
          setPhotoUrl(idbActive);
          const time = savedTime || '15 September 2026, 08:30 WIB';
          setLastUpdatedTime(time);
          if (idbGallery && idbGallery.length > 0) {
            setPhotoGallery(idbGallery);
          }
          return;
        }

        // Buat foto tabel sampel default berkualitas tinggi
        const sample = generateSampleJasaRaharjaTableImage();
        const defaultTime = '15 September 2026, 08:30 WIB';
        setPhotoUrl(sample.dataUrl);
        setLastUpdatedTime(defaultTime);

        const initialGallery: GalleryPhotoItem[] = [
          {
            id: 'sample-official',
            url: sample.dataUrl,
            updatedAt: defaultTime,
            name: 'Lembar Resmi Jasa Raharja RSUMB'
          }
        ];
        setPhotoGallery(initialGallery);

        // Simpan ke IndexedDB
        setIdbItem(JR_ACTIVE_PHOTO_KEY, sample.dataUrl).catch(() => {});
        setIdbItem('rsumb_jr_gallery', initialGallery).catch(() => {});

        try {
          localStorage.setItem(JR_ACTIVE_PHOTO_TIME_KEY, defaultTime);
          // Hapus key lama jika ada untuk menghemat quota
          localStorage.removeItem(JR_PHOTO_GALLERY_KEY);
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }

        // Jika items masih kosong atau butuh sinkronisasi, lakukan upsert dari sampel
        if (onUpsertItems && sample.items.length > 0) {
          onUpsertItems(sample.items);
        }
      } catch (e) {
        console.warn('Error initializing JR photo:', e);
        const sample = generateSampleJasaRaharjaTableImage();
        setPhotoUrl(sample.dataUrl);
        setLastUpdatedTime('15 September 2026, 08:30 WIB');
      }
    };

    initPhoto();
  }, []);

  // Shortcut Keyboard Global (Ctrl + F / Cmd + F) untuk memfokuskan pencarian visual pada gambar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Periksa apakah tombol Ctrl+F atau Cmd+F ditekan
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }

      // Tombol Escape untuk keluar fullscreen atau membatalkan pencarian
      if (e.key === 'Escape') {
        if (isFullscreen) {
          handleToggleFullscreen();
        } else if (searchQuery) {
          setSearchQuery('');
          setActiveHighlightedPatient(null);
          handleResetView();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, searchQuery]);

  // Cari pasien yang cocok berdasarkan No. RM, Nama Pasien, atau Keterangan
  const matchedPatients = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const normQ = normalizeNoRm(q);
    return items.filter((item) => {
      const matchName = (item.namaPasien || '').toLowerCase().includes(q);
      const matchRm = item.noRm && (normalizeNoRm(item.noRm).includes(normQ) || item.noRm.toLowerCase().includes(q));
      const matchKet = (item.keterangan || '').toLowerCase().includes(q);
      const matchDiag = (item.diagnosa || '').toLowerCase().includes(q);
      return matchName || matchRm || matchKet || matchDiag;
    });
  }, [items, searchQuery]);

  // Navigasi ke pasien spesifik pada gambar (Scroll & Zoom-In tepat ke area lokasi pasien)
  const scrollToPatientOnImage = useCallback((patient: JasaRaharjaItem) => {
    setActiveHighlightedPatient(patient);

    const container = containerRef.current;
    if (!container) return;

    // Ambil koordinat bounding box pasien (box_2d: [ymin, xmin, ymax, xmax] dinormalisasi 0-1000)
    // Jika tidak ada box_2d eksplisit, perkirakan posisi vertikal berdasarkan urutan baris
    let box = patient.box_2d;
    if (!box || box.length !== 4) {
      const itemIdx = items.findIndex((it) => it.id === patient.id || normalizeNoRm(it.noRm) === normalizeNoRm(patient.noRm));
      const total = Math.max(items.length, 5);
      const rowPctStart = 200 + (itemIdx >= 0 ? itemIdx : 0) * (620 / total);
      const rowPctEnd = rowPctStart + 90;
      box = [Math.min(rowPctStart, 850), 20, Math.min(rowPctEnd, 950), 980];
    }

    const [ymin, xmin, ymax, xmax] = box;
    const centerYNorm = (ymin + ymax) / 2 / 1000; // 0 sampai 1
    const centerXNorm = (xmin + xmax) / 2 / 1000; // 0 sampai 1

    // Target Zoom-In yang nyaman untuk membaca data baris pasien (2.3x)
    const targetScale = 2.4;
    setScale(targetScale);

    // Hitung pergeseran Pan agar titik tengah baris pasien berada tepat di tengah container viewer
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const panX = (0.5 - centerXNorm) * containerW * targetScale;
    const panY = (0.5 - centerYNorm) * containerH * targetScale;

    setPan({ x: panX, y: panY });
  }, [items]);

  // Efek ketika kata kunci pencarian berubah atau user berpindah hasil match
  useEffect(() => {
    if (matchedPatients.length > 0) {
      const safeIndex = matchedIndex % matchedPatients.length;
      const target = matchedPatients[safeIndex];
      if (target) {
        scrollToPatientOnImage(target);
      }
    } else {
      setActiveHighlightedPatient(null);
    }
  }, [matchedPatients, matchedIndex, scrollToPatientOnImage]);

  // Handler Upload Foto Baru (Replace Foto Lama sebagai Foto Utama Aktif)
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (JPG, PNG, WebP) yang valid.', 'error');
      return;
    }

    setIsProcessingUpload(true);
    showToast('Sedang memproses dan mengompresi foto tabel JR...', 'info');

    try {
      // Otomatis kompresi gambar agar jernih namun tidak membebani quota memori browser
      const base64Data = await compressImage(file, 1280, 960, 0.78);
      if (!base64Data) {
        setIsProcessingUpload(false);
        showToast('Gagal memproses file foto.', 'error');
        return;
      }

      // Waktu upload baru dalam format Bahasa Indonesia
      const now = new Date();
      const formattedDate = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const formattedTime = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const newTimestamp = `${formattedDate}, ${formattedTime} WIB`;

      // 1. Simpan & REPLACE foto aktif lama
      setPhotoUrl(base64Data);
      setLastUpdatedTime(newTimestamp);

      // Tambahkan ke gallery dengan foto baru di posisi pertama
      const newGalleryItem: GalleryPhotoItem = {
        id: `jr-photo-${Date.now()}`,
        url: base64Data,
        updatedAt: newTimestamp,
        name: file.name || 'Foto Tabel JR Terbaru'
      };

      const updatedGallery = [newGalleryItem, ...photoGallery.filter((g) => g.id !== newGalleryItem.id)].slice(0, 5);
      setPhotoGallery(updatedGallery);
      saveGalleryToStorage(updatedGallery);

      // Simpan salinan ke IndexedDB
      setIdbItem(JR_ACTIVE_PHOTO_KEY, base64Data).catch(() => {});

      try {
        localStorage.setItem(JR_ACTIVE_PHOTO_TIME_KEY, newTimestamp);
        // Jika base64Data wajar (< 60KB), simpan ke localStorage
        if (base64Data.length < 80000) {
          localStorage.setItem(JR_ACTIVE_PHOTO_KEY, base64Data);
        }
      } catch (err) {
        console.warn('LocalStorage limit reached, relying on IndexedDB:', err);
      }

      // Reset posisi zoom & pan ke default agar foto baru terlihat utuh
      handleResetView();

      // 2. Kirim ke OCR Endpoint untuk sinkronisasi otomatis data & koordinat baris
      try {
        const response = await fetch('/api/jasaraharja/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data })
        });

        const resData = await response.json();
        if (response.ok && resData.items && resData.items.length > 0) {
          if (onUpsertItems) {
            const upsertRes = onUpsertItems(resData.items);
            showToast(
              `Foto utama berhasil diperbarui & mendeteksi ${upsertRes.updatedCount + upsertRes.addedCount} pasien (${upsertRes.updatedCount} Diperbarui, ${upsertRes.addedCount} Pasien Baru)!`,
              'success'
            );
          } else {
            showToast('Foto tabel JR berhasil diperbarui sebagai foto utama aktif.', 'success');
          }
        } else {
          showToast('Foto aktif berhasil diperbarui (tabel siap di-search visual).', 'success');
        }
      } catch (ocrErr) {
        console.warn('Auto OCR on upload error:', ocrErr);
        showToast('Foto aktif berhasil diganti, siap digunakan.', 'success');
      } finally {
        setIsProcessingUpload(false);
      }
    } catch (uploadErr) {
      setIsProcessingUpload(false);
      console.warn('Error processing photo upload:', uploadErr);
      showToast('Terjadi kesalahan saat memproses file foto.', 'error');
    }
  };

  // Muat Contoh Foto Tabel Resmi RSUMB
  const handleLoadSamplePhoto = () => {
    const sample = generateSampleJasaRaharjaTableImage();
    const now = new Date();
    const newTimestamp = `${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    setPhotoUrl(sample.dataUrl);
    setLastUpdatedTime(newTimestamp);

    const sampleItem: GalleryPhotoItem = {
      id: 'sample-official',
      url: sample.dataUrl,
      updatedAt: newTimestamp,
      name: 'Lembar Rekapitulasi Jasa Raharja RSUMB'
    };

    const updatedGallery = [sampleItem, ...photoGallery.filter((g) => g.id !== 'sample-official')].slice(0, 5);
    setPhotoGallery(updatedGallery);
    saveGalleryToStorage(updatedGallery);

    try {
      localStorage.setItem(JR_ACTIVE_PHOTO_KEY, sample.dataUrl);
      localStorage.setItem(JR_ACTIVE_PHOTO_TIME_KEY, newTimestamp);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    if (onUpsertItems && sample.items.length > 0) {
      onUpsertItems(sample.items);
    }
    handleResetView();
    showToast('Foto sampel resmi tabel Jasa Raharja RSUMB berhasil dimuat!', 'success');
  };

  // Ganti Foto Aktif dari Gallery
  const handleSelectFromGallery = (item: GalleryPhotoItem) => {
    setPhotoUrl(item.url);
    setLastUpdatedTime(item.updatedAt);
    try {
      localStorage.setItem(JR_ACTIVE_PHOTO_KEY, item.url);
      localStorage.setItem(JR_ACTIVE_PHOTO_TIME_KEY, item.updatedAt);
    } catch (e) {
      console.warn('LocalStorage update failed:', e);
    }
    handleResetView();
    showToast(`Foto aktif diubah ke: ${item.name}`, 'info');
  };

  // Kontrol Interaksi Gambar (Zoom In, Zoom Out, Reset View, Rotate, Fullscreen)
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.4, 5.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.4, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setActiveHighlightedPatient(null);
  };

  const handleToggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      }
      setIsFullscreen(false);
    }
  };

  // Listener Fullscreen Event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mouse Drag Events (Laptop admisi)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Hanya klik kiri
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setScale((prev) => {
      const next = prev * zoomFactor;
      return Math.min(Math.max(next, 0.5), 5.5);
    });
  };

  // Touch Events (HP / Tablet Admisi - Drag & Pinch-to-Zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      setScale((prev) => Math.min(Math.max(prev * ratio, 0.5), 5.5));
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  // Drag & Drop File Langsung ke Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="space-y-4" id="section-interactive-photo-viewer">
      {/* ========================================================================= */}
      {/* 1. MODUL UPLOAD & GALLERY FOTO JR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Label Status & Timestamp Foto Aktif */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-[#0b1c30]">
                  Sistem Pencarian Visual Lembar Jasa Raharja
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Foto Utama Aktif
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-medium flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Foto Aktif Terakhir Diperbarui: </span>
                  <strong className="text-slate-900 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {lastUpdatedTime || '15 September 2026, 08:30 WIB'}
                  </strong>
                </div>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-emerald-700 text-[11px] font-semibold">
                  Upload baru otomatis menggantikan foto lama
                </span>
              </div>
            </div>
          </div>

          {/* Tombol Upload & Pilihan Gallery */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />

            {/* Tombol Utama: Upload Foto Tabel JR Terbaru */}
            <button
              type="button"
              id="btn-upload-foto-jr-terbaru"
              disabled={isProcessingUpload}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Unggah foto lembar tabel Jasa Raharja terbaru untuk langsung menggantikan foto lama"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{isProcessingUpload ? 'Sedang Memproses Foto...' : '📷 Upload Foto Tabel JR Terbaru'}</span>
            </button>

            {/* Tombol Muat Contoh Foto Resmi */}
            <button
              type="button"
              id="btn-muat-contoh-foto-jr"
              onClick={handleLoadSamplePhoto}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-slate-300 transition-all cursor-pointer"
              title="Muat contoh lembar rekapitulasi resmi RSUMB"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Muat Contoh Foto</span>
            </button>

            {/* Tombol Riwayat / Gallery Foto */}
            {photoGallery.length > 1 && (
              <button
                type="button"
                onClick={() => setShowGalleryModal(!showGalleryModal)}
                className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-all cursor-pointer"
                title="Buka galeri lembar tabel yang pernah diupload"
              >
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Galeri ({photoGallery.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Gallery Drawer Dropdown jika user membuka galeri foto */}
        {showGalleryModal && photoGallery.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                Pilih dari Galeri Lembar Foto JR:
              </h4>
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-medium cursor-pointer"
              >
                Tutup Galeri ✕
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {photoGallery.map((photo, idx) => {
                const isActive = photo.url === photoUrl;
                return (
                  <div
                    key={photo.id}
                    onClick={() => handleSelectFromGallery(photo)}
                    className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-slate-900 ${
                      isActive
                        ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-20 object-cover group-hover:scale-105 transition-transform opacity-90"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-[10px] text-white">
                      <p className="font-bold truncate">{photo.name}</p>
                      <p className="text-[9px] text-slate-300 truncate">{photo.updatedAt}</p>
                    </div>
                    {isActive && (
                      <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. KOLOM PENCARIAN NAMA PASIEN (FITUR CTRL + F VISUAL) */}
        {/* ========================================================================= */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Input Pencarian Besar Sesuai Permintaan Spesifikasi */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-700">
                <Search className="w-5 h-5" />
              </div>
              <input
                ref={searchInputRef}
                id="input-cari-pasien-visual-jr"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMatchedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey) {
                      if (matchedPatients.length > 0) {
                        setMatchedIndex((prev) => (prev > 0 ? prev - 1 : matchedPatients.length - 1));
                      }
                    } else {
                      if (matchedPatients.length > 0) {
                        setMatchedIndex((prev) => (prev + 1) % matchedPatients.length);
                      }
                    }
                  }
                }}
                placeholder="🔍 Ketik Nama Pasien untuk Mencari..."
                className="w-full pl-12 pr-32 py-3.5 text-sm sm:text-base font-bold border-2 border-slate-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 transition-all shadow-xs"
              />

              {/* Status Match & Tombol Navigasi di dalam Search Bar */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                {searchQuery ? (
                  <>
                    <span className="text-xs font-extrabold text-slate-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                      {matchedPatients.length > 0
                        ? `${(matchedIndex % matchedPatients.length) + 1} dari ${matchedPatients.length}`
                        : '0 cocok'}
                    </span>

                    {matchedPatients.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMatchedIndex((prev) => (prev > 0 ? prev - 1 : matchedPatients.length - 1))}
                          className="p-1.5 text-slate-700 hover:text-emerald-800 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                          title="Pasien Sebelumnya (Shift + Enter)"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatchedIndex((prev) => (prev + 1) % matchedPatients.length)}
                          className="p-1.5 text-slate-700 hover:text-emerald-800 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                          title="Pasien Selanjutnya (Enter)"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveHighlightedPatient(null);
                        handleResetView();
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
                      title="Hapus Pencarian (Esc)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-200/80 px-2 py-1 rounded-md border border-slate-300 select-none">
                    Ctrl + F
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions Pintas Tampilan */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMarkers(!showMarkers)}
                className={`px-3.5 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  showMarkers
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
                title="Tampilkan / Sembunyikan sorotan visual pada gambar"
              >
                <Crosshair className="w-4 h-4 text-emerald-600" />
                <span>{showMarkers ? 'Sorotan Aktif' : 'Sorotan Mati'}</span>
              </button>
            </div>
          </div>

          {/* Quick Patient Chips (1-Click Jump to Patient on Image) */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
              Pintas Cepat:
            </span>
            {items.slice(0, 7).map((patient) => {
              const isSelected =
                activeHighlightedPatient?.id === patient.id ||
                normalizeNoRm(activeHighlightedPatient?.noRm) === normalizeNoRm(patient.noRm);
              return (
                <button
                  key={patient.id || patient.noRm}
                  type="button"
                  onClick={() => {
                    setSearchQuery(patient.namaPasien);
                    scrollToPatientOnImage(patient);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className="font-bold">{patient.namaPasien}</span>
                  <span className="opacity-75 text-[11px]">({patient.noRm})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FITUR INTERAKSI GAMBAR (VIEWER) & TOOLBAR KONTROL */}
      {/* ========================================================================= */}
      {/* Dedicated Clean Controls Bar Sesuai Permintaan: [ Zoom In ], [ Zoom Out ], [ Reset View ] */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Tombol Kontrol Utama yang Diminta */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol [ Zoom In ] */}
          <button
            type="button"
            id="btn-viewer-zoom-in"
            onClick={handleZoomIn}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Perbesar Tampilan Foto (+)"
          >
            <ZoomIn className="w-4 h-4 text-emerald-400" />
            <span>Zoom In</span>
          </button>

          {/* Tombol [ Zoom Out ] */}
          <button
            type="button"
            id="btn-viewer-zoom-out"
            onClick={handleZoomOut}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Perkecil Tampilan Foto (-)"
          >
            <ZoomOut className="w-4 h-4 text-emerald-400" />
            <span>Zoom Out</span>
          </button>

          {/* Tombol [ Reset View ] */}
          <button
            type="button"
            id="btn-viewer-reset-view"
            onClick={handleResetView}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Kembalikan Tampilan ke Ukuran Semula (100%)"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset View</span>
          </button>

          {/* Indikator Skala Zoom */}
          <div className="px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono font-bold text-emerald-400 select-none">
            {Math.round(scale * 100)}%
          </div>

          <div className="w-[1px] h-6 bg-slate-800 mx-1 hidden sm:block" />

          {/* Tombol Putar 90 Derajat */}
          <button
            type="button"
            id="btn-viewer-rotate"
            onClick={handleRotate}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            title="Putar Foto 90° Searah Jarum Jam"
          >
            <RotateCw className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Putar 90°</span>
          </button>

          {/* Tombol Layar Penuh */}
          <button
            type="button"
            id="btn-viewer-fullscreen"
            onClick={handleToggleFullscreen}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Mode Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Keluar' : 'Layar Penuh'}</span>
          </button>
        </div>

        {/* Petunjuk Interaksi Laptop & HP */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Move className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Bisa di-drag/geser bebas di Laptop (mouse) & HP (sentuh).</span>
        </div>
      </div>

      {/* Kontainer Kanvas Gambar Interaktif */}
      <div
        ref={containerRef}
        id="interactive-image-canvas-container"
        className={`relative overflow-hidden bg-slate-950 border-2 rounded-2xl select-none transition-all shadow-xl ${
          isDraggingFileOver
            ? 'border-emerald-500 ring-4 ring-emerald-500/30'
            : 'border-slate-800'
        } ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none w-screen h-screen bg-slate-950 flex flex-col'
            : 'w-full h-[540px] sm:h-[640px]'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Overlay Drag File Over */}
        {isDraggingFileOver && (
          <div className="absolute inset-0 z-40 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 border-4 border-dashed border-emerald-400">
            <UploadCloud className="w-16 h-16 text-emerald-300 animate-bounce mb-3" />
            <p className="text-lg font-bold">Lepaskan Foto Lembar JR di Sini</p>
            <p className="text-xs text-emerald-200 mt-1">Foto otomatis menggantikan foto lama sebagai foto utama aktif.</p>
          </div>
        )}

        {/* Floating Target Badge & Status di Atas Kiri Kanvas */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none flex flex-col gap-2 max-w-[90%]">
          {activeHighlightedPatient ? (
            <div className="bg-emerald-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl border border-emerald-400/50 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-xs font-bold">Fokus Pasien:</span>
                <span className="text-sm font-extrabold text-amber-300">
                  {activeHighlightedPatient.namaPasien}
                </span>
                <span className="text-xs font-mono text-emerald-200 font-bold">
                  (RM: {activeHighlightedPatient.noRm})
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-emerald-100 mt-1 flex-wrap">
                <span>
                  Sisa Plafon:{' '}
                  <strong className="text-white font-bold">
                    Rp {activeHighlightedPatient.sisaPlafon.toLocaleString('id-ID')}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Status:{' '}
                  <strong className="text-amber-200 font-bold">
                    {activeHighlightedPatient.keterangan || activeHighlightedPatient.statusPlafon}
                  </strong>
                </span>
                {activeHighlightedPatient.diagnosa && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{activeHighlightedPatient.diagnosa}</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-xs text-white/90 px-3 py-1.5 rounded-xl border border-white/10 text-xs flex items-center gap-2 shadow-lg">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Ketik nama pasien di atas untuk auto-zoom dan sorot langsung ke baris foto.</span>
            </div>
          )}
        </div>

        {/* Floating Quick Action Mini HUD di Pojok Kanan Kanvas */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Reset View (100%)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Kanvas Foto dengan Transformasi Dinamis (Pan, Zoom, Rotate) */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`
          }}
        >
          <div
            className="relative transition-transform duration-300 ease-out origin-center"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`
            }}
          >
            {photoUrl ? (
              <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white">
                <img
                  ref={imageRef}
                  src={photoUrl}
                  alt="Lembar Rekapitulasi Tabel Jasa Raharja RSUMB"
                  className="max-w-none block pointer-events-none select-none"
                  style={{
                    maxHeight: isFullscreen ? '88vh' : '580px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                  draggable={false}
                />

                {/* Visual Highlight Overlay Pasien (Ctrl + F Search Target) */}
                {showMarkers &&
                  items.map((patient) => {
                    const isMatch =
                      activeHighlightedPatient &&
                      (activeHighlightedPatient.id === patient.id ||
                        normalizeNoRm(activeHighlightedPatient.noRm) === normalizeNoRm(patient.noRm));

                    // Koordinat Bounding Box Pasien
                    let box = patient.box_2d;
                    if (!box || box.length !== 4) {
                      const idx = items.findIndex((it) => it.id === patient.id);
                      const total = Math.max(items.length, 5);
                      const yStart = 200 + idx * (620 / total);
                      box = [yStart, 25, yStart + 85, 975];
                    }

                    const [ymin, xmin, ymax, xmax] = box;
                    const topPct = `${ymin / 10}%`;
                    const leftPct = `${xmin / 10}%`;
                    const widthPct = `${(xmax - xmin) / 10}%`;
                    const heightPct = `${(ymax - ymin) / 10}%`;

                    if (!isMatch) {
                      return null; // Tampilkan hanya baris yang sedang aktif / dicari
                    }

                    return (
                      <div
                        key={`highlight-${patient.id || patient.noRm}`}
                        className="absolute z-20 pointer-events-none animate-in zoom-in-95 duration-200"
                        style={{
                          top: topPct,
                          left: leftPct,
                          width: widthPct,
                          height: heightPct
                        }}
                      >
                        {/* Box Berkedip & Glowing Neon Khas Visual Search */}
                        <div className="w-full h-full border-3 sm:border-4 border-amber-400 bg-amber-400/25 rounded-md shadow-[0_0_30px_rgba(251,191,36,0.9)] ring-4 ring-emerald-500/60 animate-pulse relative">
                          {/* Crosshairs Sudut Presisi */}
                          <div className="absolute -top-2 -left-2 w-3.5 h-3.5 border-t-3 border-l-3 border-amber-400" />
                          <div className="absolute -top-2 -right-2 w-3.5 h-3.5 border-t-3 border-r-3 border-amber-400" />
                          <div className="absolute -bottom-2 -left-2 w-3.5 h-3.5 border-b-3 border-l-3 border-amber-400" />
                          <div className="absolute -bottom-2 -right-2 w-3.5 h-3.5 border-b-3 border-r-3 border-amber-400" />

                          {/* Floating Target Label */}
                          <div className="absolute -top-9 left-0 bg-[#0b1c30] text-white text-xs font-extrabold px-3 py-1 rounded-lg border border-amber-400 shadow-2xl whitespace-nowrap flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>📍 {patient.namaPasien}</span>
                            <span className="text-amber-300 font-mono">({patient.noRm})</span>
                            <span className="text-emerald-400 font-bold">
                              • Sisa: Rp {patient.sisaPlafon.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-4 max-w-md">
                <UploadCloud className="w-14 h-14 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-lg">Belum Ada Foto Lembar Jasa Raharja</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unggah foto fisik formulir atau lembar rekapitulasi tabel Jasa Raharja untuk melihat dan mencari pasien langsung pada lembar foto.
                </p>
                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    📷 Pilih File Foto
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSamplePhoto}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ✨ Muat Sampel Resmi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Fullscreen Overlay Info */}
        {isFullscreen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/15 text-xs text-white flex items-center gap-4 shadow-2xl">
            <span className="text-emerald-400 font-bold">Mode Layar Penuh</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>Ketik nama pasien untuk pencarian visual otomatis</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              Keluar Fullscreen (Esc)
            </button>
          </div>
        )}
      </div>

      {/* Daftar Hasil Pencarian Cepat (Visual Search Matches Drawer) saat user sedang mencari */}
      {searchQuery && matchedPatients.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Pasien Cocok di Lembar Foto ({matchedPatients.length} Pasien):
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Klik nama pasien untuk zoom dan sorot barisnya pada foto
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {matchedPatients.map((p, idx) => {
              const isCurrent =
                activeHighlightedPatient?.id === p.id ||
                normalizeNoRm(activeHighlightedPatient?.noRm) === normalizeNoRm(p.noRm);

              return (
                <div
                  key={p.id || p.noRm}
                  onClick={() => scrollToPatientOnImage(p)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-extrabold text-slate-900 truncate">{p.namaPasien}</p>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {p.noRm}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                      {p.diagnosa || 'Perawatan Medis KLL'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-block ${
                        p.sisaPlafon <= 0 || p.statusPlafon === 'HABIS'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {p.keterangan || p.statusPlafon}
                    </span>
                    <p className="text-[11px] font-extrabold text-slate-900 mt-0.5">
                      Rp {p.sisaPlafon.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
