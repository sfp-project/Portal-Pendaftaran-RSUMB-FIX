import { JasaRaharjaItem } from '../types';
import {
  subscribeCollection,
  saveDoc,
  removeDoc,
  batchSaveCollection
} from '../services/firebase';

export const PLAFON_MAKSIMAL_DEFAULT = 20000000; // Rp 20.000.000 (Standar Batas Plafon Luka-Luka Jasa Raharja)

export const JR_ACTIVE_PHOTO_KEY = 'jasaraharja_active_photo_url';
export const JR_ACTIVE_PHOTO_TIME_KEY = 'jasaraharja_active_photo_updated_at';
export const JR_PHOTO_GALLERY_KEY = 'jasaraharja_photo_gallery';

export const initialJasaRaharjaData: JasaRaharjaItem[] = [];

const LOCAL_STORAGE_KEY = 'rsumb_jasa_raharja_v1';
const FALLBACK_STORAGE_KEYS = ['rsumb_jr_data_v1', 'rsumb_jr_cases_v1'];

export function subscribeJasaRaharjaList(callback: (items: JasaRaharjaItem[]) => void): () => void {
  return subscribeCollection<JasaRaharjaItem>('jasa_raharja', (items) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {}
    callback(items);
  });
}

export function loadJasaRaharjaData(): JasaRaharjaItem[] {
  if (typeof window === 'undefined') return [];

  const allKeys = [LOCAL_STORAGE_KEY, ...FALLBACK_STORAGE_KEYS];

  for (const key of allKeys) {
    try {
      const saved = localStorage.getItem(key);
      if (saved && typeof saved === 'string') {
        const trimmed = saved.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const activeOnly = parsed.filter((i: any) => i && typeof i === 'object' && !i.is_deleted && !i.isDeleted);
            if (activeOnly.length > 0) {
              return activeOnly;
            }
          }
        }
      }
    } catch (err) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  }

  return [];
}

export function saveJasaRaharjaData(data: JasaRaharjaItem[]): void {
  if (typeof window === 'undefined') return;
  const validData = Array.isArray(data) ? data : [];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validData));
  } catch (err) {
    console.warn('Peringatan: Gagal menyimpan data Jasa Raharja ke storage:', err);
  }

  // Cloud Firestore Sync
  batchSaveCollection('jasa_raharja', validData).catch((err) => {
    console.warn('[Firestore] Gagal menyimpan batch Jasa Raharja:', err);
  });
}

/**
 * Format angka ke format Rupiah standar Indonesia:
 * Contoh: 11738348 -> "Rp 11.738.348"
 */
export function formatRupiah(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return 'Rp 0';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(num);
}

/**
 * Format string tanggal YYYY-MM-DD ke format Indonesia DD MMMM YYYY
 */
export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    // Jika sudah DD/MM/YYYY
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Interface untuk objek data hasil ekstraksi OCR tabel Jasa Raharja
 * Mendukung format snake_case sesuai permintaan prompt maupun camelCase
 */
export interface JasaRaharjaOcrItem {
  no_rm?: string;
  noRm?: string;
  tanggal?: string;
  nama_pasien?: string;
  namaPasien?: string;
  biaya_terpakai?: string | number;
  biayaTerpakai?: string | number;
  sisa_plafon?: string | number;
  sisaPlafon?: string | number;
  status_keterangan?: string;
  keterangan?: string;
  sheetNumber?: number;
  sheetName?: string;
  box_2d?: [number, number, number, number];
}

/**
 * Normalisasi No RM untuk perbandingan unik (menghapus tanda minus, spasi, titik)
 * Contoh: "07-42-18", "074218", "07.42.18" -> "074218"
 */
export function normalizeNoRm(val?: string | null): string {
  if (!val) return '';
  return String(val).replace(/[^0-9a-zA-Z]/g, '').trim().toLowerCase();
}

/**
 * Helper function untuk membersihkan/parsing nilai angka nominal rupiah dari Excel / OCR
 * Contoh: "11.738.348", "Rp 11.738.348", "20.000.000", "0 (HABIS)", "5.240.000,00" -> 11738348
 */
export function parseNumericValue(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  if (val === undefined || val === null || val === '') return 0;

  const str = String(val).trim();
  if (!str) return 0;
  if (str.toUpperCase().includes('HABIS')) return 0;

  // Hapus 'Rp', 'Rp.', 'IDR', spasi, dan karakter non-numerik yang tidak perlu
  let cleaned = str
    .replace(/Rp\.?/gi, '')
    .replace(/IDR/gi, '')
    .replace(/\s+/g, '')
    .trim();

  if (!cleaned) return 0;

  // Hapus desimal nol di belakang koma/titik seperti ",00" atau ".00"
  if (cleaned.endsWith(',00') || cleaned.endsWith('.00')) {
    cleaned = cleaned.slice(0, -3);
  }

  // Jika format rupiah Indonesia dengan titik ribuan (misal: "11.738.348" atau "5.240.000")
  if (cleaned.includes('.') && !cleaned.includes(',')) {
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      cleaned = cleaned.replace(/\./g, '');
    } else {
      const parts = cleaned.split('.');
      if (parts[1] && parts[1].length === 3) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Jika format koma ribuan (misal: "11,738,348")
    const commaCount = (cleaned.match(/,/g) || []).length;
    if (commaCount > 1) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      const parts = cleaned.split(',');
      if (parts[1] && parts[1].length === 3) {
        cleaned = cleaned.replace(/,/g, '');
      } else {
        cleaned = cleaned.replace(/,/g, '.');
      }
    }
  } else if (cleaned.includes('.') && cleaned.includes(',')) {
    // Format campuran (misal: "11.738.348,50" atau "11,738,348.50")
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      // Format Indo: 11.738.348,50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Format US: 11,738,348.50
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  // Hapus karakter apa pun yang bukan angka atau minus
  const sanitized = cleaned.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

export const parseNominal = parseNumericValue;

export interface UpsertResult {
  updatedList: JasaRaharjaItem[];
  updatedCount: number;
  addedCount: number;
  updatedItems: {
    namaPasien: string;
    noRm: string;
    biayaLama?: number;
    biayaBaru: number;
    sisaLama?: number;
    sisaBaru: number;
    keterangan: string;
  }[];
  addedItems: {
    namaPasien: string;
    noRm: string;
    biayaTerpakai: number;
    sisaPlafon: number;
    keterangan: string;
  }[];
}

/**
 * Logika Pembaruan Data Anti-Duplikasi (Upsert Logics):
 * - Gunakan "no_rm" sebagai Primary Key / Key Unik.
 * - Saat proses penyimpanan hasil OCR:
 *   a. Iterasi setiap data hasil OCR.
 *   b. Cari apakah "no_rm" tersebut sudah ada di tabel data web.
 *   c. Jika SUDAH ADA: Timpa/update nilai tanggal, biaya_terpakai, sisa_plafon, dan status_keterangan dengan data gambar terbaru.
 *   d. Jika BELUM ADA: Push data sebagai pasien baru.
 */
export function upsertJasaRaharjaItems(
  currentItems: JasaRaharjaItem[],
  incomingItems: JasaRaharjaOcrItem[]
): UpsertResult {
  const resultList: JasaRaharjaItem[] = [...currentItems];
  let updatedCount = 0;
  let addedCount = 0;
  const updatedItems: UpsertResult['updatedItems'] = [];
  const addedItems: UpsertResult['addedItems'] = [];

  for (let idx = 0; idx < incomingItems.length; idx++) {
    const raw = incomingItems[idx];
    const rawNoRm = String(raw.no_rm || raw.noRm || '').trim();
    const rawNama = String(raw.nama_pasien || raw.namaPasien || '').trim() || 'Pasien Tanpa Nama';
    const rawTanggal = String(raw.tanggal || '').trim() || new Date().toISOString().slice(0, 10);
    const rawKeterangan = String(raw.status_keterangan || raw.keterangan || '').trim();

    const normKey = normalizeNoRm(rawNoRm);
    if (!normKey) {
      continue; // Lewati jika tidak ada No RM sama sekali
    }

    const rawSisaVal = raw.sisa_plafon ?? raw.sisaPlafon;
    const hasExplicitSisa = rawSisaVal !== undefined && rawSisaVal !== null && String(rawSisaVal).trim() !== '';

    const biayaNum = parseNumericValue(raw.biaya_terpakai ?? raw.biayaTerpakai);
    let sisaNum = hasExplicitSisa
      ? parseNumericValue(rawSisaVal)
      : Math.max(0, PLAFON_MAKSIMAL_DEFAULT - biayaNum);

    // Jika keterangan HABIS atau biaya melampaui plafon
    if (rawKeterangan.toUpperCase().includes('HABIS')) {
      sisaNum = 0;
    } else if (!hasExplicitSisa && biayaNum >= PLAFON_MAKSIMAL_DEFAULT) {
      sisaNum = 0;
    }

    const isHabis = sisaNum <= 0 || rawKeterangan.toUpperCase().includes('HABIS');
    const finalKeterangan = rawKeterangan || (isHabis ? 'HABIS' : 'RANAP');
    const statusPlafon: 'HABIS' | 'TERSEDIA' = isHabis ? 'HABIS' : 'TERSEDIA';

    // Cari apakah no_rm sudah ada di tabel web
    const existingIndex = resultList.findIndex(
      (item) => normalizeNoRm(item.noRm) === normKey
    );

    if (existingIndex >= 0) {
      // b & c. SUDAH ADA: Timpa/update nilai biaya_terpakai dan sisa_plafon dengan menjaga integritas data pasien
      const existing = resultList[existingIndex];
      const oldBiaya = existing.biayaTerpakai;
      const oldSisa = existing.sisaPlafon;

      const updatedNama = rawNama && rawNama !== 'Pasien Tanpa Nama' ? rawNama : existing.namaPasien;
      const updatedTanggal = rawTanggal && rawTanggal !== new Date().toISOString().slice(0, 10) ? rawTanggal : existing.tanggal;

      resultList[existingIndex] = {
        ...existing,
        tanggal: updatedTanggal,
        namaPasien: updatedNama,
        biayaTerpakai: biayaNum > 0 ? biayaNum : existing.biayaTerpakai,
        sisaPlafon: (hasExplicitSisa || biayaNum > 0) ? sisaNum : existing.sisaPlafon,
        keterangan: rawKeterangan ? finalKeterangan : existing.keterangan,
        statusPlafon: (hasExplicitSisa || biayaNum > 0) ? statusPlafon : existing.statusPlafon,
        sheetNumber: raw.sheetNumber ?? existing.sheetNumber,
        sheetName: raw.sheetName ?? existing.sheetName,
        box_2d: raw.box_2d ?? existing.box_2d,
        updatedAt: new Date().toISOString()
      };

      updatedCount++;
      updatedItems.push({
        namaPasien: resultList[existingIndex].namaPasien,
        noRm: existing.noRm,
        biayaLama: oldBiaya,
        biayaBaru: biayaNum,
        sisaLama: oldSisa,
        sisaBaru: sisaNum,
        keterangan: finalKeterangan
      });
    } else {
      // d. BELUM ADA: Push data sebagai pasien baru
      const newItem: JasaRaharjaItem = {
        id: `jr-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        no: resultList.length + 1,
        tanggal: rawTanggal,
        noRm: rawNoRm,
        namaPasien: rawNama,
        biayaTerpakai: biayaNum,
        sisaPlafon: sisaNum,
        plafonMaksimal: PLAFON_MAKSIMAL_DEFAULT,
        keterangan: finalKeterangan,
        statusPlafon,
        sheetNumber: raw.sheetNumber,
        sheetName: raw.sheetName,
        box_2d: raw.box_2d,
        createdAt: new Date().toISOString()
      };

      resultList.unshift(newItem); // Tambahkan di baris paling atas agar langsung terlihat
      addedCount++;
      addedItems.push({
        namaPasien: rawNama,
        noRm: rawNoRm,
        biayaTerpakai: biayaNum,
        sisaPlafon: sisaNum,
        keterangan: finalKeterangan
      });
    }
  }

  return {
    updatedList: resultList,
    updatedCount,
    addedCount,
    updatedItems,
    addedItems
  };
}
