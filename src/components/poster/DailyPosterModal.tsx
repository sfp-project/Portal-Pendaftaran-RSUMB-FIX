import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  X,
  Download,
  Printer,
  Calendar,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Share2,
  Layers,
  Loader2
} from 'lucide-react';
import { DoctorSchedule, DoctorLeaveAnnouncement } from '../../types';
import { DailySchedulePoster } from './DailySchedulePoster';
import { PosterDoctorData } from './DoctorPosterItem';
import {
  isDoctorLeaveActiveOnDate,
  formatDoctorScheduleTime,
  formatHfisTime
} from '../../utils/dateHelpers';

interface DailyPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: DoctorSchedule[];
  doctorLeaves: DoctorLeaveAnnouncement[];
  showToast?: (message: string) => void;
}

const INDONESIAN_DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export const DailyPosterModal: React.FC<DailyPosterModalProps> = ({
  isOpen,
  onClose,
  schedules,
  doctorLeaves,
  showToast
}) => {
  // 1. Date State (Default: Today in YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Zoom scale state for poster preview
  const [zoomScale, setZoomScale] = useState<number>(0.72);
  const [exportingType, setExportingType] = useState<'png' | 'pdf' | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'quick-edit'>('preview');

  // Manual doctor status overrides (e.g. if humas wants to toggle a doctor Hadir/Tidak Praktik)
  const [manualOverrides, setManualOverrides] = useState<
    Record<string, { status?: 'Hadir' | 'Tidak Praktik'; jamPraktik?: string }>
  >({});

  // Reset overrides when date changes
  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setManualOverrides({});
  };

  // Convert selectedDate to Indonesian day name and formatted date string
  const { dayName, formattedDateString, dateSlug } = useMemo(() => {
    if (!selectedDate) {
      return {
        dayName: 'Rabu',
        formattedDateString: 'Rabu, 9 September 2026',
        dateSlug: '2026-09-09'
      };
    }
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayIdx = dateObj.getDay();
    const day = INDONESIAN_DAYS[dayIdx];
    const month = INDONESIAN_MONTHS[m - 1];
    const formatted = `${day}, ${d} ${month} ${y}`;
    return {
      dayName: day,
      formattedDateString: formatted,
      dateSlug: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    };
  }, [selectedDate]);

  // Clean poli specialist label
  const getSpecialistLabel = (poli: string): string => {
    const clean = poli.replace(/^Poli\s+/i, '').trim().toUpperCase();
    if (clean.startsWith('SPESIALIS')) return clean;
    if (clean === 'OBGYN' || clean === 'KANDUNGAN') return 'SPESIALIS KANDUNGAN & KEBIDANAN';
    if (clean === 'DALAM') return 'SPESIALIS PENYAKIT DALAM';
    if (clean === 'ANAK') return 'SPESIALIS KESEHATAN ANAK';
    if (clean === 'SARAF') return 'SPESIALIS SARAF';
    if (clean === 'BEDAH') return 'SPESIALIS BEDAH UMUM';
    if (clean === 'BEDAH SARAF') return 'SPESIALIS BEDAH SARAF';
    if (clean === 'ORTOPEDI') return 'SPESIALIS ORTOPEDI & TRAUMATOLOGI';
    if (clean === 'JANTUNG') return 'SPESIALIS JANTUNG & PEMBULUH DARAH';
    if (clean === 'PARU') return 'SPESIALIS PARU & PERNAPASAN';
    if (clean === 'MATA') return 'SPESIALIS MATA';
    if (clean === 'THT') return 'SPESIALIS THT-BKL';
    if (clean === 'KULIT') return 'SPESIALIS KULIT & KELAMIN';
    if (clean === 'UROLOGI') return 'SPESIALIS UROLOGI';
    if (clean === 'REHAB') return 'SPESIALIS KEDOKTERAN FISIK & REHABILITASI';
    return `SPESIALIS ${clean}`;
  };

  // 2. Compute Auto-Detected Doctor List for the selected day
  const posterDoctors: PosterDoctorData[] = useMemo(() => {
    // Match schedules where schedule.hari matches dayName (case-insensitive & handles Jum'at)
    const normalizedTargetDay = dayName.toLowerCase().replace(/['`]/g, '');

    const daySchedules = schedules.filter((sch) => {
      const schDayNorm = (sch.hari || '').toLowerCase().replace(/['`]/g, '');
      return schDayNorm === normalizedTargetDay;
    });

    // Deduplicate by doctor name so each doctor appears once on the poster
    const doctorMap = new Map<string, DoctorSchedule>();
    daySchedules.forEach((sch) => {
      const key = sch.dpjp.toLowerCase().trim();
      if (!doctorMap.has(key)) {
        doctorMap.set(key, sch);
      }
    });

    const list: PosterDoctorData[] = Array.from(doctorMap.values()).map((sch) => {
      // Check if doctor has active leave announcement for this date
      const hasLeave = doctorLeaves.some((leave) => {
        const nameMatch =
          leave.dpjp.toLowerCase().includes(sch.dpjp.toLowerCase().slice(0, 8)) ||
          sch.dpjp.toLowerCase().includes(leave.dpjp.toLowerCase().slice(0, 8));
        return nameMatch && isDoctorLeaveActiveOnDate(leave, selectedDate);
      });

      // Default status detection
      const isMasterLibur = sch.status === 'Libur' || hasLeave;
      const defaultStatus: 'Hadir' | 'Tidak Praktik' = isMasterLibur ? 'Tidak Praktik' : 'Hadir';

      // Check manual overrides if set by Humas in UI
      const override = manualOverrides[sch.id];
      const finalStatus = override?.status || defaultStatus;

      // Practice hours format
      const defaultJam = formatDoctorScheduleTime(sch) || formatHfisTime(sch.jamHfis) || '08.00 - Selesai WIB';
      const finalJam = override?.jamPraktik || defaultJam;

      return {
        id: sch.id,
        dpjp: sch.dpjp,
        poli: sch.poli,
        spesialisLabel: getSpecialistLabel(sch.poli),
        jamPraktik: finalJam,
        status: finalStatus,
        keterangan: hasLeave ? 'Izin / Cuti Dokter' : sch.catatanKhusus,
        ruangan: sch.ruangan
      };
    });

    // Sort: Hadir doctors first, then Tidak Praktik
    return list.sort((a, b) => {
      if (a.status === b.status) return a.poli.localeCompare(b.poli);
      return a.status === 'Hadir' ? -1 : 1;
    });
  }, [schedules, doctorLeaves, dayName, selectedDate, manualOverrides]);

  // Handler to toggle doctor status in the quick-edit or by clicking card
  const handleToggleDoctorStatus = (doctorId: string) => {
    setManualOverrides((prev) => {
      const current = posterDoctors.find((d) => d.id === doctorId);
      if (!current) return prev;
      const nextStatus = current.status === 'Hadir' ? 'Tidak Praktik' : 'Hadir';
      return {
        ...prev,
        [doctorId]: {
          ...prev[doctorId],
          status: nextStatus
        }
      };
    });
    showToast?.('Status dokter berhasil diubah untuk poster.');
  };

  // 3. Export to PNG via html2canvas with Font Loading Fix
  const handleDownloadPng = async () => {
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    setExportingType('png');
    showToast?.('Menunggu font siap & merender poster PNG (HD)...');

    // Tunggu font web ter-render sempurna sebelum capture
    const waitFonts = document.fonts ? document.fonts.ready : Promise.resolve();
    waitFonts.then(() => {
      const element = document.getElementById('poster-jadwal-container');
      if (!element) {
        showToast?.('Container poster (#poster-jadwal-container) tidak ditemukan.');
        setExportingType(null);
        return;
      }

      html2canvas(element, {
        scale: 2,                 // Resolusi HD
        useCORS: true,            // Izinkan logo & gambar luar
        allowTaint: true,
        letterRendering: true,   // CEGAH TEKS BERTUMPUK / BERHIMPITAN
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      } as any)
        .then((canvas) => {
          const link = document.createElement('a');
          link.download = `Jadwal-Dokter-RSUMB-${new Date().toISOString().slice(0, 10)}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast?.(`Poster PNG berhasil diunduh: ${link.download}`);
        })
        .catch((err) => {
          console.error('html2canvas error:', err);
          showToast?.('Gagal mengunduh poster PNG.');
        })
        .finally(() => {
          setExportingType(null);
        });
    });
  };

  // 4. Export to PDF via jsPDF & html2canvas with Font Loading Fix
  const handleDownloadPdf = async () => {
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    setExportingType('pdf');
    showToast?.('Menunggu font siap & menyiapkan dokumen PDF ukuran A4...');

    const waitFonts = document.fonts ? document.fonts.ready : Promise.resolve();
    waitFonts.then(() => {
      const element = document.getElementById('poster-jadwal-container');
      if (!element) {
        showToast?.('Container poster (#poster-jadwal-container) tidak ditemukan.');
        setExportingType(null);
        return;
      }

      html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,   // CEGAH TEKS BERTUMPUK / BERHIMPITAN
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      } as any)
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new jsPDF('p', 'mm', 'a4');
          pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
          const filename = `Jadwal-Dokter-RSUMB-${new Date().toISOString().slice(0, 10)}.pdf`;
          pdf.save(filename);
          showToast?.(`Poster PDF berhasil diunduh: ${filename}`);
        })
        .catch((err) => {
          console.error('html2canvas PDF error:', err);
          showToast?.('Gagal membuat PDF.');
        })
        .finally(() => {
          setExportingType(null);
        });
    });
  };

  // 5. Print Poster directly
  const handlePrint = () => {
    window.print();
  };

  // Shortcut helpers: Today, Tomorrow
  const handleSetToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    handleDateSelect(`${y}-${m}-${dt}`);
  };

  const handleSetTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    handleDateSelect(`${y}-${m}-${dt}`);
  };

  if (!isOpen) return null;

  return (
    <div
      id="daily-poster-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            MODAL HEADER BAR
        ======================================================== */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#005d42] to-[#00A859] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Auto-Poster Jadwal Harian RSUMB
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/30">
                  Ready-to-Print / Medsos
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Generator poster resmi otomatis Poliklinik Rawat Jalan RSU Muhammadiyah Babat
              </p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2">
            {/* Tombol [ 🖼️ Unduh Poster PNG ] */}
            <button
              type="button"
              id="btn-download-poster-png"
              onClick={handleDownloadPng}
              disabled={exportingType !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#00A859] to-[#008f4c] hover:from-[#008f4c] hover:to-[#00733d] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Unduh file PNG resolusi tinggi: Jadwal-Dokter-RSUMB-[Tanggal].png"
            >
              {exportingType === 'png' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh PNG (.PNG)</span>
                </>
              )}
            </button>

            {/* Tombol [ 📄 Unduh PDF ] */}
            <button
              type="button"
              id="btn-download-poster-pdf"
              onClick={handleDownloadPdf}
              disabled={exportingType !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Unduh berkas PDF siap cetak ukuran A4: Jadwal-Dokter-RSUMB-[Tanggal].pdf"
            >
              {exportingType === 'pdf' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-200" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>

            {/* Tombol [ 🖨️ Cetak ] */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
              title="Cetak Poster langsung"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Tombol [ ✖️ Tutup ] */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer ml-1"
              aria-label="Tutup modal poster"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            SUBHEADER CONTROL TOOLBAR (DATE PICKER & QUICK TOGGLES)
        ======================================================== */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Left: Date Selection Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#00A859]" />
              Pilih Tanggal:
            </span>

            {/* Preset Buttons: Hari Ini, Besok */}
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1 rounded-lg font-bold transition bg-slate-800 text-slate-200 hover:bg-[#005d42] hover:text-white cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handleSetTomorrow}
              className="px-2.5 py-1 rounded-lg font-bold transition bg-slate-800 text-slate-200 hover:bg-[#005d42] hover:text-white cursor-pointer"
            >
              Besok
            </button>

            {/* Date Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-[#00A859] cursor-pointer"
            />

            {/* Display Badge Tanggal Terpilih */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00A859]/20 text-emerald-300 font-extrabold border border-[#00A859]/40">
              <span>{formattedDateString}</span>
              <span className="text-[10px] text-emerald-400 font-normal">
                ({posterDoctors.length} Dokter Terdeteksi)
              </span>
            </div>
          </div>

          {/* Right: Zoom Scale & Tab Switcher */}
          <div className="flex items-center gap-3">
            {/* Tab switch: Preview vs Editor Dokter */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-bold transition ${
                  activeTab === 'preview'
                    ? 'bg-[#005d42] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pratinjau Poster
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quick-edit')}
                className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                  activeTab === 'quick-edit'
                    ? 'bg-[#005d42] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Pengaturan Dokter ({posterDoctors.length})</span>
              </button>
            </div>

            {/* Zoom Controls (only active on preview tab) */}
            {activeTab === 'preview' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(0.4, prev - 0.08))}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Perkecil Tampilan"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-slate-300 w-11 text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(1.2, prev + 0.08))}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Perbesar Tampilan"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(0.72)}
                  className="text-[10px] text-slate-400 hover:text-white ml-1 px-1 border-l border-slate-700"
                  title="Reset Zoom"
                >
                  Fit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            MODAL BODY CONTENT
        ======================================================== */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 flex justify-center">
          {activeTab === 'preview' ? (
            /* Tab 1: Live Interactive Poster View */
            <div className="flex flex-col items-center">
              <div className="mb-3 text-center text-xs text-slate-400">
                <span>💡 Tip: Anda dapat langsung </span>
                <span className="text-emerald-400 font-bold">mengklik card dokter</span>
                <span> pada poster di bawah untuk mengubah status antara </span>
                <span className="text-sky-400 font-bold">Hadir</span>
                <span> dan </span>
                <span className="text-rose-400 font-bold">TIDAK PRAKTIK</span>.
              </div>

              {/* Poster Container Wrapper */}
              <div
                className="transition-all duration-200 shadow-2xl rounded-sm overflow-hidden"
                style={{
                  width: `${840 * zoomScale}px`,
                  minHeight: `${1188 * zoomScale}px`
                }}
              >
                <div
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                    width: '840px'
                  }}
                >
                  <DailySchedulePoster
                    doctors={posterDoctors}
                    dateString={formattedDateString}
                    isInteractive={true}
                    onToggleStatus={handleToggleDoctorStatus}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Quick Management Table for Doctors */
            <div className="w-full max-w-4xl bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4 text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Daftar Dokter Praktik ({formattedDateString})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ubah status hadir / tidak praktik atau sesuaikan keterangan jam bertugas sebelum mengunduh poster.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setManualOverrides({});
                    showToast?.('Status dokter dikembalikan ke otomatis.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset ke Otomatis</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {posterDoctors.map((doc) => {
                  const isTidakPraktik = doc.status === 'Tidak Praktik';
                  return (
                    <div
                      key={doc.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isTidakPraktik
                          ? 'bg-rose-950/30 border-rose-800/60'
                          : 'bg-slate-800/70 border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            isTidakPraktik ? 'bg-[#FF0000]' : 'bg-[#00A859]'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#00A859] text-white">
                              {doc.poli}
                            </span>
                            <h5 className="font-extrabold text-xs text-white">
                              {doc.dpjp}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{doc.jamPraktik}</span>
                            {doc.keterangan && (
                              <span className="text-amber-400 font-medium">
                                • {doc.keterangan}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleDoctorStatus(doc.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isTidakPraktik
                              ? 'bg-[#FF0000] text-white hover:bg-rose-700'
                              : 'bg-[#1E3A8A] text-white hover:bg-blue-800'
                          }`}
                        >
                          {isTidakPraktik ? 'TIDAK PRAKTIK' : 'HADIR / PRAKTIK'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold transition"
                >
                  Kembali ke Pratinjau Poster →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
