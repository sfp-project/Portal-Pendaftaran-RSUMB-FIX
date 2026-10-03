import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  UserCheck,
  Tag,
  Download,
  FileSpreadsheet,
  FileJson,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  SystemActivityLog,
  ActivityActionCategory,
  ActivityPeriodFilter
} from '../../types/auditLogTypes';
import {
  loadSystemActivityLogs,
  saveSystemActivityLogs,
  clearSystemActivityLogs,
  pruneSystemActivityLogs,
  RETENTION_DAYS_LOGS,
  CATEGORY_META_MAP
} from '../../data/auditLogData';
import { exportToExcel, downloadBlob } from '../../utils/exportHelpers';

const ALL_STAFF_MEMBERS = [
  'Hisyam',
  'Alivia',
  'Abi',
  'Ady',
  'Melinda',
  'Agnia',
  'Ismed',
  'Syafik'
];

interface ActivityLogAuditTrailViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ActivityLogAuditTrailView: React.FC<ActivityLogAuditTrailViewProps> = ({
  showToast
}) => {
  // Logs State
  const [logs, setLogs] = useState<SystemActivityLog[]>(() => loadSystemActivityLogs());

  // Filters State
  const [periodFilter, setPeriodFilter] = useState<ActivityPeriodFilter>('1_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  // Clear confirm modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Listen to live logs updates (from background actions or Google Drive sync)
  useEffect(() => {
    const handleUpdate = () => {
      setLogs(loadSystemActivityLogs());
    };
    window.addEventListener('rsumb_audit_logs_updated', handleUpdate);
    window.addEventListener('rsumb_database_synced', handleUpdate);
    return () => {
      window.removeEventListener('rsumb_audit_logs_updated', handleUpdate);
      window.removeEventListener('rsumb_database_synced', handleUpdate);
    };
  }, []);

  // Filter logs by period, staff, category, and search query
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(now.getDate() - 90);

    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);

      // Period Filter
      if (periodFilter === '1_MONTH') {
        if (logDate < oneMonthAgo) return false;
      } else if (periodFilter === '3_MONTHS') {
        if (logDate < threeMonthsAgo) return false;
      } else if (periodFilter === 'CUSTOM') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }

      // Staff Filter
      if (selectedStaff !== 'ALL' && log.staffName.toLowerCase() !== selectedStaff.toLowerCase()) {
        return false;
      }

      // Category Filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAction = log.actionType.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchStaff = log.staffName.toLowerCase().includes(q);
        const matchModule = (log.module || '').toLowerCase().includes(q);
        const matchTimestamp = log.timestamp.toLowerCase().includes(q);
        if (!matchAction && !matchDetails && !matchStaff && !matchModule && !matchTimestamp) {
          return false;
        }
      }

      return true;
    });
  }, [logs, periodFilter, customStartDate, customEndDate, selectedStaff, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Adjust current page if filter reduces item count
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Statistical metrics
  const metrics = useMemo(() => {
    const totalCount = filteredLogs.length;

    // Staff activity counts
    const staffCounts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      const s = l.staffName || 'Umum';
      staffCounts[s] = (staffCounts[s] || 0) + 1;
    });

    let topStaff = '-';
    let topStaffCount = 0;
    Object.entries(staffCounts).forEach(([staff, count]) => {
      if (count > topStaffCount) {
        topStaff = staff;
        topStaffCount = count;
      }
    });

    // Today's logs
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = filteredLogs.filter((l) => l.timestamp.startsWith(todayStr)).length;

    // Top Category
    const categoryCounts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
    });
    let topCategory = '-';
    let topCategoryCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > topCategoryCount) {
        topCategory = CATEGORY_META_MAP[cat as ActivityActionCategory]?.label || cat;
        topCategoryCount = count;
      }
    });

    return {
      totalCount,
      topStaff,
      topStaffCount,
      todayCount,
      topCategory,
      topCategoryCount
    };
  }, [filteredLogs]);

  // Format Display Timestamp
  const formatTimestamp = (rfcTimestamp: string) => {
    try {
      const date = new Date(rfcTimestamp);
      if (isNaN(date.getTime())) return rfcTimestamp;
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';
    } catch {
      return rfcTimestamp;
    }
  };

  // Export to Excel (.XLSX)
  const handleExportExcel = async () => {
    try {
      const headers = [
        'No',
        'Waktu (RFC3339)',
        'Tanggal & Jam (WIB)',
        'Petugas / Staf',
        'Kategori',
        'Tipe Aksi Operasional',
        'Rincian Aktivitas',
        'Modul SIMRS'
      ];

      const data = filteredLogs.map((log, index) => [
        index + 1,
        log.timestamp,
        formatTimestamp(log.timestamp),
        log.staffName,
        CATEGORY_META_MAP[log.category]?.label || log.category,
        log.actionType,
        log.details,
        log.module || 'Portal SIMRS'
      ]);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `RSUMB_Audit_Trail_Log_${dateStr}.xlsx`;

      await exportToExcel({
        filename,
        sheetName: 'Audit Trail RSUMB',
        title: 'AUDIT TRAIL & LOG AKTIVITAS OPERASIONAL SIMRS',
        subtitle: `Filter: Periode ${
          periodFilter === '1_MONTH'
            ? '1 Bulan Terakhir'
            : periodFilter === '3_MONTHS'
            ? '3 Bulan Terakhir'
            : `${customStartDate} s/d ${customEndDate}`
        } | Staf: ${selectedStaff} | Kategori: ${selectedCategory}`,
        totalLabel: `Total Aktivitas Tercatat: ${filteredLogs.length} peristiwa`,
        headers,
        data,
        columnAlignments: ['center', 'left', 'left', 'left', 'center', 'left', 'left', 'left']
      });

      showToast?.('Audit log berhasil diekspor ke Excel (.xlsx).', 'success');
    } catch (e) {
      console.error('Error exporting audit log to Excel:', e);
      showToast?.('Gagal mengekspor audit log ke Excel.', 'error');
    }
  };

  // Export to JSON (.JSON)
  const handleExportJson = () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `rsumb_audit_log_${dateStr}.json`;

      const payload = {
        metadata: {
          hospital: 'RSU Muhammadiyah Babat',
          system: 'Portal Pendaftaran SIMRS',
          exportedAt: now.toISOString(),
          totalLogs: filteredLogs.length,
          periodFilter,
          staffFilter: selectedStaff,
          categoryFilter: selectedCategory
        },
        logs: filteredLogs
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
      });
      downloadBlob(blob, filename);

      showToast?.('Audit log berhasil diunduh dalam format JSON.', 'success');
    } catch (e) {
      console.error('Error exporting audit log to JSON:', e);
      showToast?.('Gagal mengunduh audit log JSON.', 'error');
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    setLogs(loadSystemActivityLogs());
    showToast?.('Daftar log aktivitas berhasil disegarkan.', 'info');
  };

  // Clear handler
  const handleConfirmClear = () => {
    clearSystemActivityLogs();
    setLogs([]);
    setShowClearConfirm(false);
    showToast?.('Seluruh riwayat log aktivitas telah dibersihkan.', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* SECTION HEADER & QUICK METRICS */}
      <div className="bg-gradient-to-br from-slate-900 via-[#004732] to-[#005d42] rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 text-emerald-300 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Activity Log & Audit Trail Sistem (30 Hari Terakhir)
                </h3>
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Retensi 30 Hari Otomatis • Payload Ringan</span>
                </span>
              </div>
              <p className="text-xs text-emerald-100/85 mt-1 max-w-2xl leading-relaxed">
                Pencatatan otomatis seluruh transaksi dan peristiwa operasional staf pendaftaran dibatasi secara efisien pada 30 hari terakhir untuk menjaga ukuran payload database JSON tetap ringan dan sinkronisasi cloud berjalan secepat kilat.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                const res = pruneSystemActivityLogs();
                setLogs(loadSystemActivityLogs());
                if (res.prunedCount > 0) {
                  showToast?.(`Pembersihan sukses: ${res.prunedCount} log lama (> 30 hari) telah dihapus.`, 'success');
                } else {
                  showToast?.('Database log sudah optimal (seluruh data berada dalam rentang 30 hari terakhir).', 'info');
                }
              }}
              className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-emerald-100 hover:text-white"
              title="Bersihkan riwayat log yang lebih lama dari 30 hari"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan Log &gt;30 Hari</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-emerald-100 hover:text-white"
              title="Segarkan data log dari penyimpanan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Unduh Audit Log dalam format lembar kerja Excel (.XLSX)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Unduh .XLSX</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="py-2 px-3.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Unduh Audit Log dalam format JSON (.JSON)"
            >
              <FileJson className="w-4 h-4 text-emerald-300" />
              <span>Unduh .JSON</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Total Aktivitas Terfilter</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white">{metrics.totalCount}</span>
              <span className="text-[10px] text-emerald-200">peristiwa</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Aktivitas Hari Ini</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white">{metrics.todayCount}</span>
              <span className="text-[10px] text-emerald-200">peristiwa</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Staf Teraktif</span>
            <div className="flex items-baseline gap-1.5 mt-0.5 truncate">
              <span className="text-sm font-extrabold text-white truncate">{metrics.topStaff}</span>
              {metrics.topStaffCount > 0 && (
                <span className="text-[10px] text-emerald-200">({metrics.topStaffCount})</span>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Kategori Terbanyak</span>
            <div className="flex items-baseline gap-1.5 mt-0.5 truncate">
              <span className="text-sm font-extrabold text-white truncate">{metrics.topCategory}</span>
              {metrics.topCategoryCount > 0 && (
                <span className="text-[10px] text-emerald-200">({metrics.topCategoryCount})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Period Selectors */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#005d42]" />
              <span>Periode Log:</span>
            </span>

            <button
              type="button"
              onClick={() => setPeriodFilter('1_MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                periodFilter === '1_MONTH'
                  ? 'bg-[#005d42] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>1 Bulan Terakhir</span>
              <span className="text-[10px] opacity-80 font-normal">(-30 hari)</span>
            </button>

            <button
              type="button"
              onClick={() => setPeriodFilter('3_MONTHS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                periodFilter === '3_MONTHS'
                  ? 'bg-[#005d42] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>3 Bulan Terakhir</span>
              <span className="text-[10px] opacity-80 font-normal">(-90 hari)</span>
            </button>

            <button
              type="button"
              onClick={() => setPeriodFilter('CUSTOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                periodFilter === 'CUSTOM'
                  ? 'bg-[#005d42] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Rentang Tanggal Custom
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aksi, detail, staf, atau no kupon..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]/30 focus:border-[#005d42]"
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
        </div>

        {/* Custom Date Range Picker (shown when CUSTOM selected) */}
        {periodFilter === 'CUSTOM' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-slate-700">Pilih Tanggal Mulai s/d Selesai:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Secondary Filter: Staff & Category */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Staff Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-semibold">Petugas:</span>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#005d42]"
              >
                <option value="ALL">Semua Petugas (8 Staf)</option>
                {ALL_STAFF_MEMBERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-semibold">Kategori Aksi:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#005d42]"
              >
                <option value="ALL">Semua Kategori</option>
                {Object.entries(CATEGORY_META_MAP).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters / Items Per Page */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            {(selectedStaff !== 'ALL' || selectedCategory !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStaff('ALL');
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setPeriodFilter('1_MONTH');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}

            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Baris per halaman:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* STRUCTURED TABLE VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5 w-44">Waktu & Timestamp (RFC3339)</th>
                <th className="py-3 px-3.5 w-36">Petugas / Staf</th>
                <th className="py-3 px-3.5 w-36">Kategori</th>
                <th className="py-3 px-3.5">Tipe Aksi & Rincian Operasional</th>
                <th className="py-3 px-3.5 w-32 text-right">Modul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">Tidak ada log aktivitas yang cocok.</p>
                      <p className="text-xs text-slate-400">
                        Coba sesuaikan filter rentang tanggal, nama staf, atau kata kunci pencarian.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const itemIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const catMeta = CATEGORY_META_MAP[log.category] || {
                    label: log.category,
                    colorClass: 'text-slate-800',
                    bgClass: 'bg-slate-100',
                    borderClass: 'border-slate-200'
                  };

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center font-mono text-[11px] text-slate-400">
                        {itemIndex}
                      </td>

                      {/* Waktu & RFC3339 Timestamp */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {formatTimestamp(log.timestamp)}
                        </div>
                        <div
                          className="font-mono text-[10px] text-slate-400 mt-0.5 truncate max-w-[170px]"
                          title={`RFC3339: ${log.timestamp}`}
                        >
                          {log.timestamp}
                        </div>
                      </td>

                      {/* Petugas / Staf */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200/80 px-2.5 py-1 rounded-lg font-bold text-xs">
                          <div className="w-4 h-4 rounded-full bg-[#005d42] text-white flex items-center justify-center text-[9px] font-extrabold uppercase">
                            {log.staffName.charAt(0)}
                          </div>
                          <span>{log.staffName}</span>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3.5 align-top">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.bgClass} ${catMeta.colorClass} ${catMeta.borderClass}`}
                        >
                          {catMeta.label}
                        </span>
                      </td>

                      {/* Tipe Aksi & Rincian Operasional */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-bold text-slate-900 group-hover:text-[#005d42] transition-colors">
                          {log.actionType}
                        </div>
                        <p className="text-slate-600 mt-0.5 text-xs leading-relaxed">
                          {log.details}
                        </p>
                      </td>

                      {/* Modul */}
                      <td className="py-3 px-3.5 align-top text-right">
                        <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                          {log.module || 'Portal SIMRS'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {filteredLogs.length > 0 && (
          <div className="p-3.5 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Menampilkan{' '}
              <b>
                {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </b>{' '}
              dari <b>{filteredLogs.length}</b> total peristiwa log
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
                Halaman {currentPage} dari {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER CLEANUP / SAFETY ACTIONS */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Log disimpan secara otomatis ke berkas <b>rsumb_database.json</b> di Google Drive & LocalStorage (kapasitas hingga 2.000 log operasional).
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Bersihkan Riwayat Log</span>
        </button>
      </div>

      {/* MODAL: Konfirmasi Pembersihan Log */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
        >
          <div className="fixed inset-0" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10 p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Bersihkan Riwayat Audit Log?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini akan menghapus seluruh catatan audit aktivitas operasional dari memori lokal. Sebaiknya unduh salinan Excel atau JSON terlebih dahulu.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Ya, Bersihkan Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
