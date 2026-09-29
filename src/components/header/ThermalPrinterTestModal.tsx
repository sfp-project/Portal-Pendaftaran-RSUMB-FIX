import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Activity,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StaffUser } from '../../types/headerTypes';

interface ThermalPrinterTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStaff: StaffUser;
  onSuccessNotice?: (msg: string) => void;
}

export const ThermalPrinterTestModal: React.FC<ThermalPrinterTestModalProps> = ({
  isOpen,
  onClose,
  activeStaff,
  onSuccessNotice
}) => {
  const [copied, setCopied] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const testSlipCode = `TST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handlePrintNow = () => {
    setIsPrinting(true);
    onSuccessNotice?.('Mengirim sinyal uji cetak ke Printer Thermal POS RSUMB...');

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 250);
  };

  const rawThermalContent = `
==========================================
         RSU MUHAMMADIYAH BABAT
    Jl. KH. Ahmad Dahlan No. 14, Babat
   Telp. (0322) 451125 / Admisi: Ext 102
==========================================
    UJI CETAK PRINTER THERMAL ADMISI
==========================================
Tanggal   : ${dateStr} ${timeStr} WIB
Petugas   : ${activeStaff.name.toUpperCase()} (${activeStaff.role})
Shift     : ${activeStaff.shift.toUpperCase()}
Printer   : EPSON TM-T82X / POS THERMAL ${paperWidth}
Status    : SIMRS LIVE CONNECTED
------------------------------------------
HASIL DIAGNOSTIK PERANGKAT:
 [OK] KONEKSI SERIAL/USB/LAN : TERHUBUNG
 [OK] KEPALA CETAK HEAD DOT  : NORMAL
 [OK] AUTO-CUTTER PAPER      : SIAP
 [OK] RESOLUSI GRAFIS BARCODE: OPTIMAL
------------------------------------------
KODE TIKET TES : ${testSlipCode}
BARCODE CODE128: ||| | |||| || |||| ||| |
------------------------------------------
  PELAYANAN PASIEN ISLAMI, CEPAT & AMANAH
==========================================
`.trim();

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(rawThermalContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onSuccessNotice?.('Format teks ESC/POS berhasil disalin ke clipboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-10 my-auto"
        style={{
          maxHeight: '85vh',
          overflowY: 'auto',
          margin: 'auto'
        }}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-800 to-[#005d42] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Printer className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Uji Cetak Printer Thermal POS
              </h3>
              <p className="text-xs text-emerald-200/90">
                Loket Pendaftaran & Admisi RSUMB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition cursor-pointer"
            aria-label="Tutup Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Quick info banner */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-emerald-800">
                Koneksi Driver Thermal Siap
              </span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px] font-semibold text-slate-700">
              <span>Ukuran Kertas:</span>
              <button
                type="button"
                onClick={() => setPaperWidth(paperWidth === '80mm' ? '58mm' : '80mm')}
                className="text-[#005d42] font-bold underline cursor-pointer hover:text-emerald-700"
              >
                {paperWidth} (Ganti)
              </button>
            </div>
          </div>

          {/* Struk Thermal Mockup View (printable area) */}
          <div className="flex justify-center">
            <div
              id="thermal-test-slip-container"
              className={`bg-amber-50/40 border border-slate-300 rounded-lg p-4 font-mono text-[11px] leading-tight text-slate-900 shadow-inner ${
                paperWidth === '80mm' ? 'w-full max-w-[340px]' : 'w-full max-w-[280px]'
              }`}
            >
              <div className="text-center font-bold">
                <p className="text-xs">RSU MUHAMMADIYAH BABAT</p>
                <p className="text-[10px] text-slate-600 font-normal">
                  Jl. KH. Ahmad Dahlan No. 14, Babat
                </p>
                <p className="text-[10px] text-slate-600 font-normal">
                  Admisi & Pendaftaran Rawat Inap/Jalan
                </p>
                <div className="my-1.5 border-b border-dashed border-slate-400" />
                <p className="text-[11px] uppercase tracking-wider text-emerald-900">
                  UJI CETAK PRINTER THERMAL
                </p>
                <div className="my-1.5 border-b border-dashed border-slate-400" />
              </div>

              <div className="space-y-0.5 text-[10.5px]">
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span className="font-semibold">{dateStr} {timeStr}</span>
                </div>
                <div className="flex justify-between">
                  <span>Petugas:</span>
                  <span className="font-bold uppercase">{activeStaff.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift:</span>
                  <span className="font-semibold">{activeStaff.shift}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe Kertas:</span>
                  <span>POS Thermal {paperWidth}</span>
                </div>
              </div>

              <div className="my-2 border-b border-dashed border-slate-400" />

              <div className="space-y-1 text-[10.5px]">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Koneksi Port ESC/POS: OK</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Kerapatan Dot Matriks: OK</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Auto Cut Pisau Kertas: SIAP</span>
                </div>
              </div>

              <div className="my-2 border-b border-dashed border-slate-400" />

              <div className="text-center">
                <p className="text-[9.5px] text-slate-500 font-bold">KODE TIKET DIAGNOSTIK</p>
                <p className="font-bold text-xs text-slate-900">{testSlipCode}</p>
                {/* Simulated Barcode */}
                <div className="my-2 bg-slate-900 text-white font-mono tracking-widest text-[9px] py-1 rounded-xs">
                  ||||| | |||| || |||| ||| ||| ||||
                </div>
                <p className="text-[9px] text-slate-500">
                  Layanan Pasien Islami, Cepat & Amanah
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyRaw}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Teks ESC/POS</span>
              </>
            )}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrintNow}
              disabled={isPrinting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#005d42] hover:bg-[#004a35] rounded-xl shadow-sm transition hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Mencetak...' : 'Cetak Test Struk'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
