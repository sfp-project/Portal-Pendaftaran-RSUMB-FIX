export type GuarantorCategory = 'bpjs' | 'umum_asuransi' | 'jasa_raharja';

export interface RequirementChecklistItem {
  id: string;
  category: GuarantorCategory;
  title: string;
  code: string;
  description: string;
  importance: 'wajib' | 'kondisional' | 'pendukung';
  validityPeriod?: string;
  legalNote?: string;
  tips?: string;
}

export interface MissingDocumentSlip {
  id: string;
  slipNumber: string; // Format: SLIP-SKB-YYYYMM-XXXX
  patientName: string;
  noRm: string;
  guarantor: string; // 'BPJS Kesehatan', 'BPJS Ketenagakerjaan', 'Umum', 'Asuransi Swasta', 'Jasa Raharja'
  roomOrClinic: string;
  admissionDate: string; // YYYY-MM-DD
  admissionTime?: string; // HH:mm
  deadlineDate: string; // YYYY-MM-DD HH:mm
  deadlineHours: number; // Default: 72 (3x24 Jam)
  missingItems: string[];
  notes?: string;
  officerName: string;
  officerShift: string;
  status: 'pending' | 'resolved' | 'expired';
  createdAt: string;
  resolvedAt?: string;
}

export const INITIAL_REQUIREMENTS_CHECKLIST: RequirementChecklistItem[] = [
  // 1. BPJS KESEHATAN / KETENAGAKERJAAN
  {
    id: 'bpjs-sep',
    category: 'bpjs',
    title: 'Surat Eligibilitas Peserta (SEP)',
    code: 'SEP-VCLAIM',
    description: 'Diterbitkan petugas admisi RSUMB melalui portal BPJS VClaim setelah verifikasi sidik jari (fingerprint) / face recognition.',
    importance: 'wajib',
    validityPeriod: '1x Kunjungan / Selama Ranap',
    legalNote: 'Regulasi BPJS Kesehatan No. 1/2014 & Panduan Teknis VClaim',
    tips: 'Jika fingerprint gagal 3x, gunakan fitur override alasan medis/teknis di sistem VClaim.'
  },
  {
    id: 'bpjs-skdp',
    category: 'bpjs',
    title: 'Surat Kontrol / SKDP Asli',
    code: 'SKDP-DPJP',
    description: 'Surat Keterangan Dalam Perawatan asli yang ditandatangani DPJP dokter spesialis RSUMB dengan tanggal kontrol yang masih aktif.',
    importance: 'wajib',
    validityPeriod: 'Sesuai Tanggal Tertera (Maks. 30 Hari)',
    legalNote: 'Wajib untuk pasien rawat jalan ulangan (kontrol post-ranap / poli)',
    tips: 'Pastikan nomor surat kontrol terdaftar di VClaim agar bridging SEP tidak ditolak.'
  },
  {
    id: 'bpjs-ktp',
    category: 'bpjs',
    title: 'KTP Asli / e-KTP / Kartu Identitas Anak (KIA)',
    code: 'ID-KTP',
    description: 'Identitas kependudukan pasien yang masih berlaku untuk pencocokan NIK dengan database Dukcapil & BPJS.',
    importance: 'wajib',
    validityPeriod: 'Seumur Hidup',
    tips: 'Untuk pasien bayi baru lahir, gunakan NIK ibu kandung atau nomor Kartu Keluarga (KK).'
  },
  {
    id: 'bpjs-kartu',
    category: 'bpjs',
    title: 'Kartu BPJS Kesehatan / KIS Digital (Mobile JKN)',
    code: 'KIS-CARD',
    description: 'Kartu fisik KIS/BPJS atau tangkapan layar kartu digital aktif dari aplikasi Mobile JKN pasien/keluarga.',
    importance: 'wajib',
    validityPeriod: 'Status Aktif (Tidak Menunggak)',
    tips: 'Cek status kepesertaan. Jika non-aktif karena premi tertunggak, edukasi pembayaran via VA.'
  },
  {
    id: 'bpjs-fktp',
    category: 'bpjs',
    title: 'Surat Rujukan FKTP (Puskesmas / Klinik Pertama)',
    code: 'RUJUKAN-FKTP',
    description: 'Surat rujukan online berbarcode dari Puskesmas / Dokter Keluarga / Klinik Pratama terdaftar.',
    importance: 'wajib',
    validityPeriod: 'Masa Berlaku 90 Hari (3 Bulan)',
    legalNote: 'Rujukan berjenjang sistem rujukan terintegrasi BPJS',
    tips: 'Masa berlaku rujukan 90 hari sejak tanggal terbit. Pastikan belum kedaluwarsa.'
  },
  {
    id: 'bpjs-kk',
    category: 'bpjs',
    title: 'Kartu Keluarga (KK) Pasien',
    code: 'DOC-KK',
    description: 'Fotokopi / berkas digital Kartu Keluarga untuk verifikasi susunan keluarga dan validasi data anak.',
    importance: 'kondisional',
    validityPeriod: 'Terbaru',
    tips: 'Diperlukan terutama untuk pasien balita, lansia tanpa KTP, atau pendaftaran bayi baru lahir.'
  },
  {
    id: 'bpjs-spri',
    category: 'bpjs',
    title: 'Surat Perintah Rawat Inap (SPRI)',
    code: 'SPRI-RANAP',
    description: 'Surat perintah rawat inap resmi yang diterbitkan oleh dokter IGD atau poliklinik RSUMB.',
    importance: 'wajib',
    validityPeriod: '1x Episode Rawat Inap',
    tips: 'Wajib dibuatkan SPRI sebelum menerbitkan SEP Rawat Inap di VClaim.'
  },
  {
    id: 'bpjs-naik-kelas',
    category: 'bpjs',
    title: 'Surat Pernyataan Naik Kelas / Selisih Biaya',
    code: 'FORM-NAIK-KELAS',
    description: 'Formulir persetujuan penjaminan bila pasien BPJS meminta kenaikan kelas rawat inap atas permintaan sendiri (APS).',
    importance: 'kondisional',
    validityPeriod: 'Per Episode Ranap',
    legalNote: 'Permenkes No. 3 Tahun 2023 tentang Standar Tarif Pelayanan',
    tips: 'Jelaskan formula selisih biaya INA-CBG secara transparan kepada keluarga pasien.'
  },

  // 2. UMUM / ASURANSI SWASTA
  {
    id: 'umum-ktp',
    category: 'umum_asuransi',
    title: 'Identitas Resmi Pasien (KTP / SIM / Paspor)',
    code: 'ID-PASIEN',
    description: 'Kartu identitas resmi pasien untuk pencocokan data rekam medis (SIMRS RSUMB).',
    importance: 'wajib',
    validityPeriod: 'Berlaku',
    tips: 'Catat NIK dan nomor HP aktif pasien/keluarga penanggung jawab.'
  },
  {
    id: 'asuransi-kartu',
    category: 'umum_asuransi',
    title: 'Kartu Asuransi Swasta Rekanan (Fisik / Digital)',
    code: 'CARD-INSURANCE',
    description: 'Kartu kepesertaan asuransi rekanan (Prudential, Allianz, Sinarmas, AXA Mandiri, AdMedika, dll).',
    importance: 'wajib',
    validityPeriod: 'Polis Aktif',
    tips: 'Periksa nomor polis dan tanggal masa berlaku kartu asuransi.'
  },
  {
    id: 'asuransi-gl',
    category: 'umum_asuransi',
    title: 'Guarantee Letter (GL) / Surat Jaminan Awal',
    code: 'GL-INSURANCE',
    description: 'Surat jaminan resmi yang diterbitkan pihak asuransi/TPA (AdMedika/Medika Plaza) untuk rawat inap.',
    importance: 'wajib',
    validityPeriod: 'Sesuai Plafon & Durasi GL',
    legalNote: 'Dasar klaim cashless rawat inap RSUMB',
    tips: 'Hubungi call center TPA asuransi terkait untuk konfirmasi approval kamar rawat inap.'
  },
  {
    id: 'asuransi-form-klaim',
    category: 'umum_asuransi',
    title: 'Formulir Klaim Asuransi (Medis & Admisi)',
    code: 'FORM-KLAIM-SWASTA',
    description: 'Formulir klaim resmi asuransi yang wajib diisi dan ditandatangani oleh DPJP serta pasien.',
    importance: 'wajib',
    validityPeriod: 'Per Episode Rawat',
    tips: 'Serahkan form klaim ke perawat ruangan agar dilengkapi dokter sebelum pasien pulang.'
  },
  {
    id: 'umum-deposit',
    category: 'umum_asuransi',
    title: 'Form Persetujuan Biaya & Uang Muka (Deposit)',
    code: 'FORM-DEPOSIT-UMUM',
    description: 'Surat persetujuan estimasi tarif tindakan/operasi dan bukti deposit awal di kasir pendaftaran.',
    importance: 'kondisional',
    validityPeriod: 'Per Tindakan',
    tips: 'Dibutuhkan untuk pasien umum yang menjalani tindakan pembedahan atau sewa alat khusus.'
  },
  {
    id: 'umum-rujukan-dokter',
    category: 'umum_asuransi',
    title: 'Surat Pengantar Dokter Luar / Praktek Mandiri',
    code: 'DOC-PENGANTAR-LUAR',
    description: 'Surat pengantar atau resume konsultasi jika pasien dirujuk oleh dokter luar RSUMB.',
    importance: 'pendukung',
    validityPeriod: '30 Hari',
    tips: 'Lampirkan pada berkas rekam medis untuk referensi dokter spesialis pemeriksa.'
  },

  // 3. KASUS KECELAKAAN LALU LINTAS / JASA RAHARJA
  {
    id: 'jr-lp',
    category: 'jasa_raharja',
    title: 'Laporan Polisi (LP) KLL Asli dari Satlantas',
    code: 'LP-SATLANTAS',
    description: 'Surat Laporan Polisi resmi dari Satuan Lalu Lintas (Satlantas) Polres terkait lokasi kecelakaan lalu lintas.',
    importance: 'wajib',
    validityPeriod: 'Maks. 3x24 Jam Kerja',
    legalNote: 'Syarat mutlak penjaminan Jasa Raharja (UU No. 34 Tahun 1964)',
    tips: 'Keluarga wajib segera mengurus LP ke Unit Laka Satlantas dengan membawa saksi kejadian.'
  },
  {
    id: 'jr-surat-jaminan',
    category: 'jasa_raharja',
    title: 'Surat Jaminan Resmi Jasa Raharja (Guarantee Letter)',
    code: 'GL-JASA-RAHARJA',
    description: 'Surat jaminan yang diterbitkan oleh PT Jasa Raharja setelah LP Satlantas diverifikasi (Plafon Rp 20 Juta).',
    importance: 'wajib',
    validityPeriod: 'Plafon Maks. Rp 20.000.000',
    tips: 'Petugas RSUMB berkoordinasi via sistem DASI-JR online untuk verifikasi klaim cepat.'
  },
  {
    id: 'jr-kronologi',
    category: 'jasa_raharja',
    title: 'Formulir Kronologi Kejadian Kecelakaan & Sketsa TKP',
    code: 'FORM-KRONOLOGI-JR',
    description: 'Formulir resmi kronologi yang memuat waktu, tempat kejadian (TKP), jenis tabrakan, dan tanda tangan saksi.',
    importance: 'wajib',
    validityPeriod: 'Permanen',
    tips: 'Pastikan kronologi mencantumkan nomor polisi seluruh kendaraan yang terlibat.'
  },
  {
    id: 'jr-ktp-sim',
    category: 'jasa_raharja',
    title: 'KTP & SIM Pengendara yang Terlibat',
    code: 'ID-SIM-PENGENDARA',
    description: 'Fotokopi KTP korban, KTP pengendara, dan SIM pengendara yang terlibat dalam kecelakaan lalu lintas.',
    importance: 'wajib',
    validityPeriod: 'Berlaku',
    tips: 'Jika korban adalah penumpang kendaraan umum, lampirkan karcis/tiket perjalanan resmi.'
  },
  {
    id: 'jr-stnk',
    category: 'jasa_raharja',
    title: 'STNK Kendaraan & Bukti Pajak Aktif',
    code: 'DOC-STNK',
    description: 'Fotokopi Surat Tanda Nomor Kendaraan (STNK) kendaraan yang terlibat kecelakaan lalu lintas.',
    importance: 'wajib',
    validityPeriod: 'Pajak SWDKLLJ',
    tips: 'Pastikan sumbangan wajib dana kecelakaan lalu lintas jalan (SWDKLLJ) tertera di STNK.'
  },
  {
    id: 'jr-saksi',
    category: 'jasa_raharja',
    title: 'Keterangan Saksi / Identitas Saksi Mata',
    code: 'DOC-SAKSI-MATA',
    description: 'Nama, alamat, nomor telepon, dan salinan identitas minimal 1 orang saksi mata di lokasi kecelakaan.',
    importance: 'pendukung',
    validityPeriod: 'Permanen',
    tips: 'Sangat mempercepat proses penerbitan Laporan Polisi di Satlantas.'
  },
  {
    id: 'jr-bpjs-secondary',
    category: 'jasa_raharja',
    title: 'Konfirmasi BPJS Kesehatan (Secondary Payer)',
    code: 'COB-BPJS-JR',
    description: 'Koordinasi penjaminan lanjutan jika biaya perawatan di RSUMB melebihi plafon Jasa Raharja Rp 20.000.000.',
    importance: 'kondisional',
    validityPeriod: 'Setelah Plafon JR Habis',
    legalNote: 'Permenkeu No. 141/PMK.02/2018 tentang Koordinasi Manfaat Penjaminan',
    tips: 'Jika biaya mendekati Rp 18.000.000, segera terbitkan SEP BPJS Kasus KLL lanjutan.'
  }
];
