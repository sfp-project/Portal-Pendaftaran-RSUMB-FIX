import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  Users,
  Hash,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { DoctorSchedule } from '../types';

interface BulkEditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchedules: DoctorSchedule[];
  onSaveBulk: (ids: string[], updates: Partial<DoctorSchedule>) => void;
}

export const BulkEditScheduleModal: React.FC<BulkEditScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedSchedules,
  onSaveBulk
}) => {
  // Form state for each modifiable attribute
  // Status
  const [changeStatus, setChangeStatus] = useState(false);
  const [statusValue, setStatusValue] = useState<'Tersedia' | 'Penuh' | 'Libur' | 'Cuti' | 'Ubah Jam' | 'auto'>('Tersedia');

  // Kuota Total
  const [changeKuotaTotal, setChangeKuotaTotal] = useState(false);
  const [kuotaTotalMode, setKuotaTotalMode] = useState<'set' | 'offset'>('set');
  const [kuotaTotalValue, setKuotaTotalValue] = useState<number>(30);
  const [kuotaTotalOffset, setKuotaTotalOffset] = useState<number>(5);

  // Kuota Terisi
  const [changeKuotaTerisi, setChangeKuotaTerisi] = useState(false);
  const [kuotaTerisiMode, setKuotaTerisiMode] = useState<'reset' | 'set'>('reset');
  const [kuotaTerisiValue, setKuotaTerisiValue] = useState<number>(0);

  // Rerata Pasien
  const [changeRerata, setChangeRerata] = useState(false);
  const [rerataValue, setRerataValue] = useState<number>(25);

  // Ruangan
  const [changeRuangan, setChangeRuangan] = useState(false);
  const [ruanganValue, setRuanganValue] = useState<string>('');

  // Jam Praktik
  const [changeJadwal, setChangeJadwal] = useState(false);
  const [jadwalValue, setJadwalValue] = useState<string>('08:00 - 12:00');

  // Jam HFIS
  const [changeJamHfis, setChangeJamHfis] = useState(false);
  const [jamHfisValue, setJamHfisValue] = useState<string>('07.30 - 13.00');

  // Reset all toggles when modal opens
  useEffect(() => {
    if (isOpen) {
      setChangeStatus(false);
      setStatusValue('Tersedia');
      setChangeKuotaTotal(false);
      setKuotaTotalMode('set');
      setKuotaTotalValue(30);
      setKuotaTotalOffset(5);
      setChangeKuotaTerisi(false);
      setKuotaTerisiMode('reset');
      setKuotaTerisiValue(0);
      setChangeRerata(false);
      setRerataValue(25);
      setChangeRuangan(false);
      setRuanganValue('');
      setChangeJadwal(false);
      setJadwalValue('08:00 - 12:00');
      setChangeJamHfis(false);
      setJamHfisValue('07.30 - 13.00');
    }
  }, [isOpen]);

  if (!isOpen || selectedSchedules.length === 0) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ids = selectedSchedules.map((s) => s.id);
    const updates: Partial<DoctorSchedule> = {};

    if (changeStatus && statusValue !== 'auto') {
      updates.status = statusValue as any;
    }

    if (changeKuotaTotal) {
      if (kuotaTotalMode === 'set') {
        updates.kuotaTotal = Number(kuotaTotalValue);
      }
      // For offset mode, we will handle in mapper function
    }

    if (changeKuotaTerisi) {
      if (kuotaTerisiMode === 'reset') {
        updates.kuotaTerisi = 0;
      } else {
        updates.kuotaTerisi = Number(kuotaTerisiValue);
      }
    }

    if (changeRerata) {
      updates.rerataPasien = Number(rerataValue);
    }

    if (changeRuangan && ruanganValue.trim()) {
      updates.ruangan = ruanganValue.trim();
    }

    if (changeJadwal && jadwalValue.trim()) {
      updates.jadwal = jadwalValue.trim();
    }

    if (changeJamHfis && jamHfisValue.trim()) {
      updates.jamHfis = jamHfisValue.trim();
    }

    // Call save bulk with smart per-schedule logic if offset or auto-status is used
    if (kuotaTotalMode === 'offset' && changeKuotaTotal) {
      // Offset applied per schedule
      selectedSchedules.forEach((sch) => {
        const newTotal = Math.max(1, (sch.kuotaTotal || 0) + kuotaTotalOffset);
        const newTerisi = changeKuotaTerisi
          ? (kuotaTerisiMode === 'reset' ? 0 : Number(kuotaTerisiValue))
          : sch.kuotaTerisi;
        const newStatus = changeStatus
          ? (statusValue === 'auto' ? (newTerisi >= newTotal ? 'Penuh' : 'Tersedia') : statusValue)
          : sch.status;

        onSaveBulk([sch.id], {
          ...updates,
          kuotaTotal: newTotal,
          status: newStatus as any
        });
      });
    } else if (changeStatus && statusValue === 'auto') {
      // Auto status per schedule
      selectedSchedules.forEach((sch) => {
        const newTotal = changeKuotaTotal ? Number(kuotaTotalValue) : sch.kuotaTotal;
        const newTerisi = changeKuotaTerisi
          ? (kuotaTerisiMode === 'reset' ? 0 : Number(kuotaTerisiValue))
          : sch.kuotaTerisi;
        const newStatus = newTerisi >= newTotal ? 'Penuh' : 'Tersedia';

        onSaveBulk([sch.id], {
          ...updates,
          status: newStatus
        });
      });
    } else {
      onSaveBulk(ids, updates);
    }

    onClose();
  };

  const hasAnyChange =
    changeStatus ||
    changeKuotaTotal ||
    changeKuotaTerisi ||
    changeRerata ||
    changeRuangan ||
    changeJadwal ||
    changeJamHfis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        id="bulk-edit-schedule-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 transform transition-all"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Layers className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Edit Masal Jadwal Dokter</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 font-semibold">
                  {selectedSchedules.length} Jadwal Dipilih
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80">
                Pilih parameter yang ingin diperbarui secara serentak untuk semua slot jadwal terpilih
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-bulk-modal"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Items Preview Chips */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Daftar Slot Jadwal Yang Akan Diperbarui:</span>
            <span className="text-teal-700 font-semibold">{selectedSchedules.length} slot</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {selectedSchedules.map((sch) => (
              <span
                key={sch.id}
                className="inline-flex items-center gap-1.5 text-xs bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-medium"
              >
                <span className="font-semibold text-teal-900">{sch.dpjp}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{sch.poli.replace(/^Poli\s+/, '')}</span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 font-semibold">{sch.hari}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Note Info */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold">Petunjuk Pengeditan Masal:</span>
              <p className="text-amber-800">
                Centang kotak pada parameter yang ingin Anda ubah. Parameter yang tidak dicentang akan tetap mempertahankan nilai aslinya pada masing-masing jadwal dokter.
              </p>
            </div>
          </div>

          {/* 1. STATUS KETERSEDIAAN */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              changeStatus ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200' : 'bg-slate-50/60 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="check-bulk-status"
                className="flex items-center gap-2.5 font-bold text-sm text-slate-800 cursor-pointer select-none"
              >
                <input
                  id="check-bulk-status"
                  type="checkbox"
                  checked={changeStatus}
                  onChange={(e) => setChangeStatus(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Ubah Status Ketersediaan Praktik</span>
              </label>
              {changeStatus && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Aktif Diubah
                </span>
              )}
            </div>

            {changeStatus && (
              <div className="mt-3 pl-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: 'Tersedia', label: 'Tersedia (Buka)', color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
                  { value: 'Penuh', label: 'Penuh (Tutup)', color: 'border-rose-300 bg-rose-50 text-rose-900' },
                  { value: 'Libur', label: 'Libur Praktik', color: 'border-amber-300 bg-amber-50 text-amber-900' },
                  { value: 'Cuti', label: 'Cuti Dokter', color: 'border-purple-300 bg-purple-50 text-purple-900' },
                  { value: 'Ubah Jam', label: 'Ubah Jam Praktik', color: 'border-blue-300 bg-blue-50 text-blue-900' },
                  { value: 'auto', label: 'Otomatis (Berdasar Kuota)', color: 'border-teal-300 bg-teal-50 text-teal-900' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusValue(opt.value as any)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      statusValue === opt.value
                        ? `${opt.color} ring-2 ring-emerald-500 font-bold shadow-2xs`
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {statusValue === opt.value && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. KUOTA TOTAL BPJS */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              changeKuotaTotal ? 'bg-teal-50/40 border-teal-300 ring-1 ring-teal-200' : 'bg-slate-50/60 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="check-bulk-kuota-total"
                className="flex items-center gap-2.5 font-bold text-sm text-slate-800 cursor-pointer select-none"
              >
                <input
                  id="check-bulk-kuota-total"
                  type="checkbox"
                  checked={changeKuotaTotal}
                  onChange={(e) => setChangeKuotaTotal(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                />
                <Hash className="w-4 h-4 text-teal-600" />
                <span>Ubah Kuota Total Pasien BPJS</span>
              </label>
              {changeKuotaTotal && (
                <span className="text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                  Aktif Diubah
                </span>
              )}
            </div>

            {changeKuotaTotal && (
              <div className="mt-3 pl-6 space-y-3">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="kuota-total-mode"
                      checked={kuotaTotalMode === 'set'}
                      onChange={() => setKuotaTotalMode('set')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>Tetapkan Nilai Sama</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="kuota-total-mode"
                      checked={kuotaTotalMode === 'offset'}
                      onChange={() => setKuotaTotalMode('offset')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>Tambah / Kurang Relatif (Offset)</span>
                  </label>
                </div>

                {kuotaTotalMode === 'set' ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <input
                        id="input-bulk-kuota-total-value"
                        type="number"
                        min="1"
                        max="200"
                        value={kuotaTotalValue}
                        onChange={(e) => setKuotaTotalValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">pasien / kuota per sesi</span>
                    </div>
                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-slate-400">Preset Cepat:</span>
                      {[20, 25, 30, 40, 50].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setKuotaTotalValue(preset)}
                          className={`text-xs px-2 py-0.5 rounded border transition cursor-pointer ${
                            kuotaTotalValue === preset
                              ? 'bg-teal-700 text-white border-teal-700 font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      {[-10, -5, +5, +10, +15].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setKuotaTotalOffset(val)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                            kuotaTotalOffset === val
                              ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {val > 0 ? `+${val}` : val} Pasien
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Contoh: Jika kuota awal 30 dan offset +5, maka kuota baru menjadi 35.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. KUOTA TERISI */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              changeKuotaTerisi ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200' : 'bg-slate-50/60 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="check-bulk-kuota-terisi"
                className="flex items-center gap-2.5 font-bold text-sm text-slate-800 cursor-pointer select-none"
              >
                <input
                  id="check-bulk-kuota-terisi"
                  type="checkbox"
                  checked={changeKuotaTerisi}
                  onChange={(e) => setChangeKuotaTerisi(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>Reset / Ubah Kuota Terisi Saat Ini</span>
              </label>
              {changeKuotaTerisi && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Aktif Diubah
                </span>
              )}
            </div>

            {changeKuotaTerisi && (
              <div className="mt-3 pl-6 space-y-2">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="kuota-terisi-mode"
                      checked={kuotaTerisiMode === 'reset'}
                      onChange={() => setKuotaTerisiMode('reset')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-blue-900">Reset Menjadi 0 (Awal Shift / Pekan Baru)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="kuota-terisi-mode"
                      checked={kuotaTerisiMode === 'set'}
                      onChange={() => setKuotaTerisiMode('set')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Nilai Tertentu</span>
                  </label>
                </div>

                {kuotaTerisiMode === 'set' && (
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      id="input-bulk-kuota-terisi-value"
                      type="number"
                      min="0"
                      max="200"
                      value={kuotaTerisiValue}
                      onChange={(e) => setKuotaTerisiValue(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">pasien telah mendaftar</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. RERATA PASIEN & RUANGAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rerata Pasien */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                changeRerata ? 'bg-purple-50/40 border-purple-300 ring-1 ring-purple-200' : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <label
                htmlFor="check-bulk-rerata"
                className="flex items-center gap-2 font-bold text-xs text-slate-800 cursor-pointer select-none mb-2"
              >
                <input
                  id="check-bulk-rerata"
                  type="checkbox"
                  checked={changeRerata}
                  onChange={(e) => setChangeRerata(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                />
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Ubah Rerata Pasien</span>
              </label>
              {changeRerata && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="input-bulk-rerata"
                    type="number"
                    min="1"
                    max="150"
                    value={rerataValue}
                    onChange={(e) => setRerataValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">pasien</span>
                </div>
              )}
            </div>

            {/* Ruangan Praktik */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                changeRuangan ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200' : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <label
                htmlFor="check-bulk-ruangan"
                className="flex items-center gap-2 font-bold text-xs text-slate-800 cursor-pointer select-none mb-2"
              >
                <input
                  id="check-bulk-ruangan"
                  type="checkbox"
                  checked={changeRuangan}
                  onChange={(e) => setChangeRuangan(e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                />
                <Building className="w-3.5 h-3.5 text-amber-600" />
                <span>Ubah Ruangan Praktik</span>
              </label>
              {changeRuangan && (
                <input
                  id="input-bulk-ruangan"
                  type="text"
                  value={ruanganValue}
                  onChange={(e) => setRuanganValue(e.target.value)}
                  placeholder="Misal: R. Praktik 101, Lt. 2"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* 5. JAM PRAKTIK & HFIS (Opsional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jam Praktik RS */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                changeJadwal ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200' : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <label
                htmlFor="check-bulk-jadwal"
                className="flex items-center gap-2 font-bold text-xs text-slate-800 cursor-pointer select-none mb-2"
              >
                <input
                  id="check-bulk-jadwal"
                  type="checkbox"
                  checked={changeJadwal}
                  onChange={(e) => setChangeJadwal(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Ubah Jam Praktik RS</span>
              </label>
              {changeJadwal && (
                <input
                  id="input-bulk-jadwal"
                  type="text"
                  value={jadwalValue}
                  onChange={(e) => setJadwalValue(e.target.value)}
                  placeholder="Contoh: 08:00 - 12:00"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
            </div>

            {/* Jam HFIS BPJS */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                changeJamHfis ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200' : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <label
                htmlFor="check-bulk-jam-hfis"
                className="flex items-center gap-2 font-bold text-xs text-slate-800 cursor-pointer select-none mb-2"
              >
                <input
                  id="check-bulk-jam-hfis"
                  type="checkbox"
                  checked={changeJamHfis}
                  onChange={(e) => setChangeJamHfis(e.target.checked)}
                  className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                />
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Ubah Jam HFIS BPJS</span>
              </label>
              {changeJamHfis && (
                <input
                  id="input-bulk-jam-hfis"
                  type="text"
                  value={jamHfisValue}
                  onChange={(e) => setJamHfisValue(e.target.value)}
                  placeholder="Contoh: 07.30 - 13.00"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {hasAnyChange ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Siap memperbarui {selectedSchedules.length} slot jadwal
              </span>
            ) : (
              <span className="text-slate-400">Pilih setidaknya 1 parameter untuk diubah</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-cancel-bulk-modal"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              id="btn-save-bulk-modal"
              disabled={!hasAnyChange}
              onClick={handleSubmit}
              className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                hasAnyChange
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white active:scale-95 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan ({selectedSchedules.length} Jadwal)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
