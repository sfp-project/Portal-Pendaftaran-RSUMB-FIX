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
  writeBatch,
  db,
  auth
} from './firebase';
export { serverTimestamp, db, auth, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, writeBatch };
import {
  DoctorSchedule,
  DoctorLeaveAnnouncement,
  PatientQueueItem,
  JasaRaharjaItem,
  PatientSelfRegistrationItem
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
import {
  addScanQrHeaderNotification,
  markAllScanQrHeaderNotificationsAsRead,
  removeHeaderNotification,
  loadActiveStaff
} from '../data/headerData';
import { syncDatabaseToGas, isGasConnected } from './googleSheetsGasService';
import { collectLocalDatabaseSnapshot } from './dualSyncStorage';
import { logSystemActivity } from '../data/auditLogData';


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
  REKAP_PENDAFTARAN: 'rekap_pendaftaran',
  PATIENT_SELF_REGISTRATIONS: 'patient_self_registrations',
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

/**
 * Mutlak menimpa total seluruh jadwal di Firestore (Mode Ganti Total / Overwrite):
 * 1. Menghapus seluruh dokumen jadwal lama yang ada di Firestore
 * 2. Menyimpan HANYA jadwal baru hasil unggahan master Excel
 */
export async function replaceAllSchedulesInFirestore(newSchedules: DoctorSchedule[]): Promise<void> {
  try {
    const existing = await fetchCollection<DoctorSchedule>(COLLECTIONS.SCHEDULES);
    if (existing.length > 0) {
      const chunkSize = 400;
      for (let i = 0; i < existing.length; i += chunkSize) {
        const chunk = existing.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          if (item.id) {
            batch.delete(doc(db, COLLECTIONS.SCHEDULES, item.id));
          }
        });
        await batch.commit();
      }
    }
    if (newSchedules.length > 0) {
      await batchSaveSchedules(newSchedules);
    }
  } catch (err) {
    console.error('[replaceAllSchedulesInFirestore] error:', err);
  }
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

// ---------------------------------------------------------------------------
// 14. REKAP PENDAFTARAN
// ---------------------------------------------------------------------------
export interface RekapPendaftaranDoc {
  id: string;
  nomorUrut: string;
  namaPasien: string;
  noHp: string;
  noBpjs?: string;
  jenisPembayaran?: string;
  createdAt: any;
}

export function subscribeRekapPendaftaran(callback: (items: RekapPendaftaranDoc[]) => void) {
  return subscribeCollection<RekapPendaftaranDoc>(COLLECTIONS.REKAP_PENDAFTARAN, callback);
}

export async function addRekapPendaftaranDoc(data: Omit<RekapPendaftaranDoc, 'id' | 'createdAt'>) {
  await addDoc(collection(db, COLLECTIONS.REKAP_PENDAFTARAN), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function deleteRekapPendaftaranDoc(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.REKAP_PENDAFTARAN, id));
}

// ---------------------------------------------------------------------------
// 15. PENDAFTARAN MANDIRI PASIEN (SELF-SERVICE SCAN QR)
// ---------------------------------------------------------------------------
const LOCAL_STORAGE_SELF_REG = 'rsumb_patient_self_registrations_v1';
const LOCAL_STORAGE_READ_REG = 'rsumb_read_self_reg_ids_v1';

export const INITIAL_PATIENT_SELF_REGISTRATIONS: PatientSelfRegistrationItem[] = [
  {
    id: 'reg-demo-1',
    statusPasien: 'Baru',
    namaPasien: 'Ahmad Fauzi Ridwan',
    nik: '3524051208940003',
    tempatLahir: 'Lamongan',
    tanggalLahir: '12/08/1994',
    jenisKelamin: 'L',
    alamat: 'Desa Moropelang RT 02 / RW 01, Babat, Lamongan',
    noHp: '081234567890',
    namaPenanggungJawab: 'Hj. Siti Mariyam',
    hubunganKeluarga: 'Ibu Kandung',
    jenisPembayaran: 'BPJS Kesehatan',
    waktuDaftar: 'Hari ini, 07.45 WIB'
  },
  {
    id: 'reg-demo-2',
    statusPasien: 'Lama',
    namaPasien: 'Nur Aini Rahmawati',
    nik: '3524055503980002',
    tempatLahir: 'Babat',
    tanggalLahir: '15/03/1998',
    jenisKelamin: 'P',
    alamat: 'Jl. Raya Babat - Surabaya No. 45, Babat',
    noHp: '085712345678',
    namaPenanggungJawab: 'Bambang Trianto',
    hubunganKeluarga: 'Suami',
    jenisPembayaran: 'UMUM',
    waktuDaftar: 'Hari ini, 08.10 WIB'
  }
];

export function loadLocalPatientSelfRegistrations(): PatientSelfRegistrationItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SELF_REG);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } else {
      // First initial mount: seed default demo registrations and mark them read so bell doesn't blink
      localStorage.setItem(LOCAL_STORAGE_SELF_REG, JSON.stringify(INITIAL_PATIENT_SELF_REGISTRATIONS));
      saveReadSelfRegIds(INITIAL_PATIENT_SELF_REGISTRATIONS.map((i) => i.id));
      return INITIAL_PATIENT_SELF_REGISTRATIONS;
    }
  } catch {}
  return [];
}

export function saveLocalPatientSelfRegistrations(items: PatientSelfRegistrationItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SELF_REG, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('rsumb_self_registration_updated'));
  } catch {}
}

export function getReadSelfRegIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_READ_REG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {}
  return new Set();
}

export function saveReadSelfRegIds(ids: Set<string> | string[]) {
  try {
    const arr = Array.from(ids);
    localStorage.setItem(LOCAL_STORAGE_READ_REG, JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent('rsumb_self_reg_read_status_changed'));
  } catch {}
}

export function getUnreadSelfRegCount(): number {
  const current = loadLocalPatientSelfRegistrations();
  const readIds = getReadSelfRegIds();
  return current.filter((item) => !readIds.has(item.id)).length;
}

export function markAllSelfRegistrationsAsRead(): void {
  const current = loadLocalPatientSelfRegistrations();
  const readIds = getReadSelfRegIds();
  current.forEach((item) => readIds.add(item.id));
  saveReadSelfRegIds(readIds);

  // Tandai juga notifikasi scan QR di headerData sebagai sudah dibaca
  markAllScanQrHeaderNotificationsAsRead();

  window.dispatchEvent(new CustomEvent('rsumb_self_reg_read_status_changed'));
  window.dispatchEvent(new CustomEvent('rsumb_header_notifications_updated'));
}

export function subscribePatientSelfRegistrations(callback: (items: PatientSelfRegistrationItem[]) => void) {
  // 1. Zero-latency instant initial load from local storage
  try {
    const local = loadLocalPatientSelfRegistrations();
    callback(local);
  } catch (err) {
    console.warn('Initial local self-registration load error:', err);
  }

  // 2. Real-time Firestore Subscription
  const unsubscribe = subscribeCollection<PatientSelfRegistrationItem>(
    COLLECTIONS.PATIENT_SELF_REGISTRATIONS,
    (items) => {
      if (Array.isArray(items)) {
        saveLocalPatientSelfRegistrations(items);
        callback(items);
      } else {
        const local = loadLocalPatientSelfRegistrations();
        callback(local);
      }
    }
  );

  // 3. Local window event listener fallback for instant intra-window sync
  const handleLocalUpdate = () => {
    callback(loadLocalPatientSelfRegistrations());
  };
  window.addEventListener('rsumb_self_registration_updated', handleLocalUpdate);

  return () => {
    unsubscribe();
    window.removeEventListener('rsumb_self_registration_updated', handleLocalUpdate);
  };
}

export async function savePatientSelfRegistrationDoc(item: PatientSelfRegistrationItem) {
  // Update local storage first for zero-latency response
  const current = loadLocalPatientSelfRegistrations();
  const filtered = current.filter((i) => i.id !== item.id);
  const updated = [item, ...filtered];
  saveLocalPatientSelfRegistrations(updated);

  // Pastikan ID pasien baru belum berstatus dibaca agar memicu blinking indicator lonceng
  const readIds = getReadSelfRegIds();
  readIds.delete(item.id);
  saveReadSelfRegIds(readIds);

  // Tambahkan entri notifikasi lonceng di header
  addScanQrHeaderNotification(item);

  // Broadcast events
  window.dispatchEvent(new CustomEvent('rsumb_self_registration_updated'));
  window.dispatchEvent(new CustomEvent('rsumb_self_reg_read_status_changed'));
  window.dispatchEvent(new CustomEvent('rsumb_header_notifications_updated'));

  try {
    await saveDoc(COLLECTIONS.PATIENT_SELF_REGISTRATIONS, item.id, {
      ...item,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Firestore save self registration warning (local saved):', e);
  }
}

export async function deletePatientSelfRegistrationDoc(id: string) {
  const current = loadLocalPatientSelfRegistrations();
  const updated = current.filter((i) => i.id !== id);
  saveLocalPatientSelfRegistrations(updated);

  // Hapus dari daftar ID read jika ada
  const readIds = getReadSelfRegIds();
  readIds.delete(id);
  saveReadSelfRegIds(readIds);

  // Hapus notifikasi terkait dari header
  removeHeaderNotification(`notif-scan-${id}`);

  // Broadcast events ke seluruh komponen
  window.dispatchEvent(new CustomEvent('rsumb_self_registration_updated'));
  window.dispatchEvent(new CustomEvent('rsumb_self_reg_read_status_changed'));
  window.dispatchEvent(new CustomEvent('rsumb_header_notifications_updated'));

  try {
    await removeDoc(COLLECTIONS.PATIENT_SELF_REGISTRATIONS, id);
  } catch (e) {
    console.warn('Firestore delete self registration warning (local deleted):', e);
  }
}

// ---------------------------------------------------------------------------
// AUTO-BACKUP FIRESTORE SETIAP 24 JAM KE GOOGLE SHEETS (REDUNDANSI CADANGAN)
// ---------------------------------------------------------------------------
export const FIRESTORE_LAST_BACKUP_KEY = 'rsumb_firestore_last_backup_time';
export const FIRESTORE_BACKUP_META_KEY = 'rsumb_firestore_backup_meta';
export const FIRESTORE_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Jam (86.400.000 ms)

export interface FirestoreBackupMeta {
  lastBackupTime: string;
  totalCollections: number;
  totalDocuments: number;
  status: 'success' | 'failed' | 'in_progress';
  message: string;
  source: string;
  nextScheduledTime: string;
}

export interface AutoBackupFirestoreResult {
  success: boolean;
  timestamp: string;
  totalCollections: number;
  totalRecords: number;
  message: string;
  isDue: boolean;
  offlineFallback?: boolean;
}

export const getFirestoreBackupMeta = (): FirestoreBackupMeta | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FIRESTORE_BACKUP_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isFirestoreBackupDue = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const lastBackup = localStorage.getItem(FIRESTORE_LAST_BACKUP_KEY);
    if (!lastBackup) return true;
    const lastTime = new Date(lastBackup).getTime();
    if (isNaN(lastTime)) return true;
    return Date.now() - lastTime >= FIRESTORE_BACKUP_INTERVAL_MS;
  } catch {
    return true;
  }
};

/**
 * Mengambil snapshot komprehensif dari seluruh koleksi aktif di Firestore
 */
export async function collectFirestoreDatabaseSnapshot(): Promise<{
  collections: Record<string, any[]>;
  totalCollections: number;
  totalDocuments: number;
}> {
  const collectionNames = Object.values(COLLECTIONS);
  const collectionsData: Record<string, any[]> = {};
  let totalDocs = 0;
  let activeColCount = 0;

  await Promise.all(
    collectionNames.map(async (colName) => {
      try {
        const items = await fetchCollection(colName);
        if (items && Array.isArray(items) && items.length > 0) {
          collectionsData[colName] = items;
          totalDocs += items.length;
          activeColCount++;
        }
      } catch (err) {
        console.warn(`[FirestoreSnapshot] Skip collection ${colName} (offline or empty):`, err);
      }
    })
  );

  return {
    collections: collectionsData,
    totalCollections: activeColCount,
    totalDocuments: totalDocs
  };
}

/**
 * Fungsi: autoBackupFirestore
 * Secara otomatis melakukan snapshot data dari Firestore ke Google Sheets setiap 24 jam
 * untuk menjaga redundansi data cadangan portal pendaftaran RSUMB.
 * @param force Jika true, langsung lakukan snapshot cadangan saat ini tanpa menunggu siklus 24 jam.
 */
export async function autoBackupFirestore(
  force: boolean = false
): Promise<AutoBackupFirestoreResult> {
  const nowIso = new Date().toISOString();
  const due = isFirestoreBackupDue();

  if (!force && !due) {
    const meta = getFirestoreBackupMeta();
    return {
      success: true,
      timestamp: meta?.lastBackupTime || nowIso,
      totalCollections: meta?.totalCollections || 0,
      totalRecords: meta?.totalDocuments || 0,
      isDue: false,
      message: `Cadangan Firestore masih dalam siklus 24 jam (Terakhir: ${
        meta?.lastBackupTime ? new Date(meta.lastBackupTime).toLocaleString('id-ID') : 'Belum tercatat'
      }).`
    };
  }

  // Nama staf aktif untuk pencatatan jejak audit
  let staffName = 'Sistem Auto-Backup 24 Jam RSUMB';
  try {
    const active = loadActiveStaff();
    if (active?.name) staffName = `${active.name} (Auto-Backup Firestore)`;
  } catch {}

  try {
    // 1. Ambil snapshot data live dari seluruh koleksi Firestore
    const firestoreSnapshot = await collectFirestoreDatabaseSnapshot();

    // 2. Ambil snapshot lokal sebagai redundansi tambahan
    let localSnapshot: Record<string, any> = {};
    try {
      localSnapshot = collectLocalDatabaseSnapshot();
    } catch (e) {
      console.warn('[AutoBackup] Local database snapshot notice:', e);
    }

    // 3. Susun payload redundansi lengkap untuk Google Sheets
    const combinedPayload = {
      ...localSnapshot,
      _firestore_backup_meta: {
        source: 'FIRESTORE_DATABASE',
        databaseId: 'ai-studio-portalpendaftara-21a36b17-5987-42de-b51e-51d49cc4bfe0',
        backupType: 'AUTO_24H_FIRESTORE_TO_SHEETS',
        timestamp: nowIso,
        totalCollections: firestoreSnapshot.totalCollections,
        totalDocuments: firestoreSnapshot.totalDocuments,
        staffName: staffName
      },
      _firestore_collections: firestoreSnapshot.collections
    };

    // 4. Kirim (Push) snapshot ke Google Sheets via GAS Web App
    const syncRes = await syncDatabaseToGas(combinedPayload, staffName);

    if (!syncRes.success) {
      throw new Error(syncRes.message || 'Gagal mengirim snapshot Firestore ke Google Sheets.');
    }

    // 5. Perbarui metadata snapshot 24 jam di LocalStorage
    const nextTime = new Date(Date.now() + FIRESTORE_BACKUP_INTERVAL_MS).toISOString();
    const backupMeta: FirestoreBackupMeta = {
      lastBackupTime: nowIso,
      totalCollections: firestoreSnapshot.totalCollections,
      totalDocuments: firestoreSnapshot.totalDocuments,
      status: 'success',
      message: `Snapshot Firestore berhasil dicadangkan ke Google Sheets (${firestoreSnapshot.totalDocuments} dokumen).`,
      source: 'Firestore (ai-studio-portalpendaftara-21a36b17-5987-42de-b51e-51d49cc4bfe0)',
      nextScheduledTime: nextTime
    };

    try {
      localStorage.setItem(FIRESTORE_LAST_BACKUP_KEY, nowIso);
      localStorage.setItem(FIRESTORE_BACKUP_META_KEY, JSON.stringify(backupMeta));
    } catch {}

    // 6. Catat riwayat audit
    try {
      logSystemActivity(
        'Auto-Backup Firestore 24 Jam',
        `Snapshot redundansi Firestore (${firestoreSnapshot.totalDocuments} dokumen dari ${firestoreSnapshot.totalCollections} koleksi) berhasil disimpan ke Google Sheets.`,
        staffName,
        'SINKRONISASI',
        'Google Sheets Redundancy'
      );
    } catch {}

    // 7. Siarkan event ke antarmuka aplikasi
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rsumb_firestore_backup_completed', {
          detail: backupMeta
        })
      );
    }

    console.info(
      `[AutoBackup Firestore] Berhasil! ${firestoreSnapshot.totalDocuments} dokumen dari ${firestoreSnapshot.totalCollections} koleksi Firestore dicadangkan ke Google Sheets (${nowIso}).`
    );

    return {
      success: true,
      timestamp: nowIso,
      totalCollections: firestoreSnapshot.totalCollections,
      totalRecords: firestoreSnapshot.totalDocuments,
      isDue: true,
      message: `Snapshot Firestore berhasil dicadangkan ke Google Sheets (${firestoreSnapshot.totalDocuments} dokumen dari ${firestoreSnapshot.totalCollections} koleksi).`
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Terjadi gangguan koneksi saat mencadangkan Firestore.';
    console.warn('[AutoBackup Firestore] Gagal:', err);

    const failMeta: FirestoreBackupMeta = {
      lastBackupTime: nowIso,
      totalCollections: 0,
      totalDocuments: 0,
      status: 'failed',
      message: errorMsg,
      source: 'Firestore',
      nextScheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };

    try {
      localStorage.setItem(FIRESTORE_BACKUP_META_KEY, JSON.stringify(failMeta));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rsumb_firestore_backup_completed', {
          detail: failMeta
        })
      );
    }

    return {
      success: false,
      timestamp: nowIso,
      totalCollections: 0,
      totalRecords: 0,
      isDue: true,
      message: `Gagal auto-backup Firestore ke Google Sheets: ${errorMsg}`
    };
  }
}

/**
 * Inisialisasi proses background pengecekan auto-backup Firestore 24 jam secara otomatis.
 */
export function initAutoBackupFirestore(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Pengecekan awal saat aplikasi dibuka (tunda 4 detik agar boot lancar)
  const initialTimer = setTimeout(() => {
    autoBackupFirestore(false).catch((err) => {
      console.info('[AutoBackup Firestore] Initial check notice:', err?.message || err);
    });
  }, 4000);

  // 2. Interval pengecekan berkala setiap 30 menit
  const CHECK_INTERVAL_MS = 30 * 60 * 1000;
  const intervalId = setInterval(() => {
    autoBackupFirestore(false).catch((err) => {
      console.warn('[AutoBackup Firestore] Periodic check notice:', err);
    });
  }, CHECK_INTERVAL_MS);

  return () => {
    clearTimeout(initialTimer);
    clearInterval(intervalId);
  };
}

