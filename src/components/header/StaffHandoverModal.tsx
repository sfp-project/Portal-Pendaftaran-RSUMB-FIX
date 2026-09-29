import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Clock,
  User,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { StaffUser, StaffShiftType } from '../../types/headerTypes';
import { INITIAL_STAFF_LIST } from '../../data/headerData';
import {
  loadShiftHandoverRecords,
  saveShiftHandoverRecords
} from '../../data/patientNotesData';
import {
  PatientShiftHandoverRecord,
  ShiftAdmisi,
  PrioritasHandover,
  StatusHandover
} from '../../types/patientNotesTypes';

interface StaffHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStaff: StaffUser;
  onUpdateActiveStaff: (updatedStaff: StaffUser) => void;
  onSuccessNotice?: (msg: string) => void;
}

export const StaffHandoverModal: React.FC<StaffHandoverModalProps> = ({
  isOpen,
  onClose,
  activeStaff,
  onUpdateActiveStaff,
  onSuccessNotice
}) => {
  const [selectedShift, setSelectedShift] = useState<StaffShiftType>(activeStaff.shift);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(activeStaff.id);

  // Form Handover Pasien fields
  const [hasPatientHandover, setHasPatientHandover] = useState(true);
  const [namaPasien, setNamaPasien] = useState('');
  const [noRm, setNoRm] = useState('');
  const [kategori, setKategori] = useState('Pending SEP BPJS');
  const [prioritas, setPrioritas] = useState<PrioritasHandover>('Sedang');
  const [masalah, setMasalah] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedShift(activeStaff.shift);
      setSelectedStaffId(activeStaff.id);
      setErrorMessage('');
    }
  }, [isOpen, activeStaff]);

  if (!isOpen) return null;

  const kategoriOptions = [
    'Pending SEP BPJS',
    'Asuransi Swasta Menunggu GL',
    'Jasa Raharja / LP Belum Terbit',
    'Berkas Rujukan Belum Lengkap',
    'Naik Kelas / Selisih Biaya',
    'Pasien / Keluarga Komplain',
    'Identitas Belum Lengkap (KTP/KK)',
    'Jadwal Operasi / SPRI',
    'Lain-lain'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // If patient handover is checked, validate fields
    if (hasPatientHandover) {
      if (!namaPasien.trim()) {
        setErrorMessage('Mohon cantumkan nama pasien untuk catatan handover.');
        return;
      }
      if (!noRm.trim()) {
        setErrorMessage('Mohon isi nomor rekam medis (RM) pasien.');
        return;
      }
      if (!masalah.trim()) {
        setErrorMessage('Mohon tuliskan detail masalah atau instruksi untuk petugas shift berikutnya.');
        return;
      }

      // Convert StaffShiftType to ShiftAdmisi ('Pagi' | 'Siang' | 'Malam')
      let shiftAdmisi: ShiftAdmisi = 'Pagi';
      if (selectedShift === 'Shift Siang') shiftAdmisi = 'Siang';
      else if (selectedShift === 'Shift Malam') shiftAdmisi = 'Malam';

      const foundStaff = INITIAL_STAFF_LIST.find((s) => s.id === selectedStaffId) || activeStaff;

      const newRecord: PatientShiftHandoverRecord = {
        id: `hnd-${Date.now()}`,
        namaPasien: namaPasien.trim(),
        noRm: noRm.trim(),
        timestamp: new Date().toISOString(),
        shift: shiftAdmisi,
        petugasAsal: `${activeStaff.name} (${activeStaff.role})`,
        masalah: masalah.trim(),
        status: 'Pending',
        prioritas: prioritas,
        kategori: kategori,
        createdAt: new Date().toISOString()
      };

      // Save to existing patient notes handover storage
      const existingRecords = loadShiftHandoverRecords();
      saveShiftHandoverRecords([newRecord, ...existingRecords]);
    }

    // Update active staff user if staff or shift changed
    const targetStaff = INITIAL_STAFF_LIST.find((s) => s.id === selectedStaffId) || activeStaff;
    const updatedStaff: StaffUser = {
      ...targetStaff,
      shift: selectedShift
    };
    onUpdateActiveStaff(updatedStaff);

    onSuccessNotice?.(
      hasPatientHandover
        ? `Shift berhasil diperbarui ke ${selectedShift} & Catatan Handover disimpan ke SIMRS!`
        : `Shift aktif berhasil diperbarui ke ${selectedShift}!`
    );

    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-10 my-auto"
        style={{
          maxHeight: '85vh',
          overflowY: 'auto',
          margin: 'auto'
        }}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-800 to-[#005d42] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <RefreshCw className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Ganti Shift & Form Handover Admisi
              </h3>
              <p className="text-xs text-emerald-200/90">
                Pencatatan serah terima pasien antar petugas shift RSUMB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Pemilihan Shift Dinas */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#005d42]" />
              Pilih Shift Bertugas Sekarang:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Shift Pagi', 'Shift Siang', 'Shift Malam'] as StaffShiftType[]).map((sh) => {
                const isSelected = selectedShift === sh;
                let hours = '07.00 - 14.00';
                if (sh === 'Shift Siang') hours = '14.00 - 21.00';
                if (sh === 'Shift Malam') hours = '21.00 - 07.00';

                return (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setSelectedShift(sh)}
                    className={`py-2 px-2.5 rounded-xl text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#005d42] text-white border-[#005d42] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-xs font-bold">{sh}</p>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {hours}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Petugas Jaga Aktif */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#005d42]" />
              Petugas Admisi / Pendaftaran yang Aktif:
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] cursor-pointer"
            >
              {INITIAL_STAFF_LIST.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} — {staff.role} ({staff.email})
                </option>
              ))}
            </select>
          </div>

          {/* Section 3: Toggle Catatan Handover Pasien */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl cursor-pointer">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#005d42]" />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Sertakan Catatan Serah Terima Pasien (Handover)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Catat kendala SEP BPJS, Asuransi, atau instruksi pending untuk shift berikutnya
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasPatientHandover}
                onChange={(e) => setHasPatientHandover(e.target.checked)}
                className="w-4 h-4 text-[#005d42] rounded accent-[#005d42] cursor-pointer"
              />
            </label>
          </div>

          {/* If Handover details enabled */}
          {hasPatientHandover && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nama Pasien <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaPasien}
                    onChange={(e) => setNamaPasien(e.target.value)}
                    placeholder="Contoh: Ny. Siti Rahayu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#005d42]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nomor Rekam Medis (RM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={noRm}
                    onChange={(e) => setNoRm(e.target.value)}
                    placeholder="Contoh: 38-44-12"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:border-[#005d42]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kategori Kendala Handover
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005d42] cursor-pointer"
                  >
                    {kategoriOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tingkat Prioritas
                  </label>
                  <div className="flex items-center gap-2">
                    {(['Tinggi', 'Sedang', 'Rendah'] as PrioritasHandover[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrioritas(p)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          prioritas === p
                            ? p === 'Tinggi'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : p === 'Sedang'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Detail Masalah / Instruksi Serah Terima Shift <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={masalah}
                  onChange={(e) => setMasalah(e.target.value)}
                  placeholder="Tuliskan kendala pasien, status dokumen, atau tindak lanjut yang harus dikerjakan shift berikutnya..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#005d42]"
                />
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#005d42] hover:bg-[#004a35] rounded-xl shadow-sm hover:shadow transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Perbarui Shift</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
