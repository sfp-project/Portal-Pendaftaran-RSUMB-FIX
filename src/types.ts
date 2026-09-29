export interface DoctorSchedule {
  id: string;
  no: number;
  poli: string; // e.g. "Saraf", "Dalam", "Anak", "Bedah", "Obgyn", etc.
  dpjp: string; // e.g. "dr. I'anatul Ulya, Sp.N"
  hari: string; // e.g. 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', "Jum'at", 'Sabtu', 'Ahad'
  jadwal: string; // e.g. "07.30 - 12.00", "14.00 - 16.00/Selesai"
  jamHfis?: string; // e.g. "07.00-14.00"
  jam_praktik?: string;
  jamMulai?: string;
  jamSelesai?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  jam_hfis?: string;
  kuotaTerisi: number; // e.g. 60
  kuotaTotal: number; // e.g. 70
  kuota_maksimal?: number;
  kuota_bpjs?: number;
  kuota_total?: number;
  kuotaMaksimal?: number;
  kuotaBpjs?: number;
  rerataPasien: number | null; // e.g. 60
  ruangan?: string;
  status?: 'Tersedia' | 'Penuh' | 'Hampir Penuh' | 'Libur';
  catatanKhusus?: string;
}

export interface DoctorLeaveItem {
  keterangan: string;
  tglLibur: string;
  tglMasuk: string;
  tipe: 'LIBUR' | 'MAJU' | 'CUTI' | 'SUBSTITUSI';
}

export interface DoctorLeaveAnnouncement {
  id: string;
  dpjp: string;
  poli: string;
  jadwal: DoctorLeaveItem[];
  active?: boolean;
}

export interface PatientQueueItem {
  id: string;
  nomorAntrean: string; // e.g. "POLI-SR-001"
  namaPasien: string;
  noBpjs: string;
  poli: string;
  dpjp: string;
  jamDaftar: string;
  status: 'Menunggu' | 'Diperiksa' | 'Selesai' | 'Batal';
  jenisPembayaran: 'BPJS Kesehatan' | 'Umum' | 'Asuransi Swasta';
}

export interface HospitalStats {
  totalPoliklinik: number;
  totalDokterDpjp: number;
  totalKuotaBpjs: number;
  rerataPasien: number;
}

export type ActiveNavTab =
  | 'dashboard'
  | 'schedules'
  | 'quotas'
  | 'rooms'
  | 'queue'
  | 'khitan'
  | 'jasa_raharja'
  | 'letters'
  | 'patient_notes'
  | 'contact_patients'
  | 'kupon_mohat'
  | 'incentive_calc'
  | 'settings'
  | 'clinics'
  | 'reports';

export interface JasaRaharjaItem {
  id: string;
  no?: number;
  tanggal: string; // Format: YYYY-MM-DD atau DD/MM/YYYY
  noRm: string; // Nomor Rekam Medis Pasien
  namaPasien: string; // Nama Lengkap Pasien
  biayaTerpakai: number; // Plafon / Biaya Terpakai (Rp)
  sisaPlafon: number; // Sisa Plafon (Rp), 0 jika HABIS
  plafonMaksimal?: number; // Batas Plafon Maksimal Jasa Raharja (Default: Rp 20.000.000)
  keterangan: string; // Contoh: HABIS, RUJUK, AFF KWIRE, MENINGGAL, RANAP, KONTROL
  statusPlafon: 'HABIS' | 'TERSEDIA';
  diagnosa?: string;
  noKlaim?: string;
  catatan?: string;
  sheetNumber?: number; // Lembar 1 - Lembar 7
  sheetName?: string;
  box_2d?: [number, number, number, number];
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencyAlertData {
  active: boolean;
  code: string;
  message: string;
  issuedAt: string;
  issuedBy: string;
}
