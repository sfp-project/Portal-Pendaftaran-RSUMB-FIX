import React, { useState } from 'react';
import { X, CreditCard, Check } from 'lucide-react';
import {
  PatientAsuransiSwastaRecord,
  StatusKlaimAsuransi
} from '../../types/patientNotesTypes';

interface AsuransiSwastaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PatientAsuransiSwastaRecord) => void;
  initialData?: PatientAsuransiSwastaRecord | null;
}

const STATUS_KLAIM_OPTIONS: StatusKlaimAsuransi[] = [
  'Menunggu Guarantee Letter',
  'Excess Fee',
  'Konfirmasi Off-Hours',
  'Form Klaim Kurang',
  'Disetujui / Selesai'
];

const ASURANSI_SUGGESTIONS = [
  'Prudential (PRUPrime Healthcare)',
  'Allianz Life Indonesia',
  'Mandiri Inhealth (Gold/Silver)',
  'Admedika TPA',
  'AIA Financial',
  'Sinarmas MSIG',
  'Manulife Indonesia',
  'Generali Indonesia',
  'Great Eastern',
  'FWD Insurance'
];

export const AsuransiSwastaModal: React.FC<AsuransiSwastaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [namaPasien, setNamaPasien] = useState(initialData?.namaPasien || '');
  const [noRm, setNoRm] = useState(initialData?.noRm || '');
  const [namaAsuransi, setNamaAsuransi] = useState(
    initialData?.namaAsuransi || 'Prudential'
  );
  const [statusKlaim, setStatusKlaim] = useState<string>(
    initialData?.statusKlaim || 'Menunggu Guarantee Letter'
  );
  const [catatanHandover, setCatatanHandover] = useState(
    initialData?.catatanHandover || ''
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPasien.trim() || !noRm.trim() || !namaAsuransi.trim()) {
      alert('Nama Pasien, No. RM, dan Nama Asuransi Swasta wajib diisi.');
      return;
    }

    const record: PatientAsuransiSwastaRecord = {
      id: initialData?.id || `asuransi-${Date.now()}`,
      namaPasien: namaPasien.trim().toUpperCase(),
      noRm: noRm.trim(),
      namaAsuransi: namaAsuransi.trim(),
      statusKlaim,
      catatanHandover: catatanHandover.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-violet-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialData ? 'Edit Catatan Asuransi Swasta' : 'Tambah Pasien Asuransi Swasta'}
              </h3>
              <p className="text-xs text-violet-100">
                Pencatatan jaminan klaim asuransi, verifikasi GL & handover pergantian shift
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-violet-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
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
                placeholder="Contoh: DEWI ANGGRAENI"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none font-semibold text-slate-900 uppercase"
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
                placeholder="Contoh: 18-54-32"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none font-semibold text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Perusahaan Asuransi Swasta <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              list="asuransi-list"
              value={namaAsuransi}
              onChange={(e) => setNamaAsuransi(e.target.value)}
              placeholder="Contoh: Prudential, Allianz, Mandiri Inhealth, Admedika"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none font-semibold text-slate-900"
            />
            <datalist id="asuransi-list">
              {ASURANSI_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kendala / Status Klaim
            </label>
            <select
              value={statusKlaim}
              onChange={(e) => setStatusKlaim(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
            >
              {STATUS_KLAIM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Handover Shift (Penting untuk Shift Selanjutnya)
            </label>
            <textarea
              rows={4}
              value={catatanHandover}
              onChange={(e) => setCatatanHandover(e.target.value)}
              placeholder="Contoh: Pasien rawat inap rencana tindakan bedah laparoskopi. Dokumen medis awal sudah dikirim via portal. Harap follow up GL final jam 14.00..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none text-slate-800"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {initialData ? 'Simpan Perubahan' : 'Tambah Asuransi'}
          </button>
        </div>
      </div>
    </div>
  );
};
