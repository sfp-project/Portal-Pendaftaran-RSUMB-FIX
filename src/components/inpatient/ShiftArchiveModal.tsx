import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Calendar,
  Clock,
  User,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Share2,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Edit3,
  Save,
  Pencil
} from 'lucide-react';
import { ShiftArchiveItem, ShiftType } from '../../data/shiftArchiveData';
import { htmlToCleanWhatsAppText } from '../../utils/inpatientWaFormat';

interface ShiftArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archives: ShiftArchiveItem[];
  onRestoreArchive: (archive: ShiftArchiveItem) => void;
  onDeleteArchive: (archiveId: string, itemRef?: ShiftArchiveItem) => void;
  onUpdateArchive?: (updatedArchive: ShiftArchiveItem) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ShiftArchiveModal: React.FC<ShiftArchiveModalProps> = ({
  isOpen,
  onClose,
  archives,
  onRestoreArchive,
  onDeleteArchive,
  onUpdateArchive,
  showToast
}) => {
  // State lokal arsip tersimpan agar perubahan hapus & edit langsung me-render ulang modal seketika
  const [localArchives, setLocalArchives] = useState<ShiftArchiveItem[]>(archives);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State untuk mode penyuntingan langsung di modal
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);
  const [draftArchive, setDraftArchive] = useState<ShiftArchiveItem | null>(null);

  // Sinkronkan state lokal bila prop archives diperbarui dari luar
  useEffect(() => {
    setLocalArchives(archives);
  }, [archives]);

  if (!isOpen) return null;

  // Filter logic dari localArchives
  const filteredArchives = localArchives.filter((item) => {
    // 1. Shift filter
    if (selectedShiftFilter !== 'ALL') {
      if (!item.shift.toLowerCase().includes(selectedShiftFilter.toLowerCase())) {
        return false;
      }
    }

    // 2. Date filter
    if (dateFilter) {
      if (item.date !== dateFilter) {
        return false;
      }
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOfficer = item.officerName.toLowerCase().includes(q);
      const matchNotes = item.notesText?.toLowerCase().includes(q);
      const matchDate = item.dateDisplay.toLowerCase().includes(q);
      const matchContent = item.snapshotNotes.some(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.contentHtml.toLowerCase().includes(q)
      );

      if (!matchOfficer && !matchNotes && !matchDate && !matchContent) {
        return false;
      }
    }

    return true;
  });

  // Salin arsip ke format WhatsApp
  const handleCopyArchiveWA = async (item: ShiftArchiveItem) => {
    try {
      const combined = item.snapshotNotes
        .map((n) => htmlToCleanWhatsAppText(n.title, n.contentHtml))
        .join('\n\n====================\n\n');

      const header = `*ARSIP OPERAN SHIFT & INDEN RANAP RSUMB*\nTanggal: ${item.dateDisplay}\nShift: ${item.shift}\nPetugas: ${item.officerName}\nDisimpan: ${item.savedAt}\n${
        item.notesText ? `Catatan: ${item.notesText}\n` : ''
      }\n====================\n\n`;

      const fullText = header + combined;
      await navigator.clipboard.writeText(fullText);
      setCopiedId(item.id);
      showToast(`Rekap arsip (${item.dateDisplay} - ${item.officerName}) berhasil disalin ke WhatsApp!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Gagal menyalin ke clipboard', 'error');
    }
  };

  // Konfirmasi Pulihkan / Muat ke Editor Utama
  const handleConfirmRestore = (e: React.MouseEvent, item: ShiftArchiveItem) => {
    e.stopPropagation();
    // Gunakan versi draft jika pengguna sedang melakukan penyuntingan
    const targetItem = editingArchiveId === item.id && draftArchive ? draftArchive : item;
    const confirmMsg = `Muat arsip operan tanggal ${targetItem.dateDisplay} (${targetItem.shift}) ke 4 Sticky Notes di editor utama?\n\nTeks catatan di layar utama saat ini akan ditimpa dengan data arsip ini.`;
    if (window.confirm(confirmMsg)) {
      onRestoreArchive(targetItem);
      onClose();
    }
  };

  // Konfirmasi Hapus Arsip (Re-render seketika pada UI modal)
  const handleConfirmDelete = (e: React.MouseEvent, item: ShiftArchiveItem, index: number) => {
    e.stopPropagation();
    const confirmMsg = `Apakah Anda yakin ingin menghapus arsip tanggal ${item.dateDisplay} ${item.shift} ini?`;
    if (window.confirm(confirmMsg)) {
      // 1. Hapus langsung dari array lokal agar kartu seketika hilang dari UI modal tanpa reload
      setLocalArchives((prev) =>
        prev.filter((a) => {
          if (item.id && a.id) return a.id !== item.id;
          if (item.timestamp && a.timestamp) return a.timestamp !== item.timestamp;
          return a !== item;
        })
      );

      if (expandedArchiveId === item.id) {
        setExpandedArchiveId(null);
      }
      if (editingArchiveId === item.id) {
        setEditingArchiveId(null);
        setDraftArchive(null);
      }

      // 2. Hapus dari state parent dan localStorage
      onDeleteArchive(item.id, item);
      showToast(`Arsip tanggal ${item.dateDisplay} (${item.shift}) berhasil dihapus.`, 'info');
    }
  };

  // Memulai mode edit langsung pada arsip tertentu
  const handleStartEdit = (item: ShiftArchiveItem) => {
    setExpandedArchiveId(item.id);
    setEditingArchiveId(item.id);
    setDraftArchive(JSON.parse(JSON.stringify(item)));
  };

  // Membatalkan mode edit langsung
  const handleCancelEdit = () => {
    setEditingArchiveId(null);
    setDraftArchive(null);
  };

  // Menyimpan perubahan edit langsung pada arsip
  const handleSaveEdit = () => {
    if (!draftArchive) return;

    // Ambil data terbaru dari DOM jika elemen contentEditable diedit
    const updatedNotes = draftArchive.snapshotNotes.map((sn) => {
      const el = document.getElementById(`edit-archive-${draftArchive.id}-${sn.id}`);
      if (el) {
        return { ...sn, contentHtml: el.innerHTML };
      }
      return sn;
    });

    const finalArchive: ShiftArchiveItem = {
      ...draftArchive,
      snapshotNotes: updatedNotes
    };

    // Perbarui state lokal modal seketika
    setLocalArchives((prev) =>
      prev.map((a) => (a.id === finalArchive.id ? finalArchive : a))
    );

    // Kirim pembaruan ke parent & LocalStorage
    if (onUpdateArchive) {
      onUpdateArchive(finalArchive);
    }

    setEditingArchiveId(null);
    setDraftArchive(null);
    showToast('Perubahan data arsip berhasil disimpan!', 'success');
  };

  // Ekspor Semua Arsip ke File JSON
  const handleExportJSON = () => {
    try {
      const jsonStr = JSON.stringify(localArchives, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RSUMB_Arsip_Operan_Shift_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('File arsip berhasil diunduh dalam format JSON.');
    } catch {
      showToast('Gagal mengunduh file JSON', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-xs">
              <History className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Riwayat &amp; Cari Arsip Operan Shift
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                  {archives.length} Dokumen Tersimpan
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pencarian data serah terima shift pendaftaran &amp; ketersediaan ranap RSU Muhammadiyah Babat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Download backup arsip format JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari pasien, DPJP, dx ICD-10, staf..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-400 text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Shift */}
            <div className="md:col-span-4 flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedShiftFilter('ALL')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  selectedShiftFilter === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setSelectedShiftFilter('Pagi')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  selectedShiftFilter === 'Pagi'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pagi
              </button>
              <button
                onClick={() => setSelectedShiftFilter('Siang')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  selectedShiftFilter === 'Siang'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Siang
              </button>
              <button
                onClick={() => setSelectedShiftFilter('Malam')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  selectedShiftFilter === 'Malam'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Malam
              </button>
            </div>

            {/* Filter Tanggal */}
            <div className="md:col-span-3 flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-400 text-slate-700"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 font-medium whitespace-nowrap cursor-pointer"
                  title="Reset Filter Tanggal"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  showToast(
                    `Pencarian diterapkan: ${filteredArchives.length} arsip ditemukan`,
                    'info'
                  );
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs whitespace-nowrap transition-colors cursor-pointer"
                title="Terapkan pencarian data arsip"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari Data</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Menampilkan <strong>{filteredArchives.length}</strong> dari {archives.length} arsip operan
            </span>
            {(searchQuery || selectedShiftFilter !== 'ALL' || dateFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedShiftFilter('ALL');
                  setDateFilter('');
                }}
                className="text-indigo-600 hover:underline font-medium cursor-pointer"
              >
                Bersihkan Semua Filter
              </button>
            )}
          </div>
        </div>

        {/* List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredArchives.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">
                Tidak ada arsip operan shift yang cocok
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau bersihkan filter tanggal dan shift.
              </p>
            </div>
          ) : (
            filteredArchives.map((item, idx) => {
              const isExpanded = expandedArchiveId === item.id;
              const isCopied = copiedId === item.id;
              const isEditing = editingArchiveId === item.id && draftArchive?.id === item.id;
              const activeItem = isEditing && draftArchive ? draftArchive : item;

              return (
                <div
                  key={item.id || `arch-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* Card Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60 border-b border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tanggal */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-800 rounded-lg text-xs font-bold border border-slate-200 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          {item.dateDisplay}
                        </span>

                        {/* Shift Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                            item.shift.includes('Pagi')
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : item.shift.includes('Siang')
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {item.shift}
                        </span>

                        {/* Petugas Badge */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          Petugas: <strong className="text-slate-900">{item.officerName}</strong>
                        </span>

                        {/* Autosave Indicator */}
                        {(item.savedAt?.includes('Autosave') || item.notesText?.toLowerCase().includes('auto')) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] sm:text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Auto-Saved
                          </span>
                        )}
                      </div>

                      {/* Timestamp Waktu Simpan */}
                      <p className="text-[11px] text-slate-400">
                        Disimpan pada: <span className="font-mono text-slate-600">{item.savedAt}</span>
                      </p>
                    </div>

                    {/* Aksi Tombol Cepat */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Tombol Toggle Preview 4 Kolom */}
                      <button
                        onClick={() =>
                          setExpandedArchiveId(isExpanded ? null : item.id)
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                          isExpanded
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Buka pratinjau lengkap 4 Sticky Notes & catatan"
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Tutup Detail</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>👁️ Lihat Detail</span>
                          </>
                        )}
                      </button>

                      {/* Tombol Salin WA */}
                      <button
                        onClick={() => handleCopyArchiveWA(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs'
                        }`}
                        title="Salin rekap arsip ke format WhatsApp"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Tersalin!' : '📋 Salin WA'}</span>
                      </button>

                      {/* Tombol Pulihkan ke Editor Utama (Warna Oranye Terang) */}
                      <button
                        onClick={(e) => handleConfirmRestore(e, item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer active:scale-98"
                        title="Muat kembali isi arsip ke lembar kerja 4 Sticky Notes saat ini"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>🔄 Muat ke Editor Utama</span>
                      </button>

                      {/* Tombol Hapus (Ikon Tong Sampah Abu-abu) */}
                      <button
                        onClick={(e) => handleConfirmDelete(e, item, idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Hapus arsip ini dari riwayat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Catatan Tambahan (jika tidak sedang edit) */}
                  {!isEditing && (
                    <div className="px-5 py-2.5 bg-amber-50/50 border-b border-amber-100 text-xs text-amber-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden min-w-0">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-bold text-amber-950 shrink-0">Catatan Operan:</span>
                        <span className="truncate text-slate-700">
                          {item.notesText && item.notesText.trim() ? (
                            item.notesText
                          ) : (
                            <em className="text-slate-400">Tidak ada catatan operan khusus</em>
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Sunting catatan operan ini"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{item.notesText ? 'Edit Catatan' : '+ Catatan'}</span>
                      </button>
                    </div>
                  )}

                  {/* Ringkasan Singkat 4 Kolom */}
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {item.snapshotNotes.map((note) => {
                      // Hitung estimasi pasien
                      const contentText = note.contentHtml.replace(/<[^>]*>/g, ' ').trim();
                      const hasText = contentText.length > 0;
                      return (
                        <div
                          key={note.id}
                          className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 text-[11px]">
                              {note.headerCode}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                hasText ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {hasText ? contentText : '(Catatan kosong)'}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded Detail Preview & Editable Direct Section */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-slate-100/90 border-t border-slate-200 animate-fadeIn">
                      {/* Sub-header Pratinjau / Mode Penyuntingan */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-800">
                            {isEditing
                              ? 'Mode Penyuntingan Langsung Dokumen Arsip:'
                              : 'Pratinjau Lengkap 4 Sticky Notes & Catatan Operan:'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isEditing
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isEditing ? 'Mode Edit Aktif' : 'Pratinjau Detail'}
                          </span>
                        </div>

                        {/* Tombol Aksi di Mode Pratinjau / Edit */}
                        <div className="flex items-center flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                                title="Simpan perubahan langsung ke data arsip"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>💾 Simpan Perubahan Arsip</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition-colors"
                                title="Sunting isi catatan atau teks 4 kolom arsip ini secara langsung"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>✏️ Edit Langsung Arsip Ini</span>
                              </button>

                              <button
                                onClick={(e) => handleConfirmRestore(e, item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer active:scale-95 transition-all"
                                title="Muat seluruh catatan ini ke editor Sticky Note utama"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>🔄 Muat ke Editor Utama</span>
                              </button>

                              <button
                                onClick={(e) => handleConfirmDelete(e, item, idx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                                title="Hapus arsip ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Area Form Edit / Pratinjau Catatan Operan Tambahan */}
                      <div className="mb-4 p-3 bg-amber-50/90 rounded-xl border border-amber-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>Catatan Operan Shift:</span>
                          </label>
                          {!isEditing && (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Sunting Catatan</span>
                            </button>
                          )}
                        </div>
                        {isEditing && draftArchive ? (
                          <textarea
                            value={draftArchive.notesText || ''}
                            onChange={(e) =>
                              setDraftArchive({
                                ...draftArchive,
                                notesText: e.target.value
                              })
                            }
                            rows={3}
                            placeholder="Ketik catatan khusus serah terima operan shift..."
                            className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-sans"
                          />
                        ) : (
                          <p className="text-xs text-amber-900 leading-relaxed font-sans whitespace-pre-line">
                            {item.notesText && item.notesText.trim() ? (
                              item.notesText
                            ) : (
                              <em className="text-amber-700/60">Tidak ada catatan operan khusus tersimpan.</em>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Grid 4 Sticky Notes (Tampilan Read-only atau Editable) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {activeItem.snapshotNotes.map((sn) => {
                          let bgHeader = 'bg-blue-100 text-blue-900 border-blue-200';
                          let bgBody = 'bg-blue-50/60 border-blue-200';
                          if (sn.theme === 'green') {
                            bgHeader = 'bg-emerald-100 text-emerald-900 border-emerald-200';
                            bgBody = 'bg-emerald-50/60 border-emerald-200';
                          } else if (sn.theme === 'pink') {
                            bgHeader = 'bg-rose-100 text-rose-900 border-rose-200';
                            bgBody = 'bg-rose-50/60 border-rose-200';
                          } else if (sn.theme === 'cream') {
                            bgHeader = 'bg-amber-100 text-amber-900 border-amber-200';
                            bgBody = 'bg-amber-50/60 border-amber-200';
                          }

                          return (
                            <div
                              key={sn.id}
                              className={`rounded-xl border ${bgBody} overflow-hidden shadow-2xs flex flex-col`}
                            >
                              <div
                                className={`px-3 py-2 border-b font-bold text-xs flex items-center justify-between ${bgHeader}`}
                              >
                                <span>{sn.title}</span>
                                <span className="text-[10px] opacity-75 font-mono">{sn.updatedAt}</span>
                              </div>

                              {isEditing && draftArchive ? (
                                <div
                                  id={`edit-archive-${draftArchive.id}-${sn.id}`}
                                  contentEditable
                                  suppressContentEditableWarning
                                  className="p-3 text-xs text-slate-800 overflow-y-auto max-h-64 leading-relaxed font-sans bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-300 min-h-[140px]"
                                  dangerouslySetInnerHTML={{
                                    __html: sn.contentHtml || ''
                                  }}
                                />
                              ) : (
                                <div
                                  className="p-3 text-xs text-slate-800 overflow-y-auto max-h-60 leading-relaxed font-sans"
                                  dangerouslySetInnerHTML={{
                                    __html: sn.contentHtml || '<em class="text-slate-400">Kosong</em>'
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Tombol Simpan Tambahan di Bawah Saat Mode Edit */}
                      {isEditing && (
                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>💾 Simpan Perubahan Arsip</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-500">
            💡 <em>Tips:</em> Klik <strong>"Muat ke Papan"</strong> untuk langsung melanjutkan operan shift dari arsip tanpa perlu mengetik ulang.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
};
