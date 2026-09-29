import React from 'react';
import {
  CalendarX,
  CreditCard,
  Bed,
  Activity,
  HeartHandshake,
  Car,
  FileCheck2,
  ShieldAlert,
  PhoneCall,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  ListOrdered,
  Users,
  Check,
  AlertTriangle
} from 'lucide-react';

interface AnalyticsModuleDetailsProps {
  activeSectionTab: string;
  leaveReportData: any;
  surgeryReportData: any;
  khitanReportData: any;
  masterDocReportData: any;
  whatsappAuditData: any;
  bpjsQuotaData: any;
  borReportData: any;
  jasaRaharjaReportData: any;
  patientNotesReportData: any;
  mohatReportData: any;
  onExportModulePdf: (moduleKey: string) => void;
  onExportModuleExcel: (moduleKey: string) => void;
}

const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

export const AnalyticsModuleDetails: React.FC<AnalyticsModuleDetailsProps> = ({
  activeSectionTab,
  leaveReportData,
  surgeryReportData,
  khitanReportData,
  masterDocReportData,
  whatsappAuditData,
  bpjsQuotaData,
  borReportData,
  jasaRaharjaReportData,
  patientNotesReportData,
  mohatReportData,
  onExportModulePdf,
  onExportModuleExcel
}) => {
  const isShow = (tab: string) => activeSectionTab === 'ALL' || activeSectionTab === tab;

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. JADWAL DOKTER & PERUBAHAN DPJP
      ===================================================================== */}
      {isShow('JADWAL') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Jadwal Dokter & Perubahan DPJP
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Frekuensi perubahan jadwal DPJP: dokter libur, jam maju, cuti dokter, dan ranking poliklinik paling sering libur.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                Total Perubahan: <b>{leaveReportData.totalFrekuensi}x</b> ({leaveReportData.totalLibur} Libur, {leaveReportData.totalMaju} Maju, {leaveReportData.totalCuti} Cuti)
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('JADWAL')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('JADWAL')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-amber-600" />
              <span>Rincian Poliklinik & DPJP Paling Sering Libur / Berubah Jadwal</span>
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5 text-center w-12">No</th>
                    <th className="px-3.5 py-2.5">Poliklinik</th>
                    <th className="px-3.5 py-2.5">Nama DPJP</th>
                    <th className="px-3.5 py-2.5 text-center">Total Berubah</th>
                    <th className="px-3.5 py-2.5 text-center">Libur</th>
                    <th className="px-3.5 py-2.5 text-center">Maju</th>
                    <th className="px-3.5 py-2.5 text-center">Cuti</th>
                    <th className="px-3.5 py-2.5">Keterangan Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveReportData.doctorRanking.length > 0 ? (
                    leaveReportData.doctorRanking.map((doc: any, idx: number) => (
                      <tr key={`${doc.poli}-${doc.dpjp}`} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-3.5 py-2.5 text-center font-bold text-slate-600">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">Poli {doc.poli}</td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">{doc.dpjp}</td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black">
                            {doc.total}x
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-rose-600">{doc.libur}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-blue-600">{doc.maju}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-purple-600">{doc.cuti}</td>
                        <td className="px-3.5 py-2.5 text-slate-500 max-w-sm truncate" title={doc.keteranganTerakhir}>
                          {doc.keteranganTerakhir}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada catatan perubahan jadwal dokter pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. KUOTA BPJS & HFIS
      ===================================================================== */}
      {isShow('KUOTA_BPJS') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Kuota BPJS Kesehatan & Integrasi HFIS
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring keterisian kuota rujukan FKTP/FKRTL terintegrasi HFIS BPJS per poliklinik dan dokter.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                Keterisian: <b>{bpjsQuotaData.persentaseTerisi}%</b> ({bpjsQuotaData.terisi} dari {bpjsQuotaData.totalKapasitas} Kuota)
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('KUOTA_BPJS')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('KUOTA_BPJS')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Kapasitas BPJS</span>
                <div className="text-2xl font-black text-emerald-900 mt-1">{bpjsQuotaData.totalKapasitas} Slot</div>
                <p className="text-[11px] text-emerald-700 mt-1">Kuota terdaftar di HFIS BPJS</p>
              </div>
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Kuota Terisi</span>
                <div className="text-2xl font-black text-blue-900 mt-1">{bpjsQuotaData.terisi} Pasien</div>
                <p className="text-[11px] text-blue-700 mt-1">Pasien telah registrasi / check-in</p>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Sisa Kuota Tersedia</span>
                <div className="text-2xl font-black text-amber-900 mt-1">{bpjsQuotaData.sisa} Slot</div>
                <p className="text-[11px] text-amber-700 mt-1">Dapat direservasi via Mobile JKN</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Poliklinik</th>
                    <th className="px-3.5 py-2.5">Nama DPJP</th>
                    <th className="px-3.5 py-2.5 text-center">Kuota BPJS</th>
                    <th className="px-3.5 py-2.5 text-center">Terisi</th>
                    <th className="px-3.5 py-2.5 text-center">Sisa</th>
                    <th className="px-3.5 py-2.5 text-center">Persentase</th>
                    <th className="px-3.5 py-2.5">Status Keterisian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bpjsQuotaData.breakdownList.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">{item.poli}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-800">{item.doctorName}</td>
                      <td className="px-3.5 py-2.5 text-center font-bold text-slate-700">{item.kuotaBpjs}</td>
                      <td className="px-3.5 py-2.5 text-center font-bold text-emerald-700">{item.terisi}</td>
                      <td className="px-3.5 py-2.5 text-center font-bold text-blue-700">{item.sisa}</td>
                      <td className="px-3.5 py-2.5 text-center font-bold">{item.persen}%</td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            item.persen >= 90
                              ? 'bg-rose-100 text-rose-800'
                              : item.persen >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.persen >= 90 ? 'Hampir Penuh' : item.persen >= 50 ? 'Sedang' : 'Tersedia'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. TARIF KAMAR RAWAT INAP & BOR
      ===================================================================== */}
      {isShow('ROOMS_BOR') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Tarif Kamar Rawat Inap & Tingkat Okupansi (BOR)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bed Occupancy Rate (BOR) keseluruhan dan per bangsal/kelas perawatan (VVIP, VIP, Kelas I, II, III, & Intensif).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900">
                BOR Rumah Sakit: <b>{borReportData.borPercentage}%</b> ({borReportData.occupiedBeds} Terisi / {borReportData.totalBeds} Bed)
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('ROOMS_BOR')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('ROOMS_BOR')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
                <span className="text-xs font-bold text-indigo-800">Total Kapasitas Bed</span>
                <div className="text-2xl font-black text-indigo-900 mt-1">{borReportData.totalBeds} Bed</div>
                <p className="text-[11px] text-slate-500 mt-1">Paviliun Firdaus & Na'im</p>
              </div>
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                <span className="text-xs font-bold text-rose-800">Bed Terisi Pasien</span>
                <div className="text-2xl font-black text-rose-900 mt-1">{borReportData.occupiedBeds} Bed</div>
                <p className="text-[11px] text-slate-500 mt-1">Okupansi saat ini</p>
              </div>
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-xs font-bold text-emerald-800">Bed Kosong (Tersedia)</span>
                <div className="text-2xl font-black text-emerald-900 mt-1">{borReportData.availableBeds} Bed</div>
                <p className="text-[11px] text-slate-500 mt-1">Siap pakai pasien baru</p>
              </div>
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50">
                <span className="text-xs font-bold text-teal-800">Standar BOR Kemenkes</span>
                <div className="text-2xl font-black text-teal-900 mt-1">60% - 85%</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Status RSUMB:{' '}
                  <b className={borReportData.borPercentage >= 60 && borReportData.borPercentage <= 85 ? 'text-emerald-700' : 'text-amber-700'}>
                    {borReportData.borPercentage >= 60 && borReportData.borPercentage <= 85 ? 'Ideal' : 'Perlu Evaluasi'}
                  </b>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Nama Ruangan</th>
                    <th className="px-3.5 py-2.5">Paviliun</th>
                    <th className="px-3.5 py-2.5">Kelas</th>
                    <th className="px-3.5 py-2.5 text-center">Total Bed</th>
                    <th className="px-3.5 py-2.5 text-center">Terisi</th>
                    <th className="px-3.5 py-2.5 text-center">Kosong</th>
                    <th className="px-3.5 py-2.5 text-center">BOR (%)</th>
                    <th className="px-3.5 py-2.5 text-right">Tarif Kamar/Hari</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {borReportData.roomList.map((room: any) => {
                    const borVal = room.totalBeds > 0 ? Math.round((room.occupiedBeds / room.totalBeds) * 100) : 0;
                    return (
                      <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">{room.name}</td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-600">{room.pavilion}</td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-800">{room.classLevel}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-slate-700">{room.totalBeds}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-rose-700">{room.occupiedBeds}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-emerald-700">{room.availableBeds}</td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              borVal >= 80
                                ? 'bg-rose-100 text-rose-800'
                                : borVal >= 50
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {borVal}%
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-black text-slate-900">
                          {formatRupiah(room.roomRatePerDay).replace(',00', '')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. OPERASI ELEKTIF IBS
      ===================================================================== */}
      {isShow('SURGERY') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Pasien Operasi Elektif (Instalasi Bedah Sentral)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekap status pasien operasi: Hadir/Selesai, Batal Operasi, Reschedule (Dijadwal Ulang), dan Terjadwal.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 font-bold">
                Total Operasi: <b>{surgeryReportData.totalOperasi} Pasien</b>
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('SURGERY')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('SURGERY')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">Hadir / Selesai</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-900 mt-2">{surgeryReportData.hadirCount} Pasien</div>
                <div className="mt-2 w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${surgeryReportData.hadirPct}%` }} />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800">Batal Operasi</span>
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-900 mt-2">{surgeryReportData.batalCount} Pasien</div>
                <div className="mt-2 w-full bg-rose-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: `${surgeryReportData.batalPct}%` }} />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Reschedule</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-900 mt-2">{surgeryReportData.rescheduleCount} Pasien</div>
                <div className="mt-2 w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: `${surgeryReportData.reschedulePct}%` }} />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800">Terjadwal</span>
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-900 mt-2">{surgeryReportData.terjadwalCount} Pasien</div>
                <div className="mt-2 w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${surgeryReportData.terjadwalPct}%` }} />
                </div>
              </div>
            </div>

            {/* Audit List of Batal & Reschedule */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Rincian Pasien Batal & Reschedule Operasi IBS</span>
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                    <tr>
                      <th className="px-3.5 py-2.5">Tgl Rencana</th>
                      <th className="px-3.5 py-2.5">Nama Pasien</th>
                      <th className="px-3.5 py-2.5">Poliklinik</th>
                      <th className="px-3.5 py-2.5">Dokter Operator</th>
                      <th className="px-3.5 py-2.5">Tindakan Bedah</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                      <th className="px-3.5 py-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {surgeryReportData.batalRescheduleList.length > 0 ? (
                      surgeryReportData.batalRescheduleList.map((op: any) => (
                        <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3.5 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                            {op.rencanaOp || op.tglPoli}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">{op.namaPasien} ({op.noRm})</td>
                          <td className="px-3.5 py-2.5 font-semibold text-slate-600">Poli {op.poli}</td>
                          <td className="px-3.5 py-2.5 text-slate-800 font-medium">{op.dokterOperator}</td>
                          <td className="px-3.5 py-2.5 font-semibold text-slate-700">{op.tindakanBedah}</td>
                          <td className="px-3.5 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                op.pelayanan === 'Batal'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {op.pelayanan}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 font-medium max-w-xs">
                            {op.keteranganBatalReschedule || 'Penyesuaian kondisi klinis / jadwal'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                          Tidak ada kasus pembatalan atau penjadwalan ulang operasi pada periode ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. KHITAN JUMAT BAROKAH
      ===================================================================== */}
      {isShow('KHITAN') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold">5</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Peserta Khitan Jumat Barokah
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Akumulasi peserta khitan massal rutin, capaian program, dan rincian anak yatim/dhuafa penerima santunan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900">
                Total Peserta: <b>{khitanReportData.totalPeserta} Anak</b> (Selesai: {khitanReportData.selesaiCount})
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('KHITAN')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('KHITAN')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-700 uppercase mb-3">Keterlaksanaan Program</h4>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span>Total Terdaftar:</span>
                    <strong className="text-slate-900">{khitanReportData.totalPeserta} Anak</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span>Selesai Dikhitan:</span>
                    <strong className="text-emerald-700 font-bold">{khitanReportData.selesaiCount} Anak</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span>Terdaftar/Menunggu:</span>
                    <strong className="text-blue-700">{khitanReportData.terdaftarCount} Anak</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Tingkat Capaian:</span>
                    <strong className="text-teal-700 font-black">{khitanReportData.completionRate}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5">No RM</th>
                    <th className="px-3.5 py-2.5">Nama Peserta</th>
                    <th className="px-3.5 py-2.5">Umur</th>
                    <th className="px-3.5 py-2.5">Nama Orang Tua</th>
                    <th className="px-3.5 py-2.5">Kategori</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {khitanReportData.pesertaList.slice(0, 5).map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-semibold text-slate-600">{p.noRm}</td>
                      <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">{p.nama}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">{p.usiaTahun} th</td>
                      <td className="px-3.5 py-2.5 text-slate-700">{p.namaOrangTua}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {p.kategori || 'Dhuafa'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. PLAFON JASA RAHARJA (KLL)
      ===================================================================== */}
      {isShow('JASA_RAHARJA') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-bold">6</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Plafon & Klaim Jasa Raharja (Kecelakaan Lalu Lintas)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring limit plafon santunan kecelakaan lalu lintas (KLL), biaya perawatan, dan pasien over-plafon.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900">
                Total Klaim: <b>{formatRupiah(jasaRaharjaReportData.totalNilaiKlaim).replace(',00', '')}</b> ({jasaRaharjaReportData.totalPasien} Kasus)
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('JASA_RAHARJA')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('JASA_RAHARJA')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                <span className="text-xs font-bold text-rose-800">Total Pasien KLL</span>
                <div className="text-2xl font-black text-rose-900 mt-1">{jasaRaharjaReportData.totalPasien} Kasus</div>
                <p className="text-[11px] text-slate-500 mt-1">Terverifikasi Laporan Polisi</p>
              </div>
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-xs font-bold text-emerald-800">Total Klaim Diajukan</span>
                <div className="text-xl font-black text-emerald-900 mt-1">
                  {formatRupiah(jasaRaharjaReportData.totalNilaiKlaim).replace(',00', '')}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Sesuai invoice SIMRS</p>
              </div>
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <span className="text-xs font-bold text-blue-800">Sisa Plafon Akumulatif</span>
                <div className="text-xl font-black text-blue-900 mt-1">
                  {formatRupiah(jasaRaharjaReportData.totalSisaPlafon).replace(',00', '')}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Batas plafon Rp 20 Jt/pasien</p>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="text-xs font-bold text-amber-800">Kasus Over Plafon</span>
                <div className="text-2xl font-black text-amber-900 mt-1">{jasaRaharjaReportData.pasienOverPlafon} Pasien</div>
                <p className="text-[11px] text-slate-500 mt-1">Dialihkan ke BPJS / Penjamin 2</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5">No RM</th>
                    <th className="px-3.5 py-2.5">Nama Pasien</th>
                    <th className="px-3.5 py-2.5">Tgl MRS</th>
                    <th className="px-3.5 py-2.5">Status Klaim</th>
                    <th className="px-3.5 py-2.5 text-right">Biaya Perawatan</th>
                    <th className="px-3.5 py-2.5 text-right">Klaim JR</th>
                    <th className="px-3.5 py-2.5 text-right">Sisa Plafon</th>
                    <th className="px-3.5 py-2.5 text-center">Status Plafon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jasaRaharjaReportData.list.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-slate-600">{item.noRm}</td>
                      <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">{item.namaPasien}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">{item.tanggalMasuk}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                          {item.statusKlaim}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-semibold text-slate-800">
                        {formatRupiah(item.totalBiayaPerawatan || 0).replace(',00', '')}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">
                        {formatRupiah(item.klaimDiajukan || 0).replace(',00', '')}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-blue-700">
                        {formatRupiah(item.sisaPlafon || 0).replace(',00', '')}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                            item.statusOverPlafon
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.statusOverPlafon ? 'Over Plafon (BPJS)' : 'Aman'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. CATATAN KHUSUS ADMISI
      ===================================================================== */}
      {isShow('PATIENT_NOTES') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold">7</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Catatan Khusus Admisi & Handover Shift
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekapitulasi alert admisi: kendala BPJS, verifikasi asuransi swasta, pasien beresiko, dan serah terima shift.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                Total Catatan: <b>{patientNotesReportData.totalCatatan} Kasus</b>
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('PATIENT_NOTES')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('PATIENT_NOTES')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 text-center">
                <span className="text-[11px] font-bold text-rose-800">BPJS Kendala</span>
                <div className="text-xl font-black text-rose-900 mt-1">{patientNotesReportData.bpjsKendalaCount}</div>
              </div>
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 text-center">
                <span className="text-[11px] font-bold text-blue-800">Asuransi Swasta</span>
                <div className="text-xl font-black text-blue-900 mt-1">{patientNotesReportData.asuransiCount}</div>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-center">
                <span className="text-[11px] font-bold text-amber-800">Kasus Laka KLL</span>
                <div className="text-xl font-black text-amber-900 mt-1">{patientNotesReportData.kllCount}</div>
              </div>
              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 text-center">
                <span className="text-[11px] font-bold text-purple-800">Umum Beresiko</span>
                <div className="text-xl font-black text-purple-900 mt-1">{patientNotesReportData.umumBeresikoCount}</div>
              </div>
              <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-teal-800">Handover Shift</span>
                <div className="text-xl font-black text-teal-900 mt-1">{patientNotesReportData.handoverShiftCount}</div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Kategori</th>
                    <th className="px-3.5 py-2.5">Nama Pasien</th>
                    <th className="px-3.5 py-2.5">No RM</th>
                    <th className="px-3.5 py-2.5">Deskripsi Masalah / Alasan Alert</th>
                    <th className="px-3.5 py-2.5">Tindak Lanjut / Solusi</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientNotesReportData.summaryList.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-800 border">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">{item.namaPasien}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-600">{item.noRm}</td>
                      <td className="px-3.5 py-2.5 text-slate-700 max-w-xs">{item.masalah}</td>
                      <td className="px-3.5 py-2.5 text-slate-600 max-w-xs">{item.solusi || '-'}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                            item.status === 'Resolved' || item.status === 'Handled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. DOKUMEN MASTER
      ===================================================================== */}
      {isShow('DOCS') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">8</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Audit & Ranking Penggunaan Dokumen Master
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Frekuensi pencetakan dan penggunaan templat formulir klinis, persetujuan tindakan, dan surat administrasi medis.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900">
                Total Digunakan: <b>{masterDocReportData.totalPenggunaan} Kali</b>
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('DOCS')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('DOCS')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5 text-center w-12">Rank</th>
                    <th className="px-3.5 py-2.5">Kode Dokumen</th>
                    <th className="px-3.5 py-2.5">Judul Formulir / Surat</th>
                    <th className="px-3.5 py-2.5">Kategori</th>
                    <th className="px-3.5 py-2.5 text-center">Penggunaan</th>
                    <th className="px-3.5 py-2.5 text-center">Proporsi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {masterDocReportData.rankedDocuments.map((doc: any, idx: number) => {
                    const pct = masterDocReportData.totalPenggunaan > 0
                      ? Math.round((doc.count / masterDocReportData.totalPenggunaan) * 100)
                      : 0;
                    return (
                      <tr key={doc.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="px-3.5 py-2.5 text-center font-bold">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-purple-900">{doc.kode}</td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">{doc.judul}</td>
                        <td className="px-3.5 py-2.5 text-slate-600">{doc.kategori}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-purple-700">{doc.count}x</td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px]">
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. HUBUNGI PASIEN (WA BROADCAST)
      ===================================================================== */}
      {isShow('WHATSAPP') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold">9</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Audit Validasi & Broadcast WhatsApp Pasien
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit keabsahan format nomor WhatsApp pasien rawat jalan, reminder jadwal, dan evaluasi nomor tidak valid.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900">
                Keabsahan: <b>{whatsappAuditData.terhubungiPct}% Valid</b> ({whatsappAuditData.terhubungiValidCount} dari {whatsappAuditData.totalPasien} Pasien)
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('WHATSAPP')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('WHATSAPP')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <span className="text-xs font-bold text-emerald-800">Nomor Valid & Terhubungi</span>
                <div className="text-2xl font-black text-emerald-900 mt-1">{whatsappAuditData.terhubungiValidCount} Pasien</div>
                <p className="text-[11px] text-emerald-700 mt-1">Format 628xxx sesuai standar WA</p>
              </div>
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60">
                <span className="text-xs font-bold text-rose-800">Nomor Salah / Belum Lengkap</span>
                <div className="text-2xl font-black text-rose-900 mt-1">{whatsappAuditData.salahWaCount} Pasien</div>
                <p className="text-[11px] text-rose-700 mt-1">Format angka &lt; 9 digit atau rusak</p>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                <span className="text-xs font-bold text-amber-800">Tanpa Nomor WhatsApp</span>
                <div className="text-2xl font-black text-amber-900 mt-1">{whatsappAuditData.tanpaWaCount} Pasien</div>
                <p className="text-[11px] text-amber-700 mt-1">Perlu pembaruan saat admisi/pendaftaran</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Tanggal</th>
                    <th className="px-3.5 py-2.5">Nama Pasien</th>
                    <th className="px-3.5 py-2.5">Poliklinik</th>
                    <th className="px-3.5 py-2.5">Dokter</th>
                    <th className="px-3.5 py-2.5">Nomor Terdaftar</th>
                    <th className="px-3.5 py-2.5 text-center">Status Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {whatsappAuditData.invalidSampleList.slice(0, 5).map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-semibold text-slate-600">{p.tanggalPelayanan}</td>
                      <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">{p.namaPasien}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">Poli {p.poliklinik}</td>
                      <td className="px-3.5 py-2.5 text-slate-800">{p.namaDokter}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-700">{p.noHp || '-'}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                            p.isValid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.statusKategori}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          10. KUPON FEE MOHAT
      ===================================================================== */}
      {isShow('KUPON_MOHAT') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">10</span>
                <h3 className="font-bold text-base text-slate-900">
                  Laporan Kupon Fee Mohat & Insentif Mitra Perujuk
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit klaim insentif rujukan: perujuk medis (Bidan/Perawat PKM) dan sopir operasional Mobil Sehat (Mohat).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                Total Insentif: <b>{formatRupiah(mohatReportData.totalFeeKumulatif).replace(',00', '')}</b> ({mohatReportData.totalKupon} Kupon)
              </span>
              <button
                type="button"
                onClick={() => onExportModulePdf('KUPON_MOHAT')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onExportModuleExcel('KUPON_MOHAT')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-xs font-bold text-emerald-800">Total Kupon Terbit</span>
                <div className="text-2xl font-black text-emerald-900 mt-1">{mohatReportData.totalKupon} Lembar</div>
                <p className="text-[11px] text-slate-500 mt-1">Tercatat di sistem kasir</p>
              </div>
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50">
                <span className="text-xs font-bold text-teal-800">Fee Tenaga Perujuk</span>
                <div className="text-xl font-black text-teal-900 mt-1">
                  {formatRupiah(mohatReportData.totalFeePerujuk).replace(',00', '')}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Bidan Desa / Perawat PKM</p>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="text-xs font-bold text-amber-800">Fee Sopir Mohat</span>
                <div className="text-xl font-black text-amber-900 mt-1">
                  {formatRupiah(mohatReportData.totalFeeSopir).replace(',00', '')}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Insentif armada antar-jemput</p>
              </div>
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <span className="text-xs font-bold text-blue-800">Status Pencairan</span>
                <div className="text-base font-bold text-slate-900 mt-1">
                  <span className="text-emerald-700">{mohatReportData.statusLunas} Lunas</span> /{' '}
                  <span className="text-amber-700">{mohatReportData.statusMenunggu} Kasir</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Real-time verifikasi kasir</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3.5 py-2.5">No Kupon</th>
                    <th className="px-3.5 py-2.5">Tgl Masuk</th>
                    <th className="px-3.5 py-2.5">Nama Pasien</th>
                    <th className="px-3.5 py-2.5">Perujuk</th>
                    <th className="px-3.5 py-2.5 text-right">Fee Perujuk</th>
                    <th className="px-3.5 py-2.5 text-right">Fee Sopir</th>
                    <th className="px-3.5 py-2.5 text-right">Total Insentif</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mohatReportData.list.map((k: any) => (
                    <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-emerald-800">{k.nomorKupon}</td>
                      <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{k.tanggalMasuk}</td>
                      <td className="px-3.5 py-2.5 font-bold text-[#0A2540]">{k.namaPasien}</td>
                      <td className="px-3.5 py-2.5 text-slate-700">{k.namaPerujuk}</td>
                      <td className="px-3.5 py-2.5 text-right font-semibold text-slate-800">
                        {formatRupiah(k.feePerujuk || 0).replace(',00', '')}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-semibold text-slate-800">
                        {formatRupiah(k.feeSopir || 0).replace(',00', '')}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-black text-emerald-700">
                        {formatRupiah(k.feeTotal || 0).replace(',00', '')}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                            k.status === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
