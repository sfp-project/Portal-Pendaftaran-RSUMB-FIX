import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  UserCheck,
  Building2,
  Stethoscope,
  Layers
} from 'lucide-react';
import { MedicalLetterItem, LetterCategory, LetterType } from '../../types/letterTypes';
import { getLetterTypeLabel } from '../../data/letterData';
import { PrintHeaderKop } from '../PrintHeaderKop';
import { PrintSignatureBlock } from '../PrintSignatureBlock';
import { exportToExcel } from '../../utils/exportHelpers';

interface LetterDateRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  letters: MedicalLetterItem[];
  onOpenLetterPreview: (letter: MedicalLetterItem) => void;
}

export const LetterDateRecapModal: React.FC<LetterDateRecapModalProps> = ({
  isOpen,
  onClose,
  letters,
  onOpenLetterPreview
}) => {
  // Mode: 'single' (satu tanggal) atau 'range' (rentang tanggal)
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  // Filter Kategori & Tipe
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filtered Letters
  const filteredLetters = useMemo(() => {
    return letters.filter((letter) => {
      // Date Matching
      const lDate = letter.tanggalSurat;
      let dateMatch = true;
      if (dateMode === 'single') {
        dateMatch = lDate === selectedDate;
      } else {
        dateMatch = (!startDate || lDate >= startDate) && (!endDate || lDate <= endDate);
      }
      if (!dateMatch) return false;

      // Category filter
      if (categoryFilter !== 'all' && letter.kategori !== categoryFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && letter.jenisSurat !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [letters, dateMode, selectedDate, startDate, endDate, categoryFilter, typeFilter]);

  // Statistik Ringkasan Dokumen
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    filteredLetters.forEach((l) => {
      const lbl = getLetterTypeLabel(l.jenisSurat);
      byType[lbl] = (byType[lbl] || 0) + 1;
    });
    return {
      total: filteredLetters.length,
      byType
    };
  }, [filteredLetters]);

  if (!isOpen) return null;

  const handlePrintRecap = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const headers = [
      'No',
      'Tanggal Surat',
      'Nomor Surat',
      'Jenis Dokumen',
      'No. RM',
      'Nama Pasien',
      'NIK',
      'Umur',
      'Jenis Kelamin',
      'Dokter DPJP / Petugas',
      'SIP',
      'Keperluan'
    ];

    const data = filteredLetters.map((l, idx) => [
      idx + 1,
      l.tanggalSurat,
      l.nomorSurat,
      getLetterTypeLabel(l.jenisSurat),
      l.noRm || '-',
      l.namaPasien,
      l.nik,
      `${l.umur} Th`,
      l.jenisKelamin,
      l.dokterNama,
      l.dokterSip || '-',
      l.keperluan || '-'
    ]);

    exportToExcel({
      filename: `Rekap_Dokumen_RSUMB_${dateMode === 'single' ? selectedDate : `${startDate}_sd_${endDate}`}`,
      title: 'REKAPITULASI FORMULIR & SURAT LAYANAN PASIEN RSUMB',
      subtitle: dateLabel,
      totalLabel: `Total: ${filteredLetters.length} Dokumen`,
      headers,
      data
    });
  };

  const dateLabel = dateMode === 'single' 
    ? `Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : `Periode: ${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s.d. ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:h-auto print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Header Modal - Hidden on Print */}
        <div className="bg-[#005d42] text-white p-4 sm:p-5 flex items-center justify-between print:hidden no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Rekap & Cetak Dokumen Pertanggal
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Rekapitulasi Formulir & Surat Layanan Pasien RSU Muhammadiyah Babat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrintRecap}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-[#005d42] hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Printer className="w-4 h-4 text-[#005d42]" />
              <span>Cetak Rekap A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar - Hidden on Print */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 print:hidden no-print shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Pilihan Mode Tanggal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mode Filter Tanggal
              </label>
              <div className="flex bg-slate-200 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDateMode('single')}
                  className={`flex-1 py-1 text-center rounded-md font-semibold transition-colors ${dateMode === 'single' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
                >
                  Satu Tanggal
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('range')}
                  className={`flex-1 py-1 text-center rounded-md font-semibold transition-colors ${dateMode === 'range' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
                >
                  Rentang Tanggal
                </button>
              </div>
            </div>

            {/* Input Tanggal */}
            {dateMode === 'single' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Tanggal Dokumen
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                />
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* Filter Kategori */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Kategori Layanan
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                <option value="all">Semua Kategori (Semua Modul)</option>
                <option value="medis">1. Surat Medis (SKBN, AdMedika, Sehat, Dokter)</option>
                <option value="penjaminan">2. Penjaminan (Edukasi OP2, Kuasa JR)</option>
                <option value="bpjstk">3. BPJS Ketenagakerjaan (KK1, KK2, KK3)</option>
                <option value="admisi">4. Admisi & Rawat Inap (Titip Kelas, Pesan Kamar, Fingerprint)</option>
              </select>
            </div>

            {/* Quick Stats Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-800">Total Ditemukan</p>
                <p className="text-lg font-black text-emerald-950 leading-none mt-0.5">{stats.total} Dokumen</p>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium bg-white px-2 py-1 rounded-md border border-emerald-200">
                {dateLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Printable Sheet View */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-white print:p-0">
          {/* KOP SURAT CETAK RESMI */}
          <PrintHeaderKop
            title="REKAPITULASI FORMULIR & SURAT LAYANAN PASIEN"
            subtitle={dateLabel}
            totalDataCount={filteredLetters.length}
            totalDataLabel={`Total: ${filteredLetters.length} Dokumen Diterbitkan`}
            extraInfo="SIMRS RSU Muhammadiyah Babat"
          />

          {/* Breakdown Ringkasan Jenis Dokumen (Printable Badge Grid) */}
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3 print:bg-white print:border-black/30">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Rincian Jenis Dokumen Terbit:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {Object.keys(stats.byType).length === 0 ? (
                <p className="text-slate-500 italic col-span-4">Tidak ada dokumen pada tanggal terpilih.</p>
              ) : (
                Object.entries(stats.byType).map(([label, count]) => (
                  <div key={label} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-200 print:border-black/20 text-[11px]">
                    <span className="font-medium text-slate-700 truncate pr-2">{label}</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tabel Daftar Dokumen */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg print:border-black print:rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#005d42] text-white print:bg-slate-100 print:text-black font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-2 border border-slate-300 print:border-black text-center w-8">No</th>
                  <th className="py-2.5 px-3 border border-slate-300 print:border-black w-24">Tanggal</th>
                  <th className="py-2.5 px-3 border border-slate-300 print:border-black">Nomor Surat</th>
                  <th className="py-2.5 px-3 border border-slate-300 print:border-black">Jenis Formulir</th>
                  <th className="py-2.5 px-3 border border-slate-300 print:border-black w-20">No. RM</th>
                  <th className="py-2.5 px-3 border border-slate-300 print:border-black">Nama Pasien / NIK</th>
                  <th className="py-2.5 px-3 border border-slate-300 print:border-black">Dokter / Petugas</th>
                  <th className="py-2.5 px-3 border border-slate-300 print:border-black print:hidden text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black">
                {filteredLetters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                      Tidak ditemukan data dokumen pada filter tanggal ini.
                    </td>
                  </tr>
                ) : (
                  filteredLetters.map((letter, idx) => (
                    <tr key={letter.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2 text-center font-bold text-slate-600 border border-slate-200 print:border-black">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 print:border-black font-mono text-[11px]">
                        {letter.tanggalSurat}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 print:border-black font-mono font-bold text-slate-900">
                        {letter.nomorSurat}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 print:border-black font-semibold text-emerald-950">
                        {getLetterTypeLabel(letter.jenisSurat)}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 print:border-black font-mono font-bold text-slate-800">
                        {letter.noRm || '-'}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 print:border-black">
                        <div className="font-bold text-slate-900 uppercase">{letter.namaPasien}</div>
                        <div className="text-[10px] text-slate-500 font-mono">NIK: {letter.nik}</div>
                      </td>
                      <td className="py-2 px-3 border border-slate-200 print:border-black">
                        <div className="font-medium text-slate-800">{letter.dokterNama}</div>
                        <div className="text-[10px] text-slate-500">{letter.dokterJabatan}</div>
                      </td>
                      <td className="py-2 px-3 border border-slate-200 print:border-black print:hidden text-center">
                        <button
                          type="button"
                          onClick={() => onOpenLetterPreview(letter)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px] border border-emerald-300"
                        >
                          Lihat / Cetak
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan Pengesahan Rekapitulasi (Print Only) */}
          <PrintSignatureBlock />
        </div>
      </div>
    </div>
  );
};
