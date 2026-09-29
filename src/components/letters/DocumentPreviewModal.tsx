import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Download,
  X,
  FileText,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Check,
  Calendar,
  HardDrive,
  Tag,
  FileCode2,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import { renderAsync } from 'docx-preview';
import { MasterDocumentItem } from '../../types/documentRepositoryTypes';
import { formatUploadDate } from '../../data/documentRepositoryData';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  document: MasterDocumentItem | null;
  onClose: () => void;
  onDownload: (doc: MasterDocumentItem) => void;
  showToast: (message: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  document: doc,
  onClose,
  onDownload,
  showToast
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [docxViewerMode, setDocxViewerMode] = useState<'direct' | 'googledocs' | 'office'>('direct');
  const [customPublicUrl, setCustomPublicUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [docxRenderError, setDocxRenderError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const docxContainerRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Setup Document Content when modal opens or document changes
  useEffect(() => {
    if (!isOpen || !doc) {
      setPdfBlobUrl(null);
      setDocxRenderError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setDocxRenderError(null);

    const isPdf = (doc.formatBerkas || '').toLowerCase().includes('pdf');

    if (isPdf) {
      // 1. PDF Handling
      try {
        if (doc.blobUrl) {
          // If a direct Blob URL created via URL.createObjectURL(file) is already available
          setPdfBlobUrl(doc.blobUrl);
          setIsLoading(false);
        } else if (doc.fileData) {
          // Convert base64 data URL to Blob and create object URL
          const cleanBase64 = doc.fileData.includes(',') ? doc.fileData.split(',')[1] : doc.fileData;
          const mimeMatch = doc.fileData.match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
          const bstr = atob(cleanBase64);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          setIsLoading(false);
        } else {
          // Generate official RSUMB Document PDF preview dynamically via jsPDF
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          // Header KOP RSU Muhammadiyah Babat
          pdf.setFillColor(0, 93, 66); // #005d42
          pdf.rect(0, 0, 210, 8, 'F');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          pdf.setTextColor(0, 93, 66);
          pdf.text('RUMAH SAKIT UMUM MUHAMMADIYAH BABAT', 105, 20, { align: 'center' });

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(80, 80, 80);
          pdf.text('Jl. KH. Ahmad Dahlan No. 14 Babat, Lamongan - Jawa Timur | Telp: (0322) 451124', 105, 25, { align: 'center' });
          pdf.text('Website: www.rsumbabat.com | Email: info@rsumbabat.com', 105, 29, { align: 'center' });

          // Divider
          pdf.setDrawColor(0, 93, 66);
          pdf.setLineWidth(0.8);
          pdf.line(15, 32, 195, 32);
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.3);
          pdf.line(15, 33.5, 195, 33.5);

          // Document Title
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(13);
          pdf.setTextColor(20, 20, 20);
          pdf.text(doc.judul.toUpperCase(), 105, 43, { align: 'center' });

          // Document Number
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Nomor Arsip Master: RSUMB/FORM/${doc.id.substring(4, 12).toUpperCase()}`, 105, 48, { align: 'center' });

          // Metadata Box
          pdf.setFillColor(248, 250, 252);
          pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(15, 54, 180, 32, 2, 2, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(0, 93, 66);
          pdf.text('METADATA FORMULIR RESMI', 20, 60);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(50, 50, 50);
          pdf.text(`Kategori Layanan : ${doc.kategori}`, 20, 66);
          pdf.text(`Nama Berkas      : ${doc.namaBerkas}`, 20, 71);
          pdf.text(`Format Berkas    : .${(doc.formatBerkas || 'PDF').toUpperCase()}`, 20, 76);
          pdf.text(`Ukuran Berkas    : ${doc.ukuranBerkas || 'Standar'}`, 110, 66);
          pdf.text(`Tanggal Arsip     : ${formatUploadDate(doc.tanggalDiunggah)}`, 110, 71);
          pdf.text(`Status Dokumen  : Berkas Master Terverifikasi`, 110, 76);

          // Keterangan / Deskripsi
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.setTextColor(30, 41, 59);
          pdf.text('Deskripsi / Petunjuk Penggunaan Formulir:', 15, 94);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(71, 85, 105);
          const splitDesc = pdf.splitTextToSize(doc.keterangan || 'Formulir master resmi untuk administrasi dan pelayanan medis pasien RS Muhammadiyah Babat.', 180);
          pdf.text(splitDesc, 15, 100);

          // Mock Form Content Body
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.4);
          pdf.rect(15, 115, 180, 115);

          pdf.setFillColor(241, 245, 249);
          pdf.rect(15, 115, 180, 8, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(51, 65, 85);
          pdf.text('BAGIAN A: DATA IDENTITAS PASIEN / PEMOHON', 20, 120.5);

          // Lines for fillable form simulation
          const fields = [
            '1. No. Rekam Medis (RM)  : ___________________________',
            '2. Nama Lengkap Pasien   : ___________________________',
            '3. NIK / No. KTP         : ___________________________',
            '4. Tanggal Lahir / Umur  : ___________________________',
            '5. Jenis Kelamin         : [  ] Laki-Laki    [  ] Perempuan',
            '6. Alamat Domisili       : ___________________________',
            '7. No. Telepon / WhatsApp: ___________________________',
            '8. Dokter Penanggung Jawab: ___________________________'
          ];

          let curY = 130;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(70, 70, 70);
          fields.forEach((field) => {
            pdf.text(field, 20, curY);
            curY += 6.5;
          });

          // Section B
          pdf.setFillColor(241, 245, 249);
          pdf.rect(15, curY + 2, 180, 8, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(51, 65, 85);
          pdf.text('BAGIAN B: LEMBAR PENGESAHAN & PERSETUJUAN DOKTER / PETUGAS', 20, curY + 7.5);

          curY += 16;
          pdf.setFont('helvetica', 'normal');
          pdf.text('Mengetahui / Menyetujui,', 25, curY);
          pdf.text('Babat, ................................ 2026', 130, curY);
          pdf.text('Petugas Pelayanan Medis RSUMB', 25, curY + 5);
          pdf.text('Dokter Penanggung Jawab Pelayanan (DPJP)', 130, curY + 5);

          curY += 24;
          pdf.text('(........................................................)', 25, curY);
          pdf.text('(........................................................)', 130, curY);

          // Footer
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(7.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text('Dokumen ini dicetak otomatis melalui SIMRS RSU Muhammadiyah Babat - Master Form Repository.', 15, 285);
          pdf.text('Halaman 1 dari 1', 195, 285, { align: 'right' });

          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to create PDF preview:', err);
        setIsLoading(false);
      }
    } else {
      // 2. DOCX Handling
      setIsLoading(false);
    }
  }, [isOpen, doc]);

  // DOCX Direct rendering via docx-preview
  useEffect(() => {
    if (!isOpen || !doc) return;
    const isPdf = (doc.formatBerkas || '').toLowerCase().includes('pdf');
    if (isPdf) return;

    if (docxViewerMode === 'direct') {
      const renderWordDocument = async () => {
        setIsLoading(true);
        setDocxRenderError(null);

        if (!docxContainerRef.current) return;
        docxContainerRef.current.innerHTML = '';

        try {
          if (doc.fileData && doc.fileData.startsWith('data:')) {
            // Convert data URL to ArrayBuffer for docx-preview
            const base64Part = doc.fileData.split(',')[1];
            const binaryString = atob(base64Part);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            await renderAsync(bytes.buffer, docxContainerRef.current, undefined, {
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              className: 'docx-preview-output'
            });
            setIsLoading(false);
          } else {
            // Document without embedded base64; render structured Master Document Layout
            renderFormattedDocxFallback();
            setIsLoading(false);
          }
        } catch (err: any) {
          console.warn('docx-preview direct render error:', err);
          setDocxRenderError(
            'Berkas Word ini menggunakan format kustom. Menampilkan ringkasan layout formulir master.'
          );
          renderFormattedDocxFallback();
          setIsLoading(false);
        }
      };

      renderWordDocument();
    }
  }, [isOpen, doc, docxViewerMode]);

  // Fallback layout renderer for docx when direct binary preview isn't available
  const renderFormattedDocxFallback = () => {
    if (!docxContainerRef.current || !doc) return;
    docxContainerRef.current.innerHTML = `
      <div class="max-w-3xl mx-auto bg-white p-8 sm:p-12 shadow-sm border border-slate-200 rounded-xl space-y-6 text-slate-800 font-sans">
        <div class="border-b-2 border-[#005d42] pb-4 text-center">
          <h2 class="text-xl font-black text-[#005d42] tracking-wide">RUMAH SAKIT UMUM MUHAMMADIYAH BABAT</h2>
          <p class="text-xs text-slate-500 mt-1">Jl. KH. Ahmad Dahlan No. 14 Babat, Lamongan - Jawa Timur | Telp: (0322) 451124</p>
          <p class="text-xs text-slate-400">Pusat Repositori Formulir & Master Dokumen Resmi</p>
        </div>

        <div class="text-center py-2">
          <h1 class="text-lg font-bold text-slate-900 uppercase underline tracking-wider">${doc.judul}</h1>
          <p class="text-xs text-slate-500 font-mono mt-1">No. Arsip: RSUMB/DOCX/${doc.id.substring(4, 12).toUpperCase()}</p>
        </div>

        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
          <div class="font-bold text-[#005d42] mb-1">DATA DOKUMEN MASTER</div>
          <div class="grid grid-cols-2 gap-2 text-slate-600">
            <div><strong class="text-slate-800">Kategori:</strong> ${doc.kategori}</div>
            <div><strong class="text-slate-800">Nama Berkas:</strong> ${doc.namaBerkas}</div>
            <div><strong class="text-slate-800">Format:</strong> .DOCX (Microsoft Word)</div>
            <div><strong class="text-slate-800">Ukuran:</strong> ${doc.ukuranBerkas || 'Standar'}</div>
            <div><strong class="text-slate-800">Diunggah:</strong> ${formatUploadDate(doc.tanggalDiunggah)}</div>
            <div><strong class="text-slate-800">Status:</strong> Siap Unduh & Cetak</div>
          </div>
        </div>

        <div class="text-xs space-y-3">
          <div class="font-bold text-slate-900">Keterangan / Instruksi Formulir:</div>
          <p class="text-slate-600 leading-relaxed bg-amber-50/70 p-3 rounded-lg border border-amber-200/70">
            ${doc.keterangan || 'Formulir master format Microsoft Word (.docx) siap pakai untuk layanan administrasi medis rumah sakit.'}
          </p>
        </div>

        <div class="border border-slate-200 rounded-xl p-4 space-y-3 bg-white text-xs">
          <div class="font-bold text-slate-800 border-b border-slate-100 pb-2">Kerangka Isian Formulir (${doc.namaBerkas}):</div>
          <div class="space-y-2 font-mono text-slate-500 text-[11px]">
            <div>1. Nama Pasien / Pemohon   : [ .............................................................. ]</div>
            <div>2. No. Rekam Medis (RM)     : [ .............................................................. ]</div>
            <div>3. Diagnosis Utama / ICD-10 : [ .............................................................. ]</div>
            <div>4. Tindakan Medis           : [ .............................................................. ]</div>
            <div>5. DPJP / Dokter Pengirim   : [ .............................................................. ]</div>
          </div>
        </div>

        <div class="pt-8 flex justify-between text-xs text-center text-slate-600">
          <div>
            <p>Petugas Administrasi RSUMB,</p>
            <div class="h-16"></div>
            <p class="font-bold">( ........................................................ )</p>
          </div>
          <div>
            <p>Babat, ............................................ 2026</p>
            <p>Dokter Spesialis Penanggung Jawab,</p>
            <div class="h-14"></div>
            <p class="font-bold">( ........................................................ )</p>
          </div>
        </div>
      </div>
    `;
  };

  if (!isOpen || !doc) return null;

  const isPdf = (doc.formatBerkas || '').toLowerCase().includes('pdf');

  // Compute viewer URLs for Google Docs & Office Online
  // If user provided a public URL or default sample public docx URL
  const targetDocxUrl =
    customPublicUrl.trim() ||
    `https://calibre-ebook.com/downloads/demos/demo.docx`;

  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    targetDocxUrl
  )}&embedded=true`;

  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    targetDocxUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetDocxUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('Tautan dokumen disalin.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none'
            : 'w-full max-w-6xl h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================================================================== */}
        {/* TOP BAR / MODAL HEADER */}
        {/* ==================================================================== */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          {/* Left: Document Info & Badges */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isPdf ? 'bg-rose-500/20 text-rose-400' : 'bg-sky-500/20 text-sky-400'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md sm:max-w-xl">
                  {doc.judul}
                </h3>
                {/* Format Badge */}
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isPdf
                      ? 'bg-rose-500 text-white'
                      : 'bg-sky-500 text-white'
                  }`}
                >
                  .{doc.formatBerkas || (isPdf ? 'PDF' : 'DOCX')}
                </span>
                {/* Category Badge */}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {doc.kategori}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                <span>{doc.namaBerkas}</span>
                {doc.ukuranBerkas && <span>• {doc.ukuranBerkas}</span>}
                <span>• Diunggah {formatUploadDate(doc.tanggalDiunggah)}</span>
              </p>
            </div>
          </div>

          {/* Right: ACTION BUTTONS (Unduh Sekarang & Tutup) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Cadangan [ 🔗 Buka PDF di Tab Baru ] untuk PDF */}
            {isPdf && pdfBlobUrl && (
              <a
                id="btn-preview-open-pdf-new-tab"
                href={pdfBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
                title="Buka PDF di tab baru browser (bebas dari proteksi Chrome)"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">🔗 Buka di Tab Baru</span>
                <span className="sm:hidden">Tab Baru</span>
              </a>
            )}

            {/* Tombol [ 📥 Unduh Sekarang ] */}
            <button
              type="button"
              id="btn-preview-download-now"
              onClick={() => onDownload(doc)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              title="Unduh berkas master sekarang"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Unduh Sekarang</span>
              <span className="sm:hidden">Unduh</span>
            </button>

            {/* Toggle Fullscreen Button */}
            <button
              type="button"
              id="btn-preview-fullscreen-toggle"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer hidden md:flex items-center justify-center"
              title={isFullscreen ? 'Keluar dari layar penuh' : 'Layar penuh'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Tombol [ ✖️ Tutup ] */}
            <button
              type="button"
              id="btn-preview-close"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              title="Tutup pratinjau (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SUB-HEADER / VIEWER CONTROLS (Khusus DOCX: Google Docs / Office) */}
        {/* ==================================================================== */}
        {!isPdf && (
          <div className="px-4 sm:px-6 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            {/* Tab switchers */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                id="tab-view-direct"
                onClick={() => setDocxViewerMode('direct')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  docxViewerMode === 'direct'
                    ? 'bg-[#005d42] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pratinjau Dokumen Asli</span>
              </button>

              <button
                type="button"
                id="tab-view-googledocs"
                onClick={() => setDocxViewerMode('googledocs')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  docxViewerMode === 'googledocs'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Docs Viewer</span>
              </button>

              <button
                type="button"
                id="tab-view-office"
                onClick={() => setDocxViewerMode('office')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  docxViewerMode === 'office'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Office Online Viewer</span>
              </button>
            </div>

            {/* Hint / URL Info */}
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              {docxViewerMode === 'direct' ? (
                <span className="text-emerald-800 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Pratinjau Word berkecepatan tinggi aktif
                </span>
              ) : (
                <span className="text-slate-600 truncate max-w-xs">
                  Integrasi {docxViewerMode === 'googledocs' ? 'Google Docs' : 'Office Online'} Viewer
                </span>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MAIN VIEWER AREA */}
        {/* ==================================================================== */}
        <div className="flex-1 relative bg-slate-100 overflow-hidden flex flex-col">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
              <div className="w-10 h-10 border-3 border-[#005d42]/30 border-t-[#005d42] rounded-full animate-spin"></div>
              <p className="mt-3 text-xs font-semibold text-slate-700">
                Memuat pratinjau berkas master...
              </p>
            </div>
          )}

          {/* 1. PDF VIEWER: BROWSER PDF VIEWER VIA <object> & <embed> (TIDAK DIBLOKIR CHROME) */}
          {isPdf && (
            <div className="w-full h-full flex flex-col">
              {/* Fallback Banner Bar if Chrome blocks embedded viewer */}
              <div className="px-4 py-2.5 bg-blue-50/90 border-b border-blue-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
                <div className="flex items-center gap-2 text-blue-950 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse"></span>
                  <span>
                    Jika pratinjau di bawah terhalang proteksi Chrome (&apos;This page has been blocked by Chrome&apos;):
                  </span>
                </div>
                {pdfBlobUrl && (
                  <a
                    id="btn-pdf-banner-open-tab"
                    href={pdfBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    title="Buka PDF di tab baru browser tanpa terhalang proteksi Chrome"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>🔗 Buka PDF di Tab Baru</span>
                  </a>
                )}
              </div>

              {pdfBlobUrl ? (
                <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-200">
                  <object
                    id="pdf-preview-object"
                    data={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                    type="application/pdf"
                    className="w-full h-full border-0 block"
                    title={`Pratinjau Dokumen PDF - ${doc.judul}`}
                  >
                    <embed
                      id="pdf-preview-embed"
                      src={`${pdfBlobUrl}#toolbar=1`}
                      type="application/pdf"
                      className="w-full h-full border-0 block"
                    />
                    {/* Fallback jika browser tetap memblokir object & embed */}
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-white">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <FileText className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-base text-slate-800">
                        Pratinjau Berkas PDF Siap Dibuka
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mt-1 mb-5 leading-relaxed">
                        Browser Chrome membatasi rendering PDF langsung di dalam modal. Gunakan tombol di bawah untuk membuka dokumen PDF secara utuh di tab browser baru tanpa terhalang proteksi.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <a
                          id="btn-fallback-open-tab"
                          href={pdfBlobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>🔗 Buka PDF di Tab Baru</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => onDownload(doc)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Unduh Berkas</span>
                        </button>
                      </div>
                    </div>
                  </object>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center bg-white">
                  <div className="max-w-md space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                    <h4 className="font-bold text-slate-800">
                      Gagal Menyiapkan Pratinjau PDF
                    </h4>
                    <p className="text-xs text-slate-500">
                      Browser Anda memblokir pembuatan pratinjau berkas. Anda tetap dapat mengunduh berkas langsung.
                    </p>
                    <button
                      type="button"
                      onClick={() => onDownload(doc)}
                      className="px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Unduh Berkas Sekarang
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. DOCX VIEWER: 3 PILIHAN (DIRECT WORD RENDERER, GOOGLE DOCS, OFFICE ONLINE) */}
          {!isPdf && (
            <div className="w-full h-full relative overflow-hidden flex flex-col">
              {/* Option A: Direct Word Document Renderer */}
              {docxViewerMode === 'direct' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70">
                  {docxRenderError && (
                    <div className="max-w-3xl mx-auto mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{docxRenderError}</span>
                    </div>
                  )}
                  {/* Container into which docx-preview injects rendered HTML */}
                  <div
                    ref={docxContainerRef}
                    id="docx-render-container"
                    className="min-h-[500px]"
                  />
                </div>
              )}

              {/* Option B: Google Docs Viewer Iframe */}
              {docxViewerMode === 'googledocs' && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="px-4 py-2 bg-blue-50/80 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      Menampilkan via <strong>Google Docs Viewer</strong> (https://docs.google.com/viewer)
                    </span>
                    <a
                      href={googleDocsViewerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline font-bold flex items-center gap-1"
                    >
                      Buka di Tab Baru <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <iframe
                    id="google-docs-viewer-iframe"
                    src={googleDocsViewerUrl}
                    className="w-full h-full border-0 bg-white"
                    title="Google Docs Viewer"
                  />
                </div>
              )}

              {/* Option C: Office Online Viewer Iframe */}
              {docxViewerMode === 'office' && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileCode2 className="w-3.5 h-3.5 text-amber-600" />
                      Menampilkan via <strong>Microsoft Office Online Viewer</strong>
                    </span>
                    <a
                      href={officeViewerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:underline font-bold flex items-center gap-1"
                    >
                      Buka di Tab Baru <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <iframe
                    id="office-viewer-iframe"
                    src={officeViewerUrl}
                    className="w-full h-full border-0 bg-white"
                    title="Office Online Viewer"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* BOTTOM FOOTER INFO */}
        {/* ==================================================================== */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700 truncate">
              {doc.namaBerkas}
            </span>
            <span>({doc.ukuranBerkas || 'Standar'})</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onDownload(doc)}
              className="text-[#005d42] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
