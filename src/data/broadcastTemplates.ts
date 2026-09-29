import { BroadcastTemplatePreset } from '../types/broadcastTypes';

export const DEFAULT_BROADCAST_TEMPLATES: BroadcastTemplatePreset[] = [
  {
    id: 'perubahan_jadwal',
    title: 'Perubahan / Libur Jadwal Praktik Dokter',
    description: 'Pemberitahuan perubahan jam praktik atau pembatalan jadwal dokter poliklinik.',
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan bahwa pelayanan di {poliklinik} bersama {nama_dokter} di RSU Muhammadiyah Babat (RSUMB) mengalami perubahan jadwal praktik.

Mohon maaf yang sebesar-besarnya atas ketidaknyamanan ini. Untuk konfirmasi jadwal pemeriksaan selanjutnya atau pemindahan antrean, Bapak/Ibu dapat langsung membalas pesan ini atau menghubungi Hotline Admisi RSUMB.

Terima kasih atas perhatian dan pengertiannya.
Wassalamu'alaikum Wr. Wb.

Humas & Admisi Rawat Jalan
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'pengingat_kontrol',
    title: 'Pengingat Kontrol / Jadwal Poliklinik',
    description: 'Pengingat jadwal pemeriksaan rutin dan kontrol ulang pasien rawat jalan.',
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Mengingatkan jadwal kontrol & konsultasi kesehatan Anda di {poliklinik} RSU Muhammadiyah Babat bersama {nama_dokter}.

Ketentuan Pelayanan:
1. Harap hadir 30 menit sebelum jadwal praktik dimulai.
2. Membawa Kartu Berobat RSUMB & Surat Rujukan / Kartu BPJS Kesehatan (bagi pasien JKN).
3. Melakukan konfirmasi kedatangan di loket pendaftaran rawat jalan.

Semoga lekas sembuh dan sehat selalu.
Wassalamu'alaikum Wr. Wb.

Unit Pelayanan Rawat Jalan
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'substitusi_dokter',
    title: 'Dokter Pengganti (Substitusi DPJP)',
    description: 'Pemberitahuan dokter pengganti sementara saat dokter utama berhalangan.',
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan bahwa untuk pelayanan di {poliklinik} RSU Muhammadiyah Babat pada jadwal terkait akan dilayani oleh Dokter Pengganti (Substitusi), dikarenakan {nama_dokter} berhalangan hadir.

Pelayanan pemeriksaan medis, resep obat, dan tindakan poliklinik tetap berjalan optimal sesuai standar mutu RSUMB.

Terima kasih atas kepercayaannya.
Wassalamu'alaikum Wr. Wb.

Manajemen Pelayanan Medis
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'informasi_umum',
    title: 'Informasi Umum & Layanan Pasien',
    description: 'Pesan salam dan informasi umum pelayanan poliklinik RSUMB.',
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Terima kasih telah mempercayakan pemeriksaan kesehatan Anda di {poliklinik} RSU Muhammadiyah Babat bersama {nama_dokter}.

Kesehatan dan kenyamanan Anda adalah prioritas utama kami. Untuk kritik, saran, maupun informasi layanan penunjang lainnya (Laboratorium, Radiologi, Farmasi), silakan hubungi Customer Care RSUMB di 0812-3456-7890.

Wassalamu'alaikum Wr. Wb.
RSU Muhammadiyah Babat (RSUMB)`
  }
];

export const SAMPLE_RAW_REGISTRATION_TEXT = `1.
Nama: KULIYAH. NY
No. WhatsApp: 081333618808
Poliklinik: Poliklinik Saraf
Dokter: dr. I'anatul Ulya, Sp.N

2.
Nama: SUKARTI, NY
No. HP: 085232572807
Poliklinik: Poliklinik Penyakit Dalam
Dokter: dr. Moch. Djunaedy Santoso, Sp.PD

3.
MUDAYATUN
081234567890
Poliklinik Bedah
dr. Rieski Widhanar, Sp. B

4.
Nama Pasien: SITI AMINAH, NY
Kontak WA: 085648081122
Poli: Poliklinik Kebidanan & Kandungan
DPJP: dr. Dony R. Bimantara, Sp. OG, AIFO-K

5.
Nama: AN. AHMAD FAUZI
WhatsApp: 082198765432
Poliklinik Anak
dr. M. Syukron, Sp. A`;
