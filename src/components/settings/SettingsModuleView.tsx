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
  History,
  Code,
  Copy
} from 'lucide-react';
import {
  getDualSyncState,
  addSyncStateListener,
  pushDatabaseToSheets,
  pullDatabaseFromSheets,
  createDriveBackupSnapshot,
  DualSyncState
} from '../../services/dualSyncStorage';
import {
  getGasWebAppUrl,
  setGasWebAppUrl,
  isGasConnected,
  testGasConnection,
  getGasScriptTemplate
} from '../../services/googleSheetsGasService';
import { GoogleDriveAuthModal } from '../google/GoogleDriveAuthModal';
import { GoogleSheetsLogo } from '../google/GoogleDriveSyncBadge';
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
  DEFAULT_PORTAL_SETTINGS,
  saveHospitalLogo,
  resetHospitalLogo,
  DEFAULT_HOSPITAL_LOGO,
  getEffectiveHospitalLogo
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
import {
  getStoredAdminPin,
  setStoredAdminPin,
  requestAdminAction
} from '../../services/adminAuthService';

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

  // Tab 5: Google Sheets Cloud Sync State
  const [dualSync, setDualSync] = useState<DualSyncState>(() => getDualSyncState());
  const [isDriveOperating, setIsDriveOperating] = useState(false);
  const [showDriveRestoreConfirm, setShowDriveRestoreConfirm] = useState(false);
  const [showDriveAuthModal, setShowDriveAuthModal] = useState(false);
  const [backupSubTab, setBackupSubTab] = useState<'audit_trail' | 'drive_backup'>('audit_trail');

  // Thermal test print modal/dialog state
  const [showTestPrintModal, setShowTestPrintModal] = useState(false);

  // Admin PIN Configuration State
  const [adminPinInput, setAdminPinInput] = useState(() => getStoredAdminPin());
  const [hospitalLogo, setHospitalLogo] = useState<string>(() => settings.hospitalLogo || getEffectiveHospitalLogo());

  const handleUpdateAdminPin = () => {
    requestAdminAction(() => {
      if (!adminPinInput || adminPinInput.trim().length < 4) {
        showToast?.('PIN Admin minimal harus 4 digit angka/karakter.', 'error');
        return;
      }
      const ok = setStoredAdminPin(adminPinInput.trim(), activeStaff.name);
      if (ok) {
        showToast?.('PIN Otorisasi Admin berhasil diperbarui!', 'success');
      } else {
        showToast?.('Gagal memperbarui PIN Admin.', 'error');
      }
    }, 'Ubah PIN Admin');
  };

  // Listen to external settings changes & Google Sheets Sync changes
  useEffect(() => {
    const handleSync = () => {
      setSettings(loadPortalSettings());
      setActiveStaff(loadActiveStaff());
      setHospitalLogo(getEffectiveHospitalLogo());
    };
    window.addEventListener('rsumb_settings_updated', handleSync);

    const handleLogoUpdated = (e: any) => {
      if (e?.detail?.logo) {
        setHospitalLogo(e.detail.logo);
      } else {
        setHospitalLogo(getEffectiveHospitalLogo());
      }
    };
    window.addEventListener('rsumb_logo_updated', handleLogoUpdated);

    const handlePromptConnect = () => {
      setShowDriveAuthModal(true);
    };
    window.addEventListener('rsumb_drive_not_connected_prompt', handlePromptConnect);

    const handleGasUrlChanged = () => {
      setDualSync(getDualSyncState());
    };
    window.addEventListener('rsumb_gas_url_changed', handleGasUrlChanged);

    const unsubSync = addSyncStateListener((state) => {
      setDualSync(state);
    });

    // Poll Google Sheets connection state every 60 seconds
    const pollInterval = setInterval(() => {
      setDualSync(getDualSyncState());
    }, 60000);

    return () => {
      window.removeEventListener('rsumb_settings_updated', handleSync);
      window.removeEventListener('rsumb_logo_updated', handleLogoUpdated);
      window.removeEventListener('rsumb_drive_not_connected_prompt', handlePromptConnect);
      window.removeEventListener('rsumb_gas_url_changed', handleGasUrlChanged);
      clearInterval(pollInterval);
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
  // LOGO RSUMB: KOMPRESI CANVAS & INSTANT REAL-TIME UPDATE
  // ==============================================================
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast?.('Silakan pilih berkas gambar (PNG, JPG, SVG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Kompres gambar otomatis dengan batas maksimal lebar/tinggi 200px
        const maxDimension = 200;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/png', 0.88);

          // Simpan dan picu update real-time
          saveHospitalLogo(compressedBase64);
          setHospitalLogo(compressedBase64);
          setSettings((prev) => ({
            ...prev,
            hospitalLogo: compressedBase64
          }));

          try {
            logSystemActivity(
              'Perbarui Logo RSUMB',
              `Logo resmi portal RSUMB berhasil diperbarui dengan ukuran terkompresi ${width}x${height}px.`,
              activeStaff.name,
              'PENGATURAN_SISTEM',
              'Pengaturan SIMRS'
            );
          } catch {}

          showToast?.('Logo resmi RSUMB berhasil diperbarui & langsung aktif secara real-time!', 'success');
        }
      };
      img.onerror = () => {
        showToast?.('Gagal memproses gambar logo. Coba format lain.', 'error');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetHospitalLogo = () => {
    resetHospitalLogo();
    setHospitalLogo(DEFAULT_HOSPITAL_LOGO);
    setSettings((prev) => ({
      ...prev,
      hospitalLogo: DEFAULT_HOSPITAL_LOGO
    }));

    try {
      logSystemActivity(
        'Reset Logo RSUMB',
        'Logo portal RSUMB dikembalikan ke logo resmi bawaan.',
        activeStaff.name,
        'PENGATURAN_SISTEM',
        'Pengaturan SIMRS'
      );
    } catch {}

    showToast?.('Logo dikembalikan ke Logo Resmi RSU Muhammadiyah Babat bawaan.', 'info');
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

  // Google Sheets Action Handlers
  const handleOpenGasModal = () => {
    setShowDriveAuthModal(true);
  };

  const handleManualPushDrive = async () => {
    if (!isGasConnected()) {
      setShowDriveAuthModal(true);
      showToast?.('Data aman di browser (LocalStorage). Silakan masukkan URL Google Sheets Web App.', 'info');
      return;
    }

    setIsDriveOperating(true);
    try {
      const res = await pushDatabaseToSheets(false);
      if (res.success) {
        showToast?.('Database berhasil disinkronkan ke Google Sheets!', 'success');
      } else if (res.offlineFallback) {
        setShowDriveAuthModal(true);
        showToast?.('Data tersimpan di LocalStorage (Mode Lokal).', 'info');
      }
    } catch (err: any) {
      showToast?.(`Gagal sinkron: ${err?.message}`, 'error');
    } finally {
      setIsDriveOperating(false);
    }
  };

  const handleConfirmRestoreFromDrive = async () => {
    if (!isGasConnected()) {
      setShowDriveRestoreConfirm(false);
      setShowDriveAuthModal(true);
      showToast?.('Silakan hubungkan URL Google Sheets terlebih dahulu.', 'info');
      return;
    }

    setIsDriveOperating(true);
    try {
      const res = await pullDatabaseFromSheets(false);
      setShowDriveRestoreConfirm(false);
      if (res.success) {
        showToast?.(`Sukses! ${res.restoredKeys} data dipulihkan dari Google Sheets. Memuat ulang...`, 'success');
        setTimeout(() => {
          window.location.reload();
        }, 700);
      }
    } catch (err: any) {
      showToast?.(`Gagal memulihkan: ${err?.message}`, 'error');
    } finally {
      setIsDriveOperating(false);
    }
  };

  const handleSnapshotBackupToDrive = async () => {
    if (!isGasConnected()) {
      setShowDriveAuthModal(true);
      showToast?.('Silakan hubungkan URL Google Sheets terlebih dahulu.', 'info');
      return;
    }

    setIsDriveOperating(true);
    try {
      const res = await createDriveBackupSnapshot();
      showToast?.('Snapshot cadangan database berhasil disimpan ke Google Sheets.', 'success');
    } catch (err: any) {
      showToast?.(`Gagal membuat snapshot: ${err?.message}`, 'error');
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
        {/* BRANDING: LOGO RESMI RSUMB & IDENTITAS RUMAH SAKIT */}
        {/* ============================================================== */}
        <div className="bg-gradient-to-r from-emerald-900/90 to-[#005d42] rounded-2xl p-4 sm:p-5 text-white border border-emerald-500/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={hospitalLogo || DEFAULT_HOSPITAL_LOGO}
                alt="Logo RSU Muhammadiyah Babat"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full bg-white p-1 ring-4 ring-emerald-400/50 shadow-md transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_HOSPITAL_LOGO;
                }}
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-400 text-emerald-950 font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                RSUMB
              </span>
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[11px] font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Identitas Resmi Rumah Sakit</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Logo Resmi RSU Muhammadiyah Babat
              </h3>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                Logo ini ditampilkan di pojok kiri atas (Header), Sidebar menu, kop surat rekam medis, dan struk thermal. Unggahan baru otomatis dikompres ke Base64 (maks. 200px) agar ringan dan langsung ter-update secara real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <input
              type="file"
              ref={logoFileInputRef}
              onChange={handleLogoFileUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => logoFileInputRef.current?.click()}
              className="bg-white hover:bg-emerald-50 text-[#005d42] font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Unggah logo baru (PNG/JPG/SVG) - otomatis dikompres ke maks 200px"
            >
              <Upload className="w-4 h-4 text-[#005d42]" />
              <span>Ganti Logo</span>
            </button>

            <button
              type="button"
              onClick={handleResetHospitalLogo}
              className="bg-emerald-800/80 hover:bg-emerald-800 text-white font-medium px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-400/30 transition active:scale-95 cursor-pointer"
              title="Kembalikan logo ke logo resmi bawaan RSUMB"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-300" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

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
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Database Google Sheets (GAS)</span>
                  {dualSync.status === 'syncing' || isDriveOperating ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-400/30 text-sky-200 text-[9px] font-bold animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Syncing...</span>
                    </span>
                  ) : isGasConnected() ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ) : null}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium px-2 flex items-center gap-1.5">
                <span>Database Cloud:</span>
                <span className="font-mono font-bold text-[#005d42] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Google Sheets Web App
                </span>
              </div>
            </div>

            {backupSubTab === 'audit_trail' ? (
              <ActivityLogAuditTrailView showToast={showToast} />
            ) : (
              <div className="space-y-6">
                {/* GOOGLE SHEETS GAS CLOUD STORAGE ENGINE */}
                <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-[#004732] to-[#003828] text-white shadow-md space-y-5 border border-emerald-800/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 text-emerald-300 shrink-0">
                        <GoogleSheetsLogo className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base sm:text-lg text-white">
                            Integrasi Database Google Sheets (GAS Web App)
                          </h4>
                          {dualSync.status === 'syncing' || isDriveOperating ? (
                            <span className="bg-sky-400/25 text-sky-200 border border-sky-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-2xs">
                              <RefreshCw className="w-3 h-3 text-sky-300 animate-spin" />
                              <span>Syncing... (Memperbarui Sheets)</span>
                            </span>
                          ) : isGasConnected() ? (
                            <span className="bg-emerald-400/25 text-emerald-200 border border-emerald-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>🟢 Terhubung ke Google Sheets</span>
                            </span>
                          ) : (
                            <span className="bg-amber-400/25 text-amber-200 border border-amber-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>🟡 Mode Lokal (Belum Ada URL Sheets)</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-100/85 mt-1 max-w-2xl leading-relaxed">
                          Penyimpanan cloud otomatis langsung ke baris spreadsheet Google Sheets RSUMB (Kupon Fee Mohat, Catatan Pasien, Log Aktivitas, dan Database Snapshot).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={handleOpenGasModal}
                        className="py-2.5 px-4 font-bold text-xs shadow-md bg-emerald-50 hover:bg-white text-[#004732] border border-emerald-300 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                        <span>{isGasConnected() ? 'Pengaturan Sheets' : 'Setel URL Google Sheets'}</span>
                      </button>
                    </div>
                  </div>

                  {isGasConnected() ? (
                    <div className="space-y-3.5 pt-3 border-t border-white/15">
                      {/* URL & Target Sheets info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs">
                          <span className="text-[10px] uppercase font-bold text-emerald-300 block">Status Koneksi</span>
                          <p className="font-extrabold text-white truncate mt-1 text-sm">Google Sheets Online</p>
                          <p className="text-[11px] text-emerald-200/80 truncate mt-0.5 font-mono">Tanpa Token / Selalu Aktif</p>
                        </div>

                        <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs">
                          <span className="text-[10px] uppercase font-bold text-emerald-300 block">Tab Spreadsheet Aktif</span>
                          <p className="font-mono font-bold text-white mt-1 text-sm">Kupon_Fee &amp; Catatan</p>
                          <p className="text-[11px] text-emerald-200/80 mt-0.5">Auto-Append &amp; Upsert</p>
                        </div>

                        <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs">
                          <span className="text-[10px] uppercase font-bold text-emerald-300 block">Backup Snapshot JSON</span>
                          <p className="font-mono text-white mt-1 text-sm">Sheet: Database_Snapshot</p>
                          <p className="text-[11px] text-emerald-200/80 font-mono mt-0.5">Cell A1 Full Snapshot</p>
                        </div>
                      </div>

                      {/* Sync Status Banner */}
                      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-all ${
                        dualSync.status === 'syncing' || isDriveOperating
                          ? 'bg-sky-950/70 border-sky-400/50 shadow-md ring-1 ring-sky-400/30 animate-pulse'
                          : 'bg-white/10 border-white/15'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            dualSync.status === 'syncing' || isDriveOperating
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          }`}>
                            <RefreshCw className={`w-4 h-4 ${dualSync.status === 'syncing' || isDriveOperating ? 'text-sky-300 animate-spin' : 'text-emerald-300'}`} />
                          </div>
                          <div>
                            <span className="text-emerald-100/90 block text-[11px]">Status Sinkronisasi Background:</span>
                            <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                              {dualSync.status === 'syncing' || isDriveOperating ? (
                                <span className="text-sky-200 flex items-center gap-1.5">
                                  <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                                  <span>Syncing... Memperbarui Google Sheets</span>
                                </span>
                              ) : dualSync.status === 'synced' ? (
                                <span className="text-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Tersinkronisasi ke Google Sheets</span>
                                </span>
                              ) : (
                                <span>Siap Disinkronkan</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {dualSync.status === 'syncing' || isDriveOperating ? (
                            <span className="px-2.5 py-1 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/40 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                              Auto-Syncing...
                            </span>
                          ) : dualSync.lastSyncTime ? (
                            <span className="text-[11px] text-emerald-200 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                              Sinkron Terakhir: {new Date(dualSync.lastSyncTime).toLocaleString('id-ID')}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Cloud Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={handleManualPushDrive}
                          disabled={isDriveOperating}
                          className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
                          title="Kirim dan simpan data lokal saat ini ke Google Sheets"
                        >
                          <RefreshCw className={`w-4 h-4 ${isDriveOperating ? 'animate-spin' : ''}`} />
                          <span>Kirim Data ke Sheets (Push)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowDriveRestoreConfirm(true)}
                          disabled={isDriveOperating}
                          className="py-2.5 px-3.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-white/20 transition cursor-pointer disabled:opacity-60"
                          title="Tarik data terbaru dari Google Sheets dan pulihkan ke browser ini"
                        >
                          <RefreshCw className={`w-4 h-4 text-emerald-300 ${isDriveOperating ? 'animate-spin' : ''}`} />
                          <span>{isDriveOperating ? 'Menarik Data...' : 'Tarik Data dari Sheets (Pull)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenGasModal}
                          className="py-2.5 px-3.5 bg-white/10 hover:bg-white/20 text-emerald-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-white/15 transition cursor-pointer"
                          title="Lihat kode script dan detail koneksi"
                        >
                          <Code className="w-4 h-4 text-emerald-300" />
                          <span>Kode Script (Code.gs)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* DISCONNECTED PROMINENT HERO CARD */
                    <div className="pt-3 border-t border-white/15 space-y-3">
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="font-extrabold text-white text-sm">
                              Mode Lokal Aktif (LocalStorage Siap)
                            </span>
                          </div>
                          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
                            Seluruh perubahan data kupon, catatan pasien, dan pengaturan tetap tersimpan aman di browser staf. Pasang URL Google Apps Script Web App untuk mengaktifkan sinkronisasi otomatis ke Google Sheets.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleOpenGasModal}
                            className="py-2.5 px-4 font-bold text-xs shadow-sm bg-emerald-50 hover:bg-white text-[#004732] border border-emerald-300 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                            <span>Setel URL Google Sheets</span>
                          </button>
                        </div>
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

            {/* Config Card: PIN / Passcode Otorisasi Mode Admin */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/90 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl border border-amber-300">
                  <ShieldCheck className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <span>Pengaturan PIN / Passcode Otorisasi Admin (RBAC)</span>
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Keamanan Otorisasi
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    PIN ini digunakan untuk membuka hak akses pengeditan, penambahan, dan penghapusan data pada seluruh modul SIMRS.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="flex-1 max-w-xs">
                  <input
                    type="password"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="Masukkan 4-digit PIN..."
                    maxLength={6}
                    className="w-full text-center font-mono font-bold tracking-widest text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleUpdateAdminPin}
                  className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan PIN Admin Baru</span>
                </button>
              </div>
            </div>
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
                onClick={() => requestAdminAction(() => setShowClearConfirm(true), 'Reset & Clear Cache Database')}
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

      {/* MODAL 3: Konfirmasi Pemulihan Database dari Google Sheets */}
      {showDriveRestoreConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          <div className="fixed inset-0" onClick={() => !isDriveOperating && setShowDriveRestoreConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10 p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#005d42] flex items-center justify-center mx-auto">
              <Cloud className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-base text-slate-900">Konfirmasi Tarik Data dari Google Sheets?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sistem akan mengunduh snapshot data terbaru dari spreadsheet Google Sheets dan <b>menimpa seluruh database lokal</b> browser ini (Kupon Fee Mohat, Jadwal Dokter, Kuota BPJS, Catatan Pasien, dan Pengaturan).
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <b>Perhatian:</b> Perubahan lokal yang belum dikirim (Push) ke Google Sheets akan digantikan oleh data cloud. Pastikan tindakan ini telah disetujui staf bertugas.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isDriveOperating}
                onClick={() => setShowDriveRestoreConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreFromDrive}
                disabled={isDriveOperating}
                className="flex-1 py-2.5 rounded-xl bg-[#005d42] hover:bg-[#004732] text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDriveOperating ? 'animate-spin' : ''}`} />
                <span>{isDriveOperating ? 'Menarik & Menimpa...' : 'Ya, Timpa & Tarik Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Dialog Autentikasi & Koneksi Google Drive */}
      <GoogleDriveAuthModal
        isOpen={showDriveAuthModal}
        onClose={() => setShowDriveAuthModal(false)}
        showToast={showToast}
      />
    </div>
  );
};
