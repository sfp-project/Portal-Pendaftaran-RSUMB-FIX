import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, CheckCircle2, Save, Sparkles, Trash2 } from 'lucide-react';

interface AutoSavePayload<T> {
  data: T;
  savedAt: string;
  formattedTime: string;
}

export interface UseAutoSaveOptions<T> {
  /** Storage key in localStorage, e.g. 'rsumb_draft_patient_notes_kll' */
  storageKey: string;
  /** Current form state values */
  formData: T;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Whether we are editing an existing record instead of creating new */
  isEditing?: boolean;
  /** Function to check if form is currently empty (do not save completely blank form) */
  isEmpty?: (data: T) => boolean;
  /** Callback when a saved draft is detected and should be restored */
  onRestore: (draftData: T) => void;
  /** Callback to reset form to blank when user clicks 'Kosongkan Form' / 'Buang Draf' */
  onReset?: () => void;
  /** Debounce delay in milliseconds (default: 600ms) */
  debounceMs?: number;
}

export function usePatientNotesAutoSave<T>({
  storageKey,
  formData,
  isOpen,
  isEditing = false,
  isEmpty,
  onRestore,
  onReset,
  debounceMs = 600
}: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [wasRestored, setWasRestored] = useState(false);
  const [restoredTime, setRestoredTime] = useState<string | null>(null);

  const initialCheckDoneRef = useRef(false);
  const latestDataRef = useRef(formData);
  latestDataRef.current = formData;

  // Key used in localStorage
  const effectiveKey = isEditing ? `${storageKey}_edit` : `${storageKey}_new`;

  // 1. Check for existing draft on modal open (only for new records, or matching edit)
  useEffect(() => {
    if (!isOpen) {
      initialCheckDoneRef.current = false;
      setWasRestored(false);
      setRestoredTime(null);
      return;
    }

    if (isOpen && !initialCheckDoneRef.current) {
      initialCheckDoneRef.current = true;

      // Only auto-restore draft for new records to avoid overwriting existing record edits
      if (!isEditing) {
        try {
          const raw = localStorage.getItem(effectiveKey);
          if (raw) {
            const parsed: AutoSavePayload<T> = JSON.parse(raw);
            if (parsed && parsed.data) {
              const isDraftEmpty = isEmpty ? isEmpty(parsed.data) : false;
              if (!isDraftEmpty) {
                onRestore(parsed.data);
                setWasRestored(true);
                setRestoredTime(parsed.formattedTime || new Date(parsed.savedAt).toLocaleTimeString('id-ID'));
                setLastSavedTime(parsed.formattedTime || new Date(parsed.savedAt).toLocaleTimeString('id-ID'));
              }
            }
          }
        } catch (err) {
          console.warn(`[AutoSave] Gagal membaca draf dari ${effectiveKey}:`, err);
        }
      }
    }
  }, [isOpen, effectiveKey, isEditing, isEmpty, onRestore]);

  // 2. Periodic debounced save on form data change
  useEffect(() => {
    if (!isOpen || !initialCheckDoneRef.current) return;

    // Don't auto-save if editing unless required, or if empty
    const checkEmpty = isEmpty ? isEmpty(formData) : false;
    if (checkEmpty) {
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(() => {
      try {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        // Strip heavy base64 strings if any to prevent localStorage quota issues
        const cleanData = sanitizeDraftData(formData);

        const payload: AutoSavePayload<T> = {
          data: cleanData,
          savedAt: now.toISOString(),
          formattedTime
        };

        localStorage.setItem(effectiveKey, JSON.stringify(payload));
        setLastSavedTime(formattedTime);
      } catch (err) {
        console.warn(`[AutoSave] Gagal menyimpan draf ke ${effectiveKey}:`, err);
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [formData, isOpen, effectiveKey, debounceMs, isEmpty]);

  // 3. Flush to localStorage on window beforeunload (accidental tab close/refresh)
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforeUnload = () => {
      try {
        const currentData = latestDataRef.current;
        const checkEmpty = isEmpty ? isEmpty(currentData) : false;
        if (!checkEmpty) {
          const now = new Date();
          const formattedTime = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          const cleanData = sanitizeDraftData(currentData);
          const payload: AutoSavePayload<T> = {
            data: cleanData,
            savedAt: now.toISOString(),
            formattedTime
          };
          localStorage.setItem(effectiveKey, JSON.stringify(payload));
        }
      } catch (err) {
        console.warn('[AutoSave] Unload save error:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, effectiveKey, isEmpty]);

  // Clear draft upon successful submit
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(effectiveKey);
      setLastSavedTime(null);
      setWasRestored(false);
      setRestoredTime(null);
    } catch (err) {
      console.warn(`[AutoSave] Gagal menghapus draf ${effectiveKey}:`, err);
    }
  }, [effectiveKey]);

  // Discard draft and reset form
  const discardDraft = useCallback(() => {
    try {
      localStorage.removeItem(effectiveKey);
      setLastSavedTime(null);
      setWasRestored(false);
      setRestoredTime(null);
      if (onReset) {
        onReset();
      }
    } catch (err) {
      console.warn(`[AutoSave] Gagal membuang draf ${effectiveKey}:`, err);
    }
  }, [effectiveKey, onReset]);

  return {
    isSaving,
    lastSavedTime,
    wasRestored,
    restoredTime,
    clearDraft,
    discardDraft,
    setWasRestored
  };
}

/** Remove heavy binary/base64 data (like >100KB files) from draft to avoid exceeding 5MB localStorage */
function sanitizeDraftData<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  const clone = { ...(data as Record<string, any>) };

  // If there's an lpFileUrl or large data URI, drop it from draft or truncate
  if (typeof clone.lpFileUrl === 'string' && clone.lpFileUrl.length > 50000) {
    clone.lpFileUrl = undefined; // Drop base64 from draft to prevent QuotaExceededError
  }

  return clone as T;
}

/** UI Banner component to notify user that their draft was auto-restored */
export const AutoSaveRestoreBanner: React.FC<{
  wasRestored: boolean;
  restoredTime: string | null;
  onDiscard: () => void;
  onDismiss?: () => void;
}> = ({ wasRestored, restoredTime, onDiscard, onDismiss }) => {
  if (!wasRestored) return null;

  return (
    <div className="mx-6 mt-4 p-3 bg-blue-50/90 border border-blue-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs text-blue-900 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2.5 min-w-[200px]">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <span className="font-bold text-slate-800 block">Draf Otomatis Dipulihkan</span>
          <span className="text-[11px] text-slate-600">
            Melanjutkan isian sebelumnya yang belum tersimpan ({restoredTime ? `pukul ${restoredTime}` : 'tersimpan di browser'}).
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={onDiscard}
          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          title="Hapus draf ini dan mulai formulir baru yang kosong"
        >
          <Trash2 className="w-3 h-3" />
          <span>Kosongkan Form</span>
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  );
};

/** Live auto-save status indicator for the modal footer */
export const AutoSaveFooterStatus: React.FC<{
  isSaving: boolean;
  lastSavedTime: string | null;
  className?: string;
}> = ({ isSaving, lastSavedTime, className = '' }) => {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] select-none ${className}`}>
      {isSaving ? (
        <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
          <span>Menyimpan draf...</span>
        </span>
      ) : lastSavedTime ? (
        <span
          className="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60"
          title="Data input tersimpan aman secara berkala di browser Anda"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Tersimpan otomatis ({lastSavedTime})</span>
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-slate-400"
          title="Auto-save aktif: input Anda tersimpan otomatis ke memori lokal"
        >
          <Save className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Auto-save aktif</span>
        </span>
      )}
    </div>
  );
};
