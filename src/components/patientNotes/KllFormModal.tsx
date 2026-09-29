import React, { useState, useRef } from 'react';
import { X, Car, Upload, Check, AlertCircle, FileText, Trash2 } from 'lucide-react';
import { PatientKllRecord, PenjaminKll } from '../../types/patientNotesTypes';

interface KllFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PatientKllRecord) => void;
  initialData?: PatientKllRecord | null;
}

export const KllFormModal: React.FC<KllFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [namaPasien, setNamaPasien] = useState(initialData?.namaPasien || '');
  const [noRm, setNoRm] = useState(initialData?.noRm || '');
  const [tanggalMrs, setTanggalMrs] = useState(
    initialData?.tanggalMrs || new Date().toISOString().split('T')[0]
  );
  const [tanggalKll, setTanggalKll] = useState(
    initialData?.tanggalKll || new Date().toISOString().split('T')[0]
  );
  const [kronologi, setKronologi] = useState(initialData?.kronologi || '');
  const [penjamin, setPenjamin] = useState<PenjaminKll>(
    initialData?.penjamin || 'Jasa Raharja'
  );
  const [statusLp, setStatusLp] = useState(initialData?.statusLp || 'BELUM');
  const [isInsidenActive, setIsInsidenActive] = useState(
    initialData ? initialData.isInsidenActive : true
  );
  const [catatan, setCatatan] = useState(initialData?.catatan || '');
  const [lpFileName, setLpFileName] = useState<string | undefined>(initialData?.lpFileName);
  const [lpFileUrl, setLpFileUrl] = useState<string | undefined>(initialData?.lpFileUrl);
  const [lpFileType, setLpFileType] = useState<'pdf' | 'image' | undefined>(initialData?.lpFileType);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp)$/i);

    if (!isPdf && !isImg) {
      alert('Format file tidak didukung. Harap upload file PDF atau Gambar (JPG/PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLpFileUrl(reader.result as string);
      setLpFileName(file.name);
      setLpFileType(isPdf ? 'pdf' : 'image');
      if (statusLp === 'BELUM' || !statusLp) {
        setStatusLp(`LP DIUPLOAD - ${new Date().toLocaleDateString('id-ID')}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPasien.trim() || !noRm.trim()) {
      alert('Nama Pasien dan No. RM wajib diisi.');
      return;
    }

    const record: PatientKllRecord = {
      id: initialData?.id || `kll-${Date.now()}`,
      namaPasien: namaPasien.trim().toUpperCase(),
      noRm: noRm.trim(),
      tanggalMrs,
      tanggalKll,
      kronologi: kronologi.trim(),
      penjamin,
      statusLp: statusLp.trim() || 'BELUM',
      lpFileName,
      lpFileUrl,
      lpFileType,
      isInsidenActive,
      catatan: catatan.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialData ? 'Edit Data Pasien KLL' : 'Tambah Pasien Kecelakaan (KLL)'}
              </h3>
              <p className="text-xs text-blue-100">
                Pencatatan kasus kecelakaan lalu lintas & koordinasi penjaminan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
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
                placeholder="Contoh: SUGIONO BIN KARSIDI"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-semibold text-slate-900 uppercase"
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
                placeholder="Contoh: 14-89-21"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-semibold text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal MRS (Admission Date)
              </label>
              <input
                type="date"
                value={tanggalMrs}
                onChange={(e) => setTanggalMrs(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal KLL (Accident Date)
              </label>
              <input
                type="date"
                value={tanggalKll}
                onChange={(e) => setTanggalKll(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Penjamin Biaya
              </label>
              <select
                value={penjamin}
                onChange={(e) => setPenjamin(e.target.value as PenjaminKll)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
              >
                <option value="Jasa Raharja">Jasa Raharja (KLL Ganda/Tunggal Berjaminan)</option>
                <option value="BPJS Ketenagakerjaan">BPJS Ketenagakerjaan (Kecelakaan Kerja)</option>
                <option value="BPJS Kesehatan">BPJS Kesehatan (Sekunder / KLL Mandiri)</option>
                <option value="Umum">Umum (Biaya Pribadi / Tolak LP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Nomor LP Kepolisian
              </label>
              <input
                type="text"
                value={statusLp}
                onChange={(e) => setStatusLp(e.target.value)}
                placeholder="Contoh: BELUM atau LP/A/092/IX/2026/Lantas"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kronologi Kejadian Kecelakaan
            </label>
            <textarea
              rows={3}
              value={kronologi}
              onChange={(e) => setKronologi(e.target.value)}
              placeholder="Contoh: KLL Sepeda motor vs truk di Jl. Raya Babat - Bojonegoro. Mengalami patah tulang paha kanan..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Noted Admisi (Quick Notes)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: JR (KONFIRMASI PAK BAMBANG JR LAMONGAN - PLAFON 20JT SUDAH AKTIF)"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800 font-medium"
            />
          </div>

          {/* Upload File Section */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Upload Berkas Surat LP Digital (Opsional)
              </span>
              {lpFileName && (
                <button
                  type="button"
                  onClick={() => {
                    setLpFileUrl(undefined);
                    setLpFileName(undefined);
                    setLpFileType(undefined);
                  }}
                  className="text-[11px] text-rose-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              )}
            </div>

            {lpFileName ? (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-200 text-xs">
                <span className="font-semibold text-slate-800 truncate">{lpFileName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase font-bold">
                  {lpFileType}
                </span>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100/50 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Pilih Berkas LP (PDF / JPG / PNG)
                </button>
              </div>
            )}
          </div>

          {/* Centang Insiden Checkbox */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-950 block">
                Centang Insiden Aktif
              </span>
              <span className="text-[11px] text-amber-800">
                Tandai jika insiden masih dalam pemantauan klaim aktif atau investigasi penjamin.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isInsidenActive}
                onChange={(e) => setIsInsidenActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
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
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {initialData ? 'Simpan Perubahan' : 'Tambah Pasien'}
          </button>
        </div>
      </div>
    </div>
  );
};
