export type GuarantorCategory = 'bpjs' | 'umum_asuransi' | 'jasa_raharja';

export type ServiceType = 'rawat_jalan' | 'rawat_inap' | 'igd_darurat';

export interface RequirementDocItem {
  id: string;
  name: string;
  code: string;
  category: GuarantorCategory;
  description: string;
  isMandatory: boolean;
  notes?: string;
  applicableServices: ServiceType[];
  validityPeriod?: string; // e.g. "90 hari dari fktp", "30 hari"
}

export interface PendingDocItem {
  docId: string;
  docName: string;
  status: 'lengkap' | 'kurang';
  note?: string;
}

export interface SlipKekuranganBerkas {
  id: string;
  nomorSlip: string; // e.g. SLIP-20261005-001
  tanggal: string; // ISO string
  noRm: string;
  namaPasien: string;
  noHpPasien?: string;
  penjamin: GuarantorCategory;
  penjaminLabel: string;
  serviceType: ServiceType;
  poliklinikRuang: string;
  batasWaktuTeks: string; // e.g. "Maksimal 3 x 24 Jam Kerja (Rabu, 08/10/2026 pukul 14.00 WIB)"
  batasWaktuIso?: string;
  petugasAdmisi: string;
  items: PendingDocItem[];
  catatanKhusus?: string;
  statusPengurusan: 'menunggu' | 'lengkap' | 'batal';
  selesaiPada?: string;
  petugasPenerima?: string;
}
