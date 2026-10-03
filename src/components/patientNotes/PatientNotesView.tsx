import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Car,
  ShieldAlert,
  CreditCard,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Eye,
  ExternalLink,
  ChevronRight,
  Printer,
  Sparkles,
  Check,
  X,
  RefreshCw,
  HelpCircle,
  FileDown,
  Download,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { downloadBlob } from '../../utils/exportHelpers';
import { requestAdminAction } from '../../services/adminAuthService';
import {
  PatientNotesTab,
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord,
  PatientShiftHandoverRecord,
  PenjaminKll
} from '../../types/patientNotesTypes';
import {
  loadKllRecords,
  saveKllRecords,
  loadBpjsKendalaRecords,
  saveBpjsKendalaRecords,
  loadAsuransiSwastaRecords,
  saveAsuransiSwastaRecords,
  loadUmumBeresikoRecords,
  saveUmumBeresikoRecords,
  loadShiftHandoverRecords,
  saveShiftHandoverRecords
} from '../../data/patientNotesData';
import { KllFormModal } from './KllFormModal';
import { BpjsKendalaModal } from './BpjsKendalaModal';
import { AsuransiSwastaModal } from './AsuransiSwastaModal';
import { UmumBeresikoModal } from './UmumBeresikoModal';
import { LpFileViewerModal } from './LpFileViewerModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { PatientNotesPrintModal } from './PatientNotesPrintModal';
import { HandoverCardModal, HandoverCardData } from './HandoverCardModal';
import { ShiftHandoverDashboard } from './ShiftHandoverDashboard';
import { logSystemActivity } from '../../data/auditLogData';
import { loadActiveStaff } from '../../data/headerData';
import { loadPortalSettings } from '../../data/settingsData';

export const STICKER_TEMPLATE_OPTIONS = [
  'SEP MENYUSUL MENUNGGU LP (PENGURUSAN 2X24)',
  'PENGURUSAN JR / LP (LAPORAN POLISI) - KLL BERSEDIA MELAPOR',
  'KLL - BPJS KETENAGAKERJAAN',
  'KLL - MENOLAK LAPOR',
  'SEP MENYUSUL - BPJS DENDA (PENGURUSAN 3X24)',
  'SEP MENYUSUL - NON AKTIF (PENGURUSAN 3X24)',
  'DATA IDENTITAS TIDAK LENGKAP',
  'DATA BERBEDA ( PROSES LAPOR PIPP)',
  'BAYI UMUR 3 BULAN LEBIH - UPDATE NAMA (PIPP)',
  'SEP MENYUSUL - BPJS MAINTENENCE',
  'ASURANSI BRI LIFE',
  'ASURANSI ADMEDIKA',
  'KUSTOM / INPUT MANUAL (Catatan Bebas)'
] as const;

interface PatientNotesViewProps {
  showToast: (msg: string) => void;
}

export const PatientNotesView: React.FC<PatientNotesViewProps> = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<PatientNotesTab>('kll');
  const [searchTerm, setSearchTerm] = useState('');

  // Sub-filter states
  const [kllPenjaminFilter, setKllPenjaminFilter] = useState<string>('all');
  const [kllInsidenFilter, setKllInsidenFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [kllStatusFilter, setKllStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [bpjsStatusFilter, setBpjsStatusFilter] = useState<'all' | 'Pending' | 'Resolved'>('all');
  const [asuransiFilter, setAsuransiFilter] = useState<string>('all');
  const [asuransiStatusFilter, setAsuransiStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [umumPotensiFilter, setUmumPotensiFilter] = useState<string>('all');
  const [umumStatusFilter, setUmumStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Master Data Collections
  const [kllRecords, setKllRecords] = useState<PatientKllRecord[]>(() => loadKllRecords());
  const [bpjsRecords, setBpjsRecords] = useState<PatientBpjsKendalaRecord[]>(() => loadBpjsKendalaRecords());
  const [asuransiRecords, setAsuransiRecords] = useState<PatientAsuransiSwastaRecord[]>(() => loadAsuransiSwastaRecords());
  const [umumRecords, setUmumRecords] = useState<PatientUmumBeresikoRecord[]>(() => loadUmumBeresikoRecords());
  const [handoverRecords, setHandoverRecords] = useState<PatientShiftHandoverRecord[]>(() => loadShiftHandoverRecords());

  // Modals state
  const [isKllModalOpen, setIsKllModalOpen] = useState(false);
  const [selectedKllForEdit, setSelectedKllForEdit] = useState<PatientKllRecord | null>(null);

  const [isBpjsModalOpen, setIsBpjsModalOpen] = useState(false);
  const [selectedBpjsForEdit, setSelectedBpjsForEdit] = useState<PatientBpjsKendalaRecord | null>(null);

  const [isAsuransiModalOpen, setIsAsuransiModalOpen] = useState(false);
  const [selectedAsuransiForEdit, setSelectedAsuransiForEdit] = useState<PatientAsuransiSwastaRecord | null>(null);

  const [isUmumModalOpen, setIsUmumModalOpen] = useState(false);
  const [selectedUmumForEdit, setSelectedUmumForEdit] = useState<PatientUmumBeresikoRecord | null>(null);

  const [selectedKllForLpViewer, setSelectedKllForLpViewer] = useState<PatientKllRecord | null>(null);
  const [handoverCardTarget, setHandoverCardTarget] = useState<HandoverCardData | null>(null);

  // Print & Delete Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    nama: string;
    noRm?: string;
    tab: PatientNotesTab;
    categoryLabel: string;
  } | null>(null);

  // Sticker Note printing states (15cm Landscape)
  const [stickerPaperSize, setStickerPaperSize] = useState<'58mm' | '80mm' | '100mm' | '150mm'>('150mm');
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [stickerPatient, setStickerPatient] = useState<{
    namaPasien: string;
    noRm: string;
    tanggalMrs: string;
    kamarKelas: string;
    source: 'KLL' | 'BPJS';
  } | null>(null);
  const [stickerTemplate, setStickerTemplate] = useState<string>(
    'SEP MENYUSUL MENUNGGU LP (PENGURUSAN 2X24)'
  );
  const [customStickerText, setCustomStickerText] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const getCleanKelas = (patient: { kamarKelas?: string } | null): string => {
    if (!patient) return '';
    const cleanKamar = (patient.kamarKelas || '').trim();
    if (!cleanKamar) return '';

    let val = cleanKamar
      .replace(/rawat\s*inap/gi, '')
      .replace(/ranap/gi, '')
      .replace(/^kelas\s*[:=]\s*/i, '')
      .replace(/^kelas\s+/i, '')
      .replace(/^[-–—:\s/|]+|[-–—:\s/|]+$/g, '')
      .trim();

    if (!val || val.toLowerCase() === 'rawat inap' || val.toLowerCase() === 'ranap' || val === '-') {
      return '';
    }

    return val.toUpperCase();
  };

  const getStickerSubtext = (patient: { kamarKelas?: string } | null): string => {
    const val = getCleanKelas(patient);
    if (!val) return '';
    return `KELAS: ${val}`;
  };

  const getStickerMainText = (template: string, customText: string): string => {
    if (template === 'KUSTOM / INPUT MANUAL (Catatan Bebas)') {
      return customText.trim() || 'CATATAN ADMISI KHUSUS';
    }
    return template;
  };

  const handleOpenStickerModal = (patientData: {
    namaPasien: string;
    noRm: string;
    tanggalMrs: string;
    kamarKelas: string;
    source: 'KLL' | 'BPJS';
  }) => {
    let cleanKelas = (patientData.kamarKelas || '')
      .replace(/rawat\s*inap/gi, '')
      .replace(/ranap/gi, '')
      .replace(/^kelas\s*:\s*/i, '')
      .replace(/^kelas\s+/i, '')
      .replace(/^[-–—:\s/|]+|[-–—:\s/|]+$/g, '')
      .trim();
    if (cleanKelas.toLowerCase() === 'rawat inap' || cleanKelas.toLowerCase() === 'ranap' || cleanKelas === '-') {
      cleanKelas = '';
    }
    setStickerPatient({
      ...patientData,
      kamarKelas: cleanKelas
    });
    if (patientData.source === 'KLL') {
      setStickerTemplate('PENGURUSAN JR / LP (LAPORAN POLISI) - KLL BERSEDIA MELAPOR');
    } else {
      setStickerTemplate('SEP MENYUSUL - BPJS DENDA (PENGURUSAN 3X24)');
    }
    setCustomStickerText('');
    setStickerPaperSize('150mm');
    setStickerModalOpen(true);
  };

  const handlePrintSticker = () => {
    if (!stickerPatient) return;

    const mainText = getStickerMainText(stickerTemplate, customStickerText);
    const kelasVal = getCleanKelas(stickerPatient);

    // Helper to generate self-contained HTML for reliable 15cm landscape printing
    const generatePrintableHtml = () => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Stiker Buku Ranap - ${stickerPatient.namaPasien || 'Pasien'}</title>
  <style>
    @media print {
      @page {
        size: 150mm 80mm landscape !important; /* Force 15cm width x 8cm height landscape */
        margin: 0mm !important;
      }
      
      html, body {
        width: 150mm !important;
        height: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .print-container {
        width: 150mm !important;
        box-sizing: border-box !important;
        padding: 5mm 8mm !important;
        margin: 0 auto !important;
        text-align: center !important;
      }
    }

    @page {
      size: 150mm 80mm landscape !important;
      margin: 0mm !important;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 150mm !important;
      height: 80mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body, .print-container {
      width: 150mm !important;
      max-width: 150mm !important;
      box-sizing: border-box !important;
      padding: 5mm 8mm !important;
      margin: 0 auto !important;
      text-align: center !important;
      font-family: 'Courier New', monospace, sans-serif !important;
    }
    .header {
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .subheader {
      font-size: 14pt;
      font-weight: 700;
      font-style: italic;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.2;
      margin-top: 1mm;
    }
    .divider {
      width: 100%;
      border-bottom: 2px dashed #000;
      margin: 3mm 0;
    }
    .box {
      border: 3px solid #000;
      padding: 10mm 6mm;
      margin: 4mm 0;
      border-radius: 4px;
      font-size: 22pt !important;
      font-weight: 900 !important;
      line-height: 1.3;
      text-transform: uppercase;
      word-break: break-word;
      overflow-wrap: break-word;
      text-align: center;
    }
    .kelas-footer {
      text-align: center;
      font-weight: 900;
      font-size: 18pt;
      margin-top: 6px;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="print-container">
    <div class="header">RSU MUHAMMADIYAH BABAT</div>
    <div class="subheader">INFORMASI BUKU RANAP</div>
    <div class="divider"></div>
    <div class="box">${mainText}</div>
    <div style="text-align: center; font-weight: 900; font-size: 18pt; margin-top: 6px; letter-spacing: 1px;">
      KELAS = ${kelasVal ? kelasVal : '.....'}
    </div>
  </div>
</body>
</html>`;

    // Attempt direct window.print()
    let directPrintTriggered = false;
    try {
      window.print();
      directPrintTriggered = true;
    } catch (e) {
      console.warn('Direct window.print() error, triggering iframe fallback:', e);
      directPrintTriggered = false;
    }

    // Fallback: Use hidden iframe print if direct window.print failed
    if (!directPrintTriggered) {
      try {
        const oldIframe = document.getElementById('thermal-print-fallback-frame');
        if (oldIframe) oldIframe.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'thermal-print-fallback-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(generatePrintableHtml());
          doc.close();

          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (err) {
              console.error('Fallback iframe print failed:', err);
              window.print();
            } finally {
              setTimeout(() => {
                iframe.remove();
              }, 2000);
            }
          }, 200);
        }
      } catch (err) {
        console.error('Print iframe creation error:', err);
        window.print();
      }
    }
  };

  const handleTabCetak = () => {
    if (!stickerPatient) return;

    const mainText = getStickerMainText(stickerTemplate, customStickerText);
    const kelasVal = getCleanKelas(stickerPatient);

    const printWindow = window.open('', '_blank', 'width=850,height=500');
    if (!printWindow) {
      showToast('Gagal membuka tab baru. Mohon izinkan pop-up peramban.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cetak Note Ranap - 15cm Landscape</title>
          <style>
            @media print {
              @page {
                size: 150mm 80mm landscape !important; /* Force 15cm width x 8cm height landscape */
                margin: 0mm !important;
              }
              
              html, body {
                width: 150mm !important;
                height: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .print-container {
                width: 150mm !important;
                box-sizing: border-box !important;
                padding: 5mm 8mm !important;
                margin: 0 auto !important;
                text-align: center !important;
              }
            }

            @page {
              size: 150mm 80mm landscape !important;
              margin: 0mm !important;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 150mm !important;
              height: 80mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #fff !important;
              color: #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body, .print-container {
              width: 150mm !important;
              max-width: 150mm !important;
              box-sizing: border-box !important;
              padding: 5mm 8mm !important;
              margin: 0 auto !important;
              text-align: center !important;
              font-family: 'Courier New', monospace, sans-serif !important;
            }
            .header {
              font-size: 18pt;
              font-weight: 800;
              letter-spacing: 1px;
              text-transform: uppercase;
              line-height: 1.2;
            }
            .subheader {
              font-size: 14pt;
              font-weight: 700;
              font-style: italic;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1.2;
              margin-top: 1mm;
            }
            .divider {
              width: 100%;
              border-bottom: 2px dashed #000;
              margin: 3mm 0;
            }
            .box {
              border: 3px solid #000;
              padding: 10mm 6mm;
              margin: 4mm 0;
              border-radius: 4px;
              font-size: 22pt !important;
              font-weight: 900 !important;
              line-height: 1.3;
              text-transform: uppercase;
              word-break: break-word;
              overflow-wrap: break-word;
              text-align: center;
            }
            .kelas-footer {
              text-align: center;
              font-weight: 900;
              font-size: 18pt;
              margin-top: 6px;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">RSU MUHAMMADIYAH BABAT</div>
            <div class="subheader">INFORMASI BUKU RANAP</div>
            <div class="divider"></div>
            <div class="box">${mainText}</div>
            <div style="text-align: center; font-weight: 900; font-size: 18pt; margin-top: 6px; letter-spacing: 1px;">
              KELAS = ${kelasVal ? kelasVal : '.....'}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadPdf = async () => {
    if (!stickerPatient) return;
    setIsGeneratingPdf(true);
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 80));

      const previewBox = document.getElementById('thermal-sticker-preview-box');
      if (!previewBox) {
        throw new Error('Elemen pratinjau stiker tidak ditemukan');
      }

      const canvas = await html2canvas(previewBox, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      } as any);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = 150; // mm
      const pdfHeight = 80; // mm

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      const pdfBlob = pdf.output('blob');
      const cleanName = (stickerPatient.namaPasien || 'Pasien').replace(/[^a-zA-Z0-9]/g, '_');
      downloadBlob(pdfBlob, `Stiker_Ranap_15cm_${cleanName}.pdf`);
      showToast('Stiker Landscape 15cm berhasil diunduh sebagai PDF');
    } catch (err) {
      console.error('Gagal generate PDF stiker thermal:', err);
      showToast('Gagal mengunduh berkas PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const belumCetakSepRecords = useMemo(() => {
    const kllPending = kllRecords
      .filter((r) => !r.isResolved)
      .map((r) => ({
        id: r.id,
        source: 'KLL' as const,
        namaPasien: r.namaPasien,
        noRm: r.noRm,
        tanggalMrs: r.tanggalMrs,
        keterangan: `Kecelakaan (${r.penjamin}) - LP ${r.statusLp}`,
        batasPengurusan: 'Menunggu Laporan Polisi / JR',
        kamarKelas: r.catatan?.match(/Kamar\s*:\s*([^\n|]+)/i)?.[1]?.trim() || '',
        originalRecord: r
      }));

    const bpjsPending = bpjsRecords
      .filter((r) => r.status === 'Pending')
      .map((r) => {
        let batas = '3 x 24 Jam';
        if (r.jenisKendala.toLowerCase().includes('denda')) {
          batas = 'Batas 3x24 Jam (Denda 45)';
        } else if (r.jenisKendala.toLowerCase().includes('non') || r.jenisKendala.toLowerCase().includes('aktif')) {
          batas = 'Batas 3x24 Jam (Reaktivasi)';
        }
        return {
          id: r.id,
          source: 'BPJS' as const,
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMrs: r.tanggalMrsKontrol || '',
          keterangan: `Kendala: ${r.jenisKendala}`,
          batasPengurusan: batas,
          kamarKelas: r.detailMasalah?.match(/Kamar\s*:\s*([^\n|]+)/i)?.[1]?.trim() || '',
          originalRecord: r
        };
      });

    return [...kllPending, ...bpjsPending];
  }, [kllRecords, bpjsRecords]);

  // Sync to localStorage
  useEffect(() => {
    saveKllRecords(kllRecords);
  }, [kllRecords]);

  useEffect(() => {
    saveBpjsKendalaRecords(bpjsRecords);
  }, [bpjsRecords]);

  useEffect(() => {
    saveAsuransiSwastaRecords(asuransiRecords);
  }, [asuransiRecords]);

  useEffect(() => {
    saveUmumBeresikoRecords(umumRecords);
  }, [umumRecords]);

  useEffect(() => {
    saveShiftHandoverRecords(handoverRecords);
  }, [handoverRecords]);

  // Statistics (Count only pending / is_resolved === false by default)
  const pendingKllCount = useMemo(() => {
    return kllRecords.filter((r) => !r.isResolved).length;
  }, [kllRecords]);

  const activeKllIncidentsCount = useMemo(() => {
    return kllRecords.filter((r) => r.isInsidenActive && !r.isResolved).length;
  }, [kllRecords]);

  const pendingBpjsCount = useMemo(() => {
    return bpjsRecords.filter((r) => r.status === 'Pending').length;
  }, [bpjsRecords]);

  const pendingAsuransiCount = useMemo(() => {
    return asuransiRecords.filter((r) => !r.isResolved).length;
  }, [asuransiRecords]);

  const pendingUmumCount = useMemo(() => {
    return umumRecords.filter((r) => !r.isResolved).length;
  }, [umumRecords]);

  const pendingHandoverCount = useMemo(() => {
    return handoverRecords.filter((r) => r.status === 'Pending').length;
  }, [handoverRecords]);

  // Tab 1: KLL Handlers
  const handleSaveKll = (record: PatientKllRecord) => {
    setKllRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });
    showToast(`Data Pasien KLL ${record.namaPasien} berhasil disimpan.`);
  };

  const handleToggleKllInsiden = (id: string) => {
    const target = kllRecords.find((r) => r.id === id);
    if (!target) return;
    const nextActive = !target.isInsidenActive;
    setKllRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isInsidenActive: nextActive, updatedAt: new Date().toISOString() } : r
      )
    );
    showToast(`Status insiden ${target.namaPasien} diubah menjadi ${nextActive ? 'AKTIF' : 'NON-AKTIF'}.`);
  };

  const handleToggleKllResolved = (id: string) => {
    const target = kllRecords.find((r) => r.id === id);
    if (!target) return;
    const nextResolved = !target.isResolved;
    setKllRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isResolved: nextResolved, updatedAt: new Date().toISOString() } : r
      )
    );
    showToast(
      nextResolved
        ? `Status follow-up KLL ${target.namaPasien} ditandai SELESAI / AMAN.`
        : `Status follow-up KLL ${target.namaPasien} ditandai BELUM SELESAI (Need Follow-up).`
    );
  };

  const handleDeleteKll = (id: string, name: string) => {
    setKllRecords((prev) => prev.filter((r) => r.id !== id));
    showToast(`Data KLL ${name} dihapus.`);
  };

  // Tab 2: BPJS Kendala Handlers
  const handleSaveBpjs = (record: PatientBpjsKendalaRecord) => {
    setBpjsRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });

    try {
      const staffName = loadActiveStaff().name;
      logSystemActivity(
        'Pencatatan Kendala BPJS',
        `Kendala BPJS Pasien ${record.namaPasien} (${record.noRm}) dicatat: ${record.jenisKendala} - Status: ${record.status}.`,
        staffName,
        'SEP_BPJS',
        'Catatan Pasien'
      );
    } catch (e) {
      console.warn('Notice logging BPJS kendala:', e);
    }

    showToast(`Kendala BPJS ${record.namaPasien} berhasil disimpan.`);
  };

  const handleToggleBpjsStatus = (id: string) => {
    const target = bpjsRecords.find((r) => r.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Pending' ? 'Resolved (cetak SEP)' : 'Pending';

    setBpjsRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: nextStatus,
              updatedAt: new Date().toISOString()
            }
          : r
      )
    );

    try {
      const staffName = loadActiveStaff().name;
      logSystemActivity(
        'Pembaruan Status SEP BPJS',
        `Status kendala SEP BPJS Pasien ${target.namaPasien} (${target.noRm}) diubah menjadi "${nextStatus}".`,
        staffName,
        'SEP_BPJS',
        'Catatan Pasien'
      );
    } catch (e) {
      console.warn('Notice logging BPJS status:', e);
    }

    showToast(`Status kendala BPJS ${target.namaPasien} diubah menjadi ${nextStatus}.`);
  };

  // Tab 3: Asuransi Swasta Handlers
  const handleSaveAsuransi = (record: PatientAsuransiSwastaRecord) => {
    setAsuransiRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });
    showToast(`Catatan asuransi ${record.namaPasien} berhasil disimpan.`);
  };

  const handleToggleAsuransiResolved = (id: string) => {
    const target = asuransiRecords.find((r) => r.id === id);
    if (!target) return;
    const nextResolved = !target.isResolved;

    setAsuransiRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isResolved: nextResolved, updatedAt: new Date().toISOString() } : r
      )
    );

    showToast(
      nextResolved
        ? `Status follow-up Asuransi ${target.namaPasien} ditandai SELESAI / AMAN.`
        : `Status follow-up Asuransi ${target.namaPasien} ditandai BELUM SELESAI (Need Follow-up).`
    );
  };

  // Tab 4: UMUM Beresiko Handlers
  const handleSaveUmum = (record: PatientUmumBeresikoRecord) => {
    setUmumRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });
    showToast(`Data UMUM Beresiko ${record.namaPasien} berhasil disimpan.`);
  };

  const handleToggleUmumResolved = (id: string) => {
    const target = umumRecords.find((r) => r.id === id);
    if (!target) return;
    const nextResolved = !target.isResolved;

    setUmumRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isResolved: nextResolved, updatedAt: new Date().toISOString() } : r
      )
    );

    showToast(
      nextResolved
        ? `Status follow-up Pasien UMUM ${target.namaPasien} ditandai SELESAI / AMAN.`
        : `Status follow-up Pasien UMUM ${target.namaPasien} ditandai BELUM SELESAI (Need Follow-up).`
    );
  };

  // Tab 5: Shift Handover Handlers
  const handleSaveHandover = (record: PatientShiftHandoverRecord) => {
    setHandoverRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });

    try {
      const staffName = record.petugasAsal || loadActiveStaff().name;
      logSystemActivity(
        'Penyimpanan Catatan Handover Shift',
        `Catatan operan ${record.shift} untuk Pasien ${record.namaPasien} (${record.noRm}) disimpan. Catatan: "${(record.masalah || '').slice(0, 90)}..."`,
        staffName,
        'HANDOVER_SHIFT',
        'Catatan Pasien'
      );
    } catch (e) {
      console.warn('Notice logging handover record:', e);
    }

    showToast(`Catatan Handover untuk pasien "${record.namaPasien}" berhasil disimpan.`);
  };

  const handleToggleHandoverStatus = (id: string) => {
    const target = handoverRecords.find((r) => r.id === id);
    if (!target) return;
    const newStatus = target.status === 'Pending' ? 'Handled' : 'Pending';

    setHandoverRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              handledAt: newStatus === 'Handled' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString()
            }
          : r
      )
    );

    try {
      const staffName = loadActiveStaff().name;
      logSystemActivity(
        'Penyelesaian Catatan Handover',
        `Catatan handover Pasien ${target.namaPasien} (${target.noRm}) ditandai sebagai "${newStatus}".`,
        staffName,
        'HANDOVER_SHIFT',
        'Catatan Pasien'
      );
    } catch (e) {
      console.warn('Notice logging handover status:', e);
    }

    showToast(
      newStatus === 'Handled'
        ? `Catatan pasien ${target.namaPasien} ditandai SELESAI.`
        : `Catatan pasien ${target.namaPasien} dibuka kembali (PENDING).`
    );
  };

  // Centralized Delete Confirmation Handler
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { id, nama, tab } = deleteTarget;

    if (tab === 'kll') {
      setKllRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data Pasien KLL "${nama}" berhasil dihapus.`);
    } else if (tab === 'bpjs_kendala') {
      setBpjsRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data Kendala BPJS "${nama}" berhasil dihapus.`);
    } else if (tab === 'asuransi_swasta') {
      setAsuransiRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data Asuransi Swasta "${nama}" berhasil dihapus.`);
    } else if (tab === 'umum_beresiko') {
      setUmumRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data Pasien UMUM Beresiko "${nama}" berhasil dihapus.`);
    } else if (tab === 'handover_shift') {
      setHandoverRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Catatan Handover "${nama}" berhasil dihapus.`);
    }
    setDeleteTarget(null);
  };

  // Filtered lists based on search (by No. RM or Nama Pasien)
  const filteredKllList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return kllRecords.filter((r) => {
      const matchSearch =
        !q ||
        (r.namaPasien && r.namaPasien.toLowerCase().includes(q)) ||
        (r.noRm && r.noRm.toLowerCase().includes(q)) ||
        (r.statusLp && r.statusLp.toLowerCase().includes(q));

      const matchPenjamin = kllPenjaminFilter === 'all' || r.penjamin === kllPenjaminFilter;
      const matchInsiden =
        kllInsidenFilter === 'all' ||
        (kllInsidenFilter === 'active' && r.isInsidenActive) ||
        (kllInsidenFilter === 'inactive' && !r.isInsidenActive);

      const matchStatus =
        kllStatusFilter === 'all' ||
        (kllStatusFilter === 'pending' && !r.isResolved) ||
        (kllStatusFilter === 'resolved' && Boolean(r.isResolved));

      return matchSearch && matchPenjamin && matchInsiden && matchStatus;
    });
  }, [kllRecords, searchTerm, kllPenjaminFilter, kllInsidenFilter, kllStatusFilter]);

  const filteredBpjsList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bpjsRecords.filter((r) => {
      const matchSearch =
        !q ||
        (r.namaPasien && r.namaPasien.toLowerCase().includes(q)) ||
        (r.noRm && r.noRm.toLowerCase().includes(q)) ||
        (r.noKartuBpjs && r.noKartuBpjs.toLowerCase().includes(q)) ||
        (r.jenisKendala && r.jenisKendala.toLowerCase().includes(q));

      const matchStatus =
        bpjsStatusFilter === 'all' ||
        (bpjsStatusFilter === 'Pending' && r.status === 'Pending') ||
        (bpjsStatusFilter === 'Resolved' &&
          (r.status === 'Resolved (cetak SEP)' || r.status === 'Resolved'));

      return matchSearch && matchStatus;
    });
  }, [bpjsRecords, searchTerm, bpjsStatusFilter]);

  const filteredAsuransiList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return asuransiRecords.filter((r) => {
      const matchSearch =
        !q ||
        (r.namaPasien && r.namaPasien.toLowerCase().includes(q)) ||
        (r.noRm && r.noRm.toLowerCase().includes(q)) ||
        (r.namaAsuransi && r.namaAsuransi.toLowerCase().includes(q));

      const matchAsuransi = asuransiFilter === 'all' || r.namaAsuransi.toLowerCase().includes(asuransiFilter.toLowerCase());

      const matchStatus =
        asuransiStatusFilter === 'all' ||
        (asuransiStatusFilter === 'pending' && !r.isResolved) ||
        (asuransiStatusFilter === 'resolved' && Boolean(r.isResolved));

      return matchSearch && matchAsuransi && matchStatus;
    });
  }, [asuransiRecords, searchTerm, asuransiFilter, asuransiStatusFilter]);

  const filteredUmumList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return umumRecords.filter((r) => {
      const matchSearch =
        !q ||
        (r.namaPasien && r.namaPasien.toLowerCase().includes(q)) ||
        (r.noRm && r.noRm.toLowerCase().includes(q)) ||
        (r.kronologiMasalah && r.kronologiMasalah.toLowerCase().includes(q)) ||
        (r.potensiMasalah && r.potensiMasalah.some((p) => p.toLowerCase().includes(q)));

      const matchPotensi =
        umumPotensiFilter === 'all' ||
        (r.potensiMasalah && r.potensiMasalah.includes(umumPotensiFilter));

      const matchStatus =
        umumStatusFilter === 'all' ||
        (umumStatusFilter === 'pending' && !r.isResolved) ||
        (umumStatusFilter === 'resolved' && Boolean(r.isResolved));

      return matchSearch && matchPotensi && matchStatus;
    });
  }, [umumRecords, searchTerm, umumPotensiFilter, umumStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b2847] via-[#103a66] to-[#0d4f7c] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full bg-blue-400/20 text-blue-200 text-xs font-bold uppercase tracking-wider border border-blue-300/30">
                Admisi & Rekam Medis
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold">
                RSU Muhammadiyah Babat
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Catatan Khusus Pasien
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Monitoring terpadu kasus Kecelakaan Lalu Lintas (KLL & Jasa Raharja), kendala bridging kepesertaan BPJS, koordinasi jaminan Asuransi Swasta, serta early-warning pasien UMUM berisiko.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              <span>Cetak Rekap</span>
            </button>
            <button
              onClick={() => {
                if (activeSubTab === 'kll') {
                  setSelectedKllForEdit(null);
                  setIsKllModalOpen(true);
                } else if (activeSubTab === 'bpjs_kendala') {
                  setSelectedBpjsForEdit(null);
                  setIsBpjsModalOpen(true);
                } else if (activeSubTab === 'asuransi_swasta') {
                  setSelectedAsuransiForEdit(null);
                  setIsAsuransiModalOpen(true);
                } else {
                  setSelectedUmumForEdit(null);
                  setIsUmumModalOpen(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pasien</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="mt-6 pt-4 border-t border-blue-400/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-300">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">Insiden KLL Pending</div>
              <div className="text-sm font-bold text-amber-300">{pendingKllCount} Pasien</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">BPJS Pending</div>
              <div className="text-sm font-bold text-amber-300">{pendingBpjsCount} Kasus</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-violet-500/30 flex items-center justify-center text-violet-300">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">Asuransi Swasta Pending</div>
              <div className="text-sm font-bold text-amber-300">{pendingAsuransiCount} Pasien</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">UMUM Beresiko Pending</div>
              <div className="text-sm font-bold text-rose-300">{pendingUmumCount} Pasien</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-teal-500/30 flex items-center justify-center text-teal-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">Handover Shift Pending</div>
              <div className="text-sm font-bold text-emerald-300">{pendingHandoverCount} Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 TOP TAB TRIGGERS (SPECIFICATION COMPLIANCE) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* TAB 1 */}
          <button
            onClick={() => setActiveSubTab('kll')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'kll'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-blue-600'
            }`}
          >
            <span>🚗</span>
            <span>Pasien KLL</span>
            {pendingKllCount > 0 ? (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'kll' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {pendingKllCount} Pnd
              </span>
            ) : (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'kll' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {kllRecords.length}
              </span>
            )}
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setActiveSubTab('bpjs_kendala')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'bpjs_kendala'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
            }`}
          >
            <span>🟢</span>
            <span>BPJS Kendala</span>
            {pendingBpjsCount > 0 ? (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'bpjs_kendala' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {pendingBpjsCount} Pnd
              </span>
            ) : (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'bpjs_kendala' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {bpjsRecords.length}
              </span>
            )}
          </button>

          {/* TAB 3 */}
          <button
            onClick={() => setActiveSubTab('asuransi_swasta')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'asuransi_swasta'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-violet-600'
            }`}
          >
            <span>💳</span>
            <span>Asuransi Swasta</span>
            {pendingAsuransiCount > 0 ? (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'asuransi_swasta' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {pendingAsuransiCount} Pnd
              </span>
            ) : (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'asuransi_swasta' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {asuransiRecords.length}
              </span>
            )}
          </button>

          {/* TAB 4 */}
          <button
            onClick={() => setActiveSubTab('umum_beresiko')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'umum_beresiko'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-amber-600'
            }`}
          >
            <span>⚠️</span>
            <span>UMUM Beresiko</span>
            {pendingUmumCount > 0 ? (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'umum_beresiko' ? 'bg-amber-400 text-slate-900' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {pendingUmumCount} Pnd
              </span>
            ) : (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'umum_beresiko' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {umumRecords.length}
              </span>
            )}
          </button>

          {/* TAB 5: Handover Shift Admisi */}
          <button
            onClick={() => setActiveSubTab('handover_shift')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'handover_shift'
                ? 'bg-[#005d42] text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#005d42]'
            }`}
          >
            <span>🔄</span>
            <span>Handover Shift</span>
            {pendingHandoverCount > 0 ? (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'handover_shift' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {pendingHandoverCount} Pnd
              </span>
            ) : (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'handover_shift' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {handoverRecords.length}
              </span>
            )}
          </button>

          {/* TAB 6: Belum Cetak SEP (Auto-Derived) */}
          <button
            onClick={() => setActiveSubTab('belum_cetak_sep')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'belum_cetak_sep'
                ? 'bg-blue-800 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-blue-800'
            }`}
          >
            <span>📄</span>
            <span>Belum Cetak SEP</span>
            {belumCetakSepRecords.length > 0 ? (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'belum_cetak_sep' ? 'bg-amber-400 text-slate-900' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {belumCetakSepRecords.length}
              </span>
            ) : (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'belum_cetak_sep' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                0
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONDITIONAL VIEW: TAB 5 SHIFT HANDOVER vs TABS 1-4 */}
      {activeSubTab === 'handover_shift' ? (
        <ShiftHandoverDashboard
          records={handoverRecords}
          onSaveRecord={handleSaveHandover}
          onToggleStatus={handleToggleHandoverStatus}
          onDeleteRecord={(id, namaPasien) => {
            setDeleteTarget({
              id,
              nama: namaPasien,
              tab: 'handover_shift',
              categoryLabel: 'Catatan Handover Shift'
            });
          }}
          showToast={showToast}
        />
      ) : (
        <>
          {/* GLOBAL FILTER BAR & SEARCH BAR */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan Nama Pasien atau No. RM secara dinamis..."
            className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab-Specific Sub-Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'kll' && (
            <>
              <select
                value={kllPenjaminFilter}
                onChange={(e) => setKllPenjaminFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Penjamin</option>
                <option value="Jasa Raharja">Jasa Raharja</option>
                <option value="BPJS Ketenagakerjaan">BPJS Ketenagakerjaan</option>
                <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                <option value="Umum">Umum</option>
              </select>

              <select
                value={kllInsidenFilter}
                onChange={(e) => setKllInsidenFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Status Insiden</option>
                <option value="active">Insiden Aktif Sahaja</option>
                <option value="inactive">Insiden Selesai</option>
              </select>

              <select
                value={kllStatusFilter}
                onChange={(e) => setKllStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Status Follow-Up</option>
                <option value="pending">⏳ Belum Selesai / Need Follow-up</option>
                <option value="resolved">✅ Selesai / Aman</option>
              </select>
            </>
          )}

          {activeSubTab === 'bpjs_kendala' && (
            <select
              value={bpjsStatusFilter}
              onChange={(e) => setBpjsStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Pending">Pending (Belum Tuntas)</option>
              <option value="Resolved">Resolved (cetak SEP)</option>
            </select>
          )}

          {activeSubTab === 'asuransi_swasta' && (
            <select
              value={asuransiStatusFilter}
              onChange={(e) => setAsuransiStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Status Follow-Up</option>
              <option value="pending">⏳ Belum Selesai / Need Follow-up</option>
              <option value="resolved">✅ Selesai / Aman</option>
            </select>
          )}

          {activeSubTab === 'umum_beresiko' && (
            <>
              <select
                value={umumPotensiFilter}
                onChange={(e) => setUmumPotensiFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none max-w-[220px]"
              >
                <option value="all">Semua Potensi Risiko</option>
                <option value="Biaya Operasi/Ranap Tinggi">Biaya Operasi/Ranap Tinggi</option>
                <option value="Pasien/Keluarga Vokal">Pasien/Keluarga Vokal</option>
                <option value="Risiko APS/Kabur">Risiko APS/Kabur</option>
                <option value="Komplain Pelayanan">Komplain Pelayanan</option>
                <option value="Readmisi">Readmisi</option>
                <option value="Tidak Ada Keluarga yang Faham">Tidak Ada Keluarga yang Faham</option>
                <option value="Tidak Ada Orang Tua/Wali">Tidak Ada Orang Tua/Wali</option>
                <option value="Non spesialistik">Non spesialistik</option>
                <option value="Tidak membawa identitas / kurang lengkap">Tidak membawa identitas / kurang lengkap</option>
                <option value="Belum waktu kontrol">Belum waktu kontrol</option>
              </select>

              <select
                value={umumStatusFilter}
                onChange={(e) => setUmumStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Status Follow-Up</option>
                <option value="pending">⏳ Belum Selesai / Need Follow-up</option>
                <option value="resolved">✅ Selesai / Aman</option>
              </select>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              requestAdminAction(() => {
                if (activeSubTab === 'kll') {
                  setSelectedKllForEdit(null);
                  setIsKllModalOpen(true);
                } else if (activeSubTab === 'bpjs_kendala') {
                  setSelectedBpjsForEdit(null);
                  setIsBpjsModalOpen(true);
                } else if (activeSubTab === 'asuransi_swasta') {
                  setSelectedAsuransiForEdit(null);
                  setIsAsuransiModalOpen(true);
                } else {
                  setSelectedUmumForEdit(null);
                  setIsUmumModalOpen(true);
                }
              }, 'Tambah Catatan Pasien');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1 CONTENT: PASIEN KECELAKAAN (KLL) */}
      {/* ========================================================================= */}
      {activeSubTab === 'kll' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Daftar Pasien Kasus Kecelakaan Lalu Lintas (KLL)
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                {filteredKllList.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Centang kolom <strong>Insiden</strong> untuk menandai kasus aktif
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-3 text-center w-28">Tgl MRS</th>
                  <th className="py-3 px-3 text-center w-28">Tgl KLL</th>
                  <th className="py-3 px-4 min-w-[220px]">Kronologi Kejadian</th>
                  <th className="py-3 px-3 text-center min-w-[130px]">Penjamin</th>
                  <th className="py-3 px-4 min-w-[180px]">Status LP KLL / Berkas</th>
                  <th className="py-3 px-3 text-center w-24">Insiden</th>
                  <th className="py-3 px-3 text-center min-w-[145px]">Status Follow-Up</th>
                  <th className="py-3 px-4 min-w-[180px]">Catatan / Noted</th>
                  <th className="py-3 px-3 text-center w-24 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKllList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Car className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Tidak ada data pasien KLL yang cocok.</span>
                        <span className="text-xs text-slate-400">Silakan tambahkan data baru atau reset kata kunci pencarian.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredKllList.map((record, idx) => {
                    const isBelum = !record.statusLp || record.statusLp.toUpperCase().includes('BELUM');
                    const isResolved = Boolean(record.isResolved);

                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          isResolved
                            ? 'bg-emerald-50/40 opacity-80'
                            : record.isInsidenActive
                            ? 'bg-amber-50/30 hover:bg-amber-100/40'
                            : 'hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className={`py-3 px-4 font-bold ${isResolved ? 'text-slate-700' : 'text-slate-900'}`}>
                          <div className="flex items-center gap-2">
                            <span>{record.namaPasien}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                          {record.noRm}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {record.tanggalMrs || '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {record.tanggalKll || '-'}
                        </td>
                        <td className={`py-3 px-4 leading-relaxed text-[11px] ${isResolved ? 'text-slate-500' : 'text-slate-700'}`}>
                          {record.kronologi || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              record.penjamin === 'Jasa Raharja'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : record.penjamin === 'BPJS Ketenagakerjaan'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : record.penjamin === 'BPJS Kesehatan'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {record.penjamin}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isBelum
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {record.statusLp}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedKllForLpViewer(record)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{record.lpFileName ? 'Lihat / Ganti Surat LP' : '📄 Upload Surat LP'}</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <label className="inline-flex items-center cursor-pointer" title="Centang Insiden Aktif">
                            <input
                              type="checkbox"
                              checked={record.isInsidenActive}
                              onChange={() => handleToggleKllInsiden(record.id)}
                              className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
                            />
                          </label>
                        </td>
                        {/* Status Follow-Up Checkbox Badge */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleKllResolved(record.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer border shadow-2xs ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            }`}
                            title="Klik untuk mengubah status follow-up"
                          >
                            <input
                              type="checkbox"
                              checked={isResolved}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                            />
                            <span>
                              {isResolved ? '✅ Selesai / Aman' : '⏳ Belum Selesai'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium text-[11px]">
                          {record.catatan ? (
                            <span className="p-1 px-1.5 rounded bg-amber-100/70 text-amber-950 font-semibold inline-block">
                              {record.catatan}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenStickerModal({
                                  namaPasien: record.namaPasien,
                                  noRm: record.noRm,
                                  tanggalMrs: record.tanggalMrs,
                                  kamarKelas: record.catatan?.match(/Kamar\s*:\s*([^\n|]+)/i)?.[1]?.trim() || '',
                                  source: 'KLL'
                                });
                              }}
                              className="p-1.5 text-slate-500 hover:text-[#005d42] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="🖨️ Cetak Stiker Note Ranap"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setHandoverCardTarget({ tab: 'kll', record })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Kartu Handover Admisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestAdminAction(() => {
                                  setSelectedKllForEdit(record);
                                  setIsKllModalOpen(true);
                                }, 'Edit Data Pasien KLL');
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data KLL"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestAdminAction(() => {
                                  setDeleteTarget({
                                    id: record.id,
                                    nama: record.namaPasien,
                                    noRm: record.noRm,
                                    tab: 'kll',
                                    categoryLabel: 'Kasus Pasien KLL'
                                  });
                                }, 'Hapus Data Pasien KLL');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data KLL"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2 CONTENT: BPJS KENDALA */}
      {/* ========================================================================= */}
      {activeSubTab === 'bpjs_kendala' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Catatan Pasien BPJS dengan Kendala Kepesertaan / Bridging SEP
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                {filteredBpjsList.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Klik badge status untuk mengubah status Pending / Resolved
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-3 text-center w-28">Tgl MRS / Kontrol</th>
                  <th className="py-3 px-4 min-w-[150px] font-mono">No. Kartu BPJS</th>
                  <th className="py-3 px-3 min-w-[150px]">Jenis Kendala</th>
                  <th className="py-3 px-4 min-w-[220px]">Detail Masalah</th>
                  <th className="py-3 px-4 min-w-[220px]">Catatan Solusi Admisi</th>
                  <th className="py-3 px-3 text-center w-36">Status</th>
                  <th className="py-3 px-3 text-center w-24 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBpjsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Tidak ada kendala BPJS yang cocok.</span>
                        <span className="text-xs text-slate-400">Semua pelayanan BPJS terpantau lancar tanpa kendala aktif.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBpjsList.map((record, idx) => {
                    const isPending = record.status === 'Pending';

                    return (
                      <tr
                        key={record.id}
                        className={`hover:bg-emerald-50/40 transition-colors ${
                          isPending ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {record.namaPasien}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                          {record.noRm}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700 whitespace-nowrap">
                          {record.tanggalMrsKontrol || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                          {record.noKartuBpjs}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                            {record.jenisKendala}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-[11px] leading-relaxed">
                          {record.detailMasalah}
                        </td>
                        <td className="py-3 px-4 text-slate-800 text-[11px] leading-relaxed font-medium bg-emerald-50/30">
                          {record.catatanSolusi}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              requestAdminAction(() => {
                                handleToggleBpjsStatus(record.id);
                              }, 'Ubah Status Kendala BPJS');
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            }`}
                            title="Klik untuk mengubah status Pending / Resolved (cetak SEP)"
                          >
                            {isPending ? (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Resolved (cetak SEP)</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenStickerModal({
                                  namaPasien: record.namaPasien,
                                  noRm: record.noRm,
                                  tanggalMrs: record.tanggalMrsKontrol || '',
                                  kamarKelas: record.detailMasalah?.match(/Kamar\s*:\s*([^\n|]+)/i)?.[1]?.trim() || '',
                                  source: 'BPJS'
                                });
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="🖨️ Cetak Stiker Note Ranap"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setHandoverCardTarget({ tab: 'bpjs_kendala', record })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Kartu Handover Admisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestAdminAction(() => {
                                  setSelectedBpjsForEdit(record);
                                  setIsBpjsModalOpen(true);
                                }, 'Edit Data Kendala BPJS');
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Kendala BPJS"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestAdminAction(() => {
                                  setDeleteTarget({
                                    id: record.id,
                                    nama: record.namaPasien,
                                    noRm: record.noRm,
                                    tab: 'bpjs_kendala',
                                    categoryLabel: 'Kendala BPJS Pasien'
                                  });
                                }, 'Hapus Data Kendala BPJS');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Kendala BPJS"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3 CONTENT: ASURANSI SWASTA */}
      {/* ========================================================================= */}
      {activeSubTab === 'asuransi_swasta' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Catatan Khusus Pasien Asuransi Swasta & Handover Shift
              </h3>
              <span className="text-xs bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full font-bold">
                {filteredAsuransiList.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Pantau status Guarantee Letter (GL) dan catatan excess fee
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-4 min-w-[180px]">Nama Asuransi Swasta</th>
                  <th className="py-3 px-3 min-w-[160px]">Kendala / Status Klaim</th>
                  <th className="py-3 px-3 text-center min-w-[145px]">Status Follow-Up</th>
                  <th className="py-3 px-5 min-w-[280px]">Catatan Handover Shift</th>
                  <th className="py-3 px-3 text-center w-24 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAsuransiList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CreditCard className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Tidak ada pasien asuransi swasta yang cocok.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAsuransiList.map((record, idx) => {
                    const isResolved = Boolean(record.isResolved);
                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          isResolved ? 'bg-emerald-50/40 opacity-80' : 'hover:bg-violet-50/40'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className={`py-3 px-4 font-bold ${isResolved ? 'text-slate-700' : 'text-slate-900'}`}>
                          {record.namaPasien}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-violet-700">
                          {record.noRm}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-900 border border-violet-200 text-xs">
                            {record.namaAsuransi}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                              record.statusKlaim.includes('Menunggu')
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : record.statusKlaim.includes('Excess')
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {record.statusKlaim}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              requestAdminAction(() => {
                                handleToggleAsuransiResolved(record.id);
                              }, 'Ubah Status Klaim Asuransi Swasta');
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer border shadow-2xs ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            }`}
                            title="Klik untuk mengubah status follow-up"
                          >
                            <input
                              type="checkbox"
                              checked={isResolved}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                            />
                            <span>
                              {isResolved ? '✅ Selesai / Aman' : '⏳ Belum Selesai'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-5 text-slate-700 text-[11px] leading-relaxed">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-medium">
                            {record.catatanHandover}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setHandoverCardTarget({ tab: 'asuransi_swasta', record })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Kartu Handover Admisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestAdminAction(() => {
                                  setSelectedAsuransiForEdit(record);
                                  setIsAsuransiModalOpen(true);
                                }, 'Edit Data Pasien Asuransi Swasta');
                              }}
                              className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Asuransi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestAdminAction(() => {
                                  setDeleteTarget({
                                    id: record.id,
                                    nama: record.namaPasien,
                                    noRm: record.noRm,
                                    tab: 'asuransi_swasta',
                                    categoryLabel: 'Catatan Asuransi Swasta'
                                  });
                                }, 'Hapus Data Pasien Asuransi Swasta');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Asuransi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4 CONTENT: UMUM BERESIKO */}
      {/* ========================================================================= */}
      {activeSubTab === 'umum_beresiko' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Early Warning Pasien UMUM Beresiko (Biaya, APS, Komplain & Keluarga)
              </h3>
              <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                {filteredUmumList.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Pantau potensi tunggakan biaya operasi/ranap dan risiko sengketa pelayanan
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-3 text-center w-28">Tgl MRS / Kontrol</th>
                  <th className="py-3 px-4 min-w-[220px]">Kronologi Kejadian / Masalah</th>
                  <th className="py-3 px-4 min-w-[240px]">Potensi Masalah</th>
                  <th className="py-3 px-4 min-w-[240px]">Tindak Lanjut / Catatan Admisi</th>
                  <th className="py-3 px-3 text-center min-w-[145px]">Status Follow-Up</th>
                  <th className="py-3 px-3 text-center w-24 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUmumList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Tidak ada pasien UMUM berisiko terdata.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUmumList.map((record, idx) => {
                    const isResolved = Boolean(record.isResolved);
                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          isResolved ? 'bg-emerald-50/40 opacity-80' : 'hover:bg-amber-50/40'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className={`py-3 px-4 font-bold ${isResolved ? 'text-slate-700' : 'text-slate-900'}`}>
                          {record.namaPasien}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-800">
                          {record.noRm}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700 whitespace-nowrap">
                          {record.tanggalMrsKontrol || '-'}
                        </td>
                        <td className={`py-3 px-4 text-[11px] leading-relaxed ${isResolved ? 'text-slate-500' : 'text-slate-700'}`}>
                          {record.kronologiMasalah}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {record.potensiMasalah && record.potensiMasalah.map((pot, pIdx) => (
                              <span
                                key={pIdx}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                  pot.includes('Tinggi')
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : pot.includes('APS') || pot.includes('Vokal')
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : pot.includes('Non spesialistik')
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                    : pot.includes('identitas')
                                    ? 'bg-orange-100 text-orange-900 border border-orange-200'
                                    : pot.includes('kontrol')
                                    ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {pot}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-800 text-[11px] leading-relaxed font-medium bg-amber-50/30">
                          {record.tindakLanjut}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              requestAdminAction(() => {
                                handleToggleUmumResolved(record.id);
                              }, 'Ubah Status Pasien UMUM Beresiko');
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer border shadow-2xs ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            }`}
                            title="Klik untuk mengubah status follow-up"
                          >
                            <input
                              type="checkbox"
                              checked={isResolved}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                            />
                            <span>
                              {isResolved ? '✅ Selesai / Aman' : '⏳ Belum Selesai'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setHandoverCardTarget({ tab: 'umum_beresiko', record })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Kartu Handover Admisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestAdminAction(() => {
                                  setSelectedUmumForEdit(record);
                                  setIsUmumModalOpen(true);
                                }, 'Edit Data Pasien UMUM Beresiko');
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data UMUM Beresiko"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestAdminAction(() => {
                                  setDeleteTarget({
                                    id: record.id,
                                    nama: record.namaPasien,
                                    noRm: record.noRm,
                                    tab: 'umum_beresiko',
                                    categoryLabel: 'Pasien UMUM Beresiko'
                                  });
                                }, 'Hapus Data Pasien UMUM Beresiko');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data UMUM Beresiko"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6 CONTENT: BELUM CETAK SEP (DERIVED FROM LP KLL & BPJS KENDALA) */}
      {/* ========================================================================= */}
      {activeSubTab === 'belum_cetak_sep' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-t-2xl mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-800" />
              <h3 className="font-bold text-slate-800 text-sm">
                Pasien Belum Cetak SEP (Kendala LP KLL, BPJS Denda 45 / Nonaktif)
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                {belumCetakSepRecords.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Daftar otomatis kompilasi pasien KLL & BPJS dengan status pending SEP jaminan
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-3 text-center w-28">Sumber Jaminan</th>
                  <th className="py-3 px-4 min-w-[220px]">Keterangan Kendala</th>
                  <th className="py-3 px-4 min-w-[200px]">Batas Pengurusan</th>
                  <th className="py-3 px-3 text-center w-28 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {belumCetakSepRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Semua SEP Pasien Aman Terbit / Tidak Ada Pending.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  belumCetakSepRecords.map((record, idx) => (
                    <tr key={record.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{record.namaPasien}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">{record.noRm}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          record.source === 'KLL' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {record.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{record.keterangan}</td>
                      <td className="py-3 px-4 font-bold text-rose-700">{record.batasPengurusan}</td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenStickerModal({
                                namaPasien: record.namaPasien,
                                noRm: record.noRm,
                                tanggalMrs: record.tanggalMrs,
                                kamarKelas: record.kamarKelas || '',
                                source: record.source
                              });
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer border border-blue-200"
                            title="🖨️ Cetak Stiker Buku Ranap"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Stiker Note Ranap</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODALS */}
      {/* ========================================================================= */}

      {/* TAB 1 Form Modal */}
      {isKllModalOpen && (
        <KllFormModal
          isOpen={isKllModalOpen}
          onClose={() => {
            setIsKllModalOpen(false);
            setSelectedKllForEdit(null);
          }}
          onSave={handleSaveKll}
          initialData={selectedKllForEdit}
        />
      )}

      {/* TAB 1 LP File Viewer Modal */}
      {selectedKllForLpViewer && (
        <LpFileViewerModal
          isOpen={Boolean(selectedKllForLpViewer)}
          onClose={() => setSelectedKllForLpViewer(null)}
          record={selectedKllForLpViewer}
          onSaveLpFile={handleSaveKll}
        />
      )}

      {/* TAB 2 Form Modal */}
      {isBpjsModalOpen && (
        <BpjsKendalaModal
          isOpen={isBpjsModalOpen}
          onClose={() => {
            setIsBpjsModalOpen(false);
            setSelectedBpjsForEdit(null);
          }}
          onSave={handleSaveBpjs}
          initialData={selectedBpjsForEdit}
        />
      )}

      {/* TAB 3 Form Modal */}
      {isAsuransiModalOpen && (
        <AsuransiSwastaModal
          isOpen={isAsuransiModalOpen}
          onClose={() => {
            setIsAsuransiModalOpen(false);
            setSelectedAsuransiForEdit(null);
          }}
          onSave={handleSaveAsuransi}
          initialData={selectedAsuransiForEdit}
        />
      )}

      {/* TAB 4 Form Modal */}
      {isUmumModalOpen && (
        <UmumBeresikoModal
          isOpen={isUmumModalOpen}
          onClose={() => {
            setIsUmumModalOpen(false);
            setSelectedUmumForEdit(null);
          }}
          onSave={handleSaveUmum}
          initialData={selectedUmumForEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          patientName={deleteTarget.nama}
          noRm={deleteTarget.noRm}
          categoryLabel={deleteTarget.categoryLabel}
        />
      )}

      {/* Cetak Rekap / Print Modal */}
      {isPrintModalOpen && (
        <PatientNotesPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          activeSubTab={activeSubTab}
          kllRecords={kllRecords}
          bpjsRecords={bpjsRecords}
          asuransiRecords={asuransiRecords}
          umumRecords={umumRecords}
        />
      )}

      {/* Kartu Laporan Handover Modal (Eye Icon Trigger) */}
      {handoverCardTarget && (
        <HandoverCardModal
          isOpen={Boolean(handoverCardTarget)}
          onClose={() => setHandoverCardTarget(null)}
          data={handoverCardTarget}
          onViewLpFile={(kllRecord) => {
            setHandoverCardTarget(null);
            setSelectedKllForLpViewer(kllRecord);
          }}
        />
      )}

      {/* STICKER PRINT MODAL */}
      {stickerModalOpen && stickerPatient && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-hidden no-print animate-in fade-in duration-150">
          <div className="relative z-[1000000] w-full max-w-3xl max-h-[90vh] my-auto flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight flex items-center gap-2">
                    <span>🖨️ Cetak Stiker Note Buku Ranap</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                      Landscape 15cm
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Stiker note berukuran 150mm (15 cm) landscape untuk ditempelkan pada Buku Rawat Inap pasien.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStickerModalOpen(false);
                  setStickerPatient(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {/* Paper Format Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Format Ukuran Stiker:</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      Landscape 15cm (150mm x 80mm)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Format stiker note buku rawat inap berorientasi horisontal (15 cm) tebal dan kontras tinggi.
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span>📐 Lebar Cetak: 150 mm</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Configuration Inputs */}
                <div className="space-y-4">
                  {/* Dropdown Menu for Templates */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Pilih Catatan Stiker / Template Status:
                    </label>
                    <select
                      value={stickerTemplate}
                      onChange={(e) => setStickerTemplate(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                    >
                      {STICKER_TEMPLATE_OPTIONS.map((opt, idx) => (
                        <option key={opt} value={opt} className="font-semibold text-slate-800 py-1">
                          {idx + 1}. {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Conditional Custom Input Field */}
                  {stickerTemplate === 'KUSTOM / INPUT MANUAL (Catatan Bebas)' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Isi Catatan Kustom Manual:
                      </label>
                      <textarea
                        rows={3}
                        value={customStickerText}
                        onChange={(e) => setCustomStickerText(e.target.value)}
                        placeholder="Ketik teks instruksi atau catatan khusus untuk stiker buku ranap..."
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  )}

                  {/* Selector Kelas Perawatan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kelas Perawatan (Opsional):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Tanpa Kelas', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'VIP', 'VVIP', 'ICU'].map((kOption) => {
                        const isNone = kOption === 'Tanpa Kelas';
                        const currentVal = stickerPatient.kamarKelas || '';
                        const isSelected = isNone ? !currentVal : currentVal.toLowerCase() === kOption.toLowerCase();
                        return (
                          <button
                            key={kOption}
                            type="button"
                            onClick={() => {
                              setStickerPatient({
                                ...stickerPatient,
                                kamarKelas: isNone ? '' : kOption
                              });
                            }}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {kOption}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      * Baris KELAS akan menampilkan kelas yang dipilih (misal: KELAS = 1) atau "KELAS = ....." jika belum ditentukan.
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[10px] text-blue-800 leading-relaxed font-semibold">
                    ℹ️ <strong>Tips Cetak (15cm x 8cm Landscape):</strong> Stiker berukuran presisi 150mm x 80mm (15cm landscape). Pastikan ukuran kertas / roll stiker thermal Anda telah disesuaikan dan margin browser disetel ke <strong>None</strong> agar cetakan pas memenuhi stiker.
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Pratinjau Stiker Landscape 15cm:
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                      150mm x 80mm
                    </span>
                  </div>

                  <div className="w-full border border-slate-300 rounded-2xl bg-slate-100 p-4 sm:p-5 flex items-center justify-center min-h-[220px]">
                    {/* Simulated 15cm Landscape Thermal Slip Container */}
                    <div
                      id="thermal-sticker-preview-box"
                      className="bg-white border-2 border-black w-full max-w-[560px] p-4 sm:p-5 text-center text-black font-mono shadow-md leading-tight transition-all duration-200"
                      style={{ aspectRatio: '150 / 80' }}
                    >
                      <div className="flex flex-col justify-between h-full">
                        <div>
                          <div className="text-base sm:text-lg font-extrabold tracking-wider text-center uppercase leading-tight">
                            RSU MUHAMMADIYAH BABAT
                          </div>
                          <div className="text-xs sm:text-sm font-bold italic uppercase mt-0.5 text-center leading-tight">
                            INFORMASI BUKU RANAP
                          </div>
                          <div className="w-full border-b-2 border-dashed border-black my-1.5" />
                        </div>

                        <div className="border-[3px] border-black p-3 my-1.5 text-lg sm:text-2xl font-black leading-tight uppercase bg-slate-50 text-center break-words rounded-xs flex-1 flex items-center justify-center">
                          {getStickerMainText(stickerTemplate, customStickerText)}
                        </div>

                        <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '18pt', marginTop: '6px', letterSpacing: '1px' }}>
                          KELAS = {getCleanKelas(stickerPatient) || '.....'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-3 border-t bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setStickerModalOpen(false);
                  setStickerPatient(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Unduh PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Unduh stiker sebagai file PDF format landscape 15cm"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
                </button>

                {/* 2. Tab Cetak */}
                <button
                  type="button"
                  onClick={handleTabCetak}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="Buka stiker di tab baru browser untuk mencetak langsung tanpa batasan iframe"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
                  <span>Tab Cetak</span>
                </button>

                {/* 3. Cetak Struk */}
                <button
                  type="button"
                  onClick={handlePrintSticker}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-100" />
                  <span>Cetak Struk (15cm)</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* HIDDEN PRINT-ONLY CONTAINER FOR 15CM LANDSCAPE THERMAL STICKER */}
      {stickerPatient && (
        <div
          id="thermal-print-area"
          data-orientation="landscape"
          className="hidden print:block text-black bg-white text-center leading-tight"
        >
          <style>{`
            @media print {
              /* Hide everything on the page EXCEPT the thermal print area */
              body * {
                visibility: hidden !important;
              }
              #thermal-print-area, #thermal-print-area * {
                visibility: visible !important;
              }
              #thermal-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 150mm !important;
                max-width: 150mm !important;
                box-sizing: border-box !important;
                padding: 5mm 8mm !important;
                margin: 0 auto !important;
                text-align: center !important;
                font-family: 'Courier New', monospace, sans-serif !important;
                color: #000 !important;
                background: #fff !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                size: 150mm 80mm landscape !important;
                margin: 0mm !important;
              }
              html, body {
                width: 150mm !important;
                height: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          <div style={{ width: '150mm', maxWidth: '150mm', margin: '0 auto', textAlign: 'center', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '18pt', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1.2, textAlign: 'center' }}>
              RSU MUHAMMADIYAH BABAT
            </div>
            <div style={{ fontSize: '14pt', fontWeight: 700, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1mm', lineHeight: 1.2, textAlign: 'center' }}>
              INFORMASI BUKU RANAP
            </div>
            <div style={{ width: '100%', borderBottom: '2px dashed #000', margin: '3mm 0' }} />

            <div
              style={{
                border: '3px solid #000',
                padding: '10mm 6mm',
                margin: '4mm 0',
                borderRadius: '4px',
                fontSize: '22pt',
                fontWeight: 900,
                lineHeight: 1.3,
                textTransform: 'uppercase',
                textAlign: 'center',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {getStickerMainText(stickerTemplate, customStickerText)}
            </div>

            <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '18pt', marginTop: '6px', letterSpacing: '1px' }}>
              KELAS = {getCleanKelas(stickerPatient) || '.....'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
