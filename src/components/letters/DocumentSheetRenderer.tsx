import React from 'react';
import { MedicalLetterItem } from '../../types/letterTypes';
import { BpjsKk1Document } from './templates/BpjsKk1Document';
import { BpjsKk2Document } from './templates/BpjsKk2Document';
import { BpjsKk3Document } from './templates/BpjsKk3Document';
import { PesanKamarDocument } from './templates/PesanKamarDocument';
import { GagalFingerprintDocument } from './templates/GagalFingerprintDocument';
import { AdmedikaDocument } from './templates/AdmedikaDocument';
import { getLetterTypeLabel } from '../../data/letterData';

interface DocumentSheetRendererProps {
  letter: MedicalLetterItem;
  className?: string;
}

export const DocumentSheetRenderer: React.FC<DocumentSheetRendererProps> = ({ letter, className = '' }) => {
  // Format Tanggal Indonesia
  const formatIndonesianDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Switch ke Template Presisi 100% Sesuai Dokumen Asli
  switch (letter.jenisSurat) {
    case 'BPJS_KK1':
      return (
        <div className={`printable-sheet bg-white shadow-2xl p-6 print:p-0 print:shadow-none ${className}`}>
          <BpjsKk1Document letter={letter} />
        </div>
      );

    case 'BPJS_KK2':
      return (
        <div className={`printable-sheet bg-white shadow-2xl p-6 print:p-0 print:shadow-none ${className}`}>
          <BpjsKk2Document letter={letter} />
        </div>
      );

    case 'BPJS_KK3':
      return (
        <div className={`printable-sheet bg-white shadow-2xl p-6 print:p-0 print:shadow-none ${className}`}>
          <BpjsKk3Document letter={letter} />
        </div>
      );

    case 'PESAN_KAMAR':
      return (
        <div className={`printable-sheet bg-white shadow-2xl print:shadow-none ${className}`}>
          <PesanKamarDocument letter={letter} />
        </div>
      );

    case 'GAGAL_FINGERPRINT':
      return (
        <div className={`printable-sheet bg-white shadow-2xl print:shadow-none ${className}`}>
          <GagalFingerprintDocument letter={letter} />
        </div>
      );

    case 'ADMEDIKA':
      return (
        <div className={`printable-sheet bg-white shadow-2xl p-6 print:p-0 print:shadow-none ${className}`}>
          <AdmedikaDocument letter={letter} />
        </div>
      );

    // Default template RSUMB untuk SKBN, SEHAT, DOKTER, EDUKASI_OP2, KUASA_JR, TITIP_KELAS
    default:
      return (
        <div className={`printable-sheet bg-white shadow-2xl p-8 print:p-0 print:shadow-none text-black font-serif text-[11px] leading-relaxed ${className}`}>
          {/* Kop Surat RSUMB */}
          <div className="flex items-center gap-4 pb-2 border-b-2 border-[#005d42]">
            <div className="w-14 h-14 rounded-full border-2 border-[#005d42] flex items-center justify-center bg-emerald-50 text-[#005d42] font-bold text-center text-[8px] shrink-0 leading-tight">
              RSU MUHAMMADIYAH BABAT
            </div>
            <div className="flex-grow text-center">
              <h2 className="font-bold text-[14px] text-[#005d42] tracking-wider uppercase font-sans">
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

          {/* Judul & Nomor Surat */}
          <div className="text-center mb-4">
            <h1 className="font-bold text-[13px] tracking-wide uppercase underline inline-block">
              {getLetterTypeLabel(letter.jenisSurat)}
            </h1>
            <p className="text-[10px] text-slate-700 mt-0.5 font-mono">
              Nomor: {letter.nomorSurat}
            </p>
          </div>

          {/* Pengantar */}
          <p className="mb-3">
            {letter.jenisSurat === 'KUASA_JR'
              ? 'Pada hari ini bertempat di RSU Muhammadiyah Babat, yang bertanda tangan di bawah ini menerangkan pemberian kuasa santunan sebagai berikut:'
              : 'Yang bertanda tangan di bawah ini, Dokter RSU Muhammadiyah Babat menerangkan dengan sebenarnya data pasien sebagai berikut:'}
          </p>

          {/* Identitas Pasien */}
          <div className="pl-4 space-y-1 mb-4 border border-black/30 p-3 bg-slate-50/50">
            <div className="grid grid-cols-[160px_10px_1fr]">
              <span>Nama Lengkap</span>
              <span>:</span>
              <span className="font-bold uppercase">{letter.namaPasien}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr]">
              <span>No. Rekam Medis (RM)</span>
              <span>:</span>
              <span className="font-mono font-bold">{letter.noRm || '-'}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr]">
              <span>Nomor Induk (NIK)</span>
              <span>:</span>
              <span className="font-mono">{letter.nik}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr]">
              <span>Tempat, Tanggal Lahir</span>
              <span>:</span>
              <span>{letter.tempatLahir}, {formatIndonesianDate(letter.tanggalLahir)} ({letter.umur} Th)</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr]">
              <span>Jenis Kelamin</span>
              <span>:</span>
              <span>{letter.jenisKelamin}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr]">
              <span>Pekerjaan</span>
              <span>:</span>
              <span>{letter.pekerjaan || '-'}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr]">
              <span>Alamat Lengkap</span>
              <span>:</span>
              <span>{letter.alamat}</span>
            </div>
          </div>

          {/* KONTEN KHUSUS SKBN */}
          {letter.jenisSurat === 'SKBN' && letter.skbnParams && (
            <div className="mb-4">
              <p className="mb-2">
                Telah dilakukan pemeriksaan fisik dan uji skrining toksikologi urin terhadap parameter zat narkotika dengan hasil sebagai berikut:
              </p>
              <table className="w-full border-collapse border border-black text-center text-[10px] mb-2">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-black p-1 w-8">No</th>
                    <th className="border border-black p-1">Parameter Pemeriksaan</th>
                    <th className="border border-black p-1">Golongan Senyawa</th>
                    <th className="border border-black p-1">Metode Uji</th>
                    <th className="border border-black p-1">Hasil Uji</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { no: 1, param: 'Amphetamine (AMP)', drug: 'Ekstasi / Inex', res: letter.skbnParams.amp },
                    { no: 2, param: 'Methamphetamine (MET)', drug: 'Sabu-sabu / Shabu', res: letter.skbnParams.met },
                    { no: 3, param: 'Cocaine (COC)', drug: 'Kokain / Crack', res: letter.skbnParams.coc },
                    { no: 4, param: 'THC / Cannabinoids (THC)', drug: 'Ganja / Marihuana', res: letter.skbnParams.thc },
                    { no: 5, param: 'Morphine (MOP)', drug: 'Morfin / Heroin / Opiat', res: letter.skbnParams.mop },
                    { no: 6, param: 'Benzodiazepine (BZO)', drug: 'Obat Penenang / Sedatif', res: letter.skbnParams.bzo }
                  ].map((row) => (
                    <tr key={row.no}>
                      <td className="border border-black p-1">{row.no}</td>
                      <td className="border border-black p-1 font-semibold text-left">{row.param}</td>
                      <td className="border border-black p-1 text-left">{row.drug}</td>
                      <td className="border border-black p-1">Rapid Test (Urine)</td>
                      <td className="border border-black p-1 font-bold">
                        <span className={row.res === 'Negatif' ? 'text-emerald-800' : 'text-rose-700'}>
                          {row.res.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border border-black p-2 bg-emerald-50/50 font-sans">
                <span className="font-bold text-emerald-900 text-[10.5px]">Kesimpulan Hasil Uji: </span>
                <span className="font-bold text-emerald-800 underline">{letter.skbnParams.kesimpulan}</span>
              </div>
            </div>
          )}

          {/* KONTEN KHUSUS SEHAT */}
          {letter.jenisSurat === 'SEHAT' && letter.sehatParams && (
            <div className="mb-4 border border-black p-3 space-y-1 bg-slate-50/50">
              <div className="font-bold mb-1">Hasil Pemeriksaan Fisik & Tanda Vital:</div>
              <div className="grid grid-cols-3 gap-2">
                <div>TB / BB: <strong>{letter.sehatParams.tinggiBadan} cm / {letter.sehatParams.beratBadan} kg</strong></div>
                <div>Tekanan Darah: <strong>{letter.sehatParams.tekananDarah}</strong></div>
                <div>Denyut Nadi: <strong>{letter.sehatParams.nadi}</strong></div>
                <div>Golongan Darah: <strong>{letter.sehatParams.golonganDarah}</strong></div>
                <div>Tes Buta Warna: <strong>{letter.sehatParams.butaWarna}</strong></div>
                <div>Status Kebugaran: <strong className="text-emerald-800 underline">{letter.sehatParams.statusKesehatan}</strong></div>
              </div>
            </div>
          )}

          {/* KONTEN KHUSUS DOKTER (SURAT SAKIT) */}
          {letter.jenisSurat === 'DOKTER' && letter.dokterParams && (
            <div className="mb-4 border border-black p-3 space-y-2 bg-slate-50/50">
              <div>Diagnosa Medis: <strong className="underline">{letter.dokterParams.diagnosaMedis}</strong></div>
              <p>
                Diberikan izin istirahat sakit selama: <strong>{letter.dokterParams.lamaIstirahatHari} hari</strong> ({formatIndonesianDate(letter.dokterParams.tglMulaiIstirahat)} s.d. {formatIndonesianDate(letter.dokterParams.tglSelesaiIstirahat)}).
              </p>
            </div>
          )}

          {/* KONTEN KHUSUS TITIP KELAS */}
          {letter.jenisSurat === 'TITIP_KELAS' && letter.titipKelasParams && (
            <div className="mb-4 border border-black p-3 space-y-1.5 bg-slate-50/50">
              <div className="font-bold">Pernyataan Penempatan Kamar Titip Kelas:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>Hak Kelas BPJS: <strong>{letter.titipKelasParams.hakKelasBpjs}</strong></div>
                <div>Kamar Ditempati Sementara: <strong>{letter.titipKelasParams.kelasKamarDipilih} (Rp {letter.titipKelasParams.tarifPerHari.toLocaleString('id-ID')}/hari)</strong></div>
              </div>
              <div>Alasan Titip Kelas: <span>{letter.titipKelasParams.alasanTitipKelas}</span></div>
            </div>
          )}

          {/* KONTEN KHUSUS KUASA JR */}
          {letter.jenisSurat === 'KUASA_JR' && letter.kuasaJrParams && (
            <div className="mb-4 border border-black p-3 space-y-1.5 bg-slate-50/50">
              <div className="font-bold">Klausul Kuasa Penagihan Santunan Jasa Raharja:</div>
              <p>
                Dengan ini memberikan kuasa penuh kepada RSU Muhammadiyah Babat untuk menagihkan santunan biaya perawatan sebesar: <strong>Rp {letter.kuasaJrParams.totalBiayaPerawatan.toLocaleString('id-ID')}</strong> (Terbilang: <em>"{letter.kuasaJrParams.terbilang}"</em>).
              </p>
            </div>
          )}

          {/* Keperluan & Penutup */}
          <div className="mb-6">
            <p>
              Surat keterangan ini diberikan untuk keperluan: <strong className="underline">{letter.keperluan || 'Persyaratan Administrasi Resmi'}</strong>.
            </p>
            <p className="mt-2">
              Demikian surat keterangan ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
            </p>
          </div>

          {/* Tanda Tangan */}
          <div className="mt-8 text-right pr-6">
            <div>Babat, {formatIndonesianDate(letter.tanggalSurat)}</div>
            <div className="font-bold mt-0.5">Dokter Pemeriksa / RSUMB</div>
            <div className="h-16 flex items-end justify-end">
              {/* TTD Area */}
            </div>
            <div className="border-t border-black inline-block min-w-[180px] pt-1 text-center font-bold">
              {letter.dokterNama}
            </div>
            <div className="text-[9.5px] text-slate-700">SIP: {letter.dokterSip || '446/128/SIP/413.111/2024'}</div>
          </div>
        </div>
      );
  }
};
