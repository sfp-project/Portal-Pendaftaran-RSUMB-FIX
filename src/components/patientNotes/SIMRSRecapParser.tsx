import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Copy,
  Trash2,
  RefreshCw,
  Check,
  MessageSquare,
  Plus,
  Building2,
  Stethoscope,
  Phone,
  Send,
  X,
  RotateCcw,
  Search,
  User,
  Printer,
  ChevronDown,
  LayoutGrid,
  Star,
  Tag,
  ChevronRight
} from 'lucide-react';
import {
  subscribeRekapPendaftaran,
  addRekapPendaftaranDoc,
  deleteRekapPendaftaranDoc,
  RekapPendaftaranDoc,
  savePatientQueueDoc
} from '../../services/firestoreSync';
import { PatientQueueItem } from '../../types';

export type TemplateCategory =
  | 'kontrol_jadwal'
  | 'bpjs_jkn'
  | 'lab_berkas'
  | 'kendala_off'
  | 'custom'
  | 'all'
  | 'jadwal_libur'
  | 'kontrol'
  | 'khusus';

export interface WaTemplate {
  id: string;
  label: string;
  text: string;
  category?: TemplateCategory;
  isCustom?: boolean;
}

// 1. PEMETAAN DOKTER OTOMATIS BERDASARKAN POLIKLINIK (RSU MUHAMMADIYAH BABAT)
export const POLIKLINIK_DOKTER_MAP: Record<string, string[]> = {
  'Klinik Spesialis Anak': [
    'dr. Taufiqur Rahman, Sp.A.',
    'dr. Aulya Farra Rahmadany, Sp.A.'
  ],
  'Poliklinik Penyakit Dalam': [
    'dr. Ilham Basjar, Sp.PD.',
    'dr. Yhang Lidi Tama, Sp.PD.'
  ],
  'Poliklinik Bedah Umum': [
    'dr. Rieski Widhanar, Sp.B.',
    'dr. Nikita Gladys Larasati, Sp.B.'
  ],
  'Poliklinik Paru': [
    'dr. Lilis Asfaroh, Sp.P'
  ],
  'Poliklinik Syaraf': [
    "dr. I'anatul Ulya, Sp.N."
  ],
  'Poliklinik Obgyn (Kandungan)': [
    'dr. Erliana, Sp.OG',
    'dr. Dony Rosmana Bimantara, Sp.OG',
    'dr. Dayinta Liris Kawuryan, Sp.OG'
  ],
  'Poliklinik Jantung': [
    'dr. Ilma Alfia Isaridha, Sp.JP.'
  ],
  'Poliklinik Bedah Orthopedi': [
    'dr. Hary Wahyu Agustono, Sp.OT.',
    'dr. A. Hannan, Sp.OT.'
  ],
  'Poliklinik Urologi': [
    'dr. Randa Halfian, Sp.U.',
    'dr. Muhammad Miftahul Firdaus, Sp.U.'
  ],
  'Poliklinik THT-BKL': [
    'dr. Arif Surgana, Sp.THT-BKL'
  ],
  'Poliklinik Mata': [
    'dr. Razzaqy, Sp.M.',
    'dr. Amelia Safitri R., Sp.M.'
  ],
  'Poliklinik Kulit & Kelamin': [
    'dr. Hamidah Luthfidyaningrum, Sp.DVE.'
  ],
  'Poliklinik Rehabilitasi Medik': [
    'dr. Yuli Indah K., Sp.KFR'
  ],
  'Poliklinik Gigi & Mulut': [
    'drg. Putri Rahmawati Yusuf',
    'drg. Ghany Yudha Hismawan',
    'drg. Syifa Shibghoh I.'
  ]
};

export const LIST_POLIKLINIK: string[] = Object.keys(POLIKLINIK_DOKTER_MAP);

export const ALL_DOKTER_LIST: string[] = Array.from(
  new Set(Object.values(POLIKLINIK_DOKTER_MAP).flat())
);

// Alias untuk kompatibilitas ke belakang
export const LIST_DOKTER: string[] = ALL_DOKTER_LIST;

// Kategori Grouping untuk Modal Grid Google Keep
export const CATEGORY_GROUPS = [
  { id: 'all', label: 'Semua', icon: '📋' },
  { id: 'kontrol_jadwal', label: 'Kontrol & Jadwal', icon: '📅' },
  { id: 'bpjs_jkn', label: 'BPJS & JKN', icon: '🛡️' },
  { id: 'lab_berkas', label: 'Hasil Lab & Berkas', icon: '🧪' },
  { id: 'kendala_off', label: 'Kendala & Poli Off', icon: '⚠️' }
] as const;

export const getNormalizedCategory = (
  cat?: string
): 'kontrol_jadwal' | 'bpjs_jkn' | 'lab_berkas' | 'kendala_off' | 'custom' => {
  if (!cat) return 'kontrol_jadwal';
  if (cat === 'custom') return 'custom';
  if (cat === 'kontrol_jadwal' || cat === 'jadwal_libur' || cat === 'kontrol') return 'kontrol_jadwal';
  if (cat === 'bpjs_jkn') return 'bpjs_jkn';
  if (cat === 'lab_berkas') return 'lab_berkas';
  if (cat === 'kendala_off' || cat === 'khusus') return 'kendala_off';
  return 'kontrol_jadwal';
};

// Styling helper untuk Kartu Catatan ala Google Keep
export const getKeepCardStyle = (category?: string) => {
  const norm = getNormalizedCategory(category);
  switch (norm) {
    case 'kontrol_jadwal':
      return {
        bg: 'bg-[#fffdf2] dark:bg-amber-950/20',
        border: 'border-amber-300/80 dark:border-amber-700/60 hover:border-amber-500',
        badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
        icon: '📅',
        label: 'Kontrol & Jadwal'
      };
    case 'bpjs_jkn':
      return {
        bg: 'bg-[#f4f9ff] dark:bg-blue-950/20',
        border: 'border-sky-300/80 dark:border-blue-700/60 hover:border-blue-500',
        badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
        icon: '🛡️',
        label: 'BPJS & JKN'
      };
    case 'lab_berkas':
      return {
        bg: 'bg-[#f2faf5] dark:bg-emerald-950/20',
        border: 'border-emerald-300/80 dark:border-emerald-700/60 hover:border-emerald-500',
        badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
        icon: '🧪',
        label: 'Hasil Lab & Berkas'
      };
    case 'kendala_off':
      return {
        bg: 'bg-[#fff5f5] dark:bg-rose-950/20',
        border: 'border-rose-300/80 dark:border-rose-700/60 hover:border-rose-500',
        badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700',
        icon: '⚠️',
        label: 'Kendala & Poli Off'
      };
    case 'custom':
      return {
        bg: 'bg-[#faf5ff] dark:bg-purple-950/20',
        border: 'border-purple-300/80 dark:border-purple-700/60 hover:border-purple-500',
        badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700',
        icon: '✏️',
        label: 'Template Kustom'
      };
    default:
      return {
        bg: 'bg-slate-50/80 dark:bg-slate-900/20',
        border: 'border-slate-300 dark:border-gray-700 hover:border-slate-500',
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-gray-700',
        icon: '📝',
        label: 'Umum'
      };
  }
};

// 5 Template Favorit (Quick Access Shortcut Buttons)
export const FAVORITE_TEMPLATE_SHORTCUTS = [
  { id: 'hubungi_libur', label: 'HUBUNGI LIBUR' },
  { id: 'jadwal_berubah', label: 'JADWAL DOKTER BERUBAH' },
  { id: 'syarat_bpjs', label: 'SYARAT BPJS' },
  { id: 'pengingat_h1', label: 'PENGINGAT KONTROL' },
  { id: 'poli_off', label: 'POLI OFF' }
];

// 2. KUMPULAN TEMPLATE RESMI PENDAFTARAN RSU MUHAMMADIYAH BABAT (4 KATEGORI UTAMA)
export const DEFAULT_TEMPLATES: WaTemplate[] = [
  // =========================================================================
  // 1. KATEGORI: KONTROL & JADWAL
  // =========================================================================
  {
    id: 'hubungi_libur',
    label: 'HUBUNGI LIBUR',
    category: 'kontrol_jadwal',
    text: `Assalamualaikum Wr. Wb.
Kami dari Admin Pendaftaran RSU Muhammadiyah Babat ingin menginformasikan bahwasanya pelayanan [NAMA_POLI] bersama dengan [NAMA_DOKTER] pada hari ini LIBUR dan praktik kembali sesuai jadwal selanjutnya.

Bagi pasien BPJS yang telah terdaftar, silakan melakukan pembatalan antrean mandiri di aplikasi Mobile JKN dan memilih tanggal kontrol selanjutnya. Bagi pasien UMUM, silakan mendaftar kembali pada hari praktik berikutnya.

Atas perhatian dan kerja samanya, kami sampaikan terima kasih.🙏
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'jadwal_berubah',
    label: 'JADWAL DOKTER BERUBAH',
    category: 'kontrol_jadwal',
    text: `Assalamualaikum Wr. Wb.
Selamat pagi/siang Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat ingin menginformasikan bahwa terdapat penyesuaian jam praktik [NAMA_DOKTER] di [NAMA_POLI] pada hari ini karena adanya tindakan medis/operasi darurat.

Pelayanan poliklinik diperkirakan baru akan dimulai pada pukul 17.00 WIB. Kami memohon maaf yang sebesar-besarnya atas ketidaknyamanan ini. Mohon konfirmasi apakah Bapak/Ibu tetap berkenan hadir.

Terima kasih atas pengertian dan kerja samanya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'pengingat_h1',
    label: 'PENGINGAT KONTROL ESOK HARI (H-1)',
    category: 'kontrol_jadwal',
    text: `Assalamualaikum Wr. Wb.
Selamat sore Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat mengingatkan kembali bahwa Anda memiliki jadwal kontrol/pemeriksaan kesehatan besok hari di [NAMA_POLI] bersama [NAMA_DOKTER].

Mohon membawa kartu identitas (KTP/KIS), Surat Kontrol asli, dan buku kontrol saat hadir di loket pendaftaran. Jika berhalangan hadir atau ingin menjadwalkan ulang, mohon berkenan menginformasikannya kepada kami.

Terima kasih dan semoga senantiasa diberikan kesehatan.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'konfirmasi_kehadiran',
    label: 'KONFIRMASI KEHADIRAN KONTROL',
    category: 'kontrol_jadwal',
    text: `Assalamualaikum Wr. Wb.
Selamat pagi Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat ingin mengonfirmasi apakah Bapak/Ibu jadi melakukan pemeriksaan kontrol di [NAMA_POLI] bersama [NAMA_DOKTER] pada hari ini?

Mohon konfirmasi kehadirannya agar berkas rekam medis dan antrean pendaftaran dapat kami siapkan lebih awal.

Terima kasih atas kerja samanya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'belum_waktu_kontrol',
    label: 'BELUM WAKTU KONTROL',
    category: 'kontrol_jadwal',
    text: `Assalamualaikum Wr. Wb.
Selamat malam kami dari Admin Pendaftaran RSU Muhammadiyah Babat izin menginformasikan terkait pendaftaran pemeriksaan atas nama [NAMA_PASIEN] di [NAMA_POLI].

Dikarenakan kunjungan terakhir Bapak/Ibu belum memenuhi syarat jarak kontrol Surat Kontrol, maka untuk hari ini pemeriksaan belum dapat dijamin menggunakan jaminan BPJS Kesehatan.

Jika tetap ingin melakukan pemeriksaan hari ini, pelayanan dapat dialihkan menggunakan Pasien UMUM (biaya mandiri), atau dijadwalkan ulang sesuai tanggal aktif surat kontrol. Mohon konfirmasinya kembali.

Terima kasih atas perhatian dan kerja samanya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'tidak_bisa_kontrol',
    label: 'TIDAK BISA KONTROL HARI INI',
    category: 'kontrol_jadwal',
    text: `Assalamu'alaikum Wr. Wb.
Kami dari Admin Pendaftaran RSU Muhammadiyah Babat ingin menginformasikan kepada Bapak/Ibu [NAMA_PASIEN] bahwa pemeriksaan di [NAMA_POLI] bersama [NAMA_DOKTER] belum dapat dilakukan hari ini.

Sesuai ketentuan BPJS Kesehatan, jarak minimal kunjungan kontrol dari tanggal pemeriksaan sebelumnya belum terpenuhi sehingga SEP belum dapat diterbitkan. Pemeriksaan baru dapat dijamin kembali setelah rentang waktu yang ditentukan, atau pemeriksaan hari ini dapat dialihkan sebagai Pasien UMUM (biaya mandiri).

Demikian informasi yang dapat kami sampaikan. Terima kasih atas perhatian dan pengertiannya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'tepat_waktu',
    label: 'TEPAT WAKTU HADIR POLIKLINIK',
    category: 'kontrol_jadwal',
    text: `Assalamualaikum Wr. Wb.
Selamat sore Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat izin menginformasikan jadwal pelayanan pemeriksaan di [NAMA_POLI] bersama [NAMA_DOKTER] hari ini.

Kami mengimbau agar Bapak/Ibu dapat hadir tepat waktu di rumah sakit pada pukul 16.00 WIB untuk verifikasi berkas dan persiapan pemanggilan antrean dokter. Apabila ada kendala dalam perjalanan atau berhalangan hadir, mohon untuk mengonfirmasikannya kembali kepada kami.

Terima kasih atas kerja samanya. Semoga sehat selalu.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'penyesuaian_jam_dokter',
    label: 'PENYESUAIAN JAM OPERASI DOKTER',
    category: 'kontrol_jadwal',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat menyampaikan informasi bahwa [NAMA_DOKTER] saat ini sedang mendampingi tindakan bedah operasi elektif.

Praktik [NAMA_POLI] diperkirakan akan dimulai sedikit mundur dari jam biasanya. Bapak/Ibu dapat menunggu dengan nyaman di ruang tunggu lantai 1 atau konfirmasi kedatangan saat tiba di rumah sakit.

Terima kasih atas kesabaran dan pengertiannya.
Wassalamu'alaikum Wr. Wb.`
  },

  // =========================================================================
  // 2. KATEGORI: BPJS & JKN
  // =========================================================================
  {
    id: 'syarat_bpjs',
    label: 'SYARAT BPJS & KIS',
    category: 'bpjs_jkn',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat menginformasikan persyaratan berkas untuk pelayanan BPJS Kesehatan di [NAMA_POLI] bersama [NAMA_DOKTER]:

1. Kartu BPJS / KIS aktif (asli atau digital di Mobile JKN)
2. Kartu identitas diri (e-KTP / KK asli)
3. Surat Rujukan Faskes 1 (Puskesmas/Klinik) yang masih berlaku (maksimal 90 hari), ATAU Surat Kontrol asli RSUMB bagi pasien kontrol rutin.
4. Bukti nomor antrean pendaftaran online Mobile JKN.

Harap hadir 30 menit sebelum jam pelayanan dimulai untuk verifikasi fingerprint di loket admisi. Terima kasih.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'rujukan_habis',
    label: 'PASIEN RUJUKAN HABIS / SALAH POLI',
    category: 'bpjs_jkn',
    text: `Assalamualaikum Wr. Wb.
Mohon maaf mengganggu waktunya Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat izin menginformasikan bahwa surat rujukan Faskes Tingkat 1 Anda ke [NAMA_POLI] teridentifikasi telah habis masa berlakunya (melebihi 90 hari) atau tujuan rujukan berbeda.

Agar penjaminan BPJS Kesehatan dapat diterbitkan (SEP tercetak), kami sarankan untuk memperbarui surat rujukan terlebih dahulu di Puskesmas / Klinik Faskes 1 asal Anda sebelum jadwal pemeriksaan dokter.

Mohon konfirmasinya kembali. Terima kasih atas perhatiannya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'validasi_sep_pending',
    label: 'VALIDASI SEP BPJS PENDING',
    category: 'bpjs_jkn',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat menginformasikan bahwa penerbitan Surat Eligibilitas Peserta (SEP) BPJS Kesehatan untuk pemeriksaan di [NAMA_POLI] masih memerlukan verifikasi berkas tambahan di loket admisi RSUMB.

Mohon membawa dokumen fisik (KTP, Kartu KIS, dan Surat Rujukan/Kontrol) saat tiba di loket pendaftaran agar dapat dibantu bridging manual oleh petugas.

Terima kasih atas pengertian dan kerja samanya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'fp_fingerprint_bpjs',
    label: 'KENDALA FINGERPRINT BPJS',
    category: 'bpjs_jkn',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], pendaftaran BPJS Kesehatan Anda di [NAMA_POLI] membutuhkan perekaman sidik jari (Fingerprint) langsung di mesin biometrik loket pendaftaran RSU Muhammadiyah Babat.

Bagi pasien lansia, anak-anak di bawah 17 tahun, atau pasien dengan kendala fisik pada sidik jari, petugas kami akan membantu proses approval surat dispensasi (Surat Keterangan Gagal Fingerprint) di loket admisi.

Terima kasih dan semoga lekas sehat.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'kartu_bpjs_nonaktif',
    label: 'KARTU BPJS NON-AKTIF / TUNGGAKAN',
    category: 'bpjs_jkn',
    text: `Assalamualaikum Wr. Wb.
Selamat pagi/siang Bapak/Ibu [NAMA_PASIEN], sistem pendaftaran BPJS kami mendeteksi status kepesertaan BPJS Kesehatan Anda saat ini berstatus NON-AKTIF (terdapat tunggakan iuran atau peralihan segmen kepesertaan).

Agar penjaminan dapat digunakan kembali, silakan melakukan pembayaran tagihan melalui aplikasi Mobile JKN / ATM / merchant terdekat. Apabila dibutuhkan pemeriksaan segera hari ini, pelayanan dapat dilayani sebagai Pasien UMUM.

Terima kasih atas perhatian dan kerja samanya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'selisih_kelas_bpjs',
    label: 'NAIK KELAS / SELISIH BIAYA BPJS',
    category: 'bpjs_jkn',
    text: `Assalamualaikum Wr. Wb.
Yth. Keluarga Pasien [NAMA_PASIEN], kami dari Bagian Admisi RSU Muhammadiyah Babat mengonfirmasi pengajuan naik kelas perawatan rawat inap dari hak kelas BPJS Kesehatan.

Sesuai Permenkes terbaru, pasien yang menghendaki peningkatan kelas perawatan akan dikenakan selisih biaya (co-sharing) sesuai ketentuan tarif INA-CBG. Informasi rincian selisih biaya dapat dikonsultasikan di Loket Admisi Rawat Inap lantai 1.

Terima kasih atas kepercayaannya pada RSUMB.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'bayi_baru_lahir_bpjs',
    label: 'SYARAT PENJAMINAN BAYI BARU LAHIR (BBL)',
    category: 'bpjs_jkn',
    text: `Assalamualaikum Wr. Wb.
Selamat atas kelahiran putra/putri Bapak/Ibu [NAMA_PASIEN]. Kami dari Admisi RSUMB menginformasikan kelengkapan pendaftaran jaminan BPJS Bayi Baru Lahir (maksimal 3x24 jam hari kerja):

1. Surat Keterangan Lahir (SKL) dari RSUMB
2. Kartu Keluarga (KK) & KTP kedua orang tua
3. Kartu BPJS Kesehatan aktif Ibu Bayi
4. Surat Nikah orang tua

Mohon segera menyerahkan berkas ke Loket Admisi agar penjaminan rawat inap bayi berjalan lancar. Terima kasih.
Wassalamu'alaikum Wr. Wb.`
  },

  // =========================================================================
  // 3. KATEGORI: HASIL LAB & BERKAS
  // =========================================================================
  {
    id: 'hasil_penunjang',
    label: 'HASIL LAB / RAD SUDAH JADI',
    category: 'lab_berkas',
    text: `Assalamualaikum Wr. Wb.
Selamat pagi/siang Bapak/Ibu [NAMA_PASIEN], kami dari RSU Muhammadiyah Babat ingin menginformasikan bahwa hasil pemeriksaan penunjang (Laboratorium / Radiologi) atas nama Bapak/Ibu telah selesai divalidasi oleh dokter penanggung jawab.

Hasil dapat diambil langsung di loket pendaftaran/admisi atau dapat langsung dikonsultasikan saat jadwal kontrol Bapak/Ibu bersama [NAMA_DOKTER] di [NAMA_POLI].

Terima kasih dan semoga lekas sembuh.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'berkas_klaim_pending',
    label: 'BERKAS KLAIM BELUM LENGKAP',
    category: 'lab_berkas',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami dari Unit Pengendali Klaim & Admisi RSU Muhammadiyah Babat menginformasikan bahwa terdapat berkas administrasi berobat yang belum lengkap (fotokopi KTP / Surat Kontrol / Kartu Asuransi).

Mohon berkenan membawa atau mengirimkan foto berkas tersebut melalui nomor WhatsApp ini agar berkas klaim pemeriksaan di [NAMA_POLI] dapat kami tuntaskan.

Terima kasih banyak atas kerja sama yang baik.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'resep_prb_kronis',
    label: 'OBAT KRONIS / RESEP PRB TERSEDIA',
    category: 'lab_berkas',
    text: `Assalamualaikum Wr. Wb.
Selamat pagi Bapak/Ibu [NAMA_PASIEN], kami dari Instalasi Farmasi RSU Muhammadiyah Babat menginformasikan bahwa paket obat Program Rujuk Balik (PRB) / Obat Kronis Anda di [NAMA_POLI] telah siap diambil.

Pengambilan dapat dilakukan di Loket Farmasi Rawat Jalan dengan membawa buku PRB dan bukti identitas diri.

Semoga senantiasa sehat dan obat dapat dikonsumsi teratur. Terima kasih.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'resume_surat_dokter',
    label: 'RESUME MEDIS & SURAT KETERANGAN',
    category: 'lab_berkas',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], permohonan Resume Medis / Surat Keterangan Sakit / Hasil Pemeriksaan Kesehatan dari [NAMA_DOKTER] di [NAMA_POLI] telah selesai ditandatangani dan dilegalisir.

Dokumen dapat diambil di Loket Pendaftaran / Informasi RSUMB pada jam kerja dengan menunjukkan identitas pasien.

Terima kasih atas kerja samanya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'plafon_jasa_raharja',
    label: 'UPDATE JAMINAN JASA RAHARJA (LP KLL)',
    category: 'lab_berkas',
    text: `Assalamualaikum Wr. Wb.
Yth. Keluarga Pasien [NAMA_PASIEN], kami dari Bagian Kasir & Admisi RSUMB menginformasikan terkait pengurusan klaim kecelakaan lalu lintas (KLL).

Mohon segera melengkapi Laporan Polisi (LP) asli dan Surat Jaminan dari Jasa Raharja agar plafon biaya pengobatan kecelakaan dapat langsung dialihkan ke penjamin utama (Jasa Raharja) maksimal 2x24 jam sejak admisi.

Terima kasih atas perhatian dan koordinasinya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'legalisir_berkas',
    label: 'PENGAMBILAN LEGALISIR BERKAS',
    category: 'lab_berkas',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], berkas salinan rekam medis / rincian biaya yang Anda ajukan untuk keperluan legalisir telah selesai diproses oleh bagian Rekam Medis RSUMB.

Silakan mengambil berkas di Loket Pendaftaran Lt. 1 dengan menunjukkan bukti tanda terima permohonan.

Terima kasih atas kepercayaan Anda.
Wassalamu'alaikum Wr. Wb.`
  },

  // =========================================================================
  // 4. KATEGORI: KENDALA & POLI OFF
  // =========================================================================
  {
    id: 'poli_off',
    label: 'POLI OFF PASIEN BELUM DATANG',
    category: 'kendala_off',
    text: `Assalamualaikum Wr. Wb.
Mohon maaf atas ketidaknyamanannya, Bapak/Ibu [NAMA_PASIEN].

Perlu kami informasikan bahwa pelayanan [NAMA_POLI] bersama [NAMA_DOKTER] hari ini telah selesai karena seluruh pasien di ruang tunggu telah selesai dilayani oleh dokter.

Keterangan jam praktik 'sampai selesai' berarti pelayanan poliklinik ditutup setelah seluruh antrean pasien yang telah hadir terlayani tuntas dan ruang tunggu kosong. Untuk kunjungan berikutnya, kami menyarankan agar Bapak/Ibu dapat tiba di rumah sakit lebih awal sebelum kuota antrean harian ditutup.

Terima kasih banyak atas perhatian dan pengertiannya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'batal_antrean',
    label: 'PEMBATALAN ANTREAN BERHASIL',
    category: 'kendala_off',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami menginformasikan bahwa permohonan pembatalan nomor antrean pendaftaran Anda di [NAMA_POLI] bersama [NAMA_DOKTER] untuk hari ini telah berhasil diproses oleh sistem pendaftaran RSU Muhammadiyah Babat.

Apabila ingin menjadwalkan ulang pemeriksaan, silakan mendaftar kembali melalui aplikasi Mobile JKN atau nomor WhatsApp pendaftaran resmi kami pada jadwal praktik berikutnya.

Terima kasih atas konfirmasinya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'dokter_operasi_cito',
    label: 'DOKTER TINDAKAN OPERASI CITO',
    category: 'kendala_off',
    text: `Assalamualaikum Wr. Wb.
Mohon maaf atas keterlambatan pelayanan di [NAMA_POLI]. Kami menginformasikan kepada Bapak/Ibu [NAMA_PASIEN] bahwa [NAMA_DOKTER] sedang menangani operasi darurat (cito) yang memerlukan penanganan segera.

Pelayanan poliklinik akan dibuka kembali segera setelah tindakan operasi selesai. Bagi pasien yang ingin menunggu dipersilakan di ruang tunggu poliklinik, atau dapat melakukan reschedule ke jadwal berikutnya jika berhalangan.

Mohon doa dan kerja samanya. Terima kasih.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'kuota_poli_penuh',
    label: 'KUOTA POLIKLINIK PENUH',
    category: 'kendala_off',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat menginformasikan bahwa kuota pendaftaran antrean [NAMA_POLI] bersama [NAMA_DOKTER] untuk hari ini telah TERPENUHI demi menjaga mutu dan waktu pelayanan medis.

Kami sarankan Bapak/Ibu untuk melakukan booking antrean lebih awal melalui Mobile JKN untuk jadwal praktik berikutnya.

Mohon maaf atas ketidaknyamanan ini dan terima kasih atas pengertiannya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'dr_lilis',
    label: 'HUBUNGI PASIEN DR. LILIS',
    category: 'kendala_off',
    text: `Assalamualaikum Wr. Wb.
Kami dari Admin Pendaftaran RSU Muhammadiyah Babat ingin menginformasikan kepada pasien Poliklinik Paru ([NAMA_DOKTER]) untuk hari ini.

Sehubungan dengan jumlah pasien hari ini yang relatif sedikit sehingga pelayanan berjalan lebih cepat, kami mengimbau Bapak/Ibu [NAMA_PASIEN] agar dapat hadir di rumah sakit sebelum pukul 20.00 WIB agar pelayanan dapat berjalan lancar.

Demi kesehatan dan kenyamanan bersama, kami juga mengingatkan untuk selalu menggunakan Masker Medis selama berada di area rumah sakit.

Atas perhatiannya, kami sampaikan terima kasih.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'server_simrs_gangguan',
    label: 'GANGGUAN SISTEM JARINGAN / BRIDGING',
    category: 'kendala_off',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami menginformasikan bahwa saat ini server bridging BPJS / SIMRS sedang mengalami pemeliharaan jaringan berkala dari pusat.

Pendaftaran dan pelayanan tetap berjalan secara semi-manual. Kami memohon maaf jika waktu tunggu penerbitan SEP sedikit lebih lama dari biasanya. Petugas kami sedang mengupayakan pelayanan secepat mungkin.

Terima kasih atas kesabaran dan pengertian Bapak/Ibu.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'konfirmasi_kehadiran_janji',
    label: 'KONFIRMASI KEHADIRAN KUNJUNGAN POLI',
    category: 'kontrol_jadwal',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami dari Admin Pendaftaran RSU Muhammadiyah Babat mohon konfirmasi kesediaan kehadiran Anda untuk pemeriksaan di [NAMA_POLI] bersama [NAMA_DOKTER].

Mohon berkenan membalas pesan ini:
• Ketik: YA (Jika Hadir)
• Ketik: BATAL (Jika Berhalangan / Reschedule)

Kehadiran tepat waktu sangat membantu ketertiban antrean dan kenyamanan bersama. Terima kasih atas kerja samanya.
Wassalamu'alaikum Wr. Wb.`
  },
  {
    id: 'hasil_lab_rontgen_selesai',
    label: 'HASIL LAB & RADIOLOGI SELESAI',
    category: 'lab_berkas',
    text: `Assalamualaikum Wr. Wb.
Yth. Bapak/Ibu [NAMA_PASIEN], kami dari RSU Muhammadiyah Babat menginformasikan bahwa hasil pemeriksaan diagnostik (Laboratorium / Radiologi) Anda telah SELESAI divalidasi oleh Dokter Spesialis.

Hasil cetak fisik dapat diambil di Loket Pengambilan Hasil Rawat Jalan atau langsung dikonsultasikan kembali ke dokter DPJP ([NAMA_DOKTER]) pada jadwal praktik poliklinik berikutnya.

Semoga Bapak/Ibu senantiasa diberikan kesembuhan dan kesehatan.
Wassalamu'alaikum Wr. Wb.`
  }
];

const STORAGE_CUSTOM_TEMPLATES_KEY = 'rsumb_custom_wa_templates_v2';
const STORAGE_SELECTED_POLI_KEY = 'rsumb_selected_poli_v3';
const STORAGE_SELECTED_DOKTER_KEY = 'rsumb_selected_dokter_v3';

const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper untuk validasi nomor BPJS (standar 13 digit)
export const validateBpjsNumber = (noBpjs?: string): { isValid: boolean; message: string } => {
  if (!noBpjs || noBpjs.trim() === '' || noBpjs === '-' || noBpjs === '0') {
    return { isValid: false, message: 'Nomor BPJS kosong / belum terekstrak.' };
  }
  const clean = noBpjs.replace(/\D/g, '');
  if (clean.length !== 13) {
    return { isValid: false, message: `Panjang nomor BPJS tidak valid (${clean.length} digit, harus tepat 13 digit)` };
  }
  return { isValid: true, message: 'Nomor BPJS valid (13 digit)' };
};

export const SIMRSRecapParser: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [rekapData, setRekapData] = useState<RekapPendaftaranDoc[]>([]);

  // DE-DUPLICATION: Pastikan data rekap HANYA berisi 1 objek unik per Nomor Antrean
  const uniqueRekapData = useMemo(() => {
    const map = new Map<string, RekapPendaftaranDoc>();
    for (const item of rekapData) {
      if (item.nomorUrut && !map.has(item.nomorUrut)) {
        map.set(item.nomorUrut, item);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => parseInt(a.nomorUrut, 10) - parseInt(b.nomorUrut, 10)
    );
  }, [rekapData]);

  const [isParsing, setIsParsing] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'rekap' | 'template'>('rekap');

  // Custom Templates from LocalStorage
  const [customTemplates, setCustomTemplates] = useState<WaTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_TEMPLATES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Gagal memuat template kustom:', e);
    }
    return [];
  });

  // Gabungan template bawaan + template kustom
  const allTemplates = useMemo(() => {
    return [...DEFAULT_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // Dropdown States (Linked Dropdowns)
  const [selectedPoli, setSelectedPoli] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SELECTED_POLI_KEY);
      if (saved && POLIKLINIK_DOKTER_MAP[saved]) return saved;
    } catch {}
    return LIST_POLIKLINIK[0];
  });

  // Daftar dokter yang aktif sesuai Poliklinik terpilih
  const availableDoctors = useMemo(() => {
    return POLIKLINIK_DOKTER_MAP[selectedPoli] || [];
  }, [selectedPoli]);

  const [selectedDokter, setSelectedDokter] = useState<string>(() => {
    try {
      const savedPoli = localStorage.getItem(STORAGE_SELECTED_POLI_KEY) || LIST_POLIKLINIK[0];
      const docs = POLIKLINIK_DOKTER_MAP[savedPoli] || POLIKLINIK_DOKTER_MAP[LIST_POLIKLINIK[0]] || [];
      const savedDoc = localStorage.getItem(STORAGE_SELECTED_DOKTER_KEY);
      if (savedDoc && docs.includes(savedDoc)) return savedDoc;
      return docs[0] || '';
    } catch {
      return POLIKLINIK_DOKTER_MAP[LIST_POLIKLINIK[0]]?.[0] || '';
    }
  });

  // Template State
  const [activeTemplateId, setActiveTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [templateText, setTemplateText] = useState<string>(() => {
    const initPoli = LIST_POLIKLINIK[0];
    const initDoc = POLIKLINIK_DOKTER_MAP[initPoli]?.[0] || '';
    return DEFAULT_TEMPLATES[0].text
      .replace(/\[NAMA_POLI\]/g, initPoli)
      .replace(/\[NAMA_DOKTER\]/g, initDoc);
  });

  // Modal Tambah Template Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<TemplateCategory>('kontrol_jadwal');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  // Quick WhatsApp Test Field
  const [manualPhone, setManualPhone] = useState('');

  // Feedback State
  const [copied, setCopied] = useState(false);
  const [rekapCopied, setRekapCopied] = useState(false);

  useEffect(() => {
    return subscribeRekapPendaftaran(setRekapData);
  }, []);

  // Simpan pilihan poli & dokter ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SELECTED_POLI_KEY, selectedPoli);
      localStorage.setItem(STORAGE_SELECTED_DOKTER_KEY, selectedDokter);
    } catch {}
  }, [selectedPoli, selectedDokter]);

  // Validasi jika dokter terpilih tidak berada dalam daftar dokter poliklinik tersebut
  useEffect(() => {
    if (availableDoctors.length > 0 && !availableDoctors.includes(selectedDokter)) {
      setSelectedDokter(availableDoctors[0]);
    }
  }, [availableDoctors, selectedDokter]);

  // Simpan template kustom ke localStorage
  const saveCustomTemplates = (updated: WaTemplate[]) => {
    setCustomTemplates(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Gagal menyimpan template kustom:', e);
    }
  };

  // Dynamic Patient Name State
  const [patientName, setPatientName] = useState('');

  // Real-time replacement untuk Nama Pasien
  const handlePatientNameChange = (newName: string) => {
    const oldName = patientName;
    setPatientName(newName);

    setTemplateText((prev) => {
      let updated = prev;
      const targetReplacement = newName.trim() ? newName : '[NAMA_PASIEN]';

      if (updated.includes('[NAMA_PASIEN]')) {
        return updated.replace(/\[NAMA_PASIEN\]/g, targetReplacement);
      }
      if (oldName.trim() && updated.includes(oldName)) {
        return updated.replace(new RegExp(escapeRegExp(oldName), 'g'), targetReplacement);
      }
      return updated;
    });
  };

  // Pilih template dari Pill Buttons
  const handleSelectTemplate = (template: WaTemplate) => {
    setActiveTemplateId(template.id);
    let applied = template.text
      .replace(/\[NAMA_POLI\]/g, selectedPoli)
      .replace(/\[NAMA_DOKTER\]/g, selectedDokter);
    if (patientName.trim()) {
      applied = applied.replace(/\[NAMA_PASIEN\]/g, patientName.trim());
    }
    setTemplateText(applied);
  };

  // 1. LINKED DROPDOWNS: Ganti Poliklinik otomatis memperbarui Dokter DPJP ke dokter pertama
  const handlePoliChange = (newPoli: string) => {
    const oldPoli = selectedPoli;
    const oldDokter = selectedDokter;
    const docs = POLIKLINIK_DOKTER_MAP[newPoli] || [];
    const defaultDoc = docs[0] || '';

    setSelectedPoli(newPoli);
    setSelectedDokter(defaultDoc);

    setTemplateText((prev) => {
      let updated = prev;

      // Ganti Poliklinik
      if (updated.includes('[NAMA_POLI]')) {
        updated = updated.replace(/\[NAMA_POLI\]/g, newPoli);
      } else if (oldPoli && updated.includes(oldPoli)) {
        updated = updated.replace(new RegExp(escapeRegExp(oldPoli), 'g'), newPoli);
      } else {
        for (const p of LIST_POLIKLINIK) {
          if (updated.includes(p)) {
            updated = updated.replace(new RegExp(escapeRegExp(p), 'g'), newPoli);
            break;
          }
        }
      }

      // Ganti Dokter
      if (defaultDoc) {
        if (updated.includes('[NAMA_DOKTER]')) {
          updated = updated.replace(/\[NAMA_DOKTER\]/g, defaultDoc);
        } else if (oldDokter && updated.includes(oldDokter)) {
          updated = updated.replace(new RegExp(escapeRegExp(oldDokter), 'g'), defaultDoc);
        } else {
          for (const d of ALL_DOKTER_LIST) {
            if (updated.includes(d)) {
              updated = updated.replace(new RegExp(escapeRegExp(d), 'g'), defaultDoc);
              break;
            }
          }
        }
      }

      return updated;
    });
  };

  // Ganti Dokter DPJP dari Dropdown
  const handleDokterChange = (newDokter: string) => {
    const oldDokter = selectedDokter;
    setSelectedDokter(newDokter);

    setTemplateText((prev) => {
      let updated = prev;
      if (updated.includes('[NAMA_DOKTER]')) {
        return updated.replace(/\[NAMA_DOKTER\]/g, newDokter);
      }
      if (oldDokter && updated.includes(oldDokter)) {
        return updated.replace(new RegExp(escapeRegExp(oldDokter), 'g'), newDokter);
      }
      for (const doc of ALL_DOKTER_LIST) {
        if (updated.includes(doc)) {
          updated = updated.replace(new RegExp(escapeRegExp(doc), 'g'), newDokter);
          break;
        }
      }
      return updated;
    });
  };

  // 2. MODAL GRID KARTU ALA GOOGLE KEEP (29 TEMPLATE)
  const [isKeepModalOpen, setIsKeepModalOpen] = useState(false);
  const [keepSearch, setKeepSearch] = useState('');
  const [keepCategoryFilter, setKeepCategoryFilter] = useState<string>('all');
  const keepSearchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when Keep modal opens
  useEffect(() => {
    if (isKeepModalOpen) {
      const timer = setTimeout(() => {
        keepSearchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isKeepModalOpen]);

  // Global shortcut: Ctrl+K / Cmd+K to toggle Google Keep modal & Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setKeepSearch('');
        setIsKeepModalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isKeepModalOpen) {
        setIsKeepModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKeepModalOpen]);

  // Matching templates for Google Keep Grid
  const filteredKeepTemplates = useMemo(() => {
    const q = keepSearch.toLowerCase().trim();
    return allTemplates.filter((t) => {
      const norm = getNormalizedCategory(t.category);
      const matchCat =
        keepCategoryFilter === 'all' ||
        (keepCategoryFilter === 'custom' && t.isCustom) ||
        norm === keepCategoryFilter;

      if (!matchCat) return false;
      if (!q) return true;

      return (
        t.label.toLowerCase().includes(q) ||
        t.text.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    });
  }, [allTemplates, keepSearch, keepCategoryFilter]);

  // Quick Access 5 Templates
  const favoriteTemplates = useMemo(() => {
    return FAVORITE_TEMPLATE_SHORTCUTS.map((fav) => {
      const found = allTemplates.find((t) => t.id === fav.id);
      return {
        id: fav.id,
        label: fav.label,
        template: found || allTemplates[0]
      };
    });
  }, [allTemplates]);

  // Simpan Template Baru
  const handleSaveNewTemplate = () => {
    if (!newTemplateLabel.trim() || !newTemplateContent.trim()) {
      alert('Mohon isi Judul Template dan Isi Pesan Template!');
      return;
    }

    const newTpl: WaTemplate = {
      id: `custom_${Date.now()}`,
      label: newTemplateLabel.trim().toUpperCase(),
      category: newTemplateCategory,
      text: newTemplateContent.trim(),
      isCustom: true
    };

    const updated = [...customTemplates, newTpl];
    saveCustomTemplates(updated);
    setActiveTemplateId(newTpl.id);
    let applied = newTpl.text
      .replace(/\[NAMA_POLI\]/g, selectedPoli)
      .replace(/\[NAMA_DOKTER\]/g, selectedDokter);
    if (patientName.trim()) {
      applied = applied.replace(/\[NAMA_PASIEN\]/g, patientName.trim());
    }
    setTemplateText(applied);
    setIsAddModalOpen(false);
    setNewTemplateLabel('');
    setNewTemplateContent('');
    setNewTemplateCategory('kontrol_jadwal');
  };

  // Hapus Template Kustom
  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus template kustom ini?')) {
      const updated = customTemplates.filter((t) => t.id !== id);
      saveCustomTemplates(updated);
      if (activeTemplateId === id) {
        handleSelectTemplate(DEFAULT_TEMPLATES[0]);
      }
    }
  };

  // Reset Template Aktif ke bentuk aslinya
  const handleResetCurrentTemplate = () => {
    const original = allTemplates.find((t) => t.id === activeTemplateId);
    if (original) {
      let applied = original.text
        .replace(/\[NAMA_POLI\]/g, selectedPoli)
        .replace(/\[NAMA_DOKTER\]/g, selectedDokter);
      if (patientName.trim()) {
        applied = applied.replace(/\[NAMA_PASIEN\]/g, patientName.trim());
      }
      setTemplateText(applied);
    }
  };

  // 1. Helper ekstraksi nomor WA MURNI (diawali 08xx, minimal 10 digit, non-digit dibersihkan)
  // Kata-kata seperti 'Sudah', 'Belum', 'Baru', 'Lama', 'BPJS', 'UMUM', '-' DILARANG MASUK.
  // 1. Helper ekstraksi nomor WA MURNI (diawali 08, 628, +628, panjang 10-13 digit)
  // DILARANG keras mengandung ':' atau pola format tanggal (YYYY-MM-DD / DD-MM-YYYY).
  const extractCleanWaFromBlock = (blockText: string): string => {
    // Regex: Match candidates starting with (0, 62, +62) followed by 8, then 8-11 digits.
    // Negative lookahead (?![^ ]*:) ensures no ':' is in the string.
    const regex = /(?:(?:\+?62|0)8)(?!\d*:)\d{8,11}/g;
    const candidates = blockText.match(regex);
    
    if (!candidates) return '-';

    for (let candidate of candidates) {
      // Reject if it contains ':' (just in case) or date patterns
      if (candidate.includes(':') || /\d{4}-\d{2}-\d{2}/.test(candidate) || /\d{2}-\d{2}-\d{4}/.test(candidate)) {
        continue;
      }

      // Bersihkan karakter non-digit
      let digits = candidate.replace(/\D/g, '');

      // Reject all zeros or obviously invalid patterns
      if (/^0+$/.test(digits)) continue;

      // Normalisasi ke format standar '08xxxx'
      if (digits.startsWith('628')) {
        // Konversi 628xxxx -> 08xxxx
        digits = '08' + digits.slice(3);
      } else if (digits.startsWith('08')) {
        // Sudah format 08xxxx
      } else if (digits.startsWith('62') && digits.length >= 10) {
        // Konversi 62xxxx -> 0xxxx
        digits = '0' + digits.slice(2);
      }
      
      // Validasi panjang akhir: 10 - 13 digit
      if (/^08\d{8,11}$/.test(digits)) {
        return digits;
      }
    }
    
    return '-';
  };

  // 2. PARSING REKAP DATA SIMRS (ISOLASI PER BLOK PENANDA "true"):
  // - Pecah seluruh input teks mentah berdasarkan penanda kata "true" (1 blok = 1 pasien)
  // - Ekstrak No. Antrean: 3 digit angka pertama setelah "true"
  // - Ekstrak Nama Pasien: teks di antara No. RM (6 digit) dan Jenis Kelamin ("L" / "P")
  // - Ekstrak No. WA: Murni angka 10-15 digit diawali "08"
  // - De-duplication: Tepat 1 objek per Nomor Antrean (Map by No Antrean)
  const parseData = async () => {
    setIsParsing(true);
    const rawText = inputText.trim();
    if (!rawText) {
      setIsParsing(false);
      return;
    }

    // 1. ISOLASI BLOK PASIEN DENGAN PENANDA "true"
    const rawBlocks = rawText.split(/\btrue\b/i);

    if (rawBlocks.length <= 1) {
      alert('Tidak ditemukan penanda "true" pada teks pendaftaran SIMRS.\n\nPastikan data yang disalin memuat kata "true" pada setiap awal baris data pasien.');
      setIsParsing(false);
      return;
    }

    // Map untuk menjamin hasil rekap HANYA 1 objek per Nomor Antrean (DE-DUPLICATION)
    const patientMap = new Map<string, Omit<RekapPendaftaranDoc, 'id' | 'createdAt'>>();

    for (let b = 1; b < rawBlocks.length; b++) {
      const block = rawBlocks[b];
      if (!block.trim()) continue;

      // a. No. Antrean: Cari string 3 digit angka pertama setelah "true" (misal: "001", "002")
      const queueMatch = block.match(/\b(\d{3})\b/) || block.match(/^\s*(\d{1,3})\b/m);
      if (!queueMatch) continue;
      const noAntrean = queueMatch[1].padStart(3, '0');

      // b. Nama Pasien: Cari teks baris Nama yang terletak di antara Nomor Rekam Medis (6 digit) dan Jenis Kelamin ("L" / "P")
      let namaPasien = '';
      const nameMatch = block.match(/(?:\b\d{6}\b|\b\d{2}-\d{2}-\d{2}\b)[\s\r\n]+([A-Za-z\s.,'’\-\/]+?)[\s\r\n]+\b([LP])\b/i);
      if (nameMatch && nameMatch[1] && nameMatch[1].trim().length >= 2) {
        namaPasien = nameMatch[1].trim();
      } else {
        // Fallback jika format terpisah baris
        const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          if (/^\d{6}$/.test(l) && lines[i + 1] && /^[LP]$/i.test(lines[i + 2] || '')) {
            namaPasien = lines[i + 1];
            break;
          }
        }
        if (!namaPasien) {
          // Baris ke-9 (index 8) atau scan baris nama yang valid
          if (lines[8] && /[A-Za-z]{3,}/.test(lines[8]) && !/^(true|false|bpjs|umum|lama|baru|belum|sudah)$/i.test(lines[8])) {
            namaPasien = lines[8];
          } else {
            for (const line of lines) {
              if (
                line.length >= 3 &&
                /^[A-Za-z\s.,'’\-]+$/.test(line) &&
                !/^(true|false|bpjs|umum|lama|baru|belum|sudah|batal|int)$/i.test(line) &&
                !line.includes('202') &&
                !line.includes(':')
              ) {
                namaPasien = line;
                break;
              }
            }
          }
        }
      }

      // c. Nomor Telepon/WA: Scan string yang MURNI berisi angka minimal 10 digit (diawali "08" atau "62")
      // Kata "Sudah", "Belum", "Baru", "Lama", "BPJS", "UMUM", atau "-" SANGAT DILARANG dimasukkan
      let nomorWA = extractCleanWaFromBlock(block);
      if (
        !nomorWA ||
        nomorWA === '-' ||
        !nomorWA.startsWith('08') ||
        /^(sudah|belum|baru|lama|bpjs|umum)$/i.test(nomorWA)
      ) {
        nomorWA = '-';
      }

      // DE-DUPLICATION: Hanya simpan 1 objek per Nomor Antrean unik
      if (noAntrean && !patientMap.has(noAntrean)) {
        patientMap.set(noAntrean, {
          nomorUrut: noAntrean,
          namaPasien: (namaPasien || 'PASIEN').toUpperCase(),
          noHp: nomorWA,
          jenisPembayaran: 'BPJS Kesehatan'
        });
      }
    }

    const uniquePatients = Array.from(patientMap.values()).sort(
      (a, b) => parseInt(a.nomorUrut, 10) - parseInt(b.nomorUrut, 10)
    );

    if (uniquePatients.length === 0) {
      alert('Tidak ada data pasien yang berhasil diekstrak.\n\nPastikan format teks memiliki:\n1. Penanda "true"\n2. Nomor Antrean 3 digit (contoh: 001)\n3. Nama Pasien di antara RM 6 digit dan Jenis Kelamin (L/P)\n4. Nomor WA 08xx');
      setIsParsing(false);
      return;
    }

    // Hapus data lama yang memiliki nomor antrean yang sama agar tidak terjadi tumpang tindih
    for (const data of uniquePatients) {
      const existing = rekapData.find((r) => r.nomorUrut === data.nomorUrut);
      if (existing) {
        await deleteRekapPendaftaranDoc(existing.id);
      }
      await addRekapPendaftaranDoc(data);
    }

    setInputText('');
    setIsParsing(false);
  };

  // Fungsi sinkronisasi record ke PatientQueueView dengan validasi BPJS cross-reference
  const handleSyncToQueue = (row: RekapPendaftaranDoc) => {
    const paymentType = row.jenisPembayaran || 'BPJS Kesehatan';
    const bpjsVal = validateBpjsNumber(row.noBpjs);

    if (paymentType.includes('BPJS') && !bpjsVal.isValid) {
      if (!confirm(`Potensi Error Input BPJS:\n${bpjsVal.message}\n\nApakah Anda tetap ingin menyinkronkan ${row.namaPasien} ke Antrean Pasien (PatientQueueView)?`)) {
        return;
      }
    }

    const queueId = `queue-rekap-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newQueueItem: PatientQueueItem = {
      id: queueId,
      nomorAntrean: row.nomorUrut,
      namaPasien: row.namaPasien,
      noBpjs: row.noBpjs || '-',
      poli: selectedPoli,
      dpjp: selectedDokter,
      jamDaftar: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'Menunggu',
      jenisPembayaran: (paymentType.includes('BPJS') ? 'BPJS Kesehatan' : paymentType.includes('Umum') ? 'Umum' : 'Asuransi Swasta') as 'BPJS Kesehatan' | 'Umum' | 'Asuransi Swasta'
    };

    try {
      const existing = localStorage.getItem('rsumb_patient_queues');
      const list = existing ? JSON.parse(existing) : [];
      const updated = [newQueueItem, ...list];
      localStorage.setItem('rsumb_patient_queues', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    savePatientQueueDoc(newQueueItem).catch(() => {});
    window.dispatchEvent(new CustomEvent('rsumb_queue_updated', { detail: newQueueItem }));

    alert(`Berhasil menyinkronkan ${row.namaPasien} (${row.nomorUrut}) ke Antrean Pasien!`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintRekap = (format: 'F4' | 'Thermal' = 'F4') => {
    if (uniqueRekapData.length === 0) {
      alert('Tidak ada data rekap pasien untuk dicetak.');
      return;
    }

    const isThermal = format === 'Thermal';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rekap Pendaftaran Pasien SIMRS - RSU Muhammadiyah Babat</title>
        <style>
          @page {
            size: ${isThermal ? '80mm auto' : '215mm 330mm'};
            margin: ${isThermal ? '3mm' : '12mm'};
          }
          * { box-sizing: border-box; }
          body {
            font-family: ${isThermal ? "'Courier New', Courier, monospace" : "'Segoe UI', Arial, sans-serif"};
            padding: ${isThermal ? '4px' : '15px'};
            color: #000;
            background: #fff;
            font-size: ${isThermal ? '11px' : '12px'};
            line-height: 1.3;
          }
          .kop {
            text-align: center;
            border-bottom: ${isThermal ? '1px dashed #000' : '2px solid #005d42'};
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .kop h2 {
            margin: 0;
            font-size: ${isThermal ? '13px' : '16px'};
            color: ${isThermal ? '#000' : '#005d42'};
            text-transform: uppercase;
            font-weight: bold;
          }
          .kop p {
            margin: 2px 0;
            font-size: ${isThermal ? '9px' : '11px'};
          }
          .title {
            text-align: center;
            font-weight: bold;
            font-size: ${isThermal ? '11px' : '13px'};
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .meta {
            font-size: ${isThermal ? '9px' : '11px'};
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: ${isThermal ? '10px' : '11px'};
          }
          th, td {
            border: 1px solid #333;
            padding: ${isThermal ? '4px 3px' : '6px 8px'};
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
          }
          .thermal-list {
            border-top: 1px dashed #000;
            padding-top: 6px;
          }
          .thermal-item {
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
          }
          .footer-ttd {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .no-print {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #fff;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 999;
            display: flex;
            gap: 8px;
          }
          .btn-util {
            background: #005d42;
            color: white;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 4px;
            font-size: 12px;
          }
          .btn-close {
            background: #64748b;
          }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-util" onclick="window.print()">🖨️ Cetak Ulang</button>
          <button class="btn-util btn-close" onclick="window.close()">❌ Tutup Tab</button>
        </div>

        <div class="kop">
          <h2>RSU Muhammadiyah Babat</h2>
          <p>Jl. Raya Babat-Surabaya No. 15 Babat, Lamongan • Telp. (0322) 451122</p>
        </div>

        <div class="title">REKAPITULASI PENDAFTARAN PASIEN (SIMRS)</div>
        <div class="meta">
          <span>Tanggal: <b>${dateStr}</b></span>
          <span>Total: <b>${uniqueRekapData.length} Pasien</b></span>
        </div>

        ${isThermal ? `
          <div class="thermal-list">
            ${uniqueRekapData.map((p, idx) => `
              <div class="thermal-item">
                <div style="font-weight:bold;">${idx + 1}. [${p.nomorUrut}] ${p.namaPasien}</div>
                <div>WA/HP: ${p.noHp}</div>
                <div>Penjamin: ${p.jenisPembayaran || '-'} ${p.noBpjs ? `(${p.noBpjs})` : ''}</div>
              </div>
            `).join('')}
          </div>
          <div style="text-align:center; margin-top:15px; font-size:9px; border-top:1px dashed #000; padding-top:6px;">
            Dicetak oleh Staf Pendaftaran RSUMB<br/>
            Simpan struk ini sebagai arsip bukti admisi
          </div>
        ` : `
          <table>
            <thead>
              <tr>
                <th style="width:35px;">NO</th>
                <th style="width:70px;">ANTREAN</th>
                <th>NAMA PASIEN</th>
                <th>NO. WHATSAPP / HP</th>
                <th>PENJAMIN / JENIS BAYAR</th>
                <th>NO. BPJS</th>
              </tr>
            </thead>
            <tbody>
              ${uniqueRekapData.map((p, idx) => `
                <tr>
                  <td style="text-align:center;">${idx + 1}</td>
                  <td style="text-align:center; font-weight:bold;">${p.nomorUrut}</td>
                  <td><b>${p.namaPasien}</b></td>
                  <td>${p.noHp}</td>
                  <td>${p.jenisPembayaran || '-'}</td>
                  <td>${p.noBpjs || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer-ttd">
            <div>
              <p>Mengetahui,</p>
              <br/><br/><br/>
              <p><b><u>Kepala Unit Admisi & Rekam Medis</u></b></p>
            </div>
            <div>
              <p>Babat, ${new Date().toLocaleDateString('id-ID')}</p>
              <br/><br/><br/>
              <p><b><u>Petugas Pendaftaran / Kasir</u></b></p>
            </div>
          </div>
        `}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWin = window.open(url, '_blank');
    if (!printWin) {
      alert('Mohon aktifkan Izin Pop-up di peramban browser Anda untuk membuka lembar cetak.');
    }
  };

  const copyAllRekap = () => {
    const text = [...uniqueRekapData]
      .sort((a, b) => parseInt(a.nomorUrut, 10) - parseInt(b.nomorUrut, 10))
      .map((d) => `${d.nomorUrut}\t${d.namaPasien}\t${d.noHp}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setRekapCopied(true);
    setTimeout(() => setRekapCopied(false), 2000);
  };

  // Normalisasi Nomor WhatsApp
  const formatWaNumber = (phoneStr: string): string | null => {
    const digitsOnly = phoneStr.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 8) return null;
    if (digitsOnly.startsWith('08')) {
      return '628' + digitsOnly.slice(2);
    }
    if (digitsOnly.startsWith('8')) {
      return '628' + digitsOnly.slice(1);
    }
    if (digitsOnly.startsWith('62')) {
      return digitsOnly;
    }
    return digitsOnly;
  };

  // URL WhatsApp untuk Tabel Pasien & Pengiriman Pesan
  const buildWaUrl = (rawPhone: string, patientNameParam?: string) => {
    const formattedNum = formatWaNumber(rawPhone);
    let finalMessage = templateText;
    const nameToUse = patientNameParam || patientName.trim();
    if (nameToUse) {
      finalMessage = finalMessage.replace(/\[NAMA_PASIEN\]/g, nameToUse);
    }
    finalMessage = finalMessage
      .replace(/\[NAMA_POLI\]/g, selectedPoli)
      .replace(/\[NAMA_DOKTER\]/g, selectedDokter);

    const encodedText = encodeURIComponent(finalMessage);
    if (formattedNum) {
      return `https://wa.me/${formattedNum}?text=${encodedText}`;
    }
    return `https://wa.me/?text=${encodedText}`;
  };

  // Template yang aktif
  const currentTemplate = allTemplates.find((t) => t.id === activeTemplateId) || DEFAULT_TEMPLATES[0];

  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen">
      {/* 2 Tab Utama Navigation */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm w-full">
        <button
          onClick={() => setActiveMainTab('rekap')}
          className={`flex-1 py-3 px-6 font-bold text-sm md:text-base rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === 'rekap'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
          }`}
        >
          <span>📋</span>
          <span>Rekap Data Pasien</span>
          {uniqueRekapData.length > 0 && (
            <span
              className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                activeMainTab === 'rekap' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
              }`}
            >
              {uniqueRekapData.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveMainTab('template');
            setKeepSearch('');
            setKeepCategoryFilter('all');
            setIsKeepModalOpen(true);
          }}
          className={`flex-1 py-3 px-6 font-bold text-sm md:text-base rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMainTab === 'template'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
          }`}
        >
          <span>💬</span>
          <span>Template Pesan WhatsApp</span>
          <span
            className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              activeMainTab === 'template' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {allTemplates.length} Template (Google Keep Grid)
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REKAP DATA PASIEN                                                  */}
      {/* ========================================================================= */}
      {activeMainTab === 'rekap' ? (
        <div className="space-y-6">
          {/* Header & Input Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">Rekap Data Pendaftaran SIMRS</h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Tempel data teks mentah dari sistem pendaftaran SIMRS. Parser otomatis mendeteksi penanda <b className="text-blue-700">true</b> dan mengekstrak <b>No. Antrean (baris 2)</b>, <b>Nama Pasien (baris 9)</b>, serta <b>deteksi otomatis nomor WA dinamis (pola 08xx)</b>.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600">
                <span>Template Aktif:</span>
                <span className="font-bold text-blue-700 max-w-[200px] truncate">{currentTemplate.label}</span>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tempel data teks mentah pendaftaran SIMRS di sini...&#10;&#10;Pola Struktur Otomatis:&#10;• Setiap blok diawali: true&#10;• Baris ke-2: No. Antrean (contoh: 001)&#10;• Baris ke-9: Nama Pasien (contoh: ARSYANENDRA ARAZKA ATHALLAH, AN)&#10;• Deteksi otomatis nomor WA dinamis (pola 08xx / 62xx)"
              rows={6}
              className="w-full p-4 border border-slate-300 rounded-xl bg-slate-50/40 text-xs md:text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-700 leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={parseData}
                  disabled={isParsing || !inputText.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <RefreshCw size={16} className={isParsing ? 'animate-spin' : ''} />
                  <span>Rapikan & Ekstraksi Data</span>
                </button>
                <button
                  onClick={() => setInputText('')}
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 font-medium text-sm rounded-xl transition-all cursor-pointer"
                >
                  Kosongkan Input
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Hasil Rekap Pendaftaran</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total Terdaftar: <b className="text-slate-700">{uniqueRekapData.length} Pasien</b> • Tersinkronisasi Real-Time
                </p>
              </div>

              {uniqueRekapData.length > 0 && (
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handlePrintRekap('F4')}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 border border-blue-200/60 cursor-pointer"
                    >
                      <Printer size={16} />
                      <span>🖨️ Cetak Kertas F4 / Laporan</span>
                    </button>
                    <button
                      onClick={() => handlePrintRekap('Thermal')}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 border border-slate-200/60 cursor-pointer"
                    >
                      <Printer size={16} />
                      <span>🧾 Cetak Thermal 80mm / Struk</span>
                    </button>
                  </div>
                  <button
                    onClick={copyAllRekap}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 border border-emerald-200/60 cursor-pointer"
                  >
                    {rekapCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    <span>{rekapCopied ? 'Berhasil Disalin!' : 'Salin Seluruh Rekap (Tab)'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-6 w-32">No. Antrean</th>
                    <th className="py-3.5 px-6">Nama Pasien</th>
                    <th className="py-3.5 px-6">Nomor Telepon / WA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {uniqueRekapData.length > 0 ? (
                    uniqueRekapData.map((row) => {
                      const isPhoneValid = formatWaNumber(row.noHp) !== null;
                      const waUrl = isPhoneValid ? buildWaUrl(row.noHp, row.namaPasien) : '#';

                      return (
                        <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                          {/* 1. No. Antrean */}
                          <td className="py-3.5 px-6 w-32">
                            <span className="inline-flex items-center justify-center min-w-[52px] px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-mono text-sm font-bold border border-blue-200/80 shadow-2xs">
                              {row.nomorUrut}
                            </span>
                          </td>

                          {/* 2. Nama Pasien */}
                          <td className="py-3.5 px-6">
                            <div className="font-bold text-slate-800 text-sm tracking-tight">{row.namaPasien}</div>
                          </td>

                          {/* 3. Nomor Telepon / WA & Aksi Kirim WA */}
                          <td className="py-3.5 px-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                {isPhoneValid ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-800 text-sm tracking-wide">
                                      {row.noHp}
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" title="Nomor WhatsApp Valid" />
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Tidak Ada No. WA
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Tombol Kirim WA Otomatis */}
                                {isPhoneValid ? (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={`Kirim WA template "${currentTemplate.label}" ke ${row.namaPasien}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ring-1 ring-emerald-500/30"
                                  >
                                    <MessageSquare size={14} className="fill-white/20" />
                                    <span>Kirim WA</span>
                                  </a>
                                ) : (
                                  <button
                                    disabled
                                    title="Tidak ada nomor WhatsApp yang valid"
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed border border-slate-200"
                                  >
                                    <MessageSquare size={14} />
                                    <span>Kirim WA</span>
                                  </button>
                                )}

                                {/* Tombol Hapus Baris */}
                                <button
                                  onClick={() => deleteRekapPendaftaranDoc(row.id)}
                                  title="Hapus dari daftar rekap"
                                  className="p-1.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all cursor-pointer border border-rose-200/80 active:scale-95"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-14 text-center text-slate-400 text-sm">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl">📋</span>
                          <span className="font-medium text-slate-600">Belum ada data pendaftaran yang direkap</span>
                          <span className="text-xs text-slate-400 max-w-sm">
                            Tempel data teks dari SIMRS pada kotak di atas lalu klik tombol <b>Rapikan & Ekstraksi Data</b>.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: TEMPLATE PESAN WHATSAPP LENGKAP & DINAMIS                          */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            {/* 1. BARIS KONTROL DINAMIS: NAMA PASIEN, POLIKLINIK, DOKTER DPJP, & TOMBOL TAMBAH */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              {/* Kolom 1: Input Nama Pasien Dinamis */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User size={15} className="text-blue-600" />
                    <span>Nama Pasien:</span>
                  </span>
                  {patientName && (
                    <button
                      type="button"
                      onClick={() => handlePatientNameChange('')}
                      className="text-[10px] text-slate-400 hover:text-red-500 transition cursor-pointer"
                      title="Kosongkan nama pasien"
                    >
                      Hapus
                    </button>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => handlePatientNameChange(e.target.value)}
                    placeholder="Masukkan Nama Pasien (misal: Tn. Kaswat)"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none shadow-xs transition-all"
                  />
                  {patientName && (
                    <button
                      type="button"
                      onClick={() => handlePatientNameChange('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] transition cursor-pointer"
                      title="Kosongkan nama pasien"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* Kolom 2: Dropdown Poliklinik */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Building2 size={15} className="text-blue-600" />
                  <span>Pilih Poliklinik ([NAMA_POLI]):</span>
                </label>
                <select
                  value={selectedPoli}
                  onChange={(e) => handlePoliChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none shadow-xs transition-all cursor-pointer"
                >
                  {LIST_POLIKLINIK.map((poli) => (
                    <option key={poli} value={poli}>
                      {poli}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kolom 3: Dropdown Dokter DPJP (Otomatis difilter berdasarkan Poliklinik terpilih) */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope size={15} className="text-emerald-600" />
                    <span>Dokter DPJP ([NAMA_DOKTER]):</span>
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    {availableDoctors.length} Dokter
                  </span>
                </label>
                <select
                  value={selectedDokter}
                  onChange={(e) => handleDokterChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none shadow-xs transition-all cursor-pointer"
                >
                  {availableDoctors.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kolom 4: Tombol Tambah Template Baru (Warna Biru) */}
              <div className="lg:col-span-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus size={16} />
                  <span>+ Tambah Template Baru</span>
                </button>
              </div>
            </div>

            {/* 2. TOOLBAR PILIHAN TEMPLATE: 5 QUICK ACCESS FAVORIT + SEARCHABLE DROPDOWN KATEGORI */}
            <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Quick Access Favorit (5 Template Utama) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <span>⭐</span>
                  <span className="hidden sm:inline">Favorit:</span>
                </span>
                {favoriteTemplates.map((fav) => {
                  const isSelected = activeTemplateId === fav.id;
                  return (
                    <button
                      key={fav.id}
                      type="button"
                      onClick={() => handleSelectTemplate(fav.template)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                          : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-700 border border-slate-200/90 shadow-2xs'
                      }`}
                      title={`Pilih cepat: ${fav.label}`}
                    >
                      <span>{fav.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tombol Pemilih Template (Buka Modal Grid Kartu Google Keep) */}
              <button
                type="button"
                id="btn-open-keep-template-modal"
                onClick={() => {
                  setKeepSearch('');
                  setKeepCategoryFilter('all');
                  setIsKeepModalOpen(true);
                }}
                className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs hover:shadow-md flex items-center justify-between gap-2.5 transition cursor-pointer group"
                title="Buka seluruh 29 template dalam tampilan Grid Kartu ala Google Keep"
              >
                <div className="flex items-center gap-2 truncate">
                  <LayoutGrid size={16} className="text-blue-200 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate max-w-[200px] font-bold">
                    {currentTemplate ? currentTemplate.label : 'Pilih Template...'}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-md text-[10.5px] font-extrabold uppercase shrink-0">
                  {allTemplates.length} Kartu Keep
                </span>
              </button>
            </div>

            {/* 4. KOTAK AREA TEKS TEMPLATE (EDITOR PERSIS DI BAWAH PILIHAN TEMPLATE) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-800">Isi Pesan Template:</span>
                  <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-blue-200/60">
                    {currentTemplate.label}
                  </span>
                </div>

                {/* Tag Bantuan Sisip Cepat */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400">Sisipkan Tag:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const val = patientName.trim() ? ` ${patientName.trim()}` : ' [NAMA_PASIEN]';
                      setTemplateText((prev) => prev + val);
                    }}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[11px] font-mono font-medium transition cursor-pointer border border-blue-200/60"
                    title={patientName.trim() ? `Sisipkan "${patientName.trim()}"` : 'Sisipkan tag [NAMA_PASIEN]'}
                  >
                    + [NAMA_PASIEN]
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateText((prev) => prev + ` ${selectedPoli}`)}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[11px] font-mono font-medium transition cursor-pointer"
                  >
                    + {selectedPoli}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateText((prev) => prev + ` ${selectedDokter}`)}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-mono font-medium transition cursor-pointer"
                  >
                    + {selectedDokter}
                  </button>
                </div>
              </div>

              {/* Textarea Template Dinamis */}
              <textarea
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                rows={9}
                className="w-full p-4 border border-slate-300 rounded-xl bg-slate-50/20 text-sm md:text-base leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition font-sans"
                placeholder="Tulis atau edit isi pesan template di sini..."
              />

              {/* Tombol Aksi di Bawah Textarea: Salin Pesan, Reset, & Kirim WA Manual */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(templateText)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Teks Berhasil Disalin!' : 'Salin Pesan Template'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCurrentTemplate}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs md:text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    title="Kembalikan teks sesuai template baku"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Template</span>
                  </button>
                </div>

                {/* Kirim WhatsApp Manual */}
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Phone size={15} className="text-slate-400 ml-1.5" />
                  <input
                    type="text"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="Nomor WA (contoh: 08123456789)..."
                    className="px-3 py-1.5 text-xs md:text-sm bg-white border border-slate-300 rounded-lg outline-none w-48 focus:border-blue-500 font-mono"
                  />
                  <a
                    href={buildWaUrl(manualPhone)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Send size={14} />
                    <span>Buka WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH TEMPLATE BARU                                               */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                <span>Tambah Template Pesan Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Judul / Label Template:
                </label>
                <input
                  type="text"
                  value={newTemplateLabel}
                  onChange={(e) => setNewTemplateLabel(e.target.value)}
                  placeholder="Contoh: PENGINGAT VAKSINASI, JADWAL USG, DLL."
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Kategori Template:
                </label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value as TemplateCategory)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
                >
                  <option value="kontrol_jadwal">Kontrol & Jadwal</option>
                  <option value="bpjs_jkn">BPJS & JKN</option>
                  <option value="lab_berkas">Hasil Lab & Berkas</option>
                  <option value="kendala_off">Kendala & Poli Off</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Isi Pesan Template:
                </label>
                <textarea
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  placeholder="Tuliskan format pesan resmi di sini. Anda dapat menggunakan variabel [NAMA_PASIEN], [NAMA_POLI], [NAMA_DOKTER]..."
                  rows={6}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">Variabel yang didukung:</span>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">[NAMA_PASIEN]</span>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">[NAMA_POLI]</span>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">[NAMA_DOKTER]</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewTemplate}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-sm cursor-pointer"
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL GRID KARTU ALA GOOGLE KEEP (29 TEMPLATE WHATSAPP)
          ======================================================== */}
      {isKeepModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsKeepModalOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-gray-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xs shrink-0">
                  <LayoutGrid size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                      Katalog Template WhatsApp (Grid Kartu Google Keep)
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-black text-[10.5px] rounded-full uppercase border border-blue-200 dark:border-blue-700">
                      {allTemplates.length} Catatan Tersedia
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pilih template catatan pesan resmi untuk kontrol dokter, BPJS, hasil lab, dan kendala poli. Klik kartu mana saja untuk langsung menyalin ke editor pesan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-gray-700">
                  <kbd>ESC</kbd> untuk Batal
                </span>
                <button
                  type="button"
                  onClick={() => setIsKeepModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Tutup (Tekan ESC)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Kolom Pencarian & Filter Kategori Mendatar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
              {/* Search Bar Besar dengan Autofocus */}
              <div className="relative">
                <Search size={18} className="text-blue-600 dark:text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={keepSearchInputRef}
                  type="text"
                  placeholder="Ketik untuk mencari template (contoh: Libur, BPJS, Kontrol, Jam Berubah, Lab)..."
                  autoFocus
                  value={keepSearch}
                  onChange={(e) => setKeepSearch(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-gray-700 focus:border-blue-600 rounded-xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                />
                {keepSearch && (
                  <button
                    type="button"
                    onClick={() => setKeepSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Hapus pencarian"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Tombol Filter Kategori Mendatar (Pill Buttons) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs flex-1">
                  {CATEGORY_GROUPS.map((grp) => {
                    const isActive = keepCategoryFilter === grp.id;
                    const count =
                      grp.id === 'all'
                        ? allTemplates.length
                        : allTemplates.filter((t) => getNormalizedCategory(t.category) === grp.id).length;

                    return (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => setKeepCategoryFilter(grp.id)}
                        className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border text-xs ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20 scale-[1.02]'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-gray-700'
                        }`}
                      >
                        <span>{grp.icon}</span>
                        <span>{grp.label}</span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 shrink-0 font-medium pl-3 border-l border-slate-200 dark:border-gray-700">
                  <span>Hasil:</span>
                  <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-gray-700">
                    {filteredKeepTemplates.length} Catatan
                  </span>
                </div>
              </div>
            </div>

            {/* Container Grid Kartu Google Keep (Responsive Masonry / CSS Grid) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100/70 dark:bg-slate-950/40">
              {filteredKeepTemplates.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-gray-700 space-y-3 max-w-md mx-auto my-6 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-700">
                    <Search size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Template Tidak Ditemukan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Tidak ada catatan template yang cocok dengan kata kunci "{keepSearch}".
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setKeepSearch('');
                      setKeepCategoryFilter('all');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Tampilkan Seluruh {allTemplates.length} Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredKeepTemplates.map((t) => {
                    const isSelected = activeTemplateId === t.id;
                    const style = getKeepCardStyle(t.category);

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          handleSelectTemplate(t);
                          setIsKeepModalOpen(false);
                        }}
                        className={`p-4 rounded-xl border border-slate-300 dark:border-gray-700 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-xl hover:-translate-y-1 relative text-left ${
                          style.bg
                        } ${
                          isSelected
                            ? 'ring-2 ring-blue-600 border-blue-600 shadow-md'
                            : style.border
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Baris Atas: Kategori Badge & Tag */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.badge}`}
                            >
                              <span>{style.icon}</span>
                              <span>{style.label}</span>
                            </span>

                            <div className="flex items-center gap-1">
                              {t.isCustom && (
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                  Kustom
                                </span>
                              )}
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[9.5px] shadow-2xs">
                                  <Check size={12} className="text-blue-100" />
                                  Aktif
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Judul Catatan dengan Font Tebal */}
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-snug">
                            {t.label}
                          </h4>

                          {/* Isi Teks / Cuplikan Pesan (Body Text) yang Nyaman Dibaca */}
                          <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg border border-black/5 dark:border-white/5 shadow-2xs text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-line line-clamp-4 leading-relaxed select-none">
                            {t.text}
                          </div>
                        </div>

                        {/* Footer Kartu: Jumlah Karakter & Interaktif Hover */}
                        <div className="pt-2.5 mt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 dark:text-slate-500 font-medium">
                            {t.text.length} karakter
                          </span>
                          <span
                            className={`font-bold flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5'
                            }`}
                          >
                            <span>{isSelected ? '✓ Sedang Dipakai' : 'Pilih Catatan'}</span>
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px]">
                  💡 <strong>Tip Cepat:</strong> Klik kartu catatan untuk langsung menerapkan teks ke editor pesan dan menutup jendela ini. Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-700 rounded text-[10.5px] font-mono">ESC</kbd> untuk membatalkan.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsKeepModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Tutup Katalog (ESC)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
