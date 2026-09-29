import React from 'react';
import {
  X,
  Download,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  FileText,
  Printer,
  ExternalLink,
  ShieldCheck,
  Cloud
} from 'lucide-react';
import { PosterPromoItem } from '../../types/posterPromoTypes';
import { isPosterExpired, formatIndoDate } from '../../data/posterPromoData';

interface PosterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  poster: PosterPromoItem | null;
  onDownload: (poster: PosterPromoItem) => void;
}

export const PosterPreviewModal: React.FC<PosterPreviewModalProps> = ({
  isOpen,
  onClose,
  poster,
  onDownload
}) => {
  if (!isOpen || !poster) return null;

  const isExpired = isPosterExpired(poster.tanggalKadaluarsa);
  const isPdf = poster.formatBerkas?.toLowerCase() === 'pdf' || poster.namaBerkas?.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#005d42] to-[#004732] text-white px-5 py-3.5 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <span className="p-2 rounded-xl bg-white/15 text-emerald-300 shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {poster.judul}
              </h2>
              <div className="flex items-center gap-2 text-xs text-emerald-100/90 mt-0.5">
                <span>{poster.kategoriPromo}</span>
                <span>•</span>
                <span>{poster.namaBerkas} ({poster.ukuranBerkas})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {poster.driveViewLink && (
              <a
                href={poster.driveViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold border border-emerald-400/40 transition cursor-pointer"
                title="Buka Berkas Asli di Google Drive"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">Google Drive</span>
                <ExternalLink className="w-3 h-3 text-emerald-200" />
              </a>
            )}

            <button
              type="button"
              onClick={() => onDownload(poster)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold border border-white/20 transition cursor-pointer"
              title="Unduh Berkas Poster"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Unduh</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Tutup pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            {isExpired ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Promo Kadaluarsa</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Promo Aktif</span>
              </span>
            )}

            {/* Masa Berlaku */}
            {(poster.tanggalMulai || poster.tanggalKadaluarsa) && (
              <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {poster.tanggalMulai ? formatIndoDate(poster.tanggalMulai) : 'Sekarang'} s/d{' '}
                  {poster.tanggalKadaluarsa ? formatIndoDate(poster.tanggalKadaluarsa) : 'Seterusnya'}
                </span>
              </span>
            )}

            {/* Google Drive Status */}
            {poster.driveFileId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Drive Cloud (/RSUMB_Portal_Files/)</span>
              </span>
            )}
          </div>

          <div className="text-slate-500 text-[11px]">
            Diunggah pada: <span className="font-semibold text-slate-700">{poster.tanggalDiunggah}</span>
          </div>
        </div>

        {/* Poster Content Viewer - Scrollable */}
        <div className="flex-1 overflow-auto bg-slate-900/95 flex items-center justify-center p-4 min-h-[300px]">
          {isPdf ? (
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center text-white bg-slate-800 rounded-xl p-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-400/30">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{poster.namaBerkas}</h4>
                <p className="text-xs text-slate-400 mt-1">Dokumen Flyer Berformat PDF ({poster.ukuranBerkas})</p>
              </div>
              <button
                type="button"
                onClick={() => onDownload(poster)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Buka / Unduh Berkas PDF Lengkap</span>
              </button>
            </div>
          ) : (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={poster.fileData || ''}
                alt={poster.judul}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer Details */}
        <div className="px-5 py-3 sm:px-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {poster.tags && poster.tags.length > 0 ? (
              poster.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium"
                >
                  #{t}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">Tidak ada tag kata kunci</span>
            )}
            {poster.keterangan && (
              <span className="text-xs text-slate-600 sm:ml-2 line-clamp-1 border-l sm:pl-2 border-slate-200">
                {poster.keterangan}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onDownload(poster)}
              className="px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Poster</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
