import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { KuponMohat } from '../../types/mohatTypes';
import { formatRupiahMohat, getPenjaminDisplayLabel } from '../../data/mohatData';
import { exportToPdf } from '../../utils/exportHelpers';

interface MohatReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  kuponList: KuponMohat[];
  filterInfo?: {
    search?: string;
    kategori?: string;
    penjamin?: string;
    status?: string;
  };
}

export const MohatReportPdfModal: React.FC<MohatReportPdfModalProps> = ({
  isOpen,
  onClose,
  kuponList,
  filterInfo
}) => {
  if (!isOpen) return null;

  const totalFeeAll = kuponList.reduce((acc, k) => acc + k.feeTotal, 0);
  const totalFeePerujukAll = kuponList.reduce((acc, k) => acc + k.feePerujuk, 0);
  const totalFeeSopirAll = kuponList.reduce((acc, k) => acc + k.feeSopir, 0);
  const countUmum = kuponList.filter((k) => k.penjamin === 'UMUM').length;
  const countBpjs = kuponList.filter((k) => k.penjamin !== 'UMUM').length;
  const countPkm = kuponList.filter((k) => k.kategori === 'PKM').length;
  const countMohat = kuponList.filter((k) => k.kategori === 'MOHAT').length;

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    const reportArea = document.getElementById('print-report-area');
    if (!reportArea) {
      window.focus();
      window.print();
      return;
    }

    try {
      const existingFrame = document.getElementById('report-pdf-print-frame');
      if (existingFrame) existingFrame.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'report-pdf-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.left = '-9999px';
      printIframe.style.top = '-9999px';
      printIframe.style.width = '297mm';
      printIframe.style.height = '210mm';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!frameDoc) {
        window.focus();
        window.print();
        return;
      }

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan Fee Mohat & Perujuk</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #000; font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    th, td { border: 1px solid #94a3b8; padding: 4px 6px; }
    th { background: #005d42 !important; color: #fff !important; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .bg-slate-900 { background: #005d42 !important; color: #fff !important; }
  </style>
</head>
<body>
  ${reportArea.innerHTML}
</body>
</html>`);
      frameDoc.close();

      setTimeout(() => {
        try {
          if (printIframe.contentWindow) {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
          }
        } catch {
          window.focus();
          window.print();
        }
      }, 300);
    } catch {
      window.focus();
      window.print();
    }
  };

  const handleDirectDownloadPdf = async () => {
    const headers = [
      'No',
      'No. Seri',
      'No. Kupon',
      'Tanggal',
      'Nama Pasien',
      'Penjamin',
      'Kategori',
      'Perujuk',
      'Sopir',
      'Fee Perujuk',
      'Fee Sopir',
      'Total Fee'
    ];

    const data = kuponList.map((k, idx) => [
      String(idx + 1),
      k.noSeri || '-',
      k.nomorKupon,
      k.tanggalMasuk,
      k.namaPasien,
      getPenjaminDisplayLabel(k.penjamin),
      k.kategori === 'PKM' ? 'PKM' : 'Mohat',
      k.namaPerujuk || '-',
      k.namaSopir || (k.kategori === 'MOHAT' ? k.namaPerujuk : '-'),
      formatRupiahMohat(k.feePerujuk),
      formatRupiahMohat(k.feeSopir),
      formatRupiahMohat(k.feeTotal)
    ]);

    await exportToPdf({
      filename: `Laporan_Klaim_Kupon_Mohat_RSUMB_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: 'LAPORAN REKAPITULASI KUPON FEE RUJUKAN PASIEN RANAP',
      subtitle: `Unit Pendaftaran & Kasir RSUMB • Total Kupon: ${kuponList.length} Lembar`,
      totalLabel: `Total Pengeluaran Fee: ${formatRupiahMohat(totalFeeAll)}`,
      headers,
      data,
      orientation: 'landscape',
      signatureCity: 'Babat, Lamongan',
      signatureTitle: 'Bagian Keuangan / Kasir RSUMB',
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'left', cellWidth: 38 },
        5: { halign: 'left', cellWidth: 26 },
        6: { halign: 'center', cellWidth: 16 },
        7: { halign: 'left', cellWidth: 32 },
        8: { halign: 'left', cellWidth: 26 },
        9: { halign: 'right', cellWidth: 20 },
        10: { halign: 'right', cellWidth: 20 },
        11: { halign: 'right', cellWidth: 22 }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:m-0 print:bg-white print:static print:inset-auto">
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:static">
        
        {/* Modal Topbar (Hidden on Print) */}
        <div className="bg-[#005d42] text-white px-6 py-4 flex items-center justify-between no-print print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pratinjau Laporan Rekap Kupon Fee</h3>
              <p className="text-xs text-emerald-100">
                Format Resmi A4 Landscape • RSU Muhammadiyah Babat
              </p>
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

        {/* Scrollable Document Preview Body */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          {/* A4 REPORT PAPER - TARGETED BY #print-report-area */}
          <div
            id="print-report-area"
            className="bg-white p-6 sm:p-8 rounded-xl shadow-md print:shadow-none border border-slate-200 print:border-none w-full max-w-4xl text-slate-800 text-xs print:p-2"
          >
            {/* KOP RESMI RSUMB */}
            <div className="flex items-center gap-4 pb-3 border-b-2 border-[#005d42]">
              <img
                src="/logo-rsumb.png"
                alt="Logo RSUMB"
                className="w-14 h-14 object-contain shrink-0"
                onError={(e) => {
                  // Fallback icon jika logo gagal
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-black text-[#005d42] tracking-tight uppercase leading-tight">
                  RSU MUHAMMADIYAH BABAT
                </h1>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  Jl. Raya Babat - Surabaya KM. 4, Babat, Lamongan - Jawa Timur | Telp. (0322) 451111 / 451234
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  Layanan Rujukan Rawat Inap & Kerjasama Faskes (Puskesmas & Mobil Sehat Desa)
                </p>
              </div>
            </div>

            {/* JUDUL LAPORAN */}
            <div className="text-center py-4">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                LAPORAN REKAPITULASI KLAIM KUPON FEE RUJUKAN PASIEN RAWAT INAP
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-1">
                <span>Tanggal Laporan: <strong>{currentDate}</strong></span>
                <span>•</span>
                <span>Waktu Cetak: <strong>{currentTime} WIB</strong></span>
                <span>•</span>
                <span>Total Data: <strong>{kuponList.length} Kupon</strong></span>
              </div>
            </div>

            {/* RINGKASAN METRIK KUPON */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Kupon</span>
                <span className="text-base font-bold text-slate-900">{kuponList.length} Kupon</span>
                <span className="text-[9px] text-slate-500 block">PKM: {countPkm} | Mohat: {countMohat}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Pasien UMUM</span>
                <span className="text-base font-bold text-emerald-700">{countUmum} Pasien</span>
                <span className="text-[9px] text-emerald-600 block">Tarif Non-BPJS</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">BPJS / JR / Asuransi</span>
                <span className="text-base font-bold text-blue-700">{countBpjs} Pasien</span>
                <span className="text-[9px] text-blue-600 block">Tarif Standar</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Biaya Fee</span>
                <span className="text-base font-black text-[#005d42]">{formatRupiahMohat(totalFeeAll)}</span>
                <span className="text-[9px] text-slate-500 block">Perujuk + Sopir</span>
              </div>
            </div>

            {/* TABEL DATA REKAP */}
            <div className="overflow-x-auto border border-slate-300 rounded-md">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#005d42] text-white font-bold text-center border-b border-emerald-900">
                    <th className="p-2 w-8 border-r border-emerald-700">No</th>
                    <th className="p-2 border-r border-emerald-700">No. Seri</th>
                    <th className="p-2 border-r border-emerald-700">No. Kupon</th>
                    <th className="p-2 border-r border-emerald-700">Tanggal</th>
                    <th className="p-2 border-r border-emerald-700 text-left">Nama Pasien</th>
                    <th className="p-2 border-r border-emerald-700">Penjamin</th>
                    <th className="p-2 border-r border-emerald-700">Kategori</th>
                    <th className="p-2 border-r border-emerald-700 text-left">Perujuk</th>
                    <th className="p-2 border-r border-emerald-700 text-left">Sopir</th>
                    <th className="p-2 border-r border-emerald-700 text-right">Fee Perujuk</th>
                    <th className="p-2 border-r border-emerald-700 text-right">Fee Sopir</th>
                    <th className="p-2 text-right">Total Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {kuponList.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-4 text-center text-slate-400 italic">
                        Tidak ada riwayat kupon yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    kuponList.map((k, idx) => (
                      <tr key={k.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="p-1.5 text-center font-medium border-r border-slate-200">{idx + 1}</td>
                        <td className="p-1.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                          {k.noSeri || '-'}
                        </td>
                        <td className="p-1.5 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">
                          {k.nomorKupon}
                        </td>
                        <td className="p-1.5 text-center text-slate-600 border-r border-slate-200 whitespace-nowrap">
                          {k.tanggalMasuk}
                        </td>
                        <td className="p-1.5 font-semibold text-slate-900 border-r border-slate-200 max-w-[150px] truncate">
                          {k.namaPasien}
                        </td>
                        <td className="p-1.5 text-center border-r border-slate-200 whitespace-nowrap">
                          <span className={k.penjamin === 'UMUM' ? 'text-emerald-700 font-semibold' : 'text-blue-700'}>
                            {getPenjaminDisplayLabel(k.penjamin)}
                          </span>
                        </td>
                        <td className="p-1.5 text-center border-r border-slate-200 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded font-medium text-[9px] ${
                            k.kategori === 'PKM' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {k.kategori === 'PKM' ? 'PKM' : 'Mohat'}
                          </span>
                        </td>
                        <td className="p-1.5 text-slate-700 border-r border-slate-200 max-w-[130px] truncate">
                          {k.namaPerujuk || '-'}
                        </td>
                        <td className="p-1.5 text-slate-700 border-r border-slate-200 max-w-[120px] truncate">
                          {k.namaSopir || (k.kategori === 'MOHAT' ? k.namaPerujuk : '-')}
                        </td>
                        <td className="p-1.5 text-right font-mono border-r border-slate-200">
                          {formatRupiahMohat(k.feePerujuk)}
                        </td>
                        <td className="p-1.5 text-right font-mono border-r border-slate-200">
                          {k.feeSopir > 0 ? formatRupiahMohat(k.feeSopir) : '-'}
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold text-[#005d42]">
                          {formatRupiahMohat(k.feeTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td colSpan={8} className="p-2 text-right uppercase tracking-wider text-slate-700 border-r border-slate-300">
                      GRAND TOTAL PENGELUARAN FEE:
                    </td>
                    <td className="p-2 text-right font-mono text-slate-800 border-r border-slate-300">
                      {formatRupiahMohat(totalFeePerujukAll)}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-800 border-r border-slate-300">
                      {formatRupiahMohat(totalFeeSopirAll)}
                    </td>
                    <td className="p-2 text-right font-mono text-sm font-black text-[#005d42]">
                      {formatRupiahMohat(totalFeeAll)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* AREA TANDA TANGAN */}
            <div className="mt-8 pt-4 border-t border-dashed border-slate-300 flex justify-between text-center text-[10px] text-slate-700">
              <div className="w-48">
                <p>Mengetahui,</p>
                <p className="font-bold text-slate-900 mt-0.5">Petugas Kasir / Admisi RS</p>
                <div className="h-16" />
                <p className="border-b border-slate-400 font-medium pb-1">( ........................................ )</p>
                <p className="text-[9px] text-slate-500 mt-0.5">SIMRS MedCentral RSUMB</p>
              </div>

              <div className="w-56">
                <p>Babat, {currentDate}</p>
                <p className="font-bold text-slate-900 mt-0.5">Bagian Keuangan RSUMB</p>
                <div className="h-16" />
                <p className="border-b border-slate-400 font-medium pb-1">( ........................................ )</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Penanggung Jawab Kasir</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls (Hidden on Print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print print:hidden shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDirectDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Unduh Berkas PDF (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#005d42] hover:bg-[#004a35] text-white rounded-xl text-xs font-bold shadow-md transition active:scale-98 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan (Print / Simpan PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
