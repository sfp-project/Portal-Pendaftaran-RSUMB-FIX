import React from 'react';
import { MedicalLetterItem } from '../../../types/letterTypes';

interface TemplateProps {
  letter: MedicalLetterItem;
}

export const BpjsKk1Document: React.FC<TemplateProps> = ({ letter }) => {
  const p = letter.bpjsKk1Params || {
    namaPerusahaan: '',
    nppBpjsTk: '',
    tanggalKecelakaan: '',
    jamKecelakaan: '',
    tempatKecelakaan: '',
    kronologiSingkat: '',
    bagianTubuhCidera: '',
    faskesPertama: ''
  };

  const segmen = p.segmen || 'Penerima Upah (PU)';
  const upah = p.upahPeserta || 0;
  const satuanUpah = p.satuanUpah || 'per bulan';
  const tempatTipe = p.tempatKejadianTipe || 'dalam lokasi kerja';
  const akibat = p.akibatDiderita || 'Cedera/Luka';
  const faskesTipe = p.jenisFaskesPertama || 'Jaringan PLKK';
  const transportasi = p.transportasiPertama || 'Darat/sungai/danau';

  return (
    <div className="w-full bg-white text-black font-sans text-[10px] leading-tight print:p-0 select-text">
      {/* Header Container */}
      <div className="border border-black p-2 mb-1.5">
        <div className="flex items-start justify-between gap-2">
          {/* Logo BPJS Ketenagakerjaan */}
          <div className="flex items-center gap-2 w-48 shrink-0">
            <div className="w-8 h-8 rounded-full border border-emerald-600 flex items-center justify-center bg-emerald-50">
              <span className="text-emerald-700 font-black text-xs">BPJS</span>
            </div>
            <div>
              <div className="font-extrabold text-[12px] text-emerald-700 leading-none tracking-tight">BPJS</div>
              <div className="font-bold text-[9px] text-sky-800 leading-none">Ketenagakerjaan</div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center flex-grow">
            <h1 className="font-black text-[13px] tracking-wide uppercase">
              LAPORAN KASUS KECELAKAAN KERJA
            </h1>
            <h2 className="font-black text-[12px] uppercase tracking-wider">TAHAP I</h2>
          </div>

          {/* Box Kanan Formulir */}
          <div className="border-2 border-black px-3 py-1 text-center font-bold text-[10px] shrink-0 w-36">
            <div>Formulir</div>
            <div className="text-[12px] font-black">3 KK 1</div>
            <div className="text-[8px] font-semibold">BPJS Ketenagakerjaan</div>
          </div>
        </div>

        {/* Segmen Kepesertaan */}
        <div className="mt-2 pt-1 border-t border-black/40 flex items-center justify-between text-[9.5px]">
          <span className="font-bold">Segmen Kepesertaan :</span>
          <label className="flex items-center gap-1 cursor-default">
            <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${segmen.includes('PU') && !segmen.includes('Bukan') ? 'bg-black text-white text-[9px]' : ''}`}>
              {segmen.includes('PU') && !segmen.includes('Bukan') ? '✓' : ''}
            </span>
            <span>Penerima Upah (PU)</span>
          </label>
          <label className="flex items-center gap-1 cursor-default">
            <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${segmen.includes('Bukan') ? 'bg-black text-white text-[9px]' : ''}`}>
              {segmen.includes('Bukan') ? '✓' : ''}
            </span>
            <span>Bukan Penerima Upah (BPU)</span>
          </label>
          <label className="flex items-center gap-1 cursor-default">
            <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${segmen.includes('JAKON') ? 'bg-black text-white text-[9px]' : ''}`}>
              {segmen.includes('JAKON') ? '✓' : ''}
            </span>
            <span>Jasa Konstruksi (JAKON)</span>
          </label>
          <label className="flex items-center gap-1 cursor-default">
            <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${segmen.includes('PMI') ? 'bg-black text-white text-[9px]' : ''}`}>
              {segmen.includes('PMI') ? '✓' : ''}
            </span>
            <span>Pekerja Migran Indonesia (PMI)</span>
          </label>
        </div>
      </div>

      {/* Blue Banner Info */}
      <div className="bg-sky-100/80 border border-sky-300 text-sky-950 font-bold text-center py-1 text-[9.5px] mb-1.5">
        <div>Laporan Kasus Kecelakaan Kerja Tahap I</div>
        <div className="font-semibold text-[8.5px]">Wajib dilaporkan dalam waktu 2 X 24 Jam sejak terjadi kasus kecelakaan kerja</div>
      </div>

      {/* Content Form Body */}
      <div className="space-y-1.5">
        {/* 1. Data Pemberi Kerja */}
        <div className="border border-black p-1.5">
          <div className="font-bold text-[10px] mb-1">1. Data Pemberi Kerja/ Wadah/ Mitra/ Pelaksana Penempatan</div>
          <div className="grid grid-cols-[180px_10px_1fr] gap-y-0.5 text-[9.5px]">
            <span>Nama</span>
            <span>:</span>
            <span className="font-medium">{p.namaPerusahaan || '...........................................................................................................'}</span>

            <span>NPP / NPW / Nomor Proyek</span>
            <span>:</span>
            <span className="font-mono">{p.nppBpjsTk || '...........................................................................................................'}</span>

            <span>Alamat</span>
            <span>:</span>
            <span>{p.alamatPerusahaan || '...........................................................................................................'}</span>

            <span>No. Telepon/ HP</span>
            <span>:</span>
            <span>{p.telpPerusahaan || '(..............)....................................../.....................................................'}</span>

            <span>Nama Kontak Personil</span>
            <span>:</span>
            <span>{p.kontakPersonil || '...........................................................................................................'}</span>

            <span>Alamat email</span>
            <span>:</span>
            <span>{p.emailPerusahaan || '...........................................................................................................'}</span>
          </div>
        </div>

        {/* 2. Data Peserta */}
        <div className="border border-black p-1.5">
          <div className="font-bold text-[10px] mb-1">2. Data Peserta</div>
          <div className="grid grid-cols-[180px_10px_1fr] gap-y-0.5 text-[9.5px]">
            <span>Nama</span>
            <span>:</span>
            <span className="font-bold">
              {letter.jenisKelamin === 'Laki-laki' ? 'Tn ' : 'Ny / Nn '}
              {letter.namaPasien || '...........................................................................................'}
            </span>

            <span>No. Peserta</span>
            <span>:</span>
            <span className="font-mono">{p.noPeserta || letter.noBpjs || '...........................................................................................'}</span>

            <span>NIK / No. Paspor (WNA/PMI)</span>
            <span>:</span>
            <span className="font-mono">{p.nikPeserta || letter.nik || '...........................................................................................'}</span>

            <span>Tanggal Lahir</span>
            <span>:</span>
            <span>{letter.tanggalLahir || '…............/.............../................. (dd/mm/yyyy)'}</span>

            <span>Alamat Domisili dan no. telepon</span>
            <span>:</span>
            <span>{letter.alamat || '...................................................................................'} no telp: {letter.noHp || '...................'}</span>

            <span>Jenis Pekerjaan/jabatan</span>
            <span>:</span>
            <span>{p.jabatanPeserta || letter.pekerjaan || '............................................................/..............................................'}</span>
          </div>
        </div>

        {/* 3. Upah Peserta */}
        <div className="border border-black p-1.5 flex items-center justify-between text-[9.5px]">
          <div className="flex items-center gap-2">
            <span className="font-bold">3. Upah Peserta *)</span>
            <span>:</span>
            <span className="font-mono font-bold">
              {upah > 0 ? `Rp ${upah.toLocaleString('id-ID')}` : 'Rp .............................................'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${satuanUpah === 'per hari' ? 'bg-black text-white text-[8px]' : ''}`}>
                {satuanUpah === 'per hari' ? '✓' : ''}
              </span>
              <span>per hari</span>
            </label>
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${satuanUpah === 'per bulan' ? 'bg-black text-white text-[8px]' : ''}`}>
                {satuanUpah === 'per bulan' ? '✓' : ''}
              </span>
              <span>per bulan</span>
            </label>
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${satuanUpah === 'borongan' ? 'bg-black text-white text-[8px]' : ''}`}>
                {satuanUpah === 'borongan' ? '✓' : ''}
              </span>
              <span>borongan**</span>
            </label>
          </div>
        </div>

        {/* 4. Tempat kejadian kecelakaan */}
        <div className="border border-black p-1.5 text-[9.5px]">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold">4. Tempat kejadian kecelakaan :</div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1">
                <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${tempatTipe === 'dalam lokasi kerja' ? 'bg-black text-white text-[8px]' : ''}`}>
                  {tempatTipe === 'dalam lokasi kerja' ? '✓' : ''}
                </span>
                <span>dalam lokasi kerja</span>
              </label>
              <label className="flex items-center gap-1">
                <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${tempatTipe === 'luar lokasi kerja' ? 'bg-black text-white text-[8px]' : ''}`}>
                  {tempatTipe === 'luar lokasi kerja' ? '✓' : ''}
                </span>
                <span>luar lokasi kerja</span>
              </label>
              <label className="flex items-center gap-1">
                <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${tempatTipe === 'lalu-lintas' ? 'bg-black text-white text-[8px]' : ''}`}>
                  {tempatTipe === 'lalu-lintas' ? '✓' : ''}
                </span>
                <span>lalu-lintas ***</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-[180px_10px_1fr] gap-y-0.5">
            <span>Alamat tempat kejadian</span>
            <span>:</span>
            <span>{p.alamatKejadian || p.tempatKecelakaan || '.............................................................................................................'}</span>

            <span>Tanggal dan jam Kecelakaan</span>
            <span>:</span>
            <span>tanggal : {p.tanggalKecelakaan || '............/............./.............(dd/mm/yyyy)'} jam : {p.jamKecelakaan || '……:......(hr: mn)'}</span>

            <span>Waktu kejadian (khusus PMI)</span>
            <span>:</span>
            <div className="flex items-center gap-3">
              <span>[ ] sebelum penempatan</span>
              <span>[ ] sesudah penempatan</span>
              <span>[ ] selama penempatan (negara: {p.negaraPmi || '..............'})</span>
            </div>
          </div>
        </div>

        {/* 5. Uraian / Kronologis kejadian */}
        <div className="border border-black p-1.5">
          <div className="font-bold text-[10px] mb-0.5">5. Uraian / Kronologis kejadian :</div>
          <div className="border border-black/70 min-h-[44px] p-1.5 text-[9.5px] bg-slate-50/50">
            {p.kronologiSingkat || 'Kronologi kejadian kecelakaan kerja...'}
          </div>
          <div className="text-[8px] italic text-right mt-0.5 text-slate-600">
            Uraian kejadian kecelakaan lebih lengkap dapat ditambahkan di lampiran tersendiri
          </div>
        </div>

        {/* 6. Akibat yang diderita */}
        <div className="border border-black p-1.5 text-[9.5px]">
          <div className="font-bold mb-1">6. Akibat yang diderita :</div>
          <div className="space-y-1 pl-4">
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${akibat === 'Cedera/Luka' ? 'bg-black text-white text-[9px]' : ''}`}>
                {akibat === 'Cedera/Luka' ? '✓' : ''}
              </span>
              <span>Cedera/ Luka, bagian tubuh :</span>
              <span className="font-semibold underline">{p.bagianTubuhCidera || '.................................................................... (sebutkan)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 border border-black inline-flex items-center justify-center font-bold ${akibat === 'Meninggal Dunia' ? 'bg-black text-white text-[9px]' : ''}`}>
                {akibat === 'Meninggal Dunia' ? '✓' : ''}
              </span>
              <span>Meninggal Dunia</span>
            </div>
          </div>
        </div>

        {/* 7. Layanan Pertolongan Pertama */}
        <div className="border border-black p-1.5 text-[9.5px]">
          <div className="font-bold mb-1">7. Layanan Pertolongan Pertama :</div>
          <div className="grid grid-cols-[120px_1fr] gap-y-1 pl-4">
            <span className="font-semibold">Jenis Faskes :</span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${faskesTipe === 'Jaringan PLKK' ? 'bg-black text-white text-[8px]' : ''}`}>
                  {faskesTipe === 'Jaringan PLKK' ? '✓' : ''}
                </span>
                <span>Jaringan PLKK, sebutkan: <strong className="underline">{p.faskesPertama || 'RSU Muhammadiyah Babat'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 border border-black inline-block" />
                <span>Rumah Sakit/Klinik/Puskesmas tidak kerjasama, sebutkan ….............................</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 border border-black inline-block" />
                <span>Lain lain, sebutkan …....................................</span>
              </div>
            </div>

            <span className="font-semibold">Transportasi :</span>
            <div className="flex items-center gap-4">
              <span>[ ] Laut</span>
              <span>[ ] Udara</span>
              <span className="font-medium">[✓] Darat/sungai/danau, sebutkan: <strong className="underline">{p.detailTransportasi || 'Ambulans / Kendaraan Bermotor'}</strong></span>
            </div>
          </div>
        </div>

        {/* 8. Persyaratan yang diperlukan */}
        <div className="border border-black p-1.5 text-[9px]">
          <div className="font-bold mb-0.5">8. Persyaratan yang diperlukan :</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[7px]">✓</span>
              <span>Fotokopi Kartu peserta BPJS Ketenagakerjaan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[7px]">✓</span>
              <span>Fotokopi Kartu Tanda Penduduk (KTP) bagi WNI / Paspor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-black inline-block" />
              <span>Formulir Pendaftaran Proyek Jakon & bukti iuran</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[7px]">✓</span>
              <span>Dokumen pendukung lain apabila diperlukan</span>
            </div>
          </div>
        </div>

        {/* Pernyataan Hukum */}
        <div className="border border-black p-1.5 text-center text-[8.5px] leading-tight font-medium bg-slate-50">
          Dengan ini saya menyatakan bahwa data dan keterangan yang saya sampaikan kepada BPJS Ketenagakerjaan adalah benar dan bersedia memberikan informasi perkembangan kondisi Peserta paling lama 14 (empat belas) hari kerja apabila BPJS Ketenagakerjaan meminta informasi dimaksud. Apabila data yang diberikan tidak benar, saya bersedia bertanggung jawab sesuai peraturan perundangan yang berlaku.
        </div>

        {/* Tanda Tangan & Peruntukan Lembar */}
        <div className="grid grid-cols-2 gap-4 text-[8.5px] pt-1 items-end">
          <div>
            <div className="font-bold">Keterangan :</div>
            <div className="text-[8px] text-slate-700 space-y-0.5">
              <div>Laporan ini diperuntukkan :</div>
              <div>- Lembar pertama : BPJS Ketenagakerjaan</div>
              <div>- Lembar kedua : Dinas Tenaga Kerja Setempat</div>
              <div>- Lembar ketiga : Pusat Layanan Kecelakaan Kerja (PLKK)</div>
              <div>- Lembar keempat : Perusahaan</div>
              <div className="pt-1 text-[7.5px] text-slate-500 leading-none">
                *) Upah peserta adalah upah yang diterima Peserta pada saat terjadi KK/PAK<br />
                **) upah sebulan bagi borongan = upah rata-rata 3 bulan terakhir<br />
                ***) lampirkan Laporan Polisi / kronologis kejadian diketahui 2 orang saksi
              </div>
            </div>
          </div>

          <div className="text-right pr-4">
            <div>Kota/kab : <span className="font-semibold underline">{p.kotaPernyataan || 'Lamongan'}</span></div>
            <div>Tanggal : <span className="font-semibold underline">{p.tanggalPernyataan || letter.tanggalSurat}</span></div>
            <div className="mt-2 text-center inline-block min-w-[180px]">
              <div className="h-10 border-b border-black flex items-end justify-center pb-0.5 text-[8px] text-slate-400">
                (tanda tangan dan stempel perusahaan)
              </div>
              <div className="text-left mt-0.5">
                <div>Nama &nbsp;&nbsp;&nbsp;&nbsp;: <strong className="underline">{p.namaPenandatangan || '.......................................'}</strong></div>
                <div>Jabatan &nbsp;: <strong>{p.jabatanPenandatangan || 'HRD / Personalia'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
