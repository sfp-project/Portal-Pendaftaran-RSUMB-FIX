import React, { useState } from 'react';
import {
  X,
  Save,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { StickyNoteItem } from '../../types/inpatientOrderTypes';
import {
  ShiftArchiveItem,
  ShiftType,
  SHIFT_OPTIONS,
  DAFTAR_STAF_PENDAFTARAN,
  saveShiftArchive
} from '../../data/shiftArchiveData';

interface SaveShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: StickyNoteItem[];
  onSaveSuccess: (newArchive: ShiftArchiveItem) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SaveShiftModal: React.FC<SaveShiftModalProps> = ({
  isOpen,
  onClose,
  notes,
  onSaveSuccess,
  showToast
}) => {
  // Deteksi shift otomatis berdasarkan jam sekarang
  const getDefaultShift = (): ShiftType => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 14) return 'Shift Pagi (07.00 - 14.00)';
    if (hour >= 14 && hour < 21) return 'Shift Siang (14.00 - 21.00)';
    return 'Shift Malam (21.00 - 07.00)';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [shift, setShift] = useState<ShiftType>(getDefaultShift);
  const [officerName, setOfficerName] = useState<string>(DAFTAR_STAF_PENDAFTARAN[0]);
  const [customOfficer, setCustomOfficer] = useState<string>('');
  const [isCustomOfficer, setIsCustomOfficer] = useState<boolean>(false);
  const [notesText, setNotesText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Format tanggal display Indonesia
  const formatDateDisplay = (dateString: string) => {
    try {
      const d = new Date(dateString + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalOfficer = isCustomOfficer ? customOfficer.trim() : officerName;

    if (!finalOfficer) {
      showToast('Mohon pilih atau masukkan nama petugas operan shift!', 'error');
      setIsSubmitting(false);
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const savedAtStr = `${dateFormatted} ${timeStr} WIB`;

    const newArchive: ShiftArchiveItem = {
      id: `arch-${Date.now()}`,
      date,
      dateDisplay: formatDateDisplay(date),
      shift,
      officerName: finalOfficer,
      notesText: notesText.trim() || undefined,
      savedAt: savedAtStr,
      timestamp: Date.now(),
      // Deep clone snapshot catatan saat ini
      snapshotNotes: JSON.parse(JSON.stringify(notes))
    };

    saveShiftArchive(newArchive);
    onSaveSuccess(newArchive);
    showToast(
      `Operan shift berhasil disimpan ke arsip! (${formatDateDisplay(date)} - ${shift.split(' ')[1]} oleh ${finalOfficer})`,
      'success'
    );
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-xs">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Simpan Operan Shift ke Arsip
              </h2>
              <p className="text-xs text-emerald-100">
                Dokumentasikan snapshot 4 Sticky Notes untuk riwayat &amp; laporan SIMRS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmSave} className="p-5 sm:p-6 space-y-4 text-slate-800">
          {/* Info Snapshot Bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <Layers className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-semibold block text-emerald-950 mb-0.5">
                Snapshot 4 Kolom Catatan yang Disimpan:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {notes.map((n) => (
                  <span
                    key={n.id}
                    className="px-2 py-0.5 bg-white text-emerald-800 border border-emerald-200 rounded-md font-medium text-[11px] shadow-2xs"
                  >
                    {n.headerCode}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Tanggal & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Operan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Tanggal Operan:
                </span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50 focus:bg-white transition-all text-slate-800 font-medium"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {formatDateDisplay(date)}
              </span>
            </div>

            {/* Shift */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Pilih Shift:
                </span>
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50 focus:bg-white transition-all text-slate-800 font-medium cursor-pointer"
              >
                {SHIFT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Petugas Pendaftaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Nama Petugas Operan:
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={isCustomOfficer ? 'custom' : officerName}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomOfficer(true);
                  } else {
                    setIsCustomOfficer(false);
                    setOfficerName(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50 focus:bg-white transition-all text-slate-800 font-medium cursor-pointer"
              >
                {DAFTAR_STAF_PENDAFTARAN.map((staf) => (
                  <option key={staf} value={staf}>
                    {staf} (Staf Pendaftaran)
                  </option>
                ))}
                <option value="custom">-- Ketik Nama Lainnya --</option>
              </select>

              {isCustomOfficer && (
                <input
                  type="text"
                  placeholder="Ketik nama petugas..."
                  value={customOfficer}
                  onChange={(e) => setCustomOfficer(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-2 text-sm border border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-800"
                />
              )}
            </div>
          </div>

          {/* Catatan Tambahan Operan (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Catatan Penting Operan (Opsional):
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Pasien Tn. Karmani rencana pindah jika ada bed kosong jam 09.00; ICU penuh 2 bed terisi; DPJP visit sore..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi Simpan ke Arsip'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
