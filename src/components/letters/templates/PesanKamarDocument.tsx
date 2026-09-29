import React from 'react';
import { MedicalLetterItem } from '../../../types/letterTypes';

interface TemplateProps {
  letter: MedicalLetterItem;
}

export const PesanKamarDocument: React.FC<TemplateProps> = ({ letter }) => {
  const p = letter.pesanKamarParams || {
    namaPemesan: '',
    hubunganPemesan: '',
    tanggalRencanaMasuk: '',
    jamRencanaMasuk: '',
    kelasKamarDipilih: 'VIP',
    tarifPerHari: 600000,
    fasilitasKamar: '',
    estimasiLamaInapHari: 3,
    diagnosaAwal: '',
    dokterPengirim: '',
    noHpPemesan: ''
  };

  const ruangPerawatan = [
    { no: 1, nama: 'VVIP', sewa: '1.000.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 2, nama: 'VIP', sewa: '600.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 3, nama: 'Kelas 1', sewa: '300.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 4, nama: 'Kelas 2', sewa: '200.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 5, nama: 'Kelas 3', sewa: '120.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 6, nama: 'HCU', sewa: '350.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 7, nama: 'ICU', sewa: '500.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 8, nama: 'NICU', sewa: '500.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 9, nama: 'One Day Care', sewa: '250.000,-', umum: '70.000,-', spesialis: '100.000,-' }
  ];

  const ruangBersalin = [
    { no: 1, nama: 'VIP', sewa: '600.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 2, nama: 'Kelas I', sewa: '300.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 3, nama: 'Kelas II', sewa: '200.000,-', umum: '70.000,-', spesialis: '100.000,-' },
    { no: 4, nama: 'Kelas III', sewa: '120.000,-', umum: '70.000,-', spesialis: '100.000,-' }
  ];

  const selectedKamar = p.ruanganDipesan || `${p.kelasKamarDipilih} (Ruang Perawatan)`;

  return (
    <div className="w-full bg-white text-black font-serif text-[11px] leading-relaxed p-6 print:p-0 select-text">
      {/* Kop Surat RSUMB Resmi */}
      <div className="flex items-center gap-4 pb-2 border-b-2 border-black">
        {/* Logo Surya Muhammadiyah Bulat */}
        <div className="w-16 h-16 shrink-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-[#005d42] flex items-center justify-center bg-emerald-50 text-[#005d42] font-bold text-center leading-none text-[8px] p-1 shadow-sm">
            <span>RSU MUHAMMADIYAH BABAT</span>
          </div>
        </div>

        <div className="text-center flex-grow">
          <h2 className="font-bold text-[14px] text-[#005d42] tracking-wider uppercase">
            RUMAH SAKIT UMUM MUHAMMADIYAH BABAT
          </h2>
          <p className="text-[9.5px] text-slate-800 font-sans mt-0.5">
            Jl. Raya Babat - Surabaya KM. 4 Kebalanpelang, Babat-Lamongan 62271
          </p>
          <p className="text-[9px] text-slate-600 font-sans">
            Telp. (0322) 451121, Fax. (0322) 451121, Email: rsumbabat@gmail.com
          </p>
        </div>
      </div>
      <div className="h-0.5 bg-black mt-0.5 mb-4" />

      {/* Judul Dokumen */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-[13px] tracking-wide underline inline-block uppercase">
          Bukti Pemesanan Kamar
        </h1>
      </div>

      {/* Isi Surat */}
      <div className="space-y-2 mb-3">
        <p>Yang bertanda tangan di bawah ini,</p>

        <div className="pl-4 space-y-1">
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>Nama Pemesan</span>
            <span>:</span>
            <span className="font-bold">{p.namaPemesan || '...........................................................................................................'}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>Hubungan dengan Pasien</span>
            <span>:</span>
            <span>{p.hubunganPemesan || '...........................................................................................................'}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>Nama Pasien</span>
            <span>:</span>
            <span className="font-bold">{p.namaPasien || letter.namaPasien || '...........................................................................................................'}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>Umur Pasien</span>
            <span>:</span>
            <span>{p.umurPasien || letter.umur || '.........'} Th</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>Alamat Pasien</span>
            <span>:</span>
            <span>{p.alamatPasien || letter.alamat || '...........................................................................................................'}</span>
          </div>
        </div>

        <p className="pt-1">Dengan ini saya memesan kamar untuk keperluan Rawat Inap pada :</p>

        <div className="pl-4 space-y-1">
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>Tanggal</span>
            <span>:</span>
            <span className="font-semibold">{p.tanggalRencanaMasuk || letter.tanggalSurat}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>Pukul</span>
            <span>:</span>
            <span className="font-semibold">{p.jamRencanaMasuk || '08.00'} WIB</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>Ruangan yang saya pesan adalah</span>
            <span>:</span>
            <span className="font-bold underline text-[11.5px]">{selectedKamar}</span>
          </div>
        </div>
      </div>

      {/* Tabel Ruang Perawatan & Ruang Bersalin (2 Kolom berdampingan sesuai lembar asli) */}
      <div className="grid grid-cols-2 gap-3 my-3">
        {/* Kolom Kiri: Ruang Perawatan */}
        <div>
          <table className="w-full border-collapse border border-black text-center text-[8.5px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-6">No</th>
                <th className="border border-black p-1">Ruang Perawatan</th>
                <th className="border border-black p-1">Sewa Kamar</th>
                <th className="border border-black p-1">Visite Dokter Umum</th>
                <th className="border border-black p-1">Visite Dokter Spesialis</th>
              </tr>
            </thead>
            <tbody>
              {ruangPerawatan.map((row) => {
                const isSelected = selectedKamar.toLowerCase().includes(row.nama.toLowerCase());
                return (
                  <tr key={row.no} className={isSelected ? 'bg-amber-100/70 font-bold' : ''}>
                    <td className="border border-black p-1">{row.no}.</td>
                    <td className="border border-black p-1 text-left font-semibold">{row.nama}</td>
                    <td className="border border-black p-1 font-mono">{row.sewa}</td>
                    <td className="border border-black p-1 font-mono">{row.umum}</td>
                    <td className="border border-black p-1 font-mono">{row.spesialis}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Kolom Kanan: Ruang Bersalin */}
        <div>
          <table className="w-full border-collapse border border-black text-center text-[8.5px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-6">No</th>
                <th className="border border-black p-1">Ruang Bersalin</th>
                <th className="border border-black p-1">Sewa Kamar</th>
                <th className="border border-black p-1">Visite Dokter Umum</th>
                <th className="border border-black p-1">Visite Dokter Spesialis</th>
              </tr>
            </thead>
            <tbody>
              {ruangBersalin.map((row) => {
                const isSelected = selectedKamar.toLowerCase().includes(row.nama.toLowerCase()) && selectedKamar.toLowerCase().includes('bersalin');
                return (
                  <tr key={row.no} className={isSelected ? 'bg-amber-100/70 font-bold' : ''}>
                    <td className="border border-black p-1">{row.no}.</td>
                    <td className="border border-black p-1 text-left font-semibold">{row.nama}</td>
                    <td className="border border-black p-1 font-mono">{row.sewa}</td>
                    <td className="border border-black p-1 font-mono">{row.umum}</td>
                    <td className="border border-black p-1 font-mono">{row.spesialis}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 p-2 border border-black/40 text-[9px] bg-slate-50">
            <span className="font-bold">Keterangan Tambahan :</span>
            <p className="italic text-slate-700 mt-0.5">
              * Biaya sewa kamar dihitung per hari (24 jam sejak check-in). Apabila pindah kelas kamar, penghitungan disesuaikan dengan ketentuan rawat inap RSUMB.
            </p>
          </div>
        </div>
      </div>

      {/* Penutup */}
      <p className="mt-2">Demikian pernyataan ini saya buat dengan sebenar - benarnya.</p>

      {/* Tanda Tangan */}
      <div className="mt-6">
        <div className="text-right pr-6 mb-2">
          Babat, {letter.tanggalSurat ? new Date(letter.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '....................................'}
        </div>

        <div className="flex justify-between px-10 text-center">
          <div className="w-56">
            <div className="mb-14">Petugas</div>
            <div className="border-t border-black font-semibold pt-1">
              ( {p.namaPetugas || letter.dokterNama || '....................................'} )
            </div>
          </div>

          <div className="w-56">
            <div className="mb-14">Pemesan</div>
            <div className="border-t border-black font-semibold pt-1">
              ( {p.namaPemesan || '....................................'} )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
