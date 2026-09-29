import React from 'react';
import { MedicalLetterItem } from '../../../types/letterTypes';

interface TemplateProps {
  letter: MedicalLetterItem;
}

export const AdmedikaDocument: React.FC<TemplateProps> = ({ letter }) => {
  const p = letter.admedikaParams || {
    noKartuAdmedika: '',
    namaPerusahaan: '',
    jenisLayanan: 'Rawat Jalan',
    diagnosaUtama: '',
    tindakanMedis: '',
    resepObat: '',
    totalBiaya: 0
  };

  const status = p.statusPasien || 'Karyawan';
  const jenisTindakanList = p.dentalJenisTindakan || [];
  const selectedTeeth = p.dentalGigiDiperiksa || [];
  const istirahat = p.suratIstirahatSakit || 'Tidak';

  // Tooth numbers layout
  const upperRightPerm = ['18', '17', '16', '15', '14', '13', '12', '11'];
  const upperLeftPerm = ['21', '22', '23', '24', '25', '26', '27', '28'];
  const lowerRightPerm = ['48', '47', '46', '45', '44', '43', '42', '41'];
  const lowerLeftPerm = ['31', '32', '33', '34', '35', '36', '37', '38'];

  const upperRightDec = ['55', '54', '53', '52', '51'];
  const upperLeftDec = ['61', '62', '63', '64', '65'];
  const lowerRightDec = ['85', '84', '83', '82', '81'];
  const lowerLeftDec = ['71', '72', '73', '74', '75'];

  return (
    <div className="w-full bg-white text-black font-sans text-[8.5px] leading-tight p-4 print:p-0 select-text">
      {/* Kop AdMedika */}
      <div className="flex items-start justify-between pb-1 border-b border-black">
        {/* Logo AdMedika */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm">
            <span>+</span>
          </div>
          <div>
            <div className="font-extrabold text-[13px] text-red-700 tracking-tight leading-none">
              Ad<span className="text-slate-800">Medika</span>
            </div>
            <div className="text-[7px] text-slate-500 uppercase tracking-widest font-semibold">
              Telkom Health Solution
            </div>
          </div>
        </div>

        {/* Alamat Kantor */}
        <div className="text-right text-[7.5px] text-slate-700 leading-tight">
          <div className="font-bold text-black">PT. Administrasi Medika</div>
          <div>STO Telkom Gambir, C, Lantai 3, Jl. Medan Merdeka Sel. No.12</div>
          <div>Jakarta Pusat, 10110</div>
          <div>Phone : (62-21) 3483 4366, Fax : (62-21) 385 4172</div>
          <div>Email : claim_department@admedika.co.id</div>
        </div>
      </div>

      {/* Judul Formulir */}
      <div className="text-center my-1.5 border border-black p-1 bg-slate-50">
        <h1 className="font-bold text-[10.5px] uppercase tracking-wide">
          FORMULIR KLAIM RAWAT JALAN & GIGI (Provider)
        </h1>
        <h2 className="font-semibold text-[8.5px] italic text-slate-700">
          OUTPATIENT & DENTAL FORM
        </h2>
        <div className="text-[7.5px] text-slate-500 mt-0.5">
          Mohon isi formulir dibawah ini dengan lengkap dan jelas | Please fill this form completely
        </div>
      </div>

      {/* SECTION I: IDENTITAS PASIEN */}
      <div className="border border-black mb-1">
        <div className="bg-slate-200 px-1 py-0.5 font-bold text-[8px] flex justify-between border-b border-black">
          <span>I. Identitas Pasien ( diisi oleh pasien/peserta )</span>
          <span className="italic font-normal">Patient's Identity</span>
        </div>
        <div className="p-1 space-y-0.5">
          <div className="grid grid-cols-[130px_1fr_120px_1fr] gap-x-2">
            <div>Nama Pasien / Patient's Name :</div>
            <div className="font-bold underline">{letter.namaPasien || '...................................................'}</div>
            <div>No Medical Record :</div>
            <div className="font-mono font-bold">{letter.noRm || '...................'}</div>
          </div>

          <div className="grid grid-cols-[130px_1fr_120px_1fr] gap-x-2">
            <div>No Kartu / Card No :</div>
            <div className="font-mono font-bold">{p.noKartuAdmedika || letter.noBpjs || '...................................................'}</div>
            <div>Nama Perusahaan / Company :</div>
            <div className="font-semibold">{p.namaPerusahaan || '...................................................'}</div>
          </div>

          <div className="grid grid-cols-[130px_1fr_120px_1fr] gap-x-2 items-center">
            <div>Tanggal Lahir / Date of Birth :</div>
            <div>{letter.tanggalLahir || '....../....../......'} (Umur: {letter.umur} th)</div>
            <div>Status Pasien :</div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[6.5px] ${status === 'Karyawan' ? 'bg-black text-white' : ''}`}>
                  {status === 'Karyawan' ? '✓' : ''}
                </span>
                <span>Karyawan</span>
              </label>
              <label className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[6.5px] ${status.includes('Istri') ? 'bg-black text-white' : ''}`}>
                  {status.includes('Istri') ? '✓' : ''}
                </span>
                <span>Istri/Suami</span>
              </label>
              <label className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[6.5px] ${status === 'Anak' ? 'bg-black text-white' : ''}`}>
                  {status === 'Anak' ? '✓' : ''}
                </span>
                <span>Anak</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION II: KONSULTASI DOKTER */}
      <div className="border border-black mb-1">
        <div className="bg-slate-200 px-1 py-0.5 font-bold text-[8px] flex justify-between border-b border-black">
          <span>II. Konsultasi Dokter</span>
          <span className="italic font-normal">Doctor Consultation</span>
        </div>
        <div className="p-1 grid grid-cols-2 gap-x-4">
          <div>Nama Klinik / RS : <strong className="underline">{p.namaKlinikRs || 'RSU Muhammadiyah Babat'}</strong></div>
          <div>Tanggal Pengobatan : <strong className="underline">{p.tanggalPengobatan || letter.tanggalSurat}</strong></div>
        </div>
      </div>

      {/* SECTION III: HASIL PEMERIKSAAN RAWAT JALAN */}
      <div className="border border-black mb-1">
        <div className="bg-slate-200 px-1 py-0.5 font-bold text-[8px] flex justify-between border-b border-black">
          <span>III. Hasil Pemeriksaan Rawat Jalan ( diisi oleh dokter pemeriksa )</span>
          <span className="italic font-normal">Doctor's Consultation</span>
        </div>
        <div className="p-1 space-y-0.5">
          <div className="grid grid-cols-[150px_1fr]">
            <span>Keluhan / Symptom :</span>
            <span>{p.keluhan || letter.keperluan || 'Demam, pusing, lemas sejak 2 hari SMRS'}</span>
          </div>

          <div className="grid grid-cols-[150px_1fr_100px_1fr]">
            <span>Diagnosa Utama / Primary Diagnosis :</span>
            <span className="font-bold underline">{p.diagnosaUtama || 'Febris H-3 suspect Viral Infection'}</span>
            <span>Kode ICD-10 :</span>
            <span className="font-mono font-bold">{p.kodeIcd10 || 'A90'}</span>
          </div>

          <div className="grid grid-cols-[150px_1fr]">
            <span>Diagnosa Tambahan / Secondary :</span>
            <span>{p.diagnosaTambahan || '-'}</span>
          </div>

          <div className="grid grid-cols-[150px_1fr]">
            <span>Terapi & Resep / Treatment :</span>
            <span className="font-semibold">{p.terapi || p.resepObat || p.tindakanMedis || 'Paracetamol 500mg 3x1, Multivitamin 1x1'}</span>
          </div>

          <div className="grid grid-cols-[150px_1fr]">
            <span>Anjuran / Recommendation :</span>
            <span>{p.anjuran || 'Banyak minum air putih, istirahat cukup, kontrol bila demam menetap > 3 hari.'}</span>
          </div>
        </div>
      </div>

      {/* SECTION IV: HASIL PEMERIKSAAN GIGI DENGAN ODONTOGRAM LENGKAP */}
      <div className="border border-black mb-1">
        <div className="bg-slate-200 px-1 py-0.5 font-bold text-[8px] flex justify-between border-b border-black">
          <span>IV. Hasil Pemeriksaan Gigi ( diisi oleh dokter pemeriksa )</span>
          <span className="italic font-normal">Dentist's Consultation</span>
        </div>
        <div className="p-1 space-y-1">
          <div className="grid grid-cols-2 gap-x-2">
            <div>Diagnosa : <span className="font-semibold underline">{p.dentalDiagnosa || (p.jenisLayanan === 'Rawat Gigi' ? p.diagnosaUtama : '-')}</span></div>
            <div>Tindakan : <span className="font-semibold underline">{p.dentalTindakan || (p.jenisLayanan === 'Rawat Gigi' ? p.tindakanMedis : '-')}</span></div>
          </div>

          {/* Checklist Jenis Tindakan Gigi */}
          <div className="border border-black/30 p-1 bg-slate-50/50">
            <div className="font-bold text-[7.5px] mb-0.5">Jenis Tindakan / Type of Action :</div>
            <div className="grid grid-cols-4 gap-1 text-[7.5px]">
              {[
                'Konsultasi',
                'Pembersihan Karang',
                'Tambal Amalgam / Komposit',
                'Cabut Gigi',
                'Perawatan Akar Gigi',
                'Rontgen Gigi',
                'Lain – lain'
              ].map((item) => (
                <label key={item} className="flex items-center gap-1">
                  <span className={`w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[6px] ${jenisTindakanList.includes(item) ? 'bg-black text-white' : ''}`}>
                    {jenisTindakanList.includes(item) ? '✓' : ''}
                  </span>
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Odontogram Presisi 100% Sesuai Form Asli */}
          <div className="border border-black p-1 text-center bg-white">
            <div className="text-[7.5px] font-bold text-slate-700 mb-0.5">
              BAGAN ODONTOGRAM GIGI ( Lingkari gigi yang diperiksa )
            </div>

            {/* Gigi Dewasa / Permanen Atas */}
            <div className="flex justify-center items-center gap-1 mb-0.5">
              <span className="text-[7px] font-bold w-12 text-right">Atas Ka</span>
              <div className="flex gap-0.5 border border-black/40 p-0.5 bg-slate-50">
                {upperRightPerm.map((num) => (
                  <span key={num} className={`w-3.5 h-4 border border-black inline-flex items-center justify-center text-[7px] font-mono ${selectedTeeth.includes(num) ? 'bg-red-500 text-white font-bold rounded-full' : ''}`}>
                    {num}
                  </span>
                ))}
              </div>
              <div className="w-1 border-r border-black h-4" />
              <div className="flex gap-0.5 border border-black/40 p-0.5 bg-slate-50">
                {upperLeftPerm.map((num) => (
                  <span key={num} className={`w-3.5 h-4 border border-black inline-flex items-center justify-center text-[7px] font-mono ${selectedTeeth.includes(num) ? 'bg-red-500 text-white font-bold rounded-full' : ''}`}>
                    {num}
                  </span>
                ))}
              </div>
              <span className="text-[7px] font-bold w-12 text-left">Atas Ki</span>
            </div>

            {/* Gigi Susu / Deciduous */}
            <div className="flex justify-center items-center gap-1 mb-0.5">
              <span className="text-[6.5px] text-slate-500 w-12 text-right">Deciduous</span>
              <div className="flex gap-0.5 border border-dashed border-black/40 p-0.5">
                {upperRightDec.map((num) => (
                  <span key={num} className={`w-3 h-3.5 border border-black/60 inline-flex items-center justify-center text-[6.5px] font-mono ${selectedTeeth.includes(num) ? 'bg-red-500 text-white font-bold rounded-full' : ''}`}>
                    {num}
                  </span>
                ))}
              </div>
              <div className="w-1 border-r border-black h-3.5" />
              <div className="flex gap-0.5 border border-dashed border-black/40 p-0.5">
                {upperLeftDec.map((num) => (
                  <span key={num} className={`w-3 h-3.5 border border-black/60 inline-flex items-center justify-center text-[6.5px] font-mono ${selectedTeeth.includes(num) ? 'bg-red-500 text-white font-bold rounded-full' : ''}`}>
                    {num}
                  </span>
                ))}
              </div>
              <span className="text-[6.5px] text-slate-500 w-12 text-left">Deciduous</span>
            </div>

            {/* Gigi Susu Bawah */}
            <div className="flex justify-center items-center gap-1 mb-0.5">
              <span className="text-[6.5px] text-slate-500 w-12 text-right">Deciduous</span>
              <div className="flex gap-0.5 border border-dashed border-black/40 p-0.5">
                {lowerRightDec.map((num) => (
                  <span key={num} className={`w-3 h-3.5 border border-black/60 inline-flex items-center justify-center text-[6.5px] font-mono ${selectedTeeth.includes(num) ? 'bg-red-500 text-white font-bold rounded-full' : ''}`}>
                    {num}
                  </span>
                ))}
              </div>
              <div className="w-1 border-r border-black h-3.5" />
              <div className="flex gap-0.5 border border-dashed border-black/40 p-0.5">
                {lowerLeftDec.map((num) => (
                  <span key={num} className={`w-3 h-3.5 border border-black/60 inline-flex items-center justify-center text-[6.5px] font-mono ${selectedTeeth.includes(num) ? 'bg-red-500 text-white font-bold rounded-full' : ''}`}>
                    {num}
                  </span>
                ))}
              </div>
              <span className="text-[6.5px] text-slate-500 w-12 text-left">Deciduous</span>
            </div>

            {/* Gigi Dewasa Bawah */}
            <div className="flex justify-center items-center gap-1">
              <span className="text-[7px] font-bold w-12 text-right">Bawah Ka</span>
              <div className="flex gap-0.5 border border-black/40 p-0.5 bg-slate-50">
                {lowerRightPerm.map((num) => (
                  <span key={num} className={`w-3.5 h-4 border border-black inline-flex items-center justify-center text-[7px] font-mono ${selectedTeeth.includes(num) ? 'bg-red-500 text-white font-bold rounded-full' : ''}`}>
                    {num}
                  </span>
                ))}
              </div>
              <div className="w-1 border-r border-black h-4" />
              <div className="flex gap-0.5 border border-black/40 p-0.5 bg-slate-50">
                {lowerLeftPerm.map((num) => (
                  <span key={num} className={`w-3.5 h-4 border border-black inline-flex items-center justify-center text-[7px] font-mono ${selectedTeeth.includes(num) ? 'bg-red-500 text-white font-bold rounded-full' : ''}`}>
                    {num}
                  </span>
                ))}
              </div>
              <span className="text-[7px] font-bold w-12 text-left">Bawah Ki</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION V: SURAT ISTIRAHAT */}
      <div className="border border-black p-1 mb-1 flex items-center justify-between text-[8px]">
        <span>Pasien ini mendapatkan surat istirahat sakit :</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[6.5px] ${istirahat === 'Ya' ? 'bg-black text-white' : ''}`}>
              {istirahat === 'Ya' ? '✓' : ''}
            </span>
            <span>Ya / Yes</span>
          </label>
          <label className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 border border-black inline-flex items-center justify-center font-bold text-[6.5px] ${istirahat === 'Tidak' ? 'bg-black text-white' : ''}`}>
              {istirahat === 'Tidak' ? '✓' : ''}
            </span>
            <span>Tidak / No</span>
          </label>
          <span>Jika ya, Berapa hari : <strong className="underline">{p.lamaIstirahatHari || '....'}</strong> hari</span>
        </div>
      </div>

      {/* SECTION VI: PERNYATAAN PEMBERI KUASA (3 Paragraf Resmi AdMedika) */}
      <div className="border border-black p-1 text-[7px] leading-tight space-y-1 bg-slate-50">
        <div className="font-bold text-[7.5px]">VI. Pernyataan Pemberi Kuasa | Power of Attorney Declaration</div>
        <p>
          Saya menyatakan bahwa semua rincian yang tertulis dalam formulir ini adalah benar dan lengkap, dan saya memberikan kuasa kepada PT Administrasi Medika (AdMedika) untuk memproses klaim ini sesuai ketentuan polis / jaminan yang berlaku.
        </p>
        <p>
          Saya dengan ini memberi kuasa penuh kepada setiap dokter, rumah sakit, klinik, perusahaan asuransi, badan hukum atau perseorangan yang memiliki catatan atau keterangan mengenai saya/pasien untuk memberitahukan kepada AdMedika segala informasi mengenai riwayat medis atau perawatan yang telah diberikan.
        </p>
        <p className="italic">
          Salinan dari surat kuasa ini berkekuatan hukum sama dengan yang asli.
        </p>
      </div>

      {/* Tanda Tangan Pasien & Dokter */}
      <div className="mt-2 grid grid-cols-2 gap-4 text-center text-[8px]">
        <div>
          <div className="h-12 border-b border-black flex items-end justify-center pb-0.5 text-slate-400">
            {/* Tempat TTD Pasien */}
          </div>
          <div className="font-bold pt-0.5">Tanda Tangan Pasien / Peserta</div>
          <div className="text-[7px] text-slate-500">(atau orang tua jika pasien &lt; 17 tahun)</div>
          <div className="text-[7.5px] underline mt-0.5">{letter.namaPasien}</div>
        </div>

        <div>
          <div className="h-12 border-b border-black flex items-end justify-center pb-0.5 text-slate-400">
            {/* Tempat TTD & Stempel Dokter */}
          </div>
          <div className="font-bold pt-0.5">Tanda Tangan & Stempel Dokter Merawat</div>
          <div className="text-[7px] text-slate-500">SIP: {letter.dokterSip || '446/128/SIP/413.111/2024'}</div>
          <div className="text-[7.5px] underline mt-0.5">{p.namaDokter || letter.dokterNama}</div>
        </div>
      </div>

      {/* Footer Form Code */}
      <div className="mt-2 flex justify-between items-center text-[7px] text-slate-500 border-t border-slate-200 pt-0.5">
        <span>ADM-FRM-CLM-028, Rev.00</span>
        <span>RSU Muhammadiyah Babat - Provider Jaringan AdMedika</span>
      </div>
    </div>
  );
};
