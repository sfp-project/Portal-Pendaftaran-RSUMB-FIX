import {
  syncDatabaseToGoogleDrive,
  fetchDatabaseFromGoogleDrive,
  saveBackupToGoogleDrive,
  deleteDriveFile
} from './googleDriveService';
import { isGoogleDriveConnected, getCachedUser } from './googleAuthService';

export type SyncStatusType = 'idle' | 'syncing' | 'synced' | 'error';

export interface DualSyncState {
  status: SyncStatusType;
  lastSyncTime: string | null;
  lastError: string | null;
  syncedBy: string | null;
  isDriveConnected: boolean;
}

// Monitored keys to compile into rsumb_database.json
export const MONITORED_STORAGE_KEYS = [
  'rsumb_portal_settings',
  'rsumb_kupon_list_v1',
  'rsumb_active_staff_v1',
  'rsumb_handover_notes_v1',
  'rsumb_master_posters',
  'master_posters_data',
  'rsumb_document_repository_v1',
  'rsumb_document_categories_v1',
  'rsumb_master_documents_v1',
  'rsumb_patient_notes_v1',
  'rsumb_khitan_patients_v1',
  'rsumb_jr_cases_v1',
  'rsumb_elective_surgeries',
  'rsumb_header_notifications',
  'rsumb_system_audit_logs_v1'
];

let syncState: DualSyncState = {
  status: 'idle',
  lastSyncTime: localStorage.getItem('rsumb_last_drive_sync') || null,
  lastError: null,
  syncedBy: null,
  isDriveConnected: false
};

const listeners = new Set<(state: DualSyncState) => void>();

export const getDualSyncState = (): DualSyncState => ({
  ...syncState,
  isDriveConnected: isGoogleDriveConnected()
});

export const addSyncStateListener = (cb: (state: DualSyncState) => void): (() => void) => {
  listeners.add(cb);
  cb(getDualSyncState());
  return () => {
    listeners.delete(cb);
  };
};

const updateSyncState = (partial: Partial<DualSyncState>) => {
  syncState = {
    ...syncState,
    ...partial,
    isDriveConnected: isGoogleDriveConnected()
  };
  if (partial.lastSyncTime) {
    try {
      localStorage.setItem('rsumb_last_drive_sync', partial.lastSyncTime);
    } catch {
      // ignore
    }
  }
  listeners.forEach((cb) => {
    try {
      cb(syncState);
    } catch (e) {
      console.error('Error notifying sync listener:', e);
    }
  });

  window.dispatchEvent(
    new CustomEvent('rsumb_drive_sync_status', {
      detail: syncState
    })
  );
};

/**
 * Mengumpulkan snapshot seluruh data lokal RSUMB
 */
export const collectLocalDatabaseSnapshot = (): Record<string, any> => {
  const snapshot: Record<string, any> = {};

  // 1. Monitored keys
  MONITORED_STORAGE_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try {
        snapshot[key] = JSON.parse(val);
      } catch {
        snapshot[key] = val;
      }
    }
  });

  // 2. Any additional rsumb_* keys found in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('rsumb_') || k.startsWith('master_')) && !(k in snapshot)) {
      const val = localStorage.getItem(k);
      if (val !== null) {
        try {
          snapshot[k] = JSON.parse(val);
        } catch {
          snapshot[k] = val;
        }
      }
    }
  }

  return snapshot;
};

/**
 * Menyimpan snapshot dari Google Drive ke dalam LocalStorage
 */
export const applyDatabaseSnapshotToLocalStorage = (snapshot: Record<string, any>): void => {
  if (!snapshot || typeof snapshot !== 'object') return;

  Object.entries(snapshot).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    try {
      const strVal = typeof v === 'string' ? v : JSON.stringify(v);
      localStorage.setItem(k, strVal);
    } catch (e) {
      console.warn(`Failed to set local storage key ${k}:`, e);
    }
  });

  // Dispatch events to notify all active views to refresh
  window.dispatchEvent(new CustomEvent('rsumb_database_synced'));
  window.dispatchEvent(new CustomEvent('rsumb_settings_updated'));
  window.dispatchEvent(new CustomEvent('rsumb_kupon_updated'));
  window.dispatchEvent(new CustomEvent('rsumb_posters_updated'));
  window.dispatchEvent(new CustomEvent('rsumb_staff_updated'));
  window.dispatchEvent(new CustomEvent('rsumb_audit_logs_updated'));
};

// Debounce timer for silent auto-sync
let debounceTimer: any = null;

/**
 * Picu sinkronisasi data lokal ke Google Drive secara silent di latar belakang
 */
export const triggerSilentDriveSync = (delayMs: number = 2500) => {
  if (!isGoogleDriveConnected()) {
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    pushLocalDataToDrive(true).catch((err) => {
      console.warn('Silent Google Drive auto-sync notice:', err);
    });
  }, delayMs);
};

/**
 * Push data lokal ke Google Drive (/RSUMB_Portal_Data/rsumb_database.json)
 */
export const pushLocalDataToDrive = async (
  isSilent: boolean = false
): Promise<{ success: boolean; lastUpdated: string }> => {
  if (!isGoogleDriveConnected()) {
    if (!isSilent) {
      throw new Error('Google Drive belum terhubung. Silakan login terlebih dahulu.');
    }
    return { success: false, lastUpdated: syncState.lastSyncTime || '' };
  }

  try {
    updateSyncState({ status: 'syncing', lastError: null });

    const snapshot = collectLocalDatabaseSnapshot();
    const user = getCachedUser();
    const staffName = user?.displayName || user?.email || 'Admin Pendaftaran RSUMB';

    const res = await syncDatabaseToGoogleDrive(snapshot, staffName);

    const nowIso = new Date().toISOString();
    updateSyncState({
      status: 'synced',
      lastSyncTime: nowIso,
      syncedBy: staffName,
      lastError: null
    });

    return { success: true, lastUpdated: nowIso };
  } catch (err: any) {
    console.error('Failed pushing data to Google Drive:', err);
    const msg = err?.message || 'Gagal menyinkronkan data ke Google Drive.';
    updateSyncState({
      status: 'error',
      lastError: msg
    });
    if (!isSilent) throw err;
    return { success: false, lastUpdated: syncState.lastSyncTime || '' };
  }
};

/**
 * Tarik data dari Google Drive (/RSUMB_Portal_Data/rsumb_database.json) dan pulihkan ke LocalStorage
 */
export const pullDataFromDrive = async (): Promise<{
  success: boolean;
  restoredKeys: number;
  lastUpdated: string;
}> => {
  if (!isGoogleDriveConnected()) {
    throw new Error('Google Drive belum terhubung. Silakan login terlebih dahulu.');
  }

  try {
    updateSyncState({ status: 'syncing', lastError: null });

    const driveRecord = await fetchDatabaseFromGoogleDrive();

    if (!driveRecord || !driveRecord.data) {
      updateSyncState({
        status: 'synced',
        lastError: null
      });
      return {
        success: true,
        restoredKeys: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    applyDatabaseSnapshotToLocalStorage(driveRecord.data);

    const count = Object.keys(driveRecord.data).length;
    updateSyncState({
      status: 'synced',
      lastSyncTime: driveRecord.lastUpdated,
      syncedBy: driveRecord.syncedBy,
      lastError: null
    });

    return {
      success: true,
      restoredKeys: count,
      lastUpdated: driveRecord.lastUpdated
    };
  } catch (err: any) {
    console.error('Failed pulling data from Google Drive:', err);
    const msg = err?.message || 'Gagal memulihkan database dari Google Drive.';
    updateSyncState({
      status: 'error',
      lastError: msg
    });
    throw err;
  }
};

/**
 * Buat Snapshot Backup manual ke folder /RSUMB_Portal_Backups/
 */
export const createDriveBackupSnapshot = async (): Promise<{
  fileId: string;
  fileName: string;
  webViewLink?: string;
}> => {
  if (!isGoogleDriveConnected()) {
    throw new Error('Google Drive belum terhubung. Silakan login terlebih dahulu.');
  }

  const snapshot = collectLocalDatabaseSnapshot();
  const user = getCachedUser();
  const staffName = user?.displayName || user?.email || 'Admin Pendaftaran RSUMB';

  return await saveBackupToGoogleDrive(snapshot, staffName);
};

// Global listener to detect storage events and trigger auto-sync
if (typeof window !== 'undefined') {
  window.addEventListener('rsumb_kupon_saved', () => triggerSilentDriveSync(2000));
  window.addEventListener('rsumb_settings_saved', () => triggerSilentDriveSync(1500));
  window.addEventListener('rsumb_posters_saved', () => triggerSilentDriveSync(2000));
  window.addEventListener('rsumb_documents_saved', () => triggerSilentDriveSync(2000));
  window.addEventListener('rsumb_staff_handover_saved', () => triggerSilentDriveSync(1500));
}
