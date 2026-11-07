import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Copy,
  Check,
  Building2,
  AlertCircle,
  Sparkles,
  Download,
  Loader2,
  Receipt,
  FileText
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { DoctorSchedule, DoctorLeaveAnnouncement } from '../types';
import {
  DAY_ORDER_MAP,
  formatDoctorScheduleTime,
  formatDoctorQuota,
  getCleanDoctorQuota,
  getScheduleStartMinutes,
  formatLeaveBadgeSummary
} from '../utils/dateHelpers';
import { getIndonesianCurrentDate } from '../utils/exportHelpers';
import { printViaWindowPopup } from '../utils/printWindowHelper';

/**
 * Normalizes doctor names for accurate matching across whitespace, punctuation, and titles.
 */
export function isSameDoctor(name1?: string, name2?: string): boolean {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (n1 === n2) return true;
  if (n1.length >= 6 && n2.length >= 6 && (n1.includes(n2) || n2.includes(n1))) {
    return true;
  }
  return false;
}

interface DoctorSchedulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorSchedule | null;
  allSchedules: DoctorSchedule[];
  doctorLeaves?: DoctorLeaveAnnouncement[];
}

export const DoctorSchedulePreviewModal: React.FC<DoctorSchedulePreviewModalProps> = ({
  isOpen,
  onClose,
  doctor,
  allSchedules,
  doctorLeaves = []
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printFormat, setPrintFormat] = useState<'thermal_80' | 'thermal_58' | 'a4'>('thermal_80');
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Aggregate ALL schedules matching this doctor's name across the entire database
  const matchingSchedules = useMemo(() => {
    if (!doctor) return [];
    const matched = allSchedules.filter((s) => isSameDoctor(s.dpjp, doctor.dpjp));

    if (matched.length === 0) {
      return [doctor];
    }

    // Sort chronologically by Indonesian day order (Senin -> Ahad), then by start time
    return matched.sort((a, b) => {
      const dayA = DAY_ORDER_MAP[a.hari.toLowerCase().trim()] ?? 99;
      const dayB = DAY_ORDER_MAP[b.hari.toLowerCase().trim()] ?? 99;
      if (dayA !== dayB) return dayA - dayB;
      return getScheduleStartMinutes(a) - getScheduleStartMinutes(b);
    });
  }, [doctor, allSchedules]);

  // Derive location room & poli display
  const poliName = useMemo(() => {
    if (!doctor) return '';
    const raw = doctor.poli || matchingSchedules[0]?.poli || 'Poliklinik Spesialis';
    return raw.startsWith('Poli ') ? raw : `Poli ${raw}`;
  }, [doctor, matchingSchedules]);

  const roomLocation = useMemo(() => {
    if (!doctor) return '';
    const withRoom = matchingSchedules.find((s) => s.ruangan && s.ruangan.trim() !== '');
    return withRoom?.ruangan || doctor.ruangan || 'R. Praktik Rawat Jalan';
  }, [doctor, matchingSchedules]);

  // Find any active leave announcements for this doctor
  const docLeaves = useMemo(() => {
    if (!doctor || !doctorLeaves.length) return [];
    return doctorLeaves.filter((l) => isSameDoctor(l.dpjp, doctor.dpjp));
  }, [doctor, doctorLeaves]);

  // Generate HTML for A4 Official Document
  const buildA4PrintHtml = (dateStr: string, timeStr: string) => {
    if (!doctor) return '';
    const hasAnyCatatan = matchingSchedules.some((s) => Boolean(s.catatan));
    const leaveSummary = docLeaves.length > 0 ? formatLeaveBadgeSummary(docLeaves[0]).text : null;

    const rowsHtml = matchingSchedules
      .map(
        (sch, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="border: 1px solid #1e293b; padding: 8px 6px; text-align: center; font-weight: 600; color: #475569;">
            ${idx + 1}
          </td>
          <td style="border: 1px solid #1e293b; padding: 8px 10px; font-weight: 800; color: #0f172a; font-size: 13px;">
            ${sch.hari}
          </td>
          <td style="border: 1px solid #1e293b; padding: 8px 10px; font-weight: 700; color: #1e40af; font-size: 13px;">
            ${formatDoctorScheduleTime(sch)}
          </td>
          <td style="border: 1px solid #1e293b; padding: 8px 10px; text-align: center; font-weight: 800; color: #000000; font-size: 13px;">
            ${getCleanDoctorQuota(sch)}
          </td>
          ${
            hasAnyCatatan
              ? `
          <td style="border: 1px solid #1e293b; padding: 8px 10px; font-weight: 600; color: #92400e; font-size: 12px;">
            ${sch.catatan || '-'}
          </td>`
              : ''
          }
        </tr>
      `
      )
      .join('');

    return `
      <div style="max-width: 210mm; margin: 0 auto; padding: 10mm 12mm; background: #ffffff; color: #000000; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- KOP RESMI RSUMB (BERSIH TANPA LOGO GAMBAR UNTUK CETAK PEKAT & JELAS) -->
        <div style="border-bottom: 2.5px solid #005d42; padding-bottom: 10px; margin-bottom: 14px; text-align: center;">
          <div style="font-size: 14px; font-weight: 900; letter-spacing: 1.5px; color: #005d42; text-transform: uppercase;">
            RSU MUHAMMADIYAH BABAT
          </div>
          <div style="font-size: 17px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 2px 0; letter-spacing: -0.3px;">
            JADWAL PRAKTIK DOKTER SPESIALIS RAWAT JALAN
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.4;">
            Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur &bull; Telp. (0322) 451111 / 451234 &bull; Email: rsumbabat@yahoo.co.id
          </div>
        </div>

        <!-- PROFIL DOKTER DPJP -->
        <div style="border: 1.5px solid #005d42; border-radius: 8px; background: #f8fafc; padding: 12px 16px; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
            <tbody>
              <tr>
                <td style="width: 160px; padding: 3px 0; font-weight: 700; color: #475569;">Nama Dokter / DPJP</td>
                <td style="width: 12px; padding: 3px 0; font-weight: 700; text-align: center;">:</td>
                <td style="padding: 3px 0; font-weight: 900; font-size: 14.5px; color: #005d42;">${doctor.dpjp}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: 700; color: #475569;">Poliklinik / Spesialis</td>
                <td style="padding: 3px 0; font-weight: 700; text-align: center;">:</td>
                <td style="padding: 3px 0; font-weight: 800; color: #0f172a;">${poliName}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: 700; color: #475569;">Lokasi Ruangan</td>
                <td style="padding: 3px 0; font-weight: 700; text-align: center;">:</td>
                <td style="padding: 3px 0; font-weight: 600; color: #334155;">${roomLocation}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: 700; color: #475569;">Total Hari Praktik</td>
                <td style="padding: 3px 0; font-weight: 700; text-align: center;">:</td>
                <td style="padding: 3px 0; font-weight: 700; color: #005d42;">${matchingSchedules.length} Hari Pelayanan Terjadwal</td>
              </tr>
              ${
                leaveSummary
                  ? `
              <tr>
                <td style="padding: 3px 0; font-weight: 700; color: #b45309;">Catatan Libur / Cuti</td>
                <td style="padding: 3px 0; font-weight: 700; text-align: center;">:</td>
                <td style="padding: 3px 0; font-weight: 700; color: #b45309;">⚠️ ${leaveSummary}</td>
              </tr>`
                  : ''
              }
            </tbody>
          </table>
        </div>

        <!-- TABEL RINCIAN JADWAL -->
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 900; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; border-left: 4px solid #005d42; padding-left: 8px; color: #0f172a;">
            RINCIAN HARI & JAM PRAKTIK POLIKLINIK
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #1e293b; font-size: 12.5px;">
            <thead>
              <tr style="background-color: #e2e8f0; color: #0f172a; font-weight: 900; text-transform: uppercase; font-size: 11.5px;">
                <th style="border: 1px solid #1e293b; padding: 8px; text-align: center; width: 45px;">NO</th>
                <th style="border: 1px solid #1e293b; padding: 8px 10px; text-align: left;">HARI PRAKTEK</th>
                <th style="border: 1px solid #1e293b; padding: 8px 10px; text-align: left;">JAM PRAKTIK RS</th>
                <th style="border: 1px solid #1e293b; padding: 8px 10px; text-align: center; width: 120px;">KUOTA BPJS</th>
                ${hasAnyCatatan ? '<th style="border: 1px solid #1e293b; padding: 8px 10px; text-align: left;">CATATAN</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- KETENTUAN RAWAT JALAN -->
        <div style="border: 1px solid #94a3b8; border-radius: 6px; padding: 10px 12px; background: #ffffff; font-size: 11px; color: #334155; margin-bottom: 20px;">
          <div style="font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 4px; text-decoration: underline;">
            Ketentuan Pelayanan Pendaftaran Rawat Jalan:
          </div>
          <ul style="margin: 0; padding-left: 18px; line-height: 1.5;">
            <li>Pendaftaran antrean online dapat diakses melalui Aplikasi Mobile JKN BPJS Kesehatan atau SIMRS RSUMB.</li>
            <li>Pasien diharapkan melakukan finger print dan check-in admisi paling lambat 60 menit sebelum jam pelayanan selesai.</li>
            <li>Perubahan jadwal mendadak dikarenakan operasi darurat (emergency) atau rapat medis akan diinformasikan oleh bagian Admisi.</li>
          </ul>
        </div>

        <!-- TANDA TANGAN & PENGESAHAN -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; font-size: 11.5px;">
          <div style="text-align: center; width: 200px;">
            <div style="font-weight: 600; color: #475569;">Petugas SIMRS / Admisi</div>
            <div style="height: 60px;"></div>
            <div style="border-top: 1.5px solid #0f172a; padding-top: 4px; font-weight: 800; text-transform: uppercase; color: #0f172a;">
              ( ........................................ )
            </div>
          </div>
          <div style="text-align: center; font-size: 10px; color: #64748b;">
            <div>Dicetak pada:</div>
            <div style="font-weight: 700; color: #0f172a; font-family: monospace;">${dateStr}, ${timeStr}</div>
            <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">RSU Muhammadiyah Babat - Lamongan</div>
          </div>
          <div style="text-align: center; width: 200px;">
            <div style="font-weight: 600; color: #475569;">Dokter Spesialis DPJP</div>
            <div style="height: 60px;"></div>
            <div style="border-top: 1.5px solid #0f172a; padding-top: 4px; font-weight: 900; text-transform: uppercase; color: #0f172a;">
              ${doctor.dpjp}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Generate HTML for Thermal Receipt (80mm/88mm & 58mm POS)
  // Optimization: Clean text header (no round logo), 72-76mm paper width (or 52mm for 58mm),
  // high contrast pure black bold monospace font (11px-12px) for crisp thermal printing
  const buildThermalPrintHtml = (dateStr: string, timeStr: string, width: '80mm' | '58mm') => {
    if (!doctor) return '';
    const is58 = width === '58mm';
    // Max width 74mm for 80mm/88mm rolls (fits cleanly in 72mm-76mm printable zone)
    // Max width 52mm for 58mm rolls (fits cleanly in 48mm-52mm printable zone)
    const paperWidth = is58 ? '52mm' : '74mm';
    const mainFontSize = is58 ? '11px' : '12px';
    const subFontSize = is58 ? '10px' : '11px';
    const headerFontSize = is58 ? '13px' : '14px';
    const titleFontSize = is58 ? '12px' : '13px';
    const leaveSummary = docLeaves.length > 0 ? formatLeaveBadgeSummary(docLeaves[0]).text : null;

    const rows = matchingSchedules
      .map(
        (sch) => `
        <tr style="border-bottom: 1px dashed #000000;">
          <td style="padding: 4px 1px; font-weight: 800; font-size: ${mainFontSize}; text-align: left; vertical-align: top; color: #000000;">
            ${sch.hari.toUpperCase()}
          </td>
          <td style="padding: 4px 2px; font-weight: 700; font-size: ${mainFontSize}; text-align: left; vertical-align: top; color: #000000;">
            ${formatDoctorScheduleTime(sch)}
          </td>
          <td style="padding: 4px 1px; font-weight: 800; font-size: ${mainFontSize}; text-align: right; vertical-align: top; color: #000000;">
            ${getCleanDoctorQuota(sch)}
          </td>
        </tr>
        ${
          sch.catatan
            ? `
        <tr>
          <td colspan="3" style="padding: 1px 1px 3px 1px; font-size: ${subFontSize}; font-weight: 700; color: #000000; font-style: italic;">
            * Ket: ${sch.catatan}
          </td>
        </tr>`
            : ''
        }
      `
      )
      .join('');

    return `
      <div style="width: ${paperWidth}; max-width: ${paperWidth}; box-sizing: border-box; margin: 0 auto; padding: 2mm 1mm; background: #ffffff; color: #000000; font-family: 'Courier New', Courier, monospace, Arial, sans-serif; font-size: ${mainFontSize}; font-weight: bold; line-height: 1.35; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        
        <!-- HEADER TEXT INSTANSI BERSIH (TANPA LOGO GAMBAR UNTUK AREA ATAS LEBIH BERSIH & RATA TENGAH) -->
        <div style="text-align: center; margin-bottom: 5px;">
          <div style="font-weight: 900; font-size: ${headerFontSize}; text-transform: uppercase; letter-spacing: 0.5px; color: #000000;">
            RSU MUHAMMADIYAH BABAT
          </div>
          <div style="font-size: ${subFontSize}; font-weight: 700; color: #000000; margin-top: 1px;">
            Jl. Raya Babat No. 184, Lamongan
          </div>
          <div style="font-size: ${subFontSize}; font-weight: 700; color: #000000;">
            Telp. (0322) 451111 / 451234
          </div>
          <div style="border-bottom: 2px solid #000000; margin: 6px 0 5px 0;"></div>
          <div style="font-weight: 900; font-size: ${titleFontSize}; text-transform: uppercase; color: #000000;">
            JADWAL PRAKTIK DPJP
          </div>
          <div style="border-bottom: 1.5px dashed #000000; margin: 5px 0;"></div>
        </div>

        <!-- IDENTITAS DOKTER DPJP -->
        <div style="margin-bottom: 6px; font-size: ${mainFontSize}; color: #000000;">
          <table style="width: 100%; border-collapse: collapse; color: #000000;">
            <tr>
              <td style="width: ${is58 ? '48px' : '58px'}; font-weight: 800; vertical-align: top; padding: 1.5px 0;">Dokter</td>
              <td style="width: 6px; font-weight: 800; vertical-align: top; padding: 1.5px 0;">:</td>
              <td style="font-weight: 900; vertical-align: top; padding: 1.5px 0; color: #000000;">${doctor.dpjp}</td>
            </tr>
            <tr>
              <td style="font-weight: 800; vertical-align: top; padding: 1.5px 0;">Poli</td>
              <td style="font-weight: 800; vertical-align: top; padding: 1.5px 0;">:</td>
              <td style="font-weight: 800; vertical-align: top; padding: 1.5px 0;">${poliName}</td>
            </tr>
            <tr>
              <td style="font-weight: 800; vertical-align: top; padding: 1.5px 0;">Ruang</td>
              <td style="font-weight: 800; vertical-align: top; padding: 1.5px 0;">:</td>
              <td style="font-weight: 700; vertical-align: top; padding: 1.5px 0;">${roomLocation}</td>
            </tr>
            ${
              leaveSummary
                ? `
            <tr>
              <td style="font-weight: 800; vertical-align: top; padding: 1.5px 0;">Status</td>
              <td style="font-weight: 800; vertical-align: top; padding: 1.5px 0;">:</td>
              <td style="font-weight: 800; vertical-align: top; padding: 1.5px 0; color: #000000;">⚠️ ${leaveSummary}</td>
            </tr>`
                : ''
            }
          </table>
        </div>

        <!-- TABEL JADWAL PRAKTIK HIGH CONTRAST -->
        <div style="border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000; margin-bottom: 6px; padding: 2px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: ${mainFontSize}; color: #000000;">
            <thead>
              <tr style="border-bottom: 1px solid #000000;">
                <th style="text-align: left; padding: 3px 1px; font-weight: 900;">HARI</th>
                <th style="text-align: left; padding: 3px 2px; font-weight: 900;">JAM RS</th>
                <th style="text-align: right; padding: 3px 1px; font-weight: 900;">KUOTA</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <!-- KETENTUAN SINGKAT -->
        <div style="font-size: ${subFontSize}; font-weight: 700; line-height: 1.35; margin-top: 5px; color: #000000;">
          <div>* Harap check-in / finger print maks 60 mnt sblm praktik selesai.</div>
          <div>* Kuota BPJS terhubung Mobile JKN.</div>
        </div>

        <!-- WAKTU DICETAK & CATATAN -->
        <div style="text-align: center; margin-top: 8px; border-top: 1.5px dashed #000000; padding-top: 6px; font-size: ${subFontSize}; color: #000000;">
          <div style="font-weight: 700;">Dicetak: ${dateStr}, ${timeStr}</div>
          <div style="font-weight: 900; margin-top: 4px; font-size: ${subFontSize}; letter-spacing: 0.2px;">
            *** SIMPAN STRUK PENGINGAT INI ***
          </div>
        </div>
      </div>
    `;
  };

  // Handle printing via dedicated Browser Tab / Window Popup (Thermal 80mm/88mm, Thermal 58mm, or A4)
  const handlePrint = (format: 'thermal_80' | 'thermal_58' | 'a4' = printFormat) => {
    if (!doctor) return;
    const { dateStr, timeStr } = getIndonesianCurrentDate();

    if (format === 'a4') {
      const bodyHtml = buildA4PrintHtml(dateStr, timeStr);
      const styles = `
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-document-body {
          width: 100%;
          display: flex;
          justify-content: center;
          background: #f1f5f9;
          padding: 16px 0;
        }
        @media print {
          .print-document-body {
            background: #ffffff !important;
            padding: 0 !important;
          }
        }
      `;
      printViaWindowPopup({
        title: `Jadwal Praktik DPJP - ${doctor.dpjp} - RSU Muhammadiyah Babat`,
        bodyHtml,
        styles,
        autoPrint: true,
        paperWidth: 'A4'
      });
    } else {
      const is58 = format === 'thermal_58';
      const width = is58 ? '58mm' : '80mm';
      const bodyHtml = buildThermalPrintHtml(dateStr, timeStr, width);
      const styles = `
        @page {
          size: ${is58 ? '58mm auto' : '80mm auto'};
          margin: 2mm;
        }
        * {
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          font-family: 'Courier New', Courier, monospace, Arial, sans-serif !important;
          font-weight: bold !important;
        }
        .print-document-body {
          width: 100%;
          display: flex;
          justify-content: center;
          background: #ffffff !important;
          padding: 0 !important;
        }
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-document-body {
            background: #ffffff !important;
            padding: 0 !important;
          }
        }
      `;
      printViaWindowPopup({
        title: `Struk Jadwal Dokter (${width}) - ${doctor.dpjp}`,
        bodyHtml,
        styles,
        autoPrint: true,
        paperWidth: width
      });
    }
  };

  // Handle automatic generation and download of Jadwal_[Nama_Dokter].pdf
  const handleDownloadPdf = async () => {
    if (!doctor || !pdfContainerRef.current) return;
    setIsGeneratingPdf(true);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      // Small stabilization pause for font and image rendering
      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = pdfContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution output
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      } as any);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 8;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        contentWidth,
        Math.min(contentHeight, pdfHeight - margin * 2),
        undefined,
        'FAST'
      );

      // Clean doctor name for filename: Jadwal_[Nama_Dokter].pdf
      const cleanDocName = doctor.dpjp
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '')
        .replace(/\s+/g, '_');
      const filename = `Jadwal_${cleanDocName || 'Dokter'}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error('Gagal mengunduh PDF jadwal dokter:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Copy full schedule summary for WhatsApp / clipboard sharing
  const handleCopySchedule = () => {
    if (!doctor) return;
    let text = `🏥 *RSU MUHAMMADIYAH BABAT*\n`;
    text += `*JADWAL PRAKTIK DOKTER SPESIALIS*\n`;
    text += `----------------------------------------\n`;
    text += `👨‍⚕️ *Dokter:* ${doctor.dpjp}\n`;
    text += `🩺 *Spesialis:* ${poliName}\n`;
    text += `📍 *Ruangan:* ${roomLocation}\n`;
    text += `----------------------------------------\n`;
    text += `📅 *Rincian Hari & Jam Praktik:*\n`;

    matchingSchedules.forEach((s, idx) => {
      text += `${idx + 1}. *${s.hari}*: ${formatDoctorScheduleTime(s)} - Kuota: ${getCleanDoctorQuota(s)}\n`;
    });

    if (docLeaves.length > 0) {
      const firstLeave = docLeaves[0];
      const summary = formatLeaveBadgeSummary(firstLeave);
      text += `\n⚠️ *Catatan:* ${summary.text}\n`;
    }

    text += `\nInformasi & Pendaftaran: RSU Muhammadiyah Babat\nTelp. (0322) 451111 / 451234`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen || !doctor) return null;

  const { dateStr, timeStr } = getIndonesianCurrentDate();

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE SCREEN MODAL (Visible on Screen, Hidden during window.print)*/}
      {/* ========================================================================= */}
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-hidden no-print animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-doctor-title"
      >
        <div className="relative z-[100000] bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] my-auto flex flex-col overflow-hidden transition-all animate-in zoom-in-95 duration-150">
          {/* MODAL HEADER */}
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-b border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                    RSU MUHAMMADIYAH BABAT
                  </span>
                  <span className="text-slate-500 text-xs">&bull;</span>
                  <span className="text-[11px] font-medium text-slate-300">
                    Jadwal Praktik DPJP
                  </span>
                </div>
                <h3
                  id="preview-doctor-title"
                  className="font-bold text-base sm:text-lg text-white truncate mt-0.5"
                >
                  {doctor.dpjp}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Unduh PDF Button in Header */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Unduh Jadwal Dokter (PDF)"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingPdf ? 'Memproses...' : 'Unduh PDF'}</span>
              </button>

              {/* Quick Print Button in Header */}
              <button
                type="button"
                onClick={() => handlePrint(printFormat)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Cetak Jadwal Dokter (Tab Pratinjau / Thermal)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Tutup Preview"
                aria-label="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 max-h-[calc(85vh-130px)]">
            {/* DOCTOR INFO SUMMARY CARD */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Poli Info */}
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-100/80 text-teal-800 shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Spesialis / Poliklinik
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                      {poliName}
                    </span>
                  </div>
                </div>

                {/* Room Location */}
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-100/80 text-blue-800 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Lokasi Ruangan
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                      {roomLocation}
                    </span>
                  </div>
                </div>

                {/* Practice Days Count */}
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100/80 text-emerald-800 shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Total Hari Praktik
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-800 block mt-0.5">
                      {matchingSchedules.length} Hari Terjadwal
                    </span>
                  </div>
                </div>
              </div>

              {/* Leave Announcement Banner if exists */}
              {docLeaves.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>Catatan Libur/Cuti:</span>
                  </span>
                  <span className="text-slate-700 font-medium truncate">
                    {formatLeaveBadgeSummary(docLeaves[0]).text}
                  </span>
                </div>
              )}
            </div>

            {/* PRINT FORMAT SELECTOR (A4 vs THERMAL) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-slate-800">Format Output Cetak:</span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Pilih output untuk tab cetak browser / printer kasir
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPrintFormat('thermal_80')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    printFormat === 'thermal_80'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Cetak format struk printer thermal POS 80mm / 88mm (Default)"
                >
                  🧾 Struk Thermal (80mm/88mm)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('thermal_58')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    printFormat === 'thermal_58'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Cetak format struk printer thermal mini 58mm"
                >
                  🧾 Thermal Mini (58mm)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    printFormat === 'a4'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Cetak format dokumen resmi A4"
                >
                  📄 Lembar A4
                </button>
              </div>
            </div>

            {/* SCHEDULE TABLE: [ NO | HARI PRAKTEK | JAM PRAKTIK | KUOTA BPJS ] */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Daftar Hari & Jam Pelayanan</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  {matchingSchedules.length} Hari Aktif
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-3.5 py-3 text-center w-12">No</th>
                      <th className="px-4 py-3">Hari Praktek</th>
                      <th className="px-4 py-3">Jam Praktik</th>
                      <th className="px-4 py-3 text-center">Kuota BPJS</th>
                      {matchingSchedules.some((s) => Boolean(s.catatan)) && (
                        <th className="px-4 py-3 text-left">Catatan</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {matchingSchedules.map((sch, idx) => {
                      const hasAnyCatatan = matchingSchedules.some((s) => Boolean(s.catatan));
                      return (
                        <tr
                          key={sch.id || idx}
                          className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-50'}
                        >
                          <td className="px-3.5 py-3 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              {sch.hari}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200/80">
                              <Clock className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                              <span className="font-semibold text-blue-800" style={{ color: '#1e40af' }}>
                                {formatDoctorScheduleTime(sch)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span
                              className="inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-900 border border-gray-300"
                              style={{ color: '#000000', fontWeight: 'bold' }}
                            >
                              {getCleanDoctorQuota(sch)}
                            </span>
                          </td>
                          {hasAnyCatatan && (
                            <td className="px-4 py-3 text-left whitespace-nowrap">
                              {sch.catatan ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  {sch.catatan}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QUICK NOTES / INFO */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Ketentuan Pelayanan Poliklinik: </span>
                <span>
                  Pasien disarankan melakukan pendaftaran atau check-in antrean paling lambat 60 menit sebelum jam selesai praktik.
                  Kuota BPJS terintegrasi secara langsung dengan Mobile JKN & Bridging HFIS BPJS Kesehatan.
                </span>
              </div>
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopySchedule}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Salin Rangkuman Jadwal Dokter ke Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Jadwal Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Ringkasan</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              {/* UNDUH PDF BUTTON */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                title={`Unduh Jadwal ${doctor.dpjp} dalam format PDF`}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rose-200" />
                    <span>Menyiapkan PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-rose-200" />
                    <span>Unduh PDF</span>
                  </>
                )}
              </button>

              {/* PROMINENT CETAK SCHEDULE DOKTER BUTTON */}
              <button
                type="button"
                onClick={() => handlePrint(printFormat)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                title={`Cetak Jadwal Dokter (${printFormat === 'a4' ? 'Dokumen A4 Kop RSUMB' : printFormat === 'thermal_80' ? 'Struk Thermal 80mm' : 'Struk Thermal 58mm'}) via Tab Cetak Browser`}
              >
                <Printer className="w-4 h-4 text-emerald-100" />
                <span>Cetak Schedule Dokter</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRINT-ONLY & PDF CAPTURE CONTAINER: Clean Official Document            */}
      {/*    Controlled via .print-doctor-schedule-container in index.css           */}
      {/* ========================================================================= */}
      <div
        ref={pdfContainerRef}
        className="print-doctor-schedule-container text-black bg-white font-sans"
      >
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          {/* OFFICIAL HOSPITAL LETTERHEAD (KOP SURAT BERSIH TANPA LOGO GAMBAR) */}
          <div className="border-b-2 border-black pb-3 text-center">
            <h2 className="text-sm font-black text-black uppercase tracking-widest leading-none">
              RSU MUHAMMADIYAH BABAT
            </h2>
            <h1 className="text-base font-black uppercase tracking-tight mt-1 text-black">
              JADWAL PRAKTIK DOKTER SPESIALIS RAWAT JALAN
            </h1>
            <p className="text-[9.5pt] text-gray-800 font-semibold mt-0.5 leading-snug">
              Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur &bull; Telp. (0322) 451111 / 451234
            </p>
          </div>

          {/* DOUBLE DIVIDER LINE */}
          <div className="h-[1px] bg-black -mt-3 mb-3" />

          {/* DOCTOR PROFILE CARD */}
          <div className="border border-black p-3 rounded-lg bg-gray-50 text-[9pt]">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-36 py-1 font-bold text-gray-700">Nama Dokter / DPJP</td>
                  <td className="w-4 text-center font-bold">:</td>
                  <td className="py-1 font-black text-[11pt] text-black">{doctor.dpjp}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-gray-700">Poliklinik / Spesialis</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1 font-bold">{poliName}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-gray-700">Lokasi Ruangan</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1">{roomLocation}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold text-gray-700">Jumlah Hari Praktik</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1 font-semibold">{matchingSchedules.length} Hari Praktik Terjadwal</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* OFFICIAL PRACTICE SCHEDULE TABLE */}
          <div>
            <h3 className="text-[10pt] font-black uppercase tracking-wider mb-2 border-l-4 border-black pl-2">
              RINCIAN HARI & JAM PRAKTIK POLIKLINIK
            </h3>

            <table className="w-full border-collapse border border-black text-[9pt]">
              <thead>
                <tr className="bg-gray-200 text-black font-bold uppercase text-[8.5pt]">
                  <th className="border border-black px-2 py-2 text-center w-12">NO</th>
                  <th className="border border-black px-3 py-2 text-left">HARI PRAKTEK</th>
                  <th className="border border-black px-3 py-2 text-left">JAM PRAKTIK RS</th>
                  <th className="border border-black px-3 py-2 text-center w-28">KUOTA BPJS</th>
                  {matchingSchedules.some((s) => Boolean(s.catatan)) && (
                    <th className="border border-black px-3 py-2 text-left">CATATAN</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {matchingSchedules.map((sch, idx) => {
                  const hasAnyCatatan = matchingSchedules.some((s) => Boolean(s.catatan));
                  return (
                    <tr key={`print-${sch.id || idx}`}>
                      <td className="border border-black px-2 py-2 text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-black px-3 py-2 font-black text-[9.5pt]">
                        {sch.hari}
                      </td>
                      <td
                        className="border border-black px-3 py-2 font-bold text-blue-800 print-jam-praktik"
                        style={{ color: '#1e40af' }}
                      >
                        {formatDoctorScheduleTime(sch)}
                      </td>
                      <td
                        className="border border-black px-3 py-2 text-center font-bold text-black print-kuota-bpjs"
                        style={{ color: '#000000', fontWeight: 'bold' }}
                      >
                        {getCleanDoctorQuota(sch)}
                      </td>
                      {hasAnyCatatan && (
                        <td className="border border-black px-3 py-2 text-left font-bold text-amber-900">
                          {sch.catatan || '-'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* IMPORTANT NOTES FOR PATIENTS / STAFF */}
          <div className="border border-gray-400 p-2.5 rounded bg-white text-[8pt] text-gray-800 space-y-1">
            <p className="font-bold uppercase text-black underline">
              Ketentuan Pelayanan Pendaftaran Rawat Jalan:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-700">
              <li>Pendaftaran antrean online dapat diakses melalui Aplikasi Mobile JKN BPJS Kesehatan atau SIMRS RSUMB.</li>
              <li>Pasien diharapkan melakukan finger print dan check-in admisi paling lambat 60 menit sebelum jam pelayanan selesai.</li>
              <li>Perubahan jadwal mendadak dikarenakan operasi darurat (emergency) atau rapat medis akan diinformasikan oleh bagian Admisi.</li>
            </ul>
          </div>

          {/* SIGNATURE & VERIFICATION BLOCK */}
          <div className="pt-4 text-[8.5pt]">
            <div className="flex justify-between items-end">
              <div className="text-center w-48">
                <p className="font-semibold text-gray-700">Petugas SIMRS / Admisi</p>
                <div className="h-16"></div>
                <p className="border-t border-black pt-1 font-bold uppercase">( ........................................ )</p>
              </div>

              <div className="text-center text-[7.5pt] text-gray-500">
                <p>Dicetak pada:</p>
                <p className="font-mono font-semibold text-black">{dateStr}, {timeStr}</p>
                <p className="text-[7pt] text-gray-400 mt-0.5">RSU Muhammadiyah Babat - Lamongan</p>
              </div>

              <div className="text-center w-48">
                <p className="font-semibold text-gray-700">Dokter Spesialis DPJP</p>
                <div className="h-16"></div>
                <p className="border-t border-black pt-1 font-bold text-black uppercase">
                  {doctor.dpjp}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
