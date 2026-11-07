import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  Search,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Filter,
  AlertCircle
} from 'lucide-react';
import { SystemActivityLog } from '../types/auditLogTypes';
import {
  loadDoctorScheduleNoteLogs,
  loadSystemActivityLogs,
  CATEGORY_META_MAP
} from '../data/auditLogData';
import { exportToExcel } from '../utils/exportHelpers';

interface ScheduleNoteAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFullAudit?: () => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ScheduleNoteAuditModal: React.FC<ScheduleNoteAuditModalProps> = ({
  isOpen,
  onClose,
  onNavigateToFullAudit,
  showToast
}) => {
  const [logs, setLogs] = useState<SystemActivityLog[]>(() => loadDoctorScheduleNoteLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('ALL');

  // Listen to live updates when note is edited
  useEffect(() => {
    const handleUpdate = () => {
      setLogs(loadDoctorScheduleNoteLogs());
    };
    window.addEventListener('rsumb_audit_logs_updated', handleUpdate);
    window.addEventListener('rsumb_schedules_saved', handleUpdate);
    return () => {
      window.removeEventListener('rsumb_audit_logs_updated', handleUpdate);
      window.removeEventListener('rsumb_schedules_saved', handleUpdate);
    };
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedStaff !== 'ALL' && log.staffName !== selectedStaff) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const details = (log.details || '').toLowerCase();
        const staff = (log.staffName || '').toLowerCase();
        const doc = (log.metadata?.doctor || '').toLowerCase();
        const poli = (log.metadata?.poli || '').toLowerCase();
        const note = (log.metadata?.newNote || '').toLowerCase();
        return details.includes(q) || staff.includes(q) || doc.includes(q) || poli.includes(q) || note.includes(q);
      }
      return true;
    });
  }, [logs, selectedStaff, searchQuery]);

  // Unique staff list from logs
  const staffOptions = useMemo(() => {
    const staffSet = new Set<string>();
    logs.forEach((l) => {
      if (l.staffName) staffSet.add(l.staffName);
    });
    return Array.from(staffSet).sort();
  }, [logs]);

  // Format timestamp helper
  const formatTimestamp = (rfcTimestamp: string) => {
    try {
      const date = new Date(rfcTimestamp);
      if (isNaN(date.getTime())) return rfcTimestamp;
      return (
        date.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB'
      );
    } catch {
      return rfcTimestamp;
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const headers = [
        'No',
        'Waktu Perubahan (WIB)',
        'Petugas / Staf',
        'Tipe Aksi',
        'Dokter DPJP',
        'Poliklinik',
        'Hari',
        'Catatan Sebelumnya',
        'Catatan Baru',
        'Rincian Aktivitas'
      ];

      const data = filteredLogs.map((log, index) => [
        index + 1,
        formatTimestamp(log.timestamp),
        log.staffName,
        log.actionType,
        log.metadata?.doctor || '-',
        log.metadata?.poli || '-',
        log.metadata?.hari || '-',
        log.metadata?.oldNote || '(Kosong)',
        log.metadata?.newNote || '(Kosong)',
        log.details
      ]);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Riwayat_Perubahan_Catatan_Jadwal_RSUMB_${dateStr}.xlsx`;

      await exportToExcel({
        filename,
        sheetName: 'Riwayat Catatan Jadwal',
        title: 'RIWAYAT & AUDIT LOG PERUBAHAN KOLOM CATATAN JADWAL DOKTER',
        subtitle: `RSU Muhammadiyah Babat | Total Data: ${filteredLogs.length} Peristiwa`,
        totalLabel: `Total Riwayat: ${filteredLogs.length} Catatan Diubah`,
        headers,
        data,
        columnAlignments: ['center', 'left', 'left', 'left', 'left', 'left', 'center', 'left', 'left', 'left']
      });

      showToast?.('Riwayat perubahan catatan berhasil diekspor ke Excel (.xlsx).', 'success');
    } catch (e) {
      console.error('Error exporting note audit logs:', e);
      showToast?.('Gagal mengekspor riwayat log ke Excel.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] my-auto flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 z-10">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between gap-3 border-b border-teal-700/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                  Audit Trail & Log Aktivitas
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {logs.length} Peristiwa Tercatat
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-white truncate mt-0.5">
                Riwayat Perubahan Kolom &apos;Catatan&apos; Jadwal Dokter
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredLogs.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Unduh Riwayat ke File Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL CONTROLS & FILTER */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dokter, poli, staf, atau isi catatan..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 font-medium text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Staff Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 cursor-pointer"
              >
                <option value="ALL">Semua Petugas</option>
                {staffOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end text-xs text-slate-500 font-medium">
            <span>
              Menampilkan <strong className="text-slate-800 font-bold">{filteredLogs.length}</strong> log
            </span>
            {(searchQuery || selectedStaff !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStaff('ALL');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* LOG LIST TABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-100/50">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <History className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">Belum Ada Riwayat Perubahan Catatan</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                {searchQuery || selectedStaff !== 'ALL'
                  ? 'Tidak ada log yang cocok dengan filter pencarian Anda.'
                  : 'Setiap kali petugas mengisi atau mengubah isi kolom "CATATAN" di tabel jadwal dokter, sistem akan otomatis mencatat siapa petugas yang mengubah dan kapan waktu perubahannya di sini.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => {
                const oldNote = log.metadata?.oldNote;
                const newNote = log.metadata?.newNote;
                const docName = log.metadata?.doctor;
                const poliName = log.metadata?.poli;
                const hariName = log.metadata?.hari;

                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Action badge */}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            /tambah/i.test(log.actionType)
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : /hapus/i.test(log.actionType)
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-teal-50 text-teal-800 border-teal-200'
                          }`}
                        >
                          {log.actionType}
                        </span>

                        {/* Staff badge */}
                        <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                          <span>Oleh: {log.staffName}</span>
                        </div>

                        {/* Doctor info badge */}
                        {docName && (
                          <span className="text-xs font-bold text-slate-800">
                            {docName} {poliName ? `(${poliName}` : ''}
                            {hariName ? `, ${hariName})` : poliName ? ')' : ''}
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Note Diff Visualizer */}
                    <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                      <div className="flex-1 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Catatan Sebelumnya:
                        </span>
                        {oldNote ? (
                          <span className="line-through text-slate-500 font-medium">{oldNote}</span>
                        ) : (
                          <span className="text-slate-400 italic font-normal">(Belum ada catatan / Kosong)</span>
                        )}
                      </div>

                      <div className="hidden sm:flex text-slate-400 shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>

                      <div className="flex-1 bg-teal-50/70 p-2 rounded-lg border border-teal-200">
                        <span className="text-[10px] uppercase font-bold text-teal-800 block mb-0.5">
                          Catatan Diperbarui Menjadi:
                        </span>
                        {newNote ? (
                          <span className="font-bold text-teal-900">{newNote}</span>
                        ) : (
                          <span className="text-rose-600 font-medium italic">(Catatan Dikosongkan)</span>
                        )}
                      </div>
                    </div>

                    {/* Full details text */}
                    <div className="mt-2 text-[11px] text-slate-600 leading-relaxed font-normal">
                      {log.details}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit log terproteksi secara permanen & tersinkronisasi ke Cloud RSUMB.</span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToFullAudit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToFullAudit();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Buka Tab Audit Trail Lengkap di Menu Pengaturan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Log Audit Lengkap</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
