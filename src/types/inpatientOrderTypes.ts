export type UnitRanap = 'lt4' | 'lt5' | 'vk' | 'icu';
export type LantaiRanap = UnitRanap; // alias for compatibility

export type StatusInden =
  | 'MENUNGGU RESPON / BELUM ADA KAMAR'
  | 'Tunggu Bed' // Belum dapat kamar (RED HIGHLIGHT)
  | 'Kamar Siap'
  | 'Tunggu UV'
  | 'Tunggu Visit'
  | 'Tunggu Dibersihkan'
  | 'Siap Masuk'
  | 'Sudah Masuk';

export interface IndenPatient {
  id: string;
  nama: string;
  umur: string;
  diagnosa: string;
  kodeIcd10?: string;
  dpjp: string;
  caraBayar: string; // e.g. "BPJS KLS 3", "UMUM KLS 3", "BPJS KELAS 1"
  kelasKamar: string; // e.g. "KELAS 3", "VIP", "Kelas 1"
  lantai: UnitRanap; // 'lt4' | 'lt5' | 'vk' | 'icu'
  nomorBedTarget?: string; // misal "VIP 8", "JN 10B", "VK 1", "Bed ICU 2", "402"
  status: StatusInden;
  catatan?: string;
  waktuPesan: string; // formatted date
  kontakPasien?: string;
  petugasPencatat?: string;
  spriRawText?: string;
}

export interface KamarKosongSubKategori {
  nama: string;
  isPenuh: boolean;
  beds: string[];
}

export interface KamarKosongKategori {
  id: string;
  label: string;
  isPenuh?: boolean;
  beds?: string[];
  subKategori?: KamarKosongSubKategori[];
}

export interface LantaiKamarKosong {
  lantai: UnitRanap;
  label: string;
  headerText: string;
  lastUpdated: string;
  kategori: KamarKosongKategori[];
}

export type StickyColorTheme = 'blue' | 'green' | 'pink' | 'cream';

export interface StickyNoteItem {
  id: string; // 'lt4' | 'lt5' | 'vk' | 'kamar_kosong'
  title: string;
  subtitle: string;
  headerCode: string;
  theme: StickyColorTheme;
  contentHtml: string;
  updatedAt: string;
}
