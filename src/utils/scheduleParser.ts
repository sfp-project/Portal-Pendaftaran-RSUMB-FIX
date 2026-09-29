import ExcelJS from 'exceljs';
import { StaffScheduleRow, MonthlyScheduleData } from '../types/incentiveTypes';
import { getDaysInMonth, MONTH_NAMES_ID } from '../data/incentiveData';

export interface ParseScheduleResult {
  success: boolean;
  staffRows: StaffScheduleRow[];
  detectedMonth?: number;
  detectedYear?: number;
  detectedHolidays?: number[];
  message?: string;
}

// 1. Parsing File Excel (XLSX/XLS)
export async function parseExcelSchedule(file: File, activeYear: number, activeMonth: number): Promise<ParseScheduleResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Ambil worksheet pertama
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { success: false, staffRows: [], message: 'File Excel tidak memiliki lembar kerja (worksheet).' };
    }

    const daysCount = getDaysInMonth(activeYear, activeMonth);
    let headerRowIdx = -1;
    let nameColIdx = -1;
    const dayColMap: Record<number, number> = {}; // day -> columnIndex

    // Scan 15 baris pertama untuk mencari baris header tanggal (1-30/31) dan kolom Nama
    worksheet.eachRow((row, rowNumber) => {
      if (headerRowIdx !== -1) return;

      let foundDates = 0;
      const tempDayMap: Record<number, number> = {};
      let tempNameCol = -1;

      row.eachCell((cell, colNumber) => {
        const val = String(cell.value || '').trim();
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= 1 && num <= 31) {
          tempDayMap[num] = colNumber;
          foundDates++;
        }
        if (/nama|pegawai|staf|karyawan/i.test(val)) {
          tempNameCol = colNumber;
        }
      });

      // Jika menemukan minimal 10 tanggal dalam satu baris, ini adalah baris header!
      if (foundDates >= 10) {
        headerRowIdx = rowNumber;
        nameColIdx = tempNameCol !== -1 ? tempNameCol : 2; // default kolom 2 jika kolom 1 adalah nomor
        Object.assign(dayColMap, tempDayMap);
      }
    });

    // Jika tidak ditemukan baris tanggal eksplisit, fallback ke kolom default (Nama: col 2, Hari: col 3 s/d 33)
    if (headerRowIdx === -1) {
      headerRowIdx = 1;
      nameColIdx = 2;
      for (let d = 1; d <= daysCount; d++) {
        dayColMap[d] = 2 + d;
      }
    }

    const parsedStaff: StaffScheduleRow[] = [];

    // Baca baris setelah header
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIdx) return;

      const nameCellVal = row.getCell(nameColIdx).value;
      let staffName = '';

      if (typeof nameCellVal === 'string') {
        staffName = nameCellVal.trim();
      } else if (nameCellVal && typeof nameCellVal === 'object' && 'richText' in nameCellVal) {
        staffName = (nameCellVal as any).richText.map((t: any) => t.text).join('').trim();
      }

      // Filter baris kosong, baris total, atau baris catatan
      if (!staffName || /total|mengetahui|pj|jadwal|shif/i.test(staffName) || staffName.length < 2) {
        return;
      }

      const shifts: Record<number, string> = {};
      for (let day = 1; day <= daysCount; day++) {
        const colIdx = dayColMap[day];
        if (colIdx) {
          const cellVal = row.getCell(colIdx).value;
          let shiftStr = '';
          if (typeof cellVal === 'string' || typeof cellVal === 'number') {
            shiftStr = String(cellVal).trim().toUpperCase();
          }
          shifts[day] = normalizeShiftCode(shiftStr);
        } else {
          shifts[day] = '-';
        }
      }

      parsedStaff.push({
        id: `staff-xl-${rowNumber}`,
        name: staffName,
        shifts
      });
    });

    if (parsedStaff.length === 0) {
      return {
        success: false,
        staffRows: [],
        message: 'Tidak dapat menemukan data nama pegawai dan shift dalam file Excel ini. Pastikan format tabel memiliki kolom Nama dan Tanggal 1-30.'
      };
    }

    return {
      success: true,
      staffRows: parsedStaff,
      message: `Berhasil mengekstrak ${parsedStaff.length} jadwal pegawai dari Excel.`
    };
  } catch (err: any) {
    console.error('Error parsing Excel:', err);
    return {
      success: false,
      staffRows: [],
      message: `Gagal membaca file Excel: ${err.message || 'Format tidak didukung'}`
    };
  }
}

// 2. Parsing File CSV / Teks
export async function parseCsvSchedule(text: string, activeYear: number, activeMonth: number): Promise<ParseScheduleResult> {
  try {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { success: false, staffRows: [], message: 'Isi file CSV terlalu pendek.' };
    }

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const daysCount = getDaysInMonth(activeYear, activeMonth);

    const parsedStaff: StaffScheduleRow[] = [];

    // Header check
    const headerParts = lines[0].split(delimiter).map(p => p.trim());
    let nameIdx = headerParts.findIndex(p => /nama|pegawai|staf/i.test(p));
    if (nameIdx === -1) nameIdx = 1; // default kolom ke-2

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
      const name = parts[nameIdx];
      if (!name || /total|mengetahui/i.test(name)) continue;

      const shifts: Record<number, string> = {};
      for (let day = 1; day <= daysCount; day++) {
        // Shift columns typically follow name column
        const shiftCol = nameIdx + day;
        shifts[day] = normalizeShiftCode(parts[shiftCol] || '-');
      }

      parsedStaff.push({
        id: `staff-csv-${i}`,
        name,
        shifts
      });
    }

    return {
      success: true,
      staffRows: parsedStaff,
      message: `Berhasil mengekstrak ${parsedStaff.length} jadwal pegawai dari CSV.`
    };
  } catch (err: any) {
    return {
      success: false,
      staffRows: [],
      message: `Gagal membaca CSV: ${err.message}`
    };
  }
}

// 3. Normalisasi Kode Shift umum
export function normalizeShiftCode(raw: string): string {
  if (!raw) return '-';
  const clean = raw.trim().toUpperCase();

  if (['P', 'PAGI', 'P1'].includes(clean)) return 'P';
  if (['I/P', 'IP', 'P-IGD'].includes(clean)) return 'I/P';
  if (['S', 'SORE', 'S1'].includes(clean)) return 'S';
  if (['I/S', 'IS', 'S-IGD'].includes(clean)) return 'I/S';
  if (['M', 'MALAM', 'MLM'].includes(clean)) return 'M';
  if (['P2'].includes(clean)) return 'P2';
  if (['L', 'LIBUR'].includes(clean)) return 'L';
  if (['LE', 'LIBUR EKSTRA', 'LIBUR_EKSTRA'].includes(clean)) return 'LE';
  if (['C', 'CUTI', 'CT'].includes(clean)) return 'C';
  if (['OFF', 'X'].includes(clean)) return 'L';

  return clean;
}

// 4. Client-side Tesseract.js Image OCR Parser for Schedule Matrix
export async function parseScheduleWithTesseract(
  imageSource: File | string,
  year: number,
  month: number,
  onProgress?: (percent: number, status: string) => void
): Promise<ParseScheduleResult> {
  const daysCount = getDaysInMonth(year, month);

  try {
    if (onProgress) onProgress(10, 'Menginisialisasi engine OCR Tesseract.js...');

    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.min(95, Math.max(15, Math.round((m.progress || 0) * 85) + 15));
          onProgress(pct, `Membaca matriks tabel jadwal dinas (${pct}%)...`);
        }
      }
    });

    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    if (onProgress) onProgress(96, 'Menganalisis baris nama dan kode shift (P, S, M, L, LE, C)...');

    const text = ret.data?.text || '';
    if (!text.trim()) {
      return {
        success: false,
        staffRows: [],
        message: 'Tesseract OCR tidak menemukan teks yang dapat dibaca pada gambar.'
      };
    }

    // Pisahkan per baris teks
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedStaff: StaffScheduleRow[] = [];

    // Filter baris non-jadwal
    const ignoreKeywords = /jadwal|dinas|pendaftaran|shift|shif|bulan|tahun|mengetahui|direktur|penanggung|total|lembar|ruangan|keterangan/i;

    lines.forEach((line, lineIdx) => {
      if (ignoreKeywords.test(line)) return;

      // Tokenize baris dengan spasi / tab / pipa
      const tokens = line.split(/[\s|;,]+/).map(t => t.trim()).filter(Boolean);
      if (tokens.length < 4) return;

      // Cari kata-kata nama (biasanya di awal baris)
      const nameParts: string[] = [];
      const shiftTokens: string[] = [];

      let isCollectingShifts = false;

      for (let i = 0; i < tokens.length; i++) {
        const rawToken = tokens[i].toUpperCase().replace(/[^A-Z0-9/]/g, '');
        if (!rawToken) continue;

        // Cek apakah token ini cocok dengan kode shift
        const isShift = /^(P|S|M|L|LE|C|IP|I\/P|IS|I\/S|P2|CT|OFF|X)$/i.test(rawToken);

        if (isShift) {
          isCollectingShifts = true;
          shiftTokens.push(normalizeShiftCode(rawToken));
        } else if (!isCollectingShifts) {
          // Abaikan nomor urut (angka 1-99 di awal)
          if (/^\d{1,2}$/.test(rawToken) && nameParts.length === 0) {
            continue;
          }
          nameParts.push(tokens[i].toUpperCase());
        }
      }

      const staffName = nameParts.join(' ').replace(/[^A-Z\s.]/g, '').trim();

      // Jika kita menemukan nama yang valid dan ada beberapa token shift
      if (staffName.length >= 3 && shiftTokens.length >= 3) {
        const shifts: Record<number, string> = {};

        for (let d = 1; d <= daysCount; d++) {
          if (d <= shiftTokens.length) {
            shifts[d] = shiftTokens[d - 1];
          } else {
            // Jika token shift kurang dari jumlah hari, isi pola default atau '-'
            shifts[d] = '-';
          }
        }

        parsedStaff.push({
          id: `staff-ocr-${lineIdx + 1}`,
          name: staffName,
          role: 'Staf Pendaftaran & Admisi',
          shifts
        });
      }
    });

    if (parsedStaff.length > 0) {
      return {
        success: true,
        staffRows: parsedStaff,
        detectedHolidays: [5, 17],
        message: `Tesseract.js OCR berhasil mengekstrak ${parsedStaff.length} jadwal pegawai dari foto.`
      };
    }

    return {
      success: false,
      staffRows: [],
      message: 'Tesseract.js tidak menemukan pola tabel jadwal. Mencoba analisis cadangan...'
    };
  } catch (err: any) {
    console.error('Tesseract OCR error:', err);
    return {
      success: false,
      staffRows: [],
      message: `Tesseract OCR error: ${err.message || 'Gagal memproses gambar'}`
    };
  }
}

// 5. Dual-Engine OCR: Tesseract.js di browser dengan Fallback Server OCR
export async function extractScheduleFromImage(
  imageSource: File | string,
  year: number,
  month: number,
  onProgress?: (percent: number, status: string) => void
): Promise<ParseScheduleResult> {
  // 1. Coba Tesseract.js client-side terlebih dahulu
  try {
    if (onProgress) onProgress(15, 'Menjalankan Tesseract.js OCR pada foto jadwal...');
    const tesseractResult = await parseScheduleWithTesseract(imageSource, year, month, onProgress);
    if (tesseractResult.success && tesseractResult.staffRows.length > 0) {
      return tesseractResult;
    }
  } catch (tessErr) {
    console.warn('Tesseract OCR client error, proceeding to server OCR fallback:', tessErr);
  }

  // 2. Fallback ke endpoint server jika Tesseract belum mendapatkan matriks lengkap
  try {
    if (onProgress) onProgress(65, 'Mengirim foto ke server OCR AI RSUMB...');

    let base64Image = '';
    if (typeof imageSource === 'string') {
      base64Image = imageSource;
    } else if (imageSource instanceof File) {
      base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = (reader.result as string).split(',')[1] || '';
          resolve(res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageSource);
      });
    }

    const res = await fetch('/api/schedule/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Image,
        year,
        month,
        monthName: MONTH_NAMES_ID[month - 1]
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server error: ${res.status}`);
    }

    const data = await res.json();
    if (data.staffRows && data.staffRows.length > 0) {
      return {
        success: true,
        staffRows: data.staffRows,
        detectedHolidays: data.nationalHolidays,
        message: `OCR AI berhasil mengekstrak ${data.staffRows.length} staf pendaftaran dari gambar jadwal dinas.`
      };
    }

    throw new Error('Hasil OCR AI kosong atau format gambar tidak terbaca.');
  } catch (err: any) {
    console.error('Dual-engine OCR error:', err);
    return {
      success: false,
      staffRows: [],
      message: err.message || 'Gagal mengekstrak foto jadwal.'
    };
  }
}
