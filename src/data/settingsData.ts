import { PortalSystemSettings, ThermalPrinterSettings, ShiftTimeframeConfig, MohatFeeSettings, WaBroadcastSettings } from '../types/settingsTypes';
import { DEFAULT_BROADCAST_TEMPLATES } from './broadcastTemplates';
import { RSUMB_LOGO_BASE64 } from '../assets/logoRsumbBase64';

export const STORAGE_KEY_SYSTEM_SETTINGS = 'rsumb_system_settings_v1';
export const STORAGE_KEY_HOSPITAL_LOGO = 'rsumb_hospital_logo';
export const DEFAULT_HOSPITAL_LOGO = RSUMB_LOGO_BASE64;

export function getEffectiveHospitalLogo(): string {
  try {
    const custom = localStorage.getItem(STORAGE_KEY_HOSPITAL_LOGO);
    if (custom && custom.trim() && custom.trim().length > 20) return custom.trim();
    const settingsRaw = localStorage.getItem(STORAGE_KEY_SYSTEM_SETTINGS);
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      if (parsed.hospitalLogo && parsed.hospitalLogo.trim() && parsed.hospitalLogo.trim().length > 20) {
        return parsed.hospitalLogo.trim();
      }
    }
  } catch {}
  return DEFAULT_HOSPITAL_LOGO;
}

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
  hospitalLogo: DEFAULT_HOSPITAL_LOGO,
  lastUpdated: new Date().toISOString()
};

/**
 * Load portal system settings from localStorage with safe fallbacks
 */
export function loadPortalSettings(): PortalSystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYSTEM_SETTINGS);
    const customLogo = localStorage.getItem(STORAGE_KEY_HOSPITAL_LOGO);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PORTAL_SETTINGS,
        ...parsed,
        thermal: { ...DEFAULT_THERMAL_SETTINGS, ...(parsed.thermal || {}) },
        shiftTimes: { ...DEFAULT_SHIFT_TIMEFRAMES, ...(parsed.shiftTimes || {}) },
        mohatFees: { ...DEFAULT_MOHAT_FEE_SETTINGS, ...(parsed.mohatFees || {}) },
        hospitalLogo: customLogo || parsed.hospitalLogo || DEFAULT_HOSPITAL_LOGO,
        waBroadcast: {
          ...DEFAULT_WA_BROADCAST_SETTINGS,
          ...(parsed.waBroadcast || {}),
          templates: Array.isArray(parsed.waBroadcast?.templates) && parsed.waBroadcast.templates.length > 0
            ? parsed.waBroadcast.templates
            : DEFAULT_BROADCAST_TEMPLATES
        }
      };
    } else if (customLogo) {
      return {
        ...DEFAULT_PORTAL_SETTINGS,
        hospitalLogo: customLogo
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
    if (settings.hospitalLogo) {
      localStorage.setItem(STORAGE_KEY_HOSPITAL_LOGO, settings.hospitalLogo);
      window.dispatchEvent(new CustomEvent('rsumb_logo_updated', { detail: { logo: settings.hospitalLogo } }));
    }
    // Also trigger custom storage event so other components update synchronously
    window.dispatchEvent(new CustomEvent('rsumb_settings_updated', { detail: toSave }));
  } catch (err) {
    console.error('Failed to save portal system settings', err);
  }
}

/**
 * Update logo RSUMB secara mandiri dan picu event global
 */
export function saveHospitalLogo(logoBase64OrUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_HOSPITAL_LOGO, logoBase64OrUrl);
    const current = loadPortalSettings();
    savePortalSettings({
      ...current,
      hospitalLogo: logoBase64OrUrl
    });
    window.dispatchEvent(new CustomEvent('rsumb_logo_updated', { detail: { logo: logoBase64OrUrl } }));
  } catch (err) {
    console.error('Failed to save hospital logo', err);
  }
}

/**
 * Reset logo RSUMB ke logo resmi bawaan
 */
export function resetHospitalLogo(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HOSPITAL_LOGO);
    const current = loadPortalSettings();
    savePortalSettings({
      ...current,
      hospitalLogo: DEFAULT_HOSPITAL_LOGO
    });
    window.dispatchEvent(new CustomEvent('rsumb_logo_updated', { detail: { logo: DEFAULT_HOSPITAL_LOGO } }));
  } catch (err) {
    console.error('Failed to reset hospital logo', err);
  }
}
