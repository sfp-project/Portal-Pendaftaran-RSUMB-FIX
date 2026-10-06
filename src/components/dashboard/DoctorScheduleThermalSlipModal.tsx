import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import {
  X,
  Printer,
  QrCode,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Clock,
  Phone,
  Globe,
  Share2,
  Stethoscope,
  Building2,
  FileText,
  MessageSquare,
  Download,
  ExternalLink,
  Radio
} from 'lucide-react';
import { DoctorSchedule, DoctorLeaveAnnouncement } from '../../types';
import { getIndonesianCurrentDate } from '../../utils/exportHelpers';
import { loadActiveStaff } from '../../data/headerData';
import { formatDoctorScheduleTime } from '../../utils/dateHelpers';

interface DoctorScheduleThermalSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules?: DoctorSchedule[];
  doctorLeaves?: DoctorLeaveAnnouncement[];
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const DoctorScheduleThermalSlipModal: React.FC<DoctorScheduleThermalSlipModalProps> = ({
  isOpen,
  onClose,
  schedules = [],
  doctorLeaves = [],
  showToast
}) => {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [slipMode, setSlipMode] = useState<'general' | 'specific_doctor' | 'today_clinics'>('general');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [qrTargetType, setQrTargetType] = useState<'channel_wa' | 'chat_wa' | 'simrs_web'>('channel_wa');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const activeStaff = loadActiveStaff();
  const { dateStr: currentDateFormatted } = getIndonesianCurrentDate();
  const now = new Date();
  const currentDayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  // Format waktu bersih dan pasti tunggal tanpa duplikasi kata WIB (contoh: 13:07 WIB)
  const cleanTimeStr = `${hours}:${minutes} WIB`;

  // Konfigurasi Target QR Code Resmi RSUMB
  const qrConfigs = {
    channel_wa: {
      label: '📢 Saluran WA RSUMB',
      url: 'https://whatsapp.com/channel/0029VaIV4B4LCoWsCgTRlq2d',
      instruction: 'Scan QR Code di bawah untuk bergabung dengan Saluran WhatsApp RSUMB (Jadwal Dokter & Informasi Libur Real-Time).',
      line1: 'Saluran WA: RSU Muhammadiyah Babat',
      line2: 'whatsapp.com/channel/0029VaIV4B4LCoWsCgTRlq2d'
    },
    chat_wa: {
      label: '💬 Chat WhatsApp (0811-3222-440)',
      url: 'https://wa.me/628113222440',
      instruction: 'Scan QR Code di bawah untuk Chat WhatsApp Resmi RSUMB (0811-3222-440) - Info Jadwal & Pendaftaran Real-Time.',
      line1: 'Chat WhatsApp: 0811-3222-440',
      line2: 'wa.me/628113222440'
    },
    simrs_web: {
      label: '🌐 Portal Web SIMRS',
      url: 'https://rsumuhammadiyahbabat.com/jadwal-dokter',
      instruction: 'Scan QR Code di bawah untuk cek Jadwal Praktik Dokter & Info Libur Real-Time.',
      line1: 'Portal SIMRS: rsumuhammadiyahbabat.com',
      line2: 'rsumuhammadiyahbabat.com/jadwal-dokter'
    }
  };

  const activeQrConfig = qrConfigs[qrTargetType];

  // Daftar dokter unik untuk opsi slip khusus
  const uniqueDoctors = React.useMemo(() => {
    const list = new Map<string, { dpjp: string; poli: string; spesialisasi: string }>();
    schedules.forEach((s) => {
      if (s.dpjp && s.dpjp.trim()) {
        const key = s.dpjp.trim();
        if (!list.has(key)) {
          list.set(key, {
            dpjp: key,
            poli: s.poli || '',
            spesialisasi: s.spesialisasi || ''
          });
        }
      }
    });
    return Array.from(list.values()).sort((a, b) => a.dpjp.localeCompare(b.dpjp));
  }, [schedules]);

  // Jadwal dokter terpilih jika mode specific_doctor aktif
  const selectedDoctorSchedules = React.useMemo(() => {
    if (!selectedDoctor) return [];
    return schedules.filter((s) => s.dpjp.trim().toLowerCase() === selectedDoctor.trim().toLowerCase());
  }, [schedules, selectedDoctor]);

  // Jadwal poliklinik hari ini
  const todaySchedules = React.useMemo(() => {
    const day = currentDayName.toLowerCase();
    return schedules.filter((s) => s.hari?.toLowerCase() === day);
  }, [schedules, currentDayName]);

  // Generate QR Code mengarah ke target terpilih
  useEffect(() => {
    if (!isOpen) return;

    let targetUrl = activeQrConfig.url;
    if (qrTargetType === 'chat_wa' && slipMode === 'specific_doctor' && selectedDoctor) {
      targetUrl = `https://wa.me/628113222440?text=${encodeURIComponent(
        `Halo RSUMB, saya ingin informasi jadwal praktik ${selectedDoctor}.`
      )}`;
    } else if (qrTargetType === 'simrs_web' && slipMode === 'specific_doctor' && selectedDoctor) {
      targetUrl = `https://rsumuhammadiyahbabat.com/jadwal-dokter?dokter=${encodeURIComponent(selectedDoctor)}`;
    }

    QRCode.toDataURL(targetUrl, {
      width: paperWidth === '58mm' ? 125 : 155,
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
        console.warn('Gagal membuat QR Code:', err);
      });
  }, [isOpen, paperWidth, slipMode, selectedDoctor, qrTargetType, activeQrConfig.url]);

  if (!isOpen) return null;

  // Generate Full HTML String for New Window Print
  const generateSlipHtml = () => {
    const is58 = paperWidth === '58mm';
    const widthPx = is58 ? '58mm' : '80mm';
    const fontSize = is58 ? '10px' : '11.5px';

    let specificDoctorHtml = '';
    if (slipMode === 'specific_doctor' && selectedDoctor) {
      const listHtml = selectedDoctorSchedules
        .map(
          (s) =>
            `<div style="display:flex; justify-content:space-between; margin-bottom:3px; font-weight:bold;">
              <span>${s.hari}:</span>
              <span>${formatDoctorScheduleTime(s) || '-'} (Poli ${s.poli?.replace(/^Poli\s+/i, '') || '-'})</span>
            </div>`
        )
        .join('');

      specificDoctorHtml = `
        <div style="padding: 6px 0; border-bottom: 2px dashed #000;">
          <div style="font-size: 9px; font-weight: bold; text-transform: uppercase;">JADWAL SPESIFIK DOKTER:</div>
          <div style="font-size: 11.5px; font-weight: 800; margin: 2px 0 5px 0;">${selectedDoctor}</div>
          ${listHtml}
        </div>
      `;
    }

    let todayClinicsHtml = '';
    if (slipMode === 'today_clinics') {
      const listHtml = todaySchedules.length > 0
        ? todaySchedules
            .map(
              (s, index) =>
                `<div style="display:flex; justify-content:space-between; margin-bottom:2px; font-weight:bold; ${
                  index < todaySchedules.length - 1 ? 'border-bottom: 1px dotted #888; padding-bottom: 2px;' : 'padding-bottom: 1px;'
                }">
                  <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:150px;">${s.dpjp}</span>
                  <span style="font-size: 9px; text-align: right; shrink-0;">${formatDoctorScheduleTime(s)}</span>
                </div>`
            )
            .join('')
        : '<div style="text-align: center; font-style: italic; font-size: 9px; padding: 4px 0;">Tidak ada dokter yang praktik hari ini</div>';

      todayClinicsHtml = `
        <div style="padding: 6px 0; border-bottom: 2px dashed #000;">
          <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">PRAKTIK HARI INI (${currentDayName.toUpperCase()}):</div>
          <div>
            ${listHtml}
          </div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Slip Jadwal RSUMB (${paperWidth})</title>
  <style>
    @page {
      size: ${widthPx} auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: ${widthPx};
      max-width: ${widthPx};
      margin: 0 auto;
      padding: 2.5mm 2mm;
      font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-weight: 600;
      font-size: ${fontSize};
      line-height: 1.25;
      color: #000000;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      text-align: center;
      padding-bottom: 5px;
      border-bottom: 2px dashed #000;
    }
    .header h1 {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.2px;
      margin-bottom: 2px;
    }
    .header p {
      font-size: 9px;
      line-height: 1.2;
    }
    .contact-info {
      margin-top: 3px;
      padding-top: 3px;
      border-top: 1px dotted #555;
      font-size: 9px;
    }
    .contact-telp-wa {
      font-size: ${is58 ? '12.5px' : '14px'};
      font-weight: 900;
      color: #000000 !important;
      letter-spacing: 0.3px;
      margin: 3px 0 2px 0;
      line-height: 1.2;
    }
    .sub-header {
      text-align: center;
      padding: 5px 0;
      border-bottom: 2px dashed #000;
    }
    .sub-header .title {
      font-size: 11px;
      font-weight: 900;
      margin-bottom: 2px;
      letter-spacing: 0.3px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      margin-top: 2px;
    }
    .qr-section {
      text-align: center;
      padding: 6px 0;
    }
    .qr-section p.instruction {
      font-size: 9.5px;
      font-weight: 700;
      margin-bottom: 4px;
      line-height: 1.2;
    }
    .qr-box {
      display: inline-block;
      border: 2px solid #000;
      padding: 3px;
      background: #fff;
      margin-bottom: 3px;
    }
    .qr-box img {
      width: ${is58 ? '110px' : '130px'};
      height: ${is58 ? '110px' : '130px'};
      display: block;
    }
    .wa-link-title {
      font-size: 9.5px;
      font-weight: bold;
      margin-top: 1px;
    }
    .wa-link-url {
      font-size: 8px;
      font-weight: bold;
      word-break: break-all;
      line-height: 1.15;
      padding: 0 2px;
      margin-top: 1px;
    }
    .footer {
      text-align: center;
      padding-top: 5px;
      border-top: 2px dashed #000;
      font-style: italic;
      font-weight: 800;
      font-size: 9.5px;
    }
    .footer .thanks {
      font-style: normal;
      font-weight: bold;
      font-size: 8px;
      margin-top: 3px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>RSU MUHAMMADIYAH BABAT</h1>
    <p>Jl. Raya Babat Surabaya Km. 04 Babat - Lamongan<br>(Timur Pasar Agrobis)</p>
    <div class="contact-info">
      <div class="contact-telp-wa">Telp/WA: 0811-3222-440</div>
      <div style="font-size: 9px; font-weight: 600; color: #000;">Medsos & Web: @rsumbabat | rsumuhammadiyahbabat.com</div>
    </div>
  </div>

  <div class="sub-header" style="${slipMode === 'general' ? 'padding: 4px 0;' : 'padding: 5px 0;'}">
    ${slipMode !== 'general' ? '<div class="title">INFORMASI JADWAL DOKTER</div>' : ''}
    <div class="meta-row">
      <span>Tgl: ${currentDateFormatted}</span>
      <span>${cleanTimeStr}</span>
    </div>
  </div>

  ${specificDoctorHtml}
  ${todayClinicsHtml}

  <div class="qr-section">
    <p class="instruction">${activeQrConfig.instruction}</p>
    <div class="qr-box">
      <img src="${qrDataUrl}" alt="QR Code" />
    </div>
    <div class="wa-link-title">${activeQrConfig.line1}</div>
    <div class="wa-link-url">${activeQrConfig.line2}</div>
  </div>

  <div class="footer">
    <div>"Melayani dengan Profesional, Santun dan Berdedikasi"</div>
    <div class="thanks">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</div>
  </div>
</body>
</html>`;
  };

  // Method 1: New Window / Tab Print (Aman & 100% Berhasil)
  const handlePrintNewWindow = () => {
    const htmlContent = generateSlipHtml();

    try {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.print();
        }, 350);
        showToast?.('Jendela cetak thermal berhasil dibuka!', 'info');
      } else {
        handlePrintDirect();
      }
    } catch {
      handlePrintDirect();
    }
  };

  // Method 2: Direct Print
  const handlePrintDirect = () => {
    const htmlContent = generateSlipHtml();
    let printIframe = document.getElementById('thermal-slip-print-iframe') as HTMLIFrameElement;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'thermal-slip-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);
    }
    const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      }, 350);
    } else {
      window.print();
    }
  };

  // Method 3: Download PDF
  const handleDownloadPdf = () => {
    try {
      const is58 = paperWidth === '58mm';
      const widthMm = is58 ? 58 : 80;
      const heightMm = (is58 ? 165 : 185) + (slipMode === 'today_clinics' ? Math.max(0, todaySchedules.length - 4) * 4 : 0);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [widthMm, heightMm]
      });

      // Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(is58 ? 9.5 : 11.5);
      doc.text('RSU MUHAMMADIYAH BABAT', widthMm / 2, 7, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(is58 ? 6.5 : 7.5);
      doc.text('Jl. Raya Babat Surabaya Km. 04 Babat - Lamongan', widthMm / 2, 11, { align: 'center' });
      doc.text('(Timur Pasar Agrobis)', widthMm / 2, 14, { align: 'center' });

      // Prominent Telp/WA in PDF
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(is58 ? 8.5 : 10);
      doc.text('Telp/WA: 0811-3222-440', widthMm / 2, 18, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(is58 ? 6 : 7);
      doc.text('Medsos & Web: @rsumbabat | rsumuhammadiyahbabat.com', widthMm / 2, 21.5, { align: 'center' });

      // Divider
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(3, 23.5, widthMm - 3, 23.5);

      // Title & Meta
      let currY = 27.5;
      if (slipMode !== 'general') {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(is58 ? 7.5 : 8.5);
        doc.text('INFORMASI JADWAL DOKTER', widthMm / 2, currY, { align: 'center' });
        currY += 4;
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(is58 ? 6.5 : 7.5);
      doc.text(`Tgl: ${currentDateFormatted}   ${cleanTimeStr}`, widthMm / 2, currY, { align: 'center' });
      currY += 3;
      doc.line(3, currY, widthMm - 3, currY);
      currY += 4;

      if (slipMode === 'specific_doctor' && selectedDoctor) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(is58 ? 7 : 8);
        doc.text(`DOKTER: ${selectedDoctor}`, 4, currY);
        currY += 3.5;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(is58 ? 6 : 7);
        selectedDoctorSchedules.forEach((s) => {
          doc.text(`• ${s.hari}: ${formatDoctorScheduleTime(s) || '-'} (Poli ${s.poli || '-'})`, 4, currY);
          currY += 3.2;
        });
        doc.line(3, currY, widthMm - 3, currY);
        currY += 4;
      } else if (slipMode === 'today_clinics') {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(is58 ? 7 : 8);
        doc.text(`PRAKTIK HARI INI (${currentDayName.toUpperCase()}):`, 4, currY);
        currY += 3.5;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(is58 ? 5.5 : 6.5);
        todaySchedules.forEach((s) => {
          doc.text(`• ${s.dpjp}: ${formatDoctorScheduleTime(s) || '-'}`, 4, currY);
          currY += 3;
        });
        doc.line(3, currY, widthMm - 3, currY);
        currY += 4;
      }

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(is58 ? 6.5 : 7.5);
      const splitInstruction = doc.splitTextToSize(
        activeQrConfig.instruction,
        widthMm - 8
      );
      doc.text(splitInstruction, widthMm / 2, currY, { align: 'center' });
      currY += splitInstruction.length * 3.2 + 1.5;

      // QR Image
      if (qrDataUrl) {
        const qrSize = is58 ? 30 : 36;
        const qrX = (widthMm - qrSize) / 2;
        doc.addImage(qrDataUrl, 'PNG', qrX, currY, qrSize, qrSize);
        currY += qrSize + 3;
      }

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(is58 ? 6.5 : 7.5);
      doc.text(activeQrConfig.line1, widthMm / 2, currY, { align: 'center' });
      currY += 3.2;
      doc.setFontSize(is58 ? 5.5 : 6.5);
      const splitUrl = doc.splitTextToSize(activeQrConfig.line2, widthMm - 6);
      doc.text(splitUrl, widthMm / 2, currY, { align: 'center' });
      currY += splitUrl.length * 2.8 + 1.5;

      doc.line(3, currY, widthMm - 3, currY);
      currY += 3.5;

      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(is58 ? 6 : 7);
      doc.text('"Melayani dengan Profesional, Santun dan Berdedikasi"', widthMm / 2, currY, { align: 'center' });

      const filename = `Slip_Jadwal_RSUMB_${paperWidth}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      showToast?.(`File ${filename} berhasil diunduh!`, 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast?.('Gagal mengunduh file PDF.', 'error');
    }
  };

  const handleCopyText = async () => {
    try {
      const text = generateRawSlipText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast?.('Format teks slip thermal berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast?.('Gagal menyalin teks ke clipboard.', 'error');
    }
  };

  const generateRawSlipText = () => {
    const is58 = paperWidth === '58mm';
    const divider = is58 ? '--------------------------------' : '------------------------------------------';
    const doubleDivider = is58 ? '================================' : '==========================================';

    let text = `${doubleDivider}\n`;
    text += `       RSU MUHAMMADIYAH BABAT\n`;
    text += ` Jl. Raya Babat Surabaya Km. 04 Babat\n`;
    text += `   Lamongan (Timur Pasar Agrobis)\n`;
    text += `        Telp/WA: 0811-3222-440\n`;
    text += ` Medsos & Web: @rsumbabat\n`;
    text += `     rsumuhammadiyahbabat.com\n`;
    text += `${divider}\n`;

    if (slipMode !== 'general') {
      text += `INFORMASI JADWAL DOKTER\n`;
    }
    text += `Tgl Cetak: ${currentDateFormatted}   ${cleanTimeStr}\n`;
    text += `${divider}\n`;

    if (slipMode === 'specific_doctor' && selectedDoctor) {
      text += `DOKTER: ${selectedDoctor}\n`;
      selectedDoctorSchedules.forEach((s) => {
        text += `• ${s.hari}: ${formatDoctorScheduleTime(s) || '-'} (Poli ${s.poli || '-'})\n`;
      });
      text += `${divider}\n`;
    } else if (slipMode === 'today_clinics') {
      text += `PRAKTIK HARI INI (${currentDayName.toUpperCase()}):\n`;
      todaySchedules.forEach((s) => {
        text += `• ${s.dpjp}: ${formatDoctorScheduleTime(s) || '-'}\n`;
      });
      text += `${divider}\n`;
    }

    text += `${activeQrConfig.instruction}\n`;
    text += `${activeQrConfig.line1}\n`;
    text += `${activeQrConfig.line2}\n`;
    text += `${divider}\n`;
    text += `  "Melayani dengan Profesional,\n`;
    text += `     Santun dan Berdedikasi"\n`;
    text += `${doubleDivider}\n`;

    return text;
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      {/* Background click dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-[1000000] w-full max-w-2xl max-h-[94vh] sm:max-h-[90vh] my-auto flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 shrink-0 bg-gradient-to-r from-emerald-900 via-[#005d42] to-teal-900 border-b px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Printer className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                Cetak Slip Thermal Jadwal Dokter
                <span className="text-[10px] font-bold uppercase bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/40">
                  POS {paperWidth}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">
                Kartu informasi pendaftaran & QR Code Resmi RSUMB
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shrink-0"
            title="Tutup Modal"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Pengaturan Format & Pilihan Slip */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Switcher Lebar Kertas (80mm vs 58mm) */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 px-1.5">Ukuran:</span>
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperWidth === '80mm'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              80 mm
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperWidth === '58mm'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              58 mm
            </button>
          </div>

          {/* Selector Tujuan QR Code */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Tujuan QR:</span>
            <select
              value={qrTargetType}
              onChange={(e) => setQrTargetType(e.target.value as any)}
              className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
            >
              <option value="channel_wa">📢 Saluran WA RSUMB</option>
              <option value="chat_wa">💬 Chat WA (0811-3222-440)</option>
              <option value="simrs_web">🌐 Portal Web SIMRS</option>
            </select>
          </div>

          {/* Mode Slip Selector */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[160px]">
            <select
              value={slipMode}
              onChange={(e) => {
                const val = e.target.value as 'general' | 'specific_doctor' | 'today_clinics';
                setSlipMode(val);
                if (val === 'specific_doctor' && !selectedDoctor && uniqueDoctors.length > 0) {
                  setSelectedDoctor(uniqueDoctors[0].dpjp);
                }
              }}
              className="w-full sm:w-auto px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
            >
              <option value="general">📄 Slip Umum Standar</option>
              <option value="specific_doctor">🩺 Slip Khusus Dokter</option>
              <option value="today_clinics">📅 Praktik Hari Ini</option>
            </select>
          </div>

          {slipMode === 'specific_doctor' && (
            <div className="w-full sm:w-auto flex-1">
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
              >
                <option value="">-- Pilih Dokter --</option>
                {uniqueDoctors.map((doc) => (
                  <option key={doc.dpjp} value={doc.dpjp}>
                    {doc.dpjp} ({doc.poli})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Body: Pratinjau Thermal Slip Realistis dengan Font Tegas & Jelas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/90 flex justify-center items-start">
          {/* Thermal Receipt Container */}
          <div
            ref={printContainerRef}
            id="thermal-slip-print-area"
            className={`bg-white text-black p-4 sm:p-5 rounded-lg shadow-xl border border-slate-300 transition-all leading-snug font-sans ${
              paperWidth === '58mm' ? 'w-[280px] text-[11px]' : 'w-[360px] text-[12.5px]'
            }`}
            style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#000000',
              backgroundColor: '#ffffff',
              fontWeight: 600
            }}
          >
            {/* Header Slip (Tanpa Logo) */}
            <div className="text-center pb-2.5 border-b-2 border-dashed border-black">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight uppercase text-black">
                RSU MUHAMMADIYAH BABAT
              </h3>
              <p className="text-[10px] sm:text-[11px] font-semibold mt-0.5 leading-snug text-black">
                Jl. Raya Babat Surabaya Km. 04 Babat - Lamongan
                <br />
                (Timur Pasar Agrobis)
              </p>
              <div className="mt-1.5 pt-1.5 border-t border-dotted border-black/50 text-[10px] sm:text-[11px] space-y-0.5">
                {/* Prominent Telp/WA RSUMB */}
                <p
                  data-telp-wa="true"
                  className="font-black tracking-wide text-black text-center"
                  style={{
                    fontSize: paperWidth === '58mm' ? '12.5px' : '14px',
                    fontWeight: 900,
                    color: '#000000',
                    margin: '2px 0'
                  }}
                >
                  Telp/WA: 0811-3222-440
                </p>
                <p className="text-[9px] sm:text-[10px] font-semibold text-black">
                  Medsos & Web: @rsumbabat | rsumuhammadiyahbabat.com
                </p>
              </div>
            </div>

            {/* Sub-Header Judul & Waktu Slip */}
            <div className={`border-b-2 border-dashed border-black text-center ${slipMode === 'general' ? 'py-1.5' : 'py-2'}`}>
              {slipMode !== 'general' && (
                <p className="font-extrabold text-xs uppercase tracking-wide text-black mb-1">
                  INFORMASI JADWAL DOKTER
                </p>
              )}
              <div className="flex items-center justify-between text-[10.5px] sm:text-[11.5px] font-bold text-black">
                <span>Tgl: {currentDateFormatted}</span>
                <span>{cleanTimeStr}</span>
              </div>
            </div>

            {/* Optional Specific Doctor Content */}
            {slipMode === 'specific_doctor' && selectedDoctor && (
              <div className="py-2.5 border-b-2 border-dashed border-black">
                <p className="text-[10px] uppercase font-bold text-black">JADWAL SPESIFIK DOKTER:</p>
                <p className="font-extrabold text-xs mt-0.5 text-black leading-tight">
                  {selectedDoctor}
                </p>
                <div className="mt-1.5 space-y-1 text-[11px]">
                  {selectedDoctorSchedules.map((sch, i) => (
                    <div key={i} className="flex items-baseline justify-between font-bold">
                      <span>{sch.hari}:</span>
                      <span className="text-right font-bold">
                        {formatDoctorScheduleTime(sch) || '-'} (Poli {sch.poli?.replace(/^Poli\s+/i, '') || '-'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Today Clinics Summary - Tampilkan SEMUA dokter praktik hari ini */}
            {slipMode === 'today_clinics' && (
              <div className="py-2.5 border-b-2 border-dashed border-black">
                <p className="text-[10px] uppercase font-bold text-black mb-1">
                  PRAKTIK HARI INI ({currentDayName.toUpperCase()}):
                </p>
                <div className="space-y-1 text-[10.5px]">
                  {todaySchedules.length > 0 ? (
                    todaySchedules.map((sch, i) => (
                      <div
                        key={i}
                        className={`flex items-baseline justify-between font-bold ${
                          i < todaySchedules.length - 1 ? 'border-b border-dotted border-black/30 pb-0.5' : 'pb-0'
                        }`}
                      >
                        <span className="truncate max-w-[155px]">{sch.dpjp}</span>
                        <span className="text-[10px] text-right shrink-0">{formatDoctorScheduleTime(sch)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[9.5px] text-center italic text-black/70 py-1">
                      Tidak ada dokter yang praktik hari ini
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* QR Code Section & Petunjuk Pasien */}
            <div className="py-3 text-center flex flex-col items-center">
              <p className="text-[10.5px] sm:text-[11.5px] font-bold leading-tight px-1 text-center text-black">
                {activeQrConfig.instruction}
              </p>

              {/* QR Code Image */}
              <div className="my-2.5 p-1.5 bg-white border-2 border-black rounded-sm inline-block shadow-2xs">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code RSUMB"
                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-bold">
                    Membuat QR...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-bold text-black">
                <MessageSquare className="w-3.5 h-3.5 text-black" />
                <span>{activeQrConfig.line1}</span>
              </div>
              <p className="text-[8.5px] sm:text-[9.5px] font-bold text-black mt-0.5 max-w-[90%] break-all text-center">
                {activeQrConfig.line2}
              </p>
            </div>

            {/* Motto / Footer */}
            <div className="pt-2.5 border-t-2 border-dashed border-black text-center space-y-1">
              <p className="font-extrabold text-[10.5px] sm:text-[11.5px] italic tracking-tight text-black">
                "Melayani dengan Profesional, Santun dan Berdedikasi"
              </p>
              <p className="text-[9px] font-bold text-black/80 pt-1">
                *** TERIMA KASIH ATAS KUNJUNGAN ANDA ***
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Buttons (Unduh PDF, Tab Cetak, Cetak Struk, Batal) */}
        <div className="bg-white border-t border-slate-200 px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-300"
              title="Salin Teks Format Slip"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Tombol 1: Unduh PDF */}
            <button
              type="button"
              id="btn-download-slip-pdf"
              onClick={handleDownloadPdf}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 shadow-2xs hover:shadow-xs"
              title="Unduh format slip sebagai dokumen PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Unduh PDF</span>
            </button>

            {/* Tombol 2: Tab Cetak / Buka Halaman Cetak */}
            <button
              type="button"
              id="btn-open-print-tab"
              onClick={handlePrintNewWindow}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              title="Buka pratinjau slip di Tab Baru dan otomatis memicu dialog printer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-700" />
              <span>Tab Cetak</span>
            </button>

            {/* Tombol 3: Cetak Struk (58mm/80mm) */}
            <button
              type="button"
              id="btn-trigger-thermal-print"
              onClick={handlePrintNewWindow}
              className="px-4 py-2 bg-gradient-to-r from-[#005d42] to-emerald-700 hover:from-[#004833] hover:to-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Cetak langsung ke printer thermal POS"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>Cetak Struk ({paperWidth})</span>
            </button>

            {/* Tombol 4: Tutup / Batal */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Global Thermal Printing CSS Khusus Printer Thermal POS 80mm & 58mm */}
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            min-height: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-slip-print-area, #thermal-slip-print-area * {
            visibility: visible !important;
          }
          #thermal-slip-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${paperWidth === '58mm' ? '58mm' : '80mm'} !important;
            max-width: ${paperWidth === '58mm' ? '58mm' : '80mm'} !important;
            margin: 0 auto !important;
            padding: 2mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-weight: 600 !important;
            font-size: ${paperWidth === '58mm' ? '9pt' : '10pt'} !important;
            line-height: 1.25 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #thermal-slip-print-area [data-telp-wa="true"],
          #thermal-slip-print-area .contact-telp-wa {
            font-size: ${paperWidth === '58mm' ? '12.5px' : '14px'} !important;
            font-weight: 900 !important;
            color: #000000 !important;
            letter-spacing: 0.3px !important;
            margin: 2px 0 !important;
          }
          @page {
            size: ${paperWidth === '58mm' ? '58mm auto' : '80mm auto'};
            margin: 0mm !important;
          }
        }
      `}</style>
    </div>
  );
};
