import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  X,
  FileText,
  Printer,
  MessageCircle,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Phone,
  Building2,
  Sparkles,
  Download,
  Copy,
  Check
} from 'lucide-react';
import {
  KhitanParticipant,
  formatYMDToDMY,
  formatFullIndonesianDate,
  formatPhoneForWhatsApp,
  calculateDefaultControlDate,
  calculateAgeFromBirthDate
} from '../../data/khitanData';

interface KhitanPostControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParticipant?: KhitanParticipant | null;
  allParticipants?: KhitanParticipant[];
  onUpdateParticipant?: (id: string, updated: Partial<KhitanParticipant>) => void;
  showToast: (msg: string) => void;
}

export const KhitanPostControlModal: React.FC<KhitanPostControlModalProps> = ({
  isOpen,
  onClose,
  initialParticipant,
  allParticipants = [],
  onUpdateParticipant,
  showToast
}) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [namaPasien, setNamaPasien] = useState('');
  const [umurPasien, setUmurPasien] = useState<number | string>('');
  const [alamatPasien, setAlamatPasien] = useState('');
  const [namaWali, setNamaWali] = useState('');
  const [noHp, setNoHp] = useState('');
  const [tanggalTindakan, setTanggalTindakan] = useState('');
  const [tanggalKontrol, setTanggalKontrol] = useState('');
  const [jamKontrol, setJamKontrol] = useState('08:00 - 12:00 WIB');
  const [lokasiKontrol, setLokasiKontrol] = useState('Poli Bedah / Poli Umum RSU Muhammadiyah Babat');
  const [dokterOperator, setDokterOperator] = useState('dr. H. Abd. Rokhim, MARS');
  const [nomorSurat, setNomorSurat] = useState('');
  const [instruksiObat, setInstruksiObat] = useState(
    '1. Antibiotik diminum teratur sampai habis.\n2. Paracetamol diminum bila merasa nyeri/demam.\n3. Salep dioleskan tipis pada ujung luka 2x sehari.'
  );
  const [copiedWA, setCopiedWA] = useState(false);

  // Operator Doctor Presets
  const doctorPresets = [
    'dr. H. Abd. Rokhim, MARS',
    'dr. Fathur, Sp.B',
    'dr. M. Ainun Na\'im',
    'Tim Medis Khitan RSU Muhammadiyah Babat'
  ];

  // Generate Letter Number
  const generateLetterNumber = () => {
    const today = new Date();
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][today.getMonth()];
    const randSeq = Math.floor(100 + Math.random() * 900);
    return `${randSeq}/SKP-KHITAN/RSUMB/${monthRoman}/${today.getFullYear()}`;
  };

  useEffect(() => {
    if (isOpen) {
      setNomorSurat(generateLetterNumber());
      if (initialParticipant) {
        setSelectedParticipantId(initialParticipant.id);
        setNamaPasien(initialParticipant.namaPeserta || '');
        setUmurPasien(initialParticipant.umur || calculateAgeFromBirthDate(initialParticipant.tanggalLahir) || '');
        setAlamatPasien(initialParticipant.alamat || '');
        setNamaWali(initialParticipant.namaWali || '');
        setNoHp(initialParticipant.noHp || '');
        const procDate = initialParticipant.tanggalPelaksanaan || new Date().toISOString().split('T')[0];
        setTanggalTindakan(procDate);
        setTanggalKontrol(
          initialParticipant.tanggalKontrol || calculateDefaultControlDate(procDate, 3)
        );
        if (initialParticipant.dokterOperatorKontrol) {
          setDokterOperator(initialParticipant.dokterOperatorKontrol);
        }
      } else {
        setSelectedParticipantId('');
        const todayStr = new Date().toISOString().split('T')[0];
        setTanggalTindakan(todayStr);
        setTanggalKontrol(calculateDefaultControlDate(todayStr, 3));
        setNamaPasien('');
        setUmurPasien('');
        setAlamatPasien('');
        setNamaWali('');
        setNoHp('');
      }
    }
  }, [isOpen, initialParticipant]);

  // When participant selection changes
  const handleSelectParticipant = (id: string) => {
    setSelectedParticipantId(id);
    if (!id) return;
    const found = allParticipants.find((p) => p.id === id);
    if (found) {
      setNamaPasien(found.namaPeserta || '');
      setUmurPasien(found.umur || calculateAgeFromBirthDate(found.tanggalLahir) || '');
      setAlamatPasien(found.alamat || '');
      setNamaWali(found.namaWali || '');
      setNoHp(found.noHp || '');
      setTanggalTindakan(found.tanggalPelaksanaan || '');
      setTanggalKontrol(
        found.tanggalKontrol || calculateDefaultControlDate(found.tanggalPelaksanaan, 3)
      );
      if (found.dokterOperatorKontrol) {
        setDokterOperator(found.dokterOperatorKontrol);
      }
    }
  };

  // Quick shortcut helper for Tanggal Kontrol modification
  const setQuickControlDays = (daysAhead: number) => {
    if (!tanggalTindakan) return;
    const newDate = calculateDefaultControlDate(tanggalTindakan, daysAhead);
    setTanggalKontrol(newDate);
    if (selectedParticipantId && onUpdateParticipant) {
      onUpdateParticipant(selectedParticipantId, { tanggalKontrol: newDate });
    }
    showToast(`Jadwal kontrol disesuaikan menjadi H+${daysAhead}: ${formatFullIndonesianDate(newDate)}`);
  };

  const handleTanggalKontrolChange = (newDate: string) => {
    setTanggalKontrol(newDate);
    if (selectedParticipantId && onUpdateParticipant) {
      onUpdateParticipant(selectedParticipantId, { tanggalKontrol: newDate });
    }
  };

  // Generate WhatsApp Message text
  const generateWhatsAppMessage = () => {
    const formattedTindakan = tanggalTindakan ? formatFullIndonesianDate(tanggalTindakan) : '-';
    const formattedKontrol = tanggalKontrol ? formatFullIndonesianDate(tanggalKontrol) : '-';

    return `*RSU MUHAMMADIYAH BABAT*
_Layanan Khitan Berkah Hari Jumat_
━━━━━━━━━━━━━━━━━━━━━
*SURAT PEMBERITAHUAN JADWAL KONTROL & EDUKASI PASCA KHITAN*
No. Surat: ${nomorSurat}

Kepada Yth.
Bapak/Ibu: *${namaWali || 'Orang Tua Peserta'}*
Orang Tua dari Ananda: *${namaPasien || 'Pasien Khitan'}* ${umurPasien ? `(${umurPasien} Thn)` : ''}
Alamat: ${alamatPasien || '-'}

Assalamu'alaikum Warahmatullahi Wabarakatuh.
Alhamdulillah proses tindakan khitan ananda telah selesai dilaksanakan pada:
🗓️ *Hari/Tgl Tindakan:* ${formattedTindakan}
👨‍⚕️ *Dokter/Operator:* ${dokterOperator}

📌 *JADWAL KONTROL KEMBALI:*
🗓️ *Hari/Tanggal:* ${formattedKontrol}
⏰ *Waktu:* ${jamKontrol}
🏥 *Tempat/Lokasi:* ${lokasiKontrol}
_(Mohon membawa berkas/kartu peserta khitan saat kontrol)_

📋 *PANDUAN PERAWATAN DI RUMAH:*
1. *Obat-obatan:*
${instruksiObat}
2. *Kebersihan Luka:* Jaga area luka khitan tetap kering dan bersih. Hindari terkena percikan air saat mandi atau buang air kecil.
3. *Pakaian:* Kenakan celana khusus khitan atau sarung longgar agar sirkulasi udara baik dan mencegah gesekan luka.
4. *Aktivitas:* Istirahat yang cukup. Hindari aktivitas fisik berat, berlari-lari, atau bersepeda selama 3–5 hari.

⚠️ *TANDA BAHAYA (EMERGENCY):*
Bila terjadi pendarahan merembes yang tidak berhenti, penis membengkak kehitaman, demam tinggi > 38.5°C, atau ananda tidak bisa buang air kecil lebih dari 8 jam, segera bawa ananda ke:
🏥 *IGD RSU Muhammadiyah Babat (Buka 24 Jam)*
☎️ Layanan IGD / Call Center: *(0322) 451111*

Semoga Ananda lekas sembuh, sehat walafiat, dan menjadi putra yang sholeh membanggakan keluarga. Aamiin.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
_Panitia Khitan Berkah & Tim Medis RSU Muhammadiyah Babat_`;
  };

  // Handle Send WhatsApp Action
  const handleSendWhatsApp = () => {
    if (!namaPasien.trim()) {
      showToast('Mohon isi nama pasien terlebih dahulu.');
      return;
    }
    // Sync changes to participant if applicable
    if (selectedParticipantId && onUpdateParticipant) {
      onUpdateParticipant(selectedParticipantId, {
        tanggalKontrol,
        dokterOperatorKontrol: dokterOperator
      });
    }
    const message = generateWhatsAppMessage();
    const cleanPhone = formatPhoneForWhatsApp(noHp);

    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
    showToast('Membuka WhatsApp untuk mengirim pesan jadwal kontrol & edukasi perawatan...');
  };

  // Copy WhatsApp Text to Clipboard
  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    showToast('Teks pesan WhatsApp berhasil disalin ke clipboard.');
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // PDF Generator Action (jsPDF format A5 Standar Surat Medis)
  const handleDownloadPdf = () => {
    if (!namaPasien.trim()) {
      showToast('Mohon isi nama pasien terlebih dahulu.');
      return;
    }

    // Sync changes to participant if applicable
    if (selectedParticipantId && onUpdateParticipant) {
      onUpdateParticipant(selectedParticipantId, {
        tanggalKontrol,
        dokterOperatorKontrol: dokterOperator
      });
    }

    try {
      // Create A5 Portrait PDF (148 x 210 mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      const formattedTindakan = tanggalTindakan ? formatFullIndonesianDate(tanggalTindakan) : '-';
      const formattedKontrol = tanggalKontrol ? formatFullIndonesianDate(tanggalKontrol) : '-';

      // 1. Bingkai Garis Tepi Halus
      doc.setDrawColor(0, 93, 66);
      doc.setLineWidth(0.6);
      doc.rect(7, 7, 134, 196, 'S');

      // 2. Kop Surat Resmi
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(0, 93, 66); // Brand green
      doc.text('RSU MUHAMMADIYAH BABAT', 74, 16, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('LAYANAN KHITAN BERKAH HARI JUMAT', 74, 21, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur | Telp. (0322) 451111', 74, 25.5, { align: 'center' });

      // Garis ganda pembatas kop
      doc.setDrawColor(0, 93, 66);
      doc.setLineWidth(0.8);
      doc.line(12, 28, 136, 28);
      doc.setLineWidth(0.2);
      doc.line(12, 29, 136, 29);

      // 3. Judul Surat
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('SURAT KETERANGAN KONTROL PASCA KHITAN', 74, 36, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Nomor: ${nomorSurat}`, 74, 40.5, { align: 'center' });

      // Paragraf Pengantar
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(
        'Menerangkan bahwa pasien anak dengan data di bawah ini telah selesai menjalani tindakan Khitan Berkah di RSU Muhammadiyah Babat:',
        12,
        47,
        { maxWidth: 124 }
      );

      // 4. Tabel Identitas Pasien
      let y = 54;
      const printRow = (label: string, value: string, boldVal: boolean = false) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.8);
        doc.setTextColor(71, 85, 105);
        doc.text(label, 14, y);
        doc.text(':', 50, y);

        doc.setFont('helvetica', boldVal ? 'bold' : 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(15, 23, 42);
        const splitVal = doc.splitTextToSize(value, 80);
        doc.text(splitVal, 53, y);
        y += Math.max(splitVal.length * 4.2, 5.5);
      };

      printRow('Nama Pasien (Anak)', namaPasien.toUpperCase(), true);
      printRow('Umur Pasien', umurPasien ? `${umurPasien} Tahun` : '-');
      printRow('Alamat Domisili', alamatPasien || '-');
      printRow('Nama Orang Tua / Wali', namaWali || '-');
      printRow('No. Telp / WhatsApp', noHp || '-');
      printRow('Tanggal Tindakan Khitan', formattedTindakan);
      printRow('Dokter / Operator Khitan', dokterOperator);

      // 5. Box Jadwal Kontrol
      y += 2;
      doc.setFillColor(240, 253, 244); // Light emerald bg
      doc.setDrawColor(187, 247, 208);
      doc.setLineWidth(0.4);
      doc.roundedRect(12, y, 124, 25, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 93, 66);
      doc.text('JADWAL KONTROL POST-KHITAN:', 16, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedKontrol, 16, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Waktu / Jam : ${jamKontrol}`, 16, y + 17);
      doc.text(`Tempat / Poli : ${lokasiKontrol}`, 16, y + 21.5);

      y += 30;

      // 6. Box Edukasi & Instruksi Perawatan Pasca Khitan
      doc.setFillColor(248, 250, 252); // Light slate bg
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(12, y, 124, 46, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('PANDUAN & EDUKASI PERAWATAN DI RUMAH:', 16, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      const edukasiPoints = [
        '1. Minum obat antibiotik secara teratur sampai habis dan analgesik bila terasa nyeri/demam.',
        '2. Jaga area luka khitan tetap kering & bersih. Hindari basah air berlebihan saat mandi / BAB.',
        '3. Kenakan celana khitan atau sarung longgar untuk menghindari gesekan pada ujung luka.',
        '4. Istirahat cukup, hindari aktivitas fisik berat (berlari, melompat, bersepeda) selama 3-5 hari.',
        '5. TANDA BAHAYA: Jika terjadi pendarahan aktif yang tidak berhenti, demam tinggi, atau kesulitan',
        '   buang air kecil, SEGERA bawa ananda ke IGD RSU Muhammadiyah Babat (Layanan 24 Jam).'
      ];
      let ey = y + 11.5;
      edukasiPoints.forEach((point) => {
        doc.text(point, 16, ey);
        ey += 4.5;
      });

      y += 50;

      // 7. Area Tanda Tangan Dokter / Petugas
      const tglCetak = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Babat, ${tglCetak}`, 102, y + 5, { align: 'center' });
      doc.text('Dokter / Operator Khitan,', 102, y + 9.5, { align: 'center' });

      // Garis tanda tangan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`( ${dokterOperator} )`, 102, y + 27, { align: 'center' });

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('RSU Muhammadiyah Babat - Pelayanan Peduli Umat', 102, y + 31, { align: 'center' });

      // Save PDF
      const cleanName = namaPasien.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Surat_Kontrol_Khitan_${cleanName}.pdf`);
      showToast('Berhasil mengunduh Surat Kontrol Post-Khitan (Format PDF Standar A5).');
    } catch (err) {
      console.error('Error generating Surat Kontrol PDF:', err);
      showToast('Gagal mencetak PDF. Silakan gunakan opsi Cetak browser.');
    }
  };

  // Direct Browser Print Action
  const handlePrintBrowser = () => {
    if (!namaPasien.trim()) {
      showToast('Mohon isi nama pasien terlebih dahulu.');
      return;
    }
    showToast('Membuka dialog cetak Surat Kontrol...');
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#005d42] to-emerald-800 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Generator Surat Kontrol Post-Khitan
              </h3>
              <p className="text-xs text-emerald-100">
                Penerbitan surat kontrol resmi & pengiriman panduan edukasi WhatsApp untuk orang tua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content: Split Screen (Inputs on Left, Live Preview on Right) */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs sm:text-sm no-print">
          {/* Kolom Kiri: Form Input Fields (7 Kolom di Desktop) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Quick Participant Select & Pre-filled Status */}
            {allParticipants.length > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pilih Cepat Peserta Khitan Terdaftar:</span>
                  </label>
                  {selectedParticipantId && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                      Data Terisi Otomatis
                    </span>
                  )}
                </div>
                <select
                  value={selectedParticipantId}
                  onChange={(e) => handleSelectParticipant(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-slate-800"
                >
                  <option value="">-- Input Bebas / Manual --</option>
                  {allParticipants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaPeserta} ({p.umur} Thn, Wali: {p.namaWali || '-'}) &bull; Tgl Tindakan: {p.tanggalPelaksanaan}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Field 1: Nama Pasien & Umur */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Pasien (Anak) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={namaPasien}
                    onChange={(e) => setNamaPasien(e.target.value)}
                    placeholder="Contoh: Muhammad Rayhan"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Umur (Tahun)
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={umurPasien}
                  onChange={(e) => setUmurPasien(e.target.value)}
                  placeholder="Contoh: 10"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                />
              </div>
            </div>

            {/* Field 2: Nama Wali & No. WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaWali}
                  onChange={(e) => setNamaWali(e.target.value)}
                  placeholder="Contoh: Bapak Ahmad Fauzi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  No. WhatsApp Orang Tua / Wali
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>
              </div>
            </div>

            {/* Field 3: Alamat Domisili */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alamat Domisili Pasien
              </label>
              <input
                type="text"
                value={alamatPasien}
                onChange={(e) => setAlamatPasien(e.target.value)}
                placeholder="Contoh: Dsn. Sawo RT 02/RW 03, Babat, Lamongan"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              />
            </div>

            {/* Field 4 & 5: Tanggal Tindakan & Tanggal Kontrol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Tindakan Khitan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={tanggalTindakan}
                    onChange={(e) => {
                      const newTindakan = e.target.value;
                      setTanggalTindakan(newTindakan);
                      const defCtrl = calculateDefaultControlDate(newTindakan, 3);
                      setTanggalKontrol(defCtrl);
                      if (selectedParticipantId && onUpdateParticipant) {
                        onUpdateParticipant(selectedParticipantId, {
                          tanggalPelaksanaan: newTindakan,
                          tanggalKontrol: defCtrl
                        });
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Jadwal Kontrol Post-Khitan <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={tanggalKontrol}
                    onChange={(e) => handleTanggalKontrolChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-emerald-900 bg-emerald-50/50 border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                {/* Shortcut Buttons for Quick Control Date Modification */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium">Ubah cepat:</span>
                  <button
                    type="button"
                    onClick={() => setQuickControlDays(3)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition font-medium cursor-pointer"
                    title="Jadwalkan kontrol 3 hari setelah khitan (Senin)"
                  >
                    +3 Hari (Senin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickControlDays(4)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition font-medium cursor-pointer"
                    title="Jadwalkan kontrol 4 hari setelah khitan (Selasa)"
                  >
                    +4 Hari (Selasa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickControlDays(7)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-medium cursor-pointer"
                    title="Jadwalkan kontrol 7 hari setelah khitan (Jumat depan)"
                  >
                    +7 Hari (Jumat)
                  </button>
                </div>
              </div>
            </div>

            {/* Field 6: Dokter / Operator Khitan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Dokter / Operator Khitan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={dokterOperator}
                  onChange={(e) => setDokterOperator(e.target.value)}
                  placeholder="Nama Dokter Operator"
                  list="doctor-presets"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                />
                <datalist id="doctor-presets">
                  {doctorPresets.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium">Pilihan cepat:</span>
                {doctorPresets.map((docName) => (
                  <button
                    key={docName}
                    type="button"
                    onClick={() => setDokterOperator(docName)}
                    className={`text-[10px] px-2 py-0.5 rounded-md transition cursor-pointer border ${
                      dokterOperator === docName
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {docName}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 7: Lokasi & Waktu Kontrol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tempat / Poli Kontrol
                </label>
                <input
                  type="text"
                  value={lokasiKontrol}
                  onChange={(e) => setLokasiKontrol(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jam Pelayanan Kontrol
                </label>
                <input
                  type="text"
                  value={jamKontrol}
                  onChange={(e) => setJamKontrol(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                />
              </div>
            </div>

            {/* Field 8: Instruksi Obat */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Instruksi Obat & Perawatan di Rumah
              </label>
              <textarea
                rows={3}
                value={instruksiObat}
                onChange={(e) => setInstruksiObat(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005d42] leading-relaxed"
              />
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Surat Kontrol Medis (6 Kolom di Desktop) */}
          <div className="lg:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Pratinjau Surat Kontrol Medis</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{nomorSurat}</span>
              </div>

              {/* Tampilan Visual Surat Resmi (Gaya Kop RSUMB) */}
              <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-xs text-slate-800 text-[11px] space-y-3">
                {/* Kop Mini */}
                <div className="text-center pb-2 border-b border-emerald-800">
                  <h4 className="font-extrabold text-xs text-[#005d42] uppercase tracking-wider">
                    RSU MUHAMMADIYAH BABAT
                  </h4>
                  <p className="text-[9px] font-bold text-slate-700">LAYANAN KHITAN BERKAH HARI JUMAT</p>
                  <p className="text-[8px] text-slate-400">Jl. Raya Babat No. 184 Lamongan | Telp. (0322) 451111</p>
                </div>

                <div className="text-center py-1">
                  <p className="font-bold text-xs underline text-slate-900">SURAT KETERANGAN KONTROL PASCA KHITAN</p>
                  <p className="text-[9px] text-slate-500">Nomor: {nomorSurat}</p>
                </div>

                {/* Detail Pasien */}
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Pasien:</span>
                    <span className="font-bold text-slate-900">
                      {namaPasien || '(Belum diisi)'} {umurPasien ? `(${umurPasien} Thn)` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Orang Tua/Wali:</span>
                    <span className="font-medium text-slate-800">{namaWali || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alamat Domisili:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[200px]">{alamatPasien || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. WhatsApp / Telp:</span>
                    <span className="font-mono text-slate-700">{noHp || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tgl Tindakan Khitan:</span>
                    <span className="text-slate-800">
                      {tanggalTindakan ? formatFullIndonesianDate(tanggalTindakan) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dokter Operator:</span>
                    <span className="font-medium text-emerald-800">{dokterOperator}</span>
                  </div>
                </div>

                {/* Box Jadwal Kontrol */}
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-emerald-900">
                  <p className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                    Jadwal Kontrol Kembali:
                  </p>
                  <p className="text-xs font-black text-slate-900 mt-0.5">
                    {tanggalKontrol ? formatFullIndonesianDate(tanggalKontrol) : '(Pilih tanggal kontrol)'}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Waktu: {jamKontrol} &bull; {lokasiKontrol}
                  </p>
                </div>

                {/* Tanda Tangan */}
                <div className="pt-2 flex justify-end">
                  <div className="text-right text-[9px] text-slate-600">
                    <p>Babat, {formatFullIndonesianDate(new Date().toISOString().split('T')[0])}</p>
                    <p className="mt-0.5">Dokter / Petugas Medis Khitan,</p>
                    <div className="h-9"></div>
                    <p className="font-bold text-slate-800">( {dokterOperator} )</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Copy WA Preview */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Format WA siap dikirim ke orang tua:</span>
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                {copiedWA ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Pesan WA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions: [ Cetak Surat Kontrol (PDF) ] and [ Kirim WA Instruksi ] */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Action 1: Kirim WA Reminder */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
              title="Kirim pesan WhatsApp pengingat jadwal kontrol dan panduan perawatan ke nomor orang tua"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim WA Reminder</span>
            </button>

            {/* Action 2: Cetak Surat Kontrol (PDF) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005d42] hover:bg-[#004a35] text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
              title="Unduh berkas PDF Surat Kontrol Post-Khitan format A5"
            >
              <Download className="w-4 h-4" />
              <span>Cetak Surat Kontrol (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
