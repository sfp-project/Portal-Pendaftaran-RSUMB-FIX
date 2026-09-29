export type ShiftCode =
  | 'P'
  | 'I/P'
  | 'S'
  | 'I/S'
  | 'M'
  | 'P2'
  | 'L'
  | 'LE'
  | 'C'
  | '-'
  | string;

export interface IncentiveRates {
  uangMalam: number; // default: Rp 5.000 / shift 'M'
  uangMakan: number; // default: Rp 6.000 / hari kerja (Non-Senin & Non-Kamis)
  hoursP: number; // default: 7 jam (07.00 - 14.00)
  hoursS: number; // default: 7 jam (14.00 - 21.00)
  hoursM: number; // default: 10 jam (21.00 - 07.00)
  hoursP2: number; // default: 7 jam
}

export interface StaffScheduleRow {
  id: string;
  name: string;
  nip?: string;
  role?: string;
  shifts: Record<number, string>; // key: tanggal (1..31), value: kode shift
}

export interface MonthlyScheduleData {
  month: number; // 1-12
  year: number; // e.g. 2026
  monthName: string;
  daysInMonth: number;
  nationalHolidays: number[]; // Tanggal Merah selain hari Minggu (1..31)
  staffRows: StaffScheduleRow[];
}

export interface StaffCalculatedSummary {
  id: string;
  name: string;
  role?: string;
  countP: number; // P, I/P, P2
  countS: number; // S, I/S
  countM: number; // M
  countL: number; // L, LE
  countC: number; // C
  countOther: number;
  extraOffDays: number; // Ekstra Libur: kerja di Tanggal Merah (Senin-Sabtu)
  totalHours: number; // Total Jam Kerja Bulanan
  eligibleMealDays: number; // Jumlah shift M pada hari Selasa, Rabu, Jumat, Sabtu & Minggu
  uangMalam: number; // countM * tarifUangMalam
  uangMakan: number; // eligibleMealDays * tarifUangMakan
  totalInsentif: number; // uangMalam + uangMakan
  dailyDetails: {
    day: number;
    dayName: string;
    dayOfWeek: number; // 0: Ahad/Minggu, 1: Senin, ..., 6: Sabtu
    shift: string;
    hours: number;
    hasMeal: boolean;
    isNight: boolean;
    isNationalHoliday: boolean;
    isExtraOffDay: boolean;
  }[];
}

export interface DepartmentTotalSummary {
  totalStaff: number;
  totalP: number;
  totalS: number;
  totalM: number;
  totalL: number;
  totalC: number;
  totalExtraOffDays: number;
  totalHours: number;
  totalUangMalam: number;
  totalUangMakan: number;
  grandTotalInsentif: number;
}

export interface MonthlyArchiveRecord {
  id: string; // e.g. "rekap_2026_08"
  month: number; // 1-12
  year: number; // e.g. 2026
  monthName: string;
  savedAt: string; // ISO string
  savedTimestamp: number;
  savedBy: string; // e.g. "PJ Admisi & Kasir RSUMB"
  isLocked: boolean;
  notes?: string;
  ratesSnapshot: IncentiveRates;
  nationalHolidays: number[];
  daysInMonth: number;
  staffRows: StaffScheduleRow[];
  staffSummaries: StaffCalculatedSummary[];
  departmentTotals: DepartmentTotalSummary;
}

export interface ArchiveIndexItem {
  id: string; // "rekap_2026_08"
  month: number;
  year: number;
  monthName: string;
  savedAt: string;
  savedTimestamp: number;
  savedBy: string;
  totalStaff: number;
  totalM: number;
  totalUangMalam: number;
  totalUangMakan: number;
  grandTotalInsentif: number;
  isLocked: boolean;
}
