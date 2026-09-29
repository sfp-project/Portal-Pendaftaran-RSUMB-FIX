import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bed,
  Building2,
  DollarSign,
  Stethoscope,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Plus,
  Loader2
} from 'lucide-react';
import { InpatientRoom, RoomClassLevel } from '../../types/inpatientRoomTypes';
import { compressImage } from '../../utils/imageCompressor';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit: InpatientRoom | null;
  onSave: (room: InpatientRoom) => void;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  roomToEdit,
  onSave
}) => {
  const [name, setName] = useState('');
  const [pavilion, setPavilion] = useState('');
  const [classLevel, setClassLevel] = useState<RoomClassLevel>('VIP');
  const [category, setCategory] = useState<'VVIP/VIP' | 'Kelas 1-3' | 'Intensif/Isolasi'>('VVIP/VIP');
  const [roomRatePerDay, setRoomRatePerDay] = useState<number>(720000);
  const [visiteGeneralDoctor, setVisiteGeneralDoctor] = useState<number>(55000);
  const [visiteSpecialistDoctor, setVisiteSpecialistDoctor] = useState<number>(90000);
  const [patientFacilitiesText, setPatientFacilitiesText] = useState('');
  const [familyFacilitiesText, setFamilyFacilitiesText] = useState('');
  const [totalBeds, setTotalBeds] = useState<number>(4);
  const [occupiedBeds, setOccupiedBeds] = useState<number>(2);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (roomToEdit) {
      setName(roomToEdit.name);
      setPavilion(roomToEdit.pavilion);
      setClassLevel(roomToEdit.classLevel);
      setCategory(roomToEdit.category);
      setRoomRatePerDay(roomToEdit.roomRatePerDay);
      setVisiteGeneralDoctor(roomToEdit.visiteGeneralDoctor);
      setVisiteSpecialistDoctor(roomToEdit.visiteSpecialistDoctor);
      setPatientFacilitiesText(roomToEdit.patientRoomFacilities.join(', '));
      setFamilyFacilitiesText(roomToEdit.familyRoomFacilities?.join(', ') || '');
      setTotalBeds(roomToEdit.totalBeds);
      setOccupiedBeds(roomToEdit.occupiedBeds);
      setImageUrl(roomToEdit.imageUrl || '');
      setNote(roomToEdit.note || '');
    } else {
      setName('');
      setPavilion('Paviliun Jannatul Firdaus');
      setClassLevel('VIP');
      setCategory('VVIP/VIP');
      setRoomRatePerDay(720000);
      setVisiteGeneralDoctor(55000);
      setVisiteSpecialistDoctor(90000);
      setPatientFacilitiesText('Bed Pasien (1 orang), AC Ruangan, TV Kabel, Kamar Mandi (air hangat)');
      setFamilyFacilitiesText('');
      setTotalBeds(4);
      setOccupiedBeds(1);
      setImageUrl('');
      setNote('');
    }
    setErrorMsg('');
    setIsCompressing(false);
  }, [roomToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih berkas gambar valid (.png, .jpg, .jpeg, .webp)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Ukuran foto terlalu besar (maksimal 20MB)');
      return;
    }

    setIsCompressing(true);
    setErrorMsg('');

    try {
      // Automatically resize and compress image to avoid storage quota issues (~40-60KB)
      const compressed = await compressImage(file, 900, 675, 0.76);
      setImageUrl(compressed);
    } catch (err) {
      console.warn('Gagal kompres gambar, fallback ke pembacaan langsung:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl((event.target?.result as string) || '');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama kamar / ruangan wajib diisi');
      return;
    }
    if (!pavilion.trim()) {
      setErrorMsg('Nama paviliun / gedung wajib diisi');
      return;
    }
    if (roomRatePerDay <= 0) {
      setErrorMsg('Tarif kamar harus lebih dari Rp 0');
      return;
    }
    if (totalBeds <= 0) {
      setErrorMsg('Total kapasitas bed minimal 1');
      return;
    }
    if (occupiedBeds > totalBeds) {
      setErrorMsg('Jumlah bed terisi tidak boleh melebihi total bed');
      return;
    }

    const patientFacilities = patientFacilitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const familyFacilities = familyFacilitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const calculatedAvailable = Math.max(0, totalBeds - occupiedBeds);

    const savedRoom: InpatientRoom = {
      id: roomToEdit ? roomToEdit.id : `room-${Date.now()}`,
      name: name.trim(),
      pavilion: pavilion.trim(),
      classLevel,
      category,
      roomRatePerDay: Number(roomRatePerDay),
      visiteGeneralDoctor: Number(visiteGeneralDoctor),
      visiteSpecialistDoctor: Number(visiteSpecialistDoctor),
      patientRoomFacilities: patientFacilities.length > 0 ? patientFacilities : ['Bed Pasien', 'AC Ruangan'],
      familyRoomFacilities: familyFacilities.length > 0 ? familyFacilities : undefined,
      totalBeds: Number(totalBeds),
      occupiedBeds: Number(occupiedBeds),
      availableBeds: calculatedAvailable,
      imageUrl: imageUrl || undefined,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onSave(savedRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#005d42] to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-300">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {roomToEdit ? 'Edit Tarif & Fasilitas Kamar' : 'Tambah Kelas Kamar Rawat Inap'}
              </h2>
              <p className="text-xs text-emerald-100/80">
                Manajemen katalog resmi rawat inap RS Muhammadiyah Babat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Nama & Gedung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kamar / Ruangan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Jannatul Firdaus - VVIP"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gedung / Paviliun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="pavilion-suggestions"
                value={pavilion}
                onChange={(e) => setPavilion(e.target.value)}
                placeholder="Contoh: Ruang Bersalin (Darussalam)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                required
              />
              <datalist id="pavilion-suggestions">
                <option value="Ruang Bersalin (Darussalam)" />
                <option value="Paviliun Jannatul Firdaus" />
                <option value="Paviliun Jannatun Na'im" />
                <option value="Gedung Sentral Perawatan Intensif" />
              </datalist>
            </div>
          </div>

          {/* Row 2: Kategori Filter & Tingkat Kelas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Filter <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold text-slate-800"
              >
                <option value="VVIP/VIP">VVIP / VIP</option>
                <option value="Kelas 1-3">Kelas 1 - 3</option>
                <option value="Intensif/Isolasi">Intensif / Isolasi (ICU/NICU)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tingkat Kelas Kamar
              </label>
              <input
                type="text"
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="VVIP, VIP, Kelas I, Kelas II, Kelas III, Isolasi, ICU, NICU"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Row 3: Biaya & Tarif */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              Rincian Tarif & Visite Dokter
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tarif Kamar / Hari (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={roomRatePerDay}
                  onChange={(e) => setRoomRatePerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Visite Dokter Umum (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={visiteGeneralDoctor}
                  onChange={(e) => setVisiteGeneralDoctor(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Visite Spesialis (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={visiteSpecialistDoctor}
                  onChange={(e) => setVisiteSpecialistDoctor(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Kapasitas & Real-time Bed Status */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Bed className="w-4 h-4 text-emerald-700" />
              Kapasitas Tempat Tidur (Bed)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Total Bed
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bed Terisi
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalBeds}
                  value={occupiedBeds}
                  onChange={(e) => setOccupiedBeds(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-amber-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bed Tersedia (Otomatis)
                </label>
                <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-800 flex items-center justify-between">
                  <span>{Math.max(0, totalBeds - occupiedBeds)} Bed</span>
                  <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    Siap Pakai
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Fasilitas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fasilitas Ruang Pasien (pisahkan dengan koma)
            </label>
            <textarea
              rows={2}
              value={patientFacilitiesText}
              onChange={(e) => setPatientFacilitiesText(e.target.value)}
              placeholder="Contoh: Bed Pasien (1 orang), AC Ruangan, TV Kabel, Kamar Mandi (air hangat)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fasilitas Ruang Penunggu / Ekstra (Opsional)
            </label>
            <textarea
              rows={2}
              value={familyFacilitiesText}
              onChange={(e) => setFamilyFacilitiesText(e.target.value)}
              placeholder="Contoh: Sofa, TV Kabel, Kitchen Set, Kulkas, Dispenser (khusus VVIP/Suite)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Row 6: Upload Foto Ruangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Foto Rincian Ruangan (Placeholder / Upload)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group h-36 bg-slate-900">
                <img
                  src={imageUrl}
                  alt="Pratinjau Ruangan"
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-100"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Ganti Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ) : isCompressing ? (
              <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <div className="text-xs font-bold text-emerald-800">
                  Mengompresi dan mengoptimalkan foto ruangan...
                </div>
                <div className="text-[10px] text-emerald-600">
                  Menyesuaikan ukuran gambar agar hemat ruang penyimpanan
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <div className="p-2.5 rounded-full bg-slate-100 text-slate-500">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Klik untuk mengunggah foto ruangan
                </div>
                <div className="text-[10px] text-slate-400">
                  PNG, JPG, atau WEBP (otomatis dikompresi agar hemat memori)
                </div>
              </div>
            )}
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Deskripsi Ruangan
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Ruang VVIP dengan pelayanan prioritas dan akses lift khusus."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#005d42] hover:bg-[#004732] active:bg-[#003827] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Data Kamar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
