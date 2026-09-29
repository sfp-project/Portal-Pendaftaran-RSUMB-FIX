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
  Clock,
  ChevronRight
} from 'lucide-react';

export interface KpiModuleData {
  jadwalDokter: {
    totalAktif: number;
    totalPerubahan: number;
    totalLibur: number;
    totalMajuCuti: number;
  };
  kuotaBpjs: {
    totalKapasitas: number;
    terisi: number;
    sisa: number;
    persentaseTerisi: number;
  };
  rawatInapBor: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    borPercentage: number;
    vvipBor: number;
    kelas1Bor: number;
  };
  operasiElektif: {
    total: number;
    menungguTerjadwal: number;
    disetujuiHadir: number;
    selesai: number;
    batal: number;
    reschedule: number;
  };
  khitanJumat: {
    totalPeserta: number;
    selesai: number;
    terdaftar: number;
    capaianPersen: number;
    kategoriDhuafa: number;
  };
  jasaRaharja: {
    totalPasien: number;
    totalNilaiKlaim: number;
    totalSisaPlafon: number;
    pasienOverPlafon: number;
  };
  dokumenMaster: {
    totalPenggunaan: number;
    topDokumenJudul: string;
    topDokumenKode: string;
    totalTemplat: number;
  };
  catatanKhusus: {
    totalCatatan: number;
    kllCount: number;
    bpjsKendalaCount: number;
    asuransiCount: number;
    umumBeresikoCount: number;
    handoverShiftCount: number;
  };
  hubungiPasien: {
    totalPasien: number;
    terkirimValid: number;
    persenValid: number;
    gagalTanpaWa: number;
    persenGagal: number;
  };
  kuponMohat: {
    totalKupon: number;
    totalFeePerujuk: number;
    totalFeeSopir: number;
    totalFeeKumulatif: number;
    statusLunas: number;
    statusMenunggu: number;
  };
}

interface AnalyticsKpiCardsProps {
  data: KpiModuleData;
  activeSectionTab: string;
  onSelectTab: (tabId: any) => void;
}

const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

export const AnalyticsKpiCards: React.FC<AnalyticsKpiCardsProps> = ({
  data,
  activeSectionTab,
  onSelectTab
}) => {
  const {
    jadwalDokter,
    kuotaBpjs,
    rawatInapBor,
    operasiElektif,
    khitanJumat,
    jasaRaharja,
    dokumenMaster,
    catatanKhusus,
    hubungiPasien,
    kuponMohat
  } = data;

  return (
    <section aria-label="10 KPI Summary Cards Modul RSUMB" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>10 Modul Terintegrasi SIMRS & HFIS RSUMB</span>
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">
          Klik kartu untuk melihat rincian modul
        </span>
      </div>

      {/* 10 KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. JADWAL DOKTER */}
        <div
          onClick={() => onSelectTab('JADWAL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'JADWAL'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20'
              : 'border-slate-200/90 hover:border-amber-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              1. Jadwal Dokter
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 group-hover:scale-105 transition-transform">
              <CalendarX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {jadwalDokter.totalAktif}
            </span>
            <span className="text-xs font-semibold text-slate-500">Jadwal Aktif</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Perubahan: <b className="text-amber-700">{jadwalDokter.totalPerubahan}x</b></span>
            <span>Libur: <b className="text-rose-600">{jadwalDokter.totalLibur}</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Maju/Cuti: <b>{jadwalDokter.totalMajuCuti} DPJP</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 2. KUOTA BPJS & HFIS */}
        <div
          onClick={() => onSelectTab('KUOTA_BPJS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'KUOTA_BPJS'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
              : 'border-slate-200/90 hover:border-emerald-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              2. Kuota BPJS
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              {kuotaBpjs.persentaseTerisi}%
            </span>
            <span className="text-xs font-semibold text-slate-500">Keterisian</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Terisi: <b className="text-emerald-700">{kuotaBpjs.terisi}</b></span>
            <span>Sisa Kuota: <b className="text-blue-700">{kuotaBpjs.sisa}</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Kapasitas: <b>{kuotaBpjs.totalKapasitas} Pasien</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 3. TARIF KAMAR RAWAT INAP & BOR */}
        <div
          onClick={() => onSelectTab('ROOMS_BOR')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'ROOMS_BOR'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20'
              : 'border-slate-200/90 hover:border-indigo-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              3. Okupansi Bed (BOR)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 group-hover:scale-105 transition-transform">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-700 tracking-tight">
              {rawatInapBor.borPercentage}%
            </span>
            <span className="text-xs font-semibold text-slate-500">BOR RS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Terisi: <b className="text-indigo-900">{rawatInapBor.occupiedBeds} Bed</b></span>
            <span>Kosong: <b className="text-emerald-700">{rawatInapBor.availableBeds} Bed</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Total Bed: <b>{rawatInapBor.totalBeds} Bed</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 4. OPERASI ELEKTIF IBS */}
        <div
          onClick={() => onSelectTab('SURGERY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'SURGERY'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20'
              : 'border-slate-200/90 hover:border-blue-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              4. Operasi IBS
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-900 tracking-tight">
              {operasiElektif.total}
            </span>
            <span className="text-xs font-semibold text-slate-500">Pasien Operasi</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Hadir/Selesai: <b className="text-emerald-700">{operasiElektif.selesai || operasiElektif.disetujuiHadir}</b></span>
            <span>Menunggu: <b className="text-blue-600">{operasiElektif.menungguTerjadwal}</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Batal/Resched: <b className="text-rose-600">{operasiElektif.batal + operasiElektif.reschedule}</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 5. KHITAN JUMAT */}
        <div
          onClick={() => onSelectTab('KHITAN')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'KHITAN'
              ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md bg-teal-50/20'
              : 'border-slate-200/90 hover:border-teal-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              5. Khitan Jumat
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-teal-800 tracking-tight">
              {khitanJumat.totalPeserta}
            </span>
            <span className="text-xs font-semibold text-slate-500">Anak Terdaftar</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Selesai: <b className="text-emerald-700">{khitanJumat.selesai} Anak</b></span>
            <span>Capaian: <b className="text-teal-700">{khitanJumat.capaianPersen}%</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Dhuafa/Yatim: <b>{khitanJumat.kategoriDhuafa} Anak</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 6. PLAFON JASA RAHARJA */}
        <div
          onClick={() => onSelectTab('JASA_RAHARJA')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'JASA_RAHARJA'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md bg-rose-50/20'
              : 'border-slate-200/90 hover:border-rose-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              6. Plafon Jasa Raharja
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 group-hover:scale-105 transition-transform">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {jasaRaharja.totalPasien}
            </span>
            <span className="text-xs font-semibold text-slate-500">Pasien Laka</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Klaim JR: <b className="text-rose-700">{formatRupiah(jasaRaharja.totalNilaiKlaim).replace(',00', '')}</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Over Plafon: <b className={jasaRaharja.pasienOverPlafon > 0 ? 'text-rose-600' : 'text-emerald-600'}>{jasaRaharja.pasienOverPlafon} Pasien</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 7. DOKUMEN MASTER */}
        <div
          onClick={() => onSelectTab('DOCS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'DOCS'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md bg-purple-50/20'
              : 'border-slate-200/90 hover:border-purple-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              7. Dokumen Master
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-900 tracking-tight">
              {dokumenMaster.totalPenggunaan}
            </span>
            <span className="text-xs font-semibold text-slate-500">Penggunaan</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={dokumenMaster.topDokumenJudul}>
            Top: <b className="text-purple-700">{dokumenMaster.topDokumenKode || 'FRM-MED-01'}</b>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Katalog: <b>{dokumenMaster.totalTemplat} Format</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 8. CATATAN KHUSUS PASIEN */}
        <div
          onClick={() => onSelectTab('PATIENT_NOTES')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'PATIENT_NOTES'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20'
              : 'border-slate-200/90 hover:border-amber-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              8. Catatan Khusus Admisi
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-900 tracking-tight">
              {catatanKhusus.totalCatatan}
            </span>
            <span className="text-xs font-semibold text-slate-500">Kasus Admisi</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>BPJS: <b className="text-rose-600">{catatanKhusus.bpjsKendalaCount}</b></span>
            <span>Swasta: <b className="text-blue-600">{catatanKhusus.asuransiCount}</b></span>
            <span>KLL: <b className="text-amber-700">{catatanKhusus.kllCount}</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Handover: <b>{catatanKhusus.handoverShiftCount} Catatan</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 9. HUBUNGI PASIEN (WA BROADCAST) */}
        <div
          onClick={() => onSelectTab('WHATSAPP')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'WHATSAPP'
              ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md bg-teal-50/20'
              : 'border-slate-200/90 hover:border-teal-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              9. Hubungi Pasien (WA)
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200 group-hover:scale-105 transition-transform">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-teal-700 tracking-tight">
              {hubungiPasien.terkirimValid}
            </span>
            <span className="text-xs font-semibold text-slate-500">/ {hubungiPasien.totalPasien} Terkirim</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Valid: <b className="text-emerald-700">{hubungiPasien.persenValid}%</b></span>
            <span>Gagal/Tanpa WA: <b className="text-rose-600">{hubungiPasien.gagalTanpaWa}</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Keabsahan: <b>{hubungiPasien.persenValid}% Valid</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 10. KUPON FEE MOHAT */}
        <div
          onClick={() => onSelectTab('KUPON_MOHAT')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group bg-white shadow-xs ${
            activeSectionTab === 'KUPON_MOHAT'
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-md bg-emerald-50/20'
              : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              10. Kupon Fee Mohat
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">
              {kuponMohat.totalKupon}
            </span>
            <span className="text-xs font-semibold text-slate-500">Kupon Diterbitkan</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Total Fee: <b className="text-emerald-800">{formatRupiah(kuponMohat.totalFeeKumulatif).replace(',00', '')}</b></span>
          </p>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Perujuk: <b>{formatRupiah(kuponMohat.totalFeePerujuk).replace(',00', '')}</b></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </section>
  );
};
