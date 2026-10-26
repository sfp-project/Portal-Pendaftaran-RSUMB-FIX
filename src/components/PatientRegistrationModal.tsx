import React, { useState } from 'react';
import { X, Printer, FileText, Check, Copy, Sparkles, Layers, SlidersHorizontal } from 'lucide-react';
import { PrintableRegistrationForm, PatientFormRegistrationData } from './forms/PrintableRegistrationForm';
import { printViaWindowPopup } from '../utils/printWindowHelper';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPatientData?: PatientFormRegistrationData;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  initialPatientData
}) => {
  const [printMode, setPrintMode] = useState<'single' | 'triple'>('single');
  const [patientData, setPatientData] = useState<PatientFormRegistrationData>(() => initialPatientData || {
    nama: '',
    nik: '',
    noHp: '',
    tglLahir: ''
  });

  React.useEffect(() => {
    if (initialPatientData) {
      setPatientData(initialPatientData);
    }
  }, [initialPatientData, isOpen]);

  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isOpen) return null;

  // 1. HANDLER CETAK KE POPUP / WINDOW PRINT
  const handlePrint = (mode: 'single' | 'triple' = printMode) => {
    const isTriple = mode === 'triple';
    const paper = document.getElementById('patientRegistrationPaper');
    if (!paper) {
      alert('Elemen formulir tidak ditemukan!');
      return;
    }

    // CSS Khusus untuk Tab / Popup Baru agar tidak terpengaruh ketiadaan Tailwind
    const styles = isTriple
      ? `
      @page {
        size: 215mm 330mm portrait;
        margin: 4mm 5mm;
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
        max-width: 205mm;
        margin: 0 auto;
        padding: 0;
      }
      .print-3-in-1 {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 0 !important;
      }
      .registration-slip-box {
        width: 205mm !important;
        max-width: 205mm !important;
        height: 99mm !important;
        max-height: 100mm !important;
        margin: 0 auto !important;
        border: 1px solid #111111 !important;
        padding: 4mm 6mm !important;
        box-shadow: none !important;
      }
      .cut-line-indicator {
        border-top: 1.5px dashed #333333 !important;
        margin: 2.5mm 0 !important;
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
    `
      : `
      @page {
        size: 215mm 110mm landscape;
        margin: 4mm 5mm;
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
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 0;
        margin: 0;
      }
      .registration-slip-box {
        width: 205mm !important;
        max-width: 205mm !important;
        height: 101mm !important;
        max-height: 102mm !important;
        margin: 0 auto !important;
        border: 1px solid #111111 !important;
        padding: 4.5mm 6mm !important;
        box-shadow: none !important;
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
      title: isTriple
        ? 'Cetak 3-in-1 Formulir Pendaftaran Pasien (F4 3 Rangkap) - RSU Muhammadiyah Babat'
        : 'Cetak Formulir Pendaftaran Pasien (1/3 F4) - RSU Muhammadiyah Babat',
      bodyHtml: `<div class="printable-form">${paper.innerHTML}</div>`,
      styles,
      autoPrint: true
    });
  };

  const handleResetForm = () => {
    setPatientData({ nama: '', nik: '', noHp: '', tglLahir: '' });
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* 1. Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight flex items-center gap-2">
                <span>Formulir Pendaftaran Pasien (Tanpa Identitas)</span>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Standar 1/3 F4 (215 x 110 mm)
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Format slip fisik resmi dengan tabel bergaris pena & QR Code verifikasi admisi RSUMB
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Control Bar (Mode Cetak & Opsi Cepat) */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Pilihan Mode Format Cetak */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPrintMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                printMode === 'single'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1 Lembar (1/3 F4)</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('triple')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                printMode === 'triple'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3 Rangkap 3-in-1 (Kertas F4 Utuh)</span>
            </button>
          </div>

          {/* Tombol Input Data Pasien Opsional */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuickInputOpen(!isQuickInputOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                isQuickInputOpen
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Isi data awal pasien untuk dicetak langsung pada formulir dan QR Code"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isQuickInputOpen ? 'Tutup Input Cepat' : 'Ketik Data Pasien (Opsional)'}</span>
            </button>

            {(patientData.nama || patientData.nik || patientData.noHp) && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-slate-500 hover:text-rose-600 font-medium px-2 py-1 transition-colors cursor-pointer"
              >
                Reset Kosong
              </button>
            )}
          </div>
        </div>

        {/* 2.5 Panel Input Cepat (Jika Dibuka) */}
        {isQuickInputOpen && (
          <div className="px-5 py-3 bg-emerald-50/70 border-b border-emerald-100 text-xs animate-in slide-in-from-top-2">
            <div className="font-bold text-emerald-950 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Input Cepat Data Pasien (Data otomatis mengisi garis formulir & QR Code):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nama Pasien</label>
                <input
                  type="text"
                  placeholder="Contoh: SITI AMINAH"
                  value={patientData.nama || ''}
                  onChange={(e) => setPatientData({ ...patientData, nama: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold uppercase focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">NIK (16 Digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Contoh: 3524..."
                  value={patientData.nik || ''}
                  onChange={(e) => setPatientData({ ...patientData, nik: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Tempat, Tgl Lahir</label>
                <input
                  type="text"
                  placeholder="Contoh: Lamongan, 12-05-1990"
                  value={patientData.tglLahir || ''}
                  onChange={(e) => setPatientData({ ...patientData, tglLahir: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">No. HP / WA</label>
                <input
                  type="text"
                  placeholder="Contoh: 0812..."
                  value={patientData.noHp || ''}
                  onChange={(e) => setPatientData({ ...patientData, noHp: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Pratinjau Formulir yang Responsif Tanpa Scrollbar Horizontal */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 bg-slate-200/90 flex flex-col items-center justify-start">
          <div className="w-full max-w-[215mm] bg-white rounded-lg shadow-md border border-slate-300 p-2 sm:p-3 overflow-x-auto sm:overflow-x-visible">
            <PrintableRegistrationForm
              multiple={printMode === 'triple'}
              patientData={patientData}
            />
          </div>

          <div className="text-[11px] text-slate-600 font-medium mt-3 text-center max-w-lg">
            {printMode === 'triple' ? (
              <span>
                💡 <strong>Mode 3-in-1:</strong> Mencetak 3 rangkap formulir sekaligus dalam 1 lembar kertas F4 utuh dengan garis potong putus-putus untuk menghemat penggunaan kertas loket admisi.
              </span>
            ) : (
              <span>
                💡 <strong>Mode 1 Lembar:</strong> Pas untuk kertas slip pendaftaran 1/3 F4 atau printer continuous form kertas SEP.
              </span>
            )}
          </div>
        </div>

        {/* 4. Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Kop teks rata tengah &bull; Tabel garis isian &bull; QR Code vektor SVG</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {printMode === 'single' ? (
              <button
                type="button"
                onClick={() => handlePrint('single')}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Slip (1/3 F4)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePrint('triple')}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak 3 Rangkap (Kertas F4)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
