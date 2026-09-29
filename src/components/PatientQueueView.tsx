import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  ArrowRight,
  Filter,
  Volume2
} from 'lucide-react';
import { PatientQueueItem, DoctorSchedule } from '../types';

interface PatientQueueViewProps {
  queueList: PatientQueueItem[];
  schedules: DoctorSchedule[];
  onUpdateStatus: (id: string, newStatus: PatientQueueItem['status']) => void;
  onOpenBookModal: () => void;
}

export const PatientQueueView: React.FC<PatientQueueViewProps> = ({
  queueList,
  schedules,
  onUpdateStatus,
  onOpenBookModal
}) => {
  const [search, setSearch] = useState('');
  const [poliFilter, setPoliFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredQueue = queueList.filter((item) => {
    const matchesSearch =
      item.namaPasien.toLowerCase().includes(search.toLowerCase()) ||
      item.nomorAntrean.toLowerCase().includes(search.toLowerCase()) ||
      item.noBpjs.includes(search) ||
      item.dpjp.toLowerCase().includes(search.toLowerCase());

    const matchesPoli = poliFilter === '' || item.poli === poliFilter;
    const matchesStatus = statusFilter === '' || item.status === statusFilter;

    return matchesSearch && matchesPoli && matchesStatus;
  });

  const waitingCount = queueList.filter((q) => q.status === 'Menunggu').length;
  const inProgressCount = queueList.filter((q) => q.status === 'Diperiksa').length;
  const completedCount = queueList.filter((q) => q.status === 'Selesai').length;

  const handleCallPatient = (patient: PatientQueueItem) => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(
        `Nomor antrean ${patient.nomorAntrean}, atas nama ${patient.namaPasien}, silakan menuju ${patient.poli}`
      );
      msg.lang = 'id-ID';
      window.speechSynthesis.speak(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Antrean Menunggu</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{waitingCount} Pasien</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Sedang Diperiksa</p>
            <p className="text-2xl font-bold text-[#005d42] mt-1">{inProgressCount} Pasien</p>
          </div>
          <div className="p-3 bg-emerald-50 text-[#005d42] rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Selesai Pelayanan</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{completedCount} Pasien</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Action Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari antrean, nama, nomor BPJS..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#005d42]"
            />
          </div>

          <select
            value={poliFilter}
            onChange={(e) => setPoliFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="">Semua Poli</option>
            {Array.from(new Set(schedules.map((s) => s.poli))).map((poli) => (
              <option key={poli} value={poli}>
                {poli}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Diperiksa">Diperiksa</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        <button
          onClick={onOpenBookModal}
          className="px-4 py-2 bg-[#005d42] hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pasien Antrean</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#005d42]" />
            Daftar Antrean Pasien Hari Ini
          </h3>
          <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
            {filteredQueue.length} Pasien
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-5">No Antrean</th>
                <th className="py-3.5 px-5">Nama Pasien</th>
                <th className="py-3.5 px-5">Poliklinik & Dokter</th>
                <th className="py-3.5 px-5">Penjamin</th>
                <th className="py-3.5 px-5">Jam Daftar</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data antrean pasien yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-[#005d42]">
                        {item.nomorAntrean}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">{item.namaPasien}</p>
                        <p className="text-xs text-slate-400 font-mono">BPJS: {item.noBpjs}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-800">{item.poli}</p>
                        <p className="text-xs text-slate-500">{item.dpjp}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.jenisPembayaran}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">
                        {item.jamDaftar}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            item.status === 'Menunggu'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'Diperiksa'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCallPatient(item)}
                            title="Panggil Pasien (Audio)"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          {item.status === 'Menunggu' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'Diperiksa')}
                              className="text-xs font-semibold px-2 py-1 bg-[#005d42] text-white rounded-md hover:bg-emerald-800 transition-colors"
                            >
                              Panggil
                            </button>
                          )}

                          {item.status === 'Diperiksa' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'Selesai')}
                              className="text-xs font-semibold px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                            >
                              Selesai
                            </button>
                          )}
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
    </div>
  );
};
