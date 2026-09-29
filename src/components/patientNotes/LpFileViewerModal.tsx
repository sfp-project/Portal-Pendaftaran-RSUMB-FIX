import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Download, ExternalLink, Image as ImageIcon, Trash2, Check, AlertCircle } from 'lucide-react';
import { PatientKllRecord } from '../../types/patientNotesTypes';

interface LpFileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PatientKllRecord;
  onSaveLpFile: (updatedRecord: PatientKllRecord) => void;
}

export const LpFileViewerModal: React.FC<LpFileViewerModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaveLpFile
}) => {
  const [statusLp, setStatusLp] = useState(record.statusLp || 'BELUM');
  const [fileUrl, setFileUrl] = useState<string | undefined>(record.lpFileUrl);
  const [fileName, setFileName] = useState<string | undefined>(record.lpFileName);
  const [fileType, setFileType] = useState<'pdf' | 'image' | undefined>(record.lpFileType);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp)$/i);

    if (!isPdf && !isImg) {
      alert('Format file tidak didukung. Harap upload file PDF atau Gambar (JPG/PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileUrl(result);
      setFileName(file.name);
      setFileType(isPdf ? 'pdf' : 'image');
      if (statusLp === 'BELUM' || !statusLp) {
        setStatusLp(`LP DIUPLOAD - ${new Date().toLocaleDateString('id-ID')}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFileUrl(undefined);
    setFileName(undefined);
    setFileType(undefined);
  };

  const handleSave = () => {
    const updated: PatientKllRecord = {
      ...record,
      statusLp: statusLp.trim() || 'BELUM',
      lpFileName: fileName,
      lpFileUrl: fileUrl,
      lpFileType: fileType,
      updatedAt: new Date().toISOString()
    };
    onSaveLpFile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Berkas Surat LP Kepolisian (Laporan Polisi)
              </h3>
              <p className="text-xs text-slate-300">
                Pasien: <span className="font-semibold text-white">{record.namaPasien}</span> (No. RM: {record.noRm})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status LP Input */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor / Status Surat LP
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={statusLp}
                onChange={(e) => setStatusLp(e.target.value)}
                placeholder="Contoh: LP/A/123/IX/2026/Satlantas atau BELUM"
                className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={() => setStatusLp('BELUM')}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Set BELUM
              </button>
            </div>
          </div>

          {/* File Preview or Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lampiran Berkas Digital (PDF / JPG / PNG)
              </span>
              {fileName && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus File
                </button>
              )}
            </div>

            {fileUrl ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 flex flex-col">
                <div className="p-3 bg-slate-800 text-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate max-w-md">
                    {fileType === 'pdf' ? (
                      <FileText className="w-4 h-4 text-rose-400" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="truncate font-medium">{fileName || 'Surat_LP_Digital'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={fileUrl}
                      download={fileName || 'Surat_LP'}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh
                    </a>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka Tab Baru
                    </a>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-center min-h-[320px] max-h-[460px] overflow-auto bg-slate-950/40">
                  {fileType === 'pdf' ? (
                    <iframe
                      src={fileUrl}
                      title="Preview Dokumen LP"
                      className="w-full h-[400px] rounded border border-slate-700 bg-white"
                    />
                  ) : (
                    <img
                      src={fileUrl}
                      alt="Preview Surat LP"
                      className="max-h-[380px] max-w-full object-contain rounded shadow-md"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Klik untuk upload atau tarik file surat ke sini
                </h4>
                <p className="text-xs text-slate-500">
                  Mendukung format file PDF atau Gambar (JPG, PNG, WebP) maks 10MB
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Pastikan nomor Laporan Polisi (LP) sinkron dengan berkas fisik dari Satlantas untuk memudahkan verifikasi klaim penjaminan Jasa Raharja maupun BPJS.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
