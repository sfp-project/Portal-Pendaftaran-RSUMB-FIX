import React from 'react';
import {
  User,
  ShieldCheck,
  Clock,
  Printer,
  RefreshCw,
  LogOut,
  Settings,
  ChevronRight,
  Sparkles,
  Users,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { StaffUser } from '../../types/headerTypes';
import { getShiftTimeRange } from '../../data/headerData';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  activeStaff: StaffUser;
  onOpenHandoverModal: () => void;
  onOpenThermalTestModal: () => void;
  onOpenSwitchAccountModal: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  isOpen,
  onClose,
  activeStaff,
  onOpenHandoverModal,
  onOpenThermalTestModal,
  onOpenSwitchAccountModal,
  onOpenSettings,
  onLogout
}) => {
  if (!isOpen) return null;

  const shiftTime = getShiftTimeRange(activeStaff.shift);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Flyout Panel Overlay */}
      <div
        className="absolute right-0 top-full mt-2 w-72 sm:w-84 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-[9999] p-2 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
        style={{ top: '100%', right: 0, marginTop: '8px' }}
      >
        {/* Header Section: Active Staff Info & Shift Badge */}
        <div className="p-3.5 bg-gradient-to-br from-emerald-50 via-[#f0fdf4] to-slate-50 rounded-xl border border-emerald-200/70 mb-2">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              {activeStaff.avatarUrl ? (
                <img
                  src={activeStaff.avatarUrl}
                  alt={activeStaff.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#005d42]/30 shadow-xs"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#005d42] text-white font-bold flex items-center justify-center shadow-xs">
                  {activeStaff.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  {activeStaff.name}
                </h4>
              </div>
              <p className="text-xs font-semibold text-emerald-800 truncate">
                {activeStaff.role}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {activeStaff.department}
              </p>

              {/* Current Shift Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold border border-emerald-300/80 shadow-2xs">
                <Clock className="w-3 h-3 text-[#005d42]" />
                <span>{activeStaff.shift}</span>
                <span className="text-slate-400">•</span>
                <span className="text-[9.5px] font-medium text-emerald-700">{shiftTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action List Items */}
        <div className="space-y-1">
          {/* 1. Ganti Shift / Form Handover */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenHandoverModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-900 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#005d42] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#005d42]">
                  Ganti Shift / Form Handover
                </p>
                <p className="text-[10.5px] text-slate-500">
                  Perbarui jam dinas & catat serah terima pasien
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#005d42] group-hover:translate-x-0.5 transition" />
          </button>

          {/* 2. Uji Cetak Printer Thermal */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenThermalTestModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 text-slate-700 hover:text-blue-900 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                  Uji Cetak Printer Thermal
                </p>
                <p className="text-[10.5px] text-slate-500">
                  Kirim tes struk 80mm & cek status port
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-700 group-hover:translate-x-0.5 transition" />
          </button>

          {/* 3. Keluar / Switch Account */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSwitchAccountModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/70 text-slate-700 hover:text-purple-900 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                  Keluar / Switch Account
                </p>
                <p className="text-[10.5px] text-slate-500">
                  Ganti petugas aktif atau akhiri sesi
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
          </button>

          {/* 4. Pengaturan SIMRS & HFIS */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Pengaturan Aplikasi & HFIS
                </p>
                <p className="text-[10.5px] text-slate-500">
                  Konfigurasi BPJS & jadwal otomatis
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {/* Bottom Quick Logout */}
        <div className="pt-2 mt-1 border-t border-slate-100">
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
