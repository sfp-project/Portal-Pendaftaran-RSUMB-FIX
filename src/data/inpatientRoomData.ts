import { InpatientRoom } from '../types/inpatientRoomTypes';
import { getIdbItem, setIdbItem } from '../utils/indexedDbStorage';

export const INITIAL_INPATIENT_ROOMS: InpatientRoom[] = [
  {
    id: 'room-vvip-firdaus',
    name: 'Jannatul Firdaus - VVIP',
    pavilion: 'Paviliun Jannatul Firdaus',
    classLevel: 'VVIP',
    category: 'VVIP/VIP',
    roomRatePerDay: 1200000,
    visiteGeneralDoctor: 70000,
    visiteSpecialistDoctor: 100000,
    patientRoomFacilities: [
      'Bed Pasien (1 orang)',
      'Bed Penunggu',
      'Overbed Table',
      'Kursi Penunggu',
      '1 Set Lemari Pakaian',
      'AC Ruangan',
      'TV Kabel',
      'Kamar Mandi (air hangat)'
    ],
    familyRoomFacilities: [
      'Sofa',
      'TV Kabel',
      'Kitchen Set',
      'Kulkas',
      'Dispenser'
    ],
    totalBeds: 4,
    occupiedBeds: 3,
    availableBeds: 1,
    imageUrl: '',
    note: 'Kamar VVIP dengan ruang penunggu eksklusif terpisah, kitchen set lengkap, dan pelayanan prioritas.',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-vip-firdaus',
    name: 'Jannatul Firdaus - VIP',
    pavilion: 'Paviliun Jannatul Firdaus',
    classLevel: 'VIP',
    category: 'VVIP/VIP',
    roomRatePerDay: 720000,
    visiteGeneralDoctor: 55000,
    visiteSpecialistDoctor: 90000,
    patientRoomFacilities: [
      'Bed Pasien (1 orang)',
      'Sofa Bed',
      'Kursi Penunggu',
      'Bed Side Cabinet',
      'Kulkas',
      'AC Ruangan',
      'TV Kabel',
      'Dispenser',
      'Kamar Mandi (air hangat)'
    ],
    totalBeds: 8,
    occupiedBeds: 6,
    availableBeds: 2,
    imageUrl: '',
    note: 'Kamar VIP private berkapasitas 1 pasien dengan sofa bed penunggu dan fasilitas lengkap.',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-kelas1-naim',
    name: "Jannatun Na'im - Kelas I",
    pavilion: "Paviliun Jannatun Na'im",
    classLevel: 'Kelas I',
    category: 'Kelas 1-3',
    roomRatePerDay: 375000,
    visiteGeneralDoctor: 45000,
    visiteSpecialistDoctor: 80000,
    patientRoomFacilities: [
      'Bed Pasien (2 orang)',
      'Kursi Penunggu',
      'Bed Side Cabinet',
      'Overbed Table',
      'AC Ruangan',
      'TV Kabel',
      'Kamar Mandi (air hangat)'
    ],
    totalBeds: 12,
    occupiedBeds: 9,
    availableBeds: 3,
    imageUrl: '',
    note: 'Kamar Kelas 1 semi-private dengan tirai pembatas, berkapasitas 2 bed pasien.',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-kelas2-naim',
    name: "Jannatun Na'im - Kelas II",
    pavilion: "Paviliun Jannatun Na'im",
    classLevel: 'Kelas II',
    category: 'Kelas 1-3',
    roomRatePerDay: 252000,
    visiteGeneralDoctor: 40000,
    visiteSpecialistDoctor: 70000,
    patientRoomFacilities: [
      'Bed Pasien (2 orang)',
      'Kursi Penunggu',
      'Bed Side Cabinet',
      'Overbed Table',
      'AC Ruangan',
      'Kamar Mandi (air hangat)'
    ],
    totalBeds: 16,
    occupiedBeds: 11,
    availableBeds: 5,
    imageUrl: '',
    note: 'Kamar Kelas 2 nyaman berkapasitas 2 bed pasien dengan pendingin ruangan AC dan air hangat.',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-kelas3-mawa',
    name: "Jannatul Ma'wa - Kelas III",
    pavilion: "Paviliun Jannatul Ma'wa",
    classLevel: 'Kelas III',
    category: 'Kelas 1-3',
    roomRatePerDay: 154000,
    visiteGeneralDoctor: 35000,
    visiteSpecialistDoctor: 60000,
    patientRoomFacilities: [
      'Bed Pasien (3 orang)',
      'Kursi Penunggu',
      'Bed Side Cabinet',
      'AC Ruangan',
      'Kamar Mandi'
    ],
    totalBeds: 24,
    occupiedBeds: 19,
    availableBeds: 5,
    imageUrl: '',
    note: 'Kamar Kelas 3 ber-AC dengan ventilasi optimal, bersih dan melayani pasien BPJS maupun umum.',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-isolasi-kelas2',
    name: "Ruang Isolasi - Kelas II (Jannatun Na'im)",
    pavilion: "Paviliun Jannatun Na'im",
    classLevel: 'Isolasi',
    category: 'Intensif/Isolasi',
    roomRatePerDay: 252000,
    visiteGeneralDoctor: 40000,
    visiteSpecialistDoctor: 70000,
    patientRoomFacilities: [
      'Bed Pasien',
      'Bed Side Cabinet',
      'AC Ruangan',
      'Kamar Mandi',
      'Ruang Tekanan Khusus / Airflow Steril'
    ],
    totalBeds: 4,
    occupiedBeds: 2,
    availableBeds: 2,
    imageUrl: '',
    note: 'Ruang perawatan isolasi infeksius/non-infeksius Kelas 2 sesuai standar pencegahan dan pengendalian infeksi (PPI).',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-isolasi-kelas3',
    name: "Ruang Isolasi - Kelas III (Jannatul Ma'wa)",
    pavilion: "Paviliun Jannatul Ma'wa",
    classLevel: 'Isolasi',
    category: 'Intensif/Isolasi',
    roomRatePerDay: 154000,
    visiteGeneralDoctor: 35000,
    visiteSpecialistDoctor: 60000,
    patientRoomFacilities: [
      'Bed Pasien',
      'Bed Side Cabinet',
      'AC Ruangan',
      'Kamar Mandi',
      'Sistem Ventilasi Khusus'
    ],
    totalBeds: 6,
    occupiedBeds: 4,
    availableBeds: 2,
    imageUrl: '',
    note: 'Ruang perawatan isolasi Kelas 3 untuk pasien yang membutuhkan pemisahan medis berstandar PPI.',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-icu',
    name: 'Intensive Care Unit (ICU)',
    pavilion: 'Gedung Sentral Perawatan Intensif',
    classLevel: 'ICU',
    category: 'Intensif/Isolasi',
    roomRatePerDay: 720000,
    visiteGeneralDoctor: 55000,
    visiteSpecialistDoctor: 90000,
    patientRoomFacilities: [
      'Bed Pasien',
      'Bed Side Cabinet',
      'AC Ruangan',
      'Ventilator',
      'Monitor Pasien',
      'Ruang Tunggu Keluarga'
    ],
    totalBeds: 6,
    occupiedBeds: 5,
    availableBeds: 1,
    imageUrl: '',
    note: 'Unit perawatan intensif dengan pemantauan hemodinamik ketat 24 jam dan peralatan bantuan hidup.',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-nicu',
    name: 'Neonatal Intensive Care Unit (NICU)',
    pavilion: 'Gedung Sentral Perawatan Intensif',
    classLevel: 'NICU',
    category: 'Intensif/Isolasi',
    roomRatePerDay: 720000,
    visiteGeneralDoctor: 55000,
    visiteSpecialistDoctor: 90000,
    patientRoomFacilities: [
      'Incubator',
      'Monitor',
      'AC Ruangan',
      'Ventilator',
      'Ruang Tunggu Keluarga'
    ],
    totalBeds: 4,
    occupiedBeds: 3,
    availableBeds: 1,
    imageUrl: '',
    note: 'Unit perawatan intensif khusus untuk bayi baru lahir dengan kondisi kritis yang membutuhkan penanganan spesialis anak neonatal.',
    updatedAt: '2026-09-01'
  },
  {
    id: 'room-darussalam-vip',
    name: 'Darussalam - VIP',
    pavilion: 'Ruang Bersalin (Darussalam)',
    classLevel: 'VIP',
    category: 'VVIP/VIP',
    roomRatePerDay: 720000,
    visiteGeneralDoctor: 55000,
    visiteSpecialistDoctor: 90000,
    patientRoomFacilities: [
      'Bed Pasien (1 orang)',
      'Sofa Bed',
      'Kursi Penunggu',
      'Bed Side Cabinet',
      'Overbed Table',
      'Kulkas',
      'AC Ruangan',
      'TV Kabel',
      'Dispenser',
      'Kamar Mandi'
    ],
    familyRoomFacilities: [
      'Sofa Bed Penunggu',
      'Kulkas',
      'Dispenser'
    ],
    totalBeds: 2,
    occupiedBeds: 1,
    availableBeds: 1,
    imageUrl: '',
    note: 'Kamar bersalin VIP private dengan fasilitas lengkap, sofa bed penunggu, kulkas, dispenser, dan kenyamanan privat untuk ibu dan bayi.',
    updatedAt: '2026-09-09'
  },
  {
    id: 'room-darussalam-kelas1',
    name: 'Darussalam - Kelas I',
    pavilion: 'Ruang Bersalin (Darussalam)',
    classLevel: 'Kelas I',
    category: 'Kelas 1-3',
    roomRatePerDay: 375000,
    visiteGeneralDoctor: 45000,
    visiteSpecialistDoctor: 80000,
    patientRoomFacilities: [
      'Bed Pasien (2 orang)',
      'Kursi Penunggu',
      'Bed Side Cabinet',
      'Overbed Table',
      'AC Ruangan',
      'TV Kabel',
      'Kamar Mandi'
    ],
    totalBeds: 4,
    occupiedBeds: 2,
    availableBeds: 2,
    imageUrl: '',
    note: 'Ruang bersalin Kelas I semi-private berkapasitas 2 bed pasien dengan tirai pembatas, TV kabel, dan AC ruangan.',
    updatedAt: '2026-09-09'
  },
  {
    id: 'room-darussalam-kelas2',
    name: 'Darussalam - Kelas II',
    pavilion: 'Ruang Bersalin (Darussalam)',
    classLevel: 'Kelas II',
    category: 'Kelas 1-3',
    roomRatePerDay: 252000,
    visiteGeneralDoctor: 40000,
    visiteSpecialistDoctor: 70000,
    patientRoomFacilities: [
      'Bed Pasien (3 orang)',
      'Kursi Penunggu',
      'Overbed Table',
      'Bed Side Cabinet',
      'AC Ruangan',
      'Kamar Mandi'
    ],
    totalBeds: 6,
    occupiedBeds: 3,
    availableBeds: 3,
    imageUrl: '',
    note: 'Ruang bersalin Kelas II dengan kapasitas 3 bed pasien, ber-AC, kursi penunggu, dan kamar mandi.',
    updatedAt: '2026-09-09'
  },
  {
    id: 'room-darussalam-kelas3',
    name: 'Darussalam - Kelas III',
    pavilion: 'Ruang Bersalin (Darussalam)',
    classLevel: 'Kelas III',
    category: 'Kelas 1-3',
    roomRatePerDay: 154000,
    visiteGeneralDoctor: 35000,
    visiteSpecialistDoctor: 60000,
    patientRoomFacilities: [
      'Bed Pasien (4 orang)',
      'Kursi Penunggu',
      'Bed Side Cabinet',
      'AC Ruangan',
      'Kamar Mandi'
    ],
    totalBeds: 8,
    occupiedBeds: 4,
    availableBeds: 4,
    imageUrl: '',
    note: 'Ruang bersalin Kelas III berkapasitas 4 bed pasien dengan AC ruangan, kursi penunggu, dan kamar mandi dalam.',
    updatedAt: '2026-09-09'
  }
];

const LOCAL_STORAGE_KEY = 'rsumb_inpatient_rooms_v2';

/**
 * Remove legacy or duplicate cache keys from localStorage to free up browser quota.
 */
function cleanObsoleteStorageKeys(): void {
  try {
    localStorage.removeItem('rsumb_inpatient_rooms_v1');
    if (localStorage.getItem('rsumb_surgery_schedules_v4')) {
      localStorage.removeItem('rsumb_surgery_schedules_v1');
      localStorage.removeItem('rsumb_surgery_schedules_v2');
      localStorage.removeItem('rsumb_surgery_schedules_v3');
    }
  } catch {
    // Ignore in restricted environments
  }
}

export function loadInpatientRooms(): InpatientRoom[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('rsumb_inpatient_rooms_v1');
    // If migrated from v1, clean up v1 key
    if (localStorage.getItem('rsumb_inpatient_rooms_v1')) {
      cleanObsoleteStorageKeys();
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure new default rooms (e.g. Darussalam) are merged if missing
        const existingIds = new Set(parsed.map((r: InpatientRoom) => r.id));
        const missingDefaults = INITIAL_INPATIENT_ROOMS.filter(
          (initialRoom) => !existingIds.has(initialRoom.id)
        );
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          saveInpatientRooms(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load inpatient rooms from localStorage, using default catalogue:', e);
  }
  return INITIAL_INPATIENT_ROOMS;
}

/**
 * Asynchronously loads rooms from IndexedDB (which stores full resolution photos without 5MB limits).
 */
export async function loadInpatientRoomsFromIdb(): Promise<InpatientRoom[] | null> {
  try {
    return await getIdbItem<InpatientRoom[]>(LOCAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Quota-resilient save function:
 * 1. Always mirrors full data (including photos) to IndexedDB.
 * 2. Attempts saving to localStorage.
 * 3. If localStorage quota is exceeded, automatically clears legacy keys and
 *    optimizes large base64 image payloads so room rates and bed configurations
 *    are never lost.
 */
export function saveInpatientRooms(rooms: InpatientRoom[]): void {
  // 1. Mirror full rooms (with photos) to IndexedDB
  setIdbItem(LOCAL_STORAGE_KEY, rooms).catch(() => {});

  // 2. Clean obsolete keys to maximize available quota
  cleanObsoleteStorageKeys();

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rooms));
  } catch (e: any) {
    console.warn('LocalStorage quota limit reached while saving inpatient rooms. Applying storage optimization fallback...');

    try {
      // Step A: Strip large base64 data URLs from localStorage (IndexedDB still holds them)
      const lightweightRooms = rooms.map((r) => ({
        ...r,
        imageUrl: r.imageUrl && r.imageUrl.length > 25000 ? '' : r.imageUrl
      }));

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweightRooms));
    } catch (innerError) {
      console.warn('Storage optimization fallback attempted after quota limit:', innerError);
      try {
        // Step B: Free up space by removing non-critical gallery cache if needed
        localStorage.removeItem('jasaraharja_photo_gallery');
        const minimalRooms = rooms.map((r) => ({
          ...r,
          imageUrl: ''
        }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(minimalRooms));
      } catch (finalError) {
        console.warn('Unable to write to localStorage, relying safely on IndexedDB persistence:', finalError);
      }
    }
  }
}
