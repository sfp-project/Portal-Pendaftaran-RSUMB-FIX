import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  CalendarCheck,
  Building2,
  AlertTriangle,
  HelpCircle,
  LogOut,
  X,
  BarChart3,
  HeartHandshake,
  FileText,
  FolderArchive,
  Bed,
  Megaphone,
  Shield,
  Calculator,
  ClipboardList,
  Ticket,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ActiveNavTab } from '../types';
import { getEffectiveHospitalLogo, DEFAULT_HOSPITAL_LOGO } from '../data/settingsData';

interface SidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenEmergency: () => void;
  onOpenHelp: () => void;
  totalDoctorLeaves: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  isCollapsed = false,
  onToggleCollapse,
  onOpenEmergency,
  onOpenHelp,
  totalDoctorLeaves
}) => {
  const [hospitalLogo, setHospitalLogo] = useState<string>(() => getEffectiveHospitalLogo());

  // Listen to dynamic logo updates in real-time
  useEffect(() => {
    const handleLogoUpdated = (e: any) => {
      if (e?.detail?.logo) {
        setHospitalLogo(e.detail.logo);
      } else {
        setHospitalLogo(getEffectiveHospitalLogo());
      }
    };

    const handleSettingsUpdated = () => {
      setHospitalLogo(getEffectiveHospitalLogo());
    };

    window.addEventListener('rsumb_logo_updated', handleLogoUpdated);
    window.addEventListener('rsumb_settings_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleSettingsUpdated);

    return () => {
      window.removeEventListener('rsumb_logo_updated', handleLogoUpdated);
      window.removeEventListener('rsumb_settings_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleSettingsUpdated);
    };
  }, []);
  // Navigasi Utama Tunggal (Single Navigation Source)
  const navItems = [
    {
      id: 'dashboard' as ActiveNavTab,
      label: 'Beranda / Utama',
      icon: LayoutDashboard,
      badge: undefined
    },
    {
      id: 'schedules' as ActiveNavTab,
      label: 'Jadwal Dokter',
      icon: Calendar,
      badge: totalDoctorLeaves > 0 ? `${totalDoctorLeaves} Perubahan` : undefined
    },
    {
      id: 'quotas' as ActiveNavTab,
      label: 'Kuota BPJS',
      icon: ClipboardCheck,
      badge: 'Aktif'
    },
    {
      id: 'rooms' as ActiveNavTab,
      label: 'Tarif Kamar Rawat Inap',
      icon: Bed,
      badge: undefined
    },
    {
      id: 'queue' as ActiveNavTab,
      label: 'Jadwal Operasi Elektif',
      icon: CalendarCheck,
      badge: undefined
    },
    {
      id: 'khitan' as ActiveNavTab,
      label: 'Khitan Jumat',
      icon: HeartHandshake,
      badge: undefined
    },
    {
      id: 'jasa_raharja' as ActiveNavTab,
      label: 'Plafon Jasa Raharja',
      icon: Shield,
      badge: 'JR Data'
    },
    {
      id: 'letters' as ActiveNavTab,
      label: 'Dokumen Master',
      icon: FolderArchive,
      badge: undefined
    },
    {
      id: 'patient_notes' as ActiveNavTab,
      label: 'Catatan Khusus Pasien',
      icon: ClipboardList,
      badge: 'Admisi'
    },
    {
      id: 'contact_patients' as ActiveNavTab,
      label: 'Hubungi Pasien',
      icon: Megaphone,
      badge: 'WA Broadcast'
    },
    {
      id: 'kupon_mohat' as ActiveNavTab,
      label: 'Kupon Fee Mohat',
      icon: Ticket,
      badge: 'Baru'
    },
    {
      id: 'incentive_calc' as ActiveNavTab,
      label: 'Kalkulator Insentif & Jam Dinas',
      icon: Calculator,
      badge: 'Insentif Staf'
    },
    {
      id: 'reports' as ActiveNavTab,
      label: 'Analisis & Laporan',
      icon: BarChart3,
      badge: undefined
    },
    {
      id: 'settings' as ActiveNavTab,
      label: 'Pengaturan',
      icon: Sliders,
      badge: 'Sistem'
    }
  ];

  return (
    <>
      {/* Mobile & Tablet Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 ${
          isCollapsed ? 'lg:w-20 w-72 sm:w-80' : 'w-72 sm:w-80 lg:w-64'
        } bg-[#edf3fc] border-r border-[#d4e1f5] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          height: '100vh',
          maxHeight: '100vh'
        }}
      >
        {/* Brand Header: flex-shrink: 0 (fixed at top, does not scroll) */}
        <div className={`shrink-0 flex items-center ${isCollapsed ? 'justify-center lg:px-2 px-4' : 'justify-between px-4'} pt-3.5 pb-3 border-b border-[#d8e4f5] bg-[#edf3fc] z-10 transition-all`}>
          <div className="flex items-center gap-3">
            <img
              src={hospitalLogo || DEFAULT_HOSPITAL_LOGO}
              alt="Logo RSU Muhammadiyah Babat"
              className="w-10 h-10 object-contain drop-shadow-sm rounded-full bg-white p-0.5 ring-2 ring-[#005d42]/30 shrink-0 hover:scale-105 transition-transform"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_HOSPITAL_LOGO;
              }}
              referrerPolicy="no-referrer"
            />
            <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
              <h1 className="font-bold text-lg text-[#0b1c30] tracking-tight leading-tight">RSUMB</h1>
              <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">PORTAL PENDAFTARAN</p>
            </div>
          </div>

          {/* Desktop Sidebar Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex p-1.5 text-slate-500 hover:text-[#005d42] hover:bg-emerald-100/70 rounded-lg transition-colors cursor-pointer ${
                isCollapsed ? 'hidden' : 'block'
              }`}
              title="Ciutkan Sidebar (Ikon Saja)"
              aria-label="Ciutkan Sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          )}

          {/* Mobile & Tablet close button */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden cursor-pointer"
            aria-label="Tutup Menu Navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsed State Toggle Button under Brand (Desktop only) */}
        {isCollapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center py-2 px-2 border-b border-[#d8e4f5]/60 bg-emerald-50/50">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 text-[#005d42] hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
              title="Perluas Sidebar"
              aria-label="Perluas Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Nav Links Container: flex-1; overflow-y: auto (scrolls internally when items exceed screen height) */}
        <div
          id="sidebar-nav-container"
          className={`flex-1 min-h-0 overflow-y-auto sidebar-scrollbar sidebar-nav-container ${isCollapsed ? 'px-2 pt-2' : 'px-3 pt-3'}`}
          style={{
            overflowY: 'auto'
          }}
        >
          {/* Main Navigation Links with extra pb-24 (padding-bottom: 96px) at the end */}
          <nav
            className="flex flex-col gap-1.5 pb-24"
            style={{ paddingBottom: '96px' }}
            aria-label="Navigasi Utama"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (isCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpenMobile(false);
                    }}
                    title={`${item.label}${item.badge ? ` • ${item.badge}` : ''}`}
                    className={`w-full flex items-center justify-center py-3 rounded-xl transition-all relative cursor-pointer group ${
                      isActive
                        ? 'bg-[#005d42] text-white shadow-sm ring-1 ring-[#005d42]/40'
                        : 'text-[#3e4943] hover:bg-[#dce9ff]/70 hover:text-[#0b1c30]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-[#5c5f61] group-hover:text-[#005d42]'
                      }`}
                    />
                    {item.badge && (
                      <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#edf3fc]" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpenMobile(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all text-left relative cursor-pointer group ${
                    isActive
                      ? 'bg-[#005d42] text-white shadow-sm font-semibold ring-1 ring-[#005d42]/40'
                      : 'text-[#3e4943] hover:bg-[#dce9ff]/70 hover:text-[#0b1c30]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Active Accent Indicator Bar */}
                    {isActive && (
                      <span className="w-1.5 h-5 bg-emerald-300 rounded-full shrink-0 -ml-1 animate-in fade-in duration-200" />
                    )}
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-[#5c5f61] group-hover:text-[#005d42]'
                      }`}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        item.badge === 'Baru'
                          ? isActive
                            ? 'bg-amber-400 text-amber-950 border border-amber-300 shadow-2xs'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isActive
                          ? 'bg-[#004732] text-emerald-100 border border-emerald-400/40'
                          : 'bg-[#d3e4fe] text-[#005d42]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions: flex-shrink: 0 (pinned at bottom, does not scroll) */}
        <div className={`shrink-0 flex flex-col gap-1.5 ${isCollapsed ? 'p-2' : 'p-3'} border-t border-[#d8e4f5] bg-[#edf3fc]`}>
          {/* Emergency Alert Button */}
          <button
            onClick={onOpenEmergency}
            title="Peringatan Darurat"
            className={`w-full ${isCollapsed ? 'py-2.5 px-0 justify-center' : 'py-2 px-3'} bg-[#ba1a1a] hover:bg-red-800 active:scale-[0.98] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-200 animate-pulse" />
            <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>Peringatan Darurat</span>
          </button>

          <div className={`${isCollapsed ? 'flex flex-col gap-1' : 'grid grid-cols-2 gap-1.5'}`}>
            {/* Help Center */}
            <button
              onClick={onOpenHelp}
              title="Bantuan & Petunjuk Operasional"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#3e4943] hover:bg-[#dce9ff]/70 hover:text-[#0b1c30] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#5c5f61]" />
              <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>Bantuan</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                if (window.confirm('Keluar dari sesi portal pendaftaran RSUMB?')) {
                  window.location.reload();
                }
              }}
              title="Keluar Sesi"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#3e4943] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#5c5f61]" />
              <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>Keluar</span>
            </button>
          </div>

          <div className="text-[10px] text-[#6e7a73] text-center font-medium">
            {isCollapsed ? 'HFIS' : 'SIMRS RSUMB • HFIS v2.4'}
          </div>
        </div>
      </aside>
    </>
  );
};
