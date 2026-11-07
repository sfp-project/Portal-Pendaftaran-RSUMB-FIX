import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  History,
  Trash2,
  Stethoscope,
  Building2,
  User,
  Activity,
  AlertCircle,
  HelpCircle,
  ClipboardList,
  Printer,
  Zap,
  CheckCircle2,
  UserPlus,
  Send,
  ArrowRight,
  X,
  Eye
} from 'lucide-react';
import {
  parseSpriText,
  formatPesananKamarWA,
  ParsedSpriData,
  parseSPRIInput,
  ICD_10_DATABASE,
  matchIcdForPart,
  matchIcdForDiagnosis,
  extractKelasKamarFromText,
  IcdEntry
} from '../../data/inpatientOrderData';
export { parseSPRIInput, matchIcdForPart, matchIcdForDiagnosis, extractKelasKamarFromText, ICD_10_DATABASE };
export type { IcdEntry };
import { PatientQueueItem } from '../../types';
import { savePatientQueueDoc } from '../../services/firestoreSync';
import { loadMedicalLetters, saveMedicalLetters } from '../../data/letterData';
import { MedicalLetterItem } from '../../types/letterTypes';

interface SpriIcdCodingAssistantTabProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export type PenjaminType = 'BPJS' | 'UMUM' | 'KLL / JR / LP';

interface SessionLog {
  id: string;
  timestamp: string;
  pasien: string;
  rm: string;
  diagnosa: string;
  kodeIcd10: string;
  dpjp: string;
  kelas: string;
  formattedText: string;
  penjamin: PenjaminType;
  checklistState: Record<string, boolean>;
}

export const SpriIcdCodingAssistantTab: React.FC<SpriIcdCodingAssistantTabProps> = ({ showToast }) => {
  const [rawText, setRawText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedSpriData | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [searchLibraryQuery, setSearchLibraryQuery] = useState<string>('');
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string>('ALL');
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [caraBayar, setCaraBayar] = useState<string>('BPJS');
  const [customCaraBayar, setCustomCaraBayar] = useState<string>('');
  const [kelasKamar, setKelasKamar] = useState<string>('3');

  // State Filter Penjamin & Modal Detail / Print Rekap
  const [historyPenjaminFilter, setHistoryPenjaminFilter] = useState<'ALL' | 'BPJS' | 'UMUM' | 'KLL / JR / LP'>('ALL');
  const [selectedDetailLog, setSelectedDetailLog] = useState<SessionLog | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedLogs = localStorage.getItem('rsumb_spri_session_logs');
    if (savedLogs) {
      try {
        setSessionLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Error loading session logs:', e);
      }
    }
  }, []);

  const getChecklistTemplateForPenjamin = (penjamin: PenjaminType): string[] => {
    switch (penjamin) {
      case 'BPJS':
        return [
          'Terbit SPRI Dokter Jaga',
          'SEP Rajal',
          'SEP Ranap',
          'Pesan Kamar / Rujuk'
        ];
      case 'UMUM':
        return [
          'Surat Keterangan Administrasi Umum'
        ];
      case 'KLL / JR / LP':
        return [
          'Pernyataan Lapor',
          'SEP Rajal (Jika BPJS aktif / Cover 2 BPJS)',
          'Sidik Jari',
          'SEP Ranap'
        ];
    }
  };

  const getChecklistProgress = (log: SessionLog) => {
    const items = getChecklistTemplateForPenjamin(log.penjamin);
    const total = items.length;
    const checked = items.filter(i => log.checklistState[i]).length;
    const isComplete = checked === total && total > 0;
    return { checked, total, isComplete, items };
  };

  const handleToggleChecklistItem = (logId: string, itemKey: string) => {
    setSessionLogs(prev => {
      const updated = prev.map(log => {
        if (log.id === logId) {
          const updatedState = { ...log.checklistState, [itemKey]: !log.checklistState[itemKey] };
          return { ...log, checklistState: updatedState };
        }
        return log;
      });
      localStorage.setItem('rsumb_spri_session_logs', JSON.stringify(updated));
      return updated;
    });

    // Perbarui selectedDetailLog secara instan jika modal sedang dibuka
    setSelectedDetailLog(prev => {
      if (prev && prev.id === logId) {
        return {
          ...prev,
          checklistState: {
            ...prev.checklistState,
            [itemKey]: !prev.checklistState[itemKey]
          }
        };
      }
      return prev;
    });
  };

  // Cetak Struk Thermal 80mm Khusus Sesi Kontrol / Checklist Berkas Pasien
  const handlePrintThermalReceipt = (log: SessionLog) => {
    const progress = getChecklistProgress(log);
    const now = new Date();
    const formattedPrintTime =
      now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) +
      ' ' +
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' WIB';

    // List item checklist sesuai status checklist saat ini (Tabel rapat, font monospace tegas, kotak ceklis lurus)
    const checklistItemsHtml = progress.items
      .map((item, idx) => {
        const isChecked = !!log.checklistState[item];
        const checkMark = isChecked ? '[✓]' : '[ ]';
        const isLast = idx === progress.items.length - 1;
        return `<tr style="${isLast ? '' : 'border-bottom: 1px dotted #555;'}">
        <td style="width: 30px; vertical-align: top; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; padding: 4px 0 4px 2px; color: #000; letter-spacing: -0.5px; white-space: nowrap;">
          ${checkMark}
        </td>
        <td style="vertical-align: top; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: bold; padding: 4px 4px; color: #000; line-height: 1.25; letter-spacing: -0.25px;">
          ${item}
        </td>
        <td style="width: 66px; text-align: right; vertical-align: top; padding: 4px 2px 4px 0;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 9.5px; font-weight: 900; border: 1.5px solid #000; padding: 1px 4px; border-radius: 2px; letter-spacing: 0.2px; background: #fff;">
            ${isChecked ? 'LENGKAP' : 'BELUM'}
          </span>
        </td>
      </tr>`;
      })
      .join('');

    const thermalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Struk Kontrol Berkas - ${log.pasien} (${log.rm})</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      width: 78mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 10px 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: bold;
      line-height: 1.28;
      color: #000;
      background: #fff;
      letter-spacing: -0.3px;
    }
    .header {
      text-align: center;
      margin-bottom: 8px;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
    }
    .hospital-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      font-family: 'Courier New', Courier, monospace;
    }
    .hospital-sub {
      font-size: 10.5px;
      line-height: 1.25;
      color: #000;
      font-weight: bold;
    }
    .receipt-title {
      font-size: 12.5px;
      font-weight: 900;
      text-align: center;
      margin: 6px 0;
      padding: 5px 0;
      border-top: 2px dashed #000;
      border-bottom: 2px dashed #000;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      line-height: 1.25;
      font-family: 'Courier New', Courier, monospace;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-family: 'Courier New', Courier, monospace;
    }
    .info-table td {
      vertical-align: top;
      padding: 2.5px 0;
      font-size: 12px;
      line-height: 1.25;
    }
    .info-label {
      width: 38%;
      color: #000;
      font-weight: bold;
    }
    .info-sep {
      width: 4%;
      text-align: center;
      font-weight: 900;
    }
    .info-val {
      width: 58%;
      font-weight: 900;
    }
    .divider {
      border-top: 2px dashed #000;
      margin: 8px 0;
    }
    .section-title {
      font-size: 11.5px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 6px 0 4px 0;
      letter-spacing: 0.2px;
      font-family: 'Courier New', Courier, monospace;
    }
    .checklist-box {
      background: #fff;
      border: 1.5px solid #000;
      border-radius: 4px;
      padding: 2px 4px;
      margin-bottom: 6px;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 900;
      border: 1.5px solid #000;
      border-radius: 3px;
      background: #fff;
      letter-spacing: 0.2px;
    }
    .signature-area {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      margin-bottom: 8px;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
    }
    .sign-box {
      width: 48%;
    }
    .sign-space {
      height: 36px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      font-weight: bold;
      margin-top: 10px;
      color: #000;
      line-height: 1.3;
      border-top: 2px dashed #000;
      padding-top: 8px;
      font-family: 'Courier New', Courier, monospace;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #005d42;
      color: #fff;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: -10px -8px 10px -8px;
      font-family: -apple-system, sans-serif;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .btn-action {
      background: #fff;
      color: #005d42;
      border: none;
      padding: 5px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 11px;
      cursor: pointer;
    }
    .btn-close {
      background: rgba(255,255,255,0.2);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.4);
      padding: 5px 10px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 11px;
      cursor: pointer;
      margin-left: 6px;
    }
    @media print {
      @page {
        size: 80mm auto;
        margin: 2mm 3mm;
      }
      body {
        width: 100%;
        max-width: 100%;
        padding: 0;
        margin: 0;
      }
      .no-print, .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span style="font-weight: bold;">🖨️ Cetak Struk Thermal 80mm</span>
    <div>
      <button class="btn-action" onclick="window.print()">Cetak (Print)</button>
      <button class="btn-close" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="header">
    <div class="hospital-title">RSU MUHAMMADIYAH BABAT</div>
    <div class="hospital-sub">
      Jl. Raya Babat-Surabaya No. 15 Lamongan<br />
      Telp: (0322) 451122 &bull; IGD 24 Jam
    </div>
  </div>

  <div class="receipt-title">
    STRUK KONTROL / CHECKLIST BERKAS PASIEN
  </div>

  <table class="info-table">
    <tr>
      <td class="info-label">Waktu Sesi/Cetak</td>
      <td class="info-sep">:</td>
      <td class="info-val">${formattedPrintTime}</td>
    </tr>
    <tr>
      <td class="info-label">Nama Pasien</td>
      <td class="info-sep">:</td>
      <td class="info-val">${log.pasien}</td>
    </tr>
    <tr>
      <td class="info-label">No. Rekam Medis</td>
      <td class="info-sep">:</td>
      <td class="info-val">${log.rm || '-'}</td>
    </tr>
    <tr>
      <td class="info-label">Penjamin / Kelas</td>
      <td class="info-sep">:</td>
      <td class="info-val">${log.penjamin} (Kelas ${log.kelas})</td>
    </tr>
    <tr>
      <td class="info-label">Diagnosa</td>
      <td class="info-sep">:</td>
      <td class="info-val">${log.diagnosa}</td>
    </tr>
    <tr>
      <td class="info-label">Kode ICD-10</td>
      <td class="info-sep">:</td>
      <td class="info-val">${log.kodeIcd10 || '-'}</td>
    </tr>
    <tr>
      <td class="info-label">Dokter DPJP</td>
      <td class="info-sep">:</td>
      <td class="info-val">${log.dpjp || '-'}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <div class="section-title">CHECKLIST BERKAS (${log.penjamin}):</div>
  <div class="checklist-box">
    <table style="width: 100%; border-collapse: collapse;">
      ${checklistItemsHtml}
    </table>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; margin-bottom:2px;">
    <span style="font-size:11px; font-weight:bold; font-family:'Courier New', Courier, monospace;">STATUS BERKAS:</span>
    <span class="status-badge">
      ${progress.isComplete ? '🟢 LENGKAP 100%' : '⏳ PROSES (' + progress.checked + '/' + progress.total + ')'}
    </span>
  </div>

  <div class="divider"></div>

  <div class="signature-area">
    <div class="sign-box">
      <div>Pasien / Keluarga</div>
      <div class="sign-space"></div>
      <div>( .................... )</div>
    </div>
    <div class="sign-box">
      <div>Petugas Admisi</div>
      <div class="sign-space"></div>
      <div>( .................... )</div>
    </div>
  </div>

  <div class="footer">
    <div>* Harap simpan struk ini bersama berkas rekam medis *</div>
    <div style="margin-top:4px; font-weight:bold;">*** RSUMB MELAYANI DENGAN IKHLAS ***</div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Auto print error:', e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;

    let opened = false;
    try {
      const printWin = window.open('', '_blank', 'width=450,height=700,menubar=no,toolbar=no,status=no,resizable=yes');
      if (printWin && !printWin.closed) {
        printWin.document.open();
        printWin.document.write(thermalHtml);
        printWin.document.close();
        printWin.focus();
        opened = true;
      }
    } catch (e) {
      console.warn('window.open diblokir/gagal:', e);
    }

    // Fallback via iframe tersembunyi jika window.open diblokir browser
    if (!opened) {
      let printIframe = document.getElementById('thermal-spri-receipt-iframe') as HTMLIFrameElement;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'thermal-spri-receipt-iframe';
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
        doc.write(thermalHtml);
        doc.close();
        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        }, 350);
      }
    }

    if (showToast) {
      showToast(`Membuka struk thermal untuk ${log.pasien}...`, 'info');
    }
  };

  // 4 Poin Wajib Ceklist Kelengkapan Berkas Rekap Harian
  const REKAP_CHECKLIST_ITEMS = [
    'Terbit SPRI Dokter Jaga',
    'SEP Rajal',
    'SEP Ranap',
    'Pesan Kamar / Rujuk'
  ];

  // Cetak Laporan Rekap Harian Pemesanan Kamar & Berkas Format Thermal Roll 80mm
  const handlePrintBatchThermal = () => {
    if (filteredSessionLogs.length === 0) {
      if (showToast) showToast('Tidak ada data rekap pasien untuk dicetak.', 'error');
      return;
    }

    const now = new Date();
    const formattedPrintTime =
      now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) +
      ' ' +
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB';

    const patientRowsHtml = filteredSessionLogs
      .map((log, idx) => {
        const checklistLines = REKAP_CHECKLIST_ITEMS.map((item, i) => {
          const isChecked = !!log.checklistState[item];
          const checkMark = isChecked ? '[✓]' : '[ ]';
          const isLast = i === REKAP_CHECKLIST_ITEMS.length - 1;
          return `<tr style="${isLast ? '' : 'border-bottom: 1px dotted #666;'}">
            <td style="width: 28px; vertical-align: top; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 900; padding: 3px 0 3px 2px; color: #000; letter-spacing: -0.5px; white-space: nowrap;">
              ${checkMark}
            </td>
            <td style="vertical-align: top; font-family: 'Courier New', Courier, monospace; font-size: 11.5px; font-weight: bold; padding: 3px 4px; color: #000; line-height: 1.25; letter-spacing: -0.2px;">
              ${item}
            </td>
            <td style="width: 62px; text-align: right; vertical-align: top; padding: 3px 2px 3px 0;">
              <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 9px; font-weight: 900; border: 1.5px solid #000; padding: 1px 3px; border-radius: 2px; letter-spacing: 0.2px; background: #fff;">
                ${isChecked ? 'LENGKAP' : 'BELUM'}
              </span>
            </td>
          </tr>`;
        }).join('');

        return `<div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px dashed #000;">
          <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 900; font-family: 'Courier New', Courier, monospace; letter-spacing: -0.2px;">
            <span>#${idx + 1}. ${log.pasien}</span>
            <span style="font-size: 11px; color: #000;">${log.timestamp}</span>
          </div>
          <div style="font-size: 11.5px; font-weight: bold; color: #000; margin: 3px 0 5px 0; font-family: 'Courier New', Courier, monospace;">
            RM: <b>${log.rm || '-'}</b> &bull; ${log.penjamin} (Kls ${log.kelas})
          </div>
          <div style="background: #fff; padding: 2px 4px; border-radius: 3px; border: 1.5px solid #000;">
            <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 3px; border-bottom: 1px solid #000; padding-bottom: 2px; letter-spacing: 0.2px; font-family: 'Courier New', Courier, monospace;">
              Ceklist Kelengkapan Berkas:
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              ${checklistLines}
            </table>
          </div>
        </div>`;
      })
      .join('');

    const thermalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Rekap Harian Pemesanan Kamar & Berkas - RSUMB</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      width: 78mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 10px 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: bold;
      line-height: 1.28;
      color: #000;
      background: #fff;
      letter-spacing: -0.3px;
    }
    .header {
      text-align: center;
      margin-bottom: 8px;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
    }
    .hospital-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      font-family: 'Courier New', Courier, monospace;
    }
    .hospital-sub {
      font-size: 10.5px;
      line-height: 1.25;
      color: #000;
      font-weight: bold;
    }
    .receipt-title {
      font-size: 12.5px;
      font-weight: 900;
      text-align: center;
      margin: 6px 0;
      padding: 5px 0;
      border-top: 2px dashed #000;
      border-bottom: 2px dashed #000;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      line-height: 1.25;
      font-family: 'Courier New', Courier, monospace;
    }
    .meta-box {
      font-size: 11px;
      margin-bottom: 8px;
      color: #000;
      font-weight: bold;
      font-family: 'Courier New', Courier, monospace;
      line-height: 1.3;
    }
    .divider {
      border-top: 2px dashed #000;
      margin: 8px 0;
    }
    .signature-area {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      margin-bottom: 8px;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
    }
    .sign-box {
      width: 48%;
    }
    .sign-space {
      height: 36px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      font-weight: bold;
      margin-top: 10px;
      color: #000;
      line-height: 1.3;
      border-top: 2px dashed #000;
      padding-top: 8px;
      font-family: 'Courier New', Courier, monospace;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #005d42;
      color: #fff;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: -10px -8px 10px -8px;
      font-family: -apple-system, sans-serif;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .btn-action {
      background: #fff;
      color: #005d42;
      border: none;
      padding: 5px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 11px;
      cursor: pointer;
    }
    .btn-close {
      background: rgba(255,255,255,0.2);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.4);
      padding: 5px 10px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 11px;
      cursor: pointer;
      margin-left: 6px;
    }
    @media print {
      @page {
        size: 80mm auto;
        margin: 2mm 3mm;
      }
      body {
        width: 100%;
        max-width: 100%;
        padding: 0;
        margin: 0;
      }
      .no-print, .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span style="font-weight: bold;">🖨️ Cetak Rekap Thermal 80mm</span>
    <div>
      <button class="btn-action" onclick="window.print()">Cetak (Print)</button>
      <button class="btn-close" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="header">
    <div class="hospital-title">RSU MUHAMMADIYAH BABAT</div>
    <div class="hospital-sub">
      Jl. Raya Babat-Surabaya No. 15 Lamongan<br />
      Telp: (0322) 451122 &bull; IGD 24 Jam
    </div>
  </div>

  <div class="receipt-title">
    LAPORAN REKAP HARIAN<br />
    PEMESANAN KAMAR &amp; KELENGKAPAN BERKAS
  </div>

  <div class="meta-box">
    <div>Waktu Cetak: <b>${formattedPrintTime}</b></div>
    <div>Filter Penjamin: <b>${historyPenjaminFilter}</b></div>
    <div>Total Pasien: <b>${filteredSessionLogs.length} orang</b></div>
  </div>

  <div class="divider"></div>

  ${patientRowsHtml}

  <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; margin-top:6px;">
    <span>Total Tercatat:</span>
    <span>${filteredSessionLogs.length} Pasien</span>
  </div>

  <div class="divider"></div>

  <div class="signature-area">
    <div class="sign-box">
      <div>Mengetahui,</div>
      <div>Ka. Unit Admisi / Ranap</div>
      <div class="sign-space"></div>
      <div>( .................... )</div>
    </div>
    <div class="sign-box">
      <div>Babat, ${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <div>Petugas Admisi / Kasir</div>
      <div class="sign-space"></div>
      <div>( .................... )</div>
    </div>
  </div>

  <div class="footer">
    <div>* Arsip Laporan Rekap Harian Admisi RSUMB *</div>
    <div style="margin-top:4px; font-weight:bold;">*** RSUMB MELAYANI DENGAN IKHLAS ***</div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Auto print error:', e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;

    let opened = false;
    try {
      const printWin = window.open('', '_blank', 'width=450,height=750,menubar=no,toolbar=no,status=no,resizable=yes');
      if (printWin && !printWin.closed) {
        printWin.document.open();
        printWin.document.write(thermalHtml);
        printWin.document.close();
        printWin.focus();
        opened = true;
      }
    } catch (e) {
      console.warn('window.open diblokir/gagal:', e);
    }

    if (!opened) {
      let printIframe = document.getElementById('thermal-rekap-batch-iframe') as HTMLIFrameElement;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'thermal-rekap-batch-iframe';
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
        doc.write(thermalHtml);
        doc.close();
        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        }, 350);
      }
    }

    if (showToast) {
      showToast(`Membuka struk rekap thermal (${filteredSessionLogs.length} pasien)...`, 'info');
    }
  };

  const filteredSessionLogs = useMemo(() => {
    if (historyPenjaminFilter === 'ALL') return sessionLogs;
    return sessionLogs.filter(log => log.penjamin === historyPenjaminFilter);
  }, [sessionLogs, historyPenjaminFilter]);

  // Validasi real-time diagnosis terhadap database ICD-10
  const diagnosisValidation = useMemo(() => {
    if (!rawText.trim()) {
      return {
        hasDiagnosis: false,
        diagnosisText: '',
        isNotFound: false,
        isPartialWarning: false,
        unmatchedParts: [] as string[],
        matchedParts: [] as { text: string; code: string }[],
      };
    }

    const tempParsed = parseSpriText(rawText);
    const rawDiag = tempParsed.diagnosa?.trim();
    if (!rawDiag) {
      return {
        hasDiagnosis: false,
        diagnosisText: '',
        isNotFound: false,
        isPartialWarning: false,
        unmatchedParts: [] as string[],
        matchedParts: [] as { text: string; code: string }[],
      };
    }

    // Bersihkan kode kurung yang mungkin sudah ada dalam teks diagnosa
    const cleanDiagBase = rawDiag.replace(/\s*\([A-Za-z0-9.\s/]+\)/g, '');
    const diagParts = cleanDiagBase
      .split(/[+,/]| dan | ec |\bdd\b|\bdd\.|\bs\b|\bs\//i)
      .map((p) => p.trim())
      .filter(Boolean);

    if (diagParts.length === 0) {
      return {
        hasDiagnosis: false,
        diagnosisText: rawDiag,
        isNotFound: false,
        isPartialWarning: false,
        unmatchedParts: [] as string[],
        matchedParts: [] as { text: string; code: string }[],
      };
    }

    const unmatched: string[] = [];
    const matched: { text: string; code: string }[] = [];

    diagParts.forEach((part) => {
      const code = matchIcdForPart(part);
      if (code) {
        matched.push({ text: part, code });
      } else {
        unmatched.push(part);
      }
    });

    return {
      hasDiagnosis: true,
      diagnosisText: rawDiag,
      isNotFound: unmatched.length > 0 && matched.length === 0,
      isPartialWarning: unmatched.length > 0 && matched.length > 0,
      unmatchedParts: unmatched,
      matchedParts: matched,
    };
  }, [rawText]);

  // Ekstraksi langsung secara real-time untuk komponen Quick AI Input
  const liveExtracted = useMemo(() => {
    if (!rawText.trim()) return null;
    const p = parseSpriText(rawText);
    const cleanDiagBase = p.diagnosa.replace(/\s*\([A-Za-z0-9.\s/]+\)/g, '').trim();
    const diagParts = cleanDiagBase
      .split(/[+,/]| dan | ec |\bdd\b|\bdd\.|\bs\b|\bs\//i)
      .map((part) => part.trim())
      .filter(Boolean);

    const detectedCodes: string[] = [];
    diagParts.forEach((part) => {
      const code = matchIcdForPart(part);
      if (code && !detectedCodes.includes(code)) {
        detectedCodes.push(code);
      }
    });

    const combinedCodes = detectedCodes.join(' / ');
    return {
      nama: p.nama,
      noRm: p.noRm,
      umur: p.umur,
      diagnosa: cleanDiagBase,
      kodeIcd10: combinedCodes,
      dpjp: p.dokterDpjp || p.dpjp,
      dokterDpjp: p.dokterDpjp || p.dpjp,
      dokterPemeriksa: p.dokterPemeriksa,
      caraBayar: p.caraBayar,
      kelasKamar: p.kelasKamar
    };
  }, [rawText]);

  // 2. KELAS KAMAR & CARA BAYAR SINKRONISASI 100% DENGAN DROPDOWN USER
  const autoDetectConfig = (textToParse: string) => {
    const quickOverrideMatch = textToParse.match(
      /(?:^|\n|\s)(UMUM|BPJS|PENGURUSAN\s*JR\/?LP|KAI|BPJS\s*TK|ADMEDIKA|BRI\s*LIFE)\s*(3|2|1|VIP|VVIP)$/i
    );
    if (quickOverrideMatch) {
      let matchedBayar = quickOverrideMatch[1].toUpperCase();
      if (/PENGURUSAN/i.test(matchedBayar)) matchedBayar = 'PENGURUSAN JR/LP';
      else if (/BPJS\s*TK/i.test(matchedBayar)) matchedBayar = 'BPJS TK';
      else if (/BRI/i.test(matchedBayar)) matchedBayar = 'BRI LIFE';
      
      setCaraBayar(matchedBayar);
      setKelasKamar(quickOverrideMatch[2].toUpperCase());
    } else {
      const detectedKelas = extractKelasKamarFromText(textToParse);
      if (detectedKelas) {
        setKelasKamar(detectedKelas);
      }
    }
  };

  const handleParse = (textToParse: string) => {
    if (!textToParse.trim()) {
      setParsedData(null);
      if (showToast) showToast('Masukkan teks SPRI terlebih dahulu.', 'info');
      return;
    }

    autoDetectConfig(textToParse);
    const result = parseSpriText(textToParse);
    
    // 1. ANALISIS SEMUA DIAGNOSA & KODE ICD-10 GABUNGAN
    const rawDiag = result.diagnosa;
    const cleanDiagBase = rawDiag.replace(/\s*\([A-Z]\d{2}(?:\.\d+)?(?:\s*\/\s*[A-Z]\d{2}(?:\.\d+)?)*\)/gi, '').trim();
    const diagParts = cleanDiagBase
      .split(/[+,/]| dan | ec |\bdd\b|\bdd\.|\bs\b|\bs\//i)
      .map((p) => p.trim())
      .filter(Boolean);

    const detectedCodes: string[] = [];
    const cleanedParts: string[] = [];

    diagParts.forEach((part) => {
      // Deteksi jika sudah ada kode ICD-10 di bagian diagnosa (format "J35.1-...")
      const existingCodeMatch = part.match(/\b([A-Z][0-9][0-9][.][0-9])\b/i);
      if (existingCodeMatch) {
        detectedCodes.push(existingCodeMatch[1].toUpperCase());
        cleanedParts.push(part.replace(existingCodeMatch[1], '').replace(/[-/]/, '').trim());
      } else {
        const code = matchIcdForPart(part);
        if (code && !detectedCodes.includes(code)) {
          detectedCodes.push(code);
        }
        cleanedParts.push(part);
      }
    });

    const combinedIcdCodes = detectedCodes.join(' / ') || result.kodeIcd10;
    const enrichedDiagnosa = combinedIcdCodes ? `${cleanDiagBase} (${combinedIcdCodes})` : rawDiag;

    // 2. KELAS KAMAR & CARA BAYAR SINKRONISASI 100%
    let activeCaraBayar = caraBayar;
    let activeKelas = result.kelasKamar || kelasKamar;

    const quickOverrideMatch = textToParse.match(
      /(?:^|\n|\s)(UMUM|BPJS|PENGURUSAN\s*JR\/?LP|KAI|BPJS\s*TK|ADMEDIKA|BRI\s*LIFE)\s*(3|2|1|VIP|VVIP)$/i
    );
    if (quickOverrideMatch) {
      let matchedBayar = quickOverrideMatch[1].toUpperCase();
      if (/PENGURUSAN/i.test(matchedBayar)) matchedBayar = 'PENGURUSAN JR/LP';
      else if (/BPJS\s*TK/i.test(matchedBayar)) matchedBayar = 'BPJS TK';
      else if (/BRI/i.test(matchedBayar)) matchedBayar = 'BRI LIFE';
      activeCaraBayar = matchedBayar;
      activeKelas = quickOverrideMatch[2].toUpperCase();
      setCaraBayar(matchedBayar);
      setKelasKamar(activeKelas);
    } else {
      if (result.kelasKamar) {
        activeKelas = result.kelasKamar;
        setKelasKamar(result.kelasKamar);
      }
      if (result.caraBayar) {
        activeCaraBayar = result.caraBayar;
        setCaraBayar(result.caraBayar);
      }
    }

    const effectiveBayar =
      (activeCaraBayar === 'Lainnya / Custom' ? (customCaraBayar || 'UMUM') : activeCaraBayar).toUpperCase().replace(/\s*(?:KLS|KELAS)?\s*(?:3|2|1|VIP|VVIP)$/i, '').trim();
    const cleanKelasKamar = activeKelas.replace(/^(?:Kelas|Kls)\s*/i, '');

    const formattedWA = formatPesananKamarWA({
      nama: result.nama,
      noRm: result.noRm,
      umur: result.umur,
      diagnosa: enrichedDiagnosa,
      kodeIcd10: combinedIcdCodes,
      dpjp: result.dokterDpjp || result.dpjp,
      dokterDpjp: result.dokterDpjp || result.dpjp,
      dokterPemeriksa: result.dokterPemeriksa,
      caraBayar: effectiveBayar,
      kelasKamar: cleanKelasKamar
    });

    const finalResult: ParsedSpriData = {
      ...result,
      diagnosa: enrichedDiagnosa,
      kodeIcd10: combinedIcdCodes,
      dpjp: result.dokterDpjp || result.dpjp,
      dokterDpjp: result.dokterDpjp || result.dpjp,
      dokterPemeriksa: result.dokterPemeriksa,
      caraBayar: effectiveBayar,
      kelasKamar: cleanKelasKamar,
      resultFormat: formattedWA
    };

    setParsedData(finalResult);

    const upperBayar = effectiveBayar.toUpperCase();
    let detectedPenjamin: PenjaminType = 'BPJS';
    if (/UMUM|MANDIRI|TUNAI/i.test(upperBayar)) {
      detectedPenjamin = 'UMUM';
    } else if (/KLL|JR|JASA RAHARJA|LP|LAKA|KLL\s*\/\s*JR\s*\/\s*LP/i.test(upperBayar) || /PENGURUSAN JR/i.test(upperBayar)) {
      detectedPenjamin = 'KLL / JR / LP';
    } else {
      detectedPenjamin = 'BPJS';
    }

    const checklistItems = getChecklistTemplateForPenjamin(detectedPenjamin);
    const initialChecklistState: Record<string, boolean> = {};
    checklistItems.forEach(item => {
      initialChecklistState[item] = false;
    });

    const newLog: SessionLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      pasien: result.nama || 'Pasien Tanpa Nama',
      rm: result.rawText.match(/\b\d{6}\b/)?.[0] || '123456',
      diagnosa: enrichedDiagnosa,
      kodeIcd10: combinedIcdCodes,
      dpjp: result.dpjp || 'dr. Atika Amalia Fajarini, Sp. PD',
      kelas: cleanKelasKamar,
      formattedText: formattedWA,
      penjamin: detectedPenjamin,
      checklistState: initialChecklistState
    };
    setSessionLogs((prev) => {
      const updated = [newLog, ...prev.slice(0, 19)];
      localStorage.setItem('rsumb_spri_session_logs', JSON.stringify(updated));
      return updated;
    });

    if (showToast) {
      showToast('Formulir SPRI & ICD-10 berhasil di-parse secara presisi!', 'success');
    }
  };

  // Update format saat caraBayar atau kelasKamar berubah
  React.useEffect(() => {
    if (parsedData) {
      const activeCaraBayar = (caraBayar === 'Lainnya / Custom' ? (customCaraBayar || 'UMUM') : caraBayar).toUpperCase().replace(/\s*(?:KLS|KELAS)?\s*(?:3|2|1|VIP|VVIP)$/i, '').trim();
      const cleanKelas = (kelasKamar || '3').trim().replace(/^(?:Kelas|Kls)\s*/i, '');
      const newFormat = formatPesananKamarWA({
        ...parsedData,
        caraBayar: activeCaraBayar,
        kelasKamar: cleanKelas
      });
      setParsedData(prev => prev ? ({ ...prev, caraBayar: activeCaraBayar, kelasKamar: cleanKelas, resultFormat: newFormat }) : null);
    }
  }, [caraBayar, customCaraBayar, kelasKamar]);

  // Sinkronisasi otomatis SPRI ke PatientQueueView
  const handleSyncToPatientQueue = () => {
    if (!parsedData) {
      if (showToast) showToast('Belum ada data SPRI yang diproses.', 'error');
      return;
    }

    const patientName = parsedData.nama || 'Pasien SPRI';
    const queueId = `queue-spri-${Date.now()}`;
    const autoNumber = `RANAP-${parsedData.kelasKamar || '3'}-${Math.floor(100 + Math.random() * 900)}`;

    const newQueueItem: PatientQueueItem = {
      id: queueId,
      nomorAntrean: autoNumber,
      namaPasien: patientName,
      noBpjs: parsedData.caraBayar.includes('BPJS') ? (parsedData.rawText.match(/\b\d{13}\b/)?.[0] || '000' + Math.floor(1000000000 + Math.random() * 9000000000)) : '-',
      poli: `Rawat Inap (${parsedData.kelasKamar ? `Kelas ${parsedData.kelasKamar}` : 'Kelas 3'})`,
      dpjp: parsedData.dpjp || 'dr. Atika Amalia Fajarini, Sp. PD',
      jamDaftar: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'Menunggu',
      jenisPembayaran: parsedData.caraBayar.includes('BPJS')
        ? 'BPJS Kesehatan'
        : parsedData.caraBayar.includes('UMUM')
        ? 'Umum'
        : 'Asuransi Swasta'
    };

    try {
      const existing = localStorage.getItem('rsumb_patient_queues');
      const list = existing ? JSON.parse(existing) : [];
      const updated = [newQueueItem, ...list];
      localStorage.setItem('rsumb_patient_queues', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    savePatientQueueDoc(newQueueItem).catch(() => {});
    window.dispatchEvent(new CustomEvent('rsumb_queue_updated', { detail: newQueueItem }));

    if (showToast) {
      showToast(`Berhasil menyinkronkan ${patientName} ke Antrean Pasien (${autoNumber})!`, 'success');
    }
  };

  // Sinkronisasi SPRI ke Draft Surat Admisi / SPRI
  const handleSyncToDraftMedicalLetter = () => {
    if (!parsedData) {
      if (showToast) showToast('Belum ada data SPRI yang diproses.', 'error');
      return;
    }

    const patientName = parsedData.nama || 'Pasien SPRI';
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const letterId = `letter-spri-${Date.now()}`;
    const letterNo = `445/${Math.floor(100 + Math.random() * 900)}/SPRI/RSUMB/${now.getFullYear()}`;

    const newLetter: MedicalLetterItem = {
      id: letterId,
      nomorSurat: letterNo,
      kategori: 'admisi',
      jenisSurat: 'PESAN_KAMAR',
      tanggalSurat: dateStr,
      noRm: parsedData.rawText.match(/\b\d{6}\b/)?.[0] || 'RM-' + Math.floor(100000 + Math.random() * 900000),
      namaPasien: patientName,
      nik: '352405' + Math.floor(1000000000 + Math.random() * 9000000000),
      tempatLahir: 'Lamongan',
      tanggalLahir: '1990-01-01',
      umur: parseInt(parsedData.umur, 10) || 30,
      jenisKelamin: /perempuan|wanita|\bny\b|\bnn\b/i.test(patientName) ? 'Perempuan' : 'Laki-laki',
      pekerjaan: 'Wiraswasta',
      alamat: 'Kabupaten Lamongan, Jawa Timur',
      noHp: '081234567890',
      noBpjs: parsedData.caraBayar.includes('BPJS') ? '000' + Math.floor(1000000000 + Math.random() * 9000000000) : undefined,
      keperluan: `Pemesanan Kamar Rawat Inap (SPRI) - Diagnosa: ${parsedData.diagnosa} (${parsedData.kodeIcd10})`,
      dokterNama: parsedData.dpjp || 'dr. Atika Amalia Fajarini, Sp. PD',
      dokterSip: '503/445/SIP.D/413.205/2024',
      dokterJabatan: 'Dokter Penanggung Jawab Pelayanan (DPJP)',
      pesanKamarParams: {
        namaPemesan: patientName,
        hubunganPemesan: 'Diri Sendiri / Keluarga',
        tanggalRencanaMasuk: dateStr,
        jamRencanaMasuk: '09:00 WIB',
        kelasKamarDipilih: (parsedData.kelasKamar.includes('VIP') ? 'VIP' : parsedData.kelasKamar.includes('1') ? 'Kelas 1' : parsedData.kelasKamar.includes('2') ? 'Kelas 2' : 'Kelas 3'),
        tarifPerHari: parsedData.kelasKamar.includes('VIP') ? 650000 : parsedData.kelasKamar.includes('1') ? 350000 : parsedData.kelasKamar.includes('2') ? 250000 : 150000,
        fasilitasKamar: 'Bed Pasien, Bed Side Cabinet, AC / Kipas Angin, Kamar Mandi Dalam',
        estimasiLamaInapHari: 3,
        diagnosaAwal: `${parsedData.diagnosa} [ICD-10: ${parsedData.kodeIcd10}]`,
        dokterPengirim: parsedData.dpjp || 'dr. Atika Amalia Fajarini, Sp. PD',
        noHpPemesan: '081234567890',
        catatanPermintaanKhusus: `${parsedData.caraBayar} - ${parsedData.resultFormat}`
      },
      createdAt: now.toISOString()
    };

    try {
      const existing = loadMedicalLetters();
      saveMedicalLetters([newLetter, ...existing]);
      window.dispatchEvent(new CustomEvent('rsumb_letters_saved'));
    } catch (e) {
      console.error(e);
    }

    if (showToast) {
      showToast(`Draft Surat Admisi / SPRI berhasil dibuat (${letterNo})!`, 'success');
    }
  };

  const handleCopyFormatted = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      if (showToast) showToast('Format berhasil disalin ke clipboard!', 'success');
    });
  };

  const filteredLibrary = useMemo(() => {
    return ICD_10_DATABASE.filter(item => {
      const matchSpecialty = selectedSpecialtyFilter === 'ALL' || item.specialty === selectedSpecialtyFilter;
      const query = searchLibraryQuery.toLowerCase();
      const matchQuery = item.code.toLowerCase().includes(query) || item.diagnosis.toLowerCase().includes(query);
      return matchSpecialty && matchQuery;
    });
  }, [searchLibraryQuery, selectedSpecialtyFilter]);

  const handleSelectIcdFromLibrary = (item: IcdEntry) => {
    setIsLibraryOpen(false);
    // Append or update current parse text if any
    if (parsedData) {
      const updatedDiag = `${parsedData.diagnosa.replace(/\s*\([A-Z0-9.]+\)/g, '')} - ${item.diagnosis} (${item.code})`;
      const updatedRaw = { ...parsedData, diagnosa: updatedDiag, kodeIcd10: item.code };
      setParsedData({
        ...updatedRaw,
        resultFormat: formatPesananKamarWA(updatedRaw)
      });
      if (showToast) showToast(`Berhasil menyisipkan kode ${item.code} (${item.diagnosis})`, 'success');
    } else {
      setRawText(`FORMULIR PERMINTAAN RAWAT INAP (SPRI)\nNo. RM: 987654\nNama Pasien: NY. SITI\nUmur: 45 Th\nDiagnosa Masuk: ${item.diagnosis}\nKamar Diminta: VIP\nDPJP: dr. Spesialis\nCara Bayar: BPJS`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#005d42] via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Stethoscope className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-wide">
                  Asisten SPRI & Coding ICD-10 RSUMB
                </h2>
                <span className="text-[10px] font-bold uppercase bg-emerald-400/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                  Modul Klinis Otomatis
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl leading-relaxed">
                Ekstraksi otomatis formulir permintaan rawat inap (SPRI), pencocokan kode ICD-10 berdasarkan spesialisasi dokter, dan format pesan WhatsApp siap kirim untuk koordinasi bangsal keperawatan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>Pustaka ICD-10</span>
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ==================================================== */}
      {/* QUICK AI INPUT: FULL-WIDTH CHAT BAR STYLE            */}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-600/30 shadow-lg space-y-4 relative overflow-hidden ring-1 ring-emerald-500/10">
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005d42] to-teal-700 text-white flex items-center justify-center shadow-md shrink-0">
                <Zap className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Quick AI Input (Input Teks Chat Bar)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-[#005d42] border border-emerald-300">
                    SIMRS Raw Paste &amp; Override Cepat
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Paste teks mentah formulir SPRI dari SIMRS atau ketik instruksi penjamin &amp; kelas di akhir teks (<code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-bold">BPJS 3</code>, <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-bold">UMUM 1</code>, <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-bold">PENGURUSAN JR/LP VIP</code>).
                </p>
              </div>
            </div>

            {/* Status Badge Real-Time */}
            <div className="flex items-center gap-2 shrink-0">
              {diagnosisValidation.isNotFound ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  ICD-10 Belum Ada
                </span>
              ) : diagnosisValidation.isPartialWarning ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  ICD-10 Parsial
                </span>
              ) : diagnosisValidation.hasDiagnosis ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
                  <Check className="w-4 h-4 text-emerald-600" />
                  ICD-10 Terverifikasi ({diagnosisValidation.matchedParts.map(m => m.code).join(' / ')})
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Auto-Parser Aktif (Ctrl + Enter)
                </span>
              )}
            </div>
          </div>

          {/* Quick Sample Presets Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500">Contoh Cepat SPRI:</span>
            <button
              type="button"
              onClick={() => {
                const sample = `Nama Pasien : ANIK SUTARI. NY\nNo. Rekam Medis : 064707\nUmur : 51 Th\nDokter Yang Memeriksa : dr. Tri Puji\nDokter DPJP : dr. Ilham Basjar, Sp.PD.\nDiagnosa Awal : AF\nKamar Diminta : VIP-BED4 JANNATUL FIRDAUS VIP\nPenjamin : BPJS VIP`;
                setRawText(sample);
                handleParse(sample);
              }}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer transition"
            >
              SPRI AF (I48.9) &amp; VIP
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = `Nama Pasien : KARMANI. NY\nNo. Rekam Medis : 064707\nUmur : 65 Th\nDokter Yang Memeriksa : dr. Tri Puji\nDokter DPJP : dr. Ilham Basjar, Sp.PD.\nDiagnosa Awal : DYSPNEU S ADHF\nKamar Diminta : Ma'wa 5A... Kelas 3\nPenjamin : BPJS`;
                setRawText(sample);
                handleParse(sample);
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#005d42] border border-emerald-300 rounded-lg text-xs font-bold cursor-pointer transition"
            >
              SPRI Ma'wa 5A... Kelas 3
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = `Nama Pasien : MAMIK DIYAN NOFERA. NY\nNo. Rekam Medis : 058912\nUmur : 42 Th\nDokter Yang Memeriksa : dr. Jaga IGD\nDokter DPJP : dr. Bagas Setiawan Ihsan\nDiagnosa Awal : chest pain s angina dd gerd\nKamar Diminta : Kelas 3\nBPJS 3`;
                setRawText(sample);
                handleParse(sample);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer transition"
            >
              SPRI Jantung &amp; GERD
            </button>
          </div>

          {/* Textarea Lebar */}
          <div className="space-y-2">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleParse(rawText);
                }
              }}
              placeholder="Tempel (Paste) teks mentah SPRI dari SIMRS di sini...&#10;Contoh format SIMRS:&#10;Nama Pasien : KARMANI. NY&#10;No. Rekam Medis : 064707&#10;Umur : 65 Th&#10;Dokter Yang Memeriksa : dr. Tri Puji&#10;Dokter DPJP : dr. Ilham Basjar, Sp.PD.&#10;Diagnosa Awal : DYSPNEU S ADHF&#10;Kamar Diminta : Kelas 3&#10;BPJS 3&#10;&#10;(💡 Tips Cepat: Tekan Ctrl + Enter untuk langsung mengekstrak dan men-generate pesan WA)"
              rows={5}
              className={`w-full p-4 rounded-xl text-xs sm:text-sm font-mono text-slate-800 transition-all resize-y border leading-relaxed ${
                diagnosisValidation.isNotFound
                  ? 'border-rose-400 bg-rose-50/15 focus:ring-2 focus:ring-rose-500 focus:bg-white'
                  : diagnosisValidation.isPartialWarning
                  ? 'border-amber-400 bg-amber-50/15 focus:ring-2 focus:ring-amber-500 focus:bg-white'
                  : diagnosisValidation.hasDiagnosis
                  ? 'border-emerald-400 bg-emerald-50/15 focus:ring-2 focus:ring-[#005d42] focus:bg-white'
                  : 'border-slate-300 bg-slate-50/70 focus:ring-2 focus:ring-[#005d42] focus:bg-white'
              }`}
            />

            {/* Live Extracted Real-Time Feedback Bar */}
            {liveExtracted && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 animate-fadeIn">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">👤 Pasien</span>
                  <span className="text-xs font-bold text-slate-900 truncate block" title={liveExtracted.nama || '-'}>
                    {liveExtracted.nama || '-'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">🎂 Umur</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {liveExtracted.umur || '-'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">🩺 Diagnosa</span>
                  <span className="text-xs font-bold text-slate-900 truncate block" title={liveExtracted.diagnosa || '-'}>
                    {liveExtracted.diagnosa || '-'}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">🏷️ ICD-10</span>
                  <span className="text-xs font-mono font-black text-emerald-700 truncate block" title={liveExtracted.kodeIcd10 || '-'}>
                    {liveExtracted.kodeIcd10 || 'Menganalisis...'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">👨‍⚕️ DPJP</span>
                  <span className="text-xs font-bold text-slate-900 truncate block" title={liveExtracted.dpjp || '-'}>
                    {liveExtracted.dpjp || '-'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">💳 Penjamin &amp; Kelas</span>
                  <span className="text-xs font-black text-[#005d42] truncate block">
                    {liveExtracted.caraBayar} {liveExtracted.kelasKamar}
                  </span>
                </div>
              </div>
            )}

            {/* Alert Peringatan Visual Real-Time */}
            {diagnosisValidation.isNotFound && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs shadow-xs animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center justify-between gap-2 flex-wrap">
                    <span>Diagnosis belum terdaftar dalam pustaka ICD-10</span>
                    <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-bold">
                      Tetap Bisa Generate
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-rose-700 leading-relaxed">
                    "{diagnosisValidation.unmatchedParts.join(', ')}" belum ditemukan. Sistem tetap mengizinkan generate output standar atau Anda dapat memilih kode secara manual lewat tombol <strong>Pustaka ICD-10</strong> di atas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setRawText('');
              setParsedData(null);
              if (showToast) showToast('Formulir dibersihkan.', 'info');
            }}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span>Bersihkan</span>
          </button>

          <button
            type="button"
            onClick={() => handleParse(rawText)}
            className="px-6 py-2.5 bg-[#005d42] hover:bg-[#004834] active:bg-[#003828] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>⚡ Proses &amp; Ekstrak Cepat (Ctrl + Enter)</span>
          </button>
        </div>
      </div>

      {/* Grid Bawah: Pengaturan Form & Output Siap Kirim */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Pengaturan Form & Dropdown Penjamin */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#005d42]" />
                <h3 className="text-sm font-bold text-slate-800">Detail Pengaturan Penjamin &amp; Kamar</h3>
              </div>
              <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                Sinkron 100%
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Jenis Pembayaran:</label>
                <div className="flex flex-col gap-2">
                  <select
                    value={caraBayar}
                    onChange={(e) => setCaraBayar(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="UMUM">UMUM</option>
                    <option value="BPJS">BPJS</option>
                    <option value="PENGURUSAN JR/LP">PENGURUSAN JR/LP</option>
                    <option value="KAI">KAI</option>
                    <option value="BPJS TK">BPJS TK</option>
                    <option value="ADMEDIKA">ADMEDIKA</option>
                    <option value="BRI LIFE">BRI LIFE</option>
                    <option value="Lainnya / Custom">Lainnya / Custom</option>
                  </select>
                  {caraBayar === 'Lainnya / Custom' && (
                    <input
                      type="text"
                      value={customCaraBayar}
                      onChange={(e) => setCustomCaraBayar(e.target.value)}
                      placeholder="Ketik jenis pembayaran..."
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Kelas Kamar:</label>
                <select
                  value={kelasKamar}
                  onChange={(e) => setKelasKamar(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="3">Kelas 3</option>
                  <option value="2">Kelas 2</option>
                  <option value="1">Kelas 1</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                </select>
              </div>

              {/* Tips Cerdas Pendaftaran RSUMB */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#005d42]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Logika Klinis Cerdas RSUMB</span>
                </div>
                <p className="leading-relaxed text-emerald-800 text-[11px] font-medium">
                  Sistem otomatis mengekstrak nilai diagnosis tanpa menyertakan label seperti <i>"Diagnosa Awal"</i>, <i>"Kamar Diminta"</i>, atau <i>"Asal Poli/Unit"</i>. Pilihan penjamin &amp; kelas kamar di atas 100% tersinkronisasi ke baris akhir template.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Output Format & Hasil Parsing */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#005d42]" />
                <h3 className="text-sm font-bold text-slate-800">Output Template Klinik Siap Kirim</h3>
              </div>
              {parsedData && (
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-[#005d42] px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {parsedData.caraBayar || 'BPJS / UMUM'}
                </span>
              )}
            </div>

            {parsedData ? (
              <div className="space-y-4">
                <div className="relative">
                  <pre className="w-full p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800 shadow-inner whitespace-pre-wrap">
                    {parsedData.resultFormat}
                  </pre>
                  <button
                    onClick={() => handleCopyFormatted(parsedData.resultFormat)}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Format</span>
                  </button>
                </div>

                {/* Extracted badges summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Kelas Kamar</span>
                    <span className="text-xs font-black text-[#005d42]">Kelas {parsedData.kelasKamar || '-'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Kode ICD-10</span>
                    <span className="text-xs font-black font-mono text-blue-700">{parsedData.kodeIcd10 || '-'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">👨‍⚕️ Dokter DPJP</span>
                    <span className="text-xs font-black text-emerald-950 truncate block" title={parsedData.dokterDpjp || parsedData.dpjp || '-'}>
                      {parsedData.dokterDpjp || parsedData.dpjp || '-'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">🩺 Dokter Pemeriksa</span>
                    <span className="text-xs font-semibold text-slate-700 truncate block" title={parsedData.dokterPemeriksa || 'Tidak tertera'}>
                      {parsedData.dokterPemeriksa || '-'}
                    </span>
                  </div>
                </div>

                {/* Direct SIMRS Synchronization Actions */}
                <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#005d42]" />
                      Integrasi Instan ke Modul SIMRS RSUMB:
                    </span>
                    <span className="text-[10px] text-[#005d42] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs font-mono">
                      100% Sinkron
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleSyncToPatientQueue}
                      className="px-3.5 py-2.5 bg-[#005d42] hover:bg-[#004834] active:bg-[#003828] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Sinkron ke Antrean Pasien</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncToDraftMedicalLetter}
                      className="px-3.5 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-200" />
                      <span>Buat Draft Surat Admisi</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs font-medium">Belum ada data SPRI yang diproses.</p>
                <p className="text-[11px] text-slate-400">Silakan klik contoh cepat atau masukkan teks SPRI di kolom sebelah kiri.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Logs History Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#005d42]" />
            <h3 className="text-sm font-bold text-slate-800">Riwayat Sesi Pemesanan Kamar &amp; Coding Hari Ini</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-500 font-medium mr-1">Filter Penjamin:</span>
              {(['ALL', 'BPJS', 'UMUM', 'KLL / JR / LP'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setHistoryPenjaminFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    historyPenjaminFilter === cat
                      ? 'bg-[#005d42] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua' : cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Cetak Rekap Pasien sesuai filter aktif"
            >
              <Printer size={14} />
              <span>Cetak Rekap Pasien</span>
            </button>
          </div>
        </div>

        {filteredSessionLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">No. RM &amp; Nama Pasien</th>
                  <th className="py-2.5 px-3">Diagnosa &amp; ICD-10</th>
                  <th className="py-2.5 px-3">Penjamin / Kelas</th>
                  <th className="py-2.5 px-3">Kelengkapan Berkas</th>
                  <th className="py-2.5 px-3 w-36 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredSessionLogs.map((log) => {
                  const progress = getChecklistProgress(log);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{log.timestamp}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{log.pasien}</div>
                        <div className="font-mono text-[11px] text-slate-500">RM: {log.rm}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{log.diagnosa}</div>
                        <div className="text-[11px] text-slate-500">DPJP: {log.dpjp}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-[10px]">
                            {log.penjamin}
                          </span>
                          <div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-[#005d42] rounded-md font-bold text-[11px]">
                              Kelas {log.kelas}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-xl font-bold text-[11px] ${
                          progress.isComplete
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {progress.isComplete ? '🟢 LENGKAP 100%' : `⏳ PROSES (${progress.checked}/${progress.total})`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Cetak Struk Thermal (80mm) */}
                          <button
                            onClick={() => handlePrintThermalReceipt(log)}
                            className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-lg cursor-pointer transition-colors border border-amber-200"
                            title="Cetak Struk Thermal (80mm)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {/* Tombol Detail / Checklist (Ikon Mata) */}
                          <button
                            onClick={() => setSelectedDetailLog(log)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg cursor-pointer transition-colors border border-blue-200"
                            title="Detail & Checklist Berkas Admisi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Tombol Salin WA */}
                          <button
                            onClick={() => handleCopyFormatted(log.formattedText)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg cursor-pointer transition-colors border border-emerald-200"
                            title="Salin format WhatsApp"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada riwayat sesi pemesanan kamar yang tercatat pada sesi ini untuk filter tersebut.
          </div>
        )}
      </div>

      {/* MODAL: Detail & Checklist Berkas Administrasi Pasien */}
      {selectedDetailLog && (() => {
        const progress = getChecklistProgress(selectedDetailLog);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 bg-[#005d42] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-5 h-5 text-emerald-300" />
                  <h3 className="text-base font-bold">Detail &amp; Checklist Berkas Administrasi Pasien</h3>
                </div>
                <button
                  onClick={() => setSelectedDetailLog(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Nama Pasien:</span>
                      <b className="text-slate-900 text-sm">{selectedDetailLog.pasien}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block">No. Rekam Medis:</span>
                      <b className="font-mono text-slate-800">{selectedDetailLog.rm}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Dokter DPJP:</span>
                      <span className="text-slate-800 font-semibold">{selectedDetailLog.dpjp}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Penjamin &amp; Kelas:</span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-blue-700">
                        {selectedDetailLog.penjamin} (Kelas {selectedDetailLog.kelas})
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-400 block">Diagnosa &amp; ICD-10:</span>
                    <span className="font-bold text-slate-800">{selectedDetailLog.diagnosa}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Checklist Berkas Admisi ({selectedDetailLog.penjamin})
                    </h4>
                    <span className={`px-2.5 py-1 rounded-xl font-bold text-xs ${
                      progress.isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {progress.isComplete ? '🟢 LENGKAP 100%' : `⏳ PROSES ${progress.checked}/${progress.total}`}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                    {progress.items.map((itemKey) => {
                      const isChecked = !!selectedDetailLog.checklistState[itemKey];
                      return (
                        <label
                          key={itemKey}
                          className="flex items-center gap-3 text-xs text-slate-800 hover:bg-slate-50 p-2 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleChecklistItem(selectedDetailLog.id, itemKey)}
                            className="w-4 h-4 rounded text-[#005d42] focus:ring-[#005d42] cursor-pointer"
                          />
                          <span className={isChecked ? 'line-through text-slate-400 font-medium' : 'font-bold text-slate-800'}>
                            {itemKey}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => handlePrintThermalReceipt(selectedDetailLog)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Cetak Struk Thermal 80mm untuk pasien ini"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk Thermal</span>
                </button>
                <button
                  onClick={() => setSelectedDetailLog(null)}
                  className="px-5 py-2 bg-[#005d42] hover:bg-[#004834] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup &amp; Simpan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Cetak Rekap Pasien */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <style>{`
            @media print {
              @page {
                size: landscape;
                margin: 8mm 10mm;
              }
              html, body {
                width: 100%;
                height: auto;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden;
              }
              #print-content, #print-content * {
                visibility: visible;
              }
              #print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: #fff !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div id="print-content" className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-indigo-300" />
                <h3 className="text-base font-bold">Cetak Rekap Pasien &amp; Kelengkapan Berkas</h3>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Konten Modal Cetak */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-slate-50">
              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4 font-sans text-slate-800">
                <div className="text-center border-b border-slate-200 pb-4 space-y-1">
                  <h2 className="text-base font-bold uppercase text-[#005d42]">RSU MUHAMMADIYAH BABAT</h2>
                  <p className="text-xs text-slate-600">Jl. Raya Babat-Surabaya No. 15 Lamongan Telp. (0322) 451122</p>
                  <h1 className="text-sm font-extrabold uppercase pt-2">LAPORAN REKAP HARIAN PEMESANAN KAMAR &amp; KELENGKAPAN BERKAS ADMISI</h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Filter Penjamin Aktif: <b className="text-slate-800">{historyPenjaminFilter}</b> &bull; Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                        <th className="border border-slate-300 py-2 px-2 text-center w-10">No</th>
                        <th className="border border-slate-300 py-2 px-2.5 w-24">Waktu</th>
                        <th className="border border-slate-300 py-2 px-3">No. RM &amp; Nama Pasien</th>
                        <th className="border border-slate-300 py-2 px-3 w-44">Penjamin / Kelas</th>
                        <th className="border border-slate-300 py-2 px-3">CEKLIST KELENGKAPAN BERKAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessionLogs.length > 0 ? (
                        filteredSessionLogs.map((log, idx) => {
                          return (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="border border-slate-300 py-2 px-2 text-center font-bold">{idx + 1}</td>
                              <td className="border border-slate-300 py-2 px-2.5 font-mono text-[11px]">{log.timestamp}</td>
                              <td className="border border-slate-300 py-2 px-3">
                                <div className="font-bold text-slate-900">{log.pasien}</div>
                                <div className="font-mono text-[10px] text-slate-500">RM: {log.rm}</div>
                              </td>
                              <td className="border border-slate-300 py-2 px-3">
                                <span className="font-bold text-slate-900">{log.penjamin}</span>
                                <div className="text-[11px] text-slate-600 font-medium">Kelas {log.kelas}</div>
                              </td>
                              <td className="border border-slate-300 py-2 px-3">
                                <div className="space-y-1 font-mono text-[11.5px] leading-tight">
                                  {REKAP_CHECKLIST_ITEMS.map((item, itemIdx) => {
                                    const isChecked = !!log.checklistState[item];
                                    return (
                                      <div
                                        key={item}
                                        className={`flex items-center gap-2 ${
                                          itemIdx !== 0 ? 'border-t border-slate-200/60 pt-0.5' : ''
                                        }`}
                                      >
                                        <span
                                          className={`inline-block w-7 text-center font-black tracking-tight shrink-0 text-xs ${
                                            isChecked ? 'text-emerald-800' : 'text-slate-400'
                                          }`}
                                        >
                                          {isChecked ? '[✓]' : '[ ]'}
                                        </span>
                                        <span
                                          className={`font-mono text-xs ${
                                            isChecked ? 'font-bold text-slate-900' : 'text-slate-600'
                                          }`}
                                        >
                                          {item}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            Tidak ada data rekap pasien yang sesuai dengan filter {historyPenjaminFilter}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between pt-8 text-xs text-slate-700">
                  <div className="text-center space-y-12">
                    <p>Mengetahui,</p>
                    <p className="font-bold underline">Kepala Unit Admisi / Rawat Inap</p>
                  </div>
                  <div className="text-center space-y-12">
                    <p>Babat, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    <p className="font-bold underline">Petugas Pendaftaran / Kasir</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between no-print">
              <span className="text-xs text-slate-500">Total {filteredSessionLogs.length} pasien tercatat dalam rekap ini.</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={handlePrintBatchThermal}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Cetak format struk printer thermal 80mm roll"
                >
                  <Printer size={14} />
                  <span>Cetak Thermal (80mm)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Cetak format Landscape (A4/F4)"
                >
                  <Printer size={14} />
                  <span>Cetak Landscape (A4/F4)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pustaka Cepat Kode ICD-10 */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#005d42] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-emerald-300" />
                <h3 className="text-base font-bold">Pustaka Cepat Kode ICD-10 Spesialisasi RSUMB</h3>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {/* Search & Specialty Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchLibraryQuery}
                    onChange={(e) => setSearchLibraryQuery(e.target.value)}
                    placeholder="Cari kode atau nama diagnosa..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'Sp.PD', 'Sp.N', 'Sp.A', 'Sp.OG', 'Sp.B', 'Sp.OT', 'Sp.P'].map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialtyFilter(spec)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedSpecialtyFilter === spec
                          ? 'bg-[#005d42] text-white shadow'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* ICD Table / Cards */}
              <div className="space-y-2">
                {filteredLibrary.length > 0 ? (
                  filteredLibrary.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectIcdFromLibrary(item)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-emerald-100 text-[#005d42] px-2 py-0.5 rounded">
                            {item.code}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{item.diagnosis}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.specialty}
                        </span>
                        <span className="text-xs font-bold text-[#005d42] opacity-0 group-hover:opacity-100 transition-opacity">
                          Pilih →
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Tidak ditemukan kode ICD-10 yang sesuai dengan kata kunci / filter tersebut.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Menampilkan {filteredLibrary.length} kode ICD-10 pustaka RSUMB</span>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
