import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Search,
  Plus,
  User,
  Shield,
  FileText,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ExternalLink,
  ChevronRight,
  Info,
  Building2,
  Phone,
  Calendar,
  Layers,
  FileWarning,
  Eye,
  Check,
  X,
  CreditCard,
  Car
} from 'lucide-react';
import {
  RequirementChecklistItem,
  MissingDocumentSlip,
  GuarantorCategory,
  INITIAL_REQUIREMENTS_CHECKLIST
} from '../../types/requirementTypes';
import {
  loadRequirementChecklist,
  loadMissingDocumentSlips,
  saveMissingDocumentSlips,
  generateSlipNumber
} from '../../data/requirementData';
import { loadActiveStaff } from '../../data/headerData';

interface RegistrationRequirementsViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const RegistrationRequirementsView: React.FC<RegistrationRequirementsViewProps> = ({
  showToast
}) => {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'create_slip' | 'history_slips'>('checklist');

  // Category filter for checklist
  const [selectedCategory, setSelectedCategory] = useState<GuarantorCategory>('bpjs');
  const [searchQuery, setSearchQuery] = useState('');
  const [importanceFilter, setImportanceFilter] = useState<'all' | 'wajib' | 'kondisional'>('all');

  // Slips state
  const [slips, setSlips] = useState<MissingDocumentSlip[]>(() => loadMissingDocumentSlips());

  // Form state for creating missing document slip
  const [patientName, setPatientName] = useState('');
  const [noRm, setNoRm] = useState('');
  const [guarantor, setGuarantor] = useState('BPJS Kesehatan');
  const [roomOrClinic, setRoomOrClinic] = useState('Poli Penyakit Dalam');
  const [admissionDate, setAdmissionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deadlineHours, setDeadlineHours] = useState<number>(72);
  const [customDeadlineDate, setCustomDeadlineDate] = useState('');
  const [selectedMissingItems, setSelectedMissingItems] = useState<string[]>([
    'Surat Kontrol / SKDP Asli DPJP'
  ]);
  const [customItemInput, setCustomItemInput] = useState('');
  const [notes, setNotes] = useState('');

  // Slip for printing / modal preview
  const [activePrintSlip, setActivePrintSlip] = useState<MissingDocumentSlip | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const activeStaff = useMemo(() => loadActiveStaff(), []);

  // Listen to external updates
  useEffect(() => {
    const handleSlipsUpdate = () => {
      setSlips(loadMissingDocumentSlips());
    };
    window.addEventListener('rsumb_slips_updated', handleSlipsUpdate);
    return () => {
      window.removeEventListener('rsumb_slips_updated', handleSlipsUpdate);
    };
  }, []);

  // Filtered requirements
  const filteredChecklist = useMemo(() => {
    return INITIAL_REQUIREMENTS_CHECKLIST.filter((item) => {
      const matchCat = item.category === selectedCategory;
      const matchQuery =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchImportance =
        importanceFilter === 'all' || item.importance === importanceFilter;
      return matchCat && matchQuery && matchImportance;
    });
  }, [selectedCategory, searchQuery, importanceFilter]);

  // Available checklist items for the chosen guarantor in form
  const guarantorRequirements = useMemo(() => {
    let cat: GuarantorCategory = 'bpjs';
    if (guarantor.toLowerCase().includes('jasa raharja')) {
      cat = 'jasa_raharja';
    } else if (guarantor.toLowerCase().includes('umum') || guarantor.toLowerCase().includes('asuransi')) {
      cat = 'umum_asuransi';
    }
    return INITIAL_REQUIREMENTS_CHECKLIST.filter((i) => i.category === cat);
  }, [guarantor]);

  // Calculate deadline ISO string
  const calculatedDeadlineIso = useMemo(() => {
    if (customDeadlineDate) {
      return new Date(customDeadlineDate).toISOString();
    }
    const admissionMs = new Date(admissionDate).getTime() || Date.now();
    return new Date(admissionMs + deadlineHours * 60 * 60 * 1000).toISOString();
  }, [admissionDate, deadlineHours, customDeadlineDate]);

  // Format date helper
  const formatDateId = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return isoDate;
    }
  };

  const formatDateTimeId = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return (
        d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) +
        ' ' +
        d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }) +
        ' WIB'
      );
    } catch {
      return isoDate;
    }
  };

  // Toggle missing item selection
  const handleToggleMissingItem = (itemTitle: string) => {
    setSelectedMissingItems((prev) => {
      if (prev.includes(itemTitle)) {
        return prev.filter((i) => i !== itemTitle);
      } else {
        return [...prev, itemTitle];
      }
    });
  };

  // Add custom missing item
  const handleAddCustomItem = () => {
    if (!customItemInput.trim()) return;
    if (!selectedMissingItems.includes(customItemInput.trim())) {
      setSelectedMissingItems((prev) => [...prev, customItemInput.trim()]);
    }
    setCustomItemInput('');
  };

  // Create & Save Slip
  const handleCreateSlip = (shouldPrintNow: boolean = false) => {
    if (!patientName.trim()) {
      showToast?.('Nama pasien wajib diisi.', 'error');
      return;
    }
    if (!noRm.trim()) {
      showToast?.('Nomor Rekam Medis (No RM) wajib diisi.', 'error');
      return;
    }
    if (selectedMissingItems.length === 0) {
      showToast?.('Pilih minimal satu berkas yang belum lengkap.', 'error');
      return;
    }

    const newSlip: MissingDocumentSlip = {
      id: `slip-${Date.now()}`,
      slipNumber: generateSlipNumber(),
      patientName: patientName.trim(),
      noRm: noRm.trim(),
      guarantor,
      roomOrClinic,
      admissionDate,
      admissionTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      deadlineHours,
      deadlineDate: calculatedDeadlineIso,
      missingItems: [...selectedMissingItems],
      notes: notes.trim() || undefined,
      officerName: activeStaff.name,
      officerShift: activeStaff.shift,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updated = [newSlip, ...slips];
    setSlips(updated);
    saveMissingDocumentSlips(updated);

    showToast?.(`Slip #${newSlip.slipNumber} berhasil dibuat!`, 'success');

    if (shouldPrintNow) {
      setActivePrintSlip(newSlip);
      executeThermalPrint(newSlip);
    } else {
      setActivePrintSlip(newSlip);
      setIsPrintModalOpen(true);
    }

    // Reset form after saving
    setPatientName('');
    setNoRm('');
    setNotes('');
  };

  // Toggle status in history
  const handleToggleSlipStatus = (slipId: string) => {
    const updated = slips.map((s) => {
      if (s.id === slipId) {
        const nextStatus: 'pending' | 'resolved' = s.status === 'pending' ? 'resolved' : 'pending';
        return {
          ...s,
          status: nextStatus,
          resolvedAt: nextStatus === 'resolved' ? new Date().toISOString() : undefined
        };
      }
      return s;
    });
    setSlips(updated);
    saveMissingDocumentSlips(updated);
    showToast?.('Status berkas berhasil diperbarui!', 'success');
  };

  // Delete slip from history
  const handleDeleteSlip = (slipId: string) => {
    if (!window.confirm('Hapus slip kekurangan berkas ini dari riwayat?')) return;
    const updated = slips.filter((s) => s.id !== slipId);
    setSlips(updated);
    saveMissingDocumentSlips(updated);
    showToast?.('Slip berhasil dihapus dari riwayat.', 'info');
  };

  // Thermal 80mm Print generation
  const generateSlipHtml = (slip: MissingDocumentSlip) => {
    const itemsListHtml = slip.missingItems
      .map(
        (item, idx) => `
        <div style="display: flex; align-items: flex-start; margin-bottom: 5px; font-size: 11px;">
          <span style="font-weight: bold; width: 18px; shrink: 0;">${idx + 1}.</span>
          <div style="flex: 1;">
            <span style="font-weight: bold;">[ &nbsp; ] ${item}</span>
          </div>
        </div>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Slip Kekurangan Berkas - ${slip.patientName}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      html, body {
        width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        color: #000 !important;
        font-family: 'Courier New', Courier, monospace !important;
      }
      .thermal-slip {
        width: 80mm !important;
        box-sizing: border-box !important;
        padding: 4mm 5mm !important;
        margin: 0 auto !important;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 80mm;
      margin: 0 auto;
      padding: 5mm;
      font-family: 'Courier New', Courier, monospace;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .double-divider { border-top: 2px solid #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; font-size: 10.5px; line-height: 1.3; }
    .warning-box {
      border: 1.5px solid #000;
      padding: 4px;
      margin: 6px 0;
      font-size: 10px;
      text-align: center;
      line-height: 1.25;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="thermal-slip">
    <div class="text-center text-bold" style="font-size: 12px; line-height: 1.2;">RSU MUHAMMADIYAH BABAT</div>
    <div class="text-center" style="font-size: 9px; line-height: 1.2;">Jl. KH. Ahmad Dahlan No. 14 Babat, Lamongan</div>
    <div class="text-center" style="font-size: 9px;">Admisi &amp; Pendaftaran: (0322) 451125</div>
    <div class="double-divider"></div>
    <div class="text-center text-bold" style="font-size: 11.5px;">SLIP KEKURANGAN BERKAS</div>
    <div class="text-center" style="font-size: 9.5px; font-weight: bold;">(LEMBAR PENGINGAT PASIEN)</div>
    <div class="divider"></div>

    <div class="row"><span>No. Slip:</span><span class="text-bold">${slip.slipNumber}</span></div>
    <div class="row"><span>Tgl Berobat:</span><span>${slip.admissionDate} ${slip.admissionTime || ''}</span></div>
    <div class="row"><span>Nama Pasien:</span><span class="text-bold">${slip.patientName}</span></div>
    <div class="row"><span>No. RM:</span><span class="text-bold">${slip.noRm}</span></div>
    <div class="row"><span>Penjamin:</span><span class="text-bold">${slip.guarantor}</span></div>
    <div class="row"><span>Tujuan/Ruang:</span><span>${slip.roomOrClinic}</span></div>
    <div class="divider"></div>

    <div style="font-size: 10.5px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">
      BERKAS YANG BELUM LENGKAP:
    </div>
    ${itemsListHtml}

    ${
      slip.notes
        ? `<div style="font-size: 10px; font-style: italic; margin-top: 4px; border-left: 2px solid #000; padding-left: 4px;">
            Catatan: ${slip.notes}
           </div>`
        : ''
    }

    <div class="warning-box">
      ⚠️ BATAS WAKTU PENYERAHAN:<br>
      <span style="font-size: 11.5px; font-weight: 900;">${formatDateTimeId(slip.deadlineDate)}</span><br>
      (Maksimal ${slip.deadlineHours} Jam / 3x24 Jam Hari Kerja)
    </div>

    <div style="font-size: 9px; text-align: justify; line-height: 1.2; margin-top: 4px;">
      * Harap menyerahkan berkas kekurangan ke <strong>Loket Admisi &amp; Pendaftaran RSUMB</strong> sebelum batas waktu berakhir.
      * Keterlambatan kelengkapan berkas dapat mengakibatkan penjaminan beralih ke tarif <strong>UMUM / MANDIRI</strong>.
    </div>

    <div class="divider" style="margin-top: 8px;"></div>
    <div style="display: flex; justify-content: space-between; font-size: 9.5px; margin-top: 8px; text-align: center;">
      <div style="width: 45%;">
        Pasien / Keluarga,
        <br><br><br>
        (..................)
      </div>
      <div style="width: 45%;">
        Petugas Admisi,
        <br><br><br>
        ( ${slip.officerName} )
      </div>
    </div>

    <div class="text-center" style="font-size: 8.5px; margin-top: 10px; color: #444;">
      Dicetak otomatis oleh SIMRS RSUMB<br>
      Waktu Cetak: ${new Date().toLocaleString('id-ID')}
    </div>
    <div style="text-align: center; margin-top: 10px; font-size: 8px;">--------- GUNTING DI SINI ---------</div>
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;
  };

  // Trigger thermal print
  const executeThermalPrint = (slip: MissingDocumentSlip) => {
    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (!printWindow) {
      showToast?.('Izinkan pop-up peramban untuk mencetak slip thermal.', 'error');
      return;
    }
    printWindow.document.write(generateSlipHtml(slip));
    printWindow.document.close();
  };

  const pendingSlipsCount = useMemo(() => {
    return slips.filter((s) => s.status === 'pending').length;
  }, [slips]);

  return (
    <div className="space-y-6">
      {/* 1. HERO HEADER BANNER */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-[#005d42] to-emerald-950 rounded-3xl text-white shadow-lg border border-emerald-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/50 text-emerald-200 text-xs font-bold border border-emerald-600/60 mb-2">
              <FileCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Standar Operasional Prosedur (SOP) Admisi RSUMB</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Persyaratan Pendaftaran &amp; Checklist Berkas
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Panduan lengkap verifikasi syarat pendaftaran rawat jalan &amp; rawat inap untuk seluruh penjamin (BPJS, Umum, Asuransi Swasta, dan Jasa Raharja) serta pencetakan slip kekurangan berkas thermal 80mm.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Pending Berkas</span>
              <span className="text-lg font-black text-white">{pendingSlipsCount} Pasien</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('create_slip')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Slip Kekurangan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('checklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'checklist'
                ? 'bg-[#005d42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Katalog Persyaratan Penjamin</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === 'checklist' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {INITIAL_REQUIREMENTS_CHECKLIST.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('create_slip')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'create_slip'
                ? 'bg-[#005d42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Buat &amp; Cetak Slip Kekurangan (80mm)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history_slips')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'history_slips'
                ? 'bg-[#005d42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileWarning className="w-4 h-4" />
            <span>Riwayat Lembar Pengingat Pasien</span>
            {pendingSlipsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingSlipsCount} Menunggu
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          Petugas Jaga: <span className="font-bold text-slate-800">{activeStaff.name}</span> ({activeStaff.shift})
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: CHECKLIST PERSYARATAN BERDASARKAN PENJAMIN */}
      {/* ============================================================== */}
      {activeSubTab === 'checklist' && (
        <div className="space-y-6">
          {/* Guarantor Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* BPJS */}
            <button
              type="button"
              onClick={() => setSelectedCategory('bpjs')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedCategory === 'bpjs'
                  ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                selectedCategory === 'bpjs' ? 'bg-[#005d42] text-white' : 'bg-emerald-100 text-[#005d42]'
              }`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">BPJS Kesehatan &amp; Naker</h4>
                <p className="text-xs text-slate-500 mt-0.5">SEP, SKDP Surat Kontrol, Rujukan 90 hari, KTP/KK, KIS Mobile JKN</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Regulasi VClaim
                  </span>
                  <span className="text-[10px] text-slate-400">• 8 Berkas</span>
                </div>
              </div>
            </button>

            {/* Umum / Asuransi Swasta */}
            <button
              type="button"
              onClick={() => setSelectedCategory('umum_asuransi')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedCategory === 'umum_asuransi'
                  ? 'bg-blue-50 border-blue-400 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                selectedCategory === 'umum_asuransi' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Umum &amp; Asuransi Swasta</h4>
                <p className="text-xs text-slate-500 mt-0.5">KTP/Identitas, Kartu Asuransi, Guarantee Letter (GL), Form Klaim</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Cashless &amp; Mandiri
                  </span>
                  <span className="text-[10px] text-slate-400">• 6 Berkas</span>
                </div>
              </div>
            </button>

            {/* Jasa Raharja */}
            <button
              type="button"
              onClick={() => setSelectedCategory('jasa_raharja')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedCategory === 'jasa_raharja'
                  ? 'bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                selectedCategory === 'jasa_raharja' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Kasus KLL / Jasa Raharja</h4>
                <p className="text-xs text-slate-500 mt-0.5">Laporan Polisi (LP), Surat Jaminan JR (20 Jt), Kronologi TKP, SIM &amp; STNK</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Plafon Rp 20.000.000
                  </span>
                  <span className="text-[10px] text-slate-400">• 7 Berkas</span>
                </div>
              </div>
            </button>
          </div>

          {/* Search & Importance Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama berkas, kode dokumen, atau regulasi..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Prioritas:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setImportanceFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    importanceFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setImportanceFilter('wajib')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    importanceFilter === 'wajib' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Wajib
                </button>
                <button
                  type="button"
                  onClick={() => setImportanceFilter('kondisional')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    importanceFilter === 'kondisional' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kondisional
                </button>
              </div>
            </div>
          </div>

          {/* Checklist Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChecklist.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                        {item.code}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          item.importance === 'wajib'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.importance === 'kondisional'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.importance === 'wajib' ? '★ WAJIB' : item.importance === 'kondisional' ? 'KONDISIONAL' : 'PENDUKUNG'}
                      </span>
                      {item.validityPeriod && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{item.validityPeriod}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#005d42] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  {item.tips && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-[11px] text-slate-700 flex items-start gap-2 leading-relaxed">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">Petunjuk Admisi: </span>
                        {item.tips}
                      </div>
                    </div>
                  )}

                  {item.legalNote && (
                    <div className="mt-1.5 text-[10px] text-slate-500 font-mono italic">
                      Dasar: {item.legalNote}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedCategory === 'bpjs'
                      ? 'Penjamin: BPJS Kesehatan'
                      : selectedCategory === 'jasa_raharja'
                      ? 'Penjamin: Jasa Raharja'
                      : 'Penjamin: Asuransi / Umum'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedMissingItems.includes(item.title)) {
                        setSelectedMissingItems((prev) => [...prev, item.title]);
                      }
                      setActiveSubTab('create_slip');
                      showToast?.(`"${item.title}" ditambahkan ke lembar slip kekurangan!`, 'info');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#005d42] text-xs font-bold border border-emerald-200 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Masukkan ke Slip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: BUAT SLIP KEKURANGAN BERKAS (THERMAL 80MM) */}
      {/* ============================================================== */}
      {activeSubTab === 'create_slip' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Left Side (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-[#005d42]" />
                  <span>Formulir Slip Kekurangan Berkas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centang dokumen yang belum diserahkan pasien untuk dicetak pada struk thermal 80mm.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Format: 80mm
              </span>
            </div>

            {/* Patient & Admission Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pasien <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Contoh: Ny. Siti Rahayu"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Rekam Medis (No RM) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={noRm}
                  onChange={(e) => setNoRm(e.target.value)}
                  placeholder="Contoh: 26-10-884"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Penjamin Pasien
                </label>
                <select
                  value={guarantor}
                  onChange={(e) => setGuarantor(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
                >
                  <option value="BPJS Kesehatan">BPJS Kesehatan (VClaim)</option>
                  <option value="BPJS Ketenagakerjaan">BPJS Ketenagakerjaan (Kecelakaan Kerja)</option>
                  <option value="Jasa Raharja">Jasa Raharja (Kecelakaan Lalu Lintas - 20jt)</option>
                  <option value="Asuransi Swasta">Asuransi Swasta Rekanan (AdMedika/Allianz/Prudential)</option>
                  <option value="Umum / Mandiri">Pasien Umum / Biaya Mandiri</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ruangan / Poli Tujuan
                </label>
                <input
                  type="text"
                  value={roomOrClinic}
                  onChange={(e) => setRoomOrClinic(e.target.value)}
                  placeholder="Contoh: Poli Orthopedi / Pav. Shafa 2"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Berobat / Masuk
                </label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batas Waktu Penyerahan (Deadline)
                </label>
                <select
                  value={deadlineHours}
                  onChange={(e) => {
                    setDeadlineHours(Number(e.target.value));
                    setCustomDeadlineDate('');
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
                >
                  <option value={72}>3x24 Jam Hari Kerja (Standar BPJS/RSUMB)</option>
                  <option value={48}>2x24 Jam (2 Hari)</option>
                  <option value={24}>1x24 Jam (Besok Pagi)</option>
                  <option value={120}>5 Hari Kerja</option>
                </select>
              </div>
            </div>

            {/* Checklist of Missing Items */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                  Pilih Berkas yang BELUM LENGKAP:
                </label>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {selectedMissingItems.length} Berkas Dipilih
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {guarantorRequirements.map((item) => {
                  const isChecked = selectedMissingItems.includes(item.title);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMissingItem(item.title)}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate">{item.title}</p>
                        <span className="text-[10px] text-slate-400 font-normal">{item.code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Add Custom Missing Item */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customItemInput}
                  onChange={(e) => setCustomItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomItem();
                    }
                  }}
                  placeholder="Tambahkan berkas khusus lainnya (contoh: Surat Keterangan Saksi KLL)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  disabled={!customItemInput.trim()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Tambahan untuk Pasien (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Contoh: Rujukan FKTP habis masa berlaku per hari ini, segera minta pembaruan ke Puskesmas..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => handleCreateSlip(true)}
                className="flex-1 py-3 px-4 bg-[#005d42] hover:bg-[#004732] text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-emerald-200" />
                <span>Cetak Slip Thermal Sekarang (80mm)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCreateSlip(false)}
                className="py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Simpan Tanpa Cetak
              </button>
            </div>
          </div>

          {/* Thermal Slip Live Preview Right Side (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-100 p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-inner flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Pratinjau Struk Thermal 80mm</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">80mm Paper Width</span>
            </div>

            {/* Paper Preview Card */}
            <div className="w-full max-w-[340px] bg-white text-black p-4 rounded-xl shadow-lg border border-slate-300 font-mono text-[11px] leading-tight space-y-2 select-none">
              <div className="text-center font-bold text-xs uppercase tracking-tight">
                RSU MUHAMMADIYAH BABAT
              </div>
              <div className="text-center text-[9px] text-slate-600">
                Jl. KH. Ahmad Dahlan No. 14 Babat, Lamongan<br />
                Hotline Admisi: (0322) 451125
              </div>
              <div className="border-t-2 border-dashed border-black my-1" />
              <div className="text-center font-black text-[11px] tracking-wide uppercase">
                SLIP KEKURANGAN BERKAS
              </div>
              <div className="text-center text-[9px] font-bold text-slate-600">
                (LEMBAR PENGINGAT PASIEN)
              </div>
              <div className="border-t border-dashed border-black my-1" />

              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pasien:</span>
                  <span className="font-bold truncate max-w-[170px]">{patientName || 'Nama Pasien'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No RM:</span>
                  <span className="font-bold">{noRm || 'XX-XX-XX'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penjamin:</span>
                  <span className="font-bold">{guarantor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tujuan:</span>
                  <span>{roomOrClinic || '-'}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black my-1" />

              <div className="font-bold text-[10.5px] uppercase">BERKAS BELUM LENGKAP:</div>
              <div className="space-y-1 pl-1">
                {selectedMissingItems.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">Belum ada berkas yang dipilih</p>
                ) : (
                  selectedMissingItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[10.5px] font-bold">
                      <span>{idx + 1}.</span>
                      <span>[  ] {item}</span>
                    </div>
                  ))
                )}
              </div>

              {notes && (
                <div className="text-[9.5px] italic border-l-2 border-black pl-2 py-0.5 mt-1 text-slate-700">
                  Catatan: {notes}
                </div>
              )}

              {/* Deadline Box */}
              <div className="border-2 border-black p-2 text-center rounded-xs mt-2 bg-slate-50">
                <div className="text-[9px] uppercase font-bold text-slate-700">Batas Waktu Penyerahan:</div>
                <div className="font-black text-xs text-rose-600 mt-0.5">
                  {formatDateTimeId(calculatedDeadlineIso)}
                </div>
                <div className="text-[8.5px] text-slate-600">(Maksimal {deadlineHours} Jam Kerja)</div>
              </div>

              <div className="text-[8.5px] text-slate-600 leading-tight pt-1">
                * Harap serahkan berkas ke <strong>Loket Admisi RSUMB</strong>. Bila melebihi batas waktu, penjaminan otomatis beralih ke <strong>UMUM / MANDIRI</strong>.
              </div>

              <div className="border-t border-dashed border-black my-1" />

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-[9px] pt-1">
                <div>
                  Pasien / Keluarga,<br /><br /><br />
                  (................)
                </div>
                <div>
                  Petugas Admisi,<br /><br /><br />
                  ({activeStaff.name})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: RIWAYAT SLIP KEKURANGAN BERKAS */}
      {/* ============================================================== */}
      {activeSubTab === 'history_slips' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-amber-600" />
                <span>Daftar Slip Kekurangan Berkas yang Diterbitkan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor batas waktu penyerahan berkas pasien dan tandai jika dokumen telah diserahkan (selesai).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Total: {slips.length} Slip</span>
            </div>
          </div>

          {slips.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">Belum ada slip kekurangan berkas</p>
              <p className="text-xs text-slate-400 mt-0.5">Seluruh berkas pendaftaran pasien tercatat lengkap.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slips.map((slip) => {
                const isPending = slip.status === 'pending';
                const isOverdue = isPending && new Date(slip.deadlineDate).getTime() < Date.now();

                return (
                  <div
                    key={slip.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isOverdue
                        ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-400/30'
                        : isPending
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-slate-50/70 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                          {slip.slipNumber}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isOverdue
                              ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isOverdue ? '⚠️ MELEBIHI BATAS (OVERDUE)' : isPending ? '⏳ MENUNGGU BERKAS' : '✓ SELESAI / LENGKAP'}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {slip.guarantor}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <h4 className="font-black text-base text-slate-900">{slip.patientName}</h4>
                        <span className="font-mono text-xs text-slate-500 font-bold">(RM: {slip.noRm})</span>
                        <span className="text-xs text-slate-400">• {slip.roomOrClinic}</span>
                      </div>

                      {/* Missing Items Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-600">Kekurangan:</span>
                        {slip.missingItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-rose-200 text-rose-800 shadow-2xs"
                          >
                            • {item}
                          </span>
                        ))}
                      </div>

                      {slip.notes && (
                        <p className="text-xs text-slate-600 italic">Catatan: {slip.notes}</p>
                      )}

                      <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                        <span>Tgl Dibuat: {formatDateTimeId(slip.createdAt)}</span>
                        <span>• Petugas: {slip.officerName}</span>
                        <span className="font-bold text-rose-700">
                          Batas: {formatDateTimeId(slip.deadlineDate)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => executeThermalPrint(slip)}
                        className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                        title="Cetak ulang slip struk thermal 80mm"
                      >
                        <Printer className="w-4 h-4 text-emerald-700" />
                        <span>Cetak Ulang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSlipStatus(slip.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isPending
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{isPending ? 'Tandai Lengkap' : 'Batal Lengkap'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlip(slip.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Hapus slip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
