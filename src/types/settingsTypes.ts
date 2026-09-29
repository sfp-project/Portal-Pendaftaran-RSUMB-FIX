// Tipe Data untuk Modul Pengaturan (Settings) Portal RSUMB
import { StaffShiftType } from './headerTypes';
import { BroadcastTemplatePreset } from './broadcastTypes';

export type SettingsTabId = 'thermal_printer' | 'staff_shift' | 'fees_labels' | 'wa_broadcast' | 'backup_data';

export interface ThermalPrinterSettings {
  paperSize: '58mm' | '80mm';
  autoPrintAfterSave: boolean;
  autoCutPaper: boolean;
  printDensity: 'Normal' | 'Pekat (Dark)' | 'Tinggi (High)';
  printerName: string;
}

export interface ShiftTimeframeConfig {
  shiftPagi: { start: string; end: string };
  shiftSiang: { start: string; end: string };
  shiftMalam: { start: string; end: string };
}

export interface MohatFeeSettings {
  desaMohatFee: number; // default: 25000
  pkmBpjsFeeTotal: number; // default: 20000
  pkmBpjsFeePerujuk: number; // default: 15000
  pkmBpjsFeeSopir: number; // default: 5000
  pkmUmumFeeTotal: number; // default: 35000
  pkmUmumFeePerujuk: number; // default: 25000
  pkmUmumFeeSopir: number; // default: 10000
  pasienUmumLabel: string; // default: "Pasien UMUM"
  autoMapMurniUmum: boolean; // default: true
}

export interface WaBroadcastSettings {
  gatewaySenderNumber: string; // e.g. "6281234567890"
  senderName: string; // e.g. "Humas & Admisi RSUMB"
  templates: BroadcastTemplatePreset[];
}

export interface PortalSystemSettings {
  thermal: ThermalPrinterSettings;
  shiftTimes: ShiftTimeframeConfig;
  mohatFees: MohatFeeSettings;
  waBroadcast: WaBroadcastSettings;
  autoRefreshHfis: boolean;
  queueAudio: boolean;
  lastUpdated: string;
}
