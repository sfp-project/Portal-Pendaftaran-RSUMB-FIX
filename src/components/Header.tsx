import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Settings,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
  User,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Stethoscope,
  Building2,
  Clock,
  ArrowRight,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { ActiveNavTab, DoctorSchedule, DoctorLeaveAnnouncement } from '../types';
import { ElectiveSurgerySchedule } from '../data/surgeryData';
import { KhitanParticipant } from '../data/khitanData';
import { StaffUser, SystemNotification } from '../types/headerTypes';
import {
  loadActiveStaff,
  saveActiveStaff,
  loadHeaderNotifications,
  saveHeaderNotifications
} from '../data/headerData';
import { NotificationDropdown } from './header/NotificationDropdown';
import { UserProfileDropdown } from './header/UserProfileDropdown';
import { StaffHandoverModal } from './header/StaffHandoverModal';
import { ThermalPrinterTestModal } from './header/ThermalPrinterTestModal';
import { SwitchAccountModal } from './header/SwitchAccountModal';
import { GoogleDriveSyncBadge } from './google/GoogleDriveSyncBadge';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  activeNavTab?: ActiveNavTab;
  setActiveNavTab?: (tab: ActiveNavTab) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenSettings: () => void;
  unreadCount?: number;
  onToggleGemini?: () => void;
  schedules?: DoctorSchedule[];
  doctorLeaves?: DoctorLeaveAnnouncement[];
  surgeryList?: ElectiveSurgerySchedule[];
  khitanParticipants?: KhitanParticipant[];
  onSelectPoli?: (poli: string) => void;
  onSelectDoctor?: (dpjp: string) => void;
  onClearSearch?: () => void;
  onNavigateToSchedules?: (query?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  activeNavTab,
  setActiveNavTab,
  searchTerm,
  setSearchTerm,
  onOpenSettings,
  unreadCount = 3,
  onToggleGemini,
  schedules = [],
  surgeryList = [],
  khitanParticipants = [],
  onSelectPoli,
  onSelectDoctor,
  onClearSearch,
  onNavigateToSchedules
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Notifications State & Persistence
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    return loadHeaderNotifications();
  });

  // Active Staff State & Persistence
  const [activeStaff, setActiveStaff] = useState<StaffUser>(() => {
    return loadActiveStaff();
  });

  // Modals & Toast State
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isThermalTestModalOpen, setIsThermalTestModalOpen] = useState(false);
  const [isSwitchAccountModalOpen, setIsSwitchAccountModalOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => {
      setToastNotice((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const unreadAlertsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    saveHeaderNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveHeaderNotifications(updated);
    showToast('Semua notifikasi sistem telah ditandai sudah dibaca.');
  };

  const handleNavigateToModule = (tab: ActiveNavTab, notif: SystemNotification) => {
    handleMarkAsRead(notif.id);
    setShowNotifications(false);
    if (setActiveNavTab) {
      setActiveNavTab(tab);
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  };

  const handleUpdateActiveStaff = (updated: StaffUser) => {
    setActiveStaff(updated);
    saveActiveStaff(updated);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    setIsSwitchAccountModalOpen(false);
    showToast('Sesi kerja diakhiri. Memuat ulang portal SIMRS...');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Live Multi-Category Search Results
  const liveResults = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return null;

    // 1. Doctors & Poliklinik Schedules
    const matchedDoctors: { dpjp: string; poli: string; hari: string; jam: string; ruangan: string }[] = [];
    const seenDoctors = new Set<string>();

    for (const s of schedules) {
      const match =
        (s.dpjp || '').toLowerCase().includes(q) ||
        (s.poli || '').toLowerCase().includes(q) ||
        (s.hari || '').toLowerCase().includes(q) ||
        (s.ruangan || '').toLowerCase().includes(q);
      if (match) {
        const key = `${s.dpjp}-${s.poli}`;
        if (!seenDoctors.has(key)) {
          seenDoctors.add(key);
          matchedDoctors.push({
            dpjp: s.dpjp,
            poli: s.poli,
            hari: s.hari,
            jam: s.jamMulai && s.jamSelesai ? `${s.jamMulai} - ${s.jamSelesai}` : (s.jamHfis || (s as any).jadwalHfis || 'Sesuai Jadwal'),
            ruangan: s.ruangan || ''
          });
          if (matchedDoctors.length >= 4) break;
        }
      }
    }

    // 2. Polikliniks
    const matchedPolis: string[] = [];
    const uniquePolis = Array.from(new Set(schedules.map((s) => s.poli)));
    for (const p of uniquePolis) {
      if (p.toLowerCase().includes(q)) {
        matchedPolis.push(p);
        if (matchedPolis.length >= 3) break;
      }
    }

    // 3. Scheduling Operasi Elektif
    const matchedSurgeries: { id: string; namaPasien: string; noRm: string; dokterOperator: string; poli: string; tindakan: string }[] = [];
    for (const s of surgeryList) {
      const match =
        (s.namaPasien || '').toLowerCase().includes(q) ||
        (s.noRm || '').toLowerCase().includes(q) ||
        (s.dokterOperator || '').toLowerCase().includes(q) ||
        (s.poli || '').toLowerCase().includes(q) ||
        (s.tindakanBedah || '').toLowerCase().includes(q);
      if (match) {
        matchedSurgeries.push({
          id: s.id,
          namaPasien: s.namaPasien,
          noRm: s.noRm,
          dokterOperator: s.dokterOperator,
          poli: s.poli,
          tindakan: s.tindakanBedah
        });
        if (matchedSurgeries.length >= 3) break;
      }
    }

    // 4. Khitan Jumat
    const matchedKhitan: { id: string; namaPeserta: string; namaWali: string; umur: number; status: string; noHp: string }[] = [];
    for (const k of khitanParticipants) {
      const match =
        (k.namaPeserta || '').toLowerCase().includes(q) ||
        (k.namaWali || '').toLowerCase().includes(q) ||
        (k.alamat || '').toLowerCase().includes(q) ||
        (k.noHp || '').includes(q);
      if (match) {
        matchedKhitan.push({
          id: k.id,
          namaPeserta: k.namaPeserta,
          namaWali: k.namaWali,
          umur: k.umur,
          status: k.status,
          noHp: k.noHp
        });
        if (matchedKhitan.length >= 3) break;
      }
    }

    const totalCount = matchedDoctors.length + matchedPolis.length + matchedSurgeries.length + matchedKhitan.length;

    return {
      totalCount,
      matchedDoctors,
      matchedPolis,
      matchedSurgeries,
      matchedKhitan
    };
  }, [searchTerm, schedules, surgeryList, khitanParticipants]);

  const handleSelectDoctor = (dpjp: string) => {
    setIsSearchDropdownOpen(false);
    if (onSelectDoctor) {
      onSelectDoctor(dpjp);
    } else {
      setSearchTerm(dpjp);
      setActiveNavTab?.('schedules');
      setTimeout(() => {
        const tableSection = document.getElementById('schedule-table-section');
        if (tableSection) {
          tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }
      }, 120);
    }
  };

  const handleSelectPoli = (poli: string) => {
    setIsSearchDropdownOpen(false);
    if (onSelectPoli) {
      onSelectPoli(poli);
    } else {
      setSearchTerm(poli);
      setActiveNavTab?.('schedules');
    }
    setTimeout(() => {
      const tableSection = document.getElementById('schedule-table-section');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 350, behavior: 'smooth' });
      }
    }, 120);
  };

  const handleSelectSurgery = (pasien: string) => {
    setSearchTerm(pasien);
    setActiveNavTab?.('queue');
    setIsSearchDropdownOpen(false);
    setTimeout(() => {
      window.scrollTo({ top: 250, behavior: 'smooth' });
    }, 120);
  };

  const handleSelectKhitan = (peserta: string) => {
    setSearchTerm(peserta);
    setActiveNavTab?.('khitan');
    setIsSearchDropdownOpen(false);
    setTimeout(() => {
      window.scrollTo({ top: 250, behavior: 'smooth' });
    }, 120);
  };

  const handleSubmitSearch = () => {
    setIsSearchDropdownOpen(false);
    const q = (searchTerm || '').toLowerCase().trim();

    // Check if query matches surgery or khitan specifically
    const hasSurgeryMatch = surgeryList.some(
      (s) => (s.namaPasien || '').toLowerCase().includes(q) || (s.noRm || '').toLowerCase().includes(q)
    );
    const hasKhitanMatch = khitanParticipants.some(
      (k) => (k.namaPeserta || '').toLowerCase().includes(q) || (k.namaWali || '').toLowerCase().includes(q)
    );

    if (hasSurgeryMatch && !hasKhitanMatch && activeNavTab === 'queue') {
      return;
    }
    if (hasKhitanMatch && !hasSurgeryMatch && activeNavTab === 'khitan') {
      return;
    }

    // Default: Navigate to Jadwal Dokter (schedules) and scroll smoothly
    if (onNavigateToSchedules) {
      onNavigateToSchedules(searchTerm);
    } else {
      setActiveNavTab?.('schedules');
      setTimeout(() => {
        const tableSection = document.getElementById('schedule-table-section');
        if (tableSection) {
          tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }
      }, 120);
    }
  };

  const recentNotifications = [
    {
      id: 1,
      title: 'Perubahan Jadwal Dr. Ilma Alifa, Sp.JP',
      desc: 'Jadwal 4 Sept dimajukan ke 3 Sept 2026',
      time: '10 menit lalu',
      type: 'info'
    },
    {
      id: 2,
      title: 'Kuota Poli Anak Penuh',
      desc: 'dr. Budi Santoso (50/50 Pasien terdaftar)',
      time: '25 menit lalu',
      type: 'alert'
    },
    {
      id: 3,
      title: 'Sinkronisasi HFIS BPJS Berhasil',
      desc: '248 Jadwal poliklinik terverifikasi valid',
      time: '1 jam lalu',
      type: 'success'
    }
  ];

  return (
    <header className="bg-[#f8f9ff]/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#d8e4f5] shadow-xs px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 transition-all">
      {/* Left side: Hamburger (Mobile) & App Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 text-[#005d42] hover:bg-[#e5eeff] rounded-lg md:hidden transition-colors cursor-pointer"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <h2 className="font-bold text-lg sm:text-xl lg:text-2xl text-[#005d42] tracking-tight whitespace-nowrap">
            PENDAFTARAN RSUMB
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>SIMRS Live</span>
          </span>
        </div>
      </div>

      {/* Center: Search Bar Global with Live Real-time Results Dropdown */}
      <div className="flex-1 max-w-lg mx-2 sm:mx-4" ref={searchContainerRef}>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#5c5f61] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchTerm.trim()) setIsSearchDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmitSearch();
              } else if (e.key === 'Escape') {
                setIsSearchDropdownOpen(false);
              }
            }}
            placeholder="Cari dokter, spesialisasi, atau poliklinik..."
            title="Cari dokter, spesialisasi, atau poliklinik..."
            className="w-full pl-9 pr-8 py-2 bg-[#e5eeff]/70 hover:bg-[#e5eeff] focus:bg-white text-xs sm:text-sm text-[#0b1c30] placeholder-[#5c5f61] rounded-full border border-[#bdc9c1]/60 focus:outline-none focus:border-[#005d42] focus:ring-2 focus:ring-[#005d42]/20 transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm('');
                setIsSearchDropdownOpen(false);
                onClearSearch?.();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-200/60 transition"
              aria-label="Bersihkan pencarian dan reset filter"
              title="Bersihkan pencarian dan reset filter tabel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Live Search Interactive Results Dropdown */}
          {isSearchDropdownOpen && searchTerm.trim() && liveResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden divide-y divide-slate-100 max-h-[82vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 text-left">
              {/* Dropdown Header */}
              <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#005d42]" />
                  Hasil Pencarian Real-Time
                </span>
                <span className="text-[11px] font-bold text-[#005d42] bg-emerald-100 px-2 py-0.5 rounded-full">
                  {liveResults.totalCount} Ditemukan
                </span>
              </div>

              {/* Category 1: Dokter & Jadwal Praktik */}
              {liveResults.matchedDoctors.length > 0 && (
                <div className="p-2">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Stethoscope className="w-3 h-3 text-[#005d42]" />
                    Dokter Spesialis & Praktik
                  </p>
                  <div className="space-y-1">
                    {liveResults.matchedDoctors.map((doc, idx) => (
                      <button
                        key={`doc-${idx}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDoctor(doc.dpjp);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-between group cursor-pointer focus:outline-none focus:bg-emerald-50"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-[#005d42] truncate">
                            {doc.dpjp}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                              Poli {doc.poli}
                            </span>
                            <span>•</span>
                            <span className="truncate flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {doc.hari}: {doc.jam}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#005d42] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 2: Poliklinik */}
              {liveResults.matchedPolis.length > 0 && (
                <div className="p-2">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-emerald-600" />
                    Poliklinik Terkait
                  </p>
                  <div className="space-y-1">
                    {liveResults.matchedPolis.map((poli, idx) => (
                      <button
                        key={`poli-${idx}`}
                        onClick={() => handleSelectPoli(poli)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                          Poliklinik {poli}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 group-hover:text-[#005d42] flex items-center gap-1">
                          Lihat Jadwal
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: Operasi Elektif */}
              {liveResults.matchedSurgeries.length > 0 && (
                <div className="p-2">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-teal-600" />
                    Jadwal Operasi Elektif (IBS)
                  </p>
                  <div className="space-y-1">
                    {liveResults.matchedSurgeries.map((op) => (
                      <button
                        key={`op-${op.id}`}
                        onClick={() => handleSelectSurgery(op.namaPasien)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-teal-800 truncate">
                            {op.namaPasien} <span className="font-mono text-slate-400 text-[10px]">({op.noRm})</span>
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            DPJP: {op.dokterOperator} • {op.poli} ({op.tindakan})
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full shrink-0">
                          Operasi
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 4: Khitan Jumat */}
              {liveResults.matchedKhitan.length > 0 && (
                <div className="p-2">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <HeartHandshake className="w-3 h-3 text-emerald-600" />
                    Peserta Khitan Berkah Jumat
                  </p>
                  <div className="space-y-1">
                    {liveResults.matchedKhitan.map((k) => (
                      <button
                        key={`khitan-${k.id}`}
                        onClick={() => handleSelectKhitan(k.namaPeserta)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                            {k.namaPeserta} ({k.umur} thn)
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Wali: {k.namaWali} • Telp: {k.noHp}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          {k.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when query doesn't match */}
              {liveResults.totalCount === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs text-slate-600 font-medium">
                    Tidak ditemukan data untuk <span className="font-bold text-slate-900">"{searchTerm}"</span>.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Coba gunakan kata kunci nama dokter, poliklinik, rekam medis pasien operasi, atau peserta khitan.
                  </p>
                </div>
              )}

              {/* Dropdown Action Footer */}
              <div className="p-2.5 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter</kbd> untuk cari
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitSearch();
                  }}
                  className="font-bold text-[#005d42] hover:text-[#004a35] hover:underline flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition"
                >
                  <span>Buka Hasil Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Google Drive Sync Status, Tombol Asisten AI, Notifikasi, dan Menu Profil Pengguna */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Google Drive Dual-Sync Cloud Status */}
        <GoogleDriveSyncBadge onOpenSettings={onOpenSettings} showToast={showToast} />

        {/* Tombol Asisten AI */}
        {onToggleGemini && (
          <button
            onClick={onToggleGemini}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-[#005d42] hover:from-emerald-700 hover:to-[#004a35] text-white rounded-full font-semibold text-xs sm:text-sm border border-emerald-400/40 shadow-xs hover:shadow-md transition-all hover:scale-102 active:scale-95 cursor-pointer"
            aria-label="Buka Asisten AI"
            title="Buka Asisten AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
            <span className="hidden sm:inline font-medium">Asisten AI</span>
          </button>
        )}

        {/* Notifikasi Popover dengan Lonceng & Dropdown Interaktif */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-[#005d42] hover:bg-[#e5eeff] rounded-full relative transition-colors cursor-pointer"
            aria-label="Pemberitahuan Sistem SIMRS"
            title={`Notifikasi Pelayanan (${unreadAlertsCount} Belum Dibaca)`}
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white font-bold text-[10px] rounded-full ring-2 ring-white shadow-xs">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative">{unreadAlertsCount}</span>
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onNavigateToModule={handleNavigateToModule}
          />
        </div>

        {/* Menu Profil Pengguna & Flyout Interaktif */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full hover:bg-[#e5eeff] transition-all cursor-pointer border border-transparent hover:border-slate-200"
            aria-label="Menu Profil Petugas"
            title={`Petugas: ${activeStaff.name} (${activeStaff.shift})`}
          >
            <div className="relative">
              {activeStaff.avatarUrl ? (
                <img
                  src={activeStaff.avatarUrl}
                  alt={activeStaff.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-emerald-700/30 object-cover shadow-2xs ring-2 ring-emerald-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#005d42] text-white text-xs font-bold flex items-center justify-center border border-emerald-800 shadow-2xs">
                  {activeStaff.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            <div className="hidden xl:flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 leading-none">
                  {activeStaff.name}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-200/80">
                  {activeStaff.shift}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5">{activeStaff.role}</span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          <UserProfileDropdown
            isOpen={showProfileMenu}
            onClose={() => setShowProfileMenu(false)}
            activeStaff={activeStaff}
            onOpenHandoverModal={() => setIsHandoverModalOpen(true)}
            onOpenThermalTestModal={() => setIsThermalTestModalOpen(true)}
            onOpenSwitchAccountModal={() => setIsSwitchAccountModalOpen(true)}
            onOpenSettings={onOpenSettings}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Floating Toast Notice */}
      {toastNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotice}</span>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-white ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MODAL 1: Form Handover & Ganti Shift */}
      <StaffHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        activeStaff={activeStaff}
        onUpdateActiveStaff={handleUpdateActiveStaff}
        onSuccessNotice={showToast}
      />

      {/* MODAL 2: Uji Cetak Printer Thermal */}
      <ThermalPrinterTestModal
        isOpen={isThermalTestModalOpen}
        onClose={() => setIsThermalTestModalOpen(false)}
        activeStaff={activeStaff}
        onSuccessNotice={showToast}
      />

      {/* MODAL 3: Keluar / Switch Account Petugas */}
      <SwitchAccountModal
        isOpen={isSwitchAccountModalOpen}
        onClose={() => setIsSwitchAccountModalOpen(false)}
        activeStaff={activeStaff}
        onSelectStaff={(newStaff) => {
          handleUpdateActiveStaff(newStaff);
          showToast(`Akun petugas berhasil dialihkan ke ${newStaff.name} (${newStaff.role})`);
        }}
        onLogout={handleLogout}
      />
    </header>
  );
};
