import {
  collectLocalDatabaseSnapshot,
  applyDatabaseSnapshotToLocalStorage,
  pushLocalDataToDrive
} from './dualSyncStorage';
import { logSystemActivity, loadSystemActivityLogs } from '../data/auditLogData';
import { loadActiveStaff } from '../data/headerData';

export const DAILY_SNAPSHOT_KEY = 'rsumb_db_snapshot_daily';
export const DAILY_SNAPSHOT_META_KEY = 'rsumb_db_snapshot_daily_meta';

export interface VersionHistoryEntry {
  timestamp: string;
  modified_by: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'ARCHIVE';
  previous_state: any;
  new_state: any;
}

export interface SoftDeletedItem {
  id: string;
  moduleName: string;
  collectionKey: string;
  title: string;
  deletedAt: string;
  deletedBy?: string;
  record: any;
}

export interface DailySnapshotMeta {
  snapshotDate: string;
  createdAt: string;
  totalKeys: number;
  dataSizeKb: number;
}

/**
 * Inisialisasi snapshot otomatis harian pada browser storage (rsumb_db_snapshot_daily)
 */
export const initDailyAutoSnapshot = (): void => {
  if (typeof window === 'undefined') return;

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const existingMetaStr = localStorage.getItem(DAILY_SNAPSHOT_META_KEY);

  let needNewSnapshot = true;
  if (existingMetaStr) {
    try {
      const meta: DailySnapshotMeta = JSON.parse(existingMetaStr);
      if (meta && meta.snapshotDate === todayStr) {
        needNewSnapshot = false;
      }
    } catch {
      needNewSnapshot = true;
    }
  }

  if (needNewSnapshot) {
    try {
      const snapshot = collectLocalDatabaseSnapshot();
      const strVal = JSON.stringify(snapshot);
      const sizeKb = Math.round((strVal.length * 2) / 1024);

      localStorage.setItem(DAILY_SNAPSHOT_KEY, strVal);

      const meta: DailySnapshotMeta = {
        snapshotDate: todayStr,
        createdAt: new Date().toISOString(),
        totalKeys: Object.keys(snapshot).length,
        dataSizeKb: sizeKb
      };
      localStorage.setItem(DAILY_SNAPSHOT_META_KEY, JSON.stringify(meta));
      console.info(`[AutoSnapshot] Snapshot harian (${todayStr}) berhasil disimpan secara lokal.`);
    } catch (e) {
      console.warn('Gagal menyimpan snapshot otomatis harian:', e);
    }
  }
};

/**
 * Ambil metadata snapshot harian yang tersimpan
 */
export const getDailySnapshotMeta = (): DailySnapshotMeta | null => {
  if (typeof window === 'undefined') return null;
  const str = localStorage.getItem(DAILY_SNAPSHOT_META_KEY);
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

/**
 * Pulihkan snapshot harian dari LocalStorage
 */
export const restoreDailySnapshot = async (): Promise<{ success: boolean; message: string }> => {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Lingkungan peramban tidak tersedia.' };
  }

  const str = localStorage.getItem(DAILY_SNAPSHOT_KEY);
  if (!str) {
    return {
      success: false,
      message: 'Belum ada snapshot harian otomatis yang tersimpan pada peramban ini.'
    };
  }

  try {
    const snapshot = JSON.parse(str);
    applyDatabaseSnapshotToLocalStorage(snapshot);

    const staffName = loadActiveStaff().name || 'Petugas Pendaftaran';
    logSystemActivity(
      'Pemulihan Snapshot Harian',
      `Memulihkan snapshot database otomatis harian (${snapshot.rsumb_db_snapshot_daily_meta?.snapshotDate || 'Tanggal Kemarin/Hari Ini'}).`,
      staffName,
      'SINKRONISASI',
      'Pusat Backup'
    );

    // Sync ke Google Drive jika terhubung
    await pushLocalDataToDrive(true);

    return {
      success: true,
      message: 'Snapshot database harian berhasil dipulihkan secara penuh!'
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Gagal memulihkan snapshot harian: ${e?.message || 'Format data tidak valid'}`
    };
  }
};

/**
 * Unduh Full Backup (.json) seluruh koleksi database RSUMB
 */
export const downloadFullBackupJson = (): void => {
  const snapshot = collectLocalDatabaseSnapshot();
  const jsonStr = JSON.stringify(snapshot, null, 2);

  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');

  const filename = `RSUMB_SIMRS_Database_${year}-${month}-${day}_${hours}${mins}.json`;

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const staffName = loadActiveStaff().name || 'Petugas Pendaftaran';
  logSystemActivity(
    'Ekspor Full Backup Database',
    `Mengunduh berkas cadangan database lengkap SIMRS: ${filename}.`,
    staffName,
    'SINKRONISASI',
    'Pusat Backup'
  );
};

/**
 * Impor & Restore Database dari file .json
 */
export const importAndRestoreBackupJson = async (
  jsonContent: string
): Promise<{ success: boolean; message: string; keyCount: number }> => {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Format berkas JSON tidak sesuai struktur snapshot database RSUMB.');
    }

    const keyCount = Object.keys(parsed).length;
    if (keyCount === 0) {
      throw new Error('Berkas JSON kosong atau tidak memiliki data koleksi.');
    }

    applyDatabaseSnapshotToLocalStorage(parsed);

    const staffName = loadActiveStaff().name || 'Petugas Pendaftaran';
    logSystemActivity(
      'Impor & Restore Database',
      `Berhasil mengimpor dan memulihkan ${keyCount} koleksi data dari berkas backup JSON.`,
      staffName,
      'SINKRONISASI',
      'Pusat Backup'
    );

    await pushLocalDataToDrive(true);

    return {
      success: true,
      message: `Database berhasil dipulihkan! Total ${keyCount} koleksi data telah diperbarui.`,
      keyCount
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Gagal memproses berkas JSON.',
      keyCount: 0
    };
  }
};

/**
 * Perekam version history otomatis pada entri record saat edit / update
 */
export const createRecordVersionHistory = (
  oldRecord: any,
  newRecord: any,
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'ARCHIVE',
  staffName?: string
): any => {
  const currentStaff = staffName || loadActiveStaff().name || 'Petugas Pendaftaran';
  const timestamp = new Date().toISOString();

  // Strip existing version_history from previous_state & new_state to prevent recursive bloat
  const cleanOld = oldRecord ? { ...oldRecord, version_history: undefined } : null;
  const cleanNew = { ...newRecord, version_history: undefined };

  const entry: VersionHistoryEntry = {
    timestamp,
    modified_by: currentStaff,
    action,
    previous_state: cleanOld,
    new_state: cleanNew
  };

  const prevHistory: VersionHistoryEntry[] = Array.isArray(oldRecord?.version_history)
    ? oldRecord.version_history
    : [];

  return {
    ...newRecord,
    updated_at: timestamp,
    version_history: [entry, ...prevHistory].slice(0, 50) // Simpan hingga 50 riwayat revisi
  };
};

/**
 * Pemindai Tempat Sampah (Recycle Bin / Soft Delete Items) dari seluruh koleksi LocalStorage
 */
export const getGlobalRecycleBinItems = (): SoftDeletedItem[] => {
  if (typeof window === 'undefined') return [];

  const softDeletedList: SoftDeletedItem[] = [];

  const collectionLabelMap: Record<string, string> = {
    medcentral_schedules_v5: 'Jadwal Dokter & Poliklinik',
    rsumb_khitan_participants_v1: 'Khitan Jumat & Massal',
    rsumb_jr_cases_v1: 'Plafon Jasa Raharja',
    rsumb_jr_data_v1: 'Plafon Jasa Raharja',
    rsumb_jasa_raharja_v1: 'Plafon Jasa Raharja',
    rsumb_master_posters: 'Poster Promo & Dokter Libur',
    master_posters_data: 'Poster Promo & Dokter Libur',
    rsumb_letters_v1: 'Surat Kontrol & Bebas Narkoba',
    rsumb_patient_notes_v1: 'Catatan Khusus Pasien',
    rsumb_elective_surgeries: 'Jadwal Operasi Elektif',
    rsumb_surgery_schedules_v4: 'Jadwal Operasi Elektif',
    rsumb_document_repository_v1: 'Bank Dokumen Master',
    rsumb_master_documents_v1: 'Bank Dokumen Master',
    rsumb_kupon_list_v1: 'Kupon Fee Mohat'
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (
      key.startsWith('rsumb_') ||
      key.startsWith('medcentral_') ||
      key.startsWith('master_')
    ) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || typeof raw !== 'string' || raw.trim().length <= 1 || raw === 'undefined' || raw === 'null') continue;
        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch {
          continue;
        }

        // Sub-Arrays check (such as patient notes object with sub-arrays)
        if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
          Object.entries(parsed).forEach(([subKey, subVal]) => {
            if (Array.isArray(subVal)) {
              subVal.forEach((item: any) => {
                if (item && typeof item === 'object' && (item.is_deleted || item.isDeleted)) {
                  softDeletedList.push({
                    id: item.id || `subitem-${Math.random()}`,
                    moduleName: `${collectionLabelMap[key] || key} (${subKey})`,
                    collectionKey: `${key}:::${subKey}`,
                    title:
                      item.namaPasien ||
                      item.namaPeserta ||
                      item.dpjp ||
                      item.judul ||
                      item.nomorSurat ||
                      item.noRm ||
                      'Entri Data',
                    deletedAt: item.deleted_at || item.deletedAt || item.updatedAt || new Date().toISOString(),
                    deletedBy: item.deletedBy || item.modifiedBy || 'Petugas',
                    record: item
                  });
                }
              });
            }
          });
        } else if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item && typeof item === 'object' && (item.is_deleted || item.isDeleted)) {
              softDeletedList.push({
                id: item.id || `item-${Math.random()}`,
                moduleName: collectionLabelMap[key] || key,
                collectionKey: key,
                title:
                  item.namaPasien ||
                  item.namaPeserta ||
                  item.dpjp ||
                  item.judul ||
                  item.nomorSurat ||
                  item.noRm ||
                  'Entri Data',
                deletedAt: item.deleted_at || item.deletedAt || item.updatedAt || new Date().toISOString(),
                deletedBy: item.deletedBy || item.modifiedBy || 'Petugas',
                record: item
              });
            }
          });
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  return softDeletedList.sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );
};

/**
 * Pulihkan item yang terhapus secara soft-delete (Set is_deleted: false)
 */
export const restoreSoftDeletedItem = async (
  collectionKey: string,
  itemId: string,
  staffName?: string
): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const currentStaff = staffName || loadActiveStaff().name || 'Petugas Pendaftaran';

  try {
    if (collectionKey.includes(':::')) {
      const [mainKey, subKey] = collectionKey.split(':::');
      const raw = localStorage.getItem(mainKey);
      if (!raw || typeof raw !== 'string' || raw.trim().length <= 1 || raw === 'undefined' || raw === 'null') return false;
      let obj: any;
      try {
        obj = JSON.parse(raw);
      } catch {
        return false;
      }

      if (obj && Array.isArray(obj[subKey])) {
        obj[subKey] = obj[subKey].map((item: any) => {
          if (item.id === itemId) {
            const restored = {
              ...item,
              is_deleted: false,
              isDeleted: false,
              deleted_at: undefined,
              deletedAt: undefined
            };
            return createRecordVersionHistory(item, restored, 'STATUS_CHANGE', currentStaff);
          }
          return item;
        });

        localStorage.setItem(mainKey, JSON.stringify(obj));
        window.dispatchEvent(new CustomEvent('rsumb_patient_notes_saved'));
      }
    } else {
      const raw = localStorage.getItem(collectionKey);
      if (!raw || typeof raw !== 'string' || raw.trim().length <= 1 || raw === 'undefined' || raw === 'null') return false;
      let list: any;
      try {
        list = JSON.parse(raw);
      } catch {
        return false;
      }

      if (Array.isArray(list)) {
        const updated = list.map((item: any) => {
          if (item.id === itemId) {
            const restored = {
              ...item,
              is_deleted: false,
              isDeleted: false,
              deleted_at: undefined,
              deletedAt: undefined
            };
            return createRecordVersionHistory(item, restored, 'STATUS_CHANGE', currentStaff);
          }
          return item;
        });

        localStorage.setItem(collectionKey, JSON.stringify(updated));

        // Dispatch specific event to update active views
        if (collectionKey.includes('schedule')) window.dispatchEvent(new CustomEvent('rsumb_schedules_saved'));
        if (collectionKey.includes('khitan')) window.dispatchEvent(new CustomEvent('rsumb_khitan_saved'));
        if (collectionKey.includes('jr')) window.dispatchEvent(new CustomEvent('rsumb_jr_saved'));
        if (collectionKey.includes('poster')) window.dispatchEvent(new CustomEvent('rsumb_posters_saved'));
        if (collectionKey.includes('letter')) window.dispatchEvent(new CustomEvent('rsumb_letters_saved'));
        if (collectionKey.includes('surgery')) window.dispatchEvent(new CustomEvent('rsumb_surgery_saved'));
        if (collectionKey.includes('doc')) window.dispatchEvent(new CustomEvent('rsumb_documents_saved'));
        if (collectionKey.includes('kupon')) window.dispatchEvent(new CustomEvent('rsumb_kupon_saved'));
      }
    }

    logSystemActivity(
      'Pemulihan Data Soft-Delete',
      `Item ID ${itemId} dipulihkan kembali dari Tempat Sampah SIMRS.`,
      currentStaff,
      'CATATAN_PASIEN',
      'Tempat Sampah'
    );

    window.dispatchEvent(new CustomEvent('rsumb_database_updated'));
    await pushLocalDataToDrive(true);
    return true;
  } catch (e) {
    console.error('Gagal memulihkan item soft-delete:', e);
    return false;
  }
};
