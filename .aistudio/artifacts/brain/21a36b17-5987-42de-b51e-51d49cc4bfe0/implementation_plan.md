# Rencana Implementasi: Perbaikan Logika Ekstraksi / Parser SPRI & Output Template Klinik

## 1. Ekstraksi Kelas Kamar yang Akurat
- [x] Membuat fungsi `extractKelasKamarFromText`:
  - Mendeteksi kata kunci kelas secara ketat dan berprioritas (`VVIP`, `VIP`, `Kelas 3`, `Kelas 2`, `Kelas 1`).
  - Mengabaikan nomor bed atau nomor ruangan seperti `BED4` pada `"VIP-BED4 JANNATUL FIRDAUS VIP"` (sehingga kelas terbaca `VIP`).
  - Mengabaikan nomor ruangan/bed seperti `5A` pada `"Ma'wa 5A... Kelas 3"` (sehingga kelas terbaca `3`).
  - Menampilkan hasil kelas kamar secara akurat pada baris pertama output: `Pesan kamar kls : [Kelas]`.
  - Sinkronisasi otomatis state kelas kamar ke dropdown antarmuka pengguna pada saat parser dijalankan.

## 2. Validasi Kode ICD-10 & Diagnosa
- [x] Menambahkan pemetaan akurat kode ICD-10:
  - Diagnosa `AF` / `Atrial Fibrillation` / `Atrial Flutter` / `Fibrilasi Atrium` dipetakan secara akurat ke kode ICD-10 `I48.9`.
  - Diagnosa `ADHF` / `CHF` dipetakan ke `I50.9`.
  - Diagnosa `Dyspneu` / `Dyspnea` dipetakan ke `R06.0`.
  - Menerapkan fungsi `matchIcdForDiagnosis` untuk multi-diagnosis (misal `DYSPNEU S ADHF` menghasilkan `R06.0 / I50.9`).

## 3. Penerbitan Format Output Template Baku
- [x] Memastikan format baku yang dihasilkan pada baris WhatsApp dan pratinjau:
  ```text
  Pesan kamar kls : [Kelas Kamar]

  [Nama Pasien] ([Umur])
  - [Diagnosa Awal] ([Kode ICD-10])
  - DPJP : [Nama Dokter DPJP]
  - [Cara Bayar/Asuransi] [Kelas Kamar]
  ```
- [x] Menjaga agar baris DPJP mutlak mengambil nama dari teks berlabel `Dokter DPJP` dan tidak tertukar dengan `Dokter Yang Memeriksa` (dokter IGD/Klinik).
- [x] Menyediakan tombol preset pengujian langsung: `SPRI AF (I48.9) & VIP` dan `SPRI Ma'wa 5A... Kelas 3`.

## 4. Verifikasi
- [x] Pengujian otomatis dengan data uji spesifik.
- [x] `lint_applet` (`tsc --noEmit`) berhasil dengan 0 error.
- [x] `compile_applet` (`vite build`) berhasil dibangun dengan sukses.
