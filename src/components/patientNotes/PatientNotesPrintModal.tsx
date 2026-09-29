import React, { useState } from 'react';
import { Printer, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  PatientNotesTab,
  PatientKllRecord,
  PatientBpjsKendalaRecord,
  PatientAsuransiSwastaRecord,
  PatientUmumBeresikoRecord
} from '../../types/patientNotesTypes';

interface PatientNotesPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubTab: PatientNotesTab;
  kllRecords: PatientKllRecord[];
  bpjsRecords: PatientBpjsKendalaRecord[];
  asuransiRecords: PatientAsuransiSwastaRecord[];
  umumRecords: PatientUmumBeresikoRecord[];
}

export const PatientNotesPrintModal: React.FC<PatientNotesPrintModalProps> = ({
  isOpen,
  onClose,
  activeSubTab,
  kllRecords,
  bpjsRecords,
  asuransiRecords,
  umumRecords
}) => {
  const [printScope, setPrintScope] = useState<'current' | 'all'>('current');

  if (!isOpen) return null;

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const getSubTabTitle = (tab: PatientNotesTab) => {
    switch (tab) {
      case 'kll':
        return 'Pasien Kecelakaan Lalu Lintas (KLL & Jasa Raharja)';
      case 'bpjs_kendala':
        return 'Pasien BPJS Kendala Kepesertaan & Bridging SEP';
      case 'asuransi_swasta':
        return 'Catatan Khusus Pasien Asuransi Swasta & Handover Shift';
      case 'umum_beresiko':
        return 'Early Warning Pasien UMUM Beresiko (Biaya, APS & Komplain)';
      default:
        return 'Catatan Khusus Pasien';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Interactive Modal Screen for Configuration & Preview */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Cetak Rekapitulasi Catatan Khusus Pasien
                </h3>
                <p className="text-xs text-blue-200">
                  Format cetak resmi dokumen admisi siap PDF / Print
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Configuration Toolbar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Pilihan Rekap:</span>
              <div className="inline-flex rounded-xl bg-slate-200/80 p-1">
                <button
                  type="button"
                  onClick={() => setPrintScope('current')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    printScope === 'current'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tab Aktif Saja ({getSubTabTitle(activeSubTab).split('(')[0].trim()})
                </button>
                <button
                  type="button"
                  onClick={() => setPrintScope('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    printScope === 'all'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Kategori (Rekap Lengkap)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF Sekarang</span>
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 max-w-3xl mx-auto text-slate-800 text-xs">
              {/* Kop Surat RSUMB */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
                <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                  RUMAH SAKIT UMUM MUHAMMADIYAH BABAT
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Jl. Raya Babat - Bojonegoro No. 123, Moropelang, Babat, Lamongan, Jawa Timur
                </p>
                <p className="text-[10px] text-slate-500">
                  Telp: (0322) 451123 | Email: rsum.babat@gmail.com | Unit Admisi & Rekam Medis
                </p>
              </div>

              {/* Judul Dokumen */}
              <div className="text-center mb-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 underline decoration-slate-900">
                  REKAPITULASI CATATAN KHUSUS ADMISI & KEPESERTAAN PASIEN
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">
                  {printScope === 'current'
                    ? `Kategori: ${getSubTabTitle(activeSubTab)}`
                    : 'Kategori: Rekap Keseluruhan (KLL, BPJS Kendala, Asuransi Swasta & UMUM Beresiko)'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Dicetak per tanggal: {todayStr} | Status Data Terkini
                </p>
              </div>

              {/* Table Preview */}
              <div className="space-y-6">
                {(printScope === 'all' || activeSubTab === 'kll') && (
                  <div>
                    <div className="font-bold text-xs text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md mb-2 border border-blue-200">
                      1. DAFTAR PASIEN KASUS KECELAKAAN LALU LINTAS (KLL & JASA RAHARJA)
                    </div>
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                          <th className="p-1.5 border border-slate-300 min-w-[110px]">Nama Pasien</th>
                          <th className="p-1.5 border border-slate-300 text-center w-16">No. RM</th>
                          <th className="p-1.5 border border-slate-300 text-center w-20">Tgl MRS</th>
                          <th className="p-1.5 border border-slate-300 text-center w-20">Tgl KLL</th>
                          <th className="p-1.5 border border-slate-300 min-w-[130px]">Kronologi</th>
                          <th className="p-1.5 border border-slate-300 text-center w-24">Penjamin</th>
                          <th className="p-1.5 border border-slate-300">Status LP / Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kllRecords.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-3 text-center text-slate-400 italic">
                              Tidak ada data tercatat.
                            </td>
                          </tr>
                        ) : (
                          kllRecords.map((r, i) => (
                            <tr key={r.id} className="border-b border-slate-200">
                              <td className="p-1.5 border border-slate-300 text-center">{i + 1}</td>
                              <td className="p-1.5 border border-slate-300 font-bold">{r.namaPasien}</td>
                              <td className="p-1.5 border border-slate-300 font-mono text-center">{r.noRm}</td>
                              <td className="p-1.5 border border-slate-300 text-center">{r.tanggalMrs || '-'}</td>
                              <td className="p-1.5 border border-slate-300 text-center">{r.tanggalKll || '-'}</td>
                              <td className="p-1.5 border border-slate-300">{r.kronologi}</td>
                              <td className="p-1.5 border border-slate-300 text-center font-semibold">{r.penjamin}</td>
                              <td className="p-1.5 border border-slate-300">
                                <div><strong>LP:</strong> {r.statusLp}</div>
                                {r.catatan && <div className="text-slate-600"><em>Note:</em> {r.catatan}</div>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {(printScope === 'all' || activeSubTab === 'bpjs_kendala') && (
                  <div>
                    <div className="font-bold text-xs text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md mb-2 border border-emerald-200">
                      2. DAFTAR KENDALA BPJS KEPESERTAAN & BRIDGING SEP
                    </div>
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                          <th className="p-1.5 border border-slate-300 min-w-[110px]">Nama Pasien</th>
                          <th className="p-1.5 border border-slate-300 text-center w-16">No. RM</th>
                          <th className="p-1.5 border border-slate-300 text-center w-20">Tgl MRS/Kontrol</th>
                          <th className="p-1.5 border border-slate-300 text-center w-24">No. Kartu BPJS</th>
                          <th className="p-1.5 border border-slate-300 min-w-[110px]">Jenis Kendala</th>
                          <th className="p-1.5 border border-slate-300">Detail Masalah & Solusi</th>
                          <th className="p-1.5 border border-slate-300 text-center w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bpjsRecords.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-3 text-center text-slate-400 italic">
                              Tidak ada data kendala BPJS.
                            </td>
                          </tr>
                        ) : (
                          bpjsRecords.map((r, i) => (
                            <tr key={r.id} className="border-b border-slate-200">
                              <td className="p-1.5 border border-slate-300 text-center">{i + 1}</td>
                              <td className="p-1.5 border border-slate-300 font-bold">{r.namaPasien}</td>
                              <td className="p-1.5 border border-slate-300 font-mono text-center">{r.noRm}</td>
                              <td className="p-1.5 border border-slate-300 text-center">{r.tanggalMrsKontrol || '-'}</td>
                              <td className="p-1.5 border border-slate-300 font-mono text-center">{r.noKartuBpjs}</td>
                              <td className="p-1.5 border border-slate-300 font-semibold">{r.jenisKendala}</td>
                              <td className="p-1.5 border border-slate-300">
                                <div><strong>Masalah:</strong> {r.detailMasalah}</div>
                                {r.catatanSolusi && <div className="text-slate-600"><strong>Solusi:</strong> {r.catatanSolusi}</div>}
                              </td>
                              <td className="p-1.5 border border-slate-300 text-center font-bold">
                                {r.status}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {(printScope === 'all' || activeSubTab === 'asuransi_swasta') && (
                  <div>
                    <div className="font-bold text-xs text-violet-900 bg-violet-50 px-3 py-1.5 rounded-md mb-2 border border-violet-200">
                      3. DAFTAR PASIEN ASURANSI SWASTA & HANDOVER SHIFT
                    </div>
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                          <th className="p-1.5 border border-slate-300 min-w-[120px]">Nama Pasien</th>
                          <th className="p-1.5 border border-slate-300 text-center w-16">No. RM</th>
                          <th className="p-1.5 border border-slate-300 min-w-[130px]">Nama Asuransi</th>
                          <th className="p-1.5 border border-slate-300 min-w-[130px]">Status Klaim</th>
                          <th className="p-1.5 border border-slate-300">Catatan Handover Shift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asuransiRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-3 text-center text-slate-400 italic">
                              Tidak ada data asuransi swasta.
                            </td>
                          </tr>
                        ) : (
                          asuransiRecords.map((r, i) => (
                            <tr key={r.id} className="border-b border-slate-200">
                              <td className="p-1.5 border border-slate-300 text-center">{i + 1}</td>
                              <td className="p-1.5 border border-slate-300 font-bold">{r.namaPasien}</td>
                              <td className="p-1.5 border border-slate-300 font-mono text-center">{r.noRm}</td>
                              <td className="p-1.5 border border-slate-300 font-semibold">{r.namaAsuransi}</td>
                              <td className="p-1.5 border border-slate-300 font-bold">{r.statusKlaim}</td>
                              <td className="p-1.5 border border-slate-300">{r.catatanHandover}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {(printScope === 'all' || activeSubTab === 'umum_beresiko') && (
                  <div>
                    <div className="font-bold text-xs text-amber-900 bg-amber-50 px-3 py-1.5 rounded-md mb-2 border border-amber-200">
                      4. EARLY WARNING PASIEN UMUM BERESIKO (BIAYA, APS, KOMPLAIN & PENDAMPING)
                    </div>
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                          <th className="p-1.5 border border-slate-300 min-w-[110px]">Nama Pasien</th>
                          <th className="p-1.5 border border-slate-300 text-center w-16">No. RM</th>
                          <th className="p-1.5 border border-slate-300 text-center w-20">Tgl MRS/Kontrol</th>
                          <th className="p-1.5 border border-slate-300 min-w-[140px]">Kronologi Masalah</th>
                          <th className="p-1.5 border border-slate-300 min-w-[130px]">Potensi Masalah</th>
                          <th className="p-1.5 border border-slate-300">Tindak Lanjut Admisi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {umumRecords.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-3 text-center text-slate-400 italic">
                              Tidak ada data pasien umum berisiko.
                            </td>
                          </tr>
                        ) : (
                          umumRecords.map((r, i) => (
                            <tr key={r.id} className="border-b border-slate-200">
                              <td className="p-1.5 border border-slate-300 text-center">{i + 1}</td>
                              <td className="p-1.5 border border-slate-300 font-bold">{r.namaPasien}</td>
                              <td className="p-1.5 border border-slate-300 font-mono text-center">{r.noRm}</td>
                              <td className="p-1.5 border border-slate-300 text-center">{r.tanggalMrsKontrol || '-'}</td>
                              <td className="p-1.5 border border-slate-300">{r.kronologiMasalah}</td>
                              <td className="p-1.5 border border-slate-300 font-semibold">
                                {r.potensiMasalah?.join(', ') || '-'}
                              </td>
                              <td className="p-1.5 border border-slate-300">{r.tindakLanjut}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tanda Tangan */}
              <div className="mt-8 pt-4 grid grid-cols-2 text-center text-[10px] text-slate-700">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Supervisor Admisi & Rekam Medis</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline">(...................................................)</p>
                  <p className="text-[9px] text-slate-500">NBM / NIP RSUMB</p>
                </div>
                <div>
                  <p>Babat, {todayStr}</p>
                  <p className="font-semibold">Petugas Admisi Pelaksana</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline">(...................................................)</p>
                  <p className="text-[9px] text-slate-500">Petugas Shift Jaga</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              * Tips: Pilih "Save as PDF" / "Simpan sebagai PDF" pada dialog printer browser.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINT CONTAINER RENDERED ONLY ON PRINT (via .print-patient-notes-container) */}
      <div className="print-patient-notes-container p-6 bg-white text-black font-sans text-[10pt]">
        {/* Kop Surat RSUMB Print */}
        <div className="border-b-2 border-black pb-2 mb-4 text-center">
          <h1 className="text-[14pt] font-extrabold uppercase tracking-wide">
            RUMAH SAKIT UMUM MUHAMMADIYAH BABAT
          </h1>
          <p className="text-[9pt] mt-0.5">
            Jl. Raya Babat - Bojonegoro No. 123, Moropelang, Babat, Lamongan, Jawa Timur
          </p>
          <p className="text-[8pt] text-gray-700">
            Telp: (0322) 451123 | Unit Pelayanan Admisi, Billing & Rekam Medis
          </p>
        </div>

        {/* Header Rekap */}
        <div className="text-center mb-4">
          <h2 className="text-[11pt] font-bold uppercase underline">
            REKAPITULASI CATATAN KHUSUS ADMISI & KEPESERTAAN PASIEN
          </h2>
          <p className="text-[9pt] mt-1">
            {printScope === 'current'
              ? `Kategori: ${getSubTabTitle(activeSubTab)}`
              : 'Kategori: Rekap Keseluruhan (KLL, BPJS Kendala, Asuransi Swasta, UMUM Beresiko)'}
          </p>
          <p className="text-[8pt] text-gray-600">
            Tanggal Cetak: {todayStr}
          </p>
        </div>

        {/* Content Tables */}
        {(printScope === 'all' || activeSubTab === 'kll') && (
          <div className="mb-4">
            <h3 className="font-bold text-[9pt] mb-1 bg-gray-100 p-1 border border-gray-400">
              1. PASIEN KASUS KECELAKAAN LALU LINTAS (KLL)
            </h3>
            <table className="w-full border-collapse border border-black text-[8pt]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-center w-6">No</th>
                  <th className="border border-black p-1 text-left">Nama Pasien</th>
                  <th className="border border-black p-1 text-center w-16">No. RM</th>
                  <th className="border border-black p-1 text-center w-16">Tgl MRS</th>
                  <th className="border border-black p-1 text-center w-16">Tgl KLL</th>
                  <th className="border border-black p-1 text-left">Kronologi</th>
                  <th className="border border-black p-1 text-center w-20">Penjamin</th>
                  <th className="border border-black p-1 text-left">Status LP & Noted</th>
                </tr>
              </thead>
              <tbody>
                {kllRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="border border-black p-1 text-center">{i + 1}</td>
                    <td className="border border-black p-1 font-bold">{r.namaPasien}</td>
                    <td className="border border-black p-1 text-center font-mono">{r.noRm}</td>
                    <td className="border border-black p-1 text-center">{r.tanggalMrs || '-'}</td>
                    <td className="border border-black p-1 text-center">{r.tanggalKll || '-'}</td>
                    <td className="border border-black p-1">{r.kronologi}</td>
                    <td className="border border-black p-1 text-center font-semibold">{r.penjamin}</td>
                    <td className="border border-black p-1">LP: {r.statusLp} {r.catatan ? `| ${r.catatan}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(printScope === 'all' || activeSubTab === 'bpjs_kendala') && (
          <div className="mb-4">
            <h3 className="font-bold text-[9pt] mb-1 bg-gray-100 p-1 border border-gray-400">
              2. KENDALA BPJS KEPESERTAAN & BRIDGING SEP
            </h3>
            <table className="w-full border-collapse border border-black text-[8pt]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-center w-6">No</th>
                  <th className="border border-black p-1 text-left">Nama Pasien</th>
                  <th className="border border-black p-1 text-center w-16">No. RM</th>
                  <th className="border border-black p-1 text-center w-18">Tgl MRS/Kontrol</th>
                  <th className="border border-black p-1 text-center w-24">No. Kartu BPJS</th>
                  <th className="border border-black p-1 text-left">Jenis Kendala</th>
                  <th className="border border-black p-1 text-left">Detail Masalah & Solusi</th>
                  <th className="border border-black p-1 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {bpjsRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="border border-black p-1 text-center">{i + 1}</td>
                    <td className="border border-black p-1 font-bold">{r.namaPasien}</td>
                    <td className="border border-black p-1 text-center font-mono">{r.noRm}</td>
                    <td className="border border-black p-1 text-center">{r.tanggalMrsKontrol || '-'}</td>
                    <td className="border border-black p-1 text-center font-mono">{r.noKartuBpjs}</td>
                    <td className="border border-black p-1 font-semibold">{r.jenisKendala}</td>
                    <td className="border border-black p-1">
                      <div>{r.detailMasalah}</div>
                      {r.catatanSolusi && <div className="italic">Solusi: {r.catatanSolusi}</div>}
                    </td>
                    <td className="border border-black p-1 text-center font-bold">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(printScope === 'all' || activeSubTab === 'asuransi_swasta') && (
          <div className="mb-4">
            <h3 className="font-bold text-[9pt] mb-1 bg-gray-100 p-1 border border-gray-400">
              3. PASIEN ASURANSI SWASTA & HANDOVER SHIFT
            </h3>
            <table className="w-full border-collapse border border-black text-[8pt]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-center w-6">No</th>
                  <th className="border border-black p-1 text-left">Nama Pasien</th>
                  <th className="border border-black p-1 text-center w-16">No. RM</th>
                  <th className="border border-black p-1 text-left">Nama Asuransi</th>
                  <th className="border border-black p-1 text-left">Status Klaim</th>
                  <th className="border border-black p-1 text-left">Catatan Handover</th>
                </tr>
              </thead>
              <tbody>
                {asuransiRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="border border-black p-1 text-center">{i + 1}</td>
                    <td className="border border-black p-1 font-bold">{r.namaPasien}</td>
                    <td className="border border-black p-1 text-center font-mono">{r.noRm}</td>
                    <td className="border border-black p-1 font-semibold">{r.namaAsuransi}</td>
                    <td className="border border-black p-1 font-bold">{r.statusKlaim}</td>
                    <td className="border border-black p-1">{r.catatanHandover}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(printScope === 'all' || activeSubTab === 'umum_beresiko') && (
          <div className="mb-4">
            <h3 className="font-bold text-[9pt] mb-1 bg-gray-100 p-1 border border-gray-400">
              4. EARLY WARNING PASIEN UMUM BERESIKO
            </h3>
            <table className="w-full border-collapse border border-black text-[8pt]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-center w-6">No</th>
                  <th className="border border-black p-1 text-left">Nama Pasien</th>
                  <th className="border border-black p-1 text-center w-16">No. RM</th>
                  <th className="border border-black p-1 text-center w-18">Tgl MRS/Kontrol</th>
                  <th className="border border-black p-1 text-left">Kronologi Kejadian</th>
                  <th className="border border-black p-1 text-left">Potensi Masalah</th>
                  <th className="border border-black p-1 text-left">Tindak Lanjut Admisi</th>
                </tr>
              </thead>
              <tbody>
                {umumRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="border border-black p-1 text-center">{i + 1}</td>
                    <td className="border border-black p-1 font-bold">{r.namaPasien}</td>
                    <td className="border border-black p-1 text-center font-mono">{r.noRm}</td>
                    <td className="border border-black p-1 text-center">{r.tanggalMrsKontrol || '-'}</td>
                    <td className="border border-black p-1">{r.kronologiMasalah}</td>
                    <td className="border border-black p-1 font-semibold">{r.potensiMasalah?.join(', ') || '-'}</td>
                    <td className="border border-black p-1">{r.tindakLanjut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures for Print */}
        <div className="mt-8 grid grid-cols-2 text-center text-[9pt]">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Supervisor Admisi & Rekam Medis</p>
            <div className="h-16"></div>
            <p className="font-bold underline">(...................................................)</p>
          </div>
          <div>
            <p>Babat, {todayStr}</p>
            <p className="font-bold">Petugas Admisi Pelaksana</p>
            <div className="h-16"></div>
            <p className="font-bold underline">(...................................................)</p>
          </div>
        </div>
      </div>
    </>
  );
};
