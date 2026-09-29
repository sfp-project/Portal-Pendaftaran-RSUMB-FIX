import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Stethoscope,
  ShieldCheck,
  Briefcase,
  Building2,
  Plus
} from 'lucide-react';
import {
  MedicalLetterItem,
  LetterCategory,
  LetterType
} from '../../types/letterTypes';
import {
  getLetterTypeLabel,
  getCategoryForType
} from '../../data/letterData';
import { formatIndonesianDate } from '../../utils/letterPdfGenerator';

interface LetterHistoryTableProps {
  letters: MedicalLetterItem[];
  activeCategory: LetterCategory;
  onPreview: (letter: MedicalLetterItem) => void;
  onPrint: (letter: MedicalLetterItem) => void;
  onDownloadPdf: (letter: MedicalLetterItem) => void;
  onEdit: (letter: MedicalLetterItem) => void;
  onDelete: (id: string) => void;
  onOpenCreate: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const LetterHistoryTable: React.FC<LetterHistoryTableProps> = ({
  letters,
  activeCategory,
  onPreview,
  onPrint,
  onDownloadPdf,
  onEdit,
  onDelete,
  onOpenCreate,
  searchTerm,
  setSearchTerm
}) => {
  const [selectedSubFilter, setSelectedSubFilter] = useState<'ALL' | LetterType>('ALL');

  // Filter based on active category, search term, and sub-filter
  const filteredLetters = letters.filter((item) => {
    // Check category
    const itemCat = item.kategori || getCategoryForType(item.jenisSurat);
    if (itemCat !== activeCategory) return false;

    // Check sub filter
    if (selectedSubFilter !== 'ALL' && item.jenisSurat !== selectedSubFilter) {
      return false;
    }

    // Check search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNo = item.nomorSurat.toLowerCase().includes(q);
      const matchNama = item.namaPasien.toLowerCase().includes(q);
      const matchRm = item.noRm?.toLowerCase().includes(q) || false;
      const matchNik = item.nik.toLowerCase().includes(q);
      const matchDokter = item.dokterNama.toLowerCase().includes(q);
      const matchKeperluan = item.keperluan.toLowerCase().includes(q);
      return matchNo || matchNama || matchRm || matchNik || matchDokter || matchKeperluan;
    }

    return true;
  });

  const getCategoryBadge = (cat: LetterCategory) => {
    switch (cat) {
      case 'medis':
        return {
          label: 'Surat Medis',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Stethoscope
        };
      case 'penjaminan':
        return {
          label: 'Penjaminan & Kuasa',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: ShieldCheck
        };
      case 'bpjstk':
        return {
          label: 'BPJS Ketenagakerjaan',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Briefcase
        };
      case 'admisi':
        return {
          label: 'Admisi & Rawat Inap',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: Building2
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden no-print">
      {/* Table Header & Search Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Riwayat Dokumen Terbit
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {filteredLetters.length} Dokumen
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar formulir dan surat resmi yang telah diterbitkan pada kategori ini.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No. Surat, Nama, No. RM, NIK..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
            />
          </div>

          {/* Create Button */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/15 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Baru</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">No. Surat & Tanggal</th>
              <th className="py-3 px-4">Nama Pasien & Rekam Medis</th>
              <th className="py-3 px-4">Jenis Surat / Formulir</th>
              <th className="py-3 px-4">Dokter / Petugas RSUMB</th>
              <th className="py-3 px-4">Keperluan</th>
              <th className="py-3 px-4 text-center">Aksi Dokumen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredLetters.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Belum Ada Dokumen</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm
                        ? `Tidak ada hasil untuk pencarian "${searchTerm}".`
                        : 'Belum ada surat yang diterbitkan dalam kategori ini. Buat surat baru menggunakan tombol di atas.'}
                    </p>
                    <button
                      type="button"
                      onClick={onOpenCreate}
                      className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors"
                    >
                      + Buat Formulir Sekarang
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLetters.map((item) => {
                const catBadge = getCategoryBadge(item.kategori || getCategoryForType(item.jenisSurat));
                const BadgeIcon = catBadge.icon;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/90 transition-colors group"
                  >
                    {/* No. Surat & Tanggal */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {item.nomorSurat}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>Terbit:</span>
                        <span className="font-medium text-slate-700">
                          {formatIndonesianDate(item.tanggalSurat)}
                        </span>
                      </div>
                    </td>

                    {/* Pasien & RM */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">
                        {item.namaPasien}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          {item.noRm || '-'}
                        </span>
                        <span>NIK: {item.nik}</span>
                      </div>
                    </td>

                    {/* Jenis Surat & Kategori */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {getLetterTypeLabel(item.jenisSurat)}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catBadge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{catBadge.label}</span>
                        </span>
                      </div>
                    </td>

                    {/* Dokter / Petugas */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-xs">
                        {item.dokterNama}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                        {item.dokterJabatan || `SIP: ${item.dokterSip}`}
                      </div>
                    </td>

                    {/* Keperluan */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-700 max-w-[200px] truncate" title={item.keperluan}>
                        {item.keperluan || '-'}
                      </div>
                    </td>

                    {/* Aksi Dokumen */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Preview */}
                        <button
                          type="button"
                          onClick={() => onPreview(item)}
                          title="Preview Dokumen"
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => onPrint(item)}
                          title="Cetak A4 Resmi"
                          className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-[#005d42] text-emerald-800 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* PDF Download */}
                        <button
                          type="button"
                          onClick={() => onDownloadPdf(item)}
                          title="Ekspor PDF A4"
                          className="w-7 h-7 rounded-lg bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title="Edit Dokumen"
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus surat ${item.nomorSurat} (${item.namaPasien})?`)) {
                              onDelete(item.id);
                            }
                          }}
                          title="Hapus Dokumen"
                          className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white flex items-center justify-center transition-colors"
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
    </div>
  );
};
