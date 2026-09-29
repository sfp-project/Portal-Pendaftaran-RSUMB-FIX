import React from 'react';
import {
  Building2,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle,
  Shield,
  Layers,
  Activity,
  Server,
  RefreshCw
} from 'lucide-react';
import { DoctorSchedule } from '../types';

interface ClinicsViewProps {
  schedules: DoctorSchedule[];
  onSelectPoli: (poli: string) => void;
}

export const ClinicsView: React.FC<ClinicsViewProps> = ({ schedules, onSelectPoli }) => {
  const poliList = Array.from(new Set(schedules.map((s) => s.poli)));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#005d42]" />
          Daftar Instalasi & Poliklinik RSU Muhammadiyah Babat
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Pusat pelayanan rawat jalan terpadu dengan fasilitas poliklinik spesialis terlengkap
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {poliList.map((poli) => {
            const countDoctors = new Set(
              schedules.filter((s) => s.poli === poli).map((s) => s.dpjp)
            ).size;
            const totalQuota = schedules
              .filter((s) => s.poli === poli)
              .reduce((a, b) => a + b.kuotaTotal, 0);

            return (
              <div
                key={poli}
                onClick={() => onSelectPoli(poli)}
                className="p-5 rounded-xl border border-slate-200 hover:border-[#005d42] hover:shadow-md transition-all cursor-pointer bg-white group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#005d42] group-hover:bg-[#005d42] group-hover:text-white flex items-center justify-center transition-colors mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-[#005d42] transition-colors">
                  {poli}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span>{countDoctors} Dokter DPJP</span>
                  <span className="font-semibold text-emerald-700">{totalQuota} Kuota/Hari</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ReportsViewProps {
  schedules: DoctorSchedule[];
  onExport: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ schedules, onExport }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#005d42]" />
              Laporan Pelayanan Poliklinik & HFIS BPJS
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Rekapitulasi berkala kehadiran DPJP, kuota BPJS, dan rerata kunjungan pasien
            </p>
          </div>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-[#005d42] hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan Lengkap (.CSV)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="font-bold text-sm text-slate-800 mb-2">Ringkasan Validasi HFIS</h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Total Jadwal Terpetakan:</span>
                <strong className="text-slate-900">{schedules.length} Sesi Praktik</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Status Koneksi Bridging:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Terhubung (Online)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Sinkronisasi Terakhir:</span>
                <span className="font-mono">Hari ini, 07:00:00 WIB</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="font-bold text-sm text-slate-800 mb-2">Audit Kepesertaan BPJS</h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Kesesuaian Kuota dengan HFIS:</span>
                <strong className="text-emerald-700 font-bold">100% Sesuai</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Rata-rata Waktu Tunggu Antrean:</span>
                <strong className="text-slate-900">18 Menit</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Tingkat Keterisian Kuota (Occupancy):</span>
                <strong className="text-[#005d42]">84.2%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DepartmentSettingsView: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-[#005d42]" />
          Pengaturan Integrasi SIMRS & Bridging HFIS BPJS
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi web service, kode faskes, dan otentikasi BPJS Kesehatan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Kode Faskes Rumah Sakit (HFIS)
            </label>
            <input
              type="text"
              readOnly
              value="0124R001 - RSU Muhammadiyah Babat"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cons ID BPJS Kesehatan
            </label>
            <input
              type="text"
              readOnly
              value="31829••••••••••••"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Endpoint HFIS Antrean Online
            </label>
            <input
              type="text"
              readOnly
              value="https://apijkn.bpjs-kesehatan.go.id/antreanrs_dev"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-950">
              <Shield className="w-4 h-4 text-emerald-700" />
              Status Keamanan & Enkripsi
            </h4>
            <p>
              Koneksi bridging diamankan menggunakan enkripsi AES-256 dan HMAC-SHA256 sesuai standar BPJS TrustMark.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-emerald-800 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>TLS 1.3 Certified • Verified Service</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">Otomasi Sinkronisasi Jadwal</p>
            <p>Jadwal praktik dan kuota dokter diperbarui secara otomatis setiap pukul 00:00 WIB.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
