import React from 'react';
import { DoctorAvatar } from './DoctorAvatar';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface PosterDoctorData {
  id: string;
  dpjp: string;
  poli: string;
  spesialisLabel: string; // e.g. "SPESIALIS SARAF", "SPESIALIS PENYAKIT DALAM"
  jamPraktik: string; // e.g. "07.30 - 12.00 WIB"
  status: 'Hadir' | 'Tidak Praktik';
  keterangan?: string;
  ruangan?: string;
}

interface DoctorPosterItemProps {
  doctor: PosterDoctorData;
  isInteractive?: boolean;
  onToggleStatus?: (id: string) => void;
}

export const DoctorPosterItem: React.FC<DoctorPosterItemProps> = ({
  doctor,
  isInteractive = false,
  onToggleStatus
}) => {
  const isTidakPraktik = doctor.status === 'Tidak Praktik';

  return (
    <div
      className={`relative flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
        isTidakPraktik
          ? 'bg-rose-50/70 border-rose-200/90 shadow-2xs'
          : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-xs'
      } ${isInteractive ? 'cursor-pointer select-none group' : ''}`}
      onClick={() => isInteractive && onToggleStatus && onToggleStatus(doctor.id)}
      title={isInteractive ? 'Klik untuk mengubah status (Hadir / Tidak Praktik)' : undefined}
    >
      {/* 1. Circular Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <DoctorAvatar name={doctor.dpjp} poli={doctor.poli} size={58} />
        {/* Small status indicator dot */}
        <div
          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-2xs ${
            isTidakPraktik ? 'bg-[#FF0000]' : 'bg-[#00A859]'
          }`}
        >
          {isTidakPraktik ? '!' : '✓'}
        </div>
      </div>

      {/* 2. Doctor Info */}
      <div className="flex-1 min-w-0">
        {/* Kategori Spesialis dalam kapsul hijau (#00A859) */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-white tracking-wide uppercase bg-[#00A859] shadow-2xs mb-1">
          <span>{doctor.spesialisLabel}</span>
        </div>

        {/* Nama Dokter dengan Gelar Lengkap */}
        <h4 className="font-extrabold text-[12px] sm:text-[13px] text-slate-900 leading-snug line-clamp-2">
          {doctor.dpjp}
        </h4>

        {/* Jam Praktik / Badge Status */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {isTidakPraktik ? (
            /* Badge Status Merah Ceria (#FF0000) bertuliskan TIDAK PRAKTIK */
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: '#FF0000' }}
            >
              <AlertCircle className="w-3 h-3 text-white" />
              <span>TIDAK PRAKTIK</span>
            </span>
          ) : (
            /* Badge Jam Bertugas Biru Tua (#1E3A8A) */
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold text-white shadow-xs"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              <Clock className="w-3 h-3 text-sky-200" />
              <span>{doctor.jamPraktik}</span>
            </span>
          )}

          {/* Keterangan tambahan (misal jika ada catatan khusus) */}
          {doctor.keterangan && (
            <span className="text-[10px] text-slate-500 font-medium line-clamp-1 italic">
              ({doctor.keterangan})
            </span>
          )}
        </div>
      </div>

      {/* Interactive indicator for Humas quick-toggle */}
      {isInteractive && (
        <div className="hidden group-hover:flex absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white shadow-xs">
          Klik utk ubah
        </div>
      )}
    </div>
  );
};
