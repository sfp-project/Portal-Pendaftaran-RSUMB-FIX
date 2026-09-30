import React, { useState, useEffect } from 'react';
import {
  RefreshCw
} from 'lucide-react';
import {
  googleSignIn,
  addAuthListener,
  isGoogleDriveConnected,
  getCachedUser
} from '../../services/googleAuthService';
import {
  getDualSyncState,
  addSyncStateListener,
  pushLocalDataToDrive,
  pullDataFromDrive,
  DualSyncState
} from '../../services/dualSyncStorage';

interface GoogleDriveSyncBadgeProps {
  onOpenSettings?: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// Official Google Drive logo icon
export const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4 shrink-0" }) => (
  <svg className={className} viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
    <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5l16.15-28z" fill="#00AC47"/>
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.9 10.2 7.85 13.6z" fill="#EA4335"/>
    <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2L43.65 25z" fill="#00832D"/>
    <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2L59.8 53z" fill="#2684FC"/>
    <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5l-12.7-22z" fill="#FFBA00"/>
  </svg>
);

export const GoogleDriveSyncBadge: React.FC<GoogleDriveSyncBadgeProps> = ({
  showToast
}) => {
  const [syncState, setSyncState] = useState<DualSyncState>(() => getDualSyncState());
  const [, setCurrentUser] = useState(() => getCachedUser());
  const [isSyncingAction, setIsSyncingAction] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Subscribe to auth & sync state changes
  useEffect(() => {
    const unsubAuth = addAuthListener((user) => {
      setCurrentUser(user);
    });

    const unsubSync = addSyncStateListener((state) => {
      setSyncState(state);
    });

    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  const isConnected = isGoogleDriveConnected();
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
    ? 'Sinkronisasi data Google Drive sedang berlangsung...'
    : isConnected
    ? `Drive: Tersinkron (Terakhir disinkronkan: ${formattedTimeOnly || 'Baru saja'}) • Klik untuk sinkronkan manual`
    : 'Drive: Belum terhubung / Offline • Klik untuk hubungkan akun Google';

  // Clicking badge in navbar directly triggers manual sync (no large modal)
  const handleBadgeClick = async () => {
    if (!isGoogleDriveConnected()) {
      setIsAuthenticating(true);
      try {
        const user = await googleSignIn();
        if (user) {
          showToast?.('Google Drive terhubung! Memulai sinkronisasi cloud...', 'success');
          await pullDataFromDrive(true);
        }
      } catch (err: any) {
        showToast?.(`Gagal login Google: ${err?.message || 'Akses ditolak'}`, 'error');
      } finally {
        setIsAuthenticating(false);
      }
      return;
    }

    setIsSyncingAction(true);
    try {
      const res = await pushLocalDataToDrive(false);
      if (res.success) {
        showToast?.('Data portal berhasil disinkronkan ke Google Drive (rsumb_database.json).', 'success');
      }
    } catch (err: any) {
      showToast?.(`Gagal menyinkronkan: ${err?.message}`, 'error');
    } finally {
      setIsSyncingAction(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBadgeClick}
      disabled={isSyncing || isAuthenticating}
      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs group shrink-0 ${
        isSyncing
          ? 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 border-amber-300'
          : !isConnected || isError
          ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200 hover:border-rose-300'
          : 'bg-emerald-50/90 hover:bg-emerald-100/90 text-[#005d42] border-emerald-300/80 hover:border-emerald-400'
      }`}
      title={tooltipText}
      aria-label="Status Sinkronisasi Google Drive"
    >
      {/* Google Drive Logo */}
      <GoogleDriveLogo className="w-4 h-4 group-hover:scale-105 transition-transform" />

      {/* Real-time Indicator Dot / Icon */}
      <div className="flex items-center gap-1.5 min-w-0">
        {isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
            <span className="hidden md:inline font-bold text-[11px] text-amber-900 truncate">
              Menyinkronkan...
            </span>
            <span className="inline md:hidden font-bold text-[11px] text-amber-900">
              Sync...
            </span>
          </>
        ) : !isConnected || isError ? (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
            </span>
            <span className="hidden md:inline font-bold text-[11px] text-rose-800 truncate">
              {!isConnected ? 'Drive: Offline' : 'Drive: Gagal'}
            </span>
            <span className="inline md:hidden font-bold text-[11px] text-rose-800">
              Offline
            </span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span className="hidden lg:inline font-bold text-[11px] text-[#005d42] truncate">
              Drive: Tersinkron
            </span>
            <span className="inline lg:hidden font-bold text-[11px] text-[#005d42]">
              Tersinkron
            </span>
          </>
        )}

        {/* Small subtitle timestamp on wider screens */}
        {formattedTimeOnly && isConnected && !isSyncing && (
          <span className="text-[10px] text-emerald-700/80 font-mono hidden xl:inline">
            ({formattedTimeOnly})
          </span>
        )}
      </div>
    </button>
  );
};
