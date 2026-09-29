import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ExportDropdownProps {
  onExportExcel: () => void | Promise<void>;
  onExportPdf: () => void | Promise<void>;
  buttonLabel?: string;
  className?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportExcel,
  onExportPdf,
  buttonLabel = 'Ekspor Data',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingType, setLoadingType] = useState<'excel' | 'pdf' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectExcel = async () => {
    setIsOpen(false);
    setLoadingType('excel');
    try {
      await onExportExcel();
    } finally {
      setLoadingType(null);
    }
  };

  const handleSelectPdf = async () => {
    setIsOpen(false);
    setLoadingType('pdf');
    try {
      await onExportPdf();
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={loadingType !== null}
        className="p-2 sm:px-3 sm:py-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer select-none active:scale-98 disabled:opacity-60"
        title="Pilihan Ekspor Data (Excel & PDF)"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {loadingType ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#005d42]" />
        ) : (
          <Download className="w-3.5 h-3.5 text-[#005d42]" />
        )}
        <span className="hidden sm:inline font-bold">{buttonLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Format Dokumen Ekspor
          </div>

          {/* Opsi 1: Ekspor ke Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleSelectExcel}
            className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 text-xs font-medium text-slate-700 hover:text-emerald-900 flex items-start gap-3 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200 transition-colors shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 group-hover:text-emerald-950">
                Ekspor ke Excel (.xlsx)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Header hijau RSUMB, kolom rapi & auto-fit
              </div>
            </div>
          </button>

          {/* Opsi 2: Ekspor ke PDF (.pdf) */}
          <button
            type="button"
            onClick={handleSelectPdf}
            className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 text-xs font-medium text-slate-700 hover:text-rose-900 flex items-start gap-3 transition-colors cursor-pointer group border-t border-slate-100"
          >
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-200 transition-colors shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 group-hover:text-rose-950">
                Ekspor ke PDF (.pdf)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Kop Resmi RSUMB, A4 Lanskap & kolom verifikasi
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
