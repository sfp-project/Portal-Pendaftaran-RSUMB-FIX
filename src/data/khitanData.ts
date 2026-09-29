export type KhitanStatus = 'Terdaftar' | 'Hadir' | 'Selesai' | 'Batal';
export type KhitanCategory = 'Umum' | 'Yatim' | 'Piatu' | 'Yatim Piatu' | 'Dhuafa';

export const STANDARD_KHITAN_QUOTA = 5;

export interface KhitanParticipant {
  id: string;
  namaPeserta: string;
  tanggalPelaksanaan: string; // YYYY-MM-DD
  tanggalLahir: string; // YYYY-MM-DD
  umur: number; // in years
  alamat: string;
  namaWali: string;
  noHp: string;
  beratBadan?: number | null; // in kg (optional)
  kategori: KhitanCategory;
  status: KhitanStatus;
  catatan?: string;
  pjApproval?: boolean; // Persetujuan Penanggung Jawab untuk kuota tambahan (> 5)
  createdAt: string;
  // Post-Khitan Control Record (Automatic Draft Generation: Procedure Date + 3 Days)
  tanggalKontrol?: string; // YYYY-MM-DD
  dokterOperatorKontrol?: string;
  catatanKontrol?: string;
}

export const INITIAL_KHITAN_PARTICIPANTS: KhitanParticipant[] = [
  // Jumat, 28 Agustus 2026 (Pelaksanaan Khitan Jumat Barokah Selesai)
  {
    id: 'kht-aug-01',
    namaPeserta: 'Muhammad Fadhil Pratama',
    tanggalPelaksanaan: '2026-08-28',
    tanggalLahir: '2016-04-10',
    umur: 10,
    alamat: 'Ds. Gendongkulon RT 02/RW 01, Babat',
    namaWali: 'Bambang Irawan (Ayah)',
    noHp: '081233445566',
    beratBadan: 32,
    kategori: 'Yatim',
    status: 'Selesai',
    catatan: 'Tindakan steril lancar, kontrol H+3 baik tanpa pendarahan',
    createdAt: '2026-08-20T08:00:00Z',
    tanggalKontrol: '2026-08-31'
  },
  {
    id: 'kht-aug-02',
    namaPeserta: 'Ahmad Kevin Saputra',
    tanggalPelaksanaan: '2026-08-28',
    tanggalLahir: '2015-09-18',
    umur: 11,
    alamat: 'Dsn. Moropelang RT 01/RW 02, Babat',
    namaWali: 'Nurhayati (Ibu)',
    noHp: '085711223344',
    beratBadan: 35,
    kategori: 'Dhuafa',
    status: 'Selesai',
    catatan: 'Paket suvenir & celana khitan diserahkan, luka kering',
    createdAt: '2026-08-21T09:30:00Z',
    tanggalKontrol: '2026-08-31'
  },
  {
    id: 'kht-aug-03',
    namaPeserta: 'Rafi Al-Faris',
    tanggalPelaksanaan: '2026-08-28',
    tanggalLahir: '2016-02-14',
    umur: 10,
    alamat: 'Ds. Pucuk RT 03/RW 04, Pucuk, Lamongan',
    namaWali: 'H. Suwandi (Ayah)',
    noHp: '081399887766',
    beratBadan: 33,
    kategori: 'Umum',
    status: 'Selesai',
    catatan: 'Kontrol H+3 di Poliklinik Bedah bersama dr. Rieski Sp.B',
    createdAt: '2026-08-22T10:15:00Z',
    tanggalKontrol: '2026-08-31'
  },
  // Jumat, 04 September 2026 (5/5 Peserta - Penuh)
  {
    id: 'kht-002',
    namaPeserta: 'Dimas Arya Pratama',
    tanggalPelaksanaan: '2026-09-04',
    tanggalLahir: '2015-02-20',
    umur: 11,
    alamat: 'Dsn. Sawo RT 02/RW 03, Plaosan, Babat',
    namaWali: 'Siti Aminah (Ibu)',
    noHp: '085732198765',
    beratBadan: 34,
    kategori: 'Yatim',
    status: 'Selesai',
    catatan: 'Tindakan selesai lancar, kontrol H+3 di Poliklinik Bedah',
    createdAt: '2026-08-28T09:15:00Z'
  },
  {
    id: 'kht-004',
    namaPeserta: 'Bagas Danendra',
    tanggalPelaksanaan: '2026-09-04',
    tanggalLahir: '2014-08-08',
    umur: 12,
    alamat: 'Ds. Moropelang RT 03/RW 01, Babat, Lamongan',
    namaWali: 'Kuswanto (Paman)',
    noHp: '081345678912',
    beratBadan: 38,
    kategori: 'Dhuafa',
    status: 'Selesai',
    catatan: 'Telah diberikan paket celana khitan & obat pemulihan',
    createdAt: '2026-08-30T11:20:00Z'
  },
  {
    id: 'kht-006',
    namaPeserta: 'Alif Rahmatullah',
    tanggalPelaksanaan: '2026-09-04',
    tanggalLahir: '2016-01-03',
    umur: 10,
    alamat: 'Dsn. Terawan RT 01/RW 02, Brenggolo',
    namaWali: 'Supardi (Ayah)',
    noHp: '081987654321',
    beratBadan: 30,
    kategori: 'Piatu',
    status: 'Batal',
    catatan: 'Pasien mengalami demam & batuk, ditunda ke jadwal berikutnya',
    createdAt: '2026-08-29T16:00:00Z'
  },
  {
    id: 'kht-012',
    namaPeserta: 'Rizky Pratama Yudha',
    tanggalPelaksanaan: '2026-09-04',
    tanggalLahir: '2016-03-12',
    umur: 10,
    alamat: 'Ds. Bedahan RT 01/RW 03, Babat',
    namaWali: 'Yudha Prasetyo (Ayah)',
    noHp: '081398765432',
    beratBadan: 31,
    kategori: 'Umum',
    status: 'Selesai',
    catatan: 'Pemeriksaan tensi & fisik pra-tindakan baik',
    createdAt: '2026-08-31T08:00:00Z'
  },
  {
    id: 'kht-013',
    namaPeserta: 'Faris Maulana Malik',
    tanggalPelaksanaan: '2026-09-04',
    tanggalLahir: '2015-11-25',
    umur: 11,
    alamat: 'Jl. Pemuda No. 12, Babat, Lamongan',
    namaWali: 'Malik Ibrahim (Ayah)',
    noHp: '082233445566',
    beratBadan: 33,
    kategori: 'Dhuafa',
    status: 'Selesai',
    catatan: 'Selesai tindakan khitan klamp lancar',
    createdAt: '2026-09-01T07:15:00Z'
  },

  // Jumat, 11 September 2026 (6/5 Peserta - Izin PJ Kuota Fleksibel)
  {
    id: 'kht-001',
    namaPeserta: 'M. Rayhan Alfatih',
    tanggalPelaksanaan: '2026-09-11',
    tanggalLahir: '2016-05-15',
    umur: 10,
    alamat: 'Jl. Raya Babat No. 42, Babat, Lamongan',
    namaWali: 'Ahmad Fauzi (Ayah)',
    noHp: '081234567890',
    beratBadan: 32,
    kategori: 'Dhuafa',
    status: 'Terdaftar',
    catatan: 'Kondisi sehat, tidak ada riwayat alergi obat bius',
    createdAt: '2026-09-01T08:30:00Z'
  },
  {
    id: 'kht-003',
    namaPeserta: 'Kenzo Raffa Alfarizi',
    tanggalPelaksanaan: '2026-09-11',
    tanggalLahir: '2017-11-10',
    umur: 9,
    alamat: 'Jl. Gotong Royong RT 01/RW 04, Babat',
    namaWali: 'Bambang Hariyanto (Ayah)',
    noHp: '082198765432',
    beratBadan: 29,
    kategori: 'Umum',
    status: 'Terdaftar',
    catatan: 'Daftar bersama sepupu',
    createdAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'kht-007',
    namaPeserta: 'Hafidz Wildan Maulana',
    tanggalPelaksanaan: '2026-09-11',
    tanggalLahir: '2015-07-22',
    umur: 11,
    alamat: 'Jl. Tambakboyo No. 18, Babat, Lamongan',
    namaWali: 'Rudi Hartono (Ayah)',
    noHp: '087812349876',
    beratBadan: 35,
    kategori: 'Umum',
    status: 'Terdaftar',
    catatan: 'Konfirmasi kehadiran via WhatsApp',
    createdAt: '2026-09-02T13:45:00Z'
  },
  {
    id: 'kht-009',
    namaPeserta: 'Fajar Shodiq Ramadhan',
    tanggalPelaksanaan: '2026-09-11',
    tanggalLahir: '2016-06-18',
    umur: 10,
    alamat: 'Ds. Pucakwangi RT 02/RW 01, Babat',
    namaWali: 'Shodiqul Wa\'di (Ayah)',
    noHp: '085233112233',
    beratBadan: 30,
    kategori: 'Yatim',
    status: 'Terdaftar',
    catatan: 'Permintaan paket sarung & peci anak',
    createdAt: '2026-09-03T09:00:00Z'
  },
  {
    id: 'kht-010',
    namaPeserta: 'Bilal Al-Habasyi',
    tanggalPelaksanaan: '2026-09-11',
    tanggalLahir: '2015-09-10',
    umur: 11,
    alamat: 'Dsn. Kalen RT 03/RW 02, Kedungpring',
    namaWali: 'Umar Farouq (Paman)',
    noHp: '081234887766',
    beratBadan: 36,
    kategori: 'Dhuafa',
    status: 'Terdaftar',
    catatan: 'Binaan Lazismu Cabang Babat (Kuota ke-5)',
    createdAt: '2026-09-03T11:20:00Z'
  },
  {
    id: 'kht-011',
    namaPeserta: 'Faqih Ar-Rasyid',
    tanggalPelaksanaan: '2026-09-11',
    tanggalLahir: '2016-08-05',
    umur: 10,
    alamat: 'Ds. Sumuragung RT 01/RW 02, Baureno',
    namaWali: 'Mansyur Hidayat (Ayah)',
    noHp: '082144556677',
    beratBadan: 33,
    kategori: 'Umum',
    status: 'Terdaftar',
    catatan: 'Persetujuan Penanggung Jawab Khitan (Kuota Khusus Peserta ke-6)',
    pjApproval: true,
    createdAt: '2026-09-03T15:00:00Z'
  },

  // Jumat, 18 September 2026 (2/5 Peserta - Sisa 3 Kursi)
  {
    id: 'kht-005',
    namaPeserta: 'Muhammad Fathan',
    tanggalPelaksanaan: '2026-09-18',
    tanggalLahir: '2016-04-14',
    umur: 10,
    alamat: 'Ds. Gendong Kulon RT 02/RW 02, Babat',
    namaWali: 'Nurul Hidayati (Wali)',
    noHp: '085612345678',
    beratBadan: 31,
    kategori: 'Yatim Piatu',
    status: 'Terdaftar',
    catatan: 'Santri binaan panti asuhan',
    createdAt: '2026-09-03T14:10:00Z'
  },
  {
    id: 'kht-008',
    namaPeserta: 'Zidan Al-Ghifari',
    tanggalPelaksanaan: '2026-09-18',
    tanggalLahir: '2017-03-09',
    umur: 9,
    alamat: 'Ds. Tritunggal RT 04/RW 01, Babat',
    namaWali: 'Lilik Wahyuni (Ibu)',
    noHp: '081298761234',
    beratBadan: 28,
    kategori: 'Dhuafa',
    status: 'Terdaftar',
    catatan: 'Memerlukan celana khitan ukuran S',
    createdAt: '2026-09-04T07:20:00Z'
  }
];

const KHITAN_STORAGE_KEY = 'rsumb_khitan_jumat_participants_v1';

export function calculateDefaultControlDate(procedureDateStr: string, daysAhead: number = 3): string {
  if (!procedureDateStr) return '';
  try {
    const parts = procedureDateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + daysAhead);
      // Jika jatuh hari Minggu (0), majukan ke hari Senin (+1 hari) agar poliklinik aktif
      if (d.getDay() === 0) {
        d.setDate(d.getDate() + 1);
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${date}`;
    }
    return '';
  } catch {
    return '';
  }
}

export function loadKhitanParticipants(): KhitanParticipant[] {
  try {
    const raw = localStorage.getItem(KHITAN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Pastikan setiap peserta memiliki draft data kontrol post-khitan (H+3 hari default)
        return parsed.map((p: KhitanParticipant) => ({
          ...p,
          tanggalKontrol: p.tanggalKontrol || calculateDefaultControlDate(p.tanggalPelaksanaan, 3),
          dokterOperatorKontrol: p.dokterOperatorKontrol || 'dr. H. Abd. Rokhim, MARS'
        }));
      }
    }
  } catch (e) {
    console.error('Error loading khitan participants from localStorage', e);
  }
  return INITIAL_KHITAN_PARTICIPANTS.map((p) => ({
    ...p,
    tanggalKontrol: p.tanggalKontrol || calculateDefaultControlDate(p.tanggalPelaksanaan, 3),
    dokterOperatorKontrol: p.dokterOperatorKontrol || 'dr. H. Abd. Rokhim, MARS'
  }));
}

export function saveKhitanParticipants(data: KhitanParticipant[]): void {
  try {
    localStorage.setItem(KHITAN_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving khitan participants to localStorage', e);
  }
}

/**
 * Format YYYY-MM-DD to DD-MM-YYYY (e.g. 2026-06-26 -> 26-06-2026)
 */
export function formatYMDToDMY(ymd: string): string {
  if (!ymd) return '-';
  const parts = ymd.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return ymd;
}

/**
 * Clean and format Indonesian WhatsApp phone number
 * e.g. "081234567890" -> "6281234567890"
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Calculate age from birth date string (YYYY-MM-DD)
 */
export function calculateAgeFromBirthDate(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  try {
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  } catch {
    return 0;
  }
}

/**
 * Format YYYY-MM-DD to Indonesian full date string
 * e.g. "2026-09-11" -> "Jumat, 11 September 2026"
 */
export function formatFullIndonesianDate(ymd: string): string {
  if (!ymd) return '-';
  try {
    const parts = ymd.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const dateObj = new Date(year, month - 1, day);
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const dayName = dayNames[dateObj.getDay()] || 'Jumat';
        const monthName = monthNames[month - 1] || '';
        return `${dayName}, ${day} ${monthName} ${year}`;
      }
    }
    return ymd;
  } catch {
    return ymd;
  }
}
