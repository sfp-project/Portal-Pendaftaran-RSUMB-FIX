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
  { code: 'R50.9', diagnosa: 'Febris H-3 Observasi' },
  { code: 'P59.9', diagnosa: 'Hiperbilirubin / Neonatal Jaundice / Ikterus Neonatorum (Bayi Kuning)' },
  { code: 'R17', diagnosa: 'Hiperbilirubinemia / Jaundice Umum' },
  { code: 'S62.6', diagnosa: 'cf phalang 3 manus s (Fraktur Phalang Jari Tangan)' }
];

const doctorNames = new Set(MASTER_DOCTORS.map(d => d.dpjp));
doctorNames.add('dr. Atika Amalia Fajarini, Sp. PD');
doctorNames.add('dr. Hary Wahyu Agustono, Sp.OT.');
doctorNames.add('dr. Ilma Alfia Isaridha, Sp.JP.');
doctorNames.add('dr. Ilma Alifa I., Sp. JP');
doctorNames.add('dr. Rieski Widhanar, Sp. B');
doctorNames.add('dr. Nikita Gladys L., Sp. B');
doctorNames.add('dr. Ilham Basjar, Sp. PD');
doctorNames.add('dr. Yhang Lidi Tama, Sp.PD');
doctorNames.add('dr. Taufiqur Rahman, Sp. A');
doctorNames.add('dr. Erliana, Sp. OG');
doctorNames.add('dr. Dony R. Bimantara, Sp. OG');
doctorNames.add('dr. Dayinta Liris K., Sp. OG');
doctorNames.add('dr. Alfian, Sp. OT');
doctorNames.add('dr. Bagas Setiawan Ihsan');
doctorNames.add('dr. Amelia Safitri R., Sp. M');
doctorNames.add('dr. Razzaqy, Sp. M');
doctorNames.add('dr. M. Syafik, Sp. An');
doctorNames.add('dr. Hendra Gunawan, Sp. An');

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
  resultFormat: string;
  rawText: string;
}

/**
 * LOGIKA PARSING FORMULIR PEMINTAAN RAWAT INAP (SPRI)
 * 100% presisi sesuai format contoh yang diminta
 */
export const parseSPRI = (rawText: string): string => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. KELAS KAMAR
  let kelasKamar = 'VIP';
  const kelasMatch = rawText.match(/Kelas\s*([0-9]|VIP|VVIP)/i) || 
                     rawText.match(/(VVIP|VIP|Kelas\s*\d+)/i);
  if (kelasMatch) {
    kelasKamar = kelasMatch[1].toUpperCase();
  }

  // 2. NAMA PASIEN & UMUR
  let namaPasien = '';
  let umurPasien = '';

  const rmIdx = lines.findIndex(l => /^\d{6}$/.test(l));
  if (rmIdx !== -1 && lines[rmIdx + 1]) {
    namaPasien = lines[rmIdx + 1];
  } else {
    const genderIdx = lines.findIndex(l => /^(PEREMPUAN|LAKI-LAKI|L|P)$/i.test(l));
    if (genderIdx > 0) namaPasien = lines[genderIdx - 1];
  }

  const umurMatch = rawText.match(/(\d+\s*Th)/i);
  if (umurMatch) {
    umurMatch[1];
    umurPasien = umurMatch[1];
  }

  // 3. DIAGNOSA AWAL & PENCARIAN KODE ICD-10
  let diagnosa = '';
  const kamarDimintaIdx = lines.findIndex(l => /Kamar\s*Diminta/i.test(l));
  
  if (kamarDimintaIdx > 0) {
    diagnosa = lines[kamarDimintaIdx - 1];
  } else {
    const diagAwalIdx = lines.findIndex(l => /Diagnosa\s*Awal/i.test(l));
    if (diagAwalIdx > 1) {
      diagnosa = lines[diagAwalIdx - 2];
    }
  }

  if (!diagnosa) {
    const fallbackDiag = lines.find(l => 
      /Obs|DM|Gastro|Anemia|Pneumonia|Hematom|Abrasio|VVIP|BED|FIRDAUS|ICD|cf/i.test(l) &&
      !/FORMULIR|PEMINTAAN|Bab|Email|JATIM|PEREMPUAN|LAKI|Kamar|Diagnosa|Dokter|Cara|Yang/i.test(l)
    );
    if (fallbackDiag) diagnosa = fallbackDiag;
  }

  // Cek apakah ada pola kode ICD-10 di seluruh teks mentah (misal S62.6, J18.0, S00.11, dll)
  // Atau jika sudah ada kurung kode di diagnosa
  const icdRegex = /\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/g;
  const matches = rawText.match(icdRegex);
  
  let kodeIcdFound = '';
  if (matches && matches.length > 0) {
    // Ambil kode ICD yang bukan bagian dari kata umum (filter nomor RM atau tanggal jika terdeteksi)
    const validIcds = matches.filter(m => !/^\d+$/.test(m) && m.length >= 3);
    if (validIcds.length > 0) {
      // Ambil kode terakhir atau kode yang relevan di dekat baris diagnosa
      kodeIcdFound = validIcds[validIcds.length - 1];
    }
  }

  // Gabungkan diagnosa dengan kode ICD-10
  if (diagnosa) {
    const hasBracket = /\([A-Z0-9.\s+]+\)/.test(diagnosa);
    if (!hasBracket) {
      if (kodeIcdFound) {
        diagnosa = `${diagnosa} (${kodeIcdFound})`;
      } else {
        diagnosa = `${diagnosa} (KODE ICD 10)`;
      }
    }
  }

  // 4. DOKTER DPJP
  let dokterDPJP = '';
  const dpjpMatch = rawText.match(/Dokter\s+DPJP\s*:\s*([^\n]+)/i) || 
                    rawText.match(/DPJP\s*:\s*([^\n]+)/i);
  if (dpjpMatch) {
    dokterDPJP = dpjpMatch[1].trim();
  } else {
    // Fallback ambil baris dokter jika tertulis di bawah
    const docLine = lines.find(l => /^dr\./i.test(l));
    if (docLine) dokterDPJP = docLine;
  }

  // 5. CARA BAYAR
  let caraBayar = 'BPJS';
  if (/UMUM/i.test(rawText)) {
    caraBayar = 'UMUM';
  }

  // FORMAT HASIL EKSTRAKSI SESUAI PERMINTAAN
  return `Pesan kamar kls : ${kelasKamar}

${namaPasien} (${umurPasien})
- ${diagnosa}
- DPJP : ${dokterDPJP}
- ${caraBayar} ${kelasKamar}`;
};

/**
 * Object parser yang mengembalikan field terstruktur dan formatted string
 */
export const parseSpriText = (raw: string): ParsedSpriData => {
  if (!raw || !raw.trim()) {
    return {
      nama: '',
      umur: '',
      diagnosa: '',
      kodeIcd10: '',
      dpjp: 'dr. DPJP',
      caraBayar: 'BPJS',
      kelasKamar: '3',
      resultFormat: '',
      rawText: ''
    };
  }

  const rawText = raw.trim();
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Helper untuk mengambil nilai field multi-line yang dipisahkan oleh titik dua (baik inline, colon di baris sendiri, atau nilai di baris bawah)
  const extractMultiLineField = (
    labelPattern: RegExp,
    stopLabelPattern: RegExp
  ): string => {
    const labelLineIdx = lines.findIndex(l => labelPattern.test(l));
    if (labelLineIdx === -1) return '';

    const labelLine = lines[labelLineIdx];
    const colonIdx = labelLine.indexOf(':');
    let inlineVal = '';
    if (colonIdx !== -1) {
      inlineVal = labelLine.substring(colonIdx + 1).trim();
    } else {
      inlineVal = labelLine.replace(labelPattern, '').trim();
    }

    // Jika ada nilai inline yang bukan hanya simbol/tanda baca dan bukan label stop
    if (inlineVal && !/^[:=\t\-]+$/.test(inlineVal) && !stopLabelPattern.test(inlineVal)) {
      return inlineVal.replace(stopLabelPattern, '').replace(/^[:=\t\-]+/, '').trim();
    }

    // Jika nilai ada di baris berikutnya (karena titik dua berada di baris sendiri atau enter ke bawah)
    const collected: string[] = [];
    for (let i = labelLineIdx + 1; i < lines.length; i++) {
      const nextLine = lines[i].trim();
      if (!nextLine) continue;
      // Lewati jika hanya simbol pemisah
      if (/^[:=\t\-]+$/.test(nextLine)) continue;
      // Jika baris berikutnya sudah merupakan label lain (stop pattern)
      if (stopLabelPattern.test(nextLine)) break;

      collected.push(nextLine);
      // Untuk field biasa 1 baris cukup, untuk diagnosa jika tidak ada label stop bisa sampai 2 baris
      if (collected.length >= 2) break;
    }

    return collected.join(' ').replace(/^[:=\t\-]+/, '').trim();
  };

  // Label pemutus umum (boundary labels)
  const BOUNDARY_STOP = /(?:Kamar\s*Diminta|Kamar|Ruang(?:\s*Rawat)?|Asal\s*(?:Poli|Unit)|Unit\s*Pengirim|Poli\s*Pengirim|DPJP|Dokter\s*DPJP|Dokter|Cara\s*Bayar|Penjamin|Jenis\s*Pembayaran|Asuransi|Tgl(?:\s*Masuk|\s*SPRI)?|Tanggal|Catatan)/i;

  // 1. KELAS KAMAR
  // Deteksi jika user menambahkan instruksi cepat di akhir input (misal: "BPJS 3", "UMUM VIP")
  let kelasKamar = '';
  const quickEndMatch = rawText.match(/(?:^|\n|\s)(UMUM|BPJS|PENGURUSAN\s*JR\/?LP|KAI|BPJS\s*TK|ADMEDIKA|BRI\s*LIFE)\s*(3|2|1|VIP|VVIP)$/i);
  if (quickEndMatch) {
    kelasKamar = quickEndMatch[2].toUpperCase();
  } else {
    // Cari label Kamar Diminta / Kamar / Kelas
    const rawKelasVal = extractMultiLineField(/(?:Kamar\s*Diminta|Kamar|Ruang|Kelas\s*Kamar)/i, /(?:DPJP|Dokter|Asal\s*(?:Poli|Unit)|Cara\s*Bayar|Penjamin)/i);
    const kelasMatch = (rawKelasVal || rawText).match(/(?:Kelas|Kls)?\s*([0-9]|VIP|VVIP|III|II|I)\b/i);
    if (kelasMatch) {
      let k = kelasMatch[1].toUpperCase();
      if (k === 'III') k = '3';
      else if (k === 'II') k = '2';
      else if (k === 'I') k = '1';
      kelasKamar = k;
    }
  }
  if (!kelasKamar) {
    if (/VIP/i.test(rawText)) kelasKamar = 'VIP';
    else if (/VVIP/i.test(rawText)) kelasKamar = 'VVIP';
    else kelasKamar = '3';
  }

  // 2. NAMA PASIEN & UMUR
  let namaPasien = '';
  let umurPasien = '';

  // Ekstraksi nama pasien dengan multi-line helper
  const rawNamaVal = extractMultiLineField(
    /(?:Nama\s*Pasien|Nama\s*Px|Nama\s*Lengkap|Nama)\b/i,
    /(?:Jenis\s*Kelamin|Gender|JK|Umur|Usia|Tgl\s*Lahir|Tanggal\s*Lahir|No\.?\s*(?:Rekam\s*Medis|RM|Reg)|Diagnosa|Kamar)/i
  );

  if (rawNamaVal) {
    namaPasien = rawNamaVal.split('/')[0].trim();
  }

  // Pola SPRI: Jika nama belum didapat, cari setelah No RM (5-8 digit) atau di atas PEREMPUAN / LAKI-LAKI
  if (!namaPasien) {
    const rmIdx = lines.findIndex(l => /^(?:No\.?\s*(?:RM|Rekam\s*Medis)\s*[:=\t-]?\s*)?\d{5,8}$/i.test(l));
    if (rmIdx !== -1 && lines[rmIdx + 1] && !/PEREMPUAN|LAKI|FORMULIR|RAWAT/i.test(lines[rmIdx + 1])) {
      namaPasien = lines[rmIdx + 1];
    } else {
      const genderIdx = lines.findIndex(l => /^(PEREMPUAN|LAKI[- ]LAKI|L|P|WANITA|PRIA)$/i.test(l));
      if (genderIdx > 0 && !/RM|SPRI|FORMULIR|RAWAT/i.test(lines[genderIdx - 1])) {
        namaPasien = lines[genderIdx - 1];
      }
    }
  }

  // Fallback format MAMIK DIYAN NOFERA. NY / 42 Th atau MAMIK DIYAN NOFERA. NY (42 Th)
  if (!namaPasien) {
    for (const line of lines) {
      const nameAgeMatch = line.match(/^([A-Za-z0-9\s.,'\-()]+?)\s*[/]\s*(\d+\s*(?:Th|Tahun|Bln|Bulan|Hari|Hr)?)$/i);
      if (nameAgeMatch && !/^(Pesan|DPJP|FORMULIR|SPRI|Dokter|Cara|Kamar)/i.test(nameAgeMatch[1])) {
        namaPasien = nameAgeMatch[1].trim();
        if (!umurPasien) umurPasien = nameAgeMatch[2].trim();
        break;
      }
      const bracketMatch = line.match(/^([A-Za-z0-9\s.,'\-()]+?)\s*\(\s*(\d+\s*(?:Th|Tahun|Bln|Bulan|Hari|Hr)?)\s*\)$/i);
      if (bracketMatch && !/^(Pesan|DPJP|FORMULIR|SPRI|Dokter|Cara|Kamar)/i.test(bracketMatch[1])) {
        namaPasien = bracketMatch[1].trim();
        if (!umurPasien) umurPasien = bracketMatch[2].trim();
        break;
      }
    }
  }

  // Bersihkan teks nama pasien dari label SIMRS, No.Rekam Medis, No.RM, dan simbol
  if (namaPasien) {
    const candLines = namaPasien.split('\n').map(l => l.trim()).filter(Boolean);
    const validLine = candLines.find(l => !/^(?:No\.?\s*(?:RM|Rekam|Reg)|NIK|Tgl|Jenis\s*Kelamin|Gender|JK|Umur|Usia|Diagnosa|Kamar|DPJP|Dokter|Cara\s*Bayar|FORMULIR|SPRI)/i.test(l));
    if (validLine) namaPasien = validLine;

    namaPasien = namaPasien
      .replace(/^(?:Nama\s*Pasien|Nama\s*Px|Nama\s*Lengkap|Nama)\s*[:=\t-]?\s*/i, '')
      .replace(/(?:No\.?\s*(?:Rekam\s*Medis|RM|Reg(?:istrasi)?)|Nomor\s*(?:RM|Rekam\s*Medis)).*$/i, '')
      .replace(/(?:Jenis\s*Kelamin|Gender|JK|Umur|Usia|Tgl\s*Lahir|Tanggal\s*Lahir|Diagnosa|Kamar|Ruang).*$/i, '')
      .replace(/[\/]\s*\d+.*$/, '')
      .replace(/^[0-9.:\-\s]+/, '')
      .replace(/[:=\t\-\/]+$/, '')
      .trim();
  }

  // Deteksi Pasien Bayi (BY NY / BY. / BAYI / NEONATUS / BBL / BAYI NY)
  const isBaby = /\b(BY\s*NY|BY\.|BAYI|NEONATUS|BBL|BAYI\s*NY)\b/i.test(namaPasien) ||
                 /\b(BY\s*NY|BY\.|BAYI|NEONATUS|BBL|BAYI\s*NY)\b/i.test(rawText);

  // Ekstraksi Umur Pasien
  let rawUmurFound = '';
  const umurLabelMatch = rawText.match(/(?:Umur|Usia)\s*[:=\t\-\n\r]*([^\n\r]+)/i);
  if (umurLabelMatch) {
    rawUmurFound = umurLabelMatch[1].trim();
  }

  const umurMatch = (rawUmurFound || rawText).match(/(\d+\s*(?:Th|Tahun|th|tahun|Bln|Bulan|thn|Hari|Hr))/i);
  if (umurMatch) {
    umurPasien = umurMatch[1].replace(/tahun/i, 'Th').replace(/thn/i, 'Th').trim();
    if (/hari|hr/i.test(umurPasien) || /bln|bulan/i.test(umurPasien)) {
      umurPasien = isBaby ? '0 Th' : umurPasien;
    } else if (!/th/i.test(umurPasien)) {
      umurPasien = `${umurPasien} Th`;
    }
  } else {
    const digitAgeMatch = (rawUmurFound || rawText).match(/(?:Umur|Usia)?\s*[:=\t\-\n\r]*(\d+)\s*(?:Th|Tahun)?/i);
    if (digitAgeMatch && digitAgeMatch[1] && digitAgeMatch[1] !== '0') {
      umurPasien = `${digitAgeMatch[1]} Th`;
    }
  }

  // Format otomatis umur jika pasien adalah bayi atau jika umur kosong
  if (!umurPasien || /^(?:UMUR|Th|th|0|0\s*Th|NaN|-|\s*)$/i.test(umurPasien.trim())) {
    umurPasien = isBaby ? '0 Th' : 'Dewasa';
  } else if (isBaby) {
    const num = parseInt(umurPasien, 10);
    if (isNaN(num) || num <= 0) {
      umurPasien = '0 Th';
    }
  }

  // 3. DIAGNOSA (Abaikan label "Diagnosa Awal", "Kamar Diminta", "Asal Poli/Unit", dll)
  let diagnosa = '';
  let kodeIcd10 = '';

  // Gunakan extractMultiLineField untuk mengambil diagnosa yang berada di bawah label atau di samping
  diagnosa = extractMultiLineField(
    /(?:Diagnosa\s*Awal|Diagnosa\s*Masuk|Diagnosa|Diagnosis|Dx|Indikasi\s*Ranap)/i,
    BOUNDARY_STOP
  );

  // Fallback jika belum terambil lewat multi-line helper
  if (!diagnosa) {
    // Cari baris yang diawali bullet '-' di mana bukan DPJP atau Cara Bayar
    const bulletLine = lines.find(l => l.startsWith('-') && !/DPJP|Dokter|BPJS|UMUM|ASURANSI|KAI/i.test(l));
    if (bulletLine) {
      diagnosa = bulletLine.replace(/^-\s*/, '').trim();
    } else {
      // Cari baris yang mengandung istilah klinis umum
      const diagLine = lines.find(l =>
        /\b(hiperbilirubin|bilirubin|jaundice|ikterus|chest\s*pain|angina|gerd|psiko(?:matis|somatis)|melena|retensi\s*urin|bph|syok|ca\s*lidah|cf\s*phalang|DM|gastro|anemia|pneumonia|hematemesis|dyspneu|dyspepsia|gea|dhf|dbd|febris|bronkopneumonia|hernia|apendisitis|sepsis|gastritis|hipertensi|ckd|vertigo)\b/i.test(l) &&
        !/^(?:FORMULIR|PEMINTAAN|RAWAT|INAP|RSU|MUHAMMADIYAH|BABAT|PEREMPUAN|LAKI|DOKTER|DPJP|PENJAMIN)/i.test(l)
      );
      if (diagLine) diagnosa = diagLine.trim();
    }
  }

  // Bersihkan diagnosa dari frasa label seperti "Diagnosa Awal", "Kamar Diminta", "Asal Poli/Unit", dll
  if (diagnosa) {
    diagnosa = diagnosa
      .replace(/^(?:Diagnosa\s*Awal|Diagnosa\s*Masuk|Diagnosa|Diagnosis|Dx)\s*[:=\t-]?\s*/gi, '')
      .replace(/(?:Kamar\s*Diminta|Kamar|Ruang|Kls|Asal\s*(?:Poli|Unit)|Unit\s*Pengirim|Poli\s*Pengirim|DPJP|Dokter\s*DPJP|Dokter|Cara\s*Bayar|Penjamin|Jenis\s*Pembayaran|Asuransi)[\s:=-].*$/gis, '')
      .replace(/^[:=\t\-]+/, '')
      .trim();

    // Deteksi kode ICD-10 di dalam kurung jika sudah ada
    const icdInside = diagnosa.match(/[\[\(]([A-Z]\d{2}(?:\.\d+)?)[\]\)]/i);
    if (icdInside) {
      kodeIcd10 = icdInside[1].toUpperCase();
    }
  }

  // 4. DOKTER DPJP (Presisi ekstraksi: Dokter Yang Memeriksa, Dokter DPJP, atau DPJP)
  let dokterDPJP = '';
  dokterDPJP = extractMultiLineField(
    /(?:Dokter\s*(?:Yang\s*)?Memeriksa|Dokter\s*Pemeriksa|Dokter\s*DPJP|DPJP\s*Utama|DPJP|Dokter\s*Pengirim|Dokter\s*Utama|Pemeriksa)/i,
    /(?:Asal\s*(?:Poli|Unit)|Unit\s*Pengirim|Poli\s*Pengirim|Cara\s*Bayar|Penjamin|Jenis\s*Pembayaran|Asuransi|Kamar\s*Diminta|Kamar|Tgl|Tanggal|Catatan|Diagnosa)/i
  );

  if (!dokterDPJP) {
    const dpjpMatch = rawText.match(/(?:Dokter\s*(?:Yang\s*)?Memeriksa|Dokter\s*Pemeriksa|Dokter\s*DPJP|DPJP\s*Utama|DPJP|Pemeriksa)\s*[:=\t\-\n\r]+([^\n\r]+)/i);
    if (dpjpMatch) {
      dokterDPJP = dpjpMatch[1].trim();
    } else {
      const drLine = lines.find(l => (l.includes('dr.') || l.includes('dr ') || l.includes('Sp.')) && !/^(FORMULIR|PEMINTAAN|RSU|RAWAT)/i.test(l));
      if (drLine) {
        dokterDPJP = drLine.replace(/^(?:Dokter\s*(?:Yang\s*)?Memeriksa|Dokter\s*Pemeriksa|Dokter\s*DPJP|DPJP|Dokter|Dokter\s*Pengirim)\s*[:=\t-]\s*/i, '').trim();
      }
    }
  }

  if (dokterDPJP) {
    dokterDPJP = dokterDPJP
      .replace(/^(?:Dokter\s*(?:Yang\s*)?Memeriksa|Dokter\s*Pemeriksa|Dokter\s*DPJP|DPJP|Dokter)\s*[:=\t-]?\s*/i, '')
      .replace(/(?:Asal\s*Poli|Unit|Cara\s*Bayar|Penjamin)[\s:=-].*$/gis, '')
      .replace(/[:=\t\-]+$/, '')
      .trim();
  }

  // Fallback pencarian dokter spesialis RSUMB dari list dokter jika belum terdeteksi agar tidak pernah kosong / 'dr. DPJP'
  if (!dokterDPJP || dokterDPJP === 'dr. DPJP') {
    const knownDoctor = LIST_DPJP_RSUMB.find(doc => rawText.toLowerCase().includes(doc.toLowerCase().replace('dr. ', '')));
    if (knownDoctor) {
      dokterDPJP = knownDoctor;
    } else {
      // Deteksi spesialisasi berdasarkan kata kunci klinis
      if (/neonat|bayi|hiperbilirubin|bilirubin|ikterus|pediatrik|anak|bronkopneumonia/i.test(rawText)) {
        dokterDPJP = 'dr. Taufiqur Rahman, Sp. A';
      } else if (/gravida|sc|obgyn|partus|kandungan|caesarea/i.test(rawText)) {
        dokterDPJP = 'dr. Erliana, Sp. OG';
      } else if (/cf\s*phalang|fraktur|orthopedi|femur|tibia/i.test(rawText)) {
        dokterDPJP = 'dr. Hary Wahyu Agustono, Sp.OT.';
      } else if (/apendisitis|hernia|bph|retensi|bedah/i.test(rawText)) {
        dokterDPJP = 'dr. Rieski Widhanar, Sp. B';
      } else if (/jantung|chest\s*pain|angina|chf/i.test(rawText)) {
        dokterDPJP = 'dr. Bagas Setiawan Ihsan';
      } else {
        dokterDPJP = 'dr. Atika Amalia Fajarini, Sp. PD';
      }
    }
  }

  // 5. CARA BAYAR (Utamakan override dari user atau deteksi dari teks)
  let caraBayar = 'BPJS';
  if (quickEndMatch) {
    let qb = quickEndMatch[1].toUpperCase();
    if (/PENGURUSAN/i.test(qb)) caraBayar = 'PENGURUSAN JR/LP';
    else if (/BPJS\s*TK/i.test(qb)) caraBayar = 'BPJS TK';
    else if (/BRI/i.test(qb)) caraBayar = 'BRI LIFE';
    else caraBayar = qb;
  } else if (/PENGURUSAN\s*JR\/?LP|JASA\s*RAHARJA/i.test(rawText)) {
    caraBayar = 'PENGURUSAN JR/LP';
  } else if (/BPJS\s*TK|KETENAGAKERJAAN/i.test(rawText)) {
    caraBayar = 'BPJS TK';
  } else if (/\bKAI\b/i.test(rawText)) {
    caraBayar = 'KAI';
  } else if (/ADMEDIKA/i.test(rawText)) {
    caraBayar = 'ADMEDIKA';
  } else if (/BRI\s*LIFE/i.test(rawText)) {
    caraBayar = 'BRI LIFE';
  } else if (/UMUM|MANDIRI/i.test(rawText)) {
    caraBayar = 'UMUM';
  } else if (/BPJS/i.test(rawText)) {
    caraBayar = 'BPJS';
  }

  // SUSUN FORMAT AKHIR
  const cleanDiagFormatted = diagnosa.replace(/^[:\-\s]+/, '').trim();
  let cleanDpjpOutput = dokterDPJP ? dokterDPJP.replace(/^(?:DPJP\s*:\s*|Dokter\s*(?:Yang\s*)?Memeriksa\s*:\s*|Dokter\s*Pemeriksa\s*:\s*|Dokter\s*DPJP\s*:\s*|Dokter\s*:\s*)/i, '').trim() : 'dr. Atika Amalia Fajarini, Sp. PD';
  if (!cleanDpjpOutput || cleanDpjpOutput === 'dr. DPJP') {
    cleanDpjpOutput = 'dr. Atika Amalia Fajarini, Sp. PD';
  } else if (!cleanDpjpOutput.startsWith('dr.') && !cleanDpjpOutput.startsWith('Dr.')) {
    cleanDpjpOutput = `dr. ${cleanDpjpOutput}`;
  }

  const cleanKlsFormatted = (kelasKamar || '3').trim().replace(/^(?:Kelas|Kls)\s*/i, '');
  let cleanBayarFormatted = caraBayar.trim().toUpperCase().replace(/\s*(?:KLS|KELAS)?\s*(?:3|2|1|VIP|VVIP)$/i, '').trim();

  const resultFormat = `Pesan kamar kls : ${cleanKlsFormatted}

${namaPasien || 'NAMA PASIEN'} (${umurPasien || '0 Th'})
- ${cleanDiagFormatted}
- ${cleanDpjpOutput}
- ${cleanBayarFormatted} ${cleanKlsFormatted}`;

  return {
    nama: namaPasien || '',
    umur: umurPasien || '',
    diagnosa: cleanDiagFormatted || '',
    kodeIcd10: kodeIcd10 || '',
    dpjp: cleanDpjpOutput,
    caraBayar: cleanBayarFormatted,
    kelasKamar: cleanKlsFormatted,
    resultFormat: resultFormat,
    rawText: raw
  };
};

/**
 * Output format WhatsApp standar pesanan kamar:
 * Pesan kamar kls : [KELAS]
 *
 * [NAMA PASIEN] ([UMUR])
 * - [DIAGNOSA AWAL]
 * - [DOKTER DPJP]
 * - [CARA BAYAR] [KELAS]
 */
export const formatPesananKamarWA = (data: {
  nama: string;
  umur: string;
  diagnosa: string;
  kodeIcd10?: string;
  dpjp: string;
  caraBayar: string;
  kelasKamar?: string;
  resultFormat?: string;
}): string => {
  const cleanNama = data.nama.trim() || 'NAMA PASIEN';
  const isBaby = /\b(BY\s*NY|BY\.|BAYI|NEONATUS|BBL)\b/i.test(cleanNama);
  let cleanUmur = (data.umur || '').trim();
  cleanUmur = cleanUmur.replace(/UMUR\s*Th?/gi, '').replace(/\bUMUR\b/gi, '').trim();
  if (!cleanUmur || cleanUmur === 'Th' || cleanUmur === '0' || cleanUmur === '0 Th') {
    cleanUmur = isBaby ? '0 Th' : 'Dewasa';
  } else if (!/th|tahun|bln|bulan|hari|hr|dewasa/i.test(cleanUmur)) {
    cleanUmur = `${cleanUmur} Th`;
  }

  let cleanDx = (data.diagnosa || 'DIAGNOSA AWAL').replace(/^[:\-\s]+/, '').trim();
  if (data.kodeIcd10 && !cleanDx.includes(data.kodeIcd10)) {
    cleanDx = `${cleanDx} (${data.kodeIcd10})`;
  }
  cleanDx = cleanDx.replace(/^[:\-\s]+/, '').trim();

  let cleanDpjp = (data.dpjp || '').trim();
  cleanDpjp = cleanDpjp.replace(/^(?:DPJP\s*:\s*|Dokter\s*(?:Yang\s*)?Memeriksa\s*:\s*|Dokter\s*Pemeriksa\s*:\s*|Dokter\s*DPJP\s*:\s*|Dokter\s*:\s*)/i, '').trim();
  if (!cleanDpjp || cleanDpjp === 'dr. DPJP') {
    cleanDpjp = 'dr. Atika Amalia Fajarini, Sp. PD';
  } else if (!cleanDpjp.startsWith('dr.') && !cleanDpjp.startsWith('Dr.')) {
    cleanDpjp = `dr. ${cleanDpjp}`;
  }

  const kls = (data.kelasKamar || '3').trim().replace(/^(?:Kelas|Kls)\s*/i, '');
  let rawBayar = (data.caraBayar || 'BPJS').trim().toUpperCase();
  // Hapus akhiran kelas jika sudah tertulis di rawBayar agar tidak menghasilkan "- BPJS 3 3"
  rawBayar = rawBayar.replace(/\s*(?:KLS|KELAS)?\s*(?:3|2|1|VIP|VVIP)$/i, '').trim();

  return `Pesan kamar kls : ${kls}

${cleanNama} (${cleanUmur})
- ${cleanDx}
- ${cleanDpjp}
- ${rawBayar} ${kls}`;
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
