import { PosterPromoItem } from '../types/posterPromoTypes';

export const STORAGE_KEY_POSTERS = 'rsumb_master_posters';
export const LEGACY_STORAGE_KEY_POSTERS = 'master_posters_data';

// Helper date comparison
export const getTodayDateString = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Memeriksa apakah poster/promo telah melewati batas kadaluarsa
 */
export const isPosterExpired = (tanggalKadaluarsa?: string): boolean => {
  if (!tanggalKadaluarsa || !tanggalKadaluarsa.trim()) return false;
  const today = getTodayDateString();
  return tanggalKadaluarsa.trim() < today;
};

/**
 * Format tanggal Indonesia ramah staf
 */
export const formatIndoDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      return `${day} ${months[monthIndex]} ${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

// SVG Posters for seed items (RSUMB Brand: Emerald Green, Gold, Crisp Typography)
const createSamplePosterSvg = (
  title: string,
  category: string,
  badgeText: string,
  tagline: string,
  bgColor1: string,
  bgColor2: string,
  accentColor: string
): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor1}" />
          <stop offset="100%" stop-color="${bgColor2}" />
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="800" height="1000" fill="url(#grad)" />
      <rect width="800" height="1000" fill="url(#grid)" />
      
      <!-- Top Hospital Bar -->
      <rect x="0" y="0" width="800" height="110" fill="rgba(0,0,0,0.25)" />
      <circle cx="70" cy="55" r="32" fill="${accentColor}" />
      <text x="70" y="65" font-family="'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">✚</text>
      <text x="120" y="48" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="1">RSU MUHAMMADIYAH BABAT</text>
      <text x="120" y="74" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="500" fill="rgba(255,255,255,0.85)">Jl. Raya Babat-Surabaya KM. 4 Babat, Lamongan</text>
      
      <!-- Category Badge -->
      <g transform="translate(60, 160)">
        <rect width="220" height="38" rx="19" fill="${accentColor}" />
        <text x="110" y="24" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">${category.toUpperCase()}</text>
      </g>
      
      <!-- Main Title -->
      <text x="60" y="260" font-family="'Plus Jakarta Sans', sans-serif" font-size="44" font-weight="900" fill="#ffffff" line-height="1.2">
        <tspan x="60" dy="0">${title.slice(0, 26)}</tspan>
        <tspan x="60" dy="55">${title.slice(26, 55)}</tspan>
      </text>
      
      <!-- Highlight Card -->
      <rect x="60" y="380" width="680" height="360" rx="24" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
      
      <circle cx="400" cy="490" r="70" fill="rgba(255,255,255,0.15)" stroke="${accentColor}" stroke-width="3" />
      <text x="400" y="505" font-family="'Plus Jakarta Sans', sans-serif" font-size="52" text-anchor="middle" fill="#ffffff">★</text>
      
      <text x="400" y="610" font-family="'Plus Jakarta Sans', sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">${badgeText}</text>
      <text x="400" y="655" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="500" fill="rgba(255,255,255,0.9)" text-anchor="middle">${tagline}</text>
      
      <!-- Bottom Footer Action -->
      <rect x="60" y="780" width="680" height="150" rx="20" fill="rgba(0,0,0,0.3)" />
      <text x="90" y="830" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="700" fill="${accentColor}">INFORMASI & PENDAFTARAN RESMI:</text>
      <text x="90" y="865" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="800" fill="#ffffff">Admisi & IGD 24 Jam: (0322) 451111</text>
      <text x="90" y="895" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="600" fill="rgba(255,255,255,0.85)">WhatsApp Center RSUMB: 0812-3211-1184</text>
      
      <rect x="580" y="810" width="130" height="90" rx="14" fill="#ffffff" />
      <text x="645" y="855" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#005d42" text-anchor="middle">OFFICIAL</text>
      <text x="645" y="875" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#005d42" text-anchor="middle">FLYER RSUMB</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

export const INITIAL_SEED_POSTERS: PosterPromoItem[] = [
  {
    id: 'poster-seed-01',
    judul: 'Paket Medical Check Up (MCU) Eksekutif RSUMB',
    kategoriPromo: 'BPJS/MCU',
    tags: ['mcu', 'check up', 'laboratorium', 'rontgen', 'eksekutif', 'skrining'],
    tanggalMulai: '2026-09-01',
    tanggalKadaluarsa: '2026-12-31',
    namaBerkas: 'Poster_MCU_Eksekutif_RSUMB_2026.png',
    formatBerkas: 'png',
    ukuranBerkas: '1.4 MB',
    ukuranBytes: 1468000,
    tanggalDiunggah: '2026-09-02 08:30',
    fileData: createSamplePosterSvg(
      'Paket Medical Check Up Eksekutif',
      'BPJS / MCU',
      'SKRINING KESEHATAN MENYELURUH',
      'Pemeriksaan Lab Lengkap, Rontgen Thorax, & EKG Jantung',
      '#005d42',
      '#003827',
      '#10b981'
    ),
    keterangan: 'Poster promo paket MCU berkala untuk instansi kedinasan, perusahaan rekanan, dan perorangan.'
  },
  {
    id: 'poster-seed-02',
    judul: 'Layanan Unggulan Poli Jantung (Treadmill Test & USG Echo)',
    kategoriPromo: 'Layanan Unggulan',
    tags: ['poli jantung', 'spesialis', 'treadmill', 'echo', 'ekg', 'rawat jalan'],
    tanggalMulai: '2026-08-01',
    tanggalKadaluarsa: '2027-01-31',
    namaBerkas: 'Banner_Poli_Jantung_RSUMB.jpg',
    formatBerkas: 'jpg',
    ukuranBerkas: '2.1 MB',
    ukuranBytes: 2202000,
    tanggalDiunggah: '2026-08-10 11:15',
    fileData: createSamplePosterSvg(
      'Layanan Unggulan Poli Jantung',
      'Layanan Unggulan',
      'DETEKSI DINI PENYAKIT JANTUNG',
      'Didukung Dokter Spesialis Jantung & Pembuluh Darah (Sp.JP)',
      '#0f172a',
      '#005d42',
      '#06b6d4'
    ),
    keterangan: 'Banner sosialisasi fasilitas treadmill dan ekokardiografi untuk pasien rujukan BPJS & Umum.'
  },
  {
    id: 'poster-seed-03',
    judul: 'Promo Khitan Massal Ceria & Liburan Sekolah Berhadiah',
    kategoriPromo: 'Tarif Promo',
    tags: ['khitan', 'sunat ceria', 'diskon', 'anak', 'liburan', 'bingkisan'],
    tanggalMulai: '2026-06-01',
    tanggalKadaluarsa: '2026-07-31', // Expired sample for testing auto-expiry alert!
    namaBerkas: 'Flier_Khitan_Ceria_Liburan.png',
    formatBerkas: 'png',
    ukuranBerkas: '1.8 MB',
    ukuranBytes: 1887000,
    tanggalDiunggah: '2026-06-05 14:20',
    fileData: createSamplePosterSvg(
      'Promo Khitan Massal Ceria',
      'Tarif Promo',
      'METODE MODERN & CEPAT SEMBUH',
      'Bingkisan Sarung, Tas Sekolah, & Kontrol Gratis Sampai Sembuh',
      '#b45309',
      '#78350f',
      '#f59e0b'
    ),
    keterangan: 'Promo tarif khusus khitan musim liburan sekolah tahun ajaran 2026 (Status: Telah Berakhir).'
  },
  {
    id: 'poster-seed-04',
    judul: 'Pelayanan Mobil Sehat (Mohat) Antar Jemput Pasien Ranap',
    kategoriPromo: 'Umum',
    tags: ['mohat', 'antar jemput', 'mobil sehat', 'desa', 'ranap', 'gratis'],
    tanggalMulai: '2026-07-01',
    tanggalKadaluarsa: '2026-12-31',
    namaBerkas: 'Poster_Mobil_Sehat_Mohat_RSUMB.png',
    formatBerkas: 'png',
    ukuranBerkas: '1.6 MB',
    ukuranBytes: 1677000,
    tanggalDiunggah: '2026-07-15 09:45',
    fileData: createSamplePosterSvg(
      'Pelayanan Mobil Sehat Desa (Mohat)',
      'Umum',
      'ANTAR JEMPUT PASIEN RAWAT INAP',
      'Fasilitas Gratis untuk Wilayah Babat dan Sekitarnya',
      '#4c1d95',
      '#2e1065',
      '#a855f7'
    ),
    keterangan: 'Sosialisasi fasilitas armada mobil sehat desa terkoordinasi dengan Puskesmas & Kantor Desa.',
    driveViewLink: 'https://drive.google.com/file/d/1mohat-desa-rsumb-sample/view'
  },
  {
    id: 'poster-seed-05',
    judul: 'Promo Kamar Rawat Inap & Paket Fasilitas Nyaman (Opname Nyaman RSUMB)',
    kategoriPromo: 'Tarif Promo',
    tags: ['promo opname', 'rawat inap', 'ranap', 'kamar', 'fasilitas', 'diskon ranap', 'opname'],
    tanggalMulai: '2026-09-01',
    tanggalKadaluarsa: '2026-12-31',
    namaBerkas: 'Poster_Promo_Opname_Nyaman_RSUMB.png',
    formatBerkas: 'png',
    ukuranBerkas: '1.9 MB',
    ukuranBytes: 1992000,
    tanggalDiunggah: '2026-09-03 10:00',
    fileData: createSamplePosterSvg(
      'Promo Opname Nyaman RSUMB',
      'Tarif Promo',
      'RAWAT INAP NYAMAN & BERKUALITAS',
      'Fasilitas Kamar AC, Antar Jemput Gratis, & Pendampingan Admisi Cepat',
      '#005d42',
      '#064e3b',
      '#10b981'
    ),
    keterangan: 'Paket promo rawat inap (opname) nyaman dengan fasilitas lengkap, kamar ber-AC, dan layanan antar jemput ambulans desa gratis.',
    driveViewLink: 'https://drive.google.com/file/d/1opname-nyaman-rsumb-sample/view',
    driveWebContentLink: 'https://drive.google.com/uc?id=1opname-nyaman-rsumb-sample&export=download'
  }
];

/**
 * Muat daftar poster dari LocalStorage
 */
export const loadMasterPosters = (): PosterPromoItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POSTERS) || localStorage.getItem(LEGACY_STORAGE_KEY_POSTERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading master posters from LocalStorage:', error);
  }
  // Initialize with high-quality seeds
  saveMasterPosters(INITIAL_SEED_POSTERS);
  return INITIAL_SEED_POSTERS;
};

/**
 * Simpan daftar poster ke LocalStorage dengan proteksi kuota
 */
export const saveMasterPosters = (posters: PosterPromoItem[]): void => {
  try {
    const jsonStr = JSON.stringify(posters);
    localStorage.setItem(STORAGE_KEY_POSTERS, jsonStr);
    localStorage.setItem(LEGACY_STORAGE_KEY_POSTERS, jsonStr);
  } catch (error) {
    console.warn('LocalStorage quota warning for posters, saving with safe payload:', error);
    try {
      // If quota exceeded, save items with shortened preview or compressed payload
      const safePosters = posters.map((p) => {
        // keep data if smaller than 300KB
        if (p.fileData && p.fileData.length > 300000) {
          return { ...p, fileData: p.fileData.slice(0, 300000) };
        }
        return p;
      });
      const safeJson = JSON.stringify(safePosters);
      localStorage.setItem(STORAGE_KEY_POSTERS, safeJson);
      localStorage.setItem(LEGACY_STORAGE_KEY_POSTERS, safeJson);
    } catch (innerErr) {
      console.error('Fatal error saving master posters:', innerErr);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rsumb_posters_saved'));
  }
};
