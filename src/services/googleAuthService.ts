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

// Initialize Firebase App singleton safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider with explicit Google Drive file scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to indicate if currently in sign-in flow
let isSigningIn = false;

// Cache the access token in memory (NEVER store in localStorage or sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Auth state listeners
type AuthCallback = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthCallback>();

export const addAuthListener = (cb: AuthCallback): (() => void) => {
  listeners.add(cb);
  cb(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(cb);
  };
};

const notifyListeners = (user: User | null, token: string | null) => {
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

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check for redirect result from previous redirect sign-in (e.g., on mobile browsers / netlify.app)
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          cachedUser = result.user;
          notifyListeners(result.user, cachedAccessToken);
          if (onAuthSuccess) onAuthSuccess(result.user, cachedAccessToken);
        }
      }
    })
    .catch((err) => {
      // Non-fatal warning if redirect result is not present
      if (err?.code !== 'auth/null-user') {
        console.warn('Notice checking Google redirect auth result:', err);
      }
    });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        notifyListeners(user, cachedAccessToken);
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Firebase Auth rehydrated user session after page refresh,
        // but OAuth token needs user interaction or silent refresh if cached in-memory was cleared.
        cachedUser = user;
        notifyListeners(user, null);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedUser = null;
      notifyListeners(null, null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    let result;

    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      // If popup is blocked by the mobile browser, in-app webview, or iframe policy, fallback to redirect flow
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
    notifyListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCachedUser = (): User | null => {
  return cachedUser;
};

export const isGoogleDriveConnected = (): boolean => {
  return !!cachedAccessToken && !!cachedUser;
};

export const logoutGoogleDrive = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut warning:', e);
  }
  cachedAccessToken = null;
  cachedUser = null;
  notifyListeners(null, null);
};
