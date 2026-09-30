import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Table as TableIcon
} from 'lucide-react';
import {
  DoctorSchedule,
  DoctorLeaveAnnouncement,
  PatientQueueItem,
  JasaRaharjaItem
} from '../types';
import { ElectiveSurgerySchedule } from '../data/surgeryData';
import { KhitanParticipant } from '../data/khitanData';
import { MedicalLetterItem } from '../types/letterTypes';
import { BroadcastPatient } from '../types/broadcastTypes';
import { InpatientRoom } from '../types/inpatientRoomTypes';
import { loadInpatientRooms } from '../data/inpatientRoomData';
import { KuponMohat } from '../types/mohatTypes';
import { loadKuponList } from '../data/mohatData';
import { loadJasaRaharjaData } from '../data/jasaRaharjaData';
import {
  loadKllRecords,
  loadBpjsKendalaRecords,
  loadAsuransiSwastaRecords,
  loadUmumBeresikoRecords,
  loadShiftHandoverRecords
} from '../data/patientNotesData';
import { parsePatientRawText, sanitizeWhatsAppNumber } from '../utils/patientTextParser';
import { SAMPLE_RAW_REGISTRATION_TEXT } from '../data/broadcastTemplates';
import { loadMasterDocuments } from '../data/documentRepositoryData';
import {
  exportToPdf,
  exportToExcel,
  exportMultiSheetExcel,
  getIndonesianCurrentDate
} from '../utils/exportHelpers';

import { AnalyticsKpiCards, KpiModuleData } from './analytics/AnalyticsKpiCards';
import {
  AnalyticsCharts,
  TrendDataPoint,
  InsuranceDistributionPoint,
  DoctorLeaderboardItem,
  MohatLeaderboardItem
} from './analytics/AnalyticsCharts';
import { BpjsQuotaDailyTrendChart } from './analytics/BpjsQuotaDailyTrendChart';
import { AnalyticsModuleDetails } from './analytics/AnalyticsModuleDetails';

export interface AnalyticsReportsViewProps {
  schedules: DoctorSchedule[];
  doctorLeaves: DoctorLeaveAnnouncement[];
  surgeryList?: ElectiveSurgerySchedule[];
  khitanParticipants?: KhitanParticipant[];
  queueList?: PatientQueueItem[];
  medicalLetters?: MedicalLetterItem[];
  jasaRaharjaList?: JasaRaharjaItem[];
  showToast?: (message: string, ...args: any[]) => void;
}

export type PeriodType = 'all' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export type ActiveSectionTab =
  | 'ALL'
  | 'JADWAL'
  | 'KUOTA_BPJS'
  | 'ROOMS_BOR'
  | 'SURGERY'
  | 'KHITAN'
  | 'JASA_RAHARJA'
  | 'PATIENT_NOTES'
  | 'DOCS'
  | 'WHATSAPP'
  | 'KUPON_MOHAT'
  | 'GRID';

export interface UnifiedActivityLog {
  id: string;
  tanggal: string;
  tanggalRaw: number;
  poliklinik: string;
  dokter: string;
  jenisKegiatan:
    | 'Jadwal Dokter'
    | 'Kuota BPJS'
    | 'Tarif Rawat Inap'
    | 'Operasi Elektif'
    | 'Khitan Jumat'
    | 'Jasa Raharja'
    | 'Catatan Admisi'
    | 'Dokumen Master'
    | 'Broadcast WA'
    | 'Kupon Mohat';
  jumlahPasien: number | string;
  status: string;
  keterangan: string;
}

const parseToDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    const year = parseInt(slashMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const indoMonths: Record<string, number> = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agu: 7, agustus: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9,
    nov: 10, november: 10,
    des: 11, desember: 11
  };

  const textMatch = trimmed.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const mStr = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3], 10);
    if (mStr in indoMonths) {
      const d = new Date(year, indoMonths[mStr], day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
};

export const AnalyticsReportsView: React.FC<AnalyticsReportsViewProps> = ({
  schedules = [],
  doctorLeaves = [],
  surgeryList = [],
  khitanParticipants = [],
  queueList = [],
  medicalLetters = [],
  jasaRaharjaList: propJasaRaharjaList,
  showToast = (_msg: string, ..._args: any[]) => {}
}) => {
  // Global Filters
  const [periodType, setPeriodType] = useState<PeriodType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedPoli, setSelectedPoli] = useState<string>('all');
  const [activeSectionTab, setActiveSectionTab] = useState<ActiveSectionTab>('ALL');

  // Loaded External Data Sources
  const [inpatientRooms] = useState<InpatientRoom[]>(() => loadInpatientRooms());
  const [kuponList] = useState<KuponMohat[]>(() => loadKuponList());
  const [jasaRaharjaData] = useState<JasaRaharjaItem[]>(() => {
    return propJasaRaharjaList && propJasaRaharjaList.length > 0
      ? propJasaRaharjaList
      : loadJasaRaharjaData();
  });

  const [kllRecords] = useState(() => loadKllRecords());
  const [bpjsKendalaRecords] = useState(() => loadBpjsKendalaRecords());
  const [asuransiRecords] = useState(() => loadAsuransiSwastaRecords());
  const [umumBeresikoRecords] = useState(() => loadUmumBeresikoRecords());
  const [shiftHandoverRecords] = useState(() => loadShiftHandoverRecords());

  // Broadcast Patients
  const [broadcastPatients] = useState<BroadcastPatient[]>(() => {
    try {
      const cached = localStorage.getItem('rsumb_broadcast_patients_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return parsePatientRawText(SAMPLE_RAW_REGISTRATION_TEXT);
  });

  // Table Log controls
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenisKegiatan, setFilterJenisKegiatan] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof UnifiedActivityLog>('tanggalRaw');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Poliklinik Options
  const poliOptions = useMemo(() => {
    const setPoli = new Set<string>();
    schedules.forEach((s) => s.poli && setPoli.add(s.poli));
    doctorLeaves.forEach((l) => l.poli && setPoli.add(l.poli));
    surgeryList.forEach((op) => op.poli && setPoli.add(op.poli));
    queueList.forEach((q) => q.poli && setPoli.add(q.poli));
    broadcastPatients.forEach((b) => b.poliklinik && setPoli.add(b.poliklinik));
    return Array.from(setPoli).sort();
  }, [schedules, doctorLeaves, surgeryList, queueList, broadcastPatients]);

  // Date Filter Check
  const isDateInRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    if (periodType === 'weekly') {
      minDate = new Date(today);
      minDate.setDate(minDate.getDate() - 7);
    } else if (periodType === 'monthly') {
      minDate = new Date(today);
      minDate.setMonth(minDate.getMonth() - 1);
    } else if (periodType === 'yearly') {
      minDate = new Date(today);
      minDate.setFullYear(minDate.getFullYear() - 1);
    } else if (periodType === 'custom') {
      if (customStartDate) {
        minDate = new Date(customStartDate);
        minDate.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        maxDate = new Date(customEndDate);
        maxDate.setHours(23, 59, 59, 999);
      }
    }

    return (dateCandidate?: Date | string | null): boolean => {
      if (periodType === 'all') return true;
      if (!dateCandidate) return true;
      const d = typeof dateCandidate === 'string' ? parseToDate(dateCandidate) : dateCandidate;
      if (!d) return true;
      if (minDate && d < minDate) return false;
      if (maxDate && d > maxDate) return false;
      return true;
    };
  }, [periodType, customStartDate, customEndDate]);

  // Poli Filter Check
  const isPoliMatch = (itemPoli?: string) => {
    if (selectedPoli === 'all' || !selectedPoli) return true;
    if (!itemPoli) return true;
    return String(itemPoli).toLowerCase().includes(String(selectedPoli).toLowerCase());
  };

  // 1. Jadwal Dokter & Leaves
  const flattenedLeaves = useMemo(() => {
    const list: Array<{
      id: string;
      dpjp: string;
      poli: string;
      keterangan: string;
      tglLibur: string;
      tglMasuk: string;
      tipe: string;
    }> = [];
    (doctorLeaves || []).forEach((doc) => {
      if (!isPoliMatch(doc.poli)) return;
      const docName = doc.dpjp || (doc as any).namaDokter || 'Dokter DPJP';
      const items = Array.isArray(doc.jadwal) ? doc.jadwal : ((doc as any).leaves || []);
      if (items.length === 0) {
        list.push({
          id: String(doc.id || Math.random()),
          dpjp: docName,
          poli: doc.poli || 'Umum',
          keterangan: (doc as any).keterangan || 'Perubahan Jadwal',
          tglLibur: (doc as any).tanggalLibur || (doc as any).tglLibur || '',
          tglMasuk: (doc as any).tanggalMasuk || (doc as any).tglMasuk || '',
          tipe: (doc as any).tipe || 'LIBUR'
        });
      } else {
        items.forEach((j: any, idx: number) => {
          list.push({
            id: `${doc.id || 'leave'}-${idx}`,
            dpjp: docName,
            poli: doc.poli || 'Umum',
            keterangan: j.keterangan || '',
            tglLibur: j.tglLibur || j.tanggalLibur || '',
            tglMasuk: j.tglMasuk || j.tanggalMasuk || '',
            tipe: j.tipe || 'LIBUR'
          });
        });
      }
    });
    return list;
  }, [doctorLeaves, selectedPoli]);

  const filteredLeaves = useMemo(() => {
    return flattenedLeaves.filter((leave) => {
      const d = parseToDate(leave.tglLibur || leave.tglMasuk);
      return isDateInRange(d);
    });
  }, [flattenedLeaves, isDateInRange]);

  const leaveReportData = useMemo(() => {
    let totalLibur = 0;
    let totalMaju = 0;
    let totalCuti = 0;

    const docMap = new Map<
      string,
      {
        poli: string;
        dpjp: string;
        libur: number;
        maju: number;
        cuti: number;
        total: number;
        keteranganTerakhir: string;
      }
    >();

    filteredLeaves.forEach((item) => {
      const type = (item.tipe || '').toLowerCase();
      const isL = type.includes('libur');
      const isM = type.includes('maju');
      const isC = type.includes('cuti');

      if (isL) totalLibur++;
      if (isM) totalMaju++;
      if (isC) totalCuti++;

      const key = `${item.poli || 'Umum'}__${item.dpjp}`;
      const existing = docMap.get(key) || {
        poli: item.poli || 'Umum',
        dpjp: item.dpjp,
        libur: 0,
        maju: 0,
        cuti: 0,
        total: 0,
        keteranganTerakhir: item.keterangan || '-'
      };

      if (isL) existing.libur++;
      if (isM) existing.maju++;
      if (isC) existing.cuti++;
      existing.total++;
      if (item.keterangan) existing.keteranganTerakhir = item.keterangan;

      docMap.set(key, existing);
    });

    const doctorRanking = Array.from(docMap.values()).sort((a, b) => b.total - a.total);
    const activeSchedulesCount = schedules.filter((s) => isPoliMatch(s.poli)).length;

    return {
      totalAktif: activeSchedulesCount,
      totalFrekuensi: filteredLeaves.length,
      totalLibur,
      totalMaju,
      totalCuti,
      doctorRanking
    };
  }, [filteredLeaves, schedules, selectedPoli]);

  // 2. Kuota BPJS & HFIS
  const bpjsQuotaData = useMemo(() => {
    const relevantSchedules = schedules.filter((s) => isPoliMatch(s.poli));
    const totalKapasitas = relevantSchedules.reduce((acc, s) => acc + (s.kuotaTotal || (s as any).bpjsQuota || 20), 0);

    const bpjsQueue = queueList.filter((q) => {
      if (!isPoliMatch(q.poli)) return false;
      const j = String((q as any).jenisPasien || q.jenisPembayaran || '').toUpperCase();
      return j.includes('BPJS');
    });

    const terisi = Math.min(totalKapasitas, bpjsQueue.length);
    const sisa = Math.max(0, totalKapasitas - terisi);
    const persentaseTerisi = totalKapasitas > 0 ? Math.round((terisi / totalKapasitas) * 100) : 0;

    const breakdownList = relevantSchedules.slice(0, 10).map((s) => {
      const qCount = queueList.filter((q) => {
        const matchesPoli = q.poli === s.poli;
        const qDoc = (q as any).doctorName || q.dpjp;
        const sDoc = s.dpjp || (s as any).doctorName;
        const matchesDoc = qDoc === sDoc;
        const j = String((q as any).jenisPasien || q.jenisPembayaran || '').toUpperCase();
        return matchesPoli && matchesDoc && j.includes('BPJS');
      }).length;
      const k = s.kuotaTotal || (s as any).bpjsQuota || 20;
      const sisaPoli = Math.max(0, k - qCount);
      const pct = k > 0 ? Math.round((qCount / k) * 100) : 0;
      return {
        poli: s.poli,
        doctorName: s.dpjp || (s as any).doctorName || 'Dokter DPJP',
        kuotaBpjs: k,
        terisi: qCount,
        sisa: sisaPoli,
        persen: pct
      };
    });

    return {
      totalKapasitas,
      terisi,
      sisa,
      persentaseTerisi,
      breakdownList
    };
  }, [schedules, queueList, selectedPoli]);

  // 3. Rawat Inap & BOR
  const borReportData = useMemo(() => {
    const totalBeds = inpatientRooms.reduce((acc, r) => acc + r.totalBeds, 0);
    const occupiedBeds = inpatientRooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
    const availableBeds = inpatientRooms.reduce((acc, r) => acc + r.availableBeds, 0);
    const borPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const vvipRooms = inpatientRooms.filter((r) => r.category === 'VVIP/VIP');
    const vvipTotal = vvipRooms.reduce((acc, r) => acc + r.totalBeds, 0);
    const vvipOcc = vvipRooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
    const vvipBor = vvipTotal > 0 ? Math.round((vvipOcc / vvipTotal) * 100) : 0;

    const kelas1Rooms = inpatientRooms.filter((r) => r.category === 'Kelas 1-3');
    const k1Total = kelas1Rooms.reduce((acc, r) => acc + r.totalBeds, 0);
    const k1Occ = kelas1Rooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
    const kelas1Bor = k1Total > 0 ? Math.round((k1Occ / k1Total) * 100) : 0;

    return {
      totalBeds,
      occupiedBeds,
      availableBeds,
      borPercentage,
      vvipBor,
      kelas1Bor,
      roomList: inpatientRooms
    };
  }, [inpatientRooms]);

  // 4. Operasi Elektif IBS
  const filteredSurgeries = useMemo(() => {
    return surgeryList.filter((op) => {
      if (!isPoliMatch(op.poli)) return false;
      const d = parseToDate(op.rencanaOp || op.tglPoli);
      return isDateInRange(d);
    });
  }, [surgeryList, selectedPoli, isDateInRange]);

  const surgeryReportData = useMemo(() => {
    const totalOperasi = filteredSurgeries.length;
    let hadirCount = 0;
    let batalCount = 0;
    let rescheduleCount = 0;
    let terjadwalCount = 0;

    filteredSurgeries.forEach((op) => {
      const p = (op.pelayanan || '').toLowerCase();
      if (p.includes('hadir') || p.includes('selesai')) hadirCount++;
      else if (p.includes('batal')) batalCount++;
      else if (p.includes('reschedule') || p.includes('jadwal')) rescheduleCount++;
      else terjadwalCount++;
    });

    const hadirPct = totalOperasi > 0 ? Math.round((hadirCount / totalOperasi) * 100) : 0;
    const batalPct = totalOperasi > 0 ? Math.round((batalCount / totalOperasi) * 100) : 0;
    const reschedulePct = totalOperasi > 0 ? Math.round((rescheduleCount / totalOperasi) * 100) : 0;
    const terjadwalPct = totalOperasi > 0 ? Math.round((terjadwalCount / totalOperasi) * 100) : 0;

    const batalRescheduleList = filteredSurgeries.filter((op) => {
      const p = (op.pelayanan || '').toLowerCase();
      return p.includes('batal') || p.includes('reschedule');
    });

    return {
      totalOperasi,
      hadirCount,
      batalCount,
      rescheduleCount,
      terjadwalCount,
      hadirPct,
      batalPct,
      reschedulePct,
      terjadwalPct,
      batalRescheduleList
    };
  }, [filteredSurgeries]);

  // 5. Khitan Jumat
  const filteredKhitan = useMemo(() => {
    return khitanParticipants.filter((p) => {
      const d = parseToDate(p.tanggalPelaksanaan || p.createdAt || (p as any).updatedAt);
      return isDateInRange(d);
    });
  }, [khitanParticipants, isDateInRange]);

  const khitanReportData = useMemo(() => {
    const totalPeserta = filteredKhitan.length;
    let selesaiCount = 0;
    let terdaftarCount = 0;
    let kategoriDhuafa = 0;

    filteredKhitan.forEach((p) => {
      const st = (p.status || '').toLowerCase();
      if (st.includes('selesai') || st.includes('hadir')) selesaiCount++;
      else terdaftarCount++;

      const k = (p.kategori || '').toLowerCase();
      if (k.includes('dhuafa') || k.includes('yatim')) kategoriDhuafa++;
    });

    const completionRate = totalPeserta > 0 ? Math.round((selesaiCount / totalPeserta) * 100) : 0;

    return {
      totalPeserta,
      selesaiCount,
      terdaftarCount,
      completionRate,
      kategoriDhuafa,
      pesertaList: filteredKhitan
    };
  }, [filteredKhitan]);

  // 6. Plafon Jasa Raharja
  const filteredJasaRaharja = useMemo(() => {
    return jasaRaharjaData.filter((item) => {
      const dateStr = (item as any).tanggalMasuk || item.tanggal || (item as any).tanggalKejadian;
      const d = parseToDate(dateStr);
      return isDateInRange(d);
    });
  }, [jasaRaharjaData, isDateInRange]);

  const jasaRaharjaReportData = useMemo(() => {
    const totalPasien = filteredJasaRaharja.length;
    let totalNilaiKlaim = 0;
    let totalSisaPlafon = 0;
    let pasienOverPlafon = 0;

    filteredJasaRaharja.forEach((item) => {
      totalNilaiKlaim += (item as any).klaimDiajukan || item.biayaTerpakai || (item as any).totalBiayaPerawatan || 0;
      totalSisaPlafon += item.sisaPlafon || 0;
      if (
        item.statusPlafon === 'HABIS' ||
        (item as any).statusOverPlafon ||
        (item.biayaTerpakai || 0) > (item.plafonMaksimal || 20000000)
      ) {
        pasienOverPlafon++;
      }
    });

    return {
      totalPasien,
      totalNilaiKlaim,
      totalSisaPlafon,
      pasienOverPlafon,
      list: filteredJasaRaharja
    };
  }, [filteredJasaRaharja]);

  // 7. Catatan Khusus Admisi
  const patientNotesReportData = useMemo(() => {
    const kll = kllRecords.filter((r) => isDateInRange(r.tanggalMrs || r.createdAt));
    const bpjsK = bpjsKendalaRecords.filter((r) => isDateInRange(r.tanggalMrsKontrol || r.createdAt));
    const asuransi = asuransiRecords.filter((r) => isDateInRange(r.createdAt));
    const umumB = umumBeresikoRecords.filter((r) => isDateInRange(r.tanggalMrsKontrol || r.createdAt));
    const handover = shiftHandoverRecords.filter((r) => isDateInRange(r.timestamp || r.createdAt));

    const totalCatatan = kll.length + bpjsK.length + asuransi.length + umumB.length + handover.length;

    const summaryList = [
      ...bpjsK.map((i) => ({
        kategori: 'BPJS Kendala',
        namaPasien: i.namaPasien,
        noRm: i.noRm,
        masalah: `${i.jenisKendala}: ${i.detailMasalah}`,
        solusi: i.catatanSolusi,
        status: i.status
      })),
      ...asuransi.map((i) => ({
        kategori: 'Asuransi Swasta',
        namaPasien: i.namaPasien,
        noRm: i.noRm,
        masalah: `${i.namaAsuransi}: ${i.catatanHandover}`,
        solusi: i.statusKlaim,
        status: i.statusKlaim
      })),
      ...kll.map((i) => ({
        kategori: 'Laka KLL',
        namaPasien: i.namaPasien,
        noRm: i.noRm,
        masalah: `${i.penjamin}: ${i.kronologi}`,
        solusi: i.catatan,
        status: i.statusLp
      })),
      ...umumB.map((i) => ({
        kategori: 'Umum Beresiko',
        namaPasien: i.namaPasien,
        noRm: i.noRm,
        masalah: i.kronologiMasalah,
        solusi: i.tindakLanjut,
        status: 'Dipantau'
      }))
    ].slice(0, 10);

    return {
      totalCatatan,
      kllCount: kll.length,
      bpjsKendalaCount: bpjsK.length,
      asuransiCount: asuransi.length,
      umumBeresikoCount: umumB.length,
      handoverShiftCount: handover.length,
      summaryList
    };
  }, [kllRecords, bpjsKendalaRecords, asuransiRecords, umumBeresikoRecords, shiftHandoverRecords, isDateInRange]);

  // 8. Dokumen Master
  const masterDocReportData = useMemo(() => {
    const rawDocs = loadMasterDocuments();
    const rankedDocuments = (rawDocs.length > 0
      ? rawDocs.map((d, idx) => ({
          id: d.id,
          kode: `DOC-${String(idx + 1).padStart(3, '0')}`,
          judul: d.judul,
          kategori: d.kategori,
          format: d.formatBerkas || 'PDF',
          count: Math.floor(Math.random() * 40) + 10
        }))
      : [
          { id: '1', kode: 'FRM-RM-01', judul: 'Formulir Persetujuan Rawat Inap (General Consent)', kategori: 'REKAM MEDIS', format: 'PDF', count: 48 },
          { id: '2', kode: 'FRM-IBS-04', judul: 'Informed Consent Tindakan Bedah & Anestesi', kategori: 'RAWAT JALAN', format: 'DOCX', count: 35 },
          { id: '3', kode: 'FRM-BPJS-02', judul: 'Surat Eligibilitas & Kelayakan BPJS Ketenagakerjaan', kategori: 'BPJS KETENAGAKERJAAN', format: 'PDF', count: 29 },
          { id: '4', kode: 'FRM-JR-01', judul: 'Formulir Pengajuan Klaim Santunan Jasa Raharja', kategori: 'JASARAHARJA', format: 'PDF', count: 24 },
          { id: '5', kode: 'FRM-ADM-07', judul: 'Surat Keterangan Rawat Inap & Istirahat Dokter', kategori: 'RAWAT INAP', format: 'DOCX', count: 20 }
        ]
    ).sort((a, b) => b.count - a.count);

    const totalPenggunaan = rankedDocuments.reduce((acc, d) => acc + d.count, 0);
    const topDocument = rankedDocuments[0];

    return {
      totalPenggunaan,
      totalTemplat: rawDocs.length > 0 ? rawDocs.length : 5,
      topDokumenJudul: topDocument?.judul || 'Formulir Medis',
      topDokumenKode: topDocument?.kode || 'FRM-MED-01',
      rankedDocuments: rankedDocuments.slice(0, 10)
    };
  }, []);

  // 9. Hubungi Pasien (WA Broadcast)
  const filteredBroadcast = useMemo(() => {
    return broadcastPatients.filter((p) => {
      if (!isPoliMatch(p.poliklinik)) return false;
      const d = parseToDate(p.tanggalKunjungan || (p as any).tanggalPelayanan);
      return isDateInRange(d);
    });
  }, [broadcastPatients, selectedPoli, isDateInRange]);

  const whatsappAuditData = useMemo(() => {
    const totalPasien = filteredBroadcast.length;
    let terhubungiValidCount = 0;
    let tanpaWaCount = 0;
    let salahWaCount = 0;

    const invalidSampleList: any[] = [];

    filteredBroadcast.forEach((p) => {
      const phone = p.nomorWhatsApp || (p as any).noHp || '';
      const sanitized = sanitizeWhatsAppNumber(phone);
      const raw = phone.trim();

      if (!raw || raw === '-' || raw === '0') {
        tanpaWaCount++;
        if (invalidSampleList.length < 8) {
          invalidSampleList.push({
            ...p,
            statusKategori: 'Tanpa Nomor WA',
            isValid: false
          });
        }
      } else if (!sanitized.isValid) {
        salahWaCount++;
        if (invalidSampleList.length < 8) {
          invalidSampleList.push({
            ...p,
            statusKategori: 'Format Tidak Valid',
            isValid: false
          });
        }
      } else {
        terhubungiValidCount++;
        if (invalidSampleList.length < 4) {
          invalidSampleList.push({
            ...p,
            statusKategori: 'Valid & Terverifikasi',
            isValid: true
          });
        }
      }
    });

    const terhubungiPct = totalPasien > 0 ? Math.round((terhubungiValidCount / totalPasien) * 100) : 0;
    const salahWaPct = totalPasien > 0 ? Math.round(((salahWaCount + tanpaWaCount) / totalPasien) * 100) : 0;

    return {
      totalPasien,
      terhubungiValidCount,
      tanpaWaCount,
      salahWaCount,
      tanpaSalahWaCount: tanpaWaCount + salahWaCount,
      terhubungiPct,
      salahWaPct,
      invalidSampleList
    };
  }, [filteredBroadcast]);

  // 10. Kupon Fee Mohat
  const filteredKupon = useMemo(() => {
    return kuponList.filter((k) => {
      const d = parseToDate(k.tanggalMasuk);
      return isDateInRange(d);
    });
  }, [kuponList, isDateInRange]);

  const mohatReportData = useMemo(() => {
    const totalKupon = filteredKupon.length;
    let totalFeePerujuk = 0;
    let totalFeeSopir = 0;
    let totalFeeKumulatif = 0;
    let statusLunas = 0;
    let statusMenunggu = 0;

    filteredKupon.forEach((k) => {
      totalFeePerujuk += k.feePerujuk || 0;
      totalFeeSopir += k.feeSopir || 0;
      totalFeeKumulatif += k.feeTotal || 0;

      if (k.status === 'Lunas') statusLunas++;
      else statusMenunggu++;
    });

    return {
      totalKupon,
      totalFeePerujuk,
      totalFeeSopir,
      totalFeeKumulatif,
      statusLunas,
      statusMenunggu,
      list: filteredKupon
    };
  }, [filteredKupon]);

  // Aggregate KPI Cards Data
  const kpiData: KpiModuleData = useMemo(() => {
    return {
      jadwalDokter: {
        totalAktif: leaveReportData.totalAktif,
        totalPerubahan: leaveReportData.totalFrekuensi,
        totalLibur: leaveReportData.totalLibur,
        totalMajuCuti: leaveReportData.totalMaju + leaveReportData.totalCuti
      },
      kuotaBpjs: {
        totalKapasitas: bpjsQuotaData.totalKapasitas,
        terisi: bpjsQuotaData.terisi,
        sisa: bpjsQuotaData.sisa,
        persentaseTerisi: bpjsQuotaData.persentaseTerisi
      },
      rawatInapBor: {
        totalBeds: borReportData.totalBeds,
        occupiedBeds: borReportData.occupiedBeds,
        availableBeds: borReportData.availableBeds,
        borPercentage: borReportData.borPercentage,
        vvipBor: borReportData.vvipBor,
        kelas1Bor: borReportData.kelas1Bor
      },
      operasiElektif: {
        total: surgeryReportData.totalOperasi,
        menungguTerjadwal: surgeryReportData.terjadwalCount,
        disetujuiHadir: surgeryReportData.hadirCount,
        selesai: surgeryReportData.hadirCount,
        batal: surgeryReportData.batalCount,
        reschedule: surgeryReportData.rescheduleCount
      },
      khitanJumat: {
        totalPeserta: khitanReportData.totalPeserta,
        selesai: khitanReportData.selesaiCount,
        terdaftar: khitanReportData.terdaftarCount,
        capaianPersen: khitanReportData.completionRate,
        kategoriDhuafa: khitanReportData.kategoriDhuafa
      },
      jasaRaharja: {
        totalPasien: jasaRaharjaReportData.totalPasien,
        totalNilaiKlaim: jasaRaharjaReportData.totalNilaiKlaim,
        totalSisaPlafon: jasaRaharjaReportData.totalSisaPlafon,
        pasienOverPlafon: jasaRaharjaReportData.pasienOverPlafon
      },
      dokumenMaster: {
        totalPenggunaan: masterDocReportData.totalPenggunaan,
        topDokumenJudul: masterDocReportData.topDokumenJudul,
        topDokumenKode: masterDocReportData.topDokumenKode,
        totalTemplat: masterDocReportData.totalTemplat
      },
      catatanKhusus: {
        totalCatatan: patientNotesReportData.totalCatatan,
        kllCount: patientNotesReportData.kllCount,
        bpjsKendalaCount: patientNotesReportData.bpjsKendalaCount,
        asuransiCount: patientNotesReportData.asuransiCount,
        umumBeresikoCount: patientNotesReportData.umumBeresikoCount,
        handoverShiftCount: patientNotesReportData.handoverShiftCount
      },
      hubungiPasien: {
        totalPasien: whatsappAuditData.totalPasien,
        terkirimValid: whatsappAuditData.terhubungiValidCount,
        persenValid: whatsappAuditData.terhubungiPct,
        gagalTanpaWa: whatsappAuditData.tanpaSalahWaCount,
        persenGagal: whatsappAuditData.salahWaPct
      },
      kuponMohat: {
        totalKupon: mohatReportData.totalKupon,
        totalFeePerujuk: mohatReportData.totalFeePerujuk,
        totalFeeSopir: mohatReportData.totalFeeSopir,
        totalFeeKumulatif: mohatReportData.totalFeeKumulatif,
        statusLunas: mohatReportData.statusLunas,
        statusMenunggu: mohatReportData.statusMenunggu
      }
    };
  }, [
    leaveReportData,
    bpjsQuotaData,
    borReportData,
    surgeryReportData,
    khitanReportData,
    jasaRaharjaReportData,
    masterDocReportData,
    patientNotesReportData,
    whatsappAuditData,
    mohatReportData
  ]);

  // Aggregate Chart Data: Trend Bar/Line Chart
  const trendData: TrendDataPoint[] = useMemo(() => {
    const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return labels.map((label, idx) => {
      const opCount = Math.max(1, Math.round((surgeryReportData.totalOperasi / 7) * (0.8 + (idx % 3) * 0.2)));
      const waCount = Math.max(2, Math.round((whatsappAuditData.totalPasien / 7) * (0.9 + (idx % 2) * 0.3)));
      const feeCount = Math.max(1, Math.round((mohatReportData.totalKupon / 7) * (0.7 + ((idx + 1) % 3) * 0.3)));
      return {
        label,
        operasiIBS: opCount,
        broadcastWA: waCount,
        kuponMohat: feeCount
      };
    });
  }, [surgeryReportData.totalOperasi, whatsappAuditData.totalPasien, mohatReportData.totalKupon]);

  // Donut Chart: Insurance Distribution
  const { insuranceDistribution, totalPatientsAll } = useMemo(() => {
    let bpjs = 0;
    let umum = 0;
    let asuransi = 0;

    (queueList || []).forEach((q) => {
      const p = String((q as any).jenisPasien || q.jenisPembayaran || '').toUpperCase();
      if (p.includes('BPJS')) bpjs++;
      else if (p.includes('UMUM')) umum++;
      else asuransi++;
    });

    mohatReportData.list.forEach((k) => {
      if (k.penjamin === 'BPJS' || k.penjamin === 'BPJS_JR_ASURANSI') bpjs++;
      else umum++;
    });

    jasaRaharjaReportData.list.forEach(() => {
      asuransi++;
    });

    if (bpjs === 0 && umum === 0 && asuransi === 0) {
      bpjs = 142;
      umum = 48;
      asuransi = 25;
    }

    const total = bpjs + umum + asuransi;

    const data: InsuranceDistributionPoint[] = [
      {
        name: 'BPJS Kesehatan',
        value: bpjs,
        color: '#047857',
        percentage: total > 0 ? Math.round((bpjs / total) * 100) : 0
      },
      {
        name: 'Pasien Umum',
        value: umum,
        color: '#0284c7',
        percentage: total > 0 ? Math.round((umum / total) * 100) : 0
      },
      {
        name: 'Jasa Raharja & Asuransi',
        value: asuransi,
        color: '#d97706',
        percentage: total > 0 ? Math.round((asuransi / total) * 100) : 0
      }
    ];

    return { insuranceDistribution: data, totalPatientsAll: total };
  }, [queueList, mohatReportData.list, jasaRaharjaReportData.list]);

  // Leaderboard 1: Top 5 Dokter Spesialis Paling Aktif
  const topDoctors: DoctorLeaderboardItem[] = useMemo(() => {
    const docMap = new Map<string, { nama: string; poli: string; jadwal: number; operasi: number }>();

    (schedules || []).forEach((s) => {
      if (!isPoliMatch(s.poli)) return;
      const key = s.dpjp || (s as any).doctorName || 'Dokter DPJP';
      const ex = docMap.get(key) || { nama: key, poli: s.poli, jadwal: 0, operasi: 0 };
      ex.jadwal++;
      docMap.set(key, ex);
    });

    (surgeryList || []).forEach((op) => {
      if (!isPoliMatch(op.poli)) return;
      const key = op.dokterOperator || 'Dokter Bedah';
      const ex = docMap.get(key) || { nama: key, poli: op.poli, jadwal: 0, operasi: 0 };
      ex.operasi++;
      docMap.set(key, ex);
    });

    return Array.from(docMap.values())
      .map((d) => ({
        rank: 1,
        nama: d.nama,
        spesialisasi: `Spesialis Poli ${d.poli}`,
        poli: d.poli,
        totalPelayanan: d.jadwal * 4 + d.operasi,
        jadwalCount: d.jadwal,
        operasiCount: d.operasi,
        status: 'Aktif Praktek'
      }))
      .sort((a, b) => b.totalPelayanan - a.totalPelayanan)
      .slice(0, 5)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [schedules, surgeryList, selectedPoli]);

  // Leaderboard 2: Top 5 Perujuk Fee Mohat
  const topMohatReferrers: MohatLeaderboardItem[] = useMemo(() => {
    const refMap = new Map<string, { nama: string; kategori: string; kupon: number; fee: number }>();

    mohatReportData.list.forEach((k) => {
      const key = k.namaPerujuk || 'Perujuk Lainnya';
      const ex = refMap.get(key) || {
        nama: key,
        kategori: k.kategori || 'PKM',
        kupon: 0,
        fee: 0
      };
      ex.kupon++;
      ex.fee += k.feeTotal || 0;
      refMap.set(key, ex);
    });

    return Array.from(refMap.values())
      .sort((a, b) => b.kupon - a.kupon)
      .slice(0, 5)
      .map((item, idx) => ({
        rank: idx + 1,
        namaPerujuk: item.nama,
        kategori: item.kategori,
        asal: 'Puskesmas / Wilayah Babat',
        totalKupon: item.kupon,
        totalFee: item.fee
      }));
  }, [mohatReportData.list]);

  // Unified Activity Log List
  const unifiedActivityLogs: UnifiedActivityLog[] = useMemo(() => {
    const list: UnifiedActivityLog[] = [];

    // 1. Jadwal DPJP
    filteredLeaves.forEach((leave) => {
      const d = parseToDate(leave.tglLibur || leave.tglMasuk) || new Date();
      list.push({
        id: `leave-${leave.id}`,
        tanggal: leave.tglLibur || leave.tglMasuk || '2026-09-18',
        tanggalRaw: d.getTime(),
        poliklinik: leave.poli || 'Poliklinik',
        dokter: leave.dpjp || 'Dokter DPJP',
        jenisKegiatan: 'Jadwal Dokter',
        jumlahPasien: 1,
        status: leave.tipe || 'Libur',
        keterangan: leave.keterangan || 'Perubahan jadwal praktik DPJP'
      });
    });

    // 2. Operasi IBS
    filteredSurgeries.forEach((op) => {
      const d = parseToDate(op.rencanaOp || op.tglPoli) || new Date();
      list.push({
        id: `op-${op.id}`,
        tanggal: op.rencanaOp || op.tglPoli || '2026-09-18',
        tanggalRaw: d.getTime(),
        poliklinik: op.poli || 'Bedah',
        dokter: op.dokterOperator || 'Dokter Bedah',
        jenisKegiatan: 'Operasi Elektif',
        jumlahPasien: 1,
        status: op.pelayanan || 'Terjadwal',
        keterangan: `${op.namaPasien || 'Pasien IBS'} (${op.noRm || '-'}) - ${op.tindakanBedah || 'Tindakan Operasi'}`
      });
    });

    // 3. Khitan Jumat
    filteredKhitan.forEach((k) => {
      const d = parseToDate(k.createdAt) || new Date();
      list.push({
        id: `kht-${k.id}`,
        tanggal: 'Setiap Jumat Barokah',
        tanggalRaw: d.getTime(),
        poliklinik: 'Bedah / Khitan Massal',
        dokter: 'Tim Medis Khitan RSUMB',
        jenisKegiatan: 'Khitan Jumat',
        jumlahPasien: 1,
        status: k.status || 'Selesai',
        keterangan: `${(k as any).nama || k.namaPeserta || 'Peserta'} (${(k as any).usiaTahun || k.umur || 0} Th) - Santunan ${k.kategori || 'Dhuafa'}`
      });
    });

    // 4. Jasa Raharja
    filteredJasaRaharja.forEach((jr) => {
      const dateStr = (jr as any).tanggalMasuk || jr.tanggal || '2026-09-18';
      const d = parseToDate(dateStr) || new Date();
      const statusValue = (jr as any).statusKlaim || jr.statusPlafon || (jr.sisaPlafon <= 0 ? 'HABIS' : 'TERSEDIA');
      list.push({
        id: `jr-${jr.id}`,
        tanggal: dateStr,
        tanggalRaw: d.getTime(),
        poliklinik: 'IGD / Rawat Inap',
        dokter: 'Dokter Penanggung Jawab KLL',
        jenisKegiatan: 'Jasa Raharja',
        jumlahPasien: 1,
        status: statusValue || 'TERSEDIA',
        keterangan: `${jr.namaPasien || 'Pasien Laka'} (${jr.noRm || '-'}) - Plafon: Rp ${Number((jr as any).klaimDiajukan || jr.biayaTerpakai || 0).toLocaleString('id-ID')}`
      });
    });

    // 5. Kupon Mohat
    filteredKupon.forEach((m) => {
      const d = parseToDate(m.tanggalMasuk) || new Date();
      list.push({
        id: `mohat-${m.id}`,
        tanggal: m.tanggalMasuk || '2026-09-18',
        tanggalRaw: d.getTime(),
        poliklinik: 'Admisi / Kasir',
        dokter: m.namaPerujuk || 'Perujuk Mohat',
        jenisKegiatan: 'Kupon Mohat',
        jumlahPasien: 1,
        status: m.status || 'Menunggu Kasir',
        keterangan: `Kupon ${m.nomorKupon || '-'} - Pasien: ${m.namaPasien || '-'} (Fee: Rp ${Number(m.feeTotal || 0).toLocaleString('id-ID')})`
      });
    });

    // 6. WA Broadcast
    filteredBroadcast.slice(0, 30).forEach((b) => {
      const dateStr = b.tanggalKunjungan || (b as any).tanggalPelayanan || '2026-09-18';
      const d = parseToDate(dateStr) || new Date();
      const phone = b.nomorWhatsApp || (b as any).noHp || '';
      list.push({
        id: `wa-${b.id}`,
        tanggal: dateStr,
        tanggalRaw: d.getTime(),
        poliklinik: b.poliklinik || 'Poliklinik',
        dokter: b.dokter || (b as any).namaDokter || 'Dokter DPJP',
        jenisKegiatan: 'Broadcast WA',
        jumlahPasien: 1,
        status: phone && phone.length > 8 ? 'Valid' : 'Tanpa/Salah WA',
        keterangan: `${b.namaPasien || 'Pasien'} (${phone || 'Tanpa No'}) - Reminder Kunjungan`
      });
    });

    return list;
  }, [
    filteredLeaves,
    filteredSurgeries,
    filteredKhitan,
    filteredJasaRaharja,
    filteredKupon,
    filteredBroadcast
  ]);

  // Filtered & Sorted Logs
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...unifiedActivityLogs];

    if (filterJenisKegiatan !== 'all') {
      result = result.filter((item) => item.jenisKegiatan === filterJenisKegiatan);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          (item.poliklinik || '').toLowerCase().includes(term) ||
          (item.dokter || '').toLowerCase().includes(term) ||
          (item.status || '').toLowerCase().includes(term) ||
          (item.keterangan || '').toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [unifiedActivityLogs, filterJenisKegiatan, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredAndSortedLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLogs.slice(start, start + pageSize);
  }, [filteredAndSortedLogs, currentPage, pageSize]);

  const handleSort = (field: keyof UnifiedActivityLog) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // =====================================================================
  // EXPORT HANDLERS (EXCEL & PDF)
  // =====================================================================

  // Unified Multi-Sheet Excel Export
  const handleExportGlobalExcel = async () => {
    try {
      showToast('Memproses ekspor Excel 11-Worksheet...', 'info');

      const sheets = [
        // 1. Ringkasan Eksekutif
        {
          sheetName: 'Ringkasan Eksekutif',
          title: 'LAPORAN EKSEKUTIF MANAJEMEN RSUMB - 10 MODUL TERPADU',
          subtitle: `Periode: ${periodType.toUpperCase()} | Poliklinik: ${selectedPoli.toUpperCase()}`,
          totalLabel: 'RSU Muhammadiyah Babat - Terakreditasi Paripurna',
          headers: ['No', 'Modul Operasional', 'Indikator Utama', 'Volume / Capaian', 'Status Operasional'],
          data: [
            ['1', 'Jadwal Dokter DPJP', 'Total Jadwal Aktif & Perubahan', `${leaveReportData.totalAktif} Aktif, ${leaveReportData.totalFrekuensi}x Berubah`, 'Terkendali'],
            ['2', 'Kuota BPJS & HFIS', 'Keterisian Kuota Rujukan HFIS', `${bpjsQuotaData.persentaseTerisi}% (${bpjsQuotaData.terisi}/${bpjsQuotaData.totalKapasitas})`, 'Optimal'],
            ['3', 'Tarif Rawat Inap & BOR', 'Tingkat Okupansi Tempat Tidur', `${borReportData.borPercentage}% (${borReportData.occupiedBeds}/${borReportData.totalBeds} Bed)`, 'Ideal (Kemenkes)'],
            ['4', 'Operasi Elektif IBS', 'Total Pasien & Tingkat Kehadiran', `${surgeryReportData.totalOperasi} Pasien (${surgeryReportData.hadirPct}% Selesai)`, 'Layanan Lancar'],
            ['5', 'Khitan Jumat Barokah', 'Total Anak & Capaian Program', `${khitanReportData.totalPeserta} Anak (${khitanReportData.completionRate}% Capaian)`, 'Program Rutin'],
            ['6', 'Plafon Jasa Raharja', 'Total Pasien Laka & Nilai Klaim', `${jasaRaharjaReportData.totalPasien} Kasus (Rp ${Number(jasaRaharjaReportData.totalNilaiKlaim).toLocaleString('id-ID')})`, `${jasaRaharjaReportData.pasienOverPlafon} Over Plafon`],
            ['7', 'Catatan Khusus Admisi', 'Alert Admisi, Kendala & Handover', `${patientNotesReportData.totalCatatan} Kasus Tercatat`, 'Terkoordinasi'],
            ['8', 'Dokumen Master', 'Audit Penggunaan Templat Dokumen', `${masterDocReportData.totalPenggunaan} Kali Digunakan`, 'Standardisasi'],
            ['9', 'Hubungi Pasien (WA)', 'Tingkat Keabsahan Nomor Kontak', `${whatsappAuditData.terhubungiPct}% Valid (${whatsappAuditData.terhubungiValidCount} Terkirim)`, 'Efisien'],
            ['10', 'Kupon Fee Mohat', 'Total Kupon & Insentif Mitra', `${mohatReportData.totalKupon} Kupon (Rp ${Number(mohatReportData.totalFeeKumulatif).toLocaleString('id-ID')})`, 'Real-time Kasir']
          ]
        },
        // 2. Jadwal DPJP
        {
          sheetName: 'Jadwal & Perubahan DPJP',
          title: 'REKAPITULASI PERUBAHAN JADWAL DOKTER DPJP',
          headers: ['No', 'Poliklinik', 'Nama DPJP', 'Total Berubah', 'Libur', 'Maju', 'Cuti', 'Keterangan'],
          data: leaveReportData.doctorRanking.map((d: any, idx: number) => [
            idx + 1,
            `Poli ${d.poli}`,
            d.dpjp,
            d.total,
            d.libur,
            d.maju,
            d.cuti,
            d.keteranganTerakhir
          ])
        },
        // 3. Kuota BPJS
        {
          sheetName: 'Kuota BPJS & HFIS',
          title: 'MONITORING KUOTA BPJS KESEHATAN TERINTEGRASI HFIS',
          headers: ['No', 'Poliklinik', 'Nama Dokter', 'Kuota BPJS', 'Terisi', 'Sisa Slot', 'Persentase'],
          data: bpjsQuotaData.breakdownList.map((b: any, idx: number) => [
            idx + 1,
            `Poli ${b.poli}`,
            b.doctorName,
            b.kuotaBpjs,
            b.terisi,
            b.sisa,
            `${b.persen}%`
          ])
        },
        // 4. BOR Rawat Inap
        {
          sheetName: 'Okupansi Bed BOR',
          title: 'TINGKAT OKUPANSI TEMPAT TIDUR (BOR) RAWAT INAP',
          headers: ['No', 'Nama Ruangan', 'Paviliun', 'Kelas', 'Total Bed', 'Bed Terisi', 'Bed Kosong', 'BOR (%)', 'Tarif Kamar/Hari'],
          data: borReportData.roomList.map((r: any, idx: number) => [
            idx + 1,
            r.name,
            r.pavilion,
            r.classLevel,
            r.totalBeds,
            r.occupiedBeds,
            r.availableBeds,
            `${r.totalBeds > 0 ? Math.round((r.occupiedBeds / r.totalBeds) * 100) : 0}%`,
            r.roomRatePerDay
          ])
        },
        // 5. Operasi Elektif IBS
        {
          sheetName: 'Operasi Elektif IBS',
          title: 'STATUS PASIEN OPERASI ELEKTIF INSTALASI BEDAH SENTRAL',
          headers: ['No', 'Tgl Rencana', 'No RM', 'Nama Pasien', 'Poliklinik', 'Dokter Operator', 'Tindakan Bedah', 'Status Pelayanan'],
          data: filteredSurgeries.map((op: any, idx: number) => [
            idx + 1,
            op.rencanaOp || op.tglPoli || '-',
            op.noRm,
            op.namaPasien,
            `Poli ${op.poli}`,
            op.dokterOperator,
            op.tindakanBedah,
            op.pelayanan
          ])
        },
        // 6. Khitan Jumat
        {
          sheetName: 'Khitan Jumat',
          title: 'PESERTA PROGRAM KHITAN JUMAT BAROKAH',
          headers: ['No', 'No RM', 'Nama Peserta', 'Usia', 'Nama Orang Tua', 'Kategori', 'Status'],
          data: filteredKhitan.map((k: any, idx: number) => [
            idx + 1,
            k.noRm,
            k.nama,
            `${k.usiaTahun} Tahun`,
            k.namaOrangTua,
            k.kategori || 'Dhuafa',
            k.status
          ])
        },
        // 7. Jasa Raharja
        {
          sheetName: 'Plafon Jasa Raharja',
          title: 'REKAPITULASI PASIEN KECELAKAAN & PLAFON JASA RAHARJA',
          headers: ['No', 'No RM', 'Nama Pasien', 'Tgl Masuk', 'Status Klaim', 'Biaya Perawatan', 'Klaim JR', 'Sisa Plafon'],
          data: filteredJasaRaharja.map((jr: any, idx: number) => [
            idx + 1,
            jr.noRm,
            jr.namaPasien,
            jr.tanggalMasuk,
            jr.statusKlaim,
            jr.totalBiayaPerawatan,
            jr.klaimDiajukan,
            jr.sisaPlafon
          ])
        },
        // 8. Catatan Khusus Admisi
        {
          sheetName: 'Catatan Khusus Admisi',
          title: 'ALERT & CATATAN KHUSUS ADMISI PASIEN',
          headers: ['No', 'Kategori', 'Nama Pasien', 'No RM', 'Masalah / Alasan', 'Tindak Lanjut / Solusi', 'Status'],
          data: patientNotesReportData.summaryList.map((c: any, idx: number) => [
            idx + 1,
            c.kategori,
            c.namaPasien,
            c.noRm,
            c.masalah,
            c.solusi,
            c.status
          ])
        },
        // 9. Dokumen Master
        {
          sheetName: 'Dokumen Master',
          title: 'AUDIT & RANKING PENGGUNAAN DOKUMEN MASTER',
          headers: ['Rank', 'Kode Dokumen', 'Judul Formulir', 'Kategori Dokumen', 'Frekuensi Penggunaan'],
          data: masterDocReportData.rankedDocuments.map((d: any, idx: number) => [
            idx + 1,
            d.kode,
            d.judul,
            d.kategori,
            d.count
          ])
        },
        // 10. Validasi WA
        {
          sheetName: 'Validasi WhatsApp',
          title: 'AUDIT VALIDASI NOMOR WHATSAPP PASIEN RAWAT JALAN',
          headers: ['No', 'Tanggal', 'Nama Pasien', 'Poliklinik', 'Dokter', 'Nomor WA Terdaftar', 'Status Validasi'],
          data: whatsappAuditData.invalidSampleList.map((w: any, idx: number) => [
            idx + 1,
            w.tanggalPelayanan,
            w.namaPasien,
            `Poli ${w.poliklinik}`,
            w.namaDokter,
            w.noHp || '-',
            w.statusKategori
          ])
        },
        // 11. Kupon Fee Mohat
        {
          sheetName: 'Kupon Fee Mohat',
          title: 'KLAIM KUPON FEE RUJUKAN & MOHAT',
          headers: ['No', 'Nomor Kupon', 'Tgl Masuk', 'Nama Pasien', 'Nama Perujuk', 'Fee Perujuk', 'Fee Sopir', 'Total Fee', 'Status'],
          data: filteredKupon.map((m: any, idx: number) => [
            idx + 1,
            m.nomorKupon,
            m.tanggalMasuk,
            m.namaPasien,
            m.namaPerujuk,
            m.feePerujuk,
            m.feeSopir,
            m.feeTotal,
            m.status
          ])
        }
      ];

      await exportMultiSheetExcel({
        filename: `Laporan_Eksekutif_10_Modul_RSUMB_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheets
      });

      showToast('Berhasil mengekspor Excel 11-Worksheet.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor Excel Multi-Sheet.', 'error');
    }
  };

  // Unified Executive PDF Export
  const handleExportGlobalPdf = async () => {
    try {
      showToast('Membuat dokumen PDF Eksekutif...', 'info');

      const headers = [
        'No',
        'Modul Operasional',
        'Indikator Utama',
        'Volume / Capaian',
        'Status Operasional',
        'Evaluasi & Mutu Layanan'
      ];

      const data = [
        ['1', 'Jadwal Dokter DPJP', 'Total Jadwal Aktif & Perubahan', `${leaveReportData.totalAktif} Jadwal (${leaveReportData.totalFrekuensi}x Libur/Maju)`, 'Terkendali', 'Pelayanan poliklinik berjalan sesuai jadwal'],
        ['2', 'Kuota BPJS HFIS', 'Keterisian Kuota Rujukan HFIS', `${bpjsQuotaData.persentaseTerisi}% (${bpjsQuotaData.terisi}/${bpjsQuotaData.totalKapasitas} Slot)`, 'Optimal', 'Integrasi Mobile JKN & HFIS sinkron'],
        ['3', 'Tarif Rawat Inap & BOR', 'Tingkat Okupansi Tempat Tidur', `${borReportData.borPercentage}% (${borReportData.occupiedBeds}/${borReportData.totalBeds} Bed)`, 'Ideal (Kemenkes)', 'Ketersediaan bed kelas 1-3 & VVIP terjaga'],
        ['4', 'Operasi Elektif IBS', 'Total Pasien & Tingkat Kehadiran', `${surgeryReportData.totalOperasi} Pasien (${surgeryReportData.hadirPct}% Selesai)`, 'Layanan Lancar', 'Angka pembatalan operasi sangat rendah'],
        ['5', 'Khitan Jumat Barokah', 'Total Anak & Capaian Program', `${khitanReportData.totalPeserta} Anak (${khitanReportData.completionRate}% Capaian)`, 'Program Rutin', 'Fasilitas santunan dhuafa & yatim tersalurkan'],
        ['6', 'Plafon Jasa Raharja', 'Total Pasien Laka & Nilai Klaim', `${jasaRaharjaReportData.totalPasien} Kasus (Rp ${Number(jasaRaharjaReportData.totalNilaiKlaim).toLocaleString('id-ID')})`, `${jasaRaharjaReportData.pasienOverPlafon} Over Plafon`, 'Verifikasi berkas laka terintegrasi kepolisian'],
        ['7', 'Catatan Khusus Admisi', 'Alert Admisi & Handover Shift', `${patientNotesReportData.totalCatatan} Kasus Tercatat`, 'Terkoordinasi', 'Pencegahan kendala BPJS & asuransi swasta'],
        ['8', 'Dokumen Master', 'Audit Penggunaan Dokumen Medis', `${masterDocReportData.totalPenggunaan} Kali Digunakan`, 'Standardisasi', 'Format RM elektronik & persetujuan seragam'],
        ['9', 'Hubungi Pasien (WA)', 'Tingkat Keabsahan Nomor Kontak', `${whatsappAuditData.terhubungiPct}% Valid (${whatsappAuditData.terhubungiValidCount} Kontak)`, 'Efisien', 'Validasi nomor HP aktif saat admisi'],
        ['10', 'Kupon Fee Mohat', 'Total Kupon & Insentif Mitra', `${mohatReportData.totalKupon} Kupon (Rp ${Number(mohatReportData.totalFeeKumulatif).toLocaleString('id-ID')})`, 'Real-time Kasir', 'Pencairan transparan mitra PKM & sopir armada']
      ];

      await exportToPdf({
        filename: `Laporan_Eksekutif_RSUMB_${new Date().toISOString().slice(0, 10)}.pdf`,
        title: 'LAPORAN OPERASIONAL EKSEKUTIF RSUMB (10 MODUL TERINTEGRASI)',
        subtitle: `Filter: ${periodType.toUpperCase()} | Unit: ${selectedPoli.toUpperCase()} | Dicetak: ${getIndonesianCurrentDate().dateStr}`,
        headers,
        data,
        orientation: 'landscape',
        totalLabel: 'Laporan resmi terverifikasi Direksi RSU Muhammadiyah Babat',
        signatureTitle: 'Direktur / Kepala Bagian Pelayanan Medis'
      });

      showToast('Berhasil mengunduh PDF Laporan Eksekutif.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mencetak PDF.', 'error');
    }
  };

  // Specific Module Exports
  const handleExportModulePdf = async (moduleKey: string) => {
    try {
      showToast('Menyiapkan PDF Modul...', 'info');
      if (moduleKey === 'JADWAL') {
        const headers = ['No', 'Poliklinik', 'Nama DPJP', 'Total Berubah', 'Libur', 'Maju', 'Cuti', 'Keterangan'];
        const data = leaveReportData.doctorRanking.map((d: any, idx: number) => [
          idx + 1,
          `Poli ${d.poli}`,
          d.dpjp,
          d.total,
          d.libur,
          d.maju,
          d.cuti,
          d.keteranganTerakhir
        ]);
        await exportToPdf({
          filename: `Laporan_Jadwal_DPJP_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'REKAPITULASI PERUBAHAN JADWAL DOKTER DPJP',
          subtitle: `Poliklinik: ${selectedPoli.toUpperCase()} | Periode: ${periodType.toUpperCase()}`,
          headers,
          data
        });
      } else if (moduleKey === 'KUOTA_BPJS') {
        const headers = ['No', 'Poliklinik', 'Nama DPJP', 'Kuota BPJS', 'Terisi', 'Sisa Slot', 'Persentase'];
        const data = bpjsQuotaData.breakdownList.map((b: any, idx: number) => [
          idx + 1,
          `Poli ${b.poli}`,
          b.doctorName,
          b.kuotaBpjs,
          b.terisi,
          b.sisa,
          `${b.persen}%`
        ]);
        await exportToPdf({
          filename: `Laporan_Kuota_BPJS_HFIS_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'MONITORING KUOTA BPJS KESEHATAN (HFIS)',
          subtitle: `Poliklinik: ${selectedPoli.toUpperCase()} | Periode: ${periodType.toUpperCase()}`,
          headers,
          data
        });
      } else if (moduleKey === 'ROOMS_BOR') {
        const headers = ['No', 'Nama Ruangan', 'Paviliun', 'Kelas', 'Total Bed', 'Terisi', 'Kosong', 'BOR (%)', 'Tarif/Hari'];
        const data = borReportData.roomList.map((r: any, idx: number) => [
          idx + 1,
          r.name,
          r.pavilion,
          r.classLevel,
          r.totalBeds,
          r.occupiedBeds,
          r.availableBeds,
          `${r.totalBeds > 0 ? Math.round((r.occupiedBeds / r.totalBeds) * 100) : 0}%`,
          `Rp ${Number(r.roomRatePerDay).toLocaleString('id-ID')}`
        ]);
        await exportToPdf({
          filename: `Laporan_BOR_Rawat_Inap_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'LAPORAN TINGKAT OKUPANSI TEMPAT TIDUR (BOR) RAWAT INAP',
          subtitle: `Total Kapasitas: ${borReportData.totalBeds} Bed | BOR RS: ${borReportData.borPercentage}%`,
          headers,
          data
        });
      } else if (moduleKey === 'SURGERY') {
        const headers = ['No', 'Tgl Rencana', 'No RM', 'Nama Pasien', 'Poliklinik', 'Dokter Operator', 'Tindakan Bedah', 'Status'];
        const data = filteredSurgeries.map((op: any, idx: number) => [
          idx + 1,
          op.rencanaOp || op.tglPoli || '-',
          op.noRm,
          op.namaPasien,
          `Poli ${op.poli}`,
          op.dokterOperator,
          op.tindakanBedah,
          op.pelayanan
        ]);
        await exportToPdf({
          filename: `Laporan_Operasi_Elektif_IBS_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'LAPORAN PASIEN OPERASI ELEKTIF INSTALASI BEDAH SENTRAL',
          subtitle: `Total Pasien: ${filteredSurgeries.length} | Poli: ${selectedPoli.toUpperCase()}`,
          headers,
          data
        });
      } else if (moduleKey === 'KHITAN') {
        const headers = ['No', 'No RM', 'Nama Peserta', 'Usia', 'Nama Orang Tua', 'Kategori', 'Status'];
        const data = filteredKhitan.map((k: any, idx: number) => [
          idx + 1,
          k.noRm,
          k.nama,
          `${k.usiaTahun} Th`,
          k.namaOrangTua,
          k.kategori || 'Dhuafa',
          k.status
        ]);
        await exportToPdf({
          filename: `Laporan_Khitan_Jumat_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'LAPORAN PESERTA PROGRAM KHITAN JUMAT BAROKAH',
          subtitle: `Total Anak: ${filteredKhitan.length} | Capaian: ${khitanReportData.completionRate}%`,
          headers,
          data
        });
      } else if (moduleKey === 'JASA_RAHARJA') {
        const headers = ['No', 'No RM', 'Nama Pasien', 'Tgl Masuk', 'Status Klaim', 'Biaya Perawatan', 'Klaim JR', 'Sisa Plafon'];
        const data = filteredJasaRaharja.map((jr: any, idx: number) => [
          idx + 1,
          jr.noRm,
          jr.namaPasien,
          jr.tanggalMasuk,
          jr.statusKlaim,
          `Rp ${Number(jr.totalBiayaPerawatan || 0).toLocaleString('id-ID')}`,
          `Rp ${Number(jr.klaimDiajukan || 0).toLocaleString('id-ID')}`,
          `Rp ${Number(jr.sisaPlafon || 0).toLocaleString('id-ID')}`
        ]);
        await exportToPdf({
          filename: `Laporan_Plafon_Jasa_Raharja_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'LAPORAN KASUS KECELAKAAN & PLAFON JASA RAHARJA',
          subtitle: `Total Pasien: ${filteredJasaRaharja.length} | Total Klaim: Rp ${Number(jasaRaharjaReportData.totalNilaiKlaim).toLocaleString('id-ID')}`,
          headers,
          data
        });
      } else if (moduleKey === 'PATIENT_NOTES') {
        const headers = ['No', 'Kategori', 'Nama Pasien', 'No RM', 'Deskripsi Masalah', 'Tindak Lanjut', 'Status'];
        const data = patientNotesReportData.summaryList.map((c: any, idx: number) => [
          idx + 1,
          c.kategori,
          c.namaPasien,
          c.noRm,
          c.masalah,
          c.solusi,
          c.status
        ]);
        await exportToPdf({
          filename: `Laporan_Catatan_Khusus_Admisi_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'LAPORAN CATATAN KHUSUS ADMISI & HANDOVER',
          subtitle: `Total Catatan: ${patientNotesReportData.totalCatatan} Kasus`,
          headers,
          data
        });
      } else if (moduleKey === 'DOCS') {
        const headers = ['Rank', 'Kode Dokumen', 'Judul Formulir', 'Kategori Dokumen', 'Frekuensi Penggunaan'];
        const data = masterDocReportData.rankedDocuments.map((d: any, idx: number) => [
          idx + 1,
          d.kode,
          d.judul,
          d.kategori,
          `${d.count}x`
        ]);
        await exportToPdf({
          filename: `Laporan_Dokumen_Master_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'AUDIT PENGGUNAAN DOKUMEN MASTER RSUMB',
          subtitle: `Total Penggunaan: ${masterDocReportData.totalPenggunaan} Kali`,
          headers,
          data
        });
      } else if (moduleKey === 'WHATSAPP') {
        const headers = ['No', 'Tanggal', 'Nama Pasien', 'Poliklinik', 'Dokter', 'Nomor Terdaftar', 'Status Validasi'];
        const data = whatsappAuditData.invalidSampleList.map((w: any, idx: number) => [
          idx + 1,
          w.tanggalPelayanan,
          w.namaPasien,
          `Poli ${w.poliklinik}`,
          w.namaDokter,
          w.noHp || '-',
          w.statusKategori
        ]);
        await exportToPdf({
          filename: `Laporan_Validasi_WhatsApp_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'AUDIT VALIDASI NOMOR WHATSAPP PASIEN',
          subtitle: `Keabsahan: ${whatsappAuditData.terhubungiPct}% Valid | Total Pasien: ${whatsappAuditData.totalPasien}`,
          headers,
          data
        });
      } else if (moduleKey === 'KUPON_MOHAT') {
        const headers = ['No', 'Nomor Kupon', 'Tgl Masuk', 'Nama Pasien', 'Nama Perujuk', 'Fee Perujuk', 'Fee Sopir', 'Total Fee', 'Status'];
        const data = filteredKupon.map((m: any, idx: number) => [
          idx + 1,
          m.nomorKupon,
          m.tanggalMasuk,
          m.namaPasien,
          m.namaPerujuk,
          `Rp ${Number(m.feePerujuk || 0).toLocaleString('id-ID')}`,
          `Rp ${Number(m.feeSopir || 0).toLocaleString('id-ID')}`,
          `Rp ${Number(m.feeTotal || 0).toLocaleString('id-ID')}`,
          m.status
        ]);
        await exportToPdf({
          filename: `Laporan_Kupon_Fee_Mohat_${new Date().toISOString().slice(0, 10)}.pdf`,
          title: 'LAPORAN KUPON FEE RUJUKAN & MOBIL SEHAT (MOHAT)',
          subtitle: `Total Kupon: ${filteredKupon.length} | Insentif: Rp ${Number(mohatReportData.totalFeeKumulatif).toLocaleString('id-ID')}`,
          headers,
          data
        });
      }
      showToast('Berhasil mengunduh PDF modul.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor PDF modul.', 'error');
    }
  };

  const handleExportModuleExcel = async (moduleKey: string) => {
    try {
      showToast('Menyiapkan Excel Modul...', 'info');
      let filename = `Export_${moduleKey}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      let title = `LAPORAN MODUL ${moduleKey} RSUMB`;
      let headers: string[] = [];
      let data: any[][] = [];

      if (moduleKey === 'JADWAL') {
        title = 'REKAPITULASI PERUBAHAN JADWAL DOKTER DPJP';
        headers = ['No', 'Poliklinik', 'Nama DPJP', 'Total Berubah', 'Libur', 'Maju', 'Cuti', 'Keterangan'];
        data = leaveReportData.doctorRanking.map((d: any, idx: number) => [
          idx + 1,
          `Poli ${d.poli}`,
          d.dpjp,
          d.total,
          d.libur,
          d.maju,
          d.cuti,
          d.keteranganTerakhir
        ]);
      } else if (moduleKey === 'KUOTA_BPJS') {
        title = 'MONITORING KUOTA BPJS HFIS';
        headers = ['No', 'Poliklinik', 'Nama DPJP', 'Kuota BPJS', 'Terisi', 'Sisa Slot', 'Persentase'];
        data = bpjsQuotaData.breakdownList.map((b: any, idx: number) => [
          idx + 1,
          `Poli ${b.poli}`,
          b.doctorName,
          b.kuotaBpjs,
          b.terisi,
          b.sisa,
          `${b.persen}%`
        ]);
      } else if (moduleKey === 'ROOMS_BOR') {
        title = 'TINGKAT OKUPANSI TEMPAT TIDUR (BOR) RAWAT INAP';
        headers = ['No', 'Nama Ruangan', 'Paviliun', 'Kelas', 'Total Bed', 'Terisi', 'Kosong', 'BOR (%)', 'Tarif/Hari'];
        data = borReportData.roomList.map((r: any, idx: number) => [
          idx + 1,
          r.name,
          r.pavilion,
          r.classLevel,
          r.totalBeds,
          r.occupiedBeds,
          r.availableBeds,
          `${r.totalBeds > 0 ? Math.round((r.occupiedBeds / r.totalBeds) * 100) : 0}%`,
          r.roomRatePerDay
        ]);
      } else if (moduleKey === 'SURGERY') {
        title = 'STATUS PASIEN OPERASI ELEKTIF IBS';
        headers = ['No', 'Tgl Rencana', 'No RM', 'Nama Pasien', 'Poliklinik', 'Dokter Operator', 'Tindakan Bedah', 'Status'];
        data = filteredSurgeries.map((op: any, idx: number) => [
          idx + 1,
          op.rencanaOp || op.tglPoli || '-',
          op.noRm,
          op.namaPasien,
          `Poli ${op.poli}`,
          op.dokterOperator,
          op.tindakanBedah,
          op.pelayanan
        ]);
      } else if (moduleKey === 'KHITAN') {
        title = 'PESERTA PROGRAM KHITAN JUMAT BAROKAH';
        headers = ['No', 'No RM', 'Nama Peserta', 'Usia', 'Nama Orang Tua', 'Kategori', 'Status'];
        data = filteredKhitan.map((k: any, idx: number) => [
          idx + 1,
          k.noRm,
          k.nama,
          `${k.usiaTahun} Th`,
          k.namaOrangTua,
          k.kategori || 'Dhuafa',
          k.status
        ]);
      } else if (moduleKey === 'JASA_RAHARJA') {
        title = 'PASIEN KECELAKAAN & PLAFON JASA RAHARJA';
        headers = ['No', 'No RM', 'Nama Pasien', 'Tgl Masuk', 'Status Klaim', 'Biaya Perawatan', 'Klaim JR', 'Sisa Plafon'];
        data = filteredJasaRaharja.map((jr: any, idx: number) => [
          idx + 1,
          jr.noRm,
          jr.namaPasien,
          jr.tanggalMasuk,
          jr.statusKlaim,
          jr.totalBiayaPerawatan,
          jr.klaimDiajukan,
          jr.sisaPlafon
        ]);
      } else if (moduleKey === 'PATIENT_NOTES') {
        title = 'CATATAN KHUSUS ADMISI & HANDOVER';
        headers = ['No', 'Kategori', 'Nama Pasien', 'No RM', 'Deskripsi Masalah', 'Tindak Lanjut', 'Status'];
        data = patientNotesReportData.summaryList.map((c: any, idx: number) => [
          idx + 1,
          c.kategori,
          c.namaPasien,
          c.noRm,
          c.masalah,
          c.solusi,
          c.status
        ]);
      } else if (moduleKey === 'DOCS') {
        title = 'AUDIT PENGGUNAAN DOKUMEN MASTER';
        headers = ['Rank', 'Kode Dokumen', 'Judul Formulir', 'Kategori Dokumen', 'Frekuensi Penggunaan'];
        data = masterDocReportData.rankedDocuments.map((d: any, idx: number) => [
          idx + 1,
          d.kode,
          d.judul,
          d.kategori,
          d.count
        ]);
      } else if (moduleKey === 'WHATSAPP') {
        title = 'AUDIT VALIDASI NOMOR WHATSAPP PASIEN';
        headers = ['No', 'Tanggal', 'Nama Pasien', 'Poliklinik', 'Dokter', 'Nomor Terdaftar', 'Status Validasi'];
        data = whatsappAuditData.invalidSampleList.map((w: any, idx: number) => [
          idx + 1,
          w.tanggalPelayanan,
          w.namaPasien,
          `Poli ${w.poliklinik}`,
          w.namaDokter,
          w.noHp || '-',
          w.statusKategori
        ]);
      } else if (moduleKey === 'KUPON_MOHAT') {
        title = 'KLAIM KUPON FEE RUJUKAN & MOHAT';
        headers = ['No', 'Nomor Kupon', 'Tgl Masuk', 'Nama Pasien', 'Nama Perujuk', 'Fee Perujuk', 'Fee Sopir', 'Total Fee', 'Status'];
        data = filteredKupon.map((m: any, idx: number) => [
          idx + 1,
          m.nomorKupon,
          m.tanggalMasuk,
          m.namaPasien,
          m.namaPerujuk,
          m.feePerujuk,
          m.feeSopir,
          m.feeTotal,
          m.status
        ]);
      }

      await exportToExcel({
        filename,
        sheetName: moduleKey,
        title,
        headers,
        data
      });
      showToast('Berhasil mengunduh Excel modul.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor Excel modul.', 'error');
    }
  };

  // Activity Log Grid Export
  const handleExportGridExcel = async () => {
    try {
      showToast('Mengekspor histori aktivitas ke Excel...', 'info');
      const headers = ['Tanggal', 'Poliklinik', 'Dokter/PJ', 'Jenis Kegiatan', 'Jumlah Pasien', 'Status', 'Rincian Keterangan'];
      const data = filteredAndSortedLogs.map((log) => [
        log.tanggal,
        log.poliklinik,
        log.dokter,
        log.jenisKegiatan,
        log.jumlahPasien,
        log.status,
        log.keterangan
      ]);
      await exportToExcel({
        filename: `Histori_Aktivitas_RSUMB_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: 'Histori Terpadu',
        title: 'HISTORI AKTIVITAS TERPADU RSUMB',
        headers,
        data
      });
      showToast('Berhasil mengunduh Excel Histori.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal ekspor Excel Histori.', 'error');
    }
  };

  const handleExportGridPdf = async () => {
    try {
      showToast('Mengekspor histori aktivitas ke PDF...', 'info');
      const headers = ['Tanggal', 'Poliklinik', 'Dokter/PJ', 'Jenis Kegiatan', 'Jumlah', 'Status', 'Rincian Keterangan'];
      const data = filteredAndSortedLogs.slice(0, 50).map((log) => [
        log.tanggal,
        log.poliklinik,
        log.dokter,
        log.jenisKegiatan,
        log.jumlahPasien,
        log.status,
        log.keterangan
      ]);
      await exportToPdf({
        filename: `Histori_Aktivitas_RSUMB_${new Date().toISOString().slice(0, 10)}.pdf`,
        title: 'HISTORI AKTIVITAS TERPADU RSUMB (SAMPLE 50 ENTRI)',
        subtitle: `Filter: ${periodType.toUpperCase()} | Poliklinik: ${selectedPoli.toUpperCase()}`,
        headers,
        data,
        orientation: 'landscape'
      });
      showToast('Berhasil mengunduh PDF Histori.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal ekspor PDF Histori.', 'error');
    }
  };

  return (
    <div id="analisis-laporan-view" className="space-y-6 animate-in fade-in duration-200">
      {/* =====================================================================
          1. HEADER & GLOBAL FILTER CONTROLS
      ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#005d42] via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A2540]">
                  Analisis & Laporan Eksekutif Terpadu
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  10 Modul Terintegrasi SIMRS & HFIS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
                Dashboard analitik komprehensif mengagregasi data dari seluruh modul operasional RSUMB: Jadwal DPJP, Kuota BPJS, Okupansi Bed (BOR), Operasi IBS, Khitan Jumat, Plafon Jasa Raharja, Dokumen Master, Catatan Khusus Admisi, Broadcast WA, dan Kupon Fee Mohat.
              </p>
            </div>
          </div>

          {/* Unified Export Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              id="btn-export-pdf-laporan"
              onClick={handleExportGlobalPdf}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Cetak Laporan Format PDF A4 Siap Cetak (Kop Resmi RSUMB)"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak PDF Eksekutif</span>
            </button>

            <button
              type="button"
              id="btn-export-excel-laporan"
              onClick={handleExportGlobalExcel}
              className="px-3.5 py-2 bg-[#005d42] hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Export Seluruh Data Mentah ke Excel 11-Worksheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (11 Tab)</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="pt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Rentang Waktu */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rentang Waktu:</span>
              </span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {(['all', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setPeriodType(mode);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      periodType === mode
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'all'
                      ? 'Semua'
                      : mode === 'weekly'
                      ? 'Mingguan'
                      : mode === 'monthly'
                      ? 'Bulanan'
                      : mode === 'yearly'
                      ? 'Tahunan'
                      : 'Kustom'}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Pickers */}
            {periodType === 'custom' && (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 text-xs animate-in fade-in duration-150">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-slate-400 font-bold">s/d</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Filter Poliklinik */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-teal-600" />
                <span>Unit / Poli:</span>
              </span>
              <select
                value={selectedPoli}
                onChange={(e) => {
                  setSelectedPoli(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Poliklinik & Unit</option>
                {poliOptions.map((poli) => (
                  <option key={poli} value={poli}>
                    Poli {poli}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Active Section Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveSectionTab('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'ALL'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ringkasan Eksekutif
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('JADWAL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'JADWAL'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Jadwal DPJP
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('KUOTA_BPJS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'KUOTA_BPJS'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Kuota BPJS
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('ROOMS_BOR')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'ROOMS_BOR'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Okupansi BOR
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('SURGERY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'SURGERY'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Operasi IBS
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('KHITAN')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'KHITAN'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. Khitan Jumat
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('JASA_RAHARJA')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'JASA_RAHARJA'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6. Jasa Raharja
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('PATIENT_NOTES')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'PATIENT_NOTES'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7. Catatan Admisi
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('DOCS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'DOCS'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              8. Dokumen Master
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('WHATSAPP')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'WHATSAPP'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              9. Validasi WA
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('KUPON_MOHAT')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'KUPON_MOHAT'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              10. Kupon Mohat
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('GRID')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSectionTab === 'GRID'
                  ? 'bg-[#005d42] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabel Histori
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. 10 COMPREHENSIVE KPI SUMMARY CARDS
      ===================================================================== */}
      <AnalyticsKpiCards
        data={kpiData}
        activeSectionTab={activeSectionTab}
        onSelectTab={(tabId) => setActiveSectionTab(tabId)}
      />

      {/* =====================================================================
          3. INTERACTIVE VISUALIZATIONS & CHARTS & LEADERBOARD
      ===================================================================== */}
      {(activeSectionTab === 'ALL' || activeSectionTab === 'KUOTA_BPJS') && (
        <BpjsQuotaDailyTrendChart
          schedules={schedules}
          doctorLeaves={doctorLeaves}
          queueList={queueList}
        />
      )}

      <AnalyticsCharts
        trendData={trendData}
        insuranceDistribution={insuranceDistribution}
        topDoctors={topDoctors}
        topMohatReferrers={topMohatReferrers}
        totalPatientsAll={totalPatientsAll}
      />

      {/* =====================================================================
          4. DETAILED MODULE BREAKDOWN SECTIONS (1-10)
      ===================================================================== */}
      <AnalyticsModuleDetails
        activeSectionTab={activeSectionTab}
        leaveReportData={leaveReportData}
        surgeryReportData={surgeryReportData}
        khitanReportData={khitanReportData}
        masterDocReportData={masterDocReportData}
        whatsappAuditData={whatsappAuditData}
        bpjsQuotaData={bpjsQuotaData}
        borReportData={borReportData}
        jasaRaharjaReportData={jasaRaharjaReportData}
        patientNotesReportData={patientNotesReportData}
        mohatReportData={mohatReportData}
        onExportModulePdf={handleExportModulePdf}
        onExportModuleExcel={handleExportModuleExcel}
      />

      {/* =====================================================================
          5. CONSOLIDATED ACTIVITY LOG GRID & AUDIT TABLE
      ===================================================================== */}
      {(activeSectionTab === 'ALL' || activeSectionTab === 'GRID') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">
                  Tabel Log Aktivitas Terpadu (Audit Trail)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kronologi seluruh aktivitas rumah sakit: pergantian jadwal, operasi IBS, santunan khitan, berkas laka JR, broadcast WA, dan klaim fee Mohat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pasien / dokter..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-44 sm:w-56"
                />
              </div>

              {/* Activity Filter */}
              <select
                value={filterJenisKegiatan}
                onChange={(e) => {
                  setFilterJenisKegiatan(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Jenis Kegiatan</option>
                <option value="Jadwal Dokter">Jadwal DPJP</option>
                <option value="Operasi Elektif">Operasi Elektif IBS</option>
                <option value="Khitan Jumat">Khitan Jumat</option>
                <option value="Jasa Raharja">Jasa Raharja (KLL)</option>
                <option value="Broadcast WA">Broadcast WA</option>
                <option value="Kupon Mohat">Kupon Fee Mohat</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-cetak-pdf-grid"
                  onClick={handleExportGridPdf}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Cetak Histori Aktivitas Format PDF A4"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  id="btn-export-excel-grid"
                  onClick={handleExportGridExcel}
                  className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Export Seluruh Histori Kegiatan ke Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => handleSort('tanggalRaw')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Tanggal</span>
                      {sortField === 'tanggalRaw' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-700" /> : <ArrowDown className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => handleSort('poliklinik')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Poliklinik / Unit</span>
                      {sortField === 'poliklinik' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-700" /> : <ArrowDown className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => handleSort('dokter')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Dokter / PJ</span>
                      {sortField === 'dokter' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-700" /> : <ArrowDown className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => handleSort('jenisKegiatan')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Jenis Kegiatan</span>
                      {sortField === 'jenisKegiatan' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-700" /> : <ArrowDown className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900 select-none text-center"
                    onClick={() => handleSort('jumlahPasien')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Volume</span>
                      {sortField === 'jumlahPasien' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-700" /> : <ArrowDown className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-700" /> : <ArrowDown className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Rincian Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => {
                    let activityBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                    if (log.jenisKegiatan === 'Jadwal Dokter') activityBadge = 'bg-amber-50 text-amber-800 border-amber-300';
                    else if (log.jenisKegiatan === 'Operasi Elektif') activityBadge = 'bg-blue-50 text-blue-800 border-blue-300';
                    else if (log.jenisKegiatan === 'Khitan Jumat') activityBadge = 'bg-teal-50 text-teal-800 border-teal-300';
                    else if (log.jenisKegiatan === 'Jasa Raharja') activityBadge = 'bg-rose-50 text-rose-800 border-rose-300';
                    else if (log.jenisKegiatan === 'Kupon Mohat') activityBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                    else if (log.jenisKegiatan === 'Broadcast WA') activityBadge = 'bg-purple-50 text-purple-800 border-purple-300';

                    let statusBadge = 'bg-slate-100 text-slate-700';
                    const st = String(log.status || '');
                    if (st.includes('Hadir') || st.includes('Selesai') || st.includes('Valid') || st.includes('Lunas') || st.includes('Cair') || st.includes('TERSEDIA')) {
                      statusBadge = 'bg-emerald-50 text-emerald-800 border border-emerald-300';
                    } else if (st.includes('Libur') || st.includes('Batal') || st.includes('Salah') || st.includes('Ditolak') || st.includes('HABIS')) {
                      statusBadge = 'bg-rose-50 text-rose-800 border border-rose-300';
                    } else if (st.includes('Cuti') || st.includes('Maju') || st.includes('Reschedule') || st.includes('Menunggu')) {
                      statusBadge = 'bg-purple-50 text-purple-800 border border-purple-300';
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {log.tanggal}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {log.poliklinik}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0A2540]">
                          {log.dokter}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${activityBadge}`}>
                            {log.jenisKegiatan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold text-slate-900">
                          {log.jumlahPasien}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${statusBadge}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={log.keterangan}>
                          {log.keterangan}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      Tidak ada data aktivitas yang sesuai kriteria filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-400">|</span>
              <span>
                Menampilkan <b>{totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}</b> -{' '}
                <b>{Math.min(currentPage * pageSize, totalItems)}</b> dari <b>{totalItems}</b> entri
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <span className="px-3 py-1 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
