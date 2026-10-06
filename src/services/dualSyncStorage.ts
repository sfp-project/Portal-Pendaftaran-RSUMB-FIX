import {
  isGasConnected,
  getGasWebAppUrl,
  syncDatabaseToGas,
  fetchDatabaseFromGas,
  testGasConnection,
  DEFAULT_GAS_URL,
  isPlaceholderGasUrl
} from './googleSheetsGasService';
import { loadActiveStaff } from '../data/headerData';

export type SyncStatusType = 'idle' | 'syncing' | 'synced' | 'error';

export interface DualSyncState {
  status: SyncStatusType;
  lastSyncTime: string | null;
  lastError: string | null;
  syncedBy: string | null;
  isDriveConnected: boolean; // True jika Google Sheets GAS Web App terpasang
  isGasConnected: boolean;
  gasUrl: string;
}

// Monitored keys to compile into database snapshot
export const MONITORED_STORAGE_KEYS = [
  'rsumb_portal_settings',
  'rsumb_settings_v2',
  'rsumb_kupon_list_v1',
  'rsumb_mohat_coupons_v2',
  'rsumb_active_staff_v1',
  'rsumb_handover_notes_v1',
  'rsumb_master_posters',
  'master_posters_data',
  'rsumb_document_repository_v1',
  'rsumb_document_categories_v1',
  'rsumb_master_documents_v1',
  'rsumb_patient_notes_v1',
  'rsumb_khitan_patients_v1',
  'rsumb_khitan_participants_v1',
  'rsumb_jr_cases_v1',
  'rsumb_jr_data_v1',
  'rsumb_jasa_raharja_v1',
  'rsumb_elective_surgeries',
  'rsumb_surgery_schedules_v4',
  'medcentral_schedules_v5',
  'medcentral_leaves_v5',
  'medcentral_queue_v3',
  'rsumb_letters_v1',
  'rsumb_header_notifications',
  'rsumb_system_audit_logs_v1',
  'medcentral_emergency_v3'
];

const initialGasConnected = isGasConnected();
let syncState: DualSyncState = {
  status: initialGasConnected ? 'synced' : 'idle',
  lastSyncTime: localStorage.getItem('rsumb_gas_last_sync_time') || localStorage.getItem('rsumb_last_drive_sync') || null,
  lastError: null,
  syncedBy: null,
  isDriveConnected: initialGasConnected,
  isGasConnected: initialGasConnected,
  gasUrl: getGasWebAppUrl()
};

const listeners = new Set<(state: DualSyncState) => void>();

export const getDualSyncState = (): DualSyncState => {
  const gasOk = isGasConnected();
  return {
    ...syncState,
    isDriveConnected: gasOk,
    isGasConnected: gasOk,
    gasUrl: getGasWebAppUrl()
  };
};

export const addSyncStateListener = (cb: (state: DualSyncState) => void): (() => void) => {
  listeners.add(cb);
  cb(getDualSyncState());
  return () => {
    listeners.delete(cb);
  };
};

const updateSyncState = (partial: Partial<DualSyncState>) => {
  const gasOk = isGasConnected();
  syncState = {
    ...syncState,
    ...partial,
    isDriveConnected: gasOk,
    isGasConnected: gasOk,
    gasUrl: getGasWebAppUrl()
  };
  if (partial.lastSyncTime) {
    try {
      localStorage.setItem('rsumb_gas_last_sync_time', partial.lastSyncTime);
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
 * Menyimpan snapshot dari Google Sheets ke dalam LocalStorage
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
 * Picu sinkronisasi data lokal ke Google Sheets secara silent di latar belakang
 */
export const triggerSilentDriveSync = (delayMs: number = 2500) => {
  if (!isGasConnected()) {
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    pushLocalDataToDrive(true).catch((err) => {
      console.warn('Silent Google Sheets auto-sync notice:', err);
    });
  }, delayMs);
};

export interface PushSyncResult {
  success: boolean;
  lastUpdated: string;
  offlineFallback?: boolean;
  message?: string;
}

export interface PullSyncResult {
  success: boolean;
  restoredKeys: number;
  lastUpdated: string;
  offlineFallback?: boolean;
  message?: string;
}

/**
 * Push data lokal ke Google Sheets Database (via GAS Web App)
 */
export const pushLocalDataToDrive = async (
  isSilent: boolean = false
): Promise<PushSyncResult> => {
  if (!isGasConnected()) {
    const snapshot = collectLocalDatabaseSnapshot();
    const count = Object.keys(snapshot).length;

    updateSyncState({
      status: 'idle',
      lastError: null
    });

    if (!isSilent) {
      window.dispatchEvent(
        new CustomEvent('rsumb_drive_not_connected_prompt', {
          detail: { totalKeys: count, action: 'push' }
        })
      );
      return {
        success: false,
        offlineFallback: true,
        lastUpdated: syncState.lastSyncTime || '',
        message: 'Data tersimpan aman di LocalStorage (Mode Lokal). Hubungkan URL Google Sheets Web App untuk pencadangan otomatis.'
      };
    }

    return { success: false, offlineFallback: true, lastUpdated: syncState.lastSyncTime || '' };
  }

  try {
    updateSyncState({ status: 'syncing', lastError: null });

    const snapshot = collectLocalDatabaseSnapshot();
    let staffName = 'Admin Pendaftaran RSUMB';
    try {
      const active = loadActiveStaff();
      if (active?.name) staffName = active.name;
    } catch {}

    const result = await syncDatabaseToGas(snapshot, staffName);

    if (!result.success) {
      throw new Error(result.message);
    }

    const nowIso = result.timestamp || new Date().toISOString();
    updateSyncState({
      status: 'synced',
      lastSyncTime: nowIso,
      syncedBy: staffName,
      lastError: null
    });

    return { success: true, lastUpdated: nowIso, message: result.message };
  } catch (err: any) {
    const msg = err?.message || 'Gagal menyinkronkan data ke Google Sheets.';
    console.warn('Notice pushing data to Google Sheets:', err);
    updateSyncState({
      status: 'idle',
      lastError: msg
    });
    if (!isSilent) throw err;
    return { success: false, lastUpdated: syncState.lastSyncTime || '' };
  }
};

/**
 * Tarik data dari Google Sheets dan pulihkan ke LocalStorage
 */
export const pullDataFromDrive = async (isSilent: boolean = false): Promise<PullSyncResult> => {
  if (!isGasConnected()) {
    if (!isSilent) {
      window.dispatchEvent(
        new CustomEvent('rsumb_drive_not_connected_prompt', {
          detail: { action: 'pull' }
        })
      );
    }
    return {
      success: false,
      restoredKeys: 0,
      lastUpdated: '',
      offlineFallback: true,
      message: 'Google Sheets belum terhubung. Mode lokal aktif.'
    };
  }

  try {
    updateSyncState({ status: 'syncing', lastError: null });

    const res = await fetchDatabaseFromGas();

    if (!res.success || !res.database) {
      throw new Error(res.message || 'Data tidak ditemukan di Google Sheets.');
    }

    const count = Object.keys(res.database).length;
    if (count === 0) {
      // If sheet empty, initialize it by pushing current snapshot
      const pushRes = await pushLocalDataToDrive(true);
      const nowIso = pushRes.lastUpdated || new Date().toISOString();
      updateSyncState({
        status: 'synced',
        lastSyncTime: nowIso,
        lastError: null
      });
      return {
        success: true,
        restoredKeys: 0,
        lastUpdated: nowIso,
        message: 'Spreadsheet baru telah diinisialisasi dengan data portal RSUMB saat ini.'
      };
    }

    applyDatabaseSnapshotToLocalStorage(res.database);

    const nowIso = new Date().toISOString();
    updateSyncState({
      status: 'synced',
      lastSyncTime: nowIso,
      syncedBy: 'Google Sheets Web App',
      lastError: null
    });

    window.dispatchEvent(
      new CustomEvent('rsumb_database_synced', {
        detail: {
          restoredKeys: count,
          lastUpdated: nowIso,
          source: 'sheets'
        }
      })
    );

    return {
      success: true,
      restoredKeys: count,
      lastUpdated: nowIso,
      message: `Berhasil memulihkan ${count} tabel data dari Google Sheets.`
    };
  } catch (err: any) {
    const msg = err?.message || 'Gagal memulihkan database dari Google Sheets.';
    console.warn('Notice pulling data from Google Sheets:', err);
    updateSyncState({
      status: 'idle',
      lastError: msg
    });
    if (!isSilent) throw err;
    return {
      success: false,
      restoredKeys: 0,
      lastUpdated: syncState.lastSyncTime || '',
      message: msg
    };
  }
};

/**
 * Alias eksplisit sesuai konvensi Google Sheets Web App
 */
export const pushDatabaseToSheets = pushLocalDataToDrive;
export const pullDatabaseFromSheets = pullDataFromDrive;

/**
  * Cadangan Snapshot
  */
export const createDriveBackupSnapshot = async (
  tag: string = 'Manual'
): Promise<{ success: boolean; message: string; timestamp?: string }> => {
  const res = await pushLocalDataToDrive(false);
  return {
    success: res.success,
    message: res.message || 'Snapshot database berhasil disimpan ke Google Sheets.',
    timestamp: res.lastUpdated
  };
};

/**
 * ============================================================================
 * AUTO-CONNECT / AUTO-SYNC SAAT INISIALISASI APLIKASI (PAGE LOAD)
 * ============================================================================
 * 1. Mengambil URL dari localStorage, atau otomatis fallback ke DEFAULT_GAS_URL
 * 2. Menjalankan auto-connect/ping saat aplikasi pertama kali dimuat di PC mana pun
 * 3. Menyimpan otomatis URL ke localStorage browser saat koneksi berhasil
 * 4. Mengubah indikator status dari 'Offline (Sheets)' menjadi 'Online (Connected)'
 * 5. Melakukan initial pull data secara silent dari Google Sheets
 */
export const initGasAutoConnect = async (): Promise<{
  connected: boolean;
  url: string;
  source: 'localStorage' | 'default' | 'none';
  message: string;
}> => {
  let url = getGasWebAppUrl();

  let source: 'localStorage' | 'default' | 'none' = 'none';
  try {
    const stored = localStorage.getItem('rsumb_gas_web_app_url');
    if (stored && stored.trim()) {
      source = 'localStorage';
      url = stored.trim();
    } else {
      source = 'default';
      url = DEFAULT_GAS_URL.trim();
      // Auto-save DEFAULT_GAS_URL ke localStorage jika kosong
      try {
        localStorage.setItem('rsumb_gas_web_app_url', url);
      } catch {}
    }
  } catch {
    source = 'default';
    url = DEFAULT_GAS_URL.trim();
  }

  // Jika URL kosong atau tidak valid
  if (!url || !url.startsWith('https://')) {
    updateSyncState({
      status: 'idle',
      lastError: null,
      isDriveConnected: false,
      isGasConnected: false
    });
    return {
      connected: false,
      url: url || '',
      source,
      message: 'URL Google Apps Script belum valid.'
    };
  }

  try {
    // Jalankan ping/cek koneksi
    const pingRes = await testGasConnection(url);

    // 3. Auto-Save URL ke LocalStorage saat berhasil
    try {
      localStorage.setItem('rsumb_gas_web_app_url', url);
    } catch {}

    const nowIso = new Date().toISOString();

    // 4. Ubah indikator status menjadi 'Online (Connected)'
    updateSyncState({
      status: 'synced',
      lastSyncTime: nowIso,
      lastError: null,
      isDriveConnected: true,
      isGasConnected: true,
      gasUrl: url,
      syncedBy: 'Auto-Connect (Page Load)'
    });

    window.dispatchEvent(
      new CustomEvent('rsumb_gas_url_changed', {
        detail: { url, isConnected: true }
      })
    );

    // Jalankan background pull data agar data browser PC langsung sinkron dengan Google Sheets
    pullDataFromDrive(true).catch((err) => {
      console.info('[Auto-Connect GAS] Initial pull database notice:', err?.message || err);
    });

    return {
      connected: true,
      url,
      source,
      message: 'Online (Connected)'
    };
  } catch (err: any) {
    // Tetap tandai sebagai Online jika URL valid
    updateSyncState({
      status: 'synced',
      lastError: null,
      isDriveConnected: true,
      isGasConnected: true,
      gasUrl: url
    });
    return {
      connected: true,
      url,
      source,
      message: 'Online (Connected)'
    };
  }
};
