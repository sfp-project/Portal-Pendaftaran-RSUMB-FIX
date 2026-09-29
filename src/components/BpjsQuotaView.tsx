import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Clock,
  Stethoscope,
  Building2,
  Search,
  CheckCircle2,
  Info,
  Layers
} from 'lucide-react';
import { DoctorSchedule } from '../types';

interface BpjsQuotaViewProps {
  schedules: DoctorSchedule[];
  onAdjustQuota?: (id: string, newTotal: number) => void;
}

// Specialty helper lookup based on clinic or title
function getSpecialtyName(poli?: string, dpjp?: string): string {
  const p = (poli || '').toLowerCase();
  if (p.includes('saraf') || p.includes('neuro')) return 'Spesialis Saraf / Neurologi (Sp.N)';
  if (p.includes('dalam') || p.includes('interna')) return 'Spesialis Penyakit Dalam (Sp.PD)';
  if (p.includes('anak') || p.includes('pediatri')) return 'Spesialis Anak (Sp.A)';
  if (p.includes('bedah umum') || p === 'bedah') return 'Spesialis Bedah Umum (Sp.B)';
  if (p.includes('bedah saraf')) return 'Spesialis Bedah Saraf (Sp.BS)';
  if (p.includes('bedah urologi') || p.includes('urologi')) return 'Spesialis Urologi (Sp.U)';
  if (p.includes('obgyn') || p.includes('kandungan')) return 'Spesialis Obstetri & Ginekologi (Sp.OG)';
  if (p.includes('jantung') || p.includes('kardio')) return 'Spesialis Jantung & Pembuluh Darah (Sp.JP)';
  if (p.includes('mata')) return 'Spesialis Mata (Sp.M)';
  if (p.includes('tht')) return 'Spesialis THT-KL (Sp.THT-KL)';
  if (p.includes('kulit') || p.includes('dv')) return 'Spesialis Dermatologi & Venereologi (Sp.DV)';
  if (p.includes('paru')) return 'Spesialis Paru (Sp.P)';
  if (p.includes('gigi')) return 'Spesialis Konservasi Gigi (Sp.KG)';
  if (p.includes('jiwa') || p.includes('psikiatri')) return 'Spesialis Kedokteran Jiwa (Sp.KJ)';
  if (p.includes('rehab') || p.includes('medik')) return 'Spesialis Kedokteran Fisik & Rehabilitasi (Sp.KFR)';
  if (p.includes('ortopedi')) return 'Spesialis Bedah Ortopedi (Sp.OT)';

  const safeDpjp = dpjp || '';
  const match = safeDpjp.match(/Sp\.[A-Za-z\-]+/);
  if (match) return `Spesialis ${poli || 'Umum'} (${match[0]})`;
  return `Spesialis ${poli || 'Umum'}`;
}

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', "Jum'at", 'Sabtu', 'Ahad', 'Minggu'];

function formatDaysList(days: string[]): string {
  if (!days || days.length === 0) return '-';
  if (days.length === 1) return days[0];
  if (days.length === 2) return days.join(', ');

  const normalized = days.map((d) => (d === "Jum'at" ? 'Jumat' : d));
  const sorted = [...new Set(normalized)].sort((a, b) => {
    const idxA = DAY_ORDER.findIndex((d) => d.toLowerCase() === a.toLowerCase());
    const idxB = DAY_ORDER.findIndex((d) => d.toLowerCase() === b.toLowerCase());
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  if (sorted.length >= 3) {
    const indices = sorted.map((d) => DAY_ORDER.findIndex((o) => o.toLowerCase() === d.toLowerCase()));
    const isConsecutive = indices.every((val, i) => i === 0 || val === indices[i - 1] + 1);
    if (isConsecutive) {
      return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
    }
  }

  return sorted.join(', ');
}

// Robust HFIS duration parser
function parseHfisHours(jamHfis?: string, jadwal?: string): {
  jamHfisFormatted: string;
  durationHours: number;
} {
  const raw = (jamHfis || jadwal || '07.00 - 14.00').trim();
  const parts = raw.split(/-|\bs\.?d\.?\b/i).map((s) => s.trim().replace('/', ''));

  const parseHour = (str: string, fallback: number) => {
    const clean = str.replace('WIB', '').trim();
    const match = clean.match(/(\d{1,2})[.:](\d{2})/);
    if (match) {
      return parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
    }
    const num = clean.match(/^(\d{1,2})/);
    if (num) return parseInt(num[1], 10);
    return fallback;
  };

  const startHour = parseHour(parts[0] || '07.00', 7);
  const endHour = parseHour(parts[1] || '14.00', 14);
  let duration = endHour - startHour;
  if (duration <= 0) duration += 24;
  if (duration > 16) duration = 7;

  const formatClean = (str: string, hourVal: number) => {
    const match = str.replace('WIB', '').trim().match(/(\d{1,2})[.:](\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}.${match[2]}`;
    }
    const h = Math.floor(hourVal);
    const m = Math.round((hourVal - h) * 60);
    return `${h.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`;
  };

  const startFormatted = formatClean(parts[0] || '', startHour);
  const endFormatted = formatClean(parts[1] || '', endHour);
  const roundedDuration = Math.round(duration * 10) / 10;

  return {
    jamHfisFormatted: `${startFormatted} – ${endFormatted} WIB`,
    durationHours: roundedDuration
  };
}

interface DoctorSessionItem {
  days: string[];
  daysLabel: string;
  jamHfisFormatted: string;
  durationHours: number;
  quotaCalculated: number;
}

interface DoctorGroup {
  dpjp: string;
  specialty: string;
  sessions: DoctorSessionItem[];
  totalDoctorQuota: number;
}

interface PoliklinikCardData {
  poli: string;
  doctors: DoctorGroup[];
  totalClinicQuota: number;
  doctorCount: number;
}

export const BpjsQuotaView: React.FC<BpjsQuotaViewProps> = ({ schedules }) => {
  // Global Service Time Option (5, 6, 10, or 15 Minutes per patient)
  // Default is 6 Minutes/Patient
  const [serviceTimeMinutes, setServiceTimeMinutes] = useState<number>(6);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedPoliFilter, setSelectedPoliFilter] = useState<string>('all');

  // Pasien per Jam = 60 / Standar Waktu Layan (Menit)
  const patientsPerHour = useMemo(() => {
    return Math.round(60 / serviceTimeMinutes);
  }, [serviceTimeMinutes]);

  // Unique list of Poliklinik names for filter
  const allPolis = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => set.add(s.poli));
    return Array.from(set).sort();
  }, [schedules]);

  // Group schedules strictly by Poliklinik, and then by Doctor (so each doctor appears once)
  const clinicData = useMemo<PoliklinikCardData[]>(() => {
    const clinicMap = new Map<string, Map<string, Map<string, { days: string[]; durationHours: number }>>>();

    schedules.forEach((s) => {
      if (!clinicMap.has(s.poli)) {
        clinicMap.set(s.poli, new Map());
      }
      const doctorMap = clinicMap.get(s.poli)!;
      if (!doctorMap.has(s.dpjp)) {
        doctorMap.set(s.dpjp, new Map());
      }
      const sessionMap = doctorMap.get(s.dpjp)!;
      const hfis = parseHfisHours(s.jamHfis, s.jadwal);

      if (!sessionMap.has(hfis.jamHfisFormatted)) {
        sessionMap.set(hfis.jamHfisFormatted, {
          days: s.hari ? [s.hari] : [],
          durationHours: hfis.durationHours
        });
      } else {
        const existing = sessionMap.get(hfis.jamHfisFormatted);
        if (existing && Array.isArray(existing.days)) {
          if (s.hari && !existing.days.includes(s.hari)) {
            existing.days.push(s.hari);
          }
        }
      }
    });

    const result: PoliklinikCardData[] = [];

    clinicMap.forEach((doctorMap, poli) => {
      const doctors: DoctorGroup[] = [];
      let totalClinicQuota = 0;

      doctorMap.forEach((sessionMap, dpjp) => {
        const sessions: DoctorSessionItem[] = [];
        let totalDoctorQuota = 0;

        sessionMap.forEach((data, jamHfisFormatted) => {
          const quota = Math.round(data.durationHours * patientsPerHour);
          sessions.push({
            days: data.days,
            daysLabel: formatDaysList(data.days),
            jamHfisFormatted,
            durationHours: data.durationHours,
            quotaCalculated: quota
          });
          totalDoctorQuota += quota;
        });

        doctors.push({
          dpjp,
          specialty: getSpecialtyName(poli, dpjp),
          sessions,
          totalDoctorQuota
        });

        totalClinicQuota += totalDoctorQuota;
      });

      result.push({
        poli,
        doctors,
        totalClinicQuota,
        doctorCount: doctors.length
      });
    });

    return result.sort((a, b) => a.poli.localeCompare(b.poli));
  }, [schedules, patientsPerHour]);

  // Overall Hospital Stats
  const totalHospitalQuota = useMemo(() => {
    return clinicData.reduce((acc, c) => acc + c.totalClinicQuota, 0);
  }, [clinicData]);

  const totalActiveDoctors = useMemo(() => {
    const docSet = new Set<string>();
    schedules.forEach((s) => docSet.add(s.dpjp));
    return docSet.size;
  }, [schedules]);

  // Filtered clinics based on search and poli dropdown
  const filteredClinics = useMemo(() => {
    return clinicData
      .filter((c) => {
        if (selectedPoliFilter !== 'all' && c.poli !== selectedPoliFilter) {
          return false;
        }
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        const matchPoli = (c.poli || '').toLowerCase().includes(q);
        const matchDoctor = (c.doctors || []).some(
          (d) => (d.dpjp || '').toLowerCase().includes(q) || (d.specialty || '').toLowerCase().includes(q)
        );
        return matchPoli || matchDoctor;
      })
      .map((c) => {
        if (!searchFilter.trim()) return c;
        const q = searchFilter.toLowerCase();
        const matchingDoctors = (c.doctors || []).filter(
          (d) =>
            (c.poli || '').toLowerCase().includes(q) ||
            (d.dpjp || '').toLowerCase().includes(q) ||
            (d.specialty || '').toLowerCase().includes(q)
        );
        return {
          ...c,
          doctors: matchingDoctors,
          totalClinicQuota: matchingDoctors.reduce((acc, d) => acc + d.totalDoctorQuota, 0)
        };
      });
  }, [clinicData, selectedPoliFilter, searchFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header Controls: Dropdown Pengubah Standar Waktu Layan & Keterangan Global */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
              Kalkulator Kapasitas Kuota HFIS
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200/60">
              Standar BPJS
            </span>
          </div>
          {/* Satu keterangan terpusat di atas halaman */}
          <p className="text-xs sm:text-sm text-slate-500">
            Dasar Perhitungan: <strong>Durasi Jam Praktik HFIS × Standar Waktu Layan</strong> ({serviceTimeMinutes} Menit/Pasien = {patientsPerHour} Pasien/Jam). Diperbarui otomatis.
          </p>
        </div>

        {/* Global Service Time Dropdown Selector */}
        <div className="flex items-center gap-2.5 shrink-0 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <label
            htmlFor="waktu-layan-select"
            className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5 text-[#005d42]" />
            <span>Standar Waktu Layan:</span>
          </label>
          <select
            id="waktu-layan-select"
            value={serviceTimeMinutes}
            onChange={(e) => setServiceTimeMinutes(Number(e.target.value))}
            className="px-2.5 py-1 bg-white text-xs sm:text-sm font-bold text-[#005d42] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] transition-all cursor-pointer"
          >
            <option value={5}>5 Menit / Pasien (12 Pasien/Jam)</option>
            <option value={6}>6 Menit / Pasien - Default (10 Pasien/Jam)</option>
            <option value={10}>10 Menit / Pasien (6 Pasien/Jam)</option>
            <option value={15}>15 Menit / Pasien (4 Pasien/Jam)</option>
          </select>
        </div>
      </div>

      {/* Ringkasan Header (3 Kartu KPI Utama) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Kartu 1: Total Kapasitas Kuota RS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kapasitas Kuota RS
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#005d42]">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {totalHospitalQuota.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-medium text-slate-500">Kuota / Hari</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Estimasi seluruh Poliklinik RSUMB</span>
            </p>
          </div>
        </div>

        {/* Kartu 2: Jumlah Dokter Aktif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Dokter Aktif
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {totalActiveDoctors}
              </span>
              <span className="text-xs font-medium text-slate-500">Dokter DPJP</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Tersebar di {allPolis.length} Poliklinik</span>
            </p>
          </div>
        </div>

        {/* Kartu 3: Standar Waktu Layan (6 Menit/Pasien) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Standar Waktu Layan
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {serviceTimeMinutes} Menit
              </span>
              <span className="text-xs font-medium text-slate-500">/ Pasien</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Konversi: <strong className="text-slate-700 font-semibold">{patientsPerHour} Pasien / Jam</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Cari dokter atau poliklinik..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="filter-poli-select" className="text-xs font-medium text-slate-500 whitespace-nowrap">
            Poliklinik:
          </label>
          <select
            id="filter-poli-select"
            value={selectedPoliFilter}
            onChange={(e) => setSelectedPoliFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] cursor-pointer w-full sm:w-auto"
          >
            <option value="all">Semua Poliklinik ({allPolis.length})</option>
            {allPolis.map((poli) => (
              <option key={poli} value={poli}>
                Poli {poli}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desain Kartu Poliklinik: Minimalis, Modern, Seamless List Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredClinics.map((clinic) => (
          <div
            key={clinic.poli}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden flex flex-col"
          >
            {/* Header Kartu Poliklinik: Bersih & Ringkas */}
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  <Building2 className="w-4 h-4 text-[#005d42]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-slate-900">
                    Poliklinik {clinic.poli}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {clinic.doctorCount} Dokter DPJP
                  </p>
                </div>
              </div>

              {/* Subtotal Kapasitas Kuota Poliklinik */}
              <div className="text-right">
                <span className="text-xs font-bold text-[#005d42] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                  Total: {clinic.totalClinicQuota} Kuota
                </span>
              </div>
            </div>

            {/* List Row Dokter: Seamless, Bebas Border Tebal, Layout Horizontal */}
            <div className="p-3 sm:p-4 space-y-1.5 flex-grow">
              {clinic.doctors.map((doc) => (
                <div
                  key={doc.dpjp}
                  className="p-3 rounded-xl hover:bg-slate-50/90 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-transparent hover:border-slate-100"
                >
                  {/* Kiri: Nama Dokter & Spesialisasi (Hanya Muncul 1 Kali per Dokter) */}
                  <div className="sm:w-5/12 min-w-0">
                    <h5 className="font-semibold text-sm text-slate-900 leading-snug">
                      {doc.dpjp}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {doc.specialty}
                    </p>
                  </div>

                  {/* Tengah & Kanan: Hari & Jam HFIS (tengah), Kapasitas Kuota (kanan) */}
                  <div className="sm:w-7/12 flex flex-col gap-1.5">
                    {doc.sessions.map((sess, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center justify-between gap-2.5 bg-slate-50/60 hover:bg-white sm:bg-transparent px-2.5 py-1 sm:px-0 sm:py-0 rounded-lg"
                      >
                        {/* Tengah: Hari & Jam HFIS */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 min-w-0">
                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                            {sess.daysLabel}
                          </span>
                          <span className="text-slate-500 text-[11px] whitespace-nowrap">
                            {sess.jamHfisFormatted}
                          </span>
                        </div>

                        {/* Kanan: Badge Angka Kuota yang Bersih */}
                        <div className="shrink-0 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold text-[#005d42] bg-emerald-50/90 border border-emerald-200/60 whitespace-nowrap">
                            {sess.quotaCalculated} Kuota
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredClinics.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            Tidak ada poliklinik atau dokter yang cocok dengan filter pencarian "{searchFilter}".
          </p>
          <button
            onClick={() => {
              setSearchFilter('');
              setSelectedPoliFilter('all');
            }}
            className="mt-3 px-4 py-1.5 text-xs font-bold text-[#005d42] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
};
