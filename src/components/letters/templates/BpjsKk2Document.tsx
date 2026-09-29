import React from 'react';
import { MedicalLetterItem } from '../../../types/letterTypes';

interface TemplateProps {
  letter: MedicalLetterItem;
}

export const BpjsKk2Document: React.FC<TemplateProps> = ({ letter }) => {
  const p = letter.bpjsKk2Params || {
    namaPerusahaan: '',
    nppBpjsTk: '',
    tanggalPemeriksaan: '',
    diagnosaKecelakaanKerja: '',
    tindakanMedisDilakukan: '',
    kondisiFisikSaatIni: '',
    lamaPerawatanHari: 0,
    statusKemampuanBekerja: 'Sembuh Sempurna',
    tanggalMulaiStmb: '',
    tanggalSelesaiStmb: ''
  };

  const segmen = p.segmen || 'Penerima Upah (PU)';
  const kondisi = p.kondisiTerakhir || 'Sembuh';
  const hariIstirahat = p.lamaPerawatanHari || 7;

  return (
    <div className="w-full bg-white text-black font-sans text-[9.5px] leading-tight print:p-0 select-text">
      {/* Header Container */}
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
            <h1 className="font-black text-[13px] tracking-wide uppercase">
              LAPORAN KASUS KECELAKAAN KERJA
            </h1>
            <h2 className="font-black text-[12px] uppercase tracking-wider">TAHAP II</h2>
          </div>

          {/* Box Kanan Formulir */}
          <div className="border-2 border-black px-3 py-1 text-center font-bold text-[10px] shrink-0 w-36">
            <div>Formulir</div>
            <div className="text-[12px] font-black">3a KK 2</div>
            <div className="text-[8px] font-semibold">BPJS Ketenagakerjaan</div>
          </div>
        </div>

        {/* Segmen Kepesertaan */}
        <div className="mt-1.5 pt-1 border-t border-black/40 flex items-center justify-between text-[9px]">
          <span className="font-bold">Segmen Kepesertaan :</span>
          <label className="flex items-center gap-1">
            <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${segmen.includes('PU') && !segmen.includes('Bukan') ? 'bg-black text-white text-[8px]' : ''}`}>
              {segmen.includes('PU') && !segmen.includes('Bukan') ? '✓' : ''}
            </span>
            <span>Penerima Upah (PU)</span>
          </label>
          <label className="flex items-center gap-1">
            <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${segmen.includes('Bukan') ? 'bg-black text-white text-[8px]' : ''}`}>
              {segmen.includes('Bukan') ? '✓' : ''}
            </span>
            <span>Bukan Penerima Upah (BPU)</span>
          </label>
          <label className="flex items-center gap-1">
            <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${segmen.includes('JAKON') ? 'bg-black text-white text-[8px]' : ''}`}>
              {segmen.includes('JAKON') ? '✓' : ''}
            </span>
            <span>Jasa Konstruksi (JAKON)</span>
          </label>
          <label className="flex items-center gap-1">
            <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${segmen.includes('PMI') ? 'bg-black text-white text-[8px]' : ''}`}>
              {segmen.includes('PMI') ? '✓' : ''}
            </span>
            <span>Pekerja Migran Indonesia (PMI)</span>
          </label>
        </div>
      </div>

      {/* Blue Banner Info (2 Columns) */}
      <div className="grid grid-cols-2 border border-sky-300 text-sky-950 font-bold text-center mb-1 bg-sky-100/80 text-[8.5px]">
        <div className="py-1 px-2 border-r border-sky-300">
          <div>Laporan Kasus Kecelakaan Kerja Tahap II</div>
          <div className="text-[8px] font-semibold">Wajib dilaporkan dalam waktu 2 X 24 Jam</div>
          <div className="text-[8px] font-semibold">Sejak pekerja dinyatakan sembuh, cacat, atau meninggal dunia</div>
        </div>
        <div className="py-1 px-2 flex items-center justify-center">
          <span>Formulir ini berfungsi juga sebagai pengajuan pembayaran Jaminan Kecelakaan Kerja</span>
        </div>
      </div>

      {/* Content Form Body */}
      <div className="space-y-1">
        {/* 1. Data Pemberi Kerja */}
        <div className="border border-black p-1">
          <div className="font-bold text-[9.5px] mb-0.5">1. Data Pemberi Kerja/ Wadah/ Mitra/ Pelaksana Penempatan</div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-y-0.5 text-[9px]">
            <span>Nama</span>
            <span>:</span>
            <span className="font-medium">{p.namaPerusahaan || '.....................................................................................................'}</span>

            <span>NPP/NPW/Nama Proyek</span>
            <span>:</span>
            <span className="font-mono">{p.nppBpjsTk || '.....................................................................................................'}</span>

            <span>Alamat</span>
            <span>:</span>
            <span>{p.alamatPerusahaan || '.......................................................................................................'}</span>

            <span>No Telepon/ HP</span>
            <span>:</span>
            <span>{p.telpPerusahaan || '(..............)........................................................./.....................................................'}</span>

            <span>Nama Kontak Personil</span>
            <span>:</span>
            <span>{p.kontakPersonil || '.......................................................................................................'}</span>
          </div>
        </div>

        {/* 2. Data Peserta */}
        <div className="border border-black p-1">
          <div className="font-bold text-[9.5px] mb-0.5">2. Data Peserta</div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-y-0.5 text-[9px]">
            <span>Nama</span>
            <span>:</span>
            <span className="font-bold">
              {letter.jenisKelamin === 'Laki-laki' ? 'Tn ' : 'Ny / Nn '}
              {letter.namaPasien || '.........................................................................................'}
            </span>

            <span>No. Peserta</span>
            <span>:</span>
            <span className="font-mono">{p.noPeserta || letter.noBpjs || '........................................................................................................'}</span>

            <span>NIK / No. Paspor (WNA/PMI)</span>
            <span>:</span>
            <span className="font-mono">{p.nikPeserta || letter.nik || '........................................................................................................'}</span>

            <span>Jenis Pekerjaan/jabatan</span>
            <span>:</span>
            <span>{p.jabatanPeserta || letter.pekerjaan || '................................................../...............................................................'}</span>
          </div>
        </div>

        {/* 3. Tanggal Kecelakaan */}
        <div className="border border-black p-1 text-[9px]">
          <div className="grid grid-cols-[160px_10px_1fr] gap-y-0.5">
            <span className="font-bold">3. Tanggal Kecelakaan</span>
            <span>:</span>
            <span>{p.tanggalKecelakaan || '............/............./.............(dd/mm/yyyy)'}</span>

            <span>Waktu kejadian (khusus PMI)</span>
            <span>:</span>
            <div className="flex items-center gap-3">
              <span>[ ] Sebelum penempatan</span>
              <span>[ ] Sesudah penempatan</span>
              <span>[ ] Selama penempatan (negara {p.negaraPmi || '...........................'})</span>
            </div>
          </div>
        </div>

        {/* 4. Berdasarkan hasil pemeriksaan terakhir */}
        <div className="border border-black p-1 text-[9px]">
          <div className="font-bold mb-0.5">
            4. Berdasarkan hasil pemeriksaan terakhir : Pada tanggal : {p.tanggalPemeriksaan || '............/............./.............(dd/mm/yyyy)'}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-4">
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kondisi === 'Sembuh' ? 'bg-black text-white text-[8px]' : ''}`}>
                {kondisi === 'Sembuh' ? '✓' : ''}
              </span>
              <span>Sembuh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kondisi.includes('total') ? 'bg-black text-white text-[8px]' : ''}`}>
                {kondisi.includes('total') ? '✓' : ''}
              </span>
              <span>Cacat total tetap untuk selamanya</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kondisi.includes('fungsi') ? 'bg-black text-white text-[8px]' : ''}`}>
                {kondisi.includes('fungsi') ? '✓' : ''}
              </span>
              <span>Cacat sebagian fungsi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kondisi.includes('Meninggal') ? 'bg-black text-white text-[8px]' : ''}`}>
                {kondisi.includes('Meninggal') ? '✓' : ''}
              </span>
              <span>Meninggal dunia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kondisi.includes('anatomis') ? 'bg-black text-white text-[8px]' : ''}`}>
                {kondisi.includes('anatomis') ? '✓' : ''}
              </span>
              <span>Cacat sebagian anatomis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${kondisi.includes('pengobatan') ? 'bg-black text-white text-[8px]' : ''}`}>
                {kondisi.includes('pengobatan') ? '✓' : ''}
              </span>
              <span>Masih dalam pengobatan</span>
            </div>
          </div>
        </div>

        {/* 5. Total Pengajuan Pembiayaan */}
        <div className="border border-black p-1 text-[8.5px]">
          <div className="font-bold mb-0.5">5. Total Pengajuan Pembiayaan</div>
          <table className="w-full border-collapse border border-black text-center text-[7.5px]">
            <thead className="bg-slate-100 font-bold">
              <tr>
                <th className="border border-black p-0.5">Penerima manfaat pembiayaan</th>
                <th className="border border-black p-0.5">Perawatan dan pengobatan</th>
                <th className="border border-black p-0.5">Santunan Cacat</th>
                <th className="border border-black p-0.5">Prothesa dan Orthesa</th>
                <th className="border border-black p-0.5">Gigi tiruan</th>
                <th className="border border-black p-0.5">Transportasi</th>
                <th className="border border-black p-0.5">STMB</th>
                <th className="border border-black p-0.5">Nama Bank</th>
                <th className="border border-black p-0.5">No. Rekening</th>
                <th className="border border-black p-0.5">Nama Rekening</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-0.5 font-semibold text-left">Pemberi Kerja</td>
                <td className="border border-black p-0.5">{p.biayaPerawatanPemberiKerja ? `Rp ${p.biayaPerawatanPemberiKerja.toLocaleString('id-ID')}` : '-'}</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">{p.namaBank || 'BSI / BRI'}</td>
                <td className="border border-black p-0.5 font-mono">{p.noRekening || '-'}</td>
                <td className="border border-black p-0.5">{p.namaRekening || '-'}</td>
              </tr>
              <tr>
                <td className="border border-black p-0.5 font-semibold text-left">Peserta</td>
                <td className="border border-black p-0.5">{p.biayaPerawatanPeserta ? `Rp ${p.biayaPerawatanPeserta.toLocaleString('id-ID')}` : '-'}</td>
                <td className="border border-black p-0.5">{p.santunanCacat ? `Rp ${p.santunanCacat.toLocaleString('id-ID')}` : '-'}</td>
                <td className="border border-black p-0.5">{p.prothesaOrthesa ? `Rp ${p.prothesaOrthesa.toLocaleString('id-ID')}` : '-'}</td>
                <td className="border border-black p-0.5">{p.gigiTiruan ? `Rp ${p.gigiTiruan.toLocaleString('id-ID')}` : '-'}</td>
                <td className="border border-black p-0.5">{p.biayaTransportasi ? `Rp ${p.biayaTransportasi.toLocaleString('id-ID')}` : '-'}</td>
                <td className="border border-black p-0.5">{p.stmbNominal ? `Rp ${p.stmbNominal.toLocaleString('id-ID')}` : '-'}</td>
                <td className="border border-black p-0.5">{p.namaBank || '-'}</td>
                <td className="border border-black p-0.5 font-mono">{p.noRekening || '-'}</td>
                <td className="border border-black p-0.5">{letter.namaPasien || '-'}</td>
              </tr>
              <tr>
                <td className="border border-black p-0.5 font-semibold text-left">Ahli Waris</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">-</td>
                <td className="border border-black p-0.5">{p.bankAhliWaris || '-'}</td>
                <td className="border border-black p-0.5 font-mono">{p.rekeningAhliWaris || '-'}</td>
                <td className="border border-black p-0.5">{p.namaAhliWaris || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. Lamanya tidak bekerja */}
        <div className="border border-black p-1 flex items-center gap-2 text-[9px]">
          <span className="font-bold">6. Lamanya tidak bekerja</span>
          <span>:</span>
          <span className="font-bold underline font-mono">{hariIstirahat}</span>
          <span>hari (Sesuai dengan jumlah hari perawatan dan atau surat keterangan istirahat dokter)</span>
        </div>

        {/* 7. Data ahli waris */}
        <div className="border border-black p-1 text-[8.5px]">
          <div className="font-bold mb-0.5">7. Data ahli waris (diisi jika peserta meninggal dunia)</div>
          <div className="grid grid-cols-[140px_10px_1fr] gap-y-0.5">
            <span>Nama Ahli Waris</span>
            <span>:</span>
            <span>{p.namaAhliWaris || '........................................................................................................'}</span>

            <span>NIK / No. Paspor (WNA)</span>
            <span>:</span>
            <span className="font-mono">{p.nikAhliWaris || '........................................................................................................'}</span>

            <span>Hubungan ahli waris</span>
            <span>:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span>[ ] Janda/duda</span>
              <span>[ ] Anak</span>
              <span>[ ] Ayah/Ibu</span>
              <span>[ ] Kakek/Nenek</span>
              <span>[ ] Cucu</span>
              <span>[ ] Saudara Kandung</span>
              <span>[ ] Mertua</span>
              <span>[ ] Pihak wasiat</span>
            </div>

            <span>No Telepon/ HP</span>
            <span>:</span>
            <span>{p.telpAhliWaris || '(..............)..................................................../....................................................................'}</span>

            <span>Nama Bank & No. Rekening</span>
            <span>:</span>
            <span>{p.bankAhliWaris ? `${p.bankAhliWaris} & ${p.rekeningAhliWaris}` : '...........................................................&...........................................................................'}</span>
          </div>

          <div className="mt-1 pt-1 border-t border-black/30">
            <div className="font-semibold italic text-[8px]">Data wali anak (untuk ahli waris anak di bawah usia 18 tahun) :</div>
            <div className="grid grid-cols-2 gap-x-2 text-[8px] mt-0.5">
              <div>a. Nama : {p.waliNama || '...........................................................'}</div>
              <div>b. NIK : {p.waliNik || '...........................................................'}</div>
              <div>c. No Telp & email : {p.waliTelp || '.........................'} email: {p.waliEmail || '...............'}</div>
              <div>d. Hubungan dengan anak Peserta : {p.waliHubungan || '..............................'}</div>
            </div>
          </div>
        </div>

        {/* 8, 9, 10 */}
        <div className="border border-black p-1 text-[8.5px] space-y-0.5">
          <div className="flex items-center gap-4">
            <span className="font-bold">8. Memiliki anak belum mencapai usia 23 th / belum bekerja / belum menikah * :</span>
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${p.memilikiAnakKriteria === 'ada' ? 'bg-black text-white text-[7px]' : ''}`}>
                {p.memilikiAnakKriteria === 'ada' ? '✓' : ''}
              </span>
              <span>ada**</span>
            </label>
            <label className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black inline-flex items-center justify-center font-bold ${p.memilikiAnakKriteria === 'tidak ada' ? 'bg-black text-white text-[7px]' : ''}`}>
                {p.memilikiAnakKriteria === 'tidak ada' ? '✓' : ''}
              </span>
              <span>tidak ada</span>
            </label>
          </div>

          <div>
            <span className="font-bold">9. Keterangan lainnya jika perlu :</span>
            <div className="border border-black/40 min-h-[16px] px-1 bg-slate-50/50 mt-0.5">
              {p.keteranganLainnya || '-'}
            </div>
          </div>

          <div>
            <span className="font-bold">10. Persyaratan yang diperlukan :</span>
            <div className="grid grid-cols-2 gap-x-2 text-[8px] pl-2 mt-0.5">
              <div>[✓] Surat Keterangan Dokter Kasus Kecelakaan Kerja (Formulir 3b KK3)</div>
              <div>[✓] Kuitansi asli biaya pengangkutan</div>
              <div>[✓] Kuitansi asli biaya pengobatan dan perawatan</div>
              <div>[✓] Dokumen pendukung lain apabila diperlukan</div>
            </div>
          </div>
        </div>

        {/* Pernyataan & TTD */}
        <div className="border border-black p-1 text-center text-[8px] font-medium bg-slate-50">
          Dengan ini saya menyatakan bahwa data dan keterangan yang saya sampaikan kepada BPJS Ketenagakerjaan adalah benar. Apabila data yang diberikan tidak benar, saya bersedia bertanggung jawab sesuai peraturan perundangan yang berlaku.
        </div>

        <div className="grid grid-cols-2 gap-4 text-[8px] pt-0.5 items-end">
          <div>
            <div className="font-bold">Keterangan :</div>
            <div className="text-[7.5px] text-slate-700">
              <div>Laporan ini diperuntukkan :</div>
              <div>- Lembar pertama : BPJS Ketenagakerjaan</div>
              <div>- Lembar kedua : Dinas Tenaga Kerja Setempat</div>
              <div>- Lembar ketiga : Pusat Layanan Kecelakaan Kerja (PLKK)</div>
              <div>- Lembar keempat : Perusahaan</div>
              <div className="text-[7px] text-slate-500 mt-0.5">
                *) Jika kondisi meninggal dunia atau cacat total tetap<br />
                **) Jika ada dan berhak atas manfaat beasiswa, harap mengisi formulir pengajuan manfaat beasiswa
              </div>
            </div>
          </div>

          <div className="text-right pr-4">
            <div>Kota/Kab : <span className="font-semibold underline">{p.kotaPernyataan || 'Lamongan'}</span></div>
            <div>Tanggal &nbsp;: <span className="font-semibold underline">{p.tanggalPernyataan || letter.tanggalSurat}</span></div>
            <div className="mt-1 text-center inline-block min-w-[170px]">
              <div className="h-9 border-b border-black flex items-end justify-center pb-0.5 text-[7.5px] text-slate-400">
                (tanda tangan dan stempel perusahaan)
              </div>
              <div className="text-left mt-0.5">
                <div>Nama : <strong className="underline">{p.namaPenandatangan || '.......................................'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
