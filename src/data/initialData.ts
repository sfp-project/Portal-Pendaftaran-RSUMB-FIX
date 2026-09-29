import { DoctorSchedule, DoctorLeaveAnnouncement, PatientQueueItem } from '../types';

export interface MasterDoctor {
  no: number;
  poli: string;
  dpjp: string;
}

export const MASTER_DOCTORS: MasterDoctor[] = [
  { no: 1, poli: 'Saraf', dpjp: "dr. I'anatul Ulya, Sp.N" },
  { no: 2, poli: 'Dalam', dpjp: 'dr. Ilham Basjar, Sp. PD' },
  { no: 3, poli: 'Dalam', dpjp: 'dr. Yhang Lidi Tama, Sp.PD' },
  { no: 4, poli: 'Dalam', dpjp: 'dr. Atika Amalia, Sp. PD' },
  { no: 5, poli: 'Anak', dpjp: 'dr. Taufiqur Rahman, Sp. A' },
  { no: 6, poli: 'Bedah', dpjp: 'dr. Rieski Widhanar, Sp. B' },
  { no: 7, poli: 'Bedah', dpjp: 'dr. Nikita Gladys L., M. Ked.Klin, Sp. B' },
  { no: 8, poli: 'Obgyn', dpjp: 'dr. Erliana, Sp. OG' },
  { no: 9, poli: 'Obgyn', dpjp: 'dr. Dony R. Bimantara, Sp. OG, AIFO-K' },
  { no: 10, poli: 'Obgyn', dpjp: 'dr. Dayinta Liris K., Sp. OG' },
  { no: 11, poli: 'Rehab', dpjp: 'dr. Yuli Indah K., Sp. KFR' },
  { no: 12, poli: 'Bedah Saraf', dpjp: 'dr. Suharyanto, Sp. BS' },
  { no: 13, poli: 'Jantung', dpjp: 'dr. Ilma Alifa I., Sp. JP' },
  { no: 14, poli: 'Kulit', dpjp: 'dr. Hamidah Luthfidyaningrum, M. Ked.Klin, Sp. DVE' },
  { no: 15, poli: 'Mata', dpjp: 'dr. Amelia Safitri R., Sp. M' },
  { no: 16, poli: 'Mata', dpjp: 'dr. Razzaqy, M.Ked.Klin, Sp. M' },
  { no: 17, poli: 'Ortopedi', dpjp: 'dr. Hary Wahyu A, Sp. OT' },
  { no: 18, poli: 'Paru', dpjp: 'dr. Lilis Asfaroh, Sp. P' },
  { no: 19, poli: 'THT', dpjp: 'dr. Arif Surgana, Sp. THT-BKL' },
  { no: 20, poli: 'Urologi', dpjp: 'dr. Randa Halfian, Sp. U' }
];

export const parseIndonesianDateToTimestamp = (str: string): number => {
  if (!str) return 9999999999999;
  const isoMatch = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10)).getTime();
  }

  const INDO_MONTHS_MAP: Record<string, number> = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agu: 7, agustus: 7, ags: 7,
    sep: 8, september: 8, sept: 8,
    okt: 9, oktober: 9,
    nov: 10, november: 10,
    des: 11, desember: 11
  };

  const yearMatch = str.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  let month = 0;
  let foundMonth = false;
  const lower = str.toLowerCase();
  for (const [mName, mIdx] of Object.entries(INDO_MONTHS_MAP)) {
    if (lower.includes(mName)) {
      month = mIdx;
      foundMonth = true;
      break;
    }
  }

  const dayMatch = str.match(/\b(\d{1,2})\b/);
  const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;

  if (foundMonth) {
    return new Date(year, month, day).getTime();
  }

  return 9999999999999;
};

export const consolidateDoctorLeaves = (
  leaves: DoctorLeaveAnnouncement[]
): DoctorLeaveAnnouncement[] => {
  const map = new Map<string, DoctorLeaveAnnouncement>();

  leaves.forEach((item) => {
    const rawDpjp = item.dpjp || '';
    const key = rawDpjp.toLowerCase().trim();
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        jadwal: [...item.jadwal]
      });
    } else {
      const existing = map.get(key)!;
      // If the incoming item has a cleaner or more complete name/poli, keep it
      if (rawDpjp.length > existing.dpjp.length) {
        existing.dpjp = rawDpjp;
      }
      if (item.poli && !existing.poli) {
        existing.poli = item.poli;
      }
      // Merge jadwal items, avoiding identical duplicates
      item.jadwal.forEach((j) => {
        const isDuplicate = existing.jadwal.some(
          (ej) =>
            ej.tglLibur.trim().toLowerCase() === j.tglLibur.trim().toLowerCase() &&
            ej.tglMasuk.trim().toLowerCase() === j.tglMasuk.trim().toLowerCase()
        );
        if (!isDuplicate) {
          existing.jadwal.push(j);
        }
      });
    }
  });

  // Sort jadwal within each doctor by closest date (ascending)
  const doctorList = Array.from(map.values()).map((doc) => {
    const sortedJadwal = [...doc.jadwal].sort((a, b) => {
      const timeA = parseIndonesianDateToTimestamp(a.tglLibur || a.tglMasuk);
      const timeB = parseIndonesianDateToTimestamp(b.tglLibur || b.tglMasuk);
      return timeA - timeB;
    });

    return {
      ...doc,
      jadwal: sortedJadwal
    };
  });

  // Sort doctor cards by their earliest upcoming date
  doctorList.sort((a, b) => {
    const earliestA =
      a.jadwal.length > 0
        ? parseIndonesianDateToTimestamp(a.jadwal[0].tglLibur || a.jadwal[0].tglMasuk)
        : 9999999999999;
    const earliestB =
      b.jadwal.length > 0
        ? parseIndonesianDateToTimestamp(b.jadwal[0].tglLibur || b.jadwal[0].tglMasuk)
        : 9999999999999;
    return earliestA - earliestB;
  });

  return doctorList;
};

export const initialDoctorLeaves: DoctorLeaveAnnouncement[] = [
  {
    id: 'leave-1',
    dpjp: 'dr. Ilma Alifa I., Sp. JP',
    poli: 'Jantung',
    jadwal: [
      {
        keterangan: 'LIBUR PRAKTIK',
        tglLibur: '1 September 2026',
        tglMasuk: '3 September 2026',
        tipe: 'LIBUR'
      },
      {
        keterangan: 'TANGGAL 4 SEPTEMBER 2026 MAJU TANGGAL 3 SEPTEMBER 2026',
        tglLibur: '4 September 2026',
        tglMasuk: '3 September 2026',
        tipe: 'MAJU'
      },
      {
        keterangan: 'TANGGAL 11 SEPTEMBER 2026 MAJU TANGGAL 10 SEPTEMBER 2026',
        tglLibur: '11 September 2026',
        tglMasuk: '10 September 2026',
        tipe: 'MAJU'
      }
    ],
    active: true
  },
  {
    id: 'leave-2',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    poli: 'Dalam',
    jadwal: [
      {
        keterangan: 'LIBUR PRAKTIK',
        tglLibur: '1 September 2026',
        tglMasuk: '2 September 2026',
        tipe: 'LIBUR'
      }
    ],
    active: true
  },
  {
    id: 'leave-3',
    dpjp: 'dr. Randa Halfian, Sp. U',
    poli: 'Urologi',
    jadwal: [
      {
        keterangan: 'LIBUR PRAKTIK',
        tglLibur: '26 & 29 Agustus 2026',
        tglMasuk: '2 September 2026 (Jam 13.00 WIB)',
        tipe: 'LIBUR'
      }
    ],
    active: true
  },
  {
    id: 'leave-4',
    dpjp: 'dr. Yhang Lidi Tama, Sp.PD',
    poli: 'Dalam',
    jadwal: [
      {
        keterangan: 'Libur tanggal 13 September 2026, kembali praktik tanggal 20 September 2026',
        tglLibur: '13 September 2026',
        tglMasuk: '20 September 2026',
        tipe: 'LIBUR'
      }
    ],
    active: true
  },
  {
    id: 'leave-5',
    dpjp: 'dr. Lilis Asfaroh, Sp. P',
    poli: 'Paru',
    jadwal: [
      {
        keterangan: 'Libur tanggal 18 September 2026, kembali praktik tanggal 22 September 2026',
        tglLibur: '18 September 2026',
        tglMasuk: '22 September 2026',
        tipe: 'LIBUR'
      }
    ],
    active: true
  }
];

export const initialSchedules: DoctorSchedule[] = [
  // 1. Saraf - dr. I'anatul Ulya, Sp.N
  {
    id: 'sch-1',
    no: 1,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp.N",
    hari: 'Senin',
    jadwal: '07.30 - 12.00',
    jamHfis: '07.00-14.00',
    kuotaTerisi: 60,
    kuotaTotal: 70,
    rerataPasien: 60,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-2',
    no: 1,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp.N",
    hari: 'Selasa',
    jadwal: '07.30 - 12.00',
    jamHfis: '07.00-14.00',
    kuotaTerisi: 50,
    kuotaTotal: 70,
    rerataPasien: 50,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-3',
    no: 1,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp.N",
    hari: 'Rabu',
    jadwal: '13.30 - 17.00',
    jamHfis: '12.30-19.00',
    kuotaTerisi: 20,
    kuotaTotal: 70,
    rerataPasien: 20,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-4',
    no: 1,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp.N",
    hari: 'Kamis',
    jadwal: '07.30 - 12.00',
    jamHfis: '07.00-14.00',
    kuotaTerisi: 50,
    kuotaTotal: 70,
    rerataPasien: 50,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-5',
    no: 1,
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp.N",
    hari: "Jum'at",
    jadwal: '07.30 - 12.00',
    jamHfis: '07.00-14.00',
    kuotaTerisi: 60,
    kuotaTotal: 70,
    rerataPasien: 60,
    ruangan: 'Poli Saraf - Lt. 2',
    status: 'Tersedia'
  },

  // 2. Dalam - dr. Ilham Basjar, Sp. PD
  {
    id: 'sch-6',
    no: 2,
    poli: 'Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    hari: 'Senin',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.15-18.30',
    kuotaTerisi: 20,
    kuotaTotal: 42,
    rerataPasien: 20,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-7',
    no: 2,
    poli: 'Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    hari: 'Selasa',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.00-18.00',
    kuotaTerisi: 5,
    kuotaTotal: 40,
    rerataPasien: 5,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-8',
    no: 2,
    poli: 'Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    hari: 'Rabu',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.00-18.00',
    kuotaTerisi: 35,
    kuotaTotal: 40,
    rerataPasien: 35,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-9',
    no: 2,
    poli: 'Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    hari: 'Kamis',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.00-18.00',
    kuotaTerisi: 5,
    kuotaTotal: 40,
    rerataPasien: 5,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-10',
    no: 2,
    poli: 'Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    hari: "Jum'at",
    jadwal: '08.00 - 11.00/Selesai',
    jamHfis: '08.00-13.00',
    kuotaTerisi: 25,
    kuotaTotal: 50,
    rerataPasien: 25,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-11',
    no: 2,
    poli: 'Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    hari: 'Sabtu',
    jadwal: '13.00 - Selesai',
    jamHfis: '14.00-18.00',
    kuotaTerisi: 20,
    kuotaTotal: 40,
    rerataPasien: 20,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },

  // 3. Dalam - dr. Yhang Lidi Tama, Sp.PD
  {
    id: 'sch-12',
    no: 3,
    poli: 'Dalam',
    dpjp: 'dr. Yhang Lidi Tama, Sp.PD',
    hari: 'Ahad',
    jadwal: '07.00 - Selesai',
    jamHfis: '07.00-11.00',
    kuotaTerisi: 30,
    kuotaTotal: 40,
    rerataPasien: 30,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-13',
    no: 3,
    poli: 'Dalam',
    dpjp: 'dr. Yhang Lidi Tama, Sp.PD',
    hari: 'Sabtu',
    jadwal: '07.00 - Selesai',
    jamHfis: '07.00-11.00',
    kuotaTerisi: 0,
    kuotaTotal: 40,
    rerataPasien: null,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },

  // 4. Dalam - dr. Atika Amalia, Sp. PD
  {
    id: 'sch-14',
    no: 4,
    poli: 'Dalam',
    dpjp: 'dr. Atika Amalia, Sp. PD',
    hari: 'Senin',
    jadwal: '08.00 - Selesai',
    jamHfis: '08.00-10.30',
    kuotaTerisi: 5,
    kuotaTotal: 25,
    rerataPasien: 5,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-15',
    no: 4,
    poli: 'Dalam',
    dpjp: 'dr. Atika Amalia, Sp. PD',
    hari: 'Kamis',
    jadwal: '07.30 - Selesai',
    jamHfis: '07.30-09.30',
    kuotaTerisi: 5,
    kuotaTotal: 20,
    rerataPasien: 5,
    ruangan: 'Poli Penyakit Dalam - Lt. 1',
    status: 'Tersedia'
  },

  // 5. Anak - dr. Taufiqur Rahman, Sp. A
  {
    id: 'sch-16',
    no: 5,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A',
    hari: 'Senin',
    jadwal: '15.00 - Selesai',
    jamHfis: '14.30-18.00',
    kuotaTerisi: 20,
    kuotaTotal: 35,
    rerataPasien: 20,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-17',
    no: 5,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A',
    hari: 'Selasa',
    jadwal: '15.00 - Selesai',
    jamHfis: '14.30-18.00',
    kuotaTerisi: 0,
    kuotaTotal: 35,
    rerataPasien: null,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-18',
    no: 5,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A',
    hari: 'Rabu',
    jadwal: '15.00 - Selesai',
    jamHfis: '14.30-18.00',
    kuotaTerisi: 18,
    kuotaTotal: 35,
    rerataPasien: 18,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-19',
    no: 5,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A',
    hari: 'Kamis',
    jadwal: '15.00 - Selesai',
    jamHfis: '14.30-18.00',
    kuotaTerisi: 8,
    kuotaTotal: 35,
    rerataPasien: 8,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia'
  },
  {
    id: 'sch-20',
    no: 5,
    poli: 'Anak',
    dpjp: 'dr. Taufiqur Rahman, Sp. A',
    hari: 'Jumat',
    jadwal: '15.00 - Selesai',
    jamHfis: '14.30-18.00',
    kuotaTerisi: 25,
    kuotaTotal: 35,
    rerataPasien: 25,
    ruangan: 'Poli Anak - Lt. 1',
    status: 'Tersedia'
  },

  // 6. Bedah - dr. Rieski Widhanar, Sp. B
  {
    id: 'sch-21',
    no: 6,
    poli: 'Bedah',
    dpjp: 'dr. Rieski Widhanar, Sp. B',
    hari: 'Senin',
    jadwal: '16.00 - 17.00/Selesai',
    jamHfis: '16.30-20.00',
    kuotaTerisi: 23,
    kuotaTotal: 35,
    rerataPasien: 23,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-22',
    no: 6,
    poli: 'Bedah',
    dpjp: 'dr. Rieski Widhanar, Sp. B',
    hari: 'Rabu',
    jadwal: '16.00 - 17.00/Selesai',
    jamHfis: '16.30-19.00',
    kuotaTerisi: 10,
    kuotaTotal: 25,
    rerataPasien: 10,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-23',
    no: 6,
    poli: 'Bedah',
    dpjp: 'dr. Rieski Widhanar, Sp. B',
    hari: 'Jumat',
    jadwal: '16.00 - 17.00/Selesai',
    jamHfis: '16.30-20.00',
    kuotaTerisi: 15,
    kuotaTotal: 35,
    rerataPasien: 15,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia'
  },

  // 7. Bedah - dr. Nikita Gladys L., M. Ked.Klin, Sp. B
  {
    id: 'sch-24',
    no: 7,
    poli: 'Bedah',
    dpjp: 'dr. Nikita Gladys L., M. Ked.Klin, Sp. B',
    hari: 'Selasa',
    jadwal: '14.30 - 17.00/Selesai',
    jamHfis: '14.30-18.00',
    kuotaTerisi: 10,
    kuotaTotal: 35,
    rerataPasien: 10,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-25',
    no: 7,
    poli: 'Bedah',
    dpjp: 'dr. Nikita Gladys L., M. Ked.Klin, Sp. B',
    hari: 'Kamis',
    jadwal: '14.30 - 17.00/Selesai',
    jamHfis: '14.30-18.00',
    kuotaTerisi: 10,
    kuotaTotal: 35,
    rerataPasien: 10,
    ruangan: 'Poli Bedah - Lt. 2',
    status: 'Tersedia'
  },

  // 8. Obgyn - dr. Erliana, Sp. OG
  {
    id: 'sch-26',
    no: 8,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp. OG',
    hari: 'Senin',
    jadwal: '12.00 - 13.30 WIB',
    jamHfis: '12.00-13.30',
    kuotaTerisi: 5,
    kuotaTotal: 15,
    rerataPasien: 5,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-27',
    no: 8,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp. OG',
    hari: 'Selasa',
    jadwal: '11.00 - 13.30 WIB',
    jamHfis: '11.00-13.30',
    kuotaTerisi: 5,
    kuotaTotal: 25,
    rerataPasien: 5,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-28',
    no: 8,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp. OG',
    hari: 'Rabu',
    jadwal: '12.00 - 13.30 WIB',
    jamHfis: '12.00-13.30',
    kuotaTerisi: 5,
    kuotaTotal: 15,
    rerataPasien: 5,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-29',
    no: 8,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp. OG',
    hari: 'Kamis',
    jadwal: '12.00 - 13.30 WIB',
    jamHfis: '12.00-13.30',
    kuotaTerisi: 4,
    kuotaTotal: 15,
    rerataPasien: 4,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-30',
    no: 8,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp. OG',
    hari: 'Jumat',
    jadwal: '12.00 - 13.30 WIB',
    jamHfis: '12.00-13.30',
    kuotaTerisi: 4,
    kuotaTotal: 15,
    rerataPasien: 4,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-31',
    no: 8,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp. OG',
    hari: 'Sabtu',
    jadwal: '11.00 - 13.30 WIB',
    jamHfis: '11.00-13.30',
    kuotaTerisi: 20,
    kuotaTotal: 25,
    rerataPasien: 20,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-32',
    no: 8,
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp. OG',
    hari: 'Ahad',
    jadwal: '13.30 - 15.00 WIB',
    jamHfis: '13.30-15.00',
    kuotaTerisi: 15,
    kuotaTotal: 15,
    rerataPasien: 20,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Penuh'
  },

  // 9. Obgyn - dr. Dony R. Bimantara, Sp. OG, AIFO-K
  {
    id: 'sch-33',
    no: 9,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp. OG, AIFO-K',
    hari: 'Senin',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.00-16.00',
    kuotaTerisi: 10,
    kuotaTotal: 20,
    rerataPasien: 10,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-34',
    no: 9,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp. OG, AIFO-K',
    hari: 'Selasa',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.00-16.00',
    kuotaTerisi: 10,
    kuotaTotal: 20,
    rerataPasien: 10,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-35',
    no: 9,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp. OG, AIFO-K',
    hari: 'Rabu',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.00-16.00',
    kuotaTerisi: 10,
    kuotaTotal: 20,
    rerataPasien: 10,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-36',
    no: 9,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp. OG, AIFO-K',
    hari: 'Kamis',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.00-16.00',
    kuotaTerisi: 15,
    kuotaTotal: 20,
    rerataPasien: 15,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-37',
    no: 9,
    poli: 'Obgyn',
    dpjp: 'dr. Dony R. Bimantara, Sp. OG, AIFO-K',
    hari: 'Jumat',
    jadwal: '14.00 - 16.00/Selesai',
    jamHfis: '14.00-16.00',
    kuotaTerisi: 15,
    kuotaTotal: 20,
    rerataPasien: 15,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },

  // 10. Obgyn - dr. Dayinta Liris K., Sp. OG
  {
    id: 'sch-38',
    no: 10,
    poli: 'Obgyn',
    dpjp: 'dr. Dayinta Liris K., Sp. OG',
    hari: 'Rabu',
    jadwal: '17.30 - 19.00/Selesai',
    jamHfis: '17.45-20.00',
    kuotaTerisi: 5,
    kuotaTotal: 22,
    rerataPasien: 5,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-39',
    no: 10,
    poli: 'Obgyn',
    dpjp: 'dr. Dayinta Liris K., Sp. OG',
    hari: 'Sabtu',
    jadwal: '08.00 - 10.00',
    jamHfis: '08.00-10.00',
    kuotaTerisi: 8,
    kuotaTotal: 30,
    rerataPasien: 8,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },
  {
    id: 'sch-40',
    no: 10,
    poli: 'Obgyn',
    dpjp: 'dr. Dayinta Liris K., Sp. OG',
    hari: 'Ahad',
    jadwal: '08.00 - 10.00',
    jamHfis: '08.00-10.00',
    kuotaTerisi: 8,
    kuotaTotal: 30,
    rerataPasien: 8,
    ruangan: 'Poli Kebidanan & Kandungan (Obgyn)',
    status: 'Tersedia'
  },

  // 11. Rehab - dr. Yuli Indah K., Sp. KFR
  {
    id: 'sch-41',
    no: 11,
    poli: 'Rehab',
    dpjp: 'dr. Yuli Indah K., Sp. KFR',
    hari: 'Senin',
    jadwal: '-',
    jamHfis: '18.05-22.30',
    kuotaTerisi: 17,
    kuotaTotal: 17,
    rerataPasien: 20,
    ruangan: 'Instalasi Rehabilitasi Medik',
    status: 'Penuh'
  },
  {
    id: 'sch-42',
    no: 11,
    poli: 'Rehab',
    dpjp: 'dr. Yuli Indah K., Sp. KFR',
    hari: 'Selasa',
    jadwal: '15.00 - Selesai',
    jamHfis: '16.00-20.30',
    kuotaTerisi: 0,
    kuotaTotal: 27,
    rerataPasien: null,
    ruangan: 'Instalasi Rehabilitasi Medik',
    status: 'Tersedia'
  },
  {
    id: 'sch-43',
    no: 11,
    poli: 'Rehab',
    dpjp: 'dr. Yuli Indah K., Sp. KFR',
    hari: 'Jumat',
    jadwal: '14.00 - 16.00',
    jamHfis: '14.30-20.00',
    kuotaTerisi: 20,
    kuotaTotal: 33,
    rerataPasien: 20,
    ruangan: 'Instalasi Rehabilitasi Medik',
    status: 'Tersedia'
  },

  // 12. Bedah Saraf - dr. Suharyanto, Sp. BS
  {
    id: 'sch-44',
    no: 12,
    poli: 'Bedah Saraf',
    dpjp: 'dr. Suharyanto, Sp. BS',
    hari: 'Rabu',
    jadwal: '-',
    jamHfis: '16.30-21.00',
    kuotaTerisi: 0,
    kuotaTotal: 27,
    rerataPasien: 0,
    ruangan: 'Poli Bedah Saraf - Lt. 2',
    status: 'Tersedia'
  },

  // 13. Jantung - dr. Ilma Alifa I., Sp. JP
  {
    id: 'sch-45',
    no: 13,
    poli: 'Jantung',
    dpjp: 'dr. Ilma Alifa I., Sp. JP',
    hari: 'Senin',
    jadwal: '14.00 - 16.00',
    jamHfis: '14.00-20.00',
    kuotaTerisi: 60,
    kuotaTotal: 60,
    rerataPasien: 60,
    ruangan: 'Poli Jantung & Pembuluh Darah',
    status: 'Penuh'
  },
  {
    id: 'sch-46',
    no: 13,
    poli: 'Jantung',
    dpjp: 'dr. Ilma Alifa I., Sp. JP',
    hari: 'Selasa',
    jadwal: '15.00 - 17.00',
    jamHfis: '14.30-20.00',
    kuotaTerisi: 20,
    kuotaTotal: 60,
    rerataPasien: 20,
    ruangan: 'Poli Jantung & Pembuluh Darah',
    status: 'Tersedia'
  },
  {
    id: 'sch-47',
    no: 13,
    poli: 'Jantung',
    dpjp: 'dr. Ilma Alifa I., Sp. JP',
    hari: 'Kamis',
    jadwal: '14.00 - 16.00',
    jamHfis: '14.00-20.00',
    kuotaTerisi: 10,
    kuotaTotal: 60,
    rerataPasien: 10,
    ruangan: 'Poli Jantung & Pembuluh Darah',
    status: 'Tersedia'
  },
  {
    id: 'sch-48',
    no: 13,
    poli: 'Jantung',
    dpjp: 'dr. Ilma Alifa I., Sp. JP',
    hari: 'Jumat',
    jadwal: '15.00 - 17.00',
    jamHfis: '14.00-20.00',
    kuotaTerisi: 60,
    kuotaTotal: 60,
    rerataPasien: 60,
    ruangan: 'Poli Jantung & Pembuluh Darah',
    status: 'Penuh'
  },

  // 14. Kulit - dr. Hamidah Luthfidyaningrum, M. Ked.Klin, Sp. DVE
  {
    id: 'sch-49',
    no: 14,
    poli: 'Kulit',
    dpjp: 'dr. Hamidah Luthfidyaningrum, M. Ked.Klin, Sp. DVE',
    hari: 'Selasa',
    jadwal: '11.00 - 13.00/Selesai',
    jamHfis: '14.30-16.30',
    kuotaTerisi: 5,
    kuotaTotal: 20,
    rerataPasien: 5,
    ruangan: 'Poli Kulit & Kelamin (DVE)',
    status: 'Tersedia'
  },
  {
    id: 'sch-50',
    no: 14,
    poli: 'Kulit',
    dpjp: 'dr. Hamidah Luthfidyaningrum, M. Ked.Klin, Sp. DVE',
    hari: 'Kamis',
    jadwal: '11.00 - 13.00/Selesai',
    jamHfis: '14.30-16.30',
    kuotaTerisi: 5,
    kuotaTotal: 20,
    rerataPasien: 5,
    ruangan: 'Poli Kulit & Kelamin (DVE)',
    status: 'Tersedia'
  },

  // 15. Mata - dr. Amelia Safitri R., Sp. M
  {
    id: 'sch-51',
    no: 15,
    poli: 'Mata',
    dpjp: 'dr. Amelia Safitri R., Sp. M',
    hari: 'Kamis',
    jadwal: '07.30 - 10.00',
    jamHfis: '07.30-13.00',
    kuotaTerisi: 30,
    kuotaTotal: 33,
    rerataPasien: 30,
    ruangan: 'Poli Mata - Lt. 2',
    status: 'Tersedia'
  },

  // 16. Mata - dr. Razzaqy, M.Ked.Klin, Sp. M
  {
    id: 'sch-52',
    no: 16,
    poli: 'Mata',
    dpjp: 'dr. Razzaqy, M.Ked.Klin, Sp. M',
    hari: 'Selasa',
    jadwal: '08.00 - 09.30',
    jamHfis: '08.00-10.40',
    kuotaTerisi: 16,
    kuotaTotal: 16,
    rerataPasien: 20,
    ruangan: 'Poli Mata - Lt. 2',
    status: 'Penuh'
  },

  // 17. Ortopedi - dr. Hary Wahyu A, Sp. OT
  {
    id: 'sch-53',
    no: 17,
    poli: 'Ortopedi',
    dpjp: 'dr. Hary Wahyu A, Sp. OT',
    hari: 'Senin',
    jadwal: '10.00 - 12.00',
    jamHfis: '09.00-13.30',
    kuotaTerisi: 30,
    kuotaTotal: 45,
    rerataPasien: 30,
    ruangan: 'Poli Ortopedi & Traumatologi',
    status: 'Tersedia'
  },
  {
    id: 'sch-54',
    no: 17,
    poli: 'Ortopedi',
    dpjp: 'dr. Hary Wahyu A, Sp. OT',
    hari: 'Rabu',
    jadwal: '10.00 - 12.00',
    jamHfis: '09.00-13.00',
    kuotaTerisi: 20,
    kuotaTotal: 45,
    rerataPasien: 20,
    ruangan: 'Poli Ortopedi & Traumatologi',
    status: 'Tersedia'
  },
  {
    id: 'sch-55',
    no: 17,
    poli: 'Ortopedi',
    dpjp: 'dr. Hary Wahyu A, Sp. OT',
    hari: 'Jumat',
    jadwal: '10.00 - 12.00',
    jamHfis: '09.00-13.30',
    kuotaTerisi: 25,
    kuotaTotal: 45,
    rerataPasien: 25,
    ruangan: 'Poli Ortopedi & Traumatologi',
    status: 'Tersedia'
  },

  // 18. Paru - dr. Lilis Asfaroh, Sp. P
  {
    id: 'sch-56',
    no: 18,
    poli: 'Paru',
    dpjp: 'dr. Lilis Asfaroh, Sp. P',
    hari: 'Selasa',
    jadwal: '19.00 - Selesai',
    jamHfis: '19.00-22.00',
    kuotaTerisi: 20,
    kuotaTotal: 20,
    rerataPasien: 25,
    ruangan: 'Poli Paru & Respirasi - Lt. 2',
    status: 'Penuh'
  },
  {
    id: 'sch-57',
    no: 18,
    poli: 'Paru',
    dpjp: 'dr. Lilis Asfaroh, Sp. P',
    hari: 'Rabu',
    jadwal: '19.00 - Selesai',
    jamHfis: '19.00-22.00',
    kuotaTerisi: 20,
    kuotaTotal: 20,
    rerataPasien: 20,
    ruangan: 'Poli Paru & Respirasi - Lt. 2',
    status: 'Penuh'
  },
  {
    id: 'sch-58',
    no: 18,
    poli: 'Paru',
    dpjp: 'dr. Lilis Asfaroh, Sp. P',
    hari: 'Jumat',
    jadwal: '19.00 - Selesai',
    jamHfis: '19.00-22.00',
    kuotaTerisi: 20,
    kuotaTotal: 20,
    rerataPasien: 25,
    ruangan: 'Poli Paru & Respirasi - Lt. 2',
    status: 'Penuh'
  },

  // 19. THT - dr. Arif Surgana, Sp. THT-BKL
  {
    id: 'sch-59',
    no: 19,
    poli: 'THT',
    dpjp: 'dr. Arif Surgana, Sp. THT-BKL',
    hari: 'Senin',
    jadwal: '16.00 - Selesai',
    jamHfis: '16.00-19.00',
    kuotaTerisi: 20,
    kuotaTotal: 30,
    rerataPasien: 20,
    ruangan: 'Poli THT-KL - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-60',
    no: 19,
    poli: 'THT',
    dpjp: 'dr. Arif Surgana, Sp. THT-BKL',
    hari: 'Jumat',
    jadwal: '16.00 - Selesai',
    jamHfis: '16.00-19.00',
    kuotaTerisi: 20,
    kuotaTotal: 30,
    rerataPasien: 20,
    ruangan: 'Poli THT-KL - Lt. 2',
    status: 'Tersedia'
  },

  // 20. Urologi - dr. Randa Halfian, Sp. U
  {
    id: 'sch-61',
    no: 20,
    poli: 'Urologi',
    dpjp: 'dr. Randa Halfian, Sp. U',
    hari: 'Rabu',
    jadwal: '13.00 - Selesai',
    jamHfis: '14.15-18.30',
    kuotaTerisi: 25,
    kuotaTotal: 42,
    rerataPasien: 25,
    ruangan: 'Poli Urologi - Lt. 2',
    status: 'Tersedia'
  },
  {
    id: 'sch-62',
    no: 20,
    poli: 'Urologi',
    dpjp: 'dr. Randa Halfian, Sp. U',
    hari: 'Sabtu',
    jadwal: '08.00 - Selesai',
    jamHfis: '09.00-11.30',
    kuotaTerisi: 10,
    kuotaTotal: 35,
    rerataPasien: 10,
    ruangan: 'Poli Urologi - Lt. 2',
    status: 'Tersedia'
  }
];

export const initialQueueList: PatientQueueItem[] = [
  {
    id: 'q-1',
    nomorAntrean: 'POLI-SR-001',
    namaPasien: 'Bambang Sudibyo',
    noBpjs: '0001839201948',
    poli: 'Saraf',
    dpjp: "dr. I'anatul Ulya, Sp.N",
    jamDaftar: '07:15 WIB',
    status: 'Menunggu',
    jenisPembayaran: 'BPJS Kesehatan'
  },
  {
    id: 'q-2',
    nomorAntrean: 'POLI-PD-002',
    namaPasien: 'Siti Rahmawati',
    noBpjs: '0002948192841',
    poli: 'Dalam',
    dpjp: 'dr. Ilham Basjar, Sp. PD',
    jamDaftar: '07:30 WIB',
    status: 'Diperiksa',
    jenisPembayaran: 'BPJS Kesehatan'
  },
  {
    id: 'q-3',
    nomorAntrean: 'POLI-JT-003',
    namaPasien: 'Hendra Gunawan',
    noBpjs: '0003847291039',
    poli: 'Jantung',
    dpjp: 'dr. Ilma Alifa I., Sp. JP',
    jamDaftar: '07:45 WIB',
    status: 'Menunggu',
    jenisPembayaran: 'BPJS Kesehatan'
  },
  {
    id: 'q-4',
    nomorAntrean: 'POLI-OB-004',
    namaPasien: 'Dewi Lestari',
    noBpjs: '0004738291048',
    poli: 'Obgyn',
    dpjp: 'dr. Erliana, Sp. OG',
    jamDaftar: '08:00 WIB',
    status: 'Selesai',
    jenisPembayaran: 'BPJS Kesehatan'
  }
];
