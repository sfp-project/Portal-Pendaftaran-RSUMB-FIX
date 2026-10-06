import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Share2,
  Copy,
  Clock,
  User,
  Shield,
  FileText,
  Search,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Calendar,
  Phone,
  Building2,
  Stethoscope,
  X
} from 'lucide-react';
import {
  RequirementDocItem,
  SlipKekuranganBerkas,
  GuarantorCategory,
  ServiceType,
  PendingDocItem
} from '../../types/requirementsTypes';
import {
  MASTER_REQUIREMENTS,
  GUARANTOR_LABELS,
  loadPendingRequirementSlips,
  savePendingRequirementSlips,
  generateNomorSlip,
  calculateDefaultDeadline
} from '../../data/requirementsData';
import { StaffUser } from '../../types/headerTypes';
import { loadActiveStaff } from '../../data/headerData';

interface RequirementsChecklistViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  activeStaff?: StaffUser;
}

export const RequirementsChecklistView: React.FC<RequirementsChecklistViewProps> = ({
  showToast,
  activeStaff
}) => {
  const effectiveStaff = activeStaff || loadActiveStaff();
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'guide' | 'history'>('checklist');
  const [selectedGuarantor, setSelectedGuarantor] = useState<GuarantorCategory>('bpjs');
  const [selectedService, setSelectedService] = useState<ServiceType>('rawat_jalan');

  // Form State Pasien
  const [namaPasien, setNamaPasien] = useState('');
  const [noRm, setNoRm] = useState('');
  const [noHpPasien, setNoHpPasien] = useState('');
  const [poliklinikRuang, setPoliklinikRuang] = useState('');
  const [batasWaktuTeks, setBatasWaktuTeks] = useState(() => calculateDefaultDeadline('bpjs'));
  const [catatanKhusus, setCatatanKhusus] = useState('');

  // Checklist Item States (docId -> { status: 'lengkap' | 'kurang', note: '' })
  const [checklistItems, setChecklistItems] = useState<Record<string, { status: 'lengkap' | 'kurang'; note: string }>>({});

  // History slips
  const [historySlips, setHistorySlips] = useState<SlipKekuranganBerkas[]>(() => loadPendingRequirementSlips());
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<'all' | 'menunggu' | 'lengkap'>('all');

  // Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [activeSlipForPrint, setActiveSlipForPrint] = useState<SlipKekuranganBerkas | null>(null);

  // Filter requirements based on selected guarantor & service
  const filteredRequirements = MASTER_REQUIREMENTS.filter(
    (req) => req.category === selectedGuarantor && req.applicableServices.includes(selectedService)
  );

  // Initialize or reset checklist items when guarantor or service changes
  useEffect(() => {
    const initialMap: Record<string, { status: 'lengkap' | 'kurang'; note: string }> = {};
    filteredRequirements.forEach((req) => {
      // Default to 'lengkap' for smooth UX, staff clicks to flag 'kurang'
      initialMap[req.id] = { status: 'lengkap', note: '' };
    });
    setChecklistItems(initialMap);
    setBatasWaktuTeks(calculateDefaultDeadline(selectedGuarantor));
  }, [selectedGuarantor, selectedService]);

  // Subscribe to storage update for slips
  useEffect(() => {
    const handleUpdate = () => {
      setHistorySlips(loadPendingRequirementSlips());
    };
    window.addEventListener('rsumb_pending_slips_updated', handleUpdate);
    return () => window.removeEventListener('rsumb_pending_slips_updated', handleUpdate);
  }, []);

  // Handle toggling doc status
  const handleToggleDocStatus = (docId: string) => {
    setChecklistItems((prev) => {
      const current = prev[docId]?.status || 'lengkap';
      const next = current === 'lengkap' ? 'kurang' : 'lengkap';
      return {
        ...prev,
        [docId]: {
          status: next,
          note: prev[docId]?.note || ''
        }
      };
    });
  };

  const handleDocNoteChange = (docId: string, note: string) => {
    setChecklistItems((prev) => ({
      ...prev,
      [docId]: {
        status: prev[docId]?.status || 'kurang',
        note
      }
    }));
  };

  const handleMarkAll = (status: 'lengkap' | 'kurang') => {
    const nextMap: Record<string, { status: 'lengkap' | 'kurang'; note: string }> = {};
    filteredRequirements.forEach((req) => {
      nextMap[req.id] = {
        status,
        note: checklistItems[req.id]?.note || ''
      };
    });
    setChecklistItems(nextMap);
  };

  // Hitung jumlah item kurang
  const pendingDocs = filteredRequirements.filter((req) => checklistItems[req.id]?.status === 'kurang');
  const completedDocs = filteredRequirements.filter((req) => checklistItems[req.id]?.status === 'lengkap');

  // Buat objek slip kekurangan berkas
  const constructSlipObject = (): SlipKekuranganBerkas => {
    const items: PendingDocItem[] = filteredRequirements.map((req) => ({
      docId: req.id,
      docName: req.name,
      status: checklistItems[req.id]?.status || 'lengkap',
      note: checklistItems[req.id]?.note
    }));

    return {
      id: `slip-${Date.now()}`,
      nomorSlip: generateNomorSlip(),
      tanggal: new Date().toISOString(),
      noRm: noRm.trim() || 'NON-RM',
      namaPasien: namaPasien.trim() || 'Pasien',
      noHpPasien: noHpPasien.trim(),
      penjamin: selectedGuarantor,
      penjaminLabel: GUARANTOR_LABELS[selectedGuarantor],
      serviceType: selectedService,
      poliklinikRuang: poliklinikRuang.trim() || (selectedService === 'rawat_jalan' ? 'Poliklinik' : 'Rawat Inap'),
      batasWaktuTeks,
      petugasAdmisi: effectiveStaff.name,
      items,
      catatanKhusus: catatanKhusus.trim(),
      statusPengurusan: 'menunggu'
    };
  };

  // Simpan dan Buka Modal Cetak Slip
  const handleGenerateAndPrintSlip = () => {
    if (!namaPasien.trim()) {
      showToast?.('Mohon isi Nama Pasien terlebih dahulu.', 'error');
      return;
    }

    if (pendingDocs.length === 0) {
      showToast?.('Semua berkas berstatus LENGKAP. Tidak ada kekurangan berkas untuk dicetak.', 'info');
      return;
    }

    const newSlip = constructSlipObject();
    const updated = [newSlip, ...historySlips];
    savePendingRequirementSlips(updated);
    setHistorySlips(updated);

    setActiveSlipForPrint(newSlip);
    setPrintModalOpen(true);
    showToast?.(`Slip kekurangan berkas ${newSlip.nomorSlip} berhasil dibuat!`, 'success');
  };

  // Print Thermal 80mm window.print
  const handleExecutePrintThermal = (slip: SlipKekuranganBerkas) => {
    const pendingList = slip.items.filter((item) => item.status === 'kurang');

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SLIP KEKURANGAN BERKAS - ${slip.nomorSlip}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0 !important;
    }
    @media print {
      html, body {
        width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        font-family: 'Courier New', monospace, sans-serif !important;
        color: #000 !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
      }
      .thermal-slip {
        width: 80mm !important;
        max-width: 80mm !important;
        padding: 3mm 4mm !important;
        box-sizing: border-box !important;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 80mm;
      margin: 0 auto;
      padding: 4mm;
      font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #000;
      font-size: 11px;
      line-height: 1.25;
    }
    .header {
      text-align: center;
      margin-bottom: 3mm;
    }
    .header h2 {
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 1px;
      text-transform: uppercase;
    }
    .header p {
      font-size: 9px;
      line-height: 1.2;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 2mm 0;
    }
    .double-divider {
      border-top: 2px dashed #000;
      margin: 2.5mm 0;
    }
    .title-box {
      text-align: center;
      font-weight: 800;
      font-size: 11.5px;
      text-transform: uppercase;
      margin: 2mm 0;
      padding: 1.5mm 0;
      border: 1px solid #000;
    }
    .info-table {
      width: 100%;
      margin: 2mm 0;
      font-size: 10.5px;
    }
    .info-table td {
      vertical-align: top;
      padding: 1px 0;
    }
    .info-table td.label {
      width: 32%;
      font-weight: bold;
    }
    .info-table td.colon {
      width: 4%;
    }
    .section-title {
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      margin: 2mm 0 1mm 0;
    }
    .pending-item {
      margin: 2mm 0;
      padding-left: 2px;
      page-break-inside: avoid;
    }
    .pending-checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1.5px solid #000;
      margin-right: 5px;
      vertical-align: middle;
    }
    .pending-name {
      font-weight: bold;
      font-size: 11px;
    }
    .pending-note {
      font-size: 9.5px;
      font-style: italic;
      margin-left: 17px;
      color: #222;
    }
    .deadline-box {
      margin: 3mm 0;
      padding: 2mm;
      border: 1.5px solid #000;
      background: #fbfbfb;
      font-size: 10px;
      text-align: center;
    }
    .deadline-title {
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10.5px;
      margin-bottom: 2px;
    }
    .warning-text {
      font-size: 9px;
      text-align: justify;
      line-height: 1.25;
      margin: 2mm 0;
    }
    .signature-area {
      margin-top: 3mm;
      width: 100%;
      display: flex;
      justify-content: space-between;
      text-align: center;
      font-size: 9.5px;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 48%;
    }
    .sig-space {
      height: 11mm;
    }
    .footer {
      text-align: center;
      font-size: 8.5px;
      margin-top: 3mm;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="thermal-slip">
    <div class="header">
      <h2>RSU MUHAMMADIYAH BABAT</h2>
      <p>Jl. KH. Ahmad Dahlan No. 14 Babat - Lamongan</p>
      <p>Telp: (0322) 451125 • WhatsApp: 0812-3456-7890</p>
    </div>

    <div class="double-divider"></div>

    <div class="title-box">
      SLIP KEKURANGAN BERKAS
    </div>

    <table class="info-table">
      <tr>
        <td class="label">No. Slip</td>
        <td class="colon">:</td>
        <td><strong>${slip.nomorSlip}</strong></td>
      </tr>
      <tr>
        <td class="label">Tgl/Waktu</td>
        <td class="colon">:</td>
        <td>${new Date(slip.tanggal).toLocaleDateString('id-ID')} ${new Date(slip.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</td>
      </tr>
      <tr>
        <td class="label">No. RM</td>
        <td class="colon">:</td>
        <td><strong>${slip.noRm}</strong></td>
      </tr>
      <tr>
        <td class="label">Nama Pasien</td>
        <td class="colon">:</td>
        <td><strong>${slip.namaPasien}</strong></td>
      </tr>
      <tr>
        <td class="label">Penjamin</td>
        <td class="colon">:</td>
        <td>${slip.penjaminLabel}</td>
      </tr>
      <tr>
        <td class="label">Tujuan</td>
        <td class="colon">:</td>
        <td>${slip.poliklinikRuang} (${slip.serviceType === 'rawat_jalan' ? 'Rawat Jalan' : slip.serviceType === 'rawat_inap' ? 'Rawat Inap' : 'IGD'})</td>
      </tr>
      <tr>
        <td class="label">Petugas</td>
        <td class="colon">:</td>
        <td>${slip.petugasAdmisi}</td>
      </tr>
    </table>

    <div class="divider"></div>

    <div class="section-title">BERKAS BELUM LENGKAP:</div>
    <div>
      ${pendingList
        .map(
          (item, idx) => `
        <div class="pending-item">
          <div>
            <span class="pending-checkbox"></span>
            <span class="pending-name">${idx + 1}. ${item.docName}</span>
          </div>
          ${item.note ? `<div class="pending-note">Catatan: ${item.note}</div>` : ''}
        </div>
      `
        )
        .join('')}
    </div>

    ${slip.catatanKhusus ? `
      <div style="margin: 2mm 0; font-size: 10px;">
        <strong>Catatan Khusus:</strong> ${slip.catatanKhusus}
      </div>
    ` : ''}

    <div class="deadline-box">
      <div class="deadline-title">BATAS WAKTU PENYERAHAN</div>
      <div style="font-weight: bold; color: #000;">${slip.batasWaktuTeks}</div>
    </div>

    <div class="warning-text">
      * <em>Harap menyerahkan berkas kekurangan di atas ke <strong>Loket Admisi / Pendaftaran RSUMB</strong> sebelum batas waktu berakhir.</em><br/>
      * <em>Keterlambatan berkas dapat mengakibatkan penjaminan klaim tidak dapat diproses dan beralih ke <strong>Tarif Pasien Umum</strong>.</em>
    </div>

    <div class="divider"></div>

    <div class="signature-area">
      <div class="sig-col">
        <div>Petugas Admisi,</div>
        <div class="sig-space"></div>
        <div>( ${slip.petugasAdmisi} )</div>
      </div>
      <div class="sig-col">
        <div>Pasien / Keluarga,</div>
        <div class="sig-space"></div>
        <div>( .................... )</div>
      </div>
    </div>

    <div class="footer">
      Simpan struk ini sebagai bukti serah terima berkas menyusul di RSUMB.
    </div>
  </div>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=450,height=650');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 300);
    } else {
      showToast?.('Pop-up terblokir. Izinkan pop-up peramban untuk mencetak.', 'error');
    }
  };

  // Generate WhatsApp formatted text
  const handleCopyWhatsAppText = (slip: SlipKekuranganBerkas) => {
    const pendingList = slip.items.filter((item) => item.status === 'kurang');

    const msg = `*PEMBERITAHUAN KEKURANGAN BERKAS PENDAFTARAN*\n*RSU MUHAMMADIYAH BABAT*\n----------------------------------------\n` +
      `Yth. Bpk/Ibu Keluarga Pasien:\n` +
      `• *Nama Pasien:* ${slip.namaPasien}\n` +
      `• *No. Rekam Medis (RM):* ${slip.noRm}\n` +
      `• *Penjamin:* ${slip.penjaminLabel}\n` +
      `• *Layanan:* ${slip.poliklinikRuang}\n\n` +
      `Bersama ini kami informasikan terdapat berkas persyaratan yang *BELUM LENGKAP / MENYUSUL*:\n` +
      pendingList.map((item, idx) => `${idx + 1}. *${item.docName}*${item.note ? ` _(Catatan: ${item.note})_` : ''}`).join('\n') +
      `\n\n⏰ *BATAS WAKTU PENYERAHAN:*\n👉 *${slip.batasWaktuTeks}*\n\n` +
      `📍 *Lokasi Penyerahan:*\nLoket Pendaftaran & Admisi RSU Muhammadiyah Babat (Jl. KH. Ahmad Dahlan No. 14 Babat - Lamongan).\n\n` +
      `⚠️ *Penting:* Mohon menyerahkan berkas tepat waktu agar proses klaim penjaminan dapat disetujui.\n\n` +
      `Terima kasih atas kerja samanya.\n_Unit Pendaftaran & Admisi RSUMB_\n_Hotline Admisi: (0322) 451125_`;

    navigator.clipboard.writeText(msg);
    showToast?.('Pesan format WhatsApp berhasil disalin ke clipboard!', 'success');
  };

  // Update status slip di history
  const handleUpdateSlipStatus = (slipId: string, status: 'menunggu' | 'lengkap' | 'batal') => {
    const updated = historySlips.map((s) => {
      if (s.id === slipId) {
        return {
          ...s,
          statusPengurusan: status,
          selesaiPada: status === 'lengkap' ? new Date().toISOString() : s.selesaiPada,
          petugasPenerima: status === 'lengkap' ? effectiveStaff.name : s.petugasPenerima
        };
      }
      return s;
    });
    savePendingRequirementSlips(updated);
    setHistorySlips(updated);
    showToast?.(`Status slip berhasil diperbarui menjadi ${status.toUpperCase()}!`, 'success');
  };

  const handleDeleteSlip = (slipId: string) => {
    if (confirm('Yakin ingin menghapus catatan slip kekurangan berkas ini?')) {
      const updated = historySlips.filter((s) => s.id !== slipId);
      savePendingRequirementSlips(updated);
      setHistorySlips(updated);
      showToast?.('Slip berhasil dihapus dari riwayat.', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#005d42] via-[#004732] to-slate-900 rounded-3xl text-white shadow-lg border border-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Standar Akreditasi & Verifikasi Loket Admisi RSUMB</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Persyaratan Pendaftaran & Checklist Berkas</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Panduan kelengkapan berkas penjaminan pasien (BPJS, Umum, Asuransi Swasta, & Jasa Raharja Laka Lantas) serta pencetakan slip pengingat kekurangan berkas format printer thermal 80mm.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveSubTab('checklist')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeSubTab === 'checklist'
                  ? 'bg-white text-[#005d42] shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Checklist & Cetak Slip</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('guide')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeSubTab === 'guide'
                  ? 'bg-white text-[#005d42] shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Katalog & Regulasi Berkas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${
                activeSubTab === 'history'
                  ? 'bg-white text-[#005d42] shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Riwayat Slip ({historySlips.filter((s) => s.statusPengurusan === 'menunggu').length} Menunggu)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: CHECKLIST & SLIP GENERATOR */}
      {activeSubTab === 'checklist' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sisi Kiri: Form Pasien & Pilihan Penjamin (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Pilih Penjamin */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                1. Pilih Jenis Penjamin Pasien
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGuarantor('bpjs')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    selectedGuarantor === 'bpjs'
                      ? 'bg-emerald-50/80 border-[#005d42] ring-2 ring-[#005d42]/20'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedGuarantor === 'bpjs' ? 'bg-[#005d42] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">BPJS Kesehatan / BPJS TK</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">SEP VClaim, SKDP kontrol, rujukan FKTP aktif (90 hari).</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGuarantor('umum_asuransi')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    selectedGuarantor === 'umum_asuransi'
                      ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedGuarantor === 'umum_asuransi' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Pasien Umum / Asuransi Swasta</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">KTP, kartu asuransi, Guarantee Letter (GL), klaim medis.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGuarantor('jasa_raharja')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    selectedGuarantor === 'jasa_raharja'
                      ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-600/20'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedGuarantor === 'jasa_raharja' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Kasus Kecelakaan / Jasa Raharja</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Laporan Polisi (LP) Laka Lantas, kronologi materai, plafon 20jt.</p>
                  </div>
                </button>
              </div>

              {/* Pilihan Jenis Layanan */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Jenis Pelayanan:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedService('rawat_jalan')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                      selectedService === 'rawat_jalan'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    Rawat Jalan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedService('rawat_inap')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                      selectedService === 'rawat_inap'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    Rawat Inap
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedService('igd_darurat')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                      selectedService === 'igd_darurat'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    IGD Darurat
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Form Identitas Pasien untuk Slip */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Data Pasien untuk Lembar Slip
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Format 80mm</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nama Pasien: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaPasien}
                    onChange={(e) => setNamaPasien(e.target.value)}
                    placeholder="Contoh: Ny. Siti Fatimah"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">No. RM:</label>
                    <input
                      type="text"
                      value={noRm}
                      onChange={(e) => setNoRm(e.target.value)}
                      placeholder="01-23-45"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">No. Telp/WA Pasien:</label>
                    <input
                      type="text"
                      value={noHpPasien}
                      onChange={(e) => setNoHpPasien(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Poliklinik / Ruang Perawatan:</label>
                  <input
                    type="text"
                    value={poliklinikRuang}
                    onChange={(e) => setPoliklinikRuang(e.target.value)}
                    placeholder="Contoh: Poli Penyakit Dalam / Ruang Mina 3"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Batas Waktu Pengurusan Berkas:</span>
                    <button
                      type="button"
                      onClick={() => setBatasWaktuTeks(calculateDefaultDeadline(selectedGuarantor))}
                      className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                    >
                      Reset Waktu
                    </button>
                  </label>
                  <input
                    type="text"
                    value={batasWaktuTeks}
                    onChange={(e) => setBatasWaktuTeks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Catatan Khusus (Opsional):</label>
                  <textarea
                    value={catatanKhusus}
                    onChange={(e) => setCatatanKhusus(e.target.value)}
                    placeholder="Contoh: Surat rujukan tertinggal di rumah, keluarga berjanji menyusulkan besok pagi."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Daftar Checklist Berkas & Action Card (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <span>Daftar Periksa Persyaratan Berkas</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {filteredRequirements.length} Berkas
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centang berkas yang <strong>LENGKAP</strong> atau tandai <strong>BELUM LENGKAP</strong> untuk dicetak ke slip pengingat.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('lengkap')}
                    className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition cursor-pointer"
                  >
                    Semua Lengkap
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('kurang')}
                    className="px-2.5 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition cursor-pointer"
                  >
                    Semua Kurang
                  </button>
                </div>
              </div>

              {/* Requirement Items List */}
              <div className="space-y-3">
                {filteredRequirements.map((req, idx) => {
                  const itemState = checklistItems[req.id] || { status: 'lengkap', note: '' };
                  const isKurang = itemState.status === 'kurang';

                  return (
                    <div
                      key={req.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isKurang
                          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleDocStatus(req.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition ${
                              isKurang
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-[#005d42] text-white shadow-xs'
                            }`}
                            title="Klik untuk ubah status kelengkapan berkas"
                          >
                            {isKurang ? <X className="w-4 h-4 stroke-[3]" /> : <Check className="w-4 h-4 stroke-[3]" />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                                {idx + 1}. {req.name}
                              </h4>
                              {req.isMandatory && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                                  Wajib
                                </span>
                              )}
                              {req.validityPeriod && (
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  Masa: {req.validityPeriod}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {req.description}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleDocStatus(req.id)}
                          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-extrabold transition cursor-pointer border ${
                            isKurang
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isKurang ? '✗ BELUM ADA' : '✓ LENGKAP'}
                        </button>
                      </div>

                      {/* Note Input if Kurang */}
                      {isKurang && (
                        <div className="mt-3 pt-2.5 border-t border-rose-200/80 flex items-center gap-2">
                          <label className="text-[11px] font-bold text-rose-900 shrink-0">
                            Catatan Khusus Kekurangan:
                          </label>
                          <input
                            type="text"
                            value={itemState.note}
                            onChange={(e) => handleDocNoteChange(req.id, e.target.value)}
                            placeholder="Contoh: Rujukan habis, menunggu LP dari kepolisian..."
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-rose-300 rounded-lg focus:ring-1 focus:ring-rose-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Ringkasan & Action Generator Bar */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Ringkasan Verifikasi:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30">
                      {completedDocs.length} Lengkap
                    </span>
                    {pendingDocs.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-400/30 animate-pulse">
                        {pendingDocs.length} Belum Lengkap
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs">
                        Semua Dokumen Ada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {pendingDocs.length > 0
                      ? `Terdapat ${pendingDocs.length} dokumen yang harus disusulkan pasien. Cetak slip kekurangan berkas untuk pengingat resmi.`
                      : 'Seluruh persyaratan pasien telah lengkap terverifikasi. Tidak perlu cetak lembar kekurangan.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleGenerateAndPrintSlip}
                    disabled={pendingDocs.length === 0}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Slip Kekurangan (80mm)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: KATALOG & REGULASI PANDUAN BERKAS */}
      {activeSubTab === 'guide' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Guide Card 1: BPJS Kesehatan */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#005d42] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5 text-[#005d42]" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Regulasi BPJS Kesehatan
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Masa Berlaku Rujukan FKTP:</strong> 90 hari kalender sejak tanggal terbit dari Puskesmas/Klinik Pratama.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Surat Kontrol (SKDP):</strong> Berlaku maksimal 30 hari. Pasien wajib membawa lembar SKDP asli saat kunjungan ulang.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Batas Lapor Rawat Inap:</strong> Maksimal 3 x 24 jam hari kerja sejak pasien masuk opname di RSUMB.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Fingerprint Biometrik:</strong> Wajib dilakukan di mesin antrean / loket admisi untuk validasi SEP VClaim.</span>
                </li>
              </ul>
            </div>

            {/* Guide Card 2: Umum & Asuransi Swasta */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5 text-blue-700" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Umum &amp; Asuransi Swasta
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Guarantee Letter (GL):</strong> Penjaminan rawat inap memerlukan Surat Jaminan Awal dari pihak asuransi rekanan.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Klaim Reimbursement:</strong> Formulir klaim asuransi harus dimintakan tanda tangan &amp; stempel DPJP sebelum KRS.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Pasien Korporasi/Perusahaan:</strong> Wajib melampirkan Surat Pengantar / ID Card karyawan perusahaan mitra.</span>
                </li>
              </ul>
            </div>

            {/* Guide Card 3: Jasa Raharja & Kecelakaan Lalu Lintas */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Kasus Kecelakaan (Jasa Raharja)
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>Laporan Polisi (LP):</strong> Diterbitkan oleh Unit Laka Satlantas Polsek/Polres. Batas pengurusan maksimal 2 x 24 jam.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>Plafon Pengobatan:</strong> Maksimal penjaminan PT Jasa Raharja sebesar Rp 20.000.000 (Dua Puluh Juta Rupiah).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>Kecelakaan Tunggal:</strong> Dijamin oleh BPJS Kesehatan jika memiliki rujukan/keterangan polisi kecelakaan tunggal.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>Penjamin Kedua:</strong> Jika biaya melebihi Rp 20 juta, sisa selisih biaya dapat dialihkan ke BPJS Kesehatan.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RIWAYAT SLIP KEKURANGAN BERKAS */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span>Riwayat Slip Pengurusan Berkas Pasien</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {historySlips.length} Data
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau pasien yang masih memiliki kewajiban menyerahkan berkas menyusul ke loket pendaftaran RSUMB.
              </p>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari No RM / Nama Pasien..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none w-48 sm:w-56"
                />
              </div>

              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="menunggu">Menunggu Berkas</option>
                <option value="lengkap">Sudah Lengkap</option>
              </select>
            </div>
          </div>

          {/* Table / List */}
          {historySlips.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada riwayat slip kekurangan berkas yang dicetak.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">No. Slip / Tanggal</th>
                    <th className="py-3 px-3">Data Pasien</th>
                    <th className="py-3 px-3">Penjamin &amp; Tujuan</th>
                    <th className="py-3 px-3">Berkas yang Kurang</th>
                    <th className="py-3 px-3">Batas Waktu</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historySlips
                    .filter((slip) => {
                      if (historyFilterStatus !== 'all' && slip.statusPengurusan !== historyFilterStatus) return false;
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return slip.namaPasien.toLowerCase().includes(q) || slip.noRm.toLowerCase().includes(q) || slip.nomorSlip.toLowerCase().includes(q);
                    })
                    .map((slip) => {
                      const pendingItems = slip.items.filter((i) => i.status === 'kurang');
                      return (
                        <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono">
                            <span className="font-bold text-slate-900 block">{slip.nomorSlip}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(slip.tanggal).toLocaleDateString('id-ID')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-extrabold text-slate-900 block">{slip.namaPasien}</span>
                            <span className="text-[11px] font-mono text-slate-500">RM: {slip.noRm}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 block">{slip.penjaminLabel}</span>
                            <span className="text-[10.5px] text-slate-500">{slip.poliklinikRuang}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              {pendingItems.map((item, idx) => (
                                <span key={idx} className="block text-[11px] text-rose-700 font-medium">
                                  • {item.docName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium text-slate-700 block max-w-xs leading-tight">
                              {slip.batasWaktuTeks}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {slip.statusPengurusan === 'lengkap' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>SUDAH LENGKAP</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>MENUNGGU</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleExecutePrintThermal(slip)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Cetak Ulang Slip Thermal 80mm"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyWhatsAppText(slip)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Salin Format WhatsApp"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>

                              {slip.statusPengurusan === 'menunggu' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSlipStatus(slip.id, 'lengkap')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Tandai berkas telah diserahkan lengkap"
                                >
                                  Tandai Lengkap
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteSlip(slip.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Slip"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL PREVIEW & CETAK SLIP THERMAL 80MM */}
      {printModalOpen && activeSlipForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#005d42] to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-300" />
                <h3 className="font-extrabold text-sm text-white">
                  Pratinjau Slip Kekurangan Berkas (Thermal 80mm)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Paper Preview */}
            <div className="p-5 overflow-y-auto bg-slate-100/70 flex justify-center">
              <div className="w-[300px] bg-white p-4 shadow-md border border-slate-300 rounded-sm font-mono text-[11px] text-black leading-tight select-none">
                <div className="text-center mb-2">
                  <div className="font-bold text-xs">RSU MUHAMMADIYAH BABAT</div>
                  <div className="text-[9px]">Jl. KH. Ahmad Dahlan No. 14 Babat</div>
                  <div className="text-[9px]">Telp: (0322) 451125</div>
                </div>

                <div className="border-t-2 border-dashed border-black my-1.5" />

                <div className="text-center font-bold text-[11px] border border-black py-1 my-1">
                  SLIP KEKURANGAN BERKAS
                </div>

                <div className="space-y-0.5 text-[10px] my-2">
                  <div>No. Slip : <strong>{activeSlipForPrint.nomorSlip}</strong></div>
                  <div>Tanggal  : {new Date(activeSlipForPrint.tanggal).toLocaleDateString('id-ID')}</div>
                  <div>No. RM   : <strong>{activeSlipForPrint.noRm}</strong></div>
                  <div>Pasien   : <strong>{activeSlipForPrint.namaPasien}</strong></div>
                  <div>Penjamin : {activeSlipForPrint.penjaminLabel}</div>
                  <div>Tujuan   : {activeSlipForPrint.poliklinikRuang}</div>
                </div>

                <div className="border-t border-dashed border-black my-1.5" />

                <div className="font-bold text-[10.5px] uppercase my-1">
                  BERKAS BELUM LENGKAP:
                </div>

                <div className="space-y-1 text-[10px]">
                  {activeSlipForPrint.items
                    .filter((i) => i.status === 'kurang')
                    .map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 border border-black shrink-0 mt-0.5" />
                        <div>
                          <strong>{item.docName}</strong>
                          {item.note && <div className="italic text-[9px] text-slate-700">Catatan: {item.note}</div>}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="border border-black p-1.5 my-2.5 text-center text-[9.5px]">
                  <div className="font-bold uppercase">BATAS WAKTU PENYERAHAN</div>
                  <div className="font-bold">{activeSlipForPrint.batasWaktuTeks}</div>
                </div>

                <div className="text-[8.5px] text-justify leading-tight my-2">
                  * Serahkan lembar ini beserta berkas fisik kekurangan ke Loket Admisi RSUMB sebelum batas waktu di atas.
                </div>

                <div className="border-t border-dashed border-black my-2" />

                <div className="grid grid-cols-2 text-center text-[9px] mt-2">
                  <div>
                    <div>Petugas Admisi,</div>
                    <div className="h-8" />
                    <div>( {activeSlipForPrint.petugasAdmisi} )</div>
                  </div>
                  <div>
                    <div>Keluarga Pasien,</div>
                    <div className="h-8" />
                    <div>( .................... )</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleCopyWhatsAppText(activeSlipForPrint)}
                className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Salin Pesan WhatsApp</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleExecutePrintThermal(activeSlipForPrint)}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Struk Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
