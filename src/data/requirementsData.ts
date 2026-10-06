import { RequirementDocItem, SlipKekuranganBerkas, GuarantorCategory } from '../types/requirementsTypes';

export const MASTER_REQUIREMENTS: RequirementDocItem[] = [
  // 1. BPJS Kesehatan / Ketenagakerjaan
  {
    id: 'bpjs-sep',
    name: 'Surat Elegibilitas Peserta (SEP)',
    code: 'SEP',
    category: 'bpjs',
    description: 'Diterbitkan oleh petugas loket admisi melalui sistem BPJS VClaim setelah sidik jari (fingerprint) / validasi biometrik.',
    isMandatory: true,
    applicableServices: ['rawat_jalan', 'rawat_inap', 'igd_darurat'],
    validityPeriod: 'Sesuai tanggal kunjungan/episode'
  },
  {
    id: 'bpjs-skdp',
    name: 'Surat Kontrol Rawat Jalan (SKDP)',
    code: 'SKDP',
    category: 'bpjs',
    description: 'Surat rencana kontrol yang ditandatangani oleh DPJP spesialis RSUMB pada kunjungan sebelumnya.',
    isMandatory: true,
    applicableServices: ['rawat_jalan'],
    validityPeriod: 'Berlaku maksimal 30 hari sejak diterbitkan'
  },
  {
    id: 'bpjs-rujukan',
    name: 'Rujukan Asli FKTP (Puskesmas / Klinik)',
    code: 'RUJUKAN_FKTP',
    category: 'bpjs',
    description: 'Surat rujukan berjenjang dari FKTP primer yang terdaftar pada kartu BPJS (atau rujukan digital P-Care).',
    isMandatory: true,
    applicableServices: ['rawat_jalan', 'rawat_inap'],
    validityPeriod: 'Berlaku 90 hari sejak tanggal terbit'
  },
  {
    id: 'bpjs-ktp-kk',
    name: 'KTP-el / Kartu Keluarga (KK) Pasien',
    code: 'KTP_KK',
    category: 'bpjs',
    description: 'Identitas kependudukan asli atau fotokopi jelas untuk pencocokan NIK di master database BPJS.',
    isMandatory: true,
    applicableServices: ['rawat_jalan', 'rawat_inap', 'igd_darurat']
  },
  {
    id: 'bpjs-kartu',
    name: 'Kartu BPJS Kesehatan / KIS / KIS Digital',
    code: 'KARTU_BPJS',
    category: 'bpjs',
    description: 'Kartu fisik atau tangkapan layar kartu digital pada aplikasi Mobile JKN dengan status kepesertaan AKTIF.',
    isMandatory: true,
    applicableServices: ['rawat_jalan', 'rawat_inap', 'igd_darurat']
  },
  {
    id: 'bpjs-spri',
    name: 'Surat Perintah Rawat Inap (SPRI)',
    code: 'SPRI',
    category: 'bpjs',
    description: 'Surat perintah opname yang diterbitkan oleh dokter IGD atau poliklinik spesialis.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'bpjs-ketenagakerjaan-form',
    name: 'Formulir Laporan Kecelakaan Kerja (BPJS TK)',
    code: 'FORM_BPJSTK',
    category: 'bpjs',
    description: 'Formulir kecelakaan kerja Tahap 1 dari instansi/perusahaan tempat pasien bekerja (khusus BPJS TK).',
    isMandatory: false,
    applicableServices: ['rawat_inap', 'igd_darurat'],
    notes: 'Diserahkan maksimal 2x24 jam kerja sejak pasien masuk'
  },

  // 2. Pasien Umum / Asuransi Swasta
  {
    id: 'umum-ktp',
    name: 'KTP / Identitas Pasien Asli / Fotokopi',
    code: 'KTP_UMUM',
    category: 'umum_asuransi',
    description: 'Identitas resmi pasien untuk pembuatan berkas rekam medis dan administrasi billing RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_jalan', 'rawat_inap', 'igd_darurat']
  },
  {
    id: 'asuransi-kartu',
    name: 'Kartu Asuransi Swasta / Korporasi',
    code: 'KARTU_ASURANSI',
    category: 'umum_asuransi',
    description: 'Kartu peserta asuransi rekanan (Prudential, Sinarmas, AdMedika, Mandiri Inhealth, dll.) atau e-Card.',
    isMandatory: true,
    applicableServices: ['rawat_jalan', 'rawat_inap', 'igd_darurat']
  },
  {
    id: 'asuransi-gl',
    name: 'Surat Jaminan Awal / Guarantee Letter (GL)',
    code: 'GL_ASURANSI',
    category: 'umum_asuransi',
    description: 'Surat persetujuan penjaminan sementara atau final dari pihak asuransi/TPA rekanan RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap', 'igd_darurat']
  },
  {
    id: 'asuransi-form-klaim',
    name: 'Formulir Klaim Asuransi Swasta',
    code: 'FORM_KLAIM',
    category: 'umum_asuransi',
    description: 'Formulir medis klaim asuransi yang harus diisi dan ditandatangani oleh dokter yang merawat (DPJP).',
    isMandatory: false,
    applicableServices: ['rawat_jalan', 'rawat_inap']
  },
  {
    id: 'asuransi-surat-pengantar',
    name: 'Surat Rujukan / Pengantar Perusahaan',
    code: 'PENGANTAR_PERUSAHAAN',
    category: 'umum_asuransi',
    description: 'Khusus pasien korporasi / instansi kerja sama (MoU) dengan RSUMB.',
    isMandatory: false,
    applicableServices: ['rawat_jalan', 'rawat_inap']
  },

  // 3. Kasus Kecelakaan Lalu Lintas (KLL) / Jasa Raharja
  {
    id: 'jr-lp',
    name: 'Laporan Polisi (LP) Kecelakaan Lalu Lintas',
    code: 'LP_POLISI',
    category: 'jasa_raharja',
    description: 'Surat Laporan Polisi resmi dari Satlantas / Polsek setempat yang menyatakan terjadinya peristiwa kecelakaan lalu lintas.',
    isMandatory: true,
    applicableServices: ['igd_darurat', 'rawat_inap'],
    notes: 'Syarat mutlak penjaminan Jasa Raharja. Pengurusan maksimal 2x24 jam.'
  },
  {
    id: 'jr-surat-jaminan',
    name: 'Surat Jaminan (Guarantee Letter) PT Jasa Raharja',
    code: 'GL_JASA_RAHARJA',
    category: 'jasa_raharja',
    description: 'Surat konfirmasi penjaminan dari PT Jasa Raharja setelah berkas LP diverifikasi (Plafon maksimal Rp 20.000.000).',
    isMandatory: true,
    applicableServices: ['igd_darurat', 'rawat_inap']
  },
  {
    id: 'jr-kronologi',
    name: 'Kronologi Kejadian Kecelakaan Bermaterai',
    code: 'KRONOLOGI_KLL',
    category: 'jasa_raharja',
    description: 'Surat pernyataan kronologi rinci waktu, tempat, dan lawan tabrak bermaterai Rp 10.000 serta ditandatangani saksi/pelapor.',
    isMandatory: true,
    applicableServices: ['igd_darurat', 'rawat_inap']
  },
  {
    id: 'jr-ktp-korban-pelapor',
    name: 'KTP Korban & KTP Saksi / Pelapor',
    code: 'KTP_KORBAN_SAKSI',
    category: 'jasa_raharja',
    description: 'Fotokopi identitas korban serta saksi kejadian yang melaporkan insiden kecelakaan ke pihak kepolisian.',
    isMandatory: true,
    applicableServices: ['igd_darurat', 'rawat_inap']
  },
  {
    id: 'jr-bpjs-secondary',
    name: 'Kartu BPJS Kesehatan Korban (Penjamin Kedua)',
    code: 'BPJS_SECONDARY',
    category: 'jasa_raharja',
    description: 'Kartu BPJS aktif sebagai pembayar sekunder (secondary payer) apabila total biaya rumah sakit melampaui plafon Rp 20 juta.',
    isMandatory: true,
    applicableServices: ['igd_darurat', 'rawat_inap'],
    notes: 'SEP BPJS KLL diterbitkan setelah terbit verifikasi Jasa Raharja'
  }
];

export const GUARANTOR_LABELS: Record<GuarantorCategory, string> = {
  bpjs: 'BPJS Kesehatan / BPJS Ketenagakerjaan',
  umum_asuransi: 'Pasien Umum / Asuransi Swasta',
  jasa_raharja: 'Kasus Kecelakaan / PT Jasa Raharja'
};

const STORAGE_KEY_SLIPS = 'rsumb_pending_requirements_v1';

export const loadPendingRequirementSlips = (): SlipKekuranganBerkas[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLIPS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Error loading pending slips:', e);
  }
  return [];
};

export const savePendingRequirementSlips = (slips: SlipKekuranganBerkas[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SLIPS, JSON.stringify(slips));
    window.dispatchEvent(new Event('rsumb_pending_slips_updated'));
  } catch (e) {
    console.error('Error saving pending slips:', e);
  }
};

export const generateNomorSlip = (): string => {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `SLIP-${ymd}-${rand}`;
};

export const calculateDefaultDeadline = (penjamin: GuarantorCategory): string => {
  const now = new Date();
  // BPJS rawat inap aturan 3x24 jam kerja (atau 2x24 jam kerja)
  const hoursToAdd = penjamin === 'jasa_raharja' ? 48 : 72; // 2 hari atau 3 hari
  now.setHours(now.getHours() + hoursToAdd);

  const formattedDate = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).replace(':', '.') + ' WIB';

  const daysLabel = penjamin === 'jasa_raharja' ? '2 x 24 Jam Kerja' : '3 x 24 Jam Kerja';
  return `Maksimal ${daysLabel} (${formattedDate}, pukul ${formattedTime})`;
};
