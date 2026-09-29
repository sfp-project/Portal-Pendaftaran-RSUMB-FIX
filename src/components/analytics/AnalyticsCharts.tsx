import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  Award,
  Stethoscope,
  Coins,
  ArrowUpRight
} from 'lucide-react';

export interface TrendDataPoint {
  label: string;
  operasiIBS: number;
  broadcastWA: number;
  kuponMohat: number;
}

export interface InsuranceDistributionPoint {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface DoctorLeaderboardItem {
  rank: number;
  nama: string;
  spesialisasi: string;
  poli: string;
  totalPelayanan: number;
  jadwalCount: number;
  operasiCount: number;
  status: string;
}

export interface MohatLeaderboardItem {
  rank: number;
  namaPerujuk: string;
  kategori: string;
  asal: string;
  totalKupon: number;
  totalFee: number;
}

interface AnalyticsChartsProps {
  trendData: TrendDataPoint[];
  insuranceDistribution: InsuranceDistributionPoint[];
  topDoctors: DoctorLeaderboardItem[];
  topMohatReferrers: MohatLeaderboardItem[];
  totalPatientsAll: number;
}

const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  trendData,
  insuranceDistribution,
  topDoctors,
  topMohatReferrers,
  totalPatientsAll
}) => {
  return (
    <div className="space-y-6">
      {/* 1. ROW 1: TREND BAR/LINE CHART & DONUT CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* TREND CHART: 8 COLUMNS */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0A2540]">
                    Tren Operasional Terintegrasi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Korelasi Pasien Operasi IBS, Broadcast Informasi WA, & Klaim Fee Mohat
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-[#10b981] inline-block"></span>
                Broadcast WA
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-3 h-1 bg-[#2563eb] inline-block"></span>
                Operasi IBS
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-3 h-1 bg-[#f59e0b] inline-block"></span>
                Fee Mohat
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trendData}
                margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs backdrop-blur-sm border border-slate-800">
                          <p className="font-bold text-slate-200 mb-1.5">{label}</p>
                          <div className="space-y-1">
                            {payload.map((entry, index) => (
                              <div
                                key={`item-${index}`}
                                className="flex items-center justify-between gap-4"
                              >
                                <span className="flex items-center gap-1.5 text-slate-300">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  ></span>
                                  {entry.name}:
                                </span>
                                <span className="font-bold text-white">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="broadcastWA"
                  name="Broadcast WA"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Line
                  type="monotone"
                  dataKey="operasiIBS"
                  name="Operasi Elektif IBS"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="kuponMohat"
                  name="Kupon Fee Mohat"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 text-right flex items-center justify-end gap-1">
            <span>Siklus data dianalisis secara harian dan dinormalisasi untuk pemantauan kapasitas</span>
          </div>
        </div>

        {/* DONUT CHART: 4 COLUMNS */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0A2540]">
                  Distribusi Penjamin Pasien
                </h3>
                <p className="text-xs text-slate-500">
                  Total Volume: <b>{totalPatientsAll} Pasien</b>
                </p>
              </div>
            </div>
          </div>

          {/* Recharts Pie / Donut */}
          <div className="h-44 sm:h-48 w-full relative flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insuranceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {insuranceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Pasien`, name]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total
              </span>
              <span className="text-lg font-black text-slate-900 leading-tight">
                {totalPatientsAll}
              </span>
              <span className="text-[9.5px] font-semibold text-slate-500">Pasien</span>
            </div>
          </div>

          {/* Custom Legend Cards */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {insuranceDistribution.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="font-semibold text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{item.value}</span>
                  <span className="text-[10.5px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. ROW 2: DUAL LEADERBOARD / RANKING TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEADERBOARD 1: TOP 5 DOKTER SPESIALIS PALING AKTIF */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0A2540]">
                    Top 5 Dokter Spesialis Paling Aktif
                  </h3>
                  <p className="text-xs text-slate-500">
                    Berdasarkan volume jadwal praktek & tindakan bedah IBS
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                DPJP Teladan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5 text-center w-10">Rank</th>
                    <th className="px-3.5 py-2.5">Nama DPJP</th>
                    <th className="px-3.5 py-2.5">Poliklinik / Spesialis</th>
                    <th className="px-3.5 py-2.5 text-center">Jadwal</th>
                    <th className="px-3.5 py-2.5 text-center">Operasi IBS</th>
                    <th className="px-3.5 py-2.5 text-center">Total Layanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topDoctors.length > 0 ? (
                    topDoctors.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-3.5 py-2.5 text-center font-bold">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-[#0A2540] flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{doc.nama}</span>
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-600">
                          {doc.spesialisasi}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-semibold text-slate-700">
                          {doc.jadwalCount} sesi
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-semibold text-blue-700">
                          {doc.operasiCount} op
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                            {doc.totalPelayanan}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Belum ada aktivitas dokter pada periode filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Data diverifikasi otomatis dengan presensi SIMRS DPJP</span>
            <span className="font-semibold text-emerald-700">Target Utilisasi 100%</span>
          </div>
        </div>

        {/* LEADERBOARD 2: TOP 5 PERUJUK KUPON FEE MOHAT */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0A2540]">
                    Top 5 Mitra Perujuk Fee Mohat
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bidan desa, perawat PKM, dan pengantar Mohat dengan rujukan terbanyak
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                Kemitraan Faskes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5 text-center w-10">Rank</th>
                    <th className="px-3.5 py-2.5">Nama Mitra Perujuk</th>
                    <th className="px-3.5 py-2.5">Kategori Mitra</th>
                    <th className="px-3.5 py-2.5">Asal Wilayah/PKM</th>
                    <th className="px-3.5 py-2.5 text-center">Kupon</th>
                    <th className="px-3.5 py-2.5 text-right">Total Insentif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topMohatReferrers.length > 0 ? (
                    topMohatReferrers.map((item, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-3.5 py-2.5 text-center font-bold">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">
                          {item.namaPerujuk}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-slate-600">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                              item.kategori === 'PKM'
                                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.kategori === 'PKM' ? 'Bidan/Perawat PKM' : 'Mobil Sehat (Mohat)'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 font-medium">
                          {item.asal || 'Kec. Babat & Sekitarnya'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-slate-900">
                          {item.totalKupon} Pasien
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-black text-emerald-800">
                          {formatRupiah(item.totalFee).replace(',00', '')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Belum ada klaim kupon rujukan pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kupon divalidasi dengan berkas Surat Rujukan & Bukti Kasir</span>
            <span className="font-semibold text-emerald-700">Pencairan Real-Time</span>
          </div>
        </div>
      </div>
    </div>
  );
};
