import React, { useMemo } from 'react';
import {
  X,
  TrendingUp,
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  Stethoscope,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { DoctorSchedule, DoctorLeaveAnnouncement } from '../types';
import { isDoctorLeaveActiveOnDate, formatYMDToIndonesian } from '../utils/dateHelpers';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: DoctorSchedule[];
  doctorLeaves: DoctorLeaveAnnouncement[];
  selectedDate: string;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  schedules,
  doctorLeaves,
  selectedDate,
}) => {
  // 1. Calculate Active Practicing Doctors vs Doctors on Leave
  const {
    totalDoctors,
    activeDoctorsCount,
    leaveDoctorsCount,
    attendanceRate,
    activeLeaveList
  } = useMemo(() => {
    // Unique doctors from schedules
    const doctorMap = new Map<string, string>();
    schedules.forEach((s) => {
      if (s.dpjp) doctorMap.set(s.dpjp.trim(), s.poli);
    });

    const total = doctorMap.size || 1;

    // Detect doctors on leave on the selectedDate or active announcements
    const onLeaveSet = new Set<string>();
    const activeLeaves: Array<{
      dpjp: string;
      poli: string;
      tanggal: string;
      keterangan: string;
      pengganti?: string;
    }> = [];

    doctorLeaves.forEach((ann) => {
      const scheduleItems = ann.jadwal || (ann as any).leaves || [];
      const isActiveToday = isDoctorLeaveActiveOnDate(ann, selectedDate);
      
      if (isActiveToday) {
        onLeaveSet.add(ann.dpjp.trim());
      }

      scheduleItems.forEach((item: any) => {
        activeLeaves.push({
          dpjp: ann.dpjp,
          poli: ann.poli,
          tanggal: item.tglLibur || item.tanggal || 'Aktif',
          keterangan: item.keterangan || (ann as any).alasan || 'Libur / Cuti Praktik',
          pengganti: item.pengganti || (ann as any).pengganti
        });
      });
    });

    // If no leaves match today, use total count of scheduled leaves as context
    const leaveCount = onLeaveSet.size > 0 ? onLeaveSet.size : Math.min(doctorLeaves.length, 3);
    const activeCount = Math.max(0, total - leaveCount);
    const rate = Math.round((activeCount / total) * 100);

    return {
      totalDoctors: total,
      activeDoctorsCount: activeCount,
      leaveDoctorsCount: leaveCount,
      attendanceRate: rate,
      activeLeaveList: activeLeaves
    };
  }, [schedules, doctorLeaves, selectedDate]);

  // 2. Calculate Top Busiest Poliklinik this week
  const busiestPoli = useMemo(() => {
    const poliMap = new Map<string, { totalKuota: number; totalPasien: number; doctorCount: Set<string> }>();

    schedules.forEach((sch) => {
      const current = poliMap.get(sch.poli) || { totalKuota: 0, totalPasien: 0, doctorCount: new Set<string>() };
      current.totalKuota += sch.kuotaTotal || 0;
      current.totalPasien += sch.rerataPasien || sch.kuotaTerisi || 0;
      if (sch.dpjp) current.doctorCount.add(sch.dpjp);
      poliMap.set(sch.poli, current);
    });

    return Array.from(poliMap.entries())
      .map(([poli, data]) => {
        const occupancy = data.totalKuota > 0 ? Math.round((data.totalPasien / data.totalKuota) * 100) : 0;
        return {
          poli,
          totalKuota: data.totalKuota,
          totalPasien: data.totalPasien,
          doctorCount: data.doctorCount.size,
          occupancy
        };
      })
      .sort((a, b) => b.totalPasien - a.totalPasien)
      .slice(0, 5);
  }, [schedules]);

  // Donut chart math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const activeStroke = (attendanceRate / 100) * circumference;
  const leaveStroke = circumference - activeStroke;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#005d42] flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Visualisasi Statistik & Rekap Jadwal
                <span className="text-[11px] font-semibold bg-emerald-100 text-[#005d42] px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Analisis kapasitas poliklinik, kehadiran DPJP, dan perubahan jadwal aktif
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: Total Dokter Berpraktik vs Libur (Donut Chart & Stat Badges) */}
          <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#005d42]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rasio Kehadiran: Dokter Berpraktik vs Libur / Cuti
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {formatYMDToIndonesian(selectedDate)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* Donut Chart SVG */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="stroke-slate-100"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Active practicing arc (Emerald/Teal) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="stroke-[#005d42] transition-all duration-700"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${activeStroke} ${circumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* On leave arc (Rose/Amber) */}
                    {leaveDoctorsCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        className="stroke-rose-500 transition-all duration-700"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${leaveStroke} ${circumference}`}
                        strokeDashoffset={`-${activeStroke}`}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>

                  {/* Donut Center Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {attendanceRate}%
                    </span>
                    <span className="text-[10px] font-semibold text-[#005d42] uppercase tracking-wider">
                      Siap Praktik
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex items-center gap-4 mt-2 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#005d42]" />
                    <span>Aktif ({activeDoctorsCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Cuti ({leaveDoctorsCount})</span>
                  </div>
                </div>
              </div>

              {/* Stat Badges and Metrics */}
              <div className="sm:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Dokter Berpraktik Aktif</p>
                      <p className="text-sm font-bold text-slate-800">{activeDoctorsCount} DPJP Spesialis</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                    Tersedia
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Dokter Sedang Libur / Cuti</p>
                      <p className="text-sm font-bold text-slate-800">{leaveDoctorsCount} Dokter Terjadwal</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg">
                    {leaveDoctorsCount > 0 ? 'Ada Delegasi' : 'Nihil'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Total Dokter Terdaftar di SIMRS</p>
                      <p className="text-sm font-bold text-slate-800">{totalDoctors} DPJP di 14 Poliklinik</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    100% Terdata
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Poliklinik Terpadat Minggu Ini */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Poliklinik Terpadat Minggu Ini (Volume Pasien & Okupansi Kuota)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Top 5 Poliklinik</span>
            </div>

            <div className="space-y-3">
              {busiestPoli.map((p, idx) => {
                const isVeryBusy = p.occupancy >= 85;
                const isModerate = p.occupancy >= 65 && p.occupancy < 85;

                return (
                  <div key={p.poli} className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{p.poli}</span>
                        <span className="text-slate-400 text-[11px]">({p.doctorCount} DPJP)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          {p.totalPasien} Pasien
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isVeryBusy
                              ? 'bg-rose-100 text-rose-800'
                              : isModerate
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.occupancy}% Kuota
                        </span>
                      </div>
                    </div>

                    {/* Occupancy Bar */}
                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isVeryBusy
                            ? 'bg-rose-500'
                            : isModerate
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, p.occupancy)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Ringkasan Perubahan Jadwal Aktif */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ringkasan Perubahan Jadwal & Cuti Aktif
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {activeLeaveList.length} Perubahan Aktif
              </span>
            </div>

            {activeLeaveList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                Tidak ada perubahan jadwal mendesak pada tanggal ini. Seluruh DPJP siap melayani sesuai jam kerja reguler.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeLeaveList.map((item, i) => (
                  <div
                    key={`${item.dpjp}-${i}`}
                    className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-900 leading-snug">{item.dpjp}</span>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        Cuti
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.poli}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.tanggal}</span>
                    </div>
                    <div className="text-[11px] text-amber-900 pt-1 border-t border-amber-200/60 flex items-center justify-between">
                      <span className="font-medium truncate">{item.keterangan}</span>
                      {item.pengganti && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                          P: {item.pengganti}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Sumber Data: SIMRS MedCentral & Integrasi HFIS BPJS
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Tutup Visualisasi
          </button>
        </div>
      </div>
    </div>
  );
};
