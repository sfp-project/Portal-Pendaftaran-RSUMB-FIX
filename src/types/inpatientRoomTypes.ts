export type RoomCategoryFilter = 'Semuanya' | 'VVIP/VIP' | 'Kelas 1-3' | 'Intensif/Isolasi';

export type RoomClassLevel =
  | 'VVIP'
  | 'VIP'
  | 'Kelas I'
  | 'Kelas II'
  | 'Kelas III'
  | 'Isolasi'
  | 'ICU'
  | 'NICU'
  | string;

export interface InpatientRoom {
  id: string;
  name: string;
  pavilion: string;
  classLevel: RoomClassLevel;
  category: 'VVIP/VIP' | 'Kelas 1-3' | 'Intensif/Isolasi';
  roomRatePerDay: number;
  visiteGeneralDoctor: number;
  visiteSpecialistDoctor: number;
  patientRoomFacilities: string[];
  familyRoomFacilities?: string[];
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  imageUrl?: string;
  note?: string;
  updatedAt: string;
}
