import { ActiveNavTab } from '../types';

export type StaffShiftType = 'Shift Pagi' | 'Shift Siang' | 'Shift Malam';

export interface StaffUser {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  shift: StaffShiftType;
  avatarUrl?: string;
}

export type NotificationCategory = 'Operasional' | 'Pesan WA';
export type NotificationSubCategory =
  | 'Jadwal DPJP'
  | 'Kuota BPJS'
  | 'Handover Shift'
  | 'Broadcast Gagal';

export interface SystemNotification {
  id: string;
  category: NotificationCategory;
  subCategory: NotificationSubCategory;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  targetTab: ActiveNavTab;
  severity: 'warning' | 'alert' | 'info' | 'error';
  patientName?: string;
  dpjpName?: string;
  poliName?: string;
}
