import { BroadcastTemplatePreset } from '../types/broadcastTypes';

export const DEFAULT_BROADCAST_TEMPLATES: BroadcastTemplatePreset[] = [
  // ==========================================
  // KELOMPOK 1: KONTROL & JADWAL (6 TEMPLATE)
  // ==========================================
  {
    id: 'perubahan_jadwal',
    title: 'Libur / Pembatalan Praktik Dokter',
    description: 'Pemberitahuan dokter berhalangan hadir atau poliklinik tutup sementara.',
    category: 'Kontrol & Jadwal',
    tag: 'Dokter Libur',
    isFavorite: true,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan bahwa pelayanan di {poliklinik} bersama {nama_dokter} di RSU Muhammadiyah Babat (RSUMB) pada {tanggal_hari_ini} DILIBURKAN / TIDAK BUKA PRAKTIK karena dokter yang bersangkutan berhalangan.

Mohon maaf yang sebesar-besarnya atas ketidaknyamanan ini. Untuk penjadwalan ulang kunjungan atau pemindahan antrean ke hari berikutnya, Bapak/Ibu dapat langsung membalas pesan ini atau menghubungi nomor Admisi RSUMB.

Terima kasih atas pengertian dan kerja samanya.
Wassalamu'alaikum Wr. Wb.

Humas & Admisi Pelayanan Rawat Jalan
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'perubahan_jam_praktik',
    title: 'Perubahan Jam Praktik Dokter Poliklinik',
    description: 'Pemberitahuan pergeseran atau pemadatan jam buka loket dan pelayanan dokter.',
    category: 'Kontrol & Jadwal',
    tag: 'Perubahan Jam',
    isFavorite: true,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan terdapat penyesuaian jam pelayanan di {poliklinik} bersama {nama_dokter} di RSU Muhammadiyah Babat:
• Semula: Pukul 08.00 WIB
• Berubah Menjadi: Pukul 10.30 WIB (Menyesuaikan tindakan operasi pagi DPJP)

Bagi Bapak/Ibu pasien terdaftar, pendaftaran berkas dan antrean tetap dapat diproses di loket pendaftaran rawat jalan mulai pukul 07.30 WIB.

Mohon maaf atas keterlambatan jadwal ini dan terima kasih atas kesabaran Bapak/Ibu.
Wassalamu'alaikum Wr. Wb.

Unit Pelayanan Rawat Jalan
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'pengingat_kontrol',
    title: 'Pengingat Kontrol Poliklinik (H-1)',
    description: 'Pengingat jadwal pemeriksaan berkala rutin pasien rawat jalan.',
    category: 'Kontrol & Jadwal',
    tag: 'Pengingat Kontrol',
    isFavorite: true,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Mengingatkan kembali jadwal kontrol dan konsultasi kesehatan berkala Anda di {poliklinik} RSU Muhammadiyah Babat bersama {nama_dokter}.

Ketentuan Kedatangan:
1. Harap hadir 30 menit sebelum jam pelayanan dimulai.
2. Membawa Kartu Berobat RSUMB & Surat Kontrol / Rujukan Faskes 1 (bagi pasien BPJS JKN).
3. Melakukan finger print dan cetak antrean di Loket Admisi Rawat Jalan.

Semoga lekas pulih dan sehat selalu bersama keluarga.
Wassalamu'alaikum Wr. Wb.

Admisi & Registrasi Rawat Jalan
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'substitusi_dokter',
    title: 'Penggantian Dokter DPJP (Substitusi)',
    description: 'Pemberitahuan dokter pengganti sementara saat dokter utama bertugas keluar.',
    category: 'Kontrol & Jadwal',
    tag: 'Dokter Pengganti',
    isFavorite: true,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan bahwa untuk pelayanan di {poliklinik} RSU Muhammadiyah Babat pada hari ini dilayani oleh Dokter Pengganti (Substitusi), dikarenakan {nama_dokter} berhalangan hadir.

Pelayanan konsultasi medis, pemeriksaan, serta peresepan obat tetap berjalan normal dan optimal sesuai standar pelayanan RSUMB.

Terima kasih atas kepercayaannya.
Wassalamu'alaikum Wr. Wb.

Manajemen Pelayanan Medis
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'konfirmasi_kehadiran_kontrol',
    title: 'Konfirmasi Kesiapan Kehadiran Pasien Kontrol',
    description: 'Memastikan apakah pasien berencana hadir sesuai jadwal yang ditentukan.',
    category: 'Kontrol & Jadwal',
    tag: 'Konfirmasi Hadir',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Kami dari bagian pendaftaran RSU Muhammadiyah Babat ingin mengonfirmasi kesiapan kehadiran Bapak/Ibu untuk jadwal pemeriksaan di {poliklinik} bersama {nama_dokter}.

Mohon berkenan membalas pesan ini dengan memilih salah satu:
1. "SIAP HADIR" (apabila berencana datang sesuai jadwal)
2. "RESCHEDULE" (apabila berhalangan dan ingin mengubah tanggal)

Konfirmasi Bapak/Ibu sangat membantu penataan nomor antrean dokter. Terima kasih.
Wassalamu'alaikum Wr. Wb.

Customer Care & Pendaftaran RSUMB`
  },
  {
    id: 'reschedule_jadwal_kontrol',
    title: 'Penjadwalan Ulang (Reschedule) Kontrol',
    description: 'Konfirmasi perubahan tanggal kunjungan pasien atas permohonan pasien/dokter.',
    category: 'Kontrol & Jadwal',
    tag: 'Reschedule',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Permohonan perubahan jadwal (reschedule) konsultasi Bapak/Ibu di {poliklinik} bersama {nama_dokter} telah berhasil kami proses dalam sistem SIMRS RSU Muhammadiyah Babat.

• Poliklinik: {poliklinik}
• Dokter DPJP: {nama_dokter}
• Status: Berhasil Dipindahkan

Harap membawa bukti chat ini dan kartu berobat saat registrasi di loket rawat jalan. Terima kasih.
Wassalamu'alaikum Wr. Wb.

Unit Registrasi & SIMRS RSUMB`
  },

  // ==========================================
  // KELOMPOK 2: BPJS & JAMINAN (6 TEMPLATE)
  // ==========================================
  {
    id: 'rujukan_faskes_habis',
    title: 'Masa Berlaku Rujukan Faskes 1 Hampir Habis',
    description: 'Pemberitahuan masa aktif surat rujukan puskesmas/klinik segera berakhir (90 hari).',
    category: 'BPJS & Jaminan',
    tag: 'Rujukan BPJS',
    isFavorite: true,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan bahwa masa berlaku Surat Rujukan FKTP (Puskesmas/Klinik Pratama) BPJS Kesehatan Bapak/Ibu untuk pelayanan di {poliklinik} RSU Muhammadiyah Babat akan SEGERA HABIS / KEDALUWARSA.

Agar pelayanan kunjungan berikutnya tetap terjamin penuh oleh BPJS Kesehatan, mohon sebelum kunjungan selanjutnya berkenan memperbarui Surat Rujukan di Faskes Tingkat 1 Anda.

Jika ada pertanyaan seputar penjaminan BPJS, silakan hubungi Tim BPJS Center RSUMB.
Wassalamu'alaikum Wr. Wb.

Petugas Loket BPJS Center & Admisi
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'bpjs_non_aktif',
    title: 'Kendala Status Kepesertaan BPJS Non-Aktif',
    description: 'Pemberitahuan status kartu BPJS menunggak atau non-aktif saat bridging SEP.',
    category: 'BPJS & Jaminan',
    tag: 'Status BPJS Non-Aktif',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Berdasarkan pengecekan bridging sistem BPJS Kesehatan VClaim di RSU Muhammadiyah Babat, status kepesertaan BPJS Bapak/Ibu saat ini terdeteksi NON-AKTIF (terkendala administrasi/premi).

Untuk dapat menerbitkan Surat Eligibilitas Peserta (SEP) penjaminan rumah sakit:
1. Silakan lakukan pengecekan dan pelunasan iuran via Aplikasi Mobile JKN / Care Center 165.
2. Atau lakukan pengaktifan kembali status kepesertaan melalui kantor BPJS Kesehatan setempat.

Terima kasih atas kerja sama dan perhatiannya.
Wassalamu'alaikum Wr. Wb.

Loket SEP & Casemix BPJS
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'bpjs_denda_pelayanan',
    title: 'Konfirmasi Denda Pelayanan BPJS (Rawat Inap 45 Hari)',
    description: 'Penjelasan denda pelayanan 5% rawat inap jika kartu aktif kembali < 45 hari.',
    category: 'BPJS & Jaminan',
    tag: 'Denda BPJS',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Keluarga Pasien {nama_pasien},

Menginformasikan ketentuan BPJS Kesehatan terkait Denda Pelayanan Rawat Inap (Perpres No. 64/2020):
Bagi peserta yang baru mengaktifkan kembali kartu BPJS dan menjalani rawat inap dalam kurun waktu 45 hari sejak aktif, dikenakan denda pelayanan sebesar 5% dari estimasi biaya paket INA-CBG's.

Petugas Admisi & BPJS Center RSUMB siap membantu memberikan simulasi dan rincian penghitungan denda resmi di loket informasi.

Terima kasih atas pengertian Bapak/Ibu.
Wassalamu'alaikum Wr. Wb.

BPJS Center & Kasir RSUMB`
  },
  {
    id: 'syarat_sep_bridging',
    title: 'Penjelasan Syarat & Validasi Pembuatan SEP BPJS',
    description: 'Panduan berkas finger print, KTP, dan surat kontrol untuk cetak SEP.',
    category: 'BPJS & Jaminan',
    tag: 'Cetak SEP',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Untuk kelancaran penerbitan SEP (Surat Eligibilitas Peserta) di {poliklinik} bersama {nama_dokter}, pastikan Bapak/Ibu menyiapkan:
1. Kartu BPJS Kesehatan / KIS / KTP Elektronik (NIK)
2. Surat Kontrol Dokter / Surat Rujukan Faskes 1 yang masih aktif
3. Melakukan rekam sidik jari (Biometrik / Finger Print) di mesin Anjungan BPJS

Jika mengalami kendala finger print (anak/lansia/jari sulit terbaca), silakan lapor ke petugas Loket 1 Admisi untuk aktivasi manual.
Wassalamu'alaikum Wr. Wb.

Front Office & Admisi RSUMB`
  },
  {
    id: 'jaminan_kll_jr',
    title: 'Konfirmasi Berkas Jaminan Jasa Raharja (KLL)',
    description: 'Instruksi pengurusan Laporan Polisi (LP) & penjaminan kasus kecelakaan lalu lintas.',
    category: 'BPJS & Jaminan',
    tag: 'KLL Jasa Raharja',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Keluarga Pasien {nama_pasien},

Terkait penjaminan pasien Kasus Kecelakaan Lalu Lintas (KLL) di RSU Muhammadiyah Babat, agar biaya perawatan dijamin oleh PT Jasa Raharja (dan BPJS sebagai penjamin kedua):

Mohon segera melengkapi berkas maksimal 2x24 jam:
1. Surat Laporan Polisi (LP) dari Unit Laka Lantas setempat
2. Fotokopi KTP Pasien & Kartu Keluarga (KK)
3. Fotokopi Kartu BPJS / KIS

Petugas Tim Kasus KLL RSUMB siap membantu koordinasi dengan pihak Jasa Raharja.
Wassalamu'alaikum Wr. Wb.

Tim Penanganan Pasien KLL & BPJS
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'berkas_bpjs_tk',
    title: 'Kelengkapan Berkas Penjaminan BPJS Ketenagakerjaan',
    description: 'Instruksi formulir kecelakaan kerja (KK3) dan surat keterangan perusahaan.',
    category: 'BPJS & Jaminan',
    tag: 'Kecelakaan Kerja',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Keluarga Pasien {nama_pasien},

Terkait administrasi penjaminan Kasus Kecelakaan Kerja (Trauma Center BPJS Ketenagakerjaan) di RSU Muhammadiyah Babat, mohon melengkapi persyaratan berikut:
1. Formulir Pelaporan Kecelakaan Kerja Tahap 1 (Form KK3) dari instansi/perusahaan
2. Surat Keterangan Kronologi Kejadian dari pimpinan perusahaan
3. Kartu Peserta BPJS Ketenagakerjaan & Fotokopi KTP/KK

Penyerahan berkas dapat dilakukan ke Loket Asuransi RSUMB di Gedung Admisi lantai 1.
Wassalamu'alaikum Wr. Wb.

Unit Asuransi & Jaminan RSUMB`
  },

  // ==========================================
  // KELOMPOK 3: ADMISI & RANAP (5 TEMPLATE)
  // ==========================================
  {
    id: 'booking_kamar_ranap',
    title: 'Konfirmasi Booking & Antrean Kamar Rawat Inap',
    description: 'Pemberitahuan kesiapan kamar rawat inap setelah selesai observasi IGD/Poli.',
    category: 'Admisi & Ranap',
    tag: 'Booking Kamar',
    isFavorite: true,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Keluarga Pasien {nama_pasien},

Menginformasikan bahwa kamar rawat inap pesanan Bapak/Ibu di RSU Muhammadiyah Babat saat ini telah SIAP DITEMPATI.

Mohon salah satu perwakilan keluarga segera menuju Loket Admisi Rawat Inap lantai 1 untuk:
• Tanda tangan lembar persetujuan rawat inap (General Consent)
• Memilih kelas perawatan dan fasilitas pendukung
• Penerimaan gelang identitas pasien

Semoga perawatan di RSUMB membawa kesembuhan yang optimal.
Wassalamu'alaikum Wr. Wb.

Admisi Rawat Inap (Admission Center)
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'ketersediaan_bed_upgrade',
    title: 'Informasi Ketersediaan Bed & Opsi Upgrade Kelas',
    description: 'Informasi opsi naik kelas perawatan atau kamar titipan sementara.',
    category: 'Admisi & Ranap',
    tag: 'Kamar & Bed',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Keluarga Pasien {nama_pasien},

Menginformasikan mengenai status ketersediaan tempat tidur (bed) di ruang rawat inap RSU Muhammadiyah Babat.

Apabila kelas hak perawatan BPJS saat ini dalam kondisi penuh, keluarga dapat:
1. Menggunakan kamar titipan sementara sesuai hak kelas
2. Mengajukan opsi Upgrade Kelas Perawatan (misal ke Kelas 1 / VIP) dengan ketentuan selisih biaya sesuai regulasi BPJS

Silakan berkonsultasi langsung dengan petugas Admisi Ranap kami.
Wassalamu'alaikum Wr. Wb.

Unit Admisi & Tata Usaha Ranap RSUMB`
  },
  {
    id: 'tata_tertib_ranap',
    title: 'Informasi Jam Besuk & Tata Tertib Pasien Rawat Inap',
    description: 'Edukasi jam kunjungan pasien, jumlah penunggu, dan kartu jaga.',
    category: 'Admisi & Ranap',
    tag: 'Tata Tertib Ranap',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Keluarga Pasien {nama_pasien},

Demi kenyamanan dan ketenangan proses pemulihan pasien di ruang rawat inap RSU Muhammadiyah Babat, kami mengimbau tata tertib berikut:
• Jam Besuk Siang: 11.00 - 13.00 WIB
• Jam Besuk Sore: 17.00 - 19.30 WIB
• Penunggu kamar maksimal 1-2 orang yang mengenakan Kartu Penunggu Pasien
• Anak di bawah usia 12 tahun tidak diperkenankan memasuki area perawatan isolasi/ICU

Terima kasih atas kepedulian dan kerja samanya.
Wassalamu'alaikum Wr. Wb.

Tim Keamanan & Pelayanan Rawat Inap
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'administrasi_discharge',
    title: 'Edukasi Berkas Administrasi Pulang (KRS / Discharge)',
    description: 'Panduan proses penyelesaian berkas pulang, obat farmasi, dan surat kontrol.',
    category: 'Admisi & Ranap',
    tag: 'Pasien Pulang',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Keluarga Pasien {nama_pasien},

Alhamdulillah, Dokter Penanggung Jawab Pelayanan ({nama_dokter}) telah menyatakan pasien diperbolehkan pulang (KRS) pada hari ini.

Langkah penyelesaian administrasi kepulangan:
1. Menunggu perawat bangsal menyerahkan lembar rincian pulang
2. Menyelesaikan administrasi di Kasir Rawat Inap (Lantai 1)
3. Mengambil obat pulang & edukasi cara minum di Apotek Rawat Inap
4. Menerima Surat Kontrol ulang untuk poliklinik

Semoga senantiasa diberikan nikmat kesehatan.
Wassalamu'alaikum Wr. Wb.

Tim Discharge Planning & Kasir RSUMB`
  },
  {
    id: 'verifikasi_asuransi_swasta',
    title: 'Konfirmasi Jaminan Asuransi Swasta / Surat Jaminan (GL)',
    description: 'Pemberitahuan status verifikasi Guarantee Letter asuransi rekanan.',
    category: 'Admisi & Ranap',
    tag: 'Asuransi Swasta',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan bahwa proses verifikasi Surat Jaminan Awal (Initial Guarantee Letter / GL) dari pihak Asuransi Rekanan untuk perawatan rawat inap Anda di RSU Muhammadiyah Babat telah DISETUJUI / TERVERIFIKASI.

Seluruh fasilitas kamar dan tindakan medis yang tertera dalam surat jaminan akan dicakup secara cashless sesuai ketentuan polis asuransi Anda.

Jika ada biaya kelebihan (excess claim), petugas kasir akan mengonfirmasikannya sebelum kepulangan.
Wassalamu'alaikum Wr. Wb.

Helpdesk Asuransi & Jaminan Perusahaan RSUMB`
  },

  // ==========================================
  // KELOMPOK 4: OPERASI & TINDAKAN MEDIS (5 TEMPLATE)
  // ==========================================
  {
    id: 'jadwal_operasi_puasa',
    title: 'Konfirmasi Jadwal Operasi Elektif & Instruksi Puasa',
    description: 'Instruksi jadwal operasi, jam mulai puasa pra-bedah, dan kebersihan diri.',
    category: 'Operasi & Tindakan',
    tag: 'Operasi & Puasa',
    isFavorite: true,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Mengonfirmasi rencana tindakan operasi terjadwal bersama {nama_dokter} di Kamar Operasi (IBS) RSU Muhammadiyah Babat.

Petunjuk Persiapan Pra-Operasi:
1. Wajib BERPUASA (tidak makan dan minum) mulai pukul 00.00 WIB malam ini.
2. Mandi bersih dan keramas sebelum berangkat ke rumah sakit.
3. Melepas perhiasan, cat kuku, gigi tiruan, dan lensa kontak.
4. Hadir di Ruang Penerimaan IBS / Admisi pada waktu yang ditentukan.

Mohon doanya semoga operasi berjalan lancar dan membawa kesembuhan yang sempurna.
Wassalamu'alaikum Wr. Wb.

Instalasi Bedah Sentral (IBS)
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'skrining_pra_operasi',
    title: 'Panduan Skrining Laboratorium & Radiologi Pra-Operasi',
    description: 'Instruksi cek darah lengkap, hemostasis, dan foto thorax sebelum operasi.',
    category: 'Operasi & Tindakan',
    tag: 'Skrining Operasi',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Sebelum pelaksanaan tindakan bedah bersama {nama_dokter}, pasien diwajibkan menjalani pemeriksaan skrining penunjang di RSU Muhammadiyah Babat:
• Laboratorium: Darah Lengkap, Masa Perdarahan/Pembekuan, Gula Darah, Golongan Darah
• Radiologi: Foto Rontgen Thorax
• Konsultasi Evaluasi Dokter Spesialis Anestesi

Pemeriksaan ini dapat dilakukan pada jam operasional Lab & Radiologi (buka 24 jam).
Wassalamu'alaikum Wr. Wb.

Instalasi Penunjang Diagnostik & IBS RSUMB`
  },
  {
    id: 'penundaan_operasi_dokter',
    title: 'Pemberitahuan Penyesuaian Waktu Tindakan Operasi',
    description: 'Pemberitahuan pergeseran jam operasi akibat kondisi darurat di IBS.',
    category: 'Operasi & Tindakan',
    tag: 'Jadwal Operasi',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Keluarga Pasien {nama_pasien},

Menginformasikan bahwa jadwal tindakan operasi bersama {nama_dokter} mengalami pergeseran estimasi jam pelaksanaan, dikarenakan adanya tindakan operasi darurat cito yang harus didahulukan oleh tim bedah di IBS.

Kondisi pasien saat ini tetap dalam pemantauan intensif oleh tim perawat dan dokter anestesi.

Kami memohon maaf atas penundaan ini dan memohon doa agar seluruh proses berjalan selamat dan lancar.
Wassalamu'alaikum Wr. Wb.

Instalasi Bedah Sentral (IBS) RSUMB`
  },
  {
    id: 'konfirmasi_khitan_massal',
    title: 'Konfirmasi Jadwal Khitan Ceria / Khitan Modern RSUMB',
    description: 'Konfirmasi pendaftaran peserta khitan massal/eksekutif metode ring/laser.',
    category: 'Operasi & Tindakan',
    tag: 'Layanan Khitan',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Orang Tua dari {nama_pasien},

Kami mengonfirmasi pendaftaran putra tercinta untuk mengikuti Pelayanan Khitan Modern / Khitan Ceria di RSU Muhammadiyah Babat bersama {nama_dokter}.

Panduan Kedatangan:
• Waktu: Pukul 07.30 WIB di Ruang Khitan Poliklinik Bedah
• Mengenakan celana longgar / sarung yang nyaman
• Sarapan pagi secukupnya sebelum berangkat ke rumah sakit

Semoga menjadi anak yang saleh, cerdas, dan membanggakan keluarga.
Wassalamu'alaikum Wr. Wb.

Tim Layanan Khitan & Poliklinik Bedah RSUMB`
  },
  {
    id: 'perawatan_luka_pasca_bedah',
    title: 'Panduan Perawatan Luka & Kontrol Pasca Operasi / Khitan',
    description: 'Instruksi menjaga luka tetap kering dan jadwal angkat jahitan.',
    category: 'Operasi & Tindakan',
    tag: 'Perawatan Pasca Bedah',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Panduan Perawatan Luka Pasca Tindakan Bedah / Khitan dari RSU Muhammadiyah Babat:
1. Jaga perban luka tetap bersih dan kering (hindari terkena air langsung saat mandi).
2. Minum obat pereda nyeri dan antibiotik sesuai anjuran farmasi hingga habis.
3. Konsumsi makanan tinggi protein (telur, ikan gabus, tahu/tempe) untuk mempercepat penyembuhan.
4. Jadwal kontrol & ganti balut dilakukan di {poliklinik} bersama {nama_dokter}.

Jika ada bengkak berlebih atau rembesan, segera periksakan ke IGD RSUMB.
Wassalamu'alaikum Wr. Wb.

Unit Bedah & Rawat Jalan RSUMB`
  },

  // ==========================================
  // KELOMPOK 5: INFORMASI & LAYANAN UMUM (5 TEMPLATE)
  // ==========================================
  {
    id: 'jadwal_poli_sore',
    title: 'Informasi Jadwal Poliklinik Sore & Hari Libur',
    description: 'Informasi layanan rawat jalan sore bagi pasien yang sibuk di pagi hari.',
    category: 'Informasi & Layanan',
    tag: 'Poli Sore',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Sahabat Sehat RSUMB,

RSU Muhammadiyah Babat kini melayani Poliklinik Sore untuk memberikan kemudahan bagi Bapak/Ibu yang memiliki kesibukan kerja di pagi hari.

Layanan Tersedia:
• Poliklinik Spesialis Penyakit Dalam
• Poliklinik Spesialis Anak
• Poliklinik Spesialis Kebidanan & Kandungan
• Poliklinik Gigi & Umum

Pendaftaran dibuka mulai pukul 15.00 - 18.00 WIB. Melayani pasien Umum, Asuransi, dan BPJS Kesehatan.
Wassalamu'alaikum Wr. Wb.

Humas & Pemasaran RSU Muhammadiyah Babat`
  },
  {
    id: 'pengambilan_resep_kronis',
    title: 'Layanan Pengambilan Obat Kronis Farmasi (PRB)',
    description: 'Pemberitahuan resep obat rutin 30 hari peserta Program Rujuk Balik telah siap.',
    category: 'Informasi & Layanan',
    tag: 'Farmasi PRB',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan bahwa paket obat rutin kronis (Program Rujuk Balik / PRB) Bapak/Ibu di Farmasi Rawat Jalan RSU Muhammadiyah Babat saat ini SUDAH SIAP DIAMBIL.

Pengambilan obat dapat dilakukan di Loket Farmasi Rawat Jalan (Lantai 1) dengan menunjukkan Buku Kontrol PRB & KTP/Kartu BPJS.

Waktu layanan: Senin - Sabtu pukul 08.00 - 20.00 WIB.
Wassalamu'alaikum Wr. Wb.

Instalasi Farmasi RSUMB`
  },
  {
    id: 'hasil_penunjang_selesai',
    title: 'Pemberitahuan Hasil Lab / Radiologi Selesai',
    description: 'Notifikasi hasil pemeriksaan laboratorium atau foto rontgen telah diverifikasi.',
    category: 'Informasi & Layanan',
    tag: 'Hasil Diagnostik',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Hasil pemeriksaan penunjang (Laboratorium / Radiologi / USG) Anda di RSU Muhammadiyah Babat telah selesai dianalisis dan divalidasi oleh Dokter Spesialis Penanggung Jawab.

Hasil pemeriksaan telah terintegrasi dalam rekam medis elektronik (SIMRS) dan siap dikonsultasikan kembali saat jadwal kontrol di {poliklinik} bersama {nama_dokter}.

Untuk cetak hasil fisik, dapat diambil di loket Laboratorium/Radiologi RSUMB.
Wassalamu'alaikum Wr. Wb.

Instalasi Penunjang Diagnostik RSUMB`
  },
  {
    id: 'ucapan_survei_kepuasan',
    title: 'Ucapan Cepat Sembuh & Survei Kepuasan Pelayanan',
    description: 'Pesan salam kesembuhan dan tautan kuesioner mutu pelayanan RSUMB.',
    category: 'Informasi & Layanan',
    tag: 'Survei Kepuasan',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Keluarga besar RSU Muhammadiyah Babat mendoakan semoga Bapak/Ibu senantiasa lekas pulih dan sehat wal'afiat.

Demi terus meningkatkan mutu dan kenyamanan pelayanan rumah sakit, mohon kesediaan Bapak/Ibu mengisi survei singkat kepuasan pasien melalui tautan berikut:
👉 https://survei.rsumbabat.com/kepuasan

Kritik dan saran Bapak/Ibu sangat berharga bagi peningkatan mutu layanan kami. Terima kasih.
Wassalamu'alaikum Wr. Wb.

Tim Mutu & Customer Care RSUMB`
  },
  {
    id: 'informasi_umum',
    title: 'Layanan Darurat IGD 24 Jam & Kontak Ambulans RSUMB',
    description: 'Informasi call center ambulans darurat dan layanan gawat darurat RSUMB.',
    category: 'Informasi & Layanan',
    tag: 'IGD & Ambulans',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Masyarakat Babat dan Sekitarnya,

RSU Muhammadiyah Babat senantiasa siap siaga melayani Anda dengan fasilitas:
🚑 Ambulans Jemputan Medis & Jenazah 24 Jam: (0322) 451125 / 0812-3456-7890
🏥 Instalasi Gawat Darurat (IGD) 24 Jam dengan Dokter Jaga & Fasilitas Bedah Darurat

Kapan pun keluarga atau kerabat membutuhkan pertolongan medis segera, jangan ragu untuk segera menghubungi kami.

Wassalamu'alaikum Wr. Wb.
Humas & Layanan Darurat RSU Muhammadiyah Babat`
  },
  {
    id: 'konfirmasi_kehadiran_janji',
    title: 'Konfirmasi Kehadiran Janji Temu Poliklinik',
    description: 'Konfirmasi kedatangan pasien rawat jalan sebelum antrean loket dipanggil.',
    category: 'Kontrol & Jadwal',
    tag: 'Konfirmasi Janji',
    isFavorite: true,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Mohon konfirmasi kesediaan kehadiran Bapak/Ibu untuk jadwal pemeriksaan di {poliklinik} bersama {nama_dokter} di RSU Muhammadiyah Babat pada {tanggal_hari_ini}.

Mohon balas pesan ini dengan format:
• Ketik: YA (Jika Hadir)
• Ketik: BATAL (Jika Berhalangan / Reschedule)

Kehadiran tepat waktu sangat membantu kelancaran antrean poliklinik. Terima kasih atas kerja samanya.
Wassalamu'alaikum Wr. Wb.

Admisi & Antrean Rawat Jalan
RSU Muhammadiyah Babat (RSUMB)`
  },
  {
    id: 'hasil_pemeriksaan_selesai',
    title: 'Pemberitahuan Hasil Laboratorium & Radiologi Selesai',
    description: 'Informasi bahwa hasil lab atau foto rontgen sudah selesai dan siap diambil/dikonsulkan.',
    category: 'Informasi & Layanan',
    tag: 'Hasil Lab & Rontgen',
    isFavorite: false,
    content: `Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu {nama_pasien},

Menginformasikan bahwa hasil pemeriksaan diagnostik (Laboratorium / Radiologi) Anda di RSU Muhammadiyah Babat telah SELESAI divalidasi oleh Dokter Spesialis.

Hasil cetak fisik dapat diambil di Loket Pengambilan Hasil Rawat Jalan atau langsung dikonsultasikan kembali ke dokter DPJP ({nama_dokter}) pada jadwal praktik poliklinik berikutnya.

Semoga Bapak/Ibu senantiasa diberikan kesembuhan dan kesehatan.
Wassalamu'alaikum Wr. Wb.

Instalasi Laboratorium & Radiologi
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
