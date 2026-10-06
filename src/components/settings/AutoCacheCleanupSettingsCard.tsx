import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trash2,
  HardDrive,
  Clock,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Zap,
  Info
} from 'lucide-react';
import {
  loadAutoCleanupConfig,
  saveAutoCleanupConfig,
  runAutoCacheCleanup,
  getLocalStorageUsage,
  AutoCleanupConfig
} from '../../utils/autoCacheCleanup';

interface AutoCacheCleanupSettingsCardProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AutoCacheCleanupSettingsCard: React.FC<AutoCacheCleanupSettingsCardProps> = ({
  showToast
}) => {
  const [config, setConfig] = useState<AutoCleanupConfig>(() => loadAutoCleanupConfig());
  const [storageUsage, setStorageUsage] = useState(() => getLocalStorageUsage());
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(loadAutoCleanupConfig());
      setStorageUsage(getLocalStorageUsage());
    };
    window.addEventListener('rsumb_auto_cleanup_config_updated', handleUpdate);
    return () => window.removeEventListener('rsumb_auto_cleanup_config_updated', handleUpdate);
  }, []);

  const handleToggle = (enabled: boolean) => {
    const updated = { ...config, enabled };
    setConfig(updated);
    saveAutoCleanupConfig(updated);
    showToast?.(
      enabled
        ? 'Pembersihan cache otomatis diaktifkan (berjalan pada setiap app mount).'
        : 'Pembersihan cache otomatis dinonaktifkan.',
      'info'
    );
  };

  const handleRetentionChange = (days: number) => {
    const updated = { ...config, retentionDays: days };
    setConfig(updated);
    saveAutoCleanupConfig(updated);
    showToast?.(`Masa retensi cache diatur menjadi ${days} hari.`, 'success');
  };

  const handleRunManual = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const res = runAutoCacheCleanup(true);
      setConfig(loadAutoCleanupConfig());
      setStorageUsage(getLocalStorageUsage());
      setIsCleaning(false);

      if (res.success) {
        showToast?.(res.summary, 'success');
      } else {
        showToast?.(res.summary, 'error');
      }
    }, 450);
  };

  // Format tanggal & jam WIB bersih tanpa duplikasi WIB
  const formatCleanDateWib = (isoStr: string | null) => {
    if (!isoStr) return 'Belum pernah dijalankan';
    try {
      const d = new Date(isoStr);
      const datePart = d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timePart = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }).replace(':', '.');
      return `${datePart}, ${timePart} WIB`;
    } catch {
      return isoStr;
    }
  };

  // Hitung persentase pemakaian dari batas aman 5 MB
  const maxQuotaKb = 5120; // 5 MB
  const usagePercent = Math.min(100, Math.round((storageUsage.usedKb / maxQuotaKb) * 100));

  return (
    <div className="space-y-6">
      {/* HERO BANNER CARD */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-[#004732] to-[#003322] text-white shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 -translate-y-8 translate-x-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-emerald-300 shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-base sm:text-lg text-white">
                  Pembersihan Cache Otomatis (Auto-Cleanup)
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                  config.enabled
                    ? 'bg-emerald-400/25 text-emerald-200 border-emerald-400/30'
                    : 'bg-rose-500/25 text-rose-200 border-rose-400/30'
                }`}>
                  {config.enabled ? 'Aktif pada App Mount' : 'Non-Aktif'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
                Menghapus data lama di <code className="bg-black/30 px-1 py-0.5 rounded text-emerald-200 font-mono text-[11px]">localStorage</code> browser (seperti log aktivitas audit trail atau data snapshot &gt; {config.retentionDays} hari) secara otomatis setiap kali portal dibuka (app mount), guna menjaga performa portal tetap ringan, cepat, dan responsif.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
            <button
              type="button"
              onClick={handleRunManual}
              disabled={isCleaning}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-950 ${isCleaning ? 'animate-spin' : ''}`} />
              <span>{isCleaning ? 'Membersihkan...' : 'Bersihkan Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* GRID CONFIG & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: PENGATURAN RETENSI & TOGGLE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h5 className="font-bold text-sm text-slate-900">Otomasi Saat App Mount</h5>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005d42]" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Batas Usia Data (Retensi Hari):
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[14, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleRetentionChange(days)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    config.retentionDays === days
                      ? 'bg-[#005d42] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {days} Hari
                  {days === 30 && (
                    <span className="block text-[9px] font-normal opacity-80">(Bawaan)</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Data log audit trail dan temporary snapshot yang usianya melebihi <strong>{config.retentionDays} hari</strong> akan otomatis dieliminasi saat staf membuka portal.
            </p>
          </div>
        </div>

        {/* CARD 2: PENGGUNAAN MEMORI LOCALSTORAGE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <h5 className="font-bold text-sm text-slate-900">Kapasitas LocalStorage</h5>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {storageUsage.usedMb} MB ({storageUsage.usedKb} KB)
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Penggunaan Memori Browser</span>
              <span className="font-semibold text-slate-900">{usagePercent}% dari ~5 MB</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#005d42] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, usagePercent)}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Total Kunci / Tabel SIMRS:</span>
            <span className="font-bold text-slate-800">{storageUsage.totalKeys} keys aktif</span>
          </div>
        </div>

        {/* CARD 3: RIWAYAT & REKAPITULASI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h5 className="font-bold text-sm text-slate-900">Status Pembersihan</h5>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Terakhir Dijalankan
              </span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {formatCleanDateWib(config.lastCleanedAt)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Catatan Hasil Terakhir
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                {config.lastSummary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Total Item Dibersihkan:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {config.totalCleanedLifetime} item
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KEAMANAN & TRANSPARANSI DATA OPERASIONAL */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-emerald-900">
            Proteksi & Integritas Data Operasional RSUMB:
          </p>
          <p className="text-emerald-800 mt-0.5">
            Pembersihan otomatis hanya menargetkan <strong>log aktivitas/audit trail lama</strong> dan <strong>snapshot cadangan sementara</strong> yang telah berusia lebih dari {config.retentionDays} hari. Seluruh data operasional utama—seperti <strong>Jadwal Dokter DPJP aktif</strong>, <strong>Kupon Fee Mohat</strong>, <strong>Tarif Kamar Ranap</strong>, <strong>Catatan Khusus Pasien</strong>, dan <strong>Konfigurasi Pengaturan</strong>—diproteksi secara permanen dan tidak akan pernah terhapus.
          </p>
        </div>
      </div>
    </div>
  );
};
