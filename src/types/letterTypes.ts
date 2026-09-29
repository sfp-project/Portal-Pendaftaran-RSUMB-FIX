export type LetterCategory = 'medis' | 'penjaminan' | 'bpjstk' | 'admisi';

export type LetterType =
  // 1. Surat Medis
  | 'SKBN'
  | 'ADMEDIKA'
  | 'SEHAT'
  | 'DOKTER'
  // 2. Penjaminan & Kuasa
  | 'EDUKASI_OP2'
  | 'KUASA_JR'
  // 3. BPJS Ketenagakerjaan
  | 'BPJS_KK1'
  | 'BPJS_KK2'
  | 'BPJS_KK3'
  // 4. Admisi & Rawat Inap
  | 'TITIP_KELAS'
  | 'PESAN_KAMAR'
  | 'GAGAL_FINGERPRINT';

export interface DoctorSigner {
  id: string;
  nama: string;
  spesialisasi: string;
  sip: string;
  jabatan: string;
}

export interface PatientRecord {
  noRm: string;
  nik: string;
  nama: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  umur: number;
  pekerjaan: string;
  alamat: string;
  noHp: string;
  noBpjs?: string;
  golDarah?: 'A' | 'B' | 'AB' | 'O' | '-';
}

// 1. Parameter SKBN (Surat Keterangan Bebas Narkoba)
export interface SkbnParameters {
  amp: 'Negatif' | 'Positif'; // Amphetamine
  met: 'Negatif' | 'Positif'; // Methamphetamine
  coc: 'Negatif' | 'Positif'; // Cocaine
  thc: 'Negatif' | 'Positif'; // THC / Marihuana
  mop: 'Negatif' | 'Positif'; // Morphine
  bzo: 'Negatif' | 'Positif'; // Benzodiazepine
  metode: string;
  spesimen: string;
  catatanHasil?: string;
  kesimpulan: string;
}

// 2. Parameter AdMedika (Rawat Jalan / Rawat Gigi)
export interface AdmedikaParameters {
  noKartuAdmedika: string;
  namaPerusahaan: string;
  statusPasien?: 'Karyawan' | 'Istri / Suami' | 'Anak';
  jenisLayanan: 'Rawat Jalan' | 'Rawat Gigi';
  namaKlinikRs?: string;
  tanggalPengobatan?: string;
  namaDokter?: string;
  keluhan?: string;
  diagnosaUtama: string;
  diagnosaTambahan?: string;
  kodeIcd10?: string;
  terapi?: string;
  anjuran?: string;
  tindakanMedis: string;
  resepObat: string;
  totalBiaya: number;
  catatanKhusus?: string;
  dentalDiagnosa?: string;
  dentalTindakan?: string;
  dentalJenisTindakan?: string[];
  dentalGigiDiperiksa?: string[];
  suratIstirahatSakit?: 'Ya' | 'Tidak';
  lamaIstirahatHari?: number | string;
}

// 3. Parameter Surat Keterangan Sehat
export interface SehatParameters {
  tinggiBadan: number; // cm
  beratBadan: number; // kg
  tekananDarah: string; // e.g. "120/80 mmHg"
  nadi: string; // e.g. "80 x/menit"
  respirasi?: string; // e.g. "18 x/menit"
  suhu?: string; // e.g. "36.5 °C"
  golonganDarah: 'A' | 'B' | 'AB' | 'O' | '-';
  butaWarna: 'Tidak Buta Warna (Normal)' | 'Buta Warna Parsial' | 'Buta Warna Total';
  statusKesehatan: 'SEHAT Jasmani dan Rohani' | 'SEHAT dengan Catatan' | 'Perlu Pemeriksaan Lanjutan';
  catatanFisik?: string;
}

// 4. Parameter Surat Keterangan Sakit / Dokter
export interface DokterParameters {
  diagnosaMedis: string;
  lamaIstirahatHari: number;
  tglMulaiIstirahat: string;
  tglSelesaiIstirahat: string;
  perluIstirahat: boolean;
  anjuranMedis?: string;
}

// 5. Parameter Edukasi Operasi Kedua (Jasa Raharja & BPJS)
export interface EdukasiOp2Parameters {
  rencanaTindakan: string; // Misal: "Debridement & Rekonstruksi Pasca Trauma"
  tanggalRencanaOp: string;
  rsPerujukPertama: string;
  syaratJasaRaharjaMax20jt: boolean; // Plafon Max Rp 20.000.000
  syaratRujukanFaskes1: boolean; // Rujukan FKTP / Faskes 1
  syaratLaporanPolisi: boolean; // Laporan Polisi (LP)
  syaratRincianBiayaRS1: boolean; // Kwitansi / Billing RS Pertama
  namaPicJasaRaharja: string; // Kontak PIC
  kontakPicJasaRaharja: string;
  namaKeluargaPasien: string;
  hubunganKeluarga: string;
  namaPetugasAdmisi: string;
}

// 6. Parameter Kuasa Jasa Raharja
export interface KuasaJasaRaharjaParameters {
  totalBiayaPerawatan: number;
  terbilang: string;
  tanggalMulaiRawat: string;
  tanggalSelesaiRawat: string;
  namaPemberiKuasa: string;
  nikPemberiKuasa: string;
  hubunganPemberiKuasa: string; // Pasien Sendiri / Istri / Suami / Orang Tua / Anak
  alamatPemberiKuasa: string;
  noHpPemberiKuasa: string;
  namaPenerimaKuasa: string; // Pejabat RSUMB
  jabatanPenerimaKuasa: string;
  perluMaterai: boolean; // true (Materai Rp 10.000)
}

// 7. Parameter Titip Kelas Rawat Inap
export interface TitipKelasParameters {
  kelasKamarDipilih: 'VVIP' | 'VIP' | 'Kelas 1' | 'Kelas 2' | 'Kelas 3' | 'HCU' | 'ICU' | 'NICU' | 'One Day Care';
  hakKelasBpjs: 'Kelas 1' | 'Kelas 2' | 'Kelas 3' | 'Non-BPJS / Umum';
  tarifPerHari: number;
  fasilitasKamar: string;
  alasanTitipKelas: string;
  namaPenjamin: string;
  hubunganPenjamin: string;
  alamatPenjamin: string;
  noHpPenjamin: string;
  setujuSelisihBiaya: boolean;
}

// 8. Parameter Pemesanan Kamar Rawat Inap (Sesuai Form Bukti Pemesanan Kamar RSUMB)
export interface PesanKamarParameters {
  namaPemesan: string;
  hubunganPemesan: string;
  namaPasien?: string;
  umurPasien?: number | string;
  alamatPasien?: string;
  tanggalRencanaMasuk: string;
  jamRencanaMasuk: string;
  ruanganDipesan?: string;
  kategoriRuangan?: 'Ruang Perawatan' | 'Ruang Bersalin';
  kelasKamarDipilih: 'VVIP' | 'VIP' | 'Kelas 1' | 'Kelas 2' | 'Kelas 3' | 'HCU' | 'ICU' | 'NICU' | 'One Day Care' | 'Kelas I' | 'Kelas II' | 'Kelas III';
  tarifPerHari: number;
  visiteDokterUmum?: number;
  visiteDokterSpesialis?: number;
  fasilitasKamar: string;
  estimasiLamaInapHari: number;
  diagnosaAwal: string;
  dokterPengirim: string;
  noHpPemesan: string;
  catatanPermintaanKhusus?: string;
  namaPetugas?: string;
}

// 9. Parameter Surat Pernyataan Gagal Fingerprint (Sesuai Form RSU Muhammadiyah Babat)
export interface GagalFingerprintParameters {
  namaPenanggungJawab?: string;
  genderPenanggungJawab?: 'Lk' | 'Pr';
  tglLahirPenanggungJawab?: string;
  alamatPenanggungJawab?: string;
  noTelpPenanggungJawab?: string;
  hubunganPenanggungJawab?: 'Ayah' | 'Ibu' | 'Suami' | 'Istri' | 'Anak' | 'Lainnya';
  hubunganLainnya?: string;
  noRekamMedis?: string;
  nomorKartuBpjs?: string;
  namaPasien?: string;
  genderPasien?: 'Lk' | 'Pr';
  tglLahirPasien?: string;
  layananTipe?: 'IGD' | 'Ruang' | 'Klinik';
  namaLayanan?: string;
  alasanKesulitan?: string;
  alasanGagal: string;
  alasanKustom?: string;
  penanggungJawabKlaim: 'Petugas Admisi' | 'Petugas IT BPJS RSUMB' | 'Verifikator BPJS';
  namaPetugas: string;
  nomorSep?: string;
  tujuanPoli: string;
  namaPenjamin: string;
  hubunganPenjamin: string;
  pernyataanKebenaran: boolean;
  namaPicKlaim?: string;
}

// 10. Parameter BPJS Ketenagakerjaan - KK1 (Formulir 3 KK 1 Laporan Kasus Kecelakaan Kerja Tahap I)
export interface BpjsKk1Parameters {
  segmen?: 'Penerima Upah (PU)' | 'Bukan Penerima Upah (BPU)' | 'Jasa Konstruksi (JAKON)' | 'Pekerja Migran Indonesia (PMI)';
  namaPerusahaan: string;
  nppBpjsTk: string;
  alamatPerusahaan?: string;
  telpPerusahaan?: string;
  kontakPersonil?: string;
  emailPerusahaan?: string;
  noPeserta?: string;
  nikPeserta?: string;
  jabatanPeserta?: string;
  upahPeserta?: number;
  satuanUpah?: 'per hari' | 'per bulan' | 'borongan';
  tempatKejadianTipe?: 'dalam lokasi kerja' | 'luar lokasi kerja' | 'lalu-lintas';
  tempatKecelakaan: string;
  alamatKejadian?: string;
  tanggalKecelakaan: string;
  jamKecelakaan: string;
  waktuKejadianPmi?: 'sebelum penempatan' | 'sesudah penempatan' | 'selama penempatan';
  negaraPmi?: string;
  kronologiSingkat: string;
  akibatDiderita?: 'Cedera/Luka' | 'Meninggal Dunia';
  bagianTubuhCidera: string;
  jenisFaskesPertama?: 'Jaringan PLKK' | 'Rumah Sakit/Klinik/Puskesmas tidak kerjasama' | 'Lain lain';
  faskesPertama: string;
  transportasiPertama?: 'Laut' | 'Udara' | 'Darat/sungai/danau';
  detailTransportasi?: string;
  kotaPernyataan?: string;
  tanggalPernyataan?: string;
  namaPenandatangan?: string;
  jabatanPenandatangan?: string;
}

// 11. Parameter BPJS Ketenagakerjaan - KK2 (Formulir 3a KK 2 Laporan Kasus Kecelakaan Kerja Tahap II)
export interface BpjsKk2Parameters {
  segmen?: 'Penerima Upah (PU)' | 'Bukan Penerima Upah (BPU)' | 'Jasa Konstruksi (JAKON)' | 'Pekerja Migran Indonesia (PMI)';
  namaPerusahaan: string;
  nppBpjsTk: string;
  alamatPerusahaan?: string;
  telpPerusahaan?: string;
  kontakPersonil?: string;
  noPeserta?: string;
  nikPeserta?: string;
  jabatanPeserta?: string;
  tanggalKecelakaan?: string;
  waktuKejadianPmi?: string;
  negaraPmi?: string;
  tanggalPemeriksaan: string;
  kondisiTerakhir?: 'Sembuh' | 'Cacat sebagian fungsi' | 'Cacat sebagian anatomis' | 'Cacat total tetap untuk selamanya' | 'Meninggal dunia' | 'Masih dalam pengobatan';
  lamaPerawatanHari: number;
  biayaPerawatanPemberiKerja?: number;
  biayaPerawatanPeserta?: number;
  biayaPerawatanAhliWaris?: number;
  santunanCacat?: number;
  prothesaOrthesa?: number;
  gigiTiruan?: number;
  biayaTransportasi?: number;
  stmbNominal?: number;
  namaBank?: string;
  noRekening?: string;
  namaRekening?: string;
  namaAhliWaris?: string;
  nikAhliWaris?: string;
  hubunganAhliWaris?: string;
  telpAhliWaris?: string;
  bankAhliWaris?: string;
  rekeningAhliWaris?: string;
  waliNama?: string;
  waliNik?: string;
  waliTelp?: string;
  waliEmail?: string;
  waliHubungan?: string;
  memilikiAnakKriteria?: 'ada' | 'tidak ada';
  keteranganLainnya?: string;
  kotaPernyataan?: string;
  tanggalPernyataan?: string;
  namaPenandatangan?: string;
  diagnosaKecelakaanKerja: string;
  tindakanMedisDilakukan: string;
  kondisiFisikSaatIni: string;
  statusKemampuanBekerja: 'Sementara Tidak Mampu Bekerja (STMB)' | 'Mampu Bekerja Ringan' | 'Sembuh Sempurna';
  tanggalMulaiStmb: string;
  tanggalSelesaiStmb: string;
}

// 12. Parameter BPJS Ketenagakerjaan - KK3 (Formulir 3b KK 3 Surat Keterangan Dokter Kasus Kecelakaan Kerja)
export interface BpjsKk3Parameters {
  tipeDokter?: 'Dokter pemeriksa' | 'Dokter penasehat';
  namaDokter?: string;
  telpDokter?: string;
  namaFaskes?: string;
  namaPerusahaan: string;
  nppBpjsTk: string;
  noPeserta?: string;
  nikPeserta?: string;
  tanggalKecelakaan?: string;
  tanggalPemeriksaan?: string;
  anamnesa?: string;
  pemeriksaanFisik?: string;
  tindakanMedis?: string;
  diagnosis?: string;
  komorbiditas?: 'tidak ada' | 'ada';
  sebutkanKomorbiditas?: string;
  keadaanAkhirPasien:
    | 'Sembuh tanpa cacat'
    | 'Cacat anatomis sebagian'
    | 'Cacat fungsi sebagian'
    | 'Cacat total tetap'
    | 'Meninggal dunia';
  detailCacatAnatomis?: string;
  detailCacatFungsi?: string;
  persentaseCacat?: number;
  terbilangCacat?: string;
  memerlukanProthesa?: string;
  memerlukanOrthesa?: string;
  tanggalMeninggal?: string;
  jamMeninggal?: string;
  kemampuanBekerja?: 'Biasa' | 'Ringan' | 'Tidak dapat bekerja';
  kondisiKemampuanKerja?: string;
  rawatDari?: string;
  rawatSampai?: string;
  istirahatDari?: string;
  istirahatSampai?: string;
  keteranganLainnya?: string;
  tanggalPenyelesaianKasus: string;
  tanggalKembaliBekerja: string;
  evaluasiMedisAkhir: string;
  kotaPernyataan?: string;
  tanggalPernyataan?: string;
}

// Master Model Dokumen Form & Surat
export interface MedicalLetterItem {
  id: string;
  nomorSurat: string;
  kategori: LetterCategory;
  jenisSurat: LetterType;
  tanggalSurat: string; // YYYY-MM-DD

  // Data Pasien (Auto-Fill via No. RM / NIK)
  noRm: string;
  namaPasien: string;
  nik: string; // 16 digit
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  umur: number;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  pekerjaan: string;
  alamat: string;
  noHp?: string;
  noBpjs?: string;

  // Keperluan Umum
  keperluan: string;

  // Dokter Penandatangan / Petugas RSUMB
  dokterNama: string;
  dokterSip: string;
  dokterJabatan: string;

  // Parameter Khusus per Jenis Dokumen
  skbnParams?: SkbnParameters;
  admedikaParams?: AdmedikaParameters;
  sehatParams?: SehatParameters;
  dokterParams?: DokterParameters;
  edukasiOp2Params?: EdukasiOp2Parameters;
  kuasaJrParams?: KuasaJasaRaharjaParameters;
  titipKelasParams?: TitipKelasParameters;
  pesanKamarParams?: PesanKamarParameters;
  gagalFingerprintParams?: GagalFingerprintParameters;
  bpjsKk1Params?: BpjsKk1Parameters;
  bpjsKk2Params?: BpjsKk2Parameters;
  bpjsKk3Params?: BpjsKk3Parameters;

  createdAt: string;
  updatedAt?: string;
}
