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
  Stethoscope,
  Sparkles,
  UserPlus
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
  onSave: (schedule: Partial<DoctorSchedule> | DoctorSchedule[]) => void;
  editingSchedule: DoctorSchedule | null;
  poliOptions: string[];
  doctorOptions?: { dpjp: string; poli: string }[];
}

// Helper: kalkulasi waktu cetak otomatis (1 jam sebelum jam mulai HFIS)
const computeAutoPrintTime = (timeStr: string): string => {
  if (!timeStr || !timeStr.trim() || timeStr.trim() === '-') return '';
  try {
    const startPart = timeStr.split('-')[0].trim().replace('.', ':');
    const match = startPart.match(/(\d{1,2})[:.](\d{2})/);
    if (!match) return '';
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
    let prevHours = hours - 1;
    if (prevHours < 0) prevHours = 23; // antisipasi jika lewat tengah malam
    const hh = String(prevHours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}.${mm} WIB`;
  } catch {
    return '';
  }
};

const ALL_DAYS: DoctorSchedule['hari'][] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Ahad'
];

const COMMON_POLI_OPTIONS = [
  'Poli Anak',
  'Poli Penyakit Dalam',
  'Poli Saraf',
  'Poli Bedah',
  'Poli Obgyn',
  'Poli Mata',
  'Poli Jantung',
  'Poli Paru',
  'Poli THT',
  'Poli Kulit & Kelamin',
  'Poli Ortopedi',
  'Poli Urologi',
  'Poli Rehab Medik',
  'Poli Bedah Saraf',
  'Poli Gigi & Mulut',
  'Poli Jiwa / Psikiatri'
];

export interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Partial<DoctorSchedule> | DoctorSchedule[]) => void;
  poliOptions: string[];
  doctorOptions?: { dpjp: string; poli: string }[];
}

/**
 * BUTTON A: "+ Tambah Dokter Baru" (Primary Green Modal)
 * Purpose: Register a brand new doctor into the hospital system with multiple practice days,
 * HFIS hours, and auto-computed Jam Cetak Otomatis (HFIS - 1 hour).
 */
export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  poliOptions,
  doctorOptions
}) => {
  const [poli, setPoli] = useState('');
  const [spesialisasiCustom, setSpesialisasiCustom] = useState('');
  const [dpjp, setDpjp] = useState('');
  const [selectedDays, setSelectedDays] = useState<DoctorSchedule['hari'][]>(['Senin']);
  const [startHour, setStartHour] = useState('08.00');
  const [endHour, setEndHour] = useState('11.00');
  const [jadwal, setJadwal] = useState('08.00 - 11.00 WIB');
  const [jamHfis, setJamHfis] = useState('08.00 - 11.00 WIB');
  const [jamCetak, setJamCetak] = useState('07.00 WIB');
  const [isJamCetakCustom, setIsJamCetakCustom] = useState(false);
  const [kuotaTotal, setKuotaTotal] = useState<number | string>(30);
  const [kuotaTerisi, setKuotaTerisi] = useState<number | string>(0);
  const [ruangan, setRuangan] = useState('Poli Anak - Lt. 1');
  const [rerataPasien, setRerataPasien] = useState<number | string>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Per-day custom time schedule override map (e.g. Ahad has custom 08.00 - 09.00 WIB)
  const [dayCustomTimes, setDayCustomTimes] = useState<
    Record<string, { jadwal: string; jamHfis: string; jamCetak: string; kuotaTotal?: number }>
  >({});

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setPoli('');
    setSpesialisasiCustom('');
    setDpjp('');
    setSelectedDays(['Senin']);
    setStartHour('08.00');
    setEndHour('11.00');
    setJadwal('08.00 - 11.00 WIB');
    setJamHfis('08.00 - 11.00 WIB');
    setJamCetak('07.00 WIB');
    setIsJamCetakCustom(false);
    setKuotaTotal(30);
    setKuotaTerisi(0);
    setRuangan('Poli Anak - Lt. 1');
    setRerataPasien(0);
    setDayCustomTimes({});
    setValidationError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  // Pre-fill quick test preset for dr. Aulya Farra Rahmadany, Sp. A
  const handleApplyQuickTestPreset = () => {
    setPoli('Poli Anak');
    setSpesialisasiCustom('Dokter Spesialis Anak');
    setDpjp('dr. Aulya Farra Rahmadany, Sp. A');
    setSelectedDays(['Selasa', 'Kamis', 'Sabtu', 'Ahad']);
    setStartHour('08.00');
    setEndHour('11.00');
    setJadwal('08.00 - 11.00 WIB');
    setJamHfis('08.00 - 11.00 WIB');
    setJamCetak('07.00 WIB');
    setIsJamCetakCustom(false);
    setRuangan('Poli Anak - Lt. 1');
    setKuotaTotal(30);
    setKuotaTerisi(0);
    setRerataPasien(0);
    setDayCustomTimes({
      Selasa: { jadwal: '08.00 - 11.00 WIB', jamHfis: '08.00 - 11.00 WIB', jamCetak: '07.00 WIB', kuotaTotal: 30 },
      Kamis: { jadwal: '08.00 - 11.00 WIB', jamHfis: '08.00 - 11.00 WIB', jamCetak: '07.00 WIB', kuotaTotal: 30 },
      Sabtu: { jadwal: '08.00 - 11.00 WIB', jamHfis: '08.00 - 11.00 WIB', jamCetak: '07.00 WIB', kuotaTotal: 30 },
      Ahad: { jadwal: '08.00 - 09.00 WIB', jamHfis: '08.00 - 09.00 WIB', jamCetak: '07.00 WIB', kuotaTotal: 20 }
    });
    setValidationError(null);
  };

  const handleToggleDay = (day: DoctorSchedule['hari']) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev; // Minimal 1 hari
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
    setValidationError(null);
  };

  const handleTimeRangeChange = (start: string, end: string) => {
    setStartHour(start);
    setEndHour(end);
    const combined = `${start} - ${end} WIB`;
    setJadwal(combined);
    setJamHfis(combined);
    if (!isJamCetakCustom) {
      const auto = computeAutoPrintTime(combined);
      if (auto) setJamCetak(auto);
    }
  };

  const handleJamHfisChange = (newHfis: string) => {
    setJamHfis(newHfis);
    if (!isJamCetakCustom) {
      const auto = computeAutoPrintTime(newHfis);
      if (auto) setJamCetak(auto);
    }
  };

  const handleApplyPreset = (presetText: string) => {
    setJadwal(presetText);
    setJamHfis(presetText);
    const parts = presetText.replace(' WIB', '').split('-');
    if (parts.length >= 2) {
      setStartHour(parts[0].trim());
      setEndHour(parts[1].trim());
    }
    if (!isJamCetakCustom) {
      const auto = computeAutoPrintTime(presetText);
      if (auto) setJamCetak(auto);
    }
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const activePoli = (poli || spesialisasiCustom).trim();
    if (!activePoli) {
      setValidationError('Harap isi atau pilih Spesialisasi / Poliklinik dokter.');
      return;
    }

    if (!dpjp.trim()) {
      setValidationError('Harap isi Nama Lengkap Dokter (DPJP).');
      return;
    }

    if (selectedDays.length === 0) {
      setValidationError('Pilih minimal satu hari praktik dokter.');
      return;
    }

    if (!jadwal.trim()) {
      setValidationError('Harap tentukan jam praktik dokter.');
      return;
    }

    const parsedKuotaTotal = Math.max(1, Number(kuotaTotal) || 30);
    const parsedKuotaTerisi = Math.max(0, Number(kuotaTerisi) || 0);
    const parsedRerataPasien = Math.max(0, Number(rerataPasien) || 0);

    const formattedPoli = activePoli.startsWith('Poli ') ? activePoli : `Poli ${activePoli.replace(/^Dokter Spesialis\s+/i, '')}`;

    const schedulesToSave: DoctorSchedule[] = selectedDays.map((dDay, idx) => {
      const custom = dayCustomTimes[dDay];
      const dayJadwal = custom?.jadwal || jadwal.trim();
      const dayHfis = custom?.jamHfis || jamHfis.trim() || dayJadwal;
      const dayCetak = custom?.jamCetak || jamCetak.trim() || computeAutoPrintTime(dayHfis) || '07.00 WIB';
      const dayKuota = custom?.kuotaTotal ?? parsedKuotaTotal;
      const cleanCetak = dayCetak.replace(/^cetak\s*/i, '').trim();

      return {
        id: `sch-${Date.now()}-${idx}`,
        no: 5,
        poli: formattedPoli,
        spesialisasi: spesialisasiCustom.trim() || formattedPoli,
        dpjp: dpjp.trim(),
        hari: dDay,
        jadwal: dayJadwal,
        jamHfis: dayHfis,
        jamCetak: cleanCetak ? `cetak ${cleanCetak.replace(' WIB', '')}` : undefined,
        kuotaTotal: dayKuota,
        kuotaTerisi: parsedKuotaTerisi,
        ruangan: ruangan.trim() || 'Poli Anak - Lt. 1',
        rerataPasien: parsedRerataPasien,
        status: parsedKuotaTerisi >= dayKuota ? 'Penuh' : 'Tersedia'
      };
    });

    onSave(schedulesToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header Modal Overlay */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shadow-2xs">
              <UserPlus className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 leading-tight">Tambah Dokter Baru</h3>
                <span className="px-2 py-0.5 text-[10.5px] font-bold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
                  Dokter Baru
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pendaftaran dokter spesialis baru ke SIMRS & integrasi jadwal HFIS BPJS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3. DEFAULT DATA INJECTION (FOR QUICK TESTING) */}
        <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-950 truncate">Pre-fill Cepat Pengujian Dokter</p>
              <p className="text-[11px] text-emerald-800 truncate">
                dr. Aulya Farra Rahmadany, Sp. A (Poli Anak: Sel, Kam, Sab, Ahd)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyQuickTestPreset}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0"
            title="Klik untuk otomatis mengisi formulir dengan data dr. Aulya Farra Rahmadany, Sp. A"
          >
            <span>⚡ Pre-fill Contoh</span>
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
              className="text-rose-400 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. NAMA DOKTER (DPJP) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span>
                Nama Dokter DPJP <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10.5px] font-normal text-slate-400">Gelar lengkap & spesialis</span>
            </label>
            <input
              type="text"
              required
              value={dpjp}
              onChange={(e) => {
                setDpjp(e.target.value);
                setValidationError(null);
              }}
              placeholder="Contoh: dr. Aulya Farra Rahmadany, Sp. A"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
            />
          </div>

          {/* 2. SPESIALISASI / POLIKLINIK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span>
                Spesialisasi / Poliklinik <span className="text-rose-500">*</span>
              </span>
              {poli && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {poli}
                </span>
              )}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={poli}
                onChange={(e) => {
                  setPoli(e.target.value);
                  if (e.target.value) setSpesialisasiCustom(e.target.value);
                  setValidationError(null);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
              >
                <option value="">-- Pilih Poliklinik --</option>
                {Array.from(new Set([...(poliOptions || []), ...COMMON_POLI_OPTIONS])).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={spesialisasiCustom}
                onChange={(e) => {
                  setSpesialisasiCustom(e.target.value);
                  setPoli(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Contoh: Dokter Spesialis Anak"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
              />
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Pilih dari daftar poliklinik atau ketik nama spesialisasi secara bebas.
            </p>
          </div>

          {/* 3. JADWAL PRAKTIK (DYNAMIC DAY & TIME SELECTOR) */}
          <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span>Hari Praktik (Multi-Pilih Hari) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                {selectedDays.length} Hari Dipilih
              </span>
            </div>

            {/* Multi-select Days Toggle Pills */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{day}</span>
                  </button>
                );
              })}
            </div>

            {/* Jam Praktik Range Inputs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                <span>Jam Praktik Rentang (Start - End) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-500 font-normal">Format 24 Jam (WIB)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    required
                    value={startHour}
                    onChange={(e) => handleTimeRangeChange(e.target.value, endHour)}
                    placeholder="Mulai (misal 08.00)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={endHour}
                    onChange={(e) => handleTimeRangeChange(startHour, e.target.value)}
                    placeholder="Selesai (misal 11.00)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Presets Jam Praktik */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
              <span className="font-semibold text-slate-600">Preset:</span>
              {[
                '08.00 - 11.00 WIB',
                '08.00 - 12.00 WIB',
                '11.00 - 13.30 WIB',
                '13.30 - 15.00 WIB',
                '15.00 - Selesai'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 rounded-md text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Tampilan Ringkasan Hari & Jam yang Terkonfigurasi */}
            {selectedDays.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-[11px] font-semibold text-slate-600 mb-1.5">
                  Daftar Jadwal Per Hari yang akan dibuat:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedDays.map((dDay) => {
                    const custom = dayCustomTimes[dDay];
                    const displayJadwal = custom?.jadwal || jadwal;
                    return (
                      <div
                        key={dDay}
                        className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-[11px] flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800">{dDay}</span>
                        <span className="text-slate-600 font-medium">{displayJadwal}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. JAM HFIS & JAM CETAK OTOMATIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                <span>Jam Layanan HFIS BPJS</span>
                <span className="text-[10px] text-slate-400">VClaim / Mobile JKN</span>
              </label>
              <input
                type="text"
                value={jamHfis}
                onChange={(e) => handleJamHfisChange(e.target.value)}
                placeholder="Contoh: 08.00 - 11.00 WIB"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
              />
              <p className="text-[10.5px] text-slate-500 mt-1">
                Jam buka pendaftaran resmi HFIS BPJS.
              </p>
            </div>

            {/* Calculated Field: Jam Cetak Otomatis (HFIS - 1 Jam) */}
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl">
              <label className="block text-xs font-semibold text-emerald-950 uppercase mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Jam Cetak Otomatis</span>
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded border border-emerald-300">
                  {isJamCetakCustom ? 'Manual' : 'Otomatis: HFIS - 1 Jam'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={jamCetak}
                  onChange={(e) => {
                    setJamCetak(e.target.value);
                    setIsJamCetakCustom(true);
                  }}
                  placeholder="Contoh: 07.00 WIB"
                  className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none font-bold text-emerald-950 bg-white shadow-2xs"
                />
                {isJamCetakCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsJamCetakCustom(false);
                      const auto = computeAutoPrintTime(jamHfis);
                      if (auto) setJamCetak(auto);
                    }}
                    title="Kembalikan ke kalkulasi otomatis (HFIS - 1 Jam)"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
                  >
                    Reset Auto
                  </button>
                )}
              </div>
              <p className="text-[10.5px] text-emerald-800 mt-1 font-medium">
                Waktu cetak antrean otomatis dihitung 1 jam sebelum jam layanan HFIS dimulai ({jamHfis.split('-')[0]?.trim() || '08.00'} $\rightarrow$ {jamCetak}).
              </p>
            </div>
          </div>

          {/* 5. RUANGAN & KUOTA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Ruangan Poli
              </label>
              <input
                type="text"
                value={ruangan}
                onChange={(e) => setRuangan(e.target.value)}
                placeholder="Contoh: Poli Anak - Lt. 1"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
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
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Kuota Terisi
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
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Simpan Dokter Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface AddOrEditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Partial<DoctorSchedule>) => void;
  editingSchedule: DoctorSchedule | null;
  existingSchedules?: DoctorSchedule[];
  doctorOptions?: { dpjp: string; poli: string }[];
  poliOptions: string[];
}

/**
 * BUTTON B: "+ Tambah / Edit Jadwal" (Secondary / Outline Modal)
 * Purpose: Add extra practice days or update hours for an EXISTING registered doctor.
 */
export const AddOrEditScheduleModal: React.FC<AddOrEditScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSchedule,
  existingSchedules = [],
  doctorOptions = [],
  poliOptions
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [poli, setPoli] = useState('');
  const [hari, setHari] = useState<DoctorSchedule['hari']>('Senin');
  const [startHour, setStartHour] = useState('08.00');
  const [endHour, setEndHour] = useState('11.00');
  const [jadwal, setJadwal] = useState('08.00 - 11.00 WIB');
  const [jamHfis, setJamHfis] = useState('08.00 - 11.00 WIB');
  const [jamCetak, setJamCetak] = useState('07.00 WIB');
  const [isJamCetakCustom, setIsJamCetakCustom] = useState(false);
  const [kuotaTotal, setKuotaTotal] = useState<number | string>(30);
  const [kuotaTerisi, setKuotaTerisi] = useState<number | string>(0);
  const [ruangan, setRuangan] = useState('Poliklinik 101');
  const [rerataPasien, setRerataPasien] = useState<number | string>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Daftar seluruh dokter terdaftar yang unik
  const registeredDoctors = useMemo(() => {
    const map = new Map<string, { dpjp: string; poli: string; existingDays: string[]; ruangan?: string }>();
    
    // Dari schedules aktif
    existingSchedules.forEach((s) => {
      if (!s.dpjp) return;
      if (!map.has(s.dpjp)) {
        map.set(s.dpjp, { dpjp: s.dpjp, poli: s.poli, existingDays: [s.hari], ruangan: s.ruangan });
      } else {
        const item = map.get(s.dpjp)!;
        if (!item.existingDays.includes(s.hari)) {
          item.existingDays.push(s.hari);
        }
      }
    });

    // Dari master / doctorOptions
    doctorOptions.forEach((d) => {
      if (!map.has(d.dpjp)) {
        map.set(d.dpjp, { dpjp: d.dpjp, poli: d.poli, existingDays: [] });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.dpjp.localeCompare(b.dpjp));
  }, [existingSchedules, doctorOptions]);

  // Synchronize when opening modal
  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);

    if (editingSchedule) {
      setSelectedDoctor(editingSchedule.dpjp || '');
      setPoli(editingSchedule.poli || '');
      setHari(editingSchedule.hari || 'Senin');
      const curJadwal = editingSchedule.jadwal || '08.00 - 11.00 WIB';
      setJadwal(curJadwal);
      const curHfis = editingSchedule.jamHfis || curJadwal;
      setJamHfis(curHfis);

      const parts = curJadwal.replace(' WIB', '').split('-');
      if (parts.length >= 2) {
        setStartHour(parts[0].trim());
        setEndHour(parts[1].trim());
      }

      if (editingSchedule.jamCetak) {
        setJamCetak(editingSchedule.jamCetak.replace(/^cetak\s*/i, '').trim());
        setIsJamCetakCustom(true);
      } else {
        const auto = computeAutoPrintTime(curHfis) || '07.00 WIB';
        setJamCetak(auto);
        setIsJamCetakCustom(false);
      }
      setKuotaTotal(editingSchedule.kuotaTotal ?? 30);
      setKuotaTerisi(editingSchedule.kuotaTerisi ?? 0);
      setRuangan(editingSchedule.ruangan || 'Poliklinik 101');
      setRerataPasien(editingSchedule.rerataPasien ?? 0);
    } else {
      // Modus tambah jadwal baru untuk dokter existing
      const defaultDoc = registeredDoctors[0]?.dpjp || '';
      const docItem = registeredDoctors.find((d) => d.dpjp === defaultDoc);
      setSelectedDoctor(defaultDoc);
      setPoli(docItem?.poli || '');
      setRuangan(docItem?.ruangan || 'Poliklinik 101');
      
      // Pilih hari pertama yang belum terdaftar untuk dokter ini jika ada
      const firstAvailableDay = ALL_DAYS.find((day) => !docItem?.existingDays.includes(day)) || 'Senin';
      setHari(firstAvailableDay);

      setStartHour('08.00');
      setEndHour('11.00');
      setJadwal('08.00 - 11.00 WIB');
      setJamHfis('08.00 - 11.00 WIB');
      setJamCetak('07.00 WIB');
      setIsJamCetakCustom(false);
      setKuotaTotal(30);
      setKuotaTerisi(0);
      setRerataPasien(0);
    }
  }, [isOpen, editingSchedule, registeredDoctors]);

  if (!isOpen) return null;

  // Selected doctor's current active days
  const currentDoctorData = registeredDoctors.find((d) => d.dpjp === selectedDoctor);
  const activeDoctorDays = currentDoctorData?.existingDays || [];

  const handleSelectDoctor = (doctorName: string) => {
    setSelectedDoctor(doctorName);
    const found = registeredDoctors.find((d) => d.dpjp === doctorName);
    if (found) {
      setPoli(found.poli);
      if (found.ruangan) setRuangan(found.ruangan);
      const freeDay = ALL_DAYS.find((day) => !found.existingDays.includes(day));
      if (freeDay) setHari(freeDay);
    }
    setValidationError(null);
  };

  const handleTimeRangeChange = (start: string, end: string) => {
    setStartHour(start);
    setEndHour(end);
    const combined = `${start} - ${end} WIB`;
    setJadwal(combined);
    setJamHfis(combined);
    if (!isJamCetakCustom) {
      const auto = computeAutoPrintTime(combined);
      if (auto) setJamCetak(auto);
    }
  };

  const handleJamHfisChange = (newHfis: string) => {
    setJamHfis(newHfis);
    if (!isJamCetakCustom) {
      const auto = computeAutoPrintTime(newHfis);
      if (auto) setJamCetak(auto);
    }
  };

  const handleApplyPreset = (presetText: string) => {
    setJadwal(presetText);
    setJamHfis(presetText);
    const parts = presetText.replace(' WIB', '').split('-');
    if (parts.length >= 2) {
      setStartHour(parts[0].trim());
      setEndHour(parts[1].trim());
    }
    if (!isJamCetakCustom) {
      const auto = computeAutoPrintTime(presetText);
      if (auto) setJamCetak(auto);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedDoctor.trim()) {
      setValidationError('Pilih dokter existing terlebih dahulu.');
      return;
    }

    if (!hari) {
      setValidationError('Pilih hari praktik.');
      return;
    }

    if (!jadwal.trim()) {
      setValidationError('Isi jam praktik.');
      return;
    }

    const parsedKuotaTotal = Math.max(1, Number(kuotaTotal) || 30);
    const parsedKuotaTerisi = Math.max(0, Number(kuotaTerisi) || 0);
    const parsedRerataPasien = Math.max(0, Number(rerataPasien) || 0);

    const cleanCetak = jamCetak.replace(/^cetak\s*/i, '').trim();

    onSave({
      id: editingSchedule?.id || `sch-${Date.now()}`,
      dpjp: selectedDoctor.trim(),
      poli: (poli || 'Umum').trim(),
      hari,
      jadwal: jadwal.trim(),
      jamHfis: jamHfis.trim() || jadwal.trim(),
      jamCetak: cleanCetak ? `cetak ${cleanCetak.replace(' WIB', '')}` : undefined,
      kuotaTotal: parsedKuotaTotal,
      kuotaTerisi: parsedKuotaTerisi,
      ruangan: ruangan.trim() || 'Poliklinik 101',
      rerataPasien: parsedRerataPasien,
      status: parsedKuotaTerisi >= parsedKuotaTotal ? 'Penuh' : 'Tersedia'
    });
    onClose();
  };

  const isExistingDay = activeDoctorDays.includes(hari);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header Modal Overlay */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl shadow-2xs">
              <Calendar className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 leading-tight">
                  {editingSchedule ? 'Edit Jadwal Praktik DPJP' : '+ Tambah / Edit Jadwal'}
                </h3>
                <span className="px-2 py-0.5 text-[10.5px] font-bold bg-teal-100 text-teal-800 rounded-md border border-teal-300">
                  Dokter Existing
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {editingSchedule
                  ? 'Perbarui jam praktik atau HFIS untuk jadwal dokter terpilih'
                  : 'Tambah hari praktik baru atau sesuaikan jam untuk dokter yang sudah terdaftar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Modal"
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
              className="text-rose-400 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. PILIH DOKTER EXISTING */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span>
                Pilih Dokter Existing <span className="text-rose-500">*</span>
              </span>
              {poli && (
                <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Poli: {poli}
                </span>
              )}
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => handleSelectDoctor(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-semibold text-slate-900 bg-white"
            >
              <option value="">-- Pilih Dokter Terdaftar --</option>
              {registeredDoctors.map((doc) => (
                <option key={doc.dpjp} value={doc.dpjp}>
                  {doc.dpjp} ({doc.poli})
                </option>
              ))}
            </select>

            {/* Display Currently Active Practice Days */}
            {activeDoctorDays.length > 0 && (
              <div className="mt-2 p-2 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600 shrink-0">Hari Terdaftar:</span>
                <div className="flex flex-wrap gap-1">
                  {activeDoctorDays.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded text-[11px]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. PILIH HARI PRAKTIK / HARI TAMBAHAN */}
          <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span>Pilih Hari Praktik <span className="text-rose-500">*</span></span>
              </label>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isExistingDay
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {isExistingDay ? 'Edit Hari yang Sudah Ada' : '+ Hari Tambahan Baru'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((dDay) => {
                const isSelected = hari === dDay;
                const isRegistered = activeDoctorDays.includes(dDay);
                return (
                  <button
                    key={dDay}
                    type="button"
                    onClick={() => {
                      setHari(dDay);
                      setValidationError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                        : isRegistered
                        ? 'bg-teal-50/70 text-teal-900 border-teal-200 hover:bg-teal-100'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span>{dDay}</span>
                    {isRegistered && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" title="Hari sudah terdaftar" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Jam Praktik Range Inputs */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                <span>Jam Praktik Rentang (Start - End) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-500 font-normal">Format 24 Jam (WIB)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    required
                    value={startHour}
                    onChange={(e) => handleTimeRangeChange(e.target.value, endHour)}
                    placeholder="Mulai (misal 08.00)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={endHour}
                    onChange={(e) => handleTimeRangeChange(startHour, e.target.value)}
                    placeholder="Selesai (misal 11.00)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Presets Jam Praktik */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
              <span className="font-semibold text-slate-600">Preset:</span>
              {[
                '08.00 - 11.00 WIB',
                '08.00 - 12.00 WIB',
                '11.00 - 13.30 WIB',
                '13.30 - 15.00 WIB',
                '15.00 - Selesai'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2 py-0.5 bg-white hover:bg-teal-50 hover:text-teal-800 rounded-md text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 3. JAM HFIS & JAM CETAK OTOMATIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                <span>Jam Layanan HFIS BPJS</span>
                <span className="text-[10px] text-slate-400">VClaim / HFIS</span>
              </label>
              <input
                type="text"
                value={jamHfis}
                onChange={(e) => handleJamHfisChange(e.target.value)}
                placeholder="Contoh: 08.00 - 11.00 WIB"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
              />
              <p className="text-[10.5px] text-slate-500 mt-1">
                Jam buka pendaftaran resmi HFIS BPJS.
              </p>
            </div>

            {/* Calculated Field: Jam Cetak Otomatis (HFIS - 1 Jam) */}
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl">
              <label className="block text-xs font-semibold text-emerald-950 uppercase mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Jam Cetak Otomatis</span>
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded border border-emerald-300">
                  {isJamCetakCustom ? 'Manual' : 'Otomatis: HFIS - 1 Jam'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={jamCetak}
                  onChange={(e) => {
                    setJamCetak(e.target.value);
                    setIsJamCetakCustom(true);
                  }}
                  placeholder="Contoh: 07.00 WIB"
                  className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none font-bold text-emerald-950 bg-white shadow-2xs"
                />
                {isJamCetakCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsJamCetakCustom(false);
                      const auto = computeAutoPrintTime(jamHfis);
                      if (auto) setJamCetak(auto);
                    }}
                    title="Kembalikan ke kalkulasi otomatis (HFIS - 1 Jam)"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
                  >
                    Reset Auto
                  </button>
                )}
              </div>
              <p className="text-[10.5px] text-emerald-800 mt-1 font-medium">
                Waktu cetak antrean otomatis dihitung 1 jam sebelum jam layanan HFIS dimulai ({jamHfis.split('-')[0]?.trim() || '08.00'} $\rightarrow$ {jamCetak}).
              </p>
            </div>
          </div>

          {/* 4. RUANGAN & KUOTA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Ruangan Poli
              </label>
              <input
                type="text"
                value={ruangan}
                onChange={(e) => setRuangan(e.target.value)}
                placeholder="Contoh: Poliklinik 101"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
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
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Kuota Terisi
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
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005d42] outline-none font-medium bg-white"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingSchedule ? 'Simpan Perubahan Jadwal' : 'Simpan Jadwal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Compatibility wrapper for previous AddScheduleModal
export const AddScheduleModal: React.FC<AddScheduleModalProps> = (props) => {
  if (props.editingSchedule) {
    return (
      <AddOrEditScheduleModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        onSave={props.onSave as any}
        editingSchedule={props.editingSchedule}
        poliOptions={props.poliOptions}
        doctorOptions={props.doctorOptions}
      />
    );
  }
  return (
    <AddDoctorModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      onSave={props.onSave}
      poliOptions={props.poliOptions}
      doctorOptions={props.doctorOptions}
    />
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
