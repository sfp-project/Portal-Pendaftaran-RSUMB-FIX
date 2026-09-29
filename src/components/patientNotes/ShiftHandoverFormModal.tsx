import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  User,
  Hash,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  Save,
  Tag
} from 'lucide-react';
import {
  PatientShiftHandoverRecord,
  ShiftAdmisi,
  StatusHandover,
  PrioritasHandover
} from '../../types/patientNotesTypes';

interface ShiftHandoverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PatientShiftHandoverRecord) => void;
  editingRecord?: PatientShiftHandoverRecord | null;
  defaultShift?: ShiftAdmisi;
}

export const ShiftHandoverFormModal: React.FC<ShiftHandoverFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRecord,
  defaultShift = 'Pagi'
}) => {
  // Determine current shift based on real time if not editing
  const getCurrentShiftByTime = (): ShiftAdmisi => {
    const hours = new Date().getHours();
    if (hours >= 7 && hours < 14) return 'Pagi';
    if (hours >= 14 && hours < 21) return 'Siang';
    return 'Malam';
  };

  const [namaPasien, setNamaPasien] = useState('');
  const [noRm, setNoRm] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [shift, setShift] = useState<ShiftAdmisi>(defaultShift);
  const [petugasAsal, setPetugasAsal] = useState('');
  const [masalah, setMasalah] = useState('');
  const [status, setStatus] = useState<StatusHandover>('Pending');
  const [prioritas, setPrioritas] = useState<PrioritasHandover>('Sedang');
  const [kategori, setKategori] = useState('Pending SEP BPJS');
  const [catatanPenyelesaian, setCatatanPenyelesaian] = useState('');
  const [handledBy, setHandledBy] = useState('');

  // Predefined options
  const kategoriOptions = [
    'Pending SEP BPJS',
    'Jasa Raharja / LP Belum Terbit',
    'Asuransi Swasta Menunggu GL',
    'Berkas Rujukan Belum Lengkap',
    'Naik Kelas / Selisih Biaya',
    'Pasien / Keluarga Komplain',
    'Identitas Belum Lengkap (KTP/KK)',
    'Jadwal Operasi / SPRI',
    'Lain-lain'
  ];

  const petugasPresets = [
    'Siti Aminah (Pendaftaran)',
    'Nurul Hidayati (Pendaftaran)',
    'Rizal Fahmi (Admisi)',
    'Bambang Irawan (Admisi)',
    'Devi Anggraeni (Kasir/Admisi)',
    'Petugas Jaga Shift'
  ];

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setNamaPasien(editingRecord.namaPasien || '');
        setNoRm(editingRecord.noRm || '');
        setTimestamp(editingRecord.timestamp || new Date().toISOString().slice(0, 16));
        setShift(editingRecord.shift || 'Pagi');
        setPetugasAsal(editingRecord.petugasAsal || '');
        setMasalah(editingRecord.masalah || '');
        setStatus(editingRecord.status || 'Pending');
        setPrioritas(editingRecord.prioritas || 'Sedang');
        setKategori(editingRecord.kategori || 'Pending SEP BPJS');
        setCatatanPenyelesaian(editingRecord.catatanPenyelesaian || '');
        setHandledBy(editingRecord.handledBy || '');
      } else {
        const nowIso = new Date().toISOString().slice(0, 16);
        setNamaPasien('');
        setNoRm('');
        setTimestamp(nowIso);
        setShift(getCurrentShiftByTime());
        setPetugasAsal('');
        setMasalah('');
        setStatus('Pending');
        setPrioritas('Sedang');
        setKategori('Pending SEP BPJS');
        setCatatanPenyelesaian('');
        setHandledBy('');
      }
    }
  }, [isOpen, editingRecord]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPasien.trim()) {
      alert('Mohon isi nama pasien.');
      return;
    }
    if (!noRm.trim()) {
      alert('Mohon isi nomor rekam medis (RM).');
      return;
    }
    if (!masalah.trim()) {
      alert('Mohon isi detail masalah / catatan handover.');
      return;
    }

    const newRecord: PatientShiftHandoverRecord = {
      id: editingRecord ? editingRecord.id : `hnd-${Date.now()}`,
      namaPasien: namaPasien.trim(),
      noRm: noRm.trim(),
      timestamp: timestamp || new Date().toISOString(),
      shift,
      petugasAsal: petugasAsal.trim() || `Petugas Shift ${shift}`,
      masalah: masalah.trim(),
      status,
      prioritas,
      kategori,
      catatanPenyelesaian: status === 'Handled' ? (catatanPenyelesaian.trim() || undefined) : undefined,
      handledBy: status === 'Handled' ? (handledBy.trim() || undefined) : undefined,
      handledAt: status === 'Handled' && (!editingRecord?.handledAt) ? new Date().toISOString() : editingRecord?.handledAt,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#005d42] to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {editingRecord ? 'Edit Catatan Handover Shift' : 'Tambah Catatan Handover Shift Admisi'}
              </h3>
              <p className="text-xs text-emerald-100">
                Pencatatan masalah administratif pasien untuk dioperkan ke shift penerima
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          {/* Row 1: Pasien & No RM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Pasien <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={namaPasien}
                  onChange={(e) => setNamaPasien(e.target.value)}
                  placeholder="Contoh: Ananda Kevin / Ny. Hj. Mariyam"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Rekam Medis (RM) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={noRm}
                  onChange={(e) => setNoRm(e.target.value)}
                  placeholder="Contoh: 14-89-21"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Shift, Tanggal & Petugas Asal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Shift Operan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['Pagi', 'Siang', 'Malam'] as ShiftAdmisi[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      shift === s
                        ? s === 'Pagi'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : s === 'Siang'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Waktu Handover <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Petugas Asal (Pembuat)
              </label>
              <input
                type="text"
                value={petugasAsal}
                onChange={(e) => setPetugasAsal(e.target.value)}
                placeholder="Nama staf pengoper"
                list="petugas-list"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] focus:border-transparent"
              />
              <datalist id="petugas-list">
                {petugasPresets.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 3: Kategori, Prioritas & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kategori Masalah
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] focus:border-transparent bg-white"
              >
                {kategoriOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tingkat Urgensi
              </label>
              <select
                value={prioritas}
                onChange={(e) => setPrioritas(e.target.value as PrioritasHandover)}
                className={`w-full px-3 py-2 text-xs font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] ${
                  prioritas === 'Tinggi'
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : prioritas === 'Sedang'
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <option value="Tinggi">🔴 Tinggi (Perlu Segera / Hari Ini)</option>
                <option value="Sedang">🟡 Sedang (Normal Pantauan)</option>
                <option value="Rendah">🟢 Rendah (Informasi Rutin)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Status Masalah
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusHandover)}
                className={`w-full px-3 py-2 text-xs font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] ${
                  status === 'Pending'
                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                    : 'border-emerald-400 bg-emerald-50 text-emerald-900'
                }`}
              >
                <option value="Pending">🟡 Pending (Belum Tuntas)</option>
                <option value="Handled">🟢 Handled (Sudah Selesai)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Catatan Masalah / Instruksi Handover */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Detail Masalah / Catatan Instruksi Handover <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={masalah}
              onChange={(e) => setMasalah(e.target.value)}
              placeholder="Jelaskan detail kendala administratif pasien, dokumen yang kurang, atau tindak lanjut yang harus dilakukan oleh staf shift penerima..."
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] focus:border-transparent leading-relaxed"
            />
          </div>

          {/* Optional: Penyelesaian jika status Handled */}
          {status === 'Handled' && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Rincian Penyelesaian Masalah</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Petugas yang Menyelesaikan
                  </label>
                  <input
                    type="text"
                    value={handledBy}
                    onChange={(e) => setHandledBy(e.target.value)}
                    placeholder="Contoh: Rizal (Shift Siang)"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Catatan Penyelesaian
                  </label>
                  <input
                    type="text"
                    value={catatanPenyelesaian}
                    onChange={(e) => setCatatanPenyelesaian(e.target.value)}
                    placeholder="Contoh: SEP berhasil dicetak setelah verifikasi NIK"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#005d42] hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingRecord ? 'Simpan Perubahan' : 'Tambah Catatan Handover'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
