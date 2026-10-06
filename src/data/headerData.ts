import { StaffUser, SystemNotification, StaffShiftType } from '../types/headerTypes';

export const INITIAL_STAFF_LIST: StaffUser[] = [
  {
    id: 'staff-hisyam',
    name: 'Hisyam',
    role: 'Admin Pendaftaran',
    department: 'Unit Pendaftaran & Admisi RSUMB',
    email: 'hisyam.admisi@rsumbabat.id',
    shift: 'Shift Pagi',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-alivia',
    name: 'Alivia',
    role: 'Admin Pendaftaran',
    department: 'Unit Pendaftaran & Admisi RSUMB',
    email: 'alivia.admisi@rsumbabat.id',
    shift: 'Shift Pagi',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-abi',
    name: 'Abi',
    role: 'Admin Pendaftaran',
    department: 'Unit Pendaftaran & Admisi RSUMB',
    email: 'abi.admisi@rsumbabat.id',
    shift: 'Shift Pagi',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-ady',
    name: 'Ady',
    role: 'Admin Pendaftaran',
    department: 'Unit Pendaftaran & Admisi RSUMB',
    email: 'ady.admisi@rsumbabat.id',
    shift: 'Shift Siang',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-melinda',
    name: 'Melinda',
    role: 'Admin Pendaftaran',
    department: 'Unit Pendaftaran & Admisi RSUMB',
    email: 'melinda.admisi@rsumbabat.id',
    shift: 'Shift Siang',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-agnia',
    name: 'Agnia',
    role: 'Admin Pendaftaran',
    department: 'Unit Pendaftaran & Admisi RSUMB',
    email: 'agnia.admisi@rsumbabat.id',
    shift: 'Shift Siang',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-ismed',
    name: 'Ismed',
    role: 'Admin Pendaftaran',
    department: 'Unit Pendaftaran & Admisi RSUMB',
    email: 'ismed.admisi@rsumbabat.id',
    shift: 'Shift Malam',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-syafik',
    name: 'Syafik',
    role: 'Admin Pendaftaran',
    department: 'Unit Pendaftaran & Admisi RSUMB',
    email: 'syafik.admisi@rsumbabat.id',
    shift: 'Shift Malam',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  }
];

export function getAutoShiftByTime(): StaffShiftType {
  const currentHour = new Date().getHours();
  if (currentHour >= 7 && currentHour < 14) return 'Shift Pagi';
  if (currentHour >= 14 && currentHour < 21) return 'Shift Siang';
  return 'Shift Malam';
}

export function getShiftTimeRange(shift: StaffShiftType): string {
  switch (shift) {
    case 'Shift Pagi':
      return '07.00 - 14.00 WIB';
    case 'Shift Siang':
      return '14.00 - 21.00 WIB';
    case 'Shift Malam':
      return '21.00 - 07.00 WIB';
  }
}

const STORAGE_KEY_ACTIVE_STAFF = 'rsumb_active_staff_user_v1';
export const STORAGE_KEY_NOTIFICATIONS = 'rsumb_header_notifications_v1';

export function loadActiveStaff(): StaffUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_STAFF);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        // Validate if user matches official 8 staff
        const matched = INITIAL_STAFF_LIST.find(
          (s) => s.name.toLowerCase() === parsed.name.toLowerCase() || s.id === parsed.id
        );
        if (matched) {
          return {
            ...matched,
            shift: parsed.shift || matched.shift
          };
        }
      }
    }
  } catch (e) {
    console.error('Failed to load active staff from storage:', e);
  }

  // Default initial active staff: Syafik (Admin Pendaftaran, Shift Malam)
  const defaultStaff = { ...(INITIAL_STAFF_LIST.find((s) => s.name === 'Syafik') || INITIAL_STAFF_LIST[0]) };
  defaultStaff.shift = 'Shift Malam';
  return defaultStaff;
}

export function saveActiveStaff(staff: StaffUser): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_STAFF, JSON.stringify(staff));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rsumb_active_staff_changed'));
    }
  } catch (e) {
    console.error('Failed to save active staff to storage:', e);
  }
}

export const INITIAL_SYSTEM_NOTIFICATIONS: SystemNotification[] = [
  // 1. Operasional: DPJP schedule changes
  {
    id: 'notif-dpjp-1',
    category: 'Operasional',
    subCategory: 'Jadwal DPJP',
    title: 'Perubahan Jadwal dr. Ilma Alifa, Sp.JP',
    message: 'Jadwal praktik Poli Jantung Kamis dimajukan ke Rabu, 3 Sept 2026 pukul 08.00 WIB.',
    time: '12 menit lalu',
    isRead: false,
    targetTab: 'schedules',
    severity: 'info',
    dpjpName: 'dr. Ilma Alifa, Sp.JP',
    poliName: 'Jantung'
  },
  {
    id: 'notif-dpjp-2',
    category: 'Operasional',
    subCategory: 'Jadwal DPJP',
    title: 'Cuti Praktik dr. Budi Santoso, Sp.A',
    message: 'Cuti kegiatan ilmiah tanggal 12 - 14 September 2026. Pasien dialihkan ke dr. Maya, Sp.A.',
    time: '35 menit lalu',
    isRead: false,
    targetTab: 'schedules',
    severity: 'warning',
    dpjpName: 'dr. Budi Santoso, Sp.A',
    poliName: 'Anak'
  },
  // 2. Operasional: BPJS quota limit warnings
  {
    id: 'notif-bpjs-1',
    category: 'Operasional',
    subCategory: 'Kuota BPJS',
    title: 'Peringatan Kuota BPJS: Poli Penyakit Dalam',
    message: 'Kuota antrean BPJS mencapai 48/50 (96% terisi). Segera pantau pendaftaran loket & MJKN.',
    time: '20 menit lalu',
    isRead: false,
    targetTab: 'quotas',
    severity: 'alert',
    poliName: 'Penyakit Dalam'
  },
  {
    id: 'notif-bpjs-2',
    category: 'Operasional',
    subCategory: 'Kuota BPJS',
    title: 'Kuota Maksimal Poli Saraf Terpenuhi',
    message: 'Sistem menutup otomatis antrean online Poli Saraf (45/45 pasien terdaftar).',
    time: '45 menit lalu',
    isRead: false,
    targetTab: 'quotas',
    severity: 'alert',
    poliName: 'Saraf'
  },
  // 3. Operasional: Urgent Handover notes
  {
    id: 'notif-handover-1',
    category: 'Operasional',
    subCategory: 'Handover Shift',
    title: 'Handover Prioritas Tinggi: Ny. Siti Rahayu (RM 38-44-12)',
    message: 'Pasien Ranap Kelas 1, pending SEP BPJS & persetujuan jaminan GL Asuransi. Butuh follow-up ke dokter DPJP.',
    time: '8 menit lalu',
    isRead: false,
    targetTab: 'patient_notes',
    severity: 'alert',
    patientName: 'Ny. Siti Rahayu'
  },
  // 4. Pesan WA: Failed WhatsApp broadcast delivery alerts
  {
    id: 'notif-wa-1',
    category: 'Pesan WA',
    subCategory: 'Broadcast Gagal',
    title: 'Pengiriman WA Blast Gagal: Ny. Aminah',
    message: 'Pesan pengingat kontrol gagal terkirim ke 0812-3499-1288 (Error: Nomor tidak terdaftar WhatsApp).',
    time: '1 jam lalu',
    isRead: false,
    targetTab: 'contact_patients',
    severity: 'error',
    patientName: 'Ny. Aminah'
  },
  {
    id: 'notif-wa-2',
    category: 'Pesan WA',
    subCategory: 'Broadcast Gagal',
    title: 'Pengiriman WA Blast Gagal: Tn. Subardi',
    message: 'Notifikasi antrean poliklinik ke 0857-8891-3200 gagal terkirim (Error: Timeout koneksi gateway WhatsApp).',
    time: '2 jam lalu',
    isRead: false,
    targetTab: 'contact_patients',
    severity: 'error',
    patientName: 'Tn. Subardi'
  }
];

export function loadHeaderNotifications(): SystemNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load header notifications from storage:', e);
  }
  return INITIAL_SYSTEM_NOTIFICATIONS;
}

export function saveHeaderNotifications(notifs: SystemNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save header notifications to storage:', e);
  }
}
