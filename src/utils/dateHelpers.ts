import { DoctorSchedule, DoctorLeaveAnnouncement, DoctorLeaveItem } from '../types';

const MONTH_MAP: { [key: string]: number } = {
  januari: 0, jan: 0,
  februari: 1, feb: 1, pebruari: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agu: 7, agt: 7, agust: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  oktober: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  desember: 11, des: 11, dec: 11
};

/**
 * Extracts all valid timestamps found in an Indonesian or standard date string
 * (e.g. "26 & 29 Agustus 2026", "1 s/d 5 September 2026", "1 September 2026", "2026-09-01", "22/09/2026")
 */
export function extractTimestampsFromText(text: string): number[] {
  if (!text) return [];
  const timestamps: number[] = [];
  const defaultYear = new Date().getFullYear();

  // Match ISO YYYY-MM-DD
  const isoMatches = text.matchAll(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g);
  for (const m of isoMatches) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    const date = new Date(y, mo, d);
    if (!isNaN(date.getTime())) timestamps.push(date.getTime());
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatches = text.matchAll(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/g);
  for (const m of dmyMatches) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const date = new Date(y, mo, d);
    if (!isNaN(date.getTime())) timestamps.push(date.getTime());
  }

  // Match compound days e.g. "26 & 29 Agustus 2026", "26-29 Agustus 2026", "1 s/d 5 September 2026"
  const compoundMatch = text.match(/(\d{1,2})\s*(?:&|-|dan|,|s\/d|sd|sampai)\s*(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/i);
  if (compoundMatch) {
    const d1 = parseInt(compoundMatch[1], 10);
    const d2 = parseInt(compoundMatch[2], 10);
    const monthStr = compoundMatch[3].toLowerCase();
    const year = compoundMatch[4] ? parseInt(compoundMatch[4], 10) : defaultYear;
    const month = MONTH_MAP[monthStr] ?? -1;

    if (month !== -1) {
      timestamps.push(new Date(year, month, d1).getTime());
      timestamps.push(new Date(year, month, d2).getTime());
    }
  }

  // Match standard single Indonesian date e.g. "4 September 2026" or "4 September"
  const singleMatches = text.matchAll(/(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/g);
  for (const m of singleMatches) {
    const day = parseInt(m[1], 10);
    const monthStr = m[2].toLowerCase();
    const year = m[3] ? parseInt(m[3], 10) : defaultYear;
    const month = MONTH_MAP[monthStr] ?? -1;
    if (month !== -1) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) timestamps.push(date.getTime());
    }
  }

  return timestamps;
}

/**
 * Returns the earliest timestamp found in a schedule item.
 * Prioritizes tglLibur first, and uses tglMasuk as fallback.
 */
export function getScheduleItemEarliestTimestamp(item: DoctorLeaveItem): number {
  const tsLibur = extractTimestampsFromText(item.tglLibur || '');
  if (tsLibur.length > 0) return Math.min(...tsLibur);
  const tsMasuk = extractTimestampsFromText(item.tglMasuk || '');
  if (tsMasuk.length > 0) return Math.min(...tsMasuk);
  return Number.MAX_SAFE_INTEGER;
}

/**
 * Returns the earliest timestamp across all schedule items of a doctor leave announcement
 */
export function getDoctorEarliestTimestamp(doc: DoctorLeaveAnnouncement): number {
  if (!doc || !doc.jadwal || !Array.isArray(doc.jadwal) || doc.jadwal.length === 0) return Number.MAX_SAFE_INTEGER;
  const timestamps = doc.jadwal.map((j) => getScheduleItemEarliestTimestamp(j));
  return Math.min(...timestamps);
}

/**
 * Normalizes doctor name string for grouping (removing extra spaces, lowercasing)
 */
export function normalizeDoctorName(dpjp: string): string {
  return dpjp
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Consolidates/merges leaves so 1 doctor = 1 card, and sorts:
 * 1. Schedules within each doctor chronologically (closest date first)
 * 2. Doctor cards in order of their closest date
 */
/**
 * Returns all distinct timestamps found for a schedule item (checking tglLibur, tglMasuk, and keterangan).
 */
export function getAllScheduleItemTimestamps(item: DoctorLeaveItem): number[] {
  const ts1 = extractTimestampsFromText(item.tglLibur || '');
  const ts2 = extractTimestampsFromText(item.tglMasuk || '');
  const ts3 = extractTimestampsFromText(item.keterangan || '');
  return Array.from(new Set([...ts1, ...ts2, ...ts3]));
}

/**
 * Normalizes any reference date (string, Date, or timestamp number) to start of day timestamp (00:00:00).
 * Defaults to current local date if not provided.
 */
export function getReferenceStartOfDayTimestamp(refDate?: string | Date | number): number {
  if (typeof refDate === 'number') {
    const d = new Date(refDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (refDate instanceof Date) {
    const d = new Date(refDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (typeof refDate === 'string' && refDate.trim()) {
    const trimmed = refDate.trim();
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      dt.setHours(0, 0, 0, 0);
      if (!isNaN(dt.getTime())) return dt.getTime();
    }
    const ts = extractTimestampsFromText(trimmed);
    if (ts.length > 0) {
      const dt = new Date(ts[0]);
      dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    }
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

export interface DoctorUpcomingLeaveInfo {
  isUpcoming: boolean;
  score: number;
  nearestTimestamp: number | null;
  relativeBadgeText: string;
  badgeTone: 'urgent' | 'upcoming' | 'past' | 'none';
}

/**
 * Calculates upcoming score and relative badge label for a doctor leave card.
 */
export function getDoctorUpcomingLeaveInfo(
  doc: DoctorLeaveAnnouncement,
  refDate?: string | Date | number
): DoctorUpcomingLeaveInfo {
  const refTimestamp = getReferenceStartOfDayTimestamp(refDate);
  if (!doc || !doc.jadwal || !Array.isArray(doc.jadwal) || doc.jadwal.length === 0) {
    return {
      isUpcoming: false,
      score: Number.MAX_SAFE_INTEGER,
      nearestTimestamp: null,
      relativeBadgeText: '',
      badgeTone: 'none'
    };
  }

  const allTimestamps: number[] = [];
  for (const j of doc.jadwal) {
    if (j) {
      allTimestamps.push(...getAllScheduleItemTimestamps(j));
    }
  }

  if (allTimestamps.length === 0) {
    return {
      isUpcoming: false,
      score: Number.MAX_SAFE_INTEGER,
      nearestTimestamp: null,
      relativeBadgeText: '',
      badgeTone: 'none'
    };
  }

  const upcomingTimestamps = allTimestamps.filter((ts) => ts >= refTimestamp);

  if (upcomingTimestamps.length > 0) {
    const nearestUpcoming = Math.min(...upcomingTimestamps);
    const diffDays = Math.round((nearestUpcoming - refTimestamp) / (24 * 60 * 60 * 1000));

    let relativeBadgeText = '';
    let badgeTone: 'urgent' | 'upcoming' | 'past' = 'upcoming';

    if (diffDays === 0) {
      relativeBadgeText = 'Hari Ini';
      badgeTone = 'urgent';
    } else if (diffDays === 1) {
      relativeBadgeText = 'Besok';
      badgeTone = 'urgent';
    } else if (diffDays <= 7) {
      relativeBadgeText = `${diffDays} hari lagi`;
      badgeTone = 'upcoming';
    } else {
      const d = new Date(nearestUpcoming);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      relativeBadgeText = `${d.getDate()} ${months[d.getMonth()]}`;
      badgeTone = 'upcoming';
    }

    return {
      isUpcoming: true,
      score: nearestUpcoming,
      nearestTimestamp: nearestUpcoming,
      relativeBadgeText,
      badgeTone
    };
  }

  // All timestamps are in the past
  const mostRecentPast = Math.max(...allTimestamps);
  const d = new Date(mostRecentPast);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const pastText = `Selesai (${d.getDate()} ${months[d.getMonth()]})`;

  return {
    isUpcoming: false,
    score: -mostRecentPast,
    nearestTimestamp: mostRecentPast,
    relativeBadgeText: pastText,
    badgeTone: 'past'
  };
}

/**
 * Consolidates/merges leaves so 1 doctor = 1 card, and auto-sorts:
 * 1. Doctors with nearest upcoming leave dates first (today/immediate changes at the front)
 * 2. Schedules within each doctor chronologically (closest upcoming date first)
 * 3. Historical/past schedule changes placed neatly behind all active/upcoming ones
 */
export function consolidateAndSortDoctorLeaves(
  leaves: DoctorLeaveAnnouncement[],
  referenceDate?: string | Date
): DoctorLeaveAnnouncement[] {
  const doctorMap = new Map<string, DoctorLeaveAnnouncement>();
  const refTimestamp = getReferenceStartOfDayTimestamp(referenceDate);

  for (const leave of leaves) {
    if (!leave.dpjp) continue;
    const key = normalizeDoctorName(leave.dpjp);

    if (!doctorMap.has(key)) {
      // Clone leave object and its schedules array
      doctorMap.set(key, {
        ...leave,
        jadwal: [...(leave.jadwal || [])]
      });
    } else {
      // Merge into existing doctor card
      const existing = doctorMap.get(key)!;
      // Combine schedules avoiding exact duplicates
      const mergedSchedules = [...existing.jadwal];
      for (const item of leave.jadwal || []) {
        const isDuplicate = mergedSchedules.some(
          (m) =>
            m.tglLibur?.trim() === item.tglLibur?.trim() &&
            m.tglMasuk?.trim() === item.tglMasuk?.trim() &&
            m.tipe === item.tipe
        );
        if (!isDuplicate) {
          mergedSchedules.push(item);
        }
      }
      // Prefer non-empty poli
      const poli = existing.poli || leave.poli;
      doctorMap.set(key, {
        ...existing,
        poli,
        jadwal: mergedSchedules
      });
    }
  }

  // Convert to array
  const consolidated = Array.from(doctorMap.values()).map((doc) => {
    // Sort schedules inside this doctor's card:
    // Nearest upcoming items first (ascending), followed by past items (most recent first)
    const sortedJadwal = [...doc.jadwal].sort((a, b) => {
      const tsA = getAllScheduleItemTimestamps(a);
      const tsB = getAllScheduleItemTimestamps(b);
      const upA = tsA.filter((t) => t >= refTimestamp);
      const upB = tsB.filter((t) => t >= refTimestamp);

      if (upA.length > 0 && upB.length === 0) return -1;
      if (upA.length === 0 && upB.length > 0) return 1;

      if (upA.length > 0 && upB.length > 0) {
        return Math.min(...upA) - Math.min(...upB);
      }

      const maxA = tsA.length > 0 ? Math.max(...tsA) : 0;
      const maxB = tsB.length > 0 ? Math.max(...tsB) : 0;
      return maxB - maxA;
    });

    return {
      ...doc,
      jadwal: sortedJadwal
    };
  });

  // Auto-sort doctor cards by nearest upcoming leave date
  consolidated.sort((a, b) => {
    const infoA = getDoctorUpcomingLeaveInfo(a, refTimestamp);
    const infoB = getDoctorUpcomingLeaveInfo(b, refTimestamp);

    // 1. Upcoming doctors always come before doctors whose leaves are completely in the past
    if (infoA.isUpcoming && !infoB.isUpcoming) return -1;
    if (!infoA.isUpcoming && infoB.isUpcoming) return 1;

    // 2. Both upcoming: sort by nearest date ascending (most immediate schedule change first)
    if (infoA.isUpcoming && infoB.isUpcoming) {
      if (infoA.score !== infoB.score) {
        return infoA.score - infoB.score;
      }
    }

    // 3. Both past: sort by most recently passed first (score is -mostRecentPast, so smaller is more recent)
    if (!infoA.isUpcoming && !infoB.isUpcoming) {
      if (infoA.score !== infoB.score) {
        return infoA.score - infoB.score;
      }
    }

    // Tie-breaker: alphabetical doctor name
    return a.dpjp.localeCompare(b.dpjp);
  });

  return consolidated;
}

/**
 * Shortens Indonesian month names, removes year and extra boilerplate words
 * e.g. "26 & 29 Agustus 2026" -> "26 & 29 Ags"
 * e.g. "4 September 2026" -> "4 Sep"
 */
export function shortenIndonesianDate(str: string): string {
  if (!str) return '';
  let res = str;
  // Remove parentheses like "(Jam 13.00 WIB)"
  res = res.replace(/\([^)]*\)/g, '');
  // Remove "TANGGAL", "tanggal", "tgl"
  res = res.replace(/\b(?:tanggal|tgl)\b/gi, '');
  // Remove 4-digit years
  res = res.replace(/\b20\d{2}\b/g, '');
  // Shorten month names
  res = res.replace(/januari/gi, 'Jan');
  res = res.replace(/februari|pebruari/gi, 'Feb');
  res = res.replace(/maret/gi, 'Mar');
  res = res.replace(/april/gi, 'Apr');
  res = res.replace(/mei/gi, 'Mei');
  res = res.replace(/juni/gi, 'Jun');
  res = res.replace(/juli/gi, 'Jul');
  res = res.replace(/agustus|agt/gi, 'Ags');
  res = res.replace(/september|sept/gi, 'Sep');
  res = res.replace(/oktober/gi, 'Okt');
  res = res.replace(/november/gi, 'Nov');
  res = res.replace(/desember/gi, 'Des');
  // Clean whitespace and trailing punctuation
  res = res.replace(/\s+/g, ' ').replace(/^[\s,.-]+|[\s,.-]+$/g, '').trim();
  return res;
}

/**
 * Formats an array of date strings into a compact compound string.
 * e.g. ["3 Sep", "10 Sep"] -> "3 & 10 Sep"
 */
export function formatCompoundDates(dateStrings: string[]): string {
  if (dateStrings.length === 0) return '';
  if (dateStrings.length === 1) return shortenIndonesianDate(dateStrings[0]);

  const shortened = dateStrings.map(shortenIndonesianDate).filter(Boolean);
  if (shortened.length === 0) return '';
  if (shortened.length === 1) return shortened[0];

  // Extract month token from each (the last word if letter-only)
  const months = shortened.map((s) => {
    const parts = s.split(' ');
    const last = parts[parts.length - 1];
    return /^[A-Za-z]+$/.test(last) ? last : '';
  });

  const firstMonth = months[0];
  const allSameMonth = firstMonth !== '' && months.every((m) => m.toLowerCase() === firstMonth.toLowerCase());

  if (allSameMonth) {
    const days = shortened.map((s) => s.replace(new RegExp(`\\s+${firstMonth}$`, 'i'), '').trim());
    return `${days.join(' & ')} ${firstMonth}`;
  }

  return shortened.join(' & ');
}

export interface LeaveBadgeInfo {
  text: string;
  tipe: 'LIBUR' | 'MAJU' | 'CUTI' | 'MIXED';
  bgClass: string;
  textClass: string;
  borderClass: string;
  hoverClass: string;
}

/**
 * Builds a dynamic, specific short summary for doctor leave announcements.
 * Examples:
 * - "Libur: 26 & 29 Ags"
 * - "Maju: 3 Sep" or "Maju: 3 & 10 Sep"
 * - "Cuti: 1-5 Sep"
 * - "Libur: 1 Sep • Maju: 3 & 10 Sep"
 */
export function formatLeaveBadgeSummary(leave: DoctorLeaveAnnouncement): LeaveBadgeInfo {
  if (!leave || !leave.jadwal || !Array.isArray(leave.jadwal) || leave.jadwal.length === 0) {
    return {
      text: 'Info Jadwal',
      tipe: 'LIBUR',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-200/90',
      hoverClass: 'hover:bg-amber-100 hover:border-amber-300'
    };
  }

  const liburItems = leave.jadwal.filter((j) => j && j.tipe === 'LIBUR');
  const majuItems = leave.jadwal.filter((j) => j && j.tipe === 'MAJU');
  const cutiItems = leave.jadwal.filter((j) => j && j.tipe === 'CUTI');

  const parts: string[] = [];

  // Format LIBUR dates
  if (liburItems.length > 0) {
    const liburDates = liburItems.map((item) => item.tglLibur).filter(Boolean);
    const formatted = formatCompoundDates(liburDates);
    if (formatted) {
      parts.push(`Libur: ${formatted}`);
    }
  }

  // Format MAJU dates (target destination date e.g. tglMasuk)
  if (majuItems.length > 0) {
    const majuDates = majuItems.map((item) => item.tglMasuk || item.tglLibur).filter(Boolean);
    const formatted = formatCompoundDates(majuDates);
    if (formatted) {
      parts.push(`Maju: ${formatted}`);
    }
  }

  // Format CUTI dates
  if (cutiItems.length > 0) {
    const cutiDates = cutiItems.map((item) => item.tglLibur).filter(Boolean);
    const formatted = formatCompoundDates(cutiDates);
    if (formatted) {
      parts.push(`Cuti: ${formatted}`);
    }
  }

  const fullText = parts.join(' • ') || 'Penyesuaian Jadwal';

  if (majuItems.length > 0 && liburItems.length === 0 && cutiItems.length === 0) {
    return {
      text: fullText,
      tipe: 'MAJU',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-200',
      hoverClass: 'hover:bg-blue-100/80 hover:border-blue-300'
    };
  } else if (cutiItems.length > 0 && liburItems.length === 0 && majuItems.length === 0) {
    return {
      text: fullText,
      tipe: 'CUTI',
      bgClass: 'bg-purple-50',
      textClass: 'text-purple-700',
      borderClass: 'border-purple-200',
      hoverClass: 'hover:bg-purple-100/80 hover:border-purple-300'
    };
  } else if (majuItems.length > 0 && liburItems.length > 0) {
    return {
      text: fullText,
      tipe: 'MIXED',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-800',
      borderClass: 'border-indigo-200',
      hoverClass: 'hover:bg-indigo-100/80 hover:border-indigo-300'
    };
  } else {
    return {
      text: fullText,
      tipe: 'LIBUR',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-200',
      hoverClass: 'hover:bg-amber-100/80 hover:border-amber-300'
    };
  }
}

/**
 * Formats YYYY-MM-DD to Indonesian formatted date string
 * e.g. "2026-09-01" -> "Selasa, 1 September 2026" (withDayName = true) or "1 September 2026" (withDayName = false)
 */
export function formatYMDToIndonesian(ymdStr: string, withDayName = true): string {
  if (!ymdStr) return '';
  const parts = ymdStr.split('-');
  if (parts.length !== 3) return ymdStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return ymdStr;

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[m];

  return withDayName ? `${dayName}, ${d} ${monthName} ${y}` : `${d} ${monthName} ${y}`;
}

/**
 * Checks if a textual date note in Indonesian matches a target Year, Month (0-11), and Day.
 */
export function isDateMatchingText(text: string, targetY: number, targetM: number, targetD: number): boolean {
  if (!text) return false;

  // 1. Match ISO YYYY-MM-DD
  const isoMatches = text.matchAll(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g);
  for (const m of isoMatches) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    if (y === targetY && mo === targetM && d === targetD) return true;
  }

  // 2. Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatches = text.matchAll(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/g);
  for (const m of dmyMatches) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    if (y === targetY && mo === targetM && d === targetD) return true;
  }

  // 3. Match range e.g. "1 s/d 5 September 2026", "1-5 September 2026", "1 sd 5 September"
  const rangeMatch = text.match(/(\d{1,2})\s*(?:s\/d|sd|sampai|-)\s*(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/i);
  if (rangeMatch) {
    const d1 = parseInt(rangeMatch[1], 10);
    const d2 = parseInt(rangeMatch[2], 10);
    const monthStr = rangeMatch[3].toLowerCase();
    const year = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : targetY;
    const month = MONTH_MAP[monthStr] ?? -1;

    if (month === targetM && (year === targetY || !rangeMatch[4])) {
      const minD = Math.min(d1, d2);
      const maxD = Math.max(d1, d2);
      if (targetD >= minD && targetD <= maxD) return true;
    }
  }

  // 4. Match compound days e.g. "26 & 29 Agustus 2026", "26 dan 29 Agustus", "26, 29 Agustus"
  const compoundMatch = text.match(/(\d{1,2})\s*(?:&|dan|,)\s*(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/i);
  if (compoundMatch) {
    const d1 = parseInt(compoundMatch[1], 10);
    const d2 = parseInt(compoundMatch[2], 10);
    const monthStr = compoundMatch[3].toLowerCase();
    const year = compoundMatch[4] ? parseInt(compoundMatch[4], 10) : targetY;
    const month = MONTH_MAP[monthStr] ?? -1;

    if (month === targetM && (year === targetY || !compoundMatch[4])) {
      if (targetD === d1 || targetD === d2) return true;
    }
  }

  // 5. Match standard single Indonesian date e.g. "4 September 2026" or "4 September"
  const singleMatches = text.matchAll(/(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/g);
  for (const m of singleMatches) {
    const day = parseInt(m[1], 10);
    const monthStr = m[2].toLowerCase();
    const year = m[3] ? parseInt(m[3], 10) : targetY;
    const month = MONTH_MAP[monthStr] ?? -1;

    if (month === targetM && (year === targetY || !m[3]) && day === targetD) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a doctor's leave announcement has an active event (LIBUR, MAJU, CUTI, etc.) on the given date (YYYY-MM-DD).
 */
export function isDoctorLeaveActiveOnDate(doc: DoctorLeaveAnnouncement, targetDateYMD: string): boolean {
  if (!targetDateYMD) return true;
  const parts = targetDateYMD.split('-');
  if (parts.length !== 3) return true;
  const targetY = parseInt(parts[0], 10);
  const targetM = parseInt(parts[1], 10) - 1;
  const targetD = parseInt(parts[2], 10);

  if (!doc.jadwal || doc.jadwal.length === 0) return false;

  return doc.jadwal.some((j) => {
    return (
      isDateMatchingText(j.tglLibur || '', targetY, targetM, targetD) ||
      isDateMatchingText(j.tglMasuk || '', targetY, targetM, targetD) ||
      isDateMatchingText(j.keterangan || '', targetY, targetM, targetD)
    );
  });
}

/**
 * Formats doctor practice schedule time (Jadwal Praktik) cleanly with fallback to Jam HFIS.
 * Resolves bug where undefined jamMulai/jamSelesai yielded "- WIB".
 * Handles:
 * - Direct property: sch.jadwal, sch.jam_praktik, sch.jamPraktik
 * - Secondary property: sch.jamMulai & sch.jamSelesai, sch.jam_mulai & sch.jam_selesai
 * - Automatic Fallback: sch.jamHfis or sch.jam_hfis
 * - Clean formatting: "07.00 - 14.00 WIB", "14.00 - 16.00 / Selesai WIB", "13.00 - Selesai"
 */
export const DAY_ORDER_MAP: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
  ahad: 7,
  minggu: 7
};

/**
 * Extracts start time in minutes from midnight (0 - 1439) for precise chronological sorting.
 * Supports:
 * - sch.jadwal (e.g. "07.30 - 12.00", "08:00 - 11.00", "14.00 - 16.00/Selesai", "13.00 - Selesai")
 * - sch.jamHfis (e.g. "07.00-14.00", "14.00 - 18.00")
 * Returns 9999 for missing/invalid times to place them at the end.
 */
export function getScheduleStartMinutes(
  sch: Partial<DoctorSchedule> | null | undefined,
  field: 'jadwal' | 'jamHfis' = 'jadwal'
): number {
  if (!sch) return 9999;
  let text = '';
  if (field === 'jadwal') {
    text = (
      sch.jamMulai ||
      (sch as any).jam_mulai ||
      sch.jadwal ||
      (sch as any).jam_praktik ||
      (sch as any).jamPraktik ||
      ''
    ).trim();
  } else {
    text = (sch.jamHfis || (sch as any).jam_hfis || '').trim();
  }

  // Fallback if target field is empty
  if (!text || text === '-' || text.toLowerCase() === 'undefined' || text.toLowerCase() === 'null') {
    if (field === 'jamHfis') {
      text = (sch.jadwal || (sch as any).jam_praktik || '').trim();
    }
    if (!text || text === '-' || text.toLowerCase() === 'undefined' || text.toLowerCase() === 'null') {
      return 9999;
    }
  }

  // Match first time pattern HH:MM or HH.MM or H:MM or H.MM
  const match = text.match(/(\d{1,2})[\.:](\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    if (!isNaN(hours) && !isNaN(mins) && hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
      return hours * 60 + mins;
    }
  }

  // Fallback single digit or 2-digit hour e.g. "jam 8" or "8"
  const singleMatch = text.match(/(?:jam\s*)?(\d{1,2})(?:[^\d]|$)/i);
  if (singleMatch) {
    const h = parseInt(singleMatch[1], 10);
    if (!isNaN(h) && h >= 0 && h <= 23) {
      return h * 60;
    }
  }

  return 9999;
}

export function formatDoctorScheduleTime(
  sch: Partial<DoctorSchedule> | null | undefined,
  includeTimezone: boolean = false
): string {
  if (!sch) return '-';

  const isInvalidOrPlaceholder = (val: string | undefined | null): boolean => {
    if (!val) return true;
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-') return true;
    const lower = trimmed.toLowerCase();
    return (
      lower === 'undefined' ||
      lower === 'null' ||
      lower === '- wib' ||
      lower === 'undefined - undefined wib' ||
      lower === 'undefined - undefined'
    );
  };

  // 1. Primary candidate: sch.jadwal, sch.jam_praktik, sch.jamPraktik, sch.jam
  let raw: string = (
    sch.jadwal ||
    (sch as any).jam_praktik ||
    (sch as any).jamPraktik ||
    (sch as any).jam ||
    ''
  ).trim();

  // 2. Secondary candidate: sch.jamMulai & sch.jamSelesai, sch.jam_mulai & sch.jam_selesai
  if (isInvalidOrPlaceholder(raw)) {
    const mulai = (((sch as any).jamMulai || (sch as any).jam_mulai || '') as string).trim();
    const selesai = (((sch as any).jamSelesai || (sch as any).jam_selesai || '') as string).trim();

    if (mulai && selesai && !isInvalidOrPlaceholder(mulai) && !isInvalidOrPlaceholder(selesai)) {
      raw = `${mulai} - ${selesai}`;
    } else if (mulai && !isInvalidOrPlaceholder(mulai)) {
      raw = `${mulai} - Selesai`;
    }
  }

  // 3. Fallback candidate: Jam HFIS
  if (isInvalidOrPlaceholder(raw)) {
    const hfis = (sch.jamHfis || (sch as any).jam_hfis || '').trim();
    if (!isInvalidOrPlaceholder(hfis)) {
      raw = hfis;
    }
  }

  // If still empty or only placeholder
  if (isInvalidOrPlaceholder(raw)) {
    return '-';
  }

  // Clean and normalize spacing around separators
  let clean = raw.trim();

  // Standardize single digit hours to zero-padded HH.mm and convert colons to dots
  clean = clean.replace(/\b(\d{1,2})[\.:](\d{2})\b/g, (_, h, m) => {
    return `${h.padStart(2, '0')}.${m}`;
  });

  // Normalize range separator (hyphen between digits or words)
  clean = clean.replace(/(\d{2}\.\d{2})\s*-\s*(\d{2}\.\d{2}|[A-Za-z]+)/g, '$1 - $2');

  // Normalize slash for Selesai: e.g. "14.00 - 16.00/Selesai" -> "14.00 - 16.00 / Selesai"
  clean = clean.replace(/\/\s*([Ss]elesai)/gi, ' / Selesai');

  // Check if string ends with open-ended "Selesai" without a second hour (e.g. "13.00 - Selesai")
  // Handle timezone (WIB/WITA/WIT): default is omit WIB for clean modern badge display
  if (includeTimezone) {
    if (/\b(wib|wita|wit)\b/i.test(clean)) {
      clean = clean.replace(/\bwib\b/gi, 'WIB');
    } else {
      clean = `${clean} WIB`;
    }
  } else {
    clean = clean.replace(/\s*\b(wib|wita|wit)\b/gi, '').trim();
  }

  return clean;
}

export const formatScheduleTime = formatDoctorScheduleTime;

/**
 * Formats Jam HFIS time string with neat spacing, zero-padded digits, and clean format without WIB by default.
 */
export function formatHfisTime(
  hfisTime: string | null | undefined,
  includeTimezone: boolean = false
): string {
  if (!hfisTime || hfisTime.trim() === '' || hfisTime.trim() === '-') return '-';
  let clean = hfisTime.trim();

  // Standardize single digit hours to zero-padded HH.mm and convert colons to dots
  clean = clean.replace(/\b(\d{1,2})[\.:](\d{2})\b/g, (_, h, m) => {
    return `${h.padStart(2, '0')}.${m}`;
  });

  // Normalize spacing around hyphen: "07.00-14.00" -> "07.00 - 14.00"
  clean = clean.replace(/(\d{2}\.\d{2})\s*-\s*(\d{2}\.\d{2}|[A-Za-z]+)/g, '$1 - $2');

  if (includeTimezone) {
    if (/\b(wib|wita|wit)\b/i.test(clean)) {
      clean = clean.replace(/\bwib\b/gi, 'WIB');
    } else {
      clean = `${clean} WIB`;
    }
  } else {
    clean = clean.replace(/\s*\b(wib|wita|wit)\b/gi, '').trim();
  }

  return clean;
}

/**
 * Menghitung waktu cetak (1 jam sebelum jam mulai HFIS) untuk ditampilkan di bawah badge JAM HFIS.
 * Contoh:
 * - "07.00 - 11.00" -> "cetak 06.00"
 * - "08.30 - 12.00" -> "cetak 07.30"
 * - "13.00 - 16.00" -> "cetak 12.00"
 */
export function getJamCetak(jamHfisStr: string | null | undefined): string | null {
  if (!jamHfisStr || jamHfisStr.trim() === '' || jamHfisStr.trim() === '-') {
    return null;
  }

  try {
    // Misal jamHfisStr = "07.00 - 11.00" atau "07:00 - 11:00"
    const jamMulai = jamHfisStr.split('-')[0].trim().replace('.', ':');
    const match = jamMulai.match(/(\d{1,2})[:.](\d{2})/);
    let hours: number;
    let minutes: number;

    if (match) {
      hours = Number(match[1]);
      minutes = Number(match[2]);
    } else {
      const parts = jamMulai.split(':').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        hours = parts[0];
        minutes = parts[1];
      } else {
        return null;
      }
    }

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    // Kurangi 1 jam
    let prevHours = hours - 1;
    if (prevHours < 0) prevHours = 23; // antisipasi jika lewat tengah malam

    const formattedHours = String(prevHours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `cetak ${formattedHours}.${formattedMinutes}`;
  } catch {
    return null;
  }
}

/**
 * Formats doctor quota capacity displaying the maximum daily limit (e.g. "70 Slot" or "Maks. 70 Pasien").
 * Connects directly to hospital SIMRS capacity properties: kuota_maksimal, kuota_bpjs, kuota_total, or kuotaTotal.
 */
export function formatDoctorQuota(sch: Partial<DoctorSchedule> | null | undefined): string {
  if (!sch) return '-';
  const anySch = sch as any;
  const capacity =
    anySch.kuota_maksimal ??
    anySch.kuota_bpjs ??
    anySch.kuotaBpjs ??
    anySch.kuotaMaksimal ??
    anySch.kuota_total ??
    sch.kuotaTotal ??
    anySch.kuota;

  if (capacity !== undefined && capacity !== null && capacity !== '' && !isNaN(Number(capacity))) {
    return `${capacity} Slot`;
  }
  return '-';
}


