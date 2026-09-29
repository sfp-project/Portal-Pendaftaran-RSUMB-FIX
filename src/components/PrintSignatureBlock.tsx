import React from 'react';
import { getIndonesianCurrentDate } from '../utils/exportHelpers';

interface PrintSignatureBlockProps {
  city?: string;
  signTitle?: string;
  picName?: string;
}

export const PrintSignatureBlock: React.FC<PrintSignatureBlockProps> = ({
  city = 'Babat',
  signTitle = 'Petugas Verifikasi SIMRS / Penanggung Jawab',
  picName = ''
}) => {
  const { dateStr } = getIndonesianCurrentDate();

  return (
    <div className="hidden print:flex justify-end w-full mt-6 pt-2 break-inside-avoid">
      <div className="w-72 text-center text-slate-800 font-sans">
        <p className="text-xs text-slate-700">
          {city}, {dateStr}
        </p>
        <p className="text-xs font-semibold text-slate-900 mt-0.5">
          {signTitle}
        </p>

        {/* Space for manual signature / stamp */}
        <div className="h-16 flex items-center justify-center">
          <span className="text-[10px] text-slate-300 italic">[Tanda Tangan & Stempel]</span>
        </div>

        <div className="border-b border-slate-700 mx-6" />
        <p className="text-xs font-bold text-slate-900 mt-1">
          {picName ? `( ${picName} )` : '( .................................................... )'}
        </p>
        <p className="text-[10px] text-slate-500">
          NIP / Tanda Tangan & Cap
        </p>
      </div>
    </div>
  );
};
