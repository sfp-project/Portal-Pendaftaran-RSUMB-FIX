import { StickyNoteItem } from '../types/inpatientOrderTypes';

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

export const SAMPLE_INITIAL_ARCHIVES: ShiftArchiveItem[] = [
  {
    id: 'arch-1728344700000',
    date: '2026-10-01',
    dateDisplay: 'Kamis, 1 Okt 2026',
    shift: 'Shift Malam (21.00 - 07.00)',
    officerName: 'Syafik',
    notesText: 'Operan shift malam ke pagi. Pasien Ny. Karmani masih inden bed di Lt 4 menunggu pasien KRS pukul 09.00. Ruang ICU terpantau penuh.',
    savedAt: '01/10/2026 23:45 WIB',
    timestamp: 1727829900000,
    snapshotNotes: [
      {
        id: 'lt4',
        title: 'LIST INDEN LT 4',
        subtitle: 'Ruang Rawat Inap Lt. 4 (JN, JF)',
        headerCode: 'LT 4',
        theme: 'blue',
        updatedAt: '23:40',
        contentHtml: `<div><b>KARMANI. NY / 65 Th</b></div><div>- DYSPNEU S ADHF (I50.9)</div><div>- dr. Ilma Alfia Isaridha, Sp.JP</div><div><span style="background-color: #fecdd3; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 3 ( &nbsp; )</span></div><br><div><b>SOEPRAPTO. TN / 58 Th</b></div><div>- CKR + VULNUS LACERATUM (S06.0)</div><div>- dr. Rieski Widhanar, Sp.B</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 1 (JN 1B)</span></div>`
      },
      {
        id: 'lt5',
        title: 'LIST INDEN LT 5',
        subtitle: 'Ruang Rawat Inap Lt. 5 (JM)',
        headerCode: 'LT 5',
        theme: 'green',
        updatedAt: '23:35',
        contentHtml: `<div><b>SUMIATI. NY / 54 Th</b></div><div>- GEA DEHIDRASI SEDANG (A09)</div><div>- dr. Ilham Basjar, Sp.PD</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 2 (JM 3A)</span></div><br><div><b>H. AHMAD FAUZI / 62 Th</b></div><div>- DIABETES MELITUS TIPE 2 GANGRENE (E11.9)</div><div>- dr. Yhang Lidi Tama, Sp.PD</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- UMUM VIP (VIP 2)</span></div>`
      },
      {
        id: 'vk',
        title: 'LIST INDEN VK',
        subtitle: 'Ruang Bersalin / Darussalam',
        headerCode: 'VK',
        theme: 'pink',
        updatedAt: '23:15',
        contentHtml: `<div><b>NURUL HIDAYATI. NY / 28 Th</b></div><div>- G1P0A0 INPARTU KALA 1 FASE AKTIF (O80)</div><div>- dr. Erliana, Sp.OG</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 3 (VK 2)</span></div>`
      },
      {
        id: 'kamar_kosong',
        title: 'LIST KAMAR KOSONG',
        subtitle: 'Ketersediaan Bed Siap Pakai',
        headerCode: 'BED KOSONG',
        theme: 'cream',
        updatedAt: '23:42',
        contentHtml: `<div><b><u>LT 4:</u></b></div><div>- JF: 1A, 2B</div><div>- JN: PENUH (Menunggu KRS 2 bed jam 09.00)</div><br><div><b><u>LT 5:</u></b></div><div>- JM: 3B, 5A</div><div>- VIP: VIP 4 (Ready)</div><br><div><b><u>VK / BERSALIN:</u></b></div><div>- VK 1: Tersedia</div><br><div><b><u>ICU / HCU:</u></b></div><div>- ICU: Penuh (2 Bed terisi)</div>`
      }
    ]
  },
  {
    id: 'arch-1728333900000',
    date: '2026-10-01',
    dateDisplay: 'Kamis, 1 Okt 2026',
    shift: 'Shift Siang (14.00 - 21.00)',
    officerName: 'Melinda',
    notesText: 'Operan shift siang. Pasien rujukan poli obgyn dr. Erliana masuk VK jam 18.30. Konfirmasi kamar VIP AdMedika disetujui.',
    savedAt: '01/10/2026 20:50 WIB',
    timestamp: 1727819400000,
    snapshotNotes: [
      {
        id: 'lt4',
        title: 'LIST INDEN LT 4',
        subtitle: 'Ruang Rawat Inap Lt. 4 (JN, JF)',
        headerCode: 'LT 4',
        theme: 'blue',
        updatedAt: '20:45',
        contentHtml: `<div><b>SOEPRAPTO. TN / 58 Th</b></div><div>- CKR + VULNUS LACERATUM (S06.0)</div><div>- dr. Rieski Widhanar, Sp.B</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 1 (JN 1B)</span></div>`
      },
      {
        id: 'lt5',
        title: 'LIST INDEN LT 5',
        subtitle: 'Ruang Rawat Inap Lt. 5 (JM)',
        headerCode: 'LT 5',
        theme: 'green',
        updatedAt: '20:30',
        contentHtml: `<div><b>SUMIATI. NY / 54 Th</b></div><div>- GEA DEHIDRASI SEDANG (A09)</div><div>- dr. Ilham Basjar, Sp.PD</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 2 (JM 3A)</span></div>`
      },
      {
        id: 'vk',
        title: 'LIST INDEN VK',
        subtitle: 'Ruang Bersalin / Darussalam',
        headerCode: 'VK',
        theme: 'pink',
        updatedAt: '20:40',
        contentHtml: `<div><b>NURUL HIDAYATI. NY / 28 Th</b></div><div>- G1P0A0 INPARTU KALA 1 (O80)</div><div>- dr. Erliana, Sp.OG</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 3 (VK 2)</span></div>`
      },
      {
        id: 'kamar_kosong',
        title: 'LIST KAMAR KOSONG',
        subtitle: 'Ketersediaan Bed Siap Pakai',
        headerCode: 'BED KOSONG',
        theme: 'cream',
        updatedAt: '20:48',
        contentHtml: `<div><b><u>LT 4:</u></b></div><div>- JF: 1A, 2B, 3A</div><div>- JN: 2A</div><br><div><b><u>LT 5:</u></b></div><div>- JM: 3B, 5A</div><div>- VIP: VIP 2, VIP 4</div>`
      }
    ]
  },
  {
    id: 'arch-1728219600000',
    date: '2026-10-06',
    dateDisplay: 'Selasa, 6 Okt 2026',
    shift: 'Shift Pagi (07.00 - 14.00)',
    officerName: 'Hisyam',
    notesText: 'Admisi poli pagi berjalan tertib. Booking 1 pasien elektif Hernia dr. Rieski Sp.B untuk tindakan hari Rabu.',
    savedAt: '06/10/2026 13:50 WIB',
    timestamp: 1728219600000,
    snapshotNotes: [
      {
        id: 'lt4',
        title: 'LIST INDEN LT 4',
        subtitle: 'Ruang Rawat Inap Lt. 4 (JN, JF)',
        headerCode: 'LT 4',
        theme: 'blue',
        updatedAt: '13:40',
        contentHtml: `<div><b>SUBAGYO. TN / 49 Th</b></div><div>- HERNIA INGUINALIS DEXTRA (K40.9)</div><div>- dr. Rieski Widhanar, Sp.B</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- UMUM KLS 1 (JF 1A)</span></div>`
      },
      {
        id: 'lt5',
        title: 'LIST INDEN LT 5',
        subtitle: 'Ruang Rawat Inap Lt. 5 (JM)',
        headerCode: 'LT 5',
        theme: 'green',
        updatedAt: '13:30',
        contentHtml: `<div><b>RUSTINI. NY / 42 Th</b></div><div>- FEBRIS H-4 + DENGUE FEVER (A90)</div><div>- dr. Yhang Lidi Tama, Sp.PD</div><div><span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 2 (JM 2B)</span></div>`
      },
      {
        id: 'vk',
        title: 'LIST INDEN VK',
        subtitle: 'Ruang Bersalin / Darussalam',
        headerCode: 'VK',
        theme: 'pink',
        updatedAt: '13:10',
        contentHtml: `<div><i>(Tidak ada antrean inden di VK pada shift pagi)</i></div>`
      },
      {
        id: 'kamar_kosong',
        title: 'LIST KAMAR KOSONG',
        subtitle: 'Ketersediaan Bed Siap Pakai',
        headerCode: 'BED KOSONG',
        theme: 'cream',
        updatedAt: '13:45',
        contentHtml: `<div><b><u>LT 4:</u></b> JF: 2A, 2B | JN: 1A, 3B</div><div><b><u>LT 5:</u></b> JM: 1A, 4B | VIP: 1, 3</div>`
      }
    ]
  }
];

export function getStoredArchives(): ShiftArchiveItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ARCHIVES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse shift archives from storage:', err);
  }
  // Simpan sample awal jika pertama kali dibuka dan belum pernah ada data di localStorage
  try {
    localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(SAMPLE_INITIAL_ARCHIVES));
    localStorage.setItem(
      STORAGE_KEY_LAST_ARCHIVE,
      '1 Okt 2026 - Shift Malam oleh Syafik'
    );
  } catch {
    // Ignore quota issues
  }
  return SAMPLE_INITIAL_ARCHIVES;
}

export function saveShiftArchive(archive: ShiftArchiveItem): ShiftArchiveItem[] {
  const current = getStoredArchives();
  // Taruh yang terbaru di paling atas
  const updated = [archive, ...current.filter((a) => a.id !== archive.id)];
  try {
    localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(updated));
    const dateShort = archive.dateDisplay.includes(',')
      ? archive.dateDisplay.split(',')[1].trim()
      : archive.dateDisplay;
    const shiftShort = archive.shift.split('(')[0].trim();
    const label = `${dateShort} - ${shiftShort} oleh ${archive.officerName}`;
    localStorage.setItem(STORAGE_KEY_LAST_ARCHIVE, label);
  } catch (err) {
    console.error('Failed to save archive:', err);
  }
  return updated;
}

export function deleteShiftArchive(
  archiveId: string,
  itemRef?: Partial<ShiftArchiveItem>
): ShiftArchiveItem[] {
  const current = getStoredArchives();
  const updated = current.filter((a) => {
    if (archiveId && a.id === archiveId) return false;
    if (itemRef?.id && a.id === itemRef.id) return false;
    if (itemRef?.timestamp && a.timestamp === itemRef.timestamp) return false;
    if (
      itemRef?.date &&
      itemRef?.shift &&
      a.date === itemRef.date &&
      a.shift === itemRef.shift &&
      a.savedAt === itemRef.savedAt
    ) {
      return false;
    }
    return true;
  });
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
  } catch (err) {
    console.error('Failed to delete archive:', err);
  }
  return updated;
}

export function updateShiftArchive(updatedItem: ShiftArchiveItem): ShiftArchiveItem[] {
  const current = getStoredArchives();
  const updated = current.map((a) => (a.id === updatedItem.id ? updatedItem : a));
  try {
    localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update archive:', err);
  }
  return updated;
}

export function getLastArchiveInfo(): string {
  try {
    const info = localStorage.getItem(STORAGE_KEY_LAST_ARCHIVE);
    if (info) return info;
  } catch {
    // ignore
  }
  return '1 Okt 2026 - Shift Malam oleh Syafik';
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
  const current = getStoredArchives();
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

  // Cari apakah sudah ada arsip untuk hari ini & shift yang sama
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
    // Letakkan item yang terupdate di paling atas
    updatedList = [
      savedItem,
      ...current.filter((_, idx) => idx !== existingIndex)
    ];
  } else {
    // Buat arsip baru untuk shift hari ini
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

  const dateShort = dateDisplay.includes(',')
    ? dateDisplay.split(',')[1].trim()
    : dateDisplay;
  const shiftShort = currentShift.split('(')[0].trim();
  const label = `${dateShort} - ${shiftShort} oleh ${savedItem.officerName} (Autosave ${timeStr} WIB)`;

  try {
    localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(updatedList));
    localStorage.setItem(STORAGE_KEY_LAST_ARCHIVE, label);
  } catch (err) {
    console.error('Failed to autosave shift archive:', err);
  }

  return { updatedArchives: updatedList, label, savedItem };
}
