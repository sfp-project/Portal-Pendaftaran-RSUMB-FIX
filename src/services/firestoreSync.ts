/**
 * Centralized Firestore Real-Time Data Synchronization Layer for RSUMB Portal
 * Provides unified onSnapshot subscriptions, persistent cloud storage across all devices,
 * and eliminates unwanted client-side mock data re-seeding.
 */
import {
  subscribeCollection,
  subscribeDoc,
  saveDoc,
  removeDoc,
  fetchCollection,
  batchSaveCollection,
  serverTimestamp,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  db,
  auth
} from './firebase';
export { serverTimestamp, db, auth, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot };
import {
  DoctorSchedule,
  DoctorLeaveAnnouncement,
  PatientQueueItem,
  JasaRaharjaItem
} from '../types';
import { ElectiveSurgerySchedule } from '../data/surgeryData';
import { KhitanParticipant } from '../data/khitanData';
import { MedicalLetterItem } from '../types/letterTypes';
import { StickyNoteItem } from '../types/inpatientOrderTypes';
import { ShiftArchiveItem } from '../data/shiftArchiveData';
import {
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord,
  PatientShiftHandoverRecord
} from '../types/patientNotesTypes';
import { KuponMohat } from '../types/mohatTypes';
import { RequirementChecklistItem, MissingDocumentSlip } from '../types/requirementTypes';

// Collection Constants
export const COLLECTIONS = {
  SCHEDULES: 'schedules',
  DOCTOR_LEAVES: 'doctor_leaves',
  PATIENT_QUEUES: 'patient_queues',
  SURGERY_SCHEDULES: 'surgery_schedules',
  KHITAN_PARTICIPANTS: 'khitan_participants',
  JASA_RAHARJA: 'jasa_raharja',
  STICKY_NOTES: 'sticky_notes',
  SHIFT_ARCHIVES: 'shift_archives',
  PATIENT_NOTES: 'patient_notes',
  PATIENT_KLL: 'patient_kll',
  SEP_PENDING: 'sep_pending',
  AUDIT_SURKON: 'audit_surkon',
  MOHAT_COUPONS: 'mohat_coupons',
  MOHAT_META: 'mohat_meta',
  MEDICAL_LETTERS: 'medical_letters',
  REQUIREMENTS_CHECKLIST: 'requirements_checklist',
  REQUIREMENTS_SLIPS: 'requirements_slips',
  SYSTEM_SETTINGS: 'system_settings'
} as const;

// ---------------------------------------------------------------------------
// 1. DOCTOR SCHEDULES
// ---------------------------------------------------------------------------
export function subscribeSchedules(callback: (items: DoctorSchedule[]) => void) {
  return subscribeCollection<DoctorSchedule>(COLLECTIONS.SCHEDULES, (items) => {
    callback(items);
  });
}

export async function saveScheduleDoc(schedule: DoctorSchedule) {
  await saveDoc(COLLECTIONS.SCHEDULES, schedule.id, schedule);
}

export async function deleteScheduleDoc(scheduleId: string) {
  await removeDoc(COLLECTIONS.SCHEDULES, scheduleId);
}

export async function batchSaveSchedules(schedules: DoctorSchedule[]) {
  await batchSaveCollection(COLLECTIONS.SCHEDULES, schedules);
}

// ---------------------------------------------------------------------------
// 2. DOCTOR LEAVES
// ---------------------------------------------------------------------------
export function subscribeDoctorLeaves(callback: (items: DoctorLeaveAnnouncement[]) => void) {
  return subscribeCollection<DoctorLeaveAnnouncement>(COLLECTIONS.DOCTOR_LEAVES, (items) => {
    callback(items);
  });
}

export async function saveDoctorLeaveDoc(leave: DoctorLeaveAnnouncement) {
  await saveDoc(COLLECTIONS.DOCTOR_LEAVES, leave.id, leave);
}

export async function deleteDoctorLeaveDoc(leaveId: string) {
  await removeDoc(COLLECTIONS.DOCTOR_LEAVES, leaveId);
}

// ---------------------------------------------------------------------------
// 3. PATIENT QUEUES
// ---------------------------------------------------------------------------
export function subscribePatientQueues(callback: (items: PatientQueueItem[]) => void) {
  return subscribeCollection<PatientQueueItem>(COLLECTIONS.PATIENT_QUEUES, (items) => {
    callback(items);
  });
}

export async function savePatientQueueDoc(queue: PatientQueueItem) {
  await saveDoc(COLLECTIONS.PATIENT_QUEUES, queue.id, queue);
}

export async function deletePatientQueueDoc(queueId: string) {
  await removeDoc(COLLECTIONS.PATIENT_QUEUES, queueId);
}

// ---------------------------------------------------------------------------
// 4. SURGERY SCHEDULES
// ---------------------------------------------------------------------------
export function subscribeSurgerySchedules(callback: (items: ElectiveSurgerySchedule[]) => void) {
  return subscribeCollection<ElectiveSurgerySchedule>(COLLECTIONS.SURGERY_SCHEDULES, (items) => {
    callback(items);
  });
}

export async function saveSurgeryScheduleDoc(item: ElectiveSurgerySchedule) {
  await saveDoc(COLLECTIONS.SURGERY_SCHEDULES, item.id, item);
}

export async function deleteSurgeryScheduleDoc(id: string) {
  await removeDoc(COLLECTIONS.SURGERY_SCHEDULES, id);
}

// ---------------------------------------------------------------------------
// 5. KHITAN PARTICIPANTS
// ---------------------------------------------------------------------------
export function subscribeKhitanParticipants(callback: (items: KhitanParticipant[]) => void) {
  return subscribeCollection<KhitanParticipant>(COLLECTIONS.KHITAN_PARTICIPANTS, (items) => {
    callback(items);
  });
}

export async function saveKhitanParticipantDoc(item: KhitanParticipant) {
  await saveDoc(COLLECTIONS.KHITAN_PARTICIPANTS, item.id, item);
}

export async function deleteKhitanParticipantDoc(id: string) {
  await removeDoc(COLLECTIONS.KHITAN_PARTICIPANTS, id);
}

// ---------------------------------------------------------------------------
// 6. JASA RAHARJA (KLL)
// ---------------------------------------------------------------------------
export function subscribeJasaRaharja(callback: (items: JasaRaharjaItem[]) => void) {
  return subscribeCollection<JasaRaharjaItem>(COLLECTIONS.JASA_RAHARJA, (items) => {
    callback(items);
  });
}

export async function saveJasaRaharjaDoc(item: JasaRaharjaItem) {
  await saveDoc(COLLECTIONS.JASA_RAHARJA, item.id, item);
}

export async function deleteJasaRaharjaDoc(id: string) {
  await removeDoc(COLLECTIONS.JASA_RAHARJA, id);
}

export async function batchSaveJasaRaharja(items: JasaRaharjaItem[]) {
  await batchSaveCollection(COLLECTIONS.JASA_RAHARJA, items);
}

// ---------------------------------------------------------------------------
// 7. STICKY NOTES OPERAN SHIFT & INDEN RANAP
// ---------------------------------------------------------------------------
export function subscribeStickyNotes(callback: (items: StickyNoteItem[]) => void) {
  return subscribeCollection<StickyNoteItem>(COLLECTIONS.STICKY_NOTES, (items) => {
    callback(items);
  });
}

export async function saveStickyNoteDoc(note: StickyNoteItem) {
  await saveDoc(COLLECTIONS.STICKY_NOTES, note.id, note);
}

export async function batchSaveStickyNotes(notes: StickyNoteItem[]) {
  await batchSaveCollection(COLLECTIONS.STICKY_NOTES, notes);
}

// ---------------------------------------------------------------------------
// 8. SEP PENDING (BEDA HFIS)
// ---------------------------------------------------------------------------
export interface SepPendingItemDoc {
  id: string;
  noAntrian: string;
  rm: string;
  nama: string;
  namaPoli: string;
  dokter: string;
  noRawat: string;
  fingerprintStatus: string;
  targetPrintTime: string;
  statusCetak: 'pending' | 'done';
  createdAt?: string;
}

export function subscribeSepPending(callback: (items: SepPendingItemDoc[]) => void) {
  return subscribeCollection<SepPendingItemDoc>(COLLECTIONS.SEP_PENDING, (items) => {
    callback(items);
  });
}

export async function saveSepPendingDoc(item: SepPendingItemDoc) {
  await saveDoc(COLLECTIONS.SEP_PENDING, item.id, item);
}

export async function deleteSepPendingDoc(id: string) {
  await removeDoc(COLLECTIONS.SEP_PENDING, id);
}

export async function batchSaveSepPending(items: SepPendingItemDoc[]) {
  await batchSaveCollection(COLLECTIONS.SEP_PENDING, items);
}

// ---------------------------------------------------------------------------
// 9. AUDIT SURKON BPJS (SESSION & RESULTS)
// ---------------------------------------------------------------------------
export interface AuditSurkonDocData {
  id: string;
  dataPasienText: string;
  dataSurkonText: string;
  sepPasteText?: string;
  hasilAuditJson?: string;
  savedHistoryJson?: string;
  updatedAt: string;
}

export function subscribeAuditSurkon(callback: (data: AuditSurkonDocData | null) => void) {
  return subscribeDoc<AuditSurkonDocData>(COLLECTIONS.AUDIT_SURKON, 'current_state', callback);
}

export async function saveAuditSurkonDoc(data: Partial<AuditSurkonDocData>) {
  const fullData: AuditSurkonDocData = {
    id: 'current_state',
    dataPasienText: data.dataPasienText ?? '',
    dataSurkonText: data.dataSurkonText ?? '',
    sepPasteText: data.sepPasteText ?? '',
    hasilAuditJson: data.hasilAuditJson ?? '[]',
    savedHistoryJson: data.savedHistoryJson ?? '[]',
    updatedAt: new Date().toISOString()
  };
  await saveDoc(COLLECTIONS.AUDIT_SURKON, 'current_state', fullData);
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 10. PATIENT NOTES (CATATAN PASIEN RANAP)
// ---------------------------------------------------------------------------
export type PatientNoteCategory = 'kll' | 'bpjs' | 'asuransi' | 'umum' | 'handover';

export interface UnifiedPatientNoteDoc {
  id: string;
  category: PatientNoteCategory;
  data: any;
  updatedAt: string;
}

export function subscribePatientNotes(callback: (items: UnifiedPatientNoteDoc[]) => void) {
  return subscribeCollection<UnifiedPatientNoteDoc>(COLLECTIONS.PATIENT_NOTES, callback);
}

export async function savePatientNoteDoc(item: UnifiedPatientNoteDoc) {
  await saveDoc(COLLECTIONS.PATIENT_NOTES, item.id, item);
}

export async function deletePatientNoteDoc(id: string) {
  await removeDoc(COLLECTIONS.PATIENT_NOTES, id);
}

// ---------------------------------------------------------------------------
// 10B. PASIEN KLL (KECELAKAAN LALU LINTAS - DEDICATED FIRESTORE COLLECTION)
// ---------------------------------------------------------------------------
export function subscribeKllPatients(callback: (items: PatientKllRecord[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.PATIENT_KLL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: PatientKllRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        let createdAtStr = new Date().toISOString();
        if (d.createdAt) {
          if (typeof d.createdAt?.toDate === 'function') {
            createdAtStr = d.createdAt.toDate().toISOString();
          } else if (typeof d.createdAt === 'string') {
            createdAtStr = d.createdAt;
          }
        }
        let updatedAtStr = createdAtStr;
        if (d.updatedAt) {
          if (typeof d.updatedAt?.toDate === 'function') {
            updatedAtStr = d.updatedAt.toDate().toISOString();
          } else if (typeof d.updatedAt === 'string') {
            updatedAtStr = d.updatedAt;
          }
        }
        items.push({
          id: docSnap.id,
          namaPasien: d.namaPasien || '',
          noRm: d.noRm || '',
          tanggalMrs: d.tanggalMrs || '',
          tanggalKll: d.tanggalKll || '',
          kronologi: d.kronologi || '',
          penjamin: d.penjamin || 'Jasa Raharja',
          statusLp: d.statusLp || 'BELUM',
          lpFileName: d.lpFileName,
          lpFileUrl: d.lpFileUrl,
          lpFileType: d.lpFileType,
          isInsidenActive: Boolean(d.isInsidenActive),
          isResolved: Boolean(d.isResolved),
          catatan: d.catatan || '',
          createdAt: createdAtStr,
          updatedAt: updatedAtStr
        });
      });
      // Urutkan paling baru berdasarkan waktu dibuat atau tanggal kejadian
      items.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.tanggalMrs || 0).getTime();
        const timeB = new Date(b.createdAt || b.tanggalMrs || 0).getTime();
        return timeB - timeA;
      });
      callback(items);
    },
    (err) => {
      console.warn('[Firestore] Error onSnapshot patient_kll:', err);
    }
  );
}

export async function addKllPatientDoc(data: Omit<PatientKllRecord, 'id'> | PatientKllRecord): Promise<string> {
  const colRef = collection(db, COLLECTIONS.PATIENT_KLL);
  const cleanData: any = {
    namaPasien: (data.namaPasien || '').trim().toUpperCase(),
    noRm: (data.noRm || '').trim(),
    tanggalMrs: data.tanggalMrs || new Date().toISOString().slice(0, 10),
    tanggalKll: data.tanggalKll || new Date().toISOString().slice(0, 10),
    kronologi: (data.kronologi || '').trim(),
    penjamin: data.penjamin || 'Jasa Raharja',
    statusLp: (data.statusLp || 'BELUM').trim(),
    isInsidenActive: Boolean(data.isInsidenActive),
    isResolved: Boolean(data.isResolved),
    catatan: (data.catatan || '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  if (data.lpFileName) cleanData.lpFileName = data.lpFileName;
  if (data.lpFileUrl) cleanData.lpFileUrl = data.lpFileUrl;
  if (data.lpFileType) cleanData.lpFileType = data.lpFileType;

  const docRef = await addDoc(colRef, cleanData);
  return docRef.id;
}

export async function updateKllPatientDoc(id: string, updates: Partial<PatientKllRecord>): Promise<void> {
  const dRef = doc(db, COLLECTIONS.PATIENT_KLL, id);
  const cleanUpdates: any = {
    updatedAt: serverTimestamp()
  };
  if (updates.namaPasien !== undefined) cleanUpdates.namaPasien = updates.namaPasien.trim().toUpperCase();
  if (updates.noRm !== undefined) cleanUpdates.noRm = updates.noRm.trim();
  if (updates.tanggalMrs !== undefined) cleanUpdates.tanggalMrs = updates.tanggalMrs;
  if (updates.tanggalKll !== undefined) cleanUpdates.tanggalKll = updates.tanggalKll;
  if (updates.kronologi !== undefined) cleanUpdates.kronologi = updates.kronologi;
  if (updates.penjamin !== undefined) cleanUpdates.penjamin = updates.penjamin;
  if (updates.statusLp !== undefined) cleanUpdates.statusLp = updates.statusLp;
  if (updates.lpFileName !== undefined) cleanUpdates.lpFileName = updates.lpFileName;
  if (updates.lpFileUrl !== undefined) cleanUpdates.lpFileUrl = updates.lpFileUrl;
  if (updates.lpFileType !== undefined) cleanUpdates.lpFileType = updates.lpFileType;
  if (updates.isInsidenActive !== undefined) cleanUpdates.isInsidenActive = updates.isInsidenActive;
  if (updates.isResolved !== undefined) cleanUpdates.isResolved = updates.isResolved;
  if (updates.catatan !== undefined) cleanUpdates.catatan = updates.catatan;

  await updateDoc(dRef, cleanUpdates);
}

export async function deleteKllPatientDoc(id: string): Promise<void> {
  const dRef = doc(db, COLLECTIONS.PATIENT_KLL, id);
  await deleteDoc(dRef);
}

export async function batchSaveKllPatients(items: PatientKllRecord[]): Promise<void> {
  await batchSaveCollection(COLLECTIONS.PATIENT_KLL, items);
}

// ---------------------------------------------------------------------------
// 11. MOHAT COUPONS
// ---------------------------------------------------------------------------
export function subscribeMohatCoupons(callback: (items: KuponMohat[]) => void) {
  return subscribeCollection<KuponMohat>(COLLECTIONS.MOHAT_COUPONS, callback);
}

export async function saveMohatCouponDoc(item: KuponMohat) {
  await saveDoc(COLLECTIONS.MOHAT_COUPONS, item.id, item);
}

export async function deleteMohatCouponDoc(id: string) {
  await removeDoc(COLLECTIONS.MOHAT_COUPONS, id);
}

export async function batchSaveMohatCoupons(items: KuponMohat[]) {
  await batchSaveCollection(COLLECTIONS.MOHAT_COUPONS, items);
}

// ---------------------------------------------------------------------------
// 12. MEDICAL LETTERS
// ---------------------------------------------------------------------------
export function subscribeMedicalLetters(callback: (items: MedicalLetterItem[]) => void) {
  return subscribeCollection<MedicalLetterItem>(COLLECTIONS.MEDICAL_LETTERS, callback);
}

export async function saveMedicalLetterDoc(item: MedicalLetterItem) {
  await saveDoc(COLLECTIONS.MEDICAL_LETTERS, item.id, item);
}

export async function deleteMedicalLetterDoc(id: string) {
  await removeDoc(COLLECTIONS.MEDICAL_LETTERS, id);
}

// ---------------------------------------------------------------------------
// 13. REQUIREMENTS CHECKLIST & SLIPS
// ---------------------------------------------------------------------------
export function subscribeRequirementsChecklist(callback: (items: RequirementChecklistItem[]) => void) {
  return subscribeCollection<RequirementChecklistItem>(COLLECTIONS.REQUIREMENTS_CHECKLIST, callback);
}

export async function saveRequirementDoc(item: RequirementChecklistItem) {
  await saveDoc(COLLECTIONS.REQUIREMENTS_CHECKLIST, item.id, item);
}

export async function batchSaveRequirements(items: RequirementChecklistItem[]) {
  await batchSaveCollection(COLLECTIONS.REQUIREMENTS_CHECKLIST, items);
}

export function subscribeMissingDocSlips(callback: (items: MissingDocumentSlip[]) => void) {
  return subscribeCollection<MissingDocumentSlip>(COLLECTIONS.REQUIREMENTS_SLIPS, callback);
}

export async function saveMissingDocSlipDoc(item: MissingDocumentSlip) {
  await saveDoc(COLLECTIONS.REQUIREMENTS_SLIPS, item.id, item);
}

export async function deleteMissingDocSlipDoc(id: string) {
  await removeDoc(COLLECTIONS.REQUIREMENTS_SLIPS, id);
}
