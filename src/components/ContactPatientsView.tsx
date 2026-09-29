import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Megaphone,
  Search,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
  Trash2,
  Send,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  FileSpreadsheet,
  HelpCircle,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  SkipForward,
  ExternalLink,
  ChevronDown,
  Info,
  Calendar,
  Stethoscope,
  Building2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { BroadcastPatient, BroadcastTemplatePreset } from '../types/broadcastTypes';
import {
  parsePatientRawText,
  compileBroadcastMessage,
  buildWhatsAppLink,
  sanitizeWhatsAppNumber,
  openWhatsApp
} from '../utils/patientTextParser';
import {
  DEFAULT_BROADCAST_TEMPLATES,
  SAMPLE_RAW_REGISTRATION_TEXT
} from '../data/broadcastTemplates';
import { loadPortalSettings } from '../data/settingsData';

interface ContactPatientsViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ContactPatientsView: React.FC<ContactPatientsViewProps> = ({
  showToast = (_message: string, _type?: 'success' | 'info' | 'error') => {}
}) => {
  // 1. Raw Textarea State
  const [rawText, setRawText] = useState(SAMPLE_RAW_REGISTRATION_TEXT);

  // 2. Extracted Patients State with LocalStorage Persistence
  const [patients, setPatients] = useState<BroadcastPatient[]>(() => {
    const saved = localStorage.getItem('rsumb_broadcast_patients_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved broadcast patients', e);
      }
    }
    // Default initial parse from sample text
    return parsePatientRawText(SAMPLE_RAW_REGISTRATION_TEXT);
  });

  // Save patients changes
  useEffect(() => {
    localStorage.setItem('rsumb_broadcast_patients_v1', JSON.stringify(patients));
  }, [patients]);

  // 3. Message Template & Editor State
  const activeBroadcastTemplates = useMemo(() => {
    return loadPortalSettings().waBroadcast.templates || DEFAULT_BROADCAST_TEMPLATES;
  }, []);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const list = loadPortalSettings().waBroadcast.templates;
    return (list && list[0]?.id) || DEFAULT_BROADCAST_TEMPLATES[0].id;
  });
  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
    const list = loadPortalSettings().waBroadcast.templates;
    return (list && list[0]?.content) || DEFAULT_BROADCAST_TEMPLATES[0].content;
  });
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 4. Table Filter & Search
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SELECTED' | 'PENDING' | 'SENT'>('ALL');

  // 5. Active Preview Patient
  const [previewPatientId, setPreviewPatientId] = useState<string | null>(null);

  // 6. Bulk Dispatcher / Sequential Sender Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchIndex, setDispatchIndex] = useState(0);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Computed selected patients
  const selectedPatients = useMemo(() => {
    return patients.filter((p) => p.selected);
  }, [patients]);

  const sentPatientsCount = useMemo(() => {
    return patients.filter((p) => p.statusKirim === 'Terkirim').length;
  }, [patients]);

  // Active patient for live preview
  const currentPreviewPatient = useMemo(() => {
    if (previewPatientId) {
      const found = patients.find((p) => p.id === previewPatientId);
      if (found) return found;
    }
    return selectedPatients[0] || patients[0] || {
      id: 'demo',
      namaPasien: 'KULIYAH. NY',
      nomorWhatsApp: '0813-3361-8808',
      nomorWhatsAppClean: '6281333618808',
      poliklinik: 'Poliklinik Saraf',
      dokter: "dr. I'anatul Ulya, Sp.N",
      selected: true,
      statusKirim: 'Belum Dikirim'
    };
  }, [previewPatientId, selectedPatients, patients]);

  // Live compiled preview text
  const compiledPreviewMessage = useMemo(() => {
    return compileBroadcastMessage(messageTemplate, currentPreviewPatient);
  }, [messageTemplate, currentPreviewPatient]);

  // Filtered Patients for Table Display
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Search
      const q = tableSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.namaPasien.toLowerCase().includes(q) ||
        p.nomorWhatsApp.toLowerCase().includes(q) ||
        p.poliklinik.toLowerCase().includes(q) ||
        p.dokter.toLowerCase().includes(q);

      // Status Filter
      if (!matchSearch) return false;
      if (statusFilter === 'SELECTED') return p.selected;
      if (statusFilter === 'PENDING') return p.statusKirim === 'Belum Dikirim';
      if (statusFilter === 'SENT') return p.statusKirim === 'Terkirim';
      return true;
    });
  }, [patients, tableSearch, statusFilter]);

  // Checkbox All status
  const allFilteredSelected =
    filteredPatients.length > 0 && filteredPatients.every((p) => p.selected);
  const someFilteredSelected =
    filteredPatients.some((p) => p.selected) && !allFilteredSelected;

  // Handler: Parse Raw Text
  const handleProcessRawText = () => {
    if (!rawText.trim()) {
      showToast('Harap masukkan atau tempel teks data pendaftaran terlebih dahulu.', 'error');
      return;
    }

    const parsed = parsePatientRawText(rawText);
    if (parsed.length === 0) {
      showToast('Tidak ada data pasien atau nomor telepon yang berhasil diekstrak. Periksa format teks.', 'error');
      return;
    }

    setPatients(parsed);
    setPreviewPatientId(parsed[0]?.id || null);
    showToast(`Berhasil mengekstrak ${parsed.length} data pasien!`, 'success');
  };

  // Handler: Append more parsed patients to existing list
  const handleAppendParsedText = () => {
    if (!rawText.trim()) return;
    const parsed = parsePatientRawText(rawText);
    if (parsed.length === 0) {
      showToast('Tidak ada data baru yang terdeteksi.', 'error');
      return;
    }
    setPatients((prev) => [...prev, ...parsed]);
    showToast(`Menambahkan ${parsed.length} pasien ke daftar yang ada.`, 'success');
  };

  // Handler: Select All Toggle
  const handleToggleSelectAll = () => {
    const nextState = !allFilteredSelected;
    const filteredIds = new Set(filteredPatients.map((p) => p.id));
    setPatients((prev) =>
      prev.map((p) => (filteredIds.has(p.id) ? { ...p, selected: nextState } : p))
    );
  };

  // Handler: Toggle single patient
  const handleToggleSelectPatient = (id: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  // Handler: Insert variable into textarea
  const handleInsertVariable = (variableTag: string) => {
    if (!messageTextareaRef.current) {
      setMessageTemplate((prev) => prev + ` ${variableTag}`);
      return;
    }

    const el = messageTextareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = messageTemplate;

    const newVal = currentVal.substring(0, start) + variableTag + currentVal.substring(end);
    setMessageTemplate(newVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variableTag.length, start + variableTag.length);
    }, 50);
  };

  // Handler: Select Template Preset
  const handleSelectPreset = (preset: BroadcastTemplatePreset) => {
    setSelectedTemplateId(preset.id);
    setMessageTemplate(preset.content);
    showToast(`Template "${preset.title}" diterapkan.`, 'info');
  };

  // Handler: Send single patient directly
  const handleSendSinglePatient = (patient: BroadcastPatient) => {
    if (!patient.nomorWhatsAppClean) {
      showToast(`Nomor WhatsApp untuk ${patient.namaPasien} tidak valid.`, 'error');
      return;
    }

    const msg = compileBroadcastMessage(messageTemplate, patient);
    const link = buildWhatsAppLink(patient.nomorWhatsAppClean, msg);

    // Update status to 'Terkirim'
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patient.id
          ? {
              ...p,
              statusKirim: 'Terkirim',
              waktuKirim: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            }
          : p
      )
    );

    // Menggunakan openWhatsApp dengan target bernama 'WhatsAppTab' agar reusing tab yang sama
    openWhatsApp(patient.nomorWhatsAppClean, msg);
    showToast(`Membuka WhatsApp untuk ${patient.namaPasien}...`, 'success');
  };

  // Handler: Delete single patient row
  const handleDeletePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    showToast('Data pasien dihapus dari daftar.', 'info');
  };

  // Handler: Reset / Clear all patients
  const handleClearAllPatients = () => {
    if (patients.length === 0) return;
    if (window.confirm('Yakin ingin mengosongkan seluruh daftar pasien hasil ekstrak?')) {
      setPatients([]);
      localStorage.removeItem('rsumb_broadcast_patients_v1');
      showToast('Seluruh daftar pasien telah dikosongkan.', 'info');
    }
  };

  // Handler: Reset Statuses
  const handleResetStatuses = () => {
    setPatients((prev) =>
      prev.map((p) => ({ ...p, statusKirim: 'Belum Dikirim', waktuKirim: undefined }))
    );
    showToast('Status seluruh pasien telah di-reset ke "Belum Dikirim".', 'info');
  };

  // Handler: Copy Preview Message
  const handleCopyPreview = () => {
    navigator.clipboard.writeText(compiledPreviewMessage);
    setCopiedNotification(true);
    showToast('Teks pesan berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Handler: Start Dispatch Modal (Bulk Sender Runner)
  const handleStartBulkDispatch = () => {
    if (selectedPatients.length === 0) {
      showToast('Pilih setidaknya 1 pasien pada tabel untuk dikirimi pesan broadcast.', 'error');
      return;
    }
    // Find first unsent or start at index 0
    const firstUnsentIdx = selectedPatients.findIndex((p) => p.statusKirim !== 'Terkirim');
    setDispatchIndex(firstUnsentIdx >= 0 ? firstUnsentIdx : 0);
    setIsAutoSending(false);
    setIsDispatchModalOpen(true);
  };

  // Current patient inside bulk dispatch modal
  const dispatchPatient = selectedPatients[dispatchIndex];

  // Action inside Bulk Dispatch Modal: Open Current WA & mark as sent
  const handleDispatchCurrentPatient = (advanceNext = true) => {
    if (!dispatchPatient) return;

    const msg = compileBroadcastMessage(messageTemplate, dispatchPatient);
    const link = buildWhatsAppLink(dispatchPatient.nomorWhatsAppClean, msg);

    // Update patient status in main state
    setPatients((prev) =>
      prev.map((p) =>
        p.id === dispatchPatient.id
          ? {
              ...p,
              statusKirim: 'Terkirim',
              waktuKirim: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            }
          : p
      )
    );

    // Open WhatsApp reusing 'WhatsAppTab'
    openWhatsApp(dispatchPatient.nomorWhatsAppClean, msg);

    if (advanceNext) {
      if (dispatchIndex + 1 < selectedPatients.length) {
        setDispatchIndex((prev) => prev + 1);
      } else {
        setIsAutoSending(false);
        showToast('Semua pasien terpilih telah diproses!', 'success');
      }
    }
  };

  // Action: Skip current dispatch patient
  const handleSkipDispatchPatient = () => {
    if (!dispatchPatient) return;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === dispatchPatient.id
          ? {
              ...p,
              statusKirim: 'Gagal / Dilewati'
            }
          : p
      )
    );

    if (dispatchIndex + 1 < selectedPatients.length) {
      setDispatchIndex((prev) => prev + 1);
    } else {
      setIsAutoSending(false);
      showToast('Selesai meninjau seluruh pasien terpilih.', 'info');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (patients.length === 0) {
      showToast('Tidak ada data pasien untuk diekspor.', 'error');
      return;
    }

    const headers = ['Nama Pasien', 'Nomor WhatsApp', 'Poliklinik', 'Dokter', 'Status Pengiriman', 'Waktu Kirim'];
    const rows = patients.map((p) => [
      `"${p.namaPasien.replace(/"/g, '""')}"`,
      `"${p.nomorWhatsApp}"`,
      `"${p.poliklinik.replace(/"/g, '""')}"`,
      `"${p.dokter.replace(/"/g, '""')}"`,
      `"${p.statusKirim}"`,
      `"${p.waktuKirim || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `broadcast_pasien_rsumb_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* ========================================================
          AREA TOP BAR / HEADER HALAMAN
          ======================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-[#005d42] text-white shadow-md shadow-emerald-900/10 shrink-0">
              <Megaphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Broadcast Informasi Pasien via WhatsApp
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wide border border-emerald-200">
                  WA Broadcast RSUMB
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Layanan pesan massal untuk perubahan jadwal dokter, pengingat kontrol, dan informasi pelayanan.
              </p>
            </div>
          </div>

          {/* Stat Badges & Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
              <span className="text-slate-500">Total Pasien:</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-slate-900">
                {patients.length}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800">
              <span>Terpilih:</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md font-bold">
                {selectedPatients.length}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl text-xs font-semibold text-blue-800">
              <span>Terkirim:</span>
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md font-bold">
                {sentPatientsCount} / {patients.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Unduh data pasien ke file CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          LANGKAH 1: INPUT DATA PASIEN MENTAH (TEXTAREA PARSING)
          ======================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#005d42] text-white text-xs font-black">
              1
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Langkah 1: Input Data Pasien Mentah (Textarea Parsing)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin & tempel daftar pendaftaran dari SIMRS, rekap loket, atau pesan teks WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setRawText(SAMPLE_RAW_REGISTRATION_TEXT)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Isi dengan contoh format teks pendaftaran pasien RSUMB"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Contoh Data RSUMB</span>
            </button>

            <button
              type="button"
              onClick={() => setRawText('')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Bersihkan isi kotak teks"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Kosongkan</span>
            </button>
          </div>
        </div>

        {/* Textarea Input */}
        <div>
          <label
            htmlFor="raw-patient-input"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Tempel / Paste Data Pendaftaran Di Sini
          </label>
          <div className="relative">
            <textarea
              id="raw-patient-input"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              placeholder={`Contoh teks beruntun yang didukung otomatis:
1.
Nama: KULIYAH. NY
No. WhatsApp: 081333618808
Poliklinik: Poliklinik Saraf
Dokter: dr. I'anatul Ulya, Sp.N

2.
SUKARTI, NY
085232572807
Poliklinik Penyakit Dalam
dr. Moch. Djunaedy Santoso, Sp.PD`}
              className="w-full font-mono text-xs p-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] transition-all resize-y leading-relaxed text-slate-800"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Sistem Otomatis Mengenali:</span>
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                📱 08... (No. WhatsApp)
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                👤 Nama Pasien (NY/TN/AN)
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                🩺 dr. ... (DPJP)
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                🏥 Poliklinik ...
              </span>
            </div>
            <span>{rawText.length} karakter</span>
          </div>
        </div>

        {/* Action Button: Proses & Ekstrak Data */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleAppendParsedText}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-300"
            title="Tambahkan hasil ekstrak ke daftar yang sudah ada"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>+ Tambah ke Daftar yang Ada</span>
          </button>

          <button
            type="button"
            id="btn-process-raw-text"
            onClick={handleProcessRawText}
            className="px-5 py-2.5 bg-[#005d42] hover:bg-[#004732] active:bg-[#003d2b] text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4 text-emerald-200" />
            <span>🔍 Proses & Ekstrak Data</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          LANGKAH 2: TABEL PREVIEW & PILIHAN PASIEN
          ======================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#005d42] text-white text-xs font-black">
              2
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Langkah 2: Tabel Preview & Pilihan Pasien
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih pasien yang akan dikirimi broadcast atau lakukan penyesuaian individual.
              </p>
            </div>
          </div>

          {/* Quick Filter & Reset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetStatuses}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset status pengiriman semua pasien menjadi 'Belum Dikirim'"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Status</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllPatients}
              disabled={patients.length === 0}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Hapus seluruh pasien di tabel"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Kosongkan Tabel</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Cari nama pasien, WhatsApp, poli, atau dokter..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] font-semibold mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({patients.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SELECTED')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'SELECTED'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Terpilih ({selectedPatients.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Belum ({patients.filter((p) => p.statusKirim === 'Belum Dikirim').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SENT')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'SENT'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              Terkirim ({sentPatientsCount})
            </button>
          </div>
        </div>

        {/* Interactive Data Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    disabled={filteredPatients.length === 0}
                    className="cursor-pointer text-slate-600 hover:text-slate-900"
                    title={allFilteredSelected ? 'Batalkan pilihan semua' : 'Pilih semua pasien'}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : someFilteredSelected ? (
                      <MinusSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 w-12 text-center">No.</th>
                <th className="py-3 px-4">Nama Pasien</th>
                <th className="py-3 px-4">Nomor WhatsApp</th>
                <th className="py-3 px-4">Poliklinik</th>
                <th className="py-3 px-4">Dokter</th>
                <th className="py-3 px-4 text-center">Status Pengiriman</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserX className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada data pasien.</p>
                      <p className="text-[11px] text-slate-400">
                        Tempel data pendaftaran pada Langkah 1 di atas lalu klik [ Proses & Ekstrak Data ].
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, idx) => {
                  const isPreviewing = previewPatientId === patient.id;
                  const isSent = patient.statusKirim === 'Terkirim';

                  return (
                    <tr
                      key={patient.id}
                      className={`hover:bg-emerald-50/40 transition-colors ${
                        patient.selected ? 'bg-white' : 'bg-slate-50/50 opacity-75'
                      } ${isPreviewing ? 'ring-1 ring-emerald-400 bg-emerald-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectPatient(patient.id)}
                          className="cursor-pointer text-slate-500 hover:text-slate-900"
                        >
                          {patient.selected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Number */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Nama Pasien */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPatientId(patient.id)}
                            className="font-bold text-slate-900 hover:text-emerald-700 text-left transition-colors cursor-pointer"
                            title="Klik untuk pratinjau pesan pasien ini di Langkah 3"
                          >
                            {patient.namaPasien}
                          </button>
                          {isPreviewing && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                              Preview
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nomor WhatsApp */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {patient.nomorWhatsApp}
                          </span>
                          {patient.nomorWhatsAppClean && (
                            <button
                              type="button"
                              onClick={() => {
                                const msg = compileBroadcastMessage(messageTemplate, patient);
                                openWhatsApp(patient.nomorWhatsAppClean, msg);
                              }}
                              className="text-emerald-600 hover:text-emerald-800 transition-colors p-0.5 rounded cursor-pointer"
                              title="Buka obrolan WhatsApp di tab WhatsAppTab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Poliklinik */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                          {patient.poliklinik}
                        </span>
                      </td>

                      {/* Dokter */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {patient.dokter}
                        </div>
                      </td>

                      {/* Status Pengiriman */}
                      <td className="py-3 px-4 text-center">
                        {patient.statusKirim === 'Terkirim' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10.5px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Terkirim {patient.waktuKirim ? `(${patient.waktuKirim})` : '✅'}
                          </span>
                        ) : patient.statusKirim === 'Sedang Mengirim' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-full text-[10.5px] animate-pulse">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Mengirim...
                          </span>
                        ) : patient.statusKirim === 'Gagal / Dilewati' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10.5px]">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Dilewati
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 font-semibold rounded-full text-[10.5px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Belum Dikirim
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Tombol Kirim WA Tunggal */}
                          <button
                            type="button"
                            onClick={() => handleSendSinglePatient(patient)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title={`Kirim WhatsApp ke ${patient.namaPasien}`}
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                          </button>

                          {/* Tombol Hapus Baris */}
                          <button
                            type="button"
                            onClick={() => handleDeletePatient(patient.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus pasien ini dari daftar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table summary note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 px-1">
          <p>
            Menampilkan <span className="font-bold text-slate-800">{filteredPatients.length}</span> dari{' '}
            <span className="font-bold text-slate-800">{patients.length}</span> pasien (
            <span className="font-bold text-emerald-700">{selectedPatients.length}</span> terpilih untuk broadcast).
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">💡 Tips: Klik nama pasien untuk melihat pratinjau pesan di Langkah 3.</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          LANGKAH 3: PEMBUAT PESAN (MESSAGE EDITOR)
          ======================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#005d42] text-white text-xs font-black">
            3
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Langkah 3: Pembuat Pesan (Message Editor)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rakit pesan broadcast dengan variabel dinamis dan kirimkan ke semua pasien terpilih.
            </p>
          </div>
        </div>

        {/* Template Preset Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Template Siap Pakai
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {activeBroadcastTemplates.map((preset) => {
              const isSelected = selectedTemplateId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#005d42] bg-emerald-50/60 ring-2 ring-[#005d42]/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">{preset.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Variable Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Variabel Dinamis (Klik untuk Menyisipkan ke Pesan)
            </label>
            <span className="text-[11px] text-slate-400">
              Otomatis digantikan dengan data per pasien
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleInsertVariable('{nama_pasien}')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sisipkan variabel nama pasien"
            >
              <span>+</span>
              <span>{'{nama_pasien}'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertVariable('{nama_dokter}')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300/80 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sisipkan variabel nama dokter DPJP"
            >
              <span>+</span>
              <span>{'{nama_dokter}'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertVariable('{poliklinik}')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300/80 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sisipkan variabel nama poliklinik"
            >
              <span>+</span>
              <span>{'{poliklinik}'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertVariable('{tanggal_hari_ini}')}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300/80 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sisipkan tanggal hari ini secara otomatis"
            >
              <span>+</span>
              <span>{'{tanggal_hari_ini}'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertVariable('{rs_nama}')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sisipkan identitas RSU Muhammadiyah Babat"
            >
              <span>+</span>
              <span>{'{rs_nama}'}</span>
            </button>
          </div>
        </div>

        {/* Message Editor Grid: Textarea on Left, Live WhatsApp Bubble on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Left: Textarea Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="broadcast-message-editor"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Editor Teks Pesan
              </label>
              <span className="text-[11px] text-slate-400">
                {messageTemplate.length} karakter
              </span>
            </div>
            <textarea
              id="broadcast-message-editor"
              ref={messageTextareaRef}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={12}
              className="w-full text-xs font-sans p-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] transition-all resize-y leading-relaxed text-slate-800 shadow-2xs"
              placeholder="Tuliskan format pesan broadcast di sini..."
            />
          </div>

          {/* Right: Live WhatsApp Bubble Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Live Pesan WhatsApp</span>
              </label>

              <button
                type="button"
                onClick={handleCopyPreview}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                title="Salin teks pesan pratinjau"
              >
                {copiedNotification ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks</span>
                  </>
                )}
              </button>
            </div>

            {/* WhatsApp Container Style */}
            <div className="bg-[#efeae2] border border-slate-300/80 rounded-xl p-4 min-h-[295px] flex flex-col justify-between shadow-inner relative overflow-hidden">
              {/* Header preview note */}
              <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200/80 mb-3 flex items-center justify-between text-[11px] text-slate-600 shadow-2xs">
                <span className="font-semibold text-slate-800">
                  Target: {currentPreviewPatient.namaPasien} ({currentPreviewPatient.nomorWhatsApp})
                </span>
                <span className="text-[10px] text-slate-500">
                  {currentPreviewPatient.poliklinik}
                </span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-slate-200/60 max-w-[95%] self-start relative text-xs text-slate-800 space-y-2 whitespace-pre-wrap leading-relaxed">
                <p>{compiledPreviewMessage}</p>
                <div className="text-[10px] text-slate-400 text-right flex items-center justify-end gap-1 pt-1">
                  <span>
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-emerald-600 font-bold">✓✓</span>
                </div>
              </div>

              {/* Footer preview note */}
              <div className="text-[10.5px] text-slate-500 text-center mt-3 italic">
                Pesan terenkripsi end-to-end resmi RSU Muhammadiyah Babat.
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            TOMBOL UTAMA: KIRIM PESAN KE SEMUA PASIEN TERPILIH
            ======================================================== */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-[#005d42] border border-emerald-200 shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Siap Mengirim ke {selectedPatients.length} Pasien Terpilih
              </p>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Sistem menyediakan modal eksekutor berurutan (Sequential Sender) dengan pengingat & auto-next.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Tombol Test Kirim Pasien Pertama */}
            <button
              type="button"
              onClick={() => {
                const target = selectedPatients[0] || patients[0];
                if (target) {
                  handleSendSinglePatient(target);
                } else {
                  showToast('Belum ada pasien yang tersedia untuk diuji.', 'error');
                }
              }}
              disabled={patients.length === 0}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              title="Kirim pesan uji coba ke pasien pertama pada daftar"
            >
              <span>🧪 Uji Kirim ke Pasien Pertama</span>
            </button>

            {/* Tombol Utama: Kirim Pesan ke Semua Pasien Terpilih */}
            <button
              type="button"
              id="btn-send-all-selected-broadcast"
              onClick={handleStartBulkDispatch}
              disabled={selectedPatients.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-[#005d42] hover:from-emerald-500 hover:to-[#004a35] active:from-emerald-700 active:to-[#003d2b] text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-emerald-200" />
              <span>🚀 Kirim Pesan ke Semua Pasien Terpilih ({selectedPatients.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL EKSEKUSI BROADCAST BERURUTAN (SEQUENTIAL SENDER)
          DILENGKAPI INDIKATOR PROGRESS BAR
          ======================================================== */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Eksekusi Broadcast WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mengirim pesan satu per satu secara aman dan terpantau
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDispatchModalOpen(false);
                  setIsAutoSending(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Indikator Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">
                  Kemajuan Pengiriman: Pasien {Math.min(dispatchIndex + 1, selectedPatients.length)} dari {selectedPatients.length}
                </span>
                <span className="text-emerald-700 font-bold font-mono">
                  {selectedPatients.length > 0
                    ? Math.round(((dispatchIndex) / selectedPatients.length) * 100)
                    : 0}%
                </span>
              </div>

              {/* Progress Bar Track & Fill */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#005d42] rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      selectedPatients.length > 0
                        ? Math.round(((dispatchIndex) / selectedPatients.length) * 100)
                        : 0
                    }%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Terkirim: {selectedPatients.filter((p) => p.statusKirim === 'Terkirim').length} pasien</span>
                <span>Sisa: {Math.max(0, selectedPatients.length - dispatchIndex)} pasien</span>
              </div>
            </div>

            {/* Active Patient Card */}
            {dispatchPatient ? (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-md">
                    Pasien Sedang Diproses (#{dispatchIndex + 1})
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {dispatchPatient.nomorWhatsApp}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {dispatchPatient.namaPasien}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {dispatchPatient.poliklinik} • {dispatchPatient.dokter}
                  </p>
                </div>

                {/* Message preview snippet */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans">
                  {compileBroadcastMessage(messageTemplate, dispatchPatient)}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold">Semua Pasien Telah Selesai Diproses!</h4>
                <p className="text-xs text-emerald-700">
                  Seluruh {selectedPatients.length} pasien terpilih telah diproses ke WhatsApp.
                </p>
              </div>
            )}

            {/* Action Buttons inside modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDispatchModalOpen(false);
                  setIsAutoSending(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup Sesi
              </button>

              {dispatchPatient && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSkipDispatchPatient}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Lewati pasien ini dan lanjut ke pasien berikutnya"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Lewati</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDispatchCurrentPatient(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>Buka WhatsApp Pasien Ini</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
