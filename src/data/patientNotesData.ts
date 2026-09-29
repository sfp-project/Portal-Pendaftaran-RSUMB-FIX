import {
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord,
  PatientShiftHandoverRecord
} from '../types/patientNotesTypes';

// Initial Data untuk TAB 1: Pasien Kecelakaan (KLL)
export const initialKllRecords: PatientKllRecord[] = [
  {
    id: 'kll-001',
    namaPasien: 'SUGIONO bin KARSIDI',
    noRm: '14-89-21',
    tanggalMrs: '2026-09-14',
    tanggalKll: '2026-09-14',
    kronologi: 'KLL Sepeda motor vs truk di Jl. Raya Babat - Bojonegoro (depan Pasar Babat). Mengalami open fracture femur dextra dan vulnus laceratum regio frontal.',
    penjamin: 'Jasa Raharja',
    statusLp: 'LP/A/092/IX/2026/Satlantas',
    lpFileName: 'Surat_LP_Lantas_Sugiono_148921.pdf',
    isInsidenActive: true,
    catatan: 'JR (KONFIRMASI PAK BAMBANG JR LAMONGAN - PLAFON AWAL 20JT SUDAH AKTIF)',
    createdAt: '2026-09-14T08:30:00Z'
  },
  {
    id: 'kll-002',
    namaPasien: 'HENDRA PRASETYO',
    noRm: '23-11-04',
    tanggalMrs: '2026-09-15',
    tanggalKll: '2026-09-15',
    kronologi: 'Kecelakaan tunggal terjatuh saat berangkat dinas shift pagi dari rumah menuju tempat kerja di area pergudangan Babat.',
    penjamin: 'BPJS Ketenagakerjaan',
    statusLp: 'BELUM',
    isInsidenActive: true,
    catatan: 'Kecelakaan kerja. Keluarga sedang mengurus Form KK2 ke kantor BPJS TK Lamongan.',
    createdAt: '2026-09-15T09:15:00Z'
  },
  {
    id: 'kll-003',
    namaPasien: 'SITI NURHALIZA',
    noRm: '09-44-52',
    tanggalMrs: '2026-09-12',
    tanggalKll: '2026-09-12',
    kronologi: 'KLL ganda motor vs motor di perempatan Moropelang. Luka lecet dan contusio jaringan lunak genu sinistra.',
    penjamin: 'BPJS Kesehatan',
    statusLp: 'LP/B/088/IX/2026/Babat',
    lpFileName: 'LP_Kepolisian_SitiNurhaliza.jpg',
    isInsidenActive: false,
    catatan: 'Kasus KLL ganda telah diinput di V-Claim KLL dengan nomor LP resmi.',
    createdAt: '2026-09-12T14:20:00Z'
  },
  {
    id: 'kll-004',
    namaPasien: 'ACHMAD FAUZI',
    noRm: '31-08-19',
    tanggalMrs: '2026-09-16',
    tanggalKll: '2026-09-16',
    kronologi: 'Tabrakan dengan becak di jalan poros Pucuk - Babat subuh tadi. Luka robek dagu dan kecurigaan cedera kepala ringan.',
    penjamin: 'Umum',
    statusLp: 'BELUM',
    isInsidenActive: true,
    catatan: 'Keluarga menolak buat LP karena kesepakatan damai. Pasien sepakat masuk pasien UMUM.',
    createdAt: '2026-09-16T06:45:00Z'
  }
];

// Initial Data untuk TAB 2: BPJS Kendala
export const initialBpjsKendalaRecords: PatientBpjsKendalaRecord[] = [
  {
    id: 'bpjs-aug-01',
    namaPasien: 'SUWARNO HADI',
    noRm: '10-62-95',
    tanggalMrsKontrol: '2026-08-26',
    noKartuBpjs: '0001928475610',
    jenisKendala: 'Rujukan FKTP Kadaluarsa',
    detailMasalah: 'Masa rujukan FKTP Puskesmas Baureno telah habis lebih dari 90 hari saat kontrol poli bedah.',
    catatanSolusi: 'Dibuatkan surat kontrol internal untuk bridging SEP darurat, pasien diimbau memperbarui rujukan di faskes 1.',
    status: 'Resolved (cetak SEP)',
    createdAt: '2026-08-26T08:45:00Z'
  },
  {
    id: 'bpjs-001',
    namaPasien: 'SUNARTO',
    noRm: '11-78-30',
    tanggalMrsKontrol: '2026-09-15',
    noKartuBpjs: '0001892301982',
    jenisKendala: 'Kartu Non aktif',
    detailMasalah: 'Kepesertaan BPJS Mandiri tertunggak 3 bulan. MRS di IGD rencana rawat inap di Ruang Multazam.',
    catatanSolusi: 'Keluarga telah diedukasi untuk aktivasi via Mobile JKN dan bayar tagihan. Diberi tenggat waktu 3x24 jam hari kerja.',
    status: 'Pending',
    createdAt: '2026-09-15T11:00:00Z'
  },
  {
    id: 'bpjs-002',
    namaPasien: 'NURUL HIDAYAH',
    noRm: '08-65-12',
    tanggalMrsKontrol: '2026-09-13',
    noKartuBpjs: '0002109845321',
    jenisKendala: 'Denda Pelayanan',
    detailMasalah: 'Kartu baru aktif setelah menunggak. Muncul denda pelayanan rawat inap sebesar Rp 1.250.000 saat bridging SEP.',
    catatanSolusi: 'Keluarga sudah menerima penjelasan form denda dan melakukan pembayaran denda di bank mitra/teller. SEP Rawat Inap terbit.',
    status: 'Resolved (cetak SEP)',
    createdAt: '2026-09-13T10:30:00Z'
  },
  {
    id: 'bpjs-003',
    namaPasien: 'BAMBANG HERMANTO',
    noRm: '20-43-88',
    tanggalMrsKontrol: '2026-09-16',
    noKartuBpjs: '0001452390112',
    jenisKendala: 'SEP Blocked',
    detailMasalah: 'SEP Rawat Jalan terblokir karena terdeteksi masih berstatus open episode di RSUD dr. Soegiri Lamongan.',
    catatanSolusi: 'Admisi sudah kontak PIC IT RSUD Soegiri untuk closing episode perawatan terdahulu. Menunggu konfirmasi unblock.',
    status: 'Pending',
    createdAt: '2026-09-16T08:15:00Z'
  },
  {
    id: 'bpjs-004',
    namaPasien: 'TRI WAHYUNI',
    noRm: '15-90-41',
    tanggalMrsKontrol: '2026-09-14',
    noKartuBpjs: '0003019284712',
    jenisKendala: 'Rujukan Faskes 1 Expiry',
    detailMasalah: 'Masa berlaku rujukan dari Puskesmas Babat habis per 14 September 2026.',
    catatanSolusi: 'Pasien kontrol ke Poli Penyakit Dalam. Disarankan minta perpanjangan rujukan online via FKTP untuk kunjungan berikutnya.',
    status: 'Resolved (cetak SEP)',
    createdAt: '2026-09-14T09:00:00Z'
  },
  {
    id: 'bpjs-005',
    namaPasien: 'MUHAMMAD RIZKY',
    noRm: '27-32-15',
    tanggalMrsKontrol: '2026-09-16',
    noKartuBpjs: '0002987163520',
    jenisKendala: 'Beda Data/NIK',
    detailMasalah: 'Nama di KTP Muhammad Rizki (pakai i), sedangkan di data BPJS Muhammad Rizky (pakai y). NIK tidak sinkron di Dukcapil.',
    catatanSolusi: 'Dibuatkan surat keterangan perbedaan identitas bermaterai untuk klaim darurat dan koordinasi dengan BPJS Center.',
    status: 'Pending',
    createdAt: '2026-09-16T07:20:00Z'
  },
  {
    id: 'bpjs-006',
    namaPasien: 'BY. NY. SITI FATIMAH',
    noRm: '32-05-18',
    tanggalMrsKontrol: '2026-09-16',
    noKartuBpjs: '0004128930129',
    jenisKendala: 'Bayi 3 bulan lebih update nama (surat desa)',
    detailMasalah: 'Bayi berusia 3 bulan lebih masih bernama Bayi Ny. Siti Fatimah di kepesertaan. Perlu pembaharuan nama resmi dan surat keterangan desa.',
    catatanSolusi: 'Keluarga telah membawa surat pengantar desa dan KK terbaru. Petugas berkoordinasi dengan BPJS Center untuk validasi nama.',
    status: 'Pending',
    createdAt: '2026-09-16T09:30:00Z'
  }
];

// Initial Data untuk TAB 3: Asuransi Swasta
export const initialAsuransiSwastaRecords: PatientAsuransiSwastaRecord[] = [
  {
    id: 'asuransi-001',
    namaPasien: 'DEWI ANGGRAENI',
    noRm: '18-54-32',
    namaAsuransi: 'Prudential (PRUPrime Healthcare)',
    statusKlaim: 'Menunggu Guarantee Letter',
    catatanHandover: 'Pasien rawat inap rencana tindakan bedah laparoskopi. Dokumen medis awal sudah dikirim via email/portal Admedika. Follow up GL final jam 14.00.',
    createdAt: '2026-09-15T13:40:00Z'
  },
  {
    id: 'asuransi-002',
    namaPasien: 'ANDI KURNIAWAN',
    noRm: '25-77-90',
    namaAsuransi: 'Mandiri Inhealth (Gold)',
    statusKlaim: 'Excess Fee',
    catatanHandover: 'Plafon kamar Rp 750.000, pasien menempati VIP (Rp 950.000). Ada selisih Rp 200.000/hari yang sudah disetujui ditanggung pribadi.',
    createdAt: '2026-09-14T16:00:00Z'
  },
  {
    id: 'asuransi-003',
    namaPasien: 'ARIEF BUDIMAN',
    noRm: '12-39-01',
    namaAsuransi: 'Allianz Life Indonesia',
    statusKlaim: 'Konfirmasi Off-Hours',
    catatanHandover: 'Masuk malam hari pukul 22.30 WIB. Hotline klaim asuransi tutup. Menggunakan jaminan deposit sementara, hubungi agen asuransi pagi ini.',
    createdAt: '2026-09-16T02:00:00Z'
  },
  {
    id: 'asuransi-004',
    namaPasien: 'RATNA KUSUMAWATI',
    noRm: '09-88-23',
    namaAsuransi: 'AIA Financial',
    statusKlaim: 'Form Klaim Kurang',
    catatanHandover: 'Form discharge summary belum ditandatangani dr. Spesialis Bedah. Berkas pending di meja perawat lantai 2.',
    createdAt: '2026-09-15T18:20:00Z'
  }
];

// Initial Data untuk TAB 4: UMUM Beresiko
export const initialUmumBeresikoRecords: PatientUmumBeresikoRecord[] = [
  {
    id: 'umum-001',
    namaPasien: 'KASANAH binti WARTO',
    noRm: '07-61-44',
    tanggalMrsKontrol: '2026-09-14',
    kronologiMasalah: 'Pasien lansia 74 tahun dengan hematemesis melena + riwayat sirosis hepatis. Masuk kamar rawat inap tanpa penjamin (pasien UMUM murni).',
    potensiMasalah: ['Biaya Operasi/Ranap Tinggi', 'Risiko APS/Kabur', 'Tidak Ada Keluarga yang Faham'],
    tindakLanjut: 'Edukasi estimasi billing harian kepada anak kedua. Dibuatkan surat pernyataan kesanggupan biaya dan deposit awal Rp 2.500.000.',
    createdAt: '2026-09-14T21:10:00Z'
  },
  {
    id: 'umum-002',
    namaPasien: 'DARMANTO',
    noRm: '21-83-56',
    tanggalMrsKontrol: '2026-09-15',
    kronologiMasalah: 'Rencana operasi elektif Herniotomi. Keluarga pasien sangat kritis mempertanyakan rincian biaya alkes mesh dan honor dokter operator.',
    potensiMasalah: ['Pasien/Keluarga Vokal', 'Komplain Pelayanan'],
    tindakLanjut: 'Dikoordinasikan langsung dengan Ka. Instalasi Bedah Sentral & Customer Care. Diserahkan lembar rincian paket tindakan sebelum operasi.',
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'umum-003',
    namaPasien: 'ANAK M. ILHAM (BAYI)',
    noRm: '30-14-99',
    tanggalMrsKontrol: '2026-09-16',
    kronologiMasalah: 'Bayi lahir di bidan luar dengan asfiksia berat dan BBLR 1.800 gram dirujuk ke Perinatologi RSUMB. Orang tua muda belum mengurus BPJS bayi.',
    potensiMasalah: ['Biaya Operasi/Ranap Tinggi', 'Tidak Ada Orang Tua/Wali', 'Readmisi'],
    tindakLanjut: 'Diarahkan segera mengurus BPJS Bayi Baru Lahir ke Mal Pelayanan Publik / BPJS Lamongan dengan surat keterangan lahir dari RSUMB.',
    createdAt: '2026-09-16T05:30:00Z'
  },
  {
    id: 'umum-004',
    namaPasien: 'SUBANDI',
    noRm: '19-20-77',
    tanggalMrsKontrol: '2026-09-16',
    kronologiMasalah: 'Pasien berobat ke Poli Bedah namun tidak membawa KTP maupun kartu identitas resmi, hanya membawa kartu periksa lama yang pudar.',
    potensiMasalah: ['Tidak membawa identitas / kurang lengkap', 'Non spesialistik'],
    tindakLanjut: 'Diverifikasi via data NIK rekam medis elektronik. Pasien diedukasi untuk membawa e-KTP fisik pada kunjungan berikutnya.',
    createdAt: '2026-09-16T08:40:00Z'
  }
];

// Initial Data untuk TAB 5: Handover Shift Admisi
export const initialShiftHandoverRecords: PatientShiftHandoverRecord[] = [
  {
    id: 'hnd-001',
    timestamp: '2026-09-18T13:45:00',
    namaPasien: 'Bayi Ny. Fatimah Azzahra',
    noRm: '38-92-01',
    masalah: 'Bayi baru lahir 2 hari di Ruang Shofa. NIK bayi belum masuk KK, SEP Rawat Inap BPJS belum terbit (masih memakai nomor kartu Ibu). Mohon shift siang koordinasi dengan ayah pasien untuk konfirmasi surat keterangan lahir RS & pembuatan SEP.',
    petugasAsal: 'Siti Aminah (Pagi)',
    shift: 'Pagi',
    status: 'Pending',
    prioritas: 'Tinggi',
    kategori: 'Pending SEP BPJS',
    createdAt: '2026-09-18T13:45:00'
  },
  {
    id: 'hnd-002',
    timestamp: '2026-09-18T14:15:00',
    namaPasien: 'SUGIONO bin KARSIDI',
    noRm: '14-89-21',
    masalah: 'Pasien KLL fraktur femur dextra di ICU/Arafah. Berkas LP Satlantas Polres Lamongan sudah diserahkan keluarga, mohon shift siang/malam verifikasi integrasi plafon Jasa Raharja di portal Insiden dan cetak SEP BPJS pendamping.',
    petugasAsal: 'Nurul Hidayati (Pagi)',
    shift: 'Pagi',
    status: 'Pending',
    prioritas: 'Tinggi',
    kategori: 'Jasa Raharja / LP',
    createdAt: '2026-09-18T14:15:00'
  },
  {
    id: 'hnd-003',
    timestamp: '2026-09-18T16:20:00',
    namaPasien: 'Ananda Kevin Al-Ghifari',
    noRm: '41-10-88',
    masalah: 'Pasien anak rencana operasi elektif hernia besok pagi. Kartu BPJS Mandiri status non-aktif karena telat premi bulan ini. Keluarga sedang diarahkan bayar via m-banking. Mohon shift malam bantu cek keaktifan di V-Claim dan cetak SPRI Rawat Inap.',
    petugasAsal: 'Rizal Fahmi (Siang)',
    shift: 'Siang',
    status: 'Pending',
    prioritas: 'Sedang',
    kategori: 'Pending SEP BPJS',
    createdAt: '2026-09-18T16:20:00'
  },
  {
    id: 'hnd-004',
    timestamp: '2026-09-18T17:50:00',
    namaPasien: 'Ny. Hj. Mariyam',
    noRm: '05-33-72',
    masalah: 'Pasien umum dirawat di Kelas 1 (Ruang Marwah 204), keluarga meminta naik kelas ke VVIP Mina. Form persetujuan selisih tarif kamar & estimasi tindakan sudah ditandatangani anak pertama. Mohon shift malam konfirmasi ketersediaan bed ke perawat Mina.',
    petugasAsal: 'Rizal Fahmi (Siang)',
    shift: 'Siang',
    status: 'Pending',
    prioritas: 'Sedang',
    kategori: 'Naik Kelas / Tarif',
    createdAt: '2026-09-18T17:50:00'
  },
  {
    id: 'hnd-005',
    timestamp: '2026-09-18T06:40:00',
    namaPasien: 'H. SUPARMAN',
    noRm: '22-04-18',
    masalah: 'Pasien rujukan Poli Penyakit Dalam dengan Asuransi Mandiri Inhealth. Guarantee Letter (GL) awal tertahan karena sistem asuransi maintenance tadi malam. Sudah dihubungi ke PIC Inhealth dan GL resmi telah terbit.',
    petugasAsal: 'Bambang Irawan (Malam)',
    shift: 'Malam',
    status: 'Handled',
    prioritas: 'Sedang',
    kategori: 'Asuransi Swasta GL',
    handledBy: 'Siti Aminah (Shift Pagi)',
    handledAt: '2026-09-18T07:30:00',
    catatanPenyelesaian: 'GL Mandiri Inhealth sudah terbit dan diserahkan ke berkas rawat inap Mina.',
    createdAt: '2026-09-18T06:40:00'
  },
  {
    id: 'hnd-006',
    timestamp: '2026-09-17T22:15:00',
    namaPasien: 'HENDRA PRASETYO',
    noRm: '23-11-04',
    masalah: 'Kecelakaan kerja BPJS Ketenagakerjaan. Form KK2 awal sudah difotokopi dari HRD perusahaan, keluarga diminta membawa surat keterangan asli besok pagi.',
    petugasAsal: 'Bambang Irawan (Malam)',
    shift: 'Malam',
    status: 'Handled',
    prioritas: 'Rendah',
    kategori: 'BPJS Ketenagakerjaan',
    handledBy: 'Nurul Hidayati (Shift Pagi)',
    handledAt: '2026-09-18T08:10:00',
    catatanPenyelesaian: 'Form KK2 asli telah diterima dan diverifikasi di BPJS Ketenagakerjaan.',
    createdAt: '2026-09-17T22:15:00'
  }
];

// Local Storage Key Constants
const STORAGE_KEY_KLL = 'rsumb_patient_notes_kll_v1';
const STORAGE_KEY_BPJS = 'rsumb_patient_notes_bpjs_v1';
const STORAGE_KEY_ASURANSI = 'rsumb_patient_notes_asuransi_v1';
const STORAGE_KEY_UMUM = 'rsumb_patient_notes_umum_v1';
const STORAGE_KEY_HANDOVER = 'rsumb_patient_notes_handover_v1';

// Load & Save Helpers with Robust Try/Catch
export function loadKllRecords(): PatientKllRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KLL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load KLL records:', e);
  }
  return initialKllRecords;
}

export function saveKllRecords(records: PatientKllRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_KLL, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save KLL records:', e);
  }
}

export function loadBpjsKendalaRecords(): PatientBpjsKendalaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BPJS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load BPJS Kendala records:', e);
  }
  return initialBpjsKendalaRecords;
}

export function saveBpjsKendalaRecords(records: PatientBpjsKendalaRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BPJS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save BPJS Kendala records:', e);
  }
}

export function loadAsuransiSwastaRecords(): PatientAsuransiSwastaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASURANSI);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load Asuransi Swasta records:', e);
  }
  return initialAsuransiSwastaRecords;
}

export function saveAsuransiSwastaRecords(records: PatientAsuransiSwastaRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASURANSI, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save Asuransi Swasta records:', e);
  }
}

export function loadUmumBeresikoRecords(): PatientUmumBeresikoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UMUM);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load UMUM Beresiko records:', e);
  }
  return initialUmumBeresikoRecords;
}

export function saveUmumBeresikoRecords(records: PatientUmumBeresikoRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_UMUM, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save UMUM Beresiko records:', e);
  }
}

export function loadShiftHandoverRecords(): PatientShiftHandoverRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HANDOVER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load Shift Handover records:', e);
  }
  return initialShiftHandoverRecords;
}

export function saveShiftHandoverRecords(records: PatientShiftHandoverRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HANDOVER, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save Shift Handover records:', e);
  }
}
