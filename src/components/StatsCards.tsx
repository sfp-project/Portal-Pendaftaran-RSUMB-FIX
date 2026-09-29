import React from 'react';
import { Building2, Stethoscope, ClipboardCheck, TrendingUp } from 'lucide-react';
import { HospitalStats } from '../types';

interface StatsCardsProps {
  stats: HospitalStats;
  onFilterPoli?: () => void;
  onFilterQuotaFull?: () => void;
  activeFilterBadge?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  onFilterQuotaFull,
  activeFilterBadge
}) => {
  const cards = [
    {
      id: 'poli',
      label: 'TOTAL POLIKLINIK',
      value: stats.totalPoliklinik.toString(),
      icon: Building2,
      subtext: 'Pelayanan Aktif',
      iconBg: 'bg-emerald-50 text-[#005d42]'
    },
    {
      id: 'dpjp',
      label: 'DOKTER DPJP',
      value: stats.totalDokterDpjp.toString(),
      icon: Stethoscope,
      subtext: 'Spesialis & Subspesialis',
      iconBg: 'bg-emerald-50 text-[#005d42]'
    },
    {
      id: 'kuota',
      label: 'KUOTA BPJS',
      value: stats.totalKuotaBpjs >= 1000 ? `${(stats.totalKuotaBpjs / 1000).toFixed(1)}k` : stats.totalKuotaBpjs.toString(),
      icon: ClipboardCheck,
      subtext: 'Slot Pasien / Hari',
      iconBg: 'bg-emerald-50 text-[#005d42]'
    },
    {
      id: 'pasien',
      label: 'RERATA PASIEN',
      value: stats.rerataPasien.toLocaleString('id-ID'),
      icon: TrendingUp,
      subtext: 'Kunjungan Harian',
      iconBg: 'bg-emerald-50 text-[#005d42]'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={`stat-card-${card.id}`}
            className="bg-white/90 backdrop-blur-md rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex items-center justify-between group cursor-pointer"
            onClick={() => {
              if (card.id === 'kuota' && onFilterQuotaFull) {
                onFilterQuotaFull();
              }
            }}
          >
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-[11px] font-semibold text-[#5c5f61] uppercase tracking-wider truncate">
                {card.label}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                <span className="text-xl font-bold text-[#0b1c30] tracking-tight leading-none">
                  {card.value}
                </span>
                <span className="text-[11px] text-slate-400 font-medium leading-none">
                  {card.subtext}
                </span>
              </div>
            </div>

            <div
              className="w-8 h-8 rounded-lg bg-emerald-50 text-[#005d42] flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-[#005d42] group-hover:text-white shadow-2xs"
            >
              <Icon className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
