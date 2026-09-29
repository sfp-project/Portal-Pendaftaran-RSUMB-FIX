import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FolderSync,
  LogOut,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Database
} from 'lucide-react';
import {
  googleSignIn,
  logoutGoogleDrive,
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
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleDriveSyncBadgeProps {
  onOpenSettings?: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const GoogleDriveSyncBadge: React.FC<GoogleDriveSyncBadgeProps> = ({
  onOpenSettings,
  showToast
}) => {
  const [syncState, setSyncState] = useState<DualSyncState>(() => getDualSyncState());
  const [currentUser, setCurrentUser] = useState(() => getCachedUser());
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to auth & sync events
  useEffect(() => {
    const unsubAuth = addAuthListener((user) => {
      setCurrentUser(user);
    });

    const unsubSync = addSyncStateListener((state) => {
      setSyncState(state);
    });

    // Listen to token expired notification
    const handleTokenExpired = () => {
      showToast?.('Sesi Google Drive kedaluwarsa. Silakan klik "Hubungkan Drive" untuk menyambung ulang.', 'info');
    };
    window.addEventListener('rsumb_drive_token_expired', handleTokenExpired);

    // Close menu on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubAuth();
      unsubSync();
      window.removeEventListener('rsumb_drive_token_expired', handleTokenExpired);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format last sync time string
  const formattedSyncTime = syncState.lastSyncTime
    ? new Date(syncState.lastSyncTime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : null;

  const handleConnect = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        showToast?.('Berhasil terhubung dengan Google Drive. Memulai sinkronisasi...', 'success');
        // Initial auto-sync: pull latest from cloud or push local state
        try {
          const pullRes = await pullDataFromDrive();
          if (pullRes.restoredKeys > 0) {
            showToast?.(`Tersinkron! ${pullRes.restoredKeys} data dipulihkan dari Google Drive.`, 'success');
          } else {
            // First time on drive: push local state
            await pushLocalDataToDrive(true);
          }
        } catch {
          await pushLocalDataToDrive(true);
        }
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast?.(`Gagal otentikasi Google: ${err?.message || 'Akses ditolak'}`, 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualPush = async () => {
    setIsManualSyncing(true);
    try {
      await pushLocalDataToDrive(false);
      showToast?.('Data lokal berhasil disinkronkan ke Google Drive.', 'success');
      setIsOpenMenu(false);
    } catch (err: any) {
      showToast?.(`Gagal sinkronisasi: ${err?.message}`, 'error');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleManualPull = async () => {
    setIsManualSyncing(true);
    try {
      const res = await pullDataFromDrive();
      showToast?.(`Database Google Drive dipulihkan (${res.restoredKeys} data diperbarui).`, 'success');
      setIsOpenMenu(false);
    } catch (err: any) {
      showToast?.(`Gagal memulihkan: ${err?.message}`, 'error');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await logoutGoogleDrive();
    showToast?.('Koneksi Google Drive telah diputuskan.', 'info');
    setIsOpenMenu(false);
  };

  if (!currentUser) {
    return (
      <div className="relative">
        <GoogleSignInButton
          onClick={handleConnect}
          isLoading={isLoggingIn}
          text="Hubungkan Drive"
          size="sm"
          className="border-emerald-200/90 text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100/80 shadow-2xs text-[11px]"
        />
      </div>
    );
  }

  const isSyncing = syncState.status === 'syncing' || isManualSyncing;
  const isError = syncState.status === 'error';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpenMenu(!isOpenMenu)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
          isError
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : isSyncing
            ? 'bg-blue-50 text-blue-900 border-blue-300 animate-pulse'
            : 'bg-emerald-50 text-emerald-900 border-emerald-200/90 hover:bg-emerald-100/70'
        }`}
        title="Status Sinkronisasi Google Drive RSUMB"
      >
        <div className="relative">
          <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-blue-600 animate-spin' : isError ? 'text-amber-600' : 'text-[#005d42]'}`} />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-white ${
              isError ? 'bg-amber-500' : isSyncing ? 'bg-blue-500' : 'bg-emerald-500'
            }`}
          />
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <span className="text-[11px] font-bold">
            {isSyncing ? 'Sinkronisasi...' : isError ? 'Perlu Sync' : 'Drive Aktif'}
          </span>
          {formattedSyncTime && !isSyncing && (
            <span className="text-[9px] text-emerald-700/80 font-mono">({formattedSyncTime})</span>
          )}
        </div>

        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Flyout Menu */}
      {isOpenMenu && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#005d42] flex items-center justify-center font-bold text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {currentUser.displayName || 'Akun Google RSUMB'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
              Terhubung
            </span>
          </div>

          <div className="py-2.5 space-y-2 text-left">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Folder Data:</span>
                <span className="font-mono font-bold text-slate-800">/RSUMB_Portal_Data/</span>
              </div>
              <div className="flex justify-between">
                <span>File Utama:</span>
                <span className="font-mono text-emerald-800 font-semibold">rsumb_database.json</span>
              </div>
              <div className="flex justify-between">
                <span>Sinkronisasi Terakhir:</span>
                <span className="font-mono text-slate-800">
                  {formattedSyncTime ? `${formattedSyncTime} WIB` : 'Belum sinkron'}
                </span>
              </div>
            </div>

            {syncState.lastError && (
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{syncState.lastError}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleManualPush}
              disabled={isSyncing}
              className="w-full py-2 px-3 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sedang Sinkronisasi...' : 'Sinkronkan ke Google Drive'}</span>
            </button>

            <button
              type="button"
              onClick={handleManualPull}
              disabled={isSyncing}
              className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Pulihkan Data dari Cloud Drive</span>
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpenMenu(false);
                  onOpenSettings();
                }}
                className="w-full py-1.5 px-3 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <FolderSync className="w-3.5 h-3.5" />
                <span>Pengaturan Backup Cloud</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full py-1.5 px-3 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Putuskan Sambungan Drive</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
