import { MasterDocumentItem, DEFAULT_DOCUMENT_CATEGORIES } from '../types/documentRepositoryTypes';

const STORAGE_KEY = 'rsumb_document_repository_v1';
const CATEGORIES_STORAGE_KEY = 'rsumb_document_categories_v1';

export const loadStoredCategories = (): string[] => {
  try {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to ensure all defaults always present
        const merged = Array.from(new Set([...DEFAULT_DOCUMENT_CATEGORIES, ...parsed.map(c => c.trim().toUpperCase())]));
        return merged;
      }
    }
  } catch (error) {
    console.error('Error loading stored categories:', error);
  }
  return [...DEFAULT_DOCUMENT_CATEGORIES];
};

export const saveStoredCategories = (categories: string[]): void => {
  try {
    const uniqueClean = Array.from(new Set(categories.map(c => c.trim().toUpperCase()).filter(Boolean)));
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(uniqueClean));
  } catch (error) {
    console.error('Error saving categories to storage:', error);
  }
};

export const INITIAL_SEED_DOCUMENTS: MasterDocumentItem[] = [
  {
    id: 'doc-seed-01',
    judul: 'Formulir Surat Jaminan Rawat Inap & Naik Kelas BPJS',
    kategori: 'RAWAT INAP',
    keterangan: 'Formulir resmi persetujuan jaminan pelayanan dan penjaminan selisih biaya naik kelas rawat inap.',
    formatBerkas: 'docx',
    namaBerkas: 'Formulir_Jaminan_Ranap_Naik_Kelas_RSUMB.docx',
    ukuranBerkas: '142 KB',
    ukuranBytes: 145408,
    tanggalDiunggah: '2026-09-05 09:30',
    driveFileId: 'drive-doc-01',
    driveViewLink: 'https://drive.google.com/file/d/1ranap-jaminan-rsumb/view',
    driveWebContentLink: 'https://drive.google.com/uc?id=1ranap-jaminan-rsumb&export=download',
    driveFolderName: 'RSUMB_Portal_Files'
  },
  {
    id: 'doc-seed-02',
    judul: 'SPO Pelayanan Mohat & Alur Klaim Fee Transportasi Rujukan',
    kategori: 'RAWAT JALAN',
    keterangan: 'Standar Prosedur Operasional verifikasi armada Mobil Sehat (Mohat), syarat kwitansi/kupon, dan pencairan insentif.',
    formatBerkas: 'pdf',
    namaBerkas: 'SPO_Pelayanan_Mohat_RSUMB_2026.pdf',
    ukuranBerkas: '380 KB',
    ukuranBytes: 389120,
    tanggalDiunggah: '2026-09-08 14:15',
    driveFileId: 'drive-doc-02',
    driveViewLink: 'https://drive.google.com/file/d/1mohat-spo-rsumb/view',
    driveWebContentLink: 'https://drive.google.com/uc?id=1mohat-spo-rsumb&export=download',
    driveFolderName: 'RSUMB_Portal_Files'
  },
  {
    id: 'doc-seed-03',
    judul: 'Formulir Berkas Klaim Jasa Raharja & Rekap KLL',
    kategori: 'JASARAHARJA',
    keterangan: 'Format pengajuan klaim penjaminan korban kecelakaan lalu lintas (KLL) dan verifikasi nomor LP lantas.',
    formatBerkas: 'docx',
    namaBerkas: 'Formulir_Klaim_Jasa_Raharja_KLL.docx',
    ukuranBerkas: '215 KB',
    ukuranBytes: 220160,
    tanggalDiunggah: '2026-09-10 11:00',
    driveFileId: 'drive-doc-03',
    driveViewLink: 'https://drive.google.com/file/d/1jasaraharja-klaim-rsumb/view',
    driveWebContentLink: 'https://drive.google.com/uc?id=1jasaraharja-klaim-rsumb&export=download',
    driveFolderName: 'RSUMB_Portal_Files'
  },
  {
    id: 'doc-seed-04',
    judul: 'Formulir Klaim Kecelakaan Kerja BPJS Ketenagakerjaan (Form KK2)',
    kategori: 'BPJS KETENAGAKERJAAN',
    keterangan: 'Formulir pengisian kecelakaan kerja tahap 1 dan tahap 2 untuk pasien rujukan perusahaan.',
    formatBerkas: 'pdf',
    namaBerkas: 'Formulir_BPJS_TK_KK2_RSUMB.pdf',
    ukuranBerkas: '520 KB',
    ukuranBytes: 532480,
    tanggalDiunggah: '2026-09-12 16:40',
    driveFileId: 'drive-doc-04',
    driveViewLink: 'https://drive.google.com/file/d/1bpjstk-kk2-rsumb/view',
    driveWebContentLink: 'https://drive.google.com/uc?id=1bpjstk-kk2-rsumb&export=download',
    driveFolderName: 'RSUMB_Portal_Files'
  }
];

export const loadMasterDocuments = (): MasterDocumentItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading master documents from storage:', error);
  }
  return INITIAL_SEED_DOCUMENTS;
};

export const saveMasterDocuments = (documents: MasterDocumentItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.warn('LocalStorage save failed, attempting to save without large fileData payloads:', error);
    try {
      // If storage quota exceeded due to large base64 data, store metadata
      const simplified = documents.map(doc => ({
        ...doc,
        fileData: doc.fileData && doc.fileData.length > 500000 ? undefined : doc.fileData
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(simplified));
    } catch (innerError) {
      console.error('Failed to save documents to storage:', innerError);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rsumb_documents_saved'));
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatUploadDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return dateStr;
  }
};
