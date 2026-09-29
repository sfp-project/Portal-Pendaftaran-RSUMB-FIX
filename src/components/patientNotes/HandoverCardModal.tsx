import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  AlertTriangle,
  Car,
  ShieldAlert,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  Tag,
  Building2,
  Calendar,
  User,
  Hash,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import {
  PatientNotesTab,
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord
} from '../../types/patientNotesTypes';

export type HandoverCardData =
  | { tab: 'kll'; record: PatientKllRecord }
  | { tab: 'bpjs_kendala'; record: PatientBpjsKendalaRecord }
  | { tab: 'asuransi_swasta'; record: PatientAsuransiSwastaRecord }
  | { tab: 'umum_beresiko'; record: PatientUmumBeresikoRecord };

interface HandoverCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: HandoverCardData | null;
  onViewLpFile?: (record: PatientKllRecord) => void;
}

export const HandoverCardModal: React.FC<HandoverCardModalProps> = ({
  isOpen,
  onClose,
  data,
  onViewLpFile
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const { tab, record } = data;

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(d);
      }
    } catch {
      // fallback to raw string
    }
    return dateStr;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(d) + ' WIB';
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Determine Dynamic Status Badge
  const getStatusBadge = () => {
    if (tab === 'kll') {
      const kll = record as PatientKllRecord;
      if (kll.isInsidenActive) {
        return {
          type: 'high_risk',
          label: '🔴 HIGH RISK',
          subLabel: 'Insiden Aktif',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-300',
          dotClass: 'bg-rose-500'
        };
      }
      const hasLp = kll.statusLp && !kll.statusLp.toUpperCase().includes('BELUM');
      if (hasLp) {
        return {
          type: 'resolved',
          label: '🟢 RESOLVED (CETAK SEP)',
          subLabel: 'LP Terbit',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-300',
          dotClass: 'bg-emerald-500'
        };
      }
      return {
        type: 'pending',
        label: '🟡 PENDING',
        subLabel: 'Menunggu Berkas LP',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300',
        dotClass: 'bg-amber-500'
      };
    }

    if (tab === 'bpjs_kendala') {
      const bpjs = record as PatientBpjsKendalaRecord;
      if (bpjs.status === 'Resolved (cetak SEP)' || bpjs.status === 'Resolved') {
        return {
          type: 'resolved',
          label: '🟢 RESOLVED (CETAK SEP)',
          subLabel: 'SEP Berhasil Dicetak',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-300',
          dotClass: 'bg-emerald-500'
        };
      }
      if (bpjs.jenisKendala === 'SEP Blocked' || bpjs.jenisKendala === 'Denda Pelayanan') {
        return {
          type: 'high_risk',
          label: '🔴 HIGH RISK',
          subLabel: 'Kendala Kritis BPJS',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-300',
          dotClass: 'bg-rose-500'
        };
      }
      return {
        type: 'pending',
        label: '🟡 PENDING',
        subLabel: 'Menunggu Penyelesaian',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300',
        dotClass: 'bg-amber-500'
      };
    }

    if (tab === 'asuransi_swasta') {
      const asuransi = record as PatientAsuransiSwastaRecord;
      if (asuransi.statusKlaim === 'Disetujui / Selesai') {
        return {
          type: 'resolved',
          label: '🟢 RESOLVED',
          subLabel: 'GL Disetujui',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-300',
          dotClass: 'bg-emerald-500'
        };
      }
      if (
        asuransi.statusKlaim.includes('Excess') ||
        asuransi.statusKlaim.includes('Off-Hours')
      ) {
        return {
          type: 'high_risk',
          label: '🔴 HIGH RISK',
          subLabel: asuransi.statusKlaim,
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-300',
          dotClass: 'bg-rose-500'
        };
      }
      return {
        type: 'pending',
        label: '🟡 PENDING',
        subLabel: 'Menunggu GL / Dokumen',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300',
        dotClass: 'bg-amber-500'
      };
    }

    // tab === 'umum_beresiko'
    const umum = record as PatientUmumBeresikoRecord;
    const highRiskTerms = ['Risiko APS/Kabur', 'Komplain Pelayanan', 'Biaya Operasi/Ranap Tinggi', 'Pasien/Keluarga Vokal'];
    const isHigh = umum.potensiMasalah?.some((p) => highRiskTerms.some((t) => p.includes(t)));
    if (isHigh) {
      return {
        type: 'high_risk',
        label: '🔴 HIGH RISK',
        subLabel: 'Potensi Masalah Kritis',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-300',
        dotClass: 'bg-rose-500'
      };
    }
    return {
      type: 'pending',
      label: '🟡 PENDING',
      subLabel: 'Perlu Monitoring Admisi',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300',
      dotClass: 'bg-amber-500'
    };
  };

  const statusInfo = getStatusBadge();

  // Tab details helper
  const getTabCategoryInfo = () => {
    switch (tab) {
      case 'kll':
        return {
          title: 'KLL & JASA RAHARJA',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          icon: <Car className="w-3.5 h-3.5 text-blue-600" />
        };
      case 'bpjs_kendala':
        return {
          title: 'BPJS KENDALA',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
        };
      case 'asuransi_swasta':
        return {
          title: 'ASURANSI SWASTA',
          color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          icon: <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
        };
      case 'umum_beresiko':
        return {
          title: 'UMUM BERESIKO',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        };
    }
  };

  const categoryInfo = getTabCategoryInfo();

  // Extract fields based on Tab
  let tanggalMrsKontrol = '-';
  let tanggalKllStr = '';
  let problemStatementTitle = 'Kronologi / Masalah Kasus Pasien';
  let problemStatementBody = '';
  let solutionTitle = 'Catatan Solusi & Tindak Lanjut Admisi';
  let solutionBody = '';
  let hasLpFile = false;
  let lpFileName = '';
  let lpFileUrl = '';

  if (tab === 'kll') {
    const kll = record as PatientKllRecord;
    tanggalMrsKontrol = formatDate(kll.tanggalMrs);
    if (kll.tanggalKll) {
      tanggalKllStr = formatDate(kll.tanggalKll);
    }
    problemStatementTitle = 'Kronologi Kejadian Kecelakaan (TKP & Lawan Tabrakan)';
    problemStatementBody = kll.kronologi || '(Tidak ada kronologi yang dicatat)';
    solutionTitle = 'Catatan Koordinasi Admisi & Jasa Raharja';
    solutionBody = kll.catatan || '(Belum ada catatan solusi khusus)';
    if (kll.lpFileName || kll.lpFileUrl) {
      hasLpFile = true;
      lpFileName = kll.lpFileName || 'Surat Laporan Polisi';
      lpFileUrl = kll.lpFileUrl || '';
    }
  } else if (tab === 'bpjs_kendala') {
    const bpjs = record as PatientBpjsKendalaRecord;
    tanggalMrsKontrol = formatDate(bpjs.tanggalMrsKontrol || bpjs.createdAt);
    problemStatementTitle = 'Detail Kendala Kepesertaan / Bridging SEP';
    problemStatementBody = bpjs.detailMasalah || '(Tidak ada rincian kendala)';
    solutionTitle = 'Catatan Solusi & Tindak Lanjut Admisi';
    solutionBody = bpjs.catatanSolusi || '(Belum ada catatan solusi)';
  } else if (tab === 'asuransi_swasta') {
    const asuransi = record as PatientAsuransiSwastaRecord;
    tanggalMrsKontrol = formatDate(asuransi.createdAt);
    problemStatementTitle = 'Status Verifikasi Klaim & Penjaminan';
    problemStatementBody = `Status Klaim: ${asuransi.statusKlaim}. Penjamin: ${asuransi.namaAsuransi}.`;
    solutionTitle = 'Catatan Solusi & Handover Shift Admisi';
    solutionBody = asuransi.catatanHandover || '(Belum ada catatan handover)';
  } else if (tab === 'umum_beresiko') {
    const umum = record as PatientUmumBeresikoRecord;
    tanggalMrsKontrol = formatDate(umum.tanggalMrsKontrol || umum.createdAt);
    problemStatementTitle = 'Kronologi Masalah & Situasi Pasien / Keluarga';
    problemStatementBody = umum.kronologiMasalah || '(Tidak ada catatan kronologi)';
    solutionTitle = 'Tindak Lanjut & Intervensi Petugas Admisi';
    solutionBody = umum.tindakLanjut || '(Belum ada tindak lanjut khusus)';
  }

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Copy Summary text to Clipboard
  const handleCopyCardText = () => {
    let summaryText = `*RSU MUHAMMADIYAH BABAT - KARTU KHUSUS ADMISI*\n`;
    summaryText += `Pasien: ${record.namaPasien} | No. RM: ${record.noRm}\n`;
    summaryText += `Kategori: ${categoryInfo.title} | Status: ${statusInfo.label}\n`;
    summaryText += `Tgl MRS/Kontrol: ${tanggalMrsKontrol}\n`;
    summaryText += `----------------------------------------\n`;
    summaryText += `*${problemStatementTitle}:*\n${problemStatementBody}\n`;
    summaryText += `----------------------------------------\n`;
    summaryText += `*${solutionTitle}:*\n${solutionBody}\n`;
    summaryText += `Waktu Catat: ${formatDateTime(record.createdAt)}\n`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      {/* Interactive Modal Screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-auto transition-all animate-in zoom-in-95 duration-150">
          {/* HEADER: Hospital Title & Dynamic Status Badge */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-black text-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h3 className="font-extrabold text-xs sm:text-sm tracking-wide text-white flex items-center gap-1.5 truncate">
                  <span>RSU MUHAMMADIYAH BABAT</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span className="text-emerald-300 font-bold">KARTU KHUSUS ADMISI</span>
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  Lembar Serah Terima Kasus & Handover Antar Shift
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border flex items-center gap-1.5 shadow-xs ${statusInfo.badgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full animate-pulse ${statusInfo.dotClass}`} />
                <span>{statusInfo.label}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CARD BODY */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar bg-slate-50/40">
            {/* ROW 1: Patient Demographics */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {record.namaPasien}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-xs tracking-wider">
                    RM: {record.noRm}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tgl MRS / Kontrol: <strong className="text-slate-700">{tanggalMrsKontrol}</strong></span>
                  </span>
                  {tanggalKllStr && (
                    <span className="text-[11px] text-slate-400">
                      (Tgl KLL: <strong className="text-slate-600">{tanggalKllStr}</strong>)
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-tab Category Pill */}
              <div className="self-start sm:self-center">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${categoryInfo.color}`}
                >
                  {categoryInfo.icon}
                  <span>{categoryInfo.title}</span>
                </span>
              </div>
            </div>

            {/* ROW 2: Kronologi / Problem Statement */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{problemStatementTitle}</span>
                </h5>
                <span className="text-[10px] text-slate-400 font-medium">Problem Statement</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/70 text-xs sm:text-[13px] text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                {problemStatementBody}
              </div>
            </div>

            {/* ROW 3: Tags & Identifiers Badges */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Penjamin, Status & Label Kasus:</span>
              </h5>

              <div className="flex flex-wrap gap-1.5">
                {/* TAB 1: KLL Tags */}
                {tab === 'kll' && (
                  <>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      Penjamin: {(record as PatientKllRecord).penjamin}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        (record as PatientKllRecord).statusLp?.toUpperCase().includes('BELUM')
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      Status LP: {(record as PatientKllRecord).statusLp || 'BELUM'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        (record as PatientKllRecord).isInsidenActive
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      Insiden: {(record as PatientKllRecord).isInsidenActive ? 'Insiden Aktif' : 'Non-Aktif'}
                    </span>
                    {hasLpFile && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Surat LP Terlampir</span>
                      </span>
                    )}
                  </>
                )}

                {/* TAB 2: BPJS Kendala Tags */}
                {tab === 'bpjs_kendala' && (
                  <>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Penjamin: BPJS Kesehatan
                    </span>
                    {(record as PatientBpjsKendalaRecord).noKartuBpjs && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        No. Kartu: {(record as PatientBpjsKendalaRecord).noKartuBpjs}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      Kendala: {(record as PatientBpjsKendalaRecord).jenisKendala}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        (record as PatientBpjsKendalaRecord).status === 'Resolved (cetak SEP)' ||
                        (record as PatientBpjsKendalaRecord).status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      Status: {(record as PatientBpjsKendalaRecord).status}
                    </span>
                  </>
                )}

                {/* TAB 3: Asuransi Swasta Tags */}
                {tab === 'asuransi_swasta' && (
                  <>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      Asuransi: {(record as PatientAsuransiSwastaRecord).namaAsuransi}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        (record as PatientAsuransiSwastaRecord).statusKlaim === 'Disetujui / Selesai'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      Status Klaim: {(record as PatientAsuransiSwastaRecord).statusKlaim}
                    </span>
                  </>
                )}

                {/* TAB 4: UMUM Beresiko Tags */}
                {tab === 'umum_beresiko' && (
                  <>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                      Penjamin: Pasien UMUM (Pribadi)
                    </span>
                    {(record as PatientUmumBeresikoRecord).potensiMasalah &&
                    (record as PatientUmumBeresikoRecord).potensiMasalah.length > 0 ? (
                      (record as PatientUmumBeresikoRecord).potensiMasalah.map((potensi, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                        >
                          ⚠️ {potensi}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Tidak ada label potensi masalah</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ROW 4: Solusi & Catatan Handover */}
            <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/40 p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{solutionTitle}</span>
                </h5>
                <span className="text-[10px] text-emerald-700 font-semibold">Tindak Lanjut Admisi</span>
              </div>
              <div className="p-3 bg-white/90 rounded-lg border border-emerald-200/80 text-xs sm:text-[13px] text-slate-800 leading-relaxed font-semibold whitespace-pre-wrap">
                {solutionBody}
              </div>
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>Dibuat: {formatDateTime(record.createdAt)}</span>
                {record.updatedAt && (
                  <span>Diperbarui: {formatDateTime(record.updatedAt)}</span>
                )}
              </div>
            </div>
          </div>

          {/* CARD FOOTER & ACTIONS */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {/* Button [ 📄 Lihat Berkas Upload ] (Visible if LP file exists) */}
              {hasLpFile && tab === 'kll' && (
                <button
                  type="button"
                  onClick={() => {
                    if (onViewLpFile) {
                      onViewLpFile(record as PatientKllRecord);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Buka Berkas Surat Laporan Polisi"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lihat Berkas Upload</span>
                </button>
              )}

              {/* Copy quick text button */}
              <button
                type="button"
                onClick={handleCopyCardText}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Salin Rangkuman Handover"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Info</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Button [ 🖨️ Cetak Kartu ] */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Cetak Kartu Handover (Slip Thermal / A5)"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cetak Kartu</span>
              </button>

              {/* Button [ Tutup ] */}
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY CONTAINER: Clean A5 / Slip Card Printable Document */}
      <div className="print-handover-card-container text-black bg-white">
        <div className="border border-black p-4 max-w-lg mx-auto rounded-lg text-[9pt] leading-tight space-y-3 font-sans">
          {/* Letterhead Header */}
          <div className="border-b-2 border-black pb-2 text-center">
            <h2 className="text-xs font-black uppercase tracking-wider">
              RSU MUHAMMADIYAH BABAT
            </h2>
            <p className="text-[7.5pt] text-gray-700">
              Jl. Raya Babat - Bojonegoro No. 123, Babat, Lamongan | Telp. (0322) 451123
            </p>
            <h3 className="text-[9pt] font-black uppercase tracking-wider mt-1 underline decoration-black">
              KARTU KHUSUS ADMISI & HANDOVER PASIEN
            </h3>
          </div>

          {/* Top Status & Timestamp */}
          <div className="flex justify-between items-center text-[8pt] bg-gray-100 p-1.5 border border-gray-300 font-bold">
            <span>KATEGORI: {categoryInfo.title}</span>
            <span className="font-mono">STATUS: {statusInfo.label}</span>
          </div>

          {/* Row 1: Demographics Grid */}
          <table className="w-full border-collapse border border-black text-[8pt]">
            <tbody>
              <tr>
                <td className="w-28 p-1 font-bold bg-gray-50 border border-black">Nama Pasien</td>
                <td className="p-1 font-bold border border-black text-[9pt]">{record.namaPasien}</td>
                <td className="w-20 p-1 font-bold bg-gray-50 border border-black">No. RM</td>
                <td className="w-24 p-1 font-mono font-bold border border-black text-[9pt] text-center">{record.noRm}</td>
              </tr>
              <tr>
                <td className="p-1 font-bold bg-gray-50 border border-black">Tgl MRS / Kontrol</td>
                <td className="p-1 border border-black font-semibold">
                  {tanggalMrsKontrol} {tanggalKllStr ? `(Tgl KLL: ${tanggalKllStr})` : ''}
                </td>
                <td className="p-1 font-bold bg-gray-50 border border-black">Penjamin</td>
                <td className="p-1 border border-black font-bold text-center">
                  {tab === 'kll'
                    ? (record as PatientKllRecord).penjamin
                    : tab === 'bpjs_kendala'
                    ? 'BPJS Kes'
                    : tab === 'asuransi_swasta'
                    ? (record as PatientAsuransiSwastaRecord).namaAsuransi
                    : 'UMUM'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Row 2: Kronologi / Problem Statement */}
          <div className="border border-black p-2 bg-white">
            <p className="font-bold text-[8pt] uppercase underline mb-1">
              {problemStatementTitle}:
            </p>
            <p className="text-[8pt] whitespace-pre-wrap">{problemStatementBody}</p>
          </div>

          {/* Row 3: Tags / Additional Identifiers */}
          <div className="border border-black p-2 bg-gray-50 text-[7.5pt]">
            <span className="font-bold">DETAIL IDENTIFIKASI & LABEL: </span>
            {tab === 'kll' && (
              <span>
                Status LP: {(record as PatientKllRecord).statusLp || 'BELUM'} |
                Insiden: {(record as PatientKllRecord).isInsidenActive ? 'AKTIF' : 'NON-AKTIF'}
                {hasLpFile ? ' | Berkas LP Terunggah' : ''}
              </span>
            )}
            {tab === 'bpjs_kendala' && (
              <span>
                Kendala: {(record as PatientBpjsKendalaRecord).jenisKendala} |
                No. BPJS: {(record as PatientBpjsKendalaRecord).noKartuBpjs || '-'} |
                Status: {(record as PatientBpjsKendalaRecord).status}
              </span>
            )}
            {tab === 'asuransi_swasta' && (
              <span>
                Asuransi: {(record as PatientAsuransiSwastaRecord).namaAsuransi} |
                Status Klaim: {(record as PatientAsuransiSwastaRecord).statusKlaim}
              </span>
            )}
            {tab === 'umum_beresiko' && (
              <span>
                Potensi Masalah: {(record as PatientUmumBeresikoRecord).potensiMasalah?.join(', ') || '-'}
              </span>
            )}
          </div>

          {/* Row 4: Solusi & Tindak Lanjut Admisi */}
          <div className="border-2 border-black p-2 bg-white">
            <p className="font-bold text-[8pt] uppercase underline mb-1">
              {solutionTitle}:
            </p>
            <p className="text-[8pt] font-semibold whitespace-pre-wrap">{solutionBody}</p>
          </div>

          {/* Footer & Signature lines */}
          <div className="pt-2 text-[7.5pt]">
            <div className="flex justify-between items-end">
              <div className="text-center w-36">
                <p>Petugas Shift Sebelumnya</p>
                <div className="h-10"></div>
                <p className="border-t border-black pt-0.5 font-bold">(................................)</p>
              </div>
              <div className="text-center text-[7pt] text-gray-500">
                <p>Dicetak pada:</p>
                <p className="font-mono">{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</p>
              </div>
              <div className="text-center w-36">
                <p>Petugas Penerima Handover</p>
                <div className="h-10"></div>
                <p className="border-t border-black pt-0.5 font-bold">(................................)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
