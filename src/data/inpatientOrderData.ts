import {
  IndenPatient,
  UnitRanap,
  LantaiKamarKosong,
  StatusInden
} from '../types/inpatientOrderTypes';
import { MASTER_DOCTORS } from './initialData';

export const COMMON_ICD10_LIST = [
  { code: 'I50.9', diagnosa: 'DYSPNEU S ADHF (Heart Failure)' },
  { code: 'R06.0', diagnosa: 'Dyspnea / Sesak Napas' },
  { code: 'A91', diagnosa: 'Dengue Hemorrhagic Fever (DHF)' },
  { code: 'A90', diagnosa: 'Dengue Fever (DF)' },
  { code: 'A09', diagnosa: 'Gastroenteritis Akut (GEA) / Diare' },
  { code: 'K30', diagnosa: 'Dyspepsia / Sindrom Dispepsia' },
  { code: 'J18.0', diagnosa: 'Bronkopneumonia' },
  { code: 'J44.1', diagnosa: 'PPOK Eksaserbasi Akut' },
  { code: 'I50', diagnosa: 'Acute Decompensated Heart Failure (ADHF)' },
  { code: 'I10', diagnosa: 'Hipertensi Esensial' },
  { code: 'E11.9', diagnosa: 'Diabetes Melitus Tipe 2 (DMT2)' },
  { code: 'K40.9', diagnosa: 'Hernia Inguinalis Unilateral' },
  { code: 'K35.8', diagnosa: 'Apendisitis Akut' },
  { code: 'O80', diagnosa: 'Persalinan Spontan Kepala' },
  { code: 'O82', diagnosa: 'Persalinan Seksio Sesarea (SC)' },
  { code: 'O42.9', diagnosa: 'Ketuban Pecah Dini (KPD)' },
  { code: 'N39.0', diagnosa: 'Infeksi Saluran Kemih (ISK)' },
  { code: 'S06.0', diagnosa: 'Cedera Kepala Ringan (CKR)' },
  { code: 'J45.9', diagnosa: 'Asma Bronkial Eksaserbasi' },
  { code: 'N18.9', diagnosa: 'Chronic Kidney Disease (CKD)' },
  { code: 'K29.7', diagnosa: 'Gastritis Akut' },
  { code: 'A41.9', diagnosa: 'Sepsis Akut' },
  { code: 'B01.9', diagnosa: 'Varicella (Cacar Air)' },
  { code: 'R50.9', diagnosa: 'Febris H-3 Observasi' }
];

const doctorNames = new Set(MASTER_DOCTORS.map(d => d.dpjp));
doctorNames.add('dr. Ilma Alfia Isaridha, Sp.JP.');
doctorNames.add('dr. Ilma Alifa I., Sp. JP');
doctorNames.add('dr. Rieski Widhanar, Sp. B');
doctorNames.add('dr. Ilham Basjar, Sp. PD');
doctorNames.add('dr. Yhang Lidi Tama, Sp.PD');
doctorNames.add('dr. Taufiqur Rahman, Sp. A');
doctorNames.add('dr. Erliana, Sp. OG');
doctorNames.add('dr. Alfian, Sp. OT');
doctorNames.add('dr. M. Syafik, Sp. An');

export const LIST_DPJP_RSUMB = Array.from(doctorNames).sort();

export const CARA_BAYAR_KELAS_OPTIONS = [
  'BPJS KLS 3',
  'BPJS KLS 2',
  'BPJS KLS 1',
  'UMUM KLS 3',
  'UMUM KLS 2',
  'UMUM KLS 1',
  'UMUM (VIP)',
  'UMUM (VVIP)',
  'ASURANSI (KAI)',
  'ASURANSI (AdMedika)',
  'ASURANSI (BRI Life)',
  'ASURANSI (Mandiri Inhealth)',
  'JASA RAHARJA (JR)',
  'BPJS KETENAGAKERJAAN'
];

export const KELAS_KAMAR_OPTIONS = [
  'VVIP',
  'VIP',
  'Kelas 1',
  'Kelas 1 (Anak)',
  'Kelas 1 (Umum)',
  'Kelas 2',
  'Kelas 2 (Bedah)',
  'Kelas 3',
  'Kelas 3 (Paru)',
  'Kelas 3 (Bedah)',
  'VK (Kamar Bersalin)',
  'ICU'
];

export const STATUS_INDEN_OPTIONS: {
  value: StatusInden;
  label: string;
  shortLabel: string;
  color: string;
  badgeBg: string;
  isRedAlert?: boolean;
}[] = [
  {
    value: 'MENUNGGU RESPON / BELUM ADA KAMAR',
    label: 'MENUNGGU RESPON / BELUM ADA KAMAR',
    shortLabel: 'BELUM ADA KAMAR',
    color: 'text-red-700',
    badgeBg: 'bg-red-600 text-white shadow-md animate-pulse font-bold',
    isRedAlert: true
  },
  {
    value: 'Tunggu Bed',
    label: 'Tunggu Bed (Belum Dapat Kamar)',
    shortLabel: 'Belum Ada Bed',
    color: 'text-red-700',
    badgeBg: 'bg-red-600 text-white shadow-md animate-pulse font-bold',
    isRedAlert: true
  },
  {
    value: 'Kamar Siap',
    label: 'Kamar Siap / Diberikan',
    shortLabel: 'Kamar Siap',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-600 text-white font-bold'
  },
  {
    value: 'Tunggu UV',
    label: 'Tunggu UV (Sterilisasi)',
    shortLabel: 'Tunggu UV',
    color: 'text-purple-700',
    badgeBg: 'bg-purple-100 border-purple-300 text-purple-800'
  },
  {
    value: 'Tunggu Visit',
    label: 'Tunggu Visit DPJP',
    shortLabel: 'Tunggu Visit',
    color: 'text-blue-700',
    badgeBg: 'bg-blue-100 border-blue-300 text-blue-800'
  },
  {
    value: 'Tunggu Dibersihkan',
    label: 'Tunggu Dibersihkan / Linen',
    shortLabel: 'Tunggu Bersih',
    color: 'text-amber-700',
    badgeBg: 'bg-amber-100 border-amber-300 text-amber-800'
  },
  {
    value: 'Siap Masuk',
    label: 'Siap Masuk (Bed Ready)',
    shortLabel: 'Siap Masuk',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-600 text-white font-bold'
  },
  {
    value: 'Sudah Masuk',
    label: 'Sudah Masuk Kamar',
    shortLabel: 'Sudah Masuk',
    color: 'text-slate-600',
    badgeBg: 'bg-slate-100 border-slate-300 text-slate-700'
  }
];

export const UNIT_CONFIG: Record<
  UnitRanap,
  { label: string; shortName: string; desc: string; icon: string; defaultBeds: string[] }
> = {
  lt4: {
    label: 'LT 4 (JF, JN)',
    shortName: 'LT 4 (JF, JN)',
    desc: 'Jannatul Firdaus & Jannatun Na\'im (Kls 1, 2, 3)',
    icon: '🏢',
    defaultBeds: ['JN 10B', 'JN 11A', 'JN 1B', 'JN 2A', 'JN 3A', 'JN 3B', 'JN 4A', 'JN 5A', 'JF 1A', 'JF 2A']
  },
  lt5: {
    label: 'LT 5 (JM)',
    shortName: 'LT 5 (JM)',
    desc: 'Jannatun Ma\'wa (VVIP, VIP, Kls 1)',
    icon: '🏨',
    defaultBeds: ['VIP 8', 'VIP 9', 'VIP 10', 'VVIP 1', 'JM 1A', 'JM 2A']
  },
  vk: {
    label: 'VK (DARUSSALAM)',
    shortName: 'VK (DARUSSALAM)',
    desc: 'Kamar Bersalin & Nifas Darussalam',
    icon: '👶',
    defaultBeds: ['VK 1', 'VK 2', 'VK 3', 'Darussalam 1', 'Darussalam 2']
  },
  icu: {
    label: 'ICU',
    shortName: 'ICU',
    desc: 'Intensive Care Unit & Isolasi',
    icon: '🩺',
    defaultBeds: ['Bed ICU 1', 'Bed ICU 2', 'Bed ICU 3', 'Isolasi ICU']
  }
};

export const INITIAL_INDEN_PATIENTS: IndenPatient[] = [
  {
    id: 'inden-lt4-1',
    nama: 'KARMANI. NY',
    umur: '65 Th',
    diagnosa: 'DYSPNEU S ADHF',
    kodeIcd10: 'I50.9',
    dpjp: 'dr. Ilma Alfia Isaridha, Sp.JP.',
    caraBayar: 'BPJS KLS 3',
    kelasKamar: 'Kelas 3',
    lantai: 'lt4',
    nomorBedTarget: '',
    status: 'MENUNGGU RESPON / BELUM ADA KAMAR', // BELUM DAPAT KAMAR (MERAH MENCOLOK)
    catatan: 'Pasien rujukan IGD dengan keluhan sesak nafas mendadak. Belum dapat bed (tunggu konfirmasi Lantai 4).',
    waktuPesan: '2026-10-08 08:30 WIB',
    kontakPasien: '081234567890'
  },
  {
    id: 'inden-lt4-2',
    nama: 'ANANDA BIMA. AN',
    umur: '5 Th',
    diagnosa: 'Bronkopneumonia',
    kodeIcd10: 'J18.0',
    dpjp: 'dr. Taufiqur Rahman, Sp. A',
    caraBayar: 'UMUM KLS 1',
    kelasKamar: 'Kelas 1 (Anak)',
    lantai: 'lt4',
    nomorBedTarget: 'JN 10B',
    status: 'Kamar Siap',
    catatan: 'Pasien dari IGD, infus D5 1/4 NS lancar. Kamar sedang diganti sprei.',
    waktuPesan: '2026-10-08 09:15 WIB',
    kontakPasien: '085712345678'
  },
  {
    id: 'inden-lt4-3',
    nama: 'Tn. SURYADI',
    umur: '48 Th',
    diagnosa: 'Hernia Inguinalis Sinistra',
    kodeIcd10: 'K40.9',
    dpjp: 'dr. Rieski Widhanar, Sp. B',
    caraBayar: 'BPJS KLS 2',
    kelasKamar: 'Kelas 2 (Bedah)',
    lantai: 'lt4',
    nomorBedTarget: 'JN 1B',
    status: 'Kamar Siap',
    catatan: 'Rencana operasi elektif besok pagi, menunggu visit DPJP Bedah.',
    waktuPesan: '2026-10-08 09:45 WIB',
    kontakPasien: '081398765432'
  },
  {
    id: 'inden-lt5-1',
    nama: 'Ny. SITI FATIMAH',
    umur: '32 Th',
    diagnosa: 'G2P1A0 Gravida Aterm + Rencana SC',
    kodeIcd10: 'O82',
    dpjp: 'dr. Erliana, Sp. OG',
    caraBayar: 'BPJS KLS 1',
    kelasKamar: 'Kelas 1',
    lantai: 'lt5',
    nomorBedTarget: '',
    status: 'MENUNGGU RESPON / BELUM ADA KAMAR', // BELUM DAPAT KAMAR (MERAH MENCOLOK)
    catatan: 'Persiapan tindakan SC siang ini jam 13.00 WIB. Kamar kelas 1 lantai 5 masih penuh.',
    waktuPesan: '2026-10-08 09:10 WIB',
    kontakPasien: '081299887766'
  },
  {
    id: 'inden-lt5-2',
    nama: 'H. ACHMAD FAUZI',
    umur: '58 Th',
    diagnosa: 'Dyspepsia Syndrome',
    kodeIcd10: 'K30',
    dpjp: 'dr. Yhang Lidi Tama, Sp.PD',
    caraBayar: 'UMUM (VIP)',
    kelasKamar: 'VIP',
    lantai: 'lt5',
    nomorBedTarget: 'VIP 8',
    status: 'Tunggu UV',
    catatan: 'Minta kamar yang tenang & tidak dekat nurse station.',
    waktuPesan: '2026-10-08 08:00 WIB',
    kontakPasien: '082155667788'
  },
  {
    id: 'inden-vk-1',
    nama: 'Ny. NURUL HIDAYATI',
    umur: '26 Th',
    diagnosa: 'Inpartu Kala 1 Fase Aktif',
    kodeIcd10: 'O80',
    dpjp: 'dr. Erliana, Sp. OG',
    caraBayar: 'BPJS KLS 3',
    kelasKamar: 'VK (Kamar Bersalin)',
    lantai: 'vk',
    nomorBedTarget: '',
    status: 'MENUNGGU RESPON / BELUM ADA KAMAR', // BELUM DAPAT BED (MERAH MENCOLOK)
    catatan: 'Pembukaan 4 cm, his adekuat. Menunggu bed VK 1 siap setelah partus sebelumnya.',
    waktuPesan: '2026-10-08 09:30 WIB',
    kontakPasien: '081333445566'
  },
  {
    id: 'inden-vk-2',
    nama: 'Ny. DEWI ANGGRAENI',
    umur: '29 Th',
    diagnosa: 'Ketuban Pecah Dini (KPD)',
    kodeIcd10: 'O42.9',
    dpjp: 'dr. Erliana, Sp. OG',
    caraBayar: 'UMUM KLS 1',
    kelasKamar: 'VK (Kamar Bersalin)',
    lantai: 'vk',
    nomorBedTarget: 'VK 2',
    status: 'Siap Masuk',
    catatan: 'Bed siap, observasi DJJ dan his.',
    waktuPesan: '2026-10-08 09:00 WIB',
    kontakPasien: '087788990011'
  },
  {
    id: 'inden-icu-1',
    nama: 'Tn. SUBANDI',
    umur: '62 Th',
    diagnosa: 'Sepsis ec Pneumonia Berat',
    kodeIcd10: 'A41.9',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    caraBayar: 'BPJS KLS 1',
    kelasKamar: 'ICU',
    lantai: 'icu',
    nomorBedTarget: '',
    status: 'MENUNGGU RESPON / BELUM ADA KAMAR', // BELUM DAPAT BED (MERAH MENCOLOK)
    catatan: 'Penurunan kesadaran di IGD, butuh ventilator. Ruangan ICU penuh, koordinasi DPJP Intensivis.',
    waktuPesan: '2026-10-08 07:45 WIB',
    kontakPasien: '082211447788'
  },
  {
    id: 'inden-icu-2',
    nama: 'Tn. MOCHAMMAD ALI',
    umur: '55 Th',
    diagnosa: 'Post Laparatomi Eksplorasi',
    kodeIcd10: 'K35.8',
    dpjp: 'dr. Rieski Widhanar, Sp. B',
    caraBayar: 'BPJS KLS 2',
    kelasKamar: 'ICU',
    lantai: 'icu',
    nomorBedTarget: 'Bed ICU 1',
    status: 'Sudah Masuk',
    catatan: 'Pasien pindahan dari OK, hemodinamik terpantau stabil.',
    waktuPesan: '2026-10-08 06:30 WIB',
    kontakPasien: '081233221100'
  }
];

export const INITIAL_KAMAR_KOSONG_LT4: LantaiKamarKosong = {
  lantai: 'lt4',
  label: 'Lantai 4',
  headerText: 'list kamar kosong lt. 4 :',
  lastUpdated: '08 Oktober 2026, 09.00 WIB',
  kategori: [
    {
      id: 'k1-vvip',
      label: '1. VVIP',
      isPenuh: true,
      beds: []
    },
    {
      id: 'k2-vip',
      label: '2. VIP',
      isPenuh: false,
      beds: ['VIP 8', 'VIP 9']
    },
    {
      id: 'k3-kls1',
      label: '3. Kelas 1',
      subKategori: [
        { nama: 'Anak', isPenuh: false, beds: ['JN 10B'] },
        { nama: 'Umum', isPenuh: false, beds: ['JN 11A'] }
      ]
    },
    {
      id: 'k4-kls2',
      label: '4. Kelas 2 :',
      subKategori: [
        { nama: 'Bedah', isPenuh: false, beds: ['JN 1B'] }
      ]
    },
    {
      id: 'k5-kls3',
      label: '5. Kelas 3 :',
      subKategori: [
        { nama: 'Paru', isPenuh: false, beds: ['JN 3A'] },
        { nama: 'Bedah', isPenuh: true, beds: [] }
      ]
    }
  ]
};

export const INITIAL_KAMAR_KOSONG_LT5: LantaiKamarKosong = {
  lantai: 'lt5',
  label: 'Lantai 5',
  headerText: 'list kamar kosong lt. 5 :',
  lastUpdated: '08 Oktober 2026, 09.00 WIB',
  kategori: [
    {
      id: 'lt5-vvip',
      label: '1. VVIP',
      isPenuh: false,
      beds: ['VVIP 1']
    },
    {
      id: 'lt5-vip',
      label: '2. VIP',
      isPenuh: false,
      beds: ['VIP 8', 'VIP 10']
    },
    {
      id: 'lt5-kls1',
      label: '3. Kelas 1',
      subKategori: [
        { nama: 'Umum', isPenuh: false, beds: ['LT5 1A', 'LT5 2A'] }
      ]
    },
    {
      id: 'lt5-kls2',
      label: '4. Kelas 2 :',
      isPenuh: true,
      beds: []
    },
    {
      id: 'lt5-kls3',
      label: '5. Kelas 3 :',
      isPenuh: true,
      beds: []
    }
  ]
};

/**
 * Smart SPRI (Formulir Permintaan Rawat Inap) Parser
 */
export interface ParsedSpriData {
  nama: string;
  umur: string;
  diagnosa: string;
  kodeIcd10: string;
  dpjp: string;
  caraBayar: string;
  kelasKamar: string;
  rawText: string;
}

export const parseSpriText = (raw: string): ParsedSpriData => {
  if (!raw || !raw.trim()) {
    return {
      nama: '',
      umur: '',
      diagnosa: '',
      kodeIcd10: '',
      dpjp: 'dr. Ilma Alfia Isaridha, Sp.JP.',
      caraBayar: 'BPJS KLS 3',
      kelasKamar: 'Kelas 3',
      rawText: ''
    };
  }

  const text = raw.trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let nama = '';
  let umur = '';
  let diagnosa = '';
  let kodeIcd10 = '';
  let dpjp = '';
  let caraBayar = '';
  let kelasKamar = '';

  // 1. Check for single-line format like: KARMANI. NY / 65 Th
  for (const line of lines) {
    const nameAgeMatch = line.match(/^([A-Za-z0-9\s.,'\-()]+?)\s*[/]\s*(\d+\s*(?:Th|Tahun|Bln|Bulan|th|tahun|Hr|Hari)?)$/i);
    if (nameAgeMatch) {
      if (!nama) nama = nameAgeMatch[1].trim();
      if (!umur) umur = nameAgeMatch[2].trim();
      break;
    }
  }

  // 2. Line by line regex parsing
  for (const line of lines) {
    // Nama Pasien
    const mNama = line.match(/(?:Nama\s*Pasien|Nama\s*Px|Nama)\s*[:=\t-]\s*([^\n\r]+)/i);
    if (mNama && !nama) {
      const val = mNama[1].trim();
      if (val.includes('/')) {
        const parts = val.split('/');
        nama = parts[0].trim();
        if (parts[1] && !umur) umur = parts[1].trim();
      } else {
        nama = val;
      }
    }

    // Umur / Usia
    const mUmur = line.match(/(?:Umur|Usia)\s*[:=\t-]\s*([^\n\r]+)/i);
    if (mUmur && !umur) {
      umur = mUmur[1].trim();
    }

    // Diagnosa Awal / Diagnosis / Dx
    const mDiag = line.match(/(?:Diagnosa\s*Awal|Diagnosa|Diagnosis|Dx|Diag)\s*[:=\t-]\s*([^\n\r]+)/i);
    if (mDiag && !diagnosa) {
      diagnosa = mDiag[1].trim();
    }

    // Kode ICD-10 explicitly
    const mIcd = line.match(/(?:Kode\s*ICD[- ]?10|ICD[- ]?10|Kode)\s*[:=\t-]\s*([^\n\r]+)/i);
    if (mIcd && !kodeIcd10) {
      kodeIcd10 = mIcd[1].trim().replace(/[\[\]()]/g, '');
    }

    // DPJP / Dokter
    const mDpjp = line.match(/(?:Dokter\s*DPJP|DPJP|Dokter\s*Pengirim|Dokter\s*Pemeriksa|Dokter)\s*[:=\t-]\s*([^\n\r]+)/i);
    if (mDpjp && !dpjp) {
      dpjp = mDpjp[1].trim();
    }

    // Penjamin / Cara Bayar / Jaminan
    const mBayar = line.match(/(?:Penjamin\s*[/]?\s*Cara\s*Bayar|Penjamin|Cara\s*Bayar|Jenis\s*Pasien|Jaminan|Status\s*Pasien)\s*[:=\t-]\s*([^\n\r]+)/i);
    if (mBayar && !caraBayar) {
      caraBayar = mBayar[1].trim();
    }

    // Kelas Kamar / Ruang Tujuan / Kelas
    const mKls = line.match(/(?:Kelas\s*Kamar|Kelas\s*Rawat|Hak\s*Kelas|Kelas|Ruang\s*Tujuan)\s*[:=\t-]\s*([^\n\r]+)/i);
    if (mKls && !kelasKamar) {
      kelasKamar = mKls[1].trim();
    }
  }

  // 2.5 Parsing baris tanpa label (seperti format SIMRS SPRI cetak: No RM -> Nama -> Gender -> Umur -> Diagnosa -> DPJP)
  if (!nama || !umur || !diagnosa || !dpjp) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // A. Umur jika baris berdiri sendiri e.g. "65 Th", "65 Tahun", "25 th"
      if (!umur) {
        const mStandaloneAge = line.match(/^\s*(\d{1,3})\s*(?:Th|Tahun|Bln|Bulan|th|tahun|Hr|Hari)\s*$/i);
        if (mStandaloneAge) {
          umur = `${mStandaloneAge[1]} Th`;
        }
      }

      // B. Nama Pasien:
      // - Berakhiran atau berawalan Ny, Tn, An, By, Nn misal "KARMANI. NY" atau "NY. KARMANI"
      // - Atau berada tepat di atas baris PEREMPUAN / LAKI-LAKI
      // - Atau berada tepat setelah baris No. RM (angka 5-8 digit e.g. 064707)
      if (!nama) {
        const isNameWithTitle = /^(?:NY|TN|AN|BY|NN)\.?\s+[A-Za-z\s.'-]+$/i.test(line) ||
          /^[A-Za-z\s.'-]+\s*(?:\.|\s+)(?:NY|TN|AN|BY|NN)$/i.test(line);

        const prevLine = i > 0 ? lines[i - 1].trim() : '';
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
        const isAfterRm = /^\d{5,8}$/.test(prevLine);
        const isBeforeGender = /^(?:PEREMPUAN|LAKI[- ]LAKI|PR|LK|WANITA|PRIA)$/i.test(nextLine);

        const isHeaderWord = /^(?:FORMULIR|PEMINTAAN|RAWAT|INAP|RSU|MUHAMMADIYAH|BABAT|TELP|JL|NO|NOMOR|DOKTER|PENJAMIN)/i.test(line);

        if ((isNameWithTitle || isAfterRm || isBeforeGender) && !isHeaderWord && line.length > 2) {
          nama = line.replace(/^[0-9.\-\s]+/, '').trim();
        }
      }

      // C. DPJP jika ada dr. atau Sp.
      if (!dpjp && (line.toLowerCase().includes('dr.') || line.toLowerCase().includes('sp.'))) {
        const dpjpMatch = line.match(/(?:Dokter\s*DPJP|DPJP|Dokter)\s*[:=\t-]?\s*(dr\.?\s*[^\n\r]+)/i);
        if (dpjpMatch) {
          dpjp = dpjpMatch[1].trim();
        } else if (line.toLowerCase().startsWith('dr.') || line.includes('Sp.')) {
          dpjp = line.trim();
        }
      }

      // D. Diagnosa: baris yang mengandung penyakit / keluhan medis
      if (!diagnosa) {
        const isMedical = /\b(DYSPNEU|ADHF|FAILURE|DYSPEPSIA|GEA|DHF|FEBRIS|BRONKOPNEUMONIA|PNEUMONIA|HERNIA|APENDISITIS|SC|PARTUS|SEPSIS|VOMITING|GASTRITIS|DM|HIPERTENSI|ISPA|CKD|VERTIGO|CEPHALALGIA|OBS|ANEMIA|DIABETES|HEMATEMESIS|MELENA|COLIC|BATUK|SESAK|HIPERGLIKEMIA|STROKE|STEMI|NSTEMI|PPOK|COVID|MALARIA|THYPOID|TYPHOID|TIFOID|INPARTU|KETUBAN|KPD|GRAVIDA)\b/i.test(line);
        const isHeaderOrMeta = /^(?:FORMULIR|PEMINTAAN|RAWAT|INAP|RSU|MUHAMMADIYAH|BABAT|PEREMPUAN|LAKI|DOKTER|DPJP|PENJAMIN|CARA|KELAS|TELP|JL|08\d)/i.test(line);
        if (isMedical && !isHeaderOrMeta) {
          diagnosa = line.trim();
        }
      }
    }
  }

  // 3. Fallbacks for unlabelled bulleted formats like:
  // Pesan kamar kls :
  // KARMANI. NY / 65 Th
  // - DYSPNEU S ADHF [I50.9]
  // - dr. Ilma Alfia Isaridha, Sp.JP.
  // - BPJS KLS 3
  if (!diagnosa || !dpjp || !caraBayar) {
    const bulletLines = lines.filter(l => l.startsWith('-') || l.startsWith('*') || l.startsWith('•'));
    for (const bLine of bulletLines) {
      const clean = bLine.replace(/^[-*•]\s*/, '').trim();
      if (!dpjp && (clean.toLowerCase().includes('dr.') || clean.toLowerCase().includes('sp.'))) {
        dpjp = clean;
      } else if (!caraBayar && (/bpjs/i.test(clean) || /umum/i.test(clean) || /asuransi/i.test(clean) || /jasa raharja/i.test(clean))) {
        caraBayar = clean;
      } else if (!diagnosa) {
        diagnosa = clean;
      }
    }
  }

  // 4. Extract ICD code inside diagnosis if present e.g. "DYSPNEU S ADHF [I50.9]" or "(I50.9)"
  if (diagnosa) {
    const icdInside = diagnosa.match(/[\[\(]([A-Z]\d{2}(?:\.\d+)?)[\]\)]/i);
    if (icdInside) {
      if (!kodeIcd10) kodeIcd10 = icdInside[1].toUpperCase();
      diagnosa = diagnosa.replace(icdInside[0], '').trim();
    } else {
      // Look for standalone code at end
      const codeAtEnd = diagnosa.match(/\b([A-Z]\d{2}(?:\.\d+)?)\b/i);
      if (codeAtEnd && !kodeIcd10) {
        kodeIcd10 = codeAtEnd[1].toUpperCase();
      }
    }
  }

  // 5. Automatic ICD-10 lookup matching if code still missing
  if (!kodeIcd10 && diagnosa) {
    const diagUpper = diagnosa.toUpperCase();
    if (diagUpper.includes('ADHF') || diagUpper.includes('HEART FAILURE')) {
      kodeIcd10 = 'I50.9';
    } else if (diagUpper.includes('DYSPNEU') || diagUpper.includes('SESAK')) {
      kodeIcd10 = 'R06.0';
    } else if (diagUpper.includes('DHF') || diagUpper.includes('DENGUE')) {
      kodeIcd10 = 'A91';
    } else if (diagUpper.includes('GEA') || diagUpper.includes('DIARE')) {
      kodeIcd10 = 'A09';
    } else if (diagUpper.includes('DISPEPSIA') || diagUpper.includes('DYSPEPSIA')) {
      kodeIcd10 = 'K30';
    } else if (diagUpper.includes('BRONKO') || diagUpper.includes('PNEUMONIA')) {
      kodeIcd10 = 'J18.0';
    } else if (diagUpper.includes('HERNIA')) {
      kodeIcd10 = 'K40.9';
    } else if (diagUpper.includes('APENDISITIS') || diagUpper.includes('USUS BUNTU')) {
      kodeIcd10 = 'K35.8';
    } else if (diagUpper.includes('SC') || diagUpper.includes('SESAREA')) {
      kodeIcd10 = 'O82';
    } else if (diagUpper.includes('KPD') || diagUpper.includes('KETUBAN')) {
      kodeIcd10 = 'O42.9';
    } else if (diagUpper.includes('PARTUS') || diagUpper.includes('INPARTU')) {
      kodeIcd10 = 'O80';
    } else if (diagUpper.includes('SEPSIS')) {
      kodeIcd10 = 'A41.9';
    }
  }

  // 6. Normalization
  if (nama) {
    nama = nama.toUpperCase().trim();
  }
  if (umur) {
    if (!/th|tahun|bln|bulan|hr|hari/i.test(umur)) {
      umur = `${umur} Th`;
    }
  }

  // Normalize DPJP with known doctors if possible
  if (dpjp) {
    const matched = LIST_DPJP_RSUMB.find(d =>
      d.toLowerCase().includes(dpjp.toLowerCase().trim()) ||
      dpjp.toLowerCase().includes(d.toLowerCase().trim().replace(/^(dr\.|drg\.)\s*/, ''))
    );
    if (matched) dpjp = matched;
  } else {
    dpjp = 'dr. Ilma Alfia Isaridha, Sp.JP.';
  }

  // Normalize Cara Bayar
  if (caraBayar) {
    const cbUpper = caraBayar.toUpperCase();
    if (cbUpper.includes('BPJS')) {
      if (cbUpper.includes('3') || cbUpper.includes('III')) caraBayar = 'BPJS KLS 3';
      else if (cbUpper.includes('2') || cbUpper.includes('II')) caraBayar = 'BPJS KLS 2';
      else if (cbUpper.includes('1') || cbUpper.includes('I')) caraBayar = 'BPJS KLS 1';
      else caraBayar = 'BPJS KLS 3';
    } else if (cbUpper.includes('UMUM')) {
      if (cbUpper.includes('VIP')) caraBayar = 'UMUM (VIP)';
      else if (cbUpper.includes('1')) caraBayar = 'UMUM KLS 1';
      else if (cbUpper.includes('2')) caraBayar = 'UMUM KLS 2';
      else caraBayar = 'UMUM KLS 3';
    } else if (cbUpper.includes('KAI')) {
      caraBayar = 'ASURANSI (KAI)';
    } else if (cbUpper.includes('ADMEDIKA')) {
      caraBayar = 'ASURANSI (AdMedika)';
    } else if (cbUpper.includes('BRI')) {
      caraBayar = 'ASURANSI (BRI Life)';
    } else if (cbUpper.includes('JASA RAHARJA') || cbUpper.includes('JR')) {
      caraBayar = 'JASA RAHARJA (JR)';
    }
  } else {
    caraBayar = 'BPJS KLS 3';
  }

  return {
    nama: nama || '',
    umur: umur || '',
    diagnosa: diagnosa || '',
    kodeIcd10: kodeIcd10 || '',
    dpjp: dpjp || 'dr. Ilma Alfia Isaridha, Sp.JP.',
    caraBayar: caraBayar || 'BPJS KLS 3',
    kelasKamar: kelasKamar || (caraBayar.includes('3') ? 'Kelas 3' : caraBayar.includes('2') ? 'Kelas 2' : caraBayar.includes('1') ? 'Kelas 1' : 'VIP'),
    rawText: raw
  };
};

/**
 * Output format WhatsApp standar pesanan kamar:
 * Pesan kamar kls :
 *
 * [NAMA PASIEN] / [UMUR]
 * - [DIAGNOSA AWAL] ([KODE ICD 10])
 * - [DOKTER DPJP]
 * - [CARA BAYAR] KLS [KELAS KAMAR]
 */
export const formatPesananKamarWA = (data: {
  nama: string;
  umur: string;
  diagnosa: string;
  kodeIcd10?: string;
  dpjp: string;
  caraBayar: string;
  kelasKamar?: string;
}): string => {
  const cleanNama = data.nama.trim().toUpperCase() || 'NAMA PASIEN';
  const cleanUmur = data.umur.trim() || 'UMUR';
  const cleanDx = data.diagnosa.trim().toUpperCase() || 'DIAGNOSA AWAL';
  const icdPart = data.kodeIcd10 && data.kodeIcd10.trim() ? ` (${data.kodeIcd10.trim().toUpperCase()})` : '';
  const cleanDpjp = data.dpjp.trim() || 'DOKTER DPJP';
  
  // Format [CARA BAYAR] KLS [KELAS KAMAR]
  let bayarKelas = '';
  const rawBayar = (data.caraBayar || 'BPJS').trim();
  const rawKelas = (data.kelasKamar || '3').trim().replace(/^(Kelas|Kls)\s*/i, '');

  if (/KLS|KELAS/i.test(rawBayar)) {
    bayarKelas = rawBayar;
  } else {
    bayarKelas = `${rawBayar} KLS ${rawKelas}`;
  }

  return `Pesan kamar kls :

${cleanNama} / ${cleanUmur}
- ${cleanDx}${icdPart}
- ${cleanDpjp}
- ${bayarKelas}`;
};

/**
 * Format teks WA untuk List Kamar Kosong sesuai standar perawat
 */
export const formatKamarKosongWA = (data: LantaiKamarKosong): string => {
  const lines: string[] = [];
  lines.push(data.headerText);

  data.kategori.forEach((kat) => {
    if (kat.subKategori && kat.subKategori.length > 0) {
      lines.push(`${kat.label}`);
      kat.subKategori.forEach((sub) => {
        if (sub.isPenuh || !sub.beds || sub.beds.length === 0) {
          lines.push(`   - ${sub.nama} : PENUH`);
        } else {
          lines.push(`   - ${sub.nama} (${sub.beds.length}) : ${sub.beds.join(', ')}`);
        }
      });
    } else {
      if (kat.isPenuh || !kat.beds || kat.beds.length === 0) {
        lines.push(`${kat.label} : PENUH`);
      } else {
        lines.push(`${kat.label} (${kat.beds.length}) : ${kat.beds.join(', ')}`);
      }
    }
  });

  return lines.join('\n');
};

/**
 * Helper untuk format satu pasien sesuai standar WA Inden:
 * [NAMA PASIEN] / [UMUR]
 * - [DIAGNOSA AWAL] ([KODE ICD 10])
 * - [DOKTER DPJP]
 * - [CARA BAYAR] [KELAS KAMAR] ([NOMOR KAMAR / JIKA MASIH INDEN ISIKAN DENGAN SPASI SPASI])
 */
export const formatSinglePatientIndenWA = (p: IndenPatient): string => {
  const cleanNama = (p.nama || 'NAMA PASIEN').trim().toUpperCase();
  const cleanUmur = (p.umur || '').trim();
  const umurPart = cleanUmur ? ` / ${cleanUmur}` : '';

  // Diagnosa + ICD 10
  const cleanDx = (p.diagnosa || '-').trim().toUpperCase();
  const cleanIcd = (p.kodeIcd10 || '').trim().toUpperCase();
  const dxPart = cleanIcd ? `${cleanDx} (${cleanIcd})` : cleanDx;

  // DPJP
  const cleanDpjp = (p.dpjp || '-').trim();

  // Cara Bayar & Kelas Kamar
  // Standar: "BPJS KLS 3", "UMUM KLS 1", "BPJS KLS 2", dll.
  let rawBayar = (p.caraBayar || 'UMUM').trim().toUpperCase();
  // Hilangkan tanda kurung jika format 'UMUM (VIP)' -> 'UMUM VIP'
  rawBayar = rawBayar.replace(/[()]/g, '').trim();

  let payClass = rawBayar;
  if (!/KLS|KELAS|VIP|VVIP|ICU|VK/i.test(payClass) && p.kelasKamar) {
    const rawKls = p.kelasKamar.replace(/^(Kelas|Kls)\s*/i, '').replace(/[()]/g, '').trim().toUpperCase();
    if (rawKls) {
      payClass = `${payClass} KLS ${rawKls}`;
    }
  }

  // Nomor kamar atau kurung dengan spasi kosong jika masih inden ( )
  const roomPart = p.nomorBedTarget && p.nomorBedTarget.trim()
    ? `(${p.nomorBedTarget.trim()})`
    : `(   )`;

  return `${cleanNama}${umurPart}\n- ${dxPart}\n- ${cleanDpjp}\n- ${payClass} ${roomPart}`;
};

/**
 * Format Rekapitulasi Pasien Inden WhatsApp per Unit
 * 
 * 1. FORMAT HEADER UNIT:
 *    LIST INDEN [NAMA UNIT, CONTOH: LT 4 / LT 5 / VK / ICU]
 * 
 * 2. STRUKTUR FORMAT DATA PASIEN:
 *    [NAMA PASIEN] / [UMUR]
 *    - [DIAGNOSA AWAL] ([KODE ICD 10])
 *    - [DOKTER DPJP]
 *    - [CARA BAYAR] [KELAS KAMAR] ([NOMOR KAMAR / JIKA MASIH INDEN ISIKAN DENGAN SPASI SPASI])
 * 
 * 3. ATURAN PENULISAN WA:
 *    - Hapus semua awalan label seperti "dg dx", "dpjp", kata "(Kelas 3)", atau teks keterangan lokasi.
 *    - Jika pasien belum dapat kamar (masih Inden), tambahkan tanda kurung dengan spasi kosong: " (   )".
 *    - Jika pasien sudah dapat kamar, masukkan nama/nomor kamar: " (JN 1B)".
 *    - Beri jarak 1 baris kosong (line break) di antara setiap data pasien agar mudah dibaca di WhatsApp.
 */
export const formatRekapIndenUnitWA = (
  unit: UnitRanap,
  patients: IndenPatient[]
): string => {
  const unitHeaderNameMap: Record<UnitRanap, string> = {
    lt4: 'LT 4',
    lt5: 'LT 5',
    vk: 'VK',
    icu: 'ICU'
  };

  const unitName = unitHeaderNameMap[unit] || UNIT_CONFIG[unit].shortName.toUpperCase();
  const list = patients.filter(p => p.lantai === unit);

  const lines: string[] = [];
  lines.push(`LIST INDEN ${unitName}`);
  lines.push('');

  if (list.length === 0) {
    lines.push('(Tidak ada antrean)');
  } else {
    const formattedPatients = list.map(p => formatSinglePatientIndenWA(p));
    lines.push(formattedPatients.join('\n\n'));
  }

  return lines.join('\n');
};

/**
 * Format Rekap Seluruh Unit (Lantai 4, Lantai 5, VK, ICU)
 * Menampilkan masing-masing unit dengan format LIST INDEN [UNIT] yang rapi
 */
export const formatRekapSemuaUnitWA = (patients: IndenPatient[]): string => {
  const units: UnitRanap[] = ['lt4', 'lt5', 'vk', 'icu'];
  const unitBlocks: string[] = [];

  units.forEach(u => {
    unitBlocks.push(formatRekapIndenUnitWA(u, patients));
  });

  return unitBlocks.join('\n\n========================================\n\n');
};

const STORAGE_KEY_INDEN = 'rsumb_inden_kamar_ranap_v2';
const STORAGE_KEY_KAMAR_LT4 = 'rsumb_kamar_kosong_lt4_v1';
const STORAGE_KEY_KAMAR_LT5 = 'rsumb_kamar_kosong_lt5_v1';

export const loadStoredIndenPatients = (): IndenPatient[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INDEN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading inden patients:', e);
  }
  return INITIAL_INDEN_PATIENTS;
};

export const saveStoredIndenPatients = (patients: IndenPatient[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_INDEN, JSON.stringify(patients));
  } catch (e) {
    console.error('Error saving inden patients:', e);
  }
};

export const loadStoredKamarKosong = (lantai: 'lt4' | 'lt5'): LantaiKamarKosong => {
  const key = lantai === 'lt4' ? STORAGE_KEY_KAMAR_LT4 : STORAGE_KEY_KAMAR_LT5;
  const initial = lantai === 'lt4' ? INITIAL_KAMAR_KOSONG_LT4 : INITIAL_KAMAR_KOSONG_LT5;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.kategori) return parsed;
    }
  } catch (e) {
    console.error('Error loading kamar kosong:', e);
  }
  return initial;
};

export const saveStoredKamarKosong = (data: LantaiKamarKosong): void => {
  const key = data.lantai === 'lt4' ? STORAGE_KEY_KAMAR_LT4 : STORAGE_KEY_KAMAR_LT5;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving kamar kosong:', e);
  }
};
