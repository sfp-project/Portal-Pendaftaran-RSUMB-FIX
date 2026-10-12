import { RequirementDocItem, SlipKekuranganBerkas, GuarantorCategory, ServiceType } from '../types/requirementsTypes';

export const GUARANTOR_OPTIONS: Array<{
  id: GuarantorCategory;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  group: 'umum' | 'bpjs' | 'jr' | 'bpjstk' | 'asuransi';
}> = [
  {
    id: 'umum',
    label: 'UMUM (Bayar Mandiri)',
    shortLabel: 'UMUM',
    badge: 'Umum / Mandiri',
    description: 'Pasien umum tarif non-penjamin, identitas KTP/KK/KIA & berkas persetujuan umum.',
    group: 'umum'
  },
  {
    id: 'bpjs',
    label: 'BPJS Kesehatan (JKN-KIS)',
    shortLabel: 'BPJS',
    badge: 'BPJS Kesehatan',
    description: 'Pasien BPJS Kesehatan VClaim, FRISTA biometrik, rujukan FKTP, SKDP & SPRI.',
    group: 'bpjs'
  },
  {
    id: 'jasa_raharja',
    label: 'Jasa Raharja (JR) - Kasus KLL',
    shortLabel: 'Jasa Raharja (JR)',
    badge: 'Jasa Raharja (JR)',
    description: 'Korban kecelakaan lalu lintas, Laporan Polisi (LP), verifikasi sisa plafon & GL.',
    group: 'jr'
  },
  {
    id: 'bpjs_tk',
    label: 'BPJS Ketenagakerjaan (BPJS TK)',
    shortLabel: 'BPJS TK',
    badge: 'BPJS TK',
    description: 'Jaminan Kecelakaan Kerja (JKK), formulir KK1/KK2 & surat pengantar perusahaan.',
    group: 'bpjstk'
  },
  {
    id: 'asuransi_kai',
    label: 'Asuransi KAI (Kereta Api Indonesia)',
    shortLabel: 'Asuransi KAI',
    badge: 'Asuransi KAI',
    description: 'Rujukan Faskes KAI, Guarantee Letter resmi korporasi PT KAI & form klaim.',
    group: 'asuransi'
  },
  {
    id: 'asuransi_admedika_brilife',
    label: 'Asuransi AdMedika / BRI Life (Swasta)',
    shortLabel: 'AdMedika / BRI Life',
    badge: 'AdMedika / BRI Life',
    description: 'Kartu Asuransi Swasta rekanan TPA (AdMedika/BRI Life), Form Klaim & GL.',
    group: 'asuransi'
  }
];

export const GUARANTOR_LABELS: Record<GuarantorCategory, string> = {
  umum: 'UMUM',
  bpjs: 'BPJS Kesehatan',
  jasa_raharja: 'Jasa Raharja (JR)',
  bpjs_tk: 'BPJS Ketenagakerjaan (BPJS TK)',
  asuransi_kai: 'Asuransi KAI',
  asuransi_admedika_brilife: 'Asuransi AdMedika / BRI Life'
};

export const MASTER_REQUIREMENTS: RequirementDocItem[] = [
  // ==========================================
  // 1. KELOMPOK: RAWAT JALAN
  // ==========================================

  // * UMUM (Rawat Jalan)
  {
    id: 'rajal-umum-id',
    name: 'Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'ID_PASIEN_UMUM',
    category: 'umum',
    description: 'Identitas resmi pasien (e-KTP asli/fotokopi, KK, KIA untuk anak) serta nomor telepon aktif untuk pendaftaran & pencatatan rekam medis.',
    isMandatory: true,
    applicableServices: ['rawat_jalan'],
    validityPeriod: 'Seumur Hidup / Aktif'
  },

  // * BPJS (Rawat Jalan)
  {
    id: 'rajal-bpjs-id',
    name: 'Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'ID_PASIEN_BPJS',
    category: 'bpjs',
    description: 'KTP-el / KK / KIA pasien untuk verifikasi NIK master data Dukcapil dan bridging kepesertaan BPJS.',
    isMandatory: true,
    applicableServices: ['rawat_jalan'],
    validityPeriod: 'Seumur Hidup / Aktif'
  },
  {
    id: 'rajal-bpjs-rujukan',
    name: 'Rujukan Faskes 1',
    code: 'RUJUKAN_FKTP_1',
    category: 'bpjs',
    description: 'Surat rujukan online berjenjang dari FKTP primer (Puskesmas / Klinik Pratama terdaftar di P-Care).',
    isMandatory: true,
    applicableServices: ['rawat_jalan'],
    validityPeriod: 'Berlaku 90 hari sejak tanggal terbit'
  },
  {
    id: 'rajal-bpjs-frista',
    name: 'Sidik Jari & Wajah FRISTA',
    code: 'FRISTA_BIOMETRIK',
    category: 'bpjs',
    description: 'Validasi biometrik Fingerprint (sidik jari) atau Face Recognition FRISTA BPJS di mesin anjungan/loket pendaftaran.',
    isMandatory: true,
    applicableServices: ['rawat_jalan'],
    notes: 'Wajib lolos rekam biometrik sebelum SEP rawat jalan diterbitkan.'
  },
  {
    id: 'rajal-bpjs-skdp',
    name: 'Terbit Surat Kontrol',
    code: 'TERBIT_SKDP',
    category: 'bpjs',
    description: 'Surat rencana kontrol poliklinik yang diterbitkan dan ditandatangani oleh DPJP spesialis RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_jalan'],
    validityPeriod: 'Berlaku maksimal 30 hari sejak terbit'
  },
  {
    id: 'rajal-bpjs-sep',
    name: 'Cetak SEP',
    code: 'CETAK_SEP_RAJAL',
    category: 'bpjs',
    description: 'Surat Eligibilitas Peserta (SEP) Rawat Jalan yang telah berhasil dicetak dari sistem BPJS VClaim.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },

  // * JASA RAHARJA (JR) (Rawat Jalan)
  {
    id: 'rajal-jr-plafon',
    name: 'Sisa Plafon Masih Ada',
    code: 'SISA_PLAFON_JR',
    category: 'jasa_raharja',
    description: 'Konfirmasi dan verifikasi sisa limit santunan biaya perawatan PT Jasa Raharja masih mencukupi (maksimal Rp 20.000.000).',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },
  {
    id: 'rajal-jr-berkas-id',
    name: 'FC KTP / FC KK / Materai 10.000',
    code: 'FC_KTP_KK_MATERAI_JR',
    category: 'jasa_raharja',
    description: 'Fotokopi KTP pasien/korban, fotokopi Kartu Keluarga, dan materai Rp 10.000 untuk pengesahan berkas klaim santunan.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },
  {
    id: 'rajal-jr-lp',
    name: 'Laporan Polisi (LP) / Berkas KLL',
    code: 'LP_KLL_RAJAL',
    category: 'jasa_raharja',
    description: 'Surat Laporan Polisi (LP) Laka Lantas dari unit Satlantas Polres setempat yang menyatakan status kecelakaan lalu lintas.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },
  {
    id: 'rajal-jr-gl',
    name: 'Surat Jaminan (GL) PT Jasa Raharja',
    code: 'GL_JASA_RAHARJA_RAJAL',
    category: 'jasa_raharja',
    description: 'Surat Jaminan (Guarantee Letter) dari PT Jasa Raharja yang telah disetujui untuk tindakan rawat jalan.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },

  // * BPJS KETENAGAKERJAAN (BPJS TK) (Rawat Jalan)
  {
    id: 'rajal-bpjstk-id',
    name: 'Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'ID_PASIEN_BPJSTK',
    category: 'bpjs_tk',
    description: 'KTP-el atau Kartu Keluarga pasien korban kecelakaan kerja.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },
  {
    id: 'rajal-bpjstk-kartu',
    name: 'Kartu BPJS Ketenagakerjaan (KPJ)',
    code: 'KARTU_BPJS_TK',
    category: 'bpjs_tk',
    description: 'Kartu Peserta Jamsostek (KPJ) / Kartu Digital BPJS Ketenagakerjaan dengan status kepesertaan aktif.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },
  {
    id: 'rajal-bpjstk-form',
    name: 'Formulir Laporan Kasus Kecelakaan Kerja (KK1) / Surat Pengantar Perusahaan',
    code: 'FORM_KK1_BPJSTK',
    category: 'bpjs_tk',
    description: 'Formulir Laporan Kasus Kecelakaan Kerja Tahap I (Form KK1) dan surat keterangan resmi dari HRD/manajemen perusahaan.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },

  // * ASURANSI KAI (Rawat Jalan)
  {
    id: 'rajal-kai-id',
    name: 'Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'ID_PASIEN_KAI',
    category: 'asuransi_kai',
    description: 'Identitas resmi pegawai atau keluarga pegawai PT Kereta Api Indonesia (KAI).',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },
  {
    id: 'rajal-kai-rujukan',
    name: 'Rujukan Faskes KAI',
    code: 'RUJUKAN_FASKES_KAI',
    category: 'asuransi_kai',
    description: 'Surat rujukan resmi dari Klinik / Fasilitas Kesehatan tingkat pertama yang ditunjuk oleh PT Kereta Api Indonesia (KAI).',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },

  // * ASURANSI ADMEDIKA / BRI LIFE (Rawat Jalan)
  {
    id: 'rajal-admedika-id',
    name: 'Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'ID_PASIEN_ADMEDIKA',
    category: 'asuransi_admedika_brilife',
    description: 'Identitas resmi pasien pemegang polis asuransi AdMedika / BRI Life.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },
  {
    id: 'rajal-admedika-kartu',
    name: 'No. Kartu Asuransi',
    code: 'NO_KARTU_ASURANSI_RAJAL',
    category: 'asuransi_admedika_brilife',
    description: 'Nomor kartu fisik atau digital asuransi rekanan (AdMedika / BRI Life / TPA) untuk proses otorisasi gesek kartu / portal web EDC.',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },
  {
    id: 'rajal-admedika-form',
    name: 'Form Asuransi Rawat Jalan',
    code: 'FORM_ASURANSI_RAWAT_JALAN',
    category: 'asuransi_admedika_brilife',
    description: 'Formulir klaim rawat jalan resmi asuransi yang diisi dan ditandatangani oleh dokter pemeriksa (DPJP).',
    isMandatory: true,
    applicableServices: ['rawat_jalan']
  },

  // ==========================================
  // 2. KELOMPOK: RAWAT INAP
  // ==========================================

  // * UMUM (Rawat Inap)
  {
    id: 'ranap-umum-1-id',
    name: '1. Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'RANAP_UMUM_ID',
    category: 'umum',
    description: 'Identitas asli/fotokopi pasien yang jelas untuk data registrasi rekam medis rawat inap RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-umum-2-permintaan',
    name: '2. Permintaan Ranap Dokter',
    code: 'RANAP_UMUM_PERMINTAAN',
    category: 'umum',
    description: 'Surat instruksi / lembar disposisi admisi rawat inap dari dokter IGD atau dokter poliklinik.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-umum-3-buku',
    name: '3. Buku Ranap',
    code: 'RANAP_UMUM_BUKU',
    category: 'umum',
    description: 'Buku registrasi dan catatan perkembangan pasien rawat inap RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-umum-4-gelang',
    name: '4. Gelang Pasien',
    code: 'RANAP_UMUM_GELANG',
    category: 'umum',
    description: 'Pemasangan gelang identifikasi pasien (warna biru/merah muda/kuning resiko jatuh).',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-umum-5-sk-umum',
    name: '5. Surat Keterangan Umum',
    code: 'RANAP_UMUM_SK',
    category: 'umum',
    description: 'Surat pernyataan dan keterangan pembiayaan jalur pasien umum RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-umum-6-persetujuan',
    name: '6. Persetujuan Ranap',
    code: 'RANAP_UMUM_PERSETUJUAN',
    category: 'umum',
    description: 'Formulir lembar persetujuan opname / rawat inap yang ditandatangani pasien/keluarga/penanggung jawab.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-umum-7-general-consent',
    name: '7. General Consent',
    code: 'RANAP_UMUM_GC',
    category: 'umum',
    description: 'Lembar Persetujuan Umum (General Consent) perawatan medis dan tata tertib ruang rawat inap.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-umum-8-souvenir',
    name: '8. Souvenir',
    code: 'RANAP_UMUM_SOUVENIR',
    category: 'umum',
    description: 'Pemberian paket souvenir / welcome kit perlengkapan pasien rawat inap RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-umum-9-pesan-kamar',
    name: '9. Pesan Kamar',
    code: 'RANAP_UMUM_PESAN_KAMAR',
    category: 'umum',
    description: 'Konfirmasi pemesanan kelas kamar (VVIP, VIP, Kelas 1, Kelas 2, Kelas 3) pada sistem sentral admisi.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },

  // * BPJS (Rawat Inap)
  {
    id: 'ranap-bpjs-1-id',
    name: '1. Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'RANAP_BPJS_ID',
    category: 'bpjs',
    description: 'e-KTP / Kartu Keluarga / Kartu KIS aktif pasien.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjs-2-permintaan',
    name: '2. Permintaan Ranap Dokter',
    code: 'RANAP_BPJS_PERMINTAAN',
    category: 'bpjs',
    description: 'Lembar instruksi rawat inap dari dokter spesialis / dokter IGD.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjs-3-sep-rajal-igd',
    name: '3. SEP Rawat Jalan / IGD',
    code: 'RANAP_BPJS_SEP_AWAL',
    category: 'bpjs',
    description: 'SEP awal dari kunjungan Rawat Jalan atau Unit Gawat Darurat (IGD).',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjs-4-spri',
    name: '4. SPRI BPJS',
    code: 'RANAP_BPJS_SPRI',
    category: 'bpjs',
    description: 'Surat Perintah Rawat Inap (SPRI) resmi yang dientrikan ke VClaim dengan DPJP penanggung jawab.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjs-5-buku',
    name: '5. Buku Ranap',
    code: 'RANAP_BPJS_BUKU',
    category: 'bpjs',
    description: 'Buku rekam rawat inap pasien RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjs-6-gelang',
    name: '6. Gelang Pasien',
    code: 'RANAP_BPJS_GELANG',
    category: 'bpjs',
    description: 'Pemasangan gelang barcode identitas pasien rawat inap.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjs-7-sep-ranap',
    name: '7. SEP Rawat Inap',
    code: 'RANAP_BPJS_SEP_RANAP',
    category: 'bpjs',
    description: 'Surat Eligibilitas Peserta (SEP) khusus Rawat Inap yang diterbitkan dari bridging VClaim.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjs-8-pesan-kamar',
    name: '8. Pesan Kamar',
    code: 'RANAP_BPJS_PESAN_KAMAR',
    category: 'bpjs',
    description: 'Plotting dan konfirmasi ketersediaan tempat tidur / kamar perawatan sesuai hak kelas BPJS.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjs-9-frista',
    name: '9. Sidik Jari & Wajah FRISTA',
    code: 'RANAP_BPJS_FRISTA',
    category: 'bpjs',
    description: 'Validasi biometrik sidik jari & wajah FRISTA pasien BPJS saat proses admisi rawat inap.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },

  // * JASA RAHARJA (JR) (Rawat Inap)
  {
    id: 'ranap-jr-1-id',
    name: '1. Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'RANAP_JR_ID',
    category: 'jasa_raharja',
    description: 'Identitas korban kecelakaan lalu lintas (e-KTP, KK, SIM).',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-2-permintaan',
    name: '2. Permintaan Ranap Dokter',
    code: 'RANAP_JR_PERMINTAAN',
    category: 'jasa_raharja',
    description: 'Instruksi opname dokter IGD / bedah untuk penanganan cedera trauma kecelakaan.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-3-plafon',
    name: '3. Sisa Plafon Masih Ada (Cek Plafon Jasa Raharja)',
    code: 'RANAP_JR_PLAFON',
    category: 'jasa_raharja',
    description: 'Pengecekan dan konfirmasi sisa kuota jaminan PT Jasa Raharja (Plafon Rp 20.000.000).',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-4-berkas',
    name: '4. FC KTP / FC KK / Materai 10.000',
    code: 'RANAP_JR_BERKAS',
    category: 'jasa_raharja',
    description: 'Fotokopi identitas lengkap serta materai Rp 10.000 untuk kelengkapan administrasi santunan.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-5-lp',
    name: '5. Laporan Polisi (LP) Asli / Legalisir',
    code: 'RANAP_JR_LP',
    category: 'jasa_raharja',
    description: 'Surat Laporan Polisi resmi dari Satlantas Polres setempat (wajib diserahkan maks. 2x24 jam).',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-6-gl',
    name: '6. Surat Jaminan (GL) PT Jasa Raharja',
    code: 'RANAP_JR_GL',
    category: 'jasa_raharja',
    description: 'Guarantee Letter / Surat Konfirmasi Penjaminan Resmi dari PT Jasa Raharja.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-7-kronologi',
    name: '7. Form Kronologi Kejadian KLL',
    code: 'RANAP_JR_KRONOLOGI',
    category: 'jasa_raharja',
    description: 'Surat pernyataan kronologis laka lantas bermaterai Rp 10.000 yang ditandatangani saksi/pelapor.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-8-buku',
    name: '8. Buku Ranap',
    code: 'RANAP_JR_BUKU',
    category: 'jasa_raharja',
    description: 'Buku registrasi rawat inap RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-9-gelang',
    name: '9. Gelang Pasien',
    code: 'RANAP_JR_GELANG',
    category: 'jasa_raharja',
    description: 'Pemasangan gelang pengenal pasien rawat inap.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-10-persetujuan',
    name: '10. Persetujuan Ranap & General Consent',
    code: 'RANAP_JR_CONSENT',
    category: 'jasa_raharja',
    description: 'Persetujuan rawat inap dan lembar General Consent oleh keluarga pasien.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-11-pesan-kamar',
    name: '11. Pesan Kamar',
    code: 'RANAP_JR_PESAN_KAMAR',
    category: 'jasa_raharja',
    description: 'Pemesanan dan penetapan kamar perawatan rawat inap.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-jr-12-bpjs-secondary',
    name: '12. Kartu BPJS Kesehatan (Secondary Payer)',
    code: 'RANAP_JR_BPJS_SECONDARY',
    category: 'jasa_raharja',
    description: 'Kartu BPJS Kesehatan aktif sebagai penjamin pembayar kedua apabila biaya melebihi Rp 20 juta.',
    isMandatory: false,
    applicableServices: ['rawat_inap']
  },

  // * BPJS KETENAGAKERJAAN (BPJS TK) (Rawat Inap)
  {
    id: 'ranap-bpjstk-1-id',
    name: '1. Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'RANAP_BPJSTK_ID',
    category: 'bpjs_tk',
    description: 'e-KTP dan Kartu Keluarga karyawan korban kecelakaan kerja.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjstk-2-permintaan',
    name: '2. Permintaan Ranap Dokter',
    code: 'RANAP_BPJSTK_PERMINTAAN',
    category: 'bpjs_tk',
    description: 'Lembar instruksi rawat inap dari dokter IGD/spesialis penanggung jawab.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjstk-3-kpj',
    name: '3. Kartu Peserta BPJS Ketenagakerjaan (KPJ)',
    code: 'RANAP_BPJSTK_KPJ',
    category: 'bpjs_tk',
    description: 'Kartu fisik atau digital KPJ BPJS Ketenagakerjaan aktif.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjstk-4-kk1-kk2',
    name: '4. Formulir Laporan Kasus Kecelakaan Kerja (KK1 / KK2)',
    code: 'RANAP_BPJSTK_KK1_KK2',
    category: 'bpjs_tk',
    description: 'Formulir Laporan Kasus Kecelakaan Kerja Tahap I (KK1) / Tahap II (KK2) dari instansi pemberi kerja.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjstk-5-pengantar',
    name: '5. Surat Pengantar Perusahaan / Laporan Kronologi Kerja',
    code: 'RANAP_BPJSTK_PENGANTAR',
    category: 'bpjs_tk',
    description: 'Surat resmi dari perusahaan yang menerangkan bahwa kecelakaan terjadi saat bertugas/jam kerja.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjstk-6-buku',
    name: '6. Buku Ranap',
    code: 'RANAP_BPJSTK_BUKU',
    category: 'bpjs_tk',
    description: 'Buku registrasi rawat inap RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjstk-7-gelang',
    name: '7. Gelang Pasien',
    code: 'RANAP_BPJSTK_GELANG',
    category: 'bpjs_tk',
    description: 'Pemasangan gelang identifikasi pasien rawat inap.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjstk-8-persetujuan',
    name: '8. Persetujuan Ranap & General Consent',
    code: 'RANAP_BPJSTK_CONSENT',
    category: 'bpjs_tk',
    description: 'Persetujuan rawat inap dan lembar General Consent.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-bpjstk-9-pesan-kamar',
    name: '9. Pesan Kamar',
    code: 'RANAP_BPJSTK_PESAN_KAMAR',
    category: 'bpjs_tk',
    description: 'Pemesanan kamar perawatan trauma center RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },

  // * ASURANSI KAI (Rawat Inap)
  {
    id: 'ranap-kai-1-id',
    name: '1. Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'RANAP_KAI_ID',
    category: 'asuransi_kai',
    description: 'Identitas pegawai PT KAI / kartu pegawai / KTP keluarga tanggungan.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-2-permintaan',
    name: '2. Permintaan Ranap Dokter',
    code: 'RANAP_KAI_PERMINTAAN',
    category: 'asuransi_kai',
    description: 'Instruksi rawat inap dari dokter IGD/spesialis.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-3-rujukan-faskes',
    name: '3. Rujukan Faskes KAI',
    code: 'RANAP_KAI_RUJUKAN',
    category: 'asuransi_kai',
    description: 'Surat rujukan resmi dari Faskes primer penanggung jawab PT KAI.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-4-gl',
    name: '4. Surat Jaminan Awal (Guarantee Letter / GL)',
    code: 'RANAP_KAI_GL',
    category: 'asuransi_kai',
    description: 'Guarantee Letter awal dari unit jaminan kesehatan PT KAI.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-5-form-klaim',
    name: '5. Form Klaim Rawat Inap KAI',
    code: 'RANAP_KAI_FORM_KLAIM',
    category: 'asuransi_kai',
    description: 'Formulir medis klaim rawat inap korporasi PT KAI.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-6-buku',
    name: '6. Buku Ranap',
    code: 'RANAP_KAI_BUKU',
    category: 'asuransi_kai',
    description: 'Buku registrasi rawat inap RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-7-gelang',
    name: '7. Gelang Pasien',
    code: 'RANAP_KAI_GELANG',
    category: 'asuransi_kai',
    description: 'Pemasangan gelang pasien rawat inap.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-8-persetujuan',
    name: '8. Persetujuan Ranap & General Consent',
    code: 'RANAP_KAI_CONSENT',
    category: 'asuransi_kai',
    description: 'Persetujuan rawat inap dan lembar General Consent.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-9-souvenir',
    name: '9. Souvenir',
    code: 'RANAP_KAI_SOUVENIR',
    category: 'asuransi_kai',
    description: 'Paket souvenir dan welcome kit rawat inap RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-kai-10-pesan-kamar',
    name: '10. Pesan Kamar',
    code: 'RANAP_KAI_PESAN_KAMAR',
    category: 'asuransi_kai',
    description: 'Pemesanan kamar sesuai hak kelas jaminan PT KAI.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },

  // * ASURANSI ADMEDIKA / BRI LIFE (Rawat Inap)
  {
    id: 'ranap-admedika-1-id',
    name: '1. Identitas Pasien (NIK / KTP / KK / KIA / No. Telepon)',
    code: 'RANAP_ADMEDIKA_ID',
    category: 'asuransi_admedika_brilife',
    description: 'Identitas resmi pasien pemegang polis asuransi.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-2-permintaan',
    name: '2. Permintaan Ranap Dokter',
    code: 'RANAP_ADMEDIKA_PERMINTAAN',
    category: 'asuransi_admedika_brilife',
    description: 'Instruksi rawat inap dari dokter IGD/spesialis.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-3-kartu',
    name: '3. No. Kartu Asuransi',
    code: 'RANAP_ADMEDIKA_KARTU',
    category: 'asuransi_admedika_brilife',
    description: 'Nomor kartu fisik/e-card asuransi AdMedika / BRI Life / Prudential / Manulife / Inhealth dll.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-4-gl',
    name: '4. Surat Jaminan Awal (Guarantee Letter / GL)',
    code: 'RANAP_ADMEDIKA_GL',
    category: 'asuransi_admedika_brilife',
    description: 'Initial Guarantee Letter yang diterbitkan melalui portal EDC/telecenter TPA asuransi.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-5-form-asuransi',
    name: '5. Form Asuransi Rawat Inap',
    code: 'RANAP_ADMEDIKA_FORM_KLAIM',
    category: 'asuransi_admedika_brilife',
    description: 'Formulir klaim rawat inap asuransi swasta yang wajib diisi lengkap oleh DPJP.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-6-buku',
    name: '6. Buku Ranap',
    code: 'RANAP_ADMEDIKA_BUKU',
    category: 'asuransi_admedika_brilife',
    description: 'Buku registrasi rawat inap RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-7-gelang',
    name: '7. Gelang Pasien',
    code: 'RANAP_ADMEDIKA_GELANG',
    category: 'asuransi_admedika_brilife',
    description: 'Pemasangan gelang barcode identifikasi pasien rawat inap.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-8-persetujuan',
    name: '8. Persetujuan Ranap & General Consent',
    code: 'RANAP_ADMEDIKA_CONSENT',
    category: 'asuransi_admedika_brilife',
    description: 'Persetujuan rawat inap dan lembar General Consent.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-9-souvenir',
    name: '9. Souvenir',
    code: 'RANAP_ADMEDIKA_SOUVENIR',
    category: 'asuransi_admedika_brilife',
    description: 'Pemberian paket souvenir dan fasilitas welcome kit kamar RSUMB.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  },
  {
    id: 'ranap-admedika-10-pesan-kamar',
    name: '10. Pesan Kamar',
    code: 'RANAP_ADMEDIKA_PESAN_KAMAR',
    category: 'asuransi_admedika_brilife',
    description: 'Pemesanan dan konfirmasi kelas kamar sesuai batas limit plafon polis asuransi.',
    isMandatory: true,
    applicableServices: ['rawat_inap']
  }
];

const STORAGE_KEY_SLIPS = 'rsumb_pending_requirements_v2';

export const loadPendingRequirementSlips = (): SlipKekuranganBerkas[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLIPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Fallback migration from old key
    const oldRaw = localStorage.getItem('rsumb_pending_requirements_v1');
    if (oldRaw) {
      const parsedOld = JSON.parse(oldRaw);
      if (Array.isArray(parsedOld)) return parsedOld;
    }
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
  const hoursToAdd = penjamin === 'jasa_raharja' ? 48 : 72;
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
