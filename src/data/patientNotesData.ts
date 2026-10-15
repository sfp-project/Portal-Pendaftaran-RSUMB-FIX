import {
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord,
  PatientShiftHandoverRecord
} from '../types/patientNotesTypes';
import {
  saveDoc,
  subscribeDoc
} from '../services/firebase';

// Initial Data untuk TAB 1: Pasien Kecelakaan (KLL) - Kosong secara default murni dari Firestore
export const initialKllRecords: PatientKllRecord[] = [];

// Initial Data untuk Seluruh Tab (Murni Kosong - Tanpa Mock Data)
export const initialBpjsKendalaRecords: PatientBpjsKendalaRecord[] = [];
export const initialAsuransiSwastaRecords: PatientAsuransiSwastaRecord[] = [];
export const initialUmumBeresikoRecords: PatientUmumBeresikoRecord[] = [];
export const initialShiftHandoverRecords: PatientShiftHandoverRecord[] = [];

// Local Storage Key Constants
const STORAGE_KEY_BPJS = 'rsumb_patient_notes_bpjs_v1';
const STORAGE_KEY_ASURANSI = 'rsumb_patient_notes_asuransi_v1';
const STORAGE_KEY_UMUM = 'rsumb_patient_notes_umum_v1';
const STORAGE_KEY_HANDOVER = 'rsumb_patient_notes_handover_v1';

import {
  subscribeKllPatients,
  addKllPatientDoc,
  updateKllPatientDoc,
  deleteKllPatientDoc,
  batchSaveKllPatients
} from '../services/firestoreSync';

export {
  subscribeKllPatients,
  addKllPatientDoc,
  updateKllPatientDoc,
  deleteKllPatientDoc,
  batchSaveKllPatients
};

// Load & Save Helpers with Robust Try/Catch
export function loadKllRecords(): PatientKllRecord[] {
  return [];
}


export function loadBpjsKendalaRecords(): PatientBpjsKendalaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BPJS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((r: any) => !r.is_deleted && !r.isDeleted);
      }
    }
  } catch (e) {
    console.error('Failed to load BPJS Kendala records:', e);
  }
  return [];
}

export function saveBpjsKendalaRecords(records: PatientBpjsKendalaRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BPJS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save BPJS Kendala records:', e);
  }
  saveDoc('patient_notes', 'bpjs', { records }).catch((err) => {
    console.warn('[Firestore] Failed saving BPJS Kendala notes:', err);
  });
}

export function loadAsuransiSwastaRecords(): PatientAsuransiSwastaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASURANSI);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((r: any) => !r.is_deleted && !r.isDeleted);
      }
    }
  } catch (e) {
    console.error('Failed to load Asuransi Swasta records:', e);
  }
  return [];
}

export function saveAsuransiSwastaRecords(records: PatientAsuransiSwastaRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASURANSI, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save Asuransi Swasta records:', e);
  }
  saveDoc('patient_notes', 'asuransi', { records }).catch((err) => {
    console.warn('[Firestore] Failed saving Asuransi Swasta notes:', err);
  });
}

export function loadUmumBeresikoRecords(): PatientUmumBeresikoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UMUM);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((r: any) => !r.is_deleted && !r.isDeleted);
      }
    }
  } catch (e) {
    console.error('Failed to load UMUM Beresiko records:', e);
  }
  return [];
}

export function saveUmumBeresikoRecords(records: PatientUmumBeresikoRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_UMUM, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save UMUM Beresiko records:', e);
  }
  saveDoc('patient_notes', 'umum', { records }).catch((err) => {
    console.warn('[Firestore] Failed saving UMUM Beresiko notes:', err);
  });
}

export function loadShiftHandoverRecords(): PatientShiftHandoverRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HANDOVER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((r: any) => !r.is_deleted && !r.isDeleted);
      }
    }
  } catch (e) {
    console.error('Failed to load Shift Handover records:', e);
  }
  return [];
}

export function saveShiftHandoverRecords(records: PatientShiftHandoverRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HANDOVER, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save Shift Handover records:', e);
  }
  saveDoc('patient_notes', 'handover', { records }).catch((err) => {
    console.warn('[Firestore] Failed saving Shift Handover notes:', err);
  });
}

export function subscribePatientNotesCategory(
  category: 'kll' | 'bpjs' | 'asuransi' | 'umum' | 'handover',
  callback: (records: any[]) => void
): () => void {
  return subscribeDoc<{ records: any[] }>('patient_notes', category, (data) => {
    if (data && Array.isArray(data.records)) {
      callback(data.records);
    }
  });
}
