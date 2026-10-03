import { getAccessToken, logoutGoogleDrive } from './googleAuthService';

const FOLDER_DATA = 'RSUMB_Portal_Data';
const FOLDER_FILES = 'RSUMB_Portal_Files';
const FOLDER_BACKUPS = 'RSUMB_Portal_Backups';
const DB_FILE_NAME = 'rsumb_database.json';

// In-memory cache for folder IDs to avoid repeated search queries
const folderIdCache = new Map<string, string>();

/**
 * Mendeteksi error API Google Drive, terutama 401 Unauthorized / token expired
 */
const handleDriveError = async (res: Response, actionDesc: string) => {
  if (res.status === 401) {
    await logoutGoogleDrive();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rsumb_drive_token_expired'));
    }
    throw new Error('Sesi Google Drive telah kedaluwarsa. Silakan hubungkan kembali akun Google Anda di menu Sinkronisasi.');
  }
  const errText = await res.text();
  throw new Error(`${actionDesc}: ${errText}`);
};

/**
 * Mendapatkan Access Token aktif atau melempar pesan error ramah pengguna
 */
export const getActiveTokenOrThrow = async (): Promise<string> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sesi Google Drive belum terhubung. Silakan login dengan Google terlebih dahulu.');
  }
  return token;
};

/**
 * Mencari atau membuat folder Google Drive berdasarkan nama
 */
export const ensureDriveFolder = async (folderName: string): Promise<string> => {
  if (folderIdCache.has(folderName)) {
    return folderIdCache.get(folderName)!;
  }

  const token = await getActiveTokenOrThrow();

  // Search existing folder
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    await handleDriveError(searchRes, 'Gagal mencari folder Google Drive');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const id = searchData.files[0].id;
    folderIdCache.set(folderName, id);
    return id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    await handleDriveError(createRes, `Gagal membuat folder Google Drive "${folderName}"`);
  }

  const createData = await createRes.json();
  folderIdCache.set(folderName, createData.id);
  return createData.id;
};

/**
 * Mengunggah file multipart (metadata + content) ke Google Drive
 */
export const uploadMultipartFile = async (options: {
  name: string;
  mimeType: string;
  folderId: string;
  content: Blob | string;
}): Promise<{
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime?: string;
}> => {
  const token = await getActiveTokenOrThrow();

  const metadata = {
    name: options.name,
    mimeType: options.mimeType,
    parents: [options.folderId]
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataContentType = 'application/json; charset=UTF-8';

  let bodyBlob: Blob;
  if (typeof options.content === 'string') {
    const multipartRequestBody =
      delimiter +
      `Content-Type: ${metadataContentType}\r\n\r\n` +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${options.mimeType}\r\n\r\n` +
      options.content +
      closeDelimiter;

    bodyBlob = new Blob([multipartRequestBody], { type: `multipart/related; boundary=${boundary}` });
  } else {
    // Binary or file blob
    const metaHeader =
      delimiter +
      `Content-Type: ${metadataContentType}\r\n\r\n` +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${options.mimeType}\r\n\r\n`;

    const metaBlob = new Blob([metaHeader], { type: 'text/plain' });
    const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });
    bodyBlob = new Blob([metaBlob, options.content, closeBlob], {
      type: `multipart/related; boundary=${boundary}`
    });
  }

  const uploadUrl =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,modifiedTime';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: bodyBlob
  });

  if (!res.ok) {
    await handleDriveError(res, 'Gagal mengunggah berkas ke Google Drive');
  }

  return await res.json();
};

/**
 * Memperbarui konten file yang sudah ada di Google Drive
 */
export const updateDriveFileContent = async (
  fileId: string,
  content: string | Blob,
  mimeType: string = 'application/json'
): Promise<{ modifiedTime?: string }> => {
  const token = await getActiveTokenOrThrow();

  const body = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,modifiedTime`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimeType
      },
      body
    }
  );

  if (!res.ok) {
    await handleDriveError(res, 'Gagal memperbarui berkas di Google Drive');
  }

  return await res.json();
};

/**
 * Mencari file tertentu di dalam folder
 */
export const findFileInFolder = async (
  fileName: string,
  folderId: string
): Promise<{ id: string; name: string; webViewLink?: string; modifiedTime?: string } | null> => {
  const token = await getActiveTokenOrThrow();

  const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,webViewLink,modifiedTime)&spaces=drive`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      await logoutGoogleDrive();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rsumb_drive_token_expired'));
      }
    }
    return null;
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
};

/**
 * Membaca konten teks/JSON file dari Google Drive
 */
export const readDriveFileText = async (fileId: string): Promise<string> => {
  const token = await getActiveTokenOrThrow();

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    await handleDriveError(res, 'Gagal mengunduh berkas dari Google Drive');
  }

  return await res.text();
};

/**
 * Menghapus file dari Google Drive
 */
export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getActiveTokenOrThrow();

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 404) {
    await handleDriveError(res, 'Gagal menghapus berkas di Google Drive');
  }
};

// ============================================================================
// HIGH-LEVEL DATABASE SYNC & MEDIA OPERATIONS
// ============================================================================

export interface DriveDatabaseRecord {
  app: string;
  version: string;
  lastUpdated: string;
  syncedBy: string;
  data: Record<string, any>;
}

/**
 * Simpan / Sync seluruh snapshot database ke Google Drive (/RSUMB_Portal_Data/rsumb_database.json)
 */
export const syncDatabaseToGoogleDrive = async (
  payload: Record<string, any>,
  staffName: string = 'Admin RSUMB'
): Promise<{ fileId: string; modifiedTime: string }> => {
  const folderId = await ensureDriveFolder(FOLDER_DATA);

  const existingFile = await findFileInFolder(DB_FILE_NAME, folderId);

  const fullRecord: DriveDatabaseRecord = {
    app: 'RSU Muhammadiyah Babat - Portal Pendaftaran & SIMRS',
    version: '1.2.0',
    lastUpdated: new Date().toISOString(),
    syncedBy: staffName,
    data: payload
  };

  const jsonString = JSON.stringify(fullRecord, null, 2);

  if (existingFile) {
    const updateRes = await updateDriveFileContent(existingFile.id, jsonString, 'application/json');
    return {
      fileId: existingFile.id,
      modifiedTime: updateRes.modifiedTime || fullRecord.lastUpdated
    };
  } else {
    const createRes = await uploadMultipartFile({
      name: DB_FILE_NAME,
      mimeType: 'application/json',
      folderId,
      content: jsonString
    });
    return {
      fileId: createRes.id,
      modifiedTime: createRes.modifiedTime || fullRecord.lastUpdated
    };
  }
};

/**
 * Muat snapshot database dari Google Drive (/RSUMB_Portal_Data/rsumb_database.json)
 */
export const fetchDatabaseFromGoogleDrive = async (): Promise<{
  data: Record<string, any>;
  lastUpdated: string;
  syncedBy: string;
  fileId: string;
} | null> => {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const folderId = await ensureDriveFolder(FOLDER_DATA);
    const file = await findFileInFolder(DB_FILE_NAME, folderId);
    if (!file) return null;

    const rawJson = await readDriveFileText(file.id);
    const parsed: DriveDatabaseRecord = JSON.parse(rawJson);

    return {
      data: parsed.data || {},
      lastUpdated: parsed.lastUpdated || file.modifiedTime || new Date().toISOString(),
      syncedBy: parsed.syncedBy || 'Google Drive',
      fileId: file.id
    };
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('kedaluwarsa') || msg.includes('terhubung') || err?.status === 401) {
      console.info('[GoogleDrive] Sesi Google Drive tidak aktif atau telah kedaluwarsa.');
      return null;
    }
    console.warn('Notice fetching database from Google Drive:', err);
    throw err;
  }
};

/**
 * Buat Snapshot Backup manual/otomatis ke folder /RSUMB_Portal_Backups/
 */
export const saveBackupToGoogleDrive = async (
  payload: Record<string, any>,
  staffName: string = 'Admin RSUMB'
): Promise<{ fileId: string; fileName: string; webViewLink?: string }> => {
  const folderId = await ensureDriveFolder(FOLDER_BACKUPS);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = `Backup-RSUMB-Portal-${dateStr}_${timeStr}.json`;

  const backupData = {
    app: 'RSU Muhammadiyah Babat - Portal Pendaftaran SIMRS (Snapshot Backup)',
    backupTimestamp: now.toISOString(),
    backupBy: staffName,
    storageData: payload
  };

  const jsonString = JSON.stringify(backupData, null, 2);

  const res = await uploadMultipartFile({
    name: fileName,
    mimeType: 'application/json',
    folderId,
    content: jsonString
  });

  return {
    fileId: res.id,
    fileName: res.name,
    webViewLink: res.webViewLink
  };
};

/**
 * Unggah Media Promosi / Dokumen Master (.png, .jpg, .pdf, .docx) ke /RSUMB_Portal_Files/
 */
export const uploadMediaToGoogleDrive = async (
  file: File | Blob,
  fileName: string,
  mimeType: string
): Promise<{
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
}> => {
  const folderId = await ensureDriveFolder(FOLDER_FILES);

  const res = await uploadMultipartFile({
    name: fileName,
    mimeType,
    folderId,
    content: file
  });

  // Construct standard Google Drive preview & download URLs
  const viewLink = res.webViewLink || `https://drive.google.com/file/d/${res.id}/view?usp=drivesdk`;
  const contentLink = res.webContentLink || `https://drive.google.com/uc?id=${res.id}&export=download`;

  return {
    fileId: res.id,
    fileName: res.name,
    webViewLink: viewLink,
    webContentLink: contentLink
  };
};
