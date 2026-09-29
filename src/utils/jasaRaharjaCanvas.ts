import { JasaRaharjaOcrItem } from '../data/jasaRaharjaData';

export interface SampleTableResult {
  dataUrl: string;
  items: (JasaRaharjaOcrItem & { box_2d: [number, number, number, number] })[];
}

/**
 * Menghasilkan gambar foto tabel resmi Jasa Raharja RS Muhammadiyah Babat (RSUMB)
 * dalam resolusi tinggi lengkap dengan koordinat baris (box_2d) yang akurat.
 */
export function generateSampleJasaRaharjaTableImage(): SampleTableResult {
  const width = 1280;
  const height = 760;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      dataUrl: '',
      items: []
    };
  }

  // 1. Background seperti kertas formulir resmi rumah sakit
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Lembar dokumen putih dengan border halus
  const padX = 24;
  const padY = 20;
  const docW = width - padX * 2;
  const docH = height - padY * 2;

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillRect(padX, padY, docW, docH);
  ctx.shadowColor = 'transparent';

  // Border luar dokumen
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padX, padY, docW, docH);

  // 2. Kop Surat Rumah Sakit Muhammadiyah Babat
  ctx.fillStyle = '#005d42';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RUMAH SAKIT MUHAMMADIYAH BABAT', width / 2, 60);

  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Jl. KH. Ahmad Dahlan No. 14, Babat, Lamongan - Telp: (0322) 451125 / SIMRS RSUMB', width / 2, 82);

  ctx.fillStyle = '#0b1c30';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('LEMBAR KONTROL & MONITORING PLAFON KLAIM JASA RAHARJA (KLL)', width / 2, 108);

  // Garis kop surat ganda
  ctx.beginPath();
  ctx.moveTo(padX + 20, 122);
  ctx.lineTo(width - padX - 20, 122);
  ctx.strokeStyle = '#005d42';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padX + 20, 126);
  ctx.lineTo(width - padX - 20, 126);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Watermark halus
  ctx.save();
  ctx.translate(width / 2, height / 2 + 30);
  ctx.rotate(-Math.PI / 12);
  ctx.fillStyle = 'rgba(0, 93, 66, 0.03)';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RS MUHAMMADIYAH BABAT - KLL', 0, 0);
  ctx.restore();

  // 3. Grid Header Tabel
  const tableX = padX + 20;
  const tableY = 145;
  const tableW = docW - 40;
  const headerH = 44;
  const rowH = 75;

  // Header Box
  ctx.fillStyle = '#005d42';
  ctx.fillRect(tableX, tableY, tableW, headerH);

  // Definisi Kolom
  const cols = [
    { label: 'NO', width: 55, align: 'center' as CanvasTextAlign },
    { label: 'TANGGAL', width: 110, align: 'center' as CanvasTextAlign },
    { label: 'NO. RM', width: 120, align: 'center' as CanvasTextAlign },
    { label: 'NAMA PASIEN (KORBAN KLL)', width: 280, align: 'left' as CanvasTextAlign },
    { label: 'BIAYA TERPAKAI', width: 190, align: 'right' as CanvasTextAlign },
    { label: 'SISA PLAFON', width: 190, align: 'right' as CanvasTextAlign },
    { label: 'STATUS / KET', width: tableW - (55 + 110 + 120 + 280 + 190 + 190), align: 'center' as CanvasTextAlign },
  ];

  // Render Header Teks
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  let curX = tableX;
  cols.forEach((col) => {
    let textX = curX + col.width / 2;
    if (col.align === 'left') textX = curX + 16;
    if (col.align === 'right') textX = curX + col.width - 16;
    ctx.textAlign = col.align;
    ctx.fillText(col.label, textX, tableY + 27);

    // Divider header
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(curX + col.width, tableY);
    ctx.lineTo(curX + col.width, tableY + headerH);
    ctx.stroke();

    curX += col.width;
  });

  // Data Pasien untuk foto sampel tabel
  const sampleRows: (JasaRaharjaOcrItem & { statusColor: string; bgStatus: string })[] = [
    {
      no_rm: '074218',
      tanggal: '18-Sep-2026',
      nama_pasien: 'JUWARIYAH',
      biaya_terpakai: '11.738.348',
      sisa_plafon: '8.261.652',
      status_keterangan: 'RANAP',
      statusColor: '#065f46',
      bgStatus: '#d1fae5'
    },
    {
      no_rm: '08-41-29',
      tanggal: '17-Sep-2026',
      nama_pasien: 'M. Syaifuddin',
      biaya_terpakai: '14.250.000',
      sisa_plafon: '5.750.000',
      status_keterangan: 'RANAP',
      statusColor: '#065f46',
      bgStatus: '#d1fae5'
    },
    {
      no_rm: '09-12-05',
      tanggal: '16-Sep-2026',
      nama_pasien: 'Sri Wahyuni',
      biaya_terpakai: '20.000.000',
      sisa_plafon: '0',
      status_keterangan: 'HABIS',
      statusColor: '#9f1239',
      bgStatus: '#ffe4e6'
    },
    {
      no_rm: '07-88-14',
      tanggal: '15-Sep-2026',
      nama_pasien: 'Dimas Pratama',
      biaya_terpakai: '18.500.000',
      sisa_plafon: '1.500.000',
      status_keterangan: 'AFF KWIRE',
      statusColor: '#3730a3',
      bgStatus: '#e0e7ff'
    },
    {
      no_rm: '08-95-30',
      tanggal: '14-Sep-2026',
      nama_pasien: 'Joko Susilo',
      biaya_terpakai: '20.000.000',
      sisa_plafon: '0',
      status_keterangan: 'RUJUK',
      statusColor: '#92400e',
      bgStatus: '#fef3c7'
    }
  ];

  const itemsWithBoxes: (JasaRaharjaOcrItem & { box_2d: [number, number, number, number] })[] = [];

  let curY = tableY + headerH;
  sampleRows.forEach((row, idx) => {
    const isEven = idx % 2 === 1;
    ctx.fillStyle = isEven ? '#f8fafc' : '#ffffff';
    ctx.fillRect(tableX, curY, tableW, rowH);

    // Hitung koordinat bounding box normalisasi (0-1000)
    const ymin = Math.round((curY / height) * 1000);
    const ymax = Math.round(((curY + rowH) / height) * 1000);
    const xmin = Math.round((tableX / width) * 1000);
    const xmax = Math.round(((tableX + tableW) / width) * 1000);

    itemsWithBoxes.push({
      ...row,
      box_2d: [ymin, xmin, ymax, xmax]
    });

    // Garis pemisah bawah baris
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableX, curY + rowH);
    ctx.lineTo(tableX + tableW, curY + rowH);
    ctx.stroke();

    // Kolom 1: No
    let cellX = tableX;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(idx + 1), cellX + cols[0].width / 2, curY + 42);
    cellX += cols[0].width;

    // Kolom 2: Tanggal
    ctx.fillStyle = '#334155';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(row.tanggal), cellX + cols[1].width / 2, curY + 42);
    cellX += cols[1].width;

    // Kolom 3: No RM
    ctx.fillStyle = '#005d42';
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(row.no_rm), cellX + cols[2].width / 2, curY + 42);
    cellX += cols[2].width;

    // Kolom 4: Nama Pasien
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(row.nama_pasien).toUpperCase(), cellX + 16, curY + 36);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('Pasien KLL - Jasa Raharja (Plafon Rp 20.000.000)', cellX + 16, curY + 54);
    cellX += cols[3].width;

    // Kolom 5: Biaya Terpakai
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Rp ${row.biaya_terpakai}`, cellX + cols[4].width - 16, curY + 42);
    cellX += cols[4].width;

    // Kolom 6: Sisa Plafon
    const isHabis = String(row.sisa_plafon) === '0' || String(row.status_keterangan).toUpperCase() === 'HABIS';
    ctx.fillStyle = isHabis ? '#e11d48' : '#059669';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(isHabis ? 'Rp 0 (HABIS)' : `Rp ${row.sisa_plafon}`, cellX + cols[5].width - 16, curY + 42);
    cellX += cols[5].width;

    // Kolom 7: Status / Keterangan Badge
    const badgeW = 92;
    const badgeH = 26;
    const badgeX = cellX + (cols[6].width - badgeW) / 2;
    const badgeY = curY + (rowH - badgeH) / 2;

    ctx.fillStyle = row.bgStatus;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
    ctx.fill();

    ctx.strokeStyle = row.statusColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = row.statusColor;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(row.status_keterangan), badgeX + badgeW / 2, badgeY + 17);

    curY += rowH;
  });

  // Border keliling tabel
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(tableX, tableY, tableW, curY - tableY);

  // 4. Bagian Bawah / Tanda Tangan Verifikator & Stempel
  const footerY = curY + 30;
  ctx.fillStyle = '#475569';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Catatan: Plafon maksimal perawatan & pengobatan korban KLL adalah Rp 20.000.000,- (Dua Puluh Juta Rupiah).', tableX, footerY);
  ctx.fillText('Jika biaya melebihi plafon Jasa Raharja, berkas segera dialihkan ke penjamin kedua (BPJS Kesehatan / Asuransi Lain).', tableX, footerY + 18);

  // Stempel Verifikasi
  const stampX = width - padX - 220;
  ctx.textAlign = 'center';
  ctx.fillText('Babat, Lamongan', stampX, footerY);
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Petugas Klaim Jasa Raharja RSUMB', stampX, footerY + 18);

  // Cap / Stamp Lingkaran
  ctx.save();
  ctx.translate(stampX, footerY + 54);
  ctx.rotate(-0.08);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.strokeRect(-65, -16, 130, 32);
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('TERVERIFIKASI JR', 0, 4);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
  return {
    dataUrl,
    items: itemsWithBoxes
  };
}
