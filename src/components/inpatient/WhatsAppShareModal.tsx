import React, { useState, useMemo } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  Phone,
  User,
  Bed,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { InpatientRoom } from '../../types/inpatientRoomTypes';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: InpatientRoom[];
  initialSelectedRoomId?: string | null;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  rooms,
  initialSelectedRoomId,
  showToast
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(() => {
    if (initialSelectedRoomId) return [initialSelectedRoomId];
    return rooms.length > 0 ? [rooms[0].id] : [];
  });
  const [includeBedAvailability, setIncludeBedAvailability] = useState(true);
  const [includeDoctorVisite, setIncludeDoctorVisite] = useState(true);
  const [includeFacilities, setIncludeFacilities] = useState(true);
  const [includeContactInfo, setIncludeContactInfo] = useState(true);
  const [copied, setCopied] = useState(false);

  // Sync initialSelectedRoomId when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialSelectedRoomId) {
        setSelectedRoomIds([initialSelectedRoomId]);
      } else if (rooms.length > 0 && selectedRoomIds.length === 0) {
        setSelectedRoomIds([rooms[0].id]);
      }
      setCopied(false);
    }
  }, [isOpen, initialSelectedRoomId]);

  const toggleRoomSelection = (roomId: string) => {
    if (selectedRoomIds.includes(roomId)) {
      if (selectedRoomIds.length > 1) {
        setSelectedRoomIds(selectedRoomIds.filter((id) => id !== roomId));
      } else {
        if (showToast) showToast('Pilih minimal satu kelas kamar untuk dikirim', 'info');
      }
    } else {
      setSelectedRoomIds([...selectedRoomIds, roomId]);
    }
  };

  const selectedRooms = useMemo(() => {
    return rooms.filter((r) => selectedRoomIds.includes(r.id));
  }, [rooms, selectedRoomIds]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Generate WhatsApp Formatted Text
  const generateWhatsAppMessage = () => {
    const greeting = patientName.trim()
      ? `Halo Bapak/Ibu *${patientName.trim()}*,`
      : 'Halo Bapak/Ibu,';

    let msg = `*INFORMASI TARIF & FASILITAS KAMAR RAWAT INAP*\n`;
    msg += `*RSU MUHAMMADIYAH BABAT (RSUMB)*\n`;
    msg += `--------------------------------------------------\n`;
    msg += `${greeting}\n`;
    msg += `Berikut rincian informasi tarif kamar rawat inap resmi RSUMB yang dapat kami sampaikan:\n\n`;

    selectedRooms.forEach((room, index) => {
      msg += `🏨 *${index + 1}. ${room.name.toUpperCase()}*\n`;
      msg += `📍 *Paviliun:* ${room.pavilion}\n`;
      msg += `🏷️ *Kelas:* ${room.classLevel}\n`;
      msg += `💰 *Tarif Kamar:* *${formatRupiah(room.roomRatePerDay)}* /hari\n`;

      if (includeDoctorVisite) {
        msg += `👨‍⚕️ *Visite dr. Umum:* ${formatRupiah(room.visiteGeneralDoctor)}\n`;
        msg += `🩺 *Visite dr. Spesialis:* ${formatRupiah(room.visiteSpecialistDoctor)}\n`;
      }

      if (includeBedAvailability) {
        const statusBed =
          room.availableBeds > 0
            ? `🟢 ${room.availableBeds} Bed Siap Pakai (dari total ${room.totalBeds} bed)`
            : `🔴 Sedang Penuh (${room.occupiedBeds}/${room.totalBeds} terisi)`;
        msg += `🛏️ *Ketersediaan Bed Saat Ini:* ${statusBed}\n`;
      }

      if (includeFacilities && room.patientRoomFacilities.length > 0) {
        msg += `✨ *Fasilitas Ruangan:*\n`;
        room.patientRoomFacilities.forEach((f) => {
          msg += `   • ${f}\n`;
        });
      }

      if (includeFacilities && room.familyRoomFacilities && room.familyRoomFacilities.length > 0) {
        msg += `🛋️ *Fasilitas Penunggu:*\n`;
        room.familyRoomFacilities.forEach((f) => {
          msg += `   • ${f}\n`;
        });
      }

      if (room.note) {
        msg += `ℹ️ _Catatan: ${room.note}_\n`;
      }

      msg += `\n`;
    });

    if (includeContactInfo) {
      msg += `--------------------------------------------------\n`;
      msg += `📞 *Layanan Informasi, Booking & Admisi 24 Jam RSUMB:*\n`;
      msg += `• WhatsApp Admisi: *0812-3456-7890* / *0856-4808-1121*\n`;
      msg += `• Telepon IGD / Operator: *(0322) 451121*\n`;
      msg += `• Alamat: Jl. KH. Ahmad Dahlan No. 14, Babat, Lamongan\n`;
      msg += `_Layanan Profesional & Islami - Cepat, Nyaman, dan Terpercaya._`;
    }

    return msg;
  };

  const sanitizePhone = (raw: string) => {
    let clean = raw.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    return clean;
  };

  const handleCopyText = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (showToast) showToast('Format ringkasan berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (showToast) showToast('Gagal menyalin teks', 'error');
    }
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const text = generateWhatsAppMessage();
    const cleanPhone = sanitizePhone(phoneNumber);

    if (cleanPhone && cleanPhone.length < 9) {
      if (showToast) showToast('Format nomor WhatsApp tidak valid', 'error');
      return;
    }

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (showToast) showToast('Membuka WhatsApp untuk mengirim rincian tarif...', 'info');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 via-[#005d42] to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 text-emerald-300">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                Kirim Ringkasan Tarif ke WhatsApp Pasien
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Format pesan resmi otomatis dengan rincian tarif, visite & fasilitas RSUMB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSendWhatsApp} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Inputs Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                Nomor WhatsApp Pasien / Keluarga
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Dapat dikosongkan untuk memilih kontak langsung di WA
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                Nama Pasien / Penanya (Opsional)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Contoh: Ibu Rina / Bpk. Ahmad"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-emerald-700" />
                Pilih Kelas Kamar yang Ditanyakan ({selectedRoomIds.length} dipilih):
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Bisa memilih lebih dari satu kamar untuk perbandingan
              </span>
            </label>

            <div className="max-h-36 overflow-y-auto custom-scrollbar p-2 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {rooms.map((room) => {
                const isSelected = selectedRoomIds.includes(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => toggleRoomSelection(room.id)}
                    className={`text-left p-2 rounded-lg border text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="truncate">{room.name}</div>
                      <div className="text-[10.5px] text-slate-500 font-normal truncate">
                        {room.pavilion} • {formatRupiah(room.roomRatePerDay)}/hr
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Include Toggles */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeDoctorVisite}
                onChange={(e) => setIncludeDoctorVisite(e.target.checked)}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
              <span>Jasa Visite Dokter</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeBedAvailability}
                onChange={(e) => setIncludeBedAvailability(e.target.checked)}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
              <span>Ketersediaan Bed Real-time</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeFacilities}
                onChange={(e) => setIncludeFacilities(e.target.checked)}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
              <span>Rincian Fasilitas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeContactInfo}
                onChange={(e) => setIncludeContactInfo(e.target.checked)}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
              <span>Kontak Booking Admisi</span>
            </label>
          </div>

          {/* Live Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Pratinjau Teks WhatsApp (Siap Kirim)
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Format Teks'}</span>
              </button>
            </div>

            <div className="bg-[#e5ddd5] p-3 rounded-xl border border-slate-300">
              <div className="bg-white p-3.5 rounded-lg rounded-tl-none shadow-xs text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar border border-emerald-100">
                {generateWhatsAppMessage()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-300"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>Salin Teks</span>
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Kirim via WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
