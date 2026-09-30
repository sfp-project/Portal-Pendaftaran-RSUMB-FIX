import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  FolderSync,
  RefreshCw,
  X,
  Database,
  ShieldCheck,
  Sparkles,
  Info,
  Check,
  Users
} from 'lucide-react';
import {
  googleSignIn,
  logoutGoogleDrive,
  isGoogleDriveConnected,
  getCachedUser,
  addAuthListener
} from '../../services/googleAuthService';
import {
  pushLocalDataToDrive,
  pullDataFromDrive,
  getDualSyncState,
  addSyncStateListener,
  DualSyncState
} from '../../services/dualSyncStorage';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleDriveAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const RSUMB_STAFF_MEMBERS = [
  'Hisyam',
  'Alivia',
  'Abi',
  'Ady',
  'Melinda',
  'Agnia',
  'Ismed',
  'Syafik'
];

export const GoogleDriveAuthModal: React.FC<GoogleDriveAuthModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [googleUser, setGoogleUser] = useState(() => getCachedUser());
  const [syncState, setSyncState] = useState<DualSyncState>(() => getDualSyncState());
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = addAuthListener((user) => {
      setGoogleUser(user);
    });
    const unsubSync = addSyncStateListener((state) => {
      setSyncState(state);
    });

    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setActionMessage('Menghubungkan akun Google Drive SIMRS...');
    try {
      const res = await googleSignIn();
      if (res) {
        showToast?.('Berhasil login Google Drive. Memulai sinkronisasi cloud...', 'success');
        setActionMessage('Menyinkronkan database rsumb_database.json...');
        try {
          const pullRes = await pullDataFromDrive(true);
          if (pullRes.restoredKeys > 0) {
            showToast?.(`Tersinkron: ${pullRes.restoredKeys} data dipulihkan dari cloud.`, 'success');
          } else {
            await pushLocalDataToDrive(true);
          }
        } catch {
          await pushLocalDataToDrive(true);
        }
        setActionMessage(null);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.message !== 'popup_closed_by_user') {
        showToast?.(`Gagal otentikasi Google: ${err?.message || 'Akses ditolak'}`, 'error');
      }
      setActionMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutGoogleDrive();
      showToast?.('Koneksi Google Drive telah diputuskan. Mode offline aktif.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSyncNow = async () => {
    setIsLoading(true);
    setActionMessage('Menyimpan perubahan ke Google Drive...');
    try {
      const res = await pushLocalDataToDrive(false);
      if (res.success) {
        showToast?.('Database berhasil disinkronkan ke Google Drive (/RSUMB_Portal_Data/rsumb_database.json).', 'success');
      }
    } catch (err: any) {
      showToast?.(`Gagal sinkron: ${err?.message}`, 'error');
    } finally {
      setIsLoading(false);
      setActionMessage(null);
    }
  };

  if (!isOpen) return null;

  const isConnected = isGoogleDriveConnected();

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-modal-title"
    >
      <div className="fixed inset-0 bg-transparent" onClick={onClose} aria-hidden="true" />

      {/* Modal Card with Strict Viewport Boundaries & Scroll Isolation */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]">
        {/* MODAL HEADER: Harmonious Emerald Gradient Palette */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#004732] to-[#005d42] text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 text-emerald-300 shrink-0 shadow-inner">
                <Cloud className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="drive-modal-title" className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Integrasi Google Drive & Cloud Sync
                  </h3>
                  <span className="bg-emerald-400/25 text-emerald-200 border border-emerald-400/35 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>SIMRS RSUMB</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-100/85 mt-0.5 leading-relaxed break-words">
                  Pencadangan database otomatis & sinkronisasi data operasional staf pendaftaran
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/15 shrink-0"
              title="Tutup Modal"
              aria-label="Tutup Dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* STATUS PILL IN HEADER */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-200 font-medium">Status:</span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/25 text-emerald-100 border border-emerald-400/40 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Tersinkronisasi Cloud</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/35 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Mode Offline (LocalStorage Aktif)</span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-emerald-200/90 font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10">
              rsumb_database.json
            </div>
          </div>
        </div>

        {/* MODAL BODY WITH PERFECT RESPONSIVE PADDING & SCROLLABILITY */}
        <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto overscroll-contain flex-1">
          {isConnected && googleUser ? (
            /* CONNECTED VIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      className="w-11 h-11 rounded-full border-2 border-emerald-500 shrink-0 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#005d42] text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {(googleUser.displayName || googleUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm truncate">
                        {googleUser.displayName || 'Akun Google SIMRS'}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">{googleUser.email}</p>
                    <p className="text-[10px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                      <FolderSync className="w-3.5 h-3.5 shrink-0" />
                      <span>Sinkronisasi Latar Belakang Aktif & Otomatis</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 text-xs text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl font-bold transition cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto shadow-2xs"
                  title="Putuskan sambungan akun Google"
                >
                  Putuskan
                </button>
              </div>

              {/* FOLDER DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Folder Database Utama</span>
                  <p className="font-mono font-bold text-slate-800 mt-1 text-xs">/RSUMB_Portal_Data/</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">File: rsumb_database.json</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Folder Berkas & Cadangan</span>
                  <p className="font-mono font-bold text-slate-800 mt-1 text-xs">/RSUMB_Portal_Files/</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Backup: /RSUMB_Portal_Backups/</p>
                </div>
              </div>

              {syncState.lastSyncTime && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 text-slate-600 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>Waktu Sinkronisasi Terakhir:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {new Date(syncState.lastSyncTime).toLocaleString('id-ID')} WIB
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* DISCONNECTED VIEW: Themed, High-Legibility & Zero-Clipping */
            <div className="space-y-4">
              {/* OFFLINE RESILIENCE INFO CARD */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#005d42] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Data Tetap Aman di Browser (Penyimpanan Lokal Aktif)</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Operasional portal tidak terhenti. Seluruh data kupon fee, catatan handover, poster, jadwal, dan pengaturan pendaftaran otomatis tersimpan di peramban (LocalStorage) perangkat ini.
                </p>
              </div>

              {/* BENEFITS LIST WITH ZERO TEXT OVERFLOW / CLIPPING */}
              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3.5">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#005d42] shrink-0" />
                  <span>Manfaat Menghubungkan Google Drive SIMRS RSUMB:</span>
                </h4>

                <div className="space-y-3 text-[11px] text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0 leading-relaxed">
                      <strong className="text-slate-900 font-bold">Pencadangan Cloud Otomatis:</strong>{' '}
                      <span>Data otomatis disinkronkan ke file <code className="font-mono text-emerald-800 bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">rsumb_database.json</code> di Google Drive Anda.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0 leading-relaxed">
                      <strong className="text-slate-900 font-bold">Sinkronisasi Antar-Perangkat:</strong>{' '}
                      <span>Memudahkan koordinasi operan shift staf antar-meja pendaftaran:</span>
                      
                      {/* Responsive, Unclipped List of 8 Registration Staff Members */}
                      <div className="mt-2 p-2.5 bg-white rounded-xl border border-emerald-200/70 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          <Users className="w-3.5 h-3.5 text-[#005d42]" />
                          <span>8 Petugas Pendaftaran RSUMB:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {RSUMB_STAFF_MEMBERS.map((staffName) => (
                            <span
                              key={staffName}
                              className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-[#005d42] border border-emerald-300 rounded-lg font-bold text-[11px] shadow-2xs hover:bg-emerald-100 transition"
                            >
                              {staffName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0 leading-relaxed">
                      <strong className="text-slate-900 font-bold">Aman Saat Bersihkan Cache Browser:</strong>{' '}
                      <span>Data tidak hilang saat komputer pendaftaran di-restart atau riwayat browser dibersihkan.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION PROMPT BUTTON */}
              <div className="pt-2 text-center space-y-2">
                <GoogleSignInButton
                  onClick={handleLogin}
                  isLoading={isLoading}
                  text="Login Akun Google / Hubungkan Drive"
                  className="w-full py-3 shadow-md hover:shadow-lg font-bold text-sm bg-white text-slate-800 border-slate-300 hover:border-emerald-400"
                />
                <p className="text-[10px] text-slate-500">
                  Otentikasi aman via Google Identity Services & Firebase OAuth Client RSUMB
                </p>
              </div>
            </div>
          )}

          {actionMessage && (
            <div className="p-3.5 bg-emerald-50 text-emerald-950 rounded-2xl border border-emerald-200 flex items-center gap-2.5 font-medium shadow-2xs">
              <RefreshCw className="w-4 h-4 animate-spin text-[#005d42] shrink-0" />
              <span className="text-xs">{actionMessage}</span>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50/95 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Kerahasiaan data terjamin sesuai hak akses Google Drive staf.</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isConnected ? (
              <button
                type="button"
                onClick={handleManualSyncNow}
                disabled={isLoading}
                className="px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Sekarang</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded-xl text-xs transition cursor-pointer"
            >
              {isConnected ? 'Selesai' : 'Lanjutkan Mode Offline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
