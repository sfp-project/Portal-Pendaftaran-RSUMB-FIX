import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import {
  X,
  Download,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  MapPin,
  Phone,
  Instagram,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Building2,
  Layers,
  Edit3,
  Eye,
  Sliders,
  Maximize2,
  FileImage,
  RefreshCw,
  Loader2,
  Share2
} from 'lucide-react';
import { DoctorLeaveAnnouncement, DoctorSchedule, DoctorLeaveItem } from '../../types';
import { RSUMB_LOGO_BASE64 } from '../../assets/logoRsumbBase64';
import { formatDoctorScheduleTime } from '../../utils/dateHelpers';

interface DoctorLeavePosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: DoctorLeaveAnnouncement | null;
  schedules: DoctorSchedule[];
  showToast?: (message: string) => void;
}

// Specialty helper lookup
function getDoctorFullSpecialty(poli: string, dpjp: string): string {
  const p = (poli || '').toLowerCase();
  const d = (dpjp || '').toLowerCase();

  if (p.includes('ortopedi') || d.includes('sp.ot') || d.includes('sp. ot')) {
    return 'Spesialis Ortopedi dan Traumatologi (Sp.OT)';
  }
  if (p.includes('jantung') || p.includes('kardio') || d.includes('sp.jp') || d.includes('sp. jp')) {
    return 'Spesialis Jantung dan Pembuluh Darah (Sp.JP)';
  }
  if (p.includes('dalam') || p.includes('interna') || d.includes('sp.pd') || d.includes('sp. pd')) {
    return 'Spesialis Penyakit Dalam (Sp.PD)';
  }
  if (p.includes('anak') || p.includes('pediatri') || d.includes('sp.a') || d.includes('sp. a')) {
    return 'Spesialis Anak (Sp.A)';
  }
  if (p.includes('saraf') || p.includes('neuro') || d.includes('sp.n') || d.includes('sp. n') || d.includes('sp.s')) {
    return 'Spesialis Saraf / Neurologi (Sp.N)';
  }
  if (p.includes('bedah umum') || (p === 'bedah' && !p.includes('saraf') && !p.includes('ortopedi') && !p.includes('urologi'))) {
    return 'Spesialis Bedah Umum (Sp.B)';
  }
  if (p.includes('bedah saraf') || d.includes('sp.bs')) {
    return 'Spesialis Bedah Saraf (Sp.BS)';
  }
  if (p.includes('urologi') || d.includes('sp.u') || d.includes('sp. u')) {
    return 'Spesialis Urologi (Sp.U)';
  }
  if (p.includes('obgyn') || p.includes('kandungan') || d.includes('sp.og') || d.includes('sp. og')) {
    return 'Spesialis Obstetri dan Ginekologi (Sp.OG)';
  }
  if (p.includes('mata') || d.includes('sp.m') || d.includes('sp. m')) {
    return 'Spesialis Mata (Sp.M)';
  }
  if (p.includes('tht') || d.includes('sp.tht') || d.includes('sp. tht')) {
    return 'Spesialis Telinga Hidung Tenggorok (Sp.THT-BKL)';
  }
  if (p.includes('paru') || d.includes('sp.p') || d.includes('sp. p')) {
    return 'Spesialis Paru (Sp.P)';
  }
  if (p.includes('kulit') || p.includes('dv') || d.includes('sp.dv') || d.includes('sp.kk')) {
    return 'Spesialis Dermatologi dan Venereologi (Sp.DV)';
  }
  if (p.includes('gigi') || d.includes('sp.kg') || d.includes('drg')) {
    return 'Spesialis Kedokteran Gigi & Mulut';
  }
  if (p.includes('jiwa') || p.includes('psikiatri') || d.includes('sp.kj')) {
    return 'Spesialis Kedokteran Jiwa (Sp.KJ)';
  }
  if (p.includes('rehab') || p.includes('medik') || d.includes('sp.kfr')) {
    return 'Spesialis Kedokteran Fisik & Rehabilitasi (Sp.KFR)';
  }

  const match = dpjp.match(/Sp\.[A-Za-z\.\-]+/i);
  if (match) {
    return `Spesialis ${poli.replace(/^Poli\s+/i, '')} (${match[0]})`;
  }
  return `Spesialis ${poli.replace(/^Poli\s+/i, '')}`;
}

interface DoctorLeavePosterModalContentProps {
  onClose: () => void;
  leave: DoctorLeaveAnnouncement;
  schedules: DoctorSchedule[];
  showToast?: (msg: string) => void;
}

const DoctorLeavePosterModalContent: React.FC<DoctorLeavePosterModalContentProps> = ({
  onClose,
  leave,
  schedules,
  showToast
}) => {
  // 1. Aspect Ratio state: 'feed' (4:5) vs 'story' (9:16)
  const [aspectRatio, setAspectRatio] = useState<'feed' | 'story'>('feed');

  // 2. Active Session Index if doctor has multiple sessions
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);

  // 3. Edit mode tab: 'preview' vs 'customize'
  const [activeTab, setActiveTab] = useState<'preview' | 'customize'>('preview');

  // 4. Custom overrides for text customization
  const [customTitle, setCustomTitle] = useState<string>('PERUBAHAN JADWAL DOKTER');
  const [customSubtitle, setCustomSubtitle] = useState<string>('Poliklinik Rawat Jalan | RSU Muhammadiyah Babat');
  const [customLeaveDate, setCustomLeaveDate] = useState<string>('');
  const [customReturnDate, setCustomReturnDate] = useState<string>('');
  const [customPracticeHour, setCustomPracticeHour] = useState<string>('');
  const [customBadgeText, setCustomBadgeText] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>(
    'Pelayanan pendaftaran dan pemeriksaan poliklinik kembali dibuka sesuai jadwal dokter di atas. Mohon maaf atas ketidaknyamanan ini.'
  );

  // 5. Exporting loading state
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Get matching schedule info for practice hours
  const matchingSchedule = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/['’`\.]/g, '').trim();
    const docNorm = norm(leave.dpjp);
    return schedules.find((s) => {
      const sNorm = norm(s.dpjp);
      return sNorm === docNorm || sNorm.includes(docNorm) || docNorm.includes(sNorm);
    });
  }, [leave.dpjp, schedules]);

  const defaultPracticeTime = useMemo(() => {
    if (matchingSchedule) {
      const timeStr = formatDoctorScheduleTime(matchingSchedule);
      if (timeStr && timeStr !== '-') {
        return `Pukul ${timeStr}`;
      }
    }
    return 'Pukul 08.00 WIB s/d Selesai';
  }, [matchingSchedule]);

  // Current session item
  const currentItem: DoctorLeaveItem = useMemo(() => {
    if (leave.jadwal && leave.jadwal.length > 0) {
      const idx = Math.min(selectedSessionIndex, leave.jadwal.length - 1);
      return leave.jadwal[idx] || leave.jadwal[0];
    }
    return {
      tglLibur: 'Hari Ini',
      tglMasuk: 'Besok',
      tipe: 'LIBUR',
      keterangan: 'LIBUR PRAKTIK'
    };
  }, [leave.jadwal, selectedSessionIndex]);

  // Dynamic values combining original and overrides
  const displayLeaveDate = customLeaveDate || currentItem.tglLibur || 'Sesuai Pengumuman';
  const displayReturnDate = customReturnDate || currentItem.tglMasuk || 'Sesuai Jadwal';
  const displayPracticeHour = customPracticeHour || defaultPracticeTime;
  const displayDoctorSpecialty = useMemo(() => {
    return getDoctorFullSpecialty(leave.poli, leave.dpjp);
  }, [leave.poli, leave.dpjp]);

  // Badge Text & Style based on leave type
  const badgeInfo = useMemo(() => {
    if (customBadgeText) {
      return {
        text: customBadgeText.toUpperCase(),
        bgGradient: 'from-red-600 to-rose-700',
        borderColor: 'border-red-400',
        textColor: 'text-white'
      };
    }
    if (currentItem.tipe === 'MAJU') {
      return {
        text: 'JADWAL MAJU',
        bgGradient: 'from-blue-600 to-indigo-700',
        borderColor: 'border-blue-400',
        textColor: 'text-white'
      };
    }
    if (currentItem.tipe === 'CUTI') {
      return {
        text: 'CUTI PRAKTIK',
        bgGradient: 'from-purple-600 to-indigo-700',
        borderColor: 'border-purple-400',
        textColor: 'text-white'
      };
    }
    return {
      text: 'LIBUR',
      bgGradient: 'from-red-600 to-rose-700',
      borderColor: 'border-red-400',
      textColor: 'text-white'
    };
  }, [currentItem.tipe, customBadgeText]);

  // Handle Download JPG using html2canvas-pro
  const handleDownloadJpg = async () => {
    setIsExporting(true);
    showToast?.('Menyiapkan poster beresolusi tinggi (Format JPG)...');

    // Ensure fonts are loaded
    const waitFonts = document.fonts ? document.fonts.ready : Promise.resolve();
    waitFonts
      .then(async () => {
        // Switch to preview if in customize tab
        if (activeTab !== 'preview') {
          setActiveTab('preview');
          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        const element = document.getElementById('doctor-leave-poster-canvas');
        if (!element) {
          showToast?.('Elemen poster tidak ditemukan.');
          setIsExporting(false);
          return;
        }

        // Render HTML element to high-res canvas
        const canvas = await html2canvas(element, {
          scale: 2, // 2x high resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        } as any);

        // Convert canvas to JPG (image/jpeg, quality 0.95)
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Clean filename: Poster-Libur-[NamaDokter]-[Tanggal].jpg
        const cleanDocName = leave.dpjp
          .replace(/[,\/\\?%*:|"<>]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        const cleanDate = displayLeaveDate
          .replace(/[,\/\\?%*:|"<>]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        const filename = `Poster-Libur-${cleanDocName}-${cleanDate}.jpg`;

        // Trigger auto-download
        const link = document.createElement('a');
        link.download = filename;
        link.href = imgData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast?.(`Poster JPG berhasil diunduh: ${filename}`);
      })
      .catch((err) => {
        console.error('Download JPG Error:', err);
        showToast?.('Gagal mengonversi poster ke JPG. Silakan coba kembali.');
      })
      .finally(() => {
        setIsExporting(false);
      });
  };

  // Dimensions based on aspect ratio
  const posterWidth = 800;
  const posterHeight = aspectRatio === 'feed' ? 1000 : 1380; // 4:5 vs 9:16 approx

  return (
    <div
      id="modal-poster-libur-dokter"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Generate & Unduh Poster Libur Praktik DPJP
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Format JPG HD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {leave.dpjp} • Poliklinik {leave.poli}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Toggle Aspect Ratio */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setAspectRatio('feed')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  aspectRatio === 'feed'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Feed (4:5)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('story')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  aspectRatio === 'story'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Story (9:16)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls / Toolbar */}
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Sesi Perubahan Selector (jika dokter punya lebih dari 1 tanggal libur) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Pilih Jadwal Libur:</span>
            {leave.jadwal && leave.jadwal.length > 1 ? (
              <select
                value={selectedSessionIndex}
                onChange={(e) => {
                  setSelectedSessionIndex(Number(e.target.value));
                  setCustomLeaveDate('');
                  setCustomReturnDate('');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                {leave.jadwal.map((j, idx) => (
                  <option key={idx} value={idx}>
                    Sesi {idx + 1}: {j.tglLibur} ({j.tipe})
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-800">
                {currentItem.tglLibur} ({currentItem.tipe})
              </span>
            )}
          </div>

          {/* Mode Tab Toggle & Action Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau Poster</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('customize')}
                className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'customize'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Kustomisasi Teks</span>
              </button>
            </div>

            {/* Tombol Utama: Unduh Poster JPG */}
            <button
              type="button"
              id="btn-modal-unduh-poster-jpg"
              onClick={handleDownloadJpg}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengonversi ke JPG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Poster JPG</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex flex-col lg:flex-row items-start justify-center gap-6">
          {/* Kustomisasi Sidebar (jika tab customize aktif) */}
          {activeTab === 'customize' && (
            <div className="w-full lg:w-80 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 shrink-0">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Konten Poster</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rasio Ukuran Poster:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('feed')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      aspectRatio === 'feed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Feed IG (4:5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('story')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      aspectRatio === 'story'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Story / WA (9:16)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teks Label Tanggal Libur:
                </label>
                <input
                  type="text"
                  value={customLeaveDate || currentItem.tglLibur}
                  onChange={(e) => setCustomLeaveDate(e.target.value)}
                  placeholder="Contoh: Rabu, 9 September 2026"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Badge Penanda Utama:
                </label>
                <input
                  type="text"
                  value={customBadgeText || badgeInfo.text}
                  onChange={(e) => setCustomBadgeText(e.target.value)}
                  placeholder="Contoh: LIBUR atau JADWAL MAJU"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Praktik Kembali (Hari, Tanggal):
                </label>
                <input
                  type="text"
                  value={customReturnDate || currentItem.tglMasuk}
                  onChange={(e) => setCustomReturnDate(e.target.value)}
                  placeholder="Contoh: Kamis, 10 September 2026"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam / Pukul Praktik:
                </label>
                <input
                  type="text"
                  value={customPracticeHour || defaultPracticeTime}
                  onChange={(e) => setCustomPracticeHour(e.target.value)}
                  placeholder="Contoh: Pukul 08.00 WIB s/d Selesai"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pengumuman Bawah:
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomLeaveDate('');
                    setCustomReturnDate('');
                    setCustomPracticeHour('');
                    setCustomBadgeText('');
                    setCustomNote(
                      'Pelayanan pendaftaran dan pemeriksaan poliklinik kembali dibuka sesuai jadwal dokter di atas. Mohon maaf atas ketidaknyamanan ini.'
                    );
                  }}
                  className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset ke Standar Otomatis
                </button>
              </div>
            </div>
          )}

          {/* Canvas Wrapper with Zoom & Aspect Scale */}
          <div className="flex-1 flex flex-col items-center justify-center overflow-x-auto w-full">
            {/* Visual Frame Container */}
            <div
              className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-300 transition-all origin-top scale-[0.62] sm:scale-[0.78] md:scale-[0.88] lg:scale-[0.95]"
              style={{
                width: `${posterWidth}px`,
                minWidth: `${posterWidth}px`,
                maxWidth: `${posterWidth}px`
              }}
            >
              {/* =========================================================
                  POSTER HTML TEMPLATE (Target html2canvas conversion)
              ========================================================= */}
              <div
                id="doctor-leave-poster-canvas"
                className="bg-white text-slate-900 relative overflow-hidden flex flex-col justify-between"
                style={{
                  width: `${posterWidth}px`,
                  minHeight: `${posterHeight}px`,
                  fontFamily:
                    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
              >
                {/* Decorative Top Accent Border */}
                <div className="h-2.5 w-full bg-gradient-to-r from-[#005d42] via-[#00A859] to-[#0A2540]" />

                {/* ========================================================
                    1. HEADER ATAS (KOP RESMI RSUMB + SERTIFIKASI)
                ======================================================== */}
                <header className="relative bg-gradient-to-b from-slate-50 via-white to-white px-8 pt-6 pb-4 border-b border-slate-200">
                  {/* Top Row: Logo & Certification Badges */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Logo & Identitas Rumah Sakit */}
                    <div className="flex items-center gap-4">
                      <div className="w-18 h-18 rounded-full overflow-hidden bg-white shadow-md border-2 border-[#00A859] p-0.5 shrink-0 flex items-center justify-center">
                        <img
                          src={RSUMB_LOGO_BASE64}
                          alt="Logo RSU Muhammadiyah Babat"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#00A859] tracking-wider uppercase">
                          <span>Majelis Pembina Kesehatan Umum</span>
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-[#0A2540] leading-tight">
                          RSU MUHAMMADIYAH BABAT
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Komitmen Melayani Sepenuh Hati • Terakreditasi Paripurna KARS
                        </p>
                      </div>
                    </div>

                    {/* Baris Sertifikasi / Akreditasi: PARIPURNA, HALAL, MUHAMMADIYAH, ISTIMEWA */}
                    <div className="flex items-center gap-2">
                      {/* Badge PARIPURNA */}
                      <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg bg-gradient-to-b from-amber-50 to-amber-100/80 border border-amber-300 shadow-2xs">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-[9px]">
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-[9px] font-black text-amber-900 tracking-wider">
                          PARIPURNA
                        </span>
                        <span className="text-[7px] font-bold text-amber-700">KARS BINTANG 5</span>
                      </div>

                      {/* Badge HALAL INDONESIA */}
                      <div className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                        <span className="text-[8px] font-black text-purple-900 tracking-tighter mt-0.5">
                          HALAL
                        </span>
                        <span className="text-[6.5px] font-bold text-purple-600">INDONESIA</span>
                      </div>

                      {/* Badge MUHAMMADIYAH BERSINAR */}
                      <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 shadow-2xs">
                        <span className="text-emerald-700 text-xs">☀️</span>
                        <span className="text-[8px] font-black text-emerald-950 tracking-tighter">
                          MUHAMMADIYAH
                        </span>
                        <span className="text-[6.5px] font-bold text-emerald-700">BERSINAR</span>
                      </div>

                      {/* Badge ISTIMEWA */}
                      <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#005d42] to-[#00A859] text-white shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-[8px] font-black tracking-wider mt-0.5">
                          ISTIMEWA
                        </span>
                        <span className="text-[6.5px] text-emerald-100 font-semibold">UNGGUL</span>
                      </div>
                    </div>
                  </div>

                  {/* Judul Utama & Sub-judul */}
                  <div className="mt-5 text-center">
                    <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-emerald-50 text-[#005d42] border border-emerald-200 mb-1">
                      Pemberitahuan Resmi
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight uppercase">
                      {customTitle}
                    </h1>
                    <p className="text-xs font-bold text-[#00A859] uppercase tracking-wider mt-0.5">
                      {customSubtitle}
                    </p>
                  </div>
                </header>

                {/* ========================================================
                    2. CARD UTAMA DOKTER (TANPA FOTO)
                ======================================================== */}
                <section className="px-8 my-5">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A2540] via-[#005d42] to-[#0A2540] text-white p-6 shadow-lg border-2 border-[#00A859]/60">
                    {/* Background Subtle Wave Texture */}
                    <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute left-1/4 -top-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-5">
                      {/* Doctor Emblem Icon Box */}
                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                        <Stethoscope className="w-9 h-9 text-emerald-300" />
                      </div>

                      {/* Doctor Name & Specialty */}
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
                          <span>Poliklinik {leave.poli.replace(/^Poli\s+/i, '')}</span>
                        </div>
                        <h2 className="text-2xl sm:text-[26px] font-black text-white tracking-tight leading-snug">
                          {leave.dpjp}
                        </h2>
                        <p className="text-sm font-semibold text-emerald-200/90 mt-1">
                          {displayDoctorSpecialty}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ========================================================
                    3. DETAIL PERUBAHAN JADWAL (TENGAH)
                ======================================================== */}
                <section className="px-8 flex-1 flex flex-col justify-center">
                  <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border-2 border-slate-200/90 p-6 shadow-md">
                    {/* Baris 1: Tanggal Praktik yang Diliburkan */}
                    <div className="text-center pb-4 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Informasi Tanggal Praktik:
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        PRAKTIK {displayLeaveDate}
                      </h3>
                    </div>

                    {/* Baris 2: Box Penanda Badge Utama (LIBUR) */}
                    <div className="py-5 flex flex-col items-center justify-center">
                      <div
                        className={`px-10 py-3.5 rounded-2xl bg-gradient-to-r ${badgeInfo.bgGradient} text-white shadow-lg border-2 ${badgeInfo.borderColor} flex items-center gap-3 transform hover:scale-102 transition-transform`}
                      >
                        <AlertTriangle className="w-7 h-7 text-amber-300 shrink-0 animate-pulse" />
                        <span className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
                          {badgeInfo.text}
                        </span>
                      </div>
                    </div>

                    {/* Baris 3: Box Keterangan Praktik Kembali */}
                    <div className="bg-emerald-50/90 rounded-xl border border-emerald-200/90 p-4.5 text-center shadow-2xs">
                      <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-1">
                        <CheckCircle2 className="w-4 h-4 text-[#00A859]" />
                        <span>Pelayanan Rawat Jalan Buka Kembali:</span>
                      </div>

                      <div className="mt-1">
                        <span className="text-lg sm:text-xl font-black text-[#0A2540] block">
                          Praktik Kembali: {displayReturnDate}
                        </span>
                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-white border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{displayPracticeHour}</span>
                        </div>
                      </div>
                    </div>

                    {/* Baris 4: Informasi Catatan Pelayanan Pasien */}
                    <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed font-medium">
                      {customNote}
                    </p>
                  </div>
                </section>

                {/* ========================================================
                    4. FOOTER (BAWAH) - SILUET GEDUNG RSUMB & KONTAK
                ======================================================== */}
                <footer className="mt-6">
                  {/* Ilustrasi Siluet Bangunan Gedung RSUMB */}
                  <div className="w-full h-16 bg-gradient-to-t from-slate-100 to-transparent relative overflow-hidden flex items-end">
                    <svg
                      className="w-full h-14 text-slate-300/80 fill-current opacity-80"
                      viewBox="0 0 800 60"
                      preserveAspectRatio="none"
                    >
                      <path d="M 0,60 L 0,42 L 35,42 L 35,32 L 75,32 L 75,20 L 110,20 L 110,32 L 140,32 L 140,42 L 190,42 L 190,14 L 230,14 L 230,8 L 270,8 L 270,14 L 310,14 L 310,42 L 360,42 L 360,25 L 390,25 L 390,5 L 430,5 L 430,25 L 470,25 L 470,42 L 530,42 L 530,16 L 570,16 L 570,28 L 610,28 L 610,42 L 670,42 L 670,22 L 710,22 L 710,35 L 750,35 L 750,42 L 800,42 L 800,60 Z" />
                      {/* Windows pattern on building */}
                      <g fill="#FFFFFF" opacity="0.65">
                        <rect x="235" y="14" width="12" height="8" rx="1" />
                        <rect x="255" y="14" width="12" height="8" rx="1" />
                        <rect x="395" y="10" width="14" height="9" rx="1" />
                        <rect x="415" y="10" width="14" height="9" rx="1" />
                        <rect x="395" y="24" width="14" height="9" rx="1" />
                        <rect x="415" y="24" width="14" height="9" rx="1" />
                        <rect x="535" y="22" width="12" height="8" rx="1" />
                        <rect x="555" y="22" width="12" height="8" rx="1" />
                      </g>
                    </svg>
                  </div>

                  {/* Baris Kontak Footer Biru Tua (#0A2540 / #1E3A8A) */}
                  <div className="bg-gradient-to-r from-[#0A2540] via-[#1E3A8A] to-[#0A2540] text-white px-8 py-3.5 border-t-2 border-amber-400">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Alamat */}
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold text-slate-200 text-[11.5px]">
                          Jl. Raya Babat Surabaya Km. 04 Babat - Lamongan
                        </span>
                      </div>

                      {/* Nomor Telepon / CS */}
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-bold text-white text-[11.5px]">
                          CS WA: 0811-3222-440 • Telp: (0322) 451125
                        </span>
                      </div>

                      {/* Media Sosial */}
                      <div className="flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-bold text-white text-[11.5px]">
                          @rsumbabat • www.rsumbabat.com
                        </span>
                      </div>
                    </div>

                    {/* Slogan Resmi Rumah Sakit */}
                    <div className="mt-2 pt-2 border-t border-blue-800/80 flex items-center justify-between text-[11px] text-blue-200">
                      <span className="font-medium">
                        RSU Muhammadiyah Babat - Pelayanan Islami, Cepat & Terpercaya
                      </span>
                      <span className="font-black text-amber-300 tracking-wide uppercase">
                        &quot;Melayani dengan Profesional, Santun, dan Berdedikasi&quot;
                      </span>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DoctorLeavePosterModal: React.FC<DoctorLeavePosterModalProps> = ({
  isOpen,
  onClose,
  leave,
  schedules,
  showToast
}) => {
  if (!isOpen || !leave) return null;

  return (
    <DoctorLeavePosterModalContent
      onClose={onClose}
      leave={leave}
      schedules={schedules}
      showToast={showToast}
    />
  );
};
