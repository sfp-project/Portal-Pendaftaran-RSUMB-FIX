import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Car,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  X,
  History,
  UserCheck
} from 'lucide-react';
import { KuponMohat } from '../../types/mohatTypes';
import {
  getMohatDriverDirectory,
  filterMohatDrivers,
  MohatDriverProfile
} from '../../data/mohatData';

interface MohatDriverAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelectDriver: (driverFullName: string, phone?: string) => void;
  kuponList: KuponMohat[];
  fallbackSuggestions?: string[];
  placeholder?: string;
  required?: boolean;
}

export const MohatDriverAutocomplete: React.FC<MohatDriverAutocompleteProps> = ({
  value,
  onChange,
  onSelectDriver,
  kuponList,
  fallbackSuggestions,
  placeholder = 'Ketik nama sopir atau asal desa (cth: rof, maduran)...',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Buat direktori dinamis dari riwayat kupon di localStorage & saran sistem
  const driverDirectory = useMemo(() => {
    return getMohatDriverDirectory(kuponList, fallbackSuggestions);
  }, [kuponList, fallbackSuggestions]);

  // Filter cerdas multi-keyword
  const filteredDrivers = useMemo(() => {
    return filterMohatDrivers(driverDirectory, value);
  }, [driverDirectory, value]);

  // Tutup dropdown jika klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight saat filter berubah
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.autocomplete-item');
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({
          block: 'nearest'
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (driver: MohatDriverProfile) => {
    onChange(driver.fullName);
    onSelectDriver(driver.fullName, driver.phone);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredDrivers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredDrivers.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredDrivers.length) {
        e.preventDefault();
        handleSelect(filteredDrivers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearInput = () => {
    onChange('');
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Car className="w-3.5 h-3.5 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-16 py-2 text-xs border border-amber-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 transition placeholder:text-slate-400 font-medium text-slate-800"
          autoComplete="off"
        />

        {/* Action icons right */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={clearInput}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
              title="Bersihkan input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-amber-700 hover:bg-amber-100/60 rounded-md transition cursor-pointer"
            title="Buka daftar saran sopir Mohat"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Smart Suggestions */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-98 duration-150"
        >
          {/* Header Strip */}
          <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Smart Autocomplete Sopir Mohat</span>
            </div>
            <span className="text-[10px] text-amber-800/80 font-medium bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
              {filteredDrivers.length} Pengantar
            </span>
          </div>

          {/* Quick search keywords hint */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 flex items-center gap-1.5">
            <Search className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              Cari nama sopir (misal: <em>rof</em>) atau asal desa (misal: <em>maduran</em>)
            </span>
          </div>

          {/* Items List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {filteredDrivers.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                <Car className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                <p className="font-semibold text-slate-700">Tidak ada pengantar yang cocok</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Anda tetap dapat mengetik nama baru secara bebas.
                </p>
              </div>
            ) : (
              filteredDrivers.map((driver, index) => {
                const isSelected = highlightedIndex === index;
                return (
                  <div
                    key={`${driver.fullName}-${index}`}
                    onClick={() => handleSelect(driver)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`autocomplete-item px-3 py-2.5 cursor-pointer transition flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-amber-50/90 text-amber-950'
                        : 'hover:bg-amber-50/50 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Driver Name & Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{driver.driverName}</span>
                        </span>

                        {driver.hasHistory ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9.5px] font-bold">
                            <History className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Riwayat {driver.usageCount}x</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-medium">
                            Saran Sistem
                          </span>
                        )}
                      </div>

                      {/* Origin Village */}
                      {driver.village && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{driver.village}</span>
                        </div>
                      )}

                      {/* Phone Auto-fill tag */}
                      {driver.phone ? (
                        <div className="inline-flex items-center gap-1 text-[10.5px] font-mono text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{driver.phone}</span>
                          <span className="text-[9px] text-emerald-600 font-sans font-semibold ml-1">
                            (Auto-Fill)
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">
                          Belum ada riwayat nomor HP
                        </div>
                      )}
                    </div>

                    {/* Quick Select Action Icon */}
                    <div className="shrink-0 pt-0.5">
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100/70 hover:bg-amber-200 px-2 py-1 rounded-md transition border border-amber-300/60">
                        <span>Pilih</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation Tip */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Tekan Enter untuk memilih • Esc untuk menutup</span>
            <span className="font-semibold text-amber-700">Auto-fill No. HP Aktif</span>
          </div>
        </div>
      )}
    </div>
  );
};
