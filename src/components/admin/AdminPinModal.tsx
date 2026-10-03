import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  Unlock,
  X,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  User,
  Delete,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  verifyAndUnlockAdmin,
  getStoredAdminPin,
  DEFAULT_ADMIN_PIN
} from '../../services/adminAuthService';
import { loadActiveStaff, saveActiveStaff, INITIAL_STAFF_LIST } from '../../data/headerData';
import { StaffUser } from '../../types/headerTypes';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  actionTitle?: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  actionTitle
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeStaffName, setActiveStaffName] = useState(() => loadActiveStaff().name || 'Hisyam');

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMessage(null);
      setActiveStaffName(loadActiveStaff().name || 'Hisyam');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNumpadPress = (val: string) => {
    setErrorMessage(null);
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + val);
    }
  };

  const handleNumpadDelete = () => {
    setErrorMessage(null);
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleNumpadClear = () => {
    setErrorMessage(null);
    setPinInput('');
  };

  const handleSubmitPin = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanName = activeStaffName.trim();
    if (!cleanName) {
      setErrorMessage('Harap masukkan nama petugas / operator aktif.');
      return;
    }
    if (!pinInput.trim()) {
      setErrorMessage('Harap masukkan PIN Admin.');
      return;
    }

    const res = verifyAndUnlockAdmin(pinInput, cleanName);
    if (res.success) {
      // Find matching staff to switch profiles, or update the current staff name
      const matched = INITIAL_STAFF_LIST.find(
        (s) => s.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (matched) {
        saveActiveStaff(matched);
      } else {
        const current = loadActiveStaff();
        saveActiveStaff({
          ...current,
          id: `custom-${Date.now()}`,
          name: cleanName
        });
      }

      showToast?.(res.message, 'success');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setErrorMessage(res.message);
      setPinInput('');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      <div className="relative z-[1000000] w-full max-w-sm max-h-[85vh] my-auto flex flex-col rounded-2xl bg-white p-5 shadow-2xl overflow-y-auto border border-slate-200 text-left space-y-4 items-center">
        {/* Compact Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
              <Lock className="w-4.5 h-4.5 text-[#005d42] animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                Otorisasi PIN Admin
              </h3>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px]" title={actionTitle}>
                {actionTitle ? `${actionTitle}` : 'Mode Pengeditan Terkunci'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitPin} className="w-full space-y-3 pt-1">
          {/* Operator Name Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#005d42]" />
              <span>Nama Petugas / Operator Aktif:</span>
            </label>
            <input
              type="text"
              value={activeStaffName}
              onChange={(e) => setActiveStaffName(e.target.value)}
              placeholder="Masukkan nama Anda..."
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              required
            />
          </div>

          {/* PIN Input Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Masukkan PIN / Passcode Admin:
            </label>
            <div className="relative py-1 mb-2">
              <input
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => {
                  setErrorMessage(null);
                  setPinInput(e.target.value);
                }}
                placeholder="••••"
                maxLength={6}
                className="w-full text-center tracking-[0.4em] font-mono text-base font-black bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005d42] focus:bg-white"
                autoFocus
              />

              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-2 bg-rose-50 border border-rose-150 rounded-xl text-[11px] text-rose-800 font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Numpad Grid */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpadPress(num)}
                className="h-10 bg-slate-50 hover:bg-emerald-50/50 active:bg-emerald-100 border border-slate-200/80 hover:border-emerald-200 text-slate-800 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleNumpadClear}
              className="h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleNumpadPress('0')}
              className="h-10 bg-slate-50 hover:bg-emerald-50/50 active:bg-emerald-100 border border-slate-200/80 hover:border-emerald-200 text-slate-800 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleNumpadDelete}
              className="h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
              title="Hapus"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-0.5">
              <span>Default PIN: <strong className="text-slate-600 font-mono">1234</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-700 to-[#005d42] hover:from-emerald-800 hover:to-[#004a35] text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Akses</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
