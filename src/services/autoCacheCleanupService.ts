/**
 * Auto Cache Cleanup Service - SIMRS RSU Muhammadiyah Babat (RSUMB)
 * Membersihkan data lama di localStorage (seperti log aktivitas, data snapshot > 30 hari,
 * dan cache sementara) secara otomatis pada saat aplikasi dimuat (app mount),
 * guna menjaga performa portal tetap ringan, cepat, dan terhindar dari batasan kuota storage.
 */

import { SYSTEM_AUDIT_LOGS_KEY, pruneLogsOlderThan30Days } from '../data/auditLogData';
import { STORAGE_KEY_NOTIFICATIONS } from '../data/headerData';
import { SystemActivityLog } from '../types/auditLogTypes';
import { SystemNotification } from '../types/headerTypes';

export const AUTO_CLEANUP_CONFIG_KEY = 'rsumb_auto_cleanup_config_v1';
export const DEFAULT_RETENTION_DAYS = 30;

export interface AutoCleanupConfig {
  enabled: boolean;
  retentionDays: number;
  autoCleanOnMount: boolean;
  lastCleanupTime: string | null;
  totalRuns: number;
  lastCleanedItemsCount: number;
  lastCleanedBytesFreed: number;
  cumulativeBytesFreed: number;
}

export interface CleanupResult {
  success: boolean;
  cleanedLogsCount: number;
  cleanedNotifsCount: number;
  cleanedSnapshotsCount: number;
  totalCleanedItems: number;
  bytesFreed: number;
  timestamp: string;
  message: string;
}

export interface StorageUsageStat {
  key: string;
  label: string;
  bytes: number;
  formattedSize: string;
  itemCount?: number;
}

export interface StorageOverview {
  totalBytes: number;
  formattedTotal: string;
  percentQuotaUsed: number; // approx out of 5MB typical browser limit
  totalKeys: number;
  details: StorageUsageStat[];
}

export const loadAutoCleanupConfig = (): AutoCleanupConfig => {
  try {
    const raw = localStorage.getItem(AUTO_CLEANUP_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? true,
        retentionDays: parsed.retentionDays ?? DEFAULT_RETENTION_DAYS,
        autoCleanOnMount: parsed.autoCleanOnMount ?? true,
        lastCleanupTime: parsed.lastCleanupTime || null,
        totalRuns: parsed.totalRuns || 0,
        lastCleanedItemsCount: parsed.lastCleanedItemsCount || 0,
        lastCleanedBytesFreed: parsed.lastCleanedBytesFreed || 0,
        cumulativeBytesFreed: parsed.cumulativeBytesFreed || 0
      };
    }
  } catch (err) {
    console.warn('[AutoCleanup] Gagal memuat konfigurasi:', err);
  }

  return {
    enabled: true,
    retentionDays: DEFAULT_RETENTION_DAYS,
    autoCleanOnMount: true,
    lastCleanupTime: null,
    totalRuns: 0,
    lastCleanedItemsCount: 0,
    lastCleanedBytesFreed: 0,
    cumulativeBytesFreed: 0
  };
};

export const saveAutoCleanupConfig = (config: Partial<AutoCleanupConfig>): AutoCleanupConfig => {
  const current = loadAutoCleanupConfig();
  const updated: AutoCleanupConfig = { ...current, ...config };
  try {
    localStorage.setItem(AUTO_CLEANUP_CONFIG_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rsumb_auto_cleanup_config_updated', { detail: updated }));
  } catch (e) {
    console.error('[AutoCleanup] Gagal menyimpan konfigurasi:', e);
  }
  return updated;
};

/**
 * Menghitung ukuran byte string UTF-16
 */
const getByteLength = (str: string): number => {
  return str.length * 2;
};

/**
 * Format bytes menjadi teks ramah pengguna (B, KB, MB)
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Analisis pemakaian memori localStorage saat ini
 */
export const getStorageOverview = (): StorageOverview => {
  let totalBytes = 0;
  const details: StorageUsageStat[] = [];
  const friendlyNames: Record<string, string> = {
    rsumb_system_audit_logs_v1: 'Log Aktivitas & Audit Trail',
    rsumb_portal_settings: 'Pengaturan Portal & Printer',
    rsumb_kupon_list_v1: 'Data Kupon Fee Mohat',
    rsumb_header_notifications: 'Notifikasi Sistem Admisi',
    rsumb_handover_notes_v1: 'Catatan Operan Shift',
    rsumb_patient_notes_v1: 'Catatan Khusus Pasien (KLL/BPJS)',
    rsumb_elective_surgeries: 'Jadwal Operasi Elektif IBS',
    medcentral_schedules_v5: 'Jadwal Dokter HFIS',
    medcentral_leaves_v5: 'Data Libur Dokter',
    rsumb_letters_v1: 'Surat & Dokumen Master',
    rsumb_master_posters: 'Poster Promo Rumah Sakit'
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || '';
      const size = getByteLength(key) + getByteLength(value);
      totalBytes += size;

      let itemCount: number | undefined = undefined;
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          itemCount = parsed.length;
        } else if (typeof parsed === 'object' && parsed !== null) {
          itemCount = Object.keys(parsed).length;
        }
      } catch {}

      details.push({
        key,
        label: friendlyNames[key] || key,
        bytes: size,
        formattedSize: formatBytes(size),
        itemCount
      });
    }
  } catch (err) {
    console.warn('[AutoCleanup] Error inspecting localStorage:', err);
  }

  // Sort descending by size
  details.sort((a, b) => b.bytes - a.bytes);

  const approxQuota = 5 * 1024 * 1024; // 5 MB typical browser quota
  const percentQuotaUsed = Math.min(100, Number(((totalBytes / approxQuota) * 100).toFixed(1)));

  return {
    totalBytes,
    formattedTotal: formatBytes(totalBytes),
    percentQuotaUsed,
    totalKeys: details.length,
    details
  };
};

/**
 * Eksekusi Pembersihan Cache Otomatis:
 * 1. Log Aktivitas (Audit Trail) > retentionDays (default: 30 hari)
 * 2. Notifikasi sistem > retentionDays
 * 3. File snapshot / backup lama bertanggal > retentionDays
 * 4. Cache thumbnail / temporary keys yang sudah kadaluarsa
 */
export const runAutoCacheCleanup = (force: boolean = false): CleanupResult => {
  const config = loadAutoCleanupConfig();
  const now = new Date();
  const nowMs = now.getTime();
  const cutoffTime = nowMs - config.retentionDays * 24 * 60 * 60 * 1000;

  // Jika tidak dipaksa dan sudah dibersihkan hari ini, lewati agar efisien
  if (!force && config.lastCleanupTime) {
    const lastCleanupDate = new Date(config.lastCleanupTime).toDateString();
    if (lastCleanupDate === now.toDateString()) {
      return {
        success: true,
        cleanedLogsCount: 0,
        cleanedNotifsCount: 0,
        cleanedSnapshotsCount: 0,
        totalCleanedItems: 0,
        bytesFreed: 0,
        timestamp: now.toISOString(),
        message: 'Cache sudah dibersihkan hari ini. Data lokal dalam kondisi optimal.'
      };
    }
  }

  let cleanedLogsCount = 0;
  let cleanedNotifsCount = 0;
  let cleanedSnapshotsCount = 0;
  let bytesFreed = 0;

  try {
    // 1. Bersihkan Log Aktivitas & Audit Trail > 30 Hari
    const rawLogs = localStorage.getItem(SYSTEM_AUDIT_LOGS_KEY);
    if (rawLogs) {
      const initialBytes = getByteLength(rawLogs);
      const parsedLogs: SystemActivityLog[] = JSON.parse(rawLogs);
      if (Array.isArray(parsedLogs)) {
        const retainedLogs = pruneLogsOlderThan30Days(parsedLogs, config.retentionDays);
        cleanedLogsCount = parsedLogs.length - retainedLogs.length;
        if (cleanedLogsCount > 0) {
          const newJson = JSON.stringify(retainedLogs);
          localStorage.setItem(SYSTEM_AUDIT_LOGS_KEY, newJson);
          bytesFreed += Math.max(0, initialBytes - getByteLength(newJson));
        }
      }
    }

    // 2. Bersihkan Notifikasi Sistem > 30 Hari
    const rawNotifs = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (rawNotifs) {
      const initialBytes = getByteLength(rawNotifs);
      const parsedNotifs: SystemNotification[] = JSON.parse(rawNotifs);
      if (Array.isArray(parsedNotifs)) {
        const retainedNotifs = parsedNotifs.filter((n: any) => {
          try {
            const timeVal = n.time || n.timestamp;
            if (!timeVal) return true;
            const time = new Date(timeVal).getTime();
            if (isNaN(time)) return true;
            return time >= cutoffTime;
          } catch {
            return true;
          }
        });
        cleanedNotifsCount = parsedNotifs.length - retainedNotifs.length;
        if (cleanedNotifsCount > 0) {
          const newJson = JSON.stringify(retainedNotifs);
          localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, newJson);
          bytesFreed += Math.max(0, initialBytes - getByteLength(newJson));
        }
      }
    }

    // 3. Bersihkan Data Snapshot & Kunci Cache Temporer Lama
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isOldSnapshotKey =
        key.startsWith('rsumb_snapshot_') ||
        key.startsWith('rsumb_temp_') ||
        key.startsWith('medcentral_temp_') ||
        key.startsWith('rsumb_backup_old_');

      if (isOldSnapshotKey) {
        // Cek timestamp dari nama key atau isi
        const timeMatch = key.match(/(\d{10,13})/);
        if (timeMatch) {
          const keyTime = parseInt(timeMatch[1], 10);
          if (keyTime < cutoffTime) {
            keysToRemove.push(key);
          }
        } else {
          // Cek tanggal di dalam isi JSON
          try {
            const val = localStorage.getItem(key) || '';
            const parsed = JSON.parse(val);
            const itemTime = new Date(parsed.timestamp || parsed.date || parsed.createdAt || 0).getTime();
            if (itemTime > 0 && itemTime < cutoffTime) {
              keysToRemove.push(key);
            }
          } catch {
            // Bukan json berwaktu, biarkan
          }
        }
      }
    }

    keysToRemove.forEach((key) => {
      const val = localStorage.getItem(key) || '';
      bytesFreed += getByteLength(key) + getByteLength(val);
      localStorage.removeItem(key);
      cleanedSnapshotsCount++;
    });

    const totalCleanedItems = cleanedLogsCount + cleanedNotifsCount + cleanedSnapshotsCount;

    // Simpan riwayat pembersihan ke config
    saveAutoCleanupConfig({
      lastCleanupTime: now.toISOString(),
      totalRuns: (config.totalRuns || 0) + 1,
      lastCleanedItemsCount: totalCleanedItems,
      lastCleanedBytesFreed: bytesFreed,
      cumulativeBytesFreed: (config.cumulativeBytesFreed || 0) + bytesFreed
    });

    const result: CleanupResult = {
      success: true,
      cleanedLogsCount,
      cleanedNotifsCount,
      cleanedSnapshotsCount,
      totalCleanedItems,
      bytesFreed,
      timestamp: now.toISOString(),
      message:
        totalCleanedItems > 0
          ? `Berhasil membersihkan ${totalCleanedItems} entri data lawas (> ${config.retentionDays} hari), menghemat ${formatBytes(bytesFreed)} memori lokal!`
          : `Pemeriksaan selesai. Seluruh data lokal mutakhir dan berada dalam rentang ${config.retentionDays} hari.`
    };

    console.log('[AutoCleanup]', result.message);
    return result;
  } catch (err: any) {
    console.error('[AutoCleanup] Terjadi kesalahan saat pembersihan:', err);
    return {
      success: false,
      cleanedLogsCount,
      cleanedNotifsCount,
      cleanedSnapshotsCount,
      totalCleanedItems: 0,
      bytesFreed: 0,
      timestamp: now.toISOString(),
      message: `Gagal menjalankan pembersihan cache: ${err?.message || 'Kesalahan sistem'}`
    };
  }
};
