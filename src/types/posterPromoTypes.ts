export type KategoriPromo = 'Layanan Unggulan' | 'Tarif Promo' | 'BPJS/MCU' | 'Umum';

export const KATEGORI_PROMO_OPTIONS: { value: KategoriPromo; label: string; description: string; badgeColor: string }[] = [
  {
    value: 'Layanan Unggulan',
    label: 'Layanan Unggulan',
    description: 'Poli Spesialis, Tindakan Medis Khusus, CT-Scan & USG 4D',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    value: 'Tarif Promo',
    label: 'Tarif Promo',
    description: 'Diskon Paket, Tarif Khusus Khitan, Promo Tindakan',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    value: 'BPJS/MCU',
    label: 'BPJS/MCU',
    description: 'Paket Skrining Kesehatan, Medical Check Up, & Program BPJS',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    value: 'Umum',
    label: 'Umum',
    description: 'Sosialisasi Alur, Antar-Jemput Mohat, Maklumat Rumah Sakit',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  }
];

export interface PosterPromoItem {
  id: string;
  judul: string;
  kategoriPromo: KategoriPromo;
  tags: string[]; // e.g. ["khitan", "mcu", "poli jantung", "diskon"]
  tanggalMulai?: string; // YYYY-MM-DD
  tanggalKadaluarsa?: string; // YYYY-MM-DD
  namaBerkas: string;
  formatBerkas: 'png' | 'jpg' | 'jpeg' | 'webp' | 'pdf' | string;
  ukuranBerkas: string;
  ukuranBytes: number;
  tanggalDiunggah: string;
  fileData?: string; // Base64 data URL (image or PDF)
  keterangan?: string;
  // Google Drive Cloud Metadata
  driveFileId?: string;
  driveViewLink?: string;
  driveWebContentLink?: string;
  driveFolderName?: string;
}

export type StatusPromoFilter = 'ALL' | 'ACTIVE' | 'EXPIRED';
