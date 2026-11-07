import React from 'react';
import { Search, ChevronDown, Filter, X, RefreshCw, Calendar } from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedPoli: string;
  setSelectedPoli: (poli: string) => void;
  selectedHari: string;
  setSelectedHari: (hari: string) => void;
  poliOptions: string[];
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onReset: () => void;
  totalResults: number;
  changeCount?: number;
  onOpenPosterModal?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedPoli,
  setSelectedPoli,
  selectedHari,
  setSelectedHari,
  poliOptions,
  statusFilter,
  setStatusFilter,
  onReset,
  totalResults,
  changeCount = 0,
  onOpenPosterModal
}) => {
  const hariOptions = [
    'Semua Hari',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Ahad'
  ];

  // Helper untuk menentukan hari ini (0 = Ahad/Minggu, 1 = Senin, ..., 6 = Sabtu)
  const HARI_MAP = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayHari = HARI_MAP[new Date().getDay()];
  const isTodayActive =
    Boolean(selectedHari) &&
    (selectedHari.toLowerCase() === todayHari.toLowerCase() ||
      (todayHari === 'Ahad' && (selectedHari.toLowerCase() === 'minggu' || selectedHari.toLowerCase() === 'ahad')));

  const handleToggleHariIni = () => {
    if (isTodayActive) {
      setSelectedHari('');
    } else {
      setSelectedHari(todayHari);
    }
  };

  // Hanya menyisakan 2 filter cepat: Tersedia dan Ada Libur/Perubahan
  const statusOptions = [
    { id: 'tersedia', label: 'Tersedia' },
    { id: 'libur', label: 'Ada Libur/Perubahan' }
  ];

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedPoli !== '' ||
    selectedHari !== '' ||
    statusFilter !== 'all';

  return (
    <div className="bg-white/80 backdrop-blur-md p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#5c5f61] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nama Dokter atau Poliklinik..."
            title="Cari Nama Dokter atau Poliklinik..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0b1c30] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Poliklinik Select */}
        <div className="relative">
          <select
            value={selectedPoli}
            onChange={(e) => setSelectedPoli(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0b1c30] focus:bg-white focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42] transition-all appearance-none cursor-pointer pr-10 font-normal"
          >
            <option value="">Semua Poliklinik</option>
            {poliOptions
              .filter(
                (poli) =>
                  Boolean(poli) &&
                  typeof poli === 'string' &&
                  poli.trim() !== '' &&
                  poli.trim() !== '-' &&
                  poli.trim().toLowerCase() !== 'null' &&
                  poli.trim().toLowerCase() !== 'undefined'
              )
              .map((poli) => (
                <option key={poli} value={poli}>
                  {poli}
                </option>
              ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#5c5f61] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Hari Select */}
        <div className="relative">
          <select
            value={selectedHari}
            onChange={(e) => setSelectedHari(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0b1c30] focus:bg-white focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42] transition-all appearance-none cursor-pointer pr-10 font-normal"
          >
            {hariOptions.map((hari) => {
              const isTodayOption =
                hari !== 'Semua Hari' &&
                (hari === todayHari || (todayHari === 'Ahad' && hari === 'Ahad'));
              return (
                <option key={hari} value={hari === 'Semua Hari' ? '' : hari}>
                  {hari === 'Ahad' ? 'Ahad / Minggu' : hari}
                  {isTodayOption ? ' (Hari Ini)' : ''}
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-4 h-4 text-[#5c5f61] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Quick Filter Chips & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Cepat:
          </span>

          {/* Tombol Filter Hari Ini */}
          <button
            type="button"
            id="btn-filter-hari-ini"
            onClick={handleToggleHariIni}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer select-none shadow-xs active:scale-95 ${
              isTodayActive
                ? 'bg-gradient-to-r from-[#005d42] to-[#007a57] text-white ring-2 ring-emerald-500/40 shadow-emerald-900/10'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/90'
            }`}
            title={`Tampilkan jadwal dokter untuk hari ini (${todayHari === 'Ahad' ? 'Ahad / Minggu' : todayHari})`}
          >
            <Calendar className={`w-3.5 h-3.5 ${isTodayActive ? 'text-amber-300' : 'text-emerald-700'}`} />
            <span>Filter Hari Ini ({todayHari === 'Ahad' ? 'Ahad' : todayHari})</span>
            {isTodayActive && (
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-amber-300 animate-pulse ml-0.5" />
            )}
          </button>

          {statusOptions.map((opt) => {
            const isSelected = statusFilter === opt.id;
            return (
              <button
                key={opt.id}
                id={`filter-btn-${opt.id}`}
                onClick={() => setStatusFilter(isSelected ? 'all' : opt.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#005d42] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{opt.label}</span>
                {opt.id === 'libur' && changeCount > 0 && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none rounded-full shadow-xs transition-transform ${
                      isSelected
                        ? 'bg-white text-red-600 font-extrabold'
                        : 'bg-red-500 text-white'
                    }`}
                    title={`${changeCount} dokter/poliklinik mengalami libur/perubahan jadwal`}
                  >
                    {changeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
