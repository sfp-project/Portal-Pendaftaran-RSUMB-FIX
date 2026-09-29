import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  ShieldAlert,
  CreditCard,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Eye,
  ExternalLink,
  ChevronRight,
  Printer,
  Sparkles,
  Check,
  X,
  RefreshCw,
  HelpCircle,
  FileDown
} from 'lucide-react';
import {
  PatientNotesTab,
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord,
  PatientShiftHandoverRecord,
  PenjaminKll
} from '../../types/patientNotesTypes';
import {
  loadKllRecords,
  saveKllRecords,
  loadBpjsKendalaRecords,
  saveBpjsKendalaRecords,
  loadAsuransiSwastaRecords,
  saveAsuransiSwastaRecords,
  loadUmumBeresikoRecords,
  saveUmumBeresikoRecords,
  loadShiftHandoverRecords,
  saveShiftHandoverRecords
} from '../../data/patientNotesData';
import { KllFormModal } from './KllFormModal';
import { BpjsKendalaModal } from './BpjsKendalaModal';
import { AsuransiSwastaModal } from './AsuransiSwastaModal';
import { UmumBeresikoModal } from './UmumBeresikoModal';
import { LpFileViewerModal } from './LpFileViewerModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { PatientNotesPrintModal } from './PatientNotesPrintModal';
import { HandoverCardModal, HandoverCardData } from './HandoverCardModal';
import { ShiftHandoverDashboard } from './ShiftHandoverDashboard';
import { logSystemActivity } from '../../data/auditLogData';
import { loadActiveStaff } from '../../data/headerData';

interface PatientNotesViewProps {
  showToast: (msg: string) => void;
}

export const PatientNotesView: React.FC<PatientNotesViewProps> = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<PatientNotesTab>('kll');
  const [searchTerm, setSearchTerm] = useState('');

  // Sub-filter states
  const [kllPenjaminFilter, setKllPenjaminFilter] = useState<string>('all');
  const [kllInsidenFilter, setKllInsidenFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [bpjsStatusFilter, setBpjsStatusFilter] = useState<'all' | 'Pending' | 'Resolved'>('all');
  const [asuransiFilter, setAsuransiFilter] = useState<string>('all');
  const [umumPotensiFilter, setUmumPotensiFilter] = useState<string>('all');

  // Master Data Collections
  const [kllRecords, setKllRecords] = useState<PatientKllRecord[]>(() => loadKllRecords());
  const [bpjsRecords, setBpjsRecords] = useState<PatientBpjsKendalaRecord[]>(() => loadBpjsKendalaRecords());
  const [asuransiRecords, setAsuransiRecords] = useState<PatientAsuransiSwastaRecord[]>(() => loadAsuransiSwastaRecords());
  const [umumRecords, setUmumRecords] = useState<PatientUmumBeresikoRecord[]>(() => loadUmumBeresikoRecords());
  const [handoverRecords, setHandoverRecords] = useState<PatientShiftHandoverRecord[]>(() => loadShiftHandoverRecords());

  // Modals state
  const [isKllModalOpen, setIsKllModalOpen] = useState(false);
  const [selectedKllForEdit, setSelectedKllForEdit] = useState<PatientKllRecord | null>(null);

  const [isBpjsModalOpen, setIsBpjsModalOpen] = useState(false);
  const [selectedBpjsForEdit, setSelectedBpjsForEdit] = useState<PatientBpjsKendalaRecord | null>(null);

  const [isAsuransiModalOpen, setIsAsuransiModalOpen] = useState(false);
  const [selectedAsuransiForEdit, setSelectedAsuransiForEdit] = useState<PatientAsuransiSwastaRecord | null>(null);

  const [isUmumModalOpen, setIsUmumModalOpen] = useState(false);
  const [selectedUmumForEdit, setSelectedUmumForEdit] = useState<PatientUmumBeresikoRecord | null>(null);

  const [selectedKllForLpViewer, setSelectedKllForLpViewer] = useState<PatientKllRecord | null>(null);
  const [handoverCardTarget, setHandoverCardTarget] = useState<HandoverCardData | null>(null);

  // Print & Delete Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    nama: string;
    noRm?: string;
    tab: PatientNotesTab;
    categoryLabel: string;
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveKllRecords(kllRecords);
  }, [kllRecords]);

  useEffect(() => {
    saveBpjsKendalaRecords(bpjsRecords);
  }, [bpjsRecords]);

  useEffect(() => {
    saveAsuransiSwastaRecords(asuransiRecords);
  }, [asuransiRecords]);

  useEffect(() => {
    saveUmumBeresikoRecords(umumRecords);
  }, [umumRecords]);

  useEffect(() => {
    saveShiftHandoverRecords(handoverRecords);
  }, [handoverRecords]);

  // Statistics
  const activeKllIncidentsCount = useMemo(() => {
    return kllRecords.filter((r) => r.isInsidenActive).length;
  }, [kllRecords]);

  const pendingBpjsCount = useMemo(() => {
    return bpjsRecords.filter((r) => r.status === 'Pending').length;
  }, [bpjsRecords]);

  const pendingGlAsuransiCount = useMemo(() => {
    return asuransiRecords.filter((r) => r.statusKlaim.includes('Menunggu') || r.statusKlaim.includes('Excess')).length;
  }, [asuransiRecords]);

  const highRiskUmumCount = useMemo(() => {
    return umumRecords.length;
  }, [umumRecords]);

  const pendingHandoverCount = useMemo(() => {
    return handoverRecords.filter((r) => r.status === 'Pending').length;
  }, [handoverRecords]);

  // Tab 1: KLL Handlers
  const handleSaveKll = (record: PatientKllRecord) => {
    setKllRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });
    showToast(`Data Pasien KLL ${record.namaPasien} berhasil disimpan.`);
  };

  const handleToggleKllInsiden = (id: string) => {
    setKllRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, isInsidenActive: !r.isInsidenActive, updatedAt: new Date().toISOString() };
          showToast(`Status insiden ${r.namaPasien} diubah menjadi ${updated.isInsidenActive ? 'AKTIF' : 'NON-AKTIF'}.`);
          return updated;
        }
        return r;
      })
    );
  };

  const handleDeleteKll = (id: string, name: string) => {
    setKllRecords((prev) => prev.filter((r) => r.id !== id));
    showToast(`Data KLL ${name} dihapus.`);
  };

  // Tab 2: BPJS Kendala Handlers
  const handleSaveBpjs = (record: PatientBpjsKendalaRecord) => {
    setBpjsRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });

    try {
      const staffName = loadActiveStaff().name;
      logSystemActivity(
        'Pencatatan Kendala BPJS',
        `Kendala BPJS Pasien ${record.namaPasien} (${record.noRm}) dicatat: ${record.jenisKendala} - Status: ${record.status}.`,
        staffName,
        'SEP_BPJS',
        'Catatan Pasien'
      );
    } catch (e) {
      console.warn('Notice logging BPJS kendala:', e);
    }

    showToast(`Kendala BPJS ${record.namaPasien} berhasil disimpan.`);
  };

  const handleToggleBpjsStatus = (id: string) => {
    setBpjsRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus =
            r.status === 'Pending' ? 'Resolved (cetak SEP)' : 'Pending';
          const updated: PatientBpjsKendalaRecord = {
            ...r,
            status: nextStatus,
            updatedAt: new Date().toISOString()
          };

          try {
            const staffName = loadActiveStaff().name;
            logSystemActivity(
              'Pembaruan Status SEP BPJS',
              `Status kendala SEP BPJS Pasien ${r.namaPasien} (${r.noRm}) diubah menjadi "${nextStatus}".`,
              staffName,
              'SEP_BPJS',
              'Catatan Pasien'
            );
          } catch (e) {
            console.warn('Notice logging BPJS status:', e);
          }

          showToast(`Status kendala BPJS ${r.namaPasien} diubah menjadi ${nextStatus}.`);
          return updated;
        }
        return r;
      })
    );
  };

  // Tab 3: Asuransi Swasta Handlers
  const handleSaveAsuransi = (record: PatientAsuransiSwastaRecord) => {
    setAsuransiRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });
    showToast(`Catatan asuransi ${record.namaPasien} berhasil disimpan.`);
  };

  // Tab 4: UMUM Beresiko Handlers
  const handleSaveUmum = (record: PatientUmumBeresikoRecord) => {
    setUmumRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });
    showToast(`Data UMUM Beresiko ${record.namaPasien} berhasil disimpan.`);
  };

  // Tab 5: Shift Handover Handlers
  const handleSaveHandover = (record: PatientShiftHandoverRecord) => {
    setHandoverRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });

    try {
      const staffName = record.petugasAsal || loadActiveStaff().name;
      logSystemActivity(
        'Penyimpanan Catatan Handover Shift',
        `Catatan operan ${record.shift} untuk Pasien ${record.namaPasien} (${record.noRm}) disimpan. Catatan: "${(record.masalah || '').slice(0, 90)}..."`,
        staffName,
        'HANDOVER_SHIFT',
        'Catatan Pasien'
      );
    } catch (e) {
      console.warn('Notice logging handover record:', e);
    }

    showToast(`Catatan Handover untuk pasien "${record.namaPasien}" berhasil disimpan.`);
  };

  const handleToggleHandoverStatus = (id: string) => {
    setHandoverRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newStatus = r.status === 'Pending' ? 'Handled' : 'Pending';

          try {
            const staffName = loadActiveStaff().name;
            logSystemActivity(
              'Penyelesaian Catatan Handover',
              `Catatan handover Pasien ${r.namaPasien} (${r.noRm}) ditandai sebagai "${newStatus}".`,
              staffName,
              'HANDOVER_SHIFT',
              'Catatan Pasien'
            );
          } catch (e) {
            console.warn('Notice logging handover status:', e);
          }

          showToast(
            newStatus === 'Handled'
              ? `Catatan pasien ${r.namaPasien} ditandai SELESAI.`
              : `Catatan pasien ${r.namaPasien} dibuka kembali (PENDING).`
          );
          return {
            ...r,
            status: newStatus,
            handledAt: newStatus === 'Handled' ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      })
    );
  };

  // Centralized Delete Confirmation Handler
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { id, nama, tab } = deleteTarget;

    if (tab === 'kll') {
      setKllRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data Pasien KLL "${nama}" berhasil dihapus.`);
    } else if (tab === 'bpjs_kendala') {
      setBpjsRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data Kendala BPJS "${nama}" berhasil dihapus.`);
    } else if (tab === 'asuransi_swasta') {
      setAsuransiRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data Asuransi Swasta "${nama}" berhasil dihapus.`);
    } else if (tab === 'umum_beresiko') {
      setUmumRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data Pasien UMUM Beresiko "${nama}" berhasil dihapus.`);
    } else if (tab === 'handover_shift') {
      setHandoverRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Catatan Handover "${nama}" berhasil dihapus.`);
    }
    setDeleteTarget(null);
  };

  // Filtered lists based on search (by No. RM or Nama Pasien)
  const filteredKllList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return kllRecords.filter((r) => {
      const matchSearch =
        !q ||
        (r.namaPasien && r.namaPasien.toLowerCase().includes(q)) ||
        (r.noRm && r.noRm.toLowerCase().includes(q)) ||
        (r.statusLp && r.statusLp.toLowerCase().includes(q));

      const matchPenjamin = kllPenjaminFilter === 'all' || r.penjamin === kllPenjaminFilter;
      const matchInsiden =
        kllInsidenFilter === 'all' ||
        (kllInsidenFilter === 'active' && r.isInsidenActive) ||
        (kllInsidenFilter === 'inactive' && !r.isInsidenActive);

      return matchSearch && matchPenjamin && matchInsiden;
    });
  }, [kllRecords, searchTerm, kllPenjaminFilter, kllInsidenFilter]);

  const filteredBpjsList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bpjsRecords.filter((r) => {
      const matchSearch =
        !q ||
        (r.namaPasien && r.namaPasien.toLowerCase().includes(q)) ||
        (r.noRm && r.noRm.toLowerCase().includes(q)) ||
        (r.noKartuBpjs && r.noKartuBpjs.toLowerCase().includes(q)) ||
        (r.jenisKendala && r.jenisKendala.toLowerCase().includes(q));

      const matchStatus =
        bpjsStatusFilter === 'all' ||
        (bpjsStatusFilter === 'Pending' && r.status === 'Pending') ||
        (bpjsStatusFilter === 'Resolved' &&
          (r.status === 'Resolved (cetak SEP)' || r.status === 'Resolved'));

      return matchSearch && matchStatus;
    });
  }, [bpjsRecords, searchTerm, bpjsStatusFilter]);

  const filteredAsuransiList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return asuransiRecords.filter((r) => {
      const matchSearch =
        !q ||
        (r.namaPasien && r.namaPasien.toLowerCase().includes(q)) ||
        (r.noRm && r.noRm.toLowerCase().includes(q)) ||
        (r.namaAsuransi && r.namaAsuransi.toLowerCase().includes(q));

      const matchAsuransi = asuransiFilter === 'all' || r.namaAsuransi.toLowerCase().includes(asuransiFilter.toLowerCase());

      return matchSearch && matchAsuransi;
    });
  }, [asuransiRecords, searchTerm, asuransiFilter]);

  const filteredUmumList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return umumRecords.filter((r) => {
      const matchSearch =
        !q ||
        (r.namaPasien && r.namaPasien.toLowerCase().includes(q)) ||
        (r.noRm && r.noRm.toLowerCase().includes(q)) ||
        (r.kronologiMasalah && r.kronologiMasalah.toLowerCase().includes(q)) ||
        (r.potensiMasalah && r.potensiMasalah.some((p) => p.toLowerCase().includes(q)));

      const matchPotensi =
        umumPotensiFilter === 'all' ||
        (r.potensiMasalah && r.potensiMasalah.includes(umumPotensiFilter));

      return matchSearch && matchPotensi;
    });
  }, [umumRecords, searchTerm, umumPotensiFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b2847] via-[#103a66] to-[#0d4f7c] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full bg-blue-400/20 text-blue-200 text-xs font-bold uppercase tracking-wider border border-blue-300/30">
                Admisi & Rekam Medis
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold">
                RSU Muhammadiyah Babat
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Catatan Khusus Pasien
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Monitoring terpadu kasus Kecelakaan Lalu Lintas (KLL & Jasa Raharja), kendala bridging kepesertaan BPJS, koordinasi jaminan Asuransi Swasta, serta early-warning pasien UMUM berisiko.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              <span>Cetak Rekap</span>
            </button>
            <button
              onClick={() => {
                if (activeSubTab === 'kll') {
                  setSelectedKllForEdit(null);
                  setIsKllModalOpen(true);
                } else if (activeSubTab === 'bpjs_kendala') {
                  setSelectedBpjsForEdit(null);
                  setIsBpjsModalOpen(true);
                } else if (activeSubTab === 'asuransi_swasta') {
                  setSelectedAsuransiForEdit(null);
                  setIsAsuransiModalOpen(true);
                } else {
                  setSelectedUmumForEdit(null);
                  setIsUmumModalOpen(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pasien</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="mt-6 pt-4 border-t border-blue-400/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-300">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">Insiden KLL Aktif</div>
              <div className="text-sm font-bold text-white">{activeKllIncidentsCount} Pasien</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">BPJS Pending</div>
              <div className="text-sm font-bold text-amber-300">{pendingBpjsCount} Kasus</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-violet-500/30 flex items-center justify-center text-violet-300">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">Asuransi Swasta</div>
              <div className="text-sm font-bold text-white">{asuransiRecords.length} Terdata</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">UMUM Beresiko</div>
              <div className="text-sm font-bold text-rose-300">{highRiskUmumCount} Pasien</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-teal-500/30 flex items-center justify-center text-teal-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-200 font-medium">Handover Shift</div>
              <div className="text-sm font-bold text-emerald-300">{pendingHandoverCount} Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 TOP TAB TRIGGERS (SPECIFICATION COMPLIANCE) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* TAB 1 */}
          <button
            onClick={() => setActiveSubTab('kll')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'kll'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-blue-600'
            }`}
          >
            <span>🚗</span>
            <span>Pasien KLL</span>
            <span
              className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeSubTab === 'kll' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {kllRecords.length}
            </span>
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setActiveSubTab('bpjs_kendala')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'bpjs_kendala'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
            }`}
          >
            <span>🟢</span>
            <span>BPJS Kendala</span>
            {pendingBpjsCount > 0 ? (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'bpjs_kendala' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {pendingBpjsCount} Pnd
              </span>
            ) : (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'bpjs_kendala' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {bpjsRecords.length}
              </span>
            )}
          </button>

          {/* TAB 3 */}
          <button
            onClick={() => setActiveSubTab('asuransi_swasta')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'asuransi_swasta'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-violet-600'
            }`}
          >
            <span>💳</span>
            <span>Asuransi Swasta</span>
            <span
              className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeSubTab === 'asuransi_swasta' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-800'
              }`}
            >
              {asuransiRecords.length}
            </span>
          </button>

          {/* TAB 4 */}
          <button
            onClick={() => setActiveSubTab('umum_beresiko')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'umum_beresiko'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-amber-600'
            }`}
          >
            <span>⚠️</span>
            <span>UMUM Beresiko</span>
            <span
              className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeSubTab === 'umum_beresiko' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {umumRecords.length}
            </span>
          </button>

          {/* TAB 5: Handover Shift Admisi */}
          <button
            onClick={() => setActiveSubTab('handover_shift')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'handover_shift'
                ? 'bg-[#005d42] text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#005d42]'
            }`}
          >
            <span>🔄</span>
            <span>Handover Shift</span>
            {pendingHandoverCount > 0 ? (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'handover_shift' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {pendingHandoverCount} Pnd
              </span>
            ) : (
              <span
                className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeSubTab === 'handover_shift' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {handoverRecords.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONDITIONAL VIEW: TAB 5 SHIFT HANDOVER vs TABS 1-4 */}
      {activeSubTab === 'handover_shift' ? (
        <ShiftHandoverDashboard
          records={handoverRecords}
          onSaveRecord={handleSaveHandover}
          onToggleStatus={handleToggleHandoverStatus}
          onDeleteRecord={(id, namaPasien) => {
            setDeleteTarget({
              id,
              nama: namaPasien,
              tab: 'handover_shift',
              categoryLabel: 'Catatan Handover Shift'
            });
          }}
          showToast={showToast}
        />
      ) : (
        <>
          {/* GLOBAL FILTER BAR & SEARCH BAR */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan Nama Pasien atau No. RM secara dinamis..."
            className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab-Specific Sub-Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'kll' && (
            <>
              <select
                value={kllPenjaminFilter}
                onChange={(e) => setKllPenjaminFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Penjamin</option>
                <option value="Jasa Raharja">Jasa Raharja</option>
                <option value="BPJS Ketenagakerjaan">BPJS Ketenagakerjaan</option>
                <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                <option value="Umum">Umum</option>
              </select>

              <select
                value={kllInsidenFilter}
                onChange={(e) => setKllInsidenFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Status Insiden</option>
                <option value="active">Insiden Aktif Sahaja</option>
                <option value="inactive">Insiden Selesai</option>
              </select>
            </>
          )}

          {activeSubTab === 'bpjs_kendala' && (
            <select
              value={bpjsStatusFilter}
              onChange={(e) => setBpjsStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Pending">Pending (Belum Tuntas)</option>
              <option value="Resolved">Resolved (cetak SEP)</option>
            </select>
          )}

          {activeSubTab === 'umum_beresiko' && (
            <select
              value={umumPotensiFilter}
              onChange={(e) => setUmumPotensiFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none max-w-[240px]"
            >
              <option value="all">Semua Potensi Risiko</option>
              <option value="Biaya Operasi/Ranap Tinggi">Biaya Operasi/Ranap Tinggi</option>
              <option value="Pasien/Keluarga Vokal">Pasien/Keluarga Vokal</option>
              <option value="Risiko APS/Kabur">Risiko APS/Kabur</option>
              <option value="Komplain Pelayanan">Komplain Pelayanan</option>
              <option value="Readmisi">Readmisi</option>
              <option value="Tidak Ada Keluarga yang Faham">Tidak Ada Keluarga yang Faham</option>
              <option value="Tidak Ada Orang Tua/Wali">Tidak Ada Orang Tua/Wali</option>
              <option value="Non spesialistik">Non spesialistik</option>
              <option value="Tidak membawa identitas / kurang lengkap">Tidak membawa identitas / kurang lengkap</option>
              <option value="Belum waktu kontrol">Belum waktu kontrol</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              if (activeSubTab === 'kll') {
                setSelectedKllForEdit(null);
                setIsKllModalOpen(true);
              } else if (activeSubTab === 'bpjs_kendala') {
                setSelectedBpjsForEdit(null);
                setIsBpjsModalOpen(true);
              } else if (activeSubTab === 'asuransi_swasta') {
                setSelectedAsuransiForEdit(null);
                setIsAsuransiModalOpen(true);
              } else {
                setSelectedUmumForEdit(null);
                setIsUmumModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1 CONTENT: PASIEN KECELAKAAN (KLL) */}
      {/* ========================================================================= */}
      {activeSubTab === 'kll' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Daftar Pasien Kasus Kecelakaan Lalu Lintas (KLL)
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                {filteredKllList.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Centang kolom <strong>Insiden</strong> untuk menandai kasus aktif
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-3 text-center w-28">Tgl MRS</th>
                  <th className="py-3 px-3 text-center w-28">Tgl KLL</th>
                  <th className="py-3 px-4 min-w-[220px]">Kronologi Kejadian</th>
                  <th className="py-3 px-3 text-center min-w-[130px]">Penjamin</th>
                  <th className="py-3 px-4 min-w-[180px]">Status LP KLL / Berkas</th>
                  <th className="py-3 px-3 text-center w-24">Insiden</th>
                  <th className="py-3 px-4 min-w-[180px]">Catatan / Noted</th>
                  <th className="py-3 px-3 text-center w-24 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKllList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Car className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Tidak ada data pasien KLL yang cocok.</span>
                        <span className="text-xs text-slate-400">Silakan tambahkan data baru atau reset kata kunci pencarian.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredKllList.map((record, idx) => {
                    const isBelum = !record.statusLp || record.statusLp.toUpperCase().includes('BELUM');

                    return (
                      <tr
                        key={record.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          record.isInsidenActive ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{record.namaPasien}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                          {record.noRm}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {record.tanggalMrs || '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {record.tanggalKll || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 leading-relaxed text-[11px]">
                          {record.kronologi || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              record.penjamin === 'Jasa Raharja'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : record.penjamin === 'BPJS Ketenagakerjaan'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : record.penjamin === 'BPJS Kesehatan'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {record.penjamin}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isBelum
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {record.statusLp}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedKllForLpViewer(record)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{record.lpFileName ? 'Lihat / Ganti Surat LP' : '📄 Upload Surat LP'}</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <label className="inline-flex items-center cursor-pointer" title="Centang Insiden Aktif">
                            <input
                              type="checkbox"
                              checked={record.isInsidenActive}
                              onChange={() => handleToggleKllInsiden(record.id)}
                              className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium text-[11px]">
                          {record.catatan ? (
                            <span className="p-1 px-1.5 rounded bg-amber-100/70 text-amber-950 font-semibold inline-block">
                              {record.catatan}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setHandoverCardTarget({ tab: 'kll', record })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Kartu Handover Admisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKllForEdit(record);
                                setIsKllModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data KLL"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  id: record.id,
                                  nama: record.namaPasien,
                                  noRm: record.noRm,
                                  tab: 'kll',
                                  categoryLabel: 'Kasus Pasien KLL'
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data KLL"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2 CONTENT: BPJS KENDALA */}
      {/* ========================================================================= */}
      {activeSubTab === 'bpjs_kendala' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Catatan Pasien BPJS dengan Kendala Kepesertaan / Bridging SEP
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                {filteredBpjsList.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Klik badge status untuk mengubah status Pending / Resolved
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-3 text-center w-28">Tgl MRS / Kontrol</th>
                  <th className="py-3 px-4 min-w-[150px] font-mono">No. Kartu BPJS</th>
                  <th className="py-3 px-3 min-w-[150px]">Jenis Kendala</th>
                  <th className="py-3 px-4 min-w-[220px]">Detail Masalah</th>
                  <th className="py-3 px-4 min-w-[220px]">Catatan Solusi Admisi</th>
                  <th className="py-3 px-3 text-center w-36">Status</th>
                  <th className="py-3 px-3 text-center w-24 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBpjsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Tidak ada kendala BPJS yang cocok.</span>
                        <span className="text-xs text-slate-400">Semua pelayanan BPJS terpantau lancar tanpa kendala aktif.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBpjsList.map((record, idx) => {
                    const isPending = record.status === 'Pending';

                    return (
                      <tr
                        key={record.id}
                        className={`hover:bg-emerald-50/40 transition-colors ${
                          isPending ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {record.namaPasien}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                          {record.noRm}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700 whitespace-nowrap">
                          {record.tanggalMrsKontrol || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                          {record.noKartuBpjs}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                            {record.jenisKendala}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-[11px] leading-relaxed">
                          {record.detailMasalah}
                        </td>
                        <td className="py-3 px-4 text-slate-800 text-[11px] leading-relaxed font-medium bg-emerald-50/30">
                          {record.catatanSolusi}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleBpjsStatus(record.id)}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            }`}
                            title="Klik untuk mengubah status Pending / Resolved (cetak SEP)"
                          >
                            {isPending ? (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Resolved (cetak SEP)</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setHandoverCardTarget({ tab: 'bpjs_kendala', record })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Kartu Handover Admisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBpjsForEdit(record);
                                setIsBpjsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Kendala BPJS"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  id: record.id,
                                  nama: record.namaPasien,
                                  noRm: record.noRm,
                                  tab: 'bpjs_kendala',
                                  categoryLabel: 'Kendala BPJS Pasien'
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Kendala BPJS"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3 CONTENT: ASURANSI SWASTA */}
      {/* ========================================================================= */}
      {activeSubTab === 'asuransi_swasta' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Catatan Khusus Pasien Asuransi Swasta & Handover Shift
              </h3>
              <span className="text-xs bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full font-bold">
                {filteredAsuransiList.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Pantau status Guarantee Letter (GL) dan catatan excess fee
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-4 min-w-[180px]">Nama Asuransi Swasta</th>
                  <th className="py-3 px-3 min-w-[160px]">Kendala / Status Klaim</th>
                  <th className="py-3 px-5 min-w-[280px]">Catatan Handover Shift</th>
                  <th className="py-3 px-3 text-center w-24 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAsuransiList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CreditCard className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Tidak ada pasien asuransi swasta yang cocok.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAsuransiList.map((record, idx) => {
                    return (
                      <tr key={record.id} className="hover:bg-violet-50/40 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {record.namaPasien}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-violet-700">
                          {record.noRm}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-900 border border-violet-200 text-xs">
                            {record.namaAsuransi}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                              record.statusKlaim.includes('Menunggu')
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : record.statusKlaim.includes('Excess')
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {record.statusKlaim}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-700 text-[11px] leading-relaxed">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-medium">
                            {record.catatanHandover}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setHandoverCardTarget({ tab: 'asuransi_swasta', record })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Kartu Handover Admisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAsuransiForEdit(record);
                                setIsAsuransiModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Asuransi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  id: record.id,
                                  nama: record.namaPasien,
                                  noRm: record.noRm,
                                  tab: 'asuransi_swasta',
                                  categoryLabel: 'Catatan Asuransi Swasta'
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Asuransi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4 CONTENT: UMUM BERESIKO */}
      {/* ========================================================================= */}
      {activeSubTab === 'umum_beresiko' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Early Warning Pasien UMUM Beresiko (Biaya, APS, Komplain & Keluarga)
              </h3>
              <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                {filteredUmumList.length} Pasien
              </span>
            </div>
            <div className="text-xs text-slate-500">
              * Pantau potensi tunggakan biaya operasi/ranap dan risiko sengketa pelayanan
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Pasien</th>
                  <th className="py-3 px-3 text-center w-24">No. RM</th>
                  <th className="py-3 px-3 text-center w-28">Tgl MRS / Kontrol</th>
                  <th className="py-3 px-4 min-w-[220px]">Kronologi Kejadian / Masalah</th>
                  <th className="py-3 px-4 min-w-[240px]">Potensi Masalah</th>
                  <th className="py-3 px-4 min-w-[240px]">Tindak Lanjut / Catatan Admisi</th>
                  <th className="py-3 px-3 text-center w-24 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUmumList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-sm">Tidak ada pasien UMUM berisiko terdata.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUmumList.map((record, idx) => {
                    return (
                      <tr key={record.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {record.namaPasien}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-800">
                          {record.noRm}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700 whitespace-nowrap">
                          {record.tanggalMrsKontrol || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-[11px] leading-relaxed">
                          {record.kronologiMasalah}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {record.potensiMasalah && record.potensiMasalah.map((pot, pIdx) => (
                              <span
                                key={pIdx}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                  pot.includes('Tinggi')
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : pot.includes('APS') || pot.includes('Vokal')
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : pot.includes('Non spesialistik')
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                    : pot.includes('identitas')
                                    ? 'bg-orange-100 text-orange-900 border border-orange-200'
                                    : pot.includes('kontrol')
                                    ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {pot}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-800 text-[11px] leading-relaxed font-medium bg-amber-50/30">
                          {record.tindakLanjut}
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setHandoverCardTarget({ tab: 'umum_beresiko', record })}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Kartu Handover Admisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUmumForEdit(record);
                                setIsUmumModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data UMUM Beresiko"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  id: record.id,
                                  nama: record.namaPasien,
                                  noRm: record.noRm,
                                  tab: 'umum_beresiko',
                                  categoryLabel: 'Pasien UMUM Beresiko'
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data UMUM Beresiko"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}
        </>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODALS */}
      {/* ========================================================================= */}

      {/* TAB 1 Form Modal */}
      {isKllModalOpen && (
        <KllFormModal
          isOpen={isKllModalOpen}
          onClose={() => {
            setIsKllModalOpen(false);
            setSelectedKllForEdit(null);
          }}
          onSave={handleSaveKll}
          initialData={selectedKllForEdit}
        />
      )}

      {/* TAB 1 LP File Viewer Modal */}
      {selectedKllForLpViewer && (
        <LpFileViewerModal
          isOpen={Boolean(selectedKllForLpViewer)}
          onClose={() => setSelectedKllForLpViewer(null)}
          record={selectedKllForLpViewer}
          onSaveLpFile={handleSaveKll}
        />
      )}

      {/* TAB 2 Form Modal */}
      {isBpjsModalOpen && (
        <BpjsKendalaModal
          isOpen={isBpjsModalOpen}
          onClose={() => {
            setIsBpjsModalOpen(false);
            setSelectedBpjsForEdit(null);
          }}
          onSave={handleSaveBpjs}
          initialData={selectedBpjsForEdit}
        />
      )}

      {/* TAB 3 Form Modal */}
      {isAsuransiModalOpen && (
        <AsuransiSwastaModal
          isOpen={isAsuransiModalOpen}
          onClose={() => {
            setIsAsuransiModalOpen(false);
            setSelectedAsuransiForEdit(null);
          }}
          onSave={handleSaveAsuransi}
          initialData={selectedAsuransiForEdit}
        />
      )}

      {/* TAB 4 Form Modal */}
      {isUmumModalOpen && (
        <UmumBeresikoModal
          isOpen={isUmumModalOpen}
          onClose={() => {
            setIsUmumModalOpen(false);
            setSelectedUmumForEdit(null);
          }}
          onSave={handleSaveUmum}
          initialData={selectedUmumForEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          patientName={deleteTarget.nama}
          noRm={deleteTarget.noRm}
          categoryLabel={deleteTarget.categoryLabel}
        />
      )}

      {/* Cetak Rekap / Print Modal */}
      {isPrintModalOpen && (
        <PatientNotesPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          activeSubTab={activeSubTab}
          kllRecords={kllRecords}
          bpjsRecords={bpjsRecords}
          asuransiRecords={asuransiRecords}
          umumRecords={umumRecords}
        />
      )}

      {/* Kartu Laporan Handover Modal (Eye Icon Trigger) */}
      {handoverCardTarget && (
        <HandoverCardModal
          isOpen={Boolean(handoverCardTarget)}
          onClose={() => setHandoverCardTarget(null)}
          data={handoverCardTarget}
          onViewLpFile={(kllRecord) => {
            setHandoverCardTarget(null);
            setSelectedKllForLpViewer(kllRecord);
          }}
        />
      )}
    </div>
  );
};
