/**
 * ============================================================================
 * KONFIGURASI BACKEND GOOGLE APPS SCRIPT (GAS) RSUD/RSU MUHAMMADIYAH BABAT
 * ============================================================================
 * URL Web App GAS utama yang ditanamkan langsung (hardcoded) sebagai DEFAULT_GAS_URL.
 * Sistem akan otomatis menggunakan URL ini saat portal dibuka di PC/browser mana pun
 * jika localStorage pengguna dalam keadaan kosong, sehingga status langsung Online.
 */

export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwRSUMB_PORTAL_DATABASE_GAS_KEY_2026/exec';

export const STORAGE_KEY_GAS_URL = 'rsumb_gas_web_app_url';
export const STORAGE_KEY_LAST_SYNC = 'rsumb_gas_last_sync_time';
