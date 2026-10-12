import React, { useRef, useState } from 'react';
import { X, Printer, Copy, Check, Download, ReceiptText, FileText, ExternalLink } from 'lucide-react';
import {
  MonthlyScheduleData,
  StaffCalculatedSummary,
  DepartmentTotalSummary,
  IncentiveRates
} from '../types/incentiveTypes';
import { formatRupiah } from '../utils/incentiveExport';
import { printViaWindowPopup } from '../utils/printWindowHelper';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthData: MonthlyScheduleData;
  summaries?: StaffCalculatedSummary[];
  staffSummaries?: StaffCalculatedSummary[];
  departmentTotals: DepartmentTotalSummary;
  rates: IncentiveRates;
}

type PrintFormatTab = 'thermal' | 'a4';

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
  const [formatTab, setFormatTab] = useState<PrintFormatTab>('thermal');
  const [thermalWidth, setThermalWidth] = useState<'80mm' | '58mm'>('80mm');
  const receiptRef = useRef<HTMLDivElement>(null);
  const printBtnRef = useRef<HTMLButtonElement>(null);
  const openNewTabBtnRef = useRef<HTMLButtonElement>(null);
  const isPrintingRef = useRef(false);

  // 1. FUNGSI JS CETAK STRUK THERMAL (80mm / 58mm) via Window Popup
  const cetakStrukThermal = (width: '80mm' | '58mm' = thermalWidth, autoPrint: boolean = true) => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    setTimeout(() => {
      isPrintingRef.current = false;
    }, 800);

    const paper = document.getElementById('thermalReceiptPaper');
    if (!paper) {
      alert('Elemen struk thermal (#thermalReceiptPaper) tidak ditemukan!');
      return;
    }

    // Salin isi struk ke elemen khusus print container di luar modal sebagai backup
    let container = document.getElementById('printContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'printContainer';
      document.body.appendChild(container);
    }

    const targetWidth = width === '58mm' ? '54mm' : '76mm';
    const fontSize = width === '58mm' ? '10px' : '11.5px';

    container.className = `print-thermal-container ${width === '58mm' ? 'thermal-58' : 'thermal-80'}`;
    container.innerHTML = `
      <div style="width: ${targetWidth}; max-width: 100%; margin: 0 auto; padding: 0; background: #ffffff; color: #000000; font-family: 'Inter', 'Roboto', monospace, sans-serif; font-size: ${fontSize}; line-height: 1.25;">
        ${paper.innerHTML}
      </div>
    `;

    // SOLUSI BLOKIR IFRAME AI STUDIO: Cetak via Window Popup / Tab Baru
    const styles = `
      @page {
        size: ${width === '58mm' ? '58mm' : '80mm'} auto;
        margin: 0;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Courier New', Courier, monospace !important;
      }
      .print-document-body {
        width: 100%;
        display: flex;
        justify-content: center;
        background: #f1f5f9;
        padding: 16px 0;
      }
      .receipt-paper-box {
        width: ${targetWidth};
        max-width: 100%;
        margin: 0 auto;
        padding: 4mm 2mm;
        background: #ffffff;
        color: #000000;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: ${fontSize};
        line-height: 1.25;
        box-shadow: 0 4px 14px rgba(0,0,0,0.1);
      }
      @media print {
        .print-document-body {
          background: #ffffff !important;
          padding: 0 !important;
        }
        .receipt-paper-box {
          box-shadow: none !important;
          padding: 1mm 1.5mm !important;
          max-width: 100% !important;
          width: 100% !important;
        }
      }
    `;

    const bodyHtml = `<div class="receipt-paper-box">${paper.innerHTML}</div>`;
    printViaWindowPopup({
      title: `Struk Rekapitulasi Insentif (${width}) - RSU Muhammadiyah Babat`,
      bodyHtml,
      styles,
      autoPrint
    });
  };

  // 2. FUNGSI JS CETAK DOKUMEN A4 / PDF via Window Popup
  const cetakModalA4 = (autoPrint: boolean = true) => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    setTimeout(() => {
      isPrintingRef.current = false;
    }, 800);

    const paper = document.getElementById('a4ReceiptPaper');
    if (!paper) {
      alert('Elemen dokumen A4 (#a4ReceiptPaper) tidak ditemukan!');
      return;
    }

    let container = document.getElementById('printContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'printContainer';
      document.body.appendChild(container);
    }

    container.className = 'print-pdf-container';
    container.innerHTML = `
      <div style="width: 100%; margin: 0 auto; padding: 8mm 10mm; background: #ffffff; color: #000000; font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;">
        ${paper.innerHTML}
      </div>
    `;

    const styles = `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      .print-document-body {
        width: 100%;
        display: flex;
        justify-content: center;
        background: #f1f5f9;
        padding: 20px 0;
      }
      .a4-paper-box {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        padding: 10mm 12mm;
        background: #ffffff;
        color: #000000;
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      }
      @media print {
        .print-document-body {
          background: #ffffff !important;
          padding: 0 !important;
        }
        .a4-paper-box {
          box-shadow: none !important;
          padding: 4mm 6mm !important;
        }
      }
    `;

    const bodyHtml = `<div class="a4-paper-box">${paper.innerHTML}</div>`;
    printViaWindowPopup({
      title: `Laporan Insentif A4 - RSU Muhammadiyah Babat - ${monthData.monthName} ${monthData.year}`,
      bodyHtml,
      styles,
      autoPrint
    });
  };

  // Handler Tombol Cadangan [Buka di Tab Baru untuk Cetak]
  const handleOpenNewTab = () => {
    if (formatTab === 'thermal') {
      cetakStrukThermal(thermalWidth, false);
    } else {
      cetakModalA4(false);
    }
  };

  // Handler Print untuk Printer Thermal 80mm atau Dokumen A4
  const handlePrint = () => {
    if (formatTab === 'thermal') {
      cetakStrukThermal(thermalWidth, true);
    } else {
      cetakModalA4(true);
    }
  };

  // Sambungkan event listener 'click' pada tombol Cetak Struk Thermal di dalam modal
  React.useEffect(() => {
    (window as any).cetakStrukThermal = () => cetakStrukThermal(thermalWidth, true);
    (window as any).bukaStrukDiTabBaru = () => handleOpenNewTab();
    if (!isOpen) return;

    // Tunggu mounting DOM modal
    const timer = setTimeout(() => {
      // 1. Hubungkan tombol utama btnDoPrintThermal
      const printBtn =
        printBtnRef.current ||
        document.getElementById('btnDoPrintThermal') ||
        document.getElementById('btn-cetak-struk-thermal');
      if (printBtn) {
        printBtn.setAttribute('onclick', 'cetakStrukThermal()');
        const clickHandler = () => {
          handlePrint();
        };
        printBtn.addEventListener('click', clickHandler);
      }

      // 2. Hubungkan tombol cadangan btnOpenNewTabThermal
      const newTabBtn =
        openNewTabBtnRef.current || document.getElementById('btnOpenNewTabThermal');
      if (newTabBtn) {
        newTabBtn.setAttribute('onclick', 'bukaStrukDiTabBaru()');
        const clickHandler = () => {
          handleOpenNewTab();
        };
        newTabBtn.addEventListener('click', clickHandler);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, formatTab, thermalWidth]);

  if (!isOpen) return null;

  const now = new Date();
  const currentDateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')} WIB`;

  // Generate plain text version for copying or raw thermal dispatch
  const generateRawReceiptText = () => {
    if (formatTab === 'a4') {
      const divider = '--------------------------------------------------------------------------------';
      let text = `RSU MUHAMMADIYAH BABAT\n`;
      text += `Jl. Raya Babat-Surabaya KM. 4 Babat, Lamongan\n`;
      text += `LAPORAN REKAPITULASI INSENTIF DINAS & UANG MAKAN\n`;
      text += `UNIT PENDAFTARAN & ADMISI\n`;
      text += `${divider}\n`;
      text += `Periode      : ${monthData.monthName} ${monthData.year}\n`;
      text += `Tanggal Cetak: ${currentDateStr} ${currentTimeStr}\n`;
      text += `Tarif U.Malam: Rp ${rates.uangMalam.toLocaleString('id-ID')} / shift\n`;
      text += `Tarif U.Makan: Rp ${rates.uangMakan.toLocaleString('id-ID')} / hari dinas\n`;
      text += `${divider}\n`;
      text += `NO  NAMA PEGAWAI             SHIFT (M)      U.MALAM      U.MAKAN        TOTAL\n`;
      text += `${divider}\n`;
      activeSummaries.forEach((s, idx) => {
        const no = String(idx + 1).padEnd(4, ' ');
        const name = s.name.padEnd(24, ' ');
        const shiftM = `${s.countM} M`.padStart(8, ' ');
        const uMalam = `Rp ${s.uangMalam.toLocaleString('id-ID')}`.padStart(13, ' ');
        const uMakan = `Rp ${s.uangMakan.toLocaleString('id-ID')}`.padStart(13, ' ');
        const total = `Rp ${s.totalInsentif.toLocaleString('id-ID')}`.padStart(13, ' ');
        text += `${no}${name}${shiftM}${uMalam}${uMakan}${total}\n`;
      });
      text += `${divider}\n`;
      text += `TOTAL KESELURUHAN (${departmentTotals.totalStaff} Pegawai)\n`;
      text += `Total Shift Malam (M): ${departmentTotals.totalM} Shift\n`;
      text += `Total Uang Malam     : Rp ${departmentTotals.totalUangMalam.toLocaleString('id-ID')}\n`;
      text += `Total Uang Makan     : Rp ${departmentTotals.totalUangMakan.toLocaleString('id-ID')}\n`;
      text += `GRAND TOTAL INSENTIF : Rp ${departmentTotals.grandTotalInsentif.toLocaleString('id-ID')}\n`;
      text += `${divider}\n`;
      return text;
    }

    const dividerSingle = '----------------------------------------';

    let text = `        RSU MUHAMMADIYAH BABAT\n`;
    text += ` Jl. Raya Babat-Surabaya KM. 4 Babat, Lamongan\n`;
    text += `      REKAPITULASI INSENTIF DINAS\n`;
    text += `        UNIT PENDAFTARAN & ADMISI\n`;
    text += `${dividerSingle}\n`;
    text += `Periode       : ${monthData.monthName} ${monthData.year}\n`;
    text += `Waktu Cetak   : ${currentDateStr} ${currentTimeStr}\n`;
    text += `Tarif U. Malam: Rp ${rates.uangMalam.toLocaleString('id-ID')} / shift\n`;
    text += `Tarif U. Makan: Rp ${rates.uangMakan.toLocaleString('id-ID')} / hari\n`;
    text += `${dividerSingle}\n`;
    text += `NO NAMA                U.MLM   U.MKN     TOTAL\n`;
    text += `${dividerSingle}\n`;

    activeSummaries.forEach((s, idx) => {
      const no = String(idx + 1).padEnd(2, ' ');
      const nameWithM = `${s.name.toUpperCase()} (${s.countM}M)`.padEnd(17, ' ');
      const uMalam = s.uangMalam.toLocaleString('id-ID').padStart(8, ' ');
      const uMakan = s.uangMakan.toLocaleString('id-ID').padStart(8, ' ');
      const total = s.totalInsentif.toLocaleString('id-ID').padStart(10, ' ');
      text += `${no} ${nameWithM}${uMalam}${uMakan}${total}\n`;
      text += `${dividerSingle}\n`;
    });

    text += `       TOTAL KESELURUHAN (${departmentTotals.totalStaff} STAF)\n`;
    text += `Total Shift Malam (M): ${departmentTotals.totalM} Shift\n`;
    text += `Total Uang Malam     : Rp ${departmentTotals.totalUangMalam.toLocaleString('id-ID')}\n`;
    text += `Total Uang Makan     : Rp ${departmentTotals.totalUangMakan.toLocaleString('id-ID')}\n`;
    text += `${dividerSingle}\n`;
    text += `GRAND TOTAL          : Rp ${departmentTotals.grandTotalInsentif.toLocaleString('id-ID')}\n`;
    text += `${dividerSingle}\n`;
    text += `Mengetahui,                 Petugas,\n`;
    text += `PJ Pendaftaran              Bagian Keuangan\n\n\n`;
    text += `_______________             _______________\n`;

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
    link.download = formatTab === 'a4'
      ? `Laporan_Insentif_A4_RSUMB_${monthData.monthName}_${monthData.year}.txt`
      : `Struk_Insentif_80mm_RSUMB_${monthData.monthName}_${monthData.year}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-hidden animate-in fade-in thermal-modal-backdrop">
      <style>{`
        @media print {
          @page {
            margin: 0mm !important;
            size: auto;
          }
          body * {
            visibility: hidden !important;
          }
          #printContainer, #printContainer * {
            visibility: visible !important;
          }
          #printContainer {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div
        className={`relative z-[100000] bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] my-auto transition-all duration-200 ${
          formatTab === 'thermal' ? 'max-w-xl' : 'max-w-3xl sm:max-w-4xl'
        }`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 thermal-modal-controls">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                {formatTab === 'thermal' ? <ReceiptText className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <div>
                <div className="leading-tight">
                  {formatTab === 'thermal' ? `Pratinjau Struk Thermal (${thermalWidth})` : 'Pratinjau Dokumen Laporan (A4 / PDF)'}
                </div>
                <div className="text-[11px] font-normal text-slate-500">
                  {formatTab === 'thermal'
                    ? `Kompatibel dengan printer thermal Epson TM-T82X (80mm) & POS mini (${thermalWidth})`
                    : 'Format Dokumen Resmi A4 / PDF Standar Pelaporan Administrasi'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. TAB NAVIGASI FORMAT CETAK */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold w-fit">
              <button
                type="button"
                onClick={() => setFormatTab('thermal')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  formatTab === 'thermal'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>🖨️ Struk Thermal (80mm)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormatTab('a4')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  formatTab === 'a4'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>📄 Dokumen A4 / PDF</span>
              </button>
            </div>

            {/* Pilihan Lebar Kertas Thermal (80mm / 58mm) */}
            {formatTab === 'thermal' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="text-[11px] text-slate-500 font-semibold px-1.5">Lebar:</span>
                <button
                  type="button"
                  onClick={() => setThermalWidth('80mm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    thermalWidth === '80mm'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Ukuran standar printer kasir Epson TM-T82X (80mm)"
                >
                  80mm (Standar)
                </button>
                <button
                  type="button"
                  onClick={() => setThermalWidth('58mm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    thermalWidth === '58mm'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Ukuran printer thermal portable / mini (58mm)"
                >
                  58mm (Mini)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body / Paper Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 flex justify-center max-h-[calc(88vh-180px)]">
          {/* Format 1: Struk Thermal (80mm / 58mm) */}
          {formatTab === 'thermal' ? (
            <div
              id="thermalReceiptPaper"
              ref={receiptRef}
              data-paper={thermalWidth}
              className={`bg-white p-4 sm:p-5 rounded-lg shadow-md border border-slate-300 w-full ${
                thermalWidth === '58mm' ? 'max-w-[240px] text-[10.5px]' : 'max-w-[300px] text-[11.5px]'
              } text-black leading-snug select-text font-mono`}
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                color: '#000000'
              }}
            >
              {/* 1. HEADER STRUK */}
              <div className="text-center font-bold text-[13px] leading-tight uppercase">
                RSU MUHAMMADIYAH BABAT
              </div>
              <div className="text-center text-[10px] leading-tight mt-0.5">
                Jl. Raya Babat-Surabaya KM. 4 Babat, Lamongan
              </div>
              <div className="text-center font-bold text-[12px] leading-tight uppercase mt-1">
                REKAPITULASI INSENTIF DINAS
              </div>
              <div className="text-center text-[10.5px] leading-tight uppercase mt-0.5">
                UNIT PENDAFTARAN & ADMISI
              </div>

              <div className="border-b border-dashed border-black my-2" />

              {/* 2. INFORMASI PERIODE & TARIF */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-start">
                  <span>Periode:</span>
                  <span className="font-bold">{monthData.monthName} {monthData.year}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span>Waktu Cetak:</span>
                  <span className="font-bold">{currentDateStr} {currentTimeStr}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span>Tarif U. Malam:</span>
                  <span className="font-bold">Rp {rates.uangMalam.toLocaleString('id-ID')} / shift</span>
                </div>
                <div className="flex justify-between items-start">
                  <span>Tarif U. Makan:</span>
                  <span className="font-bold">Rp {rates.uangMakan.toLocaleString('id-ID')} / hari</span>
                </div>
              </div>

              <div className="border-b border-dashed border-black my-2" />

              {/* 3. TABEL REKAP STAF */}
              <div className="text-[11px]">
                {/* Header Kolom */}
                <div className="flex justify-between font-bold pb-1 border-b border-dashed border-black">
                  <span className="flex-1 text-left">NO NAMA</span>
                  <span className="w-14 text-right">U.MLM</span>
                  <span className="w-14 text-right">U.MKN</span>
                  <span className="w-16 text-right">TOTAL</span>
                </div>

                {/* Data Baris Staf */}
                <div className="divide-y divide-dashed divide-black py-0.5">
                  {activeSummaries.map((staff, idx) => (
                    <div key={staff.id} className="flex justify-between items-center text-[11px] py-1 border-b border-dashed border-black">
                      <div className="flex-1 text-left pr-1 truncate">
                        <span className="font-bold">{idx + 1}&nbsp; </span>
                        <span className="font-bold uppercase">{staff.name}</span>
                        <span className="font-normal text-[10px] ml-0.5">({staff.countM}M)</span>
                      </div>
                      <span className="w-14 text-right font-medium">
                        {staff.uangMalam === 0 ? '0' : staff.uangMalam.toLocaleString('id-ID')}
                      </span>
                      <span className="w-14 text-right font-medium">
                        {staff.uangMakan === 0 ? '0' : staff.uangMakan.toLocaleString('id-ID')}
                      </span>
                      <span className="w-16 text-right font-bold">
                        {staff.totalInsentif === 0 ? '0' : staff.totalInsentif.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-b border-dashed border-black my-2" />

              {/* 4. RINGKASAN TOTAL */}
              <div className="space-y-1 text-[11px]">
                <div className="font-bold text-center uppercase tracking-wide">
                  TOTAL KESELURUHAN ({departmentTotals.totalStaff} STAF)
                </div>
                <div className="flex justify-between pt-1">
                  <span>Total Shift Malam (M):</span>
                  <span className="font-bold">{departmentTotals.totalM} Shift</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Uang Malam:</span>
                  <span className="font-bold">Rp {departmentTotals.totalUangMalam.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Uang Makan:</span>
                  <span className="font-bold">Rp {departmentTotals.totalUangMakan.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-b border-dashed border-black my-1.5" />
                <div className="flex justify-between font-bold text-[13px] pt-0.5">
                  <span>GRAND TOTAL:</span>
                  <span>Rp {departmentTotals.grandTotalInsentif.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-black my-2" />

              {/* 5. TANDA TANGAN */}
              <div className="grid grid-cols-2 text-center text-[10.5px] pt-1 gap-2">
                <div>
                  <div className="font-medium">Mengetahui,</div>
                  <div className="text-[10px] mt-0.5">PJ Pendaftaran</div>
                  <div className="h-8" />
                  <div className="text-[10px] tracking-tighter">_______________</div>
                </div>
                <div>
                  <div className="font-medium">Petugas,</div>
                  <div className="text-[10px] mt-0.5">Bagian Keuangan</div>
                  <div className="h-8" />
                  <div className="text-[10px] tracking-tighter">_______________</div>
                </div>
              </div>
            </div>
          ) : (
            /* Format 2: Dokumen A4 / PDF (Lebar Full Width Container) */
            <div
              id="a4ReceiptPaper"
              ref={receiptRef}
              className="bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-slate-300 w-full max-w-full text-slate-900 text-xs leading-normal select-text"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
              }}
            >
              {/* Kop Surat Resmi A4 */}
              <div className="text-center pb-3 border-b-2 border-slate-900">
                <div className="font-extrabold text-base sm:text-lg tracking-wide uppercase text-slate-950">
                  RUMAH SAKIT UMUM MUHAMMADIYAH BABAT
                </div>
                <div className="text-xs text-slate-700 mt-0.5">
                  Jl. Raya Babat - Surabaya KM. 4, Kecamatan Babat, Kabupaten Lamongan, Jawa Timur
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Telepon: (0322) 451125 | Email: rsumbabat@yahoo.co.id | Layanan 24 Jam
                </div>
              </div>

              {/* Judul Laporan Resmi */}
              <div className="text-center py-4">
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-tight">
                  LAPORAN REKAPITULASI INSENTIF DINAS & UANG MAKAN STAF
                </h2>
                <p className="text-xs font-semibold text-emerald-800 uppercase mt-0.5">
                  UNIT PENDAFTARAN & ADMISI RAWAT JALAN / INAP
                </p>
              </div>

              {/* Info Dokumen */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 w-28">Periode Dinas:</span>
                    <span className="font-bold text-slate-900">{monthData.monthName} {monthData.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 w-28">Waktu Cetak:</span>
                    <span className="font-medium text-slate-800">{currentDateStr} pukul {currentTimeStr} WIB</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 w-28">Tarif Uang Malam:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(rates.uangMalam)} / shift malam</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 w-28">Tarif Uang Makan:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(rates.uangMakan)} / hari dinas</span>
                  </div>
                </div>
              </div>

              {/* Tabel Data Rekapitulasi Format Dokumen A4 */}
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-10">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Nama Pegawai</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-24">Shift (M)</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-300">Uang Malam</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-300">Uang Makan</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-300">Total Insentif</th>
                      <th className="py-2.5 px-3 text-center w-24">Tanda Tangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeSummaries.map((staff, idx) => (
                      <tr key={staff.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center border-r border-slate-200 font-medium">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">{staff.name}</td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 font-bold text-emerald-800">{staff.countM} M</td>
                        <td className="py-2 px-3 text-right border-r border-slate-200">{formatRupiah(staff.uangMalam)}</td>
                        <td className="py-2 px-3 text-right border-r border-slate-200">{formatRupiah(staff.uangMakan)}</td>
                        <td className="py-2 px-3 text-right border-r border-slate-200 font-bold text-slate-900">{formatRupiah(staff.totalInsentif)}</td>
                        <td className="py-2 px-3 text-center text-slate-300 font-mono text-[10px]">{idx + 1}. .........</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50/80 font-bold border-t-2 border-slate-400 text-slate-900">
                      <td colSpan={2} className="py-2.5 px-3 text-right border-r border-slate-300 uppercase">
                        TOTAL KESELURUHAN ({departmentTotals.totalStaff} Pegawai):
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-emerald-900 font-black">
                        {departmentTotals.totalM} Shift
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-300 text-emerald-900 font-black">
                        {formatRupiah(departmentTotals.totalUangMalam)}
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-300 text-emerald-900 font-black">
                        {formatRupiah(departmentTotals.totalUangMakan)}
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-300 text-emerald-950 font-black text-sm">
                        {formatRupiah(departmentTotals.grandTotalInsentif)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-normal text-[10px]">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Lembar Tanda Tangan Formal A4 */}
              <div className="grid grid-cols-2 gap-8 text-center pt-8 text-xs text-slate-800">
                <div>
                  <div className="text-slate-500 text-[11px] mb-1">Mengetahui,</div>
                  <div className="font-bold text-slate-900">Penanggung Jawab Pendaftaran & Admisi</div>
                  <div className="h-16" />
                  <div className="border-b border-slate-900 mx-10" />
                  <div className="text-[11px] text-slate-600 mt-1">NIK / NBM: .......................................</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] mb-1">Babat, {currentDateStr}</div>
                  <div className="font-bold text-slate-900">Petugas Keuangan / Verifikator</div>
                  <div className="h-16" />
                  <div className="border-b border-slate-900 mx-10" />
                  <div className="text-[11px] text-slate-600 mt-1">NIK / NBM: .......................................</div>
                </div>
              </div>

              <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
                <span>SIMRS RS Muhammadiyah Babat - Portal Pendaftaran & Admisi</span>
                <span>Dokumen Otentik Tercetak Otomatis</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Modal Footer / Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3.5 border-t border-slate-100 bg-white thermal-modal-controls">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .txt</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol Cadangan: Buka di Tab Baru untuk Cetak (Anti-Blokir AI Studio) */}
            <button
              ref={openNewTabBtnRef}
              id="btnOpenNewTabThermal"
              type="button"
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200 cursor-pointer"
              title="Buka pratinjau cetak di tab baru (Gunakan jika pop-up/print terblokir oleh iframe AI Studio)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>Buka di Tab Baru untuk Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            
            {/* Tombol Utama Cetak Struk / Laporan */}
            <button
              ref={printBtnRef}
              id="btnDoPrintThermal"
              data-alt-id="btn-cetak-struk-thermal"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              title="Cetak struk thermal ke printer kasir Epson TM-T82X atau printer dokumen"
            >
              <Printer className="w-4 h-4" />
              <span>
                {formatTab === 'thermal'
                  ? `Cetak Struk Thermal (${thermalWidth})`
                  : 'Cetak Laporan PDF (A4)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
