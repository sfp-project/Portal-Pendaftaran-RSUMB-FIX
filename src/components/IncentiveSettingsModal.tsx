import React, { useState } from 'react';
import {
  X,
  Settings,
  Save,
  RotateCcw,
  Coins,
  Clock,
  Calendar,
  AlertCircle,
  Check
} from 'lucide-react';
import { IncentiveRates, MonthlyScheduleData } from '../types/incentiveTypes';
import { DEFAULT_INCENTIVE_RATES, INDONESIAN_DAY_NAMES, getDayOfWeek } from '../data/incentiveData';

interface IncentiveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: IncentiveRates;
  onSaveRates: (newRates: IncentiveRates) => void;
  monthData: MonthlyScheduleData;
  onUpdateHolidays: (holidays: number[]) => void;
}

export const IncentiveSettingsModal: React.FC<IncentiveSettingsModalProps> = ({
  isOpen,
  onClose,
  rates,
  onSaveRates,
  monthData,
  onUpdateHolidays
}) => {
  const [formRates, setFormRates] = useState<IncentiveRates>({ ...rates });
  const [holidays, setHolidays] = useState<number[]>([...monthData.nationalHolidays]);

  if (!isOpen) return null;

  const toggleHoliday = (day: number) => {
    if (holidays.includes(day)) {
      setHolidays(holidays.filter((d) => d !== day));
    } else {
      setHolidays([...holidays, day].sort((a, b) => a - b));
    }
  };

  const handleResetDefaults = () => {
    setFormRates({ ...DEFAULT_INCENTIVE_RATES });
    setHolidays([5, 17]);
  };

  const handleSave = () => {
    onSaveRates(formRates);
    onUpdateHolidays(holidays);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Pengaturan Tarif Nominal & Jam Dinas
              </h3>
              <p className="text-xs text-slate-500">
                Sesuaikan besaran insentif uang malam, uang makan, durasi shift & tanggal merah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section 1: Tarif Insentif */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-800">Tarif Insentif Nominal</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Uang Malam (per shift &apos;M&apos;)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">Rp</span>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={formRates.uangMalam}
                    onChange={(e) =>
                      setFormRates({ ...formRates, uangMalam: Number(e.target.value) || 0 })
                    }
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Default: <strong>Rp 5.000</strong> per shift Malam (21.00 - 07.00).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Uang Makan (Khusus Shift M: Selasa, Rabu, Jumat, Sabtu & Minggu)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">Rp</span>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={formRates.uangMakan}
                    onChange={(e) =>
                      setFormRates({ ...formRates, uangMakan: Number(e.target.value) || 0 })
                    }
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Default: <strong>Rp 6.000</strong>. Khusus shift Malam ('M') pada hari Selasa, Rabu, Jumat, Sabtu & Minggu. Hari Senin & Kamis = Rp 0.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Durasi Shift */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-800">Durasi Jam Kerja per Shift</h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  P / I/P (Pagi)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formRates.hoursP}
                    onChange={(e) =>
                      setFormRates({ ...formRates, hoursP: Number(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">Jam</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">07.00 - 14.00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  S / I/S (Sore)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formRates.hoursS}
                    onChange={(e) =>
                      setFormRates({ ...formRates, hoursS: Number(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">Jam</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">14.00 - 21.00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  M (Malam)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formRates.hoursM}
                    onChange={(e) =>
                      setFormRates({ ...formRates, hoursM: Number(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">Jam</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">21.00 - 07.00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  P2 (Pagi 2)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formRates.hoursP2}
                    onChange={(e) =>
                      setFormRates({ ...formRates, hoursP2: Number(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">Jam</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Shift Khusus</span>
              </div>
            </div>
          </div>

          {/* Section 3: Tanggal Merah & Ekstra Libur */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-800">
                  Tanggal Merah / Libur Nasional ({monthData.monthName} {monthData.year})
                </h4>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {holidays.length} Hari Terpilih
              </span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 mb-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Ketentuan Ekstra Libur:</strong> Staf yang bekerja pada Tanggal Merah Nasional yang jatuh di hari <strong>Senin s/d Sabtu</strong> mendapat hak <strong>+1 Ekstra Libur</strong>. Hari Ahad (Minggu) secara otomatis dikecualikan.
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: monthData.daysInMonth }, (_, i) => i + 1).map((day) => {
                const dow = getDayOfWeek(monthData.year, monthData.month, day);
                const isSunday = dow === 0;
                const isSelected = holidays.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleHoliday(day)}
                    className={`p-2 rounded-xl text-center text-xs transition-all flex flex-col items-center justify-center relative border ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-600 font-bold shadow-xs'
                        : isSunday
                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                    }`}
                  >
                    <span className="font-semibold text-sm leading-none">{day}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">
                      {INDONESIAN_DAY_NAMES[dow].slice(0, 3)}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center text-[9px] font-black">
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Klik tanggal untuk menandai atau membatalkan tanggal merah nasional. Tanggal merah aktif ditandai warna merah dengan bintang.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#005d42] hover:bg-[#004a35] rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
