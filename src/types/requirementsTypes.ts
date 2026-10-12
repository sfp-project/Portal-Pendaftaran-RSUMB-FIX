export type GuarantorCategory =
  | 'umum'
  | 'bpjs'
  | 'jasa_raharja'
  | 'bpjs_tk'
  | 'asuransi_kai'
  | 'asuransi_admedika_brilife';

export type ServiceType = 'rawat_jalan' | 'rawat_inap';

export interface RequirementDocItem {
  id: string;
  name: string;
  code: string;
  category: GuarantorCategory;
  description: string;
  isMandatory: boolean;
  notes?: string;
  applicableServices: ServiceType[];
  validityPeriod?: string;
}

export interface PendingDocItem {
  docId: string;
  docName: string;
  status: 'lengkap' | 'kurang';
  note?: string;
}

export interface SlipKekuranganBerkas {
  id: string;
  nomorSlip: string; // Format: SLIP-20261005-001
  tanggal: string; // ISO string
  noRm: string;
  namaPasien: string;
  noHpPasien?: string;
  penjamin: GuarantorCategory;
  penjaminLabel: string;
  serviceType: ServiceType;
  poliklinikRuang: string;
  batasWaktuTeks: string;
  batasWaktuIso?: string;
  petugasAdmisi: string;
  items: PendingDocItem[];
  catatanKhusus?: string;
  statusPengurusan: 'menunggu' | 'lengkap' | 'batal';
  selesaiPada?: string;
  petugasPenerima?: string;
}
