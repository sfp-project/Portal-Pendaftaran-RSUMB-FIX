import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Printer,
  Search,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Download,
  CheckCircle2,
  Clock,
  Car,
  Tag,
  Coins,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { MohatAuditLog, KuponMohat } from '../../types/mohatTypes';
import { formatRupiahMohat, getPenjaminDisplayLabel } from '../../data/mohatData';

interface MohatAuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: MohatAuditLog[];
  onSelectReprint: (kupon: KuponMohat) => void;
}

export const MohatAuditTrailModal: React.FC<MohatAuditTrailModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  onSelectReprint
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState<'ALL' | 'PKM' | 'MOHAT'>('ALL');
  const [filterPenjamin, setFilterPenjamin] = useState<'ALL' | 'UMUM' | 'BPJS'>('ALL');
  const [filterReprintOnly, setFilterReprintOnly] = useState(false);

  // Formatting timestamp
  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${day}/${month}/${year} ${time} WIB`;
    } catch {
      return isoString;
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const totalCount = auditLogs.length;
    const totalNominal = auditLogs.reduce((acc, curr) => acc + (curr.feeTotal || 0), 0);
    const totalReprintEvents = auditLogs.reduce((acc, curr) => acc + (curr.reprintCount || 0), 0);
    const reprintedCount = auditLogs.filter((item) => (item.reprintCount || 0) > 0).length;
    return {
      totalCount,
      totalNominal,
      totalReprintEvents,
      reprintedCount
    };
  }, [auditLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.nomorKupon.toLowerCase().includes(q) ||
        item.noSeri.toLowerCase().includes(q) ||
        item.namaPasien.toLowerCase().includes(q) ||
        item.perujukSopir.toLowerCase().includes(q);

      const matchKategori = filterKategori === 'ALL' || item.kategori === filterKategori;
      const matchPenjamin =
        filterPenjamin === 'ALL' ||
        (filterPenjamin === 'UMUM' && item.penjamin === 'UMUM') ||
        (filterPenjamin === 'BPJS' && item.penjamin !== 'UMUM');

      const matchReprint = !filterReprintOnly || (item.reprintCount || 0) > 0;

      return matchSearch && matchKategori && matchPenjamin && matchReprint;
    });
  }, [auditLogs, searchQuery, filterKategori, filterPenjamin, filterReprintOnly]);

  // Export audit trail to JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Audit_Trail_20_Kupon_RSUMB_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#005d42] to-[#004a35] text-white px-5 py-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 text-emerald-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Audit Trail & Riwayat Kupon Terakhir
                </h2>
                <span className="px-2 py-0.5 bg-emerald-400/25 border border-emerald-300/30 text-emerald-200 text-[10px] font-bold rounded-full">
                  Maks. 20 Kupon
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Log audit penerbitan, pelacakan nomor seri, dan pencetakan ulang (re-print) kasir RSUMB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Tutup dialog audit trail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audit Kupon Aktif</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              {metrics.totalCount} / 20 <span className="text-[11px] font-normal text-slate-500">Slot Terkunci</span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Fee Tercatat</span>
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">
              {formatRupiahMohat(metrics.totalNominal)}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Kupon Dicetak Ulang</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-amber-800 mt-0.5">
              {metrics.reprintedCount} <span className="text-[11px] font-normal text-slate-500">({metrics.totalReprintEvents}x Re-print)</span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Status Integritas</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-blue-900 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Siap Cetak Ulang</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 py-3 sm:px-6 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor kupon, no. seri, nama pasien, perujuk..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              />
            </div>

            {/* Filter Kategori */}
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="PKM">PKM / Faskes 1</option>
              <option value="MOHAT">Desa / Mohat</option>
            </select>

            {/* Filter Penjamin */}
            <select
              value={filterPenjamin}
              onChange={(e) => setFilterPenjamin(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#005d42]"
            >
              <option value="ALL">Semua Penjamin</option>
              <option value="UMUM">Pasien UMUM</option>
              <option value="BPJS">BPJS / Asuransi</option>
            </select>

            {/* Checkbox Filter Reprint */}
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none px-2 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition">
              <input
                type="checkbox"
                checked={filterReprintOnly}
                onChange={(e) => setFilterReprintOnly(e.target.checked)}
                className="rounded text-[#005d42] focus:ring-[#005d42] cursor-pointer"
              />
              <span>Hanya Dicetak Ulang</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-200"
              title="Ekspor Log Audit Trail ke JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Unduh Log (JSON)</span>
            </button>
          </div>
        </div>

        {/* Table Body - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-[260px] bg-slate-50">
          {filteredLogs.length === 0 ? (
            <div className="py-14 text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-600">Tidak ada data audit yang sesuai</div>
              <p className="text-xs text-slate-400 mt-1">
                Silakan ubah filter pencarian atau terbitkan kupon baru untuk menambahkan log audit.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse bg-white">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 text-[10.5px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Waktu & Aksi</th>
                  <th className="py-2.5 px-3">No. Seri & Kupon</th>
                  <th className="py-2.5 px-3">Pasien Ranap</th>
                  <th className="py-2.5 px-3">Penjamin / Kategori</th>
                  <th className="py-2.5 px-3">Perujuk / Sopir</th>
                  <th className="py-2.5 px-3 text-right">Fee Total</th>
                  <th className="py-2.5 px-3 text-center">Riwayat Cetak</th>
                  <th className="py-2.5 px-3 text-center">Aksi Re-print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.map((item, index) => {
                  const isReprinted = (item.reprintCount || 0) > 0;
                  return (
                    <tr key={item.id || item.kuponId + index} className="hover:bg-emerald-50/40 transition">
                      {/* Waktu & Aksi */}
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-[10.5px]">{formatTimestamp(item.timestamp)}</span>
                        </div>
                        <div className="mt-1">
                          {isReprinted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Dicetak Ulang ({item.reprintCount}x)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Penerbitan Baru</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* No. Seri & Kupon */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-900 text-white rounded font-mono font-bold text-[10px] tracking-wider shadow-2xs">
                          {item.noSeri}
                        </span>
                        <div className="font-mono font-bold text-emerald-900 text-[11px] mt-1">
                          {item.nomorKupon}
                        </div>
                      </td>

                      {/* Pasien Ranap */}
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div>{item.namaPasien}</div>
                        {item.kuponSnapshot.catatan && (
                          <div className="text-[10px] font-normal text-slate-500 italic mt-0.5 truncate max-w-[150px]">
                            {item.kuponSnapshot.catatan}
                          </div>
                        )}
                      </td>

                      {/* Penjamin & Kategori */}
                      <td className="py-2.5 px-3 space-y-1">
                        <div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.penjamin === 'UMUM'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {getPenjaminDisplayLabel(item.penjamin)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium">
                          {item.kategori === 'PKM' ? 'PKM / Faskes 1' : 'Desa / Mohat'}
                        </div>
                      </td>

                      {/* Perujuk / Sopir */}
                      <td className="py-2.5 px-3 text-[11px]">
                        <div className="font-semibold text-slate-800">{item.perujukSopir}</div>
                      </td>

                      {/* Fee Total */}
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 text-xs">
                        {formatRupiahMohat(item.feeTotal)}
                      </td>

                      {/* Riwayat Cetak */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="text-[10px]">
                          {isReprinted ? (
                            <div>
                              <span className="font-bold text-amber-800">{item.reprintCount}x Cetak Ulang</span>
                              {item.lastReprintAt && (
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  Terakhir: {formatTimestamp(item.lastReprintAt)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium">Cetak Perdana</span>
                          )}
                        </div>
                      </td>

                      {/* Aksi Re-print */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectReprint(item.kuponSnapshot)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#005d42] hover:bg-[#004a35] active:scale-95 text-white font-bold text-[11px] rounded-xl transition shadow-xs cursor-pointer"
                          title={`Cetak Ulang Struk Thermal untuk Kupon ${item.nomorKupon} (${item.noSeri})`}
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Cetak Ulang</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3.5 sm:px-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span className="font-bold text-slate-700">Catatan Audit:</span> Sistem secara otomatis merekam dan mengunci 20 kupon rujukan terakhir yang diterbitkan untuk keperluan verifikasi kasir dan pencegahan duplikasi klaim.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
