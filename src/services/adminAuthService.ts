import { logSystemActivity } from '../data/auditLogData';
import { loadActiveStaff } from '../data/headerData';

export const ADMIN_PIN_STORAGE_KEY = 'rsumb_admin_pin_v1';
export const DEFAULT_ADMIN_PIN = '1234';
export const AUTO_LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 Menit

let isAdminUnlocked = false;
let autoLockTimer: any = null;
const listeners = new Set<(unlocked: boolean) => void>();

export const getStoredAdminPin = (): string => {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  try {
    const saved = localStorage.getItem(ADMIN_PIN_STORAGE_KEY);
    return saved?.trim() || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
};

export const setStoredAdminPin = (newPin: string, staffName?: string): boolean => {
  if (!newPin || newPin.trim().length < 4) return false;
  try {
    localStorage.setItem(ADMIN_PIN_STORAGE_KEY, newPin.trim());
    const currentStaff = staffName || loadActiveStaff().name || 'Petugas Pendaftaran';
    logSystemActivity(
      'Pembaruan PIN Admin',
      'PIN / Passcode otorisasi mode admin SIMRS berhasil diperbarui.',
      currentStaff,
      'PENGATURAN_SISTEM',
      'Otorisasi RBAC'
    );
    return true;
  } catch {
    return false;
  }
};

export const getIsAdminUnlocked = (): boolean => isAdminUnlocked;

export const addAdminAuthListener = (cb: (unlocked: boolean) => void): (() => void) => {
  listeners.add(cb);
  cb(isAdminUnlocked);
  return () => {
    listeners.delete(cb);
  };
};

const notifyListeners = () => {
  listeners.forEach((cb) => {
    try {
      cb(isAdminUnlocked);
    } catch (e) {
      console.error('Error notifying admin auth listener:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('rsumb_admin_auth_changed', {
        detail: { isAdminUnlocked }
      })
    );
  }
};

export const resetAdminInactivityTimer = () => {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
  }

  if (isAdminUnlocked) {
    autoLockTimer = setTimeout(() => {
      lockAdmin('Otomatis terkunci setelah 15 menit tidak ada aktivitas.');
    }, AUTO_LOCK_TIMEOUT_MS);
  }
};

export const verifyAndUnlockAdmin = (
  inputPin: string,
  staffName?: string
): { success: boolean; message: string } => {
  const currentPin = getStoredAdminPin();

  if (inputPin.trim() === currentPin) {
    isAdminUnlocked = true;
    resetAdminInactivityTimer();
    notifyListeners();

    const currentStaff = staffName || loadActiveStaff().name || 'Petugas Pendaftaran';
    logSystemActivity(
      'Akses Otorisasi Admin',
      'Mode Admin berhasil dibuka (Unlocked) menggunakan PIN resmi.',
      currentStaff,
      'PENGATURAN_SISTEM',
      'Otorisasi RBAC'
    );

    return {
      success: true,
      message: 'Akses Admin Berhasil Dibuka! Anda memiliki hak pengeditan penuh.'
    };
  } else {
    const currentStaff = staffName || loadActiveStaff().name || 'Petugas Pendaftaran';
    logSystemActivity(
      'Gagal Otorisasi Admin',
      'Percobaan pembukaan Mode Admin gagal (PIN tidak sesuai).',
      currentStaff,
      'PENGATURAN_SISTEM',
      'Otorisasi RBAC'
    );

    return {
      success: false,
      message: 'PIN / Passcode Admin salah! Silakan coba lagi.'
    };
  }
};

export const lockAdmin = (reason?: string): void => {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }

  isAdminUnlocked = false;
  notifyListeners();

  const currentStaff = loadActiveStaff().name || 'Petugas Pendaftaran';
  logSystemActivity(
    'Penguncian Mode Admin',
    reason || 'Mode Admin dikunci kembali secara manual. Portal kembali ke Mode Baca.',
    currentStaff,
    'PENGATURAN_SISTEM',
    'Otorisasi RBAC'
  );
};

/**
 * Pengecekan Otorisasi Admin sebelum mengeksekusi aksi pengeditan/penghapusan data.
 * - Jika isAdminUnlocked = true, langsung jalankan actionCallback().
 * - Jika isAdminUnlocked = false, buka modal PIN Admin. Setelah berhasil verifikasi, jalankan actionCallback().
 */
export const requestAdminAction = (
  actionCallback: () => void,
  actionTitle?: string
): void => {
  if (isAdminUnlocked) {
    actionCallback();
  } else {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rsumb_open_admin_pin_modal', {
          detail: {
            actionCallback,
            actionTitle: actionTitle || 'Pengeditan Data SIMRS'
          }
        })
      );
    }
  }
};

// Global activity listener to reset 15-minute inactivity timer when unlocked
if (typeof window !== 'undefined') {
  const handleUserActivity = () => {
    if (isAdminUnlocked) {
      resetAdminInactivityTimer();
    }
  };

  window.addEventListener('mousemove', handleUserActivity);
  window.addEventListener('keydown', handleUserActivity);
  window.addEventListener('click', handleUserActivity);
}
