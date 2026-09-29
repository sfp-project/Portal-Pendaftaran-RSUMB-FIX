import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Calendar,
  Tag,
  Check,
  Sparkles,
  Info,
  Cloud,
  ExternalLink
} from 'lucide-react';
import {
  PosterPromoItem,
  KategoriPromo,
  KATEGORI_PROMO_OPTIONS
} from '../../types/posterPromoTypes';
import { formatFileSize } from '../../data/documentRepositoryData';
import { isGoogleDriveConnected } from '../../services/googleAuthService';
import { uploadMediaToGoogleDrive } from '../../services/googleDriveService';

interface UploadPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (newPoster: PosterPromoItem) => void;
  showToast: (msg: string) => void;
}

export const UploadPosterModal: React.FC<UploadPosterModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  showToast
}) => {
  const [judul, setJudul] = useState('');
  const [kategoriPromo, setKategoriPromo] = useState<KategoriPromo>('Layanan Unggulan');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalKadaluarsa, setTanggalKadaluarsa] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [syncToDrive, setSyncToDrive] = useState<boolean>(() => isGoogleDriveConnected());
  const [driveUploadProgress, setDriveUploadProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Common quick tag suggestions
  const quickTags = ['mcu', 'poli jantung', 'khitan', 'diskon', 'spesialis', 'rawat inap', 'mohat', 'bpjs'];

  // Add tag
  const handleAddTag = (rawText: string) => {
    const clean = rawText
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    const combined = Array.from(new Set([...tags, ...clean]));
    setTags(combined);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    }
  };

  // Handle File Selection with Canvas compression for LocalStorage safety
  const processFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['png', 'jpg', 'jpeg', 'webp', 'pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext)) {
      setErrorMessage('Format berkas tidak didukung. Mohon unggah berkas PNG, JPG, JPEG, WEBP, atau PDF.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas melebihi 15 MB. Mohon pilih berkas yang lebih ringkas.');
      return;
    }

    setSelectedFile(file);

    // If Image: resize/compress via canvas if needed to keep under storage budget
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          // Scale to max 1200px width/height for fast rendering and safe LocalStorage footprint
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
            setFilePreviewUrl(compressedUrl);
          } else {
            setFilePreviewUrl(result);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF File: read as DataURL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim()) {
      setErrorMessage('Judul poster / promo wajib diisi.');
      return;
    }

    if (!selectedFile || !filePreviewUrl) {
      setErrorMessage('Silakan pilih berkas poster/flyer dari PC atau perangkat Anda.');
      return;
    }

    if (tanggalMulai && tanggalKadaluarsa && tanggalMulai > tanggalKadaluarsa) {
      setErrorMessage('Tanggal mulai promo tidak boleh melampaui tanggal kadaluarsa.');
      return;
    }

    setIsSubmitting(true);
    setDriveUploadProgress(null);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'png';
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Process any lingering tag in tagInput
      let finalTags = [...tags];
      if (tagInput.trim()) {
        const extra = tagInput
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0 && !finalTags.includes(t));
        finalTags = [...finalTags, ...extra];
      }

      let driveData: { fileId?: string; viewLink?: string; downloadLink?: string } = {};

      // If Google Drive sync is selected and user is authenticated
      if (syncToDrive && isGoogleDriveConnected()) {
        setDriveUploadProgress('Mengunggah ke folder Google Drive /RSUMB_Portal_Files/...');
        try {
          const driveRes = await uploadMediaToGoogleDrive(
            selectedFile,
            `POSTER_${Date.now()}_${selectedFile.name}`,
            selectedFile.type || 'image/png'
          );
          driveData = {
            fileId: driveRes.fileId,
            viewLink: driveRes.webViewLink,
            downloadLink: driveRes.webContentLink
          };
        } catch (driveErr: any) {
          console.warn('Gagal upload ke Google Drive, melanjutkan simpan lokal:', driveErr);
        }
      }

      const newPoster: PosterPromoItem = {
        id: `poster-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        judul: judul.trim(),
        kategoriPromo,
        tags: finalTags,
        tanggalMulai: tanggalMulai || undefined,
        tanggalKadaluarsa: tanggalKadaluarsa || undefined,
        namaBerkas: selectedFile.name,
        formatBerkas: ext,
        ukuranBerkas: formatFileSize(selectedFile.size),
        ukuranBytes: selectedFile.size,
        tanggalDiunggah: timeStr,
        fileData: filePreviewUrl,
        keterangan: keterangan.trim() || undefined,
        driveFileId: driveData.fileId,
        driveViewLink: driveData.viewLink,
        driveWebContentLink: driveData.downloadLink,
        driveFolderName: driveData.fileId ? 'RSUMB_Portal_Files' : undefined
      };

      onUpload(newPoster);
      const driveMsg = driveData.fileId ? ' & tersimpan di Google Drive (/RSUMB_Portal_Files/)' : '';
      showToast(`Poster promo "${newPoster.judul}" berhasil diunggah${driveMsg}.`);
      handleReset();
      onClose();
    } catch (err) {
      console.error('Error creating poster item:', err);
      setErrorMessage('Terjadi kesalahan saat memproses berkas poster.');
    } finally {
      setIsSubmitting(false);
      setDriveUploadProgress(null);
    }
  };

  const handleReset = () => {
    setJudul('');
    setKategoriPromo('Layanan Unggulan');
    setTagInput('');
    setTags([]);
    setTanggalMulai('');
    setTanggalKadaluarsa('');
    setKeterangan('');
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  const isPdf = selectedFile?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#005d42] to-[#004732] text-white px-5 py-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 text-emerald-300">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Unggah Poster Layanan & Promo</span>
                <span className="px-2 py-0.5 bg-emerald-400/25 border border-emerald-300/30 text-emerald-200 text-[10px] font-bold rounded-full">
                  Flyer & Banner
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Tambahkan materi promosi tarif, paket MCU, atau banner layanan RSUMB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/50">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Judul Poster / Promo */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Judul Poster / Promo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Paket Medical Check Up Eksekutif 2026 atau Promo Khitan Ceria"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
            />
          </div>

          {/* Kategori Promo Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Kategori Promo <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {KATEGORI_PROMO_OPTIONS.map((opt) => {
                const isSelected = kategoriPromo === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setKategoriPromo(opt.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-[#005d42] ring-2 ring-[#005d42]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#005d42]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tanggal Berlaku / Masa Promo (Range) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Masa Berlaku / Tanggal Promo (Opsional)</span>
              <span className="text-[10.5px] font-normal text-slate-500 lowercase">
                Otomatis tandai status jika telah kadaluarsa
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <span className="text-[11px] font-medium text-slate-500 mb-1 block">Tanggal Mulai:</span>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
                  />
                </div>
              </div>

              <div className="relative">
                <span className="text-[11px] font-medium text-slate-500 mb-1 block">Tanggal Berakhir (Kadaluarsa):</span>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={tanggalKadaluarsa}
                    onChange={(e) => setTanggalKadaluarsa(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Kata Kunci / Tag Search */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Kata Kunci / Tag Pencarian</span>
              <span className="text-[10.5px] font-normal text-slate-500">Tekan Enter atau koma</span>
            </label>
            <div className="p-2 bg-white border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-[#005d42]/30 focus-within:border-[#005d42]">
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#005d42] rounded-lg text-xs font-semibold"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-600 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? 'Ketik tag lalu tekan Enter (misal: mcu, khitan, diskon)...' : 'Tambah tag...'}
                  className="flex-1 min-w-[150px] px-2 py-1 text-xs text-slate-800 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10.5px] text-slate-500 font-medium">Saran tag:</span>
              {quickTags.map((qt) => {
                const isSelected = tags.includes(qt);
                return (
                  <button
                    key={qt}
                    type="button"
                    disabled={isSelected}
                    onClick={() => handleAddTag(qt)}
                    className={`text-[10.5px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                        : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#005d42] border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    +{qt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload Box (Drag-and-Drop or Browse File from PC with Image Preview) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Berkas Poster / Flyer <span className="text-rose-500">*</span>
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-[#005d42] bg-emerald-50/70 scale-[0.99]'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-emerald-600 bg-white hover:bg-slate-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {filePreviewUrl ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  {isPdf ? (
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200">
                      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2 font-bold text-base">
                        PDF
                      </div>
                      <div className="font-bold text-xs text-slate-900">{selectedFile?.name}</div>
                      <div className="text-[11px] text-slate-500">{formatFileSize(selectedFile?.size || 0)}</div>
                    </div>
                  ) : (
                    <div className="relative inline-block max-h-56 overflow-hidden rounded-xl border border-slate-200 shadow-sm group">
                      <img
                        src={filePreviewUrl}
                        alt="Preview Poster"
                        className="max-h-56 w-auto object-contain mx-auto bg-slate-100"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        Klik tombol bawah untuk ganti berkas
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Ganti Berkas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreviewUrl(null);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedFile?.name} ({formatFileSize(selectedFile?.size || 0)})
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005d42] mx-auto flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800">
                      Tarik & lepas poster di sini, atau{' '}
                      <span className="text-[#005d42] underline decoration-emerald-500">Pilih dari Komputer</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mendukung format PNG, JPG, JPEG, WEBP, atau PDF Flyer (Maks. 15 MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Google Drive Cloud Storage Option */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#005d42] flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Simpan ke Google Drive Cloud (/RSUMB_Portal_Files/)</span>
                  {isGoogleDriveConnected() ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/70 px-1.5 py-0.2 rounded-full">
                      Terhubung
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full">
                      Offline
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-emerald-800/80">
                  {isGoogleDriveConnected()
                    ? 'Berkas poster akan diunggah otomatis ke cloud Drive agar dapat diakses semua PC admisi.'
                    : 'Hubungkan Google Drive di menu header agar berkas otomatis tersimpan di cloud.'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={syncToDrive}
                onChange={(e) => setSyncToDrive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005d42]"></div>
            </label>
          </div>

          {driveUploadProgress && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 animate-pulse">
              <Cloud className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <span>{driveUploadProgress}</span>
            </div>
          )}

          {/* Keterangan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Keterangan / Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Tambahkan informasi target pasien, kontak panitia, atau lokasi ruangan..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 bg-white border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !judul.trim() || !selectedFile}
            className="px-5 py-2 bg-[#005d42] hover:bg-[#004732] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isSubmitting ? 'Mengunggah...' : 'Simpan & Publikasikan Poster'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
