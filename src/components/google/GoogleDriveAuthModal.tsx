import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  X,
  Database,
  Code,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  UploadCloud,
  DownloadCloud,
  Sparkles,
  Info
} from 'lucide-react';
import {
  getGasWebAppUrl,
  setGasWebAppUrl,
  isGasConnected,
  testGasConnection,
  getGasScriptTemplate
} from '../../services/googleSheetsGasService';
import {
  pushDatabaseToSheets,
  pullDatabaseFromSheets,
  getDualSyncState,
  addSyncStateListener,
  DualSyncState
} from '../../services/dualSyncStorage';
import { GoogleSheetsLogo } from './GoogleDriveSyncBadge';

interface GoogleDriveAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const GoogleDriveAuthModal: React.FC<GoogleDriveAuthModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'script_code' | 'tutorial'>('connection');
  const [gasUrlInput, setGasUrlInput] = useState(() => getGasWebAppUrl());
  const [syncState, setSyncState] = useState<DualSyncState>(() => getDualSyncState());
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [showPullConfirmModal, setShowPullConfirmModal] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setGasUrlInput(getGasWebAppUrl());
    const unsubSync = addSyncStateListener((state) => {
      setSyncState(state);
    });

    return () => {
      unsubSync();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = isGasConnected();
  const scriptCode = getGasScriptTemplate();

  const handleSaveUrl = () => {
    const trimmed = gasUrlInput.trim();
    if (!trimmed) {
      setGasWebAppUrl('');
      setTestResult(null);
      showToast?.('URL Google Sheets Web App dihapus. Mode lokal aktif.', 'info');
      return;
    }

    if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
      showToast?.('Format URL tidak valid. Harus diawali https://script.google.com/macros/s/...', 'error');
      return;
    }

    setGasWebAppUrl(trimmed);
    showToast?.('URL Google Sheets Web App berhasil disimpan!', 'success');
  };

  const handleTestConnection = async () => {
    const targetUrl = gasUrlInput.trim();
    if (!targetUrl) {
      showToast?.('Silakan masukkan URL Google Apps Script Web App terlebih dahulu.', 'error');
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    try {
      const res = await testGasConnection(targetUrl);
      setTestResult(res);
      if (res.success) {
        setGasWebAppUrl(targetUrl);
        showToast?.(res.message, 'success');
      } else {
        showToast?.(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menghubungi Web App'
      });
      showToast?.(`Gagal terhubung: ${err?.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fungsi: pushDatabaseToSheets()
   * Menyimpan seluruh data tabel portal ke Google Sheets
   */
  const handlePushDatabaseToSheets = async () => {
    const trimmed = gasUrlInput.trim();
    if (!isGasConnected() && trimmed.startsWith('https://script.google.com/macros/s/')) {
      setGasWebAppUrl(trimmed);
    }

    setIsPushing(true);
    try {
      const res = await pushDatabaseToSheets(false);
      if (res.success) {
        showToast?.('Database SIMRS berhasil disinkronkan langsung ke Google Sheets!', 'success');
      } else if (res.message) {
        showToast?.(res.message, 'info');
      }
    } catch (err: any) {
      showToast?.(`Gagal sinkron ke Google Sheets: ${err?.message}`, 'error');
    } finally {
      setIsPushing(false);
    }
  };

  /**
   * Fungsi: Buka Dialog Konfirmasi Tarik Data dari Sheets
   */
  const handleInitiatePullDatabase = () => {
    const trimmed = gasUrlInput.trim();
    if (!isGasConnected() && trimmed.startsWith('https://script.google.com/macros/s/')) {
      setGasWebAppUrl(trimmed);
    }
    setShowPullConfirmModal(true);
  };

  /**
   * Eksekusi penarikan data dari Google Sheets setelah dikonfirmasi staf
   */
  const executePullDatabaseFromSheets = async () => {
    setIsPulling(true);
    try {
      const res = await pullDatabaseFromSheets(false);
      if (res.success) {
        showToast?.(res.message || 'Sukses! Data portal berhasil dipulihkan dari Google Sheets.', 'success');
        setShowPullConfirmModal(false);
      } else if (res.message) {
        showToast?.(res.message, 'error');
      }
    } catch (err: any) {
      showToast?.(`Gagal memuat data: ${err?.message}`, 'error');
    } finally {
      setIsPulling(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setIsCopied(true);
    showToast?.('Kode Google Apps Script (Code.gs) berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-modal-title"
    >
      <div className="fixed inset-0 bg-transparent" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-3xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] z-10">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#004732] to-[#005d42] text-white p-4 sm:p-6 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <GoogleSheetsLogo className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="drive-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                  Database Google Sheets (GAS Web App)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 font-bold uppercase tracking-wider">
                  Tanpa OAuth / Selalu Online
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                Penyimpanan cloud otomatis langsung ke baris spreadsheet Google Sheets RSUMB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-1 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'connection'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Koneksi & Sinkronisasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('script_code')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'script_code'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Code className="w-4 h-4 text-emerald-600" />
            <span>Kode Script (Code.gs)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'tutorial'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Panduan Pemasangan</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 bg-white">
          
          {/* TAB 1: CONNECTION & SYNC */}
          {activeTab === 'connection' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 transition ${
                  isConnected
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isConnected ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {isConnected ? <CheckCircle2 className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">
                      {isConnected ? '🟢 Database Google Sheets: Terhubung' : '🟡 Database: Mode Lokal'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {isConnected
                      ? 'Portal terhubung dengan Google Apps Script Web App. Setiap pembaruan kupon fee, catatan stiker ranap, dan jadwal otomatis tersimpan ke Google Sheets.'
                      : 'URL Google Apps Script belum terpasang. Data saat ini disimpan aman di peramban staf (LocalStorage). Masukkan URL Web App di bawah untuk mengaktifkan sinkronisasi.'}
                  </p>
                  {syncState.lastSyncTime && (
                    <div className="mt-2 text-[11px] font-mono text-slate-500">
                      Sinkronisasi Terakhir:{' '}
                      <span className="font-bold text-slate-700">
                        {new Date(syncState.lastSyncTime).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* URL Input Form */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  URL Google Apps Script (Web App Deployment URL):
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="url"
                    value={gasUrlInput}
                    onChange={(e) => setGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isLoading || isPushing || isPulling || !gasUrlInput.trim()}
                      className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Uji Koneksi</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveUrl}
                      className="px-4 py-2.5 bg-[#005d42] hover:bg-[#004732] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan</span>
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      testResult.success
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                        : 'bg-rose-100/70 border-rose-300 text-rose-900'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Push & Pull Database */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePushDatabaseToSheets}
                  disabled={isPushing || isPulling || (!isConnected && !gasUrlInput.trim())}
                  className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-950 flex items-center gap-3.5 transition cursor-pointer text-left group shadow-xs disabled:opacity-50"
                  title="Kirim dan simpan seluruh tabel lokal ke spreadsheet Google Sheets sekarang"
                >
                  <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {isPushing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                      <span>Kirim Data ke Sheets (Push)</span>
                      {isPushing && <span className="text-[10px] text-emerald-700 font-mono animate-pulse">Menyimpan...</span>}
                    </div>
                    <div className="text-[11px] text-emerald-800/80 mt-0.5 leading-snug">
                      Simpan seluruh tabel data lokal ke spreadsheet Google Sheets
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleInitiatePullDatabase}
                  disabled={isPushing || isPulling || (!isConnected && !gasUrlInput.trim())}
                  className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-950 flex items-center gap-3.5 transition cursor-pointer text-left group shadow-xs disabled:opacity-50"
                  title="Tarik data terbaru dari Google Sheets dan pulihkan ke browser ini"
                >
                  <div className="w-11 h-11 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {isPulling ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <DownloadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-xs text-blue-950 flex items-center gap-1.5">
                      <span>Tarik Data dari Sheets (Pull)</span>
                      {isPulling && <span className="text-[10px] text-blue-700 font-mono animate-pulse">Memuat...</span>}
                    </div>
                    <div className="text-[11px] text-blue-800/80 mt-0.5 leading-snug">
                      Pulihkan database dari Google Sheets ke browser lokal
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CODE SCRIPT (Code.gs) */}
          {activeTab === 'script_code' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="text-xs text-emerald-900 font-semibold">
                  📄 Salin seluruh kode di bawah ini ke editor <strong>Apps Script</strong> pada Google Sheets Anda:
                </div>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Tersalin!' : '📋 Salin Kode Script (Code.gs)'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-900 text-slate-200 p-4 border border-slate-800 max-h-[380px] overflow-y-auto font-mono text-[11px] leading-relaxed shadow-inner">
                <pre>{scriptCode}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: TUTORIAL / SETUP GUIDE */}
          {activeTab === 'tutorial' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>5 Langkah Praktis Pemasangan Google Sheets Backend:</span>
                </h4>
                
                <ol className="list-decimal list-inside space-y-2.5 font-medium">
                  <li className="pl-1">
                    <strong>Buat Spreadsheet Baru:</strong> Buka tab baru browser dan ketik{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold underline inline-flex items-center gap-1"
                    >
                      sheets.new <ExternalLink className="w-3 h-3 inline" />
                    </a>{' '}
                    lalu beri judul file (misal: <em>"DATABASE PORTAL RSUMB"</em>).
                  </li>
                  <li className="pl-1">
                    <strong>Buka Apps Script:</strong> Klik menu <strong>Ekstensi (Extensions)</strong> &gt;{' '}
                    <strong>Apps Script</strong> pada menu bar Google Sheets.
                  </li>
                  <li className="pl-1">
                    <strong>Paste Kode:</strong> Hapus seluruh kode bawaan di file <code>Code.gs</code>, lalu klik tombol{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('script_code');
                        handleCopyScript();
                      }}
                      className="text-emerald-700 font-bold underline inline cursor-pointer"
                    >
                      Salin Kode Script (Code.gs)
                    </button>{' '}
                    dan paste ke editor. Tekan <code>Ctrl + S</code> untuk menyimpan.
                  </li>
                  <li className="pl-1">
                    <strong>Deploy sebagai Web App:</strong>
                    <div className="pl-5 mt-1 space-y-1 text-slate-600 text-[11px]">
                      <div>• Klik tombol biru <strong>Deploy (Terapkan)</strong> di kanan atas &gt; <strong>New deployment (Penerapan baru)</strong>.</div>
                      <div>• Klik ikon gerigi &gt; pilih <strong>Web app (Aplikasi web)</strong>.</div>
                      <div>• <strong>Execute as:</strong> "Me (email akun Anda)".</div>
                      <div>• <strong>Who has access:</strong> <span className="font-bold text-emerald-800">"Anyone" (Siapa saja)</span> &lt;-- Wajib agar portal dapat menyimpan data.</div>
                      <div>• Klik <strong>Deploy</strong> dan izinkan akses (*Authorize Access*).</div>
                    </div>
                  </li>
                  <li className="pl-1">
                    <strong>Tempel URL:</strong> Salin <strong>Web app URL</strong> (akhiran <code>/exec</code>), kembali ke portal ini, lalu paste pada tab <strong>Koneksi &amp; Sinkronisasi</strong>.
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Kelebihan Menggunakan Google Apps Script:</strong> Tidak ada sesi token yang kedaluwarsa, tidak memerlukan pop-up otentikasi harian, dan seluruh baris data Kupon Fee Mohat serta Catatan Pasien langsung tersusun rapi di tab-tab Google Sheets yang bisa dibuka oleh seluruh staf.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Kerahasiaan database terenkripsi HTTPS langsung ke akun Google RSUMB.</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>

      {/* POP-UP MODAL: Konfirmasi Tarik Data dari Google Sheets */}
      {showPullConfirmModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[999999] bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          style={{ position: 'fixed', inset: 0, zIndex: 999999 }}
        >
          <div className="fixed inset-0" onClick={() => !isPulling && setShowPullConfirmModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10 p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <DownloadCloud className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-base text-slate-900">Konfirmasi Tarik Data dari Google Sheets?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sistem akan mengunduh seluruh data terbaru dari Google Sheets dan <b>menimpa database lokal</b> di browser ini.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <b>Perhatian:</b> Data lokal yang belum dikirim ke Google Sheets akan digantikan oleh data cloud. Pastikan Anda telah menyimpan perubahan yang diperlukan.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isPulling}
                onClick={() => setShowPullConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executePullDatabaseFromSheets}
                disabled={isPulling}
                className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'Menarik Data...' : 'Ya, Timpa & Tarik Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
