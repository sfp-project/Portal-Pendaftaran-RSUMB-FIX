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
import { parseSpriText, formatPesananKamarWA, ParsedSpriData } from '../../data/inpatientOrderData';
import { PatientQueueItem } from '../../types';
import { savePatientQueueDoc } from '../../services/firestoreSync';
import { loadMedicalLetters, saveMedicalLetters } from '../../data/letterData';
import { MedicalLetterItem } from '../../types/letterTypes';

interface SpriIcdCodingAssistantTabProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface IcdEntry {
  code: string;
  diagnosis: string;
  specialty: string;
}

const ICD_10_DATABASE: IcdEntry[] = [
  // Sp.PD (Penyakit Dalam)
  { code: 'A91', diagnosis: 'Dengue haemorrhagic fever / DHF / DBD + warning sign', specialty: 'Sp.PD' },
  { code: 'K92.1', diagnosis: 'Melena / Perdarahan Saluran Cerna Bagian Atas', specialty: 'Sp.PD' },
  { code: 'K92.0', diagnosis: 'Hematemesis / Muntah Darah', specialty: 'Sp.PD' },
  { code: 'K92.2', diagnosis: 'Hematemesis Melena / Gastrointestinal Haemorrhage', specialty: 'Sp.PD' },
  { code: 'R57.1', diagnosis: 'Syok Hipovolemia / Hypovolemic Shock', specialty: 'Sp.PD' },
  { code: 'K30', diagnosis: 'Dyspepsia / Dispepsia', specialty: 'Sp.PD' },
  { code: 'K29.7', diagnosis: 'Gastritis, Tidak Spesifik / Maag Akut', specialty: 'Sp.PD' },
  { code: 'E11.9', diagnosis: 'Diabetes Mellitus Tipe 2 Tanpa Komplikasi (DM)', specialty: 'Sp.PD' },
  { code: 'E11.5', diagnosis: 'Diabetic Foot / Gangren Diabetikum', specialty: 'Sp.PD' },
  { code: 'I10', diagnosis: 'Hipertensi Esensial (Primer)', specialty: 'Sp.PD' },
  { code: 'I50.9', diagnosis: 'Gagal Jantung Kongestif (CHF)', specialty: 'Sp.PD' },
  { code: 'I21.9', diagnosis: 'Infark Miokard Akut (STEMI / NSTEMI / Sindrom Koroner)', specialty: 'Sp.PD' },
  { code: 'N18.9', diagnosis: 'Penyakit Ginjal Kronis (CKD / CRF)', specialty: 'Sp.PD' },
  { code: 'N17.9', diagnosis: 'Gagal Ginjal Akut (AKI / ARF)', specialty: 'Sp.PD' },
  { code: 'D64.9', diagnosis: 'Anemia, Tidak Spesifik', specialty: 'Sp.PD' },
  { code: 'A09', diagnosis: 'Gastroenteritis Akut Diduga Infeksi (GEA / Diare Akut)', specialty: 'Sp.PD' },
  { code: 'R50.9', diagnosis: 'Febris / Demam Tidak Spesifik', specialty: 'Sp.PD' },
  { code: 'A41.9', diagnosis: 'Sepsis, Organisme Tidak Spesifik', specialty: 'Sp.PD' },
  { code: 'N39.0', diagnosis: 'Infeksi Saluran Kemih (ISK / UTI)', specialty: 'Sp.PD' },

  // Sp.N (Saraf / Neurologi)
  { code: 'I63.9', diagnosis: 'Stroke Iskemik / Infark Serebral (CVA Iskemik)', specialty: 'Sp.N' },
  { code: 'I61.9', diagnosis: 'Stroke Hemoragik / Pendarahan Intraserebral (ICH / CVA Bleeding)', specialty: 'Sp.N' },
  { code: 'R42', diagnosis: 'Vertigo (Dizziness and Giddiness / BPPV)', specialty: 'Sp.N' },
  { code: 'G44.2', diagnosis: 'Sakit Kepala Tegang (Tension Headache / Cephalea)', specialty: 'Sp.N' },
  { code: 'G40.9', diagnosis: 'Epilepsi / Kejang Berulang', specialty: 'Sp.N' },
  { code: 'G51.0', diagnosis: 'Bell Palsy (Kelumpuhan Saraf Fasial)', specialty: 'Sp.N' },
  { code: 'M54.5', diagnosis: 'Nyeri Punggung Bawah (Low Back Pain / LBP / HNP)', specialty: 'Sp.N' },

  // Sp.B / Sp.OT / Urologi (Bedah, Tulang & Saluran Kemih)
  { code: 'S62.6', diagnosis: 'cf phalang 3 manus s / Fraktur Phalang Jari Tangan (Manus)', specialty: 'Sp.OT' },
  { code: 'R33', diagnosis: 'Retensi Urin / Retensio Urinae', specialty: 'Sp.B' },
  { code: 'N40', diagnosis: 'Benign Prostatic Hyperplasia (BPH / Pembesaran Prostat)', specialty: 'Sp.B' },
  { code: 'N20.1', diagnosis: 'Batu Ureter / Ureterolithiasis', specialty: 'Sp.B' },
  { code: 'N20.0', diagnosis: 'Batu Ginjal / Nefrolitiasis / Batu Saluran Kemih (BSK)', specialty: 'Sp.B' },
  { code: 'C02.9', diagnosis: 'Ca Lidah / Kanker Lidah (Carcinoma of Tongue)', specialty: 'Sp.B' },
  { code: 'C50.9', diagnosis: 'Ca Mammae / Kanker Payudara', specialty: 'Sp.B' },
  { code: 'C18.9', diagnosis: 'Ca Kolon / Kanker Usus Besar', specialty: 'Sp.B' },
  { code: 'S72.9', diagnosis: 'Fraktur Tulang Paha (Femur)', specialty: 'Sp.OT' },
  { code: 'S82.9', diagnosis: 'Fraktur Tungkai Bawah / Cruris / Tibia / Fibula', specialty: 'Sp.OT' },
  { code: 'S52.9', diagnosis: 'Fraktur Lengan Bawah / Antebrachii / Radius / Ulna', specialty: 'Sp.OT' },
  { code: 'S42.0', diagnosis: 'Fraktur Tulang Selangka / Klavikula', specialty: 'Sp.OT' },
  { code: 'K35.8', diagnosis: 'Appendisitis Akut (Usus Buntu)', specialty: 'Sp.B' },
  { code: 'K40.9', diagnosis: 'Hernia Inguinalis Tanpa Obstruksi', specialty: 'Sp.B' },
  { code: 'S01.9', diagnosis: 'Luka Robek Terbuka (Vulnus Laceratum / VL)', specialty: 'Sp.B' },
  { code: 'K64.9', diagnosis: 'Hemoroid / Ambeien / Wasir', specialty: 'Sp.B' },
  { code: 'K80.2', diagnosis: 'Kolelitiasis / Batu Empedu Tanpa Kolesistitis', specialty: 'Sp.B' },

  // Sp.A (Anak)
  { code: 'J18.0', diagnosis: 'Bronkopneumonia Anak', specialty: 'Sp.A' },
  { code: 'R56.0', diagnosis: 'Kejang Demam Sederhana / Kompleks (KDS / KDK)', specialty: 'Sp.A' },
  { code: 'J45.9', diagnosis: 'Asma Bronkial Anak', specialty: 'Sp.A' },
  { code: 'B05.9', diagnosis: 'Morbilli / Campak Tanpa Komplikasi', specialty: 'Sp.A' },
  { code: 'J03.9', diagnosis: 'Tonsilitis Akut', specialty: 'Sp.A' },
  { code: 'P59.9', diagnosis: 'Hiperbilirubin / Neonatal Jaundice / Ikterus Neonatorum (Bayi Kuning)', specialty: 'Sp.A' },
  { code: 'R17', diagnosis: 'Hiperbilirubin Dewasa / Jaundice / Ikterus Tidak Spesifik', specialty: 'Sp.PD' },

  // Sp.OG (Kebidanan & Kandungan)
  { code: 'O80', diagnosis: 'Persalinan Tunggal Spontan (Partus Normal)', specialty: 'Sp.OG' },
  { code: 'O82', diagnosis: 'Persalinan dengan Sectio Caesarea (SC)', specialty: 'Sp.OG' },
  { code: 'O42.9', diagnosis: 'Ketuban Pecah Dini (KPD / PROM)', specialty: 'Sp.OG' },
  { code: 'O14.9', diagnosis: 'Preeklampsia Berat (PEB) / Preeklampsia Ringan', specialty: 'Sp.OG' },
  { code: 'O21.0', diagnosis: 'Hiperemesis Gravidarum (HEG)', specialty: 'Sp.OG' },
  { code: 'O03.4', diagnosis: 'Abortus Inkomplit', specialty: 'Sp.OG' },
  { code: 'D25.9', diagnosis: 'Leiomioma Uteri / Mioma Uteri', specialty: 'Sp.OG' },
  { code: 'N83.2', diagnosis: 'Kista Ovarium', specialty: 'Sp.OG' },
  { code: 'C53.9', diagnosis: 'Ca Serviks / Kanker Leher Rahim', specialty: 'Sp.OG' },

  // Sp.P (Paru)
  { code: 'J18.9', diagnosis: 'Pneumonia Komunitas / Infeksi Paru', specialty: 'Sp.P' },
  { code: 'A15.0', diagnosis: 'Tuberkulosis Paru (TB Paru)', specialty: 'Sp.P' },
  { code: 'J44.1', diagnosis: 'PPOK dengan Eksaserbasi Akut (COPD)', specialty: 'Sp.P' },
  { code: 'J90', diagnosis: 'Efusi Pleura', specialty: 'Sp.P' },
  { code: 'J45.9', diagnosis: 'Asma Bronkial Eksaserbasi Akut', specialty: 'Sp.P' },
  { code: 'C34.9', diagnosis: 'Ca Paru / Kanker Paru-Paru', specialty: 'Sp.P' },

  // Diagnosa Tambahan: Kardiovaskular, Gastro & Psikosomatis, Hipotensi & Anemia Gravis
  { code: 'I95.9', diagnosis: 'Hipotensi, Tidak Spesifik / Penurunan Tekanan Darah (Hipotensi Ortostatik)', specialty: 'Sp.PD' },
  { code: 'R07.9', diagnosis: 'Chest Pain / Nyeri Dada, Tidak Spesifik', specialty: 'Sp.PD' },
  { code: 'I20.9', diagnosis: 'Angina Pectoris, Tidak Spesifik / Penyakit Jantung Koroner', specialty: 'Sp.PD' },
  { code: 'K21.9', diagnosis: 'Gastro-Oesophageal Reflux Disease (GERD / Asam Lambung)', specialty: 'Sp.PD' },
  { code: 'F45.9', diagnosis: 'Gangguan Somatoform / Gangguan Psikosomatis (Psikomatis)', specialty: 'Sp.N' }
];

export function matchIcdForPart(rawPart: string): string {
  const clean = rawPart.trim().toLowerCase();
  if (!clean) return '';

  // 1. Direct code match like K92.1 atau (R33)
  const directMatch = clean.match(/\b([a-z]\d{2}(?:\.\d+)?)\b/i);
  if (directMatch && !/th|bln|kls/i.test(directMatch[1])) {
    return directMatch[1].toUpperCase();
  }

  // 2. Exact Medis Keyword & Pola Klinis RSUMB
  // Hiperbilirubin / Neonatal Jaundice -> P59.9
  if (/hiperbilirubin|bilirubin|ikterus|neonatal\s*jaundice|jaundice|bayi\s*kuning/i.test(clean)) return 'P59.9';

  if (/cf\s*phalang|fraktur\s*phalang|phalang.*manus|fracture.*finger/i.test(clean)) return 'S62.6';
  if (/retensi\s*urin|retensio\s*urina/i.test(clean)) return 'R33';
  if (/\bbph\b|benign\s*prostat|prostat/i.test(clean)) return 'N40';
  if (/melena/i.test(clean)) return 'K92.1';
  if (/hematemesis.*melena/i.test(clean)) return 'K92.2';
  if (/hematemesis|muntah\s*darah/i.test(clean)) return 'K92.0';
  if (/syok\s*hipovolem/i.test(clean)) return 'R57.1';
  if (/ca\s*lidah|kanker\s*lidah/i.test(clean)) return 'C02.9';
  if (/ca\s*paru|kanker\s*paru/i.test(clean)) return 'C34.9';
  if (/ca\s*mammae|kanker\s*payudara/i.test(clean)) return 'C50.9';
  if (/ca\s*kolon|kanker\s*kolon|kanker\s*usus/i.test(clean)) return 'C18.9';
  if (/ca\s*serviks|kanker\s*serviks/i.test(clean)) return 'C53.9';
  if (/batu\s*ureter|ureterolitiasis/i.test(clean)) return 'N20.1';
  if (/batu\s*(?:saluran\s*kemih|ginjal)|bsk|nefrolitiasis/i.test(clean)) return 'N20.0';
  if (/dhf|dbd|dengue/i.test(clean)) return 'A91';
  if (/dyspepsia|dispepsia/i.test(clean)) return 'K30';
  if (/gastritis|maag/i.test(clean)) return 'K29.7';
  if (/chf|gagal\s*jantung/i.test(clean)) return 'I50.9';
  if (/stemi|nstemi|koroner/i.test(clean)) return 'I21.9';
  if (/\bhipertensi\b|\bht\b/i.test(clean)) return 'I10';
  if (/hipotensi|hypotension/i.test(clean)) return 'I95.9';
  if (/anemia/i.test(clean)) return 'D64.9';
  if (/vertigo/i.test(clean)) return 'R42';
  if (/fraktur\s*femur/i.test(clean)) return 'S72.9';
  if (/fraktur\s*tibia|fraktur\s*cruris/i.test(clean)) return 'S82.9';
  if (/fraktur\s*(?:antebrachii|radius|ulna)/i.test(clean)) return 'S52.9';
  if (/fraktur\s*(?:clavicle|klavikula)/i.test(clean)) return 'S42.0';
  if (/appendisitis|apendisitis|usus\s*buntu/i.test(clean)) return 'K35.8';
  if (/hernia/i.test(clean)) return 'K40.9';
  if (/vulnus\s*laceratum|luka\s*robek|\bvl\b/i.test(clean)) return 'S01.9';
  if (/hemoroid|wasir|ambeien/i.test(clean)) return 'K64.9';
  if (/bronkopneumonia/i.test(clean)) return 'J18.0';
  if (/pneumonia/i.test(clean)) return 'J18.9';
  if (/tb\s*paru|tbc/i.test(clean)) return 'A15.0';
  if (/asma|asthma/i.test(clean)) return 'J45.9';
  if (/ppok|copd/i.test(clean)) return 'J44.1';
  if (/efusi\s*pleura/i.test(clean)) return 'J90';
  if (/\bkpd\b|ketuban\s*pecah/i.test(clean)) return 'O42.9';
  if (/sectio\s*caesarea|\bsc\b/i.test(clean)) return 'O82';
  if (/stroke\s*iskemik|infark\s*serebral/i.test(clean)) return 'I63.9';
  if (/stroke\s*hemoragik|\bich\b/i.test(clean)) return 'I61.9';
  if (/stroke|cva/i.test(clean)) return 'I63.9';
  if (/kejang\s*demam|\bkds\b|\bkdk\b/i.test(clean)) return 'R56.0';
  if (/\bdm\b|diabetes/i.test(clean)) return 'E11.9';
  if (/\bckd\b|\bcrf\b|gagal\s*ginjal/i.test(clean)) return 'N18.9';
  if (/febris|demam/i.test(clean)) return 'R50.9';
  if (/\bgea\b|gastroenteritis/i.test(clean)) return 'A09';
  if (/sepsis/i.test(clean)) return 'A41.9';
  if (/\bisk\b|\buti\b|infeksi\s*saluran\s*kemih/i.test(clean)) return 'N39.0';
  if ((/preeklampsia|\bpeb\b/i.test(clean) || /\bper\b/i.test(clean)) && !/hiper/i.test(clean)) return 'O14.9';
  if (/hiperemesis|\bheg\b/i.test(clean)) return 'O21.0';
  if (/abortus/i.test(clean)) return 'O03.4';
  if (/mioma/i.test(clean)) return 'D25.9';
  if (/kista/i.test(clean)) return 'N83.2';

  // Chest pain, Angina, GERD, Psikosomatis (Spesifik Permintaan Pasien)
  if (/chest\s*pain/i.test(clean)) return 'R07.9';
  if (/angina/i.test(clean)) return 'I20.9';
  if (/gerd|refluks|gastroesophag/i.test(clean)) return 'K21.9';
  if (/psiko(?:matis|somatis)|somatoform/i.test(clean)) return 'F45.9';

  // 3. Dynamic lookup across ICD_10_DATABASE (menggunakan token boundary yang ketat)
  const found = ICD_10_DATABASE.find((item) => {
    const d = item.diagnosis.toLowerCase();
    if (d.includes(clean)) return true;
    const tokens = d.split(/[/(),\s]+/).filter((t) => t.length >= 4);
    return tokens.some((t) => {
      const reg = new RegExp(`\\b${t}\\b`, 'i');
      return reg.test(clean);
    });
  });

  return found ? found.code : '';
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
      umur: p.umur,
      diagnosa: cleanDiagBase,
      kodeIcd10: combinedCodes,
      dpjp: p.dpjp,
      caraBayar: p.caraBayar,
      kelasKamar: p.kelasKamar
    };
  }, [rawText]);

  // 2. KELAS KAMAR & CARA BAYAR SINKRONISASI 100% DENGAN DROPDOWN USER
  // Deteksi apakah teks input diakhiri instruksi cepat pengguna (misal: "BPJS 3", "UMUM 1", "PENGURUSAN JR/LP VIP")
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
    
    // ... logic sisanya tetap sama ...
    
    // 1. ANALISIS SEMUA DIAGNOSA & KODE ICD-10 GABUNGAN
    const rawDiag = result.diagnosa;
    const diagParts = rawDiag
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

    const combinedIcdCodes = detectedCodes.join(' / ');
    const enrichedDiagnosa = combinedIcdCodes ? `${cleanedParts.join(' / ')} (${combinedIcdCodes})` : rawDiag;
    
    // ... sisanya ...


    // 2. KELAS KAMAR & CARA BAYAR SINKRONISASI 100% DENGAN DROPDOWN USER
    let activeCaraBayar = caraBayar;
    let activeKelas = kelasKamar;
    
    // Jika ada override di teks SPRI
    const quickOverrideMatch = textToParse.match(
      /(?:^|\n|\s)(UMUM|BPJS|PENGURUSAN\s*JR\/?LP|KAI|BPJS\s*TK|ADMEDIKA|BRI\s*LIFE)\s*(3|2|1|VIP|VVIP)$/i
    );
    if (quickOverrideMatch) {
       // ... deteksi matching sudah dilakukan di autoDetectConfig ...
       activeCaraBayar = caraBayar; 
       activeKelas = kelasKamar;
    }

    const effectiveBayar =
      (activeCaraBayar === 'Lainnya / Custom' ? (customCaraBayar || 'UMUM') : activeCaraBayar).toUpperCase().replace(/\s*(?:KLS|KELAS)?\s*(?:3|2|1|VIP|VVIP)$/i, '').trim();
    const cleanKelasKamar = activeKelas.replace(/^(?:Kelas|Kls)\s*/i, '');

    const formattedWA = formatPesananKamarWA({
      nama: result.nama,
      umur: result.umur,
      diagnosa: enrichedDiagnosa,
      kodeIcd10: combinedIcdCodes,
      dpjp: result.dpjp,
      caraBayar: effectiveBayar,
      kelasKamar: cleanKelasKamar
    });

    const finalResult: ParsedSpriData = {
      ...result,
      diagnosa: enrichedDiagnosa,
      kodeIcd10: combinedIcdCodes,
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
          <div className="flex items-center gap-1.5 flex-wrap">

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
              placeholder="Tempel (Paste) teks mentah SPRI dari SIMRS di sini...&#10;Contoh format SIMRS multi-line:&#10;Nama Pasien : MAMIK DIYAN NOFERA. NY&#10;Umur : 42 Th&#10;Diagnosa Awal :&#10;chest pain s angina dd gerd dd psikomatis&#10;Kamar Diminta : Kelas 3&#10;DPJP : dr. Bagas Setiawan Ihsan&#10;BPJS 3&#10;&#10;(💡 Tips Cepat: Tekan Ctrl + Enter untuk langsung mengekstrak dan men-generate pesan WA)"
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Kelas Kamar</span>
                    <span className="text-xs font-black text-[#005d42]">Kelas {parsedData.kelasKamar || '-'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Kode ICD-10</span>
                    <span className="text-xs font-black font-mono text-blue-700">{parsedData.kodeIcd10 || '-'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">DPJP Utama</span>
                    <span className="text-xs font-black text-slate-800 truncate block">{parsedData.dpjp || '-'}</span>
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
                  <th className="py-2.5 px-3 w-28 text-center">Aksi</th>
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

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
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
              @page { size: auto; margin: 10mm; }
              body * { visibility: hidden; }
              #print-content, #print-content * { visibility: visible; }
              #print-content { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>
          <div id="print-content" className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
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
                    Filter Penjamin Aktif: <b className="text-slate-800">{historyPenjaminFilter}</b> • Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="border border-slate-300 py-2 px-3 text-center w-12">No</th>
                        <th className="border border-slate-300 py-2 px-3">Waktu</th>
                        <th className="border border-slate-300 py-2 px-3">No. RM &amp; Nama Pasien</th>
                        <th className="border border-slate-300 py-2 px-3">Diagnosa &amp; ICD-10</th>
                        <th className="border border-slate-300 py-2 px-3">Penjamin / Kelas</th>
                        <th className="border border-slate-300 py-2 px-3 text-center">Status Berkas Admisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessionLogs.length > 0 ? (
                        filteredSessionLogs.map((log, idx) => {
                          const progress = getChecklistProgress(log);
                          return (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="border border-slate-300 py-2 px-3 text-center font-bold">{idx + 1}</td>
                              <td className="border border-slate-300 py-2 px-3 font-mono">{log.timestamp}</td>
                              <td className="border border-slate-300 py-2 px-3">
                                <div className="font-bold">{log.pasien}</div>
                                <div className="font-mono text-[10px] text-slate-500">RM: {log.rm}</div>
                              </td>
                              <td className="border border-slate-300 py-2 px-3">
                                <div>{log.diagnosa}</div>
                                <div className="text-[10px] text-slate-500">DPJP: {log.dpjp}</div>
                              </td>
                              <td className="border border-slate-300 py-2 px-3">
                                <span className="font-bold">{log.penjamin}</span> (Kelas {log.kelas})
                              </td>
                              <td className="border border-slate-300 py-2 px-3 text-center">
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                  progress.isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {progress.isComplete ? 'LENGKAP 100%' : `PROSES (${progress.checked}/${progress.total})`}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
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
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={14} />
                  <span>Cetak Dokumen (Print)</span>
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
