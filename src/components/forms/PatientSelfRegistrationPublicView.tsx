import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  CheckCircle2,
  Send,
  Building2,
  HeartHandshake,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { RSUMB_LOGO_BASE64 } from '../../assets/logoRsumbBase64';
import { PatientSelfRegistrationItem } from '../../types';
import { savePatientSelfRegistrationDoc } from '../../services/firestoreSync';

interface PatientSelfRegistrationPublicViewProps {
  onBackToPortal?: () => void;
}

export const PatientSelfRegistrationPublicView: React.FC<PatientSelfRegistrationPublicViewProps> = ({
  onBackToPortal
}) => {
  const [statusPasien, setStatusPasien] = useState<'Baru' | 'Lama'>('Baru');
  const [namaPasien, setNamaPasien] = useState('');
  const [nik, setNik] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>('L');
  const [alamat, setAlamat] = useState('');
  const [noHp, setNoHp] = useState('');
  const [namaPenanggungJawab, setNamaPenanggungJawab] = useState('');
  const [hubunganKeluarga, setHubunganKeluarga] = useState('Diri Sendiri');
  const [jenisPembayaran, setJenisPembayaran] = useState<'BPJS Kesehatan' | 'UMUM' | 'Asuransi Swasta'>('BPJS Kesehatan');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<PatientSelfRegistrationItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!namaPasien.trim()) {
      setErrorMessage('Mohon isi Nama Lengkap Pasien!');
      return;
    }
    if (!alamat.trim()) {
      setErrorMessage('Mohon isi Alamat Lengkap Pasien!');
      return;
    }
    if (!noHp.trim()) {
      setErrorMessage('Mohon isi Nomor HP / WhatsApp aktif untuk konfirmasi antrean!');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const waktuFormatted = `${now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

      const newItem: PatientSelfRegistrationItem = {
        id: `self-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        statusPasien,
        namaPasien: namaPasien.trim().toUpperCase(),
        nik: nik.trim() || '-',
        tempatLahir: tempatLahir.trim(),
        tanggalLahir: tanggalLahir ? tanggalLahir : undefined,
        jenisKelamin,
        alamat: alamat.trim(),
        noHp: noHp.trim(),
        namaPenanggungJawab: namaPenanggungJawab.trim() || undefined,
        hubunganKeluarga: hubunganKeluarga || undefined,
        jenisPembayaran,
        waktuDaftar: waktuFormatted,
        statusProses: 'Menunggu'
      };

      await savePatientSelfRegistrationDoc(newItem);
      setSubmittedItem(newItem);
    } catch (err) {
      console.error('Gagal mengirim pendaftaran mandiri:', err);
      setErrorMessage('Terjadi kendala saat mengirim data. Pastikan koneksi internet stabil dan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedItem(null);
    setNamaPasien('');
    setNik('');
    setTempatLahir('');
    setTanggalLahir('');
    setAlamat('');
    setNoHp('');
    setNamaPenanggungJawab('');
    setHubunganKeluarga('Diri Sendiri');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 font-sans">
      {/* Container Lebar Khusus Layar Smartphone & Desktop */}
      <div className="w-full max-w-xl mx-auto space-y-4">
        {/* Tombol Kembali ke Portal (Opsional untuk Staf/Admin) */}
        {onBackToPortal && (
          <button
            type="button"
            onClick={onBackToPortal}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors cursor-pointer bg-white/10 px-3 py-1.5 rounded-xl border border-white/15"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama Admisi</span>
          </button>
        )}

        {/* 1. Header Resmi RSU Muhammadiyah Babat */}
        <div className="bg-gradient-to-r from-[#005d42] via-[#004a35] to-[#013526] rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-500/30 text-center relative overflow-hidden">
          <div className="flex flex-col items-center gap-2 relative z-10">
            <img
              src={RSUMB_LOGO_BASE64}
              alt="Logo RSUMB"
              className="w-16 h-16 object-contain rounded-full bg-white p-1 ring-4 ring-emerald-400/30 shadow-md"
            />
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold tracking-widest text-emerald-300 uppercase">
                RSU MUHAMMADIYAH BABAT
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Pendaftaran Mandiri Pasien
              </h1>
              <p className="text-xs text-emerald-100/90 max-w-md mx-auto leading-relaxed">
                Silakan lengkapi data identitas Anda di bawah ini untuk persiapan berkas dan antrean di Loket Admisi RSUMB.
              </p>
            </div>
          </div>

          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* 2. Tampilan Sukses Setelah Kirim Data */}
        {submittedItem ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-emerald-300 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-emerald-700 tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Alhamdulillah &bull; Data Berhasil Terkirim
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                Terima Kasih, Data Anda Telah Diterima!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Data pendaftaran telah terkirim secara <strong className="text-emerald-800">real-time</strong> ke layar komputer petugas loket pendaftaran RSU Muhammadiyah Babat.
              </p>
            </div>

            {/* Ringkasan Tiket Pendaftaran */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Status Pasien:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Pasien {submittedItem.statusPasien}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Nama Lengkap:</span>
                <span className="font-extrabold text-slate-950 text-right">{submittedItem.namaPasien}</span>
              </div>
              {submittedItem.nik && submittedItem.nik !== '-' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">NIK:</span>
                  <span className="font-mono font-semibold text-slate-800">{submittedItem.nik}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">No. HP / WhatsApp:</span>
                <span className="font-mono font-semibold text-slate-800">{submittedItem.noHp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Jenis Pembayaran:</span>
                <span className="font-bold text-emerald-800">{submittedItem.jenisPembayaran}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px] text-slate-400">
                <span>Waktu Pengiriman:</span>
                <span>{submittedItem.waktuDaftar}</span>
              </div>
            </div>

            {/* Petunjuk Langkah Selanjutnya */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 text-xs text-left space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-amber-700" />
                <span>Langkah Selanjutnya di Rumah Sakit:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-amber-950/90">
                <li>Silakan menuju ke <strong>Meja Loket Pendaftaran Lt. 1</strong>.</li>
                <li>Sampaikan kepada petugas bahwa Anda sudah mengisi formulir mandiri lewat QR Code atas nama: <strong className="underline">{submittedItem.namaPasien}</strong>.</li>
                <li>Petugas admisi akan langsung mencetak formulir & memproses penerbitan antrean poli / SEP BPJS Anda.</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md"
            >
              Isi Formulir Pasien Lain
            </button>
          </div>
        ) : (
          /* 3. Formulir Pendaftaran Publik */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xl border border-slate-200 space-y-4"
          >
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Status Pasien */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Status Kunjungan Pasien <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatusPasien('Baru')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    statusPasien === 'Baru'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${statusPasien === 'Baru' ? 'border-white' : 'border-slate-400'}`}>
                    {statusPasien === 'Baru' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span>Pasien Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusPasien('Lama')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    statusPasien === 'Lama'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${statusPasien === 'Lama' ? 'border-white' : 'border-slate-400'}`}>
                    {statusPasien === 'Lama' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span>Pasien Lama (Pernah Berobat)</span>
                </button>
              </div>
            </div>

            {/* 2. Nama Lengkap Pasien */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Nama Lengkap Pasien <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Contoh: AHMAD FAUZI"
                  value={namaPasien}
                  onChange={(e) => setNamaPasien(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[10px] text-slate-500">Sesuai nama pada KTP / Kartu Keluarga</span>
            </div>

            {/* 3. NIK KTP (Jika Ada) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Nomor Induk Kependudukan (NIK) <span className="text-slate-400 font-normal">(Jika Ada / Boleh Kosong)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Contoh: 3524xxxxxxxxxxxx (16 Digit)"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 4. Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Tempat Lahir</label>
                <input
                  type="text"
                  placeholder="Contoh: Lamongan"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Tanggal Lahir</label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 5. Jenis Kelamin */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setJenisKelamin('L')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                    jenisKelamin === 'L'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>👨 Laki-laki (L)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJenisKelamin('P')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                    jenisKelamin === 'P'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>👩 Perempuan (P)</span>
                </button>
              </div>
            </div>

            {/* 6. Alamat Lengkap */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Alamat Lengkap Pasien <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="RT/RW, Dusun/Desa, Kecamatan, Kabupaten (Contoh: RT 02 RW 01 Desa Plaosan, Kec. Babat, Lamongan)"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
              />
            </div>

            {/* 7. No. HP / WhatsApp */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                No. HP / WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[10px] text-slate-500">Nomor ini digunakan untuk konfirmasi antrean dan panggilan periksa dokter</span>
            </div>

            {/* 8. Penanggung Jawab & Hubungan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Nama Penanggung Jawab</label>
                <input
                  type="text"
                  placeholder="Nama pengantar/keluarga"
                  value={namaPenanggungJawab}
                  onChange={(e) => setNamaPenanggungJawab(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Hubungan Keluarga</label>
                <select
                  value={hubunganKeluarga}
                  onChange={(e) => setHubunganKeluarga(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="Diri Sendiri">Diri Sendiri</option>
                  <option value="Orang Tua (Ayah/Ibu)">Orang Tua (Ayah/Ibu)</option>
                  <option value="Suami / Istri">Suami / Istri</option>
                  <option value="Anak">Anak</option>
                  <option value="Saudara Kandung">Saudara Kandung</option>
                  <option value="Wali / Lainnya">Wali / Lainnya</option>
                </select>
              </div>
            </div>

            {/* 9. Jenis Pembayaran */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                Rencana Penjaminan / Pembayaran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setJenisPembayaran('BPJS Kesehatan')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    jenisPembayaran === 'BPJS Kesehatan'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>BPJS Kesehatan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisPembayaran('UMUM')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    jenisPembayaran === 'UMUM'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>UMUM / Pribadi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisPembayaran('Asuransi Swasta')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    jenisPembayaran === 'Asuransi Swasta'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Asuransi Lain</span>
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-sm font-black shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengirim Data ke Admisi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>KIRIM IDENTITAS PASIEN</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 text-center pt-1">
              Data Anda terenkripsi aman dan hanya digunakan untuk keperluan pelayanan medis RSU Muhammadiyah Babat.
            </div>
          </form>
        )}

        {/* Footer Kecil */}
        <div className="text-center text-[10px] text-slate-400 py-3 space-y-0.5">
          <div>RSU Muhammadiyah Babat &bull; Jl. Raya Babat-Surabaya KM. 4, Babat, Lamongan</div>
          <div>Layanan Pendaftaran & Informasi 24 Jam: (0322) 451125 / WA: 0857-8407-2740</div>
        </div>
      </div>
    </div>
  );
};
