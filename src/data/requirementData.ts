import {
  RequirementChecklistItem,
  MissingDocumentSlip,
  INITIAL_REQUIREMENTS_CHECKLIST
} from '../types/requirementTypes';
import { triggerSilentDriveSync } from '../services/dualSyncStorage';

const STORAGE_KEY_CHECKLIST = 'rsumb_requirements_checklist_v1';
const STORAGE_KEY_SLIPS = 'rsumb_missing_document_slips_v1';

export const loadRequirementChecklist = (): RequirementChecklistItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CHECKLIST);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca requirements checklist dari localStorage:', e);
  }
  return INITIAL_REQUIREMENTS_CHECKLIST;
};

export const saveRequirementChecklist = (items: RequirementChecklistItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CHECKLIST, JSON.stringify(items));
    triggerSilentDriveSync(2500);
    window.dispatchEvent(new CustomEvent('rsumb_requirements_updated'));
  } catch (e) {
    console.warn('Gagal menyimpan requirements checklist ke localStorage:', e);
  }
};

export const loadMissingDocumentSlips = (): MissingDocumentSlip[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SLIPS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca missing document slips dari localStorage:', e);
  }
  return [
    {
      id: 'slip-sample-1',
      slipNumber: 'SLIP-SKB-202610-001',
      patientName: 'Ny. Siti Aminah',
      noRm: '26-08-412',
      guarantor: 'BPJS Kesehatan',
      roomOrClinic: 'Poli Jantung & Pembuluh Darah',
      admissionDate: new Date().toISOString().split('T')[0],
      admissionTime: '08:30',
      deadlineHours: 72,
      deadlineDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      missingItems: [
        'Surat Kontrol / SKDP Asli DPJP',
        'Rujukan FKTP Puskesmas (Perpanjangan Aktif)'
      ],
      notes: 'Rujukan lama habis per 3 Oktober. Keluarga berjanji mengurus ke Faskes 1 besok pagi.',
      officerName: 'Hisyam',
      officerShift: 'Shift Pagi',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ];
};

export const saveMissingDocumentSlips = (slips: MissingDocumentSlip[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SLIPS, JSON.stringify(slips));
    triggerSilentDriveSync(2500);
    window.dispatchEvent(new CustomEvent('rsumb_slips_updated'));
  } catch (e) {
    console.warn('Gagal menyimpan missing document slips ke localStorage:', e);
  }
};

export const generateSlipNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SLIP-SKB-${year}${month}-${randomSuffix}`;
};
