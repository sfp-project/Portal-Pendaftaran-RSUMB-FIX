import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  QrCode,
  ExternalLink,
  Check,
  Copy,
  Link as LinkIcon,
  RotateCcw,
  Sparkles,
  Info,
  Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { printViaWindowPopup } from '../../utils/printWindowHelper';

interface PatientSelfRegistrationStandeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  formUrl?: string;
  onUrlChange?: (newUrl: string) => void;
}

export const getDefaultDynamicUrl = (): string => {
  if (typeof window !== 'undefined') {
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    const cleanPath = window.location.pathname.replace(/\/$/, '');
    return `${origin}${cleanPath}/#/form-mandiri-pasien`;
  }
  return 'https://rsumb-pendaftaran.web.app/#/form-mandiri-pasien';
};

export const formatEffectiveQrUrl = (inputUrl: string): string => {
  if (!inputUrl || !inputUrl.trim()) {
    return getDefaultDynamicUrl();
  }
  const trimmed = inputUrl.trim();
  // If already has #, ?, or is a Google Form / external form link
  if (
    trimmed.includes('#') ||
    trimmed.includes('?') ||
    trimmed.includes('forms.gle') ||
    trimmed.includes('docs.google.com')
  ) {
    return trimmed;
  }
  // If it's a domain/host like https://pendaftaran-rsumb.netlify.app
  return `${trimmed.replace(/\/$/, '')}/#/form-mandiri-pasien`;
};

export const PatientSelfRegistrationStandeeModal: React.FC<PatientSelfRegistrationStandeeModalProps> = ({
  isOpen,
  onClose,
  formUrl: initialFormUrl,
  onUrlChange
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A5');
  const [customInputUrl, setCustomInputUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('rsumb_custom_self_reg_url') || '';
    } catch {
      return '';
    }
  });

  const [copied, setCopied] = useState(false);

  // Hitung URL efektif yang ditargetkan QR Code
  const effectiveUrl = useMemo(() => {
    return formatEffectiveQrUrl(customInputUrl);
  }, [customInputUrl]);

  if (!isOpen) return null;

  const handleCustomUrlChange = (val: string) => {
    setCustomInputUrl(val);
    const formatted = formatEffectiveQrUrl(val);
    try {
      if (val.trim()) {
        localStorage.setItem('rsumb_custom_self_reg_url', val.trim());
      } else {
        localStorage.removeItem('rsumb_custom_self_reg_url');
      }
      window.dispatchEvent(new CustomEvent('rsumb_custom_url_updated', { detail: formatted }));
    } catch {}
    if (onUrlChange) {
      onUrlChange(formatted);
    }
  };

  const handleResetToDefault = () => {
    setCustomInputUrl('');
    const defaultUrl = getDefaultDynamicUrl();
    try {
      localStorage.removeItem('rsumb_custom_self_reg_url');
      window.dispatchEvent(new CustomEvent('rsumb_custom_url_updated', { detail: defaultUrl }));
    } catch {}
    if (onUrlChange) {
      onUrlChange(defaultUrl);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(effectiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = (size: 'A4' | 'A5' = paperSize) => {
    const standeeElement = document.getElementById('standeePosterPaper');
    if (!standeeElement) {
      alert('Elemen poster standee tidak ditemukan!');
      return;
    }

    const isA5 = size === 'A5';
    const qrPrintSize = isA5 ? '215px' : '260px';

    const styles = `
      @page {
        size: ${isA5 ? 'A5 portrait' : 'A4 portrait'};
        margin: ${isA5 ? '4mm 5mm' : '8mm 10mm'};
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Segoe UI', Arial, Helvetica, sans-serif !important;
      }
      .print-document-body {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        margin: 0;
      }
      .standee-poster-card {
        width: 100% !important;
        max-width: ${isA5 ? '138mm' : '190mm'} !important;
        margin: 0 auto !important;
        border: 2px solid #005d42 !important;
        border-radius: 8px !important;
        padding: ${isA5 ? '6mm 7mm' : '12mm 14mm'} !important;
        box-shadow: none !important;
      }
      .qr-code-box svg {
        width: ${qrPrintSize} !important;
        height: ${qrPrintSize} !important;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        .no-print, .print-control-bar {
          display: none !important;
        }
      }
    `;

    printViaWindowPopup({
      title: `Standee Meja Admisi QR Code Pendaftaran Mandiri (${size}) - RSUMB`,
      bodyHtml: `<div class="standee-wrapper">${standeeElement.innerHTML}</div>`,
      styles,
      autoPrint: true
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* 1. Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Cetak Standee Meja QR Code Pendaftaran Mandiri
              </h3>
              <p className="text-xs text-slate-500">
                Format resmi tanpa logo dengan QR Code ekstra besar untuk meja pendaftaran admisi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Bidang Input: URL Web Publik (Opsional / Override) */}
        <div className="px-5 py-3 bg-emerald-50/60 border-b border-emerald-100 text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-700" />
              <span>URL Web Publik (Opsional / Override):</span>
            </label>
            <span className="text-[11px] text-emerald-800/80 font-medium">
              {customInputUrl ? 'Menggunakan link kustom' : 'Otomatis mengikuti domain hosting aktif'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Contoh: https://pendaftaran-rsumb.netlify.app atau https://forms.gle/..."
              value={customInputUrl}
              onChange={(e) => handleCustomUrlChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400 shadow-2xs"
            />
            {customInputUrl ? (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-all text-xs"
                title="Kembalikan ke URL otomatis bawaan (origin + pathname)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bawaan</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-1.5 rounded-xl font-mono font-bold shrink-0">
                Otomatis
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono pt-0.5">
            <span className="truncate max-w-[85%]">
              Target QR: <strong className="text-emerald-900">{effectiveUrl}</strong>
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="text-emerald-800 hover:text-emerald-950 font-sans font-bold underline cursor-pointer shrink-0 ml-2"
            >
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

        {/* 2.5 Control Bar (Ukuran & Tombol Aksi Cepat) */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Pilihan Ukuran Kertas */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold px-1.5">Ukuran Kertas:</span>
            <button
              type="button"
              onClick={() => setPaperSize('A5')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                paperSize === 'A5'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A5 (Standee Akrilik Meja)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('A4')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                paperSize === 'A4'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 (Poster Dinding)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
            </button>

            <a
              href={effectiveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-semibold cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Form Pasien ↗</span>
            </a>
          </div>
        </div>

        {/* 3. Paper Preview Area (Standee Meja Akrilik) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/90 flex justify-center items-center">
          <div
            id="standeePosterPaper"
            className="standee-poster-card w-full max-w-[380px] bg-white rounded-xl shadow-lg border-2 border-[#005d42] p-6 text-center text-slate-900 select-text font-sans"
            style={{
              fontFamily: "'Segoe UI', Arial, sans-serif"
            }}
          >
            {/* Header Kop RSUMB Bersih Rata Tengah (Tanpa Logo Lingkaran) */}
            <div style={{ textAlign: 'center', borderBottom: '2.5px solid #005d42', paddingBottom: '8px' }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '14pt',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: '#005d42',
                  lineHeight: 1.15
                }}
              >
                RSU MUHAMMADIYAH BABAT
              </div>
              <div style={{ fontSize: '8.5pt', color: '#222222', marginTop: '2px', fontWeight: 600 }}>
                Jl. Raya Babat-Surabaya KM. 4, Babat, Lamongan &bull; Telp: (0322) 451125
              </div>
              <div style={{ fontSize: '7.5pt', color: '#444444' }}>
                Layanan Pendaftaran & Informasi 24 Jam: 0857-8407-2740
              </div>
            </div>

            {/* Banner Utama */}
            <div className="mt-4 space-y-1">
              <span className="inline-block bg-emerald-100 text-[#005d42] text-[10.5px] font-black uppercase px-3 py-0.5 rounded-full border border-emerald-300 tracking-wider">
                Layanan Cepat Loket Admisi
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950 leading-tight">
                PENDAFTARAN MANDIRI PASIEN
              </h2>
              <p className="text-[11px] text-slate-600 font-medium">
                Khusus Pasien Baru / Belum Membawa Identitas Fisik KTP & Kartu BPJS
              </p>
            </div>

            {/* QR Code Container EKSTRA BESAR (240px x 240px) */}
            <div className="my-4 flex flex-col items-center">
              <div className="qr-code-box p-4 bg-white rounded-2xl border-2 border-emerald-600 shadow-md inline-block">
                <QRCodeSVG
                  value={effectiveUrl}
                  size={240}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="mt-2 text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 break-all max-w-[90%]">
                {effectiveUrl}
              </div>
            </div>

            {/* 3 Petunjuk Praktis */}
            <div className="bg-emerald-50/80 rounded-xl p-3.5 border border-emerald-200 text-left text-xs space-y-2 text-slate-800">
              <div className="font-extrabold text-[#005d42] text-[11px] uppercase tracking-wide">
                Langkah Mudah Pengisian:
              </div>
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="w-4 h-4 rounded-full bg-[#005d42] text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  1
                </span>
                <span>Buka Kamera HP atau Aplikasi QR Scanner, lalu arahkan ke kode QR di atas.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="w-4 h-4 rounded-full bg-[#005d42] text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  2
                </span>
                <span>Lengkapi data diri pasien pada formulir online dan tekan <strong>Kirim</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="w-4 h-4 rounded-full bg-[#005d42] text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  3
                </span>
                <span>Datang ke loket pendaftaran dan sebutkan nama pasien untuk konfirmasi antrean.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
              <span>Hotline 24 Jam: (0322) 451125</span>
              <span>Pelayanan Ramah & Amanah</span>
            </div>
          </div>
        </div>

        {/* 4. Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Ukuran QR Code telah diperbesar (240px) & siap cetak untuk Standee Akrilik Meja (A5)
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => handlePrint(paperSize)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Standee ({paperSize})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
