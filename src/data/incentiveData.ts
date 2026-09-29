import {
  IncentiveRates,
  MonthlyScheduleData,
  StaffScheduleRow,
  StaffCalculatedSummary,
  DepartmentTotalSummary,
  MonthlyArchiveRecord,
  ArchiveIndexItem
} from '../types/incentiveTypes';

export const DEFAULT_INCENTIVE_RATES: IncentiveRates = {
  uangMalam: 5000,
  uangMakan: 6000,
  hoursP: 7, // 07.00 - 14.00
  hoursS: 7, // 14.00 - 21.00
  hoursM: 10, // 21.00 - 07.00
  hoursP2: 7
};

export const INDONESIAN_DAY_NAMES = [
  'Ahad',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay(); // 0 = Ahad/Minggu, 1 = Senin, ..., 4 = Kamis
}

// Sample default staff schedules (RSUMB Staf Pendaftaran & Admisi)
export function createDefaultSchedule(year = 2026, month = 9): MonthlyScheduleData {
  const daysCount = getDaysInMonth(year, month);

  // Tanggal merah nasional default di bulan berjalan (selain hari Ahad)
  // Contoh: 5 September (Maulid Nabi / Hari Besar)
  const defaultNationalHolidays = [5, 17];

  const staffNames = [
    { name: 'HISYAM', role: 'PJ Shift / Admisi' },
    { name: 'ALIVIA', role: 'Staf Loket Pendaftaran' },
    { name: 'ABI', role: 'Staf Loket Pendaftaran' },
    { name: 'DEA', role: 'Staf Admisi Rawat Inap' },
    { name: 'INTAN', role: 'Staf Loket Pendaftaran' },
    { name: 'FAIZAL', role: 'Staf Admisi IGD' },
    { name: 'RIZKI', role: 'Staf Loket Pendaftaran' },
    { name: 'DWI LESTARI', role: 'Staf Admisi Rawat Inap' },
    { name: 'NURUL AINI', role: 'Staf Loket Pendaftaran' },
    { name: 'AGUS SETIAWAN', role: 'Staf Admisi IGD' }
  ];

  // Template pola shift bergilir realistis (Pagi, Sore, Malam, Libur)
  const shiftCycles = [
    ['P', 'P', 'S', 'S', 'M', 'L', 'LE'],
    ['S', 'S', 'M', 'L', 'P', 'P', 'I/P'],
    ['M', 'L', 'P', 'S', 'S', 'M', 'L'],
    ['P', 'I/P', 'S', 'M', 'L', 'P', 'S'],
    ['S', 'M', 'L', 'LE', 'P', 'S', 'M'],
    ['I/P', 'S', 'M', 'L', 'P', 'I/S', 'S'],
    ['P', 'S', 'S', 'M', 'L', 'LE', 'P'],
    ['S', 'S', 'P', 'M', 'L', 'P', 'I/P'],
    ['M', 'L', 'LE', 'P', 'S', 'S', 'M'],
    ['I/S', 'M', 'L', 'P', 'P', 'S', 'L']
  ];

  const staffRows: StaffScheduleRow[] = staffNames.map((st, sIdx) => {
    const cycle = shiftCycles[sIdx % shiftCycles.length];
    const shifts: Record<number, string> = {};

    for (let day = 1; day <= daysCount; day++) {
      const shiftPick = cycle[(day - 1 + sIdx * 2) % cycle.length];
      shifts[day] = shiftPick;
    }

    return {
      id: `staff-${sIdx + 1}`,
      name: st.name,
      role: st.role,
      shifts
    };
  });

  return {
    year,
    month,
    monthName: MONTH_NAMES_ID[month - 1] || 'September',
    daysInMonth: daysCount,
    nationalHolidays: defaultNationalHolidays,
    staffRows
  };
}

// Perhitungan Rinci Logika Insentif per Karyawan
export function calculateStaffIncentive(
  staff: StaffScheduleRow,
  monthData: MonthlyScheduleData,
  rates: IncentiveRates
): StaffCalculatedSummary {
  let countP = 0;
  let countS = 0;
  let countM = 0;
  let countL = 0;
  let countC = 0;
  let countOther = 0;
  let extraOffDays = 0;
  let totalHours = 0;
  let eligibleMealDays = 0;

  const dailyDetails = [];

  for (let day = 1; day <= monthData.daysInMonth; day++) {
    const rawShift = (staff.shifts[day] || '').trim().toUpperCase();
    const dayOfWeek = getDayOfWeek(monthData.year, monthData.month, day);
    const dayName = INDONESIAN_DAY_NAMES[dayOfWeek];

    // Cek apakah tanggal ini terdaftar sebagai Tanggal Merah / Libur Nasional
    const isNationalHoliday = monthData.nationalHolidays.includes(day);

    let hours = 0;
    let isNight = false;
    let hasMeal = false;
    let isExtraOffDay = false;

    // Normalisasi Kode Shift
    const isP = rawShift === 'P' || rawShift === 'I/P' || rawShift === 'IP' || rawShift === 'PAGI';
    const isS = rawShift === 'S' || rawShift === 'I/S' || rawShift === 'IS' || rawShift === 'SORE';
    const isM = rawShift === 'M' || rawShift === 'MALAM';
    const isP2 = rawShift === 'P2';
    const isLibur = rawShift === 'L' || rawShift === 'LE' || rawShift === 'LIBUR';
    const isCuti = rawShift === 'C' || rawShift === 'CUTI';
    const isOffDay = isLibur || isCuti || rawShift === '-' || rawShift === '';

    if (isP) {
      countP++;
      hours = rates.hoursP;
    } else if (isP2) {
      countP++;
      hours = rates.hoursP2;
    } else if (isS) {
      countS++;
      hours = rates.hoursS;
    } else if (isM) {
      countM++;
      hours = rates.hoursM;
      isNight = true;
    } else if (isLibur) {
      countL++;
      hours = 0;
    } else if (isCuti) {
      countC++;
      hours = 0;
    } else if (rawShift) {
      countOther++;
      hours = 0;
    }

    totalHours += hours;

    // 1. KETENTUAN UANG MAKAN (MEAL ALLOWANCE = Rp 6.000):
    // - KHUSUS Shift Malam ('M'). Semua shift lain (P, I/P, S, I/S, P2, L, LE, C) = 0 uang makan.
    // - Hari yang Berhak: HANYA Selasa (2), Rabu (3), Jumat (5), Sabtu (6), dan Ahad/Minggu (0).
    // - Hari yang Dikecualikan: Senin (1) dan Kamis (4) TIDAK mendapat uang makan meskipun shift Malam ('M').
    const isSeninOrKamis = dayOfWeek === 1 || dayOfWeek === 4;
    const isEligibleMealDay = isM && !isSeninOrKamis;
    if (isEligibleMealDay) {
      hasMeal = true;
      eligibleMealDays++;
    }

    // 2. KETENTUAN EKSTRA LIBUR (NATIONAL HOLIDAY LOGIC):
    // - Hanya berlaku untuk Tanggal Merah Nasional yang jatuh pada hari Senin - Sabtu (EXCLUDE hari Ahad/Minggu = 0).
    // - Diberikan jika pegawai bekerja (P, I/P, S, I/S, M, P2) pada tanggal merah tersebut (+1).
    // - Jika pegawai libur (L/LE/C) pada tanggal merah tersebut, atau jatuh pada hari Ahad, TIDAK dihitung.
    const isMondayToSaturday = dayOfWeek >= 1 && dayOfWeek <= 6;
    if (isNationalHoliday && isMondayToSaturday && !isOffDay) {
      isExtraOffDay = true;
      extraOffDays++;
    }

    dailyDetails.push({
      day,
      dayName,
      dayOfWeek,
      shift: rawShift,
      hours,
      hasMeal,
      isNight,
      isNationalHoliday,
      isExtraOffDay
    });
  }

  const uangMalam = countM * rates.uangMalam;
  const uangMakan = eligibleMealDays * rates.uangMakan;
  const totalInsentif = uangMalam + uangMakan;

  return {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    countP,
    countS,
    countM,
    countL,
    countC,
    countOther,
    extraOffDays,
    totalHours,
    eligibleMealDays,
    uangMalam,
    uangMakan,
    totalInsentif,
    dailyDetails
  };
}

// Menghitung Rangkuman Departemen Se-Rumah Sakit
export function calculateDepartmentTotals(summaries: StaffCalculatedSummary[]): DepartmentTotalSummary {
  const safeSummaries = Array.isArray(summaries) ? summaries : [];
  return safeSummaries.reduce(
    (acc, curr) => ({
      totalStaff: acc.totalStaff + 1,
      totalP: acc.totalP + (curr?.countP || 0),
      totalS: acc.totalS + (curr?.countS || 0),
      totalM: acc.totalM + (curr?.countM || 0),
      totalL: acc.totalL + (curr?.countL || 0),
      totalC: acc.totalC + (curr?.countC || 0),
      totalExtraOffDays: acc.totalExtraOffDays + (curr?.extraOffDays || 0),
      totalHours: acc.totalHours + (curr?.totalHours || 0),
      totalUangMalam: acc.totalUangMalam + (curr?.uangMalam || 0),
      totalUangMakan: acc.totalUangMakan + (curr?.uangMakan || 0),
      grandTotalInsentif: acc.grandTotalInsentif + (curr?.totalInsentif || 0)
    }),
    {
      totalStaff: 0,
      totalP: 0,
      totalS: 0,
      totalM: 0,
      totalL: 0,
      totalC: 0,
      totalExtraOffDays: 0,
      totalHours: 0,
      totalUangMalam: 0,
      totalUangMakan: 0,
      grandTotalInsentif: 0
    }
  );
}

// Storage Helpers
const STORAGE_KEY_DATA = 'medcentral_incentive_schedule_v1';
const STORAGE_KEY_RATES = 'medcentral_incentive_rates_v1';

export function loadSavedSchedule(): MonthlyScheduleData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.staffRows) &&
        parsed.staffRows.length > 0
      ) {
        return {
          ...parsed,
          nationalHolidays: Array.isArray(parsed.nationalHolidays) ? parsed.nationalHolidays : [],
          staffRows: parsed.staffRows.map((s: any) => ({
            ...s,
            shifts: s?.shifts || {}
          }))
        };
      }
    }
  } catch (e) {
    console.error('Failed loading saved schedule:', e);
  }
  return createDefaultSchedule();
}

export function saveScheduleToStorage(data: MonthlyScheduleData): void {
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving schedule to storage:', e);
  }
}

export function loadSavedRates(): IncentiveRates {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RATES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_INCENTIVE_RATES, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed loading saved rates:', e);
  }
  return DEFAULT_INCENTIVE_RATES;
}

export function saveRatesToStorage(rates: IncentiveRates): void {
  try {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates));
  } catch (e) {
    console.error('Failed saving rates to storage:', e);
  }
}

// Inisialisasi Workspace Jadwal Kosong / Baru untuk periode tertentu
export function createBlankSchedule(year: number, month: number): MonthlyScheduleData {
  const daysInMonth = getDaysInMonth(year, month);
  return {
    year,
    month,
    monthName: MONTH_NAMES_ID[month - 1] || 'Bulan Baru',
    daysInMonth,
    nationalHolidays: [],
    staffRows: []
  };
}

// ==========================================
// ARSIP & PERSISTENSI REKAPITULASI BULANAN
// ==========================================

export const ARCHIVE_INDEX_KEY = 'medcentral_incentive_archives_index_v1';

export function getArchiveStorageKey(year: number, month: number): string {
  const m = String(month).padStart(2, '0');
  return `rekap_${year}_${m}`;
}

export function getDraftStorageKey(year: number, month: number): string {
  const m = String(month).padStart(2, '0');
  return `medcentral_schedule_draft_${year}_${m}`;
}

export function saveScheduleDraft(data: MonthlyScheduleData): void {
  try {
    const key = getDraftStorageKey(data.year, data.month);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menyimpan draf jadwal:', e);
  }
}

export function loadScheduleDraft(year: number, month: number): MonthlyScheduleData | null {
  try {
    const key = getDraftStorageKey(year, month);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Gagal memuat draf jadwal:', e);
  }
  return null;
}

export function loadMonthlyArchive(year: number, month: number): MonthlyArchiveRecord | null {
  try {
    const key = getArchiveStorageKey(year, month);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.id) {
        return parsed as MonthlyArchiveRecord;
      }
    }
  } catch (e) {
    console.error(`Gagal memuat arsip ${year}-${month}:`, e);
  }
  return null;
}

export function saveMonthlyArchive(record: MonthlyArchiveRecord): void {
  try {
    const key = record.id || getArchiveStorageKey(record.year, record.month);
    const updatedRecord = { ...record, id: key };
    localStorage.setItem(key, JSON.stringify(updatedRecord));

    // Perbarui Daftar Index Arsip
    let index: ArchiveIndexItem[] = [];
    try {
      const rawIndex = localStorage.getItem(ARCHIVE_INDEX_KEY);
      if (rawIndex) {
        index = JSON.parse(rawIndex);
        if (!Array.isArray(index)) index = [];
      }
    } catch {
      index = [];
    }

    const itemIndex = index.findIndex((item) => item.id === key);
    const summaryItem: ArchiveIndexItem = {
      id: key,
      month: updatedRecord.month,
      year: updatedRecord.year,
      monthName: updatedRecord.monthName,
      savedAt: updatedRecord.savedAt,
      savedTimestamp: updatedRecord.savedTimestamp || Date.now(),
      savedBy: updatedRecord.savedBy || 'PJ Admisi & Kasir RSUMB',
      totalStaff: updatedRecord.departmentTotals?.totalStaff || updatedRecord.staffSummaries?.length || 0,
      totalM: updatedRecord.departmentTotals?.totalM || 0,
      totalUangMalam: updatedRecord.departmentTotals?.totalUangMalam || 0,
      totalUangMakan: updatedRecord.departmentTotals?.totalUangMakan || 0,
      grandTotalInsentif: updatedRecord.departmentTotals?.grandTotalInsentif || 0,
      isLocked: updatedRecord.isLocked
    };

    if (itemIndex >= 0) {
      index[itemIndex] = summaryItem;
    } else {
      index.push(summaryItem);
    }

    // Urutkan arsip: tahun & bulan terbaru di atas
    index.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    localStorage.setItem(ARCHIVE_INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    console.error('Gagal menyimpan arsip rekapitulasi bulanan:', e);
  }
}

export function getAllMonthlyArchives(): MonthlyArchiveRecord[] {
  const archives: MonthlyArchiveRecord[] = [];
  try {
    const rawIndex = localStorage.getItem(ARCHIVE_INDEX_KEY);
    let indexItems: ArchiveIndexItem[] = [];
    if (rawIndex) {
      try {
        indexItems = JSON.parse(rawIndex);
        if (!Array.isArray(indexItems)) indexItems = [];
      } catch {
        indexItems = [];
      }
    }

    // Muat data lengkap berdasarkan index
    const keysSeen = new Set<string>();
    for (const item of indexItems) {
      if (!keysSeen.has(item.id)) {
        keysSeen.add(item.id);
        const rec = loadMonthlyArchive(item.year, item.month);
        if (rec) {
          archives.push(rec);
        }
      }
    }

    // Pindai juga jika ada key langsung di localStorage (misal rekap_2026_08) yang belum masuk index
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('rekap_') && !keysSeen.has(key)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.month && parsed.year) {
              archives.push(parsed);
              keysSeen.add(key);
            }
          }
        } catch (e) {
          // abaikan key yang tidak valid
        }
      }
    }

    // Urutkan berdasarkan tahun dan bulan terbaru
    archives.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  } catch (e) {
    console.error('Gagal memuat seluruh arsip rekapitulasi:', e);
  }
  return archives;
}

export function deleteMonthlyArchive(id: string): void {
  try {
    localStorage.removeItem(id);
    const rawIndex = localStorage.getItem(ARCHIVE_INDEX_KEY);
    if (rawIndex) {
      const index: ArchiveIndexItem[] = JSON.parse(rawIndex);
      if (Array.isArray(index)) {
        const updated = index.filter((item) => item.id !== id);
        localStorage.setItem(ARCHIVE_INDEX_KEY, JSON.stringify(updated));
      }
    }
  } catch (e) {
    console.error('Gagal menghapus arsip:', e);
  }
}

export function setArchiveLockStatus(year: number, month: number, isLocked: boolean): boolean {
  try {
    const archive = loadMonthlyArchive(year, month);
    if (archive) {
      archive.isLocked = isLocked;
      saveMonthlyArchive(archive);
      return true;
    }
  } catch (e) {
    console.error('Gagal memperbarui status kunci arsip:', e);
  }
  return false;
}

// Inisialisasi otomatis sampel arsip resmi Agustus 2026 jika belum ada
export function seedDefaultAugustArchiveIfMissing(): MonthlyArchiveRecord {
  const existing = loadMonthlyArchive(2026, 8);
  if (existing) {
    return existing;
  }

  // Buat jadwal bulan Agustus 2026 (31 hari) dengan 17 Agustus Libur Nasional
  const augustSchedule = createDefaultSchedule(2026, 8);
  augustSchedule.nationalHolidays = [17]; // 17 Agustus 2026 (HUT RI)

  const defaultRates = loadSavedRates();
  const staffSummaries = augustSchedule.staffRows.map((staff) =>
    calculateStaffIncentive(staff, augustSchedule, defaultRates)
  );
  const departmentTotals = calculateDepartmentTotals(staffSummaries);

  const augustArchive: MonthlyArchiveRecord = {
    id: 'rekap_2026_08',
    month: 8,
    year: 2026,
    monthName: 'Agustus',
    savedAt: '2026-08-31T17:00:00.000Z',
    savedTimestamp: new Date('2026-08-31T17:00:00.000Z').getTime(),
    savedBy: 'PJ Admisi & Kasir RSUMB',
    isLocked: true,
    notes: 'Rekapitulasi resmi gaji insentif shift malam & uang makan periode Agustus 2026 (Disetujui & Terverifikasi SIMRS).',
    ratesSnapshot: defaultRates,
    nationalHolidays: [17],
    daysInMonth: 31,
    staffRows: augustSchedule.staffRows,
    staffSummaries,
    departmentTotals
  };

  saveMonthlyArchive(augustArchive);
  return augustArchive;
}
