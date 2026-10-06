import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Cloud,
  CloudOff,
  CheckCircle2,
  AlertCircle,
  Activity,
  Radio,
  Wifi
} from 'lucide-react';
import {
  getDualSyncState,
  addSyncStateListener,
  pushDatabaseToSheets,
  initGasAutoConnect,
  DualSyncState
} from '../../services/dualSyncStorage';
import { isGasConnected, testGasConnection } from '../../services/googleSheetsGasService';

interface GoogleDriveSyncBadgeProps {
  onOpenSettings?: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// Official Google Sheets Logo Icon
export const GoogleSheetsLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4 shrink-0" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M37 6H19L7 18V42C7 43.1 7.9 44 9 44H37C38.1 44 39 43.1 39 42V8C39 6.9 38.1 6 37 6Z" fill="#0F9D58"/>
    <path d="M19 6L7 18H19V6Z" fill="#87CEAC"/>
    <path d="M14 26H34V29H14V26Z" fill="white"/>
    <path d="M14 32H34V35H14V32Z" fill="white"/>
    <path d="M22 23V38H25V23H22Z" fill="#0F9D58"/>
  </svg>
);

export const GoogleDriveLogo = GoogleSheetsLogo;

export const GoogleDriveSyncBadge: React.FC<GoogleDriveSyncBadgeProps> = ({
  showToast
}) => {
  const [syncState, setSyncState] = useState<DualSyncState>(() => getDualSyncState());
  const [isSyncingAction, setIsSyncingAction] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  // Subscribe to sync state changes & URL changes
  useEffect(() => {
    const unsubSync = addSyncStateListener((state) => {
      setSyncState(state);
    });

    const handleUrlChanged = () => {
      setSyncState(getDualSyncState());
    };

    window.addEventListener('rsumb_gas_url_changed', handleUrlChanged);

    return () => {
      unsubSync();
      window.removeEventListener('rsumb_gas_url_changed', handleUrlChanged);
    };
  }, []);

  const isConnected = isGasConnected();
  const isSyncing = syncState.status === 'syncing' || isSyncingAction;
  const isError = syncState.status === 'error';

  // Format exact last sync time
  const formatTimeOnly = (iso?: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return null;
    }
  };

  const formattedTimeOnly = formatTimeOnly(syncState.lastSyncTime);

  // Tooltip text
  const tooltipText = isSyncing
    ? 'Sedang menyinkronkan data ke Google Sheets...'
    : isConnected && !isError
    ? `Google Sheets: 🟢 Online / Connected (Sheets) • Terhubung & Tersinkron (Terakhir: ${formattedTimeOnly || 'Baru saja'}) • Klik untuk sync manual`
    : 'Google Sheets: 🔴 Offline (Sheets) • Belum Terhubung • Klik untuk menghubungkan URL Web App';

  // Handling badge click
  const handleBadgeClick = async () => {
    if (!isGasConnected()) {
      window.dispatchEvent(
        new CustomEvent('rsumb_drive_not_connected_prompt', {
          detail: { action: 'configure_gas' }
        })
      );
      return;
    }

    setIsSyncingAction(true);
    try {
      const res = await pushDatabaseToSheets(false);
      if (res.success) {
        showToast?.('Data portal berhasil disinkronkan ke Google Sheets!', 'success');
        setSyncState(prev => ({
          ...prev,
          status: 'synced',
          lastError: null
        }));
      }
    } catch (err: any) {
      showToast?.(`Gagal menyinkronkan: ${err?.message}`, 'error');
    } finally {
      setIsSyncingAction(false);
    }
  };

  // Manual ping test to GAS Web App backend
  const handleManualPing = async () => {
    setIsPinging(true);
    const startMs = Date.now();
    try {
      const pingResult = await testGasConnection();
      const durationMs = Date.now() - startMs;

      if (pingResult.success) {
        showToast?.(`🟢 Ping Berhasil: Google Sheets Web App terhubung (${durationMs} ms)`, 'success');
        setSyncState(getDualSyncState());
      } else {
        // Attempt auto-reconnect
        const reconnect = await initGasAutoConnect();
        if (reconnect.connected) {
          showToast?.(`🟢 Terhubung Kembali: Google Sheets Online (${durationMs} ms)`, 'success');
        } else {
          showToast?.(`🔴 Ping Gagal: ${pingResult.message || 'Tidak dapat menjangkau server GAS'}`, 'error');
        }
      }
    } catch (err: any) {
      showToast?.(`🔴 Ping Gagal: ${err?.message || 'Koneksi terputus'}`, 'error');
    } finally {
      setIsPinging(false);
    }
  };

  // Dinamika UI: Hijau (Sukses), Kuning (Syncing), Merah (Error/Offline)
  const getBadgeStyle = () => {
    if (isSyncing) {
      return 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300 shadow-amber-500/10';
    }
    if (!isConnected || isError) {
      return 'bg-rose-50 hover:bg-rose-100 text-rose-950 border-rose-300 shadow-rose-500/10';
    }
    return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 shadow-emerald-500/10';
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Main Status & Sync Badge Button - Ultra Compact Badge */}
      <button
        type="button"
        onClick={handleBadgeClick}
        disabled={isSyncing}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium border transition-all cursor-pointer shadow-2xs shrink-0 ${
          isSyncing
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : !isConnected || isError
            ? 'bg-rose-50 text-rose-800 border-rose-300'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
        }`}
        title={tooltipText}
        aria-label="Status Sinkronisasi Google Sheets"
      >
        {isSyncing ? (
          <>
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-spin"></span>
            <span>Syncing</span>
          </>
        ) : !isConnected || isError ? (
          <>
            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
            <span>Offline</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Online</span>
          </>
        )}
      </button>

      {/* Compact Ping Test Button (Hanya tampil di layar monitor sangat lebar) */}
      <button
        type="button"
        onClick={handleManualPing}
        disabled={isPinging || isSyncing}
        className="hidden xl:flex h-7 px-2 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all active:scale-95 cursor-pointer items-center gap-1 disabled:opacity-50 shrink-0 text-xs font-medium"
        title="Tes respon koneksi server Google Sheets (Ping)"
        aria-label="Tes Koneksi (Ping)"
      >
        <Radio className={`w-3 h-3 ${isPinging ? 'text-emerald-600 animate-spin' : 'text-emerald-700'}`} />
        <span className="text-[10.5px]">Ping</span>
      </button>
    </div>
  );
};
