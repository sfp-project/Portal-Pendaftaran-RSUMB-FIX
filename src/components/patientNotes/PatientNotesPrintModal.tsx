import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';
import {
  PatientNotesTab,
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord
} from '../../types/patientNotesTypes';

interface PatientNotesPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubTab: PatientNotesTab;
  kllRecords: PatientKllRecord[];
  bpjsRecords: PatientBpjsKendalaRecord[];
  asuransiRecords: PatientAsuransiSwastaRecord[];
  umumRecords: PatientUmumBeresikoRecord[];
}

export const PatientNotesPrintModal: React.FC<PatientNotesPrintModalProps> = ({
  isOpen,
  onClose,
  activeSubTab,
  kllRecords,
  bpjsRecords,
  asuransiRecords,
  umumRecords
}) => {
  const [printScope, setPrintScope] = useState<'current' | 'all'>('current');

  if (!isOpen) return null;

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const getSubTabTitle = (tab: PatientNotesTab) => {
    switch (tab) {
      case 'kll': return 'Pasien Kecelakaan Lalu Lintas (KLL & Jasa Raharja)';
      case 'bpjs_kendala': return 'Pasien BPJS Kendala Kepesertaan & Bridging SEP';
      case 'asuransi_swasta': return 'Catatan Khusus Pasien Asuransi Swasta & Handover Shift';
      case 'umum_beresiko': return 'Early Warning Pasien UMUM Beresiko (Biaya, APS & Komplain)';
      default: return 'Catatan Khusus Pasien';
    }
  };

  const handlePrint = () => {
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekap Harian Admisi - RSU Muhammadiyah Babat</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: Arial, sans-serif; padding: 15px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .header h2 { margin: 0; font-size: 18px; color: #006633; }
          .header p { margin: 2px 0; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .no-print { margin-bottom: 15px; text-align: right; }
          .btn { padding: 8px 16px; background: #006633; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn" onclick="window.print()">🖨️ CETAK SEKARANG</button>
          <button class="btn" style="background:#666;" onclick="window.close()">❌ TUTUP</button>
        </div>
        ${document.querySelector('.print-content-area')?.innerHTML || ''}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      alert('Harap izinkan Pop-up pada browser Anda untuk mencetak!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-base text-white">Cetak Rekapitulasi Catatan Khusus Pasien</h3>
          <button onClick={onClose} className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer">
            <Printer className="w-4 h-4" /> <span>Cetak Dokumen (Print)</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div className="print-content-area bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 max-w-3xl mx-auto text-slate-800 text-xs">
            <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                RUMAH SAKIT UMUM MUHAMMADIYAH BABAT
              </h2>
            </div>
            {/* ... Content here ... */}
          </div>
        </div>
      </div>
    </div>
  );
};
