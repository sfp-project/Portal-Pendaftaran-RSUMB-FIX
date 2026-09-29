import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Bed,
  Sparkles,
  Building2,
  Stethoscope,
  Phone,
  ShieldCheck,
  ChevronRight,
  ImageIcon,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { InpatientRoom } from '../../types/inpatientRoomTypes';
import { RSUMB_LOGO_BASE64 } from '../../assets/logoRsumbBase64';

interface DownloadRoomCardImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: InpatientRoom[];
  initialSelectedRoomId?: string | null;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const DownloadRoomCardImageModal: React.FC<DownloadRoomCardImageModalProps> = ({
  isOpen,
  onClose,
  rooms,
  initialSelectedRoomId,
  showToast
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    if (initialSelectedRoomId) return initialSelectedRoomId;
    return rooms.length > 0 ? rooms[0].id : '';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialSelectedRoomId) {
        setSelectedRoomId(initialSelectedRoomId);
      } else if (rooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(rooms[0].id);
      }
      setIsCopied(false);
      setIsGenerating(false);
    }
  }, [isOpen, initialSelectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  if (!isOpen || !selectedRoom) return null;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    if (showToast) showToast('Menyiapkan gambar kartu tarif HD...', 'info');

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Small tick for layout stabilization
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5, // Crisp 300dpi-like mobile rendering
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      } as any);

      const link = document.createElement('a');
      const sanitizedName = selectedRoom.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
      link.download = `Kartu_Tarif_${sanitizedName}_RSUMB.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (showToast) showToast(`Kartu gambar ${selectedRoom.name} berhasil diunduh!`, 'success');
    } catch (err) {
      console.error('Error generating image:', err);
      if (showToast) showToast('Gagal membuat gambar kartu tarif', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2.0,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      } as any);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          if (showToast) showToast('Gagal memproses data gambar', 'error');
          setIsGenerating(false);
          return;
        }

        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setIsCopied(true);
            if (showToast) showToast('Gambar kartu berhasil disalin! Tinggal paste (Ctrl+V) di WhatsApp.', 'success');
            setTimeout(() => setIsCopied(false), 2500);
          } else {
            // Fallback to direct download
            handleDownloadPng();
          }
        } catch {
          // Clipboard image write blocked or not supported, fallback to download
          handleDownloadPng();
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy image error:', err);
      if (showToast) showToast('Gagal menyalin gambar, gunakan tombol Unduh', 'error');
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-auto animate-scaleUp">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 via-[#005d42] to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 text-emerald-300">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                Download Image (Kartu WA Tarif Kamar)
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Konversi kartu tarif menjadi file gambar PNG kualitas tinggi untuk dikirim ke pasien
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
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* Room Selector Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Kelas Kamar untuk Diekspor:
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.pavilion}) - {formatRupiah(r.roomRatePerDay)}/hari
                </option>
              ))}
            </select>
          </div>

          {/* Card Preview Container that will be captured by html2canvas */}
          <div className="border border-slate-200 rounded-2xl p-2 bg-slate-100/60 overflow-hidden flex justify-center">
            <div
              id="rsumb-room-flyer-card"
              ref={cardRef}
              className="w-full max-w-[480px] bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 text-slate-900 font-sans"
              style={{ minWidth: '380px' }}
            >
              {/* E-Card Header Kop RSUMB */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-950 via-[#004732] to-[#005d42] text-white flex items-center justify-between border-b-2 border-emerald-400">
                <div className="flex items-center gap-3">
                  <img
                    src={RSUMB_LOGO_BASE64}
                    alt="Logo RSUMB"
                    className="w-11 h-11 object-contain bg-white/10 p-1 rounded-xl shrink-0"
                  />
                  <div>
                    <div className="text-[13px] font-black tracking-wide leading-tight text-white uppercase">
                      RSU MUHAMMADIYAH BABAT
                    </div>
                    <div className="text-[10px] text-emerald-200 leading-tight">
                      Pelayanan Islami, Cepat & Terjangkau
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-[9.5px] font-extrabold text-emerald-200 uppercase tracking-wider block">
                    KATALOG RESMI
                  </span>
                  <span className="text-[9px] text-slate-300 block mt-0.5">
                    SIMRS RSUMB
                  </span>
                </div>
              </div>

              {/* Room Banner Visual / Photo */}
              <div className="relative h-44 bg-slate-800 overflow-hidden">
                {selectedRoom.imageUrl ? (
                  <img
                    src={selectedRoom.imageUrl}
                    alt={selectedRoom.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
                    <Building2 className="w-12 h-12 text-emerald-400/60 mb-1" />
                    <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                      {selectedRoom.pavilion}
                    </span>
                    <span className="text-base font-bold text-white">
                      {selectedRoom.name}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Class Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-extrabold shadow-sm uppercase tracking-wide">
                    {selectedRoom.classLevel}
                  </span>
                </div>

                {/* Bed Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold shadow-sm backdrop-blur-xs ${
                      selectedRoom.availableBeds > 0
                        ? 'bg-emerald-500/95 text-white'
                        : 'bg-rose-600/95 text-white'
                    }`}
                  >
                    {selectedRoom.availableBeds > 0
                      ? `🟢 ${selectedRoom.availableBeds} Bed Tersedia`
                      : '🔴 Penuh'}
                  </span>
                </div>

                {/* Title inside visual */}
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-[11px] font-medium text-emerald-300">
                    {selectedRoom.pavilion}
                  </div>
                  <div className="text-lg font-extrabold leading-snug drop-shadow-sm">
                    {selectedRoom.name}
                  </div>
                </div>
              </div>

              {/* Price & Visite Section */}
              <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Tarif Kamar Rawat Inap
                  </span>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-black text-[#005d42]">
                      {formatRupiah(selectedRoom.roomRatePerDay)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 ml-1">/hari</span>
                  </div>
                </div>

                <div className="text-right border-l-2 border-emerald-200/80 pl-3.5 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    Jasa Visite Dokter
                  </span>
                  <div className="text-[11px] text-slate-700">
                    Umum: <strong className="text-slate-900">{formatRupiah(selectedRoom.visiteGeneralDoctor)}</strong>
                  </div>
                  <div className="text-[11px] text-slate-700">
                    Spesialis: <strong className="text-slate-900">{formatRupiah(selectedRoom.visiteSpecialistDoctor)}</strong>
                  </div>
                </div>
              </div>

              {/* Facilities Section */}
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Fasilitas Kamar Pasien:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 font-medium">
                    {selectedRoom.patientRoomFacilities.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRoom.familyRoomFacilities && selectedRoom.familyRoomFacilities.length > 0 && (
                  <div>
                    <div className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                      Fasilitas Ruang Keluarga / Penunggu:
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10.5px] text-amber-900 font-medium">
                      {selectedRoom.familyRoomFacilities.map((f, i) => (
                        <span key={i} className="bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRoom.note && (
                  <p className="text-[10.5px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                    "{selectedRoom.note}"
                  </p>
                )}
              </div>

              {/* Official RSUMB Footer Info */}
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-[10px]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-emerald-300">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Layanan Booking & Admisi 24 Jam:</span>
                  </div>
                  <div className="text-slate-300">
                    WA: 0812-3456-7890 | Telp IGD: (0322) 451121
                  </div>
                  <div className="text-slate-400 text-[9px]">
                    Jl. KH. Ahmad Dahlan No. 14, Babat, Lamongan
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-800/60 text-emerald-200 font-bold text-[9px] border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    <span>Resmi RSUMB</span>
                  </div>
                </div>
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
              Tutup
            </button>
            <button
              type="button"
              onClick={handleCopyImageToClipboard}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-300 disabled:opacity-50"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Gambar Tersalin!' : 'Salin Gambar (Clipboard)'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Memproses PNG...' : 'Download Image .PNG (HD)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
