import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  MessageSquareX,
  ArrowRight,
  CheckCheck,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import { SystemNotification, NotificationCategory } from '../../types/headerTypes';
import { ActiveNavTab } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToModule: (tab: ActiveNavTab, notification: SystemNotification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToModule
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | NotificationCategory>('ALL');

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const operasionalUnreadCount = useMemo(() => {
    return notifications.filter((n) => n.category === 'Operasional' && !n.isRead).length;
  }, [notifications]);

  const pesanWaUnreadCount = useMemo(() => {
    return notifications.filter((n) => n.category === 'Pesan WA' && !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeCategoryFilter === 'ALL') return notifications;
    return notifications.filter((n) => n.category === activeCategoryFilter);
  }, [notifications, activeCategoryFilter]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay to close when clicking outside */}
      <div
        className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Dropdown Panel Overlay */}
      <div
        className="absolute right-0 top-full mt-2 w-[92vw] sm:w-[420px] md:w-[460px] max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-[9999] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-150"
        style={{ top: '100%', right: 0, marginTop: '8px' }}
      >
        {/* Header Section */}
        <div className="p-4 bg-gradient-to-r from-emerald-50/90 via-[#f0fdf4] to-slate-50 border-b border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#005d42] text-white flex items-center justify-center shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  Notifikasi Sistem SIMRS
                  {unreadCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {unreadCount} Baru
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Peringatan operasional & pelaporan pesan WhatsApp
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Category Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-emerald-100/70">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-[#005d42] text-white shadow-xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategoryFilter === 'ALL'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {notifications.length}
              </span>
            </button>

            {/* Operasional Filter */}
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('Operasional')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeCategoryFilter === 'Operasional'
                  ? 'bg-[#005d42] text-white shadow-xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Operasional</span>
              {operasionalUnreadCount > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-white">
                  {operasionalUnreadCount}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-200 text-slate-700">
                  {notifications.filter((n) => n.category === 'Operasional').length}
                </span>
              )}
            </button>

            {/* Pesan WA Filter */}
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('Pesan WA')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeCategoryFilter === 'Pesan WA'
                  ? 'bg-[#005d42] text-white shadow-xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <MessageSquareX className="w-3.5 h-3.5 text-rose-500" />
              <span>Pesan WA</span>
              {pesanWaUnreadCount > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500 text-white">
                  {pesanWaUnreadCount}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-200 text-slate-700">
                  {notifications.filter((n) => n.category === 'Pesan WA').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications List Body */}
        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[55vh] p-2 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCheck className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">Tidak ada notifikasi aktif</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Semua sistem operasional dan pengiriman pesan berjalan normal.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isOperasional = notif.category === 'Operasional';

              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl transition-all border ${
                    notif.isRead
                      ? 'bg-white hover:bg-slate-50/80 border-transparent'
                      : 'bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-200/70 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon based on Subcategory */}
                    <div className="mt-0.5 shrink-0">
                      {notif.subCategory === 'Jadwal DPJP' && (
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                          <Calendar className="w-4 h-4" />
                        </div>
                      )}
                      {notif.subCategory === 'Kuota BPJS' && (
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {notif.subCategory === 'Handover Shift' && (
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shadow-2xs">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                      )}
                      {notif.subCategory === 'Broadcast Gagal' && (
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shadow-2xs">
                          <MessageSquareX className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isOperasional
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                                : 'bg-rose-100 text-rose-800 border border-rose-200/80'
                            }`}
                          >
                            {notif.category}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {notif.subCategory}
                          </span>
                        </div>

                        {/* Unread dot */}
                        {!notif.isRead && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                            Baru
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                        {notif.title}
                      </h5>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 text-[11px]">
                        <span className="text-[10px] text-slate-400">{notif.time}</span>

                        {/* Action buttons: Tandai Dibaca and Lihat Detail */}
                        <div className="flex items-center gap-2">
                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notif.id);
                              }}
                              className="text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 px-2 py-0.5 rounded-md transition cursor-pointer"
                              title="Tandai notifikasi ini sudah dibaca"
                            >
                              Tandai Dibaca
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onNavigateToModule(notif.targetTab, notif);
                            }}
                            className="text-[10.5px] font-bold text-[#005d42] hover:text-[#004a35] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-0.5 rounded-md flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            title="Buka modul terkait langsung"
                          >
                            <span>Lihat Detail</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              unreadCount > 0
                ? 'text-[#005d42] hover:bg-emerald-100/70 cursor-pointer'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Tandai Semua Dibaca</span>
          </button>

          <span className="text-[10px] text-slate-400 font-medium">
            RSU Muhammadiyah Babat
          </span>
        </div>
      </div>
    </>
  );
};
