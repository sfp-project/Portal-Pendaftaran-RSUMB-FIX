import React, { useRef, useState } from 'react';
import { X, Printer, Copy, Check, Download, ReceiptText } from 'lucide-react';
import {
  MonthlyScheduleData,
  StaffCalculatedSummary,
  DepartmentTotalSummary,
  IncentiveRates
} from '../types/incentiveTypes';
import { formatRupiah } from '../utils/incentiveExport';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthData: MonthlyScheduleData;
  summaries?: StaffCalculatedSummary[];
  staffSummaries?: StaffCalculatedSummary[];
  departmentTotals: DepartmentTotalSummary;
  rates: IncentiveRates;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  monthData,
  summaries,
  staffSummaries,
  departmentTotals,
  rates
}) => {
  const activeSummaries = summaries || staffSummaries || [];
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const currentTimeStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Handler Print untuk Printer Thermal 80mm
  const handlePrintThermal = () => {
    window.print();
  };

  // Generate plain text version for copying or raw thermal dispatch
  const generateRawReceiptText = () => {
    const dividerDouble = '==========================================';
    const dividerSingle = '------------------------------------------';

    let text = `${dividerDouble}\n`;
    text += `          RSU MUHAMMADIYAH BABAT\n`;
    text += `       Jl. Raya Babat - Lamongan\n`;
    text += `      REKAPITULASI INSENTIF DINAS\n`;
    text += `        UNIT PENDAFTARAN & ADMISI\n`;
    text += `${dividerDouble}\n`;
    text += `Periode : ${monthData.monthName} ${monthData.year}\n`;
    text += `Tanggal : ${currentDateStr} ${currentTimeStr} WIB\n`;
    text += `Tarif   : M=Rp ${rates.uangMalam.toLocaleString('id-ID')} | Makan=Rp ${rates.uangMakan.toLocaleString('id-ID')}\n`;
    text += `${dividerSingle}\n`;
    text += `NO NAMA PEGAWAI       U.MALAM   U.MAKAN     TOTAL\n`;
    text += `${dividerSingle}\n`;

    activeSummaries.forEach((s, idx) => {
      const no = String(idx + 1).padEnd(2, ' ');
      // Format nama max 14 chars with (X M)
      const nameWithM = `${s.name.slice(0, 11)} (${s.countM}M)`.padEnd(16, ' ');
      const uMalam = s.uangMalam.toLocaleString('id-ID').padStart(8, ' ');
      const uMakan = s.uangMakan.toLocaleString('id-ID').padStart(9, ' ');
      const total = s.totalInsentif.toLocaleString('id-ID').padStart(9, ' ');
      text += `${no} ${nameWithM}${uMalam} ${uMakan} ${total}\n`;
    });

    text += `${dividerDouble}\n`;
    text += `TOTAL KESELURUHAN (${departmentTotals.totalStaff} Pegawai)\n`;
    text += `${dividerSingle}\n`;
    text += `Total Shift Malam (M): ${String(departmentTotals.totalM).padStart(4, ' ')} Shift\n`;
    text += `Total Uang Malam     : Rp ${departmentTotals.totalUangMalam.toLocaleString('id-ID')}\n`;
    text += `Total Uang Makan     : Rp ${departmentTotals.totalUangMakan.toLocaleString('id-ID')}\n`;
    text += `${dividerSingle}\n`;
    text += `GRAND TOTAL INSENTIF : Rp ${departmentTotals.grandTotalInsentif.toLocaleString('id-ID')}\n`;
    text += `${dividerDouble}\n`;
    text += `Mengetahui,                 Petugas,\n\n\n`;
    text += `( PJ Pendaftaran )          ( Keuangan )\n`;
    text += `${dividerSingle}\n`;
    text += `* SIMRS MedCentral - Epson TM-T82X 80mm *\n`;
    text += `${dividerDouble}\n`;

    return text;
  };

  const handleCopyText = async () => {
    try {
      const text = generateRawReceiptText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy receipt:', err);
    }
  };

  const handleDownloadTxt = () => {
    const text = generateRawReceiptText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk_Insentif_RSUMB_${monthData.monthName}_${monthData.year}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <div className="leading-tight">Pratinjau Struk Thermal (80mm)</div>
              <div className="text-[11px] font-normal text-slate-500">
                Kompatibel dengan printer thermal Epson TM-T82X & POS 80mm
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Thermal Slip Preview */}
        <div className="p-6 overflow-y-auto bg-slate-100/70 flex justify-center">
          {/* Thermal Paper Simulation Container */}
          <div
            id="thermal-print-area"
            ref={receiptRef}
            className="bg-white p-5 rounded-lg shadow-md border border-slate-300 w-full max-w-[360px] text-black text-[12px] leading-snug select-text"
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace, sans-serif",
              color: '#000000'
            }}
          >
            {/* Kop RS */}
            <div className="text-center font-extrabold text-[13px] pb-0.5 uppercase text-black">
              RSU MUHAMMADIYAH BABAT
            </div>
            <div className="text-center text-[10px] text-black pb-0.5">
              Jl. Raya Babat-Surabaya KM. 4 Babat, Lamongan
            </div>
            <div className="text-center font-black text-[12px] pt-1 pb-0.5 uppercase text-black">
              REKAPITULASI INSENTIF DINAS
            </div>
            <div className="text-center text-[10px] font-semibold text-black pb-1 uppercase">
              UNIT PENDAFTARAN & ADMISI
            </div>

            <div className="border-b-2 border-dashed border-black my-2" />

            {/* Info Periode */}
            <div className="space-y-1 text-[11px] text-black">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-black">Periode:</span>
                <span className="font-bold text-black">{monthData.monthName} {monthData.year}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="font-semibold text-black">Waktu Cetak:</span>
                <span className="font-bold text-black">{currentDateStr} {currentTimeStr} WIB</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="font-semibold text-black">Tarif U. Malam:</span>
                <span className="font-bold text-black">{formatRupiah(rates.uangMalam)} / shift</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="font-semibold text-black">Tarif U. Makan:</span>
                <span className="font-bold text-black">{formatRupiah(rates.uangMakan)} / hari</span>
              </div>
            </div>

            <div className="border-b border-dashed border-black my-2" />

            {/* Header Kolom Tabel Sesuai Ketentuan (No, Nama, U.Malam, U.Makan, Grand Total) */}
            <div className="grid grid-cols-12 font-bold text-[10.5px] pb-1 border-b border-dashed border-black text-black">
              <span className="col-span-1 text-center">NO</span>
              <span className="col-span-4">NAMA</span>
              <span className="col-span-2 text-right">U.MLM</span>
              <span className="col-span-2 text-right">U.MKN</span>
              <span className="col-span-3 text-right">TOTAL</span>
            </div>

            {/* Data Baris Staf */}
            <div className="divide-y divide-dashed divide-black py-1 space-y-1">
              {activeSummaries.map((staff, idx) => (
                <div key={staff.id} className="grid grid-cols-12 text-[10.5px] pt-1 items-center text-black">
                  <span className="col-span-1 text-center font-semibold text-black">{idx + 1}</span>
                  <span className="col-span-4 font-bold truncate pr-1 text-black">
                    {staff.name}
                    <span className="font-normal text-[9.5px] ml-0.5">({staff.countM}M)</span>
                  </span>
                  <span className="col-span-2 text-right font-medium text-black">
                    {staff.uangMalam.toLocaleString('id-ID')}
                  </span>
                  <span className="col-span-2 text-right font-medium text-black">
                    {staff.uangMakan.toLocaleString('id-ID')}
                  </span>
                  <span className="col-span-3 text-right font-bold text-black">
                    {staff.totalInsentif.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-b-2 border-dashed border-black my-2" />

            {/* Summary / Total Row at Bottom */}
            <div className="space-y-1 text-[11px] text-black">
              <div className="font-black text-center pb-1 text-[11.5px] uppercase">
                TOTAL KESELURUHAN ({departmentTotals.totalStaff} Staf)
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-black">Total Shift Malam (M):</span>
                <span className="font-bold text-black">{departmentTotals.totalM} Shift</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-black">Total Uang Malam:</span>
                <span className="font-bold text-black">{formatRupiah(departmentTotals.totalUangMalam)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-black">Total Uang Makan:</span>
                <span className="font-bold text-black">{formatRupiah(departmentTotals.totalUangMakan)}</span>
              </div>
              <div className="border-b border-dashed border-black my-1" />
              <div className="flex justify-between font-black text-[13px] pt-0.5 text-black">
                <span>GRAND TOTAL:</span>
                <span>{formatRupiah(departmentTotals.grandTotalInsentif)}</span>
              </div>
            </div>

            <div className="border-b-2 border-dashed border-black my-2.5" />

            {/* Tanda Tangan */}
            <div className="grid grid-cols-2 text-center text-[10.5px] pt-1 text-black">
              <div>
                <div className="font-semibold">Mengetahui,</div>
                <div className="text-[9.5px]">PJ Pendaftaran</div>
                <div className="h-10" />
                <div className="border-b border-black mx-4" />
              </div>
              <div>
                <div className="font-semibold">Petugas,</div>
                <div className="text-[9.5px]">Bagian Keuangan</div>
                <div className="h-10" />
                <div className="border-b border-black mx-4" />
              </div>
            </div>

            <div className="text-center text-[9px] text-black pt-3 italic font-mono">
              * SIMRS MedCentral RSUMB - Epson TM-T82X *
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .txt</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Tutup
            </button>
            <button
              onClick={handlePrintThermal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk Thermal (80mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
