import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Cloud,
  CloudOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  getDualSyncState,
  addSyncStateListener,
  pushDatabaseToSheets,
  DualSyncState
} from '../../services/dualSyncStorage';
import { isGasConnected } from '../../services/googleSheetsGasService';

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
    ? `Google Sheets: 🟢 Terhubung & Tersinkron (Terakhir: ${formattedTimeOnly || 'Baru saja'}) • Klik untuk sync manual`
    : 'Google Sheets: 🔴 Offline / Belum Terhubung • Klik untuk menghubungkan URL Web App';

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
    <button
      type="button"
      onClick={handleBadgeClick}
      disabled={isSyncing}
      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs group shrink-0 ${getBadgeStyle()}`}
      title={tooltipText}
      aria-label="Status Sinkronisasi Google Sheets"
    >
      {/* Dynamic Cloud Icon */}
      {isSyncing ? (
        <div className="relative flex items-center justify-center">
          <Cloud className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
          <RefreshCw className="w-2.5 h-2.5 text-amber-800 animate-spin absolute" />
        </div>
      ) : !isConnected || isError ? (
        <CloudOff className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
      ) : (
        <Cloud className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
      )}

      {/* Label & Status Dot */}
      <div className="flex items-center gap-1.5 min-w-0">
        {isSyncing ? (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="hidden sm:inline font-bold text-[11px] truncate">
              🟡 Syncing...
            </span>
            <span className="inline sm:hidden font-bold text-[11px]">
              🟡 Sync
            </span>
          </>
        ) : !isConnected || isError ? (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span className="hidden sm:inline font-bold text-[11px] truncate">
              🔴 Offline (Sheets)
            </span>
            <span className="inline sm:hidden font-bold text-[11px]">
              🔴 Offline
            </span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline font-bold text-[11px] truncate">
              🟢 Sheets Sukses
            </span>
            <span className="inline sm:hidden font-bold text-[11px]">
              🟢 Terhubung
            </span>
          </>
        )}

        {/* Timestamp */}
        {formattedTimeOnly && isConnected && !isSyncing && !isError && (
          <span className="text-[10px] text-emerald-800 font-mono hidden xl:inline">
            ({formattedTimeOnly})
          </span>
        )}
      </div>
    </button>
  );
};
