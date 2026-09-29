import React from 'react';
import { MedicalLetterItem } from '../../../types/letterTypes';

interface TemplateProps {
  letter: MedicalLetterItem;
}

export const GagalFingerprintDocument: React.FC<TemplateProps> = ({ letter }) => {
  const p = letter.gagalFingerprintParams || {
    alasanGagal: 'Sidik jari rusak / luka / perban',
    penanggungJawabKlaim: 'Petugas Admisi',
    namaPetugas: '',
    tujuanPoli: '',
    namaPenjamin: '',
    hubunganPenjamin: '',
    pernyataanKebenaran: true
  };

  const rmDigits = (letter.noRm || '').replace(/\D/g, '').padStart(6, '0').slice(-6).split('');

  const genderPj = p.genderPenanggungJawab || 'Lk';
  const genderPasien = letter.jenisKelamin === 'Perempuan' ? 'Pr' : 'Lk';
  const hubungan = p.hubunganPenanggungJawab || (p.hubunganPenjamin as any) || 'Suami';
  const layanan = p.layananTipe || 'Klinik';

  return (
    <div className="w-full bg-white text-black font-sans text-[11px] leading-relaxed p-6 print:p-0 select-text">
      {/* Kop Surat RSU Muhammadiyah Babat */}
      <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-800">
        <div className="w-14 h-14 rounded-full border-2 border-emerald-700 flex items-center justify-center bg-emerald-50 text-emerald-800 font-bold text-center text-[7.5px] shrink-0 leading-tight">
          RSU MUHAMMADIYAH BABAT
        </div>
        <div className="flex-grow text-center">
          <h1 className="font-extrabold text-[16px] text-emerald-900 tracking-wide uppercase">
            RSU MUHAMMADIYAH BABAT
          </h1>
          <div className="font-serif italic text-emerald-700 text-[10px]">
            Melayani dengan Profesional, Santun dan Berdedikasi
          </div>
          <div className="text-[9px] text-slate-700">
            Jalan Raya Babat-Surabaya Km. 4 Babat-Lamongan Email : rsumbabat@gmail.com
          </div>
        </div>
      </div>

      {/* Judul Box */}
      <div className="text-center my-4">
        <h2 className="font-black text-[13px] tracking-wider uppercase inline-block">
          PERNYATAAN TIDAK BISA REKAM SIDIK JARI
        </h2>
        <div className="mt-1">
          <span className="border border-black px-3 py-0.5 text-[9.5px] italic">
            Diisi oleh Profesional Pemberi Asuhan/Pasien/Keluarga
          </span>
        </div>
      </div>

      {/* Identitas Pengisi */}
      <div className="space-y-1.5 mb-2">
        <p className="font-medium">Yang bertanda tangan dibawah ini :</p>

        <div className="pl-4 space-y-1">
          <div className="grid grid-cols-[140px_10px_1fr] items-center">
            <span>Nama</span>
            <span>:</span>
            <div className="flex items-center justify-between">
              <span className="font-bold underline">{p.namaPenanggungJawab || p.namaPenjamin || '.......................................................................'}</span>
              <div className="flex items-center gap-3 text-[10px]">
                <label className="flex items-center gap-1">
                  <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${genderPj === 'Lk' ? 'bg-black text-white text-[8px]' : ''}`}>
                    {genderPj === 'Lk' ? '✓' : ''}
                  </span>
                  <span>Lk.</span>
                </label>
                <label className="flex items-center gap-1">
                  <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${genderPj === 'Pr' ? 'bg-black text-white text-[8px]' : ''}`}>
                    {genderPj === 'Pr' ? '✓' : ''}
                  </span>
                  <span>Pr.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr]">
            <span>Tgl lahir</span>
            <span>:</span>
            <span>{p.tglLahirPenanggungJawab || '.....................................................................................................................'}</span>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr]">
            <span>Alamat</span>
            <span>:</span>
            <span>{p.alamatPenanggungJawab || letter.alamat || '.....................................................................................................................'}</span>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr]">
            <span>No. Telepon</span>
            <span>:</span>
            <span>{p.noTelpPenanggungJawab || letter.noHp || '.....................................................................................................................'}</span>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr] items-center">
            <span>Hubungan dengan pasien</span>
            <span>:</span>
            <div className="flex items-center gap-3 flex-wrap text-[10px]">
              {['Ayah', 'Ibu', 'Suami', 'Istri', 'Anak'].map((rel) => (
                <label key={rel} className="flex items-center gap-1">
                  <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${hubungan === rel ? 'bg-black text-white text-[8px]' : ''}`}>
                    {hubungan === rel ? '✓' : ''}
                  </span>
                  <span>{rel}</span>
                </label>
              ))}
              <label className="flex items-center gap-1">
                <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${!['Ayah', 'Ibu', 'Suami', 'Istri', 'Anak'].includes(hubungan) ? 'bg-black text-white text-[8px]' : ''}`}>
                  {!['Ayah', 'Ibu', 'Suami', 'Istri', 'Anak'].includes(hubungan) ? '✓' : ''}
                </span>
                <span>Lainnya : {p.hubunganLainnya || (['Ayah', 'Ibu', 'Suami', 'Istri', 'Anak'].includes(hubungan) ? '..............' : hubungan)}</span>
              </label>
            </div>
          </div>
        </div>

        <p className="font-semibold pt-1">dari pasien :</p>

        {/* Data Pasien dengan Box 6 Digit No. RM */}
        <div className="pl-4 space-y-1">
          <div className="grid grid-cols-[140px_10px_1fr] items-center">
            <span>No. Rekam Medis</span>
            <span>:</span>
            <div className="flex items-center gap-1">
              {rmDigits.map((digit, idx) => (
                <span key={idx} className="w-5 h-6 border-2 border-black inline-flex items-center justify-center font-mono font-bold text-sm bg-slate-50">
                  {digit}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr]">
            <span>Nomor Kartu (BPJS)</span>
            <span>:</span>
            <span className="font-mono font-bold">{p.nomorKartuBpjs || letter.noBpjs || '.....................................................................................................................'}</span>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr] items-center">
            <span>Nama</span>
            <span>:</span>
            <div className="flex items-center justify-between">
              <span className="font-bold underline">{p.namaPasien || letter.namaPasien}</span>
              <div className="flex items-center gap-3 text-[10px]">
                <label className="flex items-center gap-1">
                  <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${genderPasien === 'Lk' ? 'bg-black text-white text-[8px]' : ''}`}>
                    {genderPasien === 'Lk' ? '✓' : ''}
                  </span>
                  <span>Lk.</span>
                </label>
                <label className="flex items-center gap-1">
                  <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${genderPasien === 'Pr' ? 'bg-black text-white text-[8px]' : ''}`}>
                    {genderPasien === 'Pr' ? '✓' : ''}
                  </span>
                  <span>Pr.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr]">
            <span>Tgl lahir</span>
            <span>:</span>
            <span>{letter.tanggalLahir || '.....................................................................................................................'}</span>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr] items-center">
            <span>Dirawat/Dilayani</span>
            <span>:</span>
            <div className="flex items-center gap-4 text-[10px]">
              <label className="flex items-center gap-1">
                <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${layanan === 'IGD' ? 'bg-black text-white text-[8px]' : ''}`}>
                  {layanan === 'IGD' ? '✓' : ''}
                </span>
                <span>IGD</span>
              </label>
              <label className="flex items-center gap-1">
                <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${layanan === 'Ruang' ? 'bg-black text-white text-[8px]' : ''}`}>
                  {layanan === 'Ruang' ? '✓' : ''}
                </span>
                <span>Ruang : {layanan === 'Ruang' ? <strong className="underline">{p.namaLayanan || 'Rawat Inap'}</strong> : '..................................'}</span>
              </label>
              <label className="flex items-center gap-1">
                <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${layanan === 'Klinik' ? 'bg-black text-white text-[8px]' : ''}`}>
                  {layanan === 'Klinik' ? '✓' : ''}
                </span>
                <span>Klinik : {layanan === 'Klinik' ? <strong className="underline">{p.tujuanPoli || p.namaLayanan || 'Poli Umum'}</strong> : '..................................'}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Alasan Kesulitan Rekam Sidik Jari */}
      <div className="my-4 border border-black p-3 bg-slate-50/70">
        <p className="leading-relaxed">
          Menyatakan bahwa pasien tersebut kesulitan rekam sidik jari (finger print) dikarenakan :
        </p>
        <div className="font-bold underline text-[12px] text-emerald-950 mt-1 pl-2">
          {p.alasanKesulitan || p.alasanKustom || p.alasanGagal || 'Sidik jari terkelupas / luka / pasien kondisi gawat darurat / penurunan kesadaran.'}
        </div>
      </div>

      {/* Kalimat Penutup */}
      <p className="mb-6 leading-relaxed">
        Demikian pernyataan tidak bisa rekam sidik jari ini saya buat dengan penuh kesadaran dan tanpa paksaan.
      </p>

      {/* 3 Area Tanda Tangan Sesuai Dokumen Asli */}
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="h-6">Pasien/keluarga Penanggung jawab</div>
            <div className="h-16 flex items-end justify-center">
              {/* Tempat TTD */}
            </div>
            <div className="border-t border-black font-semibold pt-1">
              ( Nama Terang dan Tanda Tangan )
            </div>
            <div className="text-[10px] text-slate-700 mt-0.5">
              {p.namaPenanggungJawab || p.namaPenjamin || letter.namaPasien}
            </div>
          </div>

          <div>
            <div className="h-6">
              Babat, {letter.tanggalSurat ? new Date(letter.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '..........................'}
            </div>
            <div className="h-16 flex items-end justify-center font-semibold">
              Petugas
            </div>
            <div className="border-t border-black font-semibold pt-1">
              ( Nama Terang dan Tanda Tangan )
            </div>
            <div className="text-[10px] text-slate-700 mt-0.5">
              {p.namaPetugas || letter.dokterNama}
            </div>
          </div>
        </div>

        {/* Tanda Tangan Tengah: Mengetahui PIC Klaim */}
        <div className="mt-6 text-center max-w-xs mx-auto">
          <div>Mengetahui</div>
          <div className="font-semibold">PIC Klaim</div>
          <div className="h-16 flex items-end justify-center">
            {/* Tempat TTD */}
          </div>
          <div className="border-t border-black font-semibold pt-1">
            ( Nama Terang dan Tanda Tangan )
          </div>
          <div className="text-[10px] text-slate-700 mt-0.5">
            {p.namaPicKlaim || 'Verifikator BPJS RSUMB'}
          </div>
        </div>
      </div>

      {/* Footer Jaringan Rumah Sakit Muhammadiyah Jawa Timur */}
      <div className="mt-8 border border-emerald-700 p-2 text-center text-emerald-950 bg-emerald-50 text-[8.5px] leading-tight">
        <div className="font-extrabold tracking-wider uppercase text-[9px] mb-0.5">
          JARINGAN RUMAH SAKIT MUHAMMADIYAH JAWA TIMUR
        </div>
        <div className="text-slate-700">
          Gresik, Surabaya, Sidoarjo, Mojokerto, Jombang, Nganjuk, Kediri, Madiun, Ponorogo, Probolinggo, Banyuwangi, Sumenep, Malang, Blitar, Lamongan, Bojonegoro, Tuban
        </div>
      </div>
    </div>
  );
};
