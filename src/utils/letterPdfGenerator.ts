import jsPDF from 'jspdf';
import { MedicalLetterItem } from '../types/letterTypes';
import { getBase64ImageFromUrl } from './exportHelpers';
import { getLetterTypeLabel } from '../data/letterData';

/**
 * Konversi tanggal format YYYY-MM-DD ke format penanggalan Indonesia
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Hitung umur berdasarkan tanggal lahir YYYY-MM-DD
 */
export function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  try {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  } catch {
    return 0;
  }
}

function numberToWordsIndonesian(n: number): string {
  const words = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (n <= 11) return words[n];
  if (n < 20) return `${words[n - 10]} Belas`;
  if (n < 100) return `${words[Math.floor(n / 10)]} Puluh ${n % 10 !== 0 ? words[n % 10] : ''}`.trim();
  return String(n);
}

/**
 * Generate dan unduh PDF resmi ukuran A4 untuk Formulir & Surat Layanan RSUMB
 */
export async function generateMedicalLetterPDF(letter: MedicalLetterItem): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const leftMargin = 18;
  const rightMargin = 192;
  const contentWidth = rightMargin - leftMargin;

  // 1. KOP SURAT RESMI RSUMB
  const logoBase64 = await getBase64ImageFromUrl('/logo-rsumb.png');
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', leftMargin, 11, 20, 20);
    } catch {
      // ignore
    }
  }

  // Teks Kop
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('MAJELIS PEMBINA KESEHATAN UMUM (MPKU) PDM LAMONGAN', 110, 15, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(0, 93, 66); // Hijau RSUMB (#005d42)
  doc.text('RUMAH SAKIT UMUM MUHAMMADIYAH BABAT', 110, 21, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Jl. Raya Babat - Surabaya KM. 4 Babat, Lamongan - Jawa Timur 62271', 110, 26, { align: 'center' });
  doc.text('Telp. (0322) 451121 | IGD 24 Jam: (0322) 451122 | Email: rsumbabat@gmail.com', 110, 30, { align: 'center' });

  // Garis Pembatas Ganda Kop Surat
  doc.setDrawColor(0, 93, 66);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, 34, rightMargin, 34);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.line(leftMargin, 35.2, rightMargin, 35.2);

  // 2. JUDUL DOKUMEN & NOMOR SURAT
  let titleText = getLetterTypeLabel(letter.jenisSurat).toUpperCase();
  if (letter.jenisSurat === 'SKBN') {
    titleText = 'SURAT KETERANGAN BEBAS NARKOBA (SKBN)';
  } else if (letter.jenisSurat === 'SEHAT') {
    titleText = 'SURAT KETERANGAN PEMERIKSAAN KESEHATAN';
  } else if (letter.jenisSurat === 'DOKTER') {
    titleText = 'SURAT KETERANGAN DOKTER (ISTIRAHAT SAKIT)';
  } else if (letter.jenisSurat === 'ADMEDIKA') {
    titleText = 'SURAT KLAIM & RESUME MEDIS ADMEDIKA';
  } else if (letter.jenisSurat === 'EDUKASI_OP2') {
    titleText = 'FORMULIR EDUKASI OPERASI KEDUA & JASA RAHARJA';
  } else if (letter.jenisSurat === 'KUASA_JR') {
    titleText = 'SURAT KUASA PENGURUSAN SANTUNAN JASA RAHARJA';
  } else if (letter.jenisSurat === 'TITIP_KELAS') {
    titleText = 'SURAT PERNYATAAN TITIP KELAS RAWAT INAP';
  } else if (letter.jenisSurat === 'PESAN_KAMAR') {
    titleText = 'FORMULIR PEMESANAN / RESERVASI KAMAR RAWAT INAP';
  } else if (letter.jenisSurat === 'GAGAL_FINGERPRINT') {
    titleText = 'SURAT PERNYATAAN KENDALA REKAM SIDIK JARI (BPJS)';
  } else if (letter.jenisSurat === 'BPJS_KK1') {
    titleText = 'FORMULIR KK-1: LAPORAN KASUS KECELAKAAN KERJA TAHAP I';
  } else if (letter.jenisSurat === 'BPJS_KK2') {
    titleText = 'FORMULIR KK-2: KETERANGAN DOKTER KECELAKAAN KERJA TAHAP II';
  } else if (letter.jenisSurat === 'BPJS_KK3') {
    titleText = 'FORMULIR KK-3: LAPORAN PENYELESAIAN KASUS TAHAP III';
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(titleText, 105, 43, { align: 'center' });

  const titleWidth = doc.getTextWidth(titleText);
  doc.setLineWidth(0.4);
  doc.line(105 - titleWidth / 2, 44.5, 105 + titleWidth / 2, 44.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nomor: ${letter.nomorSurat}`, 105, 49, { align: 'center' });

  // 3. PENGANTAR UMUM
  let currentY = 56;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  let introText = 'Yang bertanda tangan di bawah ini, Rumah Sakit Umum Muhammadiyah Babat menerangkan data pasien sebagai berikut:';
  if (letter.jenisSurat === 'KUASA_JR') {
    introText = 'Pada hari ini, bertempat di RSU Muhammadiyah Babat, yang bertanda tangan di bawah ini:';
  }

  doc.text(introText, leftMargin, currentY, { maxWidth: contentWidth });

  // 4. IDENTITAS PASIEN
  currentY += 6;
  const age = letter.umur || calculateAge(letter.tanggalLahir);
  const patientDataRows: [string, string][] = [
    ['No. Rekam Medis (RM)', `:  ${letter.noRm || '-'}`],
    ['Nama Lengkap', `:  ${letter.namaPasien}`],
    ['Nomor NIK (KTP)', `:  ${letter.nik}`],
    ['Tempat, Tanggal Lahir', `:  ${letter.tempatLahir}, ${formatIndonesianDate(letter.tanggalLahir)} (${age} Tahun)`],
    ['Jenis Kelamin', `:  ${letter.jenisKelamin}`],
    ['Pekerjaan', `:  ${letter.pekerjaan || '-'}`],
    ['Nomor Telepon / WA', `:  ${letter.noHp || '-'}`],
    ['Alamat Lengkap', `:  ${letter.alamat}`]
  ];

  doc.setFontSize(8.5);
  patientDataRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(label, leftMargin + 4, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    if (label === 'Alamat Lengkap') {
      const splitValue = doc.splitTextToSize(value, contentWidth - 62);
      doc.text(splitValue, leftMargin + 62, currentY);
      currentY += (splitValue.length * 4.2);
    } else {
      doc.text(value, leftMargin + 62, currentY);
      currentY += 4.8;
    }
  });

  currentY += 3;

  // 5. BLOK KHUSUS MASING-MASING TEMPLATE
  if (letter.jenisSurat === 'SKBN' && letter.skbnParams) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Telah dilakukan uji skrining toksikologi urin terhadap 6 parameter narkotika pada tanggal ${formatIndonesianDate(letter.tanggalSurat)} dengan hasil sebagai berikut:`,
      leftMargin,
      currentY,
      { maxWidth: contentWidth }
    );
    currentY += 6;

    const tableStartY = currentY;
    doc.setFillColor(241, 245, 249);
    doc.rect(leftMargin, tableStartY, contentWidth, 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(leftMargin, tableStartY, contentWidth, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('NO', leftMargin + 3, tableStartY + 4.2);
    doc.text('PARAMETER PEMERIKSAAN', leftMargin + 14, tableStartY + 4.2);
    doc.text('GOLONGAN SENYAWA', leftMargin + 70, tableStartY + 4.2);
    doc.text('CUT-OFF / SPESIMEN', leftMargin + 115, tableStartY + 4.2);
    doc.text('HASIL UJI', leftMargin + 152, tableStartY + 4.2);

    const testItems = [
      { no: '1', param: 'Amphetamine (AMP)', drug: 'Ekstasi / Inex', cutoff: '1000 ng/mL', result: letter.skbnParams.amp },
      { no: '2', param: 'Methamphetamine (MET)', drug: 'Sabu-sabu / Shabu', cutoff: '500 ng/mL', result: letter.skbnParams.met },
      { no: '3', param: 'Cocaine (COC)', drug: 'Kokain / Crack', cutoff: '300 ng/mL', result: letter.skbnParams.coc },
      { no: '4', param: 'THC / Cannabinoids (THC)', drug: 'Ganja / Marihuana', cutoff: '50 ng/mL', result: letter.skbnParams.thc },
      { no: '5', param: 'Morphine (MOP)', drug: 'Morfin / Heroin / Candu', cutoff: '300 ng/mL', result: letter.skbnParams.mop },
      { no: '6', param: 'Benzodiazepine (BZO)', drug: 'Obat Penenang / Sedatif', cutoff: '300 ng/mL', result: letter.skbnParams.bzo }
    ];

    let rowY = tableStartY + 6;
    testItems.forEach((t, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(leftMargin, rowY, contentWidth, 5.5, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(leftMargin, rowY, contentWidth, 5.5, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(t.no, leftMargin + 4, rowY + 3.8);
      doc.text(t.param, leftMargin + 14, rowY + 3.8);
      doc.text(t.drug, leftMargin + 70, rowY + 3.8);
      doc.text(t.cutoff, leftMargin + 115, rowY + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(t.result === 'Negatif' ? 0 : 190, t.result === 'Negatif' ? 120 : 18, t.result === 'Negatif' ? 80 : 60);
      doc.text(t.result.toUpperCase(), leftMargin + 152, rowY + 3.8);

      rowY += 5.5;
    });

    currentY = rowY + 3;

    // Kesimpulan Box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(leftMargin, currentY, contentWidth, 11, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('KESIMPULAN UJI MEDIS & TOKSIKOLOGI:', leftMargin + 4, currentY + 4.5);
    doc.setFontSize(8.5);
    doc.text(letter.skbnParams.kesimpulan, leftMargin + 4, currentY + 8.5);
    currentY += 15;

  } else if (letter.jenisSurat === 'ADMEDIKA' && letter.admedikaParams) {
    // --- ADMEDIKA ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(leftMargin, currentY, contentWidth, 38, 2, 2, 'FD');

    doc.setFillColor(241, 245, 249);
    doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('RINCIAN PENJAMINAN & PELAYANAN MEDIS ADMEDIKA', leftMargin + 4, currentY + 4.2);

    let aY = currentY + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('No. Kartu AdMedika', leftMargin + 4, aY);
    doc.text('Perusahaan Penjamin', leftMargin + 4, aY + 5);
    doc.text('Jenis Layanan', leftMargin + 4, aY + 10);
    doc.text('Diagnosa & ICD-10', leftMargin + 4, aY + 15);
    doc.text('Tindakan Medis', leftMargin + 4, aY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`:  ${letter.admedikaParams.noKartuAdmedika}`, leftMargin + 50, aY);
    doc.text(`:  ${letter.admedikaParams.namaPerusahaan}`, leftMargin + 50, aY + 5);
    doc.text(`:  ${letter.admedikaParams.jenisLayanan}`, leftMargin + 50, aY + 10);
    doc.text(`:  ${letter.admedikaParams.diagnosaUtama} (${letter.admedikaParams.kodeIcd10 || '-'})`, leftMargin + 50, aY + 15);
    doc.text(`:  ${letter.admedikaParams.tindakanMedis}`, leftMargin + 50, aY + 20);

    currentY += 42;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 93, 66);
    doc.text(`Total Biaya Klaim: Rp ${letter.admedikaParams.totalBiaya.toLocaleString('id-ID')}`, leftMargin, currentY);
    currentY += 7;

  } else if (letter.jenisSurat === 'EDUKASI_OP2' && letter.edukasiOp2Params) {
    // --- EDUKASI OP KEDUA ---
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(254, 240, 138);
    doc.roundedRect(leftMargin, currentY, contentWidth, 42, 2, 2, 'FD');

    doc.setFillColor(254, 249, 195);
    doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(133, 77, 14);
    doc.text('CHECKLIST KELENGKAPAN BERKAS & EDUKASI OPERASI KEDUA', leftMargin + 4, currentY + 4.2);

    let eY = currentY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Rencana Tindakan: ${letter.edukasiOp2Params.rencanaTindakan}`, leftMargin + 4, eY);
    doc.text(`Tanggal Rencana: ${formatIndonesianDate(letter.edukasiOp2Params.tanggalRencanaOp)}  |  RS Pertama: ${letter.edukasiOp2Params.rsPerujukPertama}`, leftMargin + 4, eY + 5);

    eY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`[X] Santunan Jasa Raharja Maksimal Rp 20.000.000,- (Bila ada selisih, ditanggung BPJS/Pribadi)`, leftMargin + 4, eY);
    doc.text(`[X] Surat Rujukan dari Faskes Tingkat 1 (Puskesmas / Klinik Pertama)`, leftMargin + 4, eY + 4.5);
    doc.text(`[X] Laporan Polisi (LP) / Berita Acara Kasus Lalu Lintas Resmi`, leftMargin + 4, eY + 9);
    doc.text(`[X] Rincian Biaya Perawatan & Kwitansi Asli dari Rumah Sakit Pertama`, leftMargin + 4, eY + 13.5);

    currentY += 46;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 93, 66);
    doc.text(`Kontak PIC Jasa Raharja: ${letter.edukasiOp2Params.namaPicJasaRaharja} (${letter.edukasiOp2Params.kontakPicJasaRaharja})`, leftMargin, currentY);
    currentY += 7;

  } else if (letter.jenisSurat === 'KUASA_JR' && letter.kuasaJrParams) {
    // --- SURAT KUASA JASA RAHARJA ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(leftMargin, currentY, contentWidth, 34, 2, 2, 'FD');

    doc.setFillColor(241, 245, 249);
    doc.rect(leftMargin, currentY, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('PIHAK I (PEMBERI KUASA) & NILAI BIAYA SANTUNAN', leftMargin + 4, currentY + 4);

    let kY = currentY + 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Nama Pemberi Kuasa', leftMargin + 4, kY);
    doc.text('Hubungan dg Pasien', leftMargin + 4, kY + 4.5);
    doc.text('Total Biaya Rawat', leftMargin + 4, kY + 9);
    doc.text('Terbilang', leftMargin + 4, kY + 13.5);
    doc.text('Periode Perawatan', leftMargin + 4, kY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`:  ${letter.kuasaJrParams.namaPemberiKuasa} (NIK: ${letter.kuasaJrParams.nikPemberiKuasa})`, leftMargin + 45, kY);
    doc.text(`:  ${letter.kuasaJrParams.hubunganPemberiKuasa}`, leftMargin + 45, kY + 4.5);
    doc.text(`:  Rp ${letter.kuasaJrParams.totalBiayaPerawatan.toLocaleString('id-ID')}`, leftMargin + 45, kY + 9);
    doc.text(`:  "${letter.kuasaJrParams.terbilang}"`, leftMargin + 45, kY + 13.5);
    doc.text(`:  ${formatIndonesianDate(letter.kuasaJrParams.tanggalMulaiRawat)} s.d. ${formatIndonesianDate(letter.kuasaJrParams.tanggalSelesaiRawat)}`, leftMargin + 45, kY + 18);

    currentY += 38;

  } else if (letter.jenisSurat === 'TITIP_KELAS' && letter.titipKelasParams) {
    // --- TITIP KELAS ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(leftMargin, currentY, contentWidth, 34, 2, 2, 'FD');

    doc.setFillColor(241, 245, 249);
    doc.rect(leftMargin, currentY, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('DATA PENEMPATAN KAMAR & TITIP KELAS RAWAT INAP', leftMargin + 4, currentY + 4);

    let tY = currentY + 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Hak Kelas Pasien', leftMargin + 4, tY);
    doc.text('Kamar Ditempati', leftMargin + 4, tY + 4.5);
    doc.text('Tarif Sewa Kamar', leftMargin + 4, tY + 9);
    doc.text('Alasan Titip Kelas', leftMargin + 4, tY + 13.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`:  ${letter.titipKelasParams.hakKelasBpjs}`, leftMargin + 45, tY);
    doc.text(`:  ${letter.titipKelasParams.kelasKamarDipilih}`, leftMargin + 45, tY + 4.5);
    doc.text(`:  Rp ${letter.titipKelasParams.tarifPerHari.toLocaleString('id-ID')} / hari`, leftMargin + 45, tY + 9);

    const splitAlasan = doc.splitTextToSize(`:  ${letter.titipKelasParams.alasanTitipKelas}`, contentWidth - 48);
    doc.text(splitAlasan, leftMargin + 45, tY + 13.5);

    currentY += 38;

  } else if (letter.jenisSurat === 'GAGAL_FINGERPRINT' && letter.gagalFingerprintParams) {
    // --- GAGAL FINGERPRINT ---
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(leftMargin, currentY, contentWidth, 32, 2, 2, 'FD');

    doc.setFillColor(254, 226, 226);
    doc.rect(leftMargin, currentY, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text('KENDALA VERIFIKASI BIOMETRIK SIDIK JARI (FINGERPRINT)', leftMargin + 4, currentY + 4);

    let gY = currentY + 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Kategori Kendala', leftMargin + 4, gY);
    doc.text('Nomor SEP BPJS', leftMargin + 4, gY + 4.5);
    doc.text('Poli Tujuan', leftMargin + 4, gY + 9);
    doc.text('Uraian Alasan', leftMargin + 4, gY + 13.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`:  ${letter.gagalFingerprintParams.alasanGagal}`, leftMargin + 45, gY);
    doc.text(`:  ${letter.gagalFingerprintParams.nomorSep || '-'}`, leftMargin + 45, gY + 4.5);
    doc.text(`:  ${letter.gagalFingerprintParams.tujuanPoli}`, leftMargin + 45, gY + 9);

    const splitUraian = doc.splitTextToSize(`:  ${letter.gagalFingerprintParams.alasanKustom || letter.gagalFingerprintParams.alasanGagal}`, contentWidth - 48);
    doc.text(splitUraian, leftMargin + 45, gY + 13.5);

    currentY += 36;
  } else if (letter.jenisSurat === 'SEHAT' && letter.sehatParams) {
    // Surat Sehat
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(leftMargin, currentY, contentWidth, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('TANDA VITAL & HASIL PEMERIKSAAN FISIK:', leftMargin + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`TB / BB: ${letter.sehatParams.tinggiBadan} cm / ${letter.sehatParams.beratBadan} kg`, leftMargin + 4, currentY + 10);
    doc.text(`Tekanan Darah: ${letter.sehatParams.tekananDarah}`, leftMargin + 4, currentY + 15);
    doc.text(`Denyut Nadi: ${letter.sehatParams.nadi}`, leftMargin + 4, currentY + 20);

    doc.text(`Golongan Darah: ${letter.sehatParams.golonganDarah}`, leftMargin + 70, currentY + 10);
    doc.text(`Tes Buta Warna: ${letter.sehatParams.butaWarna}`, leftMargin + 70, currentY + 15);
    doc.text(`Status: ${letter.sehatParams.statusKesehatan}`, leftMargin + 70, currentY + 20);

    currentY += 30;
  } else if (letter.jenisSurat === 'DOKTER' && letter.dokterParams) {
    // Surat Sakit
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(leftMargin, currentY, contentWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text(`Diagnosa Medis: ${letter.dokterParams.diagnosaMedis}`, leftMargin + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Diberikan istirahat selama: ${letter.dokterParams.lamaIstirahatHari} (${numberToWordsIndonesian(letter.dokterParams.lamaIstirahatHari)}) hari, dari ${formatIndonesianDate(letter.dokterParams.tglMulaiIstirahat)} s.d. ${formatIndonesianDate(letter.dokterParams.tglSelesaiIstirahat)}.`,
      leftMargin + 4,
      currentY + 12
    );
    if (letter.dokterParams.anjuranMedis) {
      doc.text(`Anjuran Medis: ${letter.dokterParams.anjuranMedis}`, leftMargin + 4, currentY + 18);
    }
    currentY += 28;
  } else if (letter.jenisSurat.startsWith('BPJS_KK')) {
    // BPJS TK KK1/2/3
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(leftMargin, currentY, contentWidth, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(14, 116, 144);
    doc.text('DATA KECELAKAAN KERJA & KEPESERTAAN BPJS KETENAGAKERJAAN:', leftMargin + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    if (letter.bpjsKk1Params) {
      doc.text(`Perusahaan: ${letter.bpjsKk1Params.namaPerusahaan} (NPP: ${letter.bpjsKk1Params.nppBpjsTk})`, leftMargin + 4, currentY + 11);
      doc.text(`Waktu Kejadian: ${formatIndonesianDate(letter.bpjsKk1Params.tanggalKecelakaan)} pk. ${letter.bpjsKk1Params.jamKecelakaan}`, leftMargin + 4, currentY + 16);
      doc.text(`Cidera: ${letter.bpjsKk1Params.bagianTubuhCidera}`, leftMargin + 4, currentY + 21);
    } else if (letter.bpjsKk2Params) {
      doc.text(`Perusahaan: ${letter.bpjsKk2Params.namaPerusahaan} (NPP: ${letter.bpjsKk2Params.nppBpjsTk})`, leftMargin + 4, currentY + 11);
      doc.text(`Diagnosa Kerja: ${letter.bpjsKk2Params.diagnosaKecelakaanKerja}`, leftMargin + 4, currentY + 16);
      doc.text(`Status Kemampuan: ${letter.bpjsKk2Params.statusKemampuanBekerja}`, leftMargin + 4, currentY + 21);
    } else if (letter.bpjsKk3Params) {
      doc.text(`Perusahaan: ${letter.bpjsKk3Params.namaPerusahaan} (NPP: ${letter.bpjsKk3Params.nppBpjsTk})`, leftMargin + 4, currentY + 11);
      doc.text(`Keadaan Akhir: ${letter.bpjsKk3Params.keadaanAkhirPasien}`, leftMargin + 4, currentY + 16);
      doc.text(`Kembali Bekerja: ${formatIndonesianDate(letter.bpjsKk3Params.tanggalKembaliBekerja)}`, leftMargin + 4, currentY + 21);
    }
    currentY += 30;
  }

  // 6. KEPERLUAN & PERNYATAAN PENUTUP
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Keperluan: ${letter.keperluan || '-'}`, leftMargin, currentY);
  currentY += 5;

  doc.text(
    'Demikian dokumen resmi ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.',
    leftMargin,
    currentY,
    { maxWidth: contentWidth }
  );

  // 7. AREA TANDA TANGAN (DUA PIHAK ATAU DOKTER & VERIFIKASI)
  const signY = 224;

  if (letter.jenisSurat === 'KUASA_JR') {
    // --- FORMAT DUA PIHAK + MATERAI 10.000 ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Babat, ${formatIndonesianDate(letter.tanggalSurat)}`, 135, signY - 4);

    doc.setFont('helvetica', 'bold');
    doc.text('PIHAK II (Penerima Kuasa)', leftMargin + 10, signY);
    doc.text('PIHAK I (Pemberi Kuasa)', 135, signY);

    // Kotak Materai 10.000 di Pihak I
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.rect(135, signY + 6, 28, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('MATERAI', 149, signY + 13, { align: 'center' });
    doc.text('Rp 10.000,-', 149, signY + 18, { align: 'center' });

    // Nama Pihak I & II
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(letter.kuasaJrParams?.namaPenerimaKuasa || 'Bagian Keuangan RSUMB', leftMargin + 10, signY + 30);
    doc.text(letter.kuasaJrParams?.namaPemberiKuasa || letter.namaPasien, 135, signY + 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('RSU Muhammadiyah Babat', leftMargin + 10, signY + 34);
    doc.text(`NIK: ${letter.kuasaJrParams?.nikPemberiKuasa || letter.nik}`, 135, signY + 34);

  } else if (letter.jenisSurat === 'EDUKASI_OP2' || letter.jenisSurat === 'TITIP_KELAS' || letter.jenisSurat === 'GAGAL_FINGERPRINT') {
    // --- FORMAT DUA PIHAK: PASIEN / KELUARGA & PETUGAS ADMISI ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Babat, ${formatIndonesianDate(letter.tanggalSurat)}`, 135, signY - 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Petugas Admisi / Rumah Sakit', leftMargin + 10, signY);
    doc.text('Pasien / Keluarga Penjamin', 135, signY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(letter.dokterNama || 'Petugas Admisi RSUMB', leftMargin + 10, signY + 28);
    doc.text(letter.namaPasien, 135, signY + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('RSU Muhammadiyah Babat', leftMargin + 10, signY + 32);
    doc.text(`NIK: ${letter.nik}`, 135, signY + 32);

  } else {
    // --- FORMAT RESMI DOKTER PEMERIKSA + STEMPEL + QR VERIFIKASI ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Babat, ${formatIndonesianDate(letter.tanggalSurat)}`, 135, signY - 4);

    doc.setFont('helvetica', 'bold');
    doc.text(letter.dokterJabatan || 'Dokter Pemeriksa RSUMB', 135, signY);

    // Stempel visual bulat
    try {
      doc.setDrawColor(0, 93, 66);
      doc.setLineWidth(0.5);
      doc.circle(126, signY + 16, 11, 'S');
      doc.circle(126, signY + 16, 9.8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(0, 93, 66);
      doc.text('RSU MUHAMMADIYAH', 126, signY + 13, { align: 'center' });
      doc.text('* BABAT *', 126, signY + 16.5, { align: 'center' });
      doc.text('PELAYANAN MEDIS', 126, signY + 20, { align: 'center' });
    } catch {
      // ignore
    }

    // QR Verification Box di kiri bawah
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(leftMargin, signY - 2, 45, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(0, 93, 66);
    doc.text('VERIFIKASI SIMRS RSUMB', leftMargin + 3, signY + 2.5);

    // Mini QR Pattern
    doc.setFillColor(15, 23, 42);
    doc.rect(leftMargin + 3, signY + 4.5, 14, 14, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(leftMargin + 5, signY + 6.5, 3.5, 3.5, 'F');
    doc.rect(leftMargin + 11.5, signY + 6.5, 3.5, 3.5, 'F');
    doc.rect(leftMargin + 5, signY + 13, 3.5, 3.5, 'F');
    doc.rect(leftMargin + 9.5, signY + 10.5, 2.5, 2.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Dokumen resmi sah', leftMargin + 19, signY + 8);
    doc.text('terverifikasi digital', leftMargin + 19, signY + 11.5);
    doc.text('oleh RSU Muhammadiyah', leftMargin + 19, signY + 15);
    doc.text(`ID: ${letter.id}`, leftMargin + 3, signY + 22);

    // Nama Dokter & SIP
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(letter.dokterNama, 135, signY + 28);

    const docNameWidth = doc.getTextWidth(letter.dokterNama);
    doc.setLineWidth(0.3);
    doc.line(135, signY + 29, 135 + docNameWidth, signY + 29);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`SIP: ${letter.dokterSip}`, 135, signY + 33);
  }

  // Simpan PDF
  const sanitizedName = letter.namaPasien.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${letter.jenisSurat}_${sanitizedName}_${letter.nomorSurat.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}
