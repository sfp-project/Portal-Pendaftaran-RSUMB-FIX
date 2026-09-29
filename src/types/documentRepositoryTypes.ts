export type DocumentCategory =
  | 'REKAM MEDIS'
  | 'BPJS KETENAGAKERJAAN'
  | 'JASARAHARJA'
  | 'POSTER & PROMO'
  | 'RAWAT INAP'
  | 'RAWAT JALAN'
  | (string & {});

export const DEFAULT_DOCUMENT_CATEGORIES: string[] = [
  'REKAM MEDIS',
  'BPJS KETENAGAKERJAAN',
  'JASARAHARJA',
  'POSTER & PROMO',
  'RAWAT INAP',
  'RAWAT JALAN'
];

export interface MasterDocumentItem {
  id: string;
  judul: string;
  kategori: string;
  keterangan: string;
  formatBerkas: 'docx' | 'pdf' | 'doc' | string;
  namaBerkas: string;
  ukuranBerkas: string;
  ukuranBytes: number;
  tanggalDiunggah: string;
  fileData?: string; // Base64 data URL for native download
  blobUrl?: string; // Active session Blob URL for direct rendering & viewing
  // Google Drive Cloud Metadata
  driveFileId?: string;
  driveViewLink?: string;
  driveWebContentLink?: string;
  driveFolderName?: string;
}
