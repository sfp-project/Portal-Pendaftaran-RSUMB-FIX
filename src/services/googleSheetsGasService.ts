/**
 * ============================================================================
 * GOOGLE APPS SCRIPT (GAS) WEB APP SERVICE - RSUD/RSU MUHAMMADIYAH BABAT
 * ============================================================================
 * Menggantikan integrasi direct OAuth Google Drive yang sering disconnect
 * dengan Web App Google Apps Script berbasis HTTPS fetch standard.
 */

import {
  DEFAULT_GAS_URL,
  STORAGE_KEY_GAS_URL,
  STORAGE_KEY_LAST_SYNC
} from '../config/gasConfig';

export { DEFAULT_GAS_URL, STORAGE_KEY_GAS_URL, STORAGE_KEY_LAST_SYNC };

// In-memory cache
let cachedGasUrl: string | null = null;

/**
 * Memeriksa apakah URL merupakan placeholder default yang belum dikonfigurasi
 */
export const isPlaceholderGasUrl = (url?: string | null): boolean => {
  if (!url) return true;
  const clean = url.trim();
  return clean === '' || clean === 'MASUKKAN_URL_GAS_ANDA_DI_SINI' || clean.includes('MASUKKAN_URL_GAS_ANDA_DI_SINI');
};

/**
 * Mendapatkan URL Google Apps Script Web App yang tersimpan
 * Jika localStorage di browser PC user kosong, otomatis gunakan DEFAULT_GAS_URL.
 */
export const getGasWebAppUrl = (): string => {
  if (cachedGasUrl) return cachedGasUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GAS_URL);
    if (stored && stored.trim() && stored.trim() !== 'MASUKKAN_URL_GAS_ANDA_DI_SINI') {
      cachedGasUrl = stored.trim();
      return cachedGasUrl;
    }
    const envUrl = (import.meta as any).env?.VITE_GAS_WEB_APP_URL || (import.meta as any).env?.VITE_DATABASE_WEB_APP_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() && envUrl.trim() !== 'MASUKKAN_URL_GAS_ANDA_DI_SINI') {
      cachedGasUrl = envUrl.trim();
      return cachedGasUrl;
    }
  } catch {}

  // Fallback utama: Jika localStorage kosong, otomatis gunakan DEFAULT_GAS_URL
  if (DEFAULT_GAS_URL && typeof DEFAULT_GAS_URL === 'string') {
    cachedGasUrl = DEFAULT_GAS_URL.trim();
    return cachedGasUrl;
  }

  return '';
};

/**
 * Menyimpan konfigurasi URL Google Apps Script Web App
 */
export const setGasWebAppUrl = (url: string): void => {
  const clean = (url || '').trim();
  cachedGasUrl = clean || null;
  try {
    if (clean) {
      localStorage.setItem(STORAGE_KEY_GAS_URL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_GAS_URL);
    }
  } catch {}

  window.dispatchEvent(
    new CustomEvent('rsumb_gas_url_changed', {
      detail: { url: clean, isConnected: !!clean }
    })
  );
};

/**
 * Memeriksa apakah URL Google Apps Script terkonfigurasi
 */
export const isGasConnected = (): boolean => {
  const url = getGasWebAppUrl();
  return !!(
    url &&
    (url.startsWith('https://script.google.com/macros/s/') || url.startsWith('https://'))
  );
};

/**
 * Helper untuk melakukan fetch ke GAS Web App (Direct atau fallback ke Proxy)
 */
const executeGasRequest = async (
  endpointUrl: string,
  options: {
    method: 'GET' | 'POST';
    body?: any;
    timeoutMs?: number;
  }
): Promise<any> => {
  const { method, body, timeoutMs = 35000 } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (method === 'GET') {
      const res = await fetch(endpointUrl, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } else {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        mode: 'cors',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(body || {})
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      throw new Error('Koneksi timeout ke Google Apps Script (melebihi batas waktu tunggu).');
    }

    // Fallback: Proxy server
    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: endpointUrl,
          method,
          payload: body
        })
      });
      if (proxyRes.ok) {
        return await proxyRes.json();
      }
    } catch {}

    throw err;
  }
};

/**
 * Menguji koneksi ke Google Apps Script Web App
 */
export const testGasConnection = async (
  customUrl?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const targetUrl = (customUrl || getGasWebAppUrl()).trim();
  if (!targetUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script Web App belum diisi.'
    };
  }

  if (!targetUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'URL tidak valid. Format URL harus diawali dengan https://script.google.com/macros/s/...'
    };
  }

  try {
    const pingUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=ping&_t=' + Date.now();
    const data = await executeGasRequest(pingUrl, { method: 'GET', timeoutMs: 25000 });

    if (data && (data.status === 'success' || data.status === 'ok' || data.message === 'Connected' || data.spreadsheetName)) {
      return {
        success: true,
        message: data.message || 'Koneksi Berhasil! Terhubung ke Google Sheets Web App.',
        data
      };
    }

    return {
      success: true,
      message: 'Koneksi Berhasil! Respon diterima dari Google Sheets Web App.',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung ke Google Sheets: ${err?.message || 'Pastikan deployment Web App disetel ke "Anyone" (Siapa saja).'}`
    };
  }
};

/**
 * Menarik (Pull) seluruh database dari Google Sheets
 */
export const fetchDatabaseFromGas = async (
  customUrl?: string
): Promise<{ success: boolean; database?: Record<string, any>; kupons?: any[]; message?: string }> => {
  const targetUrl = (customUrl || getGasWebAppUrl()).trim();
  if (!targetUrl) {
    return { success: false, message: 'URL Google Apps Script belum disetel.' };
  }

  try {
    const fetchUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=getData&_t=' + Date.now();
    const result = await executeGasRequest(fetchUrl, { method: 'GET', timeoutMs: 30000 });

    if (result && result.status === 'success') {
      return {
        success: true,
        database: result.database || {},
        kupons: result.kupons || [],
        message: 'Data berhasil dimuat dari Google Sheets.'
      };
    }

    return {
      success: false,
      message: result?.message || 'Gagal memuat data dari Google Sheets.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal memuat data: ${err?.message || 'Periksa koneksi internet dan URL deployment.'}`
    };
  }
};

/**
 * Mengirim (Push/Sync) seluruh database lokal ke Google Sheets
 */
export const syncDatabaseToGas = async (
  database: Record<string, any>,
  staffName: string = 'Admin SIMRS RSUMB',
  customUrl?: string
): Promise<{ success: boolean; message: string; timestamp?: string }> => {
  const targetUrl = (customUrl || getGasWebAppUrl()).trim();
  if (!targetUrl) {
    return { success: false, message: 'URL Google Apps Script belum disetel.' };
  }

  try {
    const payload = {
      action: 'saveDatabase',
      staffName: staffName,
      timestamp: new Date().toISOString(),
      database: database
    };

    // Menggunakan mode: 'no-cors' dengan Content-Type: text/plain tanpa AbortController timeout
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowIso);
    } catch {}

    return {
      success: true,
      message: 'Database berhasil dikirim dan disinkronkan ke Google Sheets.',
      timestamp: nowIso
    };
  } catch (err: any) {
    // Fallback: Proxy server
    try {
      const payload = {
        action: 'saveDatabase',
        staffName: staffName,
        timestamp: new Date().toISOString(),
        database: database
      };
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          method: 'POST',
          payload
        })
      });
      if (proxyRes.ok) {
        const nowIso = new Date().toISOString();
        try {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowIso);
        } catch {}
        return {
          success: true,
          message: 'Database berhasil disinkronkan via server proxy.',
          timestamp: nowIso
        };
      }
    } catch {}

    return {
      success: false,
      message: `Gagal sinkronisasi ke Google Sheets: ${err?.message || 'Kesalahan jaringan.'}`
    };
  }
};

/**
 * Menyalin / Append satu baris Kupon Fee Mohat langsung ke Sheet 'Kupon_Fee'
 */
export const appendKuponToGas = async (
  kupon: any,
  customUrl?: string
): Promise<{ success: boolean; message: string }> => {
  const targetUrl = (customUrl || getGasWebAppUrl()).trim();
  if (!targetUrl) {
    return { success: false, message: 'URL Google Apps Script belum disetel.' };
  }

  try {
    const result = await executeGasRequest(targetUrl, {
      method: 'POST',
      body: {
        action: 'appendKupon',
        kupon: kupon,
        timestamp: new Date().toISOString()
      },
      timeoutMs: 15000
    });

    return {
      success: true,
      message: result?.message || 'Kupon berhasil disimpan ke Google Sheets.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menyimpan kupon: ${err?.message}`
    };
  }
};

/**
 * Mengembalikan Source Code Google Apps Script (Code.gs) lengkap dengan penyimpanan Key-Value di Database_Snapshot
 */
export const getGasScriptTemplate = (): string => {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - DATABASE RSUD/RSU MUHAMMADIYAH BABAT (RSUMB)
 * =========================================================================
 * Backend REST API untuk sinkronisasi otomatis Portal Pendaftaran RSUMB
 * ke Google Sheets (Tabel Kupon Fee, Data Pasien, Log, dan Database Snapshot).
 *
 * CARA PEMASANGAN DI GOOGLE SHEETS:
 * 1. Buka spreadsheet baru di Google Sheets (sheets.new)
 * 2. Beri nama spreadsheet, misal: "DATABASE PORTAL RSUMB"
 * 3. Klik menu "Ekstensi" (Extensions) > "Apps Script"
 * 4. Hapus seluruh isi default lalu PASTE seluruh kode ini ke Code.gs
 * 5. Klik "Simpan" (Ctrl+S)
 * 6. Klik tombol "Deploy" (Terapkan) > "New deployment" (Penerapan baru)
 * 7. Pilih icon gerigi > "Web app" (Aplikasi web)
 *    - Description: "RSUMB Database API"
 *    - Execute as: "Me" (Email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja)  <-- PENTING!
 * 8. Klik "Deploy" > Berikan izin (Authorize access)
 * 9. Salin URL Web app (akhiran /exec) dan masukkan ke Pengaturan Portal RSUMB.
 * =========================================================================
 */

function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || 'ping';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Health Check / Ping (Super fast, no spreadsheet overhead)
    if (action === 'ping' || action === 'status') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        message: 'Connected',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Tarik Seluruh Database dari Database_Snapshot (Key-Value)
    if (action === 'getData' || action === 'getDatabase') {
      var snapshotSheet = getOrCreateSheet(ss, 'Database_Snapshot');
      var lastRow = snapshotSheet.getLastRow();
      var database = {};
      
      if (lastRow > 1) {
        var rows = snapshotSheet.getRange(2, 1, lastRow - 1, 2).getValues();
        for (var i = 0; i < rows.length; i++) {
          var k = rows[i][0];
          var v = rows[i][1];
          if (k) {
            try {
              database[k] = JSON.parse(v);
            } catch (err) {
              database[k] = v;
            }
          }
        }
      }

      var kuponSheet = getOrCreateSheet(ss, 'Kupon_Fee');
      var kuponData = getSheetRowsAsJson(kuponSheet);

      return createJsonResponse({
        status: 'success',
        database: database,
        kupons: kuponData,
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({
      status: 'error',
      message: 'Aksi GET tidak dikenali: ' + action
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

function doPost(e) {
  try {
    var contents = e && e.postData ? e.postData.contents : '';
    var payload = {};
    if (contents) {
      try {
        payload = JSON.parse(contents);
      } catch (err) {
        payload = {};
      }
    }

    var action = payload.action || 'saveDatabase';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Simpan Snapshot Database Lengkap (Key-Value di Database_Snapshot)
    if (payload.database || action === 'saveDatabase' || action === 'sync') {
      var dbData = payload.database || payload;
      if (typeof dbData === 'string') {
        try {
          dbData = JSON.parse(dbData);
        } catch (e) {}
      }

      var snapshotSheet = getOrCreateSheet(ss, 'Database_Snapshot');
      snapshotSheet.clear();
      snapshotSheet.appendRow(['KEY', 'JSON_VALUE']);
      snapshotSheet.getRange('A1:B1').setFontWeight('bold').setBackground('#005d42').setFontColor('#ffffff');
      snapshotSheet.setFrozenRows(1);

      var snapshotRows = [];
      for (var key in dbData) {
        if (dbData.hasOwnProperty(key)) {
          var val = dbData[key];
          var strVal = (typeof val === 'string') ? val : JSON.stringify(val);
          snapshotRows.push([key, strVal]);
        }
      }

      if (snapshotRows.length > 0) {
        snapshotSheet.getRange(2, 1, snapshotRows.length, 2).setValues(snapshotRows);
      }

      // Update Sheet 'Info_Database'
      var infoSheet = getOrCreateSheet(ss, 'Info_Database');
      infoSheet.clear();
      infoSheet.appendRow(['PROPERTI', 'NILAI']);
      infoSheet.appendRow(['Nama Database', 'RSUMB Portal System Database']);
      infoSheet.appendRow(['Terakhir Disinkronkan', new Date().toLocaleString('id-ID')]);
      infoSheet.appendRow(['Petugas Sinkronisasi', payload.staffName || 'Admin SIMRS']);
      infoSheet.appendRow(['Total Tabel Data', Object.keys(dbData).length]);
      infoSheet.getRange('A1:B1').setFontWeight('bold').setBackground('#005d42').setFontColor('#ffffff');
      infoSheet.setFrozenRows(1);

      // 1. Tab Kupon_Fee: (Tanggal, Nama Staf, Dokter, Nominal, Status)
      var kupons = dbData.rsumb_kupon_list_v1 || dbData.rsumb_mohat_coupons_v2 || [];
      if (typeof kupons === 'string') {
        try { kupons = JSON.parse(kupons); } catch (e) {}
      }
      syncKuponSheet(ss, kupons);

      // 2. Tab Catatan_Pasien: (Tanggal, No RM, Nama Pasien, Catatan/Stiker)
      var notes = dbData.rsumb_patient_notes_v1 || dbData.rsumb_handover_notes_v1 || [];
      if (typeof notes === 'string') {
        try { notes = JSON.parse(notes); } catch (e) {}
      }
      syncPatientNotesSheet(ss, notes);

      // 3. Tab Jadwal_Dokter: (Nama Dokter, Spesialis, Hari, Jam Praktik)
      var schedules = dbData.medcentral_schedules_v5 || dbData.rsumb_doctor_schedules || dbData.medcentral_schedules || [];
      if (typeof schedules === 'string') {
        try { schedules = JSON.parse(schedules); } catch (e) {}
      }
      syncDoctorScheduleSheet(ss, schedules);

      // Tab Log_Aktivitas jika ada
      if (dbData.rsumb_system_audit_logs_v1) {
        var logs = dbData.rsumb_system_audit_logs_v1;
        if (typeof logs === 'string') {
          try { logs = JSON.parse(logs); } catch (e) {}
        }
        if (Array.isArray(logs)) {
          syncAuditLogsSheet(ss, logs);
        }
      }

      return createJsonResponse({
        status: 'success',
        message: 'Database berhasil disimpan dan dipecah ke tab Kupon_Fee, Catatan_Pasien, dan Jadwal_Dokter',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Append Kupon Fee Tunggal
    if (action === 'appendKupon' && payload.kupon) {
      var k = payload.kupon;
      var kSheet = getOrCreateSheet(ss, 'Kupon_Fee');
      ensureKuponHeaders(kSheet);
      var tgl = k.tanggalMasuk || k.tanggal || (k.createdAt ? String(k.createdAt).split('T')[0] : new Date().toISOString().split('T')[0]);
      var staf = k.namaPerujuk || k.namaSopir || k.petugasKasir || k.petugas || k.staffName || '-';
      var dokter = k.namaDokter || k.dokter || k.kategori || '-';
      var nominal = Number(k.nominal || k.feeTotal || ((k.feePerujuk || 0) + (k.feeSopir || 0)) || 0);
      var status = k.status || 'Menunggu Kasir';
      kSheet.appendRow([tgl, staf, dokter, nominal, status]);
      return createJsonResponse({ status: 'success', message: 'Kupon fee berhasil ditambahkan ke Google Sheets' });
    }

    return createJsonResponse({
      status: 'success',
      message: 'Operasi POST selesai',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

// ================= UTILITY HELPERS =================

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureKuponHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Tanggal', 'Nama Staf', 'Dokter', 'Nominal', 'Status']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#005d42').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

function syncKuponSheet(ss, kuponList) {
  var sheet = getOrCreateSheet(ss, 'Kupon_Fee');
  sheet.clear();
  sheet.appendRow(['Tanggal', 'Nama Staf', 'Dokter', 'Nominal', 'Status']);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#005d42').setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  if (Array.isArray(kuponList) && kuponList.length > 0) {
    var rows = kuponList.map(function(k) {
      var tgl = k.tanggalMasuk || k.tanggal || (k.createdAt ? String(k.createdAt).split('T')[0] : '');
      var staf = k.namaPerujuk || k.namaSopir || k.petugasKasir || k.petugas || k.staffName || '-';
      var dokter = k.namaDokter || k.dokter || k.namaPerujuk || k.kategori || '-';
      var nominal = Number(k.nominal || k.feeTotal || ((k.feePerujuk || 0) + (k.feeSopir || 0)) || 0);
      var status = k.status || 'Lunas';
      return [tgl, staf, dokter, nominal, status];
    });
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
    sheet.getRange(2, 4, rows.length, 1).setNumberFormat('"Rp"#,##0');
  }
}

function syncPatientNotesSheet(ss, notesList) {
  var sheet = getOrCreateSheet(ss, 'Catatan_Pasien');
  sheet.clear();
  sheet.appendRow(['Tanggal', 'No RM', 'Nama Pasien', 'Unit/Ruangan', 'Catatan/Stiker']);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#005d42').setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  if (Array.isArray(notesList) && notesList.length > 0) {
    var rows = notesList.map(function(p) {
      var tgl = p.tanggal || p.tanggalMrs || p.tanggalMasuk || (p.createdAt ? String(p.createdAt).split('T')[0] : '') || (p.timestamp ? String(p.timestamp).split('T')[0] : '');
      var noRm = p.noRm || p.nomorRm || '';
      var nama = p.namaPasien || '';
      var unitRuangan = p.unit || p.ruangan || p.kamar || p.poli || p.shift || '-';
      var catatan = p.catatan || p.catatanStiker || p.noteStiker || p.masalah || p.kronologi || '';
      return [tgl, noRm, nama, unitRuangan, catatan];
    });
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
}

function syncDoctorScheduleSheet(ss, scheduleList) {
  var sheet = getOrCreateSheet(ss, 'Jadwal_Dokter');
  sheet.clear();
  sheet.appendRow(['Nama Dokter', 'Spesialis', 'Hari', 'Jam Praktik', 'Kuota']);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#005d42').setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  if (Array.isArray(scheduleList) && scheduleList.length > 0) {
    var rows = scheduleList.map(function(d) {
      var dokter = d.dpjp || d.namaDokter || d.nama || '';
      var spesialis = d.poli || d.spesialisasi || d.spesialis || '';
      var hari = d.hari || '';
      var jam = d.jadwal || d.jam_praktik || (d.jamMulai && d.jamSelesai ? (d.jamMulai + ' - ' + d.jamSelesai) : '') || d.jamHfis || '';
      var kuota = d.kuotaTotal || d.kuota_total || d.kuotaMaksimal || d.kuota_maksimal || d.kuotaBpjs || d.kuota_bpjs || (d.kuotaTerisi !== undefined ? (d.kuotaTerisi + (d.kuotaTotal ? '/' + d.kuotaTotal : '')) : '-') || '-';
      return [dokter, spesialis, hari, jam, kuota];
    });
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
}

function syncAuditLogsSheet(ss, logsList) {
  var sheet = getOrCreateSheet(ss, 'Log_Aktivitas');
  sheet.clear();
  sheet.appendRow(['No', 'Timestamp', 'Petugas', 'Aksi', 'Modul', 'Rincian']);
  sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');

  if (logsList.length > 0) {
    var rows = logsList.slice(0, 500).map(function(l, idx) {
      return [
        idx + 1,
        l.timestamp || '',
        l.staffName || '',
        l.action || '',
        l.module || '',
        l.details || ''
      ];
    });
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
}

function getSheetRowsAsJson(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    result.push(rowObj);
  }
  return result;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
};
