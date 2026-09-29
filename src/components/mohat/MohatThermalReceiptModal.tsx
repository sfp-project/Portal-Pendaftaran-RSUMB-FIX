import React, { useEffect, useState } from 'react';
import { X, Printer, Copy, Check, Ticket, Download, ExternalLink, Loader2, Info } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { KuponMohat } from '../../types/mohatTypes';
import { formatRupiahMohat, getPenjaminDisplayLabel } from '../../data/mohatData';
import { downloadBlob } from '../../utils/exportHelpers';
import { loadPortalSettings } from '../../data/settingsData';

interface MohatThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  kupon: KuponMohat | null;
  onPrintSuccess?: () => void;
}

/**
 * Menghasilkan Kode Keaslian / Security Code unik deterministik
 * Contoh: RSUMB-A8F9
 */
export const generateMohatAuthCode = (kupon: KuponMohat): string => {
  const input = `${kupon.nomorKupon}_${kupon.noSeri || ''}_${kupon.createdAt || kupon.tanggalMasuk}_${kupon.id || 'RSUMB'}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0');
  const code = hex.slice(-4);
  return `RSUMB-${code}`;
};

/**
 * Format tanggal YYYY-MM-DD menjadi DD/MM/YYYY
 */
const formatDateIndo = (tglStr: string) => {
  if (!tglStr) return '-';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return tglStr;
};

export const MohatThermalReceiptModal: React.FC<MohatThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  kupon,
  onPrintSuccess
}) => {
  // Paper Width: 58mm / 80mm from Portal Settings
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    () => loadPortalSettings().thermal.paperSize || '80mm'
  );

  useEffect(() => {
    if (isOpen) {
      setPaperWidth(loadPortalSettings().thermal.paperSize || '80mm');
    }
  }, [isOpen]);
  
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const authCode = kupon ? generateMohatAuthCode(kupon) : 'RSUMB-A8F9';

  // Generate High-Density QR Code
  useEffect(() => {
    if (!isOpen || !kupon) return;

    const validationString = `RSUMB-VERIFIKASI-DIGITAL|KUPON:${kupon.nomorKupon}|SERI:${kupon.noSeri || '-'}|TGL:${kupon.tanggalMasuk}|JAM:${kupon.jamDibuat}|PASIEN:${kupon.namaPasien}|FEE:${kupon.feeTotal}|AUTH:${authCode}`;

    QRCode.toDataURL(validationString, {
      width: paperWidth === '58mm' ? 115 : 135,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR Code generation error:', err);
      });
  }, [isOpen, kupon, paperWidth, authCode]);

  if (!isOpen || !kupon) return null;

  const penjaminLabel = getPenjaminDisplayLabel(kupon.penjamin);
  const kategoriLabel = kupon.kategori === 'PKM' ? 'PKM / Faskes 1' : 'Desa / Mohat';
  
  // Format Perujuk / Sopir
  const perujukSopirText = kupon.kategori === 'PKM' && kupon.namaSopir
    ? `${kupon.namaPerujuk} / ${kupon.namaSopir}`
    : (kupon.namaPerujuk || kupon.namaSopir || '-');

  // METHOD 1: Isolated Hidden Iframe Printing (Bypass iframe sandbox & outer CSS)
  const handlePrint = () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) {
      window.focus();
      window.print();
      return;
    }

    setStatusMessage('Membuka dialog cetak printer thermal...');
    setTimeout(() => setStatusMessage(null), 3500);

    try {
      const existingFrame = document.getElementById('thermal-print-isolated-frame');
      if (existingFrame) existingFrame.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'thermal-print-isolated-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.left = '-9999px';
      printIframe.style.top = '-9999px';
      printIframe.style.width = paperWidth === '58mm' ? '54mm' : '76mm';
      printIframe.style.height = '100px';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!frameDoc) {
        window.focus();
        window.print();
        if (onPrintSuccess) onPrintSuccess();
        return;
      }

      const paperCssWidth = paperWidth === '58mm' ? '54mm' : '76mm';
      const receiptHtml = printArea.innerHTML;

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Struk Kupon ${kupon.nomorKupon}</title>
  <style>
    @page {
      size: ${paperWidth === '58mm' ? '58mm' : '80mm'} auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', 'Lucida Console', monospace, sans-serif !important;
      width: 100%;
    }
    #receipt-outer {
      width: ${paperCssWidth};
      max-width: ${paperCssWidth};
      padding: 2mm 2.5mm;
      margin: 0 auto;
      font-size: ${paperWidth === '58mm' ? '11px' : '12px'};
      line-height: ${paperWidth === '58mm' ? '1.25' : '1.3'};
      color: #000000 !important;
      font-family: 'Courier New', 'Lucida Console', monospace, sans-serif !important;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold, .font-extrabold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .font-semibold { font-weight: 600; }
    .font-normal { font-weight: normal; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-2 { gap: 8px; }
    .border-b { border-bottom: 1px solid #000000; }
    .border-b-2 { border-bottom: 2px solid #000000; }
    .border-t { border-top: 1px solid #000000; }
    .border { border: 1px solid #000000; }
    .border-2 { border: 2px solid #000000; }
    .border-dashed { border-style: dashed !important; }
    .border-black { border-color: #000000; }
    .p-1 { padding: 3px; }
    .p-1\\.5 { padding: 4px; }
    .p-2 { padding: 6px; }
    .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
    .py-1 { padding-top: 3px; padding-bottom: 3px; }
    .my-1 { margin-top: 3px; margin-bottom: 3px; }
    .my-1\\.5 { margin-top: 4px; margin-bottom: 4px; }
    .my-2 { margin-top: 6px; margin-bottom: 6px; }
    .my-2\\.5 { margin-top: 8px; margin-bottom: 8px; }
    .pt-1 { padding-top: 3px; }
    .pt-1\\.5 { padding-top: 4px; }
    .pt-2\\.5 { padding-top: 10px; }
    .pt-3 { padding-top: 12px; }
    .pb-0\\.5 { padding-bottom: 2px; }
    .pb-1 { padding-bottom: 3px; }
    .mt-0\\.5 { margin-top: 2px; }
    .mt-1 { margin-top: 3px; }
    .mt-1\\.5 { margin-top: 4px; }
    .mt-2 { margin-top: 6px; }
    .mb-6 { margin-bottom: 24px; }
    .mb-7 { margin-bottom: 28px; }
    .mb-5 { margin-bottom: 20px; }
    .space-y-0\\.5 > * + * { margin-top: 2px; }
    .space-y-1 > * + * { margin-top: 3px; }
    .space-y-1\\.5 > * + * { margin-top: 4px; }
    .text-\\[8px\\] { font-size: 8px; }
    .text-\\[8\\.5px\\] { font-size: 8.5px; }
    .text-\\[9px\\] { font-size: 9px; }
    .text-\\[9\\.5px\\] { font-size: 9.5px; }
    .text-\\[10px\\] { font-size: 10px; }
    .text-\\[10\\.5px\\] { font-size: 10.5px; }
    .text-\\[11px\\] { font-size: 11px; }
    .text-\\[11\\.5px\\] { font-size: 11.5px; }
    .text-\\[12px\\] { font-size: 12px; }
    .text-\\[13px\\] { font-size: 13px; }
    .text-\\[14px\\] { font-size: 14px; }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.025em; }
    .tracking-wider { letter-spacing: 0.05em; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .whitespace-nowrap { white-space: nowrap; }
    .min-h-\\[16px\\] { min-height: 16px; }
    .shrink-0 { flex-shrink: 0; }
    .w-full { width: 100%; }
    .gap-3 { gap: 12px; }
    /* Reset borders/outlines/shadows inside details block */
    .receipt-details,
    .receipt-details div,
    .receipt-details tr,
    .receipt-details td,
    .penjamin-kategori-row {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .penjamin-kategori-row {
      font-size: 13px !important;
      font-weight: bold !important;
      color: #000000 !important;
      padding: 2px 0 !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .signature-table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border: none !important;
      background: transparent !important;
      margin-top: 10px !important;
      margin-bottom: 4px !important;
    }
    .signature-table td {
      width: 50% !important;
      border: none !important;
      background: transparent !important;
      vertical-align: top !important;
      text-align: center !important;
      padding: 0 2px !important;
    }
    img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="receipt-outer">
    ${receiptHtml}
  </div>
</body>
</html>`);
      frameDoc.close();

      setTimeout(() => {
        try {
          if (printIframe.contentWindow) {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
            if (onPrintSuccess) onPrintSuccess();
          }
        } catch (iframeErr) {
          console.warn('Iframe print restricted, fallback to direct window.print():', iframeErr);
          window.focus();
          window.print();
          if (onPrintSuccess) onPrintSuccess();
        }
      }, 300);
    } catch (err) {
      console.warn('Failed in print iframe, falling back to window.print():', err);
      window.focus();
      window.print();
      if (onPrintSuccess) onPrintSuccess();
    }
  };

  // METHOD 2: Direct PDF Download (Thermal Roll Size)
  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    setIsGeneratingPdf(true);
    setStatusMessage('Membuat berkas PDF Struk Thermal...');

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await html2canvas(printArea, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: printArea.scrollWidth,
        windowHeight: printArea.scrollHeight
      } as any);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const mmWidth = paperWidth === '58mm' ? 58 : 80;
      const mmHeight = Math.ceil((canvas.height * mmWidth) / canvas.width);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [mmWidth, mmHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');
      const pdfBlob = pdf.output('blob');
      downloadBlob(pdfBlob, `Struk_Thermal_${kupon.nomorKupon}_${paperWidth}.pdf`);

      setStatusMessage('PDF Struk berhasil diunduh.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Gagal generate PDF thermal:', err);
      setStatusMessage('Gagal membuat PDF.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // METHOD 3: Open Clean Print Tab (Bypasses iframe sandboxing)
  const handleOpenNewTabPrint = () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    const paperCssWidth = paperWidth === '58mm' ? '54mm' : '76mm';
    const newWin = window.open('', '_blank');
    if (!newWin) {
      handleDownloadPdf();
      return;
    }

    newWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cetak Struk ${kupon.nomorKupon}</title>
  <style>
    @page { size: ${paperWidth === '58mm' ? '58mm' : '80mm'} auto; margin: 0; }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 2mm;
      font-family: 'Courier New', 'Lucida Console', monospace, sans-serif !important;
      width: 100%;
      font-size: ${paperWidth === '58mm' ? '11px' : '12px'};
      line-height: ${paperWidth === '58mm' ? '1.25' : '1.3'};
      color: #000000 !important;
      background: #ffffff !important;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .font-semibold { font-weight: 600; }
    .font-black { font-weight: 900; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .border-b { border-bottom: 1px solid #000000; }
    .border-b-2 { border-bottom: 2px solid #000000; }
    .border-t { border-top: 1px solid #000000; }
    .border { border: 1px solid #000000; }
    .border-2 { border: 2px solid #000000; }
    .border-dashed { border-style: dashed !important; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .whitespace-nowrap { white-space: nowrap; }
    .min-h-\[16px\] { min-height: 16px; }
    .w-full { width: 100%; }
    .p-1 { padding: 3px; }
    .p-2 { padding: 6px; }
    .my-1 { margin: 3px 0; }
    .my-2 { margin: 6px 0; }
    /* Reset borders/outlines/shadows inside details block */
    .receipt-details,
    .receipt-details div,
    .receipt-details tr,
    .receipt-details td,
    .penjamin-kategori-row {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .penjamin-kategori-row {
      font-size: 13px !important;
      font-weight: bold !important;
      color: #000000 !important;
      padding: 2px 0 !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .signature-table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border: none !important;
      background: transparent !important;
      margin-top: 10px !important;
      margin-bottom: 4px !important;
    }
    .signature-table td {
      width: 50% !important;
      border: none !important;
      background: transparent !important;
      vertical-align: top !important;
      text-align: center !important;
      padding: 0 2px !important;
    }
    img { max-width: 100%; display: block; margin: 0 auto; }
    .btn-print {
      display: block;
      width: 100%;
      max-width: ${paperCssWidth};
      margin: 0 auto 12px auto;
      padding: 8px;
      background: #005d42;
      color: #fff;
      font-weight: bold;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .btn-print { display: none !important; }
    }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">KLIK DI SINI UNTUK CETAK STRUK</button>
  <div style="width: ${paperCssWidth}; margin: 0 auto;">
    ${printArea.innerHTML}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`);
    newWin.document.close();
  };

  const handleCopyText = () => {
    const formattedTgl = formatDateIndo(kupon.tanggalMasuk);
    const text = `RSU MUHAMMADIYAH BABAT\n` +
      `Jl. Raya Babat-Surabaya KM. 4 Babat, Lamongan\n` +
      `==========================================\n` +
      `KUPON FEE TRANSPORT RAWAT INAP\n` +
      `==========================================\n` +
      `No. Kupon    : ${kupon.nomorKupon}\n` +
      `No. Seri (SN): ${kupon.noSeri || '-'}\n` +
      `Tgl Masuk    : ${formattedTgl} (${kupon.jamDibuat} WIB)\n` +
      `Nama Pasien  : ${kupon.namaPasien}\n` +
      `Penjamin     : ${penjaminLabel}\n` +
      `Kategori     : ${kategoriLabel}\n` +
      `Perujuk/Sopir: ${perujukSopirText}\n` +
      (kupon.noHpPengantar ? `Kontak/HP    : ${kupon.noHpPengantar}\n` : '') +
      (kupon.catatan ? `Catatan      : ${kupon.catatan}\n` : '') +
      `------------------------------------------\n` +
      `TOTAL FEE: ${formatRupiahMohat(kupon.feeTotal)}\n` +
      `==========================================\n` +
      `BERKAS SAH & TERVERIFIKASI DIGITAL RSU MUHAMMADIYAH BABAT\n` +
      `KODE AUTH: ${authCode}\n` +
      `Status: ${kupon.status}\n` +
      `------------------------------------------\n` +
      `Penerima Fee: ${kupon.namaPerujuk || kupon.namaSopir || '-'}\n` +
      `Petugas Kasir: ${kupon.petugasKasir && kupon.petugasKasir !== '-' ? kupon.petugasKasir : 'Kasir RSUMB'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:inset-auto thermal-modal-backdrop">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-auto print:overflow-visible print:static">
        
        {/* Modal Header (No Print) */}
        <div className="bg-[#005d42] text-white px-5 py-4 flex items-center justify-between no-print print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Ticket className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Cetak Struk Thermal Kupon Transport</h3>
              <p className="text-xs text-emerald-100">Layout Presisi 58mm & 80mm • Tipografi Monospace Tajam & Kontras Tinggi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar (No Print) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs no-print print:hidden shrink-0 thermal-modal-controls">
          
          {/* Paper Width Selector: 58mm vs 80mm */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Lebar:</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                  paperWidth === '58mm'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                  paperWidth === '80mm'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>

          {/* Action Buttons: Unduh PDF, Tab Cetak, Salin Teks */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-semibold text-emerald-800 transition cursor-pointer disabled:opacity-50"
              title="Unduh struk sebagai file PDF thermal siap cetak"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{isGeneratingPdf ? 'PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTabPrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-medium text-slate-700 transition cursor-pointer"
              title="Buka struk di tab baru browser untuk mencetak langsung tanpa halangan iframe"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Tab Cetak</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-medium text-slate-700 transition cursor-pointer"
              title="Salin Rincian Teks Kupon"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notifikasi Status */}
        {statusMessage && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-5 py-2 text-xs font-semibold flex items-center justify-between no-print">
            <span>{statusMessage}</span>
            <button type="button" onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Receipt Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/70 flex flex-col items-center justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          {/* Petunjuk Cetak Lembut */}
          <div className="mb-3 max-w-md w-full bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-800 flex items-start gap-2 no-print print:hidden">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span>
                <strong>Format Struk Tunggal:</strong> Struk thermal 1 lembar berotentikasi digital QR Code dan tanda tangan sah.
              </span>
            </div>
          </div>
          
          {/* ========================================================================= */}
          {/* THERMAL PAPER CONTAINER - TARGETED BY #print-area (HIGH CLARITY PRINT)   */}
          {/* ========================================================================= */}
          <div
            id="print-area"
            data-paper={paperWidth}
            className={`bg-white p-3.5 sm:p-4 shadow-md print:shadow-none border border-slate-300 print:border-none text-black print:text-black transition-all ${
              paperWidth === '58mm' ? 'w-[320px] text-[11px]' : 'w-[400px] text-[12px]'
            }`}
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace, sans-serif",
              color: '#000000',
              lineHeight: paperWidth === '58mm' ? 1.25 : 1.3
            }}
          >
            {/* ================================================================= */}
            {/* KUPON FEE TRANSPORT RAWAT INAP                                    */}
            {/* ================================================================= */}
            <div className="thermal-receipt-section-1">
              
              {/* Kop RSU MUHAMMADIYAH BABAT */}
              <div className="text-center pb-1">
                <div className="font-extrabold text-[13px] tracking-tight uppercase text-black">
                  RSU MUHAMMADIYAH BABAT
                </div>
                <div className="text-[9.5px] leading-tight text-black mt-0.5">
                  Jl. Raya Babat-Surabaya KM. 4 Babat, Lamongan
                </div>
              </div>

              {/* Divider Header */}
              <div className="border-b-2 border-black my-1" />

              {/* Title Section */}
              <div className="text-center py-0.5">
                <div className="font-black text-[12px] uppercase tracking-wide text-black">
                  KUPON FEE TRANSPORT RAWAT INAP
                </div>
              </div>

              {/* Divider Subtitle */}
              <div className="border-b border-black my-1" />

              {/* Rincian Kupon: Left-Aligned Labels (font-semibold), Right-Aligned Values (font-bold) */}
              <div className="receipt-details space-y-1 text-[10.5px] leading-snug py-0.5" style={{ border: 'none', background: 'transparent' }}>
                <div className="flex justify-between items-start" style={{ border: 'none', background: 'transparent' }}>
                  <span className="shrink-0 font-semibold text-black">No. Kupon</span>
                  <span className="font-extrabold text-right text-black">{kupon.nomorKupon}</span>
                </div>
                <div className="flex justify-between items-start" style={{ border: 'none', background: 'transparent' }}>
                  <span className="shrink-0 font-semibold text-black">No. Seri (SN)</span>
                  <span className="font-extrabold font-mono text-right text-black tracking-wider">{kupon.noSeri || '-'}</span>
                </div>
                <div className="flex justify-between items-start" style={{ border: 'none', background: 'transparent' }}>
                  <span className="shrink-0 font-semibold text-black">Tgl Masuk</span>
                  <span className="text-right text-black font-bold">
                    {formatDateIndo(kupon.tanggalMasuk)} ({kupon.jamDibuat || 'WIB'})
                  </span>
                </div>
                <div className="flex justify-between items-start" style={{ border: 'none', background: 'transparent' }}>
                  <span className="shrink-0 font-semibold text-black">Nama Pasien</span>
                  <span className="font-extrabold text-right text-black max-w-[210px] truncate uppercase">
                    {kupon.namaPasien}
                  </span>
                </div>

                {/* Penjamin & Kategori - Clean Plain Bold Text (No borders, dashed lines, or box overlay) */}
                <div
                  className="flex justify-between items-baseline penjamin-kategori-row"
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#000000',
                    padding: '2px 0',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    boxShadow: 'none'
                  }}
                >
                  <span className="shrink-0 text-black font-bold" style={{ fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>
                    Penjamin
                  </span>
                  <span className="font-black text-right text-black uppercase" style={{ fontSize: '13px', fontWeight: '900', color: '#000000' }}>
                    {penjaminLabel}
                  </span>
                </div>
                <div
                  className="flex justify-between items-baseline penjamin-kategori-row"
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#000000',
                    padding: '2px 0',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    boxShadow: 'none'
                  }}
                >
                  <span className="shrink-0 text-black font-bold" style={{ fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>
                    Kategori
                  </span>
                  <span className="font-black text-right text-black uppercase" style={{ fontSize: '13px', fontWeight: '900', color: '#000000' }}>
                    {kategoriLabel}
                  </span>
                </div>

                <div className="flex justify-between items-start" style={{ border: 'none', background: 'transparent' }}>
                  <span className="shrink-0 font-semibold text-black">Perujuk/Sopir</span>
                  <span className="font-bold text-right text-black">{perujukSopirText}</span>
                </div>

                {kupon.noHpPengantar && (
                  <div className="flex justify-between items-start text-[10px]" style={{ border: 'none', background: 'transparent' }}>
                    <span className="shrink-0 font-semibold text-black">Kontak/HP</span>
                    <span className="text-right text-black font-mono font-bold">{kupon.noHpPengantar}</span>
                  </div>
                )}

                {kupon.catatan && (
                  <div className="flex justify-between items-start text-[9.5px]" style={{ border: 'none', background: 'transparent' }}>
                    <span className="shrink-0 font-semibold text-black">Catatan</span>
                    <span className="text-right text-black italic">{kupon.catatan}</span>
                  </div>
                )}
              </div>

              {/* Rincian Tambahan Khusus PKM jika ada Sopir */}
              {kupon.kategori === 'PKM' && kupon.feeSopir > 0 && (
                <div className="space-y-0.5 text-[10px] border-t border-dashed border-black pt-1 my-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-black">Fee Perujuk (Bidan/Perawat):</span>
                    <span className="font-bold text-black">{formatRupiahMohat(kupon.feePerujuk)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-black">Fee Sopir PKM:</span>
                    <span className="font-bold text-black">{formatRupiahMohat(kupon.feeSopir)}</span>
                  </div>
                </div>
              )}

              {/* HIGHLIGHT TOTAL FEE: Boxed Container with Bold 14px Font */}
              <div className="border-2 border-black p-2 my-2 bg-white text-center">
                <div className="text-[14px] font-black tracking-wide text-black uppercase">
                  TOTAL FEE: {formatRupiahMohat(kupon.feeTotal)}
                </div>
              </div>

              {/* DIGITAL AUTHENTICATION (QR CODE & KODE KEASLIAN) */}
              <div className="border border-black p-2 my-1.5 text-center bg-white">
                <div className="flex justify-center my-0.5">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Verifikasi Digital"
                      className={`${paperWidth === '58mm' ? 'w-[95px] h-[95px]' : 'w-[110px] h-[110px]'} object-contain mx-auto`}
                    />
                  ) : (
                    <div className="w-[100px] h-[100px] border border-dashed border-black flex items-center justify-center text-[9px] font-mono">
                      MEMBUAT QR...
                    </div>
                  )}
                </div>

                <div className="font-extrabold text-[9px] leading-tight text-black uppercase mt-1">
                  BERKAS SAH & TERVERIFIKASI DIGITAL RSU MUHAMMADIYAH BABAT
                </div>

                <div className="font-black font-mono text-[11px] tracking-wider text-black mt-0.5">
                  KODE AUTH: {authCode}
                </div>

                <div className="text-[8px] text-black mt-0.5 font-mono">
                  Otentikasi Sistem • {formatDateIndo(kupon.tanggalMasuk)} {kupon.jamDibuat || 'WIB'}
                </div>
              </div>

              {/* SIGNATURE BLOCK: 2-Column Fixed Table to eliminate overlap on 58mm / 80mm */}
              <table
                className="w-full text-black mt-3 mb-1 signature-table"
                style={{
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  border: 'none',
                  background: 'transparent'
                }}
              >
                <tbody>
                  <tr style={{ border: 'none', background: 'transparent' }}>
                    {/* Left Column: Penerima Fee (Perujuk / Sopir) */}
                    <td
                      style={{
                        width: '50%',
                        verticalAlign: 'top',
                        textAlign: 'center',
                        padding: '0 2px',
                        border: 'none',
                        background: 'transparent'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#000000',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                          marginBottom: '26px'
                        }}
                      >
                        Penerima Fee,
                      </div>
                      <div
                        style={{
                          width: '100%',
                          borderBottom: '1px dotted #000000',
                          paddingBottom: '2px',
                          textAlign: 'center',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          color: '#000000',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minHeight: '14px',
                          lineHeight: '1.2'
                        }}
                      >
                        {kupon.namaPerujuk
                          ? `( ${kupon.namaPerujuk.split('(')[0].trim()} )`
                          : kupon.namaSopir
                          ? `( ${kupon.namaSopir} )`
                          : '( .................... )'}
                      </div>
                      <div
                        style={{
                          fontSize: '8.5px',
                          fontWeight: '600',
                          color: '#000000',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                          marginTop: '3px'
                        }}
                      >
                        Perujuk / Sopir
                      </div>
                    </td>

                    {/* Right Column: Kasir RS (Petugas Kasir RS) */}
                    <td
                      style={{
                        width: '50%',
                        verticalAlign: 'top',
                        textAlign: 'center',
                        padding: '0 2px',
                        border: 'none',
                        background: 'transparent'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#000000',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                          marginBottom: '26px'
                        }}
                      >
                        Kasir RS,
                      </div>
                      <div
                        style={{
                          width: '100%',
                          borderBottom: '1px dotted #000000',
                          paddingBottom: '2px',
                          textAlign: 'center',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          color: '#000000',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minHeight: '14px',
                          lineHeight: '1.2'
                        }}
                      >
                        {kupon.petugasKasir && kupon.petugasKasir !== '-'
                          ? `( ${kupon.petugasKasir} )`
                          : '( .................... )'}
                      </div>
                      <div
                        style={{
                          fontSize: '8.5px',
                          fontWeight: '600',
                          color: '#000000',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                          marginTop: '3px'
                        }}
                      >
                        Petugas Kasir RS
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>

          </div>
        </div>

        {/* Modal Footer (No Print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5 no-print print:hidden shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Unduh PDF Struk Thermal */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50"
              title="Unduh struk sebagai file PDF thermal"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              ) : (
                <Download className="w-4 h-4 text-emerald-700" />
              )}
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            {/* Buka Tab Baru Cetak */}
            <button
              type="button"
              onClick={handleOpenNewTabPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
              title="Buka struk di tab baru browser untuk mencetak langsung"
            >
              <ExternalLink className="w-4 h-4 text-emerald-300" />
              <span>Tab Cetak</span>
            </button>

            {/* Tombol Cetak Utama */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#005d42] hover:bg-[#004a35] text-white rounded-xl text-xs font-bold shadow-md transition active:scale-98 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>
                Cetak Struk ({paperWidth})
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
