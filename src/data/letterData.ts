import {
  MedicalLetterItem,
  DoctorSigner,
  PatientRecord,
  LetterType,
  LetterCategory
} from '../types/letterTypes';

export const MASTER_PATIENTS: PatientRecord[] = [
  {
    noRm: 'RM-048291',
    nik: '3524051208920003',
    nama: 'Bambang Sudarsono',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Lamongan',
    tanggalLahir: '1992-08-12',
    umur: 34,
    pekerjaan: 'Karyawan Swasta (PT Petrokimia)',
    alamat: 'Dsn. Plaosan RT 02/RW 04, Kel. Babat, Kec. Babat, Kab. Lamongan',
    noHp: '0812-3456-7890',
    noBpjs: '0001827364521',
    golDarah: 'O'
  },
  {
    noRm: 'RM-019283',
    nik: '3524055504950001',
    nama: 'Siti Rahmawati, S.Pd.',
    jenisKelamin: 'Perempuan',
    tempatLahir: 'Bojonegoro',
    tanggalLahir: '1995-04-15',
    umur: 31,
    pekerjaan: 'Guru Honorer',
    alamat: 'Jl. Pemuda No. 42, RT 01/RW 02, Kec. Baureno, Kab. Bojonegoro',
    noHp: '0857-9876-5432',
    noBpjs: '0002938475612',
    golDarah: 'B'
  },
  {
    noRm: 'RM-073821',
    nik: '3524052003880004',
    nama: 'Ahmad Fauzi Ridwan',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Tuban',
    tanggalLahir: '1988-03-20',
    umur: 38,
    pekerjaan: 'Wiraswasta / Pedagang',
    alamat: 'Ds. Widang RT 03/RW 01, Kec. Widang, Kab. Tuban',
    noHp: '0821-4567-8901',
    noBpjs: '0003847561920',
    golDarah: 'A'
  },
  {
    noRm: 'RM-056192',
    nik: '3524056111010002',
    nama: 'Dewi Anjarwati',
    jenisKelamin: 'Perempuan',
    tempatLahir: 'Lamongan',
    tanggalLahir: '2001-11-21',
    umur: 24,
    pekerjaan: 'Mahasiswi',
    alamat: 'Jl. Sunan Giri No. 15, RT 04/RW 02, Kec. Pucuk, Kab. Lamongan',
    noHp: '0813-2345-6789',
    noBpjs: '0004758691023',
    golDarah: 'AB'
  },
  {
    noRm: 'RM-082914',
    nik: '3524050907760005',
    nama: 'H. Joko Prasetyo, M.M.',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Lamongan',
    tanggalLahir: '1976-07-09',
    umur: 50,
    pekerjaan: 'PNS Pemkab Lamongan',
    alamat: 'Jl. Raya Babat-Surabaya No. 88, Kec. Babat, Kab. Lamongan',
    noHp: '0811-9876-1234',
    noBpjs: '0005869702134',
    golDarah: 'O'
  },
  {
    noRm: 'RM-091238',
    nik: '3524054506540003',
    nama: 'Hj. Mardiyah',
    jenisKelamin: 'Perempuan',
    tempatLahir: 'Lamongan',
    tanggalLahir: '1954-06-05',
    umur: 72,
    pekerjaan: 'Pensiunan / Ibu Rumah Tangga',
    alamat: 'Dsn. Gembong RT 01/RW 03, Kel. Babat, Kec. Babat, Kab. Lamongan',
    noHp: '0822-8765-4321',
    noBpjs: '0006970813245',
    golDarah: 'B'
  }
];

export const ROOM_CLASSES = [
  {
    kelas: 'VVIP',
    tarif: 950000,
    fasilitas: '1 Bed Elektrik Pasien, AC Split, Smart TV 50", Sofa Bed Penunggu, Kulkas 2 Pintu, Microwave, Dispenser, Kamar Mandi Water Heater, Free Wi-Fi 50 Mbps, Amenities Premium, 1 Set Meja Makan'
  },
  {
    kelas: 'VIP',
    tarif: 650000,
    fasilitas: '1 Bed Manual/Crank Pasien, AC Split, TV LED 32", Sofa Penunggu Nyaman, Kulkas Mini, Kamar Mandi Water Heater Dalam, Free Wi-Fi, Paket Amenities'
  },
  {
    kelas: 'Kelas 1',
    tarif: 400000,
    fasilitas: '2 Bed Pasien (Sekat Tirai Privasi), AC, TV LED Bersama, Kamar Mandi Dalam, Kursi Penunggu Nyaman, Meja Pasien'
  },
  {
    kelas: 'Kelas 2',
    tarif: 250000,
    fasilitas: '3 - 4 Bed Pasien (Sekat Tirai), AC Ruangan, Kamar Mandi Dalam, Kursi Penunggu, Nakas Pasien'
  },
  {
    kelas: 'Kelas 3',
    tarif: 150000,
    fasilitas: '5 - 6 Bed Pasien (Sekat Standar), AC Ruangan, Kamar Mandi Bersama Luar, Kursi Penunggu'
  },
  {
    kelas: 'HCU',
    tarif: 550000,
    fasilitas: 'High Care Unit - Bed Monitoring Khusus, Bedside Monitor Vital Signs, Oksigen & Suction Sentral, Observasi Intensif Perawat 24 Jam'
  },
  {
    kelas: 'ICU',
    tarif: 850000,
    fasilitas: 'Intensive Care Unit - Bed Elektrik ICU, Ventilator Mekanik Canggih, Multi-Parameter Vital Monitor, Syringe/Infusion Pump, Ruang Isolasi/Negative Pressure'
  },
  {
    kelas: 'NICU',
    tarif: 750000,
    fasilitas: 'Neonatal Intensive Care Unit - Inkubator Khusus Bayi Baru Lahir, CPAP, Infant Warmer, Fototerapi Bilirubin, Monitor Vital Khusus Neonatus'
  },
  {
    kelas: 'One Day Care',
    tarif: 300000,
    fasilitas: 'Ruang Observasi & Perawatan Singkat Pasca Tindakan Bedah Minor / Prosedur Kemoterapi / Endoskopi (< 24 Jam)'
  }
] as const;

export const MASTER_LETTER_DOCTORS: DoctorSigner[] = [
  {
    id: 'doc-1',
    nama: 'dr. H. Erwin S. W., Sp.PD',
    spesialisasi: 'Spesialis Penyakit Dalam',
    sip: '446/102/SIP-D/413.111/2023',
    jabatan: 'Dokter Penanggung Jawab Pelayanan (DPJP)'
  },
  {
    id: 'doc-2',
    nama: 'dr. Denny Rachman, Sp.B',
    spesialisasi: 'Spesialis Bedah Umum',
    sip: '446/208/SIP-D/413.111/2024',
    jabatan: 'Dokter Spesialis Bedah RSUMB'
  },
  {
    id: 'doc-3',
    nama: 'dr. Moch. Choirul Latif, Sp.A',
    spesialisasi: 'Spesialis Anak',
    sip: '446/305/SIP-D/413.111/2023',
    jabatan: 'Dokter Spesialis Anak RSUMB'
  },
  {
    id: 'doc-4',
    nama: 'dr. Fathia Nur Aziza, Sp.Rad',
    spesialisasi: 'Spesialis Radiologi',
    sip: '446/410/SIP-D/413.111/2024',
    jabatan: 'Dokter Pemeriksa MCU & Radiologi'
  },
  {
    id: 'doc-5',
    nama: 'dr. Angga Pratama Putra',
    spesialisasi: 'Dokter Umum / MCU',
    sip: '446/512/SIP-DU/413.111/2025',
    jabatan: 'Dokter Pemeriksa Layanan Surat & MCU'
  },
  {
    id: 'doc-6',
    nama: 'drg. Triana Maharani',
    spesialisasi: 'Dokter Gigi',
    sip: '446/615/SIP-DG/413.111/2024',
    jabatan: 'Dokter Gigi Poliklinik Rawat Jalan'
  }
];

export function getCategoryForType(type: LetterType): LetterCategory {
  switch (type) {
    case 'SKBN':
    case 'ADMEDIKA':
    case 'SEHAT':
    case 'DOKTER':
      return 'medis';
    case 'EDUKASI_OP2':
    case 'KUASA_JR':
      return 'penjaminan';
    case 'BPJS_KK1':
    case 'BPJS_KK2':
    case 'BPJS_KK3':
      return 'bpjstk';
    case 'TITIP_KELAS':
    case 'PESAN_KAMAR':
    case 'GAGAL_FINGERPRINT':
      return 'admisi';
  }
}

export function getLetterTypeLabel(type: LetterType): string {
  switch (type) {
    case 'SKBN':
      return 'Surat Bebas Narkoba (SKBN)';
    case 'ADMEDIKA':
      return 'Klaim & Resume AdMedika RJ / Gigi';
    case 'SEHAT':
      return 'Surat Keterangan Sehat';
    case 'DOKTER':
      return 'Surat Keterangan Sakit / Dokter';
    case 'EDUKASI_OP2':
      return 'Edukasi Operasi Kedua (Jasa Raharja)';
    case 'KUASA_JR':
      return 'Surat Kuasa Santunan Jasa Raharja';
    case 'BPJS_KK1':
      return 'Form KK1 - Laporan Kecelakaan Tahap I';
    case 'BPJS_KK2':
      return 'Form KK2 - Keterangan Dokter Tahap II';
    case 'BPJS_KK3':
      return 'Form KK3 - Penyelesaian Kasus Tahap III';
    case 'TITIP_KELAS':
      return 'Pernyataan Titip Kelas Rawat Inap';
    case 'PESAN_KAMAR':
      return 'Formulir Pemesanan Kamar Rawat Inap';
    case 'GAGAL_FINGERPRINT':
      return 'Pernyataan Kendala Gagal Fingerprint BPJS';
  }
}

export function getLetterTypeShortCode(type: LetterType): string {
  switch (type) {
    case 'SKBN':
      return 'SKBN';
    case 'ADMEDIKA':
      return 'ADM-RJ';
    case 'SEHAT':
      return 'KET-SEHAT';
    case 'DOKTER':
      return 'KET-DOKTER';
    case 'EDUKASI_OP2':
      return 'EDUKASI-OP2';
    case 'KUASA_JR':
      return 'KUASA-JR';
    case 'BPJS_KK1':
      return 'KK1-BPJSTK';
    case 'BPJS_KK2':
      return 'KK2-BPJSTK';
    case 'BPJS_KK3':
      return 'KK3-BPJSTK';
    case 'TITIP_KELAS':
      return 'TITIP-KL';
    case 'PESAN_KAMAR':
      return 'PESAN-KMR';
    case 'GAGAL_FINGERPRINT':
      return 'FINGERPRINT';
  }
}

export function numberToTerbilang(num: number): string {
  if (num === 0) return 'Nol rupiah';
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

  function terbilangHelper(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return terbilangHelper(n - 10) + ' belas';
    if (n < 100) return terbilangHelper(Math.floor(n / 10)) + ' puluh' + (n % 10 !== 0 ? ' ' + satuan[n % 10] : '');
    if (n < 200) return 'seratus' + (n % 100 !== 0 ? ' ' + terbilangHelper(n - 100) : '');
    if (n < 1000) return satuan[Math.floor(n / 100)] + ' ratus' + (n % 100 !== 0 ? ' ' + terbilangHelper(n % 100) : '');
    if (n < 2000) return 'seribu' + (n % 1000 !== 0 ? ' ' + terbilangHelper(n - 1000) : '');
    if (n < 1000000) return terbilangHelper(Math.floor(n / 1000)) + ' ribu' + (n % 1000 !== 0 ? ' ' + terbilangHelper(n % 1000) : '');
    if (n < 1000000000) return terbilangHelper(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 !== 0 ? ' ' + terbilangHelper(n % 1000000) : '');
    if (n < 1000000000000) return terbilangHelper(Math.floor(n / 1000000000)) + ' milyar' + (n % 1000000000 !== 0 ? ' ' + terbilangHelper(n % 1000000000) : '');
    return n.toString();
  }

  const result = terbilangHelper(Math.floor(num)).trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + ' rupiah';
}

export function generateLetterNumber(type: LetterType, index: number): string {
  const code = getLetterTypeShortCode(type);
  const now = new Date();
  const year = now.getFullYear();
  const monthsRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const month = monthsRoman[now.getMonth()];
  const seq = String(index).padStart(3, '0');
  return `445/${seq}/${code}/RSUMB/${month}/${year}`;
}

export function getNextSequenceForType(type: LetterType, existingLetters?: MedicalLetterItem[]): number {
  const letters = existingLetters || loadMedicalLetters();
  const code = getLetterTypeShortCode(type);
  let maxSeq = 0;

  letters.forEach((item) => {
    if (item.nomorSurat) {
      const match = item.nomorSurat.match(/445\/(\d+)\//);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && (item.jenisSurat === type || item.nomorSurat.includes(`/${code}/`))) {
          if (num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }
  });

  try {
    const counterKey = `rsumb_letter_counter_${type}`;
    const saved = localStorage.getItem(counterKey);
    if (saved) {
      const parsedNum = parseInt(saved, 10);
      if (!isNaN(parsedNum) && parsedNum > maxSeq) {
        maxSeq = parsedNum;
      }
    }
  } catch (e) {
    // ignore localStorage errors in non-browser environments
  }

  return maxSeq + 1;
}

export function commitNextSequenceForType(type: LetterType, usedSeq: number): void {
  try {
    const counterKey = `rsumb_letter_counter_${type}`;
    const saved = localStorage.getItem(counterKey);
    const current = saved ? parseInt(saved, 10) : 0;
    if (usedSeq >= current) {
      localStorage.setItem(counterKey, String(usedSeq));
    }
  } catch (e) {
    // ignore
  }
}

export function getAutoGeneratedLetterNumber(
  type: LetterType,
  existingLetters?: MedicalLetterItem[]
): { nomorSurat: string; seq: number } {
  const seq = getNextSequenceForType(type, existingLetters);
  const nomorSurat = generateLetterNumber(type, seq);
  return { nomorSurat, seq };
}

export const INITIAL_LETTERS: MedicalLetterItem[] = [
  // 1. Surat Medis (SKBN)
  {
    id: 'let-001',
    nomorSurat: '445/001/SKBN/RSUMB/IX/2026',
    kategori: 'medis',
    jenisSurat: 'SKBN',
    tanggalSurat: '2026-09-07',
    noRm: 'RM-048291',
    namaPasien: 'Bambang Sudarsono',
    nik: '3524051208920003',
    tempatLahir: 'Lamongan',
    tanggalLahir: '1992-08-12',
    umur: 34,
    jenisKelamin: 'Laki-laki',
    pekerjaan: 'Karyawan Swasta (PT Petrokimia)',
    alamat: 'Dsn. Plaosan RT 02/RW 04, Kel. Babat, Kec. Babat, Kab. Lamongan',
    noHp: '0812-3456-7890',
    noBpjs: '0001827364521',
    keperluan: 'Persyaratan Registrasi Karyawan Tetap PT Petrokimia Gresik',
    dokterNama: 'dr. Angga Pratama Putra',
    dokterSip: '446/512/SIP-DU/413.111/2025',
    dokterJabatan: 'Dokter Pemeriksa Layanan MCU & Surat Medis',
    skbnParams: {
      amp: 'Negatif',
      met: 'Negatif',
      coc: 'Negatif',
      thc: 'Negatif',
      mop: 'Negatif',
      bzo: 'Negatif',
      metode: 'Rapid Diagnostic Multi-Panel Urine Strip (6 Parameter)',
      spesimen: 'Urine Segar',
      kesimpulan: 'Dinyatakan BEBAS DARI PENYALAHGUNAAN NARKOTIKA, PSIKOTROPIKA & ZAT ADIKTIF'
    },
    createdAt: '2026-09-07T08:30:00.000Z'
  },

  // 2. Surat Medis (AdMedika RJ/Gigi)
  {
    id: 'let-002',
    nomorSurat: '445/002/ADM-RJ/RSUMB/IX/2026',
    kategori: 'medis',
    jenisSurat: 'ADMEDIKA',
    tanggalSurat: '2026-09-07',
    noRm: 'RM-019283',
    namaPasien: 'Siti Rahmawati, S.Pd.',
    nik: '3524055504950001',
    tempatLahir: 'Bojonegoro',
    tanggalLahir: '1995-04-15',
    umur: 31,
    jenisKelamin: 'Perempuan',
    pekerjaan: 'Guru Honorer',
    alamat: 'Jl. Pemuda No. 42, RT 01/RW 02, Kec. Baureno, Kab. Bojonegoro',
    noHp: '0857-9876-5432',
    noBpjs: '0002938475612',
    keperluan: 'Klaim Asuransi Perusahaan Penjamin AdMedika - Rawat Jalan Gigi',
    dokterNama: 'drg. Triana Maharani',
    dokterSip: '446/615/SIP-DG/413.111/2024',
    dokterJabatan: 'Dokter Gigi Poliklinik RSUMB',
    admedikaParams: {
      noKartuAdmedika: 'ADM-9948271038',
      namaPerusahaan: 'PT Asuransi Allianz Life Indonesia (Korporat)',
      jenisLayanan: 'Rawat Gigi',
      diagnosaUtama: 'Pulpitis Reversibel & Karies Dentis Molar 1 Mandibula',
      kodeIcd10: 'K04.0',
      tindakanMedis: 'Pembersihan Kavitas, Tumpatan Komposit Resin Gigi 36, Scalling Gigi RA & RB',
      resepObat: 'Asam Mefenamat 500mg No. X, Amoxicillin 500mg No. XV',
      totalBiaya: 650000,
      catatanKhusus: 'Pasien kontrol kembali 1 minggu pasca penambalan resin'
    },
    createdAt: '2026-09-07T09:15:00.000Z'
  },

  // 3. Penjaminan & Kuasa (Edukasi Operasi Kedua)
  {
    id: 'let-003',
    nomorSurat: '445/003/EDUKASI-OP2/RSUMB/IX/2026',
    kategori: 'penjaminan',
    jenisSurat: 'EDUKASI_OP2',
    tanggalSurat: '2026-09-07',
    noRm: 'RM-073821',
    namaPasien: 'Ahmad Fauzi Ridwan',
    nik: '3524052003880004',
    tempatLahir: 'Tuban',
    tanggalLahir: '1988-03-20',
    umur: 38,
    jenisKelamin: 'Laki-laki',
    pekerjaan: 'Wiraswasta / Pedagang',
    alamat: 'Ds. Widang RT 03/RW 01, Kec. Widang, Kab. Tuban',
    noHp: '0821-4567-8901',
    noBpjs: '0003847561920',
    keperluan: 'Koordinasi Penjaminan Biaya Tindakan Operasi Kedua Jasa Raharja & BPJS Kesehatan',
    dokterNama: 'dr. Denny Rachman, Sp.B',
    dokterSip: '446/208/SIP-D/413.111/2024',
    dokterJabatan: 'Dokter Spesialis Bedah DPJP',
    edukasiOp2Params: {
      rencanaTindakan: 'Operasi Rekonstruksi Fraktur & Pelepasan / Fiksasi Eksterna Femur Sinistra',
      tanggalRencanaOp: '2026-09-10',
      rsPerujukPertama: 'RSUD dr. Soegiri Lamongan',
      syaratJasaRaharjaMax20jt: true,
      syaratRujukanFaskes1: true,
      syaratLaporanPolisi: true,
      syaratRincianBiayaRS1: true,
      namaPicJasaRaharja: 'Bpk. Rahmat Hidayat, S.H.',
      kontakPicJasaRaharja: '0812-3456-7890 (Kantor Layanan Jasa Raharja Lamongan)',
      namaKeluargaPasien: 'Nur Hidayati (Istri)',
      hubunganKeluarga: 'Istri Kandung',
      namaPetugasAdmisi: 'M. Rizqi S.Kep., Ns. (Petugas Admisi Bedah)'
    },
    createdAt: '2026-09-07T10:00:00.000Z'
  },

  // 4. Penjaminan & Kuasa (Kuasa Jasa Raharja)
  {
    id: 'let-004',
    nomorSurat: '445/004/KUASA-JR/RSUMB/IX/2026',
    kategori: 'penjaminan',
    jenisSurat: 'KUASA_JR',
    tanggalSurat: '2026-09-07',
    noRm: 'RM-073821',
    namaPasien: 'Ahmad Fauzi Ridwan',
    nik: '3524052003880004',
    tempatLahir: 'Tuban',
    tanggalLahir: '1988-03-20',
    umur: 38,
    jenisKelamin: 'Laki-laki',
    pekerjaan: 'Wiraswasta / Pedagang',
    alamat: 'Ds. Widang RT 03/RW 01, Kec. Widang, Kab. Tuban',
    noHp: '0821-4567-8901',
    noBpjs: '0003847561920',
    keperluan: 'Surat Kuasa Pengurusan & Penagihan Santunan Biaya Perawatan Korban Laka Lantas',
    dokterNama: 'dr. H. Erwin S. W., Sp.PD',
    dokterSip: '446/102/SIP-D/413.111/2023',
    dokterJabatan: 'Perwakilan Manajemen RSUMB',
    kuasaJrParams: {
      totalBiayaPerawatan: 18500000,
      terbilang: 'Delapan belas juta lima ratus ribu rupiah',
      tanggalMulaiRawat: '2026-09-05',
      tanggalSelesaiRawat: '2026-09-12',
      namaPemberiKuasa: 'Nur Hidayati',
      nikPemberiKuasa: '3524056209900002',
      hubunganPemberiKuasa: 'Istri Kandung',
      alamatPemberiKuasa: 'Ds. Widang RT 03/RW 01, Kec. Widang, Kab. Tuban',
      noHpPemberiKuasa: '0821-4567-8901',
      namaPenerimaKuasa: 'Direktur / Kasir Piutang RSUMB',
      jabatanPenerimaKuasa: 'Kepala Bagian Keuangan & Piutang RSUMB',
      perluMaterai: true
    },
    createdAt: '2026-09-07T10:45:00.000Z'
  },

  // 5. BPJS Ketenagakerjaan (Form KK1)
  {
    id: 'let-005',
    nomorSurat: '445/005/KK1-BPJSTK/RSUMB/IX/2026',
    kategori: 'bpjstk',
    jenisSurat: 'BPJS_KK1',
    tanggalSurat: '2026-09-07',
    noRm: 'RM-048291',
    namaPasien: 'Bambang Sudarsono',
    nik: '3524051208920003',
    tempatLahir: 'Lamongan',
    tanggalLahir: '1992-08-12',
    umur: 34,
    jenisKelamin: 'Laki-laki',
    pekerjaan: 'Operator Mesin Bubut',
    alamat: 'Dsn. Plaosan RT 02/RW 04, Kel. Babat, Kec. Babat, Kab. Lamongan',
    noHp: '0812-3456-7890',
    noBpjs: '0001827364521',
    keperluan: 'Laporan Kasus Kecelakaan Kerja Tahap I BPJS Ketenagakerjaan',
    dokterNama: 'dr. Denny Rachman, Sp.B',
    dokterSip: '446/208/SIP-D/413.111/2024',
    dokterJabatan: 'Dokter Spesialis Bedah Pemeriksa',
    bpjsKk1Params: {
      namaPerusahaan: 'PT Petrokimia Gresik (Divisi Workshop Babat)',
      nppBpjsTk: 'NPP-10492817290',
      tanggalKecelakaan: '2026-09-07',
      jamKecelakaan: '08:45 WIB',
      tempatKecelakaan: 'Area Workshop Fabrikasi Mesin, Pabrik Babat KM 4',
      kronologiSingkat: 'Pekerja sedang mengoperasikan mesin bubut logam, serpihan gram besi mental dan melukai telapak tangan kanan serta lengan bawah akibat sarung tangan terselip.',
      bagianTubuhCidera: 'Vulnus Laceratum Regio Antebrachii et Manus Dextra',
      faskesPertama: 'IGD RSU Muhammadiyah Babat (Trauma Center)'
    },
    createdAt: '2026-09-07T11:00:00.000Z'
  },

  // 6. Admisi & Rawat Inap (Titip Kelas)
  {
    id: 'let-006',
    nomorSurat: '445/006/TITIP-KL/RSUMB/IX/2026',
    kategori: 'admisi',
    jenisSurat: 'TITIP_KELAS',
    tanggalSurat: '2026-09-07',
    noRm: 'RM-082914',
    namaPasien: 'H. Joko Prasetyo, M.M.',
    nik: '3524050907760005',
    tempatLahir: 'Lamongan',
    tanggalLahir: '1976-07-09',
    umur: 50,
    jenisKelamin: 'Laki-laki',
    pekerjaan: 'PNS Pemkab Lamongan',
    alamat: 'Jl. Raya Babat-Surabaya No. 88, Kec. Babat, Kab. Lamongan',
    noHp: '0811-9876-1234',
    noBpjs: '0005869702134',
    keperluan: 'Pernyataan Titip Kelas Rawat Inap Menunggu Ketersediaan Kamar Hak Kelas',
    dokterNama: 'dr. H. Erwin S. W., Sp.PD',
    dokterSip: '446/102/SIP-D/413.111/2023',
    dokterJabatan: 'DPJP Penyakit Dalam',
    titipKelasParams: {
      kelasKamarDipilih: 'VIP',
      hakKelasBpjs: 'Kelas 1',
      tarifPerHari: 650000,
      fasilitasKamar: '1 Bed Crank, AC, TV LED, Kulkas Mini, Sofa Penunggu, Kamar Mandi Dalam Water Heater',
      alasanTitipKelas: 'Kamar sesuai hak kelas BPJS (Kelas 1) sedang penuh terisi, pasien dititipkan sementara di ruang VIP maksimal 3 hari sesuai regulasi BPJS.',
      namaPenjamin: 'Hj. Sri Wahyuni (Istri)',
      hubunganPenjamin: 'Istri Kandung',
      alamatPenjamin: 'Jl. Raya Babat-Surabaya No. 88, Kec. Babat, Kab. Lamongan',
      noHpPenjamin: '0811-9876-1234',
      setujuSelisihBiaya: true
    },
    createdAt: '2026-09-07T11:30:00.000Z'
  },

  // 7. Admisi & Rawat Inap (Pernyataaan Gagal Fingerprint)
  {
    id: 'let-007',
    nomorSurat: '445/007/FINGERPRINT/RSUMB/IX/2026',
    kategori: 'admisi',
    jenisSurat: 'GAGAL_FINGERPRINT',
    tanggalSurat: '2026-09-07',
    noRm: 'RM-091238',
    namaPasien: 'Hj. Mardiyah',
    nik: '3524054506540003',
    tempatLahir: 'Lamongan',
    tanggalLahir: '1954-06-05',
    umur: 72,
    jenisKelamin: 'Perempuan',
    pekerjaan: 'Pensiunan / Ibu Rumah Tangga',
    alamat: 'Dsn. Gembong RT 01/RW 03, Kel. Babat, Kec. Babat, Kab. Lamongan',
    noHp: '0822-8765-4321',
    noBpjs: '0006970813245',
    keperluan: 'Verifikasi Klaim BPJS Kesehatan Tanpa Biometrik Fingerprint di RSUMB',
    dokterNama: 'dr. H. Erwin S. W., Sp.PD',
    dokterSip: '446/102/SIP-D/413.111/2023',
    dokterJabatan: 'DPJP Poliklinik Penyakit Dalam',
    gagalFingerprintParams: {
      alasanGagal: 'Pasien lansia / sidik jari tipis & tidak terdeteksi mesin',
      alasanKustom: 'Pasien usia lanjut (72 tahun), guratan sidik jari pada kesepuluh jari tangan telah menipis/aus sehingga sensor biometrik BPJS gagal membaca 5 kali percobaan berturut-turut.',
      penanggungJawabKlaim: 'Petugas Admisi',
      namaPetugas: 'Dyah Retno, A.Md.RMIK (Petugas Admisi Rawat Jalan)',
      nomorSep: '0184R0010926V001928',
      tujuanPoli: 'Poli Penyakit Dalam (dr. H. Erwin S. W., Sp.PD)',
      namaPenjamin: 'Budi Santoso (Anak Kandung)',
      hubunganPenjamin: 'Anak Kandung',
      pernyataanKebenaran: true
    },
    createdAt: '2026-09-07T12:00:00.000Z'
  }
];

const STORAGE_KEY = 'rsumb_medical_letters_v2';

export function loadMedicalLetters(): MedicalLetterItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const seenIds = new Set<string>();
        let mutated = false;
        const sanitized = parsed.map((item, index) => {
          if (!item.id || item.id === 'preview-temp-id' || seenIds.has(item.id)) {
            mutated = true;
            const newId = `letter-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
            seenIds.add(newId);
            return { ...item, id: newId };
          }
          seenIds.add(item.id);
          return item;
        });
        if (mutated) {
          saveMedicalLetters(sanitized);
        }
        return sanitized;
      }
    }
  } catch (err) {
    console.error('Failed to load medical letters from localStorage:', err);
  }
  return INITIAL_LETTERS;
}

export function saveMedicalLetters(letters: MedicalLetterItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
  } catch (err) {
    console.error('Failed to save medical letters to localStorage:', err);
  }
}
