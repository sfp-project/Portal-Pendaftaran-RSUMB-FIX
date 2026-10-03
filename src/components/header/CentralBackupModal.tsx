import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Database,
  Download,
  Upload,
  CloudUpload,
  RefreshCw,
  History,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Search,
  FileText,
  Clock,
  ShieldAlert,
  ArrowRight,
  HardDrive,
  RotateCcw
} from 'lucide-react';
import {
  downloadFullBackupJson,
  importAndRestoreBackupJson,
  getDailySnapshotMeta,
  restoreDailySnapshot,
  getGlobalRecycleBinItems,
  restoreSoftDeletedItem,
  SoftDeletedItem,
  DailySnapshotMeta
} from '../../services/historyAndBackupService';
import {
  pushLocalDataToDrive,
  getDualSyncState,
  addSyncStateListener,
  DualSyncState
} from '../../services/dualSyncStorage';
import { loadSystemActivityLogs, CATEGORY_META_MAP } from '../../data/auditLogData';
import { SystemActivityLog, ActivityActionCategory } from '../../types/auditLogTypes';
import { loadActiveStaff } from '../../data/headerData';

interface CentralBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}

export const CentralBackupModal: React.FC<CentralBackupModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'audit' | 'recycle'>('backup');

  // Sync state
  const [syncState, setSyncState] = useState<DualSyncState>(getDualSyncState());
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  // Restore file state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmRestoreModal, setConfirmRestoreModal] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isProcessingRestore, setIsProcessingRestore] = useState(false);

  // Daily Snapshot Meta State
  const [dailyMeta, setDailyMeta] = useState<DailySnapshotMeta | null>(getDailySnapshotMeta());
  const [isRestoringDaily, setIsRestoringDaily] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<SystemActivityLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<string>('ALL');

  // Recycle Bin State
  const [recycleBinItems, setRecycleBinItems] = useState<SoftDeletedItem[]>([]);
  const [recycleSearch, setRecycleSearch] = useState('');
  const [isRestoringItem, setIsRestoringItem] = useState<string | null>(null);

  // Subscribe to sync state changes and modal refresh
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = addSyncStateListener((st) => setSyncState(st));
    setDailyMeta(getDailySnapshotMeta());
    setAuditLogs(loadSystemActivityLogs());
    setRecycleBinItems(getGlobalRecycleBinItems());

    const handleDataUpdate = () => {
      setAuditLogs(loadSystemActivityLogs());
      setRecycleBinItems(getGlobalRecycleBinItems());
    };

    window.addEventListener('rsumb_audit_logs_updated', handleDataUpdate);
    window.addEventListener('rsumb_database_updated', handleDataUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('rsumb_audit_logs_updated', handleDataUpdate);
      window.removeEventListener('rsumb_database_updated', handleDataUpdate);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Manual Trigger Drive Sync
  const handleManualDriveSync = async () => {
    try {
      setIsSyncingDrive(true);
      const res = await pushLocalDataToDrive(false);
      if (res.success) {
        showToast('Database SIMRS berhasil disinkronkan langsung ke Google Drive!');
      } else if (res.message) {
        showToast(res.message);
      }
    } catch (err: any) {
      showToast(`Gagal menyinkronkan ke Google Drive: ${err?.message || 'Sesi terputus'}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Handle File Select for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      showToast('Format file tidak valid. Harap pilih berkas backup berformat .json');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setConfirmRestoreModal(true);
    };
    reader.readAsText(file);
  };

  // Execute Restore from JSON
  const handleExecuteRestore = async () => {
    if (!fileContent) return;

    try {
      setIsProcessingRestore(true);
      const res = await importAndRestoreBackupJson(fileContent);
      if (res.success) {
        showToast(res.message);
        setConfirmRestoreModal(false);
        setSelectedFile(null);
        setFileContent(null);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        showToast(`Gagal memulihkan database: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Gagal memulihkan database: ${err?.message || 'Format tidak valid'}`);
    } finally {
      setIsProcessingRestore(false);
    }
  };

  // Restore Daily Auto Snapshot
  const handleExecuteRestoreDaily = async () => {
    if (!confirm('Apakah Anda yakin ingin memulihkan snapshot database harian otomatis? Data yang diedit setelah snapshot akan ditimpa.')) {
      return;
    }

    try {
      setIsRestoringDaily(true);
      const res = await restoreDailySnapshot();
      if (res.success) {
        showToast(res.message);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        showToast(res.message);
      }
    } catch (err: any) {
      showToast(`Gagal memulihkan snapshot harian: ${err?.message}`);
    } finally {
      setIsRestoringDaily(false);
    }
  };

  // Restore Soft-Deleted Item
  const handleRestoreRecycleItem = async (item: SoftDeletedItem) => {
    try {
      setIsRestoringItem(item.id);
      const staff = loadActiveStaff().name || 'Petugas';
      const ok = await restoreSoftDeletedItem(item.collectionKey, item.id, staff);
      if (ok) {
        showToast(`Data "${item.title}" berhasil dipulihkan dari Tempat Sampah!`);
        setRecycleBinItems(getGlobalRecycleBinItems());
      } else {
        showToast('Gagal memulihkan data dari Tempat Sampah.');
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message}`);
    } finally {
      setIsRestoringItem(null);
    }
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const q = auditSearch.toLowerCase().trim();
    const matchCat = auditCategory === 'ALL' || log.category === auditCategory;
    const matchSearch =
      !q ||
      log.details.toLowerCase().includes(q) ||
      log.staffName.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      (log.module || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Filtered Recycle Bin Items
  const filteredRecycleItems = recycleBinItems.filter((item) => {
    const q = recycleSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.moduleName.toLowerCase().includes(q) ||
      (item.deletedBy || '').toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative z-[1000000] w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] sm:max-h-[85vh] my-auto flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 shrink-0 bg-gradient-to-r from-emerald-900 via-[#005d42] to-teal-900 border-b px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-black tracking-wide flex items-center gap-2 flex-wrap truncate">
                <span>Pusat Database & Backup SIMRS</span>
                <span className="text-[10px] font-bold uppercase bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/40 hidden sm:inline-block">
                  Global Persistence
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 font-medium mt-0.5 truncate sm:whitespace-normal">
                Penyimpanan Otomatis, Sinkronisasi Cloud, Riwayat Perubahan, & Restore Data Multi-Modul
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shrink-0"
            title="Tutup Modal"
            aria-label="Tutup Jendela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Bar Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all cursor-pointer border-t border-x ${
              activeTab === 'backup'
                ? 'bg-white text-[#005d42] border-slate-200 border-b-white font-extrabold shadow-2xs -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Operasi Backup & Restore</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all cursor-pointer border-t border-x ${
              activeTab === 'audit'
                ? 'bg-white text-[#005d42] border-slate-200 border-b-white font-extrabold shadow-2xs -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Log Riwayat Perubahan</span>
            <span className="ml-1 text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-extrabold">
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recycle')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all cursor-pointer border-t border-x ${
              activeTab === 'recycle'
                ? 'bg-white text-[#005d42] border-slate-200 border-b-white font-extrabold shadow-2xs -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Tempat Sampah (Soft-Delete)</span>
            {recycleBinItems.length > 0 && (
              <span className="ml-1 text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-extrabold shadow-xs">
                {recycleBinItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {/* TAB 1: OPERASI BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Status Header Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Cloud Sync Status */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Google Sheets Sync
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          syncState.isDriveConnected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            syncState.isDriveConnected ? 'bg-emerald-600 animate-ping' : 'bg-amber-600'
                          }`}
                        />
                        {syncState.isDriveConnected ? 'Terhubung' : 'Mode Lokal'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-semibold mt-2.5">
                      Cloud: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">Google Sheets Web App</code>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Terakhir Sync: {syncState.lastSyncTime ? new Date(syncState.lastSyncTime).toLocaleString('id-ID') : 'Belum pernah'}
                    </p>
                  </div>

                  <button
                    onClick={handleManualDriveSync}
                    disabled={isSyncingDrive || !syncState.isDriveConnected}
                    className="mt-3 w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-[#005d42] border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDrive ? 'Menyinkronkan...' : '📊 Kirim Data ke Sheets'}</span>
                  </button>
                </div>

                {/* Card 2: Daily Auto Snapshot Status */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Snapshot Otomatis Harian
                      </span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                        {dailyMeta?.snapshotDate || 'Aktif'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-semibold mt-2.5">
                      Kunci Koleksi: {dailyMeta?.totalKeys || 0} modul ({dailyMeta?.dataSizeKb || 0} KB)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Disimpan pada: {dailyMeta?.createdAt ? new Date(dailyMeta.createdAt).toLocaleString('id-ID') : 'Otomatis di Browser'}
                    </p>
                  </div>

                  <button
                    onClick={handleExecuteRestoreDaily}
                    disabled={isRestoringDaily || !dailyMeta}
                    className="mt-3 w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRestoringDaily ? 'animate-spin' : ''}`} />
                    <span>Pulihkan Snapshot Harian</span>
                  </button>
                </div>

                {/* Card 3: Storage Engine Info */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Storage Immutability
                      </span>
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                        Versi Audit Aktivated
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-semibold mt-2.5">
                      Prinsip: No Hard Delete (Soft-Delete)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Seluruh pengubahan record menyimpan riwayat revisi (<code className="font-mono text-purple-700">version_history</code>) secara otomatis.
                    </p>
                  </div>

                  <div className="mt-3 p-2 bg-purple-50 rounded-xl border border-purple-100 text-[11px] text-purple-900 font-medium flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Data terdistribusi aman &amp; terlindungi dari kehilangan accidental.</span>
                  </div>
                </div>
              </div>

              {/* 4 Essential Utilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Utility 1: Unduh Full Backup (.json) */}
                <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm hover:shadow-md transition group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#005d42] flex items-center justify-center shrink-0 border border-emerald-200 shadow-inner group-hover:scale-105 transition-transform">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        ⬇️ Unduh Full Backup (.json)
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Ekspor seluruh koleksi modul database (Jadwal Dokter, Khitan, Jasa Raharja, Poster Promo, Surat Kontrol, Catatan Pasien, Jadwal Operasi, &amp; Dokumen) ke dalam berkas JSON berstempel waktu.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Format: RSUMB_SIMRS_Database_YYYY-MM-DD.json
                    </span>
                    <button
                      onClick={downloadFullBackupJson}
                      className="py-2 px-4 bg-gradient-to-r from-emerald-700 to-[#005d42] hover:from-emerald-800 hover:to-[#004a35] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Berkas JSON</span>
                    </button>
                  </div>
                </div>

                {/* Utility 2: Impor & Restore Database */}
                <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm hover:shadow-md transition group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 border border-blue-200 shadow-inner group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        ⬆️ Impor &amp; Restore Database
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Unggah berkas cadangan database <code className="bg-slate-100 px-1 rounded text-blue-800">.json</code> untuk memulihkan seluruh koleksi portal. Dilengkapi dengan konfirmasi konfirmasi sebelum penimpaan.
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Proses aman &amp; langsung mensinkronkan ke cloud
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih Berkas Backup</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOG RIWAYAT PERUBAHAN (AUDIT TRAIL) */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Filter Bar Audit Logs */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Cari aktivitas, nama petugas, atau nama pasien..."
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 font-medium placeholder-slate-400"
                  />
                  {auditSearch && (
                    <button
                      onClick={() => setAuditSearch('')}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Kategori:</span>
                  <select
                    value={auditCategory}
                    onChange={(e) => setAuditCategory(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori ({auditLogs.length})</option>
                    {Object.entries(CATEGORY_META_MAP).map(([catKey, meta]) => (
                      <option key={catKey} value={catKey}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Audit Trail List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {filteredAuditLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">Tidak ada log aktivitas ditemukan</p>
                    <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci atau filter kategori audit.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                    {filteredAuditLogs.map((log) => {
                      const meta = CATEGORY_META_MAP[log.category] || {
                        label: log.category,
                        colorClass: 'text-slate-800',
                        bgClass: 'bg-slate-100',
                        borderClass: 'border-slate-200'
                      };

                      return (
                        <div
                          key={log.id}
                          className="p-4 hover:bg-slate-50/80 transition flex items-start gap-3.5 group"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl ${meta.bgClass} ${meta.colorClass} border ${meta.borderClass} flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.bgClass} ${meta.colorClass} ${meta.borderClass}`}
                              >
                                {meta.label}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {log.actionType}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {log.staffName}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                              {log.details}
                            </p>

                            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {new Date(log.timestamp).toLocaleString('id-ID')}
                              </span>
                              {log.module && <span>Modul: {log.module}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TEMPAT SAMPAH (SOFT-DELETE) */}
          {activeTab === 'recycle' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Portal SIMRS menggunakan sistem <strong>Soft-Delete (Immutability)</strong>. Data yang dihapus dari tampilan aktif disimpan di Tempat Sampah ini dan dapat dipulihkan kembali kapan saja.
                </span>
              </div>

              {/* Recycle Search */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
                <input
                  type="text"
                  value={recycleSearch}
                  onChange={(e) => setRecycleSearch(e.target.value)}
                  placeholder="Cari item terhapus berdasarkan nama, modul, atau petugas..."
                  className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 font-medium placeholder-slate-400"
                />
                {recycleSearch && (
                  <button
                    onClick={() => setRecycleSearch('')}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Recycle List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {filteredRecycleItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <Trash2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">Tempat sampah bersih!</p>
                    <p className="text-xs text-slate-500 mt-1">Tidak ada entri data yang saat ini dihapus (soft-deleted).</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4">Nama / Judul Record</th>
                          <th className="py-3 px-3">Modul Portal</th>
                          <th className="py-3 px-3">Waktu Penghapusan</th>
                          <th className="py-3 px-3 text-center">Aksi Pemulihan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecycleItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {item.title}
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                {item.moduleName}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                              {new Date(item.deletedAt).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleRestoreRecycleItem(item)}
                                disabled={isRestoringItem === item.id}
                                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${isRestoringItem === item.id ? 'animate-spin' : ''}`} />
                                <span>Pulihkan Data</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-10 shrink-0 bg-slate-50 border-t px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Terhubung dengan dualSyncStorage.ts &amp; Google Drive API</span>
          </div>

          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Tutup Pusat Database
          </button>
        </div>
      </div>

      {/* CONFIRMATION RESTORE MODAL */}
      {confirmRestoreModal && (
        <div className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
          <div className="relative z-[100020] bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Konfirmasi Memulihkan Database
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin memulihkan seluruh data SIMRS dari berkas{' '}
                <strong className="text-slate-900">{selectedFile?.name}</strong>?
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-[11px] text-rose-900 font-medium">
              ⚠️ <strong>Penting:</strong> Data lokal saat ini akan digantikan oleh isi berkas backup yang diunggah dan otomatis disinkronkan ke Google Drive.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setConfirmRestoreModal(false);
                  setSelectedFile(null);
                  setFileContent(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleExecuteRestore}
                disabled={isProcessingRestore}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className={`w-4 h-4 ${isProcessingRestore ? 'animate-spin' : ''}`} />
                <span>{isProcessingRestore ? 'Memulihkan...' : 'Ya, Memulihkan Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
