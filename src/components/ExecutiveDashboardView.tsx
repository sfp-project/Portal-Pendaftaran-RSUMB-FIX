import React, { useMemo, useState, useEffect } from 'react';
import {
  Stethoscope,
  CalendarX2,
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Building2,
  Calendar,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Search,
  ClipboardList,
  Scissors,
  Share2,
  FileCheck2,
  Printer,
  QrCode,
  Inbox,
  Filter,
  ExternalLink as ExternalLinkIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DoctorSchedule, DoctorLeaveAnnouncement, PatientSelfRegistrationItem } from '../types';
import { ElectiveSurgerySchedule, initialSurgerySchedules } from '../data/surgeryData';
import {
  loadShiftHandoverRecords,
  loadBpjsKendalaRecords,
  loadKllRecords
} from '../data/patientNotesData';
import { DailyHuddleReportModal } from './dashboard/DailyHuddleReportModal';
import { DoctorScheduleThermalSlipModal } from './dashboard/DoctorScheduleThermalSlipModal';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import {
  PatientSelfRegistrationStandeeModal,
  getDefaultDynamicUrl,
  formatEffectiveQrUrl
} from './forms/PatientSelfRegistrationStandeeModal';
import { IncomingSelfRegistrationsModal } from './forms/IncomingSelfRegistrationsModal';
import { subscribePatientSelfRegistrations } from '../services/firestoreSync';
import { RSUMB_LOGO_BASE64 } from '../assets/logoRsumbBase64';
import {
  isDoctorLeaveActiveOnDate,
  formatDoctorScheduleTime,
  formatYMDToIndonesian,
  normalizeDoctorName
} from '../utils/dateHelpers';

interface ExecutiveDashboardViewProps {
  schedules: DoctorSchedule[];
  doctorLeaves: DoctorLeaveAnnouncement[];
  surgeryList?: ElectiveSurgerySchedule[];
  onNavigateToSchedules: (filterType?: 'all' | 'libur' | string) => void;
  onSelectClinicFilter: (poli: string) => void;
  onOpenBookModal: () => void;
  onToggleGemini: () => void;
  onNavigateToModule?: (moduleName: string) => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  searchTerm?: string;
  onClearSearch?: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  schedules,
  doctorLeaves,
  surgeryList,
  onNavigateToSchedules,
  onSelectClinicFilter,
  onOpenBookModal,
  onToggleGemini,
  onNavigateToModule,
  showToast,
  searchTerm = '',
  onClearSearch
}) => {
  // Modal State for Daily Huddle Report
  const [isDailyHuddleOpen, setIsDailyHuddleOpen] = useState(false);
  // Modal State for Thermal Slip Jadwal Dokter
  const [isThermalSlipModalOpen, setIsThermalSlipModalOpen] = useState(false);
  // Modal State for Patient Registration Slip (1/3 F4)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  // Modal State for Standee Poster QR Code (A4/A5)
  const [isStandeeModalOpen, setIsStandeeModalOpen] = useState(false);
  // Modal State for Incoming Self-Registrations (Real-Time)
  const [isIncomingDataModalOpen, setIsIncomingDataModalOpen] = useState(false);
  const [incomingCount, setIncomingCount] = useState<number>(0);
  const [selectedPatientForSlip, setSelectedPatientForSlip] = useState<any>(null);

  // State Filter & Pencarian Widget "Ringkasan Praktik Hari Ini"
  const [todayWidgetSearch, setTodayWidgetSearch] = useState('');
  const [todayWidgetStatus, setTodayWidgetStatus] = useState<'all' | 'active' | 'leave'>('all');
  const [todayWidgetPoli, setTodayWidgetPoli] = useState<string>('all');

  // Helper URL Pendaftaran Mandiri Pasien (Bebas 403 Forbidden & Mendukung Dynamic Origin / Override)
  const getCleanPublicFormUrl = (): string => {
    try {
      const saved = localStorage.getItem('rsumb_custom_self_reg_url');
      if (saved && saved.trim()) {
        return formatEffectiveQrUrl(saved.trim());
      }
    } catch {}

    return getDefaultDynamicUrl();
  };

  const [selfRegUrl, setSelfRegUrl] = useState<string>(getCleanPublicFormUrl);

  // Dengarkan pembaruan custom URL dari Standee modal
  useEffect(() => {
    const handleUrlUpdate = (e: any) => {
      setSelfRegUrl(e.detail || getCleanPublicFormUrl());
    };
    window.addEventListener('rsumb_custom_url_updated', handleUrlUpdate);
    return () => window.removeEventListener('rsumb_custom_url_updated', handleUrlUpdate);
  }, []);

  // Real-time subscription untuk incoming self registrations
  useEffect(() => {
    const unsub = subscribePatientSelfRegistrations((list) => {
      setIncomingCount(list.length);
    });

    const handleOpenIncomingModal = () => {
      setIsIncomingDataModalOpen(true);
    };

    window.addEventListener('rsumb_open_incoming_self_reg_modal', handleOpenIncomingModal);
    window.addEventListener('rsumb_open_incoming_self_reg_modal_inner', handleOpenIncomingModal);

    return () => {
      unsub();
      window.removeEventListener('rsumb_open_incoming_self_reg_modal', handleOpenIncomingModal);
      window.removeEventListener('rsumb_open_incoming_self_reg_modal_inner', handleOpenIncomingModal);
    };
  }, []);

  // 1. Current Date Context (Simulated / Real: local container date)
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayName = dayNames[now.getDay()]; // e.g. "Jumat"

  // Helper normalizer for day matching
  const normalizeDay = (d: string) =>
    d.trim().toLowerCase().replace(/['`]/g, '');

  const todayDayNorm = normalizeDay(currentDayName);

  // 2. Identify doctor leaves specifically active today
  const todayLeaves = useMemo(() => {
    return doctorLeaves.filter((leave) => isDoctorLeaveActiveOnDate(leave, todayYMD));
  }, [doctorLeaves, todayYMD]);

  // Set of doctors on leave today (normalized)
  const doctorsOnLeaveTodaySet = useMemo(() => {
    const set = new Set<string>();
    todayLeaves.forEach((l) => {
      set.add(normalizeDoctorName(l.dpjp));
    });
    return set;
  }, [todayLeaves]);

  // 3. Schedules registered for today (matching current day)
  const schedulesToday = useMemo(() => {
    return schedules.filter((s) => {
      const schDayNorm = normalizeDay(s.hari);
      return schDayNorm === todayDayNorm || schDayNorm.includes(todayDayNorm) || todayDayNorm.includes(schDayNorm);
    });
  }, [schedules, todayDayNorm]);

  // Active doctors practicing today (scheduled today AND NOT on leave today)
  const activeDoctorsToday = useMemo(() => {
    const activeMap = new Map<string, DoctorSchedule>();
    schedulesToday.forEach((s) => {
      const normName = normalizeDoctorName(s.dpjp);
      if (!doctorsOnLeaveTodaySet.has(normName)) {
        if (!activeMap.has(normName)) {
          activeMap.set(normName, s);
        }
      }
    });
    return Array.from(activeMap.values());
  }, [schedulesToday, doctorsOnLeaveTodaySet]);

  // Distinct doctors scheduled today
  const totalDoctorsScheduledToday = useMemo(() => {
    const set = new Set(schedulesToday.map((s) => normalizeDoctorName(s.dpjp)));
    return set.size;
  }, [schedulesToday]);

  // 4. Kuota calculations for today
  const { totalKuotaTerisiHariIni, totalKuotaKapasitasHariIni } = useMemo(() => {
    let terisi = 0;
    let kapasitas = 0;
    schedulesToday.forEach((s) => {
      terisi += s.kuotaTerisi || 0;
      kapasitas += s.kuotaTotal || 0;
    });
    return {
      totalKuotaTerisiHariIni: terisi,
      totalKuotaKapasitasHariIni: kapasitas
    };
  }, [schedulesToday]);

  const kuotaPercentage = totalKuotaKapasitasHariIni > 0
    ? Math.min(100, Math.round((totalKuotaTerisiHariIni / totalKuotaKapasitasHariIni) * 100))
    : 0;

  // Daftar poliklinik unik yang memiliki jadwal dokter hari ini
  const todayAvailablePolis = useMemo(() => {
    const set = new Set<string>();
    schedulesToday.forEach((s) => {
      if (s.poli) set.add(s.poli);
    });
    return Array.from(set).sort();
  }, [schedulesToday]);

  // Data filter dokter hari ini untuk widget "Ringkasan Praktik Hari Ini"
  const filteredSchedulesToday = useMemo(() => {
    return schedulesToday.filter((s) => {
      const normDpjp = normalizeDoctorName(s.dpjp);
      const isOnLeave = doctorsOnLeaveTodaySet.has(normDpjp);

      if (todayWidgetStatus === 'active' && isOnLeave) return false;
      if (todayWidgetStatus === 'leave' && !isOnLeave) return false;

      if (todayWidgetPoli !== 'all' && s.poli !== todayWidgetPoli) return false;

      if (todayWidgetSearch.trim()) {
        const q = todayWidgetSearch.toLowerCase().trim();
        const matchDoctor = s.dpjp.toLowerCase().includes(q);
        const matchPoli = s.poli.toLowerCase().includes(q);
        const matchCatatan = (s.catatan || '').toLowerCase().includes(q);
        const matchJam = (s.jamPraktik || s.jadwal || '').toLowerCase().includes(q);
        const matchHfis = (s.jamHfis || s.hfis || '').toLowerCase().includes(q);
        if (!matchDoctor && !matchPoli && !matchCatatan && !matchJam && !matchHfis) return false;
      }

      return true;
    });
  }, [schedulesToday, doctorsOnLeaveTodaySet, todayWidgetStatus, todayWidgetPoli, todayWidgetSearch]);

  // 4.5 Aggregations for Daily Huddle Teaser & Report
  const actualSurgeries = useMemo(() => {
    if (surgeryList && surgeryList.length > 0) return surgeryList;
    try {
      const saved = localStorage.getItem('rsumb_surgery_schedules_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading surgeries for dashboard:', e);
    }
    return [];
  }, [surgeryList]);

  const surgeriesTodayCount = useMemo(() => {
    const [targetY, targetM, targetD] = todayYMD.split('-').map(Number);
    return actualSurgeries.filter((s) => {
      if (!s.rencanaOp) return false;
      const val = s.rencanaOp.trim();
      if (val.includes('T') || val.includes('-')) {
        const datePart = val.split(/[T\s]/)[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
          return (
            parseInt(parts[0], 10) === targetY &&
            parseInt(parts[1], 10) === targetM &&
            parseInt(parts[2], 10) === targetD
          );
        }
      }
      const datePart = val.split(/\s+/)[0];
      const parts = datePart.split('/');
      if (parts.length === 3) {
        return (
          parseInt(parts[2], 10) === targetY &&
          parseInt(parts[1], 10) === targetM &&
          parseInt(parts[0], 10) === targetD
        );
      }
      return false;
    }).length;
  }, [actualSurgeries, todayYMD]);

  const highPriorityNotesCount = useMemo(() => {
    try {
      const handovers = loadShiftHandoverRecords().filter(
        (h) => h.prioritas === 'Tinggi' || h.status === 'Pending'
      );
      const bpjs = loadBpjsKendalaRecords().filter((b) => b.status === 'Pending');
      const kll = loadKllRecords().filter((k) => k.isInsidenActive || k.statusLp === 'BELUM');
      return handovers.length + bpjs.length + kll.length;
    } catch {
      return 3;
    }
  }, []);

  // 5. Poliklinik Real-time Status Calculation
  const allClinics = useMemo(() => {
    const clinicsMap = new Map<
      string,
      {
        poli: string;
        schedulesToday: DoctorSchedule[];
        allSchedules: DoctorSchedule[];
        leavesToday: DoctorLeaveAnnouncement[];
      }
    >();

    // Collect from all schedules
    schedules.forEach((s) => {
      if (!clinicsMap.has(s.poli)) {
        clinicsMap.set(s.poli, {
          poli: s.poli,
          schedulesToday: [],
          allSchedules: [],
          leavesToday: []
        });
      }
      const entry = clinicsMap.get(s.poli)!;
      entry.allSchedules.push(s);

      const schDayNorm = normalizeDay(s.hari);
      if (schDayNorm === todayDayNorm || schDayNorm.includes(todayDayNorm) || todayDayNorm.includes(schDayNorm)) {
        entry.schedulesToday.push(s);
      }
    });

    // Check leaves for clinics
    todayLeaves.forEach((leave) => {
      // Find clinic
      let matchedClinic = leave.poli;
      if (!clinicsMap.has(matchedClinic)) {
        // try to find matching
        for (const [p] of clinicsMap.entries()) {
          if (p.toLowerCase().includes(leave.poli.toLowerCase()) || leave.poli.toLowerCase().includes(p.toLowerCase())) {
            matchedClinic = p;
            break;
          }
        }
      }
      if (clinicsMap.has(matchedClinic)) {
        clinicsMap.get(matchedClinic)!.leavesToday.push(leave);
      }
    });

    // Determine status for each clinic
    return Array.from(clinicsMap.values()).map((clinic) => {
      const scheduledCount = clinic.schedulesToday.length;
      const onLeaveCount = clinic.schedulesToday.filter((s) =>
        doctorsOnLeaveTodaySet.has(normalizeDoctorName(s.dpjp))
      ).length;
      const activeCount = scheduledCount - onLeaveCount;

      let status: 'BUKA' | 'CUTI' | 'TERBATAS' | 'TUTUP';
      let statusLabel: string;
      let badgeColor: string;
      let dotColor: string;

      if (scheduledCount === 0) {
        status = 'TUTUP';
        statusLabel = 'Tidak Ada Jadwal Hari Ini';
        badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
        dotColor = 'bg-slate-400';
      } else if (activeCount > 0 && onLeaveCount === 0) {
        status = 'BUKA';
        statusLabel = `Buka (${activeCount} Dokter)`;
        badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        dotColor = 'bg-emerald-500';
      } else if (activeCount > 0 && onLeaveCount > 0) {
        status = 'TERBATAS';
        statusLabel = `Terbatas (${activeCount} Aktif, ${onLeaveCount} Cuti)`;
        badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
        dotColor = 'bg-amber-500';
      } else {
        // scheduledCount > 0 but activeCount === 0 (all on leave)
        status = 'CUTI';
        statusLabel = 'Dokter Cuti / Libur';
        badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
        dotColor = 'bg-rose-500';
      }

      // Sum clinic quota today
      const clinicKuotaTerisi = clinic.schedulesToday.reduce((acc, c) => acc + (c.kuotaTerisi || 0), 0);
      const clinicKuotaTotal = clinic.schedulesToday.reduce((acc, c) => acc + (c.kuotaTotal || 0), 0);

      // Primary hours
      const sampleHours = clinic.schedulesToday[0]?.jadwal || clinic.schedulesToday[0]?.jamHfis || '07.30 - 12.00 WIB';

      return {
        ...clinic,
        activeCount,
        onLeaveCount,
        scheduledCount,
        status,
        statusLabel,
        badgeColor,
        dotColor,
        clinicKuotaTerisi,
        clinicKuotaTotal,
        sampleHours
      };
    }).sort((a, b) => {
      // Prioritize open and active clinics first
      const score = (item: typeof a) => {
        if (item.status === 'BUKA') return 1;
        if (item.status === 'TERBATAS') return 2;
        if (item.status === 'CUTI') return 3;
        return 4;
      };
      return score(a) - score(b);
    });
  }, [schedules, todayLeaves, todayDayNorm, doctorsOnLeaveTodaySet]);

  const bukaClinicsCount = allClinics.filter((c) => c.status === 'BUKA').length;
  const cutiClinicsCount = allClinics.filter((c) => c.status === 'CUTI').length;
  const terbatasClinicsCount = allClinics.filter((c) => c.status === 'TERBATAS').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Executive Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-[#005d42] via-[#004a35] to-[#013526] rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <img
              src={RSUMB_LOGO_BASE64}
              alt="Logo RSUMB"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full bg-white p-1 ring-4 ring-emerald-400/40 shadow-lg shrink-0 hidden sm:block hover:scale-105 transition-transform"
            />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Executive Dashboard SIMRS • RSU Muhammadiyah Babat</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Ringkasan Operasional & Ketersediaan Dokter
              </h2>
              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                Pantau kesiapan poliklinik rawat jalan, kehadiran DPJP spesialis, dan utilisasi kuota pendaftaran pasien BPJS secara real-time pada hari{' '}
                <span className="font-semibold text-white underline decoration-emerald-400/60 underline-offset-4">
                  {currentDayName}, {formatYMDToIndonesian(todayYMD, false)}
                </span>.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <button
              onClick={() => setIsDailyHuddleOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-200"
              title="Buka Daily Huddle Report untuk Morning Medical Briefing"
            >
              <ClipboardList className="w-4 h-4 text-slate-950" />
              <span>Daily Huddle Report</span>
              <span className="bg-emerald-950/20 text-emerald-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                Briefing Pagi
              </span>
            </button>

            <button
              onClick={() => onNavigateToSchedules()}
              className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-emerald-50 text-[#005d42] font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
              title="Buka Halaman Manajemen Jadwal Lengkap"
            >
              <Calendar className="w-4 h-4 text-[#005d42] group-hover:scale-110 transition-transform" />
              <span>Kelola Jadwal Dokter</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
            </button>

            <button
              onClick={onOpenBookModal}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600/60 hover:bg-emerald-600/80 border border-emerald-400/40 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Terbitkan Nomor Antrean Pasien"
            >
              <Users className="w-4 h-4 text-emerald-200" />
              <span>Pendaftaran Pasien</span>
            </button>

            <button
              onClick={onToggleGemini}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-amber-400/90 hover:bg-amber-400 text-amber-950 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Tanyakan sesuatu pada Asisten AI"
            >
              <Sparkles className="w-4 h-4 text-amber-950 fill-amber-950" />
              <span>Tanya AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1.5 CARD WIDGET KHUSUS: CETAK SLIP / KARTU INFORMASI JADWAL DOKTER */}
      <div className="bg-gradient-to-br from-emerald-900 via-[#005d42] to-teal-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-emerald-700/50 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="relative z-10 flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0 text-emerald-300">
            <Printer className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                Cetak Slip / Kartu Informasi Jadwal
              </h3>
              <span className="text-[10px] font-bold uppercase bg-emerald-400/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                Printer Thermal POS 58mm / 80mm
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl leading-relaxed">
              Cetak struk informasi pendaftaran & QR Code jadwal dokter / info libur real-time untuk diberikan langsung kepada pasien atau keluarga yang mendaftar di admisi.
            </p>
            <div className="flex items-center gap-3 sm:gap-4 mt-2.5 text-[11px] text-emerald-200/90 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Format Rapi Tanpa Logo</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> QR Code Publik SIMRS</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Info Telp & Alamat Lengkap</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 shrink-0 w-full md:w-auto flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            id="btn-beranda-open-thermal-slip"
            onClick={() => setIsThermalSlipModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-emerald-50 text-[#005d42] active:bg-emerald-100 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md hover:shadow-xl active:scale-95 transition-all cursor-pointer border border-white/80 group"
          >
            <Printer className="w-4 h-4 text-[#005d42] group-hover:scale-110 transition-transform" />
            <span>🖨️ Cetak Slip Thermal</span>
          </button>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 1.6 CARD WIDGET: FORM IDENTITAS PASIEN (1/3 F4) & QR PENDAFTARAN MANDIRI */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 hover:shadow-lg transition-shadow">
        {/* Kolom Informasi & Tombol Aksi */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-200 shadow-2xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Formulir Pendaftaran Pasien (1/3 F4) & QR Mandiri
              </h3>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Kertas SEP &bull; 215 x 110 mm
              </span>
              <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                Self-Service QR
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Cetak formulir isian fisik ukuran 1/3 F4 (atau opsi 3-in-1 kertas F4 utuh), atau persilakan pasien memindai (scan) QR Code pendaftaran mandiri dari HP masing-masing di meja loket admisi.
            </p>

            {/* 3 Tombol Aksi Admisi */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientForSlip(null);
                  setIsRegistrationModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#005d42] hover:bg-emerald-800 active:bg-emerald-950 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Buka pratinjau dan cetak formulir fisik 1/3 F4 atau 3-in-1"
              >
                <Printer className="w-4 h-4 text-emerald-200" />
                <span>🖨️ Cetak Form Isian (1/3 F4)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsStandeeModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Cetak poster/standee akrilik meja ukuran A4/A5 untuk dipajang di loket admisi"
              >
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>🖨️ Cetak Standee Meja QR</span>
              </button>

              <button
                type="button"
                onClick={() => setIsIncomingDataModalOpen(true)}
                className="relative px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                title="Buka daftar data pendaftaran mandiri yang masuk secara real-time dari HP pasien"
              >
                <Inbox className="w-4 h-4 text-emerald-400" />
                <span>📥 Data Masuk Scan QR Pasien</span>
                <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full ml-0.5">
                  {incomingCount}
                </span>
                {incomingCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-ping" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kotak QR Code Pendaftaran Mandiri (Scan HP Pasien) */}
        <div className="shrink-0 flex flex-col items-center justify-center p-3.5 bg-emerald-50/70 rounded-2xl border-2 border-dashed border-emerald-500/70 shadow-2xs group hover:bg-emerald-50 transition-all text-center">
          <div className="p-2 bg-white rounded-xl shadow-xs border border-emerald-200">
            <QRCodeSVG value={selfRegUrl} size={84} level="M" />
          </div>
          <div className="mt-2 text-center">
            <div className="text-[11px] font-black text-emerald-950 uppercase tracking-tight">
              Pendaftaran Mandiri Pasien
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1 mt-0.5">
              <span>Scan Kamera HP</span>
              <ExternalLinkIcon className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <a
            href={selfRegUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 text-[10px] text-[#005d42] hover:underline font-semibold bg-white/80 px-2 py-0.5 rounded border border-emerald-200"
          >
            Buka Form Pasien ↗
          </a>
        </div>
      </div>

      {/* Modal 1: Cetak Formulir Slip 1/3 F4 */}
      <PatientRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => {
          setIsRegistrationModalOpen(false);
          setSelectedPatientForSlip(null);
        }}
        initialPatientData={selectedPatientForSlip}
      />

      {/* Modal 2: Cetak Standee Meja Akrilik QR Code A4/A5 */}
      <PatientSelfRegistrationStandeeModal
        isOpen={isStandeeModalOpen}
        onClose={() => setIsStandeeModalOpen(false)}
        formUrl={selfRegUrl}
        onUrlChange={(newUrl) => setSelfRegUrl(newUrl)}
      />

      {/* Modal 3: Data Masuk Scan QR Pasien (Real-Time) */}
      <IncomingSelfRegistrationsModal
        isOpen={isIncomingDataModalOpen}
        onClose={() => setIsIncomingDataModalOpen(false)}
        showToast={showToast}
        onPrintPatientSlip={(patient) => {
          setSelectedPatientForSlip({
            nama: patient.namaPasien,
            nik: patient.nik,
            noHp: patient.noHp,
            tglLahir: patient.tanggalLahir
              ? `${patient.tempatLahir ? patient.tempatLahir + ', ' : ''}${patient.tanggalLahir}`
              : patient.tempatLahir,
            alamat: patient.alamat,
            penanggungJawab: patient.namaPenanggungJawab,
            hubungan: patient.hubunganKeluarga,
            jenisKelamin: patient.jenisKelamin,
            statusPasien: patient.statusPasien,
            jenisPembayaran: patient.jenisPembayaran
          });
          setIsIncomingDataModalOpen(false);
          setIsRegistrationModalOpen(true);
        }}
      />

      {/* 2. KARTU RINGKAS HARI INI (4 EXECUTIVE METRICS) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#005d42]" />
            <span>Indikator Kunci Hari Ini ({currentDayName})</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Sinkronisasi HFIS Aktif • Update Otomatis
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Dokter Praktik Hari Ini */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Dokter Praktik Hari Ini
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {activeDoctorsToday.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    / {totalDoctorsScheduledToday} DPJP
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <CheckCircle2 className="w-3 h-3" />
                {totalDoctorsScheduledToday > 0
                  ? `${Math.round((activeDoctorsToday.length / totalDoctorsScheduledToday) * 100)}% Kehadiran`
                  : 'Siap Layanan'}
              </span>
              <button
                onClick={() => onNavigateToSchedules()}
                className="text-slate-500 hover:text-[#005d42] font-semibold transition-colors cursor-pointer"
              >
                Lihat Jadwal →
              </button>
            </div>
          </div>

          {/* Card 2: Dokter Cuti / Libur Hari Ini */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Dokter Cuti/Libur Hari Ini
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-extrabold tracking-tight ${
                      todayLeaves.length > 0 ? 'text-amber-700' : 'text-slate-900'
                    }`}
                  >
                    {todayLeaves.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Dokter</span>
                </div>
              </div>
              <div
                className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-2xs shrink-0 ${
                  todayLeaves.length > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <CalendarX2 className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border ${
                  todayLeaves.length > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {todayLeaves.length > 0 ? (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    Perubahan Aktif
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Semua Praktik Normal
                  </>
                )}
              </span>
              {todayLeaves.length > 0 && (
                <button
                  onClick={() => onNavigateToSchedules('libur')}
                  className="text-amber-700 hover:text-amber-900 font-semibold transition-colors cursor-pointer"
                >
                  Detail Libur →
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Total Kuota Terisi vs Kapasitas */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Kuota Terisi vs Kapasitas
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {totalKuotaTerisiHariIni}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    / {totalKuotaKapasitasHariIni} Slot
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    kuotaPercentage >= 90
                      ? 'bg-rose-500'
                      : kuotaPercentage >= 70
                      ? 'bg-amber-500'
                      : 'bg-[#005d42]'
                  }`}
                  style={{ width: `${kuotaPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{kuotaPercentage}% Terisi</span>
                <span className="font-semibold text-slate-700">
                  Sisa {Math.max(0, totalKuotaKapasitasHariIni - totalKuotaTerisiHariIni)} Slot
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Status Koneksi HFIS/SIMRS */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status Koneksi HFIS / SIMRS
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-lg font-extrabold text-emerald-800 tracking-tight">
                    Terhubung & Sinkron
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                <RefreshCw className="w-3 h-3 text-emerald-600" />
                Latensi 24ms • REST v2.1
              </span>
              <span className="text-emerald-700 font-semibold">Bridging Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 BANNER PROMINEN: DAILY HUDDLE & MORNING BRIEFING AGGREGATOR */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#004732] to-[#005d42] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 border border-emerald-800/40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 text-emerald-300 shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-400/25 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Sesi Morning Medical Briefing
              </span>
              <span className="text-xs text-emerald-100 font-semibold">
                • {formatYMDToIndonesian(todayYMD, true)}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              Laporan Terpadu Daily Huddle (Operasi IBS, DPJP Cuti & Pasien Prioritas)
            </h3>
            <p className="text-xs text-emerald-100/85 max-w-2xl leading-relaxed">
              Agregator otomatis kesiapan layanan untuk briefing pagi tim dokter, kepala ruangan, dan staf admisi. Dilengkapi cetak formulir resmi A4 dan salin ringkasan WhatsApp grup.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/15 text-xs text-emerald-100">
            <div className="text-center px-1.5 border-r border-white/15">
              <span className="block text-[10px] text-emerald-300 font-bold uppercase">IBS Hari Ini</span>
              <span className="text-sm font-extrabold text-white">{surgeriesTodayCount}</span>
            </div>
            <div className="text-center px-1.5 border-r border-white/15">
              <span className="block text-[10px] text-emerald-300 font-bold uppercase">DPJP Cuti</span>
              <span className="text-sm font-extrabold text-amber-300">{todayLeaves.length}</span>
            </div>
            <div className="text-center px-1.5">
              <span className="block text-[10px] text-emerald-300 font-bold uppercase">Prioritas</span>
              <span className="text-sm font-extrabold text-rose-300">{highPriorityNotesCount}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDailyHuddleOpen(true)}
            className="py-2.5 px-4 bg-white hover:bg-emerald-50 text-[#005d42] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group"
          >
            <span>Buka Laporan Huddle</span>
            <ChevronRight className="w-4 h-4 text-[#005d42] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 2.8 WIDGET: RINGKASAN PRAKTIK HARI INI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md">
        {/* Header Widget */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#005d42] border border-emerald-200 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Ringkasan Praktik Hari Ini
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                {currentDayName}, {formatYMDToIndonesian(todayYMD, true)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Daftar seluruh dokter spesialis yang memiliki jadwal pelayanan rawat jalan hari ini beserta waktu praktik, jam HFIS, kuota BPJS, dan status kehadiran.
            </p>
          </div>

          {/* Quick Counter Badges & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>{schedulesToday.length} Terdaftar</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeDoctorsToday.length} Aktif</span>
            </span>
            {todayLeaves.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{todayLeaves.length} Cuti/Libur</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsThermalSlipModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#005d42] border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Cetak struk jadwal praktik hari ini pada printer thermal"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Cetak Slip</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToSchedules()}
              className="px-3.5 py-1.5 bg-[#005d42] hover:bg-emerald-800 active:bg-emerald-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Buka tabel jadwal dokter lengkap"
            >
              <span>Tabel Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-4 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={todayWidgetSearch}
              onChange={(e) => setTodayWidgetSearch(e.target.value)}
              placeholder="Cari dokter, spesialisasi, atau jam praktik hari ini..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-hidden text-slate-800 placeholder-slate-400"
            />
            {todayWidgetSearch && (
              <button
                type="button"
                onClick={() => setTodayWidgetSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setTodayWidgetStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                todayWidgetStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua ({schedulesToday.length})
            </button>
            <button
              type="button"
              onClick={() => setTodayWidgetStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                todayWidgetStatus === 'active'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span>Aktif</span>
              <span className="text-[10px] px-1 rounded-full bg-white/20">
                {activeDoctorsToday.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTodayWidgetStatus('leave')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                todayWidgetStatus === 'leave'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              <span>Cuti/Libur</span>
              <span className="text-[10px] px-1 rounded-full bg-white/20">
                {todayLeaves.length}
              </span>
            </button>

            {/* Poli Dropdown */}
            {todayAvailablePolis.length > 0 && (
              <div className="relative shrink-0 ml-1">
                <select
                  value={todayWidgetPoli}
                  onChange={(e) => setTodayWidgetPoli(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-6 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="all">Semua Poliklinik</option>
                  {todayAvailablePolis.map((poli) => (
                    <option key={poli} value={poli}>
                      Poli {poli}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content Table & Mobile Cards */}
        <div className="mt-4">
          {filteredSchedulesToday.length > 0 ? (
            <>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-extrabold">
                      <th className="py-3 px-3.5 w-12 text-center">No</th>
                      <th className="py-3 px-4">Dokter & Poliklinik</th>
                      <th className="py-3 px-3.5">Jam Praktik</th>
                      <th className="py-3 px-3.5">Jam HFIS</th>
                      <th className="py-3 px-3.5 text-center">Kuota BPJS</th>
                      <th className="py-3 px-4">Status & Catatan</th>
                      <th className="py-3 px-3.5 text-right w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredSchedulesToday.map((item, idx) => {
                      const normDpjp = normalizeDoctorName(item.dpjp);
                      const leaveInfo = todayLeaves.find(
                        (l) => normalizeDoctorName(l.dpjp) === normDpjp
                      );
                      const isOnLeave = Boolean(leaveInfo);
                      const activeJadwal = leaveInfo?.jadwal?.[0];

                      const kuotaTotal =
                        Number(item.kuotaBpjs) ||
                        Number(item.kuotaTotal) ||
                        Number(item.kuota) ||
                        40;
                      const kuotaTerisi = Number(item.kuotaTerisi) || 0;
                      const pct = Math.min(100, Math.round((kuotaTerisi / (kuotaTotal || 1)) * 100));

                      return (
                        <tr
                          key={`${item.id || idx}-${item.dpjp}`}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isOnLeave ? 'bg-amber-50/25' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                              <span>{item.dpjp}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span
                                onClick={() => onSelectClinicFilter(item.poli)}
                                className="inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                                title={`Saring jadwal Poli ${item.poli}`}
                              >
                                Poli {item.poli}
                              </span>
                              {item.ruangan && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                  {item.ruangan}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            {/* Gaya teks jam praktik biru tua */}
                            <span className="text-blue-800 font-bold bg-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-200 inline-flex items-center gap-1 font-mono tracking-tight text-xs">
                              <Clock className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                              <span>{formatDoctorScheduleTime(item)}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            {/* Gaya teks jam HFIS tebal dan merah tua */}
                            <span className="font-bold text-red-800 bg-red-50/90 px-2.5 py-1 rounded-lg border border-red-200 inline-flex items-center gap-1 font-mono tracking-tight text-xs">
                              <Clock className="w-3.5 h-3.5 text-red-800 shrink-0" />
                              <span>{item.jamHfis || item.hfis || '-'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {/* Gaya angka kuota BPJS berukuran tebal dan berwarna hitam pekat */}
                            <div className="font-bold text-gray-900 text-sm">
                              {kuotaTerisi} <span className="text-xs text-gray-500 font-normal">/ {kuotaTotal}</span>
                            </div>
                            <div className="w-16 mx-auto bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 90
                                    ? 'bg-rose-500'
                                    : pct >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-[#005d42]'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isOnLeave ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-700" />
                                  <span>
                                    {activeJadwal?.tipe === 'MAJU'
                                      ? 'Maju Praktik'
                                      : activeJadwal?.tipe === 'CUTI'
                                      ? 'Cuti'
                                      : 'Libur / Penyesuaian'}
                                  </span>
                                </span>
                                {activeJadwal?.keterangan && (
                                  <p className="text-[11px] text-amber-900 font-medium line-clamp-1">
                                    {activeJadwal.keterangan}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>Aktif Praktik</span>
                                </span>
                                {item.catatan && (
                                  <p className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 line-clamp-1 italic">
                                    &ldquo;{item.catatan}&rdquo;
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => onNavigateToSchedules(item.dpjp)}
                              className="px-2.5 py-1 text-xs font-bold text-[#005d42] hover:text-white bg-emerald-50 hover:bg-[#005d42] rounded-lg border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Buka jadwal dokter ini di tabel utama"
                            >
                              <span>Lihat</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredSchedulesToday.map((item, idx) => {
                  const normDpjp = normalizeDoctorName(item.dpjp);
                  const leaveInfo = todayLeaves.find(
                    (l) => normalizeDoctorName(l.dpjp) === normDpjp
                  );
                  const isOnLeave = Boolean(leaveInfo);
                  const activeJadwal = leaveInfo?.jadwal?.[0];

                  const kuotaTotal =
                    Number(item.kuotaBpjs) ||
                    Number(item.kuotaTotal) ||
                    Number(item.kuota) ||
                    40;
                  const kuotaTerisi = Number(item.kuotaTerisi) || 0;

                  return (
                    <div
                      key={`mob-${item.id || idx}-${item.dpjp}`}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isOnLeave
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            onClick={() => onSelectClinicFilter(item.poli)}
                            className="inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer"
                          >
                            Poli {item.poli}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-1 leading-snug">
                            {item.dpjp}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            isOnLeave
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {isOnLeave ? 'Libur/Cuti' : 'Aktif Praktik'}
                        </span>
                      </div>

                      {/* Detail Jam Praktik, HFIS, & Kuota */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Jam Praktik:
                          </span>
                          <span className="text-blue-800 font-bold bg-blue-50/90 px-2 py-0.5 rounded border border-blue-200 inline-block font-mono text-[11px] mt-0.5">
                            {formatDoctorScheduleTime(item)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Jam HFIS:
                          </span>
                          <span className="font-bold text-red-800 bg-red-50/90 px-2 py-0.5 rounded border border-red-200 inline-block font-mono text-[11px] mt-0.5">
                            {item.jamHfis || item.hfis || '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">Kuota BPJS:</span>
                          <span className="font-bold text-gray-900">
                            {kuotaTerisi} / {kuotaTotal}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateToSchedules(item.dpjp)}
                          className="text-xs font-bold text-[#005d42] hover:underline flex items-center gap-0.5"
                        >
                          <span>Buka Jadwal</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {item.catatan && (
                        <p className="mt-2 text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 italic">
                          &ldquo;{item.catatan}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
              <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">
                Tidak ada jadwal dokter yang cocok
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {todayWidgetSearch || todayWidgetStatus !== 'all' || todayWidgetPoli !== 'all'
                  ? 'Tidak ditemukan dokter dengan kriteria pencarian yang Anda masukkan. Coba atur ulang kata kunci atau filter.'
                  : `Tidak ada data jadwal dokter yang terdaftar pada hari ${currentDayName} di master SIMRS.`}
              </p>
              {(todayWidgetSearch || todayWidgetStatus !== 'all' || todayWidgetPoli !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setTodayWidgetSearch('');
                    setTodayWidgetStatus('all');
                    setTodayWidgetPoli('all');
                  }}
                  className="mt-3 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                >
                  Reset Filter Hari Ini
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Menampilkan <strong>{filteredSchedulesToday.length}</strong> dari{' '}
              <strong>{schedulesToday.length}</strong> jadwal dokter hari ini ({currentDayName})
            </span>
          </div>
          <span className="font-medium text-slate-400 hidden sm:inline">
            RSU Muhammadiyah Babat &bull; Data Terpadu SIMRS & HFIS BPJS
          </span>
        </div>
      </div>

      {/* 3. DAFTAR DOKTER LIBUR HARI INI (WIDGET RINGKAS) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Daftar Dokter Libur / Penyesuaian Hari Ini
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {todayLeaves.length} Dokter
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Khusus tanggal {formatYMDToIndonesian(todayYMD, true)}
            </p>
          </div>

          <button
            onClick={() => onNavigateToSchedules('libur')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005d42] hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer w-fit"
            title="Buka tabel lengkap jadwal dokter libur"
          >
            <span>Lihat Semua Jadwal Cuti / Perubahan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content of Today's Leaves */}
        <div className="mt-4">
          {todayLeaves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {todayLeaves.map((doc) => {
                // Find active jadwal item for today
                const activeJadwalItem = doc.jadwal.find((j) => {
                  const jLibur = (j.tglLibur || '').toLowerCase();
                  const jKet = (j.keterangan || '').toLowerCase();
                  return (
                    jLibur.includes('4 september') ||
                    jLibur.includes('04-09') ||
                    jKet.includes('4 september') ||
                    j.tipe === 'LIBUR' ||
                    j.tipe === 'MAJU'
                  );
                }) || doc.jadwal[0];

                const isMaju = activeJadwalItem?.tipe === 'MAJU';
                const isCuti = activeJadwalItem?.tipe === 'CUTI';
                const isGanti = (activeJadwalItem?.tipe as string) === 'GANTI_JAM';

                let badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                let badgeLabel = 'Libur Praktik';

                if (isMaju) {
                  badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  badgeLabel = 'Maju';
                } else if (isGanti) {
                  badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                  badgeLabel = 'Ganti Jam';
                } else if (isCuti) {
                  badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                  badgeLabel = 'Cuti';
                }

                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {badgeLabel}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                          Poli {doc.poli}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 mt-2 leading-snug">
                        {doc.dpjp}
                      </h4>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {activeJadwalItem?.keterangan || activeJadwalItem?.tglLibur || 'Penyesuaian jadwal praktik'}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Masuk: <strong className="text-emerald-800">{activeJadwalItem?.tglMasuk || '-'}</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigateToSchedules('libur')}
                        className="text-xs font-semibold text-[#005d42] hover:underline cursor-pointer shrink-0"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 px-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                  Seluruh Dokter Spesialis Praktik Normal Hari Ini
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800">
                  Alhamdulillah, tidak ada dokter spesialis yang tercatat libur atau cuti khusus hari ini. Seluruh pelayanan rawat jalan poliklinik RSU Muhammadiyah Babat beroperasi penuh sesuai jam HFIS.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. STATUS POLIKLINIK REAL-TIME (GRID INDIKATOR WARNA) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Status Poliklinik Real-time Hari Ini
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                {allClinics.length} Poliklinik Terdaftar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Pemantauan status buka/tutup dan ketersediaan dokter per poliklinik spesialis
            </p>
          </div>

          {/* Color Indicators Legend */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Buka ({bukaClinicsCount})</span>
            </span>
            {terbatasClinicsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Terbatas ({terbatasClinicsCount})</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Cuti / Tutup ({cutiClinicsCount})</span>
            </span>
          </div>
        </div>

        {/* Poliklinik Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
          {allClinics.map((clinic) => {
            const isBuka = clinic.status === 'BUKA';
            const isCuti = clinic.status === 'CUTI';
            const isTerbatas = clinic.status === 'TERBATAS';

            let cardBorder = 'border-slate-200 hover:border-slate-300';
            if (isBuka) cardBorder = 'border-emerald-200/90 bg-emerald-50/10 hover:border-emerald-400 hover:shadow-xs';
            if (isCuti) cardBorder = 'border-rose-200/90 bg-rose-50/10 hover:border-rose-400 hover:shadow-xs';
            if (isTerbatas) cardBorder = 'border-amber-200/90 bg-amber-50/10 hover:border-amber-400 hover:shadow-xs';

            return (
              <div
                key={clinic.poli}
                onClick={() => onSelectClinicFilter(clinic.poli)}
                className={`p-4 rounded-xl border ${cardBorder} transition-all flex flex-col justify-between gap-3 cursor-pointer group`}
                title={`Klik untuk melihat jadwal lengkap Poli ${clinic.poli}`}
              >
                <div>
                  {/* Clinic Header & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#005d42] group-hover:bg-[#005d42] group-hover:text-white transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#005d42] transition-colors">
                        Poli {clinic.poli}
                      </h4>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${clinic.badgeColor}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${clinic.dotColor} animate-pulse`} />
                      <span>{clinic.statusLabel}</span>
                    </span>
                  </div>

                  {/* Dokter Bertugas Hari Ini */}
                  <div className="mt-2.5 space-y-1 text-xs">
                    <p className="text-slate-500 font-medium">Dokter Hari Ini:</p>
                    {clinic.schedulesToday.length > 0 ? (
                      <div className="space-y-1">
                        {clinic.schedulesToday.map((sch) => {
                          const isOnLeave = doctorsOnLeaveTodaySet.has(normalizeDoctorName(sch.dpjp));
                          return (
                            <div
                              key={sch.id}
                              className="flex items-center justify-between gap-1 text-[11px]"
                            >
                              <span
                                className={`font-semibold truncate ${
                                  isOnLeave ? 'text-rose-700 line-through opacity-80' : 'text-slate-800'
                                }`}
                              >
                                {sch.dpjp}
                              </span>
                              {isOnLeave ? (
                                <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1 rounded border border-rose-200 shrink-0">
                                  Cuti
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-200 shrink-0">
                                  Aktif
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">
                        Tidak ada dokter bertugas hari ini
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer of Clinic Card */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px] text-slate-600 truncate">
                    {clinic.sampleHours}
                  </span>
                  <span className="text-[#005d42] font-semibold group-hover:underline flex items-center gap-0.5 shrink-0">
                    <span>Jadwal</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. QUICK NAVIGATION & INFORMATIONAL FOOTER BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateToSchedules()}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#005d42] flex items-center justify-center shrink-0 group-hover:bg-[#005d42] group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#005d42] transition-colors">
              Halaman Kerja Jadwal Dokter
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Akses tabel master jadwal, filter kalender komprehensif, ubah jam praktik, dan kelola cuti dokter.
            </p>
          </div>
        </div>

        <div
          onClick={onOpenBookModal}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
              Pendaftaran & Antrean Pasien
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Terbitkan nomor antrean poliklinik secara langsung dan sesuaikan sisa kuota BPJS Kesehatan.
            </p>
          </div>
        </div>

        <div
          onClick={onToggleGemini}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-amber-950 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
              Asisten AI RSUMB
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Tanyakan dokter yang libur pada tanggal tertentu atau periksa kapasitas kuota SIMRS via AI.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Huddle Report Modal */}
      <DailyHuddleReportModal
        isOpen={isDailyHuddleOpen}
        onClose={() => setIsDailyHuddleOpen(false)}
        schedules={schedules}
        doctorLeaves={doctorLeaves}
        surgeryList={actualSurgeries}
        onNavigateToModule={onNavigateToModule}
        showToast={showToast}
      />

      {/* Doctor Schedule Thermal Slip Modal */}
      <DoctorScheduleThermalSlipModal
        isOpen={isThermalSlipModalOpen}
        onClose={() => setIsThermalSlipModalOpen(false)}
        schedules={schedules}
        doctorLeaves={doctorLeaves}
        showToast={showToast}
      />
    </div>
  );
};
