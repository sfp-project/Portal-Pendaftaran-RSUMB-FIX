/**
 * ============================================================================
 * GOOGLE SHEETS WEB APP SERVICE - PORTAL SIMRS RSUD/RSU MUHAMMADIYAH BABAT
 * ============================================================================
 * Integrasi Google Sheets berbasis Google Apps Script (GAS) Web App dengan Fetch API:
 * - mode: 'no-cors' untuk pengiriman POST data besar tanpa hambatan CORS preflight
 * - headers: { 'Content-Type': 'text/plain' }
 * - Ringan, andal, tanpa autentikasi OAuth rumit yang gampang terputus
 */

import {
  pushLocalDataToDrive,
  pullDataFromDrive,
  collectLocalDatabaseSnapshot,
  applyDatabaseSnapshotToLocalStorage,
  getDualSyncState,
  addSyncStateListener
} from './dualSyncStorage';
import { loadActiveStaff } from '../data/headerData';

const STORAGE_KEY_GAS_URL = 'rsumb_gas_web_app_url';
const STORAGE_KEY_LAST_SYNC = 'rsumb_gas_last_sync_time';

let cachedGasUrl: string | null = null;

/**
 * Mendapatkan URL Google Apps Script Web App yang tersimpan
 */
export const getGasWebAppUrl = (): string => {
  if (cachedGasUrl) return cachedGasUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GAS_URL);
    if (stored && stored.trim()) {
      cachedGasUrl = stored.trim();
      return cachedGasUrl;
    }
    const envUrl =
      (import.meta as any).env?.VITE_GAS_WEB_APP_URL ||
      (import.meta as any).env?.VITE_DATABASE_WEB_APP_URL;
    if (envUrl && typeof envUrl === 'string') {
      cachedGasUrl = envUrl.trim();
      return cachedGasUrl;
    }
  } catch {}
  return '';
};

/**
 * Menyimpan konfigurasi URL Google Apps Script Web App
 */
export const setGasWebAppUrl = (url: string): void => {
  const clean = (url || '').trim();
  cachedGasUrl = clean || null;
  try {
    if (clean) {
      localStorage.setItem(STORAGE_KEY_GAS_URL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_GAS_URL);
    }
  } catch {}

  window.dispatchEvent(
    new CustomEvent('rsumb_gas_url_changed', {
      detail: { url: clean, isConnected: !!clean }
    })
  );
};

/**
 * Memeriksa apakah URL Google Apps Script terkonfigurasi
 */
export const isGasConnected = (): boolean => {
  const url = getGasWebAppUrl();
  return !!(url && url.startsWith('https://script.google.com/macros/s/'));
};

/**
 * Menguji koneksi ke Google Apps Script Web App
 */
export const testGasConnection = async (
  customUrl?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const targetUrl = (customUrl || getGasWebAppUrl()).trim();
  if (!targetUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script Web App belum diisi.'
    };
  }

  if (!targetUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'URL tidak valid. Format URL harus diawali dengan https://script.google.com/macros/s/...'
    };
  }

  try {
    const pingUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=ping&_t=' + Date.now();
    const res = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data && (data.status === 'success' || data.status === 'ok' || data.message === 'Connected' || data.spreadsheetName)) {
      return {
        success: true,
        message: data.message || 'Koneksi Berhasil! Terhubung ke Google Sheets Web App.',
        data
      };
    }

    return {
      success: true,
      message: 'Koneksi Berhasil! Respon diterima dari Google Sheets Web App.',
      data
    };
  } catch (err: any) {
    // Coba fallback via proxy server jika direct fetch diblokir oleh browser
    try {
      const pingUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=ping&_t=' + Date.now();
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: pingUrl,
          method: 'GET'
        })
      });
      if (proxyRes.ok) {
        const pData = await proxyRes.json();
        return {
          success: true,
          message: 'Koneksi Berhasil via Server Proxy!',
          data: pData
        };
      }
    } catch {}

    return {
      success: false,
      message: `Gagal terhubung ke Google Sheets: ${err?.message || 'Pastikan deployment Web App disetel ke "Anyone" (Siapa saja).'}`
    };
  }
};

/**
 * Mengirim (Push/Sync) seluruh database lokal ke Google Sheets
 * Menggunakan mode 'no-cors' dan header 'Content-Type': 'text/plain'
 */
export const syncDatabaseToGas = async (
  database: Record<string, any>,
  staffName: string = 'Admin SIMRS RSUMB',
  customUrl?: string
): Promise<{ success: boolean; message: string; timestamp?: string }> => {
  const targetUrl = (customUrl || getGasWebAppUrl()).trim();
  if (!targetUrl) {
    return { success: false, message: 'URL Google Apps Script belum disetel.' };
  }

  const payload = {
    action: 'saveDatabase',
    staffName: staffName,
    timestamp: new Date().toISOString(),
    database: database
  };

  try {
    // Gunakan Fetch API dengan mode no-cors dan Content-Type text/plain
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowIso);
    } catch {}

    return {
      success: true,
      message: 'Database berhasil dikirim dan disinkronkan ke Google Sheets.',
      timestamp: nowIso
    };
  } catch (err: any) {
    // Fallback: Proxy server
    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          method: 'POST',
          payload
        })
      });
      if (proxyRes.ok) {
        const nowIso = new Date().toISOString();
        try {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowIso);
        } catch {}
        return {
          success: true,
          message: 'Database berhasil disinkronkan via server proxy.',
          timestamp: nowIso
        };
      }
    } catch {}

    return {
      success: false,
      message: `Gagal sinkronisasi ke Google Sheets: ${err?.message || 'Kesalahan jaringan.'}`
    };
  }
};

/**
 * Menarik (Pull) seluruh database dari Google Sheets
 */
export const fetchDatabaseFromGas = async (
  customUrl?: string
): Promise<{ success: boolean; database?: Record<string, any>; kupons?: any[]; message?: string }> => {
  const targetUrl = (customUrl || getGasWebAppUrl()).trim();
  if (!targetUrl) {
    return { success: false, message: 'URL Google Apps Script belum disetel.' };
  }

  try {
    const fetchUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=getData&_t=' + Date.now();
    const res = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const result = await res.json();
    if (result && result.status === 'success') {
      return {
        success: true,
        database: result.database || {},
        kupons: result.kupons || [],
        message: 'Data berhasil dimuat dari Google Sheets.'
      };
    }

    return {
      success: false,
      message: result?.message || 'Gagal memuat data dari Google Sheets.'
    };
  } catch (err: any) {
    // Fallback via proxy
    try {
      const fetchUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=getData&_t=' + Date.now();
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: fetchUrl,
          method: 'GET'
        })
      });
      if (proxyRes.ok) {
        const pData = await proxyRes.json();
        if (pData && pData.status === 'success') {
          return {
            success: true,
            database: pData.database || {},
            kupons: pData.kupons || [],
            message: 'Data berhasil dimuat dari Google Sheets via proxy.'
          };
        }
      }
    } catch {}

    return {
      success: false,
      message: `Gagal memuat data: ${err?.message || 'Periksa koneksi internet dan URL deployment.'}`
    };
  }
};

/**
 * ============================================================================
 * EXPLICIT PRIMARY API (pushDatabaseToSheets & pullDatabaseFromSheets)
 * ============================================================================
 */

/**
 * Mengirim seluruh data lokal (localStorage) ke Google Sheets
 */
export const pushDatabaseToSheets = async (
  silent: boolean = false
): Promise<{ success: boolean; lastUpdated: string; message?: string; offlineFallback?: boolean }> => {
  return await pushLocalDataToDrive(silent);
};

/**
 * Menarik seluruh data dari Google Sheets dan memulihkan ke LocalStorage
 */
export const pullDatabaseFromSheets = async (
  silent: boolean = false
): Promise<{ success: boolean; restoredKeys: number; lastUpdated: string; message?: string; offlineFallback?: boolean }> => {
  return await pullDataFromDrive(silent);
};

export {
  collectLocalDatabaseSnapshot,
  applyDatabaseSnapshotToLocalStorage,
  getDualSyncState,
  addSyncStateListener
};
