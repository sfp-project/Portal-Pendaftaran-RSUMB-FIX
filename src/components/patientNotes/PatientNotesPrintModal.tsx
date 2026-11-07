import React, { useState } from 'react';
import { Printer, X, Download, Filter, FileText } from 'lucide-react';
import {
  PatientNotesTab,
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord,
  PatientShiftHandoverRecord
} from '../../types/patientNotesTypes';
import { UnifiedSpecialPatientItem } from './PatientNotesView';
import { loadActiveStaff } from '../../data/headerData';

interface PatientNotesPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubTab: PatientNotesTab;
  kllRecords: PatientKllRecord[];
  bpjsRecords: PatientBpjsKendalaRecord[];
  asuransiRecords: PatientAsuransiSwastaRecord[];
  umumRecords: PatientUmumBeresikoRecord[];
  handoverRecords?: PatientShiftHandoverRecord[];
  allSpecialPatients?: UnifiedSpecialPatientItem[];
}

export const PatientNotesPrintModal: React.FC<PatientNotesPrintModalProps> = ({
  isOpen,
  onClose,
  activeSubTab,
  kllRecords,
  bpjsRecords,
  asuransiRecords,
  umumRecords,
  handoverRecords = [],
  allSpecialPatients = []
}) => {
  // Pilihan Scope Cetak: 'active' = Sesuai Kategori / Tab yang Sedang Dibuka, 'all' = Rekapitulasi Keseluruhan Semua Kategori
  const [selectedScope, setSelectedScope] = useState<'active' | 'all'>('active');

  if (!isOpen) return null;

  const activeStaff = loadActiveStaff();
  const staffName = activeStaff?.name || 'Petugas Admisi & Pendaftaran';

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const currentTimestamp = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());

  // Tentukan apakah mode cetak saat ini adalah ALL atau per-kategori
  const isPrintingAll = selectedScope === 'all' || activeSubTab === 'all';

  // Judul Dinamis Laporan Sesuai Kategori / Scope yang Dipilih
  const getDynamicReportTitle = () => {
    if (isPrintingAll) {
      return 'LAPORAN REKAPITULASI KESELURUHAN CATATAN KHUSUS PASIEN';
    }
    switch (activeSubTab) {
      case 'kll':
        return 'LAPORAN REKAPITULASI KELOMPOK: PASIEN KECELAKAAN LALU LINTAS (KLL & JASA RAHARJA)';
      case 'bpjs_kendala':
        return 'LAPORAN REKAPITULASI KELOMPOK: PASIEN BPJS KENDALA KEPESERTAAN & BRIDGING SEP';
      case 'asuransi_swasta':
        return 'LAPORAN REKAPITULASI KELOMPOK: CATATAN KHUSUS PASIEN ASURANSI SWASTA';
      case 'umum_beresiko':
        return 'LAPORAN REKAPITULASI KELOMPOK: EARLY WARNING PASIEN UMUM BERESIKO TINGGI';
      case 'handover_shift':
        return 'LAPORAN REKAPITULASI KELOMPOK: CATATAN OPERAN / HANDOVER SHIFT ADMISI';
      default:
        return 'LAPORAN REKAPITULASI CATATAN KHUSUS PASIEN';
    }
  };

  const getDynamicSubTitle = () => {
    if (isPrintingAll) {
      return 'Kompilasi Gabungan Kasus KLL, Kendala BPJS Kesehatan, Asuransi Swasta, & UMUM Beresiko';
    }
    switch (activeSubTab) {
      case 'kll':
        return 'Daftar Kasus Pasien Kecelakaan Lalu Lintas, Verifikasi Berkas & Pengurusan Laporan Polisi (LP)';
      case 'bpjs_kendala':
        return 'Daftar Kasus Kendala Kepesertaan BPJS (Non-Aktif, Denda Pelayanan, SEP Blocked, Perbedaan Data/NIK)';
      case 'asuransi_swasta':
        return 'Daftar Koordinasi Penjaminan Pasien Asuransi Swasta & Status Guarantee Letter (GL)';
      case 'umum_beresiko':
        return 'Monitoring Pasien Umum Potensi Risiko Biaya Tinggi, APS/Kabur, Readmisi, dan Komplain';
      case 'handover_shift':
        return 'Operan Catatan Pasien dan Tugas Antar Shift Petugas Pendaftaran & Admisi Rawat Inap';
      default:
        return 'Unit Pendaftaran & Admisi Pasien RSU Muhammadiyah Babat';
    }
  };

  // Standarisasi baris data tabel cetak ke dalam format seragam (Unified Print Row)
  interface PrintRowData {
    no: number;
    kategori: string;
    penjamin: string;
    namaPasien: string;
    noRm: string;
    tanggalMasukKasus: string;
    kamarKelas: string;
    deskripsiKendala: string;
    statusFollowUp: string;
    isResolved: boolean;
  }

  const printRows: PrintRowData[] = [];

  if (isPrintingAll) {
    // Mode Keseluruhan: Gunakan allSpecialPatients atau susun dari seluruh array
    if (allSpecialPatients && allSpecialPatients.length > 0) {
      allSpecialPatients.forEach((item, idx) => {
        printRows.push({
          no: idx + 1,
          kategori: item.categoryLabel,
          penjamin: item.penjamin || '-',
          namaPasien: item.namaPasien || '-',
          noRm: item.noRm || '-',
          tanggalMasukKasus: item.tanggalKasus && item.tanggalKasus !== item.tanggalMrs
            ? `${item.tanggalMrs || '-'} (Kasus: ${item.tanggalKasus})`
            : item.tanggalMrs || '-',
          kamarKelas: item.kamarKelas || '-',
          deskripsiKendala: item.detailInfo
            ? `${item.deskripsi} (${item.detailInfo})`
            : item.deskripsi || '-',
          statusFollowUp: item.isResolved ? 'Selesai / Aman' : 'Pending Follow-Up',
          isResolved: item.isResolved
        });
      });
    } else {
      // Fallback gabungan manual
      let count = 1;
      kllRecords.forEach((r) => {
        printRows.push({
          no: count++,
          kategori: 'KLL',
          penjamin: r.penjamin || 'Jasa Raharja',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: `MRS: ${r.tanggalMrs || '-'} | KLL: ${r.tanggalKll || '-'}`,
          kamarKelas: r.catatan?.match(/Kamar\s*:\s*([^\n|]+)/i)?.[1]?.trim() || '-',
          deskripsiKendala: `${r.kronologi || '-'} (LP: ${r.statusLp || '-'})`,
          statusFollowUp: r.isResolved ? 'Selesai / Aman' : 'Pending Follow-Up',
          isResolved: Boolean(r.isResolved)
        });
      });
      bpjsRecords.forEach((r) => {
        const isRes = r.status === 'Resolved (cetak SEP)' || r.status === 'Resolved';
        printRows.push({
          no: count++,
          kategori: 'BPJS Kendala',
          penjamin: 'BPJS Kesehatan',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: r.tanggalMrsKontrol || r.createdAt?.slice(0, 10) || '-',
          kamarKelas: '-',
          deskripsiKendala: `${r.jenisKendala} - ${r.detailMasalah || '-'} (Solusi: ${r.catatanSolusi || '-'})`,
          statusFollowUp: isRes ? 'Selesai / Aman' : 'Pending Follow-Up',
          isResolved: isRes
        });
      });
      asuransiRecords.forEach((r) => {
        printRows.push({
          no: count++,
          kategori: 'Asuransi Swasta',
          penjamin: r.namaAsuransi || 'Asuransi Swasta',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: r.createdAt?.slice(0, 10) || '-',
          kamarKelas: '-',
          deskripsiKendala: `${r.statusKlaim || '-'} | Catatan: ${r.catatanHandover || '-'}`,
          statusFollowUp: r.isResolved ? 'Selesai / Aman' : 'Pending Follow-Up',
          isResolved: Boolean(r.isResolved)
        });
      });
      umumRecords.forEach((r) => {
        printRows.push({
          no: count++,
          kategori: 'UMUM Beresiko',
          penjamin: 'Pasien Umum',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: r.tanggalMrsKontrol || r.createdAt?.slice(0, 10) || '-',
          kamarKelas: '-',
          deskripsiKendala: `${r.kronologiMasalah || '-'} | Potensi: ${r.potensiMasalah?.join(', ') || '-'}`,
          statusFollowUp: r.isResolved ? 'Selesai / Aman' : 'Pending Follow-Up',
          isResolved: Boolean(r.isResolved)
        });
      });
    }
  } else {
    // Mode Per-Kategori Khusus Berdasarkan activeSubTab
    if (activeSubTab === 'kll') {
      kllRecords.forEach((r, idx) => {
        printRows.push({
          no: idx + 1,
          kategori: 'KLL',
          penjamin: r.penjamin || 'Jasa Raharja',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: `MRS: ${r.tanggalMrs || '-'} | KLL: ${r.tanggalKll || '-'}`,
          kamarKelas: r.catatan?.match(/Kamar\s*:\s*([^\n|]+)/i)?.[1]?.trim() || '-',
          deskripsiKendala: `Kronologi: ${r.kronologi || '-'} | Status LP: ${r.statusLp || '-'} | Catatan: ${r.catatan || '-'}`,
          statusFollowUp: r.isResolved ? 'Selesai / Aman' : 'Pending Follow-Up',
          isResolved: Boolean(r.isResolved)
        });
      });
    } else if (activeSubTab === 'bpjs_kendala') {
      bpjsRecords.forEach((r, idx) => {
        const isRes = r.status === 'Resolved (cetak SEP)' || r.status === 'Resolved';
        printRows.push({
          no: idx + 1,
          kategori: 'BPJS Kendala',
          penjamin: 'BPJS Kesehatan',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: r.tanggalMrsKontrol || r.createdAt?.slice(0, 10) || '-',
          kamarKelas: '-',
          deskripsiKendala: `Jenis: ${r.jenisKendala} | No Kartu: ${r.noKartuBpjs || '-'} | Masalah: ${r.detailMasalah || '-'} | Solusi: ${r.catatanSolusi || '-'}`,
          statusFollowUp: isRes ? 'Selesai (Cetak SEP)' : 'Pending Follow-Up',
          isResolved: isRes
        });
      });
    } else if (activeSubTab === 'asuransi_swasta') {
      asuransiRecords.forEach((r, idx) => {
        printRows.push({
          no: idx + 1,
          kategori: 'Asuransi Swasta',
          penjamin: r.namaAsuransi || 'Asuransi Swasta',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: r.createdAt?.slice(0, 10) || '-',
          kamarKelas: '-',
          deskripsiKendala: `Status Klaim: ${r.statusKlaim || '-'} | Catatan Handover: ${r.catatanHandover || '-'}`,
          statusFollowUp: r.isResolved ? 'Selesai / Disetujui' : 'Pending Follow-Up',
          isResolved: Boolean(r.isResolved)
        });
      });
    } else if (activeSubTab === 'umum_beresiko') {
      umumRecords.forEach((r, idx) => {
        printRows.push({
          no: idx + 1,
          kategori: 'UMUM Beresiko',
          penjamin: 'Pasien Umum',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: r.tanggalMrsKontrol || r.createdAt?.slice(0, 10) || '-',
          kamarKelas: '-',
          deskripsiKendala: `Masalah: ${r.kronologiMasalah || '-'} | Potensi: ${r.potensiMasalah?.join(', ') || '-'} | Tindak Lanjut: ${r.tindakLanjut || '-'}`,
          statusFollowUp: r.isResolved ? 'Selesai / Teratasi' : 'Pending Follow-Up',
          isResolved: Boolean(r.isResolved)
        });
      });
    } else if (activeSubTab === 'handover_shift') {
      handoverRecords.forEach((r, idx) => {
        printRows.push({
          no: idx + 1,
          kategori: 'Handover Shift',
          penjamin: r.kategori || 'Handover',
          namaPasien: r.namaPasien,
          noRm: r.noRm,
          tanggalMasukKasus: r.timestamp?.slice(0, 10) || r.createdAt?.slice(0, 10) || '-',
          kamarKelas: '-',
          deskripsiKendala: `Shift: ${r.shift} | Petugas: ${r.petugasAsal} | Masalah: ${r.masalah}`,
          statusFollowUp: r.status === 'Handled' ? 'Selesai (Handled)' : 'Pending',
          isResolved: r.status === 'Handled'
        });
      });
    }
  }

  // Hitung ringkasan status baris cetak
  const totalBaris = printRows.length;
  const totalPending = printRows.filter((r) => !r.isResolved).length;
  const totalSelesai = totalBaris - totalPending;

  const handlePrint = () => {
    const reportTitle = getDynamicReportTitle();
    const subTitle = getDynamicSubTitle();

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle} - RSU Muhammadiyah Babat</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            font-family: 'Arial', sans-serif;
            padding: 10px;
            color: #111;
            background: #fff;
            margin: 0;
            line-height: 1.3;
          }
          .kop-container {
            border-bottom: 3px double #004d2e;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .kop-header {
            text-align: center;
            flex: 1;
          }
          .kop-header h2 {
            margin: 0;
            font-size: 16pt;
            font-weight: 900;
            color: #005d42;
            letter-spacing: 0.5px;
          }
          .kop-header h3 {
            margin: 2px 0;
            font-size: 11pt;
            font-weight: 700;
            color: #333;
          }
          .kop-header p {
            margin: 1px 0;
            font-size: 8pt;
            color: #555;
          }
          .title-section {
            text-align: center;
            margin-bottom: 12px;
            background-color: #f8fafc;
            padding: 8px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
          }
          .report-title {
            margin: 0;
            font-size: 12pt;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
          }
          .report-subtitle {
            margin: 3px 0 0 0;
            font-size: 8.5pt;
            color: #475569;
            font-weight: 600;
          }
          .meta-bar {
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            margin-bottom: 8px;
            font-weight: 600;
            color: #334155;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-top: 6px;
          }
          th, td {
            border: 1px solid #475569;
            padding: 5px 6px;
            vertical-align: top;
          }
          th {
            background-color: #e2e8f0;
            color: #0f172a;
            font-weight: 800;
            text-transform: uppercase;
            text-align: center;
            font-size: 8pt;
          }
          td.center {
            text-align: center;
          }
          .badge-status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 7.5pt;
          }
          .status-pending {
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #fcd34d;
          }
          .status-resolved {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
          }
          .signatures-container {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            font-size: 9pt;
          }
          .sig-box {
            text-align: center;
            width: 250px;
          }
          .sig-box .date-line {
            margin-bottom: 4px;
          }
          .sig-box .role-line {
            font-weight: 700;
            margin-bottom: 55px;
          }
          .sig-box .name-line {
            font-weight: 800;
            text-decoration: underline;
            text-transform: uppercase;
          }
          .sig-box .nip-line {
            font-size: 8pt;
            color: #475569;
          }
          .no-print {
            margin-bottom: 12px;
            padding: 10px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .btn {
            padding: 8px 16px;
            background: #005d42;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 11px;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div>
            <strong>Pratinjau Cetak:</strong> Siap cetak ke printer / simpan PDF. Disarankan kertas A4 Landscape.
          </div>
          <div>
            <button class="btn" onclick="window.print()">🖨️ CETAK / PRINT SEKARANG</button>
            <button class="btn" style="background:#475569; margin-left:6px;" onclick="window.close()">❌ TUTUP</button>
          </div>
        </div>

        <div class="kop-container">
          <div class="kop-header">
            <h2>RUMAH SAKIT UMUM MUHAMMADIYAH BABAT</h2>
            <h3>UNIT PENDAFTARAN & ADMISI RAWAT INAP</h3>
            <p>Jl. Raya Babat - Surabaya No. 127 Babat, Lamongan, Jawa Timur | Telp: (0322) 451125 | Email: info@rsumbabat.id</p>
          </div>
        </div>

        <div class="title-section">
          <h1 class="report-title">${reportTitle}</h1>
          <p class="report-subtitle">${subTitle}</p>
        </div>

        <div class="meta-bar">
          <div>
            <span>Tanggal Cetak: <strong>${todayFormatted}</strong> (${currentTimestamp})</span>
            <span style="margin-left: 15px;">Dicetak Oleh: <strong>${staffName}</strong></span>
          </div>
          <div>
            <span>Total Pasien: <strong>${totalBaris}</strong></span> | 
            <span style="color:#b45309;">Pending: <strong>${totalPending}</strong></span> | 
            <span style="color:#047857;">Selesai: <strong>${totalSelesai}</strong></span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 28px;">No</th>
              <th style="width: 120px;">Kategori & Penjamin</th>
              <th style="width: 140px;">Nama Pasien</th>
              <th style="width: 75px;">No. RM</th>
              <th style="width: 95px;">Tgl Masuk / Kasus</th>
              <th style="width: 70px;">Kamar / Kls</th>
              <th>Deskripsi Kendala & Catatan Khusus</th>
              <th style="width: 110px;">Status Follow-Up</th>
            </tr>
          </thead>
          <tbody>
            ${printRows.length === 0 ? `
              <tr>
                <td colspan="8" style="text-align:center; padding: 25px; color:#64748b;">
                  <em>Tidak ada data catatan khusus pasien yang terdaftar dalam kriteria laporan ini.</em>
                </td>
              </tr>
            ` : printRows.map((row) => `
              <tr>
                <td class="center font-bold">${row.no}</td>
                <td>
                  <strong>${row.kategori}</strong>
                  <br><span style="color:#475569; font-size:7.5pt;">${row.penjamin}</span>
                </td>
                <td><strong>${row.namaPasien}</strong></td>
                <td class="center" style="font-family:monospace; font-weight:bold; color:#1d4ed8;">${row.noRm}</td>
                <td class="center">${row.tanggalMasukKasus}</td>
                <td class="center font-bold">${row.kamarKelas}</td>
                <td>${row.deskripsiKendala}</td>
                <td class="center">
                  <span class="badge-status ${row.isResolved ? 'status-resolved' : 'status-pending'}">
                    ${row.statusFollowUp}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signatures-container">
          <div class="sig-box">
            <div class="date-line">&nbsp;</div>
            <div class="role-line">Mengetahui,<br>Kepala Unit Rekam Medis & Admisi</div>
            <div class="name-line">dr. H. Riza Fahmi, Sp.A</div>
            <div class="nip-line">NBM: 109.876.543</div>
          </div>

          <div class="sig-box">
            <div class="date-line">Babat, ${todayFormatted}</div>
            <div class="role-line">Petugas Yang Melaporkan,</div>
            <div class="name-line">${staffName}</div>
            <div class="nip-line">Admin Pendaftaran & Admisi RSUMB</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      alert('Harap izinkan Pop-up pada browser Anda untuk mencetak rekapitulasi!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#004d2e] via-[#005d42] to-[#0d5c3b] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-extrabold text-base text-white leading-tight">
                Pratinjau &amp; Cetak Rekapitulasi Catatan Khusus Pasien
              </h3>
              <p className="text-emerald-100 text-[11px] mt-0.5">
                Format landscape siap cetak resmi RSU Muhammadiyah Babat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Cakupan Data Cetak:</span>
            </span>
            <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSelectedScope('active')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedScope === 'active'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeSubTab === 'all' ? 'Semua Pasien (Tab Aktif)' : `Tab Aktif (${activeSubTab.toUpperCase()})`}
              </button>
              <button
                type="button"
                onClick={() => setSelectedScope('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedScope === 'all'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Kategori Gabungan
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>Cetak Rekap (A4 Landscape)</span>
            </button>
          </div>
        </div>

        {/* Live Preview Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-slate-300 w-full max-w-4xl text-slate-800 text-xs">
            {/* KOP RESMI */}
            <div className="border-b-2 border-emerald-900 pb-3 mb-3 flex items-center justify-between text-center">
              <div className="w-full">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-emerald-800 uppercase">
                  RUMAH SAKIT UMUM MUHAMMADIYAH BABAT
                </h2>
                <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase mt-0.5">
                  UNIT PENDAFTARAN &amp; ADMISI RAWAT INAP
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Jl. Raya Babat - Surabaya No. 127 Babat, Lamongan, Jawa Timur | Telp: (0322) 451125 | Email: info@rsumbabat.id
                </p>
              </div>
            </div>

            {/* JUDUL LAPORAN DINAMIS */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center mb-3">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase">
                {getDynamicReportTitle()}
              </h4>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                {getDynamicSubTitle()}
              </p>
            </div>

            {/* METADATA BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-semibold text-slate-600 pb-2 mb-2 border-b border-slate-100 gap-1">
              <div>
                <span>Tanggal Cetak: <strong className="text-slate-800">{todayFormatted}</strong></span>
                <span className="mx-2">•</span>
                <span>Petugas: <strong className="text-slate-800">{staffName}</strong></span>
              </div>
              <div>
                <span>Total: <strong className="text-slate-900">{totalBaris}</strong></span>
                <span className="mx-1.5">•</span>
                <span className="text-amber-700">Pending: <strong>{totalPending}</strong></span>
                <span className="mx-1.5">•</span>
                <span className="text-emerald-700">Selesai: <strong>{totalSelesai}</strong></span>
              </div>
            </div>

            {/* TABEL DATA LENGKAP */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 uppercase font-extrabold text-[10px] border-b border-slate-300">
                    <th className="py-2 px-2 text-center w-8">No</th>
                    <th className="py-2 px-2.5 text-center min-w-[110px]">Kategori &amp; Penjamin</th>
                    <th className="py-2 px-3 min-w-[130px]">Nama Pasien</th>
                    <th className="py-2 px-2 text-center w-20">No. RM</th>
                    <th className="py-2 px-2 text-center min-w-[90px]">Tgl Masuk/Kasus</th>
                    <th className="py-2 px-2 text-center w-20">Kamar/Kls</th>
                    <th className="py-2 px-3 min-w-[220px]">Deskripsi Kendala &amp; Catatan Khusus</th>
                    <th className="py-2 px-2.5 text-center min-w-[110px]">Status Follow-Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                        Tidak ada data catatan khusus pasien yang terdaftar dalam kriteria laporan ini.
                      </td>
                    </tr>
                  ) : (
                    printRows.map((row) => (
                      <tr key={row.no} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center font-bold text-slate-600">{row.no}</td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded font-extrabold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                            {row.kategori}
                          </span>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[110px]">
                            {row.penjamin}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.namaPasien}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-blue-700">{row.noRm}</td>
                        <td className="py-2 px-2 text-center text-slate-600 text-[10px]">{row.tanggalMasukKasus}</td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700">{row.kamarKelas}</td>
                        <td className="py-2 px-3 text-slate-700 text-[10px] leading-relaxed">{row.deskripsiKendala}</td>
                        <td className="py-2 px-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              row.isResolved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {row.statusFollowUp}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TANDA TANGAN PETUGAS */}
            <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px]">
              <div className="text-center w-56">
                <div className="font-bold text-slate-700 mb-12">
                  Mengetahui,<br />Kepala Unit Rekam Medis &amp; Admisi
                </div>
                <div className="font-extrabold text-slate-900 underline uppercase">
                  dr. H. Riza Fahmi, Sp.A
                </div>
                <div className="text-[10px] text-slate-500">NBM: 109.876.543</div>
              </div>

              <div className="text-center w-56">
                <div className="text-slate-500 mb-0.5">Babat, {todayFormatted}</div>
                <div className="font-bold text-slate-700 mb-12">
                  Petugas Yang Melaporkan,
                </div>
                <div className="font-extrabold text-slate-900 underline uppercase">
                  {staffName}
                </div>
                <div className="text-[10px] text-slate-500">Admin Pendaftaran &amp; Admisi RSUMB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
