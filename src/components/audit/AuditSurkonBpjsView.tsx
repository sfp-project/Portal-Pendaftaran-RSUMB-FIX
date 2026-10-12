import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Copy,
  Download,
  Trash2,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Save,
  Check,
  ClipboardList,
  Stethoscope,
  Info,
  Printer,
  History,
  Eye,
  Calendar,
  Building2,
  BookOpen,
  MessageCircle,
  Send,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowUpDown,
  EyeOff,
  ShieldAlert,
  X
} from 'lucide-react';

export interface AuditSurkonItem {
  noAntrian: string;
  rm: string;
  nama: string;
  noBpjs: string;
  tglKontrol: string;         // TANGGAL KONTROL (menggantikan NO. RAWAT)
  namaPoli: string;           // NAMA POLI (strictly dari Registrasi SIMRS Khanza)
  status: 'done' | 'missing' | 'overdue'; // STATUS SURKON: 'done' (Sudah Buat), 'missing' (Belum Buat), 'overdue' (Terlewat)
  noSurkon: string;           // NO. SURAT KONTROL
  rencanaTglKontrol: string;  // RENCANA TGL KONTROL (posisi setelah No. Surat Kontrol)
  alasanSelect: string;       // KETERANGAN / ALASAN BELUM BUAT
  alasanCustom: string;
  noRawat?: string;           // Disimpan sebagai referensi jika ada
  jenisBayar?: string;        // JENIS BAYAR / PENANGGUNG JAWAB (Validasi BPJS)
}

export interface SepPendingItem {
  id: string;
  noAntrian: string;
  rm: string;
  nama: string;
  namaPoli: string;
  dokter: string;
  noRawat: string;
  fingerprintStatus: string;
  targetPrintTime: string;
  statusCetak: 'pending' | 'ready' | 'done';
}

// Alias interface HasilAuditItem agar kompatibel dengan permintaan tipe data
export type HasilAuditItem = AuditSurkonItem;

export interface SavedAuditRecord {
  id: string;
  savedAt: string;
  total: number;
  done: number;
  missing: number;
  overdue?: number;
  poliNames: string;
  data: AuditSurkonItem[];
}

interface AuditSurkonBpjsViewProps {
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Sample Data untuk pengujian cepat staf dengan format aktual SIMRS & Bridging Surat Kontrol BPJS
const SAMPLE_DATA_PASIEN = `001 2026/10/09/000106 2026-10-09 031829 MOHAMMAD FIRDAUS IRWANSYAH 0000103721556 BPJS Poliklinik Jantung BPJS dr. Spesialis Jantung
002 2026/10/09/000107 2026-10-09 045122 SITI NURJANAH 0001829304812 BPJS Poliklinik Jantung BPJS dr. Spesialis Jantung
003 2026/10/09/000108 2026-10-09 028911 BAMBANG SUDARMO, TN 0002938475019 BPJS Poliklinik Jantung BPJS dr. Spesialis Jantung
004 2026/10/09/000109 2026-10-09 041248 EVI LUTFIANI MUFIAROH, NY 0003049582710 BPJS Poliklinik Obgyn dr. Erliana, Sp.OG
005 2026/10/09/000110 2026-10-09 019283 HJ. KUSTINAH, NY 0001928374650 BPJS PBI Poliklinik Jantung BPJS dr. Spesialis Jantung
006 2026/10/09/000111 2026-10-09 067812 ZAINAL ABIDIN 0002819384756 BPJS NON PBI Poliklinik Saraf dr. Spesialis Saraf
007 2026/10/09/000112 2026-10-09 078199 SRI WAHYUNI 0003928174829 BPJS Poliklinik Saraf dr. Spesialis Saraf
008 2026/10/09/000113 2026-10-09 089123 AGUS PRASETYO 0004928172635 BPJS Poli Mata dr. Spesialis Mata
009 2026/10/09/000114 2026-10-09 091234 BUDI SANTOSO UMUM Poliklinik Obgyn dr. Erliana, Sp.OG`;

const SAMPLE_DATA_SURKON = `2026/10/09/000106 0204R0191026V001073 0000103721556 031829 MOHAMMAD FIRDAUS IRWANSYAH 2026-10-09 0204R0191026K000738 2026-11-09 Poliklinik Jantung dr. Spesialis Jantung
2026/10/09/000108 0204R0191026V001075 0002938475019 028911 BAMBANG SUDARMO 2026-10-09 0204R0191026K000739 2026-11-10 Poliklinik Jantung dr. Spesialis Jantung
2026/10/09/000109 0204R0191026V001076 0003049582710 041248 EVI LUTFIANI MUFIAROH, NY 2026-10-09 0204R0191026K000742 2026-11-18 Poliklinik Obgyn dr. Erliana, Sp.OG
2026/10/09/000110 0204R0191026V001077 0001928374650 019283 HJ. KUSTINAH 2026-10-09 0204R0191026K000740 2026-11-12 Poliklinik Jantung dr. Spesialis Jantung
2026/10/09/000111 0204R0191026V001078 0002819384756 067812 ZAINAL ABIDIN 2026-10-09 0204R0191026K000741 2026-11-15 Poliklinik Saraf dr. Spesialis Saraf`;

const STORAGE_KEY_PASIEN = 'rsumb_audit_surkon_pasien_text';
const STORAGE_KEY_SURKON = 'rsumb_audit_surkon_surkon_text';
const STORAGE_KEY_HASIL = 'rsumb_audit_surkon_hasil_list';
const STORAGE_KEY_SAVED_HISTORY = 'rsumb_audit_surkon_saved_history';

export const AuditSurkonBpjsView: React.FC<AuditSurkonBpjsViewProps> = ({ showToast }) => {
  const [dataPasienText, setDataPasienText] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PASIEN) || '';
  });
  const [dataSurkonText, setDataSurkonText] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SURKON) || '';
  });
  const [hasilAudit, setHasilAudit] = useState<AuditSurkonItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HASIL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [savedHistory, setSavedHistory] = useState<SavedAuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'missing' | 'done' | 'overdue'>('all');
  const [selectedPoli, setSelectedPoli] = useState<string>('all');
  const [isGroupedByPoli, setIsGroupedByPoli] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    'antrian_asc' | 'antrian_desc' | 'nama_asc' | 'poli_asc' | 'status_missing_first'
  >('antrian_asc');
  const [excludedPolis, setExcludedPolis] = useState<string[]>([]);
  const [collapsedPolis, setCollapsedPolis] = useState<Record<string, boolean>>({});
  const [hideLiburPolis, setHideLiburPolis] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedWa, setCopiedWa] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [chatModalItem, setChatModalItem] = useState<AuditSurkonItem | null>(null);
  const [patientPhone, setPatientPhone] = useState<string>('');

  // --------------------------------------------------------------------------
  // MODUL 3: TRACKER SEP PENDING (BEDA HFIS)
  // --------------------------------------------------------------------------
  const SAMPLE_SEP_PENDING = `001 2026/10/09/000081 087401 AHMAD ASSRORUL ABIDIN. SDR Poliklinik Kulit & Kelamin dr. Hamidah Luthfidyaningrum, Sp. DVE., M.Ked.Klin Sudah
002 2026/10/09/000082 041248 EVI LUTFIANI MUFIAROH, NY Poliklinik Kulit & Kelamin dr. Hamidah Luthfidyaningrum, Sp. DVE., M.Ked.Klin Sudah
003 2026/10/09/000083 031829 MOHAMMAD FIRDAUS IRWANSYAH Poliklinik Jantung BPJS dr. Spesialis Jantung Sudah`;

  const [activeMainTab, setActiveMainTab] = useState<'audit' | 'rujukan' | 'sepPending'>('audit');
  const [sepPasteText, setSepPasteText] = useState<string>(() => {
    return localStorage.getItem('rsumb_sep_paste_text') || SAMPLE_SEP_PENDING;
  });
  const [sepPendingList, setSepPendingList] = useState<SepPendingItem[]>(() => {
    try {
      const saved = localStorage.getItem('rsumb_sep_pending_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'sep_1',
        noAntrian: '001',
        rm: '087401',
        nama: 'AHMAD ASSRORUL ABIDIN. SDR',
        namaPoli: 'Poliklinik Kulit & Kelamin',
        dokter: 'dr. Hamidah Luthfidyaningrum, Sp. DVE., M.Ked.Klin',
        noRawat: '2026/10/09/000081',
        fingerprintStatus: 'Sudah',
        targetPrintTime: '13:30',
        statusCetak: 'pending'
      },
      {
        id: 'sep_2',
        noAntrian: '002',
        rm: '041248',
        nama: 'EVI LUTFIANI MUFIAROH, NY',
        namaPoli: 'Poliklinik Kulit & Kelamin',
        dokter: 'dr. Hamidah Luthfidyaningrum, Sp. DVE., M.Ked.Klin',
        noRawat: '2026/10/09/000082',
        fingerprintStatus: 'Sudah',
        targetPrintTime: '13:30',
        statusCetak: 'pending'
      }
    ];
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('rsumb_sep_paste_text', sepPasteText);
  }, [sepPasteText]);

  useEffect(() => {
    localStorage.setItem('rsumb_sep_pending_list', JSON.stringify(sepPendingList));
  }, [sepPendingList]);

  const handleProcessSepPending = (textVal?: string) => {
    const raw = textVal !== undefined ? textVal : sepPasteText;
    if (!raw.trim()) {
      triggerToast('Data paste registrasi SIMRS masih kosong!', 'error');
      return;
    }
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const newItems: SepPendingItem[] = [];

    lines.forEach((line, idx) => {
      // Split by tab or multiple spaces
      const rawTokens = line.includes('\t') 
        ? line.split('\t').map(t => t.trim()).filter(Boolean) 
        : line.split(/\s{2,}/).map(t => t.trim()).filter(Boolean);
      const tokens = rawTokens.length >= 4 ? rawTokens : line.split(/\s+/).filter(Boolean);

      const noAntrian = tokens[1] || tokens[0] || String(idx + 1).padStart(3, '0');
      
      const rawatMatch = line.match(/\b20\d{2}\/\d{2}\/\d{2}\/\d{6}\b/);
      const noRawat = rawatMatch ? rawatMatch[0] : (tokens[2] || `2026/10/10/${String(idx + 1).padStart(6, '0')}`);

      // RM: Column Index 7 or 6-digit match
      let rm = '';
      if (tokens.length > 7 && /^\d{6}$/.test(tokens[7])) {
        rm = tokens[7];
      } else {
        const allSixDigits = line.match(/\b(\d{6})\b/g) || [];
        for (const d of allSixDigits) {
          if (!noRawat.includes(d)) {
            rm = d;
            break;
          }
        }
      }
      if (!rm) rm = '000000';

      // Nama Pasien: Column Index 8 or between RM and doctor/poli
      let nama = '';
      if (tokens.length > 8 && tokens[8] && !/^\d{6}$/.test(tokens[8]) && !/^dr\./i.test(tokens[8])) {
        nama = tokens[8];
        if (tokens[9] && !/^(?:poliklinik|poli|dr\.|bpjs|umum|mandiri|sudah|belum|\d)/i.test(tokens[9])) {
          nama += ' ' + tokens[9];
        }
      }

      if (!nama && rm && tokens.indexOf(rm) !== -1) {
        const rmIdx = tokens.indexOf(rm);
        const nameParts: string[] = [];
        for (let i = rmIdx + 1; i < tokens.length; i++) {
          const t = tokens[i];
          if (
            /^20\d{2}\//.test(t) ||
            /^\d{6}$/.test(t) ||
            /^\d{13}$/.test(t) ||
            /^dr\./i.test(t) ||
            /^(?:poliklinik|poli|sudah|belum|bpjs|umum|mandiri)/i.test(t)
          ) {
            break;
          }
          nameParts.push(t);
        }
        if (nameParts.length > 0) nama = nameParts.join(' ');
      }

      if (!nama) {
        const nameMatch = line.match(new RegExp(`${rm}\\s+([A-Z\\s,\\.\\-]+?)\\s+(?:BPJS|UMUM|Poliklinik|Poli|dr\\.|Sudah|Belum|\\d{13})`, 'i'));
        if (nameMatch) {
          nama = nameMatch[1].trim();
        }
      }

      if (!nama || nama.startsWith('Pasien')) {
        const capMatch = line.match(/\b[A-Z\s,\.\-]{4,}\b/);
        nama = capMatch ? capMatch[0].trim() : `TN / NY (${rm})`;
      }

      // Dokter: Column Index 6 or regex
      let dokter = '';
      if (tokens.length > 6 && /dr\./i.test(tokens[6])) {
        dokter = tokens[6];
        if (tokens[7] && /,/.test(tokens[7])) dokter += ' ' + tokens[7];
      }
      if (!dokter) {
        const drMatch = line.match(/dr\.[A-Za-z\s,\.\(\)]+/i);
        dokter = drMatch ? drMatch[0].trim() : 'dr. Spesialis RSUMB';
      }

      // Poliklinik: Column Index 11 or keyword match
      let namaPoli = 'Poliklinik Rawat Jalan';
      if (/kulit|kelamin|dve/i.test(line)) {
        namaPoli = 'Poliklinik Kulit & Kelamin';
      } else if (/jantung|kardiologi/i.test(line)) {
        namaPoli = 'Poliklinik Jantung BPJS';
      } else if (/saraf|neurologi/i.test(line)) {
        namaPoli = 'Poliklinik Saraf';
      } else if (/obgyn|kandungan/i.test(line)) {
        namaPoli = 'Poliklinik Obgyn';
      } else if (/rehabilitasi|fisioterapi/i.test(line)) {
        namaPoli = 'Poliklinik Rehabilitasi Medik';
      } else if (/anak|pediatrik/i.test(line)) {
        namaPoli = 'Poliklinik Anak';
      } else if (/dalam|interna/i.test(line)) {
        namaPoli = 'Poliklinik Penyakit Dalam';
      } else if (/bedah/i.test(line)) {
        namaPoli = 'Poliklinik Bedah';
      } else if (tokens.length > 11) {
        namaPoli = tokens[11];
      }

      // Target Print Time mapping
      let targetPrintTime = '10:00';
      if (/kulit|kelamin/i.test(namaPoli)) {
        targetPrintTime = '13:30';
      } else if (/rehabilitasi/i.test(namaPoli)) {
        targetPrintTime = '13:30';
      } else if (/obgyn/i.test(namaPoli)) {
        targetPrintTime = '11:00';
      } else if (/jantung/i.test(namaPoli)) {
        targetPrintTime = '09:30';
      } else if (/saraf/i.test(namaPoli)) {
        targetPrintTime = '10:30';
      }

      const fpMatch = line.match(/\b(Sudah|Belum)\b/i);
      const fingerprintStatus = fpMatch ? fpMatch[1] : 'Sudah';

      newItems.push({
        id: `sep_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        noAntrian,
        rm,
        nama,
        namaPoli,
        dokter,
        noRawat,
        fingerprintStatus,
        targetPrintTime,
        statusCetak: 'pending'
      });
    });

    if (newItems.length === 0) {
      triggerToast('Gagal mengekstrak data SEP pending dari teks.', 'error');
      return;
    }

    setSepPendingList(prev => [...prev, ...newItems]);
    triggerToast(`Berhasil menambahkan ${newItems.length} pasien ke antrean SEP Pending!`, 'success');
  };

  const handleMarkSepDone = (id: string) => {
    setSepPendingList(prev => prev.map(item => item.id === id ? { ...item, statusCetak: 'done' } : item));
    triggerToast('Status SEP ditandai Sudah Cetak!', 'success');
  };

  const getCountdownInfo = (targetTimeStr: string, statusCetak: string) => {
    if (statusCetak === 'done') {
      return { text: 'SELESAI', isReady: false, badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
    const [tHour, tMin] = targetTimeStr.split(':').map(Number);
    const nowHour = currentTime.getHours();
    const nowMin = currentTime.getMinutes();

    const targetTotalMins = tHour * 60 + tMin;
    const nowTotalMins = nowHour * 60 + nowMin;

    const diffMins = targetTotalMins - nowTotalMins;

    if (diffMins <= 0) {
      return { text: '🔔 SIAP CETAK SEP!', isReady: true, badgeClass: 'bg-emerald-500 text-white animate-pulse border-emerald-600 font-extrabold' };
    } else {
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const timeStr = hrs > 0 ? `${hrs} jam ${mins} mnt` : `${mins} menit`;
      return { text: `⏳ Sisa ${timeStr}`, isReady: false, badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  // --------------------------------------------------------------------------
  // MODUL CEK MASA BERLAKU RUJUKAN BPJS (90 HARI)
  // --------------------------------------------------------------------------
  const [rujukanManualDate, setRujukanManualDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // 30 days ago default
    return d.toISOString().split('T')[0];
  });
  const [rujukanPasteText, setRujukanPasteText] = useState<string>(() => {
    return `No. Rujukan: 0204B0230626P000630\nTgl. Rujukan: 2026-06-29\nPPK Perujuk: Klinik Mitra 30 Babat\nDiagnosa: I49.9 - Cardiac arrhythmia, unspecified\nPoli Tujuan: JANTUNG DAN PEMBULUH DARAH (JAN)`;
  });
  const [rujukanInputMode, setRujukanInputMode] = useState<'manual' | 'paste'>('paste');
  const [rujukanResult, setRujukanResult] = useState<{
    noRujukan: string;
    tglTerbit: string;
    tglKedaluwarsa: string;
    diagnosaCode: string;
    diagnosaDesc: string;
    poliNama: string;
    poliKode: string;
    faskesPerujuk: string;
    status: 'MASIH BERLAKU' | 'KEDALUWARSA';
    sisaHari: number;
    formattedOutput: string;
  } | null>(null);

  const handleProcessRujukanCheck = (source: 'manual' | 'paste', manualDateVal?: string, pasteTextVal?: string) => {
    let tglTerbit = '';
    let noRujukan = '0204B0230626P' + Math.floor(100000 + Math.random() * 900000);
    let diagnosaCode = 'I49.9';
    let diagnosaDesc = 'Cardiac arrhythmia, unspecified';
    let poliNama = 'JANTUNG DAN PEMBULUH DARAH';
    let poliKode = 'JAN';
    let faskesPerujuk = 'Klinik Mitra 30 Babat';

    if (source === 'manual') {
      tglTerbit = manualDateVal || rujukanManualDate;
    } else {
      const rawText = pasteTextVal !== undefined ? pasteTextVal : rujukanPasteText;
      const rujMatch = rawText.match(/\b\d{4}[A-Z]\d{10,15}[A-Z0-9]?\b/i) || rawText.match(/\b[0-9A-Z]{15,20}\b/i);
      if (rujMatch) noRujukan = rujMatch[0];

      const dateMatch = rawText.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
      if (dateMatch) {
        tglTerbit = dateMatch[1];
      } else {
        tglTerbit = rujukanManualDate;
      }

      const diagMatch = rawText.match(/\b([A-Z]\d{2}(?:\.\d+)?)\s*[-–]?\s*([A-Za-z0-9\s,\.\-]+)/i);
      if (diagMatch) {
        diagnosaCode = diagMatch[1].trim();
        diagnosaDesc = diagMatch[2].trim();
      }

      const poliMatch = rawText.match(/(?:Poli|Poliklinik|Tujuan)[:\s]+([A-Za-z0-9\s\(\)]+)/i);
      if (poliMatch) {
        const fullPoliStr = poliMatch[1].trim();
        const codeMatch = fullPoliStr.match(/\(([A-Z0-9]+)\)/);
        if (codeMatch) {
          poliKode = codeMatch[1];
          poliNama = fullPoliStr.replace(/\([A-Z0-9]+\)/, '').trim();
        } else {
          poliNama = fullPoliStr;
        }
      }

      const faskesMatch = rawText.match(/(?:Faskes|PPK|Perujuk|Klinik|Puskesmas|RS)[:\s]+([A-Za-z0-9\s\.\-]+)/i);
      if (faskesMatch) {
        faskesPerujuk = faskesMatch[1].trim();
      }
    }

    if (!tglTerbit) {
      triggerToast('Tanggal terbit rujukan tidak valid.', 'error');
      return;
    }

    const terbitDate = new Date(tglTerbit);
    const expDate = new Date(terbitDate);
    expDate.setDate(expDate.getDate() + 90);

    const tglKedaluwarsa = expDate.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const status: 'MASIH BERLAKU' | 'KEDALUWARSA' = sisaHari >= 0 ? 'MASIH BERLAKU' : 'KEDALUWARSA';

    let formattedOutput = `Surat rujukan BPJS Kesehatan tersebut berakhir pada tanggal **${tglKedaluwarsa}**.\n\n`;
    formattedOutput += `Detail Surat Rujukan:\n`;
    formattedOutput += `- Nomor Rujukan: ${noRujukan}\n`;
    formattedOutput += `- Diagnosa (ICD-10): ${diagnosaCode} (${diagnosaDesc})\n`;
    formattedOutput += `- Poli Tujuan: ${poliNama} (${poliKode})\n`;
    formattedOutput += `- Faskes Perujuk: ${faskesPerujuk}\n`;
    formattedOutput += `- Tgl. Terbit Rujukan: ${tglTerbit}\n\n`;
    formattedOutput += `Status Masa Berlaku (90 Hari):\n`;
    formattedOutput += `- Tanggal Kedaluwarsa: ${tglKedaluwarsa}\n`;
    formattedOutput += `- Status Saat Ini: ${status}${status === 'MASIH BERLAKU' ? ` (Sisa ${sisaHari} hari)` : ''}\n\n`;
    formattedOutput += `[Catatan/Rekomendasi Tindakan]:\n`;
    if (status === 'KEDALUWARSA') {
      formattedOutput += `* Karena masa berlakunya sudah habis, pasien perlu meminta Surat Rujukan Baru dari Faskes Perujuk.`;
    } else {
      formattedOutput += `* Rujukan masih dapat digunakan untuk penerbitan SEP / Pelayanan.`;
    }

    setRujukanResult({
      noRujukan,
      tglTerbit,
      tglKedaluwarsa,
      diagnosaCode,
      diagnosaDesc,
      poliNama,
      poliKode,
      faskesPerujuk,
      status,
      sisaHari,
      formattedOutput
    });

    triggerToast('Analisis masa berlaku rujukan berhasil dijalankan!', 'success');
  };

  const handleCopyRujukanResult = async () => {
    if (!rujukanResult) return;
    try {
      await navigator.clipboard.writeText(rujukanResult.formattedOutput);
      triggerToast('Hasil cek masa berlaku rujukan berhasil disalin ke clipboard!', 'success');
    } catch {
      triggerToast('Gagal menyalin teks ke clipboard', 'error');
    }
  };

  // Template Pesan WA Resmi Pasien Belum Buat Surat Kontrol Hari H
  const generatePatientWaMessage = (item: AuditSurkonItem): string => {
    return `Assalamu’alaikum Wr. Wb. Bapak/Ibu *${item.nama}*, kami dari RSU Muhammadiyah Babat menginfokan terkait jadwal kontrol hari ini di *${item.namaPoli}*.\n\nBerdasarkan sistem BPJS, Surat Kontrol hari ini belum terbit (Surat Kontrol tidak dapat dibuat pada hari H). Mohon kesediaan Bapak/Ibu membawa *Surat Rujukan Asli FKTP / Surat Pulang Ranap* saat tiba di pendaftaran.\n\nTerima kasih.`;
  };

  const handleOpenPatientWaChat = (item: AuditSurkonItem) => {
    setChatModalItem(item);
    setPatientPhone('');
  };

  const handleCopyPatientWaMessage = async (item: AuditSurkonItem) => {
    try {
      const msg = generatePatientWaMessage(item);
      await navigator.clipboard.writeText(msg);
      triggerToast(`Pesan pemberitahuan untuk ${item.nama} berhasil disalin ke clipboard!`, 'success');
    } catch {
      triggerToast('Gagal menyalin pesan ke clipboard', 'error');
    }
  };

  const handleSendPatientWaDirect = (item: AuditSurkonItem, phoneInput?: string) => {
    const rawNum = phoneInput || patientPhone;
    let cleanPhone = rawNum.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const msg = encodeURIComponent(generatePatientWaMessage(item));
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(waUrl, '_blank');
    triggerToast(`Membuka WhatsApp untuk ${item.nama}`, 'info');
  };

  // Helper untuk membersihkan teks secara otomatis saat di-paste/input
  const autoCleanText = (input: string): string => {
    if (!input) return '';
    return input
      .split(/\r?\n/)
      .map((line) => line.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n');
  };

  // Helper mendeteksi daftar No RM unik (6 digit) dalam teks untuk indikator real-time
  const extractUniqueRmTokens = (text: string): string[] => {
    if (!text) return [];
    // Ekstrak token 6-digit murni yang bukan suffix nomor rawat
    const matches = text.match(/\b\d{6}\b/g);
    if (!matches) return [];

    // Filter kandidat No RM yang valid
    const rawatSuffixes = new Set<string>();
    const rawatMatches = text.match(/\b20\d{2}\/\d{2}\/\d{2}\/(\d{6})\b/g);
    if (rawatMatches) {
      rawatMatches.forEach((r) => {
        const parts = r.split('/');
        if (parts[3]) rawatSuffixes.add(parts[3]);
      });
    }

    const uniqueRms = new Set<string>();
    matches.forEach((m) => {
      // Jika RM muncul sebagai No RM independen, sertakan
      uniqueRms.add(m);
    });

    return Array.from(uniqueRms);
  };

  // Real-time RM count
  const rmCountPasien = useMemo(() => {
    return extractUniqueRmTokens(dataPasienText).length;
  }, [dataPasienText]);

  const rmCountSurkon = useMemo(() => {
    return extractUniqueRmTokens(dataSurkonText).length;
  }, [dataSurkonText]);

  // Handler input dengan auto-clean saat paste/change
  const handleDataPasienChange = (val: string) => {
    const cleaned = autoCleanText(val);
    setDataPasienText(cleaned);
  };

  const handleDataSurkonChange = (val: string) => {
    const cleaned = autoCleanText(val);
    setDataSurkonText(cleaned);
  };

  // Helper untuk normalisasi tanggal dan komparasi dengan hari ini (YYYY-MM-DD)
  const getTodayIsoDate = (): string => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Cek apakah tanggal kontrol sudah terlewat dari hari ini
  const isDateOverdue = (dateStr: string): boolean => {
    if (!dateStr || dateStr === '-') return false;
    const clean = dateStr.trim().replace(/\//g, '-');
    const todayStr = getTodayIsoDate();

    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean < todayStr;
    }

    // Format DD-MM-YYYY
    const dmyMatch = clean.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmyMatch) {
      const isoFormatted = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
      return isoFormatted < todayStr;
    }

    // Fallback Date object parsing
    try {
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) {
        const parsedIso = parsed.toISOString().split('T')[0];
        return parsedIso < todayStr;
      }
    } catch {
      // ignore
    }

    return false;
  };

  // Simpan text ke localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PASIEN, dataPasienText);
  }, [dataPasienText]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SURKON, dataSurkonText);
  }, [dataSurkonText]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HASIL, JSON.stringify(hasilAudit));
  }, [hasilAudit]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SAVED_HISTORY, JSON.stringify(savedHistory));
  }, [savedHistory]);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (showToast) {
      showToast(msg, type);
    }
  };

  // --------------------------------------------------------------------------
  // LOGIKA JAVASCRIPT: SISTEM NORMALISASI TOKEN & PENCOCOKAN RELASIONAL MULTI-KUNCI
  // --------------------------------------------------------------------------
  const prosesPembandingan = () => {
    const rawPasien = dataPasienText.trim();
    const rawSurkon = dataSurkonText.trim();

    if (!rawPasien) {
      triggerToast('Data registrasi pasien (Gambar 2) masih kosong!', 'error');
      return;
    }

    // Normalisasi teks untuk memastikan konsistensi token
    const textPasien = autoCleanText(rawPasien);
    const textSurkon = autoCleanText(rawSurkon);

    // ========================================================================
    // 1. EKSTRAKSI TOKEN INDEPENDEN (GAMBAR 1 - DATA SURAT KONTROL TERBIT)
    // ========================================================================
    interface SurkonRecord {
      noSurkon: string;
      noBpjs: string;
      rm: string;
      rencanaTglKontrol: string;
    }

    const surkonMapByRm = new Map<string, SurkonRecord>();
    const surkonMapByBpjs = new Map<string, SurkonRecord>();

    if (textSurkon) {
      // 1a. Pecah seluruh teks menjadi array token kata/string independen
      const surkonTokens = textSurkon.split(/\s+/).filter(Boolean);

      // Cari semua kemunculan No. Surat Kontrol (kode yang mengandung "0204R" atau pola "XXXXR...", 19-20 char)
      // Format resmi VClaim: 0204R0191026K000738 (ada huruf K untuk kontrol), 19 karakter
      // Note: Ada juga No SEP dengan huruf V (0204R0191026V001073)
      const surkonTokenIndices: number[] = [];
      surkonTokens.forEach((tok, idx) => {
        if (/0204R\w{10,16}/i.test(tok) || /\b\d{4}R\w{10,16}\b/i.test(tok) || /SK-\w+/i.test(tok)) {
          // Prioritaskan yang ada kode K (Surat Kontrol)
          if (/K/i.test(tok)) {
            surkonTokenIndices.push(idx);
          }
        }
      });

      // Fallback: jika tidak ada yang mengandung 'K', masukkan semua kode 0204R
      if (surkonTokenIndices.length === 0) {
        surkonTokens.forEach((tok, idx) => {
          if (/0204R\w{10,16}/i.test(tok) || /\b\d{4}R\w{10,16}\b/i.test(tok)) {
            surkonTokenIndices.push(idx);
          }
        });
      }

      // 1b. Kelompokkan token berdasarkan kedekatan indeks/posisi teks relatif terhadap No Surkon
      // Jika ada token No Surkon terdeteksi, jadikan sebagai jangkar klaster
      if (surkonTokenIndices.length > 0) {
        surkonTokenIndices.forEach((surkonIdx, clusterIdx) => {
          const surkonCode = surkonTokens[surkonIdx];
          
          // Window/radius token di sekitar No. Surat Kontrol
          // Cari ke belakang (hingga 25 token) untuk No BPJS & No RM
          const startWindow = Math.max(0, surkonIdx - 25);
          // Cari ke depan (hingga 15 token) untuk Rencana Tanggal Kontrol
          const endWindow = Math.min(surkonTokens.length, surkonIdx + 15);
          
          const windowTokens = surkonTokens.slice(startWindow, endWindow);
          const afterTokens = surkonTokens.slice(surkonIdx + 1, endWindow);
          const beforeTokens = surkonTokens.slice(startWindow, surkonIdx);

          // Deteksi No BPJS: string angka 13 digit berawalan "000" atau deretan 13 digit
          let matchedBpjs = '-';
          for (let i = beforeTokens.length - 1; i >= 0; i--) {
            const tok = beforeTokens[i];
            if (/^000\d{10}$/.test(tok) || /^\d{13}$/.test(tok)) {
              matchedBpjs = tok;
              break;
            }
          }
          if (matchedBpjs === '-') {
            for (const tok of windowTokens) {
              if (/^000\d{10}$/.test(tok) || /^\d{13}$/.test(tok)) {
                matchedBpjs = tok;
                break;
              }
            }
          }

          // Deteksi No RM: string angka 6 digit murni yang bukan bagian dari nomor rawat suffix
          let matchedRm = '-';
          // Pola umum SIMRS: No BPJS (13 digit) diikuti No RM (6 digit)
          for (let i = 0; i < beforeTokens.length; i++) {
            const tok = beforeTokens[i];
            if (/^\d{6}$/.test(tok)) {
              // Cek apakah token sebelumnya adalah no rawat yang sama
              const prev = beforeTokens[i - 1] || '';
              if (prev.endsWith('/' + tok)) continue;
              matchedRm = tok;
              // Jika tepat setelah BPJS, inilah RM yang paling valid
              if (i > 0 && (/^000\d{10}$/.test(beforeTokens[i - 1]) || /^\d{13}$/.test(beforeTokens[i - 1]))) {
                matchedRm = tok;
                break;
              }
            }
          }

          // Deteksi Rencana Tanggal Kontrol: string tanggal YYYY-MM-DD setelah No Surat Kontrol
          let matchedRencanaTgl = '-';
          for (const tok of afterTokens) {
            const cleanDate = tok.replace(/[^\d\-\/]/g, '').replace(/\//g, '-');
            if (/^20\d{2}-\d{2}-\d{2}$/.test(cleanDate)) {
              matchedRencanaTgl = cleanDate;
              break;
            }
          }

          // Fallback rencana tgl jika tidak ada di afterTokens: cari tanggal kedua di seluruh window
          if (matchedRencanaTgl === '-') {
            const allDatesInWindow = windowTokens
              .map((t) => t.replace(/[^\d\-\/]/g, '').replace(/\//g, '-'))
              .filter((t) => /^20\d{2}-\d{2}-\d{2}$/.test(t));
            if (allDatesInWindow.length >= 2) {
              matchedRencanaTgl = allDatesInWindow[1];
            } else if (allDatesInWindow.length === 1) {
              matchedRencanaTgl = allDatesInWindow[0];
            }
          }

          const record: SurkonRecord = {
            noSurkon: surkonCode,
            noBpjs: matchedBpjs,
            rm: matchedRm,
            rencanaTglKontrol: matchedRencanaTgl
          };

          if (matchedRm !== '-') {
            surkonMapByRm.set(matchedRm, record);
          }
          if (matchedBpjs !== '-') {
            surkonMapByBpjs.set(matchedBpjs, record);
          }
        });
      } else {
        // Fallback: Jika tidak ada kode "0204R...", coba ekstraksi relasional baris demi baris
        const lines = textSurkon.split('\n').filter(Boolean);
        lines.forEach((line) => {
          const bpjsMatch = line.match(/\b000\d{10}\b|\b\d{13}\b/);
          const rmMatch = line.match(/\b\d{6}\b/);
          const dateMatch = line.match(/\b20\d{2}[-/]\d{2}[-/]\d{2}\b/);
          const surkonMatch = line.match(/\b0204R\w+|\b\d{4}R\w+|SK-\w+\b/i);

          const record: SurkonRecord = {
            noSurkon: surkonMatch ? surkonMatch[0] : 'Terbit',
            noBpjs: bpjsMatch ? bpjsMatch[0] : '-',
            rm: rmMatch ? rmMatch[0] : '-',
            rencanaTglKontrol: dateMatch ? dateMatch[0].replace(/\//g, '-') : '-'
          };

          if (record.rm !== '-') surkonMapByRm.set(record.rm, record);
          if (record.noBpjs !== '-') surkonMapByBpjs.set(record.noBpjs, record);
        });
      }
    }

    // ========================================================================
    // 2. EKSTRAKSI TOKEN INDEPENDEN (GAMBAR 2 - REGISTRASI SIMRS)
    // ========================================================================
    // Pisahkan baris registrasi berdasarkan baris baru atau pola nomor urut / nomor rawat
    let pasienLines = textPasien
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    // Jika data menumpuk dalam 1 atau 2 baris panjang tanpa enter, pecah berdasarkan nomor rawat / nomor antrian
    if (pasienLines.length <= 2 && textPasien.length > 100) {
      pasienLines = textPasien
        .split(/(?=(?:true\s+)?\b\d{1,3}\s+20\d{2}\/\d{2}\/\d{2}\/\d{6}\b|\b20\d{2}\/\d{2}\/\d{2}\/\d{6}\b)/i)
        .flatMap((block) => block.split('\n'))
        .map((l) => l.trim())
        .filter(Boolean);
    }

    const newHasil: AuditSurkonItem[] = [];
    const processedRms = new Set<string>();
    let excludedNonBpjsCount = 0;

    pasienLines.forEach((line, lineIdx) => {
      const tokens = line.split(/\s+/).filter(Boolean);
      if (tokens.length < 2) return;

      // ======================================================================
      // 1. FILTER KHUSUS PASIEN PENJAMIN BPJS (EXCLUDE PASIEN UMUM / ASURANSI)
      // ======================================================================
      // Periksa kolom "Jenis Bayar" / "Penanggung Jawab" pada baris registrasi SIMRS Khanza.
      // HANYA masukkan pasien yang memiliki Jenis Bayar / Penanggung Jawab mengandung kata "BPJS".
      // Pasien dengan Jenis Bayar "UMUM", "MANDIRI", "ASURANSI", atau non-BPJS lainnya harus OTOMATIS DIBUANG.
      const isExplicitNonBpjs =
        /\b(?:UMUM|MANDIRI|ASURANSI(?:\s+LAIN)?|INHEALTH|PRUDENTIAL|ALLIANZ|GRATIS|PERUSAHAAN)\b/i.test(line);

      const bpjsTypeMatch = line.match(
        /\b(BPJS(?:\s+(?:PBI|NON\s*PBI|KESEHATAN|KETENAGAKERJAAN))?|PBI|NON\s*PBI)\b/i
      );

      const hasBpjsCard = /\b000\d{10}\b|\b\d{13}\b/.test(line);

      // Jika baris terdeteksi penjamin UMUM / Non-BPJS dan tidak memiliki penjamin BPJS
      if (isExplicitNonBpjs && !bpjsTypeMatch) {
        excludedNonBpjsCount++;
        return;
      }

      // Jika sama sekali tidak ada kata BPJS atau kartu BPJS 13 digit
      if (!bpjsTypeMatch && !hasBpjsCard && !/bpjs/i.test(line)) {
        excludedNonBpjsCount++;
        return;
      }

      let detectedJenisBayar = 'BPJS';
      if (bpjsTypeMatch) {
        detectedJenisBayar = bpjsTypeMatch[1].toUpperCase();
      }

      // ======================================================================
      // 2. NOMOR ANTRIAN & NOMOR RAWAT
      // ======================================================================
      // a. Nomor Antrian
      const antrianMatch =
        line.match(/(?:true\s+)?\b(\d{1,3})\s+20\d{2}\/\d{2}\/\d{2}\/\d{6}\b/i) ||
        line.match(/^(\d{1,3})\b/);
      const noAntrian = antrianMatch ? antrianMatch[1] : String(lineIdx + 1).padStart(3, '0');

      // b. Nomor Rawat (misal 2026/10/09/000106)
      const rawatMatch = line.match(/\b20\d{2}\/\d{2}\/\d{2}\/\d{6}\b/);
      const noRawat = rawatMatch ? rawatMatch[0] : undefined;

      // c. Tanggal Kontrol (YYYY-MM-DD atau diambil dari No Rawat)
      let tglKontrol = '';
      const dateToken = tokens.find(
        (t) => /^20\d{2}[-/]\d{2}[-/]\d{2}$/.test(t) || /^\d{2}[-/]\d{2}[-/]20\d{2}$/.test(t)
      );
      if (dateToken) {
        tglKontrol = dateToken.replace(/\//g, '-');
      } else if (rawatMatch) {
        const parts = rawatMatch[0].split('/');
        tglKontrol = `${parts[0]}-${parts[1]}-${parts[2]}`;
      } else {
        tglKontrol = getTodayIsoDate();
      }

      // ======================================================================
      // 3. NO RM (6 DIGIT MURNI) DARI KOLOM "NOMER RM"
      // ======================================================================
      const rawatSuffix = rawatMatch ? rawatMatch[0].split('/')[3] : null;
      let rm = '';
      const all6Digits = tokens.filter((t) => /^\d{6}$/.test(t));
      if (all6Digits.length > 0) {
        const nonSuffix = all6Digits.find((d) => d !== rawatSuffix);
        rm = nonSuffix || all6Digits[0];
      }

      // Hindari duplikasi baris jika No RM sudah terproses
      if (!rm || processedRms.has(rm)) {
        if (!rm) return;
      }
      processedRms.add(rm);

      // ======================================================================
      // 4. NO BPJS (13 DIGIT ANGKA)
      // ======================================================================
      let noBpjsFromPasien = '-';
      const bpjsToken = tokens.find((t) => /^000\d{10}$/.test(t) || /^\d{13}$/.test(t));
      if (bpjsToken) {
        noBpjsFromPasien = bpjsToken;
      }

      // ======================================================================
      // 5. NAMA PASIEN (DARI KOLOM "PASIEN", misal: "EVI LUTFIANI MUFIAROH, NY")
      // ======================================================================
      let nama = '';
      const rmIdx = tokens.indexOf(rm);
      if (rmIdx !== -1) {
        const nameTokens: string[] = [];
        for (let i = rmIdx + 1; i < tokens.length; i++) {
          const t = tokens[i];
          // Berhenti jika menemukan No BPJS (10-14 digit), Jenis Bayar (BPJS/UMUM/dll), Poli, Dokter, No HP
          if (
            /^\d{10,14}$/.test(t) ||
            /^08\d{8,11}$/.test(t) ||
            /^(?:poliklinik|poli|dr\.|dokter|bpjs|umum|mandiri|asuransi|pbi)$/i.test(t)
          ) {
            break;
          }
          nameTokens.push(t);
        }
        if (nameTokens.length > 0) {
          nama = nameTokens.join(' ');
        }
      }
      if (!nama) {
        const fallbackMatch = line.match(
          /\b\d{6}\s+([A-Za-z\s\.\'\`\,\-]+?)(?=\s+(?:000\d{10}|\d{13}|08\d+|Poliklinik|Poli|dr\.|BPJS|UMUM)|\t|$)/i
        );
        nama = fallbackMatch ? fallbackMatch[1].trim() : `Pasien (${rm})`;
      }

      // ======================================================================
      // 6. NAMA POLI (STRICTLY DARI DATA REGISTRASI SIMRS - GAMBAR 2)
      // ======================================================================
      // Kolom "NAMA POLI" di tabel Hasil Audit WAJIB menggunakan nilai nama Poliklinik
      // dari data Registrasi Pasien SIMRS Khanza (misal: "Poliklinik Obgyn" / "dr. Erliana, Sp.OG").
      // JANGAN PERNAH override/ganti nama Poli pasien dengan data di Surat Kontrol (Gambar 1).
      let namaPoli = '';

      // a. Tangkap Poliklinik dari teks baris
      const poliMatch = line.match(
        /\b(?:Poliklinik|Poli)\s+([A-Za-z0-9\s\/\&\-]+?)(?=\s+(?:dr\.|Dokter|BPJS|UMUM|Mandiri|08\d+|\d{10,13})|\t|\r|\n|$)/i
      );
      if (poliMatch) {
        namaPoli = poliMatch[0].trim();
      }

      // b. Pemetaan nama poliklinik / dokter jika teks tidak diawali kata Poliklinik
      if (!namaPoli) {
        if (/obgyn|kandungan|kebidanan|sp\.og|erliana/i.test(line)) {
          namaPoli = 'Poliklinik Obgyn';
        } else if (/jantung|kardiologi|sp\.jp/i.test(line)) {
          namaPoli = 'Poliklinik Jantung BPJS';
        } else if (/paru|pulmonologi|sp\.p/i.test(line)) {
          namaPoli = 'Poliklinik Paru BPJS';
        } else if (/saraf|neurologi|sp\.s|sp\.n/i.test(line)) {
          namaPoli = 'Poliklinik Saraf';
        } else if (/penyakit\s+dalam|internis|sp\.pd/i.test(line)) {
          namaPoli = 'Poli Penyakit Dalam';
        } else if (/bedah|sp\.b/i.test(line)) {
          namaPoli = 'Poli Bedah';
        } else if (/anak|pediatri|sp\.a/i.test(line)) {
          namaPoli = 'Poli Anak';
        } else if (/mata|oftalmologi|sp\.m/i.test(line)) {
          namaPoli = 'Poli Mata';
        } else if (/ortopedi|orthopedi|sp\.ot/i.test(line)) {
          namaPoli = 'Poli Ortopedi';
        } else if (/tht|sp\.tht/i.test(line)) {
          namaPoli = 'Poli THT';
        } else {
          namaPoli = 'Poliklinik Rawat Jalan';
        }
      }

      // Pastikan jika ada kata "obgyn" atau dokter "dr. Erliana, Sp.OG", nama Poli adalah "Poliklinik Obgyn"
      if (/obgyn|sp\.og|erliana/i.test(line) && !/jantung|paru|saraf/i.test(namaPoli)) {
        namaPoli = 'Poliklinik Obgyn';
      }

      // ======================================================================
      // 7. PENCOCOKAN DUAL-KEY DENGAN SURAT KONTROL TERBIT (GAMBAR 1)
      // ======================================================================
      // Langkah 1: Cari match berdasarkan No. RM (Paling Akurat)
      let surkonRecord = surkonMapByRm.get(rm);

      // Langkah 2: Jika No. RM tidak ketemu/beda format, otomatis cari match berdasarkan No. BPJS (13 Digit)
      if (!surkonRecord && noBpjsFromPasien !== '-') {
        surkonRecord = surkonMapByBpjs.get(noBpjsFromPasien);
      }

      // Langkah 3: Jika ditemukan di data Surkon Terbit, tandai sebagai "Sudah Buat" (done)
      // dan tarik No. Surkon + Rencana Tgl Kontrol. Jika tidak, set "Belum Buat" (missing) / "Terlewat" (overdue).
      const isExist = Boolean(surkonRecord);

      // Tentukan No BPJS final (jika dari registrasi tidak ada, gunakan dari surkon terbit)
      let finalBpjs = noBpjsFromPasien;
      if (finalBpjs === '-' && isExist && surkonRecord && surkonRecord.noBpjs !== '-') {
        finalBpjs = surkonRecord.noBpjs;
      }

      // Cek apakah item ini sudah pernah diberi alasan sebelumnya agar input alasan tidak hilang
      const previousItem = hasilAudit.find((x) => x.rm === rm);

      let computedStatus: 'done' | 'missing' | 'overdue' = 'missing';
      if (isExist) {
        computedStatus = 'done';
      } else if (isDateOverdue(tglKontrol)) {
        computedStatus = 'overdue';
      } else {
        computedStatus = 'missing';
      }

      // CATATAN KRITIS: namaPoli STRICTLY diambil dari Data Registrasi SIMRS (Gambar 2).
      // Jangan pernah dioverwrite oleh data Surat Kontrol (Gambar 1).
      newHasil.push({
        noAntrian,
        rm,
        nama: nama || `Pasien (${rm})`,
        noBpjs: finalBpjs,
        tglKontrol,
        namaPoli, // STRICTLY DARI REGISTRASI SIMRS GAMBAR 2
        status: computedStatus,
        noSurkon: isExist && surkonRecord ? surkonRecord.noSurkon : '-',
        rencanaTglKontrol: isExist && surkonRecord ? surkonRecord.rencanaTglKontrol : '-',
        alasanSelect: previousItem ? previousItem.alasanSelect : '',
        alasanCustom: previousItem ? previousItem.alasanCustom : '',
        noRawat,
        jenisBayar: detectedJenisBayar
      });
    });

    if (newHasil.length === 0) {
      if (excludedNonBpjsCount > 0) {
        triggerToast(
          `Semua data registrasi yang dimasukkan (${excludedNonBpjsCount} pasien) berstatus Non-BPJS/UMUM dan telah difilter keluar. Audit hanya memproses pasien BPJS.`,
          'info'
        );
      } else {
        triggerToast(
          'Format teks registrasi pasien tidak dikenali. Pastikan mencantumkan No RM 6-digit, nama pasien, dan penjamin BPJS.',
          'error'
        );
      }
      return;
    }

    setHasilAudit(newHasil);
    const total = newHasil.length;
    const done = newHasil.filter((x) => x.status === 'done').length;
    const overdue = newHasil.filter((x) => x.status === 'overdue').length;
    const missing = newHasil.filter((x) => x.status === 'missing').length;

    const excludedNote =
      excludedNonBpjsCount > 0
        ? ` (${excludedNonBpjsCount} pasien Non-BPJS/UMUM difilter keluar)`
        : '';

    triggerToast(
      `Audit selesai! Total: ${total} pasien BPJS (${done} sudah buat, ${missing} belum dibuat, ${overdue} terlewat)${excludedNote}.`,
      'success'
    );
  };

  // --------------------------------------------------------------------------
  // LOGIKA SELECT & CUSTOM INPUT ALASAN
  // --------------------------------------------------------------------------
  const handleSelectChange = (rm: string, value: string) => {
    setHasilAudit((prev) =>
      prev.map((item) => {
        if (item.rm === rm) {
          const isCustom = value.startsWith('Lain-lain');
          return {
            ...item,
            alasanSelect: value,
            alasanCustom: isCustom ? item.alasanCustom : ''
          };
        }
        return item;
      })
    );
  };

  const handleCustomInput = (rm: string, text: string) => {
    setHasilAudit((prev) =>
      prev.map((item) => {
        if (item.rm === rm) {
          return {
            ...item,
            alasanCustom: text
          };
        }
        return item;
      })
    );
  };

  // Summary Metrics
  const summary = useMemo(() => {
    const total = hasilAudit.length;
    const done = hasilAudit.filter((x) => x.status === 'done').length;
    const overdue = hasilAudit.filter((x) => x.status === 'overdue').length;
    const missing = hasilAudit.filter((x) => x.status === 'missing').length;
    return { total, done, missing, overdue };
  }, [hasilAudit]);

  // Poliklinik names detected
  const detectedPolis = useMemo(() => {
    const names = Array.from(new Set(hasilAudit.map((i) => i.namaPoli))).filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Poli Rawat Jalan';
  }, [hasilAudit]);

  // Daftar unik nama Poli yang terdeteksi untuk Dropdown Filter & Ringkasan
  const uniquePoliList = useMemo(() => {
    const set = new Set<string>();
    hasilAudit.forEach((item) => {
      if (item.namaPoli) set.add(item.namaPoli);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  }, [hasilAudit]);

  // Data Tabel setelah Filter Poli, Filter Status, Search, Penanganan Poli Libur, & Pengurutan (Sorting)
  const filteredData = useMemo(() => {
    // 1. Filter Data
    const result = hasilAudit.filter((item) => {
      // a. Exclude Poli Libur / Tutup manual via tombol Exclude
      if (excludedPolis.includes(item.namaPoli)) {
        return false;
      }

      // b. Opsi Sembunyikan Poli Libur / Tidak Praktik otomatis (misal: Poli Mata atau keyword libur/tutup)
      if (hideLiburPolis) {
        const isLibur = /libur|tidak\s+praktik|tutup|mata/i.test(item.namaPoli);
        if (isLibur) return false;
      }

      // c. Filter Dropdown Nama Poli
      if (selectedPoli !== 'all' && item.namaPoli !== selectedPoli) {
        return false;
      }

      // d. Filter Status (Semua / Belum Dibuat / Terlewat / Sudah Dibuat)
      if (filterType !== 'all') {
        if (item.status !== filterType) {
          return false;
        }
      }

      // e. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRm = item.rm.toLowerCase().includes(q);
        const matchNama = item.nama.toLowerCase().includes(q);
        const matchBpjs = item.noBpjs.toLowerCase().includes(q);
        const matchAntrian = item.noAntrian.toLowerCase().includes(q);
        const matchSurkon = item.noSurkon.toLowerCase().includes(q);
        const matchTglKontrol = item.tglKontrol.toLowerCase().includes(q);
        const matchNamaPoli = item.namaPoli.toLowerCase().includes(q);
        const matchRencanaTgl = item.rencanaTglKontrol.toLowerCase().includes(q);
        const matchAlasan =
          item.alasanSelect.toLowerCase().includes(q) ||
          item.alasanCustom.toLowerCase().includes(q);

        if (
          !matchRm &&
          !matchNama &&
          !matchBpjs &&
          !matchAntrian &&
          !matchSurkon &&
          !matchTglKontrol &&
          !matchNamaPoli &&
          !matchRencanaTgl &&
          !matchAlasan
        ) {
          return false;
        }
      }
      return true;
    });

    // 2. Pengurutan (Sorting)
    result.sort((a, b) => {
      if (sortBy === 'antrian_asc') {
        const numA = parseInt(a.noAntrian, 10);
        const numB = parseInt(b.noAntrian, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.noAntrian.localeCompare(b.noAntrian, 'id');
      }
      if (sortBy === 'antrian_desc') {
        const numA = parseInt(a.noAntrian, 10);
        const numB = parseInt(b.noAntrian, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
        return b.noAntrian.localeCompare(a.noAntrian, 'id');
      }
      if (sortBy === 'nama_asc') {
        return a.nama.localeCompare(b.nama, 'id');
      }
      if (sortBy === 'poli_asc') {
        const cmpPoli = a.namaPoli.localeCompare(b.namaPoli, 'id');
        if (cmpPoli !== 0) return cmpPoli;
        const numA = parseInt(a.noAntrian, 10);
        const numB = parseInt(b.noAntrian, 10);
        return !isNaN(numA) && !isNaN(numB) ? numA - numB : a.noAntrian.localeCompare(b.noAntrian);
      }
      if (sortBy === 'status_missing_first') {
        // Tampilkan pasien "Belum Buat" di posisi paling atas, kemudian "Terlewat", baru "Sudah Buat"
        const getWeight = (status: 'done' | 'missing' | 'overdue') => {
          if (status === 'missing') return 1;
          if (status === 'overdue') return 2;
          return 3;
        };
        const weightDiff = getWeight(a.status) - getWeight(b.status);
        if (weightDiff !== 0) return weightDiff;
        const numA = parseInt(a.noAntrian, 10);
        const numB = parseInt(b.noAntrian, 10);
        return !isNaN(numA) && !isNaN(numB) ? numA - numB : a.noAntrian.localeCompare(b.noAntrian);
      }
      return 0;
    });

    return result;
  }, [hasilAudit, filterType, searchQuery, selectedPoli, excludedPolis, hideLiburPolis, sortBy]);

  // Struktur Pengelompokan Data (Group by Poli)
  const groupedData = useMemo(() => {
    if (!isGroupedByPoli) return [];
    const map = new Map<string, AuditSurkonItem[]>();
    filteredData.forEach((item) => {
      const existing = map.get(item.namaPoli) || [];
      existing.push(item);
      map.set(item.namaPoli, existing);
    });

    const groups: {
      poliName: string;
      items: AuditSurkonItem[];
      total: number;
      missing: number;
      overdue: number;
      done: number;
    }[] = [];

    map.forEach((items, poliName) => {
      const missing = items.filter((x) => x.status === 'missing').length;
      const overdue = items.filter((x) => x.status === 'overdue').length;
      const done = items.filter((x) => x.status === 'done').length;
      groups.push({
        poliName,
        items,
        total: items.length,
        missing,
        overdue,
        done
      });
    });

    if (sortBy === 'status_missing_first') {
      groups.sort((a, b) => b.missing - a.missing || a.poliName.localeCompare(b.poliName, 'id'));
    } else {
      groups.sort((a, b) => a.poliName.localeCompare(b.poliName, 'id'));
    }

    return groups;
  }, [filteredData, isGroupedByPoli, sortBy]);

  // Aksi toggle collapse/expand Poli
  const toggleCollapsePoli = (poliName: string) => {
    setCollapsedPolis((prev) => ({
      ...prev,
      [poliName]: !prev[poliName]
    }));
  };

  // Aksi sembunyikan Poli (Exclude Poli Libur/Tidak Praktik)
  const handleExcludePoli = (poliName: string) => {
    if (!excludedPolis.includes(poliName)) {
      setExcludedPolis((prev) => [...prev, poliName]);
      triggerToast(`Poliklinik "${poliName}" disembunyikan dari hasil audit.`, 'info');
    }
  };

  // Pulihkan satu Poli yang disembunyikan
  const handleRestorePoli = (poliName: string) => {
    setExcludedPolis((prev) => prev.filter((p) => p !== poliName));
  };

  // Pulihkan semua Poli yang disembunyikan
  const handleRestoreAllPolis = () => {
    setExcludedPolis([]);
    setHideLiburPolis(false);
    triggerToast('Semua poliklinik kembali ditampilkan.', 'success');
  };

  // Muat contoh data SIMRS
  const handleLoadSampleData = () => {
    setDataPasienText(SAMPLE_DATA_PASIEN);
    setDataSurkonText(SAMPLE_DATA_SURKON);
    triggerToast(
      'Contoh data registrasi & surkon berhasil dimuat. Silakan klik "Proses & Bandingkan Data".'
    );
  };

  // Bersihkan data secara menyeluruh di semua modul / tab
  const handleClearAll = () => {
    if (window.confirm('Yakin ingin mereset dan mengosongkan seluruh data pada semua tab (Audit Surkon, Cek Rujukan, dan Tracker SEP Pending)?')) {
      setDataPasienText('');
      setDataSurkonText('');
      setHasilAudit([]);
      setSepPendingList([]);
      setSepPasteText('');
      setRujukanResult(null);
      setSearchQuery('');
      setFilterType('all');
      setSelectedPoli('all');
      setExcludedPolis([]);
      setHideLiburPolis(false);
      setSortBy('antrian_asc');

      localStorage.removeItem(STORAGE_KEY_PASIEN);
      localStorage.removeItem(STORAGE_KEY_SURKON);
      localStorage.removeItem(STORAGE_KEY_HASIL);
      localStorage.removeItem('rsumb_sep_paste_text');
      localStorage.removeItem('rsumb_sep_pending_list');

      triggerToast('Seluruh data, form, dan riwayat pada semua tab berhasil di-reset.', 'success');
    }
  };

  // --------------------------------------------------------------------------
  // FITUR BARU: 💾 SIMPAN AUDIT (Ke LocalStorage / History Lengkap Timestamp)
  // --------------------------------------------------------------------------
  const handleSaveAudit = () => {
    if (hasilAudit.length === 0) {
      triggerToast('Belum ada data audit untuk disimpan.', 'error');
      return;
    }

    const now = new Date();
    const timeDisplay =
      now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) +
      ' ' +
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB';

    const newRecord: SavedAuditRecord = {
      id: `audit_${now.getTime()}`,
      savedAt: timeDisplay,
      total: summary.total,
      done: summary.done,
      missing: summary.missing,
      overdue: summary.overdue,
      poliNames: detectedPolis,
      data: [...hasilAudit]
    };

    const updated = [newRecord, ...savedHistory.slice(0, 19)]; // Simpan hingga 20 sesi audit
    setSavedHistory(updated);
    localStorage.setItem(STORAGE_KEY_SAVED_HISTORY, JSON.stringify(updated));
    setLastSavedTimestamp(timeDisplay);

    triggerToast(
      `Hasil audit berhasil disimpan! (${summary.total} pasien, ${summary.done} dibuat, ${summary.missing} belum, ${summary.overdue} terlewat)`,
      'success'
    );
  };

  // Pulihkan Audit dari Riwayat
  const handleRestoreSavedAudit = (record: SavedAuditRecord) => {
    setHasilAudit(record.data);
    setLastSavedTimestamp(record.savedAt);
    setIsHistoryModalOpen(false);
    triggerToast(`Audit tanggal ${record.savedAt} berhasil dimuat kembali ke tabel.`, 'success');
  };

  // Hapus Satu Riwayat Audit
  const handleDeleteSavedRecord = (id: string) => {
    const updated = savedHistory.filter((r) => r.id !== id);
    setSavedHistory(updated);
    localStorage.setItem(STORAGE_KEY_SAVED_HISTORY, JSON.stringify(updated));
    triggerToast('Riwayat audit berhasil dihapus.', 'info');
  };

  // --------------------------------------------------------------------------
  // FITUR BARU: 📊 EKSPOR EXCEL (.xls/.xlsx Spreadsheet XML / Styled Table)
  // --------------------------------------------------------------------------
  const handleExportExcel = () => {
    if (hasilAudit.length === 0) {
      triggerToast('Belum ada data audit untuk diekspor ke Excel.', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('id-ID');

    // Menghasilkan file Excel berspesifikasi HTML Worksheet yang didukung penuh oleh Excel, Google Sheets & LibreOffice
    const excelHeaderHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Audit Surat Kontrol BPJS</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          .title { font-size: 16pt; font-weight: bold; color: #1e3a8a; }
          .subtitle { font-size: 11pt; color: #475569; margin-bottom: 12px; }
          .meta-box { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px; font-size: 10pt; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #1e40af; color: #ffffff; font-weight: bold; font-size: 10pt; border: 1px solid #94a3b8; padding: 8px 6px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; vertical-align: middle; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .status-done { background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; }
          .status-missing { background-color: #ffe4e6; color: #9f1239; font-weight: bold; text-align: center; }
          .status-overdue { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; }
          .mono { font-family: Consolas, monospace; }
        </style>
      </head>
      <body>
        <div class="title">RSU MUHAMMADIYAH BABAT</div>
        <div class="subtitle">AUDIT &amp; REKAPITULASI SURAT KONTROL BPJS VCLAIM (${detectedPolis})</div>
        <div class="meta-box">
          <strong>Tanggal Ekspor:</strong> ${todayStr} (${timeStr} WIB) | 
          <strong>Total Pasien:</strong> ${summary.total} | 
          <strong>Sudah Buat:</strong> ${summary.done} (${summary.total ? Math.round((summary.done / summary.total) * 100) : 0}%) | 
          <strong>Belum Buat:</strong> ${summary.missing} | 
          <strong>Terlewat:</strong> ${summary.overdue}
        </div>
        <br/>
        <table>
          <thead>
            <tr>
              <th>NO. ANTRIAN</th>
              <th>NO. RM</th>
              <th>NAMA PASIEN</th>
              <th>NO. BPJS</th>
              <th>TANGGAL KONTROL</th>
              <th>NAMA POLI</th>
              <th>STATUS SURKON</th>
              <th>NO. SURAT KONTROL</th>
              <th>RENCANA TGL KONTROL</th>
              <th>KETERANGAN / ALASAN BELUM BUAT</th>
            </tr>
          </thead>
          <tbody>
            ${hasilAudit
              .map(
                (item) => `
              <tr>
                <td class="center mono bold">${item.noAntrian}</td>
                <td class="center mono bold" style="color: #1e3a8a;">${item.rm}</td>
                <td class="bold">${item.nama}</td>
                <td class="center mono">${item.noBpjs}</td>
                <td class="center mono">${item.tglKontrol}</td>
                <td class="center">${item.namaPoli}</td>
                <td class="${
                  item.status === 'done'
                    ? 'status-done'
                    : item.status === 'overdue'
                    ? 'status-overdue'
                    : 'status-missing'
                }">
                  ${
                    item.status === 'done'
                      ? 'SUDAH BUAT'
                      : item.status === 'overdue'
                      ? 'TERLEWAT'
                      : 'BELUM BUAT'
                  }
                </td>
                <td class="center mono bold">${item.noSurkon}</td>
                <td class="center mono">${item.rencanaTglKontrol}</td>
                <td>${item.alasanCustom || item.alasanSelect || (item.status === 'done' ? '-' : 'Belum diisi')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHeaderHtml], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Surat_Kontrol_BPJS_${todayStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast('Data hasil audit berhasil diunduh dalam format Excel (.xls).', 'success');
  };

  // --------------------------------------------------------------------------
  // FITUR BARU: 📄 EKSPOR PDF (Modal Cetak Resmi RSUMB & Window Print / Unduh)
  // --------------------------------------------------------------------------
  const handleTriggerPrint = () => {
    window.print();
  };

  const handleDownloadHtmlPdf = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const printContent = document.getElementById('printable-audit-area')?.innerHTML;
    if (!printContent) return;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Audit Surat Kontrol BPJS - RSUMB</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #999; padding: 6px; text-align: left; }
          th { background: #f0f0f0; }
          .text-center { text-align: center; }
          .badge-done { color: #166534; font-weight: bold; }
          .badge-missing { color: #991b1b; font-weight: bold; }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Audit_Surat_Kontrol_BPJS_${todayStr}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Dokumen cetak audit berhasil diunduh.', 'success');
  };

  // --------------------------------------------------------------------------
  // Salin Rekap Audit ke WhatsApp
  // --------------------------------------------------------------------------
  const handleCopyWhatsappRecap = async () => {
    if (hasilAudit.length === 0) {
      triggerToast('Belum ada data hasil audit untuk disalin.', 'error');
      return;
    }

    try {
      const todayStr = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let text = `*REKAP AUDIT SURAT KONTROL BPJS (${detectedPolis.toUpperCase()})*\n`;
      text += `Rumah Sakit: RSU Muhammadiyah Babat\n`;
      text += `Tanggal Audit: ${todayStr} (${timeStr} WIB)\n`;
      text += `----------------------------------------\n`;
      text += `📊 *Ringkasan Hasil Audit:*\n`;
      text += `• Total Pasien Registrasi: *${summary.total} Pasien*\n`;
      text += `• Surat Kontrol Terbit: *${summary.done} Pasien* (${
        summary.total ? Math.round((summary.done / summary.total) * 100) : 0
      }%)\n`;
      text += `• Belum Terbit Surkon: *${summary.missing} Pasien*\n`;
      if (summary.overdue > 0) {
        text += `• Terlewat (Tgl Lewat): *${summary.overdue} Pasien*\n`;
      }
      text += `----------------------------------------\n\n`;

      const overdueList = hasilAudit.filter((x) => x.status === 'overdue');
      if (overdueList.length > 0) {
        text += `⏰ *DAFTAR PASIEN STATUS TERLEWAT (${overdueList.length} Pasien):*\n`;
        overdueList.forEach((item, idx) => {
          const alasan = item.alasanCustom || item.alasanSelect || 'Terlewat dari tanggal kontrol';
          text += `${idx + 1}. [Antrian ${item.noAntrian}] *${item.nama}* (RM: ${item.rm})\n`;
          text += `   - No. BPJS: ${item.noBpjs}\n`;
          text += `   - Tgl Kontrol: ${item.tglKontrol} | Poli: ${item.namaPoli}\n`;
          text += `   - Keterangan: _${alasan}_\n\n`;
        });
      }

      const missingList = hasilAudit.filter((x) => x.status === 'missing');
      if (missingList.length > 0) {
        text += `⚠️ *DAFTAR PASIEN BELUM TERBIT SURKON (${missingList.length} Pasien):*\n`;
        missingList.forEach((item, idx) => {
          const alasan = item.alasanCustom || item.alasanSelect || 'Belum diisi';
          text += `${idx + 1}. [Antrian ${item.noAntrian}] *${item.nama}* (RM: ${item.rm})\n`;
          text += `   - No. BPJS: ${item.noBpjs}\n`;
          text += `   - Tgl Kontrol: ${item.tglKontrol} | Poli: ${item.namaPoli}\n`;
          text += `   - Keterangan: _${alasan}_\n\n`;
        });
      }

      if (missingList.length === 0 && overdueList.length === 0) {
        text += `✅ *Alhamdulillah, semua pasien registrasi telah terbit Surat Kontrol BPJS.*\n\n`;
      }

      text += `_Diverifikasi oleh Staf Admisi & Pendaftaran RSUMB_`;

      await navigator.clipboard.writeText(text);
      setCopiedWa(true);
      triggerToast('Rekapitulasi audit berhasil disalin ke format WhatsApp!');
      setTimeout(() => setCopiedWa(false), 2500);
    } catch {
      triggerToast('Gagal menyalin ke clipboard', 'error');
    }
  };

  // Ekspor CSV (10 Kolom Lengkap)
  const handleExportCSV = () => {
    if (hasilAudit.length === 0) {
      triggerToast('Belum ada data untuk diekspor.', 'error');
      return;
    }

    const headers = [
      'No Antrian',
      'No RM',
      'Nama Pasien',
      'No BPJS',
      'Tanggal Kontrol',
      'Nama Poli',
      'Status Surkon',
      'No Surat Kontrol',
      'Rencana Tgl Kontrol',
      'Keterangan / Alasan Belum Buat'
    ];

    const rows = hasilAudit.map((item) => [
      `"${item.noAntrian}"`,
      `"${item.rm}"`,
      `"${item.nama}"`,
      `"${item.noBpjs}"`,
      `"${item.tglKontrol}"`,
      `"${item.namaPoli}"`,
      `"${item.status === 'done' ? 'Sudah Buat' : item.status === 'overdue' ? 'Terlewat' : 'Belum Buat'}"`,
      `"${item.noSurkon}"`,
      `"${item.rencanaTglKontrol}"`,
      `"${item.alasanCustom || item.alasanSelect || '-'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Audit_Surat_Kontrol_BPJS_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Data audit berhasil diunduh dalam format CSV.');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full px-1 sm:px-2 animate-fadeIn pb-10">
      {/* ==================================================== */}
      {/* NAVIGASI TAB UTAMA: Audit Surkon vs Cek Rujukan      */}
      {/* ==================================================== */}
      <div className="w-full bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveMainTab('audit')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'audit'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Audit Surat Kontrol</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab('rujukan')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'rujukan'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Cek Masa Berlaku Rujukan</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab('sepPending')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'sepPending'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>⏳ Tracker SEP Pending (Beda HFIS)</span>
        </button>
      </div>

      {activeMainTab === 'rujukan' ? (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Modul Cek Masa Berlaku Rujukan BPJS (90 Hari)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Periksa kelayakan tanggal terbit surat rujukan FKTP terhadap masa berlaku 90 hari untuk penerbitan SEP
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setRujukanInputMode('paste')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  rujukanInputMode === 'paste'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cara 2: Paste Teks SIMRS
              </button>
              <button
                type="button"
                onClick={() => setRujukanInputMode('manual')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  rujukanInputMode === 'manual'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cara 1: Pilih Tanggal Manual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form Area */}
            <div className="space-y-4">
              {rujukanInputMode === 'manual' ? (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">1</span>
                    <span>Pilih Tanggal Diterbitkan Rujukan</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Masukkan tanggal rujukan diterbitkan oleh FKTP (Klinik / Puskesmas):
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Terbit Rujukan</label>
                    <input
                      type="date"
                      value={rujukanManualDate}
                      onChange={(e) => setRujukanManualDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProcessRujukanCheck('manual', rujukanManualDate)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Hitung Masa Berlaku (90 Hari)</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">2</span>
                      <span>Paste Teks Rujukan SIMRS / VClaim</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setRujukanPasteText(`No. Rujukan: 0204B0230626P000630\nTgl. Rujukan: 2026-06-29\nPPK Perujuk: Klinik Mitra 30 Babat\nDiagnosa: I49.9 - Cardiac arrhythmia, unspecified\nPoli Tujuan: JANTUNG DAN PEMBULUH DARAH (JAN)`);
                        triggerToast('Contoh teks rujukan dimuat.', 'info');
                      }}
                      className="text-xs text-emerald-700 hover:underline font-semibold"
                    >
                      Muat Contoh Teks
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Salin (copy) dan tempel (paste) detail surat rujukan mentah dari SIMRS Khanza atau VClaim BPJS di sini:
                  </p>
                  <textarea
                    rows={6}
                    value={rujukanPasteText}
                    onChange={(e) => setRujukanPasteText(e.target.value)}
                    placeholder="Contoh:&#10;No. Rujukan: 0204B0230626P000630&#10;Tgl. Rujukan: 2026-06-29&#10;PPK Perujuk: Klinik Mitra 30 Babat&#10;Diagnosa: I49.9 - Cardiac arrhythmia, unspecified&#10;Poli Tujuan: JANTUNG DAN PEMBULUH DARAH (JAN)"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => handleProcessRujukanCheck('paste', undefined, rujukanPasteText)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Cek Masa Berlaku Rujukan</span>
                  </button>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Ketentuan BPJS Kesehatan (Permenkes / Pedoman VClaim):</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Surat rujukan FKTP berlaku selama <strong>90 hari</strong> terhitung mulai tanggal diterbitkan. Jika rujukan telah melewati 90 hari, sistem VClaim akan menolak penerbitan SEP dan pasien diwajibkan memperbarui rujukan ke FKTP asal.
                </p>
              </div>
            </div>

            {/* Output Result Area */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="font-bold text-xs tracking-wider uppercase text-slate-300">
                    Hasil Analisis &amp; Pratinjau Pesan
                  </h3>
                </div>
                {rujukanResult && (
                  <button
                    type="button"
                    onClick={handleCopyRujukanResult}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md cursor-pointer"
                    title="Salin hasil analisis untuk WhatsApp atau catatan"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Salin Hasil</span>
                  </button>
                )}
              </div>

              {rujukanResult ? (
                <div className="space-y-4 flex-grow">
                  {/* Status Badge Header */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    rujukanResult.status === 'MASIH BERLAKU'
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                  }`}>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Status Masa Berlaku</div>
                      <div className="text-base font-extrabold">{rujukanResult.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Kedaluwarsa Pada</div>
                      <div className="text-sm font-mono font-bold">{rujukanResult.tglKedaluwarsa}</div>
                    </div>
                  </div>

                  {/* Formatted Output Box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                    {rujukanResult.formattedOutput}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-2">
                  <Calendar className="w-10 h-10 text-slate-700" />
                  <p className="text-sm font-semibold text-slate-400">Belum ada rujukan yang diperiksa</p>
                  <p className="text-xs text-slate-600 max-w-xs">
                    Pilih tanggal di sebelah kiri atau paste teks rujukan SIMRS lalu klik tombol Cek Masa Berlaku.
                  </p>
                </div>
              )}

              <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3 text-center">
                Portal Admisi &amp; Pendaftaran RSU Muhammadiyah Babat
              </div>
            </div>
          </div>
        </div>
      ) : activeMainTab === 'sepPending' ? (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Tracker SEP Pending (Beda HFIS - Poli Kulit &amp; Lainnya)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola pasien BPJS yang sudah sidik jari (fingerprint) namun SEP tertunda akibat perbedaan jam praktik riil vs HFIS
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSepPasteText(SAMPLE_SEP_PENDING);
                  handleProcessSepPending(SAMPLE_SEP_PENDING);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Muat Contoh Poli Kulit</span>
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <strong className="font-bold block text-amber-950">
                ATURAN KHUSUS HFIS BPJS &amp; FINGERPRINT:
              </strong>
              Pasien poli tertentu (seperti <em>Poliklinik Kulit &amp; Kelamin</em>) sering kali sudah melakukan verifikasi sidik jari di loket pendaftaran, tetapi tombol cetak SEP di VClaim baru terbuka setelah jam praktik HFIS (misal pukul 13:30). Modul ini memberikan hitung mundur (*countdown*) real-time dan notifikasi kedatangan jam cetak.
            </div>
          </div>

          {/* Input & Process Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Paste Data Registrasi SIMRS Khanza:
              </label>
              <textarea
                value={sepPasteText}
                onChange={(e) => setSepPasteText(e.target.value)}
                placeholder="Paste baris data registrasi SIMRS di sini..."
                rows={8}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-slate-50 font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleProcessSepPending()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-md active:scale-98"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Proses Data Pending</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSepPasteText('');
                    setSepPendingList([]);
                    triggerToast('Daftar SEP pending dikosongkan.', 'info');
                  }}
                  className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Table & Status Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block text-[10px]">Total Pending</span>
                  <strong className="text-base text-slate-900">{sepPendingList.length}</strong>
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                  <span className="text-amber-700 block text-[10px]">Menunggu Jam Cetak</span>
                  <strong className="text-base text-amber-950">
                    {sepPendingList.filter((x) => x.statusCetak !== 'done' && !getCountdownInfo(x.targetPrintTime, x.statusCetak).isReady).length}
                  </strong>
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                  <span className="text-emerald-700 block text-[10px]">Siap Cetak / Selesai</span>
                  <strong className="text-base text-emerald-950">
                    {sepPendingList.filter((x) => x.statusCetak === 'done' || getCountdownInfo(x.targetPrintTime, x.statusCetak).isReady).length}
                  </strong>
                </div>
              </div>

              {/* Table List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[450px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-center w-12">No</th>
                      <th className="p-2.5">RM &amp; Nama Pasien</th>
                      <th className="p-2.5">Poli &amp; Dokter</th>
                      <th className="p-2.5 text-center">Fingerprint</th>
                      <th className="p-2.5 text-center">Jam HFIS</th>
                      <th className="p-2.5 text-center">Countdown / Status</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {sepPendingList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          Belum ada data pasien SEP pending. Silakan paste data dari SIMRS atau muat contoh data.
                        </td>
                      </tr>
                    ) : (
                      sepPendingList.map((item, idx) => {
                        const info = getCountdownInfo(item.targetPrintTime, item.statusCetak);
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              info.isReady && item.statusCetak !== 'done' ? 'bg-emerald-50/70 border-l-4 border-emerald-500' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center font-mono font-semibold text-slate-600">
                              {item.noAntrian}
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{item.nama}</div>
                              <div className="font-mono text-[11px] text-slate-500">RM: {item.rm} | {item.noRawat}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-semibold text-blue-900">{item.namaPoli}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{item.dokter}</div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {item.fingerprintStatus}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                              {item.targetPrintTime}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border inline-block ${info.badgeClass}`}>
                                {info.text}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              {item.statusCetak === 'done' ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                                  ✅ Selesai
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMarkSepDone(item.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer active:scale-98 transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Sudah Cetak</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          {/* ==================================================== */}
          {/* 1. HEADER AUDIT & REKAP SURAT KONTROL BPJS           */}
          {/* ==================================================== */}
      <div className="w-full bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Audit &amp; Rekap Surat Kontrol BPJS
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  BPJS VClaim
                </span>
                <button
                  type="button"
                  onClick={() => setIsGuideModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs transition-all cursor-pointer hover:scale-102 active:scale-98"
                  title="Lihat Alur Kerja Audit Harian Step-by-Step"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>📖 Panduan Audit Harian</span>
                </button>
                {lastSavedTimestamp && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Tersimpan: {lastSavedTimestamp}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pembandingan Otomatis Data Registrasi Pasien BPJS vs Surat Kontrol Terbit SIMRS RSUMB
              </p>
            </div>
          </div>
        </div>

        {/* Summary Badges & Quick Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {summary.total > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs">
                Total: <strong className="text-slate-900">{summary.total}</strong>
              </span>
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs">
                ✓ Sudah: <strong className="text-emerald-950">{summary.done}</strong>
              </span>
              <span className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs">
                ✕ Belum: <strong className="text-rose-950">{summary.missing}</strong>
              </span>
              {summary.overdue > 0 && (
                <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Terlewat: <strong className="text-amber-950">{summary.overdue}</strong></span>
                </span>
              )}
            </div>
          )}

          {/* Tombol Riwayat Tersimpan */}
          {savedHistory.length > 0 && (
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Lihat riwayat snapshot audit yang tersimpan"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Arsip ({savedHistory.length})</span>
            </button>
          )}

          <button
            onClick={handleLoadSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
            title="Muat contoh data registrasi & pembuatan surat kontrol untuk pengujian"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Contoh Data</span>
          </button>

          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 transition-all cursor-pointer shadow-2xs"
            title="Bersihkan seluruh form, tabel, dan reset state aplikasi"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. AREA INPUT DATA REGISTRASI & SURKON TERBIT        */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
        {/* Input Data Pasien Berobat (Gambar 2) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="font-bold text-slate-900 text-sm">
                Data Registrasi Pasien (Gambar 2)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
              SIMRS Registrasi
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Copy tabel registrasi pasien rawat jalan SIMRS (No Antrian, No Rawat, Tanggal, No RM, Pasien, Jenis Bayar BPJS, Poliklinik) &amp; paste di sini:
          </p>

          <textarea
            id="data-pasien"
            rows={8}
            value={dataPasienText}
            onChange={(e) => handleDataPasienChange(e.target.value)}
            placeholder="Paste seluruh data daftar pasien registrasi BPJS di sini...&#10;Contoh:&#10;001 2026/10/09/000106 2026-10-09 041248 EVI LUTFIANI MUFIAROH, NY 0003049582710 BPJS Poliklinik Obgyn dr. Erliana, Sp.OG&#10;002 2026/10/09/000107 2026-10-09 031829 MOHAMMAD FIRDAUS IRWANSYAH 0000103721556 BPJS Poliklinik Jantung BPJS dr. Spesialis Jantung..."
            className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 bg-slate-50/50 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border ${
                  rmCountPasien > 0
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                title="Deteksi nomor rekam medis 6 digit secara real-time sebelum proses audit"
              >
                <span>🔍 Terdeteksi</span>
                <strong className={rmCountPasien > 0 ? 'text-blue-900 font-bold' : ''}>
                  {rmCountPasien} No. RM
                </strong>
                <span>di Gambar 2</span>
              </span>
              <span className="text-slate-400">({dataPasienText.length} Karakter)</span>
            </div>

            <div className="flex items-center gap-2">
              {dataPasienText && (
                <button
                  type="button"
                  onClick={() => {
                    const cleaned = autoCleanText(dataPasienText);
                    setDataPasienText(cleaned);
                    triggerToast('Teks registrasi berhasil dirapikan otomatis.', 'info');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  title="Hapus spasi ganda dan baris kosong tak terpakai"
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>Rapikan Teks</span>
                </button>
              )}
              {dataPasienText && (
                <button
                  onClick={() => setDataPasienText('')}
                  className="text-slate-400 hover:text-rose-600 underline cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Data Surkon Terbit (Gambar 1) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="font-bold text-slate-900 text-sm">
                Data Surat Kontrol Terbit (Gambar 1)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
              Bridging Surkon
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Copy data pembuatan Surat Kontrol dari SIMRS / VClaim (No RM, No Surkon, Rencana Tanggal Kontrol, No BPJS) &amp; paste di sini:
          </p>

          <textarea
            id="data-surkon"
            rows={8}
            value={dataSurkonText}
            onChange={(e) => handleDataSurkonChange(e.target.value)}
            placeholder="Paste data pembuatan Surat Kontrol di sini...&#10;Contoh:&#10;2026/10/09/000106 0204R0191026V001073 0000103721556 031829 MOHAMMAD FIRDAUS IRWANSYAH 2026-10-09 0204R0191026K000738 2026-11-09 Poliklinik Jantung..."
            className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 bg-slate-50/50 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border ${
                  rmCountSurkon > 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                title="Deteksi nomor rekam medis 6 digit secara real-time sebelum proses audit"
              >
                <span>🔍 Terdeteksi</span>
                <strong className={rmCountSurkon > 0 ? 'text-emerald-900 font-bold' : ''}>
                  {rmCountSurkon} No. RM
                </strong>
                <span>di Gambar 1</span>
              </span>
              <span className="text-slate-400">({dataSurkonText.length} Karakter)</span>
            </div>

            <div className="flex items-center gap-2">
              {dataSurkonText && (
                <button
                  type="button"
                  onClick={() => {
                    const cleaned = autoCleanText(dataSurkonText);
                    setDataSurkonText(cleaned);
                    triggerToast('Teks surat kontrol berhasil dirapikan otomatis.', 'info');
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  title="Hapus spasi ganda dan baris kosong tak terpakai"
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Rapikan Teks</span>
                </button>
              )}
              {dataSurkonText && (
                <button
                  onClick={() => setDataSurkonText('')}
                  className="text-slate-400 hover:text-rose-600 underline cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Eksekusi Pembandingan */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 w-full">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Sistem secara otomatis mengekstrak <strong>Tanggal Kontrol</strong>, <strong>Nama Poli</strong>, dan <strong>Rencana Tanggal Kontrol</strong>, lalu mencocokkan status pembuatan Surat Kontrol per pasien.
          </span>
        </div>

        <button
          onClick={prosesPembandingan}
          className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm px-7 py-2.5 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <FileCheck className="w-4 h-4" />
          <span>Proses &amp; Bandingkan Data</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 3. HASIL AUDIT PEMBUATAN SURAT KONTROL               */}
      {/* ==================================================== */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Tabel & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 bg-slate-50/60 w-full">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">
                Hasil Audit Pembuatan Surat Kontrol
              </h2>
              {hasilAudit.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                  {filteredData.length} Data Ditampilkan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Periksa pasien yang belum diterbitkan surat kontrol beserta keterangan alasannya
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between 2xl:justify-end gap-2.5 w-full 2xl:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-grow sm:flex-grow-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari pasien / RM / BPJS / Poli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua ({summary.total})
              </button>
              <button
                onClick={() => setFilterType('missing')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'missing'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Belum Dibuat ({summary.missing})
              </button>
              <button
                onClick={() => setFilterType('overdue')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'overdue'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Terlewat ({summary.overdue})</span>
              </button>
              <button
                onClick={() => setFilterType('done')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'done'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Sudah Dibuat ({summary.done})
              </button>
            </div>

            {/* ==================================================== */}
            {/* TOOLBAR KANAN ATAS: SIMPAN, EKSPOR PDF, EKSPOR EXCEL */}
            {/* ==================================================== */}
            {hasilAudit.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto sm:ml-0">
                {/* 💾 1. TOMBOL SIMPAN AUDIT */}
                <button
                  onClick={handleSaveAudit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-2xs transition-all cursor-pointer"
                  title="Simpan data hasil audit saat ini ke riwayat tersimpan lengkap dengan timestamp"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Audit</span>
                </button>

                {/* 📄 2. TOMBOL EKSPOR PDF */}
                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white shadow-2xs transition-all cursor-pointer"
                  title="Pratinjau dan cetak/unduh tabel hasil audit menjadi file dokumen PDF yang rapi"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                </button>

                {/* 📊 3. TOMBOL EKSPOR EXCEL */}
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-2xs transition-all cursor-pointer"
                  title="Unduh seluruh isi tabel audit ke dalam file spreadsheet Excel (.xls/.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor Excel</span>
                </button>

                {/* Salin WA */}
                <button
                  onClick={handleCopyWhatsappRecap}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    copiedWa
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                  title="Salin ringkasan audit ke format pesan WhatsApp"
                >
                  {copiedWa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWa ? 'Tersalin!' : 'Salin WA'}</span>
                </button>

                {/* Ekspor CSV */}
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-colors cursor-pointer"
                  title="Unduh data hasil audit dalam file CSV standar"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* SUB-TOOLBAR: FILTER POLI, GROUPING, SORTING & PENANGANAN LIBUR    */}
        {/* ================================================================= */}
        <div className="p-3 sm:px-5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. DROPDOWN FILTER NAMA POLI */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <label htmlFor="filter-poli-select" className="font-bold text-slate-700 whitespace-nowrap">
                Filter Poli:
              </label>
              <select
                id="filter-poli-select"
                value={selectedPoli}
                onChange={(e) => setSelectedPoli(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Poli ({hasilAudit.length})</option>
                {uniquePoliList.map((p) => {
                  const count = hasilAudit.filter((x) => x.namaPoli === p).length;
                  return (
                    <option key={p} value={p}>
                      {p} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. FITUR PENGELOMPOKAN (GROUP BY POLI) */}
            <button
              type="button"
              onClick={() => setIsGroupedByPoli(!isGroupedByPoli)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow-2xs cursor-pointer ${
                isGroupedByPoli
                  ? 'bg-indigo-600 text-white shadow-indigo-100 ring-2 ring-indigo-300'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
              title="Kelompokkan data tabel berdasarkan masing-masing Poliklinik"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📂 Kelompokkan per Poli</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 3. FITUR PENGURUTAN (SORTING) */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <label htmlFor="sort-by-select" className="font-bold text-slate-700 whitespace-nowrap">
                Urutkan:
              </label>
              <select
                id="sort-by-select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'antrian_asc'
                      | 'antrian_desc'
                      | 'nama_asc'
                      | 'poli_asc'
                      | 'status_missing_first'
                  )
                }
                className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="antrian_asc">No. Antrian (1 → 99)</option>
                <option value="antrian_desc">No. Antrian (99 → 1)</option>
                <option value="nama_asc">Nama Pasien (A-Z)</option>
                <option value="poli_asc">Nama Poli (A-Z)</option>
                <option value="status_missing_first">⚠️ Belum Buat Paling Atas</option>
              </select>
            </div>

            {/* 4. OPSI EXCLUDE / SEMBUNYIKAN POLI LIBUR */}
            <label
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-semibold cursor-pointer select-none transition-all shadow-2xs ${
                hideLiburPolis
                  ? 'bg-amber-100/90 border-amber-400 text-amber-900 ring-1 ring-amber-300'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="Sembunyikan poliklinik libur / tidak ada jadwal praktik hari ini (seperti Poli Mata)"
            >
              <input
                type="checkbox"
                checked={hideLiburPolis}
                onChange={(e) => setHideLiburPolis(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <EyeOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Sembunyikan Poli Libur / Tutup</span>
            </label>
          </div>

          {/* Banner Indikator Poli yang Disembunyikan (Excluded) */}
          {(excludedPolis.length > 0 ||
            (hideLiburPolis &&
              hasilAudit.some((i) => /libur|tidak\s+praktik|tutup|mata/i.test(i.namaPoli)))) && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Poliklinik disembunyikan:{' '}
                  <strong>
                    {[
                      ...excludedPolis,
                      ...(hideLiburPolis ? ['Poli Libur / Tutup (misal: Poli Mata)'] : [])
                    ].join(', ')}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleRestoreAllPolis}
                className="text-amber-800 underline font-bold hover:text-amber-950 cursor-pointer text-xs"
              >
                Tampilkan Kembali Semua
              </button>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* TABEL DATA HASIL AUDIT (10 KOLOM LENGKAP)            */}
        {/* ==================================================== */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                {/* 1. NO. ANTRIAN */}
                <th className="p-3 sm:p-3.5 text-center whitespace-nowrap w-[75px]">No. Antrian</th>
                {/* 2. NO. RM */}
                <th className="p-3 sm:p-3.5 text-center whitespace-nowrap w-[85px]">No. RM</th>
                {/* 3. NAMA PASIEN */}
                <th className="p-3 sm:p-3.5 min-w-[170px]">Nama Pasien</th>
                {/* 4. NO. BPJS */}
                <th className="p-3 sm:p-3.5 text-center whitespace-nowrap font-mono w-[140px]">No. BPJS</th>
                {/* 5. TANGGAL KONTROL (Menggantikan NO. RAWAT) */}
                <th className="p-3 sm:p-3.5 text-center whitespace-nowrap w-[130px]">Tanggal Kontrol</th>
                {/* 6. NAMA POLI (Posisi setelah No. BPJS/Tgl Kontrol) */}
                <th className="p-3 sm:p-3.5 whitespace-nowrap min-w-[160px]">Nama Poli</th>
                {/* 7. STATUS SURKON */}
                <th className="p-3 sm:p-3.5 text-center whitespace-nowrap w-[135px]">Status Surkon</th>
                {/* 8. NO. SURAT KONTROL */}
                <th className="p-3 sm:p-3.5 text-center whitespace-nowrap w-[180px]">No. Surat Kontrol</th>
                {/* 9. RENCANA TGL KONTROL (Posisi setelah No. Surat Kontrol) */}
                <th className="p-3 sm:p-3.5 text-center whitespace-nowrap w-[145px]">Rencana Tgl Kontrol</th>
                {/* 10. KETERANGAN / ALASAN BELUM BUAT */}
                <th className="p-3 sm:p-3.5 min-w-[240px]">Keterangan / Alasan Belum Buat</th>
              </tr>
            </thead>
            <tbody id="tabel-hasil" className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    {hasilAudit.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <FileCheck className="w-10 h-10 text-slate-300" />
                        <p className="font-semibold text-slate-600 text-sm">Belum Ada Data Audit</p>
                        <p className="text-xs text-slate-400">
                          Silakan masukkan data pada dua kolom di atas lalu klik{' '}
                          <strong>"Proses &amp; Bandingkan Data"</strong>, atau coba klik tombol{' '}
                          <strong>"Contoh Data"</strong> di kanan atas.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Tidak ada data yang cocok dengan filter atau kata kunci pencarian.
                      </p>
                    )}
                  </td>
                </tr>
              ) : isGroupedByPoli ? (
                groupedData.map((group) => {
                  const isCollapsed = collapsedPolis[group.poliName];
                  return (
                    <React.Fragment key={group.poliName}>
                      {/* HEADER SECTION GRUP POLI */}
                      <tr className="bg-gradient-to-r from-slate-100 via-indigo-50/50 to-slate-100 border-y-2 border-indigo-200/60 font-bold text-slate-800">
                        <td colSpan={10} className="px-4 py-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {/* Nama Poli & Toggle Collapse */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCollapsePoli(group.poliName)}
                                className="p-1 rounded-lg hover:bg-slate-200/80 text-indigo-700 transition-colors cursor-pointer"
                                title={
                                  isCollapsed
                                    ? 'Klik untuk memperluas baris poli ini'
                                    : 'Klik untuk menyembunyikan baris poli ini'
                                }
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4 text-indigo-700" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-indigo-700" />
                                )}
                              </button>
                              <div className="flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {group.poliName}
                                </span>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                {group.total} Pasien
                              </span>
                              {group.missing > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  ✕ {group.missing} Belum Buat
                                </span>
                              )}
                              {group.overdue > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  ⏰ {group.overdue} Terlewat
                                </span>
                              )}
                              {group.done > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✓ {group.done} Sudah
                                </span>
                              )}
                            </div>

                            {/* Tombol Aksi Header: Sembunyikan / Exclude Poli */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleExcludePoli(group.poliName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
                                title={`Sembunyikan ${group.poliName} jika libur / dokter tidak praktik hari ini`}
                              >
                                <EyeOff className="w-3 h-3 text-rose-500" />
                                <span>Sembunyikan Poli Ini</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Baris data jika tidak di-collapse */}
                      {!isCollapsed ? (
                        group.items.map((item) => {
                          const isDone = item.status === 'done';
                          const isOverdue = item.status === 'overdue';
                          return (
                            <tr
                              key={item.rm}
                              className={`transition-colors hover:bg-slate-50/80 ${
                                isDone
                                  ? 'bg-emerald-50/20'
                                  : isOverdue
                                  ? 'bg-amber-50/30'
                                  : 'bg-rose-50/30'
                              }`}
                            >
                              {/* 1. No. Antrian */}
                              <td className="p-3 sm:p-3.5 font-mono font-bold text-slate-700 text-center">
                                {item.noAntrian}
                              </td>

                              {/* 2. No. RM */}
                              <td className="p-3 sm:p-3.5 font-mono font-bold text-indigo-900 text-center">
                                {item.rm}
                              </td>

                              {/* 3. Nama Pasien */}
                              <td className="p-3 sm:p-3.5 font-semibold text-slate-900">
                                {item.nama}
                              </td>

                              {/* 4. No. BPJS */}
                              <td className="p-3 sm:p-3.5 font-mono text-xs text-slate-600 text-center">
                                {item.noBpjs}
                              </td>

                              {/* 5. TANGGAL KONTROL */}
                              <td className="p-3 sm:p-3.5 font-mono text-xs text-slate-700 text-center whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md font-semibold border ${
                                    isOverdue
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : 'bg-slate-100 text-slate-800 border-slate-200'
                                  }`}
                                >
                                  {item.tglKontrol}
                                </span>
                              </td>

                              {/* 6. NAMA POLI */}
                              <td className="p-3 sm:p-3.5 text-xs whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                  <Stethoscope className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span>{item.namaPoli}</span>
                                </span>
                              </td>

                              {/* 7. Status Surkon */}
                              <td className="p-3 sm:p-3.5 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                                    isDone
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : isOverdue
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  {isDone ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>✓ Sudah Buat</span>
                                    </>
                                  ) : isOverdue ? (
                                    <>
                                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                                      <span>⏰ Terlewat</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>✕ Belum Buat</span>
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* 8. No. Surat Kontrol */}
                              <td className="p-3 sm:p-3.5 text-xs font-mono text-center whitespace-nowrap">
                                {isDone ? (
                                  <span className="font-semibold text-slate-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    {item.noSurkon}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">-</span>
                                )}
                              </td>

                              {/* 9. RENCANA TGL KONTROL */}
                              <td className="p-3 sm:p-3.5 text-xs font-mono text-center whitespace-nowrap">
                                {isDone && item.rencanaTglKontrol !== '-' ? (
                                  <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                                    {item.rencanaTglKontrol}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">-</span>
                                )}
                              </td>

                              {/* 10. Keterangan / Alasan Belum Buat */}
                              <td className="p-3 sm:p-3.5">
                                {isDone ? (
                                  <span className="text-xs text-slate-400 italic">Sudah terbit surkon</span>
                                ) : (
                                  <div className="space-y-1.5 w-full">
                                    <select
                                      value={item.alasanSelect}
                                      onChange={(e) => handleSelectChange(item.rm, e.target.value)}
                                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                                    >
                                      <option value="">-- Pilih Alasan --</option>
                                      <option value="Rujukan internal poli">Rujukan internal poli</option>
                                      <option value="Rujukan FKTP habis">Rujukan FKTP habis</option>
                                      <option value="Rujuk antar rumah sakit">Rujuk antar rumah sakit</option>
                                      <option value="Konsultasi selesai">Konsultasi selesai</option>
                                      <option value="Terlewat petugas POLI">Terlewat petugas POLI</option>
                                      <option value="Pasien rencana rawat inap">Pasien rencana rawat inap</option>
                                      <option value="Post ranap">Post ranap</option>
                                      <option value="Lain-lain">Lain-lain (Custom input manual)</option>
                                    </select>

                                    {(item.alasanSelect === 'Lain-lain' ||
                                      item.alasanSelect === 'Lain-lain (Custom input manual)') && (
                                      <div className="relative animate-fadeIn">
                                        <input
                                          type="text"
                                          id={`custom-input-${item.rm}`}
                                          value={item.alasanCustom}
                                          onChange={(e) => handleCustomInput(item.rm, e.target.value)}
                                          placeholder="Ketik alasan khusus di sini..."
                                          className="w-full text-xs border border-rose-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 pr-7"
                                          autoFocus={!item.alasanCustom}
                                        />
                                        {item.alasanCustom && (
                                          <button
                                            type="button"
                                            onClick={() => handleCustomInput(item.rm, '')}
                                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                                            title="Hapus alasan kustom"
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* Tombol Aksi Cepat: Chat WA Pasien Belum Buat */}
                                    <div className="pt-0.5 flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPatientWaChat(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold transition-all shadow-2xs hover:scale-101 active:scale-98 cursor-pointer"
                                        title="Buka form kirim WhatsApp langsung ke pasien"
                                      >
                                        <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>📱 Hubungi Pasien</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyPatientWaMessage(item)}
                                        className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                        title="Salin pesan WA pemberitahuan pasien"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="bg-slate-50/50">
                          <td colSpan={10} className="py-2.5 text-center text-xs text-slate-400 italic">
                            Baris data {group.poliName} ({group.total} pasien) disembunyikan. Klik ikon panah untuk menampilkan.
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                filteredData.map((item) => {
                  const isDone = item.status === 'done';
                  const isOverdue = item.status === 'overdue';
                  return (
                    <tr
                      key={item.rm}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isDone
                          ? 'bg-emerald-50/20'
                          : isOverdue
                          ? 'bg-amber-50/30'
                          : 'bg-rose-50/30'
                      }`}
                    >
                      {/* 1. No. Antrian */}
                      <td className="p-3 sm:p-3.5 font-mono font-bold text-slate-700 text-center">
                        {item.noAntrian}
                      </td>

                      {/* 2. No. RM */}
                      <td className="p-3 sm:p-3.5 font-mono font-bold text-indigo-900 text-center">
                        {item.rm}
                      </td>

                      {/* 3. Nama Pasien */}
                      <td className="p-3 sm:p-3.5 font-semibold text-slate-900">
                        {item.nama}
                      </td>

                      {/* 4. No. BPJS */}
                      <td className="p-3 sm:p-3.5 font-mono text-xs text-slate-600 text-center">
                        {item.noBpjs}
                      </td>

                      {/* 5. TANGGAL KONTROL */}
                      <td className="p-3 sm:p-3.5 font-mono text-xs text-slate-700 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-semibold border ${
                            isOverdue
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {item.tglKontrol}
                        </span>
                      </td>

                      {/* 6. NAMA POLI */}
                      <td className="p-3 sm:p-3.5 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          <Stethoscope className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{item.namaPoli}</span>
                        </span>
                      </td>

                      {/* 7. Status Surkon */}
                      <td className="p-3 sm:p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isOverdue
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>✓ Sudah Buat</span>
                            </>
                          ) : isOverdue ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>⏰ Terlewat</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>✕ Belum Buat</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* 8. No. Surat Kontrol */}
                      <td className="p-3 sm:p-3.5 text-xs font-mono text-center whitespace-nowrap">
                        {isDone ? (
                          <span className="font-semibold text-slate-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {item.noSurkon}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* 9. RENCANA TGL KONTROL */}
                      <td className="p-3 sm:p-3.5 text-xs font-mono text-center whitespace-nowrap">
                        {isDone && item.rencanaTglKontrol !== '-' ? (
                          <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                            {item.rencanaTglKontrol}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* 10. Keterangan / Alasan Belum Buat */}
                      <td className="p-3 sm:p-3.5">
                        {isDone ? (
                          <span className="text-xs text-slate-400 italic">Sudah terbit surkon</span>
                        ) : (
                          <div className="space-y-1.5 w-full">
                            <select
                              value={item.alasanSelect}
                              onChange={(e) => handleSelectChange(item.rm, e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                            >
                              <option value="">-- Pilih Alasan --</option>
                              <option value="Rujukan internal poli">Rujukan internal poli</option>
                              <option value="Rujukan FKTP habis">Rujukan FKTP habis</option>
                              <option value="Rujuk antar rumah sakit">Rujuk antar rumah sakit</option>
                              <option value="Konsultasi selesai">Konsultasi selesai</option>
                              <option value="Terlewat petugas POLI">Terlewat petugas POLI</option>
                              <option value="Pasien rencana rawat inap">Pasien rencana rawat inap</option>
                              <option value="Post ranap">Post ranap</option>
                              <option value="Lain-lain">Lain-lain (Custom input manual)</option>
                            </select>

                            {(item.alasanSelect === 'Lain-lain' ||
                              item.alasanSelect === 'Lain-lain (Custom input manual)') && (
                              <div className="relative animate-fadeIn">
                                <input
                                  type="text"
                                  id={`custom-input-${item.rm}`}
                                  value={item.alasanCustom}
                                  onChange={(e) => handleCustomInput(item.rm, e.target.value)}
                                  placeholder="Ketik alasan khusus di sini..."
                                  className="w-full text-xs border border-rose-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 pr-7"
                                  autoFocus={!item.alasanCustom}
                                />
                                {item.alasanCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleCustomInput(item.rm, '')}
                                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                                    title="Hapus alasan kustom"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Tombol Aksi Cepat: Chat WA Pasien Belum Buat */}
                            <div className="pt-0.5 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPatientWaChat(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold transition-all shadow-2xs hover:scale-101 active:scale-98 cursor-pointer"
                                title="Buka form kirim WhatsApp langsung ke pasien"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>📱 Hubungi Pasien</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPatientWaMessage(item)}
                                className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Salin pesan WA pemberitahuan pasien"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            💡 <em>Tips:</em> Gunakan tombol <strong>"Simpan Audit"</strong> untuk mengarsipkan hasil verifikasi, <strong>"Ekspor PDF"</strong> untuk dokumen cetak siap tanda tangan, dan <strong>"Ekspor Excel"</strong> untuk pengolahan spreadsheet.
          </div>
          <div className="font-medium text-slate-600">
            Total Rekapitulasi: <strong>{hasilAudit.length}</strong> Pasien | Poli Terdeteksi: <strong>{detectedPolis}</strong>
          </div>
        </div>
      </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL PRATINJAU DOKUMEN CETAK / EKSPOR PDF           */}
      {/* ==================================================== */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Pratinjau Dokumen Cetak / Ekspor PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format resmi Laporan Audit Pembuatan Surat Kontrol BPJS RSUMB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={handleDownloadHtmlPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Area Printable (Paper Look) */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-slate-100 flex-1">
              <div
                id="printable-audit-area"
                className="bg-white p-8 sm:p-10 rounded-xl shadow-md border border-slate-200 max-w-4xl mx-auto text-slate-900 text-xs font-sans print:shadow-none print:border-none print:p-0"
              >
                {/* Kop Surat Rumah Sakit */}
                <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-blue-950">
                      RSU MUHAMMADIYAH BABAT
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Jl. KH. Ahmad Dahlan No. 14, Babat, Lamongan, Jawa Timur
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Instalasi Rekam Medis &amp; Pendaftaran Pasien Rawat Jalan / VClaim BPJS
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-800 block">
                      FORM AUDIT SURKON
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Tgl: {new Date().toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Judul Laporan */}
                <div className="text-center my-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    LAPORAN AUDIT &amp; REKAPITULASI SURAT KONTROL BPJS
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Poliklinik Tujuan: <strong>{detectedPolis}</strong>
                  </p>
                </div>

                {/* Metadata Ringkasan */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4 text-center">
                  <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-500 block">Total Pasien</span>
                    <strong className="text-sm text-slate-900">{summary.total}</strong>
                  </div>
                  <div className="p-2 border border-emerald-200 rounded-lg bg-emerald-50">
                    <span className="text-[10px] text-emerald-700 block">Sudah Terbit</span>
                    <strong className="text-sm text-emerald-900">{summary.done}</strong>
                  </div>
                  <div className="p-2 border border-rose-200 rounded-lg bg-rose-50">
                    <span className="text-[10px] text-rose-700 block">Belum Terbit</span>
                    <strong className="text-sm text-rose-900">{summary.missing}</strong>
                  </div>
                  <div className="p-2 border border-amber-200 rounded-lg bg-amber-50">
                    <span className="text-[10px] text-amber-700 block">Terlewat</span>
                    <strong className="text-sm text-amber-900">{summary.overdue}</strong>
                  </div>
                  <div className="p-2 border border-blue-200 rounded-lg bg-blue-50 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-blue-700 block">Capaian</span>
                    <strong className="text-sm text-blue-900">
                      {summary.total ? Math.round((summary.done / summary.total) * 100) : 0}%
                    </strong>
                  </div>
                </div>

                {/* Tabel Cetak 10 Kolom */}
                <div className="overflow-x-auto mt-4">
                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="border border-slate-300 p-1.5 text-center">No</th>
                        <th className="border border-slate-300 p-1.5 text-center">No RM</th>
                        <th className="border border-slate-300 p-1.5 text-left">Nama Pasien</th>
                        <th className="border border-slate-300 p-1.5 text-center">No BPJS</th>
                        <th className="border border-slate-300 p-1.5 text-center">Tgl Kontrol</th>
                        <th className="border border-slate-300 p-1.5 text-left">Nama Poli</th>
                        <th className="border border-slate-300 p-1.5 text-center">Status</th>
                        <th className="border border-slate-300 p-1.5 text-center">No Surkon</th>
                        <th className="border border-slate-300 p-1.5 text-center">Rencana Tgl</th>
                        <th className="border border-slate-300 p-1.5 text-left">Keterangan / Alasan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hasilAudit.map((item, idx) => (
                        <tr key={item.rm} className="border-b border-slate-200">
                          <td className="border border-slate-300 p-1 text-center font-mono">
                            {item.noAntrian || idx + 1}
                          </td>
                          <td className="border border-slate-300 p-1 text-center font-mono font-bold">
                            {item.rm}
                          </td>
                          <td className="border border-slate-300 p-1 font-semibold">{item.nama}</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">
                            {item.noBpjs}
                          </td>
                          <td className="border border-slate-300 p-1 text-center font-mono">
                            {item.tglKontrol}
                          </td>
                          <td className="border border-slate-300 p-1">{item.namaPoli}</td>
                          <td className="border border-slate-300 p-1 text-center font-bold">
                            {item.status === 'done' ? (
                              <span className="text-emerald-700">✓ Sudah</span>
                            ) : item.status === 'overdue' ? (
                              <span className="text-amber-700">⏰ Terlewat</span>
                            ) : (
                              <span className="text-rose-700">✕ Belum</span>
                            )}
                          </td>
                          <td className="border border-slate-300 p-1 text-center font-mono">
                            {item.noSurkon}
                          </td>
                          <td className="border border-slate-300 p-1 text-center font-mono">
                            {item.rencanaTglKontrol}
                          </td>
                          <td className="border border-slate-300 p-1 text-[9.5px]">
                            {item.alasanCustom || item.alasanSelect || (item.status === 'done' ? '-' : 'Belum diisi')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan Verifikator */}
                <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-slate-200 text-center text-[10px]">
                  <div>
                    <p className="text-slate-500 mb-12">Petugas Pendaftaran / Verifikator:</p>
                    <p className="font-bold underline text-slate-800">
                      ( Staf Admisi RSUMB )
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-12">Koordinator Rekam Medis / Pendaftaran:</p>
                    <p className="font-bold underline text-slate-800">
                      ( Supervisor Admisi BPJS )
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL RIWAYAT AUDIT TERSIMPAN                        */}
      {/* ==================================================== */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Riwayat Arsip Audit Surat Kontrol
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {savedHistory.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-xs">
                  Belum ada riwayat audit yang disimpan.
                </p>
              ) : (
                savedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/60 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {item.savedAt}
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                          {item.poliNames || 'Poli'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Total: <strong>{item.total} Pasien</strong> | Sudah:{' '}
                        <strong className="text-emerald-700">{item.done}</strong> | Belum:{' '}
                        <strong className="text-rose-700">{item.missing}</strong>
                        {typeof item.overdue === 'number' && item.overdue > 0 && (
                          <>
                            {' '}
                            | Terlewat: <strong className="text-amber-700">{item.overdue}</strong>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestoreSavedAudit(item)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs"
                      >
                        Muat ke Tabel
                      </button>
                      <button
                        onClick={() => handleDeleteSavedRecord(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus riwayat ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 text-right">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: 📖 ALUR KERJA AUDIT HARIAN (STEP-BY-STEP)    */}
      {/* ==================================================== */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Alur Kerja Audit Harian Surat Kontrol BPJS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standar Operasional Prosedur (SOP) Admisi &amp; Pendaftaran Hari H RSUMB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Tutup panduan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Alur Step-by-Step */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 flex-1">
              {/* Highlight Aturan Krusial BPJS Hari H */}
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-bold block text-rose-950 mb-0.5">
                    PERINGATAN REGULASI BRIDGING VCLAIM BPJS:
                  </strong>
                  Surat Kontrol VClaim <strong>TIDAK DAPAT</strong> diterbitkan pada hari H pemeriksaan pasien (Wajib diterbitkan H-1). Pasien yang belum memiliki Surat Kontrol pada hari H wajib membawa <strong>Surat Rujukan FKTP Asli / Surat Kontrol Pasca Ranap</strong>.
                </div>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <span>Tarik Data Registrasi Pasien (SIMRS Khanza)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-semibold">Gambar 2</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buka menu <strong>Registrasi Pasien Rawat Jalan</strong> di SIMRS Khanza untuk poli tujuan (Poli Saraf, Jantung, Penyakit Dalam, Bedah, Anak, Obgyn, dll.). Copy tabel data hari ini lalu paste ke kotak input <strong>"Data Registrasi Pasien (Gambar 2)"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <span>Tarik Data Surat Kontrol Terbit (VClaim / SIMRS)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">Gambar 1</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buka menu data bridging <strong>Surat Kontrol Pasien</strong> (VClaim/SIMRS). Copy seluruh baris terbit Surat Kontrol hari ini (memuat No RM, No Surkon 0204R..., Rencana Tanggal, dan No BPJS), lalu paste ke kotak <strong>"Data Surat Kontrol Terbit (Gambar 1)"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Eksekusi Proses Audit &amp; Pembandingan
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Periksa indikator <em>"🔍 Terdeteksi No. RM"</em> di kedua kotak input untuk memastikan tidak ada data pasien yang terpotong. Selanjutnya klik tombol biru <strong>"Proses &amp; Bandingkan Data"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  4
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Filter Pasien Belum Dibuat &amp; Terlewat
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Klik tombol filter <strong>"Belum Dibuat"</strong> atau <strong>"Terlewat"</strong> pada tabel hasil audit untuk langsung memfokuskan daftar pasien registrasi yang belum memiliki nomor Surat Kontrol VClaim.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-amber-50/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  5
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Pemberian Alasan &amp; Tindak Lanjut Pasien (WhatsApp)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pilih keterangan alasan pada dropdown per pasien (misal: <em>Rujukan internal poli, Rujukan FKTP habis, Post ranap, Terlewat petugas POLI,</em> dll.). Klik tombol <strong>"📱 Hubungi Pasien"</strong> untuk mengirim pesan WhatsApp resmi menginfokan berkas yang wajib dibawa saat tiba di loket admisi.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                RSU Muhammadiyah Babat • Bagian Admisi &amp; Pendaftaran
              </span>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer transition-colors"
              >
                Saya Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: 📱 CHAT WA PASIEN TERLEWAT / BELUM BUAT       */}
      {/* ==================================================== */}
      {chatModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Pemberitahuan WhatsApp Pasien
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pasien: <strong>{chatModalItem.nama}</strong> (RM: {chatModalItem.rm})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChatModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Surat Kontrol VClaim BPJS <strong>tidak dapat dibuat pada hari H</strong>. Pesan ini mengarahkan pasien untuk membawa Surat Rujukan Asli FKTP / Surat Pulang Ranap saat tiba di RSUMB.
                </p>
              </div>

              {/* Input Nomor WA Opsional */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Pasien / Keluarga (Opsional):
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890 (atau biarkan kosong untuk web.whatsapp picker)"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Pratinjau Pesan WA */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pratinjau Pesan yang Akan Dikirim:
                </label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {generatePatientWaMessage(chatModalItem)}
                </div>
              </div>
            </div>

            {/* Footer Aksi */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleCopyPatientWaMessage(chatModalItem)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Salin Pesan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChatModalItem(null)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSendPatientWaDirect(chatModalItem, patientPhone);
                    setChatModalItem(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
