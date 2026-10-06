/**
 * Modul Pembersihan Cache Otomatis (Auto Cache Cleanup)
 * SIMRS RSU Muhammadiyah Babat (RSUMB)
 *
 * Menghapus data lama di localStorage (seperti log aktivitas audit trail atau data snapshot > 30 hari)
 * setiap kali aplikasi dibuka (app mount), guna menjaga performa portal tetap ringan, cepat, dan responsif.
 */

export interface AutoCleanupConfig {
  enabled: boolean;
  retentionDays: number; // default: 30 hari
  lastCleanedAt: string | null;
  totalCleanedLifetime: number;
  lastCleanedCount: number;
  lastSummary: string;
}

const STORAGE_KEY_CONFIG = 'rsumb_auto_cleanup_config_v1';
const DEFAULT_RETENTION_DAYS = 30;

export const DEFAULT_CLEANUP_CONFIG: AutoCleanupConfig = {
  enabled: true,
  retentionDays: DEFAULT_RETENTION_DAYS,
  lastCleanedAt: null,
  totalCleanedLifetime: 0,
  lastCleanedCount: 0,
  lastSummary: 'Belum pernah dijalankan'
};

export function loadAutoCleanupConfig(): AutoCleanupConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CLEANUP_CONFIG,
        ...parsed
      };
    }
  } catch (e) {
    console.warn('[AutoCacheCleanup] Gagal memuat konfigurasi, menggunakan default:', e);
  }
  return DEFAULT_CLEANUP_CONFIG;
}

export function saveAutoCleanupConfig(config: AutoCleanupConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('rsumb_auto_cleanup_config_updated', { detail: config }));
  } catch (e) {
    console.error('[AutoCacheCleanup] Gagal menyimpan konfigurasi:', e);
  }
}

/**
 * Menghitung penggunaan memori localStorage saat ini
 */
export function getLocalStorageUsage(): {
  usedBytes: number;
  usedKb: number;
  usedMb: string;
  totalKeys: number;
} {
  let totalBytes = 0;
  let totalKeys = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalKeys++;
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2; // perkiraan 2 bytes per char (UTF-16)
      }
    }
  } catch (e) {
    console.warn('[AutoCacheCleanup] Gagal mengukur ukuran localStorage:', e);
  }

  const usedKb = Math.round(totalBytes / 1024);
  const usedMb = (totalBytes / (1024 * 1024)).toFixed(2);

  return {
    usedBytes: totalBytes,
    usedKb,
    usedMb,
    totalKeys
  };
}

/**
 * Menjalankan proses pembersihan cache otomatis.
 * Dijalankan pada App Mount.
 */
export function runAutoCacheCleanup(force: boolean = false): {
  success: boolean;
  cleanedCount: number;
  cleanedLogs: number;
  cleanedSnapshots: number;
  freedBytesApprox: number;
  summary: string;
} {
  const config = loadAutoCleanupConfig();

  // Jika fitur dinonaktifkan dan bukan pemanggilan paksa manual
  if (!config.enabled && !force) {
    return {
      success: true,
      cleanedCount: 0,
      cleanedLogs: 0,
      cleanedSnapshots: 0,
      freedBytesApprox: 0,
      summary: 'Pembersihan cache otomatis dinonaktifkan oleh pengaturan.'
    };
  }

  const now = new Date();
  const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;
  const cutoffTime = now.getTime() - retentionMs;

  let cleanedLogs = 0;
  let cleanedSnapshots = 0;
  let freedChars = 0;

  try {
    // 1. Bersihkan Log Aktivitas & Audit Trail lama (> 30 hari)
    const auditLogsKey = 'rsumb_system_audit_logs_v1';
    const rawAuditLogs = localStorage.getItem(auditLogsKey);
    if (rawAuditLogs) {
      try {
        const logs = JSON.parse(rawAuditLogs);
        if (Array.isArray(logs)) {
          const freshLogs = logs.filter((log: any) => {
            if (!log?.timestamp) return true;
            const logTime = new Date(log.timestamp).getTime();
            // Jika tanggal valid dan lebih lama dari cutoffTime -> hapus
            if (!isNaN(logTime) && logTime < cutoffTime) {
              cleanedLogs++;
              return false;
            }
            return true;
          });

          if (cleanedLogs > 0) {
            const beforeLen = rawAuditLogs.length;
            const afterStr = JSON.stringify(freshLogs);
            freedChars += beforeLen - afterStr.length;
            localStorage.setItem(auditLogsKey, afterStr);
            console.log(`[AutoCacheCleanup] Berhasil membersihkan ${cleanedLogs} log aktivitas lama (> ${config.retentionDays} hari).`);
          }
        }
      } catch (err) {
        console.warn('[AutoCacheCleanup] Gagal memproses audit logs:', err);
      }
    }

    // 2. Bersihkan snapshot cadangan lama atau cache sementara di localStorage
    const snapshotPrefixes = [
      'rsumb_backup_snapshot_',
      'rsumb_temp_snapshot_',
      'rsumb_export_cache_',
      'rsumb_temp_report_',
      'rsumb_auto_backup_temp_'
    ];

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Cek apakah key merupakan snapshot atau cache sementara
      const isSnapshotKey = snapshotPrefixes.some((prefix) => key.startsWith(prefix));
      if (isSnapshotKey) {
        // Cek timestamp dari nama key atau isi value
        let itemTime = 0;
        const timestampMatch = key.match(/(\d{13,})/);
        if (timestampMatch) {
          itemTime = parseInt(timestampMatch[1], 10);
        } else {
          try {
            const itemVal = localStorage.getItem(key);
            if (itemVal) {
              const parsed = JSON.parse(itemVal);
              if (parsed.timestamp || parsed.createdAt || parsed.date) {
                itemTime = new Date(parsed.timestamp || parsed.createdAt || parsed.date).getTime();
              }
            }
          } catch {}
        }

        if (itemTime > 0 && itemTime < cutoffTime) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => {
      const val = localStorage.getItem(key) || '';
      freedChars += key.length + val.length;
      localStorage.removeItem(key);
      cleanedSnapshots++;
    });

    const totalCleaned = cleanedLogs + cleanedSnapshots;
    const freedBytes = freedChars * 2;
    const freedKb = Math.round(freedBytes / 1024);

    const summary = totalCleaned > 0
      ? `Membersihkan ${totalCleaned} item usang (${cleanedLogs} log aktivitas, ${cleanedSnapshots} snapshot cadangan > ${config.retentionDays} hari, hemat ~${freedKb} KB).`
      : `Penyimpanan bersih. Tidak ada data usang (> ${config.retentionDays} hari).`;

    // Perbarui riwayat pembersihan di konfigurasi
    const updatedConfig: AutoCleanupConfig = {
      ...config,
      lastCleanedAt: now.toISOString(),
      totalCleanedLifetime: config.totalCleanedLifetime + totalCleaned,
      lastCleanedCount: totalCleaned,
      lastSummary: summary
    };
    saveAutoCleanupConfig(updatedConfig);

    return {
      success: true,
      cleanedCount: totalCleaned,
      cleanedLogs,
      cleanedSnapshots,
      freedBytesApprox: freedBytes,
      summary
    };
  } catch (error: any) {
    console.error('[AutoCacheCleanup] Terjadi kesalahan saat pembersihan cache:', error);
    return {
      success: false,
      cleanedCount: 0,
      cleanedLogs: 0,
      cleanedSnapshots: 0,
      freedBytesApprox: 0,
      summary: `Gagal menjalankan pembersihan: ${error?.message || 'Error tidak diketahui'}`
    };
  }
}
