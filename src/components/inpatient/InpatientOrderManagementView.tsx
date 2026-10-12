import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StickyNote,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ListPlus,
  Eraser,
  Image as ImageIcon,
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Sparkles,
  Share2,
  FileText,
  Send,
  X,
  Maximize2,
  Minimize2,
  Highlighter,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  AlignLeft,
  Save,
  History,
  Eye,
  Calendar,
  User,
  Search,
  Filter,
  Archive,
  CheckCheck,
  AlertCircle,
  BookmarkCheck,
  Pencil
} from 'lucide-react';
import { parseSpriText, formatPesananKamarWA } from '../../data/inpatientOrderData';
import { SaveShiftModal } from './SaveShiftModal';
import { ShiftArchiveModal } from './ShiftArchiveModal';
import {
  ShiftArchiveItem,
  getStoredArchives,
  deleteShiftArchive,
  updateShiftArchive,
  getLastArchiveInfo,
  autoSaveShiftArchive
} from '../../data/shiftArchiveData';
import { StickyColorTheme, StickyNoteItem } from '../../types/inpatientOrderTypes';
import { htmlToCleanWhatsAppText } from '../../utils/inpatientWaFormat';

export type { StickyColorTheme, StickyNoteItem };
export { htmlToCleanWhatsAppText };

interface InpatientOrderManagementViewProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Skema Warna Pastel Windows Sticky Notes
export const THEME_STYLES: Record<
  StickyColorTheme,
  {
    headerBg: string;
    headerBorder: string;
    headerText: string;
    headerAccent: string;
    bodyBg: string;
    bodyBorder: string;
    toolbarBg: string;
    toolbarBorder: string;
    buttonHover: string;
    badgeBg: string;
    ringColor: string;
    name: string;
  }
> = {
  blue: {
    // Kolom 1 (Biru Muda): LIST INDEN LT 4
    headerBg: 'bg-[#dbeafe]',
    headerBorder: 'border-[#bfdbfe]',
    headerText: 'text-[#1e3a8a]',
    headerAccent: 'text-[#2563eb]',
    bodyBg: 'bg-[#eff6ff]',
    bodyBorder: 'border-[#bfdbfe]',
    toolbarBg: 'bg-[#e0e7ff]/70',
    toolbarBorder: 'border-[#bfdbfe]',
    buttonHover: 'hover:bg-[#bfdbfe]/80',
    badgeBg: 'bg-[#bfdbfe] text-[#1e3a8a]',
    ringColor: 'focus-within:ring-[#60a5fa]',
    name: 'Biru Muda (Sky)'
  },
  green: {
    // Kolom 2 (Hijau Muda): LIST INDEN LT 5
    headerBg: 'bg-[#d1fae5]',
    headerBorder: 'border-[#a7f3d0]',
    headerText: 'text-[#064e3b]',
    headerAccent: 'text-[#059669]',
    bodyBg: 'bg-[#ecfdf5]',
    bodyBorder: 'border-[#a7f3d0]',
    toolbarBg: 'bg-[#d1fae5]/70',
    toolbarBorder: 'border-[#a7f3d0]',
    buttonHover: 'hover:bg-[#a7f3d0]/80',
    badgeBg: 'bg-[#a7f3d0] text-[#064e3b]',
    ringColor: 'focus-within:ring-[#34d399]',
    name: 'Hijau Muda (Mint)'
  },
  pink: {
    // Kolom 3 (Merah Muda / Pink): LIST INDEN VK
    headerBg: 'bg-[#ffe4e6]',
    headerBorder: 'border-[#fecdd3]',
    headerText: 'text-[#881337]',
    headerAccent: 'text-[#e11d48]',
    bodyBg: 'bg-[#fff1f2]',
    bodyBorder: 'border-[#fecdd3]',
    toolbarBg: 'bg-[#ffe4e6]/70',
    toolbarBorder: 'border-[#fecdd3]',
    buttonHover: 'hover:bg-[#fecdd3]/80',
    badgeBg: 'bg-[#fecdd3] text-[#881337]',
    ringColor: 'focus-within:ring-[#fb7185]',
    name: 'Merah Muda (Pink)'
  },
  cream: {
    // Kolom 4 (Abu-abu / Krem): LIST KAMAR KOSONG
    headerBg: 'bg-[#fef3c7]',
    headerBorder: 'border-[#fde68a]',
    headerText: 'text-[#78350f]',
    headerAccent: 'text-[#d97706]',
    bodyBg: 'bg-[#fffbeb]',
    bodyBorder: 'border-[#fde68a]',
    toolbarBg: 'bg-[#fef3c7]/70',
    toolbarBorder: 'border-[#fde68a]',
    buttonHover: 'hover:bg-[#fde68a]/80',
    badgeBg: 'bg-[#fde68a] text-[#78350f]',
    ringColor: 'focus-within:ring-[#fbbf24]',
    name: 'Abu-abu / Krem'
  }
};

// Data Default Standar Operan Shift RSUMB
const DEFAULT_NOTES: StickyNoteItem[] = [
  {
    id: 'lt4',
    title: 'LIST INDEN LT 4',
    subtitle: 'Ruang Rawat Inap Lt. 4 (JN, JF)',
    headerCode: 'LT 4',
    theme: 'blue',
    updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    contentHtml: `<div><b>KARMANI. NY / 65 Th</b></div><div>- DYSPNEU S ADHF (I50.9)</div><div>- dr. Ilma Alfia Isaridha, Sp.JP.</div><div><span style="background-color: #fecdd3; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 3 ( &nbsp; )</span></div><br><div><b>ANANDA BIMA. AN / 5 Th</b></div><div>- BRONKOPNEUMONIA (J18.0)</div><div>- dr. Taufiqur Rahman, Sp. A</div><div><span style="background-color: #fecdd3; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- UMUM KLS 1 ( &nbsp; )</span></div><br><div><b>ABDUL QODIR. TN / 33 Th</b></div><div>- BATU URETER S (N20.1)</div><div>- dr. Randa Halfian, Sp. U</div><div>- BPJS KLS 3 (JN 1B)</div>`
  },
  {
    id: 'lt5',
    title: 'LIST INDEN LT 5',
    subtitle: 'Ruang Rawat Inap Lt. 5 (JM)',
    headerCode: 'LT 5',
    theme: 'green',
    updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    contentHtml: `<div><b>SUGIANTO. TN / 48 Th</b></div><div>- CHOLELITHIASIS (K80.2)</div><div>- dr. Rieski Widhanar, Sp. B</div><div><span style="background-color: #fecdd3; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 2 ( &nbsp; )</span></div><br><div><b>SRI WAHYUNI. NY / 52 Th</b></div><div>- VERTIGO VESTIBULER (R42)</div><div>- dr. Dian Permatasari, Sp. S</div><div>- UMUM KLS 2 (JM 3A)</div><br><div><b>WARSONO. TN / 61 Th</b></div><div>- HIL DEXTRA INKARSERATA (K40.9)</div><div>- dr. Nikita Gladys L., Sp. B</div><div>- BPJS KLS 3 (JM 5B)</div>`
  },
  {
    id: 'vk',
    title: 'LIST INDEN VK',
    subtitle: 'Ruang Bersalin / Kebidanan / Nifas',
    headerCode: 'VK',
    theme: 'pink',
    updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    contentHtml: `<div><b>NURUL HIDAYAH. NY / 29 Th</b></div><div>- G2P1A0 INPARTU KALA 1 (O80)</div><div>- dr. Dony R. Bimantara, Sp. OG</div><div><span style="background-color: #fecdd3; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- BPJS KLS 3 ( &nbsp; )</span></div><br><div><b>SITI KHOTIMAH. NY / 34 Th</b></div><div>- G3P2A0 POST SC H-1 (O82)</div><div>- dr. Dony R. Bimantara, Sp. OG</div><div>- BPJS KLS 2 (VK Nifas 2)</div>`
  },
  {
    id: 'kamar_kosong',
    title: 'LIST KAMAR KOSONG',
    subtitle: 'Rekap Ketersediaan Bed Per Shift',
    headerCode: 'BED KOSONG',
    theme: 'cream',
    updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    contentHtml: `<div><b>KETERSEDIAAN BED KOSONG (RSUMB):</b></div><br><div><b>• LANTAI 4 (JN / JF):</b></div><div>&nbsp;&nbsp;- Kls 1 (Anak): JN 05 (1 Bed)</div><div>&nbsp;&nbsp;- Kls 2: JN 08A (1 Bed)</div><div>&nbsp;&nbsp;- Kls 3: JF 02, JF 04B (2 Bed)</div><br><div><b>• LANTAI 5 (JM):</b></div><div>&nbsp;&nbsp;- VIP: JM 01 (1 Bed)</div><div>&nbsp;&nbsp;- Kls 2: JM 06B (1 Bed)</div><div>&nbsp;&nbsp;- Kls 3: JM 09A (1 Bed)</div><br><div><b>• VK (DARUSSALAM / NIFAS):</b></div><div>&nbsp;&nbsp;- Ruang Nifas Kls 3: 2 Bed Kosong</div><div>&nbsp;&nbsp;- Ruang Bersalin: 1 Bed Siap Pakai</div><br><div><b>• ICU:</b></div><div>&nbsp;&nbsp;- Bed 02 (1 Bed Siap Pakai / Ventilator)</div>`
  }
];

const STORAGE_KEY = 'rsumb_sticky_notes_data_v2';

export const InpatientOrderManagementView: React.FC<InpatientOrderManagementViewProps> = ({
  showToast
}) => {
  // ----------------------------------------------------
  // 1. STATE STICKY NOTES DENGAN LOCALSTORAGE
  // ----------------------------------------------------
  const [notes, setNotes] = useState<StickyNoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading sticky notes:', e);
    }
    return DEFAULT_NOTES;
  });

  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // State Feedback Copy
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // ----------------------------------------------------
  // ARSIP OPERAN SHIFT STATE & HANDLERS
  // ----------------------------------------------------
  const [archives, setArchives] = useState<ShiftArchiveItem[]>(() => getStoredArchives());
  const [lastArchiveInfo, setLastArchiveInfo] = useState<string>(() => getLastArchiveInfo());
  const [isSaveShiftModalOpen, setIsSaveShiftModalOpen] = useState<boolean>(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  // Key version to force fresh re-render of contentEditable cards when restoring/resetting/clearing
  const [editorVersion, setEditorVersion] = useState<number>(0);

  // Catatan Operan Shift Aktif (yang dimuat dari arsip atau sesi saat ini)
  const [activeShiftNote, setActiveShiftNote] = useState<{
    dateDisplay: string;
    shift: string;
    officerName: string;
    text: string;
  } | null>(null);

  // Status Autosave Arsip: 'idle' | 'saving' | 'saved'
  const [archiveAutosaveStatus, setArchiveAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autosaveArchiveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  // FITUR AUTOSAVE KE RIWAYAT ARSIP:
  // Setiap kali isi Sticky Notes berubah, otomatis tersimpan/terperbarui ke riwayat arsip shift aktif
  useEffect(() => {
    // Lewati initial mount agar tidak memicu autosave berlebih saat pertama kali load
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Pastikan ada konten bermakna pada notes
    const hasAnyContent = notes.some(
      (n) => n.contentHtml && n.contentHtml.replace(/<[^>]*>/g, '').trim().length > 0
    );
    if (!hasAnyContent) return;

    setArchiveAutosaveStatus('saving');

    if (autosaveArchiveTimerRef.current) {
      clearTimeout(autosaveArchiveTimerRef.current);
    }

    // Debounce 2 detik setelah staf selesai mengetik/mengubah catatan
    autosaveArchiveTimerRef.current = setTimeout(() => {
      const result = autoSaveShiftArchive(notes);
      setArchives(result.updatedArchives);
      setLastArchiveInfo(result.label);
      setArchiveAutosaveStatus('saved');

      // Kembalikan ke idle setelah 3 detik
      setTimeout(() => {
        setArchiveAutosaveStatus('idle');
      }, 3000);
    }, 2000);

    return () => {
      if (autosaveArchiveTimerRef.current) {
        clearTimeout(autosaveArchiveTimerRef.current);
      }
    };
  }, [notes]);

  // Flush autosave ke arsip seketika jika staf menutup tab atau reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autosaveArchiveTimerRef.current) {
        clearTimeout(autosaveArchiveTimerRef.current);
        autoSaveShiftArchive(notes);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [notes]);

  const handleSaveArchiveSuccess = (newArchive: ShiftArchiveItem) => {
    setArchives((prev) => [newArchive, ...prev.filter((a) => a.id !== newArchive.id)]);
    const info = `${newArchive.dateDisplay} - ${newArchive.shift.split(' ')[1] || newArchive.shift} oleh ${newArchive.officerName}`;
    setLastArchiveInfo(info);
  };

  const handleRestoreArchive = (archive: ShiftArchiveItem) => {
    // 1. Ambil data teks dari ke-4 kolom (LT 4, LT 5, VK, BED KOSONG)
    const freshSnapshot: StickyNoteItem[] = DEFAULT_NOTES.map((defNote) => {
      const matched = archive.snapshotNotes?.find(
        (sn) =>
          sn.id === defNote.id ||
          sn.headerCode?.toLowerCase() === defNote.headerCode.toLowerCase()
      );
      return {
        ...defNote,
        contentHtml: matched ? matched.contentHtml : defNote.contentHtml,
        updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
    });

    // 2. Timpa (overwrite) isi keempat Sticky Note di layar utama dan perbarui LocalStorage utama
    saveNotesToStorage(freshSnapshot);

    // 3. Simpan catatan operan shift dari ID arsip tersebut jika tersedia
    if (archive.notesText && archive.notesText.trim()) {
      setActiveShiftNote({
        dateDisplay: archive.dateDisplay,
        shift: archive.shift,
        officerName: archive.officerName,
        text: archive.notesText
      });
    }

    // 4. Force re-render ke-4 sticky note dengan menaikkan editorVersion
    setEditorVersion((v) => v + 1);

    // 5. Tutup modal riwayat secara otomatis
    setIsArchiveModalOpen(false);

    // 6. Notifikasi toast sukses
    triggerToast(
      'Berhasil memuat data arsip ke editor utama! Anda dapat langsung mengeditnya sekarang.',
      'success'
    );
  };

  const handleUpdateArchive = (updatedArchive: ShiftArchiveItem) => {
    const updated = updateShiftArchive(updatedArchive);
    setArchives(updated);
    setLastArchiveInfo(getLastArchiveInfo());
    triggerToast('Perubahan data arsip berhasil disimpan!', 'success');
  };

  const handleDeleteArchive = (archiveId: string, itemRef?: ShiftArchiveItem) => {
    const updated = deleteShiftArchive(archiveId, itemRef);
    setArchives(updated);
    setLastArchiveInfo(getLastArchiveInfo());
  };

  // State Quick Parser SPRI Drawer / Modal
  const [isSpriAssistantOpen, setIsSpriAssistantOpen] = useState<boolean>(false);
  const [rawSpriInput, setRawSpriInput] = useState<string>(`FORMULIR PERMINTAAN RAWAT INAP
0811-3222-440
RSU Muhammadiyah Babat
064707
KARMANI. NY
PEREMPUAN
65 Th
DYSPNEU S ADHF
Dokter DPJP : dr. Ilma Alfia Isaridha, Sp.JP
BPJS KLS 3`);

  // Toast Helper
  const triggerToast = useCallback(
    (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
      if (showToast) showToast(msg, type);
    },
    [showToast]
  );

  // Simpan Otomatis ke LocalStorage saat State Berubah
  const saveNotesToStorage = (updatedNotes: StickyNoteItem[]) => {
    setNotes(updatedNotes);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setLastSavedTime(nowStr);
    } catch (e) {
      console.error('Failed to save notes to localStorage:', e);
    }
  };

  // Handler Update Konten Spesifik Sticky Note
  const handleUpdateNoteContent = (noteId: string, newHtml: string) => {
    setNotes((prevNotes) => {
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const nextNotes = prevNotes.map((note) =>
        note.id === noteId ? { ...note, contentHtml: newHtml, updatedAt: nowTime } : note
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
        setLastSavedTime(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch (e) {
        console.error(e);
      }
      return nextNotes;
    });
  };

  // Salin Teks Tunggal Sticky Note ke WhatsApp
  const handleCopyNoteWA = async (note: StickyNoteItem) => {
    try {
      const cleanWaText = htmlToCleanWhatsAppText(note.title, note.contentHtml);
      await navigator.clipboard.writeText(cleanWaText);
      setCopiedNoteId(note.id);
      triggerToast(`Isi catatan "${note.title}" berhasil disalin ke format WhatsApp!`);
      setTimeout(() => setCopiedNoteId(null), 2500);
    } catch {
      triggerToast('Gagal menyalin ke clipboard', 'error');
    }
  };

  // Salin Seluruh 4 Kolom (Rekap Gabungan) ke WhatsApp
  const handleCopyAllNotesWA = async () => {
    try {
      const combined = notes
        .map((n) => htmlToCleanWhatsAppText(n.title, n.contentHtml))
        .join('\n\n====================\n\n');

      const header = `*REKAP OPERAN SHIFT & INDEN RANAP RSUMB*\nTanggal: ${new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}\nUpdate: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB${
        activeShiftNote ? `\nCatatan Operan: ${activeShiftNote.text}` : ''
      }\n\n`;

      const fullText = header + combined;
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      triggerToast('Seluruh 4 Catatan (Rekap Lengkap) berhasil disalin ke WhatsApp!');
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      triggerToast('Gagal menyalin rekap ke clipboard', 'error');
    }
  };

  // Reset ke Template Awal Bawaan Standar
  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Kembalikan isi keempat kolom Sticky Notes ke template bawaan standar? Perubahan teks yang belum disimpan/disalin akan digantikan.'
      )
    ) {
      const freshDefaults = DEFAULT_NOTES.map((n) => ({
        ...n,
        updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }));
      saveNotesToStorage(freshDefaults);
      setEditorVersion((v) => v + 1);
      triggerToast('Format standar 4 Sticky Notes berhasil dimuat.');
    }
  };

  // Bersihkan/Kosongkan Seluruh Teks di Keempat Kolom
  const handleClearAllNotes = () => {
    if (window.confirm('Kosongkan dan hapus seluruh teks di keempat kolom Sticky Notes hingga bersih untuk shift baru?')) {
      const cleared = notes.map((n) => ({
        ...n,
        contentHtml: '',
        updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }));
      saveNotesToStorage(cleared);
      setEditorVersion((v) => v + 1);
      triggerToast('Seluruh 4 kolom catatan berhasil dikosongkan bersih.');
    }
  };

  // ----------------------------------------------------
  // FUNGSI SPRI ASSISTANT (AUTO INSERT KE NOTE)
  // ----------------------------------------------------
  const parsedSpriData = parseSpriText(rawSpriInput);
  const formattedSpriWA = formatPesananKamarWA(parsedSpriData);

  const handleAppendSpriToNote = (targetNoteId: 'lt4' | 'lt5' | 'vk') => {
    const targetNote = notes.find((n) => n.id === targetNoteId);
    if (!targetNote) return;

    const nama = parsedSpriData.nama || 'PASIEN BARU';
    const umur = parsedSpriData.umur || '-';
    const dx = parsedSpriData.diagnosa || 'DIAGNOSA AWAL';
    const icd = parsedSpriData.kodeIcd10 ? ` (${parsedSpriData.kodeIcd10})` : '';
    const dpjp = parsedSpriData.dpjp || 'dr. DPJP';
    const bayar = parsedSpriData.caraBayar || 'BPJS KLS 3';

    // HTML Snippet Pasien Baru dengan Highlight Soft Red untuk status Inden (Belum Dapat Kamar)
    const newSnippet = `<br><div><b>${nama} / ${umur}</b></div><div>- ${dx}${icd}</div><div>- ${dpjp}</div><div><span style="background-color: #fecdd3; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- ${bayar} ( &nbsp; )</span></div>`;

    const updatedContent = targetNote.contentHtml
      ? `${targetNote.contentHtml}${newSnippet}`
      : newSnippet.replace(/^<br>/, '');

    handleUpdateNoteContent(targetNoteId, updatedContent);
    triggerToast(`Pasien ${nama} berhasil ditambahkan ke ${targetNote.title}!`);
    setIsSpriAssistantOpen(false);
  };

  return (
    <div className="flex flex-col gap-2.5 w-full max-w-full print:p-0">
      {/* ==================================================== */}
      {/* 1. HEADER UTAMA: STICKY NOTES OPERAN SHIFT (KOMPAK)  */}
      {/* ==================================================== */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 py-1.5 px-3 sm:px-4 transition-all">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
          {/* Sisi Kiri: Judul Ringkas, Badge Auto-Save & Badge Terakhir Disimpan Sejajar */}
          <div className="flex items-center flex-wrap gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
              <StickyNote className="w-3.5 h-3.5" />
            </div>

            <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              STICKY NOTES DIGITAL OPERAN SHIFT &amp; INDEN RANAP
            </h1>

            {/* Pill Badge Auto-Save */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto-Save Aktif
            </span>

            {/* Pill Badge Terakhir Disimpan ke Arsip (Real-time Autosave) */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-medium shrink-0 max-w-[280px] sm:max-w-none truncate transition-all duration-300 ${
                archiveAutosaveStatus === 'saving'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                  : archiveAutosaveStatus === 'saved'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={`Terakhir disimpan ke arsip: ${lastArchiveInfo} • Auto-save lokal: ${lastSavedTime} WIB`}
            >
              {archiveAutosaveStatus === 'saving' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span className="truncate">
                    Menyimpan otomatis ke arsip...
                  </span>
                </>
              ) : archiveAutosaveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Tersimpan otomatis ke arsip: <strong className="font-semibold text-emerald-950">{lastArchiveInfo}</strong>
                  </span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Arsip: <strong className="font-semibold text-slate-900">{lastArchiveInfo}</strong>
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Sisi Kanan: Action Buttons Tipis / Ringkas (py-1 px-2.5 text-xs) */}
          <div className="flex items-center flex-wrap gap-1.5 shrink-0">
            {/* Tombol Simpan Operan Shift */}
            <button
              onClick={() => setIsSaveShiftModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer active:scale-98"
              title="Simpan seluruh snapshot 4 Sticky Notes ke riwayat arsip operan shift"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Operan</span>
            </button>

            {/* Tombol Salin Seluruh 4 Kolom */}
            <button
              onClick={handleCopyAllNotesWA}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer ${
                copiedAll
                  ? 'bg-teal-700 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
              title="Salin rekapitulasi seluruh 4 kolom ke WhatsApp"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Tersalin Semua!' : 'Salin Semua'}</span>
            </button>

            {/* Tombol Riwayat & Cari Arsip */}
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
              title="Cari dan buka riwayat arsip operan shift sebelumnya"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Riwayat</span>
              {archives.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-200 text-indigo-800 ml-0.5">
                  {archives.length}
                </span>
              )}
            </button>

            {/* Tombol Auto-Parse SPRI */}
            <button
              onClick={() => setIsSpriAssistantOpen(!isSpriAssistantOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Ekstrak teks SPRI otomatis ke catatan tempel"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isSpriAssistantOpen ? 'Tutup SPRI' : 'SPRI'}</span>
            </button>

            {/* Tombol Reset Default */}
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Muat format template awal"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Tombol Kosongkan Catatan */}
            <button
              onClick={handleClearAllNotes}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Kosongkan catatan untuk shift baru"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Kosongkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* BANNER CATATAN OPERAN SHIFT AKTIF (DARI ARSIP / SESI) */}
      {/* ==================================================== */}
      {activeShiftNote && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-2.5 sm:p-3 text-xs text-amber-950 flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-200/80 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-0.5">
                <strong className="font-bold text-amber-950">
                  Catatan Operan Shift: {activeShiftNote.dateDisplay} ({activeShiftNote.shift})
                </strong>
                <span className="text-[10px] px-2 py-0.5 bg-amber-200/90 text-amber-900 rounded-md font-semibold">
                  Petugas: {activeShiftNote.officerName}
                </span>
              </div>
              <p className="text-amber-900 leading-relaxed font-sans break-words whitespace-pre-line">
                {activeShiftNote.text}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                const newText = window.prompt(
                  'Sunting Catatan Operan Shift:',
                  activeShiftNote.text
                );
                if (newText !== null) {
                  setActiveShiftNote({ ...activeShiftNote, text: newText });
                  triggerToast('Catatan operan berhasil diperbarui!');
                }
              }}
              className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-200/70 rounded-lg cursor-pointer transition-colors"
              title="Sunting teks catatan operan ini"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveShiftNote(null)}
              className="p-1.5 text-amber-600 hover:text-rose-700 hover:bg-amber-200/70 rounded-lg cursor-pointer transition-colors"
              title="Sembunyikan banner catatan operan ini"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. DRAWER / ASISTEN AUTO-PARSE SPRI (OPTIONAL)       */}
      {/* ==================================================== */}
      {isSpriAssistantOpen && (
        <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 rounded-2xl p-5 border border-indigo-200 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-200/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Asisten Cepat: Auto-Parse SPRI ke Sticky Notes
              </h2>
            </div>
            <button
              onClick={() => setIsSpriAssistantOpen(false)}
              className="p-1 rounded-lg hover:bg-indigo-200/50 text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Input Textarea Raw SPRI */}
            <div className="lg:col-span-6 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Tempel Teks Mentah SPRI (Copy dari SIMRS / Dokter):</span>
                <span className="text-[11px] text-slate-500 font-normal">Format otomatis terbaca</span>
              </label>
              <textarea
                value={rawSpriInput}
                onChange={(e) => setRawSpriInput(e.target.value)}
                rows={5}
                placeholder="Tempel teks SPRI di sini..."
                className="w-full text-xs font-mono p-3 rounded-xl border border-indigo-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-400 text-slate-800"
              />
            </div>

            {/* Hasil Ekstraksi & Tombol Masukkan ke Note */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-3 bg-white/80 p-4 rounded-xl border border-indigo-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1">
                  Format Hasil Ekstraksi:
                </span>
                <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
                  {formattedSpriWA}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-2">
                  Pilih Kolom Sticky Note Tujuan untuk Menambahkan:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAppendSpriToNote('lt4')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Masukkan ke LT 4
                  </button>
                  <button
                    onClick={() => handleAppendSpriToNote('lt5')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Masukkan ke LT 5
                  </button>
                  <button
                    onClick={() => handleAppendSpriToNote('vk')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Masukkan ke VK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. LAYOUT MULTI-KOLOM (4 STICKY NOTES BERSAMPINGAN)   */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch w-full">
        {notes.map((note) => (
          <SingleStickyNoteCard
            key={`${note.id}-${editorVersion}`}
            note={note}
            isCopied={copiedNoteId === note.id}
            onCopy={() => handleCopyNoteWA(note)}
            onContentChange={(newHtml) => handleUpdateNoteContent(note.id, newHtml)}
            onAppendPatientTemplate={() => {
              let template = '';
              if (note.id === 'kamar_kosong') {
                template = `<div><b><u>UNIT / RUANGAN BARU:</u></b></div><div>- Keterangan bed / ketersediaan: ( &nbsp; )</div>`;
              } else {
                template = `<div><b>NAMA PASIEN. NY/TN / UMUR Th</b></div><div>- DIAGNOSA AWAL (KODE ICD)</div><div>- dr. NAMA DPJP, Sp.XX</div><div><span style="background-color: #fecdd3; padding: 2px 6px; border-radius: 4px; font-weight: 500;">- CARA BAYAR KELAS ( &nbsp; )</span></div>`;
              }
              const separator = note.contentHtml && note.contentHtml.trim().length > 0 ? '<br>' : '';
              const newHtml = `${note.contentHtml || ''}${separator}${template}`;
              handleUpdateNoteContent(note.id, newHtml);
              triggerToast(`Template entri baru ditambahkan ke ${note.title}`);
            }}
            onClearNote={() => {
              handleUpdateNoteContent(note.id, '');
              triggerToast(`${note.title} telah dikosongkan.`);
            }}
          />
        ))}
      </div>

      {/* ==================================================== */}
      {/* 4. MODAL SIMPAN OPERAN SHIFT & CARI RIWAYAT ARSIP    */}
      {/* ==================================================== */}
      <SaveShiftModal
        isOpen={isSaveShiftModalOpen}
        onClose={() => setIsSaveShiftModalOpen(false)}
        notes={notes}
        onSaveSuccess={handleSaveArchiveSuccess}
        showToast={triggerToast}
      />

      <ShiftArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archives={archives}
        onRestoreArchive={handleRestoreArchive}
        onDeleteArchive={handleDeleteArchive}
        onUpdateArchive={handleUpdateArchive}
        showToast={triggerToast}
      />
    </div>
  );
};

// ======================================================================
// KOMPONEN KARTU TUNGGAL WINDOWS STICKY NOTE
// ======================================================================

interface SingleStickyNoteCardProps {
  note: StickyNoteItem;
  isCopied: boolean;
  onCopy: () => void;
  onContentChange: (newHtml: string) => void;
  onAppendPatientTemplate: () => void;
  onClearNote: () => void;
}

const SingleStickyNoteCard: React.FC<SingleStickyNoteCardProps> = ({
  note,
  isCopied,
  onCopy,
  onContentChange,
  onAppendPatientTemplate,
  onClearNote
}) => {
  const styles = THEME_STYLES[note.theme];
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial innerHTML saat pertama mount atau saat data berubah dari luar (Restore/Reset/Clear)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== note.contentHtml) {
      editorRef.current.innerHTML = note.contentHtml || '';
    }
  }, [note.contentHtml]);

  // Eksekusi formatting rich text standar
  const execCmd = (cmd: string, val: string = '') => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, val);
    onContentChange(editorRef.current.innerHTML);
  };

  // Handler Highlight Merah Muda (Khusus Pasien Belum Dapat Kamar / Inden)
  const handleHighlightRed = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (!document.execCommand('hiliteColor', false, '#fecdd3')) {
      document.execCommand('backColor', false, '#fecdd3');
    }
    onContentChange(editorRef.current.innerHTML);
  };

  // Handler Highlight Kuning (Penting/Perhatian)
  const handleHighlightYellow = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (!document.execCommand('hiliteColor', false, '#fef08a')) {
      document.execCommand('backColor', false, '#fef08a');
    }
    onContentChange(editorRef.current.innerHTML);
  };

  // FITUR BARU: Hapus Stabilo / Clear Highlight pada teks yang diblok/dipilih
  const handleClearHighlight = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    // 1. Eksekusi perintah browser
    document.execCommand('hiliteColor', false, 'transparent');
    document.execCommand('backColor', false, 'transparent');

    // 2. Bersihkan atribut inline style background pada elemen terpilih
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let container: Node | null = range.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
        container = container.parentElement;
      }

      if (container && container instanceof HTMLElement) {
        // Hapus background jika parent memiliki inline style
        let current: HTMLElement | null = container;
        while (current && current !== editorRef.current) {
          if (current.style.backgroundColor) {
            current.style.backgroundColor = '';
          }
          current = current.parentElement;
        }

        // Hapus background span di dalam range
        const styledElements = container.querySelectorAll('[style*="background"]');
        styledElements.forEach((el) => {
          if (range.intersectsNode(el)) {
            (el as HTMLElement).style.backgroundColor = '';
          }
        });
      }
    }

    onContentChange(editorRef.current.innerHTML);
  };

  // FITUR BARU: Format Ulang List Penomoran Otomatis (1, 2, 3...)
  const handleFormatAutoNumberedList = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      document.execCommand('insertOrderedList', false);
      onContentChange(editorRef.current.innerHTML);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    // Jika memilih teks beberapa baris sekaligus, susun ulang jadi ordered list rapi
    if (selectedText.includes('\n') || selectedText.includes('\r')) {
      const lines = selectedText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length > 0) {
        const listHtml = `<ol style="margin-left: 20px; list-style-type: decimal; padding-left: 10px;">${lines
          .map((line) => {
            const cleanLine = line.replace(/^([0-9]+[.)]|[-*•])\s*/, '');
            return `<li>${cleanLine}</li>`;
          })
          .join('')}</ol>`;
        document.execCommand('insertHTML', false, listHtml);
        onContentChange(editorRef.current.innerHTML);
        return;
      }
    }

    document.execCommand('insertOrderedList', false);
    onContentChange(editorRef.current.innerHTML);
  };

  // Handler Insert Gambar via File Picker
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const base64 = loadEvt.target?.result as string;
      if (base64 && editorRef.current) {
        editorRef.current.focus();
        const imgHtml = `<img src="${base64}" alt="Screenshot Terlampir" class="max-w-full rounded-lg shadow-sm border border-slate-300 my-2 block pointer-events-auto" style="max-height: 220px; object-fit: contain;" /><br>`;
        document.execCommand('insertHTML', false, imgHtml);
        onContentChange(editorRef.current.innerHTML);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handler Paste Event (Menangani paste gambar langsung dari clipboard Ctrl + V)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const base64 = evt.target?.result as string;
            if (base64 && editorRef.current) {
              editorRef.current.focus();
              const imgHtml = `<img src="${base64}" alt="Screenshot SPRI / Bed" class="max-w-full rounded-lg shadow-sm border border-slate-300 my-2 block" style="max-height: 220px; object-fit: contain;" /><br>`;
              document.execCommand('insertHTML', false, imgHtml);
              onContentChange(editorRef.current.innerHTML);
            }
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  return (
    <div
      className={`flex flex-col h-[calc(100vh-80px)] min-h-[1000px] rounded-2xl overflow-hidden border ${styles.bodyBorder} shadow-sm hover:shadow-md transition-all duration-200 ${styles.ringColor}`}
      style={{
        minHeight: '1000px',
        height: 'calc(100vh - 80px)'
      }}
    >
      {/* -------------------------------------------------- */}
      {/* 1. HEADER CATATAN TEMPEL (WINDOWS STICKY NOTE BAR) */}
      {/* -------------------------------------------------- */}
      <div
        className={`px-3.5 py-3 ${styles.headerBg} border-b ${styles.headerBorder} flex items-center justify-between select-none shadow-2xs shrink-0`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Windows Grip / Dots Accent */}
          <div className="flex flex-col gap-0.5 opacity-60">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
            </div>
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
            </div>
          </div>

          <div className="overflow-hidden">
            <h3 className={`text-sm font-extrabold tracking-wide ${styles.headerText} truncate uppercase`}>
              {note.title}
            </h3>
            <p className="text-[11px] opacity-75 truncate">{note.subtitle}</p>
          </div>
        </div>

        {/* Tombol Header: Salin WA & Opsi */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onCopy}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              isCopied
                ? 'bg-emerald-600 text-white'
                : `${styles.buttonHover} bg-white/70 ${styles.headerText}`
            }`}
            title="Salin isi catatan ini ke WhatsApp"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
          </button>

          {/* Tombol Tambah Item Baru (+) */}
          <button
            onClick={onAppendPatientTemplate}
            className={`p-1.5 rounded-lg text-xs font-semibold ${styles.buttonHover} bg-white/70 ${styles.headerText} cursor-pointer active:scale-95 transition-all`}
            title="Tambah format entri pasien baru di kolom ini (+)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Tombol Hapus/Kosongkan Kolom Ini Saja */}
          <button
            onClick={() => {
              if (window.confirm(`Kosongkan dan hapus seluruh teks pada ${note.title}?`)) {
                if (editorRef.current) {
                  editorRef.current.innerHTML = '';
                }
                onClearNote();
              }
            }}
            className="p-1.5 rounded-lg text-xs text-rose-700 hover:bg-rose-100 bg-white/70 transition-colors cursor-pointer active:scale-95"
            title="Kosongkan isi catatan kolom ini saja"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* 2. BODY CATATAN (CONTENTEDITABLE RICH TEXT)        */}
      {/* -------------------------------------------------- */}
      <div className={`flex-1 p-3.5 ${styles.bodyBg} flex flex-col relative overflow-hidden min-h-0`}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onContentChange(e.currentTarget.innerHTML)}
          onPaste={handlePaste}
          className="flex-1 w-full text-[13px] font-sans leading-relaxed text-slate-800 focus:outline-hidden overflow-y-auto pb-4 pr-1 scrollbar-thin scrollbar-thumb-slate-300"
          style={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
          data-placeholder="Ketik catatan di sini... (tekan Ctrl+V untuk menempelkan screenshot gambar)"
        />

        {/* Hidden File Input untuk Insert Gambar */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileSelect}
        />
      </div>

      {/* -------------------------------------------------- */}
      {/* 3. TOOLBAR FORMATTING RINGKAS (WINDOWS STYLE)      */}
      {/* -------------------------------------------------- */}
      <div
        className={`px-2 py-1.5 ${styles.toolbarBg} border-t ${styles.toolbarBorder} flex items-center justify-between gap-1 select-none shrink-0 mt-auto`}
      >
        <div className="flex items-center gap-0.5 flex-wrap">
          {/* Bold */}
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className={`p-1.5 rounded-md ${styles.buttonHover} ${styles.headerText} transition-colors cursor-pointer`}
            title="Tebal (Bold) - Ctrl+B"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className={`p-1.5 rounded-md ${styles.buttonHover} ${styles.headerText} transition-colors cursor-pointer`}
            title="Miring (Italic) - Ctrl+I"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className={`p-1.5 rounded-md ${styles.buttonHover} ${styles.headerText} transition-colors cursor-pointer`}
            title="Garis Bawah (Underline) - Ctrl+U"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className={`p-1.5 rounded-md ${styles.buttonHover} ${styles.headerText} transition-colors cursor-pointer`}
            title="Coret (Strikethrough)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300/80 mx-0.5" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className={`p-1.5 rounded-md ${styles.buttonHover} ${styles.headerText} transition-colors cursor-pointer`}
            title="Daftar Poin (Bullet List)"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className={`p-1.5 rounded-md ${styles.buttonHover} ${styles.headerText} transition-colors cursor-pointer`}
            title="Daftar Nomor (Numbered List)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* Format Ulang Penomoran List Otomatis (1, 2, 3...) */}
          <button
            type="button"
            onClick={handleFormatAutoNumberedList}
            className={`p-1.5 rounded-md ${styles.buttonHover} ${styles.headerText} transition-colors cursor-pointer flex items-center gap-0.5`}
            title="Format Ulang Penomoran List (Ubah teks terpilih jadi 1, 2, 3...)"
          >
            <ListPlus className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300/80 mx-0.5" />

          {/* Highlight Merah Muda (Inden / Belum Kamar) */}
          <button
            type="button"
            onClick={handleHighlightRed}
            className="p-1.5 rounded-md hover:bg-rose-200 text-rose-800 transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Stabilo Merah Muda (Pasien Belum Dapat Bed)"
          >
            <Highlighter className="w-3.5 h-3.5 text-rose-600" />
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </button>

          {/* Highlight Kuning (Penting) */}
          <button
            type="button"
            onClick={handleHighlightYellow}
            className="p-1.5 rounded-md hover:bg-amber-200 text-amber-900 transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Stabilo Kuning (Catatan Penting)"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-600" />
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </button>

          {/* FITUR BARU: Hapus Stabilo / Clear Highlight */}
          <button
            type="button"
            onClick={handleClearHighlight}
            className={`p-1.5 rounded-md ${styles.buttonHover} text-slate-700 hover:text-rose-700 transition-colors flex items-center gap-0.5 cursor-pointer`}
            title="Hapus Stabilo / Bersihkan Highlight dari teks yang dipilih"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300/80 mx-0.5" />

          {/* Insert Gambar */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-1.5 rounded-md ${styles.buttonHover} ${styles.headerText} transition-colors flex items-center gap-1 cursor-pointer`}
            title="Sisipkan Gambar / Screenshot (atau paste langsung Ctrl+V)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Info Indikator Update */}
        <div className="text-[10px] opacity-70 shrink-0 text-right pr-1">
          {note.updatedAt}
        </div>
      </div>
    </div>
  );
};
