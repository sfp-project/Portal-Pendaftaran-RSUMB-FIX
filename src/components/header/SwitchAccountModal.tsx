import React, { useState } from 'react';
import {
  X,
  Users,
  LogOut,
  ShieldCheck,
  Check,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { StaffUser } from '../../types/headerTypes';
import { INITIAL_STAFF_LIST } from '../../data/headerData';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStaff: StaffUser;
  onSelectStaff: (staff: StaffUser) => void;
  onLogout: () => void;
}

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({
  isOpen,
  onClose,
  activeStaff,
  onSelectStaff,
  onLogout
}) => {
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-10 my-auto"
        style={{
          maxHeight: '85vh',
          overflowY: 'auto',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-[#005d42] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Users className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Pilih Akun / Ganti Staf Pendaftaran
              </h3>
              <p className="text-xs text-emerald-200/90">
                Pilih profil petugas loket atau keluar dari sesi portal SIMRS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition cursor-pointer"
            aria-label="Tutup Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with inner scrollbar */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {!showConfirmLogout ? (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Daftar 8 Staf Admin Pendaftaran Resmi RSUMB
                </p>
                <div className="space-y-2">
                  {INITIAL_STAFF_LIST.map((staff) => {
                    const isActive = staff.id === activeStaff.id || staff.name.toUpperCase() === activeStaff.name.toUpperCase();

                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          onSelectStaff(staff);
                          onClose();
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                          isActive
                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-[#005d42]/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-[#005d42] text-white font-bold flex items-center justify-center shadow-xs">
                              {staff.name.slice(0, 2).toUpperCase()}
                            </div>
                            {isActive && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {staff.name.toUpperCase()}
                              </p>
                              {isActive && (
                                <span className="text-[10px] font-bold bg-emerald-100 text-[#005d42] px-1.5 py-0.2 rounded border border-emerald-200">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate font-medium">{staff.role}</p>
                            <p className="text-[10px] text-slate-400 truncate">{staff.email}</p>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isActive ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-[#005d42] bg-emerald-100/70 px-2 py-1 rounded-lg">
                              <Check className="w-4 h-4 text-[#005d42]" />
                              <span>Sedang Digunakan</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-[#005d42] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1 group-hover:translate-x-0.5 transition shadow-2xs">
                              <span>Pilih -&gt;</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logout Option */}
              <div className="pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfirmLogout(true)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Sesi Portal SIMRS</span>
                </button>
              </div>
            </>
          ) : (
            /* Confirm Logout View */
            <div className="py-3 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Konfirmasi Keluar Sesi
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin mengakhiri sesi kerja untuk petugas{' '}
                  <span className="font-bold text-slate-900">{activeStaff.name}</span>?
                  Pastikan catatan handover shift telah disimpan jika ada pasien pending.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmLogout(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Ya, Keluar Sesi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
