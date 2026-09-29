import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Stethoscope,
  Scissors,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  X,
  FileText,
  UserCheck,
  Building2,
  Bed,
  Phone,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Info,
  CheckSquare,
  Square,
  Share2,
  CalendarCheck2,
  ArrowRight
} from 'lucide-react';
import { DoctorSchedule, DoctorLeaveAnnouncement } from '../../types';
import { ElectiveSurgerySchedule, initialSurgerySchedules } from '../../data/surgeryData';
import {
  loadShiftHandoverRecords,
  loadBpjsKendalaRecords,
  loadKllRecords,
  loadUmumBeresikoRecords
} from '../../data/patientNotesData';
import {
  PatientShiftHandoverRecord,
  PatientBpjsKendalaRecord,
  PatientKllRecord,
  PatientUmumBeresikoRecord
} from '../../types/patientNotesTypes';
import { loadActiveStaff } from '../../data/headerData';
import {
  isDoctorLeaveActiveOnDate,
  formatYMDToIndonesian,
  normalizeDoctorName
} from '../../utils/dateHelpers';
import { PrintHeaderKop } from '../PrintHeaderKop';
import { PrintSignatureBlock } from '../PrintSignatureBlock';

interface DailyHuddleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: DoctorSchedule[];
  doctorLeaves: DoctorLeaveAnnouncement[];
  surgeryList?: ElectiveSurgerySchedule[];
  onNavigateToModule?: (moduleName: string) => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const DailyHuddleReportModal: React.FC<DailyHuddleReportModalProps> = ({
  isOpen,
  onClose,
  schedules,
  doctorLeaves,
  surgeryList,
  onNavigateToModule,
  showToast
}) => {
  // 1. Date selection (defaults to today)
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [activeTab, setActiveTab] = useState<'all' | 'surgeries' | 'leaves' | 'notes' | 'checklist'>('all');
  const [copiedWA, setCopiedWA] = useState(false);

  // Active Staff & Briefing Notes
  const activeStaff = useMemo(() => loadActiveStaff(), []);
  const [briefingNotes, setBriefingNotes] = useState<string>(
    'Pastikan kelengkapan berkas penjaminan dan SPRI ranap terverifikasi sebelum pasien ditransfer ke Kamar Operasi IBS.'
  );

  // Briefing Action Checklist state
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: 'chk-1', text: 'Konfirmasi kehadiran DPJP Operator & Spesialis Anestesi di IBS', done: true },
    { id: 'chk-2', text: 'Validasi penerbitan SPRI & Surat Jaminan BPJS/Asuransi pasien operasi', done: false },
    { id: 'chk-3', text: 'Display pengumuman dokter cuti & arahkan pasien ke DPJP Pengganti', done: true },
    { id: 'chk-4', text: 'Koordinasi ketersediaan bed rawat inap transit pasca-bedah', done: false },
    { id: 'chk-5', text: 'Follow-up berkas Laporan Polisi (LP) kasus kecelakaan Jasa Raharja', done: false }
  ]);

  const toggleChecklist = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // Safe fallback surgeries
  const allSurgeries = useMemo(() => {
    if (surgeryList && surgeryList.length > 0) return surgeryList;
    try {
      const saved = localStorage.getItem('rsumb_surgery_schedules_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error loading surgeries for huddle:', e);
    }
    return initialSurgerySchedules;
  }, [surgeryList]);

  // High priority patient notes from patientNotesData
  const [shiftHandovers, setShiftHandovers] = useState<PatientShiftHandoverRecord[]>([]);
  const [bpjsKendalaList, setBpjsKendalaList] = useState<PatientBpjsKendalaRecord[]>([]);
  const [kllList, setKllList] = useState<PatientKllRecord[]>([]);
  const [umumBeresikoList, setUmumBeresikoList] = useState<PatientUmumBeresikoRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setShiftHandovers(loadShiftHandoverRecords());
      setBpjsKendalaList(loadBpjsKendalaRecords());
      setKllList(loadKllRecords());
      setUmumBeresikoList(loadUmumBeresikoRecords());
    }
  }, [isOpen]);

  // Helper date checker for surgeries
  const isSurgeryOnDate = (surgery: ElectiveSurgerySchedule, targetDateYMD: string): boolean => {
    if (!surgery.rencanaOp || !targetDateYMD) return false;
    const [targetY, targetM, targetD] = targetDateYMD.split('-').map(Number);

    const val = surgery.rencanaOp.trim();
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
  };

  // 1. FILTERED SURGERIES FOR THE DAY
  const scheduledSurgeriesToday = useMemo(() => {
    return allSurgeries.filter((s) => isSurgeryOnDate(s, selectedDate));
  }, [allSurgeries, selectedDate]);

  // If today has 0 surgeries, find upcoming surgeries for reference
  const upcomingSurgeries = useMemo(() => {
    return allSurgeries
      .filter((s) => s.pelayanan !== 'Batal')
      .slice(0, 5);
  }, [allSurgeries]);

  // 2. FILTERED DOCTOR LEAVES ACTIVE ON THE DAY
  const doctorLeavesToday = useMemo(() => {
    return doctorLeaves.filter((leave) => isDoctorLeaveActiveOnDate(leave, selectedDate));
  }, [doctorLeaves, selectedDate]);

  // 3. DOCTOR SCHEDULES FOR THE DAY
  const selectedDateObj = useMemo(() => {
    const parts = selectedDate.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }, [selectedDate]);

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const selectedDayName = dayNames[selectedDateObj.getDay()];

  const schedulesToday = useMemo(() => {
    const norm = selectedDayName.toLowerCase();
    return schedules.filter((s) => {
      const sHari = (s.hari || '').toLowerCase();
      return sHari === norm || sHari.includes(norm) || norm.includes(sHari);
    });
  }, [schedules, selectedDayName]);

  // Doctors on leave set
  const doctorsOnLeaveSet = useMemo(() => {
    const set = new Set<string>();
    doctorLeavesToday.forEach((l) => set.add(normalizeDoctorName(l.dpjp)));
    return set;
  }, [doctorLeavesToday]);

  const activePracticingDoctors = useMemo(() => {
    const map = new Map<string, DoctorSchedule>();
    schedulesToday.forEach((s) => {
      const norm = normalizeDoctorName(s.dpjp);
      if (!doctorsOnLeaveSet.has(norm) && !map.has(norm)) {
        map.set(norm, s);
      }
    });
    return Array.from(map.values());
  }, [schedulesToday, doctorsOnLeaveSet]);

  // 4. HIGH PRIORITY PATIENT NOTES
  const highPriorityHandovers = useMemo(() => {
    return shiftHandovers.filter((h) => h.prioritas === 'Tinggi' || h.status === 'Pending');
  }, [shiftHandovers]);

  const pendingBpjsKendala = useMemo(() => {
    return bpjsKendalaList.filter((b) => b.status === 'Pending');
  }, [bpjsKendalaList]);

  const urgentKllCases = useMemo(() => {
    return kllList.filter((k) => k.isInsidenActive || k.statusLp === 'BELUM');
  }, [kllList]);

  const highRiskUmum = useMemo(() => {
    return umumBeresikoList.filter((u) => u.potensiMasalah && u.potensiMasalah.length > 0);
  }, [umumBeresikoList]);

  const totalPriorityNotesCount =
    highPriorityHandovers.length + pendingBpjsKendala.length + urgentKllCases.length + highRiskUmum.length;

  // Print Report Handler
  const handlePrintReport = () => {
    document.body.classList.add('printing-daily-huddle');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-daily-huddle');
    }, 1000);
  };

  // Copy WhatsApp Briefing Summary
  const handleCopyWhatsAppBriefing = () => {
    const formattedDate = formatYMDToIndonesian(selectedDate, true);
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    let text = `*RSU MUHAMMADIYAH BABAT*\n`;
    text += `*LAPORAN MORNING BRIEFING & DAILY HUDDLE*\n`;
    text += `Hari, Tanggal: *${formattedDate}*\n`;
    text += `Shift/Waktu: *${activeStaff.shift || 'Shift Pagi'} (${timeNow})*\n`;
    text += `Petugas Pelapor: *${activeStaff.name} (${activeStaff.role || 'Admisi'})*\n`;
    text += `-----------------------------------------\n\n`;

    // 1. Kesiapan DPJP
    text += `🏥 *1. KESIAPAN DOKTER & RAWAT JALAN:*\n`;
    text += `• Total DPJP Praktik Hari Ini: *${activePracticingDoctors.length} Dokter*\n`;
    text += `• DPJP Cuti / Penyesuaian: *${doctorLeavesToday.length} Dokter*\n`;
    if (doctorLeavesToday.length > 0) {
      doctorLeavesToday.forEach((doc, idx) => {
        const item = doc.jadwal && doc.jadwal[0];
        const substitute = (item as any)?.dokterPengganti || (item?.keterangan?.toLowerCase().includes('diampu') ? item.keterangan : null);
        text += `  ${idx + 1}. *${doc.dpjp}* (${doc.poli})\n`;
        text += `     Ket: ${item?.keterangan || 'Libur Praktik'}\n`;
        text += `     Pengganti: ${substitute ? substitute : 'Poliklinik Tutup'}\n`;
      });
    } else {
      text += `  _Alhamdulillah, seluruh DPJP terjadwal hadir praktik normal._\n`;
    }
    text += `\n`;

    // 2. Operasi Elektif
    text += `🔪 *2. JADWAL OPERASI ELEKTIF (IBS):*\n`;
    text += `• Total Tindakan Terjadwal: *${scheduledSurgeriesToday.length} Pasien*\n`;
    if (scheduledSurgeriesToday.length > 0) {
      scheduledSurgeriesToday.forEach((op, idx) => {
        const jam = op.rencanaOp ? op.rencanaOp.split(' ')[1] || '08:00' : '08:00';
        text += `  ${idx + 1}. [${jam}] *${op.namaPasien}* (RM: ${op.noRm})\n`;
        text += `     Tindakan: ${op.tindakanBedah}\n`;
        text += `     Operator: ${op.dokterOperator} | OK: ${op.rencanaKamarOk}\n`;
        text += `     Penjamin: ${op.jenisBayar} | SPRI: ${op.spri === 'Sudah' ? '✅ Sudah' : '⚠️ Belum'}\n`;
      });
    } else {
      text += `  _Tidak ada jadwal operasi elektif terdaftar pada tanggal ini._\n`;
    }
    text += `\n`;

    // 3. Catatan Pasien Prioritas Tinggi
    text += `⚠️ *3. CATATAN PASIEN PRIORITAS TINGGI (${totalPriorityNotesCount} Kasus):*\n`;
    if (highPriorityHandovers.length > 0) {
      text += `• *Operan Shift Admisi / Handover Pending:*\n`;
      highPriorityHandovers.slice(0, 3).forEach((h) => {
        text += `  - ${h.namaPasien} (${h.noRm}): ${h.masalah}\n`;
      });
    }
    if (pendingBpjsKendala.length > 0) {
      text += `• *Kendala BPJS SEP Pending:*\n`;
      pendingBpjsKendala.slice(0, 3).forEach((b) => {
        text += `  - ${b.namaPasien} (${b.noRm}): ${b.jenisKendala} - ${b.detailMasalah}\n`;
      });
    }
    if (urgentKllCases.length > 0) {
      text += `• *Kasus KLL / LP Belum Terbit:*\n`;
      urgentKllCases.slice(0, 2).forEach((k) => {
        text += `  - ${k.namaPasien} (${k.noRm}): Penjamin ${k.penjamin}, LP: ${k.statusLp}\n`;
      });
    }
    text += `\n`;

    // 4. Checklist & Catatan
    text += `📋 *4. INSTRUKSI & CATATAN BRIEFING:*\n`;
    text += `• ${briefingNotes || 'Lakukan konfirmasi berkas dan kesiapan pasien tepat waktu.'}\n`;
    text += `\n-----------------------------------------\n`;
    text += `_Portal Pendaftaran & Admisi RSU Muhammadiyah Babat_`;

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    showToast?.('Ringkasan Daily Huddle berhasil disalin ke clipboard WhatsApp.', 'success');
    setTimeout(() => setCopiedWA(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* SCREEN MODAL VIEW */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 no-print"
        style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      >
        <div
          className="fixed inset-0 bg-transparent"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh]">
          {/* MODAL HEADER */}
          <div className="bg-gradient-to-r from-emerald-950 via-[#004732] to-[#005d42] text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 text-emerald-300 shrink-0">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      Daily Huddle Report & Morning Medical Briefing
                    </h2>
                    <span className="bg-emerald-400/25 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Agregator Lintas Unit</span>
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                    Ringkasan terpadu kesiapan operasi elektif (IBS), ketersediaan DPJP/dokter cuti, serta catatan pasien prioritas tinggi untuk koordinasi briefing medis pagi.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="self-end sm:self-start p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DATE SELECTOR & STATUS STRIP */}
            <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-emerald-200 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Tanggal Briefing:</span>
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/20 border border-white/25 rounded-xl text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                />
                {selectedDate !== todayYMD && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayYMD)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 text-[11px] font-semibold transition"
                  >
                    Hari Ini
                  </button>
                )}
                <span className="text-emerald-100 font-medium ml-1">
                  ({formatYMDToIndonesian(selectedDate, true)})
                </span>
              </div>

              <div className="flex items-center gap-2 text-emerald-200 font-medium">
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <span>Petugas: <b>{activeStaff.name}</b> ({activeStaff.shift || 'Shift Pagi'})</span>
              </div>
            </div>
          </div>

          {/* 4 SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
            {/* Card 1: Operasi Elektif */}
            <div
              onClick={() => setActiveTab('surgeries')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'surgeries'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Operasi IBS
                </span>
                <Scissors className="w-4 h-4 text-[#005d42]" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {scheduledSurgeriesToday.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">Tindakan</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                {scheduledSurgeriesToday.filter((s) => s.spri === 'Belum').length > 0 ? (
                  <span className="text-amber-700 font-bold flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    {scheduledSurgeriesToday.filter((s) => s.spri === 'Belum').length} SPRI Belum Terbit
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    SPRI Terverifikasi
                  </span>
                )}
              </p>
            </div>

            {/* Card 2: Dokter Cuti / Libur */}
            <div
              onClick={() => setActiveTab('leaves')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'leaves'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  DPJP Cuti / Izin
                </span>
                <Stethoscope className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-900">
                  {doctorLeavesToday.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">Dokter</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {activePracticingDoctors.length} DPJP Praktik Normal
              </p>
            </div>

            {/* Card 3: Catatan Pasien Prioritas Tinggi */}
            <div
              onClick={() => setActiveTab('notes')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Pasien Prioritas
                </span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-900">
                  {totalPriorityNotesCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">Kasus Pending</span>
              </div>
              <p className="text-[10px] text-rose-700 font-semibold mt-1">
                {highPriorityHandovers.length} Operan Urgent • {pendingBpjsKendala.length} SEP
              </p>
            </div>

            {/* Card 4: Kesiapan Checklist Briefing */}
            <div
              onClick={() => setActiveTab('checklist')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'checklist'
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Checklist Briefing
                </span>
                <CheckSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-900">
                  {checklistItems.filter((c) => c.done).length} / {checklistItems.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">Selesai</span>
              </div>
              <p className="text-[10px] text-blue-700 font-semibold mt-1">
                {Math.round((checklistItems.filter((c) => c.done).length / checklistItems.length) * 100)}% Kesiapan Operasional
              </p>
            </div>
          </div>

          {/* TAB NAVIGATION STRIP */}
          <div className="flex items-center gap-1.5 px-5 pt-3 bg-white border-b border-slate-200 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'border-[#005d42] text-[#005d42]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Semua Laporan Huddle</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('surgeries')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'surgeries'
                  ? 'border-[#005d42] text-[#005d42]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Jadwal Operasi ({scheduledSurgeriesToday.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'leaves'
                  ? 'border-[#005d42] text-[#005d42]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Dokter Cuti ({doctorLeavesToday.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'border-[#005d42] text-[#005d42]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Catatan Prioritas ({totalPriorityNotesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'checklist'
                  ? 'border-[#005d42] text-[#005d42]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Checklist & Catatan Briefing</span>
            </button>
          </div>

          {/* MODAL BODY (SCROLLABLE CONTENT) */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
            {/* ========================================================= */}
            {/* SECTION 1: JADWAL OPERASI ELEKTIF (IBS) */}
            {/* ========================================================= */}
            {(activeTab === 'all' || activeTab === 'surgeries') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#005d42] flex items-center justify-center font-bold">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        1. Jadwal Tindakan Bedah Elektif Kamar Operasi (IBS)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Penjadwalan pasien bedah terencana pada {formatYMDToIndonesian(selectedDate, false)}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {scheduledSurgeriesToday.length} Tindakan
                  </span>
                </div>

                {scheduledSurgeriesToday.length === 0 ? (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                    <Scissors className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      Tidak ada jadwal operasi elektif terdaftar pada {formatYMDToIndonesian(selectedDate, false)}.
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Kamar operasi IBS siap siaga untuk kasus darurat (Cito IGD/VK). Berikut adalah tindakan terdekat yang terdaftar dalam sistem:
                    </p>

                    {/* Preview upcoming surgeries */}
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {upcomingSurgeries.slice(0, 2).map((op) => (
                        <div key={op.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{op.namaPasien}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                              {op.rencanaOp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 truncate">{op.tindakanBedah}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Op: {op.dokterOperator}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                          <th className="py-2.5 px-3 w-12 text-center">No</th>
                          <th className="py-2.5 px-3 w-28">Jam & Ruang OK</th>
                          <th className="py-2.5 px-3">Nama Pasien & RM</th>
                          <th className="py-2.5 px-3">Tindakan Bedah</th>
                          <th className="py-2.5 px-3">Operator & Anestesi</th>
                          <th className="py-2.5 px-3 w-28 text-center">Penjamin & SPRI</th>
                          <th className="py-2.5 px-3 w-24 text-right">Kamar Ranap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scheduledSurgeriesToday.map((op, idx) => {
                          const jam = op.rencanaOp ? op.rencanaOp.split(' ')[1] || '08:30' : '08:30';
                          return (
                            <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#005d42]" />
                                  <span>{jam} WIB</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-semibold">{op.rencanaKamarOk}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{op.namaPasien}</div>
                                <div className="font-mono text-[10px] text-slate-500">RM: {op.noRm}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-800">{op.tindakanBedah}</div>
                                <div className="text-[10px] text-slate-500 italic">{op.instruksiPreOp || 'SOP IBS Standar'}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900">{op.dokterOperator}</div>
                                <div className="text-[10px] text-slate-500">{op.dokterAnestesi || 'dr. Sp.An'}</div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 mb-1">
                                  {op.jenisBayar}
                                </span>
                                <div>
                                  {op.spri === 'Sudah' ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      SPRI OK
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      SPRI Belum
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="font-medium text-slate-700 text-[11px] block">
                                  {op.kamarRawatInap || 'Transit IBS'}
                                </span>
                                <span className="text-[10px] text-slate-400">{op.kelas || 'Rawat Inap'}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION 2: DOKTER CUTI / PERUBAHAN PRAKTIK */}
            {/* ========================================================= */}
            {(activeTab === 'all' || activeTab === 'leaves') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        2. Ketersediaan Dokter & Penyesuaian Poliklinik Rawat Jalan
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Monitoring DPJP cuti, izin sakit, simposium, serta dokter pengganti hari ini
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {doctorLeavesToday.length} Dokter Cuti
                  </span>
                </div>

                {doctorLeavesToday.length === 0 ? (
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-900">Seluruh DPJP Praktik Sesuai Jadwal</p>
                      <p className="text-emerald-700 mt-0.5">
                        Tidak ada pengumuman cuti atau libur aktif untuk hari {formatYMDToIndonesian(selectedDate, true)}. Poliklinik beroperasi 100% normal.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {doctorLeavesToday.map((doc) => {
                      const activeItem = doc.jadwal && doc.jadwal[0];
                      return (
                        <div
                          key={doc.id}
                          className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/90 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight">{doc.dpjp}</h4>
                              <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">{doc.poli}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                              {activeItem?.tipe || 'LIBUR'}
                            </span>
                          </div>

                          <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200/70 text-[11px] space-y-1">
                            <p className="text-slate-700 font-medium">
                              <b>Keterangan:</b> {activeItem?.keterangan || 'Libur Praktik Sementara'}
                            </p>
                            {activeItem?.tglMasuk && (
                              <p className="text-slate-600">
                                <b>Praktik Kembali:</b> {activeItem.tglMasuk}
                              </p>
                            )}
                            <div className="pt-1 border-t border-amber-100 flex items-center justify-between">
                              <span className="text-slate-500">Status Poli:</span>
                              {(activeItem as any)?.dokterPengganti ? (
                                <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                                  Diampu {(activeItem as any).dokterPengganti}
                                </span>
                              ) : (
                                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  Poliklinik Tutup Sementara
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION 3: CATATAN PASIEN PRIORITAS TINGGI */}
            {/* ========================================================= */}
            {(activeTab === 'all' || activeTab === 'notes') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-900 flex items-center justify-center font-bold">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        3. Catatan Khusus & Pasien Prioritas Tinggi (Morning Briefing Alerts)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Isu admisi, operan shift pending, verifikasi SEP BPJS kendala, dan kasus kecelakaan lalu lintas
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
                    {totalPriorityNotesCount} Catatan Teridentifikasi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Subsection 3A: Operan Shift Pending */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Operan Shift Admisi Pending ({highPriorityHandovers.length})</span>
                      </h4>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Handover
                      </span>
                    </div>

                    {highPriorityHandovers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Tidak ada operan shift pending.</p>
                    ) : (
                      <div className="space-y-2">
                        {highPriorityHandovers.slice(0, 3).map((h) => (
                          <div key={h.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{h.namaPasien}</span>
                              <span className="font-mono text-[10px] text-slate-500">RM: {h.noRm}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">{h.masalah}</p>
                            <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                              <span>Petugas: {h.petugasAsal}</span>
                              <span className="font-bold text-rose-600">Prioritas: {h.prioritas}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subsection 3B: Kendala BPJS & Laka Lantas Jasa Raharja */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Kendala BPJS SEP & KLL ({pendingBpjsKendala.length + urgentKllCases.length})</span>
                      </h4>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Verifikasi
                      </span>
                    </div>

                    <div className="space-y-2">
                      {pendingBpjsKendala.slice(0, 2).map((b) => (
                        <div key={b.id} className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{b.namaPasien}</span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                              {b.jenisKendala}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{b.detailMasalah}</p>
                          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Solusi: {b.catatanSolusi}</p>
                        </div>
                      ))}

                      {urgentKllCases.slice(0, 2).map((k) => (
                        <div key={k.id} className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{k.namaPasien}</span>
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded">
                              KLL: {k.statusLp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{k.kronologi.slice(0, 90)}...</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Penjamin: {k.penjamin}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION 4: CHECKLIST & CATATAN BRIEFING */}
            {/* ========================================================= */}
            {(activeTab === 'all' || activeTab === 'checklist') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        4. Checklist Tindakan Koordinasi & Catatan Khusus Pagi
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Item verifikasi yang harus diselesaikan oleh staf shift pagi sebelum pelayanan rawat jalan & IBS dimulai
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Checklist Items */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <span className="text-xs font-bold text-slate-800 block">Checklist Verifikasi Briefing:</span>
                    <div className="space-y-2 text-xs">
                      {checklistItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleChecklist(item.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            item.done
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 text-emerald-700">
                            {item.done ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-md border border-slate-400" />
                            )}
                          </div>
                          <span className={`leading-snug ${item.done ? 'line-through text-slate-500' : 'font-medium'}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Briefing Notes Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 flex flex-col">
                    <span className="text-xs font-bold text-slate-800 block">
                      Instruksi Tambahan Supervisor / Pimpinan Rapat:
                    </span>
                    <textarea
                      value={briefingNotes}
                      onChange={(e) => setBriefingNotes(e.target.value)}
                      placeholder="Tuliskan arahan khusus untuk staf shift pagi, koordinasi dengan DPJP, atau pengingat penting lainnya..."
                      rows={4}
                      className="w-full flex-1 p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
                    />
                    <p className="text-[10px] text-slate-400">
                      Catatan ini akan otomatis tersalin ke dalam format pesan WhatsApp Briefing dan cetakan dokumen.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MODAL FOOTER CONTROLS */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-[#005d42]" />
              <span>
                Daily Huddle disinkronkan langsung dari modul <b>Jadwal Dokter</b>, <b>Operasi Elektif</b>, dan <b>Catatan Pasien</b>.
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleCopyWhatsAppBriefing}
                className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Salin ringkasan ke format pesan WhatsApp Grup Dokter & Admisi"
              >
                {copiedWA ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedWA ? 'Tersalin!' : 'Salin Ringkasan WA'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintReport}
                className="py-2.5 px-4 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Cetak Lembar Laporan Huddle Resmi RSUMB"
              >
                <Printer className="w-4 h-4 text-emerald-200" />
                <span>Cetak Lembar Briefing (A4)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINT CONTAINER FOR A4 REPORT */}
      <div className="print-daily-huddle-container hidden print:block bg-white text-slate-900 p-4">
        {/* Kop Surat Resmi RSUMB */}
        <PrintHeaderKop
          title="LAPORAN MORNING BRIEFING & DAILY HUDDLE OPERASIONAL"
          subtitle={`Tanggal: ${formatYMDToIndonesian(selectedDate, true)} | Shift: ${activeStaff.shift || 'Shift Pagi'}`}
          totalDataLabel={`Operasi: ${scheduledSurgeriesToday.length} • DPJP Cuti: ${doctorLeavesToday.length} • Prioritas: ${totalPriorityNotesCount}`}
          extraInfo={`Petugas Pelapor: ${activeStaff.name}`}
        />

        {/* Section 1: Ringkasan Status Huddle */}
        <div className="mb-4 p-2.5 border border-slate-300 rounded bg-slate-50 text-[10px] grid grid-cols-4 gap-2">
          <div>
            <span className="font-bold block text-slate-700">TINDAKAN IBS HARI INI:</span>
            <span className="text-xs font-bold text-slate-900">{scheduledSurgeriesToday.length} Tindakan</span>
          </div>
          <div>
            <span className="font-bold block text-slate-700">DPJP CUTI / LIBUR:</span>
            <span className="text-xs font-bold text-slate-900">{doctorLeavesToday.length} Dokter</span>
          </div>
          <div>
            <span className="font-bold block text-slate-700">DPJP PRAKTIK NORMAL:</span>
            <span className="text-xs font-bold text-slate-900">{activePracticingDoctors.length} Dokter</span>
          </div>
          <div>
            <span className="font-bold block text-slate-700">CATATAN PRIORITAS:</span>
            <span className="text-xs font-bold text-slate-900">{totalPriorityNotesCount} Kasus</span>
          </div>
        </div>

        {/* Section 2: Jadwal Operasi Elektif */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase text-[#047857] border-b border-slate-300 pb-1 mb-2">
            I. JADWAL TINDAKAN BEDAH ELEKTIF KAMAR OPERASI (IBS)
          </h3>
          {scheduledSurgeriesToday.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic">
              Tidak ada tindakan bedah elektif terdaftar pada tanggal ini. Kamar Operasi IBS siaga kasus Cito.
            </p>
          ) : (
            <table className="w-full text-[9px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-slate-300 p-1 text-center w-6">No</th>
                  <th className="border border-slate-300 p-1 w-20">Jam & Kamar OK</th>
                  <th className="border border-slate-300 p-1">Nama Pasien & RM</th>
                  <th className="border border-slate-300 p-1">Tindakan Bedah</th>
                  <th className="border border-slate-300 p-1">Operator & Anestesi</th>
                  <th className="border border-slate-300 p-1 w-20 text-center">Penjamin & SPRI</th>
                  <th className="border border-slate-300 p-1 w-16">Kamar Ranap</th>
                </tr>
              </thead>
              <tbody>
                {scheduledSurgeriesToday.map((op, idx) => (
                  <tr key={op.id}>
                    <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-1">
                      <b>{op.rencanaOp?.split(' ')[1] || '08:30'} WIB</b>
                      <div className="text-[8px] text-slate-600">{op.rencanaKamarOk}</div>
                    </td>
                    <td className="border border-slate-300 p-1">
                      <b>{op.namaPasien}</b>
                      <div className="text-[8px] font-mono">{op.noRm}</div>
                    </td>
                    <td className="border border-slate-300 p-1">{op.tindakanBedah}</td>
                    <td className="border border-slate-300 p-1">
                      <b>{op.dokterOperator}</b>
                      <div className="text-[8px]">{op.dokterAnestesi || 'Sp.An'}</div>
                    </td>
                    <td className="border border-slate-300 p-1 text-center">
                      {op.jenisBayar}
                      <div className="text-[8px] font-bold">SPRI: {op.spri}</div>
                    </td>
                    <td className="border border-slate-300 p-1">{op.kamarRawatInap || 'Transit'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 3: Dokter Cuti */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase text-[#047857] border-b border-slate-300 pb-1 mb-2">
            II. DOKTER CUTI / PERUBAHAN JADWAL RAWAT JALAN
          </h3>
          {doctorLeavesToday.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic">
              Seluruh DPJP rawat jalan hadir praktik normal sesuai jadwal SIMRS.
            </p>
          ) : (
            <table className="w-full text-[9px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-slate-300 p-1 text-center w-6">No</th>
                  <th className="border border-slate-300 p-1 w-44">Nama DPJP & Poli</th>
                  <th className="border border-slate-300 p-1">Keterangan / Alasan Cuti</th>
                  <th className="border border-slate-300 p-1 w-32">Dokter Pengganti / Status</th>
                  <th className="border border-slate-300 p-1 w-24">Praktik Kembali</th>
                </tr>
              </thead>
              <tbody>
                {doctorLeavesToday.map((doc, idx) => {
                  const item = doc.jadwal && doc.jadwal[0];
                  return (
                    <tr key={doc.id}>
                      <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-1">
                        <b>{doc.dpjp}</b>
                        <div className="text-[8px] text-slate-600">{doc.poli}</div>
                      </td>
                      <td className="border border-slate-300 p-1">{item?.keterangan || 'Libur Praktik'}</td>
                      <td className="border border-slate-300 p-1">
                        {(item as any)?.dokterPengganti ? `Diampu: ${(item as any).dokterPengganti}` : 'Poli Tutup Sementara'}
                      </td>
                      <td className="border border-slate-300 p-1">{item?.tglMasuk || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 4: Catatan Pasien Prioritas Tinggi */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase text-[#047857] border-b border-slate-300 pb-1 mb-2">
            III. CATATAN PASIEN PRIORITAS TINGGI (OPERAN ADMISI, BPJS, & KLL)
          </h3>
          <table className="w-full text-[9px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-slate-300 p-1 text-center w-6">No</th>
                <th className="border border-slate-300 p-1 w-28">Kategori</th>
                <th className="border border-slate-300 p-1 w-40">Nama Pasien & No. RM</th>
                <th className="border border-slate-300 p-1">Rincian Masalah / Tindak Lanjut Briefing</th>
                <th className="border border-slate-300 p-1 w-24">Petugas / Status</th>
              </tr>
            </thead>
            <tbody>
              {highPriorityHandovers.map((h, idx) => (
                <tr key={h.id}>
                  <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 p-1 font-bold text-blue-800">Handover Shift</td>
                  <td className="border border-slate-300 p-1">
                    <b>{h.namaPasien}</b>
                    <div className="text-[8px] font-mono">{h.noRm}</div>
                  </td>
                  <td className="border border-slate-300 p-1">{h.masalah}</td>
                  <td className="border border-slate-300 p-1">
                    {h.petugasAsal}
                    <div className="text-[8px] font-bold text-rose-700">Status: {h.status}</div>
                  </td>
                </tr>
              ))}
              {pendingBpjsKendala.map((b, idx) => (
                <tr key={b.id}>
                  <td className="border border-slate-300 p-1 text-center">{highPriorityHandovers.length + idx + 1}</td>
                  <td className="border border-slate-300 p-1 font-bold text-amber-800">SEP BPJS: {b.jenisKendala}</td>
                  <td className="border border-slate-300 p-1">
                    <b>{b.namaPasien}</b>
                    <div className="text-[8px] font-mono">{b.noRm}</div>
                  </td>
                  <td className="border border-slate-300 p-1">{b.detailMasalah} - Solusi: {b.catatanSolusi}</td>
                  <td className="border border-slate-300 p-1 font-bold text-amber-700">{b.status}</td>
                </tr>
              ))}
              {urgentKllCases.map((k, idx) => (
                <tr key={k.id}>
                  <td className="border border-slate-300 p-1 text-center">
                    {highPriorityHandovers.length + pendingBpjsKendala.length + idx + 1}
                  </td>
                  <td className="border border-slate-300 p-1 font-bold text-rose-800">KLL Jasa Raharja</td>
                  <td className="border border-slate-300 p-1">
                    <b>{k.namaPasien}</b>
                    <div className="text-[8px] font-mono">{k.noRm}</div>
                  </td>
                  <td className="border border-slate-300 p-1">
                    {k.kronologi.slice(0, 100)}... Status LP: <b>{k.statusLp}</b>
                  </td>
                  <td className="border border-slate-300 p-1">{k.penjamin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 5: Instruksi Briefing & Tanda Tangan */}
        <div className="mb-4 p-2.5 border border-slate-300 rounded text-[10px]">
          <span className="font-bold block text-slate-800">ARAHAN KHUSUS SUPERVISOR / PIMPINAN BRIEFING:</span>
          <p className="mt-1 text-slate-700 italic">{briefingNotes}</p>
        </div>

        {/* Signature Block */}
        <PrintSignatureBlock
          city="Babat"
          signTitle="Petugas Pelapor Morning Briefing / Admisi"
          picName={activeStaff.name}
        />
      </div>
    </>
  );
};
