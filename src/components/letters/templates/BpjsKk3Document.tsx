import React from 'react';
import { MedicalLetterItem } from '../../../types/letterTypes';

interface TemplateProps {
  letter: MedicalLetterItem;
}

export const BpjsKk3Document: React.FC<TemplateProps> = ({ letter }) => {
  const p = letter.bpjsKk3Params || {
    namaPerusahaan: '',
    nppBpjsTk: '',
    tanggalPenyelesaianKasus: '',
    keadaanAkhirPasien: 'Sembuh tanpa cacat',
    tanggalKembaliBekerja: '',
    evaluasiMedisAkhir: ''
  };

  const tipeDokter = p.tipeDokter || 'Dokter pemeriksa';
  const hasil = p.keadaanAkhirPasien || 'Sembuh tanpa cacat';
  const kemampuan = p.kemampuanBekerja || 'Biasa';

  return (
    <div className="w-full bg-white text-black font-sans text-[9px] leading-tight print:p-0 select-text">
      {/* Header */}
      <div className="border border-black p-2 mb-1">
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
            <h1 className="font-black text-[12px] tracking-wide uppercase">
              SURAT KETERANGAN DOKTER KASUS KECELAKAAN KERJA
            </h1>
          </div>

          {/* Box Kanan Formulir */}
          <div className="border-2 border-black px-3 py-1 text-center font-bold text-[10px] shrink-0 w-36">
            <div>Formulir</div>
            <div className="text-[12px] font-black">3b KK 3</div>
            <div className="text-[8px] font-semibold">BPJS Ketenagakerjaan</div>
          </div>
        </div>
      </div>

      {/* Identitas Dokter */}
      <div className="border border-black p-1 mb-1 text-[8.5px]">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold">Dengan ini saya dokter yang memeriksa peserta BPJS Ketenagakerjaan dibawah ini :</span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${tipeDokter === 'Dokter pemeriksa' ? 'bg-black text-white text-[7px]' : ''}`}>
                {tipeDokter === 'Dokter pemeriksa' ? '✓' : ''}
              </span>
              <span>Dokter pemeriksa</span>
            </label>
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${tipeDokter === 'Dokter penasehat' ? 'bg-black text-white text-[7px]' : ''}`}>
                {tipeDokter === 'Dokter penasehat' ? '✓' : ''}
              </span>
              <span>Dokter penasehat</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-[160px_10px_1fr] gap-y-0.5">
          <span>Nama dokter</span>
          <span>:</span>
          <span className="font-bold">{p.namaDokter || letter.dokterNama || 'dr. .........................................................................'}</span>

          <span>No. telepon/Hp</span>
          <span>:</span>
          <span>{p.telpDokter || letter.noHp || '...........................................................................................'}</span>

          <span>Nama Fasilitas kesehatan</span>
          <span>:</span>
          <span className="font-semibold">{p.namaFaskes || 'RSU Muhammadiyah Babat (PLKK)'}</span>
        </div>

        <div className="font-bold mt-1">Menerangkan dengan sesungguhnya bahwa :</div>
      </div>

      {/* Main Content */}
      <div className="space-y-1">
        {/* 1. Data Peserta */}
        <div className="border border-black p-1 text-[8.5px]">
          <div className="font-bold mb-0.5">1. Data Peserta</div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-y-0.5">
            <span>Nama</span>
            <span>:</span>
            <span className="font-bold">
              {letter.jenisKelamin === 'Laki-laki' ? 'Tn ' : 'Ny / Nn '}
              {letter.namaPasien || '...................................................................................'}
            </span>

            <span>No. Peserta</span>
            <span>:</span>
            <span className="font-mono">{p.noPeserta || letter.noBpjs || '...................................................................................'}</span>

            <span>NIK / No. Paspor (WNA)</span>
            <span>:</span>
            <span className="font-mono">{p.nikPeserta || letter.nik || '...................................................................................'}</span>

            <span>Jenis Pekerjaan/jabatan</span>
            <span>:</span>
            <span>{letter.pekerjaan || '...................................................................................'}</span>
          </div>
        </div>

        {/* 2, 3, 4 */}
        <div className="border border-black p-1 text-[8.5px] grid grid-cols-[160px_10px_1fr] gap-y-0.5">
          <span className="font-bold">2. Nama Pemberi Kerja/ Mitra</span>
          <span>:</span>
          <span>{p.namaPerusahaan || '.........................................................................................................................'}</span>

          <span className="font-bold">3. Tanggal Kecelakaan</span>
          <span>:</span>
          <span>{p.tanggalKecelakaan || '............/............./.............(dd/mm/yyyy)'}</span>

          <span className="font-bold">4. Tanggal pemeriksaan</span>
          <span>:</span>
          <span>{p.tanggalPemeriksaan || letter.tanggalSurat}</span>
        </div>

        {/* 5. Anamnesa */}
        <div className="border border-black p-1 text-[8.5px]">
          <div className="font-bold mb-0.5">5. Berdasarkan anamnesa :</div>
          <div className="border border-black/40 min-h-[22px] p-1 bg-slate-50/50">
            {p.anamnesa || 'Pasien mengalami kecelakaan kerja dengan keluhan trauma dan luka saat beraktivitas kerja...'}
          </div>
        </div>

        {/* 6. Pemeriksaan Fisik + Anatomi Diagram */}
        <div className="border border-black p-1 text-[8.5px]">
          <div className="font-bold mb-0.5">6. Berdasarkan pemeriksaan fisik :</div>
          <div className="grid grid-cols-[1fr_210px] gap-2 items-center">
            <div className="border border-black/40 p-1 min-h-[70px] bg-slate-50/50 flex flex-col justify-between">
              <div>{p.pemeriksaanFisik || 'Status lokalis: Vulnus laceratum / fraktur / edema di area yang terkena trauma, evaluasi motorik dan sensorik terkontrol.'}</div>
              <div className="text-[7.5px] text-slate-500 italic mt-1">
                *Area yang mengalami cedera / luka ditandai pada bagan anatomi di sebelah kanan.
              </div>
            </div>

            {/* SVG Anatomical Human Diagram (Presisi Sesuai Form Asli) */}
            <div className="border border-black p-1 bg-white flex flex-col items-center justify-center">
              <div className="text-[7px] font-bold text-center mb-0.5">BAGAN ANATOMI TUBUH & EXTREMITAS</div>
              <svg viewBox="0 0 200 90" className="w-full h-18 stroke-black fill-none stroke-[0.8]">
                {/* Tubuh Depan */}
                <g transform="translate(15, 2)">
                  <circle cx="20" cy="8" r="6" />
                  <path d="M20 14 L20 42 M10 20 L30 20 M10 20 L5 38 M30 20 L35 38 M20 42 L13 72 M20 42 L27 72" />
                  <text x="20" y="80" textAnchor="middle" className="text-[6px] fill-black stroke-none">Depan</text>
                </g>
                {/* Tubuh Belakang */}
                <g transform="translate(65, 2)">
                  <circle cx="20" cy="8" r="6" />
                  <path d="M20 14 L20 42 M10 20 L30 20 M10 20 L5 38 M30 20 L35 38 M20 42 L13 72 M20 42 L27 72" />
                  <text x="20" y="80" textAnchor="middle" className="text-[6px] fill-black stroke-none">Belakang</text>
                </g>
                {/* Tangan & Kaki Kanan/Kiri */}
                <g transform="translate(115, 6)">
                  {/* Tangan */}
                  <rect x="0" y="0" width="16" height="32" rx="2" strokeDasharray="1,1" />
                  <text x="8" y="40" textAnchor="middle" className="text-[5px] fill-black stroke-none">Tangan Ka/Ki</text>
                  {/* Kaki */}
                  <rect x="24" y="0" width="16" height="32" rx="2" strokeDasharray="1,1" />
                  <text x="32" y="40" textAnchor="middle" className="text-[5px] fill-black stroke-none">Kaki Ka/Ki</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* 7. Penatalaksanaan Medis */}
        <div className="border border-black p-1 text-[8.5px]">
          <div className="font-bold mb-0.5">7. Penatalaksanaan atau tindakan medis yang diberikan :</div>
          <div className="border border-black/40 min-h-[20px] p-1 bg-slate-50/50">
            {p.tindakanMedis || 'Debridement luka, penjahitan (hecting), pemberian ATS / TT, analgetik, antibiotik, dan perban steril.'}
          </div>
        </div>

        {/* 8, 9. Diagnosis & Komorbiditas */}
        <div className="border border-black p-1 text-[8.5px] space-y-0.5">
          <div className="grid grid-cols-[100px_10px_1fr]">
            <span className="font-bold">8. Diagnosis</span>
            <span>:</span>
            <span className="font-bold underline">{p.diagnosis || 'Post Trauma Kecelakaan Kerja (Vulnus Laceratum / Fraktur Closed)'}</span>
          </div>
          <div className="grid grid-cols-[100px_10px_1fr]">
            <span className="font-bold">9. Komorbiditas</span>
            <span>:</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1">
                <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${p.komorbiditas !== 'ada' ? 'bg-black text-white text-[7px]' : ''}`}>
                  {p.komorbiditas !== 'ada' ? '✓' : ''}
                </span>
                <span>tidak ada</span>
              </label>
              <label className="flex items-center gap-1">
                <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${p.komorbiditas === 'ada' ? 'bg-black text-white text-[7px]' : ''}`}>
                  {p.komorbiditas === 'ada' ? '✓' : ''}
                </span>
                <span>ada, sebutkan : <span className="underline">{p.sebutkanKomorbiditas || '................................................................'}</span></span>
              </label>
            </div>
          </div>
        </div>

        {/* 10. Hasil pemeriksaan/pengobatan */}
        <div className="border border-black p-1 text-[8.5px]">
          <div className="font-bold mb-0.5">10. Hasil pemeriksaan/pengobatan :</div>
          <div className="space-y-0.5 pl-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${hasil === 'Sembuh tanpa cacat' ? 'bg-black text-white text-[7px]' : ''}`}>
                {hasil === 'Sembuh tanpa cacat' ? '✓' : ''}
              </span>
              <span>Sembuh tanpa cacat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${hasil.includes('anatomis') ? 'bg-black text-white text-[7px]' : ''}`}>
                {hasil.includes('anatomis') ? '✓' : ''}
              </span>
              <span>Cacat anatomis (sebutkan bagian yang hilang) : <span className="underline">{p.detailCacatAnatomis || '...........................................................................'}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${hasil.includes('fungsi') ? 'bg-black text-white text-[7px]' : ''}`}>
                {hasil.includes('fungsi') ? '✓' : ''}
              </span>
              <span>
                Cacat fungsi : <span className="underline">{p.detailCacatFungsi || '.............................................'}</span> % : <strong className="underline">{p.persentaseCacat || 0}%</strong> terbilang : <span className="italic underline">"{p.terbilangCacat || 'Nol Persen'}"</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${p.memerlukanProthesa ? 'bg-black text-white text-[7px]' : ''}`}>
                {p.memerlukanProthesa ? '✓' : ''}
              </span>
              <span>Memerlukan prothesa (alat pengganti anggota tubuh), sebutkan : {p.memerlukanProthesa || '...................................................'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${p.memerlukanOrthesa ? 'bg-black text-white text-[7px]' : ''}`}>
                {p.memerlukanOrthesa ? '✓' : ''}
              </span>
              <span>Memerlukan orthesa (alat penguat/penopang), sebutkan : {p.memerlukanOrthesa || '.......................................................'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${hasil.includes('Meninggal') ? 'bg-black text-white text-[7px]' : ''}`}>
                {hasil.includes('Meninggal') ? '✓' : ''}
              </span>
              <span>Meninggal dunia pada tanggal : {p.tanggalMeninggal || '......../......../........'} jam : {p.jamMeninggal || '........:........'}</span>
            </div>
          </div>
        </div>

        {/* 11, 12, 13 */}
        <div className="border border-black p-1 text-[8.5px] space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold">11. Setelah sembuh peserta dapat melakukan pekerjaan :</span>
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kemampuan === 'Biasa' ? 'bg-black text-white text-[7px]' : ''}`}>
                {kemampuan === 'Biasa' ? '✓' : ''}
              </span>
              <span>Biasa</span>
            </label>
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kemampuan === 'Ringan' ? 'bg-black text-white text-[7px]' : ''}`}>
                {kemampuan === 'Ringan' ? '✓' : ''}
              </span>
              <span>Ringan</span>
            </label>
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kemampuan.includes('Tidak') ? 'bg-black text-white text-[7px]' : ''}`}>
                {kemampuan.includes('Tidak') ? '✓' : ''}
              </span>
              <span>Tidak dapat bekerja sama sekali</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[8px]">
            <div>12. Lamanya perawatan/pengobatan : dari {p.rawatDari || letter.tanggalSurat} s/d {p.rawatSampai || letter.tanggalSurat}</div>
            <div>13. Diberikan istirahat : dari {p.istirahatDari || letter.tanggalSurat} s/d {p.istirahatSampai || letter.tanggalSurat}</div>
          </div>
        </div>

        {/* 14. Keterangan Lainnya */}
        <div className="border border-black p-1 text-[8px]">
          <span className="font-bold">14. Keterangan lainnya jika perlu :</span>
          <div className="border border-black/40 min-h-[16px] p-0.5 bg-slate-50/50 mt-0.5">
            {p.keteranganLainnya || p.evaluasiMedisAkhir || '-'}
          </div>
        </div>

        {/* TTD Dokter */}
        <div className="border border-black p-1 text-center text-[7.5px] font-medium bg-slate-50">
          Demikian surat keterangan dokter ini dibuat dengan sesungguhnya dan penuh rasa tanggung jawab serta mengingat sumpah jabatan dokter.
        </div>

        <div className="text-right pr-4 pt-1">
          <div className="text-[8px]">Kota/Kab : <span className="font-semibold underline">{p.kotaPernyataan || 'Lamongan'}</span></div>
          <div className="text-[8px]">Tanggal &nbsp;: <span className="font-semibold underline">{p.tanggalPernyataan || letter.tanggalSurat}</span></div>
          <div className="mt-1 text-center inline-block min-w-[190px]">
            <div className="h-10 border-b border-black flex items-end justify-center pb-0.5 text-[7px] text-slate-400">
              (tanda tangan dan stempel fasilitas kesehatan)
            </div>
            <div className="text-left mt-0.5 text-[8px]">
              <div>Nama Dokter : <strong className="underline">{p.namaDokter || letter.dokterNama || 'dr. ...............................................'}</strong></div>
              <div>SIP/NIP &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <span>{letter.dokterSip || '446/128/SIP/413.111/2024'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
