import { PortalSystemSettings, ThermalPrinterSettings, ShiftTimeframeConfig, MohatFeeSettings, WaBroadcastSettings } from '../types/settingsTypes';
import { DEFAULT_BROADCAST_TEMPLATES } from './broadcastTemplates';

export const STORAGE_KEY_SYSTEM_SETTINGS = 'rsumb_system_settings_v1';

export const DEFAULT_THERMAL_SETTINGS: ThermalPrinterSettings = {
  paperSize: '80mm',
  autoPrintAfterSave: true,
  autoCutPaper: true,
  printDensity: 'Normal',
  printerName: 'POS-58/80 Thermal Printer'
};

export const DEFAULT_SHIFT_TIMEFRAMES: ShiftTimeframeConfig = {
  shiftPagi: { start: '07:00', end: '14:00' },
  shiftSiang: { start: '14:00', end: '21:00' },
  shiftMalam: { start: '21:00', end: '07:00' }
};

export const DEFAULT_MOHAT_FEE_SETTINGS: MohatFeeSettings = {
  desaMohatFee: 25000,
  pkmBpjsFeeTotal: 20000,
  pkmBpjsFeePerujuk: 15000,
  pkmBpjsFeeSopir: 5000,
  pkmUmumFeeTotal: 35000,
  pkmUmumFeePerujuk: 25000,
  pkmUmumFeeSopir: 10000,
  pasienUmumLabel: 'Pasien UMUM',
  autoMapMurniUmum: true
};

export const DEFAULT_WA_BROADCAST_SETTINGS: WaBroadcastSettings = {
  gatewaySenderNumber: '6281234567890',
  senderName: 'Humas & Admisi RSUMB',
  templates: DEFAULT_BROADCAST_TEMPLATES
};

export const DEFAULT_PORTAL_SETTINGS: PortalSystemSettings = {
  thermal: DEFAULT_THERMAL_SETTINGS,
  shiftTimes: DEFAULT_SHIFT_TIMEFRAMES,
  mohatFees: DEFAULT_MOHAT_FEE_SETTINGS,
  waBroadcast: DEFAULT_WA_BROADCAST_SETTINGS,
  autoRefreshHfis: true,
  queueAudio: true,
  lastUpdated: new Date().toISOString()
};

/**
 * Load portal system settings from localStorage with safe fallbacks
 */
export function loadPortalSettings(): PortalSystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYSTEM_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PORTAL_SETTINGS,
        ...parsed,
        thermal: { ...DEFAULT_THERMAL_SETTINGS, ...(parsed.thermal || {}) },
        shiftTimes: { ...DEFAULT_SHIFT_TIMEFRAMES, ...(parsed.shiftTimes || {}) },
        mohatFees: { ...DEFAULT_MOHAT_FEE_SETTINGS, ...(parsed.mohatFees || {}) },
        waBroadcast: {
          ...DEFAULT_WA_BROADCAST_SETTINGS,
          ...(parsed.waBroadcast || {}),
          templates: Array.isArray(parsed.waBroadcast?.templates) && parsed.waBroadcast.templates.length > 0
            ? parsed.waBroadcast.templates
            : DEFAULT_BROADCAST_TEMPLATES
        }
      };
    }
  } catch (err) {
    console.error('Failed to load portal system settings', err);
  }
  return DEFAULT_PORTAL_SETTINGS;
}

/**
 * Save updated portal system settings to localStorage
 */
export function savePortalSettings(settings: PortalSystemSettings): void {
  try {
    const toSave: PortalSystemSettings = {
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_SYSTEM_SETTINGS, JSON.stringify(toSave));
    // Also trigger custom storage event so other components update synchronously
    window.dispatchEvent(new CustomEvent('rsumb_settings_updated', { detail: toSave }));
  } catch (err) {
    console.error('Failed to save portal system settings', err);
  }
}
