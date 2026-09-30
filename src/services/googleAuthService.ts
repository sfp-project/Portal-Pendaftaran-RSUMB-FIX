import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

// Storage keys for persistent Drive authentication session
const STORAGE_KEY_AUTH_SESSION = 'rsumb_gdrive_auth_session_v2';
const STORAGE_KEY_AUTH_SESSION_LEGACY = 'rsumb_gdrive_auth_session';
const STORAGE_KEY_CONNECTED_FLAG = 'rsumb_drive_has_connected';
const IDB_NAME = 'rsumb_auth_storage_v1';
const IDB_STORE = 'sessions';

export interface StoredDriveSession {
  accessToken: string;
  user: {
    uid?: string;
    displayName: string;
    email: string;
    photoURL?: string | null;
  };
  expiresAt?: number; // timestamp in ms
}

// Helper to interact with IndexedDB for long-lived backup of tokens
const openAuthIDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const saveToIDB = async (key: string, value: any) => {
  try {
    const db = await openAuthIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(value, key);
  } catch (e) {
    console.warn('Notice saving auth to IndexedDB:', e);
  }
};

const getFromIDB = async <T = any>(key: string): Promise<T | null> => {
  try {
    const db = await openAuthIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const clearFromIDB = async (key: string) => {
  try {
    const db = await openAuthIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.delete(key);
  } catch {}
};

// Initialize Firebase App singleton safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider with explicit Google Drive file and user info scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to indicate if currently in sign-in flow
let isSigningIn = false;

// In-memory cache for fast access
let cachedAccessToken: string | null = null;
let cachedUser: any | null = null;

// Auth state listeners
type AuthCallback = (user: any | null, token: string | null) => void;
const listeners = new Set<AuthCallback>();

export const saveAuthSession = (user: any, token: string, expiresInSec: number = 7200) => {
  try {
    const session: StoredDriveSession = {
      accessToken: token,
      user: {
        uid: user.uid,
        displayName: user.displayName || user.name || 'Akun Google SIMRS',
        email: user.email || '',
        photoURL: user.photoURL || user.picture || null
      },
      expiresAt: Date.now() + Math.max(expiresInSec, 3600) * 1000
    };
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEY_CONNECTED_FLAG, 'true');

    // Also persist in IndexedDB for reliable multi-session re-connection
    saveToIDB('session', session);
  } catch (e) {
    console.warn('Notice saving drive auth session:', e);
  }
};

export const loadStoredAuthSession = (): StoredDriveSession | null => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_AUTH_SESSION) ||
      localStorage.getItem(STORAGE_KEY_AUTH_SESSION_LEGACY);
    if (!raw) return null;
    const session: StoredDriveSession = JSON.parse(raw);
    if (!session || !session.accessToken) return null;

    // Check expiration - allow grace period so connection persists across reloads
    if (session.expiresAt && Date.now() > session.expiresAt + 86400000) {
      console.info('Stored Google Drive auth session expired. Re-authentication needed.');
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const clearStoredAuthSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
    localStorage.removeItem(STORAGE_KEY_AUTH_SESSION_LEGACY);
    localStorage.removeItem(STORAGE_KEY_CONNECTED_FLAG);
    clearFromIDB('session');
  } catch {}
};

export const addAuthListener = (cb: AuthCallback): (() => void) => {
  listeners.add(cb);
  cb(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(cb);
  };
};

const notifyListeners = (user: any | null, token: string | null) => {
  cachedUser = user;
  cachedAccessToken = token;
  listeners.forEach((cb) => {
    try {
      cb(user, token);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
  window.dispatchEvent(
    new CustomEvent('rsumb_drive_auth_change', {
      detail: { user, hasToken: !!token }
    })
  );
};

/**
 * Validate token with Google TokenInfo API in background
 */
const validateTokenInBackground = async (token: string) => {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
    if (!res.ok) {
      console.warn('Google Drive token validation failed in background:', res.statusText);
      clearStoredAuthSession();
      cachedAccessToken = null;
      notifyListeners(cachedUser, null);
    }
  } catch (err) {
    // Network errors should not invalidate active session
    console.warn('Network notice validating token:', err);
  }
};

// Initialize auth state listener. Runs on app load.
export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  // 1. Check for existing Google OAuth session in localStorage
  const storedSession = loadStoredAuthSession();
  if (storedSession && storedSession.accessToken) {
    console.info('[Google Drive] Memulihkan sesi OAuth tersimpan secara otomatis...');
    cachedAccessToken = storedSession.accessToken;
    cachedUser = storedSession.user;
    notifyListeners(storedSession.user, storedSession.accessToken);
    window.dispatchEvent(
      new CustomEvent('rsumb_drive_connected', { detail: { user: storedSession.user } })
    );
    if (onAuthSuccess) {
      onAuthSuccess(storedSession.user, storedSession.accessToken);
    }

    // Verify token validity in background asynchronously
    validateTokenInBackground(storedSession.accessToken);
  } else {
    // Check IndexedDB backup asynchronously
    getFromIDB<StoredDriveSession>('session').then((idbSession) => {
      if (idbSession && idbSession.accessToken && !cachedAccessToken) {
        console.info('[Google Drive] Memulihkan sesi OAuth tersimpan dari IndexedDB secara otomatis...');
        cachedAccessToken = idbSession.accessToken;
        cachedUser = idbSession.user;
        try {
          localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(idbSession));
          localStorage.setItem(STORAGE_KEY_CONNECTED_FLAG, 'true');
        } catch {}
        notifyListeners(idbSession.user, idbSession.accessToken);
        window.dispatchEvent(
          new CustomEvent('rsumb_drive_connected', { detail: { user: idbSession.user } })
        );
        if (onAuthSuccess) {
          onAuthSuccess(idbSession.user, idbSession.accessToken);
        }
      }
    });
  }

  // 2. Check for redirect result from previous redirect sign-in
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          cachedUser = result.user;
          saveAuthSession(result.user, credential.accessToken);
          notifyListeners(result.user, cachedAccessToken);
          window.dispatchEvent(
            new CustomEvent('rsumb_drive_connected', { detail: { user: result.user } })
          );
          if (onAuthSuccess) onAuthSuccess(result.user, cachedAccessToken);
        }
      }
    })
    .catch((err) => {
      if (err?.code !== 'auth/null-user') {
        console.warn('Notice checking Google redirect auth result:', err);
      }
    });

  // 3. Listen to Firebase Auth state
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        notifyListeners(user, cachedAccessToken);
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Firebase Auth rehydrated user
        cachedUser = user;
        const currentStored = loadStoredAuthSession();
        if (currentStored && currentStored.accessToken) {
          cachedAccessToken = currentStored.accessToken;
          notifyListeners(user, currentStored.accessToken);
          if (onAuthSuccess) onAuthSuccess(user, currentStored.accessToken);
        } else {
          notifyListeners(user, null);
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      // If user signed out of Firebase, clear cached session
      if (!loadStoredAuthSession()) {
        cachedAccessToken = null;
        cachedUser = null;
        notifyListeners(null, null);
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Otentikasi menggunakan Google Identity Services (GIS) Token Client
 * Memungkinkan perolehan token OAuth 2.0 Google Drive langsung di browser
 */
export const signInWithGoogleIdentityServices = (): Promise<{ user: any; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    const clientId = (firebaseConfig as any).oAuthClientId;
    if (!clientId) {
      return reject(new Error('Google OAuth Client ID belum terkonfigurasi di sistem.'));
    }

    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services SDK belum termuat di peramban.'));
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          const accessToken = tokenResponse.access_token;
          if (!accessToken) {
            return reject(new Error('Token akses tidak diterima dari Google.'));
          }

          cachedAccessToken = accessToken;

          // Fetch user info from Google endpoint to display proper avatar/name
          let mappedUser: any = {
            uid: 'google-gis-user',
            email: 'user@google.com',
            displayName: 'Akun Google Drive SIMRS',
            photoURL: null
          };

          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (userRes.ok) {
              const profile = await userRes.json();
              mappedUser = {
                uid: profile.sub || 'gis-user',
                email: profile.email || 'user@google.com',
                displayName: profile.name || 'Akun Google Drive',
                photoURL: profile.picture || null
              };
            }
          } catch (e) {
            console.warn('Notice fetching GIS user profile:', e);
          }

          cachedUser = mappedUser;
          saveAuthSession(mappedUser, accessToken, tokenResponse.expires_in || 3600);

          notifyListeners(mappedUser, accessToken);
          window.dispatchEvent(new CustomEvent('rsumb_drive_connected', { detail: { user: mappedUser } }));
          resolve({ user: mappedUser, accessToken });
        },
        error_callback: (err: any) => {
          reject(err);
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // 1. Try Google Identity Services (GIS) if available in window.google
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const gisResult = await signInWithGoogleIdentityServices();
        if (gisResult?.accessToken) {
          return gisResult;
        }
      } catch (gisError: any) {
        console.info('GIS token client prompt dismissed or failed, attempting Firebase Auth fallback:', gisError?.message);
        if (gisError?.message?.includes('closed') || gisError?.type === 'popup_closed') {
          throw gisError;
        }
      }
    }

    // 2. Firebase Auth Google Sign-in flow
    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      if (
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.code === 'auth/cancelled-popup-request' ||
        popupErr?.code === 'auth/operation-not-supported-in-this-environment' ||
        popupErr?.message?.toLowerCase().includes('popup')
      ) {
        console.info('Popup blocked or not supported by browser. Switching to redirect authentication flow...');
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupErr;
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Drive dari otentikasi Firebase.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    saveAuthSession(result.user, credential.accessToken);

    notifyListeners(result.user, cachedAccessToken);
    window.dispatchEvent(new CustomEvent('rsumb_drive_connected', { detail: { user: result.user } }));
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    const session = loadStoredAuthSession();
    if (session && session.accessToken) {
      cachedAccessToken = session.accessToken;
      cachedUser = session.user;
    }
  }
  return cachedAccessToken;
};

export const getCachedUser = (): any | null => {
  if (!cachedUser) {
    const session = loadStoredAuthSession();
    if (session && session.user) {
      cachedUser = session.user;
    }
  }
  return cachedUser;
};

export const isGoogleDriveConnected = (): boolean => {
  if (!cachedAccessToken) {
    const session = loadStoredAuthSession();
    if (session && session.accessToken) {
      cachedAccessToken = session.accessToken;
      cachedUser = session.user;
    }
  }
  return !!cachedAccessToken;
};

export const logoutGoogleDrive = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut warning:', e);
  }
  cachedAccessToken = null;
  cachedUser = null;
  clearStoredAuthSession();
  notifyListeners(null, null);
};

export const hasPreviouslyConnectedDrive = (): boolean => {
  return !!loadStoredAuthSession();
};
