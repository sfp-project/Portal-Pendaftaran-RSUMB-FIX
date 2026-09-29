import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MonthlyScheduleData,
  StaffCalculatedSummary,
  DepartmentTotalSummary,
  IncentiveRates
} from '../types/incentiveTypes';
import { INDONESIAN_DAY_NAMES, getDayOfWeek } from '../data/incentiveData';

export function formatRupiah(num: number): string {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export async function exportIncentiveToExcel(
  monthData: MonthlyScheduleData,
  summaries: StaffCalculatedSummary[],
  deptTotal: DepartmentTotalSummary,
  rates: IncentiveRates
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIMRS MedCentral - RSU Muhammadiyah Babat';
  workbook.created = new Date();

  // SHEET 1: Rekapitulasi Insentif
  const sheet1 = workbook.addWorksheet('Rekapitulasi Insentif', {
    pageSetup: { orientation: 'landscape', paperSize: 9 }
  });

  // Judul
  sheet1.mergeCells('A1:L1');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = 'RSU MUHAMMADIYAH BABAT - REKAPITULASI INSENTIF & JAM DINAS';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF004D40' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(1).height = 25;

  sheet1.mergeCells('A2:L2');
  const subCell = sheet1.getCell('A2');
  subCell.value = `Unit: Pendaftaran & Admisi | Periode: ${monthData.monthName} ${monthData.year} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };

  sheet1.mergeCells('A3:L3');
  const rateCell = sheet1.getCell('A3');
  rateCell.value = `Tarif: Uang Malam = ${formatRupiah(rates.uangMalam)} / shift M | Uang Makan = ${formatRupiah(rates.uangMakan)} (khusus Shift M: Selasa, Rabu, Jumat, Sabtu & Minggu) | Jam M = ${rates.hoursM} Jam, P/S = ${rates.hoursP} Jam`;
  rateCell.font = { name: 'Arial', size: 9, color: { argb: 'FF333333' } };
  rateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(3).height = 18;

  // Header Kolom Tabel
  const headers = [
    'No',
    'Nama Pegawai',
    'P / IP',
    'S / IS',
    'M (Malam)',
    'L / LE',
    'Cuti',
    'Ekstra Libur',
    'Total Jam Kerja',
    'Uang Malam (Rp)',
    'Uang Makan (Rp)',
    'Grand Total (Rp)'
  ];

  const headerRow = sheet1.addRow(headers);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00695C' }
    };
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Data baris
  summaries.forEach((s, idx) => {
    const row = sheet1.addRow([
      idx + 1,
      s.name,
      s.countP,
      s.countS,
      s.countM,
      s.countL,
      s.countC,
      s.extraOffDays,
      s.totalHours,
      s.uangMalam,
      s.uangMakan,
      s.totalInsentif
    ]);

    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };

      if (colNumber === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.font = { name: 'Arial', size: 9.5, bold: true };
      } else if (colNumber >= 3 && colNumber <= 9) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        // Nominal Rupiah
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
      }
    });
  });

  // Baris Grand Total
  const totalRow = sheet1.addRow([
    '',
    'TOTAL KESELURUHAN',
    deptTotal.totalP,
    deptTotal.totalS,
    deptTotal.totalM,
    deptTotal.totalL,
    deptTotal.totalC,
    deptTotal.totalExtraOffDays,
    deptTotal.totalHours,
    deptTotal.totalUangMalam,
    deptTotal.totalUangMakan,
    deptTotal.grandTotalInsentif
  ]);

  totalRow.height = 24;
  totalRow.eachCell((cell, colNumber) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0F2F1' }
    };
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF004D40' } };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF004D40' } },
      bottom: { style: 'double', color: { argb: 'FF004D40' } },
      left: { style: 'thin', color: { argb: 'FFB2DFDB' } },
      right: { style: 'thin', color: { argb: 'FFB2DFDB' } }
    };

    if (colNumber === 2) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (colNumber >= 3 && colNumber <= 9) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (colNumber >= 10) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0';
    }
  });

  // Atur lebar kolom
  sheet1.columns = [
    { width: 6 }, // No
    { width: 22 }, // Nama
    { width: 10 }, // P/IP
    { width: 10 }, // S/IS
    { width: 12 }, // M
    { width: 10 }, // L/LE
    { width: 8 }, // C
    { width: 13 }, // Ekstra Libur
    { width: 16 }, // Total Jam
    { width: 18 }, // Uang Malam
    { width: 18 }, // Uang Makan
    { width: 20 } // Grand Total
  ];

  // SHEET 2: Matriks Jadwal Harian (1-31)
  const sheet2 = workbook.addWorksheet('Matriks Jadwal Harian');
  const matrixHeaders = ['No', 'Nama Pegawai'];
  for (let d = 1; d <= monthData.daysInMonth; d++) {
    const dow = getDayOfWeek(monthData.year, monthData.month, d);
    matrixHeaders.push(`${d} (${INDONESIAN_DAY_NAMES[dow].slice(0, 3)})`);
  }
  const mHeaderRow = sheet2.addRow(matrixHeaders);
  mHeaderRow.height = 22;
  mHeaderRow.eachCell((c, colNum) => {
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF37474F' }
    };
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  monthData.staffRows.forEach((staff, idx) => {
    const rowData: any[] = [idx + 1, staff.name];
    for (let d = 1; d <= monthData.daysInMonth; d++) {
      rowData.push(staff.shifts[d] || '-');
    }
    const row = sheet2.addRow(rowData);
    row.height = 18;
    row.eachCell((c, colNum) => {
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.font = { name: 'Arial', size: 9 };
      if (colNum === 2) {
        c.alignment = { horizontal: 'left', vertical: 'middle' };
        c.font = { name: 'Arial', size: 9, bold: true };
      }
    });
  });

  sheet2.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 5;
    else if (idx === 1) col.width = 20;
    else col.width = 8;
  });

  // Simpan file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Rekap_Insentif_RSUMB_${monthData.monthName}_${monthData.year}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function exportIncentiveToPdf(
  monthData: MonthlyScheduleData,
  summaries: StaffCalculatedSummary[],
  deptTotal: DepartmentTotalSummary,
  rates: IncentiveRates
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header RSUMB
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 93, 66); // Hijau khas RSUMB
  doc.text('RSU MUHAMMADIYAH BABAT', 148, 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('REKAPITULASI INSENTIF DINAS & JAM KERJA STAF PENDAFTARAN', 148, 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Periode: ${monthData.monthName} ${monthData.year} | Tarif: Uang Malam = ${formatRupiah(rates.uangMalam)} / shift M | Uang Makan = ${formatRupiah(rates.uangMakan)} (Shift M: Sel, Rab, Jum, Sab, Min)`,
    148,
    22,
    { align: 'center' }
  );

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 25, 283, 25);

  const head = [
    [
      'No',
      'Nama Pegawai',
      'Shift Malam (M)',
      'Uang Malam (Rp)',
      'Uang Makan (Rp)',
      'Grand Total (Rp)'
    ]
  ];

  const body = summaries.map((s, idx) => [
    idx + 1,
    s.name,
    `${s.countM} Shift`,
    formatRupiah(s.uangMalam),
    formatRupiah(s.uangMakan),
    formatRupiah(s.totalInsentif)
  ]);

  const foot = [
    [
      '',
      'TOTAL KESELURUHAN',
      `${deptTotal.totalM} Shift`,
      formatRupiah(deptTotal.totalUangMalam),
      formatRupiah(deptTotal.totalUangMakan),
      formatRupiah(deptTotal.grandTotalInsentif)
    ]
  ];

  autoTable(doc, {
    startY: 28,
    head,
    body,
    foot,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 93, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    footStyles: {
      fillColor: [224, 242, 241],
      textColor: [0, 77, 64],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 75 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 45 },
      4: { halign: 'right', cellWidth: 45 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // Bagian Tanda Tangan
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 185) {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Kiri: PJ Pendaftaran
    doc.text('Mengetahui,', 40, finalY);
    doc.text('Penanggung Jawab Admisi & Pendaftaran', 40, finalY + 5);
    doc.text('( .................................................... )', 40, finalY + 24);

    // Kanan: Ka. Sub Bag SDM / Keuangan
    doc.text(`Babat, ${todayStr}`, 210, finalY);
    doc.text('Ka. Sub Bagian SDM & Penggajian', 210, finalY + 5);
    doc.text('( .................................................... )', 210, finalY + 24);
  }

  doc.save(`Rekap_Insentif_RSUMB_${monthData.monthName}_${monthData.year}.pdf`);
}
