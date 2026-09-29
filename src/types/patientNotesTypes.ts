// Tipe Data untuk Modul Catatan Khusus Pasien

export type PatientNotesTab = 'kll' | 'bpjs_kendala' | 'asuransi_swasta' | 'umum_beresiko' | 'handover_shift';

// TAB 5: Handover Shift Admisi
export type ShiftAdmisi = 'Pagi' | 'Siang' | 'Malam';
export type StatusHandover = 'Pending' | 'Handled';
export type PrioritasHandover = 'Tinggi' | 'Sedang' | 'Rendah';

export interface PatientShiftHandoverRecord {
  id: string;
  timestamp: string; // ISO string e.g. '2026-09-18T14:30:00'
  namaPasien: string;
  noRm: string;
  masalah: string; // Specific Issue/Notes
  petugasAsal: string; // Originating Staff
  shift: ShiftAdmisi; // Assigned Shift
  status: StatusHandover; // Pending | Handled
  prioritas?: PrioritasHandover;
  kategori?: string;
  handledBy?: string;
  handledAt?: string;
  catatanPenyelesaian?: string;
  createdAt: string;
  updatedAt?: string;
}

// TAB 1: Pasien Kecelakaan (KLL)
export type PenjaminKll = 'Jasa Raharja' | 'BPJS Ketenagakerjaan' | 'BPJS Kesehatan' | 'Umum';

export interface PatientKllRecord {
  id: string;
  namaPasien: string;
  noRm: string;
  tanggalMrs: string; // YYYY-MM-DD
  tanggalKll: string; // YYYY-MM-DD
  kronologi: string;
  penjamin: PenjaminKll;
  statusLp: string; // e.g. 'BELUM', 'LP/A/123/IX/2026/Lantas', etc.
  lpFileName?: string;
  lpFileUrl?: string; // base64 or object URL
  lpFileType?: 'pdf' | 'image';
  isInsidenActive: boolean; // Centang Insiden
  catatan: string; // e.g. 'JR (KONFIRMASI PAK...)'
  createdAt: string;
  updatedAt?: string;
}

// TAB 2: BPJS Kendala
export type JenisKendalaBpjs =
  | 'Kartu Non aktif'
  | 'Denda Pelayanan'
  | 'SEP Blocked'
  | 'Rujukan Faskes 1 Expiry'
  | 'Beda Data/NIK'
  | 'Bayi 3 bulan lebih update nama (surat desa)'
  | 'BPJS Maintenance';

export type StatusBpjsKendala = 'Pending' | 'Resolved (cetak SEP)' | 'Resolved';

export interface PatientBpjsKendalaRecord {
  id: string;
  namaPasien: string;
  noRm: string;
  tanggalMrsKontrol?: string; // YYYY-MM-DD
  noKartuBpjs: string;
  jenisKendala: JenisKendalaBpjs | string;
  detailMasalah: string;
  catatanSolusi: string;
  status: StatusBpjsKendala;
  createdAt: string;
  updatedAt?: string;
}

// TAB 3: Asuransi Swasta
export type StatusKlaimAsuransi =
  | 'Menunggu Guarantee Letter'
  | 'Excess Fee'
  | 'Konfirmasi Off-Hours'
  | 'Form Klaim Kurang'
  | 'Disetujui / Selesai';

export interface PatientAsuransiSwastaRecord {
  id: string;
  namaPasien: string;
  noRm: string;
  namaAsuransi: string; // e.g. Prudential, Allianz, Mandiri Inhealth, Admedika, AIA
  statusKlaim: StatusKlaimAsuransi | string;
  catatanHandover: string;
  createdAt: string;
  updatedAt?: string;
}

// TAB 4: UMUM Beresiko
export type PotensiMasalahUmum =
  | 'Biaya Operasi/Ranap Tinggi'
  | 'Pasien/Keluarga Vokal'
  | 'Risiko APS/Kabur'
  | 'Komplain Pelayanan'
  | 'Readmisi'
  | 'Tidak Ada Keluarga yang Faham'
  | 'Tidak Ada Orang Tua/Wali'
  | 'Non spesialistik'
  | 'Tidak membawa identitas / kurang lengkap'
  | 'Belum waktu kontrol';

export interface PatientUmumBeresikoRecord {
  id: string;
  namaPasien: string;
  noRm: string;
  tanggalMrsKontrol?: string; // YYYY-MM-DD
  kronologiMasalah: string;
  potensiMasalah: string[]; // multi-select of PotensiMasalahUmum
  tindakLanjut: string;
  createdAt: string;
  updatedAt?: string;
}
