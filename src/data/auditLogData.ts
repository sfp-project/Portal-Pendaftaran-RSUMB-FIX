import { SystemActivityLog, ActivityActionCategory } from '../types/auditLogTypes';
import { loadActiveStaff } from './headerData';
import { triggerSilentDriveSync } from '../services/dualSyncStorage';

export const SYSTEM_AUDIT_LOGS_KEY = 'rsumb_system_audit_logs_v1';

/**
 * Format Date to RFC3339 string with precise local timezone offset
 * Example: 2026-09-28T13:18:30+07:00
 */
export const getRfc3339Timestamp = (d: Date = new Date()): string => {
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const tzOffset = -d.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const offsetHours = pad(tzOffset / 60);
  const offsetMins = pad(tzOffset % 60);

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
};

/**
 * Pre-seeded realistic historical audit activity spanning 1 to 3 months (Jul, Aug, Sep 2026)
 * Involves all 8 registration staff: Hisyam, Alivia, Abi, Ady, Melinda, Agnia, Ismed, Syafik
 */
export const generateInitialAuditLogs = (): SystemActivityLog[] => {
  return [
    {
      id: 'log-20260928-001',
      timestamp: '2026-09-28T10:15:22+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Hisyam',
      details: 'Menerbitkan kupon rujukan PKM #MOH-202609-042 (Pasien: Ny. Siti Fatimah, Perujuk: Bidan Endang, Fee: Rp 35.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260928-002',
      timestamp: '2026-09-28T09:40:11+07:00',
      actionType: 'Pembaruan Status SEP BPJS',
      category: 'SEP_BPJS',
      staffName: 'Alivia',
      details: 'Pembaruan status kendala SEP pasien Tn. Bambang Subagyo (No. RM 112048) dari "Pending" menjadi "Resolved (cetak SEP)".',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260928-003',
      timestamp: '2026-09-28T08:05:44+07:00',
      actionType: 'Penyimpanan Catatan Handover Shift',
      category: 'HANDOVER_SHIFT',
      staffName: 'Abi',
      details: 'Operan shift Pagi disimpan: 3 pasien rawat inap menunggu persetujuan BPJS Naik Kelas, 1 KLL LP terlapor.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260927-004',
      timestamp: '2026-09-27T16:22:15+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Ady',
      details: 'Menerbitkan kupon Mohat Desa #MOH-202609-041 (Pasien: Bpk. Joko Santoso, Sopir: Pak Wawan, Fee: Rp 25.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260927-005',
      timestamp: '2026-09-27T14:30:00+07:00',
      actionType: 'Pembaruan Pengaturan Sistem',
      category: 'PENGATURAN_SISTEM',
      staffName: 'Melinda',
      details: 'Konfigurasi printer thermal diperbarui: Ukuran 58mm, Density Pekat, Auto-cut aktif.',
      module: 'Pengaturan SIMRS'
    },
    {
      id: 'log-20260926-006',
      timestamp: '2026-09-26T20:10:05+07:00',
      actionType: 'Penyimpanan Catatan Handover Shift',
      category: 'HANDOVER_SHIFT',
      staffName: 'Agnia',
      details: 'Operan shift Siang disimpan: Pasien observasi IGD rujukan PKM Karanggeneng telah dipindahkan ke Ruang Firdaus VIP.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260926-007',
      timestamp: '2026-09-26T11:45:30+07:00',
      actionType: 'Pembaruan Status SEP BPJS',
      category: 'SEP_BPJS',
      staffName: 'Ismed',
      details: 'Status SEP kendala sidik jari pasien An. Raditya Pratama diubah menjadi "Resolved (Surat Gagal Fingerprint Terlampir)".',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260925-008',
      timestamp: '2026-09-25T13:20:18+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Syafik',
      details: 'Menerbitkan kupon rujukan PKM #MOH-202609-040 (Pasien: Bpk. Sugiarto, Perujuk: Bidan Rita, Sopir: Bpk. Dani, Fee: Rp 35.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260925-009',
      timestamp: '2026-09-25T07:50:12+07:00',
      actionType: 'Penyimpanan Catatan Handover Shift',
      category: 'HANDOVER_SHIFT',
      staffName: 'Hisyam',
      details: 'Operan shift Malam ke Pagi diselesaikan: Kuota Poli Bedah & Ortopedi terisi 80%.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260924-010',
      timestamp: '2026-09-24T15:10:45+07:00',
      actionType: 'Pembaruan Pengaturan Sistem',
      category: 'PENGATURAN_SISTEM',
      staffName: 'Alivia',
      details: 'Memperbarui tarif dasar kupon referral BPJS PKM menjadi Rp 20.000 dan Desa Mohat Rp 25.000.',
      module: 'Pengaturan SIMRS'
    },
    {
      id: 'log-20260923-011',
      timestamp: '2026-09-23T10:05:30+07:00',
      actionType: 'Pencatatan Berkas Jasa Raharja',
      category: 'JASA_RAHARJA',
      staffName: 'Abi',
      details: 'Pendaftaran klaim laka lantas Pasien Hendro Siswanto (No. LP: LP/B/89/IX/2026/Polsek Babat, Plafon Rp 20.000.000).',
      module: 'Plafon Jasa Raharja'
    },
    {
      id: 'log-20260922-012',
      timestamp: '2026-09-22T13:40:12+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Melinda',
      details: 'Menerbitkan kupon Mohat Desa #MOH-202609-039 (Pasien: Ibu Wardah, Sopir: Bpk. Taufik, Fee: Rp 25.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260921-013',
      timestamp: '2026-09-21T09:15:20+07:00',
      actionType: 'Pendaftaran Peserta Khitan',
      category: 'KHITAN_JUMAT',
      staffName: 'Ady',
      details: 'Pendaftaran peserta khitan berkah An. Muhammad Fajar (Usia 9 th, Desa Datinawong, Metode Cauter Laser).',
      module: 'Khitan Jumat'
    },
    {
      id: 'log-20260920-014',
      timestamp: '2026-09-20T17:35:10+07:00',
      actionType: 'Penyimpanan Catatan Handover Shift',
      category: 'HANDOVER_SHIFT',
      staffName: 'Agnia',
      details: 'Operan shift Siang disimpan: Pasien jaminan Asuransi Prudential GL Final disetujui tanpa excess.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260918-015',
      timestamp: '2026-09-18T14:12:00+07:00',
      actionType: 'Pembaruan Status SEP BPJS',
      category: 'SEP_BPJS',
      staffName: 'Ismed',
      details: 'Pembaruan status kendala SEP Pasien Ny. Kholifah (No. RM 098421) dari "Pending" ke "Resolved (cetak SEP)".',
      module: 'Catatan Pasien'
    },
    // --- Data Bulan Agustus 2026 (1 Bulan Terakhir) ---
    {
      id: 'log-20260830-016',
      timestamp: '2026-08-30T11:20:40+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Syafik',
      details: 'Menerbitkan kupon rujukan PKM #MOH-202608-115 (Pasien: Tn. Hariyanto, Perujuk: Bidan Luluk, Fee: Rp 35.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260828-017',
      timestamp: '2026-08-28T16:05:15+07:00',
      actionType: 'Penyimpanan Catatan Handover Shift',
      category: 'HANDOVER_SHIFT',
      staffName: 'Hisyam',
      details: 'Operan shift Siang: Semua berkas KLL tanggal 28 Agustus telah diserahkan ke bagian Casemix.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260825-018',
      timestamp: '2026-08-25T09:40:22+07:00',
      actionType: 'Pembaruan Status SEP BPJS',
      category: 'SEP_BPJS',
      staffName: 'Alivia',
      details: 'Status kendala BPJS rujukan faskes kadaluarsa pasien Ny. Sumarni (No. RM 104322) diubah menjadi "Resolved (Surat Kontrol Aktif)".',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260822-019',
      timestamp: '2026-08-22T13:10:00+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Abi',
      details: 'Menerbitkan kupon Mohat #MOH-202608-102 (Pasien: An. Dimas, Sopir: Bpk. Suwardi, Fee: Rp 25.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260818-020',
      timestamp: '2026-08-18T15:55:10+07:00',
      actionType: 'Pembaruan Pengaturan Sistem',
      category: 'PENGATURAN_SISTEM',
      staffName: 'Ady',
      details: 'Template pesan WhatsApp konfirmasi jadwal operasi dan pengingat kontrol berhasil diperbarui.',
      module: 'Pengaturan SIMRS'
    },
    {
      id: 'log-20260815-021',
      timestamp: '2026-08-15T08:30:45+07:00',
      actionType: 'Penyimpanan Catatan Handover Shift',
      category: 'HANDOVER_SHIFT',
      staffName: 'Melinda',
      details: 'Operan shift Pagi: 5 jadwal operasi elektif bedah dr. Rieski Sp.B terkonfirmasi hadir.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260810-022',
      timestamp: '2026-08-10T14:15:30+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Agnia',
      details: 'Menerbitkan kupon PKM BPJS #MOH-202608-078 (Pasien: Ny. Kasminah, Perujuk: Bidan Nurul, Fee: Rp 20.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260805-023',
      timestamp: '2026-08-05T10:20:15+07:00',
      actionType: 'Pembaruan Status SEP BPJS',
      category: 'SEP_BPJS',
      staffName: 'Ismed',
      details: 'Pembaruan status kendala SEP pasien Tn. Zainal Arifin (No. RM 088421) menjadi "Resolved".',
      module: 'Catatan Pasien'
    },
    // --- Data Bulan Juli 2026 (2-3 Bulan Terakhir) ---
    {
      id: 'log-20260729-024',
      timestamp: '2026-07-29T16:45:00+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Syafik',
      details: 'Menerbitkan kupon rujukan PKM #MOH-202607-094 (Pasien: Bpk. Suroso, Perujuk: Bidan Ana, Fee: Rp 35.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260725-025',
      timestamp: '2026-07-25T11:30:10+07:00',
      actionType: 'Penyimpanan Catatan Handover Shift',
      category: 'HANDOVER_SHIFT',
      staffName: 'Hisyam',
      details: 'Operan shift Pagi ke Siang: Seluruh registrasi rawat jalan poli spesialis berjalan lancar.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260720-026',
      timestamp: '2026-07-20T14:10:25+07:00',
      actionType: 'Pembaruan Status SEP BPJS',
      category: 'SEP_BPJS',
      staffName: 'Alivia',
      details: 'Pembaruan status kendala BPJS NIK ganda pasien Bpk. Supardi diatasi dengan bridging VClaim.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260715-027',
      timestamp: '2026-07-15T09:05:40+07:00',
      actionType: 'Pembaruan Pengaturan Sistem',
      category: 'PENGATURAN_SISTEM',
      staffName: 'Abi',
      details: 'Sinkronisasi awal Google Drive storage engine diaktifkan untuk akun khitananmassal55@gmail.com.',
      module: 'Pengaturan SIMRS'
    },
    {
      id: 'log-20260710-028',
      timestamp: '2026-07-10T15:20:18+07:00',
      actionType: 'Penerbitan Kupon Fee Mohat',
      category: 'KUPON_MOHAT',
      staffName: 'Ady',
      details: 'Menerbitkan kupon Mohat Desa #MOH-202607-065 (Pasien: Ny. Maimunah, Sopir: Bpk. Rohman, Fee: Rp 25.000).',
      module: 'Kupon Fee Mohat'
    },
    {
      id: 'log-20260705-029',
      timestamp: '2026-07-05T08:15:33+07:00',
      actionType: 'Penyimpanan Catatan Handover Shift',
      category: 'HANDOVER_SHIFT',
      staffName: 'Melinda',
      details: 'Operan shift Pagi diserahkan: 4 pasien program Khitan Berkah Jumat selesai kontrol luka.',
      module: 'Catatan Pasien'
    },
    {
      id: 'log-20260701-030',
      timestamp: '2026-07-01T13:40:50+07:00',
      actionType: 'Pembaruan Status SEP BPJS',
      category: 'SEP_BPJS',
      staffName: 'Agnia',
      details: 'Verifikasi status kepesertaan aktif BPJS PBI Pasien Bpk. Tarjo (No. RM 076129) tervalidasi sukses.',
      module: 'Catatan Pasien'
    }
  ];
};

/**
 * Membaca daftar Activity Log dari LocalStorage
 */
export const loadSystemActivityLogs = (): SystemActivityLog[] => {
  try {
    const raw = localStorage.getItem(SYSTEM_AUDIT_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Gagal membaca log aktivitas sistem:', err);
  }

  // Fallback ke seed data 1-3 bulan
  const initial = generateInitialAuditLogs();
  saveSystemActivityLogs(initial);
  return initial;
};

/**
 * Menyimpan daftar Activity Log ke LocalStorage dan memicu auto-sync
 */
export const saveSystemActivityLogs = (logs: SystemActivityLog[]): void => {
  try {
    // Pertahankan batas wajar (hingga 2,000 log) untuk performa cepat browser
    const trimmed = logs.slice(0, 2000);
    localStorage.setItem(SYSTEM_AUDIT_LOGS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Gagal menyimpan log aktivitas sistem:', err);
  }
};

/**
 * Automated Activity Logger
 * Mencatat peristiwa operasional sistem dengan timestamp RFC3339
 * dan menyinkronkan perubahan ke rsumb_database.json secara otomatis di latar belakang.
 */
export const logSystemActivity = (
  actionType: string,
  details: string,
  staffName?: string,
  category: ActivityActionCategory = 'PENGATURAN_SISTEM',
  module?: string,
  metadata?: Record<string, any>
): SystemActivityLog => {
  const currentStaff = staffName?.trim() || loadActiveStaff().name || 'Petugas Pendaftaran';
  const now = new Date();
  const timestampRfc3339 = getRfc3339Timestamp(now);

  const newLog: SystemActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: timestampRfc3339,
    actionType,
    category,
    staffName: currentStaff,
    details,
    module: module || 'Portal SIMRS',
    metadata
  };

  try {
    const existingLogs = loadSystemActivityLogs();
    const updated = [newLog, ...existingLogs];
    saveSystemActivityLogs(updated);

    // Kirim notifikasi event ke seluruh komponen UI yang aktif
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rsumb_audit_logs_updated', {
          detail: newLog
        })
      );
    }

    // Picu auto-sync ke Google Drive (rsumb_database.json) secara silent
    triggerSilentDriveSync(2000);
  } catch (e) {
    console.error('Error logging system activity:', e);
  }

  return newLog;
};

/**
 * Menghapus atau me-reset log aktivitas sistem
 */
export const clearSystemActivityLogs = (): void => {
  localStorage.removeItem(SYSTEM_AUDIT_LOGS_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rsumb_audit_logs_updated'));
  }
};

/**
 * Helper label & styling kategori audit
 */
export const CATEGORY_META_MAP: Record<
  ActivityActionCategory,
  { label: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  KUPON_MOHAT: {
    label: 'Kupon Mohat',
    colorClass: 'text-emerald-800',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  },
  HANDOVER_SHIFT: {
    label: 'Handover Shift',
    colorClass: 'text-blue-800',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200'
  },
  SEP_BPJS: {
    label: 'SEP BPJS',
    colorClass: 'text-amber-800',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  PENGATURAN_SISTEM: {
    label: 'Pengaturan Sistem',
    colorClass: 'text-purple-800',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200'
  },
  CATATAN_PASIEN: {
    label: 'Catatan Pasien',
    colorClass: 'text-cyan-800',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200'
  },
  JADWAL_OPERASI: {
    label: 'Jadwal Operasi',
    colorClass: 'text-rose-800',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200'
  },
  KHITAN_JUMAT: {
    label: 'Khitan Jumat',
    colorClass: 'text-teal-800',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200'
  },
  JASA_RAHARJA: {
    label: 'Jasa Raharja',
    colorClass: 'text-indigo-800',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200'
  },
  DOKUMEN_MASTER: {
    label: 'Dokumen Master',
    colorClass: 'text-orange-800',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200'
  },
  SINKRONISASI: {
    label: 'Sinkronisasi Cloud',
    colorClass: 'text-sky-800',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200'
  }
};
