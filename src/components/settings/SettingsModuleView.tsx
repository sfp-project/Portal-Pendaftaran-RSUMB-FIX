import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Users,
  Coins,
  MessageCircle,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  Check,
  Tag,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Info,
  ShieldCheck,
  Send,
  Eye,
  Sliders,
  X,
  Cloud,
  CloudOff,
  FolderSync,
  RefreshCw,
  History
} from 'lucide-react';
import {
  googleSignIn,
  logoutGoogleDrive,
  addAuthListener,
  isGoogleDriveConnected,
  getCachedUser
} from '../../services/googleAuthService';
import {
  getDualSyncState,
  addSyncStateListener,
  pushLocalDataToDrive,
  pullDataFromDrive,
  createDriveBackupSnapshot,
  DualSyncState
} from '../../services/dualSyncStorage';
import { GoogleSignInButton } from '../google/GoogleSignInButton';
import { ActivityLogAuditTrailView } from './ActivityLogAuditTrailView';
import { logSystemActivity } from '../../data/auditLogData';
import {
  PortalSystemSettings,
  SettingsTabId,
  ThermalPrinterSettings,
  ShiftTimeframeConfig,
  MohatFeeSettings,
  WaBroadcastSettings
} from '../../types/settingsTypes';
import {
  loadPortalSettings,
  savePortalSettings,
  DEFAULT_PORTAL_SETTINGS
} from '../../data/settingsData';
import {
  INITIAL_STAFF_LIST,
  loadActiveStaff,
  saveActiveStaff,
  getAutoShiftByTime
} from '../../data/headerData';
import { StaffUser, StaffShiftType } from '../../types/headerTypes';
import { BroadcastTemplatePreset } from '../../types/broadcastTypes';
import { exportToExcel } from '../../utils/exportHelpers';
import { loadKuponList } from '../../data/mohatData';
import { formatRupiahMohat } from '../../data/mohatData';

interface SettingsModuleViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onCloseModal?: () => void;
  isModalView?: boolean;
}

export const SettingsModuleView: React.FC<SettingsModuleViewProps> = ({
  showToast,
  onCloseModal,
  isModalView = false
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTabId>('thermal_printer');

  // Master Settings State
  const [settings, setSettings] = useState<PortalSystemSettings>(() => loadPortalSettings());

  // Staff State
  const [staffList, setStaffList] = useState<StaffUser[]>(INITIAL_STAFF_LIST);
  const [activeStaff, setActiveStaff] = useState<StaffUser>(() => loadActiveStaff());

  // Save notification
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Tab 4: WA Template selection & live preview
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [testPatientName, setTestPatientName] = useState('Ibu Siti Rahmawati');
  const [testDoctorName, setTestDoctorName] = useState('dr. Ilma Alifa, Sp.JP');
  const [testPoliName, setTestPoliName] = useState('Poli Jantung & Pembuluh Darah');

  // Tab 5: Restore & Clear cache state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Tab 5: Google Drive Cloud Sync State
  const [googleUser, setGoogleUser] = useState(() => getCachedUser());
  const [dualSync, setDualSync] = useState<DualSyncState>(() => getDualSyncState());
  const [isDriveOperating, setIsDriveOperating] = useState(false);
  const [showDriveRestoreConfirm, setShowDriveRestoreConfirm] = useState(false);
  const [backupSubTab, setBackupSubTab] = useState<'audit_trail' | 'drive_backup'>('audit_trail');

  // Thermal test print modal/dialog state
  const [showTestPrintModal, setShowTestPrintModal] = useState(false);

  // Listen to external settings changes & Google Auth/Sync changes
  useEffect(() => {
    const handleSync = () => {
      setSettings(loadPortalSettings());
      setActiveStaff(loadActiveStaff());
    };
    window.addEventListener('rsumb_settings_updated', handleSync);

    const unsubAuth = addAuthListener((user) => {
      setGoogleUser(user);
    });

    const unsubSync = addSyncStateListener((state) => {
      setDualSync(state);
    });

    return () => {
      window.removeEventListener('rsumb_settings_updated', handleSync);
      unsubAuth();
      unsubSync();
    };
  }, []);

  // Save handler
  const handleSaveSettings = () => {
    savePortalSettings(settings);
    setHasUnsavedChanges(false);

    try {
      logSystemActivity(
        'Pembaruan Pengaturan Sistem',
        `Pengaturan sistem SIMRS diperbarui (Ukuran printer: ${settings.thermal.paperSize}, Densitas: ${settings.thermal.printDensity}, AutoCut: ${settings.thermal.autoCutPaper ? 'Aktif' : 'Non-aktif'}, Fee BPJS PKM: Rp ${settings.mohatFees.pkmBpjsFeeTotal.toLocaleString('id-ID')}).`,
        activeStaff.name,
        'PENGATURAN_SISTEM',
        'Pengaturan SIMRS'
      );
    } catch (e) {
      console.warn('Notice logging settings change:', e);
    }

    showToast?.('Pengaturan sistem SIMRS berhasil disimpan.', 'success');
  };

  // Reset to Defaults
  const handleResetSettingsToDefault = () => {
    if (window.confirm('Kembalikan semua pengaturan ke nilai default bawaan RSUMB?')) {
      setSettings(DEFAULT_PORTAL_SETTINGS);
      savePortalSettings(DEFAULT_PORTAL_SETTINGS);
      setHasUnsavedChanges(false);

      try {
        logSystemActivity(
          'Reset Pengaturan Sistem',
          'Pengaturan sistem SIMRS dikembalikan ke nilai bawaan awal RSUMB.',
          activeStaff.name,
          'PENGATURAN_SISTEM',
          'Pengaturan SIMRS'
        );
      } catch (e) {
        console.warn('Notice logging settings reset:', e);
      }

      showToast?.('Pengaturan dikembalikan ke nilai awal.', 'info');
    }
  };

  // ==============================================================
  // TAB 1: PRINTER THERMAL HELPERS
  // ==============================================================
  const updateThermal = (partial: Partial<ThermalPrinterSettings>) => {
    setSettings((prev) => ({
      ...prev,
      thermal: { ...prev.thermal, ...partial }
    }));
    setHasUnsavedChanges(true);
  };

  // Test Print Execution
  const handleExecuteTestPrint = () => {
    setShowTestPrintModal(true);
  };

  const handlePrintSampleSlip = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) {
      window.print();
      return;
    }

    const is58 = settings.thermal.paperSize === '58mm';
    const paperWidthPx = is58 ? '210px' : '280px';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Uji Cetak Thermal RSUMB</title>
        <style>
          @page { size: auto; margin: 0; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8px;
            width: ${paperWidthPx};
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="center bold">RSU MUHAMMADIYAH BABAT</div>
        <div class="center" style="font-size:9px;">Jl. Raya Babat - Surabaya No. 127</div>
        <div class="center" style="font-size:9px;">Telp: (0322) 451121</div>
        <div class="divider"></div>
        <div class="center bold">** UJI CETAK THERMAL **</div>
        <div class="divider"></div>
        <div class="row"><span>Waktu:</span><span>${new Date().toLocaleTimeString('id-ID')}</span></div>
        <div class="row"><span>Kertas:</span><span>${settings.thermal.paperSize}</span></div>
        <div class="row"><span>Petugas:</span><span>${activeStaff.name}</span></div>
        <div class="row"><span>Status:</span><span>SIAP PAKAI</span></div>
        <div class="divider"></div>
        <div class="row bold"><span>Penjamin:</span><span>${settings.mohatFees.pasienUmumLabel}</span></div>
        <div class="row bold"><span>Kategori:</span><span>Rujukan PKM</span></div>
        <div class="row"><span>Total Fee:</span><span>Rp 35.000</span></div>
        <div class="divider"></div>
        <div class="center bold" style="font-size:10px;">TEST PRINTER BERHASIL</div>
        <div class="center" style="font-size:9px;margin-top:4px;">Cutter: ${settings.thermal.autoCutPaper ? 'Aktif' : 'Non-aktif'}</div>
        <div style="height: 30px;"></div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // ==============================================================
  // TAB 2: STAFF & SHIFT HELPERS
  // ==============================================================
  const handleSelectActiveStaff = (staff: StaffUser) => {
    setActiveStaff(staff);
    saveActiveStaff(staff);
    showToast?.(`Petugas aktif dialihkan ke ${staff.name} (${staff.role})`, 'success');
  };

  const handleUpdateShiftTime = (
    shiftKey: keyof ShiftTimeframeConfig,
    field: 'start' | 'end',
    val: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      shiftTimes: {
        ...prev.shiftTimes,
        [shiftKey]: {
          ...prev.shiftTimes[shiftKey],
          [field]: val
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  // ==============================================================
  // TAB 3: TARIF & LABELS HELPERS
  // ==============================================================
  const updateMohatFee = (partial: Partial<MohatFeeSettings>) => {
    setSettings((prev) => ({
      ...prev,
      mohatFees: { ...prev.mohatFees, ...partial }
    }));
    setHasUnsavedChanges(true);
  };

  // ==============================================================
  // TAB 4: WA BROADCAST HELPERS
  // ==============================================================
  const updateWaBroadcast = (partial: Partial<WaBroadcastSettings>) => {
    setSettings((prev) => ({
      ...prev,
      waBroadcast: { ...prev.waBroadcast, ...partial }
    }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateSelectedTemplateContent = (newContent: string) => {
    const updated = [...settings.waBroadcast.templates];
    if (updated[selectedTemplateIndex]) {
      updated[selectedTemplateIndex] = {
        ...updated[selectedTemplateIndex],
        content: newContent
      };
      updateWaBroadcast({ templates: updated });
    }
  };

  const handleInsertTag = (tag: string) => {
    const activeTpl = settings.waBroadcast.templates[selectedTemplateIndex];
    if (!activeTpl) return;
    const newContent = activeTpl.content + ' ' + tag;
    handleUpdateSelectedTemplateContent(newContent);
  };

  // ==============================================================
  // TAB 5: BACKUP & DATA HELPERS
  // ==============================================================
  const handleExportFullJson = () => {
    try {
      const rawStorage: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) rawStorage[key] = localStorage.getItem(key) || '';
      }

      const now = new Date();
      const payload = {
        app: 'RSU Muhammadiyah Babat - Portal Pendaftaran & SIMRS',
        exportedAt: now.toISOString(),
        exportedBy: activeStaff.name,
        systemSettings: settings,
        storageSnapshot: rawStorage
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `Backup-RSUMB-Portal-${now.toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast?.('Backup berkas JSON berhasil diunduh.', 'success');
    } catch (e: any) {
      showToast?.(`Gagal mengekspor: ${e?.message}`, 'error');
    }
  };

  const handleExportSummaryExcel = async () => {
    try {
      const kupons = loadKuponList();
      const headers = [
        'No',
        'Nomor Kupon',
        'No Seri',
        'Tanggal',
        'Nama Pasien',
        'Penjamin',
        'Kategori',
        'Perujuk',
        'Sopir',
        'Fee Perujuk',
        'Fee Sopir',
        'Fee Total',
        'Status',
        'Kasir'
      ];

      const data = kupons.map((k, idx) => [
        idx + 1,
        k.nomorKupon,
        k.noSeri || '-',
        k.tanggalMasuk,
        k.namaPasien,
        k.penjamin === 'UMUM' ? settings.mohatFees.pasienUmumLabel : 'BPJS/Asuransi',
        k.kategori,
        k.namaPerujuk,
        k.namaSopir || '-',
        k.feePerujuk,
        k.feeSopir,
        k.feeTotal,
        k.status,
        k.petugasKasir
      ]);

      await exportToExcel({
        filename: `Rekap-Portal-RSUMB-${new Date().toISOString().slice(0, 10)}`,
        title: 'Rekapitulasi Pelayanan & Kupon Fee Mohat RSUMB',
        sheetName: 'Data Pelayanan',
        headers,
        data
      });
      showToast?.('Data berhasil diekspor ke format Excel (.XLSX).', 'success');
    } catch (e: any) {
      showToast?.(`Gagal mengekspor Excel: ${e?.message}`, 'error');
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        setIsRestoring(true);
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.storageSnapshot && !parsed.payload && !parsed.schedules) {
          throw new Error('Berkas tidak dikenali sebagai format cadangan SIMRS RSUMB.');
        }

        if (parsed.storageSnapshot) {
          Object.entries(parsed.storageSnapshot).forEach(([k, v]) => {
            if (typeof v === 'string') localStorage.setItem(k, v);
          });
        }

        showToast?.('Data berhasil dipulihkan! Memuat ulang konfigurasi...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (err: any) {
        alert(`Gagal memulihkan data: ${err?.message || 'Format tidak valid'}`);
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = () => {
    localStorage.clear();
    showToast?.('Cache dan data lokal telah dibersihkan.', 'info');
    setShowClearConfirm(false);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Google Drive Action Handlers
  const handleGoogleLogin = async () => {
    setIsDriveOperating(true);
    try {
      const res = await googleSignIn();
      if (res) {
        showToast?.('Berhasil login Google Drive. Memulai sinkronisasi cloud...', 'success');
        try {
          const pullRes = await pullDataFromDrive();
          if (pullRes.restoredKeys > 0) {
            showToast?.(`Tersinkron: ${pullRes.restoredKeys} data dipulihkan dari Google Drive.`, 'success');
          } else {
            await pushLocalDataToDrive(true);
          }
        } catch {
          await pushLocalDataToDrive(true);
        }
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast?.(`Gagal menghubungkan Google: ${err?.message || 'Akses ditolak'}`, 'error');
      }
    } finally {
      setIsDriveOperating(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogleDrive();
    showToast?.('Koneksi Google Drive diputuskan.', 'info');
  };

  const handleManualPushDrive = async () => {
    setIsDriveOperating(true);
    try {
      const res = await pushLocalDataToDrive(false);
      showToast?.('Database berhasil disinkronkan ke Google Drive (/RSUMB_Portal_Data/rsumb_database.json).', 'success');
    } catch (err: any) {
      showToast?.(`Gagal sinkron: ${err?.message}`, 'error');
    } finally {
      setIsDriveOperating(false);
    }
  };

  const handleConfirmRestoreFromDrive = async () => {
    setIsDriveOperating(true);
    try {
      const res = await pullDataFromDrive();
      setShowDriveRestoreConfirm(false);
      showToast?.(`Sukses! ${res.restoredKeys} data dipulihkan dari Google Drive. Memuat ulang...`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: any) {
      showToast?.(`Gagal memulihkan: ${err?.message}`, 'error');
    } finally {
      setIsDriveOperating(false);
    }
  };

  const handleSnapshotBackupToDrive = async () => {
    setIsDriveOperating(true);
    try {
      const res = await createDriveBackupSnapshot();
      showToast?.(`Snapshot cadangan "${res.fileName}" berhasil disimpan di Google Drive (/RSUMB_Portal_Backups/).`, 'success');
    } catch (err: any) {
      showToast?.(`Gagal membuat snapshot backup: ${err?.message}`, 'error');
    } finally {
      setIsDriveOperating(false);
    }
  };

  // Nav Tabs Config
  const tabs = [
    { id: 'thermal_printer' as SettingsTabId, label: 'Printer Thermal', icon: Printer },
    { id: 'staff_shift' as SettingsTabId, label: 'Manajemen Staf & Shift', icon: Users },
    { id: 'fees_labels' as SettingsTabId, label: 'Tarif Fee & Labels', icon: Coins },
    { id: 'wa_broadcast' as SettingsTabId, label: 'WA Broadcast', icon: MessageCircle },
    { id: 'backup_data' as SettingsTabId, label: 'Data, Backup & Audit Trail', icon: Database }
  ];

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${isModalView ? 'max-h-[85vh]' : 'w-full'}`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-[#005d42] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Sliders className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg leading-tight">
              Pusat Pengaturan Portal SIMRS RSUMB
            </h2>
            <p className="text-xs text-emerald-200/90">
              Konfigurasi perangkat keras printer, jadwal shift dinas, tarif fee, WhatsApp, dan cadangan data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveSettings}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition animate-pulse cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          )}

          {isModalView && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition cursor-pointer"
              aria-label="Tutup Pengaturan"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 pt-3 flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer border-t border-l border-r ${
                isActive
                  ? 'bg-white text-[#005d42] border-slate-200 shadow-xs -mb-[1px] relative z-10'
                  : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#005d42]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: PRINTER THERMAL */}
        {/* ============================================================== */}
        {activeTab === 'thermal_printer' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Printer className="w-5 h-5 text-[#005d42] mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Konfigurasi Mesin Printer Thermal Struk POS</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Menyesuaikan lebar media struk kasir, pemotong kertas otomatis (*auto cutter*), dan uji cetak slip tanda terima fee.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExecuteTestPrint}
                className="bg-[#005d42] hover:bg-[#004732] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-200" />
                <span>Uji Cetak (Test Print)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Ukuran Kertas */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Opsi Ukuran Kertas Thermal Struk
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateThermal({ paperSize: '58mm' })}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      settings.thermal.paperSize === '58mm'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-[#005d42] font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block text-sm font-black">58 mm</span>
                    <span className="text-[11px] text-slate-500">Struk Standar Mini POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateThermal({ paperSize: '80mm' })}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      settings.thermal.paperSize === '80mm'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-[#005d42] font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block text-sm font-black">80 mm</span>
                    <span className="text-[11px] text-slate-500">Struk Lebar Kasir RS (Rekomendasi)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Format 80mm memberikan ruang yang luas untuk nama perujuk, nomor seri kupon, dan tanda tangan kasir.
                </p>
              </div>

              {/* Cetak Otomatis Switch */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Otomasi Cetak Struk
                </label>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Cetak Otomatis Struk Kupon setelah Simpan Data
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Langsung membuka dialog cetak saat petugas menekan tombol simpan kupon
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.thermal.autoPrintAfterSave}
                    onChange={(e) => updateThermal({ autoPrintAfterSave: e.target.checked })}
                    className="w-5 h-5 accent-[#005d42] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Pemotong Otomatis (*Auto Paper Cut*)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Kirim perintah ESC/POS GS V 0 untuk memotong kertas otomatis
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.thermal.autoCutPaper}
                    onChange={(e) => updateThermal({ autoCutPaper: e.target.checked })}
                    className="w-5 h-5 accent-[#005d42] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Nama Printer & Densitas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Printer Target (Untuk Referensi Staf)
                </label>
                <input
                  type="text"
                  value={settings.thermal.printerName}
                  onChange={(e) => updateThermal({ printerName: e.target.value })}
                  placeholder="Contoh: Epson TM-T82 / Panda POS-80"
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Densitas Ketebalan Cetak Huruf
                </label>
                <select
                  value={settings.thermal.printDensity}
                  onChange={(e) => updateThermal({ printDensity: e.target.value as any })}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 cursor-pointer"
                >
                  <option value="Normal">Normal (Standar Pita/Head)</option>
                  <option value="Pekat (Dark)">Pekat (Dark) - Huruf Lebih Jelas</option>
                  <option value="Tinggi (High)">Tinggi (High) - Kontras Maksimal</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MANAJEMEN STAF & SHIFT */}
        {/* ============================================================== */}
        {activeTab === 'staff_shift' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Staff Card Active Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-slate-50 to-emerald-50/50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={activeStaff.avatarUrl}
                  alt={activeStaff.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-[#005d42]/30 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">{activeStaff.name}</h4>
                    <span className="text-[11px] font-bold bg-[#005d42] text-white px-2 py-0.5 rounded-full">
                      Akun Aktif Sekarang
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{activeStaff.role} • {activeStaff.shift}</p>
                </div>
              </div>

              <div className="text-xs text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#005d42]" />
                <span>Shift Otomatis Jam Ini: <b>{getAutoShiftByTime()}</b></span>
              </div>
            </div>

            {/* List 8 Petugas Resmi */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#005d42]" />
                  <span>Daftar 8 Staf Admin Pendaftaran Resmi RSUMB</span>
                </h4>
                <span className="text-xs text-slate-500">Klik "Jadikan Aktif" untuk mengganti profil</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {staffList.map((st) => {
                  const isActive = st.name.toUpperCase() === activeStaff.name.toUpperCase();
                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isActive
                          ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={st.avatarUrl}
                          alt={st.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {st.name.toUpperCase()}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{st.role}</p>
                          <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded mt-0.5">
                            {st.shift}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectActiveStaff(st)}
                        disabled={isActive}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-200/80 text-emerald-900 cursor-default'
                            : 'bg-white hover:bg-emerald-50 text-[#005d42] border border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#005d42]" />
                            <span>Sedang Digunakan</span>
                          </>
                        ) : (
                          <span>Jadikan Aktif -&gt;</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Konfigurasi Jam Dinas Shift */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#005d42]" />
                <span>Konfigurasi Default Rentang Jam Kerja Shift</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pagi */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Shift Pagi
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="time"
                      value={settings.shiftTimes.shiftPagi.start}
                      onChange={(e) => handleUpdateShiftTime('shiftPagi', 'start', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs w-full"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={settings.shiftTimes.shiftPagi.end}
                      onChange={(e) => handleUpdateShiftTime('shiftPagi', 'end', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs w-full"
                    />
                  </div>
                </div>

                {/* Siang */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      Shift Siang
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="time"
                      value={settings.shiftTimes.shiftSiang.start}
                      onChange={(e) => handleUpdateShiftTime('shiftSiang', 'start', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs w-full"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={settings.shiftTimes.shiftSiang.end}
                      onChange={(e) => handleUpdateShiftTime('shiftSiang', 'end', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs w-full"
                    />
                  </div>
                </div>

                {/* Malam */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                      Shift Malam
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="time"
                      value={settings.shiftTimes.shiftMalam.start}
                      onChange={(e) => handleUpdateShiftTime('shiftMalam', 'start', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs w-full"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={settings.shiftTimes.shiftMalam.end}
                      onChange={(e) => handleUpdateShiftTime('shiftMalam', 'end', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: TARIF FEE & LABELS */}
        {/* ============================================================== */}
        {activeTab === 'fees_labels' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Penjamin Labeling Section */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#005d42]" />
                    <span>Global Penjamin Labeling (Pasien UMUM)</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Memetakan dan mengganti istilah lama "Pasien Murni Umum" menjadi teks bersih <b>"{settings.mohatFees.pasienUmumLabel}"</b> di seluruh modul kupon, cetak struk thermal, dan laporan.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                  <span className="text-xs font-bold text-emerald-800">{settings.mohatFees.pasienUmumLabel}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#005d42]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Label Penjamin Pasien UMUM
                  </label>
                  <input
                    type="text"
                    value={settings.mohatFees.pasienUmumLabel}
                    onChange={(e) => updateMohatFee({ pasienUmumLabel: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="autoMapMurni"
                    checked={settings.mohatFees.autoMapMurniUmum}
                    onChange={(e) => updateMohatFee({ autoMapMurniUmum: e.target.checked })}
                    className="w-5 h-5 accent-[#005d42] rounded cursor-pointer"
                  />
                  <label htmlFor="autoMapMurni" className="text-xs text-slate-700 cursor-pointer">
                    <b>Otomatis Map Kata:</b> Ganti otomatis jika ada data lama bernilai "Pasien Murni Umum".
                  </label>
                </div>
              </div>
            </div>

            {/* Konfigurasi Nominal Tarif Fee */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#005d42]" />
                <span>Standar Nominal Tarif Fee Perujuk & Mohat Desa</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Mohat Desa */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      1. Mohat Desa / Mobil Sehat
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Tarif flat untuk semua jenis penjamin pasien</p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Total Fee Sopir Mohat (Rp)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={settings.mohatFees.desaMohatFee}
                      onChange={(e) => updateMohatFee({ desaMohatFee: Number(e.target.value) || 0 })}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30"
                    />
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg text-right font-mono font-bold text-xs text-[#005d42]">
                    Total: {formatRupiahMohat(settings.mohatFees.desaMohatFee)}
                  </div>
                </div>

                {/* 2. PKM BPJS / JR */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      2. PKM - Pasien BPJS / JR
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Pasien rujukan berpenjamin BPJS / Jasa Raharja</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        Perujuk/Bidan
                      </label>
                      <input
                        type="number"
                        step={1000}
                        value={settings.mohatFees.pkmBpjsFeePerujuk}
                        onChange={(e) => {
                          const perujuk = Number(e.target.value) || 0;
                          updateMohatFee({
                            pkmBpjsFeePerujuk: perujuk,
                            pkmBpjsFeeTotal: perujuk + settings.mohatFees.pkmBpjsFeeSopir
                          });
                        }}
                        className="w-full text-xs font-bold px-2 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        Sopir Ambulans
                      </label>
                      <input
                        type="number"
                        step={1000}
                        value={settings.mohatFees.pkmBpjsFeeSopir}
                        onChange={(e) => {
                          const sopir = Number(e.target.value) || 0;
                          updateMohatFee({
                            pkmBpjsFeeSopir: sopir,
                            pkmBpjsFeeTotal: settings.mohatFees.pkmBpjsFeePerujuk + sopir
                          });
                        }}
                        className="w-full text-xs font-bold px-2 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg text-right font-mono font-bold text-xs text-[#005d42]">
                    Total: {formatRupiahMohat(settings.mohatFees.pkmBpjsFeeTotal)}
                  </div>
                </div>

                {/* 3. PKM UMUM */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      3. PKM - {settings.mohatFees.pasienUmumLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Pasien rujukan umum bayar mandiri (non-asuransi)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        Perujuk/Bidan
                      </label>
                      <input
                        type="number"
                        step={1000}
                        value={settings.mohatFees.pkmUmumFeePerujuk}
                        onChange={(e) => {
                          const perujuk = Number(e.target.value) || 0;
                          updateMohatFee({
                            pkmUmumFeePerujuk: perujuk,
                            pkmUmumFeeTotal: perujuk + settings.mohatFees.pkmUmumFeeSopir
                          });
                        }}
                        className="w-full text-xs font-bold px-2 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        Sopir Ambulans
                      </label>
                      <input
                        type="number"
                        step={1000}
                        value={settings.mohatFees.pkmUmumFeeSopir}
                        onChange={(e) => {
                          const sopir = Number(e.target.value) || 0;
                          updateMohatFee({
                            pkmUmumFeeSopir: sopir,
                            pkmUmumFeeTotal: settings.mohatFees.pkmUmumFeePerujuk + sopir
                          });
                        }}
                        className="w-full text-xs font-bold px-2 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg text-right font-mono font-bold text-xs text-[#005d42]">
                    Total: {formatRupiahMohat(settings.mohatFees.pkmUmumFeeTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: WA BROADCAST */}
        {/* ============================================================== */}
        {activeTab === 'wa_broadcast' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Gateway Sender Number Configuration */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Gateway Pengirim WhatsApp RSUMB
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.waBroadcast.gatewaySenderNumber}
                    onChange={(e) => updateWaBroadcast({ gatewaySenderNumber: e.target.value })}
                    placeholder="Contoh: 6281234567890"
                    className="w-full text-xs font-mono font-semibold px-3 py-2.5 rounded-xl border border-slate-200 pl-9 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30"
                  />
                  <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Gunakan format internasional (diawali dengan 62).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identitas Pengirim / Footer Pesan
                </label>
                <input
                  type="text"
                  value={settings.waBroadcast.senderName}
                  onChange={(e) => updateWaBroadcast({ senderName: e.target.value })}
                  placeholder="Contoh: Humas & Admisi RSUMB"
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Akan disematkan otomatis pada bagian bawah pesan broadcast.
                </p>
              </div>
            </div>

            {/* Template Editor with Live Bubble Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Template Selection & Textarea */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pilih Template Pesan Notifikasi Pasien
                  </label>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {settings.waBroadcast.templates.map((tpl, idx) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        selectedTemplateIndex === idx
                          ? 'bg-[#005d42] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>

                {/* Variable insertion buttons */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 mr-2">Sisipkan Variabel:</span>
                  <div className="inline-flex flex-wrap gap-1 mt-1">
                    {['{nama_pasien}', '{poliklinik}', '{nama_dokter}', '{tanggal}', '{jam}'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertTag(v)}
                        className="text-[11px] font-mono bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                {settings.waBroadcast.templates[selectedTemplateIndex] && (
                  <div>
                    <textarea
                      rows={9}
                      value={settings.waBroadcast.templates[selectedTemplateIndex].content}
                      onChange={(e) => handleUpdateSelectedTemplateContent(e.target.value)}
                      className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Live WhatsApp Bubble Preview */}
              <div className="lg:col-span-5 bg-[#e5ddd5] rounded-2xl p-4 border border-[#d1c7be] flex flex-col justify-between shadow-inner">
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-black/10 text-xs font-bold text-slate-700">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>Pratinjau Tampilan Pesan WhatsApp Pasien</span>
                  </div>

                  {/* Chat Bubble */}
                  <div className="bg-white rounded-xl rounded-tl-none p-3.5 shadow-sm text-xs text-slate-800 space-y-2 whitespace-pre-wrap font-sans">
                    {settings.waBroadcast.templates[selectedTemplateIndex]?.content
                      .replace(/{nama_pasien}/g, testPatientName)
                      .replace(/{poliklinik}/g, testPoliName)
                      .replace(/{nama_dokter}/g, testDoctorName)
                      .replace(/{tanggal}/g, new Date().toLocaleDateString('id-ID'))
                      .replace(/{jam}/g, '09:00 WIB')}
                    <div className="text-right text-[10px] text-slate-400 font-mono mt-1">
                      {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-black/10 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Penerima Uji: <b>{testPatientName}</b></span>
                  <span className="text-emerald-700 font-bold">WhatsApp Resmi</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: DATA, BACKUP & AUDIT TRAIL SISTEM */}
        {/* ============================================================== */}
        {activeTab === 'backup_data' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* SUB-SECTION SELECTOR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBackupSubTab('audit_trail')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    backupSubTab === 'audit_trail'
                      ? 'bg-[#005d42] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Activity Log & Audit Trail (1-3 Bulan)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    backupSubTab === 'audit_trail'
                      ? 'bg-emerald-400/25 text-emerald-100 border-emerald-400/30'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    RFC3339
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackupSubTab('drive_backup')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    backupSubTab === 'drive_backup'
                      ? 'bg-[#005d42] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                  <span>Pencadangan & Cloud Drive</span>
                  {googleUser && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium px-2 flex items-center gap-1.5">
                <span>Database Utama:</span>
                <span className="font-mono font-bold text-[#005d42] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  rsumb_database.json
                </span>
              </div>
            </div>

            {backupSubTab === 'audit_trail' ? (
              <ActivityLogAuditTrailView showToast={showToast} />
            ) : (
              <div className="space-y-6">
                {/* GOOGLE DRIVE DUAL-SYNC CLOUD STORAGE ENGINE */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-[#005d42] to-emerald-950 text-white shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 text-emerald-300 shrink-0">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                      <span>Integrasi Google Drive Cloud & Dual-Sync Engine</span>
                      {googleUser ? (
                        <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                          <span>Terhubung</span>
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Belum Terhubung
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-emerald-100/80 mt-0.5">
                      Penyimpanan database cloud permanen untuk mencegah kehilangan data kupon, catatan handover, staf, dan poster saat pembaruan aplikasi.
                    </p>
                  </div>
                </div>

                {!googleUser ? (
                  <GoogleSignInButton
                    onClick={handleGoogleLogin}
                    isLoading={isDriveOperating}
                    text="Hubungkan Google Drive"
                    className="shrink-0"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    className="text-xs text-emerald-200 hover:text-white underline decoration-emerald-400/60 self-start sm:self-auto cursor-pointer"
                  >
                    Putuskan Akun
                  </button>
                )}
              </div>

              {googleUser ? (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  {/* Account & Target Folders info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-300 block">Akun Google Drive</span>
                      <p className="font-semibold text-white truncate mt-0.5">{googleUser.displayName || 'Akun SIMRS'}</p>
                      <p className="text-[11px] text-emerald-200/80 truncate">{googleUser.email}</p>
                    </div>

                    <div className="p-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-300 block">Folder Database Utama</span>
                      <p className="font-mono font-bold text-white mt-0.5">/RSUMB_Portal_Data/</p>
                      <p className="text-[11px] text-emerald-200/80">File: rsumb_database.json</p>
                    </div>

                    <div className="p-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-300 block">Folder Berkas & Cadangan</span>
                      <p className="font-mono text-white mt-0.5">/RSUMB_Portal_Files/</p>
                      <p className="text-[11px] text-emerald-200/80 font-mono">/RSUMB_Portal_Backups/</p>
                    </div>
                  </div>

                  {/* Sync Status Banner */}
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-4 h-4 text-emerald-300 ${isDriveOperating || dualSync.status === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>
                        Status Dual-Sync:{' '}
                        <b className="text-white">
                          {isDriveOperating || dualSync.status === 'syncing'
                            ? 'Sedang Memproses Sinkronisasi...'
                            : dualSync.status === 'synced'
                            ? 'Tersinkronisasi Otomatis'
                            : 'Siap Disinkronkan'}
                        </b>
                      </span>
                    </div>

                    {dualSync.lastSyncTime && (
                      <span className="text-[11px] text-emerald-200 font-mono">
                        Sinkron Terakhir: {new Date(dualSync.lastSyncTime).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  {/* Cloud Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleManualPushDrive}
                      disabled={isDriveOperating}
                      className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
                      title="Kirim dan simpan data lokal saat ini ke Google Drive (rsumb_database.json)"
                    >
                      <RefreshCw className={`w-4 h-4 ${isDriveOperating ? 'animate-spin' : ''}`} />
                      <span>Sync Manual ke Google Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDriveRestoreConfirm(true)}
                      disabled={isDriveOperating}
                      className="py-2.5 px-3.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-white/20 transition cursor-pointer disabled:opacity-60"
                      title="Tarik data terbaru dari Google Drive dan pulihkan ke browser ini"
                    >
                      <Database className="w-4 h-4 text-emerald-300" />
                      <span>Pulihkan dari Google Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSnapshotBackupToDrive}
                      disabled={isDriveOperating}
                      className="py-2.5 px-3.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-white/20 transition cursor-pointer disabled:opacity-60"
                      title="Buat berkas cadangan snapshot tanggal hari ini di folder /RSUMB_Portal_Backups/"
                    >
                      <FolderSync className="w-4 h-4 text-amber-300" />
                      <span>Simpan Snapshot ke Drive</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-white/10 rounded-xl border border-white/10 text-xs text-emerald-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>
                      Hubungkan akun Google RSUMB satu kali untuk mengaktifkan sinkronisasi otomatis ke folder <b>/RSUMB_Portal_Data/</b> dan penyimpanan berkas poster di <b>/RSUMB_Portal_Files/</b>.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Download Backup Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-slate-50 to-white border border-emerald-200/90 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#005d42] text-white rounded-xl shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <span>Pencadangan Data Lokal Portal (Anti Data Hilang)</span>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Disarankan
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Unduh snapshot data portal secara berkala. Berkas JSON ini dapat dipulihkan kapan saja saat membuka peramban baru atau setelah pembersihan cache browser.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportFullJson}
                  className="flex-1 py-3 px-4 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-emerald-200" />
                  <span>Unduh Backup Data Lokal (.JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSummaryExcel}
                  className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor Rekap Pelayanan (.XLSX)</span>
                </button>

                <label
                  htmlFor="restore-file-input"
                  className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                  title="Pulihkan data dari berkas JSON sebelumnya"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Pulihkan Data</span>
                  <input
                    ref={fileInputRef}
                    id="restore-file-input"
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleRestoreFile}
                    disabled={isRestoring}
                  />
                </label>
              </div>
            </div>

            {/* Clear Cache / Danger Zone */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Bersihkan Cache & Reset Data Lokal</span>
                </h5>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Menghapus cache sesi peramban dan mengembalikan seluruh pengaturan ke pengaturan bawaan awal RSUMB.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                Clear Cache & Reset
              </button>
            </div>
          </div>
        )}
      </div>
    )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={handleResetSettingsToDefault}
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kembalikan Pengaturan Bawaan</span>
        </button>

        <div className="flex items-center gap-2">
          {isModalView && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition cursor-pointer"
            >
              Tutup
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2 bg-[#005d42] hover:bg-[#004732] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-200" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Live Uji Cetak Slip Preview */}
      {showTestPrintModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          <div className="fixed inset-0" onClick={() => setShowTestPrintModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 to-[#005d42] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-200" />
                <h4 className="font-bold text-xs sm:text-sm">Uji Cetak Struk Thermal ({settings.thermal.paperSize})</h4>
              </div>
              <button
                onClick={() => setShowTestPrintModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slip Paper Preview */}
            <div className="p-4 bg-slate-100 flex justify-center">
              <div
                className="bg-white p-4 shadow-md font-mono text-[11px] text-black border border-slate-300"
                style={{ width: settings.thermal.paperSize === '58mm' ? '210px' : '260px' }}
              >
                <div className="text-center font-bold">RSU MUHAMMADIYAH BABAT</div>
                <div className="text-center text-[9px] text-slate-600">Jl. Raya Babat - Surabaya No. 127</div>
                <div className="border-t border-dashed border-black my-2" />
                <div className="text-center font-bold text-[10px]">** UJI CETAK THERMAL **</div>
                <div className="border-t border-dashed border-black my-2" />
                <div className="flex justify-between"><span>Waktu:</span><span>{new Date().toLocaleTimeString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Kertas:</span><span>{settings.thermal.paperSize}</span></div>
                <div className="flex justify-between"><span>Petugas:</span><span>{activeStaff.name}</span></div>
                <div className="border-t border-dashed border-black my-2" />
                <div className="flex justify-between font-bold">
                  <span>Penjamin:</span>
                  <span>{settings.mohatFees.pasienUmumLabel}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kategori:</span>
                  <span>Rujukan PKM</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Fee:</span>
                  <span>Rp 35.000</span>
                </div>
                <div className="border-t border-dashed border-black my-2" />
                <div className="text-center font-bold text-[10px]">TEST PRINTER BERHASIL</div>
                <div className="text-center text-[9px] mt-1 text-slate-600">Cutter: {settings.thermal.autoCutPaper ? 'Aktif' : 'Non-aktif'}</div>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setShowTestPrintModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintSampleSlip}
                className="flex-1 py-2 rounded-xl bg-[#005d42] hover:bg-[#004732] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Kirim ke Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Konfirmasi Pembersihan Cache */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          <div className="fixed inset-0" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10 p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Konfirmasi Bersihkan Cache & Reset?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini akan menghapus data penyimpanan lokal browser dan mengembalikan ke data awal bawaan RSUMB. Disarankan mengunduh backup JSON terlebih dahulu.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Ya, Bersihkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Pemulihan Database dari Google Drive */}
      {showDriveRestoreConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          <div className="fixed inset-0" onClick={() => setShowDriveRestoreConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10 p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#005d42] flex items-center justify-center mx-auto">
              <Cloud className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Pulihkan Database dari Google Drive?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Sistem akan mengunduh berkas <b>rsumb_database.json</b> dari folder <b>/RSUMB_Portal_Data/</b> di Google Drive dan memperbarui data lokal komputer ini (kupon fee mohat, catatan handover, poster, dan pengaturan).
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Data lokal yang belum disinkronkan ke Google Drive akan digantikan oleh snapshot database dari cloud.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDriveRestoreConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreFromDrive}
                disabled={isDriveOperating}
                className="flex-1 py-2.5 rounded-xl bg-[#005d42] hover:bg-[#004732] text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDriveOperating ? 'animate-spin' : ''}`} />
                <span>{isDriveOperating ? 'Memulihkan...' : 'Ya, Pulihkan Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
