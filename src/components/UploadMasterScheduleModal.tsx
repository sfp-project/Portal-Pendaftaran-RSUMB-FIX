import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  FileCheck,
  Info,
  Layers,
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { DoctorSchedule } from '../types';
import {
  masterSchedules,
  inferRoomLocation,
  normalizePoliCanonical,
  inferPoliFromDoctor,
  normalizeDoctorCanonicalName,
  sanitizeAndDeduplicateSchedules
} from '../data/masterSchedulesData';
import { downloadBlob } from '../utils/exportHelpers';

export { inferRoomLocation, normalizePoliCanonical, inferPoliFromDoctor, normalizeDoctorCanonicalName };

interface UploadMasterScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMasterSchedules: (
    newSchedules: DoctorSchedule[]
  ) => Promise<void> | void;
  onUploadMasterAman?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentSchedulesCount: number;
}

function normalizeDayName(raw: string): string {
  const s = (raw || '').trim().toLowerCase();
  if (s.includes('senin')) return 'Senin';
  if (s.includes('selasa')) return 'Selasa';
  if (s.includes('rabu')) return 'Rabu';
  if (s.includes('kamis')) return 'Kamis';
  if (s.includes('jumat') || s.includes("jum'at")) return 'Jumat';
  if (s.includes('sabtu')) return 'Sabtu';
  if (s.includes('ahad') || s.includes('minggu')) return 'Ahad';
  return raw.trim() || 'Senin';
}

function formatJadwalTime(jamHfis: string): string {
  if (!jamHfis) return '08.00 - 12.00';
  return jamHfis.replace(/:/g, '.').replace(/\s*-\s*/g, ' - ');
}

export const UploadMasterScheduleModal: React.FC<UploadMasterScheduleModalProps> = ({
  isOpen,
  onClose,
  onApplyMasterSchedules,
  onUploadMasterAman,
  currentSchedulesCount
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedSchedules, setParsedSchedules] = useState<DoctorSchedule[]>([]);
  const [uploadMode, setUploadMode] = useState<'replace' | 'merge'>('replace');
  const [previewSearch, setPreviewSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleResetFile = () => {
    setFile(null);
    setParsedSchedules([]);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 1. Validasi ekstensi file spreadsheet
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt) {
      alert(`Format file tidak valid (${selectedFile.name}). Harap unggah berkas spreadsheet dengan ekstensi .xlsx, .xls, atau .csv.`);
      if (e.target) e.target.value = '';
      return;
    }

    // 2. Validasi batasan ukuran file maksimum (15 MB)
    const MAX_SIZE_BYTES = 15 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE_BYTES) {
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(2);
      alert(`Ukuran berkas terlalu besar (${sizeMb} MB). Batas maksimum file upload adalah 15 MB.`);
      if (e.target) e.target.value = '';
      return;
    }

    parseExcelFile(selectedFile);
  };

  const parseExcelFile = async (selectedFile: File) => {
    setIsParsing(true);
    setParseError(null);
    setParsedSchedules([]); // 1. BERSIHKAN STATE SEBELUM MEMPROSES FILE BARU
    localStorage.removeItem('rsumb_schedules');
    localStorage.removeItem('medcentral_schedules_v5');
    localStorage.removeItem('rsumb_schedules_cache');
    setFile(selectedFile);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
      }

      // Pick the first sheet or one containing "jadwal" / "master"
      const sheetName =
        workbook.SheetNames.find((name) => /jadwal|master|dpjp/i.test(name)) ||
        workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
      });

      if (!rawData || rawData.length === 0) {
        throw new Error('Lembar kerja Excel kosong atau tidak terbaca.');
      }

      // 1. Tentukan baris awal & kolom secara cerdas (mendukung format master RSUMB dan custom)
      let startIndex = 2; // Default baris ke-3 (indeks 2) sesuai format master RSUMB
      let colPoli = 0;
      let colDokter = 1;
      let colHari = 2;
      let colJamPraktik = 3;
      let colJamHfis = 4;
      let colKuota = 5;
      let colCatatan = 6;

      const isHeaderWord = (str: string) =>
        /^(no|nomor|total|rekapitulasi|subtotal|jumlah|poli|poliklinik|klinik|spesialis|spesialisasi|spesialisasi\s*\/\s*peran|dokter|dpjp|nama dokter|nama nakes|nama dokter\s*\/\s*nakes|nama dpjp|hari|hari praktik|hari praktek|jam|jam praktik|jam praktek|jam praktis|jam hfis|hfis|jam hfis bpjs|kuota|kuota bpjs|catatan|keterangan)$/i.test(str.trim()) ||
        /^(jadwal|master|rekap|daftar|jadwal praktik|jadwal dokter|rsu muhammadiyah babat)$/i.test(str.trim());

      // Deteksi header jika ada di baris 0, 1, atau 2
      for (let r = 0; r < Math.min(rawData.length, 5); r++) {
        const row = (rawData[r] || []).map((cell) => String(cell || '').trim().toLowerCase());
        const dIdx = row.findIndex((c) => /^(dokter|dpjp|nama dokter|nama nakes|nama dokter\s*\/\s*nakes|nama dpjp)$/i.test(c) || c.includes('dokter') || c.includes('nakes'));
        const hIdx = row.findIndex((c) => /^(hari|hari praktik|hari praktek)$/i.test(c) || c === 'hari' || c.startsWith('hari'));

        if (dIdx !== -1 && hIdx !== -1) {
          startIndex = r + 1;
          colDokter = dIdx;
          colHari = hIdx;

          const pIdx = row.findIndex((c) => /^(poli|poliklinik|klinik|spesialis|spesialisasi|peran)$/i.test(c) || c.includes('spesialis') || c.includes('poli'));
          if (pIdx !== -1) colPoli = pIdx;

          const jpIdx = row.findIndex((c) => /^(jam praktik|jam praktek|jam praktis|jadwal)$/i.test(c) || (c.includes('jam') && !c.includes('hfis')));
          if (jpIdx !== -1) colJamPraktik = jpIdx;

          const hfIdx = row.findIndex((c) => /^(hfis|jam hfis|hfis bpjs)$/i.test(c) || c.includes('hfis'));
          if (hfIdx !== -1) colJamHfis = hfIdx;

          const kIdx = row.findIndex((c) => /^(kuota|quota|kuota bpjs)$/i.test(c) || c.includes('kuota'));
          if (kIdx !== -1) colKuota = kIdx;

          const catIdx = row.findIndex((c) => /^(catatan|keterangan|status|note)$/i.test(c) || c.includes('catatan'));
          if (catIdx !== -1) colCatatan = catIdx;
          break;
        }
      }

      let newSchedules: DoctorSchedule[] = [];
      let currentPoli = '';

      // Parsing baris data master (mulai baris data)
      for (let i = startIndex; i < rawData.length; i++) {
        let row = rawData[i];
        if (!row || row.length === 0) continue;

        let rawPoli = row[colPoli] ? row[colPoli].toString().trim() : '';
        if (rawPoli && !isHeaderWord(rawPoli)) {
          currentPoli = normalizePoliCanonical(rawPoli);
        }
        let poli = rawPoli ? normalizePoliCanonical(rawPoli) : currentPoli; // Fitur fill-down jika sel poli digabung

        let dokter = row[colDokter] ? row[colDokter].toString().trim() : '';
        let hari = row[colHari] ? row[colHari].toString().trim() : '';

        // Normalisasi teks hari agar "Minggu" dan "Ahad" selaras
        if (hari.toLowerCase() === 'minggu') hari = 'Ahad';
        else if (hari.toLowerCase() === 'ahad') hari = 'Ahad';
        else hari = normalizeDayName(hari);

        let jamPraktik = row[colJamPraktik] ? row[colJamPraktik].toString().trim() : '';
        let hfis = row[colJamHfis] ? row[colJamHfis].toString().trim() : '';
        let kuota = row[colKuota] ? row[colKuota].toString().trim() : '';
        let catatan = row[colCatatan] ? row[colCatatan].toString().trim() : '';

        // Skip baris kosong atau baris judul header yang berulang
        if (!dokter || !hari || isHeaderWord(dokter) || isHeaderWord(hari)) {
          continue;
        }

        // Validasi hari
        const daysRegex = /senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|ahad/i;
        if (!daysRegex.test(hari)) {
          continue;
        }

        const canonicalDokter = normalizeDoctorCanonicalName(dokter);
        const canonicalPoli = poli || inferPoliFromDoctor(canonicalDokter) || 'Poli Spesialis';
        const kuotaNum = parseInt(String(kuota).replace(/[^0-9]/g, ''), 10) || 30;
        const isNonaktif =
          /nonaktif|non-aktif|tutup|libur/i.test(catatan) ||
          catatan.toUpperCase() === 'JADWAL NONAKTIF';

        const scheduleId = `sch-master-${i + 1}`;
        const room = inferRoomLocation(canonicalPoli);
        const jadwalFormatted = jamPraktik || formatJadwalTime(hfis);

        newSchedules.push({
          id: scheduleId,
          no: i + 1,
          poli: canonicalPoli,
          dokter: canonicalDokter,
          dpjp: canonicalDokter,
          hari: hari,
          jadwal: jadwalFormatted,
          jamPraktik: jamPraktik,
          jamHfis: hfis,
          hfis: hfis,
          kuota: kuotaNum,
          kuotaTotal: kuotaNum,
          kuotaBpjs: kuotaNum,
          kuotaTerisi: 0,
          rerataPasien: Math.round(kuotaNum * 0.8),
          ruangan: room,
          status: isNonaktif ? 'Nonaktif' : 'Tersedia',
          catatan: catatan
        });
      }

      if (newSchedules.length === 0) {
        throw new Error(
          'Tidak ada baris jadwal yang berhasil terbaca dari file Excel ini. Periksa kembali struktur tabel Anda.'
        );
      }

      // LANGKAH UTAMA: Hapus total data lama agar tidak menumpuk/double!
      localStorage.removeItem('rsumb_schedules');

      const clean = sanitizeAndDeduplicateSchedules(newSchedules);
      setParsedSchedules(clean);
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      const errMsg = err?.message || 'Gagal membaca file Excel. Pastikan berkas tidak korup dan berformat spreadsheet yang benar.';
      setParseError(errMsg);
      setParsedSchedules([]);
      alert(`Perhatian: Gagal memproses file Excel.\n${errMsg}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Download Official Excel Template (Populated with 64 Master Rows RSUMB)
  const handleDownloadTemplate = () => {
    try {
      const templateData = masterSchedules.map((s) => ({
        POLI: s.poli,
        DOKTER: s.dpjp,
        HARI: s.hari,
        'JAM HFIS': s.jamHfis,
        KUOTA: s.kuotaTotal,
        CATATAN: s.catatan || ''
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);

      // Auto-fit column widths
      ws['!cols'] = [
        { wch: 20 }, // POLI
        { wch: 32 }, // DOKTER
        { wch: 12 }, // HARI
        { wch: 16 }, // JAM HFIS
        { wch: 10 }, // KUOTA
        { wch: 28 }  // CATATAN
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Master Jadwal');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      downloadBlob(blob, 'Template_Master_Jadwal_RSUMB.xlsx');
    } catch (e) {
      console.error('Failed to download template:', e);
    }
  };

  // Unique counts in parsed results
  const uniqueDoctors = useMemo(() => {
    return new Set(parsedSchedules.map((s) => s.dpjp.toLowerCase().trim())).size;
  }, [parsedSchedules]);

  const uniquePolis = useMemo(() => {
    return new Set(parsedSchedules.map((s) => s.poli.toLowerCase().trim())).size;
  }, [parsedSchedules]);

  const uniqueCatatanCount = useMemo(() => {
    return parsedSchedules.filter((s) => Boolean(s.catatan)).length;
  }, [parsedSchedules]);

  const filteredPreview = useMemo(() => {
    if (!previewSearch.trim()) return parsedSchedules;
    const q = previewSearch.toLowerCase().trim();
    return parsedSchedules.filter(
      (s) =>
        s.dpjp.toLowerCase().includes(q) ||
        s.poli.toLowerCase().includes(q) ||
        s.hari.toLowerCase().includes(q) ||
        (s.catatan && s.catatan.toLowerCase().includes(q))
    );
  }, [parsedSchedules, previewSearch]);

  const handleConfirmApply = async () => {
    if (parsedSchedules.length === 0) return;
    setIsSubmitting(true);
    try {
      // LANGKAH UTAMA: Hapus total data lama agar tidak menumpuk/double!
      localStorage.removeItem('rsumb_schedules');
      [
        'medcentral_schedules_v5',
        'medcentral_schedules_v4',
        'medcentral_schedules_v3',
        'medcentral_schedules_v2',
        'medcentral_schedules_v1',
        'rsumb_master_schedules_v4',
        'rsumb_master_schedules_v5',
        'rsumb_schedules_cache'
      ].forEach((k) => localStorage.removeItem(k));

      // Timpa state langsung dengan data baru yang bersih
      await onApplyMasterSchedules(parsedSchedules);
      localStorage.setItem('rsumb_schedules', JSON.stringify(parsedSchedules));
      localStorage.setItem('medcentral_schedules_v5', JSON.stringify(parsedSchedules));

      alert(`Berhasil! Master jadwal diperbarui secara total dan bersih (${parsedSchedules.length} Jadwal).`);
      onClose();
    } catch (err) {
      console.error('Error applying uploaded schedules:', err);
      alert('Gagal memproses file Excel master.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-upload-master-schedule"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                Upload Master Jadwal Dokter (.xlsx)
              </h3>
              <p className="text-xs text-emerald-200/80">
                Pembaruan dinamis jadwal praktik DPJP, jam HFIS, dan kuota BPJS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* File Upload Dropzone */}
          {!file ? (
            <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 bg-emerald-50/30 hover:bg-emerald-50/60 transition-all text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800">
                Pilih atau Seret File Excel Master (.xlsx)
              </h4>
              <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                Mendukung format file <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong> yang berisi kolom POLI, DOKTER, HARI, JAM HFIS, KUOTA, dan CATATAN.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="input-master-excel-file"
                />
                <label
                  htmlFor="input-master-excel-file"
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Pilih File Excel</span>
                </label>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer transition"
                  title="Unduh format tabel Excel resmi RSUMB"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Unduh Template (.xlsx)</span>
                </button>
              </div>

              <div className="mt-4 text-[11px] text-slate-400 bg-white/80 border border-slate-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Format kolom terdeteksi otomatis secara cerdas.</span>
              </div>
            </div>
          ) : (
            /* File Info Bar */
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                  <FileCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB &bull; Terbaca {parsedSchedules.length} baris jadwal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFile}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ganti File</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isParsing && (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Membaca data lembar kerja Excel...</p>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal memproses file Excel</p>
                <p className="mt-0.5 leading-relaxed text-rose-700">{parseError}</p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-2 text-xs font-bold text-rose-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh template resmi dan samakan susunan kolom</span>
                </button>
              </div>
            </div>
          )}

          {/* Parsed Summary & Table Preview */}
          {!isParsing && parsedSchedules.length > 0 && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Jadwal</span>
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                    {parsedSchedules.length}
                  </p>
                  <p className="text-[10px] text-emerald-700">Baris jadwal praktik</p>
                </div>

                <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-800 uppercase">Dokter DPJP</span>
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-teal-950 mt-1">
                    {uniqueDoctors}
                  </p>
                  <p className="text-[10px] text-teal-700">Dokter teridentifikasi</p>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-800 uppercase">Poliklinik</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">
                    {uniquePolis}
                  </p>
                  <p className="text-[10px] text-blue-700">Layanan spesialis</p>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800 uppercase">Catatan Khusus</span>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
                    {uniqueCatatanCount}
                  </p>
                  <p className="text-[10px] text-amber-700">HFIS/Nonaktif tercatat</p>
                </div>
              </div>

              {/* Upload Mode Selector */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Metode Pembaruan Data:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  <div
                    className="p-3 rounded-lg border flex items-start gap-2.5 bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Ganti Seluruh Master Jadwal (Mode Replace)
                      </span>
                      <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                        Menimpa total seluruh {currentSchedulesCount} jadwal saat ini dengan {parsedSchedules.length} data baru dari Excel ini secara bersih untuk mencegah duplikasi data.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table Preview */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pratinjau Data Excel ({filteredPreview.length} dari {parsedSchedules.length} Jadwal)</span>
                  </span>
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Saring dokter, poli, hari..."
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-full sm:w-60"
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
                      <tr className="text-[11px] font-bold uppercase text-slate-600">
                        <th className="px-3 py-2 text-center w-10">No</th>
                        <th className="px-3 py-2 w-28">Poli</th>
                        <th className="px-4 py-2">Dokter / DPJP</th>
                        <th className="px-3 py-2 text-center w-20">Hari</th>
                        <th className="px-3 py-2 text-center w-28">Jam HFIS</th>
                        <th className="px-3 py-2 text-center w-16">Kuota</th>
                        <th className="px-3 py-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredPreview.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-50'}
                        >
                          <td className="px-3 py-2 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/60 text-[11px]">
                              {item.poli}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-bold text-slate-900 whitespace-nowrap">
                            {item.dpjp}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 text-[11px]">
                              {item.hari}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap font-mono text-[11px] text-rose-700 bg-rose-50/40 rounded">
                            {item.jamHfis || '-'}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-emerald-800 whitespace-nowrap">
                            {item.kuotaTotal}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {/HFIS B(UKAN|KN) JADWAL PRA(K)?TIK/i.test(item.catatan || '') ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {item.catatan}
                              </span>
                            ) : /NONAKTIF|NON-AKTIF/i.test(item.catatan || '') ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                JADWAL NONAKTIF
                              </span>
                            ) : item.catatan ? (
                              <span className="text-slate-600 text-[11px]">{item.catatan}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {parsedSchedules.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{parsedSchedules.length} baris siap disimpan ke database & cloud</span>
              </span>
            ) : (
              <span>Unggah file Excel master jadwal untuk memulai pembaruan</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              id="btn-confirm-apply-master-excel"
              onClick={handleConfirmApply}
              disabled={parsedSchedules.length === 0 || isSubmitting}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer ${
                parsedSchedules.length > 0 && !isSubmitting
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Cloud...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan Master Jadwal ({parsedSchedules.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
