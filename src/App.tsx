import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { FilterBar } from './components/FilterBar';
import { ScheduleTable } from './components/ScheduleTable';
import { PatientQueueView } from './components/PatientQueueView';
import { ElectiveSurgeryView } from './components/ElectiveSurgeryView';
import { KhitanJumatView } from './components/KhitanJumatView';
import { JasaRaharjaView } from './components/JasaRaharjaView';
import { MedicalLettersView } from './components/MedicalLettersView';
import { ContactPatientsView } from './components/ContactPatientsView';
import { IncentiveCalculatorView } from './components/IncentiveCalculatorView';
import { KuponFeeMohatView } from './components/mohat/KuponFeeMohatView';
import { PatientNotesView } from './components/patientNotes/PatientNotesView';
import { BpjsQuotaView } from './components/BpjsQuotaView';
import { InpatientRoomRatesView } from './components/inpatient/InpatientRoomRatesView';
import { ClinicsView } from './components/OtherViews';
import { SettingsModuleView } from './components/settings/SettingsModuleView';
import { AnalyticsReportsView } from './components/AnalyticsReportsView';
import { EmergencyAlertBanner } from './components/EmergencyAlertBanner';
import {
  AddDoctorModal,
  AddOrEditScheduleModal,
  AddScheduleModal,
  LeaveModal,
  BookPatientModal,
  EmergencyModal
} from './components/Modals';
import { StatisticsModal } from './components/StatisticsModal';
import { SettingsModal } from './components/SettingsModal';
import { DailyPosterModal } from './components/poster/DailyPosterModal';
import { DoctorLeavePosterModal } from './components/poster/DoctorLeavePosterModal';
import { GeminiSidebar } from './components/GeminiSidebar';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import {
  initialSchedules,
  initialDoctorLeaves,
  initialQueueList,
  MASTER_DOCTORS
} from './data/initialData';
import { initialSurgerySchedules, ElectiveSurgerySchedule } from './data/surgeryData';
import { KhitanParticipant, loadKhitanParticipants, saveKhitanParticipants, calculateDefaultControlDate } from './data/khitanData';
import { MedicalLetterItem } from './types/letterTypes';
import { loadMedicalLetters, saveMedicalLetters } from './data/letterData';
import { initAuth } from './services/googleAuthService';
import { pullDataFromDrive, triggerSilentDriveSync } from './services/dualSyncStorage';
import {
  loadJasaRaharjaData,
  saveJasaRaharjaData,
  upsertJasaRaharjaItems,
  JasaRaharjaOcrItem,
  UpsertResult
} from './data/jasaRaharjaData';
import {
  DoctorSchedule,
  DoctorLeaveAnnouncement,
  PatientQueueItem,
  ActiveNavTab,
  EmergencyAlertData,
  HospitalStats,
  JasaRaharjaItem
} from './types';
import {
  consolidateAndSortDoctorLeaves,
  normalizeDoctorName,
  isDoctorLeaveActiveOnDate,
  formatDoctorScheduleTime,
  formatHfisTime,
  getScheduleStartMinutes,
  DAY_ORDER_MAP
} from './utils/dateHelpers';
import {
  HelpCircle,
  X,
  Printer,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('medcentral_schedules_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Pastikan seluruh 4 hari jadwal praktik dr. Aulya Farra Rahmadany, Sp. A selalu termuat
          const aulyaInitial = initialSchedules.filter(
            (s) => s.dpjp && s.dpjp.toLowerCase().includes('aulya')
          );
          const existingAulyaDays = new Set(
            parsed
              .filter((s: any) => s.dpjp && s.dpjp.toLowerCase().includes('aulya'))
              .map((s: any) => s.hari)
          );
          const missingAulya = aulyaInitial.filter((s) => !existingAulyaDays.has(s.hari));
          if (missingAulya.length > 0) {
            const merged = [...parsed, ...missingAulya];
            localStorage.setItem('medcentral_schedules_v5', JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading medcentral_schedules_v5:', e);
    }
    return initialSchedules;
  });

  const [doctorLeaves, setDoctorLeaves] = useState<DoctorLeaveAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem('medcentral_leaves_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return consolidateAndSortDoctorLeaves(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading medcentral_leaves_v5:', e);
    }
    return consolidateAndSortDoctorLeaves(initialDoctorLeaves);
  });

  const [queueList, setQueueList] = useState<PatientQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem('medcentral_queue_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading medcentral_queue_v3:', e);
    }
    return initialQueueList;
  });

  const [surgeryList, setSurgeryList] = useState<ElectiveSurgerySchedule[]>(() => {
    try {
      const saved =
        localStorage.getItem('rsumb_surgery_schedules_v4') ||
        localStorage.getItem('rsumb_surgery_schedules_v3') ||
        localStorage.getItem('rsumb_surgery_schedules_v2') ||
        localStorage.getItem('rsumb_surgery_schedules_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => {
            let pelayanan = item.pelayanan;
            if ((pelayanan as string) === 'Dalam Persiapan' || (pelayanan as string) === 'Selesai') {
              pelayanan = 'Hadir';
            }
            let dokter = item.dokterOperator;
            let poli = item.poli;
            if (dokter === 'dr. Bambang Purnomo, Sp.B' || dokter === 'dr. Rieski Widhanar, Sp.B') {
              dokter = 'dr. Rieski Widhanar, Sp. B';
            } else if (dokter === 'dr. Nikita Gladys L., M. Ked.Klin, Sp.B') {
              dokter = 'dr. Nikita Gladys L., M. Ked.Klin, Sp. B';
            } else if (dokter === 'dr. Dimas Arya, Sp.OT') {
              dokter = 'dr. Hary Wahyu A, Sp. OT';
            } else if (dokter === 'dr. Retno Wulandari, Sp.OG') {
              dokter = 'dr. Dony R. Bimantara, Sp. OG, AIFO-K';
            } else if (dokter === 'dr. Hidayat Santoso, Sp.M') {
              dokter = 'dr. Amelia Safitri R., Sp. M';
            } else if (dokter === 'dr. Agung Wicaksono, Sp.U') {
              dokter = 'dr. Randa Halfian, Sp. U';
            } else if (dokter === 'dr. Sulistyo, Sp.THT-KL') {
              dokter = 'dr. Arif Surgana, Sp. THT-BKL';
            }
            if (poli === 'Bedah Umum') poli = 'Bedah';
            if (poli === 'Bedah Ortopedi') poli = 'Ortopedi';
            if (poli === 'Bedah Urologi') poli = 'Urologi';

            let jenisBayar = item.jenisBayar;
            if (jenisBayar === 'BPJS') jenisBayar = 'BPJS Kesehatan';
            else if (jenisBayar === 'Umum') jenisBayar = 'Umum / Pribadi';
            else if (jenisBayar === 'Asuransi') jenisBayar = 'Asuransi Swasta';

            return {
              ...item,
              pelayanan,
              dokterOperator: dokter,
              poli,
              jenisBayar,
              kamarRawatInap: item.kamarRawatInap || ''
            };
          });
        }
      }
    } catch (e) {
      console.error('Error loading surgery schedules:', e);
    }
    return initialSurgerySchedules;
  });

  const [khitanParticipants, setKhitanParticipants] = useState<KhitanParticipant[]>(() => {
    return loadKhitanParticipants();
  });

  const [medicalLetters, setMedicalLetters] = useState<MedicalLetterItem[]>(() => {
    return loadMedicalLetters();
  });

  const [jasaRaharjaList, setJasaRaharjaList] = useState<JasaRaharjaItem[]>(() => {
    return loadJasaRaharjaData();
  });

  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyAlertData>(() => {
    const saved = localStorage.getItem('medcentral_emergency_v3');
    return saved ? JSON.parse(saved) : { active: false, code: '', message: '', issuedAt: '', issuedBy: '' };
  });

  // Navigation & Filter state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoli, setSelectedPoli] = useState('');
  const [selectedHari, setSelectedHari] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeaveDate, setSelectedLeaveDate] = useState('');

  // Modals state
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [isAddEditScheduleModalOpen, setIsAddEditScheduleModalOpen] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<DoctorLeaveAnnouncement | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedScheduleForBooking, setSelectedScheduleForBooking] = useState<DoctorSchedule | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [isLeavePosterModalOpen, setIsLeavePosterModalOpen] = useState(false);
  const [leaveForPoster, setLeaveForPoster] = useState<DoctorLeaveAnnouncement | null>(null);
  const [isGeminiSidebarOpen, setIsGeminiSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedDoctor, setHighlightedDoctor] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenLeavePoster = (leave: DoctorLeaveAnnouncement) => {
    setLeaveForPoster(leave);
    setIsLeavePosterModalOpen(true);
  };

  // Ref to skip triggering Drive push on first mount
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Mark initial mount complete after slight delay
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
      // Pastikan snapshot terbaru termasuk jadwal dokter baru tersinkronkan ke Google Drive
      triggerSilentDriveSync(2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Save to localStorage safely & trigger silent auto-save to Google Drive
  useEffect(() => {
    try {
      localStorage.setItem('medcentral_schedules_v5', JSON.stringify(schedules));
      if (!isInitialMountRef.current) {
        triggerSilentDriveSync(2500);
      }
    } catch (e) {
      console.warn('Gagal menyimpan schedules ke localStorage:', e);
    }
  }, [schedules]);

  useEffect(() => {
    try {
      localStorage.setItem('medcentral_leaves_v5', JSON.stringify(doctorLeaves));
      if (!isInitialMountRef.current) {
        triggerSilentDriveSync(2500);
      }
    } catch (e) {
      console.warn('Gagal menyimpan doctorLeaves ke localStorage:', e);
    }
  }, [doctorLeaves]);

  useEffect(() => {
    try {
      localStorage.setItem('medcentral_queue_v3', JSON.stringify(queueList));
      if (!isInitialMountRef.current) {
        triggerSilentDriveSync(2500);
      }
    } catch (e) {
      console.warn('Gagal menyimpan queueList ke localStorage:', e);
    }
  }, [queueList]);

  useEffect(() => {
    try {
      localStorage.setItem('rsumb_surgery_schedules_v4', JSON.stringify(surgeryList));
      localStorage.removeItem('rsumb_surgery_schedules_v3');
      localStorage.removeItem('rsumb_surgery_schedules_v2');
      localStorage.removeItem('rsumb_surgery_schedules_v1');
      if (!isInitialMountRef.current) {
        triggerSilentDriveSync(2500);
      }
    } catch (e) {
      console.warn('Gagal menyimpan surgeryList ke localStorage:', e);
    }
  }, [surgeryList]);

  useEffect(() => {
    saveKhitanParticipants(khitanParticipants);
    if (!isInitialMountRef.current) {
      triggerSilentDriveSync(2500);
    }
  }, [khitanParticipants]);

  // Google Drive Authentication & Automatic Startup Dual-Sync
  useEffect(() => {
    const unsubAuth = initAuth(
      async (user, token) => {
        if (token) {
          try {
            // Automatically restore latest rsumb_database.json from Google Drive on startup
            const res = await pullDataFromDrive(true);
            if (res.restoredKeys > 0) {
              console.log(`[Google Drive] Dual-sync otomatis: ${res.restoredKeys} data dipulihkan dari cloud.`);
            }
          } catch (err) {
            console.warn('[Google Drive] Auto-sync startup check:', err);
          }
        }
      },
      () => {
        // Not authenticated - runs smoothly in offline mode
      }
    );

    // Full state rehydration when cloud data is pulled
    const handleSyncReload = () => {
      try {
        setKhitanParticipants(loadKhitanParticipants());
        setMedicalLetters(loadMedicalLetters());
        setJasaRaharjaList(loadJasaRaharjaData());

        const savedSchedules = localStorage.getItem('medcentral_schedules_v5');
        if (savedSchedules) {
          const parsed = JSON.parse(savedSchedules);
          if (Array.isArray(parsed) && parsed.length > 0) setSchedules(parsed);
        }

        const savedLeaves = localStorage.getItem('medcentral_leaves_v5');
        if (savedLeaves) {
          const parsed = JSON.parse(savedLeaves);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDoctorLeaves(consolidateAndSortDoctorLeaves(parsed));
          }
        }

        const savedSurgeries = localStorage.getItem('rsumb_surgery_schedules_v4');
        if (savedSurgeries) {
          const parsed = JSON.parse(savedSurgeries);
          if (Array.isArray(parsed) && parsed.length > 0) setSurgeryList(parsed);
        }

        const savedQueue = localStorage.getItem('medcentral_queue_v3');
        if (savedQueue) {
          const parsed = JSON.parse(savedQueue);
          if (Array.isArray(parsed) && parsed.length > 0) setQueueList(parsed);
        }
      } catch (err) {
        console.warn('Notice rehydrating state after cloud sync:', err);
      }
    };
    window.addEventListener('rsumb_database_synced', handleSyncReload);

    return () => {
      unsubAuth();
      window.removeEventListener('rsumb_database_synced', handleSyncReload);
    };
  }, []);

  const handleAddSurgery = (newSch: Omit<ElectiveSurgerySchedule, 'id' | 'no'>) => {
    const newItem: ElectiveSurgerySchedule = {
      ...newSch,
      id: `op-${Date.now()}`,
      no: surgeryList.length + 1
    };
    setSurgeryList((prev) => [newItem, ...prev]);
  };

  const handleUpdateSurgery = (id: string, updated: Partial<ElectiveSurgerySchedule>) => {
    setSurgeryList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  const handleDeleteSurgery = (id: string) => {
    setSurgeryList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddKhitanParticipant = (data: Omit<KhitanParticipant, 'id' | 'createdAt'>) => {
    const defaultControl = data.tanggalKontrol || calculateDefaultControlDate(data.tanggalPelaksanaan, 3);
    const newItem: KhitanParticipant = {
      ...data,
      id: `kht-${Date.now()}`,
      createdAt: new Date().toISOString(),
      tanggalKontrol: defaultControl,
      dokterOperatorKontrol: data.dokterOperatorKontrol || 'dr. H. Abd. Rokhim, MARS'
    };
    setKhitanParticipants((prev) => [newItem, ...prev]);
  };

  const handleUpdateKhitanParticipant = (id: string, updated: Partial<KhitanParticipant>) => {
    setKhitanParticipants((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteKhitanParticipant = (id: string) => {
    setKhitanParticipants((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddLetter = (newLetter: MedicalLetterItem) => {
    setMedicalLetters((prev) => {
      const updated = [newLetter, ...prev];
      saveMedicalLetters(updated);
      return updated;
    });
  };

  const handleUpdateLetter = (updatedLetter: MedicalLetterItem) => {
    setMedicalLetters((prev) => {
      const updated = prev.map((item) =>
        item.id === updatedLetter.id ? updatedLetter : item
      );
      saveMedicalLetters(updated);
      return updated;
    });
  };

  const handleDeleteLetter = (id: string) => {
    setMedicalLetters((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveMedicalLetters(updated);
      return updated;
    });
  };

  const handleAddJasaRaharja = (newItem: Omit<JasaRaharjaItem, 'id'>) => {
    const itemWithId: JasaRaharjaItem = {
      ...newItem,
      id: `jr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    setJasaRaharjaList((prev) => {
      const updated = [itemWithId, ...prev];
      saveJasaRaharjaData(updated);
      return updated;
    });
    showToast(`Data Plafon pasien ${itemWithId.namaPasien} berhasil disimpan.`);
  };

  const handleUpdateJasaRaharja = (updatedItem: JasaRaharjaItem) => {
    setJasaRaharjaList((prev) => {
      const updated = prev.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      );
      saveJasaRaharjaData(updated);
      return updated;
    });
    showToast(`Data Plafon pasien ${updatedItem.namaPasien} berhasil diperbarui.`);
  };

  const handleDeleteJasaRaharja = (idOrNoRm: string) => {
    setJasaRaharjaList((prev) => {
      const target = prev.find((item) => item.id === idOrNoRm || item.noRm === idOrNoRm);
      const updated = prev.filter((item) => item.id !== idOrNoRm && item.noRm !== idOrNoRm);
      saveJasaRaharjaData(updated);
      if (target) {
        showToast(`Data Plafon pasien ${target.namaPasien} berhasil dihapus.`);
      }
      return updated;
    });
  };

  const handleBatchAddJasaRaharja = (newItems: Omit<JasaRaharjaItem, 'id'>[]) => {
    const itemsWithId: JasaRaharjaItem[] = newItems.map((item, idx) => ({
      ...item,
      id: `jr-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`
    }));
    setJasaRaharjaList((prev) => {
      const updated = [...itemsWithId, ...prev];
      saveJasaRaharjaData(updated);
      return updated;
    });
    showToast(`Berhasil menambahkan ${newItems.length} data pasien Jasa Raharja.`);
  };

  const handleUpsertJasaRaharja = (incomingItems: JasaRaharjaOcrItem[]): UpsertResult => {
    const result = upsertJasaRaharjaItems(jasaRaharjaList, incomingItems);
    setJasaRaharjaList(result.updatedList);
    saveJasaRaharjaData(result.updatedList);
    return result;
  };

  useEffect(() => {
    localStorage.setItem('medcentral_emergency_v3', JSON.stringify(emergencyAlert));
  }, [emergencyAlert]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct Poliklinik list
  const poliOptions = useMemo(() => {
    const set = new Set(schedules.map((s) => s.poli));
    return Array.from(set).sort();
  }, [schedules]);

  // Distinct Doctors list for dropdowns (using MASTER_DOCTORS exact list as primary)
  const doctorOptions = useMemo(() => {
    const map = new Map<string, string>();
    MASTER_DOCTORS.forEach((d) => map.set(d.dpjp, d.poli));
    schedules.forEach((s) => {
      if (s.dpjp && !map.has(s.dpjp)) {
        map.set(s.dpjp, s.poli);
      }
    });
    doctorLeaves.forEach((dl) => {
      if (dl.dpjp && !map.has(dl.dpjp)) {
        map.set(dl.dpjp, dl.poli);
      }
    });
    return Array.from(map.entries()).map(([dpjp, poli]) => ({ dpjp, poli }));
  }, [schedules, doctorLeaves]);

  // Statistics calculation
  const stats: HospitalStats = useMemo(() => {
    const uniquePoli = new Set(schedules.map((s) => s.poli)).size;
    const uniqueDpjp = new Set(schedules.map((s) => s.dpjp)).size;
    const totalKuota = schedules.reduce((acc, curr) => acc + (curr.kuotaTotal || 0), 0);
    const totalPasien = schedules.reduce((acc, curr) => acc + (curr.rerataPasien || 0), 0);

    return {
      totalPoliklinik: uniquePoli,
      totalDokterDpjp: uniqueDpjp,
      totalKuotaBpjs: totalKuota,
      rerataPasien: totalPasien
    };
  }, [schedules]);

  // Helper normalizer
  const normalize = (str: string) =>
    str ? str.toLowerCase().replace(/['’`\.]/g, '').trim() : '';

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    const search = normalize(searchTerm);
    const poli = selectedPoli;
    const hari = normalize(selectedHari);

    const list = schedules.filter((row) => {
      const dpjpNorm = normalize(row.dpjp);
      const poliNorm = normalize(row.poli);
      const hariNorm = normalize(row.hari);
      const spesialisasiNorm = normalize(row.spesialisasi || '');

      const matchesSearch =
        search === '' ||
        dpjpNorm.includes(search) ||
        poliNorm.includes(search) ||
        poliNorm.replace(/^poli\s*/i, '').includes(search) ||
        spesialisasiNorm.includes(search) ||
        (row.ruangan && normalize(row.ruangan).includes(search)) ||
        (row.hari && normalize(row.hari).includes(search));

      const matchesPoli =
        poli === '' ||
        row.poli === poli ||
        normalize(row.poli) === normalize(poli) ||
        normalize(row.poli).includes(normalize(poli)) ||
        normalize(poli).includes(normalize(row.poli)) ||
        normalize(row.poli).replace(/^poli\s*/i, '') === normalize(poli).replace(/^poli\s*/i, '');

      const matchesHari = hari === '' || hariNorm.includes(hari) || hari.includes(hariNorm);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'tersedia') {
        matchesStatus = row.kuotaTerisi < row.kuotaTotal;
      } else if (statusFilter === 'penuh') {
        matchesStatus = row.kuotaTerisi >= row.kuotaTotal;
      } else if (statusFilter === 'libur') {
        const hasLeave = Boolean(
          dpjpNorm &&
            doctorLeaves.some((l) => {
              const lDpjp = normalize(l?.dpjp);
              return lDpjp && (lDpjp.includes(dpjpNorm) || dpjpNorm.includes(lDpjp));
            })
        );
        matchesStatus = hasLeave || (row.status as string) === 'Libur' || (row.status as string) === 'Cuti' || (row.status as string) === 'Ubah Jam';
      }

      return matchesSearch && matchesPoli && matchesHari && matchesStatus;
    });

    // Default chronological sorting by practice start time (earliest to latest)
    return list.sort((a, b) => {
      const timeA = getScheduleStartMinutes(a, 'jadwal');
      const timeB = getScheduleStartMinutes(b, 'jadwal');
      if (timeA !== timeB) return timeA - timeB;

      const dayA = DAY_ORDER_MAP[a.hari?.toLowerCase().trim()] ?? 99;
      const dayB = DAY_ORDER_MAP[b.hari?.toLowerCase().trim()] ?? 99;
      if (dayA !== dayB) return dayA - dayB;

      const poliDiff = (a.poli || '').localeCompare(b.poli || '');
      if (poliDiff !== 0) return poliDiff;

      return (a.dpjp || '').localeCompare(b.dpjp || '');
    });
  }, [schedules, searchTerm, selectedPoli, selectedHari, statusFilter, doctorLeaves]);

  // Hitung jumlah dokter/poliklinik yang ada perubahan jadwal/libur/cuti secara real-time pada filter aktif
  const changeCount = useMemo(() => {
    const search = normalize(searchTerm);
    const poli = selectedPoli;
    const hari = normalize(selectedHari);

    return schedules.filter((row) => {
      const dpjpNorm = normalize(row.dpjp);
      const poliNorm = normalize(row.poli);
      const hariNorm = normalize(row.hari);

      const matchesSearch =
        search === '' ||
        dpjpNorm.includes(search) ||
        poliNorm.includes(search) ||
        (row.ruangan && normalize(row.ruangan).includes(search));

      const matchesPoli = poli === '' || row.poli === poli;
      const matchesHari = hari === '' || hariNorm.includes(hari) || hari.includes(hariNorm);

      if (!matchesSearch || !matchesPoli || !matchesHari) return false;

      const hasLeave = Boolean(
        dpjpNorm &&
          doctorLeaves.some((l) => {
            const lDpjp = normalize(l?.dpjp);
            return lDpjp && (lDpjp.includes(dpjpNorm) || dpjpNorm.includes(lDpjp));
          })
      );
      const isSpecialStatus = (row.status as string) === 'Libur' || (row.status as string) === 'Cuti' || (row.status as string) === 'Ubah Jam';

      return hasLeave || isSpecialStatus;
    }).length;
  }, [schedules, searchTerm, selectedPoli, selectedHari, doctorLeaves]);

  // Handlers
  const handleSaveSchedule = (scheduleData: Partial<DoctorSchedule> | DoctorSchedule[]) => {
    if (Array.isArray(scheduleData)) {
      if (scheduleData.length === 0) return;
      setSchedules((prev) => [...scheduleData, ...prev]);
      const docName = scheduleData[0]?.dpjp || 'Dokter Baru';
      const docPoli = scheduleData[0]?.poli || 'Poliklinik';
      showToast(`${scheduleData.length} jadwal praktik ${docName} (${docPoli}) berhasil ditambahkan & disinkronkan ke rsumb_database.json.`);
      setEditingSchedule(null);
      return;
    }

    if (editingSchedule) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === editingSchedule.id ? ({ ...s, ...scheduleData } as DoctorSchedule) : s))
      );
      showToast(`Jadwal ${scheduleData.dpjp} (${scheduleData.poli}) berhasil diperbarui & disinkronkan ke HFIS BPJS.`);
    } else {
      const newSchedule: DoctorSchedule = {
        id: `sch-${Date.now()}`,
        no: schedules.length + 1,
        poli: scheduleData.poli || 'Poli Penyakit Dalam',
        dpjp: scheduleData.dpjp || '',
        hari: scheduleData.hari || 'Senin',
        jadwal: scheduleData.jadwal || '08:00 - 12:00',
        jamHfis: scheduleData.jamHfis || '07.30 - 13.00',
        jamCetak: scheduleData.jamCetak,
        kuotaTerisi: scheduleData.kuotaTerisi || 0,
        kuotaTotal: scheduleData.kuotaTotal || 50,
        rerataPasien: scheduleData.rerataPasien || 30,
        ruangan: scheduleData.ruangan || 'Poliklinik 101',
        status: (scheduleData.kuotaTerisi || 0) >= (scheduleData.kuotaTotal || 50) ? 'Penuh' : 'Tersedia'
      };
      setSchedules((prev) => [newSchedule, ...prev]);
      showToast(`Jadwal baru ${scheduleData.dpjp} (${scheduleData.poli}) berhasil ditambahkan & disinkronkan ke rsumb_database.json.`);
    }
    setEditingSchedule(null);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('Jadwal dokter berhasil dihapus.');
  };

  const handleBulkUpdateSchedules = (ids: string[], updates: Partial<DoctorSchedule>) => {
    if (!ids || ids.length === 0) return;
    setSchedules((prev) =>
      prev.map((s) => {
        if (!ids.includes(s.id)) return s;
        const merged = { ...s, ...updates };
        // If status wasn't explicitly set, re-evaluate Tersedia vs Penuh if quota changed
        if (!updates.status && (updates.kuotaTotal !== undefined || updates.kuotaTerisi !== undefined)) {
          const terisi = updates.kuotaTerisi !== undefined ? updates.kuotaTerisi : s.kuotaTerisi;
          const total = updates.kuotaTotal !== undefined ? updates.kuotaTotal : s.kuotaTotal;
          if (terisi >= total) {
            merged.status = 'Penuh';
          } else if (merged.status === 'Penuh') {
            merged.status = 'Tersedia';
          }
        }
        return merged;
      })
    );
    showToast(`${ids.length} slot jadwal dokter berhasil diperbarui secara masal.`);
  };

  const handleBulkDeleteSchedules = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setSchedules((prev) => prev.filter((s) => !ids.includes(s.id)));
    showToast(`${ids.length} jadwal dokter berhasil dihapus.`);
  };

  const handleSaveLeave = (leaveData: DoctorLeaveAnnouncement) => {
    setDoctorLeaves((prev) => {
      let updated: DoctorLeaveAnnouncement[];
      const targetDpjpKey = normalizeDoctorName(leaveData.dpjp || '');

      if (editingLeave) {
        // If editing existing record
        updated = prev.map((l) => (l.id === editingLeave.id ? leaveData : l));
      } else {
        // Check if a card with this doctor already exists
        const existingIdx = prev.findIndex(
          (l) => normalizeDoctorName(l.dpjp || '') === targetDpjpKey
        );
        if (existingIdx >= 0) {
          // Merge schedules into existing doctor card
          updated = [...prev];
          const existing = updated[existingIdx];
          const mergedJadwal = [...existing.jadwal];
          leaveData.jadwal.forEach((j) => {
            const isDuplicate = mergedJadwal.some(
              (ej) =>
                ej.tglLibur.trim().toLowerCase() === j.tglLibur.trim().toLowerCase() &&
                ej.tglMasuk.trim().toLowerCase() === j.tglMasuk.trim().toLowerCase()
            );
            if (!isDuplicate) {
              mergedJadwal.push(j);
            }
          });
          updated[existingIdx] = {
            ...existing,
            poli: leaveData.poli || existing.poli,
            jadwal: mergedJadwal,
            active: true
          };
        } else {
          updated = [leaveData, ...prev];
        }
      }
      return consolidateAndSortDoctorLeaves(updated);
    });

    showToast(`Pengumuman libur & penyesuaian ${leaveData.dpjp} berhasil disimpan.`);
    setEditingLeave(null);
    setIsAddLeaveModalOpen(false);
  };

  const handleDeleteLeave = (id: string) => {
    setDoctorLeaves((prev) => {
      const target = prev.find((l) => l.id === id);
      const targetName = target?.dpjp || (editingLeave ? editingLeave.dpjp : '');
      const normalizedTarget = targetName ? normalizeDoctorName(targetName) : '';

      const filtered = prev.filter(
        (l) => l.id !== id && (!normalizedTarget || normalizeDoctorName(l.dpjp) !== normalizedTarget)
      );
      return consolidateAndSortDoctorLeaves(filtered);
    });
    setEditingLeave(null);
    setIsAddLeaveModalOpen(false);
    showToast('Pengumuman libur dokter berhasil dihapus.');
  };

  const handleBookPatient = (patientData: { nama: string; noBpjs: string; jenis: 'BPJS Kesehatan' | 'Umum' }) => {
    if (!selectedScheduleForBooking) return;

    const newQueue: PatientQueueItem = {
      id: `q-${Date.now()}`,
      nomorAntrean: `POLI-${selectedScheduleForBooking.poli.slice(5, 7).toUpperCase() || 'PD'}-${String(queueList.length + 1).padStart(3, '0')}`,
      namaPasien: patientData.nama,
      noBpjs: patientData.noBpjs,
      poli: selectedScheduleForBooking.poli,
      dpjp: selectedScheduleForBooking.dpjp,
      jamDaftar: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      status: 'Menunggu',
      jenisPembayaran: patientData.jenis
    };

    setQueueList((prev) => [newQueue, ...prev]);

    // Increment kuota terisi
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === selectedScheduleForBooking.id
          ? {
              ...s,
              kuotaTerisi: Math.min(s.kuotaTotal, s.kuotaTerisi + 1),
              status: s.kuotaTerisi + 1 >= s.kuotaTotal ? 'Penuh' : 'Tersedia'
            }
          : s
      )
    );

    showToast(`Nomor Antrean ${newQueue.nomorAntrean} berhasil diterbitkan.`);
  };

  const handleExportCSV = () => {
    if (statusFilter === 'libur') {
      const consolidated = consolidateAndSortDoctorLeaves(doctorLeaves);
      const search = normalize(searchTerm);
      const poli = selectedPoli;
      const targetLeaves = consolidated.filter((doc) => {
        if (selectedLeaveDate && !isDoctorLeaveActiveOnDate(doc, selectedLeaveDate)) {
          return false;
        }

        const dpjpNorm = normalize(doc.dpjp);
        const poliNorm = normalize(doc.poli);
        const matchesSearch =
          search === '' ||
          dpjpNorm.includes(search) ||
          poliNorm.includes(search) ||
          doc.jadwal.some(
            (j) =>
              normalize(j.keterangan || '').includes(search) ||
              normalize(j.tglLibur || '').includes(search) ||
              normalize(j.tglMasuk || '').includes(search)
          );
        const matchesPoli = poli === '' || doc.poli === poli;
        return matchesSearch && matchesPoli;
      });

      const headers = ['No', 'Poliklinik', 'Dokter DPJP', 'Status & Tanggal Libur / Maju', 'Tanggal Masuk Kembali', 'Keterangan'];
      const rows = targetLeaves.map((doc, index) => {
        const liburMajuStr = doc.jadwal.map((j) => `[${j.tipe}] ${j.tglLibur || '-'}`).join('; ');
        const masukStr = doc.jadwal.map((j) => j.tglMasuk || '-').join('; ');
        const ketStr = doc.jadwal.map((j) => j.keterangan || '-').join('; ');
        return [
          index + 1,
          `"${doc.poli}"`,
          `"${doc.dpjp}"`,
          `"${liburMajuStr}"`,
          `"${masukStr}"`,
          `"${ketStr}"`
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const fileNameSuffix = selectedLeaveDate ? `_${selectedLeaveDate}` : `_${new Date().toISOString().slice(0, 10)}`;
      link.setAttribute('download', `Rekap_Libur_Perubahan_Jadwal_DPJP${fileNameSuffix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Rekapitulasi jadwal libur & perubahan berhasil diunduh dalam format CSV.');
      return;
    }

    const headers = ['No', 'Poliklinik', 'Dokter DPJP', 'Hari', 'Jam Praktik', 'Jam HFIS', 'Kuota Terisi', 'Kuota Total', 'Rerata Pasien', 'Ruangan'];
    const rows = filteredSchedules.map((s, index) => [
      index + 1,
      `"${s.poli}"`,
      `"${s.dpjp}"`,
      `"${s.hari}"`,
      `"${formatDoctorScheduleTime(s)}"`,
      `"${formatHfisTime(s.jamHfis)}"`,
      s.kuotaTerisi,
      s.kuotaTotal,
      s.rerataPasien || 0,
      `"${s.ruangan || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jadwal_DPJP_BPJS_MedCentral_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan jadwal berhasil diunduh dalam format CSV.');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPoli('');
    setSelectedHari('');
    setStatusFilter('all');
    setSelectedLeaveDate('');
  };

  // Handler for selecting a specific doctor from search results:
  // switches tab to schedules, sets search term to that doctor, highlights row, and smooth scrolls to row or table
  const handleSelectDoctorFromSearch = (dpjp: string) => {
    setActiveTab('schedules');
    setSearchTerm(dpjp);
    setSelectedPoli('');
    setSelectedHari('');
    setStatusFilter('all');
    setSelectedLeaveDate('');
    setHighlightedDoctor(dpjp);

    const dpjpNorm = normalize(dpjp);

    setTimeout(() => {
      const targetRow = document.querySelector<HTMLElement>(`[data-doctor-row="${dpjpNorm}"]`);
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const tableSection = document.getElementById('schedule-table-section');
        if (tableSection) {
          tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }
      }
    }, 120);

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedDoctor(null);
    }, 4000);
  };

  // Handler for Enter key or clicking "Buka Hasil Lengkap →" in search:
  // switches tab to schedules, filters by query, highlights doctor if directly matched, and smooth scrolls to table
  const handleNavigateToSchedulesFromSearch = (query?: string) => {
    setActiveTab('schedules');
    const term = query !== undefined ? query : searchTerm;
    setSearchTerm(term);

    // If query directly matches a specific doctor, highlight them
    const matchedDoctor = schedules.find((s) => {
      const sNorm = normalize(s.dpjp);
      const qNorm = normalize(term);
      return qNorm && (sNorm.includes(qNorm) || qNorm.includes(sNorm));
    });

    if (matchedDoctor) {
      setHighlightedDoctor(matchedDoctor.dpjp);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedDoctor(null);
      }, 4000);
    }

    setTimeout(() => {
      if (matchedDoctor) {
        const targetRow = document.querySelector<HTMLElement>(`[data-doctor-row="${normalize(matchedDoctor.dpjp)}"]`);
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      const tableSection = document.getElementById('schedule-table-section');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 350, behavior: 'smooth' });
      }
    }, 120);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedPoli('');
    setSelectedHari('');
    setStatusFilter('all');
    setSelectedLeaveDate('');
    setHighlightedDoctor(null);
  };

  // Handler for clicking leave badge in ScheduleTable: smooth scrolls & highlights doctor card in announcement banner
  const handleHighlightDoctorLeave = (dpjp: string) => {
    setHighlightedDoctor(dpjp);

    const normalize = (str: string) =>
      str ? str.toLowerCase().replace(/['’`\.]/g, '').trim() : '';
    const dpjpNorm = normalize(dpjp);

    // Find doctor card element in announcement banner
    const allCards = document.querySelectorAll<HTMLElement>('[data-dpjp-card]');
    let targetCard: HTMLElement | null = null;
    for (const card of allCards) {
      const cardDpjp = card.getAttribute('data-dpjp-card') || '';
      if (cardDpjp === dpjpNorm || cardDpjp.includes(dpjpNorm) || dpjpNorm.includes(cardDpjp)) {
        targetCard = card;
        break;
      }
    }
    if (!targetCard) {
      targetCard = document.getElementById('informasi-libur-banner');
    }

    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedDoctor(null);
    }, 3500);
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex font-['Inter',sans-serif] text-sm selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#005d42] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 print:hidden no-print">
          <CheckCircle className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Emergency Alert Banner */}
      <div className="print:hidden no-print">
        <EmergencyAlertBanner
          alert={emergencyAlert}
          onDismiss={() => setEmergencyAlert((prev) => ({ ...prev, active: false }))}
        />
      </div>

      {/* Side Navigation Bar */}
      <div className="print:hidden no-print">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
          onOpenEmergency={() => setIsEmergencyModalOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          totalDoctorLeaves={doctorLeaves.length}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-grow md:ml-64 print:ml-0 flex flex-col w-full min-w-0 transition-all">
        {/* Top Nav Bar */}
        <div className="print:hidden no-print">
          <Header
            onToggleMobileMenu={() => setIsOpenMobile(true)}
            activeNavTab={activeTab}
            setActiveNavTab={setActiveTab}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onToggleGemini={() => setIsGeminiSidebarOpen((prev) => !prev)}
            schedules={schedules}
            doctorLeaves={doctorLeaves}
            surgeryList={surgeryList}
            khitanParticipants={khitanParticipants}
            onSelectPoli={(poli) => {
              setSelectedPoli(poli);
              setActiveTab('schedules');
              setTimeout(() => {
                const tableSection = document.getElementById('schedule-table-section');
                if (tableSection) {
                  tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 120);
            }}
            onSelectDoctor={handleSelectDoctorFromSearch}
            onNavigateToSchedules={handleNavigateToSchedulesFromSearch}
            onClearSearch={handleClearSearch}
          />
        </div>

        {/* Main Body */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 print:p-0 flex flex-col gap-6 sm:gap-8 w-full max-w-7xl print:max-w-none mx-auto pb-12 sm:pb-16">

          {/* Page Title & Subtitle */}
          {activeTab !== 'khitan' && activeTab !== 'letters' && activeTab !== 'rooms' && activeTab !== 'contact_patients' && activeTab !== 'jasa_raharja' && activeTab !== 'incentive_calc' && activeTab !== 'patient_notes' && activeTab !== 'kupon_mohat' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden no-print">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
                  {activeTab === 'dashboard'
                    ? 'Beranda / Utama'
                    : activeTab === 'schedules'
                    ? 'Jadwal Dokter & Rekapitulasi Pelayanan'
                    : activeTab === 'quotas'
                    ? 'Kalkulator Kapasitas Kuota HFIS'
                    : activeTab === 'queue'
                    ? 'SCHEDULING OPERASI ELEKTIF'
                    : activeTab === 'clinics'
                    ? 'Daftar Poliklinik & Fasilitas'
                    : activeTab === 'reports'
                    ? 'Analisis & Laporan Eksekutif'
                    : 'Pengaturan Sistem & Preferensi Portal RSUMB'}
                </h1>
                <p className="text-sm sm:text-base text-[#5c5f61] mt-1 font-normal">
                  {activeTab === 'dashboard'
                    ? 'Executive Dashboard & Ringkasan Kesiapan Pelayanan Rawat Jalan RSUMB'
                    : activeTab === 'schedules'
                    ? 'Halaman Kerja Manajemen Data Praktik DPJP & Sinkronisasi HFIS BPJS'
                    : activeTab === 'quotas'
                    ? 'Penghitungan Standar Kapasitas Layanan & Estimasi Kuota Poliklinik BPJS Berdasarkan Waktu Pelayanan'
                    : activeTab === 'queue'
                    ? 'Pusat Kendali Penjadwalan Kamar Operasi (IBS), Verifikasi SPRI BPJS & Kesiapan Pasien'
                    : activeTab === 'reports'
                    ? 'Pusat Analisis Data Pelayanan, Monitoring Perubahan Jadwal DPJP, Evaluasi Broadcast WA & Rekapitulasi Operasi RSUMB'
                    : 'Konfigurasi Printer Thermal, Manajemen Staf & Shift Dinas, Tarif Fee & Labeling, WhatsApp Gateway, dan Backup Data'}
                </p>
              </div>
            </div>
          )}

          {/* Conditional View Rendering based on activeTab */}
          {activeTab === 'dashboard' && (
            <ExecutiveDashboardView
              schedules={schedules}
              doctorLeaves={doctorLeaves}
              surgeryList={surgeryList}
              onNavigateToSchedules={(filterType) => {
                if (filterType === 'libur') {
                  setStatusFilter('libur');
                } else {
                  setStatusFilter('all');
                }
                setActiveTab('schedules');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectClinicFilter={(poli) => {
                setSelectedPoli(poli);
                setActiveTab('schedules');
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              onOpenBookModal={() => {
                setSelectedScheduleForBooking(schedules[0]);
                setIsBookModalOpen(true);
              }}
              onToggleGemini={() => setIsGeminiSidebarOpen(true)}
              onNavigateToModule={(mod) => setActiveTab(mod as ActiveNavTab)}
              showToast={(msg) => showToast(msg)}
            />
          )}

          {activeTab === 'schedules' && (
            <>
              <div className="space-y-6 print:hidden no-print">
                {/* Announcement Banner for Doctor Leaves */}
                <AnnouncementBanner
                  leaves={doctorLeaves}
                  highlightedDoctor={highlightedDoctor}
                  referenceDate={selectedLeaveDate || undefined}
                  onAddNewLeave={() => {
                    setEditingLeave(null);
                    setIsAddLeaveModalOpen(true);
                  }}
                  onEditLeave={(leave) => {
                    setEditingLeave(leave);
                    setIsAddLeaveModalOpen(true);
                  }}
                  onDeleteLeave={handleDeleteLeave}
                  onSelectDoctor={(dpjp) => {
                    setSearchTerm(dpjp);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  onOpenLeavePoster={handleOpenLeavePoster}
                />

                {/* 4 Stats Cards */}
                <StatsCards
                  stats={stats}
                  onFilterQuotaFull={() => setStatusFilter('penuh')}
                />

                {/* Filter Bar */}
                <FilterBar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedPoli={selectedPoli}
                  setSelectedPoli={setSelectedPoli}
                  selectedHari={selectedHari}
                  setSelectedHari={setSelectedHari}
                  poliOptions={poliOptions}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onReset={handleResetFilters}
                  totalResults={filteredSchedules.length}
                  changeCount={changeCount}
                  onOpenPosterModal={() => setIsPosterModalOpen(true)}
                />
              </div>

              {/* Main Data Table */}
              <ScheduleTable
                schedules={filteredSchedules}
                doctorLeaves={doctorLeaves}
                statusFilter={statusFilter}
                searchTerm={searchTerm}
                selectedPoli={selectedPoli}
                selectedLeaveDate={selectedLeaveDate}
                highlightedDoctor={highlightedDoctor}
                onLeaveDateChange={setSelectedLeaveDate}
                onHighlightDoctorLeave={handleHighlightDoctorLeave}
                onOpenPosterModal={() => setIsPosterModalOpen(true)}
                onOpenLeavePoster={handleOpenLeavePoster}
                onAddNewSchedule={() => {
                  setEditingSchedule(null);
                  setIsAddScheduleModalOpen(true);
                }}
                onEditSchedule={(sch) => {
                  setEditingSchedule(sch);
                  setIsAddScheduleModalOpen(true);
                }}
                onDeleteSchedule={handleDeleteSchedule}
                onBookPatient={(sch) => {
                  setSelectedScheduleForBooking(sch);
                  setIsBookModalOpen(true);
                }}
                onAddNewLeave={() => {
                  setEditingLeave(null);
                  setIsAddLeaveModalOpen(true);
                }}
                onEditLeave={(leave) => {
                  setEditingLeave(leave);
                  setIsAddLeaveModalOpen(true);
                }}
                onDeleteLeave={handleDeleteLeave}
                onResetFilters={handleResetFilters}
                onExport={handleExportCSV}
                onPrint={handlePrint}
                onBulkUpdateSchedules={handleBulkUpdateSchedules}
                onBulkDeleteSchedules={handleBulkDeleteSchedules}
                showToast={showToast}
              />
            </>
          )}

          {activeTab === 'quotas' && (
            <BpjsQuotaView
              schedules={schedules}
              onAdjustQuota={(id, newTotal) => {
                setSchedules((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, kuotaTotal: newTotal } : s))
                );
                showToast('Kapasitas kuota berhasil diperbarui.');
              }}
            />
          )}

          {activeTab === 'rooms' && (
            <InpatientRoomRatesView showToast={showToast} />
          )}

          {activeTab === 'queue' && (
            <ElectiveSurgeryView
              surgeryList={surgeryList}
              onAddSchedule={handleAddSurgery}
              onUpdateSchedule={handleUpdateSurgery}
              onDeleteSchedule={handleDeleteSurgery}
              showToast={showToast}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}

          {activeTab === 'khitan' && (
            <KhitanJumatView
              participants={khitanParticipants}
              onAddParticipant={handleAddKhitanParticipant}
              onUpdateParticipant={handleUpdateKhitanParticipant}
              onDeleteParticipant={handleDeleteKhitanParticipant}
              showToast={showToast}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}

          {activeTab === 'jasa_raharja' && (
            <JasaRaharjaView
              items={jasaRaharjaList}
              onAddItem={handleAddJasaRaharja}
              onUpdateItem={handleUpdateJasaRaharja}
              onDeleteItem={handleDeleteJasaRaharja}
              onBatchAddItems={handleBatchAddJasaRaharja}
              onUpsertItems={handleUpsertJasaRaharja}
              showToast={showToast}
            />
          )}

          {activeTab === 'letters' && (
            <MedicalLettersView
              letters={medicalLetters}
              onAddLetter={handleAddLetter}
              onUpdateLetter={handleUpdateLetter}
              onDeleteLetter={handleDeleteLetter}
              showToast={showToast}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}

          {activeTab === 'patient_notes' && (
            <PatientNotesView showToast={showToast} />
          )}

          {activeTab === 'contact_patients' && (
            <ContactPatientsView showToast={showToast} />
          )}

          {activeTab === 'kupon_mohat' && (
            <KuponFeeMohatView showToast={showToast} />
          )}

          {activeTab === 'incentive_calc' && (
            <IncentiveCalculatorView showToast={showToast} />
          )}

          {activeTab === 'clinics' && (
            <ClinicsView
              schedules={schedules}
              onSelectPoli={(poli) => {
                setSelectedPoli(poli);
                setActiveTab('schedules');
              }}
            />
          )}

          {activeTab === 'reports' && (
            <AnalyticsReportsView
              schedules={schedules}
              doctorLeaves={doctorLeaves}
              surgeryList={surgeryList}
              khitanParticipants={khitanParticipants}
              queueList={queueList}
              medicalLetters={medicalLetters}
              jasaRaharjaList={jasaRaharjaList}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && <SettingsModuleView showToast={showToast} />}
        </main>

        {/* Footer */}
        <footer className="py-6 px-8 text-center text-xs text-[#5c5f61] border-t border-[#d8e4f5]/60 mt-auto bg-[#f8f9ff] print:hidden no-print">
          <p>© 2026 Sistem Informasi Pendaftaran & HFIS BPJS - RSU Muhammadiyah Babat (RSUMB)</p>
        </footer>
      </div>

      {/* Modals */}
      <AddScheduleModal
        isOpen={isAddScheduleModalOpen}
        onClose={() => setIsAddScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
        editingSchedule={editingSchedule}
        poliOptions={poliOptions}
        doctorOptions={doctorOptions}
      />

      <LeaveModal
        isOpen={isAddLeaveModalOpen}
        onClose={() => {
          setIsAddLeaveModalOpen(false);
          setEditingLeave(null);
        }}
        onSave={handleSaveLeave}
        onDelete={handleDeleteLeave}
        initialData={editingLeave}
        doctorOptions={doctorOptions}
        poliOptions={poliOptions}
      />

      <BookPatientModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        schedule={selectedScheduleForBooking}
        onBook={handleBookPatient}
      />

      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onTriggerAlert={(data) => {
          setEmergencyAlert(data);
          showToast(`Peringatan darurat ${data.code} disiarkan ke seluruh unit.`);
        }}
        onClearAlert={() => {
          setEmergencyAlert({ active: false, code: '', message: '', issuedAt: '', issuedBy: '' });
          showToast('Status darurat telah dinonaktifkan.');
        }}
        currentAlert={emergencyAlert}
      />

      {/* Help Center Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-[#005d42] font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                <span>Pusat Bantuan & Petunjuk SIMRS MedCentral</span>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">1. Sinkronisasi Kuota BPJS</h4>
                <p>
                  Kuota dokter diperbarui secara otomatis setiap kali pasien melakukan pendaftaran online melalui Mobile JKN atau loket registrasi pendaftaran SIMRS.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">2. Penyesuaian Jadwal & Libur Dokter</h4>
                <p>
                  Klik tombol <strong>+ Tambah Catatan</strong> pada banner atas jika dokter berhalangan hadir atau melakukan pertukaran jadwal jaga poliklinik.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">3. Protokol Emergency Alert</h4>
                <p>
                  Gunakan tombol darurat merah di bagian kiri bawah untuk menyiarkan Code Blue / Code Red ke seluruh staf medis rawat jalan.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 bg-[#005d42] text-white font-semibold rounded-xl text-xs"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings & Local Data Backup Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        schedules={schedules}
        doctorLeaves={doctorLeaves}
        queueList={queueList}
        surgeryList={surgeryList}
        khitanParticipants={khitanParticipants}
        medicalLetters={medicalLetters}
        emergencyAlert={emergencyAlert}
        showToast={showToast}
        onRestoreSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Modal Visualisasi Statistik */}
      {isStatsModalOpen && (
        <StatisticsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          schedules={schedules}
          doctorLeaves={doctorLeaves}
          selectedDate={selectedLeaveDate || new Date().toISOString().split('T')[0]}
        />
      )}

      {/* Modal Generator Poster Jadwal Harian Resmi RSUMB */}
      {isPosterModalOpen && (
        <DailyPosterModal
          isOpen={isPosterModalOpen}
          onClose={() => setIsPosterModalOpen(false)}
          schedules={schedules}
          doctorLeaves={doctorLeaves}
          showToast={showToast}
        />
      )}

      {/* Modal Generator & Unduh Poster Libur Praktik Dokter (Format JPG) */}
      {isLeavePosterModalOpen && leaveForPoster && (
        <DoctorLeavePosterModal
          isOpen={isLeavePosterModalOpen}
          onClose={() => {
            setIsLeavePosterModalOpen(false);
            setLeaveForPoster(null);
          }}
          leave={leaveForPoster}
          schedules={schedules}
          showToast={showToast}
        />
      )}

      {/* Gemini AI Slide-over Sidebar Drawer & Floating Toggle */}
      <GeminiSidebar
        isOpen={isGeminiSidebarOpen}
        onToggle={() => setIsGeminiSidebarOpen((prev) => !prev)}
        onClose={() => setIsGeminiSidebarOpen(false)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onNavigateTab={(tab: ActiveNavTab) => setActiveTab(tab)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        schedules={schedules}
        doctorLeaves={doctorLeaves}
        selectedDate={selectedLeaveDate || new Date().toISOString().split('T')[0]}
      />
    </div>
  );
}
