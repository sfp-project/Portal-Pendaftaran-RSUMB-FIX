import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, X, AlertTriangle, KeyRound } from 'lucide-react';

interface PasswordLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

export const PasswordLockModal: React.FC<PasswordLockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'perubahan tarif/fasilitas kamar'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage('');
      setShowPassword(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const cleanInput = password.trim();

    // Default PIN: 123456 or RSUMB Admin password
    const validPasswords = ['123456', 'rsumb123', 'adminrsumb'];

    // Check custom password if set in localStorage
    const storedCustomPin = localStorage.getItem('rsumb_room_rates_pin');
    if (storedCustomPin) {
      validPasswords.push(storedCustomPin);
    }

    if (validPasswords.includes(cleanInput)) {
      // Validated successfully
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } else {
      setIsSubmitting(false);
      setErrorMessage('Kata sandi salah! Anda tidak memiliki otoritas untuk mengubah tarif.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 text-amber-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                Akses Terkunci - Verifikasi Otorisasi
              </h2>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Otoritas Pengubahan Tarif RSUMB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Otorisasi Akses Diperlukan
            </p>
            <p>
              Modul ini berada dalam mode <strong className="text-slate-900">Read-Only</strong> untuk umum/petugas admisi. Masukkan kata sandi atau PIN verifikasi resmi untuk melanjutkan tindakan <span className="text-amber-800 font-semibold">{actionTitle}</span>.
            </p>
          </div>

          {/* Error notification */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs font-semibold animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Kata Sandi / PIN Khusus Administrator
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Masukkan PIN / Kata Sandi (misal: 123456)"
                className={`w-full pl-3.5 pr-10 py-2.5 bg-white border ${
                  errorMessage ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'
                } rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono tracking-wider`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
              <span>PIN Standar Sementara: <strong className="text-slate-600 font-mono">123456</strong></span>
              <span className="text-emerald-700 font-medium">RSUMB Admisi</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verifikasi & Lanjutkan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
