import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Download,
  Trash2,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  Sparkles,
  FileText,
  X,
  Layers,
  Check,
  Cloud,
  ExternalLink
} from 'lucide-react';
import {
  PosterPromoItem,
  KategoriPromo,
  KATEGORI_PROMO_OPTIONS,
  StatusPromoFilter
} from '../../types/posterPromoTypes';
import { isPosterExpired, formatIndoDate } from '../../data/posterPromoData';
import { UploadPosterModal } from './UploadPosterModal';
import { PosterPreviewModal } from './PosterPreviewModal';

interface PosterGalleryViewProps {
  posters: PosterPromoItem[];
  onUploadPoster: (newPoster: PosterPromoItem) => void;
  onDeletePoster: (id: string) => void;
  showToast: (msg: string) => void;
}

export const PosterGalleryView: React.FC<PosterGalleryViewProps> = ({
  posters,
  onUploadPoster,
  onDeletePoster,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusPromoFilter>('ALL');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewPoster, setPreviewPoster] = useState<PosterPromoItem | null>(null);
  const [posterToDelete, setPosterToDelete] = useState<PosterPromoItem | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = posters.length;
    let active = 0;
    let expired = 0;

    posters.forEach((p) => {
      if (isPosterExpired(p.tanggalKadaluarsa)) {
        expired++;
      } else {
        active++;
      }
    });

    return { total, active, expired };
  }, [posters]);

  // Filtered Posters
  const filteredPosters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return posters.filter((p) => {
      // Search filter
      const matchQuery =
        !q ||
        p.judul.toLowerCase().includes(q) ||
        p.kategoriPromo.toLowerCase().includes(q) ||
        p.namaBerkas.toLowerCase().includes(q) ||
        (p.keterangan && p.keterangan.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));

      // Category filter
      const matchKategori = selectedKategori === 'ALL' || p.kategoriPromo === selectedKategori;

      // Status filter
      const isExpired = isPosterExpired(p.tanggalKadaluarsa);
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !isExpired) ||
        (statusFilter === 'EXPIRED' && isExpired);

      return matchQuery && matchKategori && matchStatus;
    });
  }, [posters, searchQuery, selectedKategori, statusFilter]);

  // Handle Download File
  const handleDownload = (poster: PosterPromoItem) => {
    try {
      if (!poster.fileData) {
        showToast('Berkas poster tidak tersedia untuk diunduh.');
        return;
      }

      const link = document.createElement('a');
      link.href = poster.fileData;
      link.download = poster.namaBerkas || `${poster.judul.replace(/\s+/g, '_')}.${poster.formatBerkas || 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Mengunduh poster: ${poster.namaBerkas}`);
    } catch (err) {
      console.error('Error downloading poster:', err);
      showToast('Gagal mengunduh poster.');
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = () => {
    if (posterToDelete) {
      onDeletePoster(posterToDelete.id);
      showToast(`Poster "${posterToDelete.judul}" berhasil dihapus.`);
      setPosterToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Actions */}
      <div className="bg-gradient-to-r from-[#005d42] via-[#004a35] to-[#013828] text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden border border-emerald-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold text-emerald-100 mb-2 border border-white/20">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span>Dokumen Master • Poster & Media Promosi RSUMB</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Poster Layanan & Promo Rumah Sakit
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed font-normal">
              Pusat penyimpanan & referensi visual flyer tarif promo, paket MCU, sosialisasi poli spesialis, dan poster layanan unggulan RSU Muhammadiyah Babat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Unggah Poster / Promo</span>
            </button>
          </div>
        </div>

        {/* Decorative blur */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#005d42] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Poster</div>
            <div className="text-base sm:text-lg font-black text-slate-900">{stats.total} Materi</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Promo Aktif</div>
            <div className="text-base sm:text-lg font-black text-emerald-700">{stats.active} Materi</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Telah Kadaluarsa</div>
            <div className="text-base sm:text-lg font-black text-amber-700">{stats.expired} Materi</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Status Sistem</div>
            <div className="text-xs sm:text-sm font-bold text-blue-900">Auto-Expiry Alert</div>
          </div>
        </div>
      </div>

      {/* 3. Auto-Expiry Alert Notice if any expired posters exist */}
      {stats.expired > 0 && statusFilter !== 'EXPIRED' && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Terdapat <strong>{stats.expired} poster promo</strong> yang telah melewati batas tanggal masa berlaku (status kadaluarsa).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('EXPIRED')}
            className="px-3 py-1 bg-amber-200/80 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-xs transition cursor-pointer shrink-0"
          >
            Lihat Poster Kadaluarsa →
          </button>
        </div>
      )}

      {/* 4. Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Instant Search Filter */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul poster, tag (khitan, mcu, poli jantung), atau nama berkas..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Dropdown Kategori Promo */}
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] cursor-pointer"
            >
              <option value="ALL">Semua Kategori Promo</option>
              {KATEGORI_PROMO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Dropdown Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusPromoFilter)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42] cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="EXPIRED">Hanya Kadaluarsa</option>
            </select>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#005d42]" />
            Kategori:
          </span>
          <button
            type="button"
            onClick={() => setSelectedKategori('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedKategori === 'ALL'
                ? 'bg-[#005d42] text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({posters.length})
          </button>
          {KATEGORI_PROMO_OPTIONS.map((opt) => {
            const count = posters.filter((p) => p.kategoriPromo === opt.value).length;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedKategori(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedKategori === opt.value
                    ? 'bg-[#005d42] text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Responsive Card / Grid View */}
      {filteredPosters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Tidak Ada Poster yang Cocok</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedKategori !== 'ALL' || statusFilter !== 'ALL'
              ? 'Tidak ditemukan poster dengan filter saat ini. Coba bersihkan pencarian atau ubah kategori.'
              : 'Belum ada poster layanan atau promo yang diunggah. Silakan klik tombol "Unggah Poster / Promo" untuk menambahkan.'}
          </p>
          {(searchQuery || selectedKategori !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedKategori('ALL');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredPosters.map((poster) => {
            const isExpired = isPosterExpired(poster.tanggalKadaluarsa);
            const isPdf = poster.formatBerkas?.toLowerCase() === 'pdf' || poster.namaBerkas?.toLowerCase().endsWith('.pdf');

            // Category badge styling
            const categoryOption = KATEGORI_PROMO_OPTIONS.find((o) => o.value === poster.kategoriPromo);
            const categoryBadgeColor = categoryOption?.badgeColor || 'bg-slate-100 text-slate-800 border-slate-300';

            return (
              <div
                key={poster.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Thumbnail Container */}
                <div
                  onClick={() => setPreviewPoster(poster)}
                  className="relative aspect-[4/3] bg-slate-100 cursor-pointer overflow-hidden border-b border-slate-100"
                >
                  {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-rose-50 to-slate-100">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center mb-1.5">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 line-clamp-1">{poster.namaBerkas}</span>
                      <span className="text-[10.5px] text-slate-500 mt-0.5 font-medium">Flyer PDF Resmi</span>
                    </div>
                  ) : (
                    <img
                      src={poster.fileData || ''}
                      alt={poster.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs ${categoryBadgeColor}`}
                    >
                      {poster.kategoriPromo}
                    </span>

                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>Kadaluarsa</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>

                  {/* Hover Quick Zoom Overlay */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-lg">
                      <Eye className="w-3.5 h-3.5 text-[#005d42]" />
                      <span>Klik Pratinjau</span>
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Poster Title */}
                    <h3
                      onClick={() => setPreviewPoster(poster)}
                      className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 hover:text-[#005d42] transition-colors cursor-pointer"
                      title={poster.judul}
                    >
                      {poster.judul}
                    </h3>

                    {/* Masa Berlaku Date */}
                    {(poster.tanggalMulai || poster.tanggalKadaluarsa) && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {poster.tanggalMulai ? formatIndoDate(poster.tanggalMulai) : 'Sekarang'} -{' '}
                          {poster.tanggalKadaluarsa ? formatIndoDate(poster.tanggalKadaluarsa) : 'Seterusnya'}
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {poster.tags && poster.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {poster.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                        {poster.tags.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{poster.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewPoster(poster)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#005d42] font-bold rounded-lg transition cursor-pointer"
                      title="Lihat / Preview Full"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>

                    {poster.driveViewLink && (
                      <a
                        href={poster.driveViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition cursor-pointer border border-blue-200"
                        title="Buka File di Google Drive"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownload(poster)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer border border-slate-200"
                      title="Unduh / Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPosterToDelete(poster)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer border border-rose-100"
                      title="Hapus Poster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Poster Modal */}
      <UploadPosterModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={onUploadPoster}
        showToast={showToast}
      />

      {/* High-Res Preview Modal */}
      <PosterPreviewModal
        isOpen={!!previewPoster}
        onClose={() => setPreviewPoster(null)}
        poster={previewPoster}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Modal (Prompt: "Hapus poster promo ini?") */}
      {posterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setPosterToDelete(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="pr-6">
                <h3 className="text-base font-bold text-slate-900">Hapus poster promo ini?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Poster <strong>"{posterToDelete.judul}"</strong> ({posterToDelete.kategoriPromo}) akan dihapus dari sistem Dokumen Master. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPosterToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Poster</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
