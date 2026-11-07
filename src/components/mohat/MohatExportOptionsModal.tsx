import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Calendar,
  Layers,
  CheckCircle2,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { KuponMohat } from '../../types/mohatTypes';
import { formatRupiahMohat } from '../../data/mohatData';

interface MohatExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allKuponList: KuponMohat[];
  filteredKuponList: KuponMohat[];
  initialFormat?: 'EXCEL' | 'PDF';
  onExecuteExportExcel: (listToExport: KuponMohat[], periodLabel: string) => void;
  onExecuteExportPdf: (listToExport: KuponMohat[], periodLabel: string) => void;
}

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export const MohatExportOptionsModal: React.FC<MohatExportOptionsModalProps> = ({
  isOpen,
  onClose,
  allKuponList,
  filteredKuponList,
  initialFormat = 'EXCEL',
  onExecuteExportExcel,
  onExecuteExportPdf
}) => {
  const currentDate = new Date();
  const currentYearStr = String(currentDate.getFullYear());
  const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');

  const [exportFormat, setExportFormat] = useState<'EXCEL' | 'PDF'>(initialFormat);
  const [scope, setScope] = useState<'ALL' | 'MONTH' | 'FILTERED'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  useEffect(() => {
    if (isOpen) {
      setExportFormat(initialFormat);
    }
  }, [isOpen, initialFormat]);

  // Extract available years from coupons
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(currentYearStr);
    yearsSet.add(String(currentDate.getFullYear() - 1));
    allKuponList.forEach((k) => {
      if (k.tanggalMasuk && k.tanggalMasuk.length >= 4) {
        yearsSet.add(k.tanggalMasuk.slice(0, 4));
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [allKuponList, currentYearStr]);

  // Target list based on selected scope
  const { targetList, periodLabel } = useMemo(() => {
    if (scope === 'ALL') {
      return {
        targetList: allKuponList,
        periodLabel: 'Semua Data Kupon (Keseluruhan)'
      };
    }

    if (scope === 'MONTH') {
      const monthPrefix = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      const monthName = MONTH_NAMES[parseInt(selectedMonth, 10) - 1] || 'Bulan Terpilih';
      const filtered = allKuponList.filter((k) => k.tanggalMasuk && k.tanggalMasuk.startsWith(monthPrefix));
      return {
        targetList: filtered,
        periodLabel: `Bulan ${monthName} ${selectedYear}`
      };
    }

    // scope === 'FILTERED'
    return {
      targetList: filteredKuponList,
      periodLabel: 'Sesuai Filter Aktif Tabel Saat Ini'
    };
  }, [scope, allKuponList, filteredKuponList, selectedMonth, selectedYear]);

  // Compute metrics for target list
  const totalNominal = useMemo(() => {
    return targetList.reduce((acc, curr) => acc + (curr.feeTotal || 0), 0);
  }, [targetList]);

  const countPkm = useMemo(() => {
    return targetList.filter((k) => k.kategori === 'PKM').length;
  }, [targetList]);

  const countMohat = useMemo(() => {
    return targetList.filter((k) => k.kategori === 'MOHAT').length;
  }, [targetList]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (targetList.length === 0) {
      return;
    }
    if (exportFormat === 'EXCEL') {
      onExecuteExportExcel(targetList, periodLabel);
    } else {
      onExecuteExportPdf(targetList, periodLabel);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005d42] to-[#004a35] text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl">
              <Download className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Ekspor Laporan Kupon Fee Mohat
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Pilih format berkas & rentang periode data yang ingin diekspor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 bg-slate-50/50 overflow-y-auto max-h-[75vh]">
          {/* 1. Pilih Format Berkas */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              1. Format Berkas Laporan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('EXCEL')}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer text-left ${
                  exportFormat === 'EXCEL'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    exportFormat === 'EXCEL' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Microsoft Excel</h4>
                  <p className="text-[11px] text-slate-500">Berkas spreadsheet (.xlsx)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('PDF')}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer text-left ${
                  exportFormat === 'PDF'
                    ? 'border-[#005d42] bg-emerald-50/80 shadow-xs ring-2 ring-[#005d42]/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    exportFormat === 'PDF' ? 'bg-[#005d42] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Dokumen PDF Resmi</h4>
                  <p className="text-[11px] text-slate-500">Format A4 Landscape Cetak</p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Pilih Cakupan Data (Semua / Bulanan / Filter) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              2. Cakupan Data Laporan
            </label>
            <div className="space-y-2.5">
              {/* Option A: Semua Data */}
              <label
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                  scope === 'ALL'
                    ? 'border-[#005d42] bg-white shadow-xs ring-2 ring-[#005d42]/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === 'ALL'}
                  onChange={() => setScope('ALL')}
                  className="mt-1 text-[#005d42] focus:ring-[#005d42]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Ekspor Semua Data</span>
                    <span className="text-[10.5px] px-2 py-0.5 bg-slate-100 font-bold rounded-full text-slate-700">
                      {allKuponList.length} Kupon
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    Merekap seluruh data kupon fee yang pernah diterbitkan tanpa pembatasan waktu.
                  </p>
                </div>
              </label>

              {/* Option B: Berdasarkan Bulan Tertentu */}
              <div
                className={`p-3.5 rounded-2xl border-2 transition-all space-y-3 ${
                  scope === 'MONTH'
                    ? 'border-[#005d42] bg-white shadow-xs ring-2 ring-[#005d42]/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'MONTH'}
                    onChange={() => setScope('MONTH')}
                    className="mt-1 text-[#005d42] focus:ring-[#005d42]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">
                        Ekspor Berdasarkan Bulan & Tahun
                      </span>
                      <span className="text-[10.5px] px-2 py-0.5 bg-emerald-100 font-bold rounded-full text-emerald-800">
                        Pilihan Periode
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      Pilih bulan dan tahun tertentu untuk rekap pembukuan bulanan kasir/keuangan.
                    </p>
                  </div>
                </label>

                {/* Dropdown Bulan & Tahun */}
                {scope === 'MONTH' && (
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2.5 animate-in fade-in">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                        Pilih Bulan:
                      </label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                      >
                        {MONTH_NAMES.map((mName, idx) => {
                          const val = String(idx + 1).padStart(2, '0');
                          return (
                            <option key={val} value={val}>
                              {mName} ({val})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                        Pilih Tahun:
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                      >
                        {availableYears.map((yr) => (
                          <option key={yr} value={yr}>
                            Tahun {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Option C: Sesuai Filter Tabel Saat Ini */}
              <label
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                  scope === 'FILTERED'
                    ? 'border-[#005d42] bg-white shadow-xs ring-2 ring-[#005d42]/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === 'FILTERED'}
                  onChange={() => setScope('FILTERED')}
                  className="mt-1 text-[#005d42] focus:ring-[#005d42]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      Sesuai Filter Aktif Tabel Saat Ini
                    </span>
                    <span className="text-[10.5px] px-2 py-0.5 bg-blue-100 font-bold rounded-full text-blue-800">
                      {filteredKuponList.length} Kupon
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    Hanya data yang sedang tampil di tabel hasil pencarian, kategori, atau status klaim aktif.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Pratinjau Ringkasan Data yang Akan Diekspor */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ringkasan Data Ekspor ({periodLabel}):</span>
              </span>
              <span className="text-xs font-black text-emerald-900 font-mono">
                {targetList.length} Kupon
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
              <div>
                <span className="text-slate-500 block">Kategori PKM</span>
                <span className="font-bold text-slate-800">{countPkm} Lembar</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kategori Mohat</span>
                <span className="font-bold text-slate-800">{countMohat} Lembar</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Total Nominal Fee</span>
                <span className="font-black text-[#005d42]">{formatRupiahMohat(totalNominal)}</span>
              </div>
            </div>

            {targetList.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Tidak ditemukan kupon untuk periode ini. Silakan pilih bulan atau cakupan lain.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={targetList.length === 0}
            className="px-6 py-2.5 bg-[#005d42] hover:bg-[#004a35] active:bg-[#003827] text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportFormat === 'EXCEL' ? (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Unduh File Excel ({targetList.length} Kupon)</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 text-emerald-200" />
                <span>Pratinjau & Cetak PDF ({targetList.length} Kupon)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
