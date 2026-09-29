import React from 'react';
import { getIndonesianCurrentDate } from '../utils/exportHelpers';

interface PrintHeaderKopProps {
  title: string;
  subtitle?: string;
  totalDataCount?: number;
  totalDataLabel?: string;
  extraInfo?: string;
}

export const PrintHeaderKop: React.FC<PrintHeaderKopProps> = ({
  title,
  subtitle,
  totalDataCount,
  totalDataLabel,
  extraInfo
}) => {
  const { dateStr, timeStr } = getIndonesianCurrentDate();

  return (
    <div className="hidden print:block w-full text-slate-900 bg-white mb-4 pb-2">
      {/* Kop Resmi Rumah Sakit */}
      <div className="flex items-center gap-4 border-b-2 border-[#047857] pb-3 text-left">
        <img
          src="/logo-rsumb.png"
          alt="Logo RSUMB"
          className="w-14 h-14 object-contain shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest leading-none">
            RSU MUHAMMADIYAH BABAT
          </p>
          <h1 className="text-base font-black text-[#047857] uppercase tracking-tight mt-1 leading-tight">
            {title}
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
            Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur &bull; Telp. (0322) 451111 / 451234
          </p>
        </div>
      </div>

      {/* Garis Ganda Tipis */}
      <div className="h-[1px] bg-slate-900 mt-[1.5px] mb-2.5" />

      {/* Baris Meta Info (Tanggal, Filter, Total Data) */}
      <div className="flex items-center justify-between text-[11px] text-slate-700 py-1 font-medium">
        <div>
          {subtitle && <span className="font-semibold text-slate-800">{subtitle}</span>}
          {extraInfo && <span className="ml-2 text-slate-500">({extraInfo})</span>}
        </div>
        <div className="flex items-center gap-4">
          {(totalDataCount !== undefined || totalDataLabel) && (
            <span className="font-bold text-[#047857]">
              {totalDataLabel || `Total: ${totalDataCount} Data`}
            </span>
          )}
          <span className="text-slate-500">
            Dicetak: {dateStr}, {timeStr}
          </span>
        </div>
      </div>
    </div>
  );
};
