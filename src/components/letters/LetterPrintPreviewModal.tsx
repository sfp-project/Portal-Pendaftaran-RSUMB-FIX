import React from 'react';
import {
  X,
  Printer,
  Download,
  FileText
} from 'lucide-react';
import { MedicalLetterItem } from '../../types/letterTypes';
import { generateMedicalLetterPDF } from '../../utils/letterPdfGenerator';
import { getLetterTypeLabel } from '../../data/letterData';
import { DocumentSheetRenderer } from './DocumentSheetRenderer';

interface LetterPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: MedicalLetterItem | null;
  onEdit?: (letter: MedicalLetterItem) => void;
}

export const LetterPrintPreviewModal: React.FC<LetterPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  letter,
  onEdit
}) => {
  if (!isOpen || !letter) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    await generateMedicalLetterPDF(letter);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:h-auto print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between print:hidden no-print shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold truncate">
                Preview Dokumen Cetak: {getLetterTypeLabel(letter.jenisSurat)}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {letter.nomorSurat} &bull; Pasien: {letter.namaPasien}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(letter);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Edit Data
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#005d42] hover:bg-[#004732] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak A4 / Folio</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Canvas (A4 Aspect Ratio) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-slate-200/60 print:bg-white print:p-0 flex justify-center items-start">
          <div className="w-full max-w-[210mm] print:max-w-none print:w-full">
            <DocumentSheetRenderer letter={letter} />
          </div>
        </div>
      </div>
    </div>
  );
};
