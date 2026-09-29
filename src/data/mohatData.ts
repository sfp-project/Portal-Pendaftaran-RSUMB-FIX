import {
  KuponMohat,
  KategoriPerujuk,
  PenjaminKupon,
  MohatSuggestions,
  MohatAuditLog,
  StatusKlaimKupon
} from '../types/mohatTypes';
import { loadPortalSettings } from './settingsData';

export const STORAGE_KEY_KUPON_MOHAT = 'rsumb_kupon_fee_mohat_v1';
export const STORAGE_KEY_MOHAT_SUGGESTIONS = 'rsumb_mohat_suggestions_v1';
export const STORAGE_KEY_MOHAT_AUDIT_TRAIL = 'rsumb_mohat_audit_trail_v1';
export const MAX_AUDIT_TRAIL_ITEMS = 20;

// Aturan Kalkulasi Fee Otomatis Mengikuti Pengaturan Sistem SIMRS:
// 1. PKM (Pasien UMUM): default Perujuk Rp25.000 + Sopir Rp10.000 = Total Rp35.000
// 2. PKM (BPJS / Jasa Raharja / Asuransi Swasta): default Perujuk Rp15.000 + Sopir Rp5.000 = Total Rp20.000
// 3. Desa / Mohat (Semua Penjamin): Flat Rp25.000
export const calculateMohatFee = (
  kategori: KategoriPerujuk,
  penjamin: PenjaminKupon
): { feePerujuk: number; feeSopir: number; feeTotal: number } => {
  const settings = loadPortalSettings().mohatFees;

  if (kategori === 'PKM') {
    if (penjamin === 'UMUM') {
      // Pasien UMUM tarif dinamis dari settings
      return {
        feePerujuk: settings.pkmUmumFeePerujuk,
        feeSopir: settings.pkmUmumFeeSopir,
        feeTotal: settings.pkmUmumFeeTotal
      };
    } else {
      // BPJS, Jasa Raharja (JR), dan Asuransi Swasta mengikuti tarif standar dari settings
      return {
        feePerujuk: settings.pkmBpjsFeePerujuk,
        feeSopir: settings.pkmBpjsFeeSopir,
        feeTotal: settings.pkmBpjsFeeTotal
      };
    }
  } else {
    // MOHAT (Desa / Mobil Sehat) - Flat dari settings untuk semua penjamin
    return {
      feePerujuk: settings.desaMohatFee,
      feeSopir: 0,
      feeTotal: settings.desaMohatFee
    };
  }
};

export const getPenjaminDisplayLabel = (penjamin: PenjaminKupon | string): string => {
  const settings = loadPortalSettings().mohatFees;
  if (!penjamin) return settings.pasienUmumLabel || 'Pasien UMUM';

  // Global Penjamin Labeling: Automatically map/rename "Pasien Murni Umum" or "Murni Umum" to "Pasien UMUM"
  if (
    penjamin === 'UMUM' ||
    penjamin.toLowerCase().includes('murni umum') ||
    penjamin.toLowerCase() === 'pasien umum' ||
    penjamin.toLowerCase() === 'umum'
  ) {
    return settings.pasienUmumLabel || 'Pasien UMUM';
  }
  return 'BPJS / JR / Asuransi';
};

export const DEFAULT_MOHAT_SUGGESTIONS: MohatSuggestions = {
  perawatList: [
    'Bidan Siti Rahayu, Amd.Keb (PKM Babat)',
    'Bidan Rahmawati, S.Tr.Keb (PKM Sekaran)',
    'Perawat Dedi Irawan, S.Kep., Ns (PKM Pucuk)',
    'Bidan Anita Kusuma, Amd.Keb (PKM Baureno)',
    'Bidan Nurul Hidayati (PKM Kedungpring)',
    'Perawat Slamet Riyadi (PKM Karanggeneng)'
  ],
  sopirPkmList: [
    'Agus Salim (Sopir PKM Babat)',
    'Bambang Sugianto (Sopir PKM Sekaran)',
    'Rahmat Hidayat (Sopir PKM Pucuk)',
    'Joko Purwanto (Sopir PKM Baureno)',
    'Supratno (Ambulans PKM Kedungpring)'
  ],
  sopirMohatList: [
    'Pak Sukardi (Mohat Desa Moropelang)',
    'Pak Hariyanto (Mohat Desa Gendongkulon)',
    'Cak Yanto (Mohat Desa Datinawong)',
    'Pak Mulyadi (Mohat Desa Pucuk)',
    'Pak Suwandi (Mohat Desa Kebalandono)',
    'Mas Irfan (Mohat Desa Karangkembang)'
  ]
};

// Data Awal Kupon Demo (Termasuk Arsip Bulan Agustus & September 2026)
export const SEED_KUPON_MOHAT: KuponMohat[] = [
  {
    id: 'kpn-aug-01',
    nomorKupon: 'MHT-20260808-001',
    noSeri: 'SN-00081',
    tanggalMasuk: '2026-08-08',
    jamDibuat: '09:15 WIB',
    namaPasien: 'Ny. Kasmiati (55 Th)',
    penjamin: 'UMUM',
    kategori: 'PKM',
    namaPerujuk: 'Bidan Siti Rahayu, Amd.Keb (PKM Babat)',
    namaSopir: 'Agus Salim (Sopir PKM Babat)',
    feePerujuk: 25000,
    feeSopir: 10000,
    feeTotal: 35000,
    status: 'Lunas',
    petugasKasir: 'Melinda',
    catatan: 'Ranap Paviliun Shafa Lt. 2',
    createdAt: '2026-08-08T09:15:00Z'
  },
  {
    id: 'kpn-aug-02',
    nomorKupon: 'MHT-20260815-002',
    noSeri: 'SN-00082',
    tanggalMasuk: '2026-08-15',
    jamDibuat: '10:30 WIB',
    namaPasien: 'Tn. Joko Susanto (48 Th)',
    penjamin: 'BPJS_JR_ASURANSI',
    kategori: 'PKM',
    namaPerujuk: 'Perawat Dedi Irawan, S.Kep., Ns (PKM Pucuk)',
    namaSopir: 'Rahmat Hidayat (Sopir PKM Pucuk)',
    feePerujuk: 15000,
    feeSopir: 5000,
    feeTotal: 20000,
    status: 'Lunas',
    petugasKasir: 'Hisyam',
    catatan: 'Rujukan Poli Penyakit Dalam',
    createdAt: '2026-08-15T10:30:00Z'
  },
  {
    id: 'kpn-aug-03',
    nomorKupon: 'MHT-20260822-003',
    noSeri: 'SN-00083',
    tanggalMasuk: '2026-08-22',
    jamDibuat: '13:00 WIB',
    namaPasien: 'An. Bayu Pratama (6 Th)',
    penjamin: 'UMUM',
    kategori: 'MOHAT',
    namaPerujuk: 'Pak Sukardi (Mohat Desa Moropelang)',
    noHpPengantar: '085812345678',
    feePerujuk: 25000,
    feeSopir: 0,
    feeTotal: 25000,
    status: 'Lunas',
    petugasKasir: 'Ady',
    catatan: 'Observasi Febris Anak Ranap Mina',
    createdAt: '2026-08-22T13:00:00Z'
  },
  {
    id: 'kpn-aug-04',
    nomorKupon: 'MHT-20260827-004',
    noSeri: 'SN-00084',
    tanggalMasuk: '2026-08-27',
    jamDibuat: '15:40 WIB',
    namaPasien: 'Ny. Siti Marwah (42 Th)',
    penjamin: 'BPJS_JR_ASURANSI',
    kategori: 'PKM',
    namaPerujuk: 'Bidan Rahmawati, S.Tr.Keb (PKM Sekaran)',
    namaSopir: 'Bambang Sugianto (Sopir PKM Sekaran)',
    feePerujuk: 15000,
    feeSopir: 5000,
    feeTotal: 20000,
    status: 'Lunas',
    petugasKasir: 'Alivia',
    catatan: 'Ranap Obgyn Paviliun Darussalam',
    createdAt: '2026-08-27T15:40:00Z'
  },
  {
    id: 'kpn-aug-05',
    nomorKupon: 'MHT-20260830-005',
    noSeri: 'SN-00085',
    tanggalMasuk: '2026-08-30',
    jamDibuat: '18:20 WIB',
    namaPasien: 'Tn. Abdul Ghofur (60 Th)',
    penjamin: 'UMUM',
    kategori: 'PKM',
    namaPerujuk: 'Bidan Anita Kusuma, Amd.Keb (PKM Baureno)',
    namaSopir: 'Joko Purwanto (Sopir PKM Baureno)',
    feePerujuk: 25000,
    feeSopir: 10000,
    feeTotal: 35000,
    status: 'Lunas',
    petugasKasir: 'Ismed',
    catatan: 'Ranap Paviliun Marwah',
    createdAt: '2026-08-30T18:20:00Z'
  },
  {
    id: 'kpn-1',
    nomorKupon: 'MHT-20260920-001',
    noSeri: 'SN-00001',
    tanggalMasuk: '2026-09-20',
    jamDibuat: '08:45 WIB',
    namaPasien: 'Hj. Aminah (62 Th)',
    penjamin: 'UMUM',
    kategori: 'PKM',
    namaPerujuk: 'Bidan Siti Rahayu, Amd.Keb (PKM Babat)',
    namaSopir: 'Agus Salim (Sopir PKM Babat)',
    feePerujuk: 25000,
    feeSopir: 10000,
    feeTotal: 35000,
    status: 'Lunas',
    petugasKasir: 'Kasir Utama',
    catatan: 'Ranap Paviliun Marwah',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'kpn-2',
    nomorKupon: 'MHT-20260920-002',
    noSeri: 'SN-00002',
    tanggalMasuk: '2026-09-20',
    jamDibuat: '11:15 WIB',
    namaPasien: 'Bpk. Suparman (54 Th)',
    penjamin: 'BPJS_JR_ASURANSI',
    kategori: 'PKM',
    namaPerujuk: 'Perawat Dedi Irawan, S.Kep., Ns (PKM Pucuk)',
    namaSopir: 'Rahmat Hidayat (Sopir PKM Pucuk)',
    feePerujuk: 15000,
    feeSopir: 5000,
    feeTotal: 20000,
    status: 'Menunggu Kasir',
    petugasKasir: '-',
    catatan: 'Rujukan IGD Ranap Shofa',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  },
  {
    id: 'kpn-3',
    nomorKupon: 'MHT-20260920-003',
    noSeri: 'SN-00003',
    tanggalMasuk: '2026-09-20',
    jamDibuat: '14:20 WIB',
    namaPasien: 'An. Farhan Maulana (7 Th)',
    penjamin: 'UMUM',
    kategori: 'MOHAT',
    namaPerujuk: 'Pak Sukardi (Mohat Desa Moropelang)',
    noHpPengantar: '085812345678',
    feePerujuk: 25000,
    feeSopir: 0,
    feeTotal: 25000,
    status: 'Menunggu Kasir',
    petugasKasir: '-',
    catatan: 'Pasien DHF Anak Ranap Mina',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  }
];

export const STORAGE_KEY_MOHAT_SERIAL = 'rsumb_mohat_serial_counter_v1';

export const loadKuponList = (): KuponMohat[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KUPON_MOHAT);
    let list: KuponMohat[] = [];
    if (!raw) {
      list = SEED_KUPON_MOHAT;
      localStorage.setItem(STORAGE_KEY_KUPON_MOHAT, JSON.stringify(SEED_KUPON_MOHAT));
    } else {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : SEED_KUPON_MOHAT;
      // Pastikan kupon arsip dasar (termasuk Agustus 2026) selalu tersedia jika belum ada
      const existingIds = new Set(list.map((k) => k.id));
      const missingSeeds = SEED_KUPON_MOHAT.filter((s) => !existingIds.has(s.id));
      if (missingSeeds.length > 0) {
        list = [...missingSeeds, ...list];
        localStorage.setItem(STORAGE_KEY_KUPON_MOHAT, JSON.stringify(list));
      }
    }

    // Pastikan seluruh kupon memiliki nomor seri unik untuk integritas audit
    let needSave = false;
    let fallbackSeq = 1;
    list = list.map((k) => {
      if (!k.noSeri) {
        needSave = true;
        const serialStr = `SN-${String(fallbackSeq).padStart(5, '0')}`;
        fallbackSeq++;
        return { ...k, noSeri: serialStr };
      }
      const num = parseInt(k.noSeri.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num >= fallbackSeq) {
        fallbackSeq = num + 1;
      }
      return k;
    });

    if (needSave) {
      localStorage.setItem(STORAGE_KEY_KUPON_MOHAT, JSON.stringify(list));
    }
    return list;
  } catch (error) {
    console.error('Gagal membaca kupon mohat dari storage:', error);
    return SEED_KUPON_MOHAT;
  }
};

export const saveKuponList = (list: KuponMohat[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_KUPON_MOHAT, JSON.stringify(list));
  } catch (error) {
    console.error('Gagal menyimpan kupon mohat ke storage:', error);
  }
};

export const loadMohatSuggestions = (): MohatSuggestions => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MOHAT_SUGGESTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MOHAT_SUGGESTIONS, JSON.stringify(DEFAULT_MOHAT_SUGGESTIONS));
      return DEFAULT_MOHAT_SUGGESTIONS;
    }
    const parsed = JSON.parse(raw);
    return {
      perawatList: Array.from(new Set([...(parsed.perawatList || []), ...DEFAULT_MOHAT_SUGGESTIONS.perawatList])),
      sopirPkmList: Array.from(new Set([...(parsed.sopirPkmList || []), ...DEFAULT_MOHAT_SUGGESTIONS.sopirPkmList])),
      sopirMohatList: Array.from(new Set([...(parsed.sopirMohatList || []), ...DEFAULT_MOHAT_SUGGESTIONS.sopirMohatList]))
    };
  } catch (error) {
    console.error('Gagal membaca suggestions mohat dari storage:', error);
    return DEFAULT_MOHAT_SUGGESTIONS;
  }
};

export const saveMohatSuggestions = (
  newPerawat?: string,
  newSopirPkm?: string,
  newSopirMohat?: string
) => {
  try {
    const current = loadMohatSuggestions();
    const updated: MohatSuggestions = {
      perawatList: [...current.perawatList],
      sopirPkmList: [...current.sopirPkmList],
      sopirMohatList: [...current.sopirMohatList]
    };

    if (newPerawat && newPerawat.trim() && !updated.perawatList.includes(newPerawat.trim())) {
      updated.perawatList.unshift(newPerawat.trim());
    }
    if (newSopirPkm && newSopirPkm.trim() && !updated.sopirPkmList.includes(newSopirPkm.trim())) {
      updated.sopirPkmList.unshift(newSopirPkm.trim());
    }
    if (newSopirMohat && newSopirMohat.trim() && !updated.sopirMohatList.includes(newSopirMohat.trim())) {
      updated.sopirMohatList.unshift(newSopirMohat.trim());
    }

    localStorage.setItem(STORAGE_KEY_MOHAT_SUGGESTIONS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Gagal menyimpan suggestions mohat:', error);
    return DEFAULT_MOHAT_SUGGESTIONS;
  }
};

export const formatRupiahMohat = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};

/**
 * Auto-increment generator nomor urut harian kupon (MHT-YYYYMMDD-001)
 * Menjamin urutan nomor tidak terduplikasi meskipun data dihapus.
 */
export const generateNomorKupon = (existingList: KuponMohat[]): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `MHT-${yyyy}${mm}${dd}`;

  // Cari sequence tertinggi hari ini dengan aman (anti duplikat)
  const todayCoupons = existingList.filter((k) => k.nomorKupon && k.nomorKupon.startsWith(datePrefix));
  let maxSeq = 0;
  todayCoupons.forEach((k) => {
    const parts = k.nomorKupon.split('-');
    if (parts.length >= 3) {
      const seqNum = parseInt(parts[2], 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });
  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${datePrefix}-${nextSeq}`;
};

/**
 * Mendapatkan Nomor Seri Auto-Increment berikutnya (SN-00001, SN-00002, ...)
 * Menggunakan gabungan scan data aktual + counter persisten di LocalStorage
 * agar nomor seri tidak pernah terulang bahkan jika kupon dihapus dari list.
 */
export const getNextSerialNumber = (existingList: KuponMohat[]): { serialFormatted: string; serialNumber: number } => {
  let highestSerial = 0;

  // 1. Scan nomor seri tertinggi di list kupon saat ini
  existingList.forEach((k) => {
    if (k.noSeri) {
      const num = parseInt(k.noSeri.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > highestSerial) {
        highestSerial = num;
      }
    }
  });

  // 2. Cek counter riwayat persisten (mencegah nomor terpakai ulang jika kupon dihapus)
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MOHAT_SERIAL);
    if (saved) {
      const savedNum = parseInt(saved, 10);
      if (!isNaN(savedNum) && savedNum > highestSerial) {
        highestSerial = savedNum;
      }
    }
  } catch {
    // Abaikan jika storage dinonaktifkan
  }

  const nextNumber = highestSerial + 1;
  const serialFormatted = `SN-${String(nextNumber).padStart(5, '0')}`;
  return { serialFormatted, serialNumber: nextNumber };
};

/**
 * Menyimpan nomor seri yang berhasil diterbitkan ke counter persisten
 */
export const commitSerialNumber = (serialNumber: number): void => {
  try {
    const current = localStorage.getItem(STORAGE_KEY_MOHAT_SERIAL);
    const currentNum = current ? parseInt(current, 10) : 0;
    if (serialNumber > currentNum) {
      localStorage.setItem(STORAGE_KEY_MOHAT_SERIAL, String(serialNumber));
    }
  } catch (err) {
    console.error('Gagal menyimpan counter nomor seri:', err);
  }
};

/**
 * Kalibrasi Nomor Seri Awal (Starting Number) untuk auditor / kasir RSUMB
 */
export const setBaselineSerialNumber = (newNextNumber: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_MOHAT_SERIAL, String(Math.max(0, newNextNumber - 1)));
  } catch (err) {
    console.error('Gagal kalibrasi counter nomor seri:', err);
  }
};

export interface SerialAuditReport {
  totalIssued: number;
  highestSerial: number;
  lastSerialFormatted: string;
  nextSerialFormatted: string;
  isSequential: boolean;
  duplicateSerials: string[];
  missingSerials: string[];
  totalDuplicates: number;
  totalGaps: number;
}

/**
 * Audit Integritas Nomor Seri Kupon (Pemeriksaan Urutan & Deteksi Celah / Duplikat)
 */
export const auditSerialNumbers = (existingList: KuponMohat[]): SerialAuditReport => {
  const serialNumbers: number[] = [];
  const serialMap: Record<string, number> = {};
  const duplicateSerials: string[] = [];

  existingList.forEach((k) => {
    const sn = k.noSeri || '';
    if (sn) {
      serialMap[sn] = (serialMap[sn] || 0) + 1;
      if (serialMap[sn] === 2) {
        duplicateSerials.push(sn);
      }
      const num = parseInt(sn.replace(/\D/g, ''), 10);
      if (!isNaN(num)) {
        serialNumbers.push(num);
      }
    }
  });

  serialNumbers.sort((a, b) => a - b);
  const highestSerial = serialNumbers.length > 0 ? serialNumbers[serialNumbers.length - 1] : 0;
  const lastSerialFormatted = highestSerial > 0 ? `SN-${String(highestSerial).padStart(5, '0')}` : '-';
  const { serialFormatted: nextSerialFormatted } = getNextSerialNumber(existingList);

  // Periksa celah urutan nomor seri (gaps)
  const missingSerials: string[] = [];
  if (serialNumbers.length > 1) {
    const minSerial = serialNumbers[0];
    const set = new Set(serialNumbers);
    for (let i = minSerial; i <= highestSerial; i++) {
      if (!set.has(i)) {
        missingSerials.push(`SN-${String(i).padStart(5, '0')}`);
      }
    }
  }

  return {
    totalIssued: existingList.length,
    highestSerial,
    lastSerialFormatted,
    nextSerialFormatted,
    isSequential: duplicateSerials.length === 0 && missingSerials.length === 0,
    duplicateSerials,
    missingSerials,
    totalDuplicates: duplicateSerials.length,
    totalGaps: missingSerials.length
  };
};

/**
 * Memuat Riwayat Audit Trail (Maksimal 20 Kupon Terakhir yang Diterbitkan)
 */
export const loadMohatAuditTrail = (): MohatAuditLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MOHAT_AUDIT_TRAIL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, MAX_AUDIT_TRAIL_ITEMS);
      }
    }
  } catch (error) {
    console.error('Gagal membaca audit trail kupon:', error);
  }

  // Jika belum ada di LocalStorage, inisialisasi dari kupon aktif (maksimal 20 terbaru)
  const kuponList = loadKuponList();
  const seeded: MohatAuditLog[] = kuponList.slice(0, MAX_AUDIT_TRAIL_ITEMS).map((k) => {
    const perujukSopir =
      k.kategori === 'PKM' && k.namaSopir
        ? `${k.namaPerujuk} / ${k.namaSopir}`
        : k.namaPerujuk || k.namaSopir || '-';
    return {
      id: `aud-${k.id}`,
      action: 'GENERATED',
      timestamp: k.createdAt || new Date().toISOString(),
      kuponId: k.id,
      nomorKupon: k.nomorKupon,
      noSeri: k.noSeri || '-',
      namaPasien: k.namaPasien,
      kategori: k.kategori,
      penjamin: k.penjamin,
      feeTotal: k.feeTotal,
      status: k.status,
      perujukSopir,
      reprintCount: 0,
      kuponSnapshot: { ...k }
    };
  });

  saveMohatAuditTrail(seeded);
  return seeded;
};

/**
 * Menyimpan Riwayat Audit Trail ke LocalStorage (terkunci maks 20 entri)
 */
export const saveMohatAuditTrail = (trail: MohatAuditLog[]): void => {
  try {
    const capped = trail.slice(0, MAX_AUDIT_TRAIL_ITEMS);
    localStorage.setItem(STORAGE_KEY_MOHAT_AUDIT_TRAIL, JSON.stringify(capped));
  } catch (error) {
    console.error('Gagal menyimpan audit trail kupon:', error);
  }
};

/**
 * Mencatat Penerbitan Kupon Baru ke Audit Trail (LIFO, max 20 kupon)
 */
export const recordCouponGenerated = (newKupon: KuponMohat): MohatAuditLog[] => {
  const current = loadMohatAuditTrail();
  const perujukSopir =
    newKupon.kategori === 'PKM' && newKupon.namaSopir
      ? `${newKupon.namaPerujuk} / ${newKupon.namaSopir}`
      : newKupon.namaPerujuk || newKupon.namaSopir || '-';

  const entry: MohatAuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action: 'GENERATED',
    timestamp: new Date().toISOString(),
    kuponId: newKupon.id,
    nomorKupon: newKupon.nomorKupon,
    noSeri: newKupon.noSeri || '-',
    namaPasien: newKupon.namaPasien,
    kategori: newKupon.kategori,
    penjamin: newKupon.penjamin,
    feeTotal: newKupon.feeTotal,
    status: newKupon.status,
    perujukSopir,
    reprintCount: 0,
    kuponSnapshot: { ...newKupon }
  };

  const filtered = current.filter((item) => item.kuponId !== newKupon.id);
  const updated = [entry, ...filtered].slice(0, MAX_AUDIT_TRAIL_ITEMS);
  saveMohatAuditTrail(updated);
  return updated;
};

/**
 * Mencatat Aksi Cetak Ulang (Re-print) pada Kupon
 */
export const recordCouponReprinted = (kuponId: string, kuponData?: KuponMohat): MohatAuditLog[] => {
  const current = loadMohatAuditTrail();
  const nowStr = new Date().toISOString();
  let found = false;

  const updated = current.map((item) => {
    if (item.kuponId === kuponId) {
      found = true;
      const count = (item.reprintCount || 0) + 1;
      return {
        ...item,
        action: 'REPRINTED' as const,
        reprintCount: count,
        lastReprintAt: nowStr,
        kuponSnapshot: kuponData ? { ...kuponData } : item.kuponSnapshot
      };
    }
    return item;
  });

  if (!found && kuponData) {
    const perujukSopir =
      kuponData.kategori === 'PKM' && kuponData.namaSopir
        ? `${kuponData.namaPerujuk} / ${kuponData.namaSopir}`
        : kuponData.namaPerujuk || kuponData.namaSopir || '-';

    const newEntry: MohatAuditLog = {
      id: `aud-rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'REPRINTED',
      timestamp: nowStr,
      kuponId: kuponData.id,
      nomorKupon: kuponData.nomorKupon,
      noSeri: kuponData.noSeri || '-',
      namaPasien: kuponData.namaPasien,
      kategori: kuponData.kategori,
      penjamin: kuponData.penjamin,
      feeTotal: kuponData.feeTotal,
      status: kuponData.status,
      perujukSopir,
      reprintCount: 1,
      lastReprintAt: nowStr,
      kuponSnapshot: { ...kuponData }
    };
    const withNew = [newEntry, ...updated].slice(0, MAX_AUDIT_TRAIL_ITEMS);
    saveMohatAuditTrail(withNew);
    return withNew;
  }

  saveMohatAuditTrail(updated);
  return updated;
};

/**
 * Sinkronisasi Pembaruan Status Klaim Kupon di Audit Trail
 */
export const syncCouponStatusInAudit = (kuponId: string, newStatus: StatusKlaimKupon): MohatAuditLog[] => {
  const current = loadMohatAuditTrail();
  const updated = current.map((item) => {
    if (item.kuponId === kuponId) {
      return {
        ...item,
        status: newStatus,
        kuponSnapshot: {
          ...item.kuponSnapshot,
          status: newStatus,
          petugasKasir: newStatus === 'Lunas' ? 'Kasir RSUMB' : '-'
        }
      };
    }
    return item;
  });
  saveMohatAuditTrail(updated);
  return updated;
};

/**
 * Mengosongkan Riwayat Audit Trail
 */
export const clearMohatAuditTrail = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_MOHAT_AUDIT_TRAIL);
  } catch (error) {
    console.error('Gagal membersihkan audit trail:', error);
  }
};

