import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Trash2,
  Plus,
  Check,
  Tag,
  Cloud
} from 'lucide-react';
import {
  MasterDocumentItem,
  DEFAULT_DOCUMENT_CATEGORIES
} from '../../types/documentRepositoryTypes';
import { formatFileSize } from '../../data/documentRepositoryData';
import { isGoogleDriveConnected } from '../../services/googleAuthService';
import { uploadMediaToGoogleDrive } from '../../services/googleDriveService';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (newDoc: MasterDocumentItem) => void;
  onUploadSuccess?: (newDoc: MasterDocumentItem) => void;
  showToast: (msg: string) => void;
  categories?: string[];
  onAddCategory?: (newCategory: string) => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onUploadSuccess,
  showToast,
  categories = DEFAULT_DOCUMENT_CATEGORIES,
  onAddCategory
}) => {
  const handleUploadCallback = onUpload || onUploadSuccess;
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<string>(categories[0] || DEFAULT_DOCUMENT_CATEGORIES[0]);
  const [keterangan, setKeterangan] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncToDrive, setSyncToDrive] = useState<boolean>(() => isGoogleDriveConnected());
  const [driveProgress, setDriveProgress] = useState<string | null>(null);

  // Dynamic Add Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const newCatInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(kategori)) {
      setKategori(categories[0]);
    }
  }, [categories, kategori]);

  useEffect(() => {
    if (isAddingCategory && newCatInputRef.current) {
      newCatInputRef.current.focus();
    }
  }, [isAddingCategory]);

  if (!isOpen) return null;

  const handleReset = () => {
    setJudul('');
    setKategori(categories[0] || DEFAULT_DOCUMENT_CATEGORIES[0]);
    setKeterangan('');
    setSelectedFile(null);
    setFileDataUrl(null);
    setIsDragging(false);
    setIsSubmitting(false);
    setErrorMessage(null);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setNewCategoryError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSaveNewCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCat = newCategoryName.trim().toUpperCase();
    if (!cleanCat) {
      setNewCategoryError('Nama kategori tidak boleh kosong.');
      return;
    }
    if (categories.includes(cleanCat)) {
      setNewCategoryError('Kategori ini sudah terdaftar.');
      setKategori(cleanCat);
      setIsAddingCategory(false);
      setNewCategoryName('');
      return;
    }

    onAddCategory(cleanCat);
    setKategori(cleanCat);
    setNewCategoryName('');
    setNewCategoryError(null);
    setIsAddingCategory(false);
    showToast(`Kategori "${cleanCat}" berhasil ditambahkan.`);
  };

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['docx', 'doc', 'pdf'];
    if (!allowedExtensions.includes(ext)) {
      setErrorMessage('Format berkas tidak didukung. Harap unggah berkas berekstensi .docx, .doc, atau .pdf.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Auto fill Judul if currently empty
    if (!judul.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      setJudul(cleanName);
    }

    // Read file as Data URL so user can download the exact file later
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca berkas yang dipilih.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      setErrorMessage('Harap isi Judul Dokumen.');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Harap pilih berkas master (.docx / .pdf) yang akan diunggah.');
      return;
    }

    setIsSubmitting(true);
    setDriveProgress(null);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'docx';
      const formatBerkas = ext === 'pdf' ? 'pdf' : (ext === 'docx' || ext === 'doc' ? 'docx' : ext);

      let driveData: { fileId?: string; viewLink?: string; downloadLink?: string } = {};

      if (syncToDrive && isGoogleDriveConnected()) {
        setDriveProgress('Mengunggah ke folder Google Drive /RSUMB_Portal_Files/...');
        try {
          const driveRes = await uploadMediaToGoogleDrive(
            selectedFile,
            `DOC_${Date.now()}_${selectedFile.name}`,
            selectedFile.type || 'application/octet-stream'
          );
          driveData = {
            fileId: driveRes.fileId,
            viewLink: driveRes.webViewLink,
            downloadLink: driveRes.webContentLink
          };
        } catch (driveErr) {
          console.warn('Gagal upload dokumen ke Google Drive, melanjutkan simpan lokal:', driveErr);
        }
      }

      const newDocument: MasterDocumentItem = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        judul: judul.trim(),
        kategori,
        keterangan: keterangan.trim() || 'Tidak ada keterangan tambahan',
        formatBerkas,
        namaBerkas: selectedFile.name,
        ukuranBerkas: formatFileSize(selectedFile.size),
        ukuranBytes: selectedFile.size,
        tanggalDiunggah: new Date().toISOString(),
        fileData: fileDataUrl || undefined,
        blobUrl: URL.createObjectURL(selectedFile),
        driveFileId: driveData.fileId,
        driveViewLink: driveData.viewLink,
        driveWebContentLink: driveData.downloadLink,
        driveFolderName: driveData.fileId ? 'RSUMB_Portal_Files' : undefined
      };

      handleUploadCallback?.(newDocument);
      const driveMsg = driveData.fileId ? ' & tersimpan di Google Drive (/RSUMB_Portal_Files/)' : '';
      showToast(`Berkas master "${newDocument.judul}" berhasil diunggah${driveMsg}.`);
      handleClose();
    } catch (err: any) {
      setErrorMessage(`Gagal mengunggah berkas: ${err?.message || 'Kesalahan sistem'}`);
    } finally {
      setIsSubmitting(false);
      setDriveProgress(null);
    }
  };

  return (
    <div
      id="upload-document-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto text-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#005d42]" />
              Upload Form Baru
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan berkas master resmi (.docx / .pdf) ke repositori dokumen RSUMB
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Judul Dokumen */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul Dokumen / Nama Form <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="e.g. Formulir Klaim Rawat Jalan & Gigi AdMedika"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] transition-colors"
            />
          </div>

          {/* 2. Kategori Dokumen (Dengan Opsi Tambah Kategori Baru Dinamis) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#005d42]" />
                <span>Kategori Dokumen</span>
                <span className="text-rose-500">*</span>
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(true);
                    setNewCategoryName('');
                    setNewCategoryError(null);
                  }}
                  className="text-xs text-[#005d42] hover:text-[#004732] hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Tambah kategori baru secara mandiri"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Tambah Kategori Baru</span>
                </button>
              )}
            </div>

            {/* Inline Input untuk Tambah Kategori Baru */}
            {isAddingCategory ? (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 mb-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                    <Plus className="w-3 h-3 text-[#005d42]" />
                    Buat Kategori Baru
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                      setNewCategoryError(null);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={newCatInputRef}
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      if (newCategoryError) setNewCategoryError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveNewCategory();
                      }
                    }}
                    placeholder="Contoh: ADMEDIKA, SDM/INTERNAL, KEUANGAN..."
                    className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNewCategory()}
                    className="px-3 py-1.5 bg-[#005d42] hover:bg-[#004732] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
                {newCategoryError && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {newCategoryError}
                  </p>
                )}
                <p className="text-[10px] text-emerald-800/80">
                  Kategori baru akan otomatis tersimpan dan tersedia pada filter tabel repositori.
                </p>
              </div>
            ) : (
              <select
                value={kategori}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setIsAddingCategory(true);
                    setNewCategoryName('');
                    setNewCategoryError(null);
                  } else {
                    setKategori(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] transition-colors cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__ADD_NEW__" className="text-[#005d42] font-bold">
                  + Tambah Kategori Baru...
                </option>
              </select>
            )}
          </div>

          {/* 3. Keterangan Singkat */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Keterangan Singkat
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="e.g. Format dokumen master resmi untuk keperluan pengajuan klaim penjaminan pasien rawat jalan dan poli gigi RSUMB."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] transition-colors resize-none"
            />
          </div>

          {/* 4. Area Dropzone/Upload File */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Berkas Master Dokumen (.docx / .pdf) <span className="text-rose-500">*</span>
            </label>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#005d42] bg-emerald-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-[#005d42] bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-[#005d42] mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  Tarik & jatuhkan berkas ke sini, atau <span className="text-[#005d42] underline">klik untuk memilih</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mendukung format <strong>.docx</strong> atau <strong>.pdf</strong> (Ukuran berkas bebas)
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedFile.name.toLowerCase().endsWith('.pdf')
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500">
                        {formatFileSize(selectedFile.size)}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                        selectedFile.name.toLowerCase().endsWith('.pdf')
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-sky-100 text-sky-800 border-sky-200'
                      }`}>
                        .{selectedFile.name.split('.').pop()?.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 text-xs text-[#005d42] hover:bg-emerald-100 font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Ganti Berkas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileDataUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus pilihan berkas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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
                    ? 'Dokumen master akan diunggah ke cloud Drive RSUMB agar semua staf dapat mengunduh berkas asli.'
                    : 'Hubungkan Google Drive di menu atas untuk menyimpan otomatis ke cloud drive.'}
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

          {driveProgress && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 animate-pulse">
              <Cloud className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <span>{driveProgress}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 mt-5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile || !judul.trim()}
              className="px-5 py-2.5 bg-[#005d42] hover:bg-[#004732] disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg disabled:shadow-none transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengunggah...' : 'Upload Dokumen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
