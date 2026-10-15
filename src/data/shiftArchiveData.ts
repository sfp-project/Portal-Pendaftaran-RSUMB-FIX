import { StickyNoteItem } from '../types/inpatientOrderTypes';
import {
  saveDoc,
  removeDoc,
  subscribeCollection
} from '../services/firebase';

export type ShiftType =
  | 'Shift Pagi (07.00 - 14.00)'
  | 'Shift Siang (14.00 - 21.00)'
  | 'Shift Malam (21.00 - 07.00)';

export interface ShiftArchiveItem {
  id: string;
  date: string; // YYYY-MM-DD
  dateDisplay: string; // e.g. "Rabu, 7 Okt 2026"
  shift: ShiftType;
  officerName: string;
  notesText?: string;
  savedAt: string; // "07/10/2026 23:45 WIB"
  timestamp: number;
  snapshotNotes: StickyNoteItem[];
}

export const DAFTAR_STAF_PENDAFTARAN = [
  'Syafik',
  'Hisyam',
  'Alivia',
  'Abi',
  'Ady',
  'Melinda',
  'Agnia',
  'Ismed'
];

export const SHIFT_OPTIONS: ShiftType[] = [
  'Shift Pagi (07.00 - 14.00)',
  'Shift Siang (14.00 - 21.00)',
  'Shift Malam (21.00 - 07.00)'
];

export const STORAGE_KEY_ARCHIVES = 'rsumb_shift_archives_v1';
export const STORAGE_KEY_LAST_ARCHIVE = 'rsumb_last_shift_archive_info_v1';

// In-memory cache for synchronous fallback
let inMemoryArchives: ShiftArchiveItem[] = [];
try {
  const raw = localStorage.getItem(STORAGE_KEY_ARCHIVES);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) inMemoryArchives = parsed;
  }
} catch {}

export function getStoredArchives(): ShiftArchiveItem[] {
  return inMemoryArchives;
}

export function subscribeShiftArchives(cb: (archives: ShiftArchiveItem[]) => void): () => void {
  return subscribeCollection<ShiftArchiveItem>('shift_archives', (items) => {
    // Sort descending by timestamp
    const sorted = [...items].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    inMemoryArchives = sorted;
    try {
      localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(sorted));
      if (sorted.length > 0) {
        const latest = sorted[0];
        const dateShort = latest.dateDisplay?.includes(',')
          ? latest.dateDisplay.split(',')[1].trim()
          : latest.dateDisplay || '';
        const shiftShort = latest.shift ? latest.shift.split('(')[0].trim() : '';
        const label = `${dateShort} - ${shiftShort} oleh ${latest.officerName || 'Staf'}`;
        localStorage.setItem(STORAGE_KEY_LAST_ARCHIVE, label);
      }
    } catch {}
    cb(sorted);
  });
}

export function saveShiftArchive(archive: ShiftArchiveItem): ShiftArchiveItem[] {
  const current = inMemoryArchives;
  const updated = [archive, ...current.filter((a) => a.id !== archive.id)];
  inMemoryArchives = updated;

  try {
    localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(updated));
    const dateShort = archive.dateDisplay.includes(',')
      ? archive.dateDisplay.split(',')[1].trim()
      : archive.dateDisplay;
    const shiftShort = archive.shift.split('(')[0].trim();
    const label = `${dateShort} - ${shiftShort} oleh ${archive.officerName}`;
    localStorage.setItem(STORAGE_KEY_LAST_ARCHIVE, label);
  } catch {}

  // Sync to Firestore
  saveDoc('shift_archives', archive.id, archive).catch((err) => {
    console.warn('[Firestore] Failed saving shift archive:', err);
  });

  return updated;
}

export function deleteShiftArchive(
  archiveId: string,
  itemRef?: Partial<ShiftArchiveItem>
): ShiftArchiveItem[] {
  const current = inMemoryArchives;
  let targetId = archiveId;
  const updated = current.filter((a) => {
    if (archiveId && a.id === archiveId) return false;
    if (itemRef?.id && a.id === itemRef.id) {
      targetId = a.id;
      return false;
    }
    if (itemRef?.timestamp && a.timestamp === itemRef.timestamp) {
      targetId = a.id;
      return false;
    }
    if (
      itemRef?.date &&
      itemRef?.shift &&
      a.date === itemRef.date &&
      a.shift === itemRef.shift &&
      a.savedAt === itemRef.savedAt
    ) {
      targetId = a.id;
      return false;
    }
    return true;
  });
  inMemoryArchives = updated;

  try {
    localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(updated));
    if (updated.length > 0) {
      const latest = updated[0];
      const dateShort = latest.dateDisplay.includes(',')
        ? latest.dateDisplay.split(',')[1].trim()
        : latest.dateDisplay;
      const shiftShort = latest.shift.split('(')[0].trim();
      const label = `${dateShort} - ${shiftShort} oleh ${latest.officerName}`;
      localStorage.setItem(STORAGE_KEY_LAST_ARCHIVE, label);
    } else {
      localStorage.setItem(STORAGE_KEY_LAST_ARCHIVE, 'Belum ada arsip tersimpan');
    }
  } catch {}

  if (targetId) {
    removeDoc('shift_archives', targetId).catch((err) => {
      console.warn('[Firestore] Failed deleting shift archive:', err);
    });
  }

  return updated;
}

export function updateShiftArchive(updatedItem: ShiftArchiveItem): ShiftArchiveItem[] {
  const current = inMemoryArchives;
  const updated = current.map((a) => (a.id === updatedItem.id ? updatedItem : a));
  inMemoryArchives = updated;

  try {
    localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(updated));
  } catch {}

  saveDoc('shift_archives', updatedItem.id, updatedItem).catch((err) => {
    console.warn('[Firestore] Failed updating shift archive:', err);
  });

  return updated;
}

export function getLastArchiveInfo(): string {
  try {
    const info = localStorage.getItem(STORAGE_KEY_LAST_ARCHIVE);
    if (info) return info;
  } catch {}
  return 'Belum ada arsip tersimpan';
}

export function getCurrentShift(): ShiftType {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 14) return 'Shift Pagi (07.00 - 14.00)';
  if (hour >= 14 && hour < 21) return 'Shift Siang (14.00 - 21.00)';
  return 'Shift Malam (21.00 - 07.00)';
}

export function autoSaveShiftArchive(
  notes: StickyNoteItem[],
  officerName?: string
): { updatedArchives: ShiftArchiveItem[]; label: string; savedItem: ShiftArchiveItem } {
  const current = inMemoryArchives;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentShift = getCurrentShift();
  const officer =
    officerName ||
    (current.length > 0 && current[0].officerName
      ? current[0].officerName
      : DAFTAR_STAF_PENDAFTARAN[0]);

  const dateDisplay = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const fullSavedAt = `${now.toLocaleDateString('id-ID')} ${timeStr} WIB (Autosave)`;

  const existingIndex = current.findIndex(
    (a) => a.date === todayStr && a.shift === currentShift
  );

  let savedItem: ShiftArchiveItem;
  let updatedList: ShiftArchiveItem[];

  if (existingIndex !== -1) {
    const existing = current[existingIndex];
    savedItem = {
      ...existing,
      officerName: existing.officerName || officer,
      savedAt: fullSavedAt,
      timestamp: Date.now(),
      snapshotNotes: notes.map((n) => ({ ...n }))
    };
    updatedList = [
      savedItem,
      ...current.filter((_, idx) => idx !== existingIndex)
    ];
  } else {
    savedItem = {
      id: `arch-auto-${todayStr}-${Date.now()}`,
      date: todayStr,
      dateDisplay,
      shift: currentShift,
      officerName: officer,
      notesText: 'Autosave operan shift aktif',
      savedAt: fullSavedAt,
      timestamp: Date.now(),
      snapshotNotes: notes.map((n) => ({ ...n }))
    };
    updatedList = [savedItem, ...current];
  }

  inMemoryArchives = updatedList;

  const dateShort = dateDisplay.includes(',')
    ? dateDisplay.split(',')[1].trim()
    : dateDisplay;
  const shiftShort = currentShift.split('(')[0].trim();
  const label = `${dateShort} - ${shiftShort} oleh ${savedItem.officerName} (Autosave ${timeStr} WIB)`;

  try {
    localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(updatedList));
    localStorage.setItem(STORAGE_KEY_LAST_ARCHIVE, label);
  } catch {}

  saveDoc('shift_archives', savedItem.id, savedItem).catch((err) => {
    console.warn('[Firestore] Failed autosaving shift archive:', err);
  });

  return { updatedArchives: updatedList, label, savedItem };
}
