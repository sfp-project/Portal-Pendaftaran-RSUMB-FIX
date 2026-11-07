import { DoctorSchedule } from '../types';

export const masterSchedules: DoctorSchedule[] = [
  // 1-3. Dokter Spesialis Bedah - dr. Rieski Widhanar, Sp. B.
  {
    id: 'sch-bedah-1',
    no: 1,
    poli: 'Bedah',
    dpjp: 'dr. Rieski Widhanar, Sp. B.',
    hari: 'Senin',
    jadwal: '16.00 WIB - selesai',
    jamHfis: '16:30-20:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-bedah-2',
    no: 2,
    poli: 'Bedah',
    dpjp: 'dr. Rieski Widhanar, Sp. B.',
    hari: 'Rabu',
    jadwal: '16.00 WIB - selesai',
    jamHfis: '16:30-19:00',
    kuotaTerisi: 0,
    kuotaTotal: 25,
    kuotaBpjs: 25,
    rerataPasien: 20,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-bedah-3',
    no: 3,
    poli: 'Bedah',
    dpjp: 'dr. Rieski Widhanar, Sp. B.',
    hari: 'Jumat',
    jadwal: '16.00 WIB - selesai',
    jamHfis: '16:30-20:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 4-5. Dokter Spesialis Bedah - dr. Nikita Gladys L., Sp. B., M. Ked. Klin
  {
    id: 'sch-bedah-4',
    no: 4,
    poli: 'Bedah',
    dpjp: 'dr. Nikita Gladys L., Sp. B., M. Ked. Klin',
    hari: 'Selasa',
    jadwal: '14.30 WIB - selesai',
    jamHfis: '14:30-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-bedah-5',
    no: 5,
    poli: 'Bedah',
    dpjp: 'dr. Nikita Gladys L., Sp. B., M. Ked. Klin',
    hari: 'Kamis',
    jadwal: '14.30 WIB - selesai',
    jamHfis: '14:30-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 6-7. Dokter Spesialis Urologi - dr. Randa Halfian, Sp. U.
  {
    id: 'sch-uro-1',
    no: 6,
    poli: 'Urologi',
    dpjp: 'dr. Randa Halfian, Sp. U.',
    hari: 'Rabu',
    jadwal: '13.00 WIB - selesai',
    jamHfis: '14:15-18:30',
    kuotaTerisi: 0,
    kuotaTotal: 42,
    kuotaBpjs: 42,
    rerataPasien: 34,
    ruangan: 'Poli Urologi - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-uro-2',
    no: 7,
    poli: 'Urologi',
    dpjp: 'dr. Randa Halfian, Sp. U.',
    hari: 'Sabtu',
    jadwal: '08.00 WIB - selesai',
    jamHfis: '08:00-11:30',
    kuotaTerisi: 0,
    kuotaTotal: 36,
    kuotaBpjs: 36,
    rerataPasien: 28,
    ruangan: 'Poli Urologi - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 8-12. Dokter Spesialis Penyakit Dalam - dr. Ilham Basjar, Sp. PD.
  {
    id: 'sch-pd-1',
    no: 8,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD.',
    hari: 'Senin',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:15-18:30',
    kuotaTerisi: 0,
    kuotaTotal: 42,
    kuotaBpjs: 42,
    rerataPasien: 34,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-pd-2',
    no: 9,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD.',
    hari: 'Selasa',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 40,
    kuotaBpjs: 40,
    rerataPasien: 0,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Nonaktif',
    catatan: 'JADWAL NONAKTIF'
  },
  {
    id: 'sch-pd-3',
    no: 10,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD.',
    hari: 'Rabu',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 40,
    kuotaBpjs: 40,
    rerataPasien: 32,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-pd-4',
    no: 11,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD.',
    hari: 'Jumat',
    jadwal: '08.00 WIB - selesai',
    jamHfis: '08:00-13:00',
    kuotaTerisi: 0,
    kuotaTotal: 50,
    kuotaBpjs: 50,
    rerataPasien: 40,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-pd-5',
    no: 12,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD.',
    hari: 'Sabtu',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 40,
    kuotaBpjs: 40,
    rerataPasien: 32,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },

  // 13-14. Dokter Spesialis Penyakit Dalam - dr. Yhang Lidi Tama, Sp. PD.
  {
    id: 'sch-pd-6',
    no: 13,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Yhang Lidi Tama, Sp. PD.',
    hari: 'Ahad',
    jadwal: '07.00 WIB - selesai',
    jamHfis: '07:00-11:00',
    kuotaTerisi: 0,
    kuotaTotal: 40,
    kuotaBpjs: 40,
    rerataPasien: 32,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-pd-7',
    no: 14,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Yhang Lidi Tama, Sp. PD.',
    hari: 'Selasa',
    jadwal: '07.00 WIB - selesai',
    jamHfis: '07:30-12:00',
    kuotaTerisi: 0,
    kuotaTotal: 45,
    kuotaBpjs: 45,
    rerataPasien: 36,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia',
    catatan: 'HFIS BKN JADWAL PRAKTIK'
  },

  // 15-16. Dokter Spesialis Penyakit Dalam - dr. Atika Amalia Fajarini, Sp. PD
  {
    id: 'sch-pd-8',
    no: 15,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Atika Amalia Fajarini, Sp. PD',
    hari: 'Senin',
    jadwal: '08.00 WIB - selesai',
    jamHfis: '08:00-10:30',
    kuotaTerisi: 0,
    kuotaTotal: 25,
    kuotaBpjs: 25,
    rerataPasien: 20,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-pd-9',
    no: 16,
    poli: 'Penyakit Dalam',
    dpjp: 'dr. Atika Amalia Fajarini, Sp. PD',
    hari: 'Kamis',
    jadwal: '07.30 - 09.30 WIB',
    jamHfis: '07:30-09:30',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },

  // 17-21. Dokter Spesialis Anak - dr. Taufiqur Rahman, Sp. A.
  {
    id: 'sch-anak-1',
    no: 17,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A.',
    hari: 'Senin',
    jadwal: '15.00 WIB - selesai',
    jamHfis: '14:30-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-anak-2',
    no: 18,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A.',
    hari: 'Selasa',
    jadwal: '15.00 WIB - selesai',
    jamHfis: '14:30-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: 'HFIS BKN JADWAL PRAKTIK'
  },
  {
    id: 'sch-anak-3',
    no: 19,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A.',
    hari: 'Rabu',
    jadwal: '15.00 WIB - selesai',
    jamHfis: '14:30-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-anak-4',
    no: 20,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A.',
    hari: 'Kamis',
    jadwal: '15.00 WIB - selesai',
    jamHfis: '14:30-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: 'HFIS BKN JADWAL PRAKTIK'
  },
  {
    id: 'sch-anak-5',
    no: 21,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A.',
    hari: 'Jumat',
    jadwal: '15.00 WIB - selesai',
    jamHfis: '14:30-18:00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    kuotaBpjs: 35,
    rerataPasien: 28,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },

  // 22-25. Dokter Spesialis Anak - dr. Aulya Farra Rahmadany, Sp. A
  {
    id: 'sch-anak-6',
    no: 22,
    poli: 'Anak',
    dpjp: 'dr. Aulya Farra Rahmadany, Sp. A',
    hari: 'Selasa',
    jadwal: '08.00 - 11.00 WIB',
    jamHfis: '08:00-11:00',
    kuotaTerisi: 0,
    kuotaTotal: 30,
    kuotaBpjs: 30,
    rerataPasien: 24,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-anak-7',
    no: 23,
    poli: 'Anak',
    dpjp: 'dr. Aulya Farra Rahmadany, Sp. A',
    hari: 'Kamis',
    jadwal: '08.00 - 11.00 WIB',
    jamHfis: '08:00-11:00',
    kuotaTerisi: 0,
    kuotaTotal: 30,
    kuotaBpjs: 30,
    rerataPasien: 24,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-anak-8',
    no: 24,
    poli: 'Anak',
    dpjp: 'dr. Aulya Farra Rahmadany, Sp. A',
    hari: 'Sabtu',
    jadwal: '08.00 - 11.00 WIB',
    jamHfis: '08:00-11:00',
    kuotaTerisi: 0,
    kuotaTotal: 30,
    kuotaBpjs: 30,
    rerataPasien: 24,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-anak-9',
    no: 25,
    poli: 'Anak',
    dpjp: 'dr. Aulya Farra Rahmadany, Sp. A',
    hari: 'Ahad',
    jadwal: '08.00 - 09.00 WIB',
    jamHfis: '07:30-08:30',
    kuotaTerisi: 0,
    kuotaTotal: 10,
    kuotaBpjs: 10,
    rerataPasien: 8,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },

  // 26-27. Dokter Spesialis THT - dr. Arif Surgana, Sp. THT-BKL
  {
    id: 'sch-tht-1',
    no: 26,
    poli: 'THT-KL',
    dpjp: 'dr. Arif Surgana, Sp. THT-BKL',
    hari: 'Senin',
    jadwal: '16.00 WIB - selesai',
    jamHfis: '16:00-19:00',
    kuotaTerisi: 0,
    kuotaTotal: 30,
    kuotaBpjs: 30,
    rerataPasien: 24,
    ruangan: 'Poli THT - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-tht-2',
    no: 27,
    poli: 'THT-KL',
    dpjp: 'dr. Arif Surgana, Sp. THT-BKL',
    hari: 'Jumat',
    jadwal: '16.00 WIB - selesai',
    jamHfis: '16:00-19:00',
    kuotaTerisi: 0,
    kuotaTotal: 30,
    kuotaBpjs: 30,
    rerataPasien: 24,
    ruangan: 'Poli THT - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 28. Dokter Spesialis Mata - dr. Amelia Safitri R, Sp. M.
  {
    id: 'sch-mata-1',
    no: 28,
    poli: 'Mata',
    dpjp: 'dr. Amelia Safitri R, Sp. M.',
    hari: 'Kamis',
    jadwal: '07.30 - 10.00 WIB',
    jamHfis: '07:30-13:00',
    kuotaTerisi: 0,
    kuotaTotal: 33,
    kuotaBpjs: 33,
    rerataPasien: 26,
    ruangan: 'Poli Mata - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 29. Dokter Spesialis Mata - dr. Razzaqy, Sp. M., M. Ked. Klin
  {
    id: 'sch-mata-2',
    no: 29,
    poli: 'Mata',
    dpjp: 'dr. Razzaqy, Sp. M., M. Ked. Klin',
    hari: 'Selasa',
    jadwal: '08.00 - 10.00 WIB',
    jamHfis: '08:00-10:40',
    kuotaTerisi: 0,
    kuotaTotal: 16,
    kuotaBpjs: 16,
    rerataPasien: 13,
    ruangan: 'Poli Mata - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 30-34. Dokter Spesialis Saraf - dr. I'anatul Ulya, Sp. N., DFIDN
  {
    id: 'sch-saraf-1',
    no: 30,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp. N., DFIDN",
    hari: 'Senin',
    jadwal: '09.00 WIB - 12.00 WIB',
    jamHfis: '07:00-14:00',
    kuotaTerisi: 0,
    kuotaTotal: 70,
    kuotaBpjs: 70,
    rerataPasien: 56,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-saraf-2',
    no: 31,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp. N., DFIDN",
    hari: 'Selasa',
    jadwal: '09.00 WIB - 12.00 WIB',
    jamHfis: '07:00-14:00',
    kuotaTerisi: 0,
    kuotaTotal: 70,
    kuotaBpjs: 70,
    rerataPasien: 56,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-saraf-3',
    no: 32,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp. N., DFIDN",
    hari: 'Rabu',
    jadwal: '15.00 WIB - 17.00 WIB',
    jamHfis: '12:30-19:30',
    kuotaTerisi: 0,
    kuotaTotal: 70,
    kuotaBpjs: 70,
    rerataPasien: 56,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-saraf-4',
    no: 33,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp. N., DFIDN",
    hari: 'Kamis',
    jadwal: '09.00 WIB - 12.00 WIB',
    jamHfis: '07:00-14:00',
    kuotaTerisi: 0,
    kuotaTotal: 70,
    kuotaBpjs: 70,
    rerataPasien: 56,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-saraf-5',
    no: 34,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp. N., DFIDN",
    hari: 'Jumat',
    jadwal: '09.00 WIB - 12.00 WIB',
    jamHfis: '07:00-14:00',
    kuotaTerisi: 0,
    kuotaTotal: 70,
    kuotaBpjs: 70,
    rerataPasien: 56,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 35-39. Dokter Spesialis OBGYN - dr. Dony R. Bimantara, Sp.OG. AIFO-K
  {
    id: 'sch-obgyn-1',
    no: 35,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp.OG. AIFO-K',
    hari: 'Senin',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-16:00',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-2',
    no: 36,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp.OG. AIFO-K',
    hari: 'Selasa',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-16:00',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-3',
    no: 37,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp.OG. AIFO-K',
    hari: 'Rabu',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-16:00',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-4',
    no: 38,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp.OG. AIFO-K',
    hari: 'Kamis',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-16:00',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-5',
    no: 39,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp.OG. AIFO-K',
    hari: 'Jumat',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-16:00',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },

  // 40-46. Dokter Spesialis OBGYN - dr. Erliana, Sp.OG.
  {
    id: 'sch-obgyn-6',
    no: 40,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp.OG.',
    hari: 'Senin',
    jadwal: '12.00 - 13.30 WIB',
    jamHfis: '12:00-13:30',
    kuotaTerisi: 0,
    kuotaTotal: 15,
    kuotaBpjs: 15,
    rerataPasien: 12,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-7',
    no: 41,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp.OG.',
    hari: 'Selasa',
    jadwal: '11.00 - 13.30 WIB',
    jamHfis: '11:00-13:30',
    kuotaTerisi: 0,
    kuotaTotal: 25,
    kuotaBpjs: 25,
    rerataPasien: 20,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-8',
    no: 42,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp.OG.',
    hari: 'Rabu',
    jadwal: '12.00 - 13.30 WIB',
    jamHfis: '12:00-13:30',
    kuotaTerisi: 0,
    kuotaTotal: 15,
    kuotaBpjs: 15,
    rerataPasien: 12,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-9',
    no: 43,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp.OG.',
    hari: 'Kamis',
    jadwal: '12.00 - 13.30 WIB',
    jamHfis: '12:00-13:30',
    kuotaTerisi: 0,
    kuotaTotal: 15,
    kuotaBpjs: 15,
    rerataPasien: 12,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-10',
    no: 44,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp.OG.',
    hari: 'Jumat',
    jadwal: '12.00 - 13.30 WIB',
    jamHfis: '12:00-13:30',
    kuotaTerisi: 0,
    kuotaTotal: 15,
    kuotaBpjs: 15,
    rerataPasien: 12,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-11',
    no: 45,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp.OG.',
    hari: 'Sabtu',
    jadwal: '11.00 - 13.30 WIB',
    jamHfis: '11:00-13:30',
    kuotaTerisi: 0,
    kuotaTotal: 25,
    kuotaBpjs: 25,
    rerataPasien: 20,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-12',
    no: 46,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp.OG.',
    hari: 'Ahad',
    jadwal: '13.30 - 15.00 WIB',
    jamHfis: '13:30-15:00',
    kuotaTerisi: 0,
    kuotaTotal: 15,
    kuotaBpjs: 15,
    rerataPasien: 12,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },

  // 47-49. Dokter Spesialis OBGYN - dr. Dayinta Liris Kawuryan, Sp. OG
  {
    id: 'sch-obgyn-13',
    no: 47,
    poli: 'Obgyn',
    dpjp: 'dr. Dayinta Liris Kawuryan, Sp. OG',
    hari: 'Rabu',
    jadwal: '17.30 - 19.00 WIB',
    jamHfis: '17:45-20:00',
    kuotaTerisi: 0,
    kuotaTotal: 22,
    kuotaBpjs: 22,
    rerataPasien: 18,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-14',
    no: 48,
    poli: 'Obgyn',
    dpjp: 'dr. Dayinta Liris Kawuryan, Sp. OG',
    hari: 'Sabtu',
    jadwal: '08.00 - 10.00 WIB',
    jamHfis: '08:00-11:00',
    kuotaTerisi: 0,
    kuotaTotal: 30,
    kuotaBpjs: 30,
    rerataPasien: 24,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-obgyn-15',
    no: 49,
    poli: 'Obgyn',
    dpjp: 'dr. Dayinta Liris Kawuryan, Sp. OG',
    hari: 'Ahad',
    jadwal: '08.00 - 10.00 WIB',
    jamHfis: '08:00-11:00',
    kuotaTerisi: 0,
    kuotaTotal: 30,
    kuotaBpjs: 30,
    rerataPasien: 24,
    ruangan: 'Poli Kandungan & Obgyn - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },

  // 50-52. Dokter Spesialis Ortopedi - dr. Hary Wahyu A., Sp.OT.
  {
    id: 'sch-ortho-1',
    no: 50,
    poli: 'Orthopedi',
    dpjp: 'dr. Hary Wahyu A., Sp.OT.',
    hari: 'Senin',
    jadwal: '13.00 WIB - selesai',
    jamHfis: '13:00-17:30',
    kuotaTerisi: 0,
    kuotaTotal: 45,
    kuotaBpjs: 45,
    rerataPasien: 36,
    ruangan: 'Poli Orthopedi - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-ortho-2',
    no: 51,
    poli: 'Orthopedi',
    dpjp: 'dr. Hary Wahyu A., Sp.OT.',
    hari: 'Rabu',
    jadwal: '10.00 WIB - selesai',
    jamHfis: '09:00-13:30',
    kuotaTerisi: 0,
    kuotaTotal: 45,
    kuotaBpjs: 45,
    rerataPasien: 36,
    ruangan: 'Poli Orthopedi - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-ortho-3',
    no: 52,
    poli: 'Orthopedi',
    dpjp: 'dr. Hary Wahyu A., Sp.OT.',
    hari: 'Jumat',
    jadwal: '10.00 WIB - selesai',
    jamHfis: '09:00-13:30',
    kuotaTerisi: 0,
    kuotaTotal: 45,
    kuotaBpjs: 45,
    rerataPasien: 36,
    ruangan: 'Poli Orthopedi - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 53-55. Dokter Spesialis Paru - dr. Lilis Asfaroh, Sp. P, FISR
  {
    id: 'sch-paru-1',
    no: 53,
    poli: 'Paru',
    dpjp: 'dr. Lilis Asfaroh, Sp. P, FISR',
    hari: 'Selasa',
    jadwal: '19.00 WIB - selesai',
    jamHfis: '19:00-22:00',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Paru - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-paru-2',
    no: 54,
    poli: 'Paru',
    dpjp: 'dr. Lilis Asfaroh, Sp. P, FISR',
    hari: 'Rabu',
    jadwal: '19.00 WIB - selesai',
    jamHfis: '19:00-22:00',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Paru - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-paru-3',
    no: 55,
    poli: 'Paru',
    dpjp: 'dr. Lilis Asfaroh, Sp. P, FISR',
    hari: 'Jumat',
    jadwal: '19.00 WIB - selesai',
    jamHfis: '19:00-22:00',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Paru - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 56. Dokter Spesialis Bedah Saraf - dr. Suharyanto, Sp. BS
  {
    id: 'sch-bs-1',
    no: 56,
    poli: 'Bedah Saraf',
    dpjp: 'dr. Suharyanto, Sp. BS',
    hari: 'Rabu',
    jadwal: '14.00 - 15.00 WIB * (Sesuai dengan Perjanjian)',
    jamHfis: '16:30-21:00',
    kuotaTerisi: 0,
    kuotaTotal: 45,
    kuotaBpjs: 45,
    rerataPasien: 36,
    ruangan: 'Poli Bedah Saraf - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 57-58. Dokter Spesialis Kulit & kelamin - dr. Hamidah L., Sp. DVE., M. Ked. Klin.
  {
    id: 'sch-kulit-1',
    no: 57,
    poli: 'Kulit Kelamin',
    dpjp: 'dr. Hamidah L., Sp. DVE., M. Ked. Klin.',
    hari: 'Selasa',
    jadwal: '11.00 WIB - selesai',
    jamHfis: '14:30-16:30',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Kulit & Kelamin - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-kulit-2',
    no: 58,
    poli: 'Kulit Kelamin',
    dpjp: 'dr. Hamidah L., Sp. DVE., M. Ked. Klin.',
    hari: 'Kamis',
    jadwal: '11.00 WIB - selesai',
    jamHfis: '14:30-16:31',
    kuotaTerisi: 0,
    kuotaTotal: 20,
    kuotaBpjs: 20,
    rerataPasien: 16,
    ruangan: 'Poli Kulit & Kelamin - Lt. 2',
    status: 'Tersedia',
    catatan: ''
  },

  // 59-62. Dokter Spesialis Jantung - dr. Ilma Alfia Isaridha, Sp. JP
  {
    id: 'sch-jantung-1',
    no: 59,
    poli: 'Jantung dan Pembuluh Darah',
    dpjp: 'dr. Ilma Alfia Isaridha, Sp. JP',
    hari: 'Senin',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:00-20:00',
    kuotaTerisi: 0,
    kuotaTotal: 60,
    kuotaBpjs: 60,
    rerataPasien: 48,
    ruangan: 'Poli Jantung - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-jantung-2',
    no: 60,
    poli: 'Jantung dan Pembuluh Darah',
    dpjp: 'dr. Ilma Alfia Isaridha, Sp. JP',
    hari: 'Selasa',
    jadwal: '15.00 WIB - selesai',
    jamHfis: '14:00-20:00',
    kuotaTerisi: 0,
    kuotaTotal: 60,
    kuotaBpjs: 60,
    rerataPasien: 48,
    ruangan: 'Poli Jantung - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-jantung-3',
    no: 61,
    poli: 'Jantung dan Pembuluh Darah',
    dpjp: 'dr. Ilma Alfia Isaridha, Sp. JP',
    hari: 'Kamis',
    jadwal: '15.00 WIB - selesai',
    jamHfis: '14:00-20:00',
    kuotaTerisi: 0,
    kuotaTotal: 60,
    kuotaBpjs: 60,
    rerataPasien: 48,
    ruangan: 'Poli Jantung - Lt. 1',
    status: 'Tersedia',
    catatan: 'HFIS BKN JADWAL PRAKTIK'
  },
  {
    id: 'sch-jantung-4',
    no: 62,
    poli: 'Jantung dan Pembuluh Darah',
    dpjp: 'dr. Ilma Alfia Isaridha, Sp. JP',
    hari: 'Jumat',
    jadwal: '15.00 - 17.00 WIB',
    jamHfis: '14:00-20:00',
    kuotaTerisi: 0,
    kuotaTotal: 60,
    kuotaBpjs: 60,
    rerataPasien: 48,
    ruangan: 'Poli Jantung - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },

  // 63-64. Dokter Spesialis Rehabilitasi Medik - dr. Yuli Indah Kurnia, Sp. KFR
  {
    id: 'sch-rehab-1',
    no: 63,
    poli: 'Rehabilitasi Medik',
    dpjp: 'dr. Yuli Indah Kurnia, Sp. KFR',
    hari: 'Selasa',
    jadwal: '15.00 WIB - selesai',
    jamHfis: '16:00-20:30',
    kuotaTerisi: 0,
    kuotaTotal: 27,
    kuotaBpjs: 27,
    rerataPasien: 22,
    ruangan: 'Poli Rehab Medik - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  },
  {
    id: 'sch-rehab-2',
    no: 64,
    poli: 'Rehabilitasi Medik',
    dpjp: 'dr. Yuli Indah Kurnia, Sp. KFR',
    hari: 'Jumat',
    jadwal: '14.00 - 16.00 WIB',
    jamHfis: '14:30-20:00',
    kuotaTerisi: 0,
    kuotaTotal: 33,
    kuotaBpjs: 33,
    rerataPasien: 26,
    ruangan: 'Poli Rehab Medik - Lt. 1',
    status: 'Tersedia',
    catatan: ''
  }
];

export function inferRoomLocation(poli: string): string {
  const p = (poli || '').toLowerCase();
  if (p.includes('ortho') || p.includes('orto')) return 'Poli Orthopedi - Lt. 2';
  if (p.includes('obgyn') || p.includes('kandungan')) return 'Poli Kandungan & Obgyn - Lt. 1';
  if (p.includes('uro')) return 'Poli Urologi - Lt. 2';
  if (p.includes('dalam') || p.includes('internis')) return 'Poli Penyakit Dalam - Lt. 1';
  if (p.includes('saraf') && !p.includes('bedah')) return 'Poli Saraf - Lt. 2';
  if (p.includes('anak')) return 'Poli Anak - Lt. 1';
  if (p.includes('bedah saraf')) return 'Poli Bedah Saraf - Lt. 2';
  if (p.includes('bedah')) return 'Poli Bedah - Lt. 2';
  if (p.includes('paru')) return 'Poli Paru - Lt. 2';
  if (p.includes('jantung')) return 'Poli Jantung - Lt. 1';
  if (p.includes('tht')) return 'Poli THT - Lt. 2';
  if (p.includes('rehab')) return 'Poli Rehab Medik - Lt. 1';
  if (p.includes('mata')) return 'Poli Mata - Lt. 2';
  if (p.includes('kulit')) return 'Poli Kulit & Kelamin - Lt. 2';
  return 'R. Praktik Rawat Jalan';
}

export function normalizePoliCanonical(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const lower = trimmed
    .toLowerCase()
    .replace(/^dokter\s+spesialis\s+/i, '')
    .replace(/^spesialis\s+/i, '')
    .replace(/^poli\s+/i, '')
    .trim();

  if (/orthopedi|ortopedi|ortho|tulang/i.test(lower)) return 'Orthopedi';
  if (/obgyn|kandungan|kebidanan/i.test(lower)) return 'Obgyn';
  if (/urologi|uro/i.test(lower)) return 'Urologi';
  if (/penyakit dalam|interna|dalam/i.test(lower)) return 'Penyakit Dalam';
  if (/bedah saraf|neuro surgery/i.test(lower)) return 'Bedah Saraf';
  if (/saraf|neurologi|neuro/i.test(lower)) return 'Saraf';
  if (/anak|pediatri|pediatric/i.test(lower)) return 'Anak';
  if (/bedah umum|bedah/i.test(lower)) return 'Bedah';
  if (/paru|pulmonologi/i.test(lower)) return 'Paru';
  if (/jantung|kardio/i.test(lower)) return 'Jantung dan Pembuluh Darah';
  if (/tht|tht-kl|tht-bkl|telinga/i.test(lower)) return 'THT-KL';
  if (/rehabilitasi|rehab|fisioterapi|kfr/i.test(lower)) return 'Rehabilitasi Medik';
  if (/mata|oftalmologi/i.test(lower)) return 'Mata';
  if (/kulit|kelamin|dermatologi|spkk|dve/i.test(lower)) return 'Kulit Kelamin';
  if (/gigi|mulut/i.test(lower)) return 'Poli Gigi';
  if (/umum/i.test(lower)) return 'Poli Umum';

  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function inferPoliFromDoctor(doctorName: string): string {
  if (!doctorName) return '';
  const dLower = doctorName.toLowerCase();
  if (/hary wahyu/i.test(dLower)) return 'Orthopedi';
  if (/dony|dayinta|erliana/i.test(dLower)) return 'Obgyn';
  if (/randa/i.test(dLower)) return 'Urologi';
  if (/yhang lidi|atika amalia|ilham basjar/i.test(dLower)) return 'Penyakit Dalam';
  if (/i'anatul|ianatul/i.test(dLower)) return 'Saraf';
  if (/aulya farra|taufiqur/i.test(dLower)) return 'Anak';
  if (/suharyanto|suhariyanto/i.test(dLower)) return 'Bedah Saraf';
  if (/rieski|nikita/i.test(dLower)) return 'Bedah';
  if (/lilis asfaroh/i.test(dLower)) return 'Paru';
  if (/ilma alifa|ilma alfia/i.test(dLower)) return 'Jantung dan Pembuluh Darah';
  if (/arif surgana/i.test(dLower)) return 'THT-KL';
  if (/yuli indah/i.test(dLower)) return 'Rehabilitasi Medik';
  if (/razzaqy|amelia safitri/i.test(dLower)) return 'Mata';
  if (/hamidah/i.test(dLower)) return 'Kulit Kelamin';
  return '';
}

export function normalizeDoctorCanonicalName(rawName: string): string {
  if (!rawName) return '';
  const clean = rawName.trim().replace(/\s+/g, ' ');
  const lower = clean.toLowerCase();

  if (lower.includes('rieski')) return 'dr. Rieski Widhanar, Sp. B.';
  if (lower.includes('nikita')) return 'dr. Nikita Gladys L., Sp. B., M. Ked. Klin';
  if (lower.includes('randa')) return 'dr. Randa Halfian, Sp. U.';
  if (lower.includes('ilham basjar') || lower.includes('ilham basyar')) return 'dr. Ilham Basjar, Sp. PD.';
  if (lower.includes('yhang lidi') || lower.includes('yhang')) return 'dr. Yhang Lidi Tama, Sp. PD.';
  if (lower.includes('atika amalia') || lower.includes('atika')) return 'dr. Atika Amalia Fajarini, Sp. PD';
  if (lower.includes('taufiqur') || lower.includes('taufikur')) return 'dr. Taufiqur Rahman, Sp. A.';
  if (lower.includes('aulya farra') || lower.includes('aulia farra')) return 'dr. Aulya Farra Rahmadany, Sp. A';
  if (lower.includes('arif surgana')) return 'dr. Arif Surgana, Sp. THT-BKL';
  if (lower.includes('amelia safitri')) return 'dr. Amelia Safitri R, Sp. M.';
  if (lower.includes('razzaqy') || lower.includes('razaqy')) return 'dr. Razzaqy, Sp. M., M. Ked. Klin';
  if (lower.includes('ianatul') || lower.includes("i'anatul")) return "dr. I'anatul Ulya, Sp. N., DFIDN";
  if (lower.includes('dony') || lower.includes('doni r')) return 'dr. Dony R. Bimantara, Sp.OG. AIFO-K';
  if (lower.includes('erliana')) return 'dr. Erliana, Sp.OG.';
  if (lower.includes('dayinta')) return 'dr. Dayinta Liris Kawuryan, Sp. OG';
  if (lower.includes('hary wahyu') || lower.includes('hari wahyu')) return 'dr. Hary Wahyu A., Sp.OT.';
  if (lower.includes('lilis asfaroh') || lower.includes('lilis asf')) return 'dr. Lilis Asfaroh, Sp. P, FISR';
  if (lower.includes('suharyanto') || lower.includes('suhariyanto')) return 'dr. Suharyanto, Sp. BS';
  if (lower.includes('hamidah')) return 'dr. Hamidah L., Sp. DVE., M. Ked. Klin.';
  if (lower.includes('ilma alfia') || lower.includes('ilma alifa')) return 'dr. Ilma Alfia Isaridha, Sp. JP';
  if (lower.includes('yuli indah')) return 'dr. Yuli Indah Kurnia, Sp. KFR';

  return clean;
}

/**
 * Memastikan daftar jadwal dokter bersih, bebas duplikasi ganda,
 * memiliki nama poliklinik yang valid dan lengkap (tanpa blank/null),
 * menormalisasi ejaan gelar/nama dokter, serta penomoran urut 1..N yang rapi.
 */
export function sanitizeAndDeduplicateSchedules(rawList: DoctorSchedule[]): DoctorSchedule[] {
  if (!Array.isArray(rawList)) return [];

  const seenKeys = new Set<string>();
  const result: DoctorSchedule[] = [];

  for (const item of rawList) {
    if (!item) continue;
    // Abaikan jika item ditandai terhapus (soft delete)
    if ((item as any).is_deleted || (item as any).isDeleted) continue;

    const dpjpRaw = (item.dpjp || '').trim();
    if (!dpjpRaw) continue;

    // Filter jika terbaca baris header tabel excel
    const dpjpLower = dpjpRaw.toLowerCase();
    if (
      dpjpLower === 'nama dokter / nakes' ||
      dpjpLower === 'nama dokter' ||
      dpjpLower.includes('spesialisasi / peran') ||
      dpjpLower === 'dokter'
    ) {
      continue;
    }

    // Normalisasi nama dokter sesuai nama kanonikal master DPJP
    const canonicalDokter = normalizeDoctorCanonicalName(dpjpRaw);

    // Normalisasi dan fill-down nama poliklinik
    let poli = normalizePoliCanonical(item.poli || '');
    if (!poli || poli === '-' || poli.toLowerCase() === 'poliklinik') {
      poli = inferPoliFromDoctor(canonicalDokter) || 'Rawat Jalan';
    }

    // Normalisasi nama hari
    const hariRaw = (item.hari || '').trim();
    let hari = hariRaw;
    const hLower = hariRaw.toLowerCase();
    if (hLower.includes('senin')) hari = 'Senin';
    else if (hLower.includes('selasa')) hari = 'Selasa';
    else if (hLower.includes('rabu')) hari = 'Rabu';
    else if (hLower.includes('kamis')) hari = 'Kamis';
    else if (hLower.includes('jum') || hLower.includes("jum'at")) hari = 'Jumat';
    else if (hLower.includes('sabtu')) hari = 'Sabtu';
    else if (hLower.includes('ahad') || hLower.includes('minggu')) hari = 'Ahad';

    // Kunci unik anti-duplikasi:
    // Dokter yang sama + Hari yang sama + Waktu praktik/HFIS
    const normDokter = canonicalDokter.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normHari = (hari === 'Ahad' || hLower.includes('minggu') || hLower.includes('ahad'))
      ? 'ahad'
      : hari.toLowerCase().replace(/[^a-z]/g, '');
    const timeStr = (item.jamHfis || item.jadwal || '').toLowerCase().replace(/[^0-9]/g, '');
    const dedupKey = `${normDokter}_${normHari}_${timeStr}`;

    if (seenKeys.has(dedupKey)) {
      continue; // Lewati baris duplikat
    }
    seenKeys.add(dedupKey);

    const kuotaTot =
      Number(item.kuotaTotal) > 0
        ? Number(item.kuotaTotal)
        : Number(item.kuotaBpjs) > 0
        ? Number(item.kuotaBpjs)
        : 35;
    const kuotaBpjs = Number(item.kuotaBpjs) > 0 ? Number(item.kuotaBpjs) : kuotaTot;
    const kuotaTer = Math.max(0, Number(item.kuotaTerisi) || 0);

    const catatanClean = (item.catatan || '').trim();

    result.push({
      ...item,
      id: item.id || `sch-${normDokter.slice(0, 8)}-${normHari}-${result.length + 1}`,
      no: result.length + 1,
      poli,
      dpjp: canonicalDokter,
      hari,
      jadwal:
        item.jadwal ||
        (item.jamHfis ? item.jamHfis.replace(/:/g, '.') + ' WIB' : '08.00 WIB - selesai'),
      jamHfis: item.jamHfis || '08:00-12:00',
      kuotaTotal: kuotaTot,
      kuotaBpjs: kuotaBpjs,
      kuotaTerisi: kuotaTer,
      ruangan: item.ruangan || inferRoomLocation(poli),
      status:
        item.status ||
        (catatanClean.toUpperCase().includes('NONAKTIF')
          ? 'Penuh'
          : kuotaTer >= kuotaTot
          ? 'Penuh'
          : 'Tersedia'),
      catatan: catatanClean
    });
  }

  return result;
}

