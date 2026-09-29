import React, { useState } from 'react';
import { X, ShieldAlert, Check, Plus, Calendar } from 'lucide-react';
import {
  PatientBpjsKendalaRecord,
  StatusBpjsKendala
} from '../../types/patientNotesTypes';

interface BpjsKendalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PatientBpjsKendalaRecord) => void;
  initialData?: PatientBpjsKendalaRecord | null;
}

const DEFAULT_JENIS_KENDALA: string[] = [
  'Kartu Non aktif',
  'Denda Pelayanan',
  'SEP Blocked',
  'Rujukan Faskes 1 Expiry',
  'Beda Data/NIK',
  'Bayi 3 bulan lebih update nama (surat desa)',
  'BPJS Maintenance'
];

export const BpjsKendalaModal: React.FC<BpjsKendalaModalProps> = ({
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
  const [noKartuBpjs, setNoKartuBpjs] = useState(initialData?.noKartuBpjs || '');

  // Check if initialData has a custom kendala not in the default list
  const initialIsCustom =
    Boolean(initialData?.jenisKendala) &&
    !DEFAULT_JENIS_KENDALA.includes(initialData?.jenisKendala || '');

  const [selectedKendalaPreset, setSelectedKendalaPreset] = useState<string>(
    initialIsCustom
      ? 'custom'
      : initialData?.jenisKendala || DEFAULT_JENIS_KENDALA[0]
  );
  const [customKendalaText, setCustomKendalaText] = useState(
    initialIsCustom ? initialData?.jenisKendala || '' : ''
  );

  const [detailMasalah, setDetailMasalah] = useState(initialData?.detailMasalah || '');
  const [catatanSolusi, setCatatanSolusi] = useState(initialData?.catatanSolusi || '');
  
  // Status choices: 'Pending' or 'Resolved (cetak SEP)'
  const [status, setStatus] = useState<StatusBpjsKendala>(() => {
    if (initialData?.status === 'Resolved' || initialData?.status === 'Resolved (cetak SEP)') {
      return 'Resolved (cetak SEP)';
    }
    return 'Pending';
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPasien.trim() || !noRm.trim() || !noKartuBpjs.trim()) {
      alert('Nama Pasien, No. RM, dan No. Kartu BPJS wajib diisi.');
      return;
    }

    const finalJenisKendala =
      selectedKendalaPreset === 'custom'
        ? customKendalaText.trim() || 'Kendala Khusus'
        : selectedKendalaPreset;

    const record: PatientBpjsKendalaRecord = {
      id: initialData?.id || `bpjs-${Date.now()}`,
      namaPasien: namaPasien.trim().toUpperCase(),
      noRm: noRm.trim(),
      tanggalMrsKontrol: tanggalMrsKontrol || new Date().toISOString().split('T')[0],
      noKartuBpjs: noKartuBpjs.trim(),
      jenisKendala: finalJenisKendala,
      detailMasalah: detailMasalah.trim(),
      catatanSolusi: catatanSolusi.trim(),
      status,
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
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialData ? 'Edit Kendala BPJS Pasien' : 'Catat Kendala BPJS Pasien'}
              </h3>
              <p className="text-xs text-emerald-100">
                Pencatatan kepesertaan, denda, bridging SEP, dan tanggal MRS/kontrol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
                placeholder="Contoh: SUNARTO"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-900 uppercase"
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
                placeholder="Contoh: 11-78-30"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Row 2: Tanggal MRS/Kontrol & No. Kartu BPJS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tanggal MRS / Kontrol</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggalMrsKontrol}
                onChange={(e) => setTanggalMrsKontrol(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. Kartu BPJS <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={noKartuBpjs}
                onChange={(e) => setNoKartuBpjs(e.target.value)}
                placeholder="Contoh: 0001892301982 (13 Digit)"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Row 3: Jenis Kendala with Dynamic Custom Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Jenis Kendala BPJS <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-medium">
                Pilih opsi atau ketik kendala khusus
              </span>
            </div>

            <select
              value={selectedKendalaPreset}
              onChange={(e) => setSelectedKendalaPreset(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
            >
              {DEFAULT_JENIS_KENDALA.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="custom">-- Lainnya / Ketik Masalah Kustom Baru --</option>
            </select>

            {/* Dynamic Custom Input Field when "custom" is selected */}
            {selectedKendalaPreset === 'custom' && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-emerald-900">
                  Ketik Jenis Kendala Kustom:
                </label>
                <input
                  type="text"
                  required
                  value={customKendalaText}
                  onChange={(e) => setCustomKendalaText(e.target.value)}
                  placeholder="Contoh: Rujukan Pcare salah faskes tujuan, BPJS KIS PBI non-aktif mendadak, dll."
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 font-medium"
                />
              </div>
            )}
          </div>

          {/* Detail Masalah */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detail Masalah yang Dialami
            </label>
            <textarea
              rows={3}
              value={detailMasalah}
              onChange={(e) => setDetailMasalah(e.target.value)}
              placeholder="Contoh: Kepesertaan BPJS Mandiri tertunggak 3 bulan. Muncul error saat generate SEP di V-Claim..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none text-slate-800"
            />
          </div>

          {/* Catatan Solusi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Solusi & Tindak Lanjut Admisi
            </label>
            <textarea
              rows={3}
              value={catatanSolusi}
              onChange={(e) => setCatatanSolusi(e.target.value)}
              placeholder="Contoh: Keluarga sudah diedukasi untuk aktivasi via Mobile JKN dan bayar tagihan. Diberi tenggat waktu 3x24 jam..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none text-slate-800"
            />
          </div>

          {/* Status Penyelesaian Choice: [ Pending ] and [ Resolved (cetak SEP) ] */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Status Penyelesaian Kendala
              </span>
              <span className="text-[11px] text-slate-500">
                Pilih status penyelesaian kasus BPJS ini:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('Pending')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  status === 'Pending'
                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus('Resolved (cetak SEP)')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  status === 'Resolved (cetak SEP)' || status === 'Resolved'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Resolved (cetak SEP)
              </button>
            </div>
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
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {initialData ? 'Simpan Perubahan' : 'Catat Kendala'}
          </button>
        </div>
      </div>
    </div>
  );
};
