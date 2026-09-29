import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  title: string;
  subtitle?: string;
  totalLabel?: string;
  headers: string[];
  data: (string | number)[][];
  columnAlignments?: ('left' | 'center' | 'right')[];
}

export interface PdfExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  totalLabel?: string;
  headers: string[];
  data: (string | number)[][];
  columnStyles?: Record<number, { cellWidth?: number; halign?: 'left' | 'center' | 'right' }>;
  orientation?: 'portrait' | 'landscape';
  signatureCity?: string;
  signatureTitle?: string;
  fontSize?: number;
  headFontSize?: number;
  cellPadding?: number;
}

/**
 * Helper teruji untuk memicu unduhan file Blob secara aman dan andal
 * di semua browser modern dan lingkungan sandboxed iframe.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Dukungan untuk browser IE / Edge lama jika ada
  if (typeof (window.navigator as any)?.msSaveOrOpenBlob === 'function') {
    (window.navigator as any).msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);

  // Trigger klik unduh
  try {
    a.click();
  } catch {
    const evt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    a.dispatchEvent(evt);
  }

  // Jaga Blob URL tetap aktif selama beberapa detik agar download manager
  // browser sempat menginisiasi unduhan secara lengkap sebelum dibersihkan
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 10000);
}

/**
 * Mengonversi URL gambar menjadi base64 untuk disematkan ke PDF atau Canvas
 * Dilengkapi batas waktu timeout agar tidak menggantung pembuatan PDF jika gambar gagal dimuat
 */
export async function getBase64ImageFromUrl(imageUrl: string, timeoutMs: number = 1000): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 120;
          canvas.height = img.naturalHeight || img.height || 120;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      };
      img.src = imageUrl;
    } catch {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      }
    }
  });
}

/**
 * Format tanggal penanggalan Indonesia lengkap
 */
export function getIndonesianCurrentDate(): { dateStr: string; timeStr: string } {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return { dateStr, timeStr: `${timeStr} WIB` };
}

/**
 * EKSPOR KE EXCEL (.xlsx) dengan ExcelJS
 * - Header tabel warna hijau RSUMB (#047857) dengan teks putih tebal
 * - Auto-fit column width
 * - Judul Laporan, Tanggal Ekspor, dan Total Data di baris atas
 */
export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const {
    filename,
    sheetName = 'Laporan RSUMB',
    title,
    subtitle,
    totalLabel,
    headers,
    data,
    columnAlignments = []
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIMRS RSU Muhammadiyah Babat';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    pageSetup: { orientation: 'landscape', paperSize: 9 } // A4 Landscape
  });

  const { dateStr, timeStr } = getIndonesianCurrentDate();

  // 1. Baris 1: Kop Nama Rumah Sakit
  const hospitalRow = worksheet.addRow(['RSU MUHAMMADIYAH BABAT (RSUMB)']);
  hospitalRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF047857' } };
  worksheet.mergeCells(1, 1, 1, Math.max(headers.length, 5));

  // 2. Baris 2: Judul Laporan
  const titleRow = worksheet.addRow([title.toUpperCase()]);
  titleRow.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0B1C30' } };
  worksheet.mergeCells(2, 1, 2, Math.max(headers.length, 5));

  // 3. Baris 3: Tanggal Ekspor & Waktu
  const dateRow = worksheet.addRow([
    `Tanggal Ekspor: ${dateStr}, ${timeStr}${subtitle ? ` | ${subtitle}` : ''}`
  ]);
  dateRow.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  worksheet.mergeCells(3, 1, 3, Math.max(headers.length, 5));

  // 4. Baris 4: Total Data
  const countRow = worksheet.addRow([
    totalLabel || `Total Data: ${data.length} baris`
  ]);
  countRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } };
  worksheet.mergeCells(4, 1, 4, Math.max(headers.length, 5));

  // 5. Baris 5: Spasi Kosong Pemisah
  worksheet.addRow([]);

  // 6. Baris 6: Header Tabel
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' } // Hijau RSUMB #047857
    };
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' } // Teks Putih Tebal
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF065F46' } },
      bottom: { style: 'medium', color: { argb: 'FF065F46' } },
      left: { style: 'thin', color: { argb: 'FF34D399' } },
      right: { style: 'thin', color: { argb: 'FF34D399' } }
    };
  });

  // 7. Baris 7+: Data Rows
  data.forEach((rowData, rIdx) => {
    const row = worksheet.addRow(rowData);
    row.height = 20;

    const isEven = rIdx % 2 === 1;

    row.eachCell((cell, colNumber) => {
      const align = columnAlignments[colNumber - 1] || 'left';

      cell.font = {
        name: 'Calibri',
        size: 9.5,
        color: { argb: 'FF1E293B' }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: align,
        wrapText: true
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }
    });
  });

  // 8. Auto-fit column widths
  worksheet.columns.forEach((column, colIdx) => {
    let maxLength = 0;
    const headerTitle = headers[colIdx] ? String(headers[colIdx]) : '';
    maxLength = Math.max(maxLength, headerTitle.length);

    data.forEach((row) => {
      const cellVal = row[colIdx];
      if (cellVal !== undefined && cellVal !== null) {
        const lines = String(cellVal).split('\n');
        lines.forEach((line) => {
          maxLength = Math.max(maxLength, line.length);
        });
      }
    });

    // Batasi lebar kolom agar rapi (minimal 10, maksimal 55 karakter + padding)
    column.width = Math.min(Math.max(maxLength + 4, 10), 55);
  });

  // 9. Write to Buffer & Trigger Browser Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  downloadBlob(blob, cleanFilename);
}

/**
 * EKSPOR KE PDF (.pdf) dengan jsPDF & jspdf-autotable
 * - Kop Resmi RSUMB (Nama RS, Alamat, Telp, dan Logo)
 * - Tabel bersih bergaris tipis, nomor urut rapi, tata letak Lanskap (Landscape)
 * - Kolom verifikasi / tanda tangan di pojok kanan bawah
 */
export async function exportToPdf(options: PdfExportOptions): Promise<void> {
  const {
    filename,
    title,
    subtitle,
    totalLabel,
    headers,
    data,
    columnStyles = {},
    orientation = 'landscape',
    signatureCity = 'Babat',
    signatureTitle = 'Petugas Verifikasi SIMRS / Penanggung Jawab'
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;
  const marginX = 14;

  const { dateStr, timeStr } = getIndonesianCurrentDate();

  // 1. Coba render Logo RSUMB jika tersedia
  try {
    const logoBase64 = await getBase64ImageFromUrl('/logo-rsumb.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', marginX, 10, 16, 16);
    }
  } catch {
    // Abaikan jika logo gagal dimuat
  }

  // 2. Teks Kop Resmi RSUMB
  const kopTextX = 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 28, 48);
  doc.text('RSU MUHAMMADIYAH BABAT', kopTextX, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur | Telp. (0322) 451111 / 451234',
    kopTextX,
    20
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(4, 120, 87); // #047857
  doc.text(title.toUpperCase(), kopTextX, 25.5);

  // 3. Garis Pembatas Kop Ganda
  const lineRight = pageWidth - marginX;
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(0.7);
  doc.line(marginX, 28, lineRight, 28);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.2);
  doc.line(marginX, 29, lineRight, 29);

  // 4. Meta Info Baris Subtitle / Tanggal / Total
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    subtitle ? `${subtitle}` : 'Pelayanan Rawat Jalan & Kamar Operasi RSUMB',
    marginX,
    33.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(
    totalLabel || `Total Data: ${data.length} Data Terdaftar`,
    pageWidth / 2,
    33.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak: ${dateStr}, ${timeStr}`, lineRight, 33.5, { align: 'right' });

  // 5. Tabel dengan autoTable
  autoTable(doc, {
    startY: 36.5,
    head: [headers],
    body: data.length > 0 ? data : [['-', 'Tidak ada data ditemukan', ...Array(headers.length - 2).fill('-')]],
    theme: 'grid',
    headStyles: {
      fillColor: [4, 120, 87], // #047857 RSUMB Green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: columnStyles,
    margin: { left: marginX, right: marginX },
    didDrawPage: (hookData) => {
      // Footer Halaman
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Sistem Informasi Manajemen RS (SIMRS) • RSU Muhammadiyah Babat',
        marginX,
        pageHeight - 8
      );
      const pageNumStr = `Halaman ${hookData.pageNumber}`;
      doc.text(pageNumStr, lineRight, pageHeight - 8, { align: 'right' });
    }
  });

  // 6. Kolom Tanda Tangan / Verifikasi Petugas (Pojok Kanan Bawah)
  const finalY = (doc as any).lastAutoTable?.finalY || 130;
  const signatureHeight = 32;

  // Jika tidak cukup ruang di halaman akhir, tambahkan halaman baru
  if (finalY + signatureHeight + 12 > pageHeight - 12) {
    doc.addPage();
    renderPdfSignatureBlock(doc, 25, lineRight, signatureCity, dateStr, signatureTitle);
  } else {
    renderPdfSignatureBlock(doc, finalY + 8, lineRight, signatureCity, dateStr, signatureTitle);
  }

  // 7. Simpan file
  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  try {
    const pdfBlob = doc.output('blob');
    downloadBlob(pdfBlob, finalFilename);
  } catch (err) {
    console.warn('downloadBlob failed for pdf, falling back to doc.save:', err);
    doc.save(finalFilename);
  }
}

function renderPdfSignatureBlock(
  doc: jsPDF,
  startY: number,
  rightX: number,
  city: string,
  dateStr: string,
  title: string
): void {
  const boxWidth = 70;
  const startX = rightX - boxWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text(`${city}, ${dateStr}`, startX + boxWidth / 2, startY, { align: 'center' });
  doc.text(title, startX + boxWidth / 2, startY + 5, { align: 'center' });

  // Ruang Tanda Tangan
  const lineY = startY + 22;
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);
  doc.line(startX + 5, lineY, rightX - 5, lineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('( .................................................... )', startX + boxWidth / 2, lineY - 1, {
    align: 'center'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NIP / Tanda Tangan & Cap', startX + boxWidth / 2, lineY + 4, { align: 'center' });
}

export interface MultiSheetExcelOptions {
  filename: string;
  sheets: {
    sheetName: string;
    title: string;
    subtitle?: string;
    totalLabel?: string;
    headers: string[];
    data: (string | number)[][];
    columnAlignments?: ('left' | 'center' | 'right')[];
  }[];
}

/**
 * EKSPOR KE EXCEL (.xlsx) Multi-Sheet dengan ExcelJS
 * Menyediakan lembar kerja terpisah untuk masing-masing topik laporan
 */
export async function exportMultiSheetExcel(options: MultiSheetExcelOptions): Promise<void> {
  const { filename, sheets } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIMRS RSU Muhammadiyah Babat';
  workbook.created = new Date();

  const { dateStr, timeStr } = getIndonesianCurrentDate();

  for (const sheetConfig of sheets) {
    const {
      sheetName,
      title,
      subtitle,
      totalLabel,
      headers,
      data,
      columnAlignments = []
    } = sheetConfig;

    const cleanSheetName = sheetName.substring(0, 31).replace(/[\\/?*\[\]]/g, '');
    const worksheet = workbook.addWorksheet(cleanSheetName, {
      pageSetup: { orientation: 'landscape', paperSize: 9 }
    });

    // 1. Kop Nama Rumah Sakit
    const hospitalRow = worksheet.addRow(['RSU MUHAMMADIYAH BABAT (RSUMB)']);
    hospitalRow.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF047857' } };
    worksheet.mergeCells(1, 1, 1, Math.max(headers.length, 5));

    // 2. Judul Laporan Sheet
    const titleRow = worksheet.addRow([title.toUpperCase()]);
    titleRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0B1C30' } };
    worksheet.mergeCells(2, 1, 2, Math.max(headers.length, 5));

    // 3. Tanggal Ekspor & Subtitle
    const dateRow = worksheet.addRow([
      `Tanggal Ekspor: ${dateStr}, ${timeStr}${subtitle ? ` | ${subtitle}` : ''}`
    ]);
    dateRow.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    worksheet.mergeCells(3, 1, 3, Math.max(headers.length, 5));

    // 4. Total Data
    const countRow = worksheet.addRow([
      totalLabel || `Total Data: ${data.length} baris`
    ]);
    countRow.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF047857' } };
    worksheet.mergeCells(4, 1, 4, Math.max(headers.length, 5));

    // 5. Spasi Kosong
    worksheet.addRow([]);

    // 6. Header Tabel
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      cell.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF065F46' } },
        bottom: { style: 'medium', color: { argb: 'FF065F46' } },
        left: { style: 'thin', color: { argb: 'FF34D399' } },
        right: { style: 'thin', color: { argb: 'FF34D399' } }
      };
    });

    // 7. Baris Data
    data.forEach((rowData, rIdx) => {
      const row = worksheet.addRow(rowData);
      row.height = 20;
      const isEven = rIdx % 2 === 1;

      row.eachCell((cell, colNumber) => {
        const align = columnAlignments[colNumber - 1] || 'left';
        cell.font = {
          name: 'Calibri',
          size: 9.5,
          color: { argb: 'FF1E293B' }
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: align,
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });
    });

    // 8. Auto-fit column widths
    worksheet.columns.forEach((column, colIdx) => {
      let maxLength = 0;
      const headerTitle = headers[colIdx] ? String(headers[colIdx]) : '';
      maxLength = Math.max(maxLength, headerTitle.length);

      data.forEach((row) => {
        const cellVal = row[colIdx];
        if (cellVal !== undefined && cellVal !== null) {
          const lines = String(cellVal).split('\n');
          lines.forEach((line) => {
            maxLength = Math.max(maxLength, line.length);
          });
        }
      });

      column.width = Math.min(Math.max(maxLength + 4, 11), 60);
    });
  }

  // 9. Write & Trigger Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  downloadBlob(blob, cleanFilename);
}

