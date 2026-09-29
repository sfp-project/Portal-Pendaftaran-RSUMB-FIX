import React, { useMemo } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Timer
} from 'lucide-react';
import { DoctorLeaveAnnouncement } from '../types';
import {
  consolidateAndSortDoctorLeaves,
  getDoctorUpcomingLeaveInfo,
  getAllScheduleItemTimestamps,
  getReferenceStartOfDayTimestamp
} from '../utils/dateHelpers';

interface AnnouncementBannerProps {
  leaves: DoctorLeaveAnnouncement[];
  highlightedDoctor?: string | null;
  referenceDate?: string | Date;
  onAddNewLeave: () => void;
  onEditLeave: (leave: DoctorLeaveAnnouncement) => void;
  onDeleteLeave?: (id: string) => void;
  onSelectDoctor: (dpjp: string) => void;
  onOpenLeavePoster?: (leave: DoctorLeaveAnnouncement) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  leaves,
  highlightedDoctor,
  referenceDate,
  onAddNewLeave,
  onEditLeave,
  onDeleteLeave,
  onSelectDoctor,
  onOpenLeavePoster
}) => {
  // Normalize string helper
  const normalize = (str: string) =>
    str ? str.toLowerCase().replace(/['’`\.]/g, '').trim() : '';

  // Auto-sort doctor leave cards by nearest upcoming leave date (closest to reference date first)
  const displayLeaves = useMemo(() => {
    return consolidateAndSortDoctorLeaves(leaves, referenceDate);
  }, [leaves, referenceDate]);

  const refTimestamp = useMemo(() => {
    return getReferenceStartOfDayTimestamp(referenceDate);
  }, [referenceDate]);

  return (
    <div
      id="informasi-libur-banner"
      className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 transition-all scroll-mt-24"
    >
      {/* Header Utama Minimalis & Responsif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 sm:mb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                Informasi Libur & Perubahan Jadwal Praktik Dokter
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Urutan Terdekat Otomatis</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-normal">
              Perubahan jadwal & cuti praktik dokter spesialis otomatis diurutkan dari tanggal mendatang paling dekat agar penyesuaian darurat selalu berada di posisi paling depan
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            id="btn-tambah-catatan-libur"
            onClick={onAddNewLeave}
            className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100/80 active:bg-teal-200/70 px-3 py-1.5 rounded-lg border border-teal-200/70 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Catatan</span>
          </button>
          <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 shrink-0">
            Penting
          </span>
        </div>
      </div>

      {/* Grid Utama: Grid Konsisten dengan items-stretch */}
      <div
        id="banner-libur-list"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch"
      >
        {displayLeaves.map((doc, cardIdx) => {
          const docNorm = normalize(doc.dpjp);
          const hlNorm = highlightedDoctor ? normalize(highlightedDoctor) : '';
          const isHighlighted = Boolean(
            hlNorm && (docNorm === hlNorm || docNorm.includes(hlNorm) || hlNorm.includes(docNorm))
          );

          // Get upcoming timing and proximity info for this doctor
          const upcomingInfo = getDoctorUpcomingLeaveInfo(doc, refTimestamp);

          const allMaju = doc.jadwal.length > 0 && doc.jadwal.every((j) => j.tipe === 'MAJU');
          const allCuti = doc.jadwal.length > 0 && doc.jadwal.every((j) => j.tipe === 'CUTI');
          const hasCuti = doc.jadwal.some((j) => j.tipe === 'CUTI');
          const hasMaju = doc.jadwal.some((j) => j.tipe === 'MAJU');

          // Status badge text & style determination
          let badgeText = 'LIBUR PRAKTIK';
          let badgeStyle = 'bg-red-50 text-red-700 border-red-200';
          let badgeIcon = <AlertTriangle className="w-2.5 h-2.5 text-red-600 shrink-0" />;

          if (allMaju) {
            badgeText = 'JADWAL MAJU';
            badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
            badgeIcon = <Clock className="w-2.5 h-2.5 text-blue-600 shrink-0" />;
          } else if (allCuti) {
            badgeText = 'CUTI PRAKTIK';
            badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
            badgeIcon = <Calendar className="w-2.5 h-2.5 text-purple-600 shrink-0" />;
          } else if (hasCuti && !hasMaju) {
            badgeText = 'CUTI PRAKTIK';
            badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
            badgeIcon = <Calendar className="w-2.5 h-2.5 text-purple-600 shrink-0" />;
          } else {
            badgeText = 'LIBUR PRAKTIK';
            badgeStyle = 'bg-red-50 text-red-700 border-red-200';
            badgeIcon = <AlertTriangle className="w-2.5 h-2.5 text-red-600 shrink-0" />;
          }

          return (
            <div
              key={doc.id || doc.dpjp}
              id={`papan-dokter-${doc.id || doc.dpjp.replace(/\s+/g, '-').toLowerCase()}`}
              data-dpjp-card={docNorm}
              data-card-index={cardIdx}
              onClick={() => onSelectDoctor(doc.dpjp)}
              className={`group relative flex flex-col justify-between h-full bg-white p-3.5 sm:p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left scroll-mt-28 ${
                isHighlighted
                  ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-white shadow-xl scale-[1.02] bg-amber-50/40 border-amber-400 z-10 animate-pulse'
                  : upcomingInfo.badgeTone === 'urgent'
                  ? 'border-amber-300/80 shadow-xs hover:shadow-md hover:border-amber-400 bg-amber-50/15'
                  : 'border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300'
              }`}
              title={`Klik untuk melihat detail jadwal ${doc.dpjp}`}
            >
              {/* Highlight Badge Indicator if activated */}
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-20 whitespace-nowrap animate-bounce">
                  <Sparkles className="w-3 h-3" />
                  <span>Pengumuman Terpilih</span>
                </div>
              )}

              {/* Nearest Upcoming Ribbon Indicator on Top-Right Corner */}
              {cardIdx === 0 && upcomingInfo.isUpcoming && !isHighlighted && (
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10 uppercase tracking-wider">
                  <Timer className="w-2.5 h-2.5 text-emerald-200" />
                  <span>Paling Mendesak</span>
                </div>
              )}

              {/* Bagian Atas & Tengah (Header + Status + Jadwal) */}
              <div className="flex-1 flex flex-col">
                {/* Header Kartu: Nama Dokter, Spesialis, & Ikon Pensil Edit di Kanan Atas */}
                <div className={`relative mb-2.5 p-2 sm:p-2.5 rounded-lg border shadow-2xs transition-all ${
                  isHighlighted
                    ? 'bg-amber-100/70 border-amber-300'
                    : 'bg-slate-50/90 backdrop-blur-md border-slate-200/70 group-hover:bg-slate-100/90 group-hover:border-teal-300/60'
                }`}>
                  <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

                  <div className="flex justify-between items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-xs sm:text-[13px] leading-snug transition-colors break-words ${
                        isHighlighted ? 'text-amber-950 font-extrabold' : 'text-slate-900 group-hover:text-teal-700'
                      }`}>
                        {doc.dpjp}
                      </h3>
                      <span className="inline-block mt-1 bg-slate-100/90 backdrop-blur-xs text-slate-700 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-medium border border-slate-200/50">
                        {doc.poli}
                      </span>
                    </div>

                    {/* Action buttons di kanan atas */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        id={`btn-edit-doctor-${doc.id || doc.dpjp.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditLeave(doc);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-100/80 active:bg-amber-200/70 rounded-md transition-colors shadow-2xs cursor-pointer border border-transparent hover:border-amber-300/50"
                        title={`Edit catatan ${doc.dpjp}`}
                        aria-label={`Edit catatan ${doc.dpjp}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteLeave && (
                        <button
                          type="button"
                          id={`btn-delete-doctor-${doc.id || doc.dpjp.replace(/\s+/g, '-').toLowerCase()}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLeave(doc.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-md transition-colors shadow-2xs cursor-pointer border border-transparent hover:border-rose-200"
                          title={`Hapus pengumuman ${doc.dpjp}`}
                          aria-label={`Hapus pengumuman ${doc.dpjp}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge & Nearest Timing Tag */}
                <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] sm:text-[10.5px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 leading-none ${badgeStyle}`}>
                    {badgeIcon}
                    <span>{badgeText}</span>
                  </span>

                  {/* Nearest Upcoming Indicator Pill */}
                  {upcomingInfo.relativeBadgeText && (
                    <span
                      className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border inline-flex items-center gap-1 leading-none transition-colors ${
                        upcomingInfo.badgeTone === 'urgent'
                          ? 'bg-amber-500/10 text-amber-800 border-amber-300/90 font-extrabold'
                          : upcomingInfo.badgeTone === 'upcoming'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title={upcomingInfo.isUpcoming ? `Jadwal perubahan terdekat: ${upcomingInfo.relativeBadgeText}` : 'Jadwal riwayat masa lalu'}
                    >
                      <Clock className="w-2.5 h-2.5 shrink-0 text-current" />
                      <span>{upcomingInfo.relativeBadgeText}</span>
                    </span>
                  )}
                </div>

                {/* Bagian Tengah (Konten Jadwal dengan batas tinggi, scrollbar tebal jelas & visual cue) */}
                <div className="relative flex-1 flex flex-col">
                  <div className="max-h-[140px] overflow-y-scroll space-y-2 pr-1.5 custom-scrollbar text-xs flex-1">
                    {doc.jadwal.map((item, idx) => {
                      const itemTimestamps = getAllScheduleItemTimestamps(item);
                      const isItemUpcoming = itemTimestamps.some((t) => t >= refTimestamp);

                      return (
                        <div
                          key={idx}
                          className={idx > 0 ? 'pt-1.5 border-t border-slate-100' : ''}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`px-2 py-1 rounded font-medium text-[11px] sm:text-xs leading-snug w-full block border break-words ${
                                item.tipe === 'CUTI'
                                  ? 'bg-purple-50 text-purple-700 border-purple-100/80'
                                  : isItemUpcoming && idx === 0
                                  ? 'bg-red-50 text-red-700 border-red-200/90 font-semibold'
                                  : 'bg-red-50 text-red-700 border-red-100/80'
                              }`}>
                                {item.tipe === 'CUTI' ? 'Tgl Cuti' : 'Tgl Libur'}: {item.tglLibur}
                              </span>
                              {item.tipe === 'MAJU' && (
                                <span className="shrink-0 text-[9px] sm:text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  MAJU
                                </span>
                              )}
                              {item.tipe === 'CUTI' && (
                                <span className="shrink-0 text-[9px] sm:text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                  CUTI
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded font-medium text-[11px] sm:text-xs leading-snug w-full block border border-emerald-100/80 break-words">
                                Masuk/Ganti: {item.tglMasuk}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Efek Bayangan / Fade Gradient di Bagian Bawah Kontainer Scroll */}
                  {doc.jadwal.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-2.5 h-4 bg-gradient-to-t from-white/90 via-white/40 to-transparent pointer-events-none" />
                  )}
                </div>

                {/* Indikator Visual Tambahan Jika Lebih Dari 1 Sesi Jadwal */}
                {doc.jadwal.length > 1 && (
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-medium px-0.5">
                    <span className="text-slate-500 text-[10px]">{doc.jadwal.length} sesi perubahan</span>
                    <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 inline-flex items-center gap-0.5 text-[9.5px] font-semibold">
                      <span>Scroll ke bawah</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                  </div>
                )}
              </div>

              {/* Bagian Bawah (Footer Kartu: Sejajar sempurna di dasar semua kartu) */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                {/* Tombol Unduh Poster JPG Sesuai Ketentuan */}
                <button
                  type="button"
                  id={`btn-unduh-poster-${doc.id || doc.dpjp.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLeavePoster?.(doc);
                  }}
                  className="w-full py-1.5 px-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer border border-emerald-500/20"
                  title={`Generate & Unduh Poster Libur Praktik (Format JPG) untuk ${doc.dpjp}`}
                >
                  <span className="text-sm">🖼️</span>
                  <span>Unduh Poster JPG</span>
                </button>

                <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-teal-600 transition-colors">
                  <span className="font-medium text-[11px] sm:text-xs">Lihat jadwal dokter</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

