import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Building,
  User,
  ShieldAlert,
  FileText,
  Download,
  Printer,
  Trash2,
  Edit3,
  Search,
  ChevronDown,
  Check,
  Stethoscope
} from 'lucide-react';
import {
  DoctorSchedule,
  DoctorLeaveAnnouncement,
  DoctorLeaveItem,
  PatientQueueItem,
  EmergencyAlertData
} from '../types';
import { MASTER_DOCTORS } from '../data/initialData';
import { formatDoctorScheduleTime } from '../utils/dateHelpers';

// Helper to determine if a doctor belongs to a given Poliklinik (matching standard names and synonyms)
export const isDoctorInPoli = (doctorPoli: string, targetPoli: string, doctorName?: string): boolean => {
  if (!targetPoli) return false;
  if (!doctorPoli && !doctorName) return false;

  const docPoliNorm = (doctorPoli || '').toLowerCase().trim();
  const targetPoliNorm = targetPoli.toLowerCase().trim();
  const docNameNorm = (doctorName || '').toLowerCase().trim();

  // Exact match or direct equality
  if (docPoliNorm === targetPoliNorm) return true;

  // Clean common prefixes
  const cleanTarget = targetPoliNorm.replace(/^poli\s+/, '').trim();
  const cleanDocPoli = docPoliNorm.replace(/^poli\s+/, '').trim();

  if (cleanDocPoli === cleanTarget && cleanTarget.length > 0) return true;

  // Special case: Bedah Saraf vs Bedah Umum vs Saraf Neurologi
  const isTargetBedahSaraf = cleanTarget.includes('bedah saraf');
  const isDocBedahSaraf = cleanDocPoli.includes('bedah saraf') || docNameNorm.includes('sp.bs') || docNameNorm.includes('sp. bs');
  if (isTargetBedahSaraf || isDocBedahSaraf) {
    return isTargetBedahSaraf && isDocBedahSaraf;
  }

  // Specialty dictionary for smart cascade matching
  const specialtyRules: { keywords: string[]; poliNames: string[]; titles: string[]; excludeTitles?: string[] }[] = [
    {
      keywords: ['anak', 'pediatri'],
      poliNames: ['anak', 'poli anak', 'pediatri'],
      titles: ['sp.a', 'sp. a', 'sp.a.', 'sp. a.'],
      excludeTitles: ['sp.an', 'sp. an']
    },
    {
      keywords: ['dalam', 'internis', 'penyakit dalam'],
      poliNames: ['penyakit dalam', 'dalam', 'poli penyakit dalam', 'internis'],
      titles: ['sp.pd', 'sp. pd']
    },
    {
      keywords: ['bedah', 'bedah umum'],
      poliNames: ['bedah', 'bedah umum', 'poli bedah', 'poli bedah umum'],
      titles: ['sp.b', 'sp. b'],
      excludeTitles: ['sp.bs', 'sp. bs', 'sp.bmm', 'sp. bmm', 'sp.ba', 'sp. ba', 'sp.btkv']
    },
    {
      keywords: ['obgyn', 'kandungan', 'kebidanan'],
      poliNames: ['obgyn', 'kandungan', 'kebidanan', 'poli obgyn', 'poli kebidanan', 'poli kebidanan & kandungan'],
      titles: ['sp.og', 'sp. og']
    },
    {
      keywords: ['saraf', 'neurologi'],
      poliNames: ['saraf', 'neurologi', 'poli saraf', 'poli saraf / neurologi'],
      titles: ['sp.n', 'sp. n', 'sp.s', 'sp. s'],
      excludeTitles: ['sp.bs', 'sp. bs']
    },
    {
      keywords: ['jantung', 'kardiologi', 'kardio'],
      poliNames: ['jantung', 'kardio', 'poli jantung', 'poli jantung & pembuluh darah'],
      titles: ['sp.jp', 'sp. jp']
    },
    {
      keywords: ['kulit', 'kelamin', 'dve'],
      poliNames: ['kulit', 'kelamin', 'dve', 'poli kulit', 'poli kulit & kelamin', 'dermatologi'],
      titles: ['sp.dve', 'sp. dve', 'sp.kk', 'sp. kk']
    },
    {
      keywords: ['mata', 'oftalmologi'],
      poliNames: ['mata', 'oftalmologi', 'poli mata'],
      titles: ['sp.m', 'sp. m']
    },
    {
      keywords: ['ortopedi', 'orthopedi', 'orthopaedi', 'tulang'],
      poliNames: ['ortopedi', 'orthopedi', 'poli orthopedi', 'poli ortopedi'],
      titles: ['sp.ot', 'sp. ot']
    },
    {
      keywords: ['paru', 'pulmonologi'],
      poliNames: ['paru', 'pulmonologi', 'poli paru', 'poli paru / pulmonologi'],
      titles: ['sp.p', 'sp. p']
    },
    {
      keywords: ['tht', 'tht-kl', 'tht-bkl', 'telinga hidung tenggorokan'],
      poliNames: ['tht', 'tht-kl', 'poli tht', 'poli tht-kl'],
      titles: ['sp.tht', 'sp. tht', 'sp.tht-kl', 'sp. tht-bkl', 'sp.tht-bkl']
    },
    {
      keywords: ['urologi'],
      poliNames: ['urologi', 'poli urologi'],
      titles: ['sp.u', 'sp. u']
    },
    {
      keywords: ['rehab', 'rehabilitasi', 'kfr', 'fisioterapi'],
      poliNames: ['rehab', 'rehabilitasi', 'kedokteran fisik', 'poli kedokteran fisik & rehabilitasi', 'rehab medik'],
      titles: ['sp.kfr', 'sp. kfr']
    },
    {
      keywords: ['gigi', 'mulut'],
      poliNames: ['gigi', 'gigi & mulut', 'poli gigi', 'poli gigi & mulut'],
      titles: ['drg', 'sp.kg', 'sp.ort', 'sp.bmm']
    },
    {
      keywords: ['jiwa', 'psikiatri'],
      poliNames: ['jiwa', 'psikiatri', 'poli jiwa', 'poli jiwa / psikiatri'],
      titles: ['sp.kj', 'sp. kj']
    }
  ];

  for (const rule of specialtyRules) {
    const targetMatchesRule =
      rule.poliNames.some((pn) => cleanTarget.includes(pn) || pn.includes(cleanTarget)) ||
      rule.keywords.some((k) => cleanTarget.includes(k));

    if (targetMatchesRule) {
      if (rule.excludeTitles && rule.excludeTitles.some((ex) => docNameNorm.includes(ex))) {
        continue;
      }
      const docPoliMatches =
        rule.poliNames.some((pn) => cleanDocPoli.includes(pn) || pn.includes(cleanDocPoli)) ||
        rule.keywords.some((k) => cleanDocPoli.includes(k));
      const docTitleMatches = rule.titles.some((t) => docNameNorm.includes(t));

      if (docPoliMatches || docTitleMatches) {
        return true;
      }
    }
  }

  return cleanTarget.includes(cleanDocPoli) || cleanDocPoli.includes(cleanTarget);
};

interface CascadeDoctorSelectProps {
  selectedPoli: string;
  value: string;
  onChange: (doctorName: string) => void;
  doctorOptions?: { dpjp: string; poli: string }[];
}

export const CascadeDoctorSelect: React.FC<CascadeDoctorSelectProps> = ({
  selectedPoli,
  value,
  onChange,
  doctorOptions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isPoliSelected = Boolean(selectedPoli && selectedPoli.trim().length > 0);

  // Combine and deduplicate master doctors and dynamic options
  const allDoctors = React.useMemo(() => {
    const map = new Map<string, { poli: string; no?: number }>();
    MASTER_DOCTORS.forEach((d) => {
      map.set(d.dpjp, { poli: d.poli, no: d.no });
    });
    if (doctorOptions) {
      doctorOptions.forEach((d, idx) => {
        if (!map.has(d.dpjp)) {
          map.set(d.dpjp, { poli: d.poli, no: idx + 1 });
        }
      });
    }
    return Array.from(map.entries()).map(([dpjp, info]) => ({
      dpjp,
      poli: info.poli,
      no: info.no
    }));
  }, [doctorOptions]);

  // Cascade Filter: Filter doctors based on currently selected Poliklinik
  const poliDoctors = React.useMemo(() => {
    if (!isPoliSelected) return [];
    const filtered = allDoctors.filter((doc) => isDoctorInPoli(doc.poli, selectedPoli, doc.dpjp));
    // If no matching doctors found in master list for this custom poli, fall back to all doctors with a note
    return filtered.length > 0 ? filtered : allDoctors;
  }, [allDoctors, selectedPoli, isPoliSelected]);

  // Search Filter: Filter cascade results by user search query
  const searchFilteredDoctors = React.useMemo(() => {
    if (!searchQuery.trim()) return poliDoctors;
    const q = searchQuery.toLowerCase();
    return poliDoctors.filter(
      (doc) =>
        doc.dpjp.toLowerCase().includes(q) ||
        doc.poli.toLowerCase().includes(q)
    );
  }, [poliDoctors, searchQuery]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // If user chooses manual input mode
  if (isManualInput) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase">
            Nama Dokter DPJP Beserta Gelar <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsManualInput(false)}
            className="text-[11px] text-[#005d42] hover:underline font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
          >
            ← Kembali ke Pilihan Dropdown
          </button>
        </div>
        <input
          type="text"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Contoh: dr. Erliana, Sp. OG atau dr. Andi Wijaya, Sp.PD"
          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005d42] focus:border-[#005d42] outline-none bg-white font-medium"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Ketik nama lengkap dokter beserta gelar spesialisasi (untuk dokter baru/tamu di luar master data).
        </p>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700 uppercase flex items-center gap-1">
          <span>Nama Dokter DPJP Beserta Gelar</span>
          <span className="text-rose-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setIsManualInput(true)}
          className="text-[11px] text-[#005d42] hover:text-emerald-800 font-semibold underline flex items-center gap-1"
        >
          <span>✍️ Tulis Manual</span>
        </button>
      </div>

      {/* Trigger Button */}
      {!isPoliSelected ? (
        // Disabled State when Poliklinik is not chosen yet
        <div
          id="doctor-select-disabled"
          onClick={() => {}}
          className="w-full px-3.5 py-2.5 text-left border border-dashed border-amber-300 rounded-xl bg-amber-50/50 text-amber-800 flex items-center justify-between select-none transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-amber-800">
              Pilih Poliklinik Terlebih Dahulu untuk Membuka Dropdown Dokter
            </span>
          </div>
          <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded">
            Terkunci
          </span>
        </div>
      ) : (
        // Active / Enabled Select Trigger
        <div>
          <button
            type="button"
            id="doctor-select-trigger"
            onClick={() => {
              setIsOpen(!isOpen);
              setSearchQuery('');
            }}
            className={`w-full px-3.5 py-2.5 text-left border rounded-xl bg-white flex items-center justify-between transition-all cursor-pointer ${
              isOpen
                ? 'border-[#005d42] ring-2 ring-[#005d42]/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#005d42] border border-emerald-100 flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              {value ? (
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Poliklinik: {selectedPoli}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    -- Pilih Dokter DPJP --
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                    {poliDoctors.length} Dokter Tersedia
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                  title="Hapus pilihan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#005d42]' : ''
                }`}
              />
            </div>
          </button>
        </div>
      )}

      {/* Searchable Dropdown Menu */}
      {isOpen && isPoliSelected && (
        <div
          id="doctor-select-dropdown"
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Search Input */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/90">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama dokter untuk mencari..."
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#005d42] focus:border-[#005d42] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-500 font-medium">
              <span>Filter Poliklinik: <strong className="text-slate-700">{selectedPoli}</strong></span>
              <span>{poliDoctors.length} Dokter Terdaftar</span>
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
            {searchFilteredDoctors.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Tidak ditemukan dokter yang sesuai dengan "{searchQuery}" pada {selectedPoli}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onChange(searchQuery);
                    setIsManualInput(true);
                    setIsOpen(false);
                  }}
                  className="text-xs font-semibold text-[#005d42] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                >
                  Gunakan "{searchQuery}" & Input Manual
                </button>
              </div>
            ) : (
              searchFilteredDoctors.map((doc) => {
                const isSelected = doc.dpjp === value;
                return (
                  <button
                    key={doc.dpjp}
                    type="button"
                    onClick={() => {
                      onChange(doc.dpjp);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-[#005d42] font-semibold border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#005d42] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {doc.no || '•'}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs truncate ${isSelected ? 'font-bold text-[#005d42]' : 'font-medium text-slate-900'}`}>
                          {doc.dpjp}
                        </p>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                          Spesialis Poli {doc.poli}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#005d42] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer of Dropdown */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500 px-3">
            <span>Menampilkan {searchFilteredDoctors.length} dari {poliDoctors.length} dokter</span>
            <button
              type="button"
              onClick={() => {
                setIsManualInput(true);
                setIsOpen(false);
              }}
              className="text-[#005d42] hover:underline font-semibold"
            >
              + Tulis Dokter Baru (Manual)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Partial<DoctorSchedule>) => void;
  editingSchedule: DoctorSchedule | null;
  poliOptions: string[];
  doctorOptions?: { dpjp: string; poli: string }[];
}

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSchedule,
  poliOptions,
  doctorOptions
}) => {
  const [poli, setPoli] = useState('');
  const [dpjp, setDpjp] = useState('');
  const [hari, setHari] = useState<DoctorSchedule['hari']>('Senin');
  const [jadwal, setJadwal] = useState('08:00 - 12:00');
  const [jamHfis, setJamHfis] = useState('07.30 - 13.00');
  const [kuotaTotal, setKuotaTotal] = useState<number | string>(50);
  const [kuotaTerisi, setKuotaTerisi] = useState<number | string>(0);
  const [ruangan, setRuangan] = useState('Poliklinik 101, Lt. 1');
  const [rerataPasien, setRerataPasien] = useState<number | string>(30);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize state when modal opens or editing schedule changes
  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);
    if (editingSchedule) {
      setPoli(editingSchedule.poli || '');
      setDpjp(editingSchedule.dpjp || '');
      setHari(editingSchedule.hari || 'Senin');
      setJadwal(editingSchedule.jadwal || '08:00 - 12:00');
      setJamHfis(editingSchedule.jamHfis || '07.30 - 13.00');
      setKuotaTotal(editingSchedule.kuotaTotal ?? 50);
      setKuotaTerisi(editingSchedule.kuotaTerisi ?? 0);
      setRuangan(editingSchedule.ruangan || 'Poliklinik 101, Lt. 1');
      setRerataPasien(editingSchedule.rerataPasien ?? 30);
    } else {
      // For adding new schedule, keep Poliklinik unselected by default so user picks poli first
      setPoli('');
      setDpjp('');
      setHari('Senin');
      setJadwal('08:00 - 12:00');
      setJamHfis('07.30 - 13.00');
      setKuotaTotal(50);
      setKuotaTerisi(0);
      setRuangan('Poliklinik 101, Lt. 1');
      setRerataPasien(30);
    }
  }, [editingSchedule, isOpen]);

  if (!isOpen) return null;

  // Cascade handler: When Poliklinik changes, automatically reset doctor selection
  const handlePoliChange = (newPoli: string) => {
    setPoli(newPoli);
    setDpjp(''); // Strictly reset doctor selection when Poliklinik changes
    setValidationError(null);
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Disallow negative, exponential, or decimal inputs where integers are required
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Strict validation of required fields
    const missing: string[] = [];
    if (!poli.trim()) missing.push('Poliklinik');
    if (!dpjp.trim()) missing.push('Nama Dokter DPJP');
    if (!hari) missing.push('Hari Praktik');
    if (!jadwal.trim()) missing.push('Jam Praktik');
    
    const parsedKuotaTotal = Number(kuotaTotal);
    if (kuotaTotal === '' || isNaN(parsedKuotaTotal) || parsedKuotaTotal <= 0) {
      missing.push('Kuota Total (minimal 1)');
    }

    if (missing.length > 0) {
      setValidationError(`Harap lengkapi semua data wajib bertanda bintang merah (*): ${missing.join(', ')}`);
      return;
    }

    const parsedKuotaTerisi = Math.max(0, Number(kuotaTerisi) || 0);
    const parsedRerataPasien = Math.max(0, Number(rerataPasien) || 0);

    onSave({
      id: editingSchedule?.id || `sch-${Date.now()}`,
      poli,
      dpjp,
      hari,
      jadwal: jadwal.trim(),
      jamHfis: jamHfis.trim() || jadwal.trim(),
      kuotaTotal: parsedKuotaTotal,
      kuotaTerisi: parsedKuotaTerisi,
      ruangan: ruangan.trim() || 'Poliklinik 101',
      rerataPasien: parsedRerataPasien,
      status: parsedKuotaTerisi >= parsedKuotaTotal ? 'Penuh' : 'Tersedia'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-[#005d42] rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {editingSchedule ? 'Edit Jadwal Praktik DPJP' : 'Tambah Jadwal Praktik DPJP'}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi data jadwal SIMRS dan sinkronisasi HFIS BPJS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Alert Notification */}
        {validationError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{validationError}</div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-400 hover:text-rose-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Poliklinik Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span>
                Poliklinik <span className="text-rose-500">*</span>
              </span>
              {poli && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Poliklinik Terpilih
                </span>
              )}
            </label>
            <select
              required
              value={poli}
              onChange={(e) => handlePoliChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-all ${
                !poli
                  ? 'border-amber-300 bg-amber-50/40 text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'
                  : 'border-slate-200 focus:ring-2 focus:ring-[#005d42] focus:border-[#005d42] bg-white font-medium'
              }`}
            >
              <option value="">-- Pilih Poliklinik --</option>
              {poliOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              {!poliOptions.some((p) => p.includes('Gigi')) && (
                <option value="Poli Gigi & Mulut">Poli Gigi & Mulut</option>
              )}
              {!poliOptions.some((p) => p.includes('Jiwa')) && (
                <option value="Poli Jiwa / Psikiatri">Poli Jiwa / Psikiatri</option>
              )}
            </select>
            {!poli && (
              <p className="text-[11px] text-amber-600 mt-1 font-medium flex items-center gap-1">
                <span>⚠️ Silakan pilih Poliklinik terlebih dahulu agar daftar dokter DPJP tersaring otomatis</span>
              </p>
            )}
          </div>

          {/* Searchable & Cascade Filtered Doctor Field */}
          <div>
            <CascadeDoctorSelect
              selectedPoli={poli}
              value={dpjp}
              onChange={(docName) => {
                setDpjp(docName);
                setValidationError(null);
              }}
              doctorOptions={doctorOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Hari Praktik <span className="text-rose-500">*</span>
              </label>
              <select
                value={hari}
                onChange={(e) => {
                  setHari(e.target.value as any);
                  setValidationError(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Ahad">Ahad</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Jam Praktik (24 Jam) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={jadwal}
                onChange={(e) => {
                  setJadwal(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Contoh: 12.00 - 13.30 WIB"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium"
              />
            </div>
          </div>

          {/* Quick presets for Time */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">Preset Jam:</span>
            {['08:00 - 12:00', '11.00 - 13.30 WIB', '12.00 - 13.30 WIB', '13.30 - 15.00 WIB'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setJadwal(preset);
                  setJamHfis(preset.replace(' WIB', ''));
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-[#005d42] rounded-md text-[11px] font-medium border border-slate-200 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Jam Layanan HFIS BPJS
              </label>
              <input
                type="text"
                value={jamHfis}
                onChange={(e) => setJamHfis(e.target.value)}
                placeholder="Contoh: 12.00-13.30"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Ruangan / Lokasi Poli
              </label>
              <input
                type="text"
                value={ruangan}
                onChange={(e) => setRuangan(e.target.value)}
                placeholder="Contoh: Poliklinik 101, Lt. 1"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium"
              />
            </div>
          </div>

          {/* Strict Numeric Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Kuota Terisi (Angka)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                onKeyDown={handleNumericKeyDown}
                value={kuotaTerisi}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                  setKuotaTerisi(val);
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Kuota Total <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                onKeyDown={handleNumericKeyDown}
                value={kuotaTotal}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1);
                  setKuotaTotal(val);
                  setValidationError(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Rerata Pasien
              </label>
              <input
                type="number"
                min="0"
                step="1"
                onKeyDown={handleNumericKeyDown}
                value={rerataPasien}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                  setRerataPasien(val);
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#005d42] hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const formatIndonesianDate = (isoStr: string): string => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(day) || monthIdx < 0 || monthIdx > 11) return isoStr;
  return `${day} ${INDO_MONTHS[monthIdx]} ${year}`;
};

export const parseIndonesianToIso = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const match = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const year = match[3];
    const monthIdx = INDO_MONTHS.findIndex(
      (m) => m.toLowerCase() === monthName || m.toLowerCase().startsWith(monthName.slice(0, 3))
    );
    if (monthIdx !== -1) {
      const mm = String(monthIdx + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }
  return '';
};

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  accentColor: 'red' | 'emerald';
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  accentColor
}) => {
  const [isManualEdit, setIsManualEdit] = useState(false);
  const isoVal = parseIndonesianToIso(value);
  const isRed = accentColor === 'red';

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawIso = e.target.value;
    if (!rawIso) return;
    const formatted = formatIndonesianDate(rawIso);
    onChange(formatted);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={`block text-[11px] font-bold ${isRed ? 'text-red-700' : 'text-emerald-700'}`}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsManualEdit(!isManualEdit)}
          className="text-[10px] text-slate-400 hover:text-slate-600 underline"
        >
          {isManualEdit ? 'Gunakan Kalender' : 'Edit Teks'}
        </button>
      </div>

      {isManualEdit ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Contoh: 4 September 2026"
          className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white outline-none ${
            isRed
              ? 'border-red-200 focus:ring-2 focus:ring-red-400 text-slate-800'
              : 'border-emerald-200 focus:ring-2 focus:ring-emerald-400 text-slate-800'
          }`}
        />
      ) : (
        <div
          className={`relative flex items-center border rounded-xl overflow-hidden bg-white transition-all ${
            isRed
              ? 'border-red-200 focus-within:ring-2 focus-within:ring-red-400'
              : 'border-emerald-200 focus-within:ring-2 focus-within:ring-emerald-400'
          }`}
        >
          <input
            type="date"
            value={isoVal}
            onChange={handleDateChange}
            onClick={(e) => {
              try {
                (e.target as any).showPicker?.();
              } catch (err) {}
            }}
            className="w-full pl-3 pr-9 py-2 text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
          />
          <div className="absolute right-2.5 pointer-events-none text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
      )}

      {value && (
        <div className="mt-1">
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            isRed ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            📅 {value}
          </span>
        </div>
      )}
    </div>
  );
};

interface DoctorSearchSelectProps {
  value: string;
  onChange: (doctorName: string, doctorPoli?: string) => void;
  doctorOptions?: { dpjp: string; poli: string }[];
}

const DEFAULT_DOCTOR_OPTIONS: { dpjp: string; poli: string; no?: number }[] = MASTER_DOCTORS.map((d) => ({
  dpjp: d.dpjp,
  poli: d.poli,
  no: d.no
}));

const DoctorSearchSelect: React.FC<DoctorSearchSelectProps> = ({
  value,
  onChange,
  doctorOptions = DEFAULT_DOCTOR_OPTIONS
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Merge provided doctorOptions with master list avoiding duplicates
  const allDoctors = React.useMemo(() => {
    const map = new Map<string, { poli: string; no?: number }>();
    MASTER_DOCTORS.forEach((d) => {
      map.set(d.dpjp, { poli: d.poli, no: d.no });
    });
    doctorOptions.forEach((d, idx) => {
      if (!map.has(d.dpjp)) {
        map.set(d.dpjp, { poli: d.poli, no: idx + 1 });
      }
    });
    return Array.from(map.entries()).map(([dpjp, info]) => ({
      dpjp,
      poli: info.poli,
      no: info.no
    }));
  }, [doctorOptions]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredDoctors = allDoctors.filter(
    (d) =>
      d.dpjp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.poli.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDoc = allDoctors.find((d) => d.dpjp === value);

  if (isManualInput) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 uppercase">
            Nama DPJP Dokter
          </label>
          <button
            type="button"
            onClick={() => setIsManualInput(false)}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-medium underline"
          >
            Pilih dari Daftar Dokter (20 Dokter)
          </button>
        </div>
        <input
          type="text"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Contoh: dr. Nama Dokter, Sp.XX"
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-semibold text-slate-700 uppercase">
          Nama DPJP Dokter
        </label>
        <button
          type="button"
          onClick={() => setIsManualInput(true)}
          className="text-[11px] text-slate-400 hover:text-slate-600 underline"
        >
          Tulis Manual
        </button>
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        className={`w-full px-3.5 py-2.5 text-left border rounded-xl bg-white flex items-center justify-between transition-all ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          {value ? (
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
              {selectedDoc && (
                <p className="text-[10px] text-slate-500 font-medium">Poli: {selectedDoc.poli}</p>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">Pilih & Cari dari 20 Dokter DPJP...</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama dokter atau poli..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredDoctors.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Tidak ditemukan dokter "{searchQuery}"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onChange(searchQuery);
                    setIsManualInput(true);
                    setIsOpen(false);
                  }}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                >
                  Gunakan "{searchQuery}" & Input Manual
                </button>
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const isSelected = doc.dpjp === value;
                return (
                  <button
                    key={doc.dpjp}
                    type="button"
                    onClick={() => {
                      onChange(doc.dpjp, doc.poli);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-amber-50 text-amber-950 font-semibold border border-amber-200/60'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center text-[10px] font-bold text-slate-400 shrink-0">
                        {doc.no || '•'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-slate-900">{doc.dpjp}</p>
                        <span className="inline-block text-[10px] text-teal-700 font-medium bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100/80 mt-0.5">
                          Poli {doc.poli}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer of Dropdown */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 px-3">
            <span>Menampilkan {filteredDoctors.length} dari 20 dokter</span>
            <button
              type="button"
              onClick={() => {
                setIsManualInput(true);
                setIsOpen(false);
              }}
              className="text-amber-700 hover:text-amber-800 font-medium underline"
            >
              + Input Bebas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leave: DoctorLeaveAnnouncement) => void;
  onDelete?: (id: string) => void;
  initialData?: DoctorLeaveAnnouncement | null;
  doctorOptions?: { dpjp: string; poli: string }[];
  poliOptions?: string[];
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  doctorOptions,
  poliOptions
}) => {
  const [dpjp, setDpjp] = useState('');
  const [poli, setPoli] = useState('Penyakit Dalam');
  const [jadwalList, setJadwalList] = useState<DoctorLeaveItem[]>([
    {
      keterangan: 'LIBUR PRAKTIK',
      tglLibur: '',
      tglMasuk: '',
      tipe: 'LIBUR'
    }
  ]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (initialData) {
      setDpjp(initialData.dpjp || '');
      setPoli(initialData.poli || 'Penyakit Dalam');
      setJadwalList(
        initialData.jadwal && initialData.jadwal.length > 0
          ? initialData.jadwal.map((j) => ({ ...j }))
          : [
              {
                keterangan: 'LIBUR PRAKTIK',
                tglLibur: '',
                tglMasuk: '',
                tipe: 'LIBUR'
              }
            ]
      );
    } else {
      setDpjp('');
      setPoli('Penyakit Dalam');
      setJadwalList([
        {
          keterangan: 'LIBUR PRAKTIK',
          tglLibur: '',
          tglMasuk: '',
          tipe: 'LIBUR'
        }
      ]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleUpdateItem = (index: number, field: keyof DoctorLeaveItem, value: any) => {
    setJadwalList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddItem = () => {
    setJadwalList((prev) => [
      ...prev,
      {
        keterangan: 'LIBUR PRAKTIK',
        tglLibur: '',
        tglMasuk: '',
        tipe: 'LIBUR'
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (jadwalList.length <= 1) return;
    setJadwalList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpjp) return;

    onSave({
      id: initialData ? initialData.id : `leave-${Date.now()}`,
      dpjp,
      poli,
      jadwal: jadwalList.map((item) => ({
        keterangan: item.keterangan || (item.tipe === 'MAJU' ? 'JADWAL MAJU' : item.tipe === 'CUTI' ? 'CUTI TAHUNAN' : 'LIBUR PRAKTIK'),
        tglLibur: item.tglLibur || 'Sesuai Pengumuman',
        tglMasuk: item.tglMasuk || 'Konfirmasi Poliklinik',
        tipe: item.tipe
      })),
      active: true
    });
    onClose();
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              {initialData ? <Edit3 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {initialData ? 'Edit Informasi Libur / Perubahan Dokter' : 'Tambah Catatan Libur / Jadwal'}
              </h3>
              <p className="text-xs text-slate-500">
                Pengumuman langsung tayang pada banner kartu dokter
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Searchable Doctor Dropdown */}
          <DoctorSearchSelect
            value={dpjp}
            onChange={(selectedDoctor, doctorPoli) => {
              setDpjp(selectedDoctor);
              if (doctorPoli) {
                setPoli(doctorPoli);
              }
            }}
            doctorOptions={doctorOptions}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Poliklinik
            </label>
            <input
              type="text"
              required
              value={poli}
              onChange={(e) => setPoli(e.target.value)}
              placeholder="Contoh: Jantung, Urologi, Paru, Penyakit Dalam, Obgyn"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50/50"
            />
          </div>

          {/* Schedule List / Items */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800 uppercase">
                Daftar Tanggal Libur / Perubahan Jadwal ({jadwalList.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tanggal</span>
              </button>
            </div>

            <div className="space-y-3">
              {jadwalList.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Sesi Perubahan #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={item.tipe}
                        onChange={(e) => handleUpdateItem(index, 'tipe', e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          item.tipe === 'MAJU'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        } outline-none`}
                      >
                        <option value="LIBUR">LIBUR PRAKTIK</option>
                        <option value="MAJU">JADWAL MAJU</option>
                        <option value="CUTI">CUTI TAHUNAN</option>
                      </select>

                      {jadwalList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <DatePickerField
                      label="Tgl Libur / Semula"
                      value={item.tglLibur}
                      onChange={(val) => handleUpdateItem(index, 'tglLibur', val)}
                      accentColor="red"
                    />

                    <DatePickerField
                      label="Tgl Masuk / Pengganti"
                      value={item.tglMasuk}
                      onChange={(val) => handleUpdateItem(index, 'tglMasuk', val)}
                      accentColor="emerald"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 shrink-0">
            {isConfirmingDelete ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Yakin ingin menghapus seluruh catatan dokter ini?</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {initialData && onDelete ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 border border-rose-200/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Catatan</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs sm:text-sm font-semibold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddLeaveModal = LeaveModal;

interface BookPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DoctorSchedule | null;
  onBook: (patientData: { nama: string; noBpjs: string; jenis: 'BPJS Kesehatan' | 'Umum' }) => void;
}

export const BookPatientModal: React.FC<BookPatientModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onBook
}) => {
  const [nama, setNama] = useState('');
  const [noBpjs, setNoBpjs] = useState('');
  const [jenis, setJenis] = useState<'BPJS Kesehatan' | 'Umum'>('BPJS Kesehatan');

  if (!isOpen || !schedule) return null;

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama) return;

    onBook({
      nama,
      noBpjs: noBpjs || `000${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      jenis
    });
    setNama('');
    setNoBpjs('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Reservasi Antrean Poliklinik</h3>
            <p className="text-xs text-[#005d42] font-semibold">{schedule.poli} • {schedule.dpjp}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-emerald-50 rounded-xl p-3.5 mb-4 border border-emerald-200/80 text-xs text-emerald-900 flex justify-between items-center">
          <div>
            <p className="font-semibold">Hari: {schedule.hari}, {formatDoctorScheduleTime(schedule)}</p>
            <p className="text-emerald-700">Ruangan: {schedule.ruangan || 'Klinik Utama'}</p>
          </div>
          <span className="font-bold px-2 py-1 bg-white rounded-md text-[#005d42] shadow-xs">
            Kuota: {schedule.kuotaTerisi}/{schedule.kuotaTotal}
          </span>
        </div>

        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Lengkap Pasien
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Bpk. H. Sutrisno"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nomor Kartu BPJS / NIK
            </label>
            <input
              type="text"
              value={noBpjs}
              onChange={(e) => setNoBpjs(e.target.value)}
              placeholder="0001234567890"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Penjamin Pasien
            </label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value as any)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none"
            >
              <option value="BPJS Kesehatan">BPJS Kesehatan (JKN-KIS)</option>
              <option value="Umum">Pasien Umum / Pribadi</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#005d42] hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAlert: (data: EmergencyAlertData) => void;
  onClearAlert: () => void;
  currentAlert: EmergencyAlertData | null;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  onTriggerAlert,
  onClearAlert,
  currentAlert
}) => {
  const [code, setCode] = useState('CODE BLUE - EMERGENCY');
  const [message, setMessage] = useState('Tim Medis Darurat dimohon segera merapat ke Lantai 1 IGD');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-red-700 rounded-xl animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Hospital Emergency Broadcast</h3>
              <p className="text-xs text-red-600 font-semibold">Protokol Siaga Rumah Sakit MedCentral</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentAlert?.active ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-red-900">
              <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Peringatan Darurat Sedang Aktif:</span>
              </div>
              <p className="font-bold text-base mt-1">{currentAlert.code}</p>
              <p className="text-xs text-red-800 mt-1">{currentAlert.message}</p>
              <p className="text-[10px] text-red-500 mt-2">Diterbitkan oleh: {currentAlert.issuedBy} ({currentAlert.issuedAt})</p>
            </div>

            <button
              onClick={() => {
                onClearAlert();
                onClose();
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all"
            >
              Matikan / Akhiri Status Darurat
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Kategori Kode Darurat
              </label>
              <select
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="CODE BLUE - EMERGENCY RESUSCITATION">CODE BLUE (Pasien Kritis / Henti Jantung)</option>
                <option value="CODE RED - FIRE ALERT">CODE RED (Kebakaran & Siaga Evakuasi)</option>
                <option value="CODE BLACK - THREAT ALERT">CODE BLACK (Ancaman Keamanan)</option>
                <option value="CODE YELLOW - INTERNAL DISASTER">CODE YELLOW (Bencana Internal / Mass Casualty)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Pesan Instruksi Evakuasi / Penanganan
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onTriggerAlert({
                    active: true,
                    code,
                    message,
                    issuedAt: new Date().toLocaleTimeString('id-ID'),
                    issuedBy: 'Admin MedCentral Pusat'
                  });
                  onClose();
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Siarkan Kode Darurat</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
