import React, { useState } from 'react';
import { X, AlertTriangle, Check, Plus, Calendar } from 'lucide-react';
import {
  PatientUmumBeresikoRecord
} from '../../types/patientNotesTypes';

interface UmumBeresikoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PatientUmumBeresikoRecord) => void;
  initialData?: PatientUmumBeresikoRecord | null;
}

const DEFAULT_POTENSI_OPTIONS: string[] = [
  'Biaya Operasi/Ranap Tinggi',
  'Pasien/Keluarga Vokal',
  'Risiko APS/Kabur',
  'Komplain Pelayanan',
  'Readmisi',
  'Tidak Ada Keluarga yang Faham',
  'Tidak Ada Orang Tua/Wali',
  'Non spesialistik',
  'Tidak membawa identitas / kurang lengkap',
  'Belum waktu kontrol'
];

export const UmumBeresikoModal: React.FC<UmumBeresikoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [namaPasien, setNamaPasien] = useState(initialData?.namaPasien || '');
  const [noRm, setNoRm] = useState(initialData?.noRm || '');
  const [tanggalMrsKontrol, setTanggalMrsKontrol] = useState(
    initialData?.tanggalMrsKontrol || new Date().toISOString().split('T')[0]
  );
  const [kronologiMasalah, setKronologiMasalah] = useState(
    initialData?.kronologiMasalah || ''
  );

  // Combine default options with any initial custom options
  const [availableOptions, setAvailableOptions] = useState<string[]>(() => {
    const set = new Set(DEFAULT_POTENSI_OPTIONS);
    if (initialData?.potensiMasalah) {
      initialData.potensiMasalah.forEach((p) => set.add(p));
    }
    return Array.from(set);
  });

  const [potensiMasalah, setPotensiMasalah] = useState<string[]>(
    initialData?.potensiMasalah || ['Biaya Operasi/Ranap Tinggi']
  );

  const [customTagInput, setCustomTagInput] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState(initialData?.tindakLanjut || '');

  if (!isOpen) return null;

  const togglePotensi = (item: string) => {
    if (potensiMasalah.includes(item)) {
      setPotensiMasalah(potensiMasalah.filter((p) => p !== item));
    } else {
      setPotensiMasalah([...potensiMasalah, item]);
    }
  };

  const handleAddCustomOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;

    if (!availableOptions.includes(trimmed)) {
      setAvailableOptions((prev) => [...prev, trimmed]);
    }
    if (!potensiMasalah.includes(trimmed)) {
      setPotensiMasalah((prev) => [...prev, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPasien.trim() || !noRm.trim()) {
      alert('Nama Pasien dan No. RM wajib diisi.');
      return;
    }
    if (potensiMasalah.length === 0) {
      alert('Pilih minimal satu potensi masalah berisiko.');
      return;
    }

    const record: PatientUmumBeresikoRecord = {
      id: initialData?.id || `umum-${Date.now()}`,
      namaPasien: namaPasien.trim().toUpperCase(),
      noRm: noRm.trim(),
      tanggalMrsKontrol: tanggalMrsKontrol || new Date().toISOString().split('T')[0],
      kronologiMasalah: kronologiMasalah.trim(),
      potensiMasalah,
      tindakLanjut: tindakLanjut.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialData ? 'Edit Data UMUM Beresiko' : 'Catat Pasien UMUM Beresiko'}
              </h3>
              <p className="text-xs text-amber-100">
                Early warning system risiko billing, identitas, APS, dan kendala kontrol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Row 1: Nama & No. RM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pasien <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaPasien}
                onChange={(e) => setNamaPasien(e.target.value)}
                placeholder="Contoh: KASANAH BINTI WARTO"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none font-semibold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. Rekam Medis (RM) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={noRm}
                onChange={(e) => setNoRm(e.target.value)}
                placeholder="Contoh: 07-61-44"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none font-semibold text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Row 2: Tanggal MRS / Kontrol */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Tanggal MRS / Kontrol</span> <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggalMrsKontrol}
              onChange={(e) => setTanggalMrsKontrol(e.target.value)}
              className="w-full sm:w-1/2 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none font-semibold text-slate-900"
            />
          </div>

          {/* Kronologi Masalah */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kronologi Kejadian / Masalah Pasien
            </label>
            <textarea
              rows={3}
              value={kronologiMasalah}
              onChange={(e) => setKronologiMasalah(e.target.value)}
              placeholder="Contoh: Pasien lansia 74 tahun dengan hematemesis melena tanpa penjamin. Tidak membawa KTP asli..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none text-slate-800"
            />
          </div>

          {/* Potensi Masalah Multi-Select & Custom Tag Adder */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Potensi Masalah (Pilih satu atau lebih): <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-amber-700 font-semibold">
                {potensiMasalah.length} terpilih
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
              {availableOptions.map((opt) => {
                const checked = potensiMasalah.includes(opt);
                return (
                  <label
                    key={opt}
                    onClick={() => togglePotensi(opt)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer select-none transition-all ${
                      checked
                        ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="leading-tight">{opt}</span>
                  </label>
                );
              })}
            </div>

            {/* Dynamic Custom Option Input Box on the Fly */}
            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomOption();
                  }
                }}
                placeholder="+ Tambah potensi masalah kustom lainnya..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none text-slate-800"
              />
              <button
                type="button"
                onClick={() => handleAddCustomOption()}
                disabled={!customTagInput.trim()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Opsi</span>
              </button>
            </div>
          </div>

          {/* Tindak Lanjut */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tindak Lanjut / Catatan Khusus Admisi
            </label>
            <textarea
              rows={3}
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              placeholder="Contoh: Edukasi estimasi billing harian ke keluarga. Minta deposit awal dan buat surat kesanggupan pembiayaan..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none text-slate-800"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {initialData ? 'Simpan Perubahan' : 'Catat Pasien Berisiko'}
          </button>
        </div>
      </div>
    </div>
  );
};
