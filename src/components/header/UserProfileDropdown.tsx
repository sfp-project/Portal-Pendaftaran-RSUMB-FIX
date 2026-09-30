import React, { useState, useEffect } from 'react';
import {
  User,
  Clock,
  Printer,
  RefreshCw,
  LogOut,
  Settings,
  ChevronRight,
  Database
} from 'lucide-react';
import { StaffUser } from '../../types/headerTypes';
import { getShiftTimeRange } from '../../data/headerData';
import { GoogleDriveLogo } from '../google/GoogleDriveSyncBadge';
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

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  activeStaff: StaffUser;
  onOpenHandoverModal: () => void;
  onOpenThermalTestModal: () => void;
  onOpenSwitchAccountModal: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  isOpen,
  onClose,
  activeStaff,
  onOpenHandoverModal,
  onOpenThermalTestModal,
  onOpenSwitchAccountModal,
  onOpenSettings,
  onLogout,
  showToast
}) => {
  const [syncState, setSyncState] = useState<DualSyncState>(() => getDualSyncState());
  const [currentUser, setCurrentUser] = useState(() => getCachedUser());
  const [isDriveExpanded, setIsDriveExpanded] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Subscribe to Google Auth & Sync listeners
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

  if (!isOpen) return null;

  const shiftTime = getShiftTimeRange(activeStaff.shift);
  const isConnected = isGoogleDriveConnected();
  const isSyncing = syncState.status === 'syncing' || isManualSyncing;
  const isError = syncState.status === 'error';

  // Format sync timestamp (e.g. "14.51 WIB")
  const formatTimeOnly = (iso?: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return (
        d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }).replace(':', '.') + ' WIB'
      );
    } catch {
      return null;
    }
  };

  const formattedTime = formatTimeOnly(syncState.lastSyncTime);

  // Handle manual sync button click inside profile dropdown
  const handleManualSync = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isGoogleDriveConnected()) {
      try {
        const user = await googleSignIn();
        if (user) {
          showToast?.('Google Drive terhubung! Memulai sinkronisasi cloud...', 'success');
          await pullDataFromDrive(true);
        }
      } catch (err: any) {
        showToast?.(`Gagal login Google: ${err?.message || 'Akses ditolak'}`, 'error');
      }
      return;
    }

    setIsManualSyncing(true);
    try {
      const res = await pushLocalDataToDrive(false);
      if (res.success) {
        showToast?.('Data portal pendaftaran berhasil disimpan ke rsumb_database.json di Google Drive.', 'success');
      }
    } catch (err: any) {
      showToast?.(`Gagal menyinkronkan: ${err?.message}`, 'error');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleConnectOrSwitch = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await googleSignIn();
      if (res) {
        showToast?.('Akun Google Drive berhasil dihubungkan.', 'success');
        await pullDataFromDrive(true);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast?.(`Gagal otentikasi Google: ${err?.message || 'Akses dibatalkan'}`, 'error');
      }
    }
  };

  return (
    <>
      {/* Invisible backdrop to dismiss dropdown on outside click */}
      <div
        className="fixed inset-0 z-40 bg-black/15 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Popover Card / Dropdown Menu positioned at top-right with high z-index (z-50) */}
      <div
        className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden text-left"
        role="menu"
        aria-orientation="vertical"
      >
        {/* a. Profile Card Header: User Avatar, Name, Role ("Unit Pendaftaran & Admisi RSUMB"), Shift pill badge */}
        <div className="p-3.5 bg-gradient-to-br from-emerald-50 via-[#f0fdf4] to-slate-50 rounded-2xl border border-emerald-200/80 mb-2">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              {activeStaff.avatarUrl ? (
                <img
                  src={activeStaff.avatarUrl}
                  alt={activeStaff.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#005d42]/30 shadow-xs ring-2 ring-emerald-500/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#005d42] text-white font-bold flex items-center justify-center shadow-xs">
                  {activeStaff.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 truncate">
                {activeStaff.name}
              </h4>
              <p className="text-xs font-semibold text-[#005d42] truncate">
                {activeStaff.role}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Unit Pendaftaran & Admisi RSUMB
              </p>

              {/* Shift pill badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#005d42] text-[11px] font-bold border border-emerald-300 shadow-2xs">
                <Clock className="w-3 h-3 text-[#005d42]" />
                <span>{activeStaff.shift}</span>
                <span className="text-slate-400">•</span>
                <span className="text-[10px] font-medium text-emerald-800">{shiftTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action List Items */}
        <div className="space-y-1">
          {/* Action Item 1: Ganti Shift / Form Handover */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenHandoverModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 text-slate-700 hover:text-emerald-900 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#005d42] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <RefreshCw className="w-4 h-4 text-[#005d42]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#005d42]">
                  Ganti Shift / Form Handover
                </p>
                <p className="text-[10.5px] text-slate-500 truncate">
                  Perbarui jam dinas & catat serah terima pasien
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#005d42] group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          {/* Action Item 2: Uji Cetak Printer Thermal */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenThermalTestModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 text-slate-700 hover:text-blue-900 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Printer className="w-4 h-4 text-blue-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                  Uji Cetak Printer Thermal
                </p>
                <p className="text-[10.5px] text-slate-500 truncate">
                  Kirim tes struk 80mm & cek status port
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-700 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          {/* Action Item 3: Keluar / Switch Account */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSwitchAccountModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/80 text-slate-700 hover:text-purple-900 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <User className="w-4 h-4 text-purple-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                  Keluar / Switch Account
                </p>
                <p className="text-[10.5px] text-slate-500 truncate">
                  Ganti petugas aktif atau akhiri sesi
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-700 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          {/* Dedicated Menu Action Item: Status Google Drive & Cloud Backup (Right above Pengaturan Aplikasi & HFIS) */}
          <div className="rounded-xl overflow-hidden transition-all border border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50/50">
            <button
              type="button"
              onClick={() => setIsDriveExpanded(!isDriveExpanded)}
              className="w-full flex items-center justify-between p-2.5 text-slate-700 hover:text-emerald-950 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs relative">
                  <GoogleDriveLogo className="w-4 h-4" />
                  {/* Status Live Indicator Badge */}
                  {isSyncing ? (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-ping" />
                  ) : !isConnected || isError ? (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#005d42] truncate">
                    Status Google Drive & Cloud Backup
                  </p>
                  <p className="text-[10.5px] text-slate-500 truncate flex items-center gap-1">
                    {isSyncing ? (
                      <span className="text-amber-700 font-medium">Menyinkronkan...</span>
                    ) : isConnected ? (
                      <>
                        <span className="text-emerald-700 font-semibold">Tersinkron</span>
                        <span className="text-slate-400">•</span>
                        <span>Terakhir {formattedTime || '14.51 WIB'}</span>
                      </>
                    ) : (
                      <span className="text-rose-600 font-medium">Offline • Klik untuk hubungkan</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  title="Sinkronkan Sekarang"
                  className="p-1 rounded-lg text-[#005d42] hover:bg-emerald-100 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : 'text-[#005d42]'}`} />
                </button>
                <ChevronRight
                  className={`w-4 h-4 text-slate-300 group-hover:text-[#005d42] transition-transform ${
                    isDriveExpanded ? 'rotate-90 text-[#005d42]' : ''
                  }`}
                />
              </div>
            </button>

            {/* Small nested inline settings/quick actions (no giant modal overlay) */}
            {isDriveExpanded && (
              <div className="px-3 pb-3 pt-1 border-t border-emerald-100/80 space-y-2 bg-emerald-50/60 text-[11px] animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span>Berkas Database:</span>
                  <code className="font-mono text-[10px] text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                    rsumb_database.json
                  </code>
                </div>
                {isConnected && currentUser && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Akun Google:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[150px]">{currentUser.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex-1 py-1.5 px-2.5 bg-[#005d42] hover:bg-[#004732] active:bg-[#003828] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConnectOrSwitch}
                    className="py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                  >
                    {isConnected ? 'Ganti Akun' : 'Hubungkan'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Item 4: Pengaturan Aplikasi & HFIS */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Settings className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  Pengaturan Aplikasi & HFIS
                </p>
                <p className="text-[10.5px] text-slate-500 truncate">
                  Konfigurasi BPJS & jadwal otomatis
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>

        {/* Bottom Action: Keluar Sesi Portal SIMRS in red text with sign-out icon */}
        <div className="pt-2 mt-1.5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Keluar Sesi Portal SIMRS</span>
          </button>
        </div>
      </div>
    </>
  );
};
