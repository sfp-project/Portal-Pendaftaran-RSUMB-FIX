import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
  getDocFromServer,
  writeBatch,
  serverTimestamp,
  addDoc,
  updateDoc,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: The app will break without specifying firestoreDatabaseId when custom database is used
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export { serverTimestamp, doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, getDocs, addDoc, updateDoc };
signInAnonymously(auth).catch(() => {});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_test', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline fallback active:', error.message);
    }
    return false;
  }
}

/**
 * Real-time collection subscriber with error handling
 */
export function subscribeCollection<T extends { id?: string }>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          ...data
        } as T);
      });
      onUpdate(items);
    },
    (error) => {
      console.warn(`[Firestore] Snapshot error on /${collectionName}:`, error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  );
}

/**
 * Real-time single document subscriber with error handling
 */
export function subscribeDoc<T>(
  collectionName: string,
  docId: string,
  onUpdate: (data: T | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const dRef = doc(db, collectionName, docId);
  return onSnapshot(
    dRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as T);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn(`[Firestore] Doc snapshot error on /${collectionName}/${docId}:`, error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    }
  );
}

/**
 * Safely sanitize data for Firestore while preserving serverTimestamp and FieldValues
 */
export function sanitizeFirestoreData(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  // Preserve Firestore FieldValue (e.g. serverTimestamp), Timestamp, and Date
  if (
    obj._methodName ||
    (obj.constructor && obj.constructor.name === 'FieldValue') ||
    typeof obj.toDate === 'function' ||
    obj instanceof Date
  ) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeFirestoreData).filter((v) => v !== undefined);
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeFirestoreData(value);
    }
  }
  return result;
}

/**
 * Save single document with setDoc
 */
export async function saveDoc<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    const sanitized = sanitizeFirestoreData(data);
    await setDoc(doc(db, collectionName, docId), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete single document
 */
export async function removeDoc(
  collectionName: string,
  docId: string
): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetch all documents once
 */
export async function fetchCollection<T extends { id?: string }>(
  collectionName: string
): Promise<T[]> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    const list: T[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as T);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return [];
  }
}

/**
 * Batch save items to a collection
 */
export async function batchSaveCollection<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  try {
    // Process in batches of 450 (Firestore limit is 500)
    const chunkSize = 450;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        const ref = doc(db, collectionName, item.id);
        const clean = sanitizeFirestoreData(item);
        batch.set(ref, clean, { merge: true });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}
