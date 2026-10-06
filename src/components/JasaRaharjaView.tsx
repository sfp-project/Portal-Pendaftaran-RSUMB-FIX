import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  Upload,
  FileImage,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Edit3,
  Trash2,
  Plus,
  Sparkles,
  Copy,
  Check,
  Shield,
  Layers,
  ArrowUpDown,
  Filter,
  Eye,
  FileSpreadsheet,
  Key,
  HelpCircle
} from 'lucide-react';
import { JasaRaharjaItem } from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  PLAFON_MAKSIMAL_DEFAULT,
  normalizeNoRm,
  parseNominal,
  upsertJasaRaharjaItems,
  JasaRaharjaOcrItem,
  UpsertResult,
  saveJasaRaharjaData
} from '../data/jasaRaharjaData';

interface JasaRaharjaViewProps {
  items: JasaRaharjaItem[];
  onAddItem: (item: Omit<JasaRaharjaItem, 'id'>) => void;
  onUpdateItem: (item: JasaRaharjaItem) => void;
  onDeleteItem: (id: string) => void;
  onBatchAddItems: (newItems: Omit<JasaRaharjaItem, 'id'>[]) => void;
  onUpsertItems?: (incomingItems: JasaRaharjaOcrItem[]) => UpsertResult;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

interface UploadedSheet {
  id: string;
  name: string;
  sheetNumber: number;
  previewUrl: string;
  base64: string;
  mimeType: string;
  size: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  extractedCount?: number;
  errorMsg?: string;
}

/**
 * Resizes and compresses image to max 1600px width/height and 82% JPEG quality
 * to prevent 413 Payload Too Large and optimize OCR speed & accuracy.
 */
async function compressImageForOcr(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      // Fallback
      resolve({ base64: '', mimeType: file.type || 'image/jpeg' });
    };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        resolve({ base64: reader.result as string, mimeType: file.type || 'image/jpeg' });
      };
      img.onload = () => {
        const MAX_DIM = 1600;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: reader.result as string, mimeType: file.type || 'image/jpeg' });
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({
          base64: compressedDataUrl,
          mimeType: 'image/jpeg'
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads file as base64 data URL with support for Images & PDFs
 */
async function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  if (file.type.startsWith('image/')) {
    return compressImageForOcr(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        base64: reader.result as string,
        mimeType: file.type || 'application/pdf'
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Browser-side Excel (.xlsx / .xls) and CSV Parser using SheetJS
 */
function parseExcelJasaRaharja(dataBuffer: ArrayBuffer): JasaRaharjaOcrItem[] {
  const workbook = XLSX.read(dataBuffer, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja.');
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Tidak ada baris data yang ditemukan di dalam lembar Excel.');
  }

  const items: JasaRaharjaOcrItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const keys = Object.keys(row);

    const getVal = (possibleCols: string[]): any => {
      // 1. Akses langsung kueri kunci eksak
      for (const col of possibleCols) {
        if (row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '') {
          return row[col];
        }
      }
      // 2. Akses pencocokan kunci yang dinormalisasi (abaikan spasi, simbol, besar-kecil huruf)
      for (const col of possibleCols) {
        const targetClean = col.toLowerCase().replace(/[^a-z0-9]/g, '');
        const foundKey = keys.find((k) => k.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === targetClean);
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
          return row[foundKey];
        }
      }
      // 3. Akses pencocokan parsial (contains)
      for (const col of possibleCols) {
        const targetClean = col.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (targetClean.length < 3) continue;
        const foundKey = keys.find((k) => k.toLowerCase().trim().replace(/[^a-z0-9]/g, '').includes(targetClean));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    const rawNoRm = String(getVal(['Plafon', 'No RM', 'No. RM', 'No_RM', 'Norm', 'Rekam Medis', 'No Rekam Medis', 'RM', 'ID Pasien', 'No RM Pasien']) || '').trim();
    const rawNama = String(getVal(['Nama Pasien', 'Nama', 'Nama Lengkap', 'Pasien', 'Nama_Pasien', 'Nama Korban', 'Korban']) || '').trim();
    const rawTanggal = String(getVal(['Tanggal', 'Tgl', 'Tanggal Kunjungan', 'Tgl Masuk', 'Tanggal Masuk', 'Tgl Laka', 'Tanggal Laka', 'Tgl_Masuk', 'Tgl Kejadian']) || '').trim();
    const rawBiaya = getVal(['Plafon Terpakai', 'Plafon Terpakai (Rp)', 'Biaya Terpakai', 'Terpakai', 'Biaya', 'Pemakaian', 'Tagihan', 'Total Biaya', 'Total Biaya Terpakai', 'Klaim', 'Nominal Klaim', 'Nominal Terpakai', 'Jumlah', 'Klaim Jasa Raharja', 'Biaya Terpakai (Rp)']);
    const rawSisa = getVal(['Sisa Plafon', 'Sisa Plafon (Rp)', 'Sisa', 'Sisa_Plafon', 'Sisa Dana', 'Saldo', 'Sisa Plafon Rp']);
    const rawKet = String(getVal(['Keterangan', 'Ket', 'Status', 'Status Rawat', 'Jenis Rawat', 'Ranap', 'Poli', 'Rujuk', 'Status_Keterangan', 'Status Plafon']) || '').trim();

    // Skip empty filler lines
    if (!rawNoRm && !rawNama) continue;

    // Normalize date string (handles Excel numeric timestamps or standard date strings)
    let cleanTanggal = rawTanggal;
    if (typeof rawTanggal === 'number' || (!isNaN(Number(rawTanggal)) && Number(rawTanggal) > 20000 && Number(rawTanggal) < 60000)) {
      try {
        const excelDate = new Date((Number(rawTanggal) - 25569) * 86400 * 1000);
        if (!isNaN(excelDate.getTime())) {
          cleanTanggal = excelDate.toISOString().slice(0, 10);
        }
      } catch {}
    } else if (rawTanggal.includes('/')) {
      const parts = rawTanggal.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        cleanTanggal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    const itemBiaya = parseNominal(rawBiaya);
    const hasExplicitSisa = rawSisa !== '' && rawSisa !== null && rawSisa !== undefined;
    const itemSisa = hasExplicitSisa ? parseNominal(rawSisa) : Math.max(0, 20000000 - itemBiaya);

    items.push({
      noRm: rawNoRm || `JR-${Date.now()}-${i + 1}`,
      namaPasien: rawNama || 'Pasien Tanpa Nama',
      tanggal: cleanTanggal || new Date().toISOString().slice(0, 10),
      biayaTerpakai: itemBiaya,
      sisaPlafon: itemSisa,
      keterangan: rawKet ? rawKet.toUpperCase() : (itemSisa <= 0 ? 'HABIS' : 'RANAP')
    });
  }

  return items;
}

export const JasaRaharjaView: React.FC<JasaRaharjaViewProps> = ({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUpsertItems,
  showToast = (_message: string, _type?: 'success' | 'info' | 'error') => {}
}) => {
  // ---------------------------------------------------------------------------
  // 1. Search & Filter State
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'habis' | 'sisa' | 'ranap' | 'rujuk'>('all');
  const [sortField, setSortField] = useState<'no' | 'tanggal' | 'nama' | 'terpakai' | 'sisa'>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [copiedRm, setCopiedRm] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // 2. Multi-Upload State (Images, PDF & Excel)
  // ---------------------------------------------------------------------------
  const [uploadedSheets, setUploadedSheets] = useState<UploadedSheet[]>([]);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgressText, setOcrProgressText] = useState('');
  const [ocrProgressPercent, setOcrProgressPercent] = useState<number>(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [lastUpsertSummary, setLastUpsertSummary] = useState<UpsertResult | null>(null);

  // File Input Ref
  const genericInputRef = useRef<HTMLInputElement>(null);

  // Gemini API Key Settings Modal
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  // ---------------------------------------------------------------------------
  // 3. Edit & Manual Add Modal State
  // ---------------------------------------------------------------------------
  const [editingItem, setEditingItem] = useState<JasaRaharjaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JasaRaharjaItem | null>(null);

  // Form inputs for Add / Edit
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [formNoRm, setFormNoRm] = useState('');
  const [formNamaPasien, setFormNamaPasien] = useState('');
  const [formBiayaTerpakai, setFormBiayaTerpakai] = useState<number>(0);
  const [formPlafonMaksimal, setFormPlafonMaksimal] = useState<number>(PLAFON_MAKSIMAL_DEFAULT);
  const [formKeterangan, setFormKeterangan] = useState<string>('RANAP');
  const [formDiagnosa, setFormDiagnosa] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');

  // Global Ctrl+F / Cmd+F Keyboard Shortcut Interceptor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Copy RM Handler
  const handleCopyNoRm = (noRm: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(noRm);
    setCopiedRm(noRm);
    showToast(`No. RM ${noRm} disalin ke clipboard`, 'info');
    setTimeout(() => setCopiedRm(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // Client-Side Gemini Vision Extraction Fallback (for static or serverless deployments)
  // ---------------------------------------------------------------------------
  const extractWithDirectClientGemini = async (sheets: UploadedSheet[], apiKey: string): Promise<JasaRaharjaOcrItem[]> => {
    const prompt = `Anda adalah sistem OCR cerdas untuk Rumah Sakit Muhammadiyah Babat (RSUMB).
Tugas Anda adalah membaca gambar/foto tabel data fisik pasien penjamin Jasa Raharja (KLL).
Kolom yang ada pada tabel:
1. No. RM (contoh: 07-42-18, 08-95-30, 09.12.05)
2. Nama Pasien
3. Tanggal Kunjungan / Tindakan (format YYYY-MM-DD atau DD/MM/YYYY)
4. Biaya Terpakai (Nominal Rupiah)
5. Sisa Plafon (Nominal Rupiah)
6. Keterangan / Status (RANAP, HABIS, RUJUK, AFF KWIRE, MENINGGAL, dsb)

KEMBALIKAN HANYA JSON VALID MURNI (tanpa markdown tambahan) dengan format array berikut:
[
  {
    "no_rm": "07-42-18",
    "nama_pasien": "NAMA LENGKAP PASIEN",
    "tanggal": "2026-09-08",
    "biaya_terpakai": 11738348,
    "sisa_plafon": 8261652,
    "status_keterangan": "RANAP"
  }
]`;

    const parts: any[] = [{ text: prompt }];

    sheets.forEach((sheet) => {
      let data = sheet.base64;
      let mime = sheet.mimeType || 'image/jpeg';
      const match = sheet.base64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mime = match[1];
        data = match[2];
      }
      parts.push({
        inlineData: {
          mimeType: mime,
          data: data
        }
      });
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }]
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Google Gemini API Error (${response.status})`);
    }

    const resData = await response.json();
    const candidateText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleanText = candidateText.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

    let items: JasaRaharjaOcrItem[] = [];
    try {
      items = JSON.parse(cleanText);
    } catch {
      try {
        const match = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          items = JSON.parse(match[0]);
        }
      } catch {
        items = [];
      }
    }

    return items;
  };

  // ---------------------------------------------------------------------------
  // Trigger Automatic AI Extraction from Uploaded Sheets (with Server + Client Fallback)
  // ---------------------------------------------------------------------------
  const runExtractionOnSheets = useCallback(
    async (sheetsToProcess: UploadedSheet[]) => {
      if (sheetsToProcess.length === 0) return;

      setIsProcessingOcr(true);
      setOcrProgressPercent(20);
      setOcrProgressText(`Sedang mengekstrak tabel dari ${sheetsToProcess.length} foto lembar dengan AI Gemini...`);
      setLastUpsertSummary(null);

      try {
        let extractedList: JasaRaharjaOcrItem[] = [];
        let sourceUsed = 'server_ocr';

        // 1. Try server-side OCR endpoint first
        try {
          const payloadImages = sheetsToProcess.map((sheet) => ({
            imageBase64: sheet.base64,
            mimeType: sheet.mimeType,
            name: sheet.name,
            sheetNumber: sheet.sheetNumber
          }));

          setOcrProgressPercent(45);

          const response = await fetch('/api/jasaraharja/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: payloadImages,
              imageBase64: payloadImages[0]?.imageBase64 || '',
              mimeType: payloadImages[0]?.mimeType || 'image/jpeg'
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.items) && data.items.length > 0) {
              extractedList = data.items;
              sourceUsed = 'server';
            }
          }
        } catch (serverErr) {
          console.warn('Server OCR endpoint tidak dapat dihubungi, mencoba fallback client Gemini:', serverErr);
        }

        // 2. If server did not return items, fallback to client-side direct Gemini call
        if (extractedList.length === 0) {
          setOcrProgressPercent(65);
          const activeKey =
            localStorage.getItem('gemini_api_key') ||
            (import.meta as any).env?.VITE_GEMINI_API_KEY ||
            '';

          if (activeKey) {
            setOcrProgressText('Menghubungi Gemini Vision AI secara langsung...');
            extractedList = await extractWithDirectClientGemini(sheetsToProcess, activeKey);
            sourceUsed = 'client_gemini';
          } else {
            // Prompt user for API Key if in deployed environment without backend key
            setIsApiKeyModalOpen(true);
            setIsProcessingOcr(false);
            setOcrProgressText('');
            showToast('Kunci API Gemini diperlukan untuk proses OCR di lingkungan ini. Silakan masukkan API Key Anda.', 'info');
            return;
          }
        }

        setOcrProgressPercent(90);

        if (extractedList.length === 0) {
          showToast('Tidak ada baris data pasien yang dapat dikenali dari foto lembar.', 'error');
          setIsProcessingOcr(false);
          return;
        }

        // Apply UPSERT logic based on No. RM
        let upsertResult: UpsertResult;
        if (onUpsertItems) {
          upsertResult = onUpsertItems(extractedList);
        } else {
          upsertResult = upsertJasaRaharjaItems(items, extractedList);
          saveJasaRaharjaData(upsertResult.updatedList);
        }

        setOcrProgressPercent(100);
        setLastUpsertSummary(upsertResult);

        // Update sheet statuses
        setUploadedSheets((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'done',
            extractedCount: Math.round(extractedList.length / prev.length)
          }))
        );

        showToast(
          `Ekstraksi AI Sukses: ${upsertResult.updatedCount} pasien diperbarui, ${upsertResult.addedCount} pasien baru ditambahkan!`,
          'success'
        );
      } catch (err: any) {
        console.error('Error saat ekstraksi OCR:', err);
        let errorDisplayMsg = 'Terjadi kesalahan saat memproses foto tabel.';
        const rawErr = String(err?.message || err || '');

        if (rawErr.includes('503') || rawErr.includes('high demand') || rawErr.includes('UNAVAILABLE')) {
          errorDisplayMsg = 'Layanan AI sedang mengalami lonjakan antrean (503). Silakan coba klik tombol Ekstrak Ulang.';
        } else if (rawErr.includes('API key') || rawErr.includes('403') || rawErr.includes('unauthorized')) {
          errorDisplayMsg = 'Kunci API Gemini tidak valid atau kuota habis. Silakan periksa pengaturan API Key.';
          setIsApiKeyModalOpen(true);
        } else if (rawErr) {
          errorDisplayMsg = rawErr;
        }

        showToast(errorDisplayMsg, 'error');
        setUploadedSheets((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'error',
            errorMsg: errorDisplayMsg
          }))
        );
      } finally {
        setIsProcessingOcr(false);
        setOcrProgressText('');
        setOcrProgressPercent(0);
      }
    },
    [items, onUpsertItems, showToast]
  );

  // ---------------------------------------------------------------------------
  // Handle Excel / CSV File Import (Local SheetJS Parser)
  // ---------------------------------------------------------------------------
  const handleExcelFileSelected = async (file: File) => {
    setIsProcessingOcr(true);
    setOcrProgressPercent(25);
    setOcrProgressText(`Membaca file ${file.name}...`);
    setLastUpsertSummary(null);

    try {
      const buffer = await file.arrayBuffer();
      setOcrProgressPercent(60);
      setOcrProgressText('Memetakan kolom (No. RM, Pasien, Biaya, Plafon)...');

      const extractedItems = parseExcelJasaRaharja(buffer);
      setOcrProgressPercent(90);

      if (extractedItems.length === 0) {
        showToast('Tidak ada data pasien yang valid di dalam file Excel.', 'error');
        return;
      }

      // Upsert into state
      let upsertResult: UpsertResult;
      if (onUpsertItems) {
        upsertResult = onUpsertItems(extractedItems);
      } else {
        upsertResult = upsertJasaRaharjaItems(items, extractedItems);
        saveJasaRaharjaData(upsertResult.updatedList);
      }

      setOcrProgressPercent(100);
      setLastUpsertSummary(upsertResult);

      showToast(
        `Impor Excel Sukses: ${upsertResult.updatedCount} pasien diperbarui, ${upsertResult.addedCount} pasien baru ditambahkan dari ${file.name}!`,
        'success'
      );
    } catch (err: any) {
      console.error('Error saat parsing file Excel:', err);
      showToast(err?.message || 'Gagal membaca berkas Excel/CSV. Pastikan format tabel memiliki kolom data pasien.', 'error');
    } finally {
      setIsProcessingOcr(false);
      setOcrProgressText('');
      setOcrProgressPercent(0);
    }
  };

  // ---------------------------------------------------------------------------
  // Handle Multi-File Selection (Images, PDF, or Spreadsheet)
  // ---------------------------------------------------------------------------
  const handleFilesSelected = async (filesList: FileList | File[]) => {
    const rawFiles = Array.from(filesList);
    if (rawFiles.length === 0) return;

    const excelFiles: File[] = [];
    const mediaFiles: File[] = [];

    for (const file of rawFiles) {
      const lowerName = file.name.toLowerCase();
      const isExcel =
        lowerName.endsWith('.xlsx') ||
        lowerName.endsWith('.xls') ||
        lowerName.endsWith('.csv') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'text/csv';

      const isMediaOrPdf =
        file.type.startsWith('image/') ||
        file.type === 'application/pdf' ||
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png') ||
        lowerName.endsWith('.webp');

      if (isExcel) {
        excelFiles.push(file);
      } else if (isMediaOrPdf) {
        mediaFiles.push(file);
      }
    }

    if (excelFiles.length === 0 && mediaFiles.length === 0) {
      showToast('Harap pilih file gambar (JPG, PNG), PDF (.pdf), atau berkas Excel (.xlsx, .xls, .csv).', 'error');
      return;
    }

    // 1. Process Excel / CSV Files directly via SheetJS (XLSX)
    for (const excelFile of excelFiles) {
      await handleExcelFileSelected(excelFile);
    }

    // 2. Process Image / PDF Files via Gemini AI OCR
    if (mediaFiles.length > 0) {
      const validMediaFiles = mediaFiles.slice(0, 4); // Max 4 sheets/docs per batch
      setIsProcessingOcr(true);
      setOcrProgressPercent(15);
      setOcrProgressText(`Memuat ${validMediaFiles.length} berkas foto/dokumen untuk ekstraksi AI...`);

      const processedSheets: UploadedSheet[] = [];

      for (let i = 0; i < validMediaFiles.length; i++) {
        const file = validMediaFiles[i];
        try {
          const fileData = await readFileAsBase64(file);
          processedSheets.push({
            id: `sheet-${Date.now()}-${i}`,
            name: file.name,
            sheetNumber: i + 1,
            previewUrl: fileData.base64,
            base64: fileData.base64,
            mimeType: fileData.mimeType,
            size: file.size,
            status: 'processing'
          });
        } catch (readErr) {
          console.error('Gagal membaca berkas dokumen:', readErr);
        }
      }

      if (processedSheets.length > 0) {
        setUploadedSheets(processedSheets);
        await runExtractionOnSheets(processedSheets);
      } else {
        setIsProcessingOcr(false);
        setOcrProgressText('');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedSheets((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllSheets = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedSheets([]);
    setLastUpsertSummary(null);
  };

  // Save Custom Gemini API Key
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (customApiKey.trim()) {
      localStorage.setItem('gemini_api_key', customApiKey.trim());
      showToast('Kunci API Gemini berhasil disimpan untuk lingkungan ini.', 'success');
      setIsApiKeyModalOpen(false);
      if (uploadedSheets.length > 0) {
        runExtractionOnSheets(uploadedSheets);
      }
    } else {
      localStorage.removeItem('gemini_api_key');
      showToast('Kunci API kustom dihapus.', 'info');
      setIsApiKeyModalOpen(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helper to Highlight Matching Search Text
  // ---------------------------------------------------------------------------
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const totalPasien = items.length;
    const totalTerpakai = items.reduce((acc, curr) => acc + (curr.biayaTerpakai || 0), 0);
    const totalSisa = items.reduce((acc, curr) => acc + (curr.sisaPlafon || 0), 0);
    const pasienHabis = items.filter(
      (item) =>
        item.sisaPlafon <= 0 ||
        item.statusPlafon === 'HABIS' ||
        item.keterangan?.toUpperCase().includes('HABIS')
    ).length;

    return {
      totalPasien,
      totalTerpakai,
      totalSisa,
      pasienHabis
    };
  }, [items]);

  // ---------------------------------------------------------------------------
  // Reactive Instant Live Search & Filtering
  // ---------------------------------------------------------------------------
  const filteredAndSortedItems = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const filtered = items.filter((item) => {
      if (query) {
        const matchNama = item.namaPasien?.toLowerCase().includes(query);
        const matchRm = item.noRm?.toLowerCase().includes(query) || normalizeNoRm(item.noRm).includes(normalizeNoRm(query));
        const matchKet = item.keterangan?.toLowerCase().includes(query);
        const matchTgl = item.tanggal?.toLowerCase().includes(query);
        const matchDiag = item.diagnosa?.toLowerCase().includes(query);
        if (!matchNama && !matchRm && !matchKet && !matchTgl && !matchDiag) {
          return false;
        }
      }

      if (activeFilter === 'habis') {
        return item.sisaPlafon <= 0 || item.statusPlafon === 'HABIS' || item.keterangan?.toUpperCase().includes('HABIS');
      }
      if (activeFilter === 'sisa') {
        return item.sisaPlafon > 0 && item.statusPlafon !== 'HABIS';
      }
      if (activeFilter === 'ranap') {
        return item.keterangan?.toUpperCase().includes('RANAP');
      }
      if (activeFilter === 'rujuk') {
        return item.keterangan?.toUpperCase().includes('RUJUK');
      }

      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'no') {
        comparison = (a.no || 0) - (b.no || 0);
      } else if (sortField === 'tanggal') {
        comparison = new Date(a.tanggal || 0).getTime() - new Date(b.tanggal || 0).getTime();
      } else if (sortField === 'nama') {
        comparison = (a.namaPasien || '').localeCompare(b.namaPasien || '');
      } else if (sortField === 'terpakai') {
        comparison = (a.biayaTerpakai || 0) - (b.biayaTerpakai || 0);
      } else if (sortField === 'sisa') {
        comparison = (a.sisaPlafon || 0) - (b.sisaPlafon || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, searchTerm, activeFilter, sortField, sortOrder]);

  // Modal Handlers for Add / Edit
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().slice(0, 10));
    setFormNoRm('');
    setFormNamaPasien('');
    setFormBiayaTerpakai(0);
    setFormPlafonMaksimal(PLAFON_MAKSIMAL_DEFAULT);
    setFormKeterangan('RANAP');
    setFormDiagnosa('');
    setFormCatatan('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: JasaRaharjaItem) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal || new Date().toISOString().slice(0, 10));
    setFormNoRm(item.noRm);
    setFormNamaPasien(item.namaPasien);
    setFormBiayaTerpakai(item.biayaTerpakai);
    setFormPlafonMaksimal(item.plafonMaksimal || PLAFON_MAKSIMAL_DEFAULT);
    setFormKeterangan(item.keterangan || 'RANAP');
    setFormDiagnosa(item.diagnosa || '');
    setFormCatatan(item.catatan || '');
    setIsAddModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNoRm.trim() || !formNamaPasien.trim()) {
      showToast('No. RM dan Nama Pasien wajib diisi.', 'error');
      return;
    }

    const plafonMax = formPlafonMaksimal || PLAFON_MAKSIMAL_DEFAULT;
    const biaya = Number(formBiayaTerpakai) || 0;
    const sisa = Math.max(0, plafonMax - biaya);
    const statusPlafon = sisa <= 0 ? 'HABIS' : 'TERSEDIA';

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        tanggal: formTanggal,
        noRm: formNoRm.trim(),
        namaPasien: formNamaPasien.trim(),
        biayaTerpakai: biaya,
        sisaPlafon: sisa,
        plafonMaksimal: plafonMax,
        keterangan: formKeterangan.trim().toUpperCase(),
        statusPlafon,
        diagnosa: formDiagnosa.trim(),
        catatan: formCatatan.trim()
      });
      showToast(`Data pasien ${formNamaPasien} berhasil diperbarui.`, 'success');
    } else {
      onAddItem({
        no: items.length + 1,
        tanggal: formTanggal,
        noRm: formNoRm.trim(),
        namaPasien: formNamaPasien.trim(),
        biayaTerpakai: biaya,
        sisaPlafon: sisa,
        plafonMaksimal: plafonMax,
        keterangan: formKeterangan.trim().toUpperCase(),
        statusPlafon,
        diagnosa: formDiagnosa.trim(),
        catatan: formCatatan.trim()
      });
      showToast(`Pasien baru ${formNamaPasien} berhasil ditambahkan ke tabel.`, 'success');
    }

    setIsAddModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      showToast(`Data pasien ${itemToDelete.namaPasien} (No. RM ${itemToDelete.noRm}) berhasil dihapus.`, 'info');
      setItemToDelete(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Status Badge Renderer
  // ---------------------------------------------------------------------------
  const renderStatusBadge = (keterangan?: string) => {
    const rawKet = (keterangan || '').trim().toUpperCase();

    if (rawKet.includes('HABIS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          HABIS
        </span>
      );
    }
    if (rawKet.includes('RUJUK')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          RUJUK
        </span>
      );
    }
    if (rawKet.includes('RANAP')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
          RANAP
        </span>
      );
    }
    if (rawKet.includes('AFF KWIRE') || rawKet.includes('KWIRE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
          AFF KWIRE
        </span>
      );
    }
    if (rawKet.includes('MENINGGAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-white shadow-sm">
          MENINGGAL
        </span>
      );
    }
    if (rawKet.includes('KONTROL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
          KONTROL
        </span>
      );
    }

    if (rawKet) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {keterangan}
        </span>
      );
    }

    return <span className="text-slate-400 text-xs">-</span>;
  };

  // ---------------------------------------------------------------------------
  // Modal Handlers (Add / Edit / Delete)
  // ---------------------------------------------------------------------------
  const openEditModal = (item: JasaRaharjaItem) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal || new Date().toISOString().slice(0, 10));
    setFormNoRm(item.noRm || '');
    setFormNamaPasien(item.namaPasien || '');
    setFormBiayaTerpakai(item.biayaTerpakai || 0);
    setFormPlafonMaksimal(item.plafonMaksimal || PLAFON_MAKSIMAL_DEFAULT);
    setFormKeterangan(item.keterangan || 'RANAP');
    setFormDiagnosa(item.diagnosa || '');
    setFormCatatan(item.catatan || '');
    setIsAddModalOpen(true);
  };

  return (
    <div id="jasa-raharja-module" className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* -------------------------------------------------------------------------
          HEADER & METRICS
      -------------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Plafon Jasa Raharja (KLL)
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tabel Digital Terintegrasi
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              RS Muhammadiyah Babat &bull; Rekapitulasi Plafon Santunan Korban Kecelakaan Lalu Lintas
            </p>
          </div>
        </div>

        {/* Top Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pasien Manual</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Total Pasien Terdata</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalPasien}</span>
            <span className="text-xs font-semibold text-slate-400">Kasus KLL</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Plafon Terpakai (Klaim)</span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {formatRupiah(stats.totalTerpakai)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-emerald-700">Total Sisa Plafon RSUMB</span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
              {formatRupiah(stats.totalSisa)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-between bg-rose-50/30">
          <span className="text-xs font-medium text-rose-700">Plafon Habis (Limit Rp 20Jt)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600 font-mono">{stats.pasienHabis}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
              Perlu BPJS/Umum
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          KOMPONEN UTAMA 1: AREA UPLOAD DOKUMEN / TABEL MULTI-FORMAT (FOTO, PDF, EXCEL)
      -------------------------------------------------------------------------- */}
      <div
        id="multi-sheet-upload-zone"
        className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-sm ${
          isDraggingOver
            ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10'
            : 'border-dashed border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={genericInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesSelected(e.target.files);
            }
          }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                1. Upload Dokumen / Tabel Jasa Raharja
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Multi-Format (Foto / PDF / Excel)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Tarik & letakkan file (Foto, PDF, atau Excel .xlsx/.csv). Sistem akan mengekstrak/membaca data tabel dan menggabungkan seluruh baris pasien ke tabel digital secara otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            <button
              type="button"
              disabled={isProcessingOcr}
              onClick={() => genericInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>📤 Pilih File (Foto / PDF / Excel)</span>
            </button>

            {uploadedSheets.length > 0 && !isProcessingOcr && (
              <button
                type="button"
                onClick={() => runExtractionOnSheets(uploadedSheets)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Ekstrak ulang berkas yang telah diupload"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekstrak Ulang</span>
              </button>
            )}

            {uploadedSheets.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllSheets}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Hapus semua berkas yang dipilih"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessingOcr && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold">{ocrProgressText}</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Memindai No. RM, nama pasien, tanggal klaim, plafon terpakai, dan sisa nominal...
              </p>
            </div>
          </div>
        )}

        {/* Upsert Feedback Banner */}
        {lastUpsertSummary && !isProcessingOcr && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Sinkronisasi Tabel Digital Selesai! ({lastUpsertSummary.updatedCount + lastUpsertSummary.addedCount} Pasien Diproses)
                </p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  &bull; <span className="font-semibold text-emerald-900">{lastUpsertSummary.updatedCount} pasien</span> diupdate nominalnya berdasarkan No. RM yang sudah ada di sistem.
                  <br />
                  &bull; <span className="font-semibold text-emerald-900">{lastUpsertSummary.addedCount} pasien baru</span> ditambahkan ke tabel digital.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastUpsertSummary(null)}
              className="text-emerald-600 hover:text-emerald-900 text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Thumbnail Preview Slots (Lembar 1 - 4) */}
        {uploadedSheets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Pratinjau Berkas Dokumen ({uploadedSheets.length} file diunggah):</span>
              <span className="text-[11px] text-slate-400 font-normal">Tersambung ke Gemini AI OCR</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {uploadedSheets.map((sheet, idx) => {
                const isPdf = sheet.mimeType === 'application/pdf' || sheet.name.toLowerCase().endsWith('.pdf');
                return (
                  <div
                    key={sheet.id}
                    className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="relative h-24 sm:h-28 w-full bg-slate-900/5 overflow-hidden flex items-center justify-center">
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                          <FileText className="w-8 h-8 text-rose-500" />
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            DOKUMEN PDF
                          </span>
                        </div>
                      ) : (
                        <img
                          src={sheet.previewUrl}
                          alt={sheet.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold">
                        Lembar {idx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveSheet(sheet.id, e)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-all cursor-pointer"
                        title="Hapus lembar ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2 text-[11px] flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-800 truncate" title={sheet.name}>
                        {sheet.name}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{(sheet.size / 1024).toFixed(0)} KB</span>
                        {sheet.status === 'done' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Berhasil
                          </span>
                        ) : sheet.status === 'processing' ? (
                          <span className="text-amber-600 font-medium">Mengekstrak...</span>
                        ) : sheet.status === 'error' ? (
                          <span className="text-rose-600 font-medium">Gagal</span>
                        ) : (
                          <span>Siap</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------------
          KOMPONEN UTAMA 2: KOTAK PENCARIAN UTAMA (INSTANT SEARCH / CTRL + F)
      -------------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Cari Nama Pasien atau No. RM... (misal: SUNARYO / 074218)"
              className="w-full pl-11 pr-24 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded bg-slate-200/70 border border-slate-300 text-[10px] font-mono text-slate-600">
                Ctrl + F
              </kbd>
            </div>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('habis')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'habis'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Habis ({stats.pasienHabis})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('sisa')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'sisa'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              Sisa Tersedia
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ranap')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'ranap'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              Ranap
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('rujuk')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'rujuk'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Rujuk
            </button>
          </div>
        </div>

        {/* Counter & Active Filter feedback */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredAndSortedItems.length}</span> dari total{' '}
            <span className="font-semibold text-slate-700">{items.length}</span> pasien
            {searchTerm && (
              <span className="ml-1.5 text-emerald-700 font-medium">
                (filter kata kunci: &ldquo;{searchTerm}&rdquo;)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Urutkan:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-');
                setSortField(f as any);
                setSortOrder(o as any);
              }}
              className="text-xs bg-transparent border-0 font-semibold text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="tanggal-desc">Tanggal Terbaru</option>
              <option value="tanggal-asc">Tanggal Terlama</option>
              <option value="terpakai-desc">Plafon Terpakai Tertinggi</option>
              <option value="sisa-asc">Sisa Plafon Terkecil (Habis)</option>
              <option value="nama-asc">Nama Pasien (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          KOMPONEN 3: TABEL DIGITAL INSTAN & RESPONSIF
          Kolom: [No, Tanggal, No. RM, Nama Pasien, Plafon Terpakai, Sisa Plafon, Status/Keterangan]
      -------------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">No. RM</th>
                <th className="py-3.5 px-4">Nama Pasien</th>
                <th className="py-3.5 px-4 text-right">Plafon Terpakai</th>
                <th className="py-3.5 px-4 text-right">Sisa Plafon</th>
                <th className="py-3.5 px-4 text-center">Status / Keterangan</th>
                <th className="py-3.5 px-4 text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-600">
                        Tidak ada data pasien yang cocok dengan kriteria pencarian.
                      </p>
                      <p className="text-xs text-slate-400">
                        Periksa ejaan No. RM atau Nama Pasien, atau klik tombol di bawah untuk reset.
                      </p>
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item, idx) => {
                  const isHabis =
                    item.sisaPlafon <= 0 ||
                    item.statusPlafon === 'HABIS' ||
                    item.keterangan?.toUpperCase().includes('HABIS');

                  return (
                    <tr
                      key={item.id || `jr-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isHabis ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-500 text-xs">
                        {idx + 1}
                      </td>

                      {/* 2. Tanggal */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 text-xs font-medium">
                        {formatTanggalIndo(item.tanggal)}
                      </td>

                      {/* 3. No. RM */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                          <span>{item.noRm}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyNoRm(item.noRm, e)}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            title="Salin No. RM"
                          >
                            {copiedRm === item.noRm ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 4. Nama Pasien */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {renderHighlightedText(item.namaPasien, searchTerm)}
                        </div>
                        {item.diagnosa && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={item.diagnosa}>
                            {item.diagnosa}
                          </div>
                        )}
                      </td>

                      {/* 5. Plafon Terpakai */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs font-bold text-slate-900">
                        {formatRupiah(item.biayaTerpakai)}
                      </td>

                      {/* 6. Sisa Plafon (Badge Merah jika HABIS, Teks Hijau jika masih ada) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isHabis ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                            HABIS (Rp 0)
                          </span>
                        ) : (
                          <span className="font-black text-emerald-600 font-mono text-xs sm:text-sm">
                            {formatRupiah(item.sisaPlafon)}
                          </span>
                        )}
                      </td>

                      {/* 7. Status / Keterangan */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(item.keterangan)}
                      </td>

                      {/* Aksi (Edit & Hapus) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                            title="Edit Data Pasien"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Pasien"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Data otomatis disimpan di penyimpanan lokal browser (Local Storage) &amp; aman dari duplikasi berkat upsert No. RM.
          </div>
          <div className="flex items-center gap-4 font-mono font-semibold">
            <span>
              Total Plafon Terpakai:{' '}
              <strong className="text-slate-900">{formatRupiah(stats.totalTerpakai)}</strong>
            </span>
            <span>
              Total Sisa:{' '}
              <strong className="text-emerald-700">{formatRupiah(stats.totalSisa)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          MODAL: TAMBAH / EDIT PASIEN MANUAL
      -------------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                {editingItem ? 'Edit Data Plafon Pasien' : 'Tambah Pasien Jasa Raharja'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pelayanan / Entri
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Rekam Medis (No. RM) *
                  </label>
                  <input
                    type="text"
                    value={formNoRm}
                    onChange={(e) => setFormNoRm(e.target.value)}
                    placeholder="Contoh: 07-42-18"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pasien *
                </label>
                <input
                  type="text"
                  value={formNamaPasien}
                  onChange={(e) => setFormNamaPasien(e.target.value)}
                  placeholder="Nama korban kecelakaan..."
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plafon Maksimal JR (Rp)
                  </label>
                  <input
                    type="number"
                    value={formPlafonMaksimal}
                    onChange={(e) => setFormPlafonMaksimal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plafon Terpakai / Klaim (Rp)
                  </label>
                  <input
                    type="number"
                    value={formBiayaTerpakai}
                    onChange={(e) => setFormBiayaTerpakai(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Estimasi Sisa Plafon:</span>
                <span
                  className={`font-mono font-bold ${
                    formPlafonMaksimal - formBiayaTerpakai <= 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatRupiah(Math.max(0, formPlafonMaksimal - formBiayaTerpakai))}
                  {formPlafonMaksimal - formBiayaTerpakai <= 0 && ' (HABIS)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status / Keterangan
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {['RANAP', 'HABIS', 'RUJUK', 'AFF KWIRE', 'KONTROL', 'MENINGGAL'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormKeterangan(opt)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
                        formKeterangan === opt
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Atau ketik keterangan kustom..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnosa Medis / Indikasi
                </label>
                <input
                  type="text"
                  value={formDiagnosa}
                  onChange={(e) => setFormDiagnosa(e.target.value)}
                  placeholder="Misal: Fraktur Clavicula Dextra (KLL)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Pasien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          MODAL: KONFIRMASI HAPUS PASIEN
      -------------------------------------------------------------------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Hapus Data Pasien?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data pasien{' '}
                <strong className="text-slate-800">{itemToDelete.namaPasien}</strong> (No. RM: {itemToDelete.noRm})?
                Data yang dihapus tidak dapat dipulihkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
