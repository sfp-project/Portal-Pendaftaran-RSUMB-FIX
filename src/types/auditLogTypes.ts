export type ActivityActionCategory =
  | 'KUPON_MOHAT'
  | 'HANDOVER_SHIFT'
  | 'SEP_BPJS'
  | 'PENGATURAN_SISTEM'
  | 'CATATAN_PASIEN'
  | 'JADWAL_OPERASI'
  | 'KHITAN_JUMAT'
  | 'JASA_RAHARJA'
  | 'DOKUMEN_MASTER'
  | 'SINKRONISASI';

export interface SystemActivityLog {
  id: string;
  timestamp: string; // RFC3339 formatted, e.g. 2026-09-28T13:18:30+07:00
  actionType: string;
  category: ActivityActionCategory;
  staffName: string;
  details: string;
  module?: string;
  metadata?: Record<string, any>;
}

export type ActivityPeriodFilter = '1_MONTH' | '3_MONTHS' | 'CUSTOM';
