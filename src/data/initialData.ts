import { masterSchedules } from './masterSchedulesData';
import { DoctorSchedule, DoctorLeaveAnnouncement, PatientQueueItem } from '../types';

export interface MasterDoctor {
  no: number;
  poli: string;
  dpjp: string;
}

export const MASTER_DOCTORS: MasterDoctor[] = [
  { no: 1, poli: 'Bedah', dpjp: 'dr. Rieski Widhanar, Sp. B.' },
  { no: 2, poli: 'Bedah', dpjp: 'dr. Nikita Gladys L., Sp. B., M. Ked. Klin' },
  { no: 3, poli: 'Urologi', dpjp: 'dr. Randa Halfian, Sp. U.' },
  { no: 4, poli: 'Penyakit Dalam', dpjp: 'dr. Ilham Basjar, Sp. PD.' },
  { no: 5, poli: 'Penyakit Dalam', dpjp: 'dr. Yhang Lidi Tama, Sp. PD.' },
  { no: 6, poli: 'Penyakit Dalam', dpjp: 'dr. Atika Amalia Fajarini, Sp. PD' },
  { no: 7, poli: 'Anak', dpjp: 'dr. Taufiqur Rahman, Sp. A.' },
  { no: 8, poli: 'Anak', dpjp: 'dr. Aulya Farra Rahmadany, Sp. A' },
  { no: 9, poli: 'THT-KL', dpjp: 'dr. Arif Surgana, Sp. THT-BKL' },
  { no: 10, poli: 'Mata', dpjp: 'dr. Amelia Safitri R, Sp. M.' },
  { no: 11, poli: 'Mata', dpjp: 'dr. Razzaqy, Sp. M., M. Ked. Klin' },
  { no: 12, poli: 'Saraf', dpjp: "dr. I'anatul Ulya, Sp. N., DFIDN" },
  { no: 13, poli: 'Obgyn', dpjp: 'dr. Dony R. Bimantara, Sp.OG. AIFO-K' },
  { no: 14, poli: 'Obgyn', dpjp: 'dr. Erliana, Sp.OG.' },
  { no: 15, poli: 'Obgyn', dpjp: 'dr. Dayinta Liris Kawuryan, Sp. OG' },
  { no: 16, poli: 'Orthopedi', dpjp: 'dr. Hary Wahyu A., Sp.OT.' },
  { no: 17, poli: 'Paru', dpjp: 'dr. Lilis Asfaroh, Sp. P, FISR' },
  { no: 18, poli: 'Bedah Saraf', dpjp: 'dr. Suharyanto, Sp. BS' },
  { no: 19, poli: 'Kulit Kelamin', dpjp: 'dr. Hamidah L., Sp. DVE., M. Ked. Klin.' },
  { no: 20, poli: 'Jantung dan Pembuluh Darah', dpjp: 'dr. Ilma Alfia Isaridha, Sp. JP' },
  { no: 21, poli: 'Rehabilitasi Medik', dpjp: 'dr. Yuli Indah Kurnia, Sp. KFR' }
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
        keterangan: 'LIBUR PRAKTIK - MASUK KEMBALI 10 NOVEMBER 2026',
        tglLibur: '8 November 2026',
        tglMasuk: '10 November 2026',
        tipe: 'LIBUR'
      },
      {
        keterangan: 'JADWAL MAJU TANGGAL 13 NOVEMBER 2026',
        tglLibur: '14 November 2026',
        tglMasuk: '13 November 2026',
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
        tglLibur: '11 s/d 14 November 2026',
        tglMasuk: '16 November 2026',
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
        keterangan: 'CUTI PRAKTIK',
        tglLibur: '18 s/d 20 November 2026',
        tglMasuk: '21 November 2026 (Jam 13.00 WIB)',
        tipe: 'CUTI'
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
        keterangan: 'Libur tanggal 22 November 2026, kembali praktik tanggal 25 November 2026',
        tglLibur: '22 November 2026',
        tglMasuk: '25 November 2026',
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
        keterangan: 'Libur tanggal 26 November 2026, kembali praktik tanggal 28 November 2026',
        tglLibur: '26 November 2026',
        tglMasuk: '28 November 2026',
        tipe: 'LIBUR'
      }
    ],
    active: true
  }
];

export const initialSchedules: DoctorSchedule[] = masterSchedules;

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
