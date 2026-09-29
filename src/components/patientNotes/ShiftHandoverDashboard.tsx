import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Hash,
  Calendar,
  Sun,
  Sunset,
  Moon,
  Check,
  RotateCcw,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Copy,
  Info
} from 'lucide-react';
import {
  PatientShiftHandoverRecord,
  ShiftAdmisi,
  StatusHandover,
  PrioritasHandover
} from '../../types/patientNotesTypes';
import { ShiftHandoverFormModal } from './ShiftHandoverFormModal';

interface ShiftHandoverDashboardProps {
  records: PatientShiftHandoverRecord[];
  onSaveRecord: (record: PatientShiftHandoverRecord) => void;
  onToggleStatus: (id: string) => void;
  onDeleteRecord: (id: string, namaPasien: string) => void;
  showToast: (msg: string) => void;
}

export const ShiftHandoverDashboard: React.FC<ShiftHandoverDashboardProps> = ({
  records,
  onSaveRecord,
  onToggleStatus,
  onDeleteRecord,
  showToast
}) => {
  // Determine current active shift by real time
  const getCurrentShift = (): ShiftAdmisi => {
    const hours = new Date().getHours();
    if (hours >= 7 && hours < 14) return 'Pagi';
    if (hours >= 14 && hours < 21) return 'Siang';
    return 'Malam';
  };

  const currentRealShift = getCurrentShift();

  // Filters state
  const [shiftFilter, setShiftFilter] = useState<'all' | ShiftAdmisi>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusHandover>('all');
  const [prioritasFilter, setPrioritasFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PatientShiftHandoverRecord | null>(null);

  // Statistics
  const totalCount = records.length;
  const pendingCount = useMemo(() => records.filter((r) => r.status === 'Pending').length, [records]);
  const handledCount = useMemo(() => records.filter((r) => r.status === 'Handled').length, [records]);

  const countByShift = useMemo(() => {
    return {
      Pagi: records.filter((r) => r.shift === 'Pagi').length,
      Siang: records.filter((r) => r.shift === 'Siang').length,
      Malam: records.filter((r) => r.shift === 'Malam').length
    };
  }, [records]);

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Shift filter
      if (shiftFilter !== 'all' && r.shift !== shiftFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Prioritas filter
      if (prioritasFilter !== 'all' && r.prioritas !== prioritasFilter) return false;

      // Date filter
      if (dateFilter && !r.timestamp.startsWith(dateFilter)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.namaPasien.toLowerCase().includes(q);
        const matchRm = r.noRm.toLowerCase().includes(q);
        const matchMasalah = r.masalah.toLowerCase().includes(q);
        const matchPetugas = r.petugasAsal.toLowerCase().includes(q);
        const matchKategori = r.kategori ? r.kategori.toLowerCase().includes(q) : false;
        if (!matchName && !matchRm && !matchMasalah && !matchPetugas && !matchKategori) return false;
      }

      return true;
    });
  }, [records, shiftFilter, statusFilter, prioritasFilter, dateFilter, searchQuery]);

  // Format datetime display
  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d) + ' WIB';
    } catch {
      return isoStr;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} disalin: ${text}`);
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: PatientShiftHandoverRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        {/* Row 1: Header + Active Shift Indicator + Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#005d42] to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
                  Kartu Handover Shift Admisi
                </h2>
                {/* Active Real Shift Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Shift Jaga Saat Ini: <strong>{currentRealShift}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan & pemantauan kendala administratif pasien antar shift (Pagi, Siang, Malam)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>

            {/* Main Action: [+ Tambah Catatan Handover] */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005d42] hover:bg-[#004a35] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Catatan Handover</span>
            </button>
          </div>
        </div>

        {/* Row 2: Shift Filter Tabs & Statistics Pills */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Shift Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setShiftFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                shiftFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Shift ({totalCount})
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('Pagi')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                shiftFilter === 'Pagi'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Pagi (07-14) &bull; {countByShift.Pagi}</span>
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('Siang')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                shiftFilter === 'Siang'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span>Siang (14-21) &bull; {countByShift.Siang}</span>
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('Malam')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                shiftFilter === 'Malam'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Malam (21-07) &bull; {countByShift.Malam}</span>
            </button>
          </div>

          {/* Quick Status Stats */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'all' : 'Pending')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                statusFilter === 'Pending'
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pendingCount} Pending Operan</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'Handled' ? 'all' : 'Handled')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                statusFilter === 'Handled'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{handledCount} Selesai</span>
            </button>
          </div>
        </div>

        {/* Row 3: Search Bar & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pasien, no. RM, masalah, atau nama petugas..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] text-slate-700 font-medium"
            >
              <option value="all">Semua Status (Pending & Selesai)</option>
              <option value="Pending">🟡 Pending (Belum Tuntas)</option>
              <option value="Handled">🟢 Handled (Sudah Tuntas)</option>
            </select>
          </div>

          {/* Urgensi Filter */}
          <div className="sm:col-span-2">
            <select
              value={prioritasFilter}
              onChange={(e) => setPrioritasFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] text-slate-700 font-medium"
            >
              <option value="all">Semua Urgensi</option>
              <option value="Tinggi">🔴 Prioritas Tinggi</option>
              <option value="Sedang">🟡 Prioritas Sedang</option>
              <option value="Rendah">🟢 Prioritas Rendah</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] text-slate-700 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main List Rendering: Card View vs Table View */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            Tidak ada catatan handover yang sesuai filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Semua kendala pasien antar-shift telah terselesaikan atau tidak ada catatan baru pada kriteria ini.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005d42] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#004a35] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Catatan Handover Baru</span>
          </button>
        </div>
      ) : viewMode === 'card' ? (
        /* CARD-BASED VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRecords.map((item) => {
            const isPending = item.status === 'Pending';
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isPending
                    ? item.prioritas === 'Tinggi'
                      ? 'border-rose-300 shadow-rose-100/50'
                      : 'border-amber-300/80 shadow-amber-100/40'
                    : 'border-slate-200 bg-slate-50/40 opacity-90'
                }`}
              >
                {/* Card Header Strip */}
                <div
                  className={`px-4 py-2.5 flex items-center justify-between border-b ${
                    isPending
                      ? item.prioritas === 'Tinggi'
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  {/* Shift & Time */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        item.shift === 'Pagi'
                          ? 'bg-amber-500 text-white'
                          : item.shift === 'Siang'
                          ? 'bg-blue-600 text-white'
                          : 'bg-indigo-700 text-white'
                      }`}
                    >
                      {item.shift === 'Pagi' && <Sun className="w-3 h-3" />}
                      {item.shift === 'Siang' && <Sunset className="w-3 h-3" />}
                      {item.shift === 'Malam' && <Moon className="w-3 h-3" />}
                      <span>Shift {item.shift}</span>
                    </span>

                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDateTime(item.timestamp)}</span>
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                      isPending
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {isPending ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        <span>Pending</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Handled</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1">
                  {/* Pasien & RM */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{item.namaPasien}</span>
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                          RM: {item.noRm}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.noRm, 'Nomor RM')}
                          className="text-[10px] text-slate-400 hover:text-slate-600 p-0.5"
                          title="Salin No RM"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Urgensi / Category */}
                    <div className="text-right shrink-0">
                      {item.prioritas && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.prioritas === 'Tinggi'
                              ? 'bg-rose-100 text-rose-800'
                              : item.prioritas === 'Sedang'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.prioritas === 'Tinggi' ? '🔴 Tinggi' : item.prioritas === 'Sedang' ? '🟡 Sedang' : '🟢 Rendah'}
                        </span>
                      )}
                      {item.kategori && (
                        <div className="text-[10px] text-slate-500 mt-1 font-medium">
                          {item.kategori}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Masalah / Instruksi Handover */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 text-xs text-slate-800 leading-relaxed">
                    <p className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Masalah / Instruksi Tindak Lanjut:</span>
                    </p>
                    <p className="whitespace-pre-wrap">{item.masalah}</p>
                  </div>

                  {/* Handled resolution note if any */}
                  {!isPending && item.catatanPenyelesaian && (
                    <div className="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-200 text-xs text-emerald-950">
                      <p className="font-bold text-[10px] uppercase text-emerald-800 mb-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Penyelesaian ({item.handledBy || 'Staf Penerima'}):</span>
                      </p>
                      <p className="text-[11px]">{item.catatanPenyelesaian}</p>
                    </div>
                  )}

                  {/* Petugas Asal */}
                  <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                    <span>
                      Dioper oleh: <strong className="text-slate-700">{item.petugasAsal}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions: [Tandai Selesai / Pending], [Edit], [Hapus] */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Catatan Handover"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(item.id, item.namaPasien)}
                      title="Hapus Catatan Handover"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary Quick Toggle Action: [Tandai Selesai] */}
                  <button
                    type="button"
                    onClick={() => onToggleStatus(item.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer ${
                      isPending
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {isPending ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tandai Selesai</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Buka Kembali (Pending)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE-BASED VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-40">Waktu & Shift</th>
                  <th className="py-3 px-4 w-52">Pasien & No. RM</th>
                  <th className="py-3 px-3 w-36">Petugas Asal</th>
                  <th className="py-3 px-4">Masalah / Catatan Handover</th>
                  <th className="py-3 px-3 w-28 text-center">Urgensi</th>
                  <th className="py-3 px-3 w-28 text-center">Status</th>
                  <th className="py-3 px-3 w-36 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item, idx) => {
                  const isPending = item.status === 'Pending';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPending ? 'bg-white' : 'bg-slate-50/40 text-slate-500'
                      }`}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {formatDateTime(item.timestamp)}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.shift === 'Pagi'
                              ? 'bg-amber-100 text-amber-800'
                              : item.shift === 'Siang'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          Shift {item.shift}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.namaPasien}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          RM: {item.noRm}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-700">
                        {item.petugasAsal}
                      </td>

                      <td className="py-3 px-4">
                        {item.kategori && (
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded mb-1">
                            {item.kategori}
                          </span>
                        )}
                        <p className="text-slate-800 leading-snug">{item.masalah}</p>
                        {!isPending && item.catatanPenyelesaian && (
                          <div className="text-[10px] text-emerald-800 font-medium mt-1">
                            ✓ Selesai: {item.catatanPenyelesaian} ({item.handledBy || '-'})
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.prioritas === 'Tinggi'
                              ? 'bg-rose-100 text-rose-800'
                              : item.prioritas === 'Sedang'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.prioritas || 'Sedang'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {isPending ? 'Pending' : 'Handled'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleStatus(item.id)}
                            title={isPending ? 'Tandai Selesai' : 'Buka Kembali'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isPending
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                            }`}
                          >
                            {isPending ? <Check className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteRecord(item.id, item.namaPasien)}
                            title="Hapus"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
        </div>
      )}

      {/* Modal Tambah / Edit Catatan Handover */}
      <ShiftHandoverFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={onSaveRecord}
        editingRecord={editingRecord}
        defaultShift={currentRealShift}
      />
    </div>
  );
};
