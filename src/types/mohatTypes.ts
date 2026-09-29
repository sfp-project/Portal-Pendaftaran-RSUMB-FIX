export type KategoriPerujuk = 'PKM' | 'MOHAT';
export type PenjaminKupon = 'UMUM' | 'BPJS_JR_ASURANSI' | 'BPJS';
export type StatusKlaimKupon = 'Menunggu Kasir' | 'Lunas' | 'Dibatalkan';

export interface KuponMohat {
  id: string;
  nomorKupon: string; // e.g. "MHT-20260920-001"
  noSeri?: string; // Auto-increment serial number e.g. "SN-00001"
  tanggalMasuk: string; // YYYY-MM-DD
  jamDibuat: string; // HH:mm WIB
  namaPasien: string;
  penjamin: PenjaminKupon;
  kategori: KategoriPerujuk;
  namaPerujuk: string; // Nama Perawat/Bidan (PKM) atau Pengantar/Sopir (Mohat)
  namaSopir?: string; // Nama Sopir PKM
  noHpPengantar?: string; // No HP Mohat
  feePerujuk: number;
  feeSopir: number;
  feeTotal: number;
  status: StatusKlaimKupon;
  petugasKasir?: string;
  catatan?: string;
  createdAt: string;
}

export type MohatAuditAction = 'GENERATED' | 'REPRINTED' | 'STATUS_UPDATED';

export interface MohatAuditLog {
  id: string;
  action: MohatAuditAction;
  timestamp: string; // ISO 8601 string
  kuponId: string;
  nomorKupon: string;
  noSeri: string;
  namaPasien: string;
  kategori: KategoriPerujuk;
  penjamin: PenjaminKupon;
  feeTotal: number;
  status: StatusKlaimKupon;
  perujukSopir: string;
  reprintCount: number;
  lastReprintAt?: string;
  auditNotes?: string;
  kuponSnapshot: KuponMohat;
}

export interface MohatSuggestions {
  perawatList: string[];
  sopirPkmList: string[];
  sopirMohatList: string[];
}
