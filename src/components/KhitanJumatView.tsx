import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  Filter,
  X,
  Heart,
  Printer,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  CalendarDays,
  ExternalLink,
  Download,
  FileText,
  FileDown,
  IdCard
} from 'lucide-react';
import {
  KhitanParticipant,
  KhitanStatus,
  KhitanCategory,
  formatYMDToDMY,
  formatPhoneForWhatsApp,
  calculateAgeFromBirthDate,
  formatFullIndonesianDate,
  STANDARD_KHITAN_QUOTA
} from '../data/khitanData';
import { KhitanPostControlModal } from './khitan/KhitanPostControlModal';
import { requestAdminAction } from '../services/adminAuthService';

interface KhitanJumatViewProps {
  participants: KhitanParticipant[];
  onAddParticipant: (participant: Omit<KhitanParticipant, 'id' | 'createdAt'>) => void;
  onUpdateParticipant: (id: string, updated: Partial<KhitanParticipant>) => void;
  onDeleteParticipant: (id: string) => void;
  showToast: (msg: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const KhitanJumatView: React.FC<KhitanJumatViewProps> = ({
  participants,
  onAddParticipant,
  onUpdateParticipant,
  onDeleteParticipant,
  showToast,
  searchTerm: externalSearchTerm,
  setSearchTerm: externalSetSearchTerm
}) => {
  // Search and Filter states (syncs with external prop or uses internal fallback)
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalSetSearchTerm !== undefined ? externalSetSearchTerm : setInternalSearchTerm;

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KhitanParticipant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCardParticipant, setSelectedCardParticipant] = useState<KhitanParticipant | null>(null);
  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  const [selectedControlParticipant, setSelectedControlParticipant] = useState<KhitanParticipant | null>(null);

  // Form State
  const [formTanggalKhitan, setFormTanggalKhitan] = useState('');
  const [formNamaPeserta, setFormNamaPeserta] = useState('');
  const [formTanggalLahir, setFormTanggalLahir] = useState('');
  const [formUmur, setFormUmur] = useState<number | string>(10);
  const [formAlamat, setFormAlamat] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formNamaWali, setFormNamaWali] = useState('');
  const [formBeratBadan, setFormBeratBadan] = useState<string>('');
  const [formKategori, setFormKategori] = useState<KhitanCategory>('Umum');
  const [formStatus, setFormStatus] = useState<KhitanStatus>('Terdaftar');
  const [formCatatan, setFormCatatan] = useState('');
  const [formPjApproval, setFormPjApproval] = useState(false);
  const [showPjConfirmDialog, setShowPjConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<Omit<KhitanParticipant, 'id' | 'createdAt'> | null>(null);

  // Kuota check untuk tanggal yang dipilih di form
  const existingOnFormDate = useMemo(() => {
    if (!formTanggalKhitan) return [];
    return participants.filter(
      (p) => p.tanggalPelaksanaan === formTanggalKhitan && (!editingItem || p.id !== editingItem.id)
    );
  }, [participants, formTanggalKhitan, editingItem]);

  const isFormDateQuotaFull = existingOnFormDate.length >= STANDARD_KHITAN_QUOTA;

  // Hidden print iframe ref
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Helper: Unduh berkas PDF Kartu Peserta resmi berukuran ringkas A6
  const handleDownloadCardPdf = (participant: KhitanParticipant) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6' // A6 ringkas (105 x 148 mm)
      });

      // Bingkai Kartu Luar
      doc.setDrawColor(0, 93, 66);
      doc.setLineWidth(0.7);
      doc.roundedRect(6, 6, 93, 136, 3, 3, 'S');

      // Kop Resmi Rumah Sakit
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(11, 28, 48);
      doc.text('RSU MUHAMMADIYAH BABAT', 52.5, 13.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 93, 66);
      doc.text('KARTU PESERTA KHITAN JUMAT BERKAH', 52.5, 18.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Jl. Raya Babat No. 184, Babat, Lamongan | Telp. (0322) 451111', 52.5, 22.5, { align: 'center' });

      // Garis Pembatas Kop
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(10, 25, 95, 25);

      // Kotak Nomor Antrian Manual (Kosong dengan Garis Tepi Jelas untuk Tulis Tangan / Stempel)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(10, 27.5, 85, 29, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 93, 66);
      doc.text('NOMOR ANTRIAN KEHADIRAN', 52.5, 32, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text('(Diisi manual / stempel petugas registrasi di lokasi)', 52.5, 35.5, { align: 'center' });

      // Kotak Kosong dengan Border Jelas
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.6);
      doc.roundedRect(30, 37.5, 45, 13, 2, 2, 'FD');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.8);
      doc.setTextColor(148, 163, 184);
      doc.text('[ Tulis Tangan / Stempel ]', 52.5, 45, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Pelaksanaan: Jumat, ${formatYMDToDMY(participant.tanggalPelaksanaan)}`, 52.5, 53.5, { align: 'center' });

      // Kotak Rincian Detail Pasien
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(10, 58.5, 85, 58, 2, 2, 'FD');

      let yPos = 65;

      // Nama Peserta: font size lebih besar, bold, text-slate-900
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('Nama Peserta', 13, yPos);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const splitName = doc.splitTextToSize(participant.namaPeserta, 48);
      doc.text(splitName, 41, yPos);
      yPos += Math.max(splitName.length * 4.2, 7.5);

      const addRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(label, 13, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);

        const splitVal = doc.splitTextToSize(value, 48);
        doc.text(splitVal, 41, yPos);
        yPos += Math.max(splitVal.length * 3.8, 6.8);
      };

      addRow('Umur', `${participant.umur} Tahun`);
      addRow('Tanggal Lahir', participant.tanggalLahir ? formatYMDToDMY(participant.tanggalLahir) : '-');
      addRow('Nama Wali/Ortu', participant.namaWali || '-');
      addRow('Alamat Pasien', participant.alamat || '-');
      addRow('Status Pendaftaran', `${participant.status} (${participant.kategori})`);
      addRow('Tgl Khitan', `Jumat, ${formatYMDToDMY(participant.tanggalPelaksanaan)}`);
      addRow('No. Kontak / HP', participant.noHp || '-');

      // Kotak Catatan / Ketentuan Kehadiran
      doc.setFillColor(254, 252, 232);
      doc.setDrawColor(254, 240, 138);
      doc.roundedRect(10, 119, 85, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.2);
      doc.setTextColor(133, 77, 14);
      doc.text('* Mohon hadir 15 menit sebelum waktu tindakan.', 13, 123.5);
      doc.text('* Tunjukkan kartu peserta ini ke meja registrasi khitan.', 13, 127.5);

      // Tanda Tangan Panitia
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Panitia Khitan Berkah RSU Muhammadiyah Babat', 52.5, 136, { align: 'center' });

      const safeName = participant.namaPeserta.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Kartu_Khitan_${safeName}.pdf`);
      showToast('Berhasil mengunduh Kartu Peserta Khitan (Format A6 PDF).');
    } catch (err) {
      console.error('Failed to generate A6 card PDF:', err);
      showToast('Gagal mengunduh kartu PDF. Silakan gunakan tombol Cetak.');
    }
  };

  // Helper: Cetak Kartu Peserta via window.print() dengan fallback otomatis
  const handlePrintParticipantCard = () => {
    if (!selectedCardParticipant) return;
    showToast('Membuka dialog cetak kartu peserta...');
    try {
      window.print();
    } catch (err) {
      console.warn('window.print failed, falling back to PDF download:', err);
      handleDownloadCardPdf(selectedCardParticipant);
    }
  };

  // 1. Two-way Auto Calculation: Tanggal Lahir -> Umur
  const handleBirthDateChange = (dateStr: string) => {
    setFormTanggalLahir(dateStr);
    if (dateStr) {
      const calculatedAge = calculateAgeFromBirthDate(dateStr);
      if (calculatedAge >= 0) {
        setFormUmur(calculatedAge);
      }
    }
  };

  // 2. Two-way Auto Calculation: Umur -> Estimasi Tanggal Lahir (1 Januari [Tahun Sekarang - Umur])
  const handleAgeChange = (ageVal: string) => {
    setFormUmur(ageVal);
    const parsedAge = parseInt(ageVal, 10);
    if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 99) {
      const currentYear = new Date().getFullYear();
      const estimatedYear = currentYear - parsedAge;
      const estimatedDate = `${estimatedYear}-01-01`;
      setFormTanggalLahir(estimatedDate);
    } else if (ageVal === '') {
      setFormTanggalLahir('');
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 5 is Friday
    const distanceToFriday = (5 - dayOfWeek + 7) % 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (distanceToFriday === 0 ? 7 : distanceToFriday));
    const nextFridayStr = nextFriday.toISOString().split('T')[0];

    setFormTanggalKhitan(nextFridayStr);
    setFormNamaPeserta('');
    setFormTanggalLahir('');
    setFormUmur(10);
    setFormAlamat('');
    setFormNoHp('');
    setFormNamaWali('');
    setFormBeratBadan('');
    setFormKategori('Umum');
    setFormStatus('Terdaftar');
    setFormCatatan('');
    setFormPjApproval(false);
    setShowPjConfirmDialog(false);
    setPendingFormData(null);
    setIsFormModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: KhitanParticipant) => {
    setEditingItem(item);
    setFormTanggalKhitan(item.tanggalPelaksanaan || '');
    setFormNamaPeserta(item.namaPeserta || '');
    setFormTanggalLahir(item.tanggalLahir || '');
    setFormUmur(item.umur !== undefined && item.umur !== null ? item.umur : 0);
    setFormAlamat(item.alamat || '');
    setFormNoHp(item.noHp || '');
    setFormNamaWali(item.namaWali || '');
    setFormBeratBadan(
      item.beratBadan !== undefined && item.beratBadan !== null ? String(item.beratBadan) : ''
    );
    setFormKategori(item.kategori || 'Umum');
    setFormStatus(item.status || 'Terdaftar');
    setFormCatatan(item.catatan || '');
    setFormPjApproval(!!item.pjApproval);
    setShowPjConfirmDialog(false);
    setPendingFormData(null);
    setIsFormModalOpen(true);
  };

  // Eksekusi simpan peserta (Create / Update)
  const executeSaveParticipant = (
    data: Omit<KhitanParticipant, 'id' | 'createdAt'>,
    approvedPj: boolean
  ) => {
    const finalData: Omit<KhitanParticipant, 'id' | 'createdAt'> = {
      ...data,
      pjApproval: approvedPj
    };

    if (editingItem) {
      onUpdateParticipant(editingItem.id, finalData);
      showToast(`Data peserta "${finalData.namaPeserta}" berhasil diperbarui.`);
    } else {
      onAddParticipant(finalData);
      if (approvedPj) {
        showToast(`Peserta "${finalData.namaPeserta}" berhasil didaftarkan (Persetujuan PJ Kuota Fleksibel).`);
      } else {
        showToast(`Peserta khitan "${finalData.namaPeserta}" berhasil didaftarkan.`);
      }
    }

    setIsFormModalOpen(false);
    setShowPjConfirmDialog(false);
    setPendingFormData(null);
    setFormPjApproval(false);
  };

  // Submit Form (Create / Edit) dengan pengecekan kuota fleksibel
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaPeserta.trim()) {
      alert('Mohon isi nama peserta khitan.');
      return;
    }
    if (!formTanggalKhitan) {
      alert('Mohon pilih tanggal pelaksanaan khitan.');
      return;
    }

    let parsedBB: number | null = null;
    if (formBeratBadan !== '' && formBeratBadan !== null) {
      const num = parseFloat(formBeratBadan);
      if (!isNaN(num) && num > 0) {
        parsedBB = num;
      }
    }

    const payload: Omit<KhitanParticipant, 'id' | 'createdAt'> = {
      namaPeserta: formNamaPeserta.trim(),
      tanggalPelaksanaan: formTanggalKhitan,
      tanggalLahir: formTanggalLahir,
      umur: typeof formUmur === 'number' ? formUmur : parseInt(formUmur as string, 10) || 0,
      alamat: formAlamat.trim() || '-',
      noHp: formNoHp.trim() || '-',
      namaWali: formNamaWali.trim() || '-',
      beratBadan: parsedBB,
      kategori: formKategori,
      status: formStatus,
      catatan: formCatatan.trim(),
      pjApproval: formPjApproval || (isFormDateQuotaFull && !editingItem)
    };

    // Jika kuota harian sudah >= 5 dan form belum mencentang konfirmasi izin PJ, tampilkan peringatan konfirmasi tanpa mengunci pendaftaran
    if (isFormDateQuotaFull && !formPjApproval && !editingItem) {
      setPendingFormData(payload);
      setShowPjConfirmDialog(true);
      return;
    }

    executeSaveParticipant(payload, formPjApproval || (isFormDateQuotaFull && !editingItem));
  };

  // Direct status change from table
  const handleQuickStatusChange = (id: string, newStatus: KhitanStatus) => {
    onUpdateParticipant(id, { status: newStatus });
    showToast(`Status peserta diubah menjadi "${newStatus}".`);
  };

  // Delete participant
  const handleConfirmDelete = () => {
    if (deletingId) {
      onDeleteParticipant(deletingId);
      setDeletingId(null);
      showToast('Data peserta khitan berhasil dihapus.');
    }
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const total = participants.length;
    const terdaftar = participants.filter((p) => p.status === 'Terdaftar').length;
    const hadir = participants.filter((p) => p.status === 'Hadir').length;
    const selesai = participants.filter((p) => p.status === 'Selesai').length;
    const batal = participants.filter((p) => p.status === 'Batal').length;
    return { total, terdaftar, hadir, selesai, batal };
  }, [participants]);

  // Filtered participants for screen view (Real-time Search: Nama Peserta, Wali, Alamat, No HP + Filter Tanggal & Status)
  const filteredParticipants = useMemo(() => {
    return participants.filter((item) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const cleanQuery = query.replace(/\D/g, '');
        const matchesName = (item.namaPeserta || '').toLowerCase().includes(query);
        const matchesWali = (item.namaWali || '').toLowerCase().includes(query);
        const matchesAlamat = (item.alamat || '').toLowerCase().includes(query);
        const phoneRaw = (item.noHp || '').toLowerCase();
        const phoneDigits = (item.noHp || '').replace(/\D/g, '');
        const matchesPhone =
          phoneRaw.includes(query) || (cleanQuery.length >= 3 && phoneDigits.includes(cleanQuery));

        if (!matchesName && !matchesWali && !matchesAlamat && !matchesPhone) {
          return false;
        }
      }

      if (filterDate && item.tanggalPelaksanaan !== filterDate) {
        return false;
      }

      if (filterStatus !== 'all' && item.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [participants, searchTerm, filterDate, filterStatus]);

  // Grouping baris tabel berdasarkan Tanggal Khitan (Jumat) beserta status kuota per tanggal
  const groupedParticipants = useMemo(() => {
    const groups: { [date: string]: KhitanParticipant[] } = {};
    for (const item of filteredParticipants) {
      const d = item.tanggalPelaksanaan || 'Belum Ditentukan';
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(item);
    }

    // Urutkan tanggal secara kronologis (terawal lebih dulu)
    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return sortedDates.map((date) => {
      // Hitung total peserta pada tanggal ini dari master peserta untuk kepastian kuota
      const totalOnDate = participants.filter((p) => p.tanggalPelaksanaan === date).length;
      return {
        date,
        totalOnDate,
        items: groups[date]
      };
    });
  }, [filteredParticipants, participants]);

  // Participants prepared specifically for Print (Respects active search, date, and status filters)
  const printParticipants = useMemo(() => {
    return filteredParticipants;
  }, [filteredParticipants]);

  // Generate self-contained, hospital-grade printable HTML document
  const generatePrintDocumentHtml = () => {
    const tglDisplay = filterDate ? formatYMDToDMY(filterDate) : 'Semua Tanggal Pelaksanaan';
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const printTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const tableRows = printParticipants
      .map(
        (item, idx) => `
      <tr>
        <td style="border: 1px solid #1e293b; padding: 6px 8px; text-align: center; font-weight: 600;">${idx + 1}</td>
        <td style="border: 1px solid #1e293b; padding: 6px 8px; font-weight: bold; color: #0f172a;">
          ${item.namaPeserta}
          ${
            item.kategori && item.kategori !== 'Umum'
              ? `<span style="font-size: 9px; font-weight: normal; color: #475569; display: block;">(${item.kategori})</span>`
              : ''
          }
        </td>
        <td style="border: 1px solid #1e293b; padding: 6px 8px; text-align: center;">${item.umur} Thn</td>
        <td style="border: 1px solid #1e293b; padding: 6px 8px; font-size: 11px; line-height: 1.3;">${item.alamat || '-'}</td>
        <td style="border: 1px solid #1e293b; padding: 6px 8px;">${item.namaWali || '-'}</td>
        <td style="border: 1px solid #1e293b; padding: 6px 8px; text-align: center; font-family: monospace;">${item.noHp || '-'}</td>
        <td style="border: 1px solid #1e293b; padding: 6px 8px; text-align: center;">
          <div style="height: 28px; border-bottom: 1px dashed #94a3b8;"></div>
        </td>
      </tr>
    `
      )
      .join('');

    const emptyRow = `
      <tr>
        <td colspan="7" style="border: 1px solid #1e293b; padding: 24px; text-align: center; color: #64748b; font-style: italic;">
          Tidak ada data peserta khitan untuk jadwal yang dipilih.
        </td>
      </tr>
    `;

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Daftar Peserta Khitan Jumat - RSUMB</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      padding: 16px;
      font-size: 12px;
      line-height: 1.4;
    }
    .no-print {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #005d42;
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: #ffffff;
      color: #005d42;
      border: none;
      padding: 8px 18px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-print:hover {
      background: #e6f4f0;
    }
    .kop-container {
      border-bottom: 3px double #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      text-align: center;
    }
    .kop-rs {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0b1c30;
      text-transform: uppercase;
    }
    .kop-sub {
      font-size: 11px;
      color: #334155;
      margin-top: 2px;
    }
    .kop-title {
      font-size: 14px;
      font-weight: 800;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #005d42;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      margin-bottom: 10px;
      padding: 0 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.3px;
      padding: 8px 6px;
      border: 1px solid #1e293b;
    }
    .signature-container {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }
    .signature-box {
      width: 240px;
      text-align: center;
      font-size: 11px;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
      th {
        background-color: #e2e8f0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="font-weight: bold; font-size: 13px;">
      Dokumen Siap Cetak &bull; RSU Muhammadiyah Babat
    </div>
    <div>
      <button class="btn-print" onclick="window.print()">
        Cetak Dokumen Ini (Ctrl + P)
      </button>
    </div>
  </div>

  <div class="kop-container">
    <div class="kop-rs">RSU MUHAMMADIYAH BABAT</div>
    <div class="kop-sub">Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur | Telp. (0322) 451111 / 451234</div>
    <div class="kop-title">DAFTAR PESERTA KHITAN JUMAT BERKAH</div>
  </div>

  <div class="meta-bar">
    <div><strong>Tanggal Pelaksanaan:</strong> ${tglDisplay}</div>
    <div><strong>Total Peserta:</strong> ${printParticipants.length} Anak</div>
    <div><strong>Dicetak:</strong> ${currentDate} ${printTime} WIB</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">NO</th>
        <th style="width: 22%;">NAMA PESERTA</th>
        <th style="width: 8%;">UMUR</th>
        <th style="width: 25%;">ALAMAT</th>
        <th style="width: 18%;">ORANG TUA / WALI</th>
        <th style="width: 12%;">NO TELP / HP</th>
        <th style="width: 10%;">PARAF / CEK</th>
      </tr>
    </thead>
    <tbody>
      ${printParticipants.length > 0 ? tableRows : emptyRow}
    </tbody>
  </table>

  <div class="signature-container">
    <div class="signature-box">
      <div>Babat, ${currentDate}</div>
      <div style="font-weight: bold; margin-top: 4px;">Koordinator Pelaksana Khitan</div>
      <div style="height: 60px;"></div>
      <div style="font-weight: bold; border-top: 1px solid #1e293b; padding-top: 4px;">
        ( .................................................. )
      </div>
      <div style="font-size: 10px; color: #475569;">Tim Medis RSU Muhammadiyah Babat</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.log(e);
        }
      }, 400);
    });
  </script>
</body>
</html>`;
  };

  // Method 1: Direct Browser Print with Fail-Safe Fallbacks
  const handleDirectPrint = () => {
    // A. First attempt: Direct window.print()
    try {
      showToast('Membuka dialog cetak browser...');
      window.print();
      return;
    } catch (err) {
      console.warn('Direct window.print() restricted in current environment:', err);
    }

    // B. Second attempt: Direct synchronous new window with printable document
    try {
      const htmlContent = generatePrintDocumentHtml();
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        showToast('Dokumen cetak dibuka di tab baru. Silakan klik Cetak.');
        return;
      }
    } catch (winErr) {
      console.warn('Window open fallback failed:', winErr);
    }

    // C. Third attempt: Instant official PDF generation
    handleDownloadPdf();
  };

  // Helper for rendering official signature block on PDF
  const renderPdfSignature = (doc: jsPDF, y: number, currentDate: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Babat, ${currentDate}`, 155, y, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Koordinator Pelaksana Khitan', 155, y + 5, { align: 'center' });
    doc.line(130, y + 23, 180, y + 23);
    doc.setFont('helvetica', 'normal');
    doc.text('( .................................................. )', 155, y + 24, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Tim Medis RSU Muhammadiyah Babat', 155, y + 28, { align: 'center' });
  };

  // Method 2: Official A4 Vector PDF Generator (Immune to all print / popup blockers)
  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const tglDisplay = filterDate ? formatYMDToDMY(filterDate) : 'Semua Tanggal Pelaksanaan';
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const printTime = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Kop Rumah Sakit
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(11, 28, 48);
      doc.text('RSU MUHAMMADIYAH BABAT', 105, 16, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'Jl. Raya Babat No. 184, Babat, Lamongan - Jawa Timur | Telp. (0322) 451111 / 451234',
        105,
        21,
        { align: 'center' }
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 93, 66);
      doc.text('DAFTAR PESERTA KHITAN JUMAT BERKAH', 105, 27, { align: 'center' });

      // Garis Kop Ganda
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.7);
      doc.line(14, 30, 196, 30);
      doc.setLineWidth(0.2);
      doc.line(14, 31, 196, 31);

      // Meta Info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Tanggal Pelaksanaan: ${tglDisplay}`, 14, 36);
      doc.text(`Total Peserta: ${printParticipants.length} Anak`, 105, 36, { align: 'center' });
      doc.text(`Dicetak: ${currentDate} ${printTime} WIB`, 196, 36, { align: 'right' });

      // Table Content
      const tableData = printParticipants.map((p, idx) => [
        String(idx + 1),
        p.namaPeserta + (p.kategori && p.kategori !== 'Umum' ? ` (${p.kategori})` : ''),
        `${p.umur} Thn`,
        p.alamat || '-',
        p.namaWali || '-',
        p.noHp || '-',
        ''
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['NO', 'NAMA PESERTA', 'UMUR', 'ALAMAT', 'ORANG TUA / WALI', 'NO TELP / HP', 'PARAF / CEK']],
        body: tableData.length > 0 ? tableData : [['-', 'Tidak ada data peserta khitan', '-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: {
          fillColor: [0, 93, 66],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          valign: 'middle'
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [15, 23, 42],
          lineColor: [30, 41, 59],
          lineWidth: 0.15,
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
          2: { halign: 'center', cellWidth: 15 },
          3: { halign: 'left', cellWidth: 48 },
          4: { halign: 'left', cellWidth: 35 },
          5: { halign: 'center', cellWidth: 26 },
          6: { halign: 'center', cellWidth: 18 }
        },
        margin: { left: 14, right: 14 }
      });

      // Signature Section
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      const signY = finalY > 235 ? 245 : finalY + 14;

      if (signY > 255) {
        doc.addPage();
        renderPdfSignature(doc, 25, currentDate);
      } else {
        renderPdfSignature(doc, signY, currentDate);
      }

      const dateLabel = filterDate ? filterDate.replace(/-/g, '_') : 'Semua_Jadwal';
      doc.save(`Daftar_Peserta_Khitan_RSUMB_${dateLabel}.pdf`);
      showToast('File PDF resmi RSUMB berhasil diunduh dan siap dicetak.');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      handleDownloadPrintHtml();
    }
  };

  // Method 3: Open in new tab
  const handleOpenPrintNewTab = () => {
    try {
      const htmlContent = generatePrintDocumentHtml();
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        showToast('Dokumen cetak dibuka di tab baru. Silakan klik Cetak.');
      } else {
        handleDownloadPdf();
      }
    } catch (err) {
      console.error('Failed to open print tab:', err);
      handleDownloadPdf();
    }
  };

  // Method 4: Download standalone HTML printable file
  const handleDownloadPrintHtml = () => {
    try {
      const htmlContent = generatePrintDocumentHtml();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateLabel = filterDate || 'Semua_Jadwal';
      a.download = `Daftar_Peserta_Khitan_RSUMB_${dateLabel}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('File dokumen cetak (.html) berhasil diunduh. Silakan buka file untuk mencetak.');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Terjadi kendala saat mengunduh berkas.');
    }
  };

  // WhatsApp click handler
  const handleSendWhatsApp = (item: KhitanParticipant) => {
    const phone = formatPhoneForWhatsApp(item.noHp);
    if (!phone) {
      alert('Nomor kontak tidak valid.');
      return;
    }
    const message = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Bpk/Ibu wali dari ananda *${item.namaPeserta}*.\n` +
        `Kami dari Tim Pelayanan Khitan Berkah Hari Jumat RSU Muhammadiyah Babat mengonfirmasi pendaftaran khitan:\n` +
        `- *Nama Peserta*: ${item.namaPeserta} (${item.umur} Thn)\n` +
        `- *Tanggal Pelaksanaan*: ${formatYMDToDMY(item.tanggalPelaksanaan)}\n` +
        `- *Status*: ${item.status}\n\n` +
        `Mohon ananda dalam kondisi sehat dan siap pada hari pelaksanaan. Terima kasih. Wassalamu'alaikum Wr. Wb.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ========================================================================= */}
      {/* 1. PRINT-ONLY TEMPLATE (Fallback Saat Browser Menjalankan Ctrl+P)          */}
      {/* ========================================================================= */}
      <div className="hidden print:block w-full text-black bg-white p-4 font-sans">
        <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
          <h1 className="text-xl font-black tracking-wide text-slate-900 uppercase">
            RSUMB - DAFTAR PESERTA KHITAN JUMAT
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            RSU MUHAMMADIYAH BABAT &bull; PROGRAM KHITAN BERKAH HARI JUMAT
          </p>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mt-2 px-1">
            <span>
              <strong>Tanggal Pelaksanaan:</strong>{' '}
              {filterDate ? formatYMDToDMY(filterDate) : 'Semua Tanggal Pelaksanaan'}
            </span>
            <span>
              <strong>Total Peserta:</strong> {printParticipants.length} Anak
            </span>
            <span>
              <strong>Dicetak:</strong>{' '}
              {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <table className="w-full border-collapse border border-slate-800 text-[11px]">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-800">
              <th className="border border-slate-800 px-2 py-1.5 text-center w-8">NO</th>
              <th className="border border-slate-800 px-3 py-1.5 text-left min-w-[140px]">NAMA PESERTA</th>
              <th className="border border-slate-800 px-2 py-1.5 text-center w-16">UMUR</th>
              <th className="border border-slate-800 px-3 py-1.5 text-left">ALAMAT</th>
              <th className="border border-slate-800 px-3 py-1.5 text-left min-w-[130px]">ORANG TUA / WALI</th>
              <th className="border border-slate-800 px-2 py-1.5 text-center min-w-[100px]">NO TELP / HP</th>
              <th className="border border-slate-800 px-3 py-1.5 text-center min-w-[140px]">
                PARAF PETUGAS / KETERANGAN
              </th>
            </tr>
          </thead>
          <tbody>
            {printParticipants.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-slate-800 py-6 text-center text-slate-500 italic">
                  Tidak ada peserta khitan pada tanggal yang dipilih.
                </td>
              </tr>
            ) : (
              printParticipants.map((item, idx) => (
                <tr key={`print-fallback-${item.id}`} className="border-b border-slate-800">
                  <td className="border border-slate-800 px-2 py-2 text-center font-semibold">{idx + 1}</td>
                  <td className="border border-slate-800 px-3 py-2 font-bold">
                    {item.namaPeserta}
                    {item.kategori && item.kategori !== 'Umum' && (
                      <span className="text-[9px] font-normal block text-slate-600">({item.kategori})</span>
                    )}
                  </td>
                  <td className="border border-slate-800 px-2 py-2 text-center">{item.umur} Thn</td>
                  <td className="border border-slate-800 px-3 py-2 text-[10px] leading-tight">{item.alamat}</td>
                  <td className="border border-slate-800 px-3 py-2">{item.namaWali}</td>
                  <td className="border border-slate-800 px-2 py-2 text-center font-mono">{item.noHp}</td>
                  <td className="border border-slate-800 px-3 py-2 text-center">
                    <div className="h-8 border-b border-dashed border-slate-400"></div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end">
          <div className="text-center w-56 text-[11px]">
            <p className="text-slate-700">
              Babat, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="font-semibold text-slate-800 mt-1">Koordinator Pelaksana Khitan</p>
            <div className="h-16"></div>
            <p className="font-bold border-t border-slate-700 pt-1 text-slate-900">
              ( .................................................. )
            </p>
            <p className="text-[10px] text-slate-600">NBM / NIP RSU Muhammadiyah Babat</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. WEB UI (Ditampilkan di Layar, Disembunyikan Saat Print @media print)    */}
      {/* ========================================================================= */}
      <div className="print:hidden no-print flex flex-col gap-5 w-full">
        {/* Header & Tombol Utama */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-[#005d42] border border-teal-100">
                  <Heart className="w-5 h-5 text-[#005d42]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  PENDAFTARAN PESERTA KHITAN JUMAT
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 pl-10">
                Layanan Khitan Berkah Hari Jumat RSU Muhammadiyah Babat - Pelayanan Medis Profesional & Peduli Umat
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto pl-10 sm:pl-0 flex-wrap">
              {/* Tombol Surat Kontrol Post-Khitan */}
              <button
                onClick={() => {
                  setSelectedControlParticipant(null);
                  setIsControlModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
                title="Buka Generator Surat Kontrol Post-Khitan & WhatsApp Edukasi"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Surat Kontrol Post-Khitan</span>
              </button>

              {/* Tombol Cetak / Print Daftar (Membuka Pratinjau & Pilihan Cetak) */}
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
                title="Cetak Daftar Peserta Khitan (Buka Pratinjau & Cetak)"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>Cetak Daftar</span>
              </button>

              {/* Tombol + Tambah Peserta Khitan */}
              <button
                onClick={() => requestAdminAction(handleOpenCreateModal, 'Tambah Peserta Khitan')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005d42] hover:bg-[#004a35] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Peserta Khitan</span>
              </button>
            </div>
          </div>

          {/* 5 Statistik Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Peserta</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Semua pendaftaran</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Terdaftar</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.terdaftar}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Menunggu kehadiran</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Hadir</p>
                <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.hadir}</h3>
                <p className="text-[11px] text-emerald-600 mt-0.5">Tiba di lokasi</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-700">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Selesai</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-1">{stats.selesai}</h3>
                <p className="text-[11px] text-blue-500 mt-0.5">Tindakan tuntas</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Batal</p>
                <h3 className="text-2xl font-bold text-rose-900 mt-1">{stats.batal}</h3>
                <p className="text-[11px] text-rose-500 mt-0.5">Ditunda / batal</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Nama Peserta, Nama Orang Tua / Wali, Alamat, No. HP..."
                className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tanggal Jumat */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-500 font-medium">Jumat:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  title="Hapus filter tanggal"
                  className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Terdaftar">Terdaftar</option>
                <option value="Hadir">Hadir</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Print Button in Filter Bar */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
              title="Cetak data sesuai filter saat ini"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>Cetak Hasil</span>
            </button>

            {/* Reset Filter Button */}
            {(searchTerm || filterDate || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDate('');
                  setFilterStatus('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
              >
                Reset Filter
              </button>
            )}

            <div className="text-xs text-slate-500 font-medium hidden md:block">
              Menampilkan <span className="font-bold text-slate-800">{filteredParticipants.length}</span> dari{' '}
              <span className="font-bold text-slate-800">{participants.length}</span> peserta
            </div>
          </div>
        </div>

        {/* Struktur 6 Kolom Multi-line Tabel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 text-[11px] font-bold tracking-wider uppercase border-b border-slate-200 select-none">
                  <th className="px-3.5 py-3 text-center w-12">NO</th>
                  <th className="px-4 py-3 min-w-[200px]">PESERTA & TANGGAL</th>
                  <th className="px-4 py-3 min-w-[130px]">UMUR & TGL LAHIR</th>
                  <th className="px-4 py-3 min-w-[220px]">ALAMAT & WALI</th>
                  <th className="px-4 py-3 min-w-[150px]">KONTAK</th>
                  <th className="px-4 py-3 text-right min-w-[170px]">STATUS & AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                          <Users className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">Tidak ada peserta ditemukan</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Coba sesuaikan kata kunci pencarian atau filter tanggal Anda.
                        </p>
                        {(searchTerm || filterDate || filterStatus !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setFilterDate('');
                              setFilterStatus('all');
                            }}
                            className="mt-3 text-xs font-semibold text-[#005d42] hover:underline cursor-pointer"
                          >
                            Hapus Semua Filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedParticipants.map((group) => {
                    return (
                      <React.Fragment key={`group-section-${group.date}`}>
                        {/* ========================================================= */}
                        {/* Group Header Pembatas Tabel (Per Tanggal Jumat)           */}
                        {/* ========================================================= */}
                        <tr className="bg-emerald-50 border-y border-emerald-200 text-emerald-950 select-none">
                          <td colSpan={6} className="px-4 py-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-950">
                                <span className="text-base leading-none">📅</span>
                                <span>Pelaksanaan: {formatFullIndonesianDate(group.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {group.totalOnDate < STANDARD_KHITAN_QUOTA ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>
                                      {group.totalOnDate}/{STANDARD_KHITAN_QUOTA} Peserta (Sisa {STANDARD_KHITAN_QUOTA - group.totalOnDate} Kursi)
                                    </span>
                                  </span>
                                ) : group.totalOnDate === STANDARD_KHITAN_QUOTA ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                                    <span>{STANDARD_KHITAN_QUOTA}/{STANDARD_KHITAN_QUOTA} Peserta (Penuh)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                                    <span>{group.totalOnDate}/{STANDARD_KHITAN_QUOTA} Peserta (Izin PJ)</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* ========================================================= */}
                        {/* Baris Peserta Dalam Kelompok Tanggal Tersebut             */}
                        {/* ========================================================= */}
                        {group.items.map((item, itemIdx) => {
                          // Cek urutan pendaftaran pada tanggal ini untuk deteksi melebihi kuota 5 anak
                          const allOnThisDate = participants.filter((p) => p.tanggalPelaksanaan === item.tanggalPelaksanaan);
                          const positionOnDate = allOnThisDate.findIndex((p) => p.id === item.id);
                          const isOverQuota = positionOnDate >= STANDARD_KHITAN_QUOTA || item.pjApproval;

                          const rowBgClass = isOverQuota
                            ? 'bg-amber-50/50 hover:bg-amber-100/60 border-l-4 border-l-amber-500'
                            : item.status === 'Hadir'
                            ? 'bg-emerald-50/50 hover:bg-emerald-100/50'
                            : item.status === 'Selesai'
                            ? 'bg-blue-50/40 hover:bg-blue-100/40'
                            : item.status === 'Batal'
                            ? 'bg-rose-50/60 hover:bg-rose-100/50'
                            : 'bg-white hover:bg-slate-50/90';

                          return (
                            <tr key={item.id} className={`${rowBgClass} transition-colors`}>
                              {/* Kolom 1 (NO) */}
                              <td className="px-3.5 py-3 text-center text-slate-500 font-medium">
                                {itemIdx + 1}
                              </td>

                              {/* Kolom 2 (PESERTA & TANGGAL) */}
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 text-sm">{item.namaPeserta}</span>
                                    {item.kategori && item.kategori !== 'Umum' && (
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                          item.kategori === 'Yatim' || item.kategori === 'Yatim Piatu'
                                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                                        }`}
                                      >
                                        {item.kategori}
                                      </span>
                                    )}
                                    {/* Penanda Peserta Melebihi Kuota 5 Anak (Persetujuan PJ) */}
                                    {isOverQuota && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                        <ShieldAlert className="w-3 h-3 text-amber-700 shrink-0" />
                                        <span>
                                          Persetujuan PJ
                                          {positionOnDate >= 0 ? ` (Ke-${positionOnDate + 1})` : ''}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                    <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>Tgl Khitan: {formatYMDToDMY(item.tanggalPelaksanaan)}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Kolom 3 (UMUR & TGL LAHIR) */}
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800 text-xs">{item.umur} Thn</span>
                                  <span className="text-[11px] text-slate-500 mt-0.5">
                                    {item.tanggalLahir ? `Lahir: ${formatYMDToDMY(item.tanggalLahir)}` : 'Lahir: -'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    BB:{' '}
                                    {item.beratBadan !== null && item.beratBadan !== undefined && item.beratBadan > 0
                                      ? `${item.beratBadan} kg`
                                      : '-'}
                                  </span>
                                </div>
                              </td>

                              {/* Kolom 4 (ALAMAT & WALI) */}
                              <td className="px-4 py-3">
                                <div className="flex flex-col max-w-[260px]">
                                  <span className="text-xs text-slate-800 leading-snug line-clamp-1" title={item.alamat}>
                                    {item.alamat || '-'}
                                  </span>
                                  <span className="text-[11px] italic text-slate-500 mt-0.5">
                                    Wali: {item.namaWali || '-'}
                                  </span>
                                </div>
                              </td>

                              {/* Kolom 5 (KONTAK) */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-700 text-xs font-mono">{item.noHp || '-'}</span>
                                  {item.noHp && item.noHp !== '-' && (
                                    <button
                                      onClick={() => handleSendWhatsApp(item)}
                                      title="Chat WhatsApp ke Wali Peserta"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all font-medium text-[11px] shrink-0 cursor-pointer shadow-2xs"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span className="hidden sm:inline">WA</span>
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Kolom 6 (STATUS & AKSI) */}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <select
                                    value={item.status}
                                    onChange={(e) => handleQuickStatusChange(item.id, e.target.value as KhitanStatus)}
                                    className={`text-[11px] font-semibold px-2 py-1 rounded-md border focus:outline-none cursor-pointer transition-colors ${
                                      item.status === 'Hadir'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : item.status === 'Selesai'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : item.status === 'Batal'
                                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                    }`}
                                  >
                                    <option value="Terdaftar">Terdaftar</option>
                                    <option value="Hadir">Hadir</option>
                                    <option value="Selesai">Selesai</option>
                                    <option value="Batal">Batal</option>
                                  </select>

                                  <button
                                    onClick={() => {
                                      setSelectedControlParticipant(item);
                                      setIsControlModalOpen(true);
                                    }}
                                    title="Surat Kontrol Post-Khitan (📄) - Cetak PDF & Kirim WA Reminder"
                                    aria-label="Surat Kontrol"
                                    className="p-1.5 text-teal-700 hover:text-white hover:bg-[#005d42] bg-teal-50/80 border border-teal-300/80 rounded-md transition cursor-pointer shadow-2xs group flex items-center justify-center"
                                  >
                                    <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                  </button>

                                  <button
                                    onClick={() => setSelectedCardParticipant(item)}
                                    title="Cetak Kartu Peserta Khitan (ID Card & Nomor Antrian)"
                                    className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 bg-emerald-50/50 border border-emerald-200 rounded-md transition cursor-pointer shadow-2xs"
                                  >
                                    <IdCard className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => requestAdminAction(() => handleOpenEditModal(item), 'Edit Data Peserta Khitan')}
                                    title="Edit Data Peserta"
                                    className="p-1.5 text-slate-500 hover:text-[#005d42] hover:bg-slate-100 rounded-md transition cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => requestAdminAction(() => setDeletingId(item.id), 'Hapus Data Peserta Khitan')}
                                    title="Hapus Data Peserta"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL PRATINJAU & OPSI CETAK DOKUMEN (FAIL-SAFE & INTERACTIVE)         */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-5 print:hidden no-print overflow-hidden animate-in fade-in">
          <div className="relative z-[100000] bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] my-auto flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100 text-[#005d42]">
                  <Printer className="w-5 h-5 text-[#005d42]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Pratinjau & Cetak Daftar Peserta Khitan
                  </h3>
                  <p className="text-xs text-slate-500">
                    RSU Muhammadiyah Babat &bull; Lembar Kerja Cetak Fisik Petugas Lapangan
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Bar (Top Controls) */}
            <div className="px-5 py-3 bg-teal-50/50 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">Pilih Jadwal Jumat:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:border-[#005d42]"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                  >
                    Tampilkan Semua
                  </button>
                )}
                <span className="text-slate-400">|</span>
                <span className="font-bold text-[#005d42]">{printParticipants.length} Peserta Siap Cetak</span>
              </div>

              {/* Print Trigger Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Direct Print */}
                <button
                  onClick={handleDirectPrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005d42] hover:bg-[#004833] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition active:scale-98 cursor-pointer"
                  title="Kirim langsung ke printer atau dialog cetak browser"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang</span>
                </button>

                {/* 2. Official PDF Download */}
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
                  title="Unduh berkas PDF standar A4 resmi RSUMB"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh PDF Resmi</span>
                </button>

                {/* 3. Open in New Tab */}
                <button
                  onClick={handleOpenPrintNewTab}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer"
                  title="Buka dokumen di tab baru browser untuk mencetak langsung"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Buka di Tab Baru</span>
                </button>

                {/* 4. Download HTML */}
                <button
                  onClick={handleDownloadPrintHtml}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer"
                  title="Unduh file dokumen HTML siap cetak"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Unduh HTML</span>
                </button>
              </div>
            </div>

            {/* Document Preview Sheet (Styled like physical A4 Paper) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
              <div className="bg-white w-full max-w-[780px] p-6 sm:p-8 rounded-lg shadow-md border border-slate-300 text-slate-900 font-sans my-auto">
                {/* Kop Header Bersih */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
                  <h1 className="text-lg sm:text-xl font-black tracking-wide text-slate-900 uppercase">
                    RSUMB - DAFTAR PESERTA KHITAN JUMAT
                  </h1>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    RSU MUHAMMADIYAH BABAT &bull; PROGRAM KHITAN BERKAH HARI JUMAT
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Jl. Raya Babat No. 184, Babat, Lamongan - Telp. (0322) 451111 / 451234
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 mt-3 pt-2 border-t border-slate-200">
                    <span>
                      <strong>Tanggal Pelaksanaan:</strong>{' '}
                      {filterDate ? formatYMDToDMY(filterDate) : 'Semua Tanggal Pelaksanaan'}
                    </span>
                    <span>
                      <strong>Total Peserta:</strong> {printParticipants.length} Anak
                    </span>
                    <span>
                      <strong>Dicetak:</strong>{' '}
                      {new Date().toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Tabel Cetak Fisik */}
                <table className="w-full border-collapse border border-slate-800 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800">
                      <th className="border border-slate-800 px-2 py-1.5 text-center w-8">NO</th>
                      <th className="border border-slate-800 px-3 py-1.5 text-left min-w-[140px]">NAMA PESERTA</th>
                      <th className="border border-slate-800 px-2 py-1.5 text-center w-14">UMUR</th>
                      <th className="border border-slate-800 px-3 py-1.5 text-left">ALAMAT</th>
                      <th className="border border-slate-800 px-3 py-1.5 text-left min-w-[120px]">
                        ORANG TUA / WALI
                      </th>
                      <th className="border border-slate-800 px-2 py-1.5 text-center min-w-[90px]">NO TELP / HP</th>
                      <th className="border border-slate-800 px-3 py-1.5 text-center min-w-[120px]">
                        PARAF PETUGAS / KETERANGAN
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {printParticipants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="border border-slate-800 py-8 text-center text-slate-500 italic"
                        >
                          Tidak ada peserta khitan pada jadwal yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      printParticipants.map((item, idx) => (
                        <tr key={`modal-preview-${item.id}`} className="border-b border-slate-800">
                          <td className="border border-slate-800 px-2 py-2 text-center font-semibold">{idx + 1}</td>
                          <td className="border border-slate-800 px-3 py-2 font-bold text-slate-900">
                            {item.namaPeserta}
                            {item.kategori && item.kategori !== 'Umum' && (
                              <span className="text-[9px] font-normal block text-slate-600">({item.kategori})</span>
                            )}
                          </td>
                          <td className="border border-slate-800 px-2 py-2 text-center">{item.umur} Thn</td>
                          <td className="border border-slate-800 px-3 py-2 text-[10px] leading-tight">
                            {item.alamat}
                          </td>
                          <td className="border border-slate-800 px-3 py-2 text-[11px]">{item.namaWali}</td>
                          <td className="border border-slate-800 px-2 py-2 text-center font-mono text-[10px]">
                            {item.noHp}
                          </td>
                          <td className="border border-slate-800 px-3 py-2 text-center">
                            <div className="h-7 border-b border-dashed border-slate-400"></div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Kolom Tanda Tangan Cetak */}
                <div className="mt-8 flex justify-end">
                  <div className="text-center w-56 text-[11px]">
                    <p className="text-slate-700">
                      Babat,{' '}
                      {new Date().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="font-semibold text-slate-800 mt-1">Koordinator Pelaksana Khitan</p>
                    <div className="h-14"></div>
                    <p className="font-bold border-t border-slate-700 pt-1 text-slate-900">
                      ( .................................................. )
                    </p>
                    <p className="text-[10px] text-slate-600">NBM / NIP RSU Muhammadiyah Babat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-1.5 text-slate-600">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Format cetak standar A4 siap pakai untuk checklist fisik di lokasi tindakan.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold transition cursor-pointer shadow-2xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  onClick={handleDirectPrint}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#005d42] hover:bg-[#004833] text-white rounded-lg font-bold transition cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL INPUT DATA (+ TAMBAH & EDIT PESERTA KHITAN)                      */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4 print:hidden no-print overflow-hidden animate-in fade-in">
          <div className="relative z-[100000] bg-white rounded-2xl max-w-xl w-full max-h-[85vh] my-auto flex flex-col overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100/70 text-[#005d42]">
                  <UserPlus className="w-5 h-5 text-[#005d42]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingItem ? 'Edit Data Peserta Khitan' : 'Pendaftaran Peserta Khitan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Khitan Berkah Hari Jumat RSU Muhammadiyah Babat</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {/* Row: Tanggal Khitan & Status Peserta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Khitan (Hari Jumat) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggalKhitan}
                    onChange={(e) => setFormTanggalKhitan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Peserta <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as KhitanStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42] bg-white font-medium"
                  >
                    <option value="Terdaftar">Terdaftar</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>
              </div>

              {/* Peringatan Kuota Fleksibel (Batas 5 Peserta) */}
              {isFormDateQuotaFull && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-amber-950">
                          Peringatan Kuota Terpenuhi ({existingOnFormDate.length}/{STANDARD_KHITAN_QUOTA} Peserta)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                          Izin PJ
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                        Kuota harian (5 anak) sudah terpenuhi untuk pelaksanaan <strong>{formatFullIndonesianDate(formTanggalKhitan)}</strong>. Lanjutkan dengan persetujuan Penanggung Jawab? Pendaftaran tidak dikunci dan tetap dapat disimpan.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-2 border-t border-amber-200/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPjApproval}
                      onChange={(e) => setFormPjApproval(e.target.checked)}
                      className="w-4 h-4 text-[#005d42] border-amber-400 rounded focus:ring-[#005d42] cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-amber-950">
                      Konfirmasi Persetujuan Penanggung Jawab (PJ) untuk kuota tambahan
                    </span>
                  </label>
                </div>
              )}

              {/* Nama Peserta */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Peserta (Anak) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNamaPeserta}
                  onChange={(e) => setFormNamaPeserta(e.target.value)}
                  placeholder="Contoh: Muhammad Rayhan Alfatih"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                />
              </div>

              {/* Row: Tanggal Lahir, Umur, Berat Badan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formTanggalLahir}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Otomatis hitung umur</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Umur (Tahun) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formUmur}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    placeholder="Contoh: 10"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ketik umur &rarr; estimasi tgl lahir</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berat Badan (kg) <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formBeratBadan}
                    onChange={(e) => setFormBeratBadan(e.target.value)}
                    placeholder="Boleh kosong"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Boleh dikosongkan</span>
                </div>
              </div>

              {/* Row: Nama Wali & No Telp/WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNamaWali}
                    onChange={(e) => setFormNamaWali(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzi (Ayah)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No Telp / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formNoHp}
                    onChange={(e) => setFormNoHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                  />
                </div>
              </div>

              {/* Status Kategori: Piatu/Yatim/Dhuafa/Umum */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Kategori (Piatu / Yatim / Dhuafa / Umum)
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value as KhitanCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42] bg-white font-medium"
                >
                  <option value="Umum">Umum</option>
                  <option value="Dhuafa">Dhuafa</option>
                  <option value="Yatim">Yatim</option>
                  <option value="Piatu">Piatu</option>
                  <option value="Yatim Piatu">Yatim Piatu</option>
                </select>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Raya Babat No. 42 RT 02/RW 03, Babat, Lamongan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                />
              </div>

              {/* Catatan Khusus */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Khusus (Riwayat Medis / Ukuran Celana Khitan)
                </label>
                <input
                  type="text"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Opsional, misal: tidak ada alergi, minta ukuran celana L"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#005d42] focus:ring-1 focus:ring-[#005d42]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#005d42] hover:bg-[#004a35] rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Daftarkan Peserta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4.5. MODAL PERINGATAN KONFIRMASI KUOTA TERPENUHI (PERSETUJUAN PJ)         */}
      {/* ========================================================================= */}
      {showPjConfirmDialog && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in no-print">
          <div className="relative z-[100000] bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Peringatan Kuota Terpenuhi
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pelaksanaan khitan pada hari{' '}
                <strong className="text-slate-900 font-semibold">{formatFullIndonesianDate(formTanggalKhitan)}</strong>{' '}
                saat ini telah mencapai kuota harian (<span className="font-semibold text-slate-900">{existingOnFormDate.length} dari {STANDARD_KHITAN_QUOTA} anak</span>).
              </p>
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 text-xs font-semibold text-amber-950 text-left flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Kuota harian (5 anak) sudah terpenuhi. Lanjutkan dengan persetujuan Penanggung Jawab?
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPjConfirmDialog(false)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal / Cek Jadwal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingFormData) {
                    executeSaveParticipant(pendingFormData, true);
                  }
                }}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-[#005d42] hover:bg-[#004a35] rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Lanjutkan (Izin PJ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL KONFIRMASI HAPUS                                                 */}
      {/* ========================================================================= */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4 print:hidden no-print overflow-hidden animate-in fade-in">
          <div className="relative z-[100000] bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Hapus Data Peserta?</h4>
            <p className="text-xs text-slate-500 mt-1.5">
              Data peserta khitan ini akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-5">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL KARTU PESERTA KHITAN JUMAT BERKAH (ID CARD / A6 PRINTABLE)       */}
      {/* ========================================================================= */}
      {selectedCardParticipant && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 print:hidden no-print overflow-hidden animate-in fade-in">
          <div className="relative z-[100000] bg-white rounded-2xl max-w-md w-full max-h-[85vh] my-auto flex flex-col shadow-2xl border border-slate-200 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Navigation Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-[#005d42]">
                  <IdCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Kartu Peserta Khitan</h3>
                  <p className="text-[11px] text-slate-500">ID Card & Nomor Urut Antrian Kehadiran</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCardParticipant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                title="Tutup Kartu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Physical Card Simulator (A6 / ID Card Aspect Ratio) */}
            <div className="p-4 sm:p-5 bg-slate-100/70 flex justify-center">
              <div className="w-full bg-white rounded-2xl border-2 border-emerald-700/20 p-4 sm:p-5 shadow-sm text-slate-900 font-sans relative overflow-hidden">
                {/* Decorative Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#005d42] via-emerald-500 to-[#005d42]" />

                {/* Header: Logo RSUMB & Judul KARTU PESERTA KHITAN JUMAT BERKAH */}
                <div className="flex items-center gap-3 pb-3 border-b-2 border-[#005d42]">
                  <img
                    src="/logo-rsumb.png"
                    alt="Logo RSUMB"
                    className="w-11 h-11 object-contain shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">
                      RSU MUHAMMADIYAH BABAT
                    </p>
                    <h2 className="text-xs sm:text-[13px] font-black text-[#005d42] uppercase tracking-tight mt-1 leading-tight">
                      KARTU PESERTA KHITAN JUMAT BERKAH
                    </h2>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-none">
                      Jl. Raya Babat No. 184, Babat, Lamongan &bull; Telp. (0322) 451111
                    </p>
                  </div>
                </div>

                {/* Nomor Antrian: Kotak Kosong dengan Garis Tepi (Border) Jelas untuk Diisi Manual (Tulis Tangan / Stempel) */}
                <div className="my-3.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3 text-center shadow-2xs">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#005d42] bg-emerald-100/90 border border-emerald-200">
                    NOMOR ANTRIAN KEHADIRAN
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    (Diisi manual oleh petugas registrasi di lokasi)
                  </p>

                  {/* Kotak Kosong Bergaris Tepi Jelas */}
                  <div className="my-2.5 mx-auto max-w-[210px] h-20 bg-white border-2 border-slate-700 rounded-xl flex items-center justify-center shadow-2xs">
                    <span className="text-xs text-slate-400 font-medium italic tracking-wide select-none">
                      [ Tulis Tangan / Stempel ]
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700">
                    Jadwal: Jumat, {formatYMDToDMY(selectedCardParticipant.tanggalPelaksanaan)}
                  </p>
                </div>

                {/* Detail Pasien: Typography & Keterbacaan Identitas Sesuai Instruksi */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
                  <div className="bg-slate-100/90 px-3.5 py-2 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px] text-slate-700 flex items-center justify-between">
                    <span>Identitas Pasien</span>
                    <span className="text-xs font-semibold text-[#005d42] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {selectedCardParticipant.kategori}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-2.5">
                    {/* Nama Peserta: font-size: 16px / text-base, font-bold, text-slate-900 */}
                    <div className="flex justify-between items-baseline gap-3 border-b border-slate-200/80 pb-2">
                      <span className="text-[13px] text-slate-500 shrink-0 font-normal">Nama Peserta:</span>
                      <span className="text-base font-bold text-slate-900 text-right leading-tight">
                        {selectedCardParticipant.namaPeserta}
                      </span>
                    </div>

                    {/* Umur: text-sm font-medium text-slate-900 */}
                    <div className="flex justify-between items-baseline gap-3 border-b border-slate-200/80 pb-2">
                      <span className="text-[13px] text-slate-500 shrink-0 font-normal">Umur:</span>
                      <span className="text-sm font-medium text-slate-900 text-right">
                        {selectedCardParticipant.umur} Tahun
                      </span>
                    </div>

                    {/* Tanggal Lahir: text-sm font-medium text-slate-900 */}
                    <div className="flex justify-between items-baseline gap-3 border-b border-slate-200/80 pb-2">
                      <span className="text-[13px] text-slate-500 shrink-0 font-normal">Tanggal Lahir:</span>
                      <span className="text-sm font-medium text-slate-900 text-right">
                        {selectedCardParticipant.tanggalLahir
                          ? formatYMDToDMY(selectedCardParticipant.tanggalLahir)
                          : '-'}
                      </span>
                    </div>

                    {/* Nama Orang Tua / Wali: text-sm font-medium text-slate-900 */}
                    <div className="flex justify-between items-baseline gap-3 border-b border-slate-200/80 pb-2">
                      <span className="text-[13px] text-slate-500 shrink-0 font-normal">Nama Orang Tua / Wali:</span>
                      <span className="text-sm font-medium text-slate-900 text-right">
                        {selectedCardParticipant.namaWali || '-'}
                      </span>
                    </div>

                    {/* Alamat Pasien: text-sm font-medium text-slate-900 */}
                    <div className="flex justify-between items-baseline gap-3 border-b border-slate-200/80 pb-2">
                      <span className="text-[13px] text-slate-500 shrink-0 font-normal">Alamat:</span>
                      <span className="text-sm font-medium text-slate-900 text-right leading-snug max-w-[230px]">
                        {selectedCardParticipant.alamat || '-'}
                      </span>
                    </div>

                    {/* Status: text-sm font-medium text-slate-900 */}
                    <div className="flex justify-between items-baseline gap-3 border-b border-slate-200/80 pb-2">
                      <span className="text-[13px] text-slate-500 shrink-0 font-normal">Status:</span>
                      <span className="text-sm font-medium text-slate-900 text-right">
                        {selectedCardParticipant.status} ({selectedCardParticipant.kategori})
                      </span>
                    </div>

                    {/* Tgl Pelaksanaan Khitan: text-sm font-medium text-[#005d42] */}
                    <div className="flex justify-between items-baseline gap-3 border-b border-slate-200/80 pb-2">
                      <span className="text-[13px] text-slate-500 shrink-0 font-normal">Tgl Pelaksanaan Khitan:</span>
                      <span className="text-sm font-medium text-[#005d42] text-right">
                        Jumat, {formatYMDToDMY(selectedCardParticipant.tanggalPelaksanaan)}
                      </span>
                    </div>

                    {/* No. Kontak / HP: text-sm font-medium font-mono text-slate-900 */}
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="text-[13px] text-slate-500 shrink-0 font-normal">No. HP / WA:</span>
                      <span className="text-sm font-medium font-mono text-slate-900 text-right">
                        {selectedCardParticipant.noHp || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Catatan / Ketentuan Kehadiran */}
                <div className="mt-3 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-[10px] text-amber-900 leading-relaxed">
                  <p className="font-bold mb-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
                    <span>Ketentuan Kehadiran:</span>
                  </p>
                  <p>&bull; Harap hadir di lokasi khitan 15 menit sebelum tindakan.</p>
                  <p>&bull; Tunjukkan kartu antrian ini ke meja registrasi khitan.</p>
                </div>

                {/* Footer Stempel / Pengesahan */}
                <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[10px] font-semibold text-slate-500">
                  Panitia Khitan Berkah &bull; RSU Muhammadiyah Babat
                </div>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCardParticipant(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadCardPdf(selectedCardParticipant)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#005d42] border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs active:scale-98 cursor-pointer"
                  title="Unduh Kartu Format A6 PDF Resmi"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF (A6)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintParticipantCard}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005d42] hover:bg-[#004a35] text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-98 cursor-pointer"
                  title="Cetak langsung kartu peserta (Ukuran Ringkas A6 / ID Card)"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Kartu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PRINT TEMPLATE: KHUSUS KARTU PESERTA KHITAN RINGKAS (A6 / ID CARD)     */}
      {/* Khusus diformat bersih & dicetak saat window.print() dijalankan           */}
      {/* ========================================================================= */}
      {selectedCardParticipant && (
        <div className="print-card-container w-full text-slate-900 bg-white p-2 font-sans">
          <div className="max-w-[105mm] mx-auto border-2 border-slate-800 rounded-2xl p-5 bg-white shadow-none">
            {/* Header Kop RSUMB */}
            <div className="flex items-center gap-3 border-b-2 border-[#005d42] pb-3 text-left">
              <img
                src="/logo-rsumb.png"
                alt="Logo RSUMB"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest leading-none">
                  RSU MUHAMMADIYAH BABAT
                </p>
                <h2 className="text-sm font-black text-[#005d42] uppercase tracking-tight mt-1 leading-tight">
                  KARTU PESERTA KHITAN JUMAT BERKAH
                </h2>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-none">
                  Jl. Raya Babat No. 184, Babat, Lamongan &bull; Telp. (0322) 451111
                </p>
              </div>
            </div>

            {/* Kotak Nomor Antrian Manual (Kosong dengan Garis Tepi Jelas) */}
            <div className="text-center my-3.5 bg-slate-50/80 border border-slate-300 rounded-xl p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 block">
                NOMOR ANTRIAN KEHADIRAN
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                (Diisi manual oleh petugas registrasi di lokasi)
              </span>

              {/* Kotak kosong dengan border jelas untuk tulis tangan / stempel */}
              <div className="my-2.5 mx-auto w-48 h-20 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center">
                <span className="text-xs text-slate-400 font-medium italic select-none">
                  [ Tulis Tangan / Stempel ]
                </span>
              </div>

              <span className="text-[11px] font-semibold text-slate-800 block">
                Jadwal: Jumat, {formatYMDToDMY(selectedCardParticipant.tanggalPelaksanaan)}
              </span>
            </div>

            {/* Detail Pasien */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-300 font-bold uppercase tracking-wider text-[11px] text-slate-700 flex justify-between items-center">
                <span>Data Identitas Peserta</span>
                <span className="text-[11px] font-semibold text-[#005d42] bg-white px-2 py-0.5 rounded border border-slate-300">
                  {selectedCardParticipant.kategori}
                </span>
              </div>

              <div className="p-3.5 space-y-2.5">
                {/* Nama Peserta: font-size: 16px / text-base, font-bold, text-slate-900 */}
                <div className="flex justify-between items-baseline gap-3 border-b border-slate-200 pb-2">
                  <span className="text-[13px] text-slate-500 shrink-0 font-normal">Nama Peserta:</span>
                  <span className="text-base font-bold text-slate-900 text-right leading-tight">
                    {selectedCardParticipant.namaPeserta}
                  </span>
                </div>

                {/* Umur: text-sm font-medium */}
                <div className="flex justify-between items-baseline gap-3 border-b border-slate-200 pb-2">
                  <span className="text-[13px] text-slate-500 shrink-0 font-normal">Umur:</span>
                  <span className="text-sm font-medium text-slate-900 text-right">
                    {selectedCardParticipant.umur} Tahun
                  </span>
                </div>

                {/* Tanggal Lahir */}
                <div className="flex justify-between items-baseline gap-3 border-b border-slate-200 pb-2">
                  <span className="text-[13px] text-slate-500 shrink-0 font-normal">Tanggal Lahir:</span>
                  <span className="text-sm font-medium text-slate-900 text-right">
                    {selectedCardParticipant.tanggalLahir ? formatYMDToDMY(selectedCardParticipant.tanggalLahir) : '-'}
                  </span>
                </div>

                {/* Nama Orang Tua / Wali */}
                <div className="flex justify-between items-baseline gap-3 border-b border-slate-200 pb-2">
                  <span className="text-[13px] text-slate-500 shrink-0 font-normal">Nama Orang Tua / Wali:</span>
                  <span className="text-sm font-medium text-slate-900 text-right">
                    {selectedCardParticipant.namaWali || '-'}
                  </span>
                </div>

                {/* Alamat Pasien */}
                <div className="flex justify-between items-baseline gap-3 border-b border-slate-200 pb-2">
                  <span className="text-[13px] text-slate-500 shrink-0 font-normal">Alamat:</span>
                  <span className="text-sm font-medium text-slate-900 text-right max-w-[210px] leading-snug">
                    {selectedCardParticipant.alamat || '-'}
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-between items-baseline gap-3 border-b border-slate-200 pb-2">
                  <span className="text-[13px] text-slate-500 shrink-0 font-normal">Status:</span>
                  <span className="text-sm font-medium text-slate-900 text-right">
                    {selectedCardParticipant.status} ({selectedCardParticipant.kategori})
                  </span>
                </div>

                {/* Tanggal Pelaksanaan Khitan */}
                <div className="flex justify-between items-baseline gap-3 border-b border-slate-200 pb-2">
                  <span className="text-[13px] text-slate-500 shrink-0 font-normal">Tgl Pelaksanaan Khitan:</span>
                  <span className="text-sm font-medium text-[#005d42] text-right">
                    Jumat, {formatYMDToDMY(selectedCardParticipant.tanggalPelaksanaan)}
                  </span>
                </div>

                {/* No. Kontak / HP */}
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-[13px] text-slate-500 shrink-0 font-normal">No. Kontak / HP:</span>
                  <span className="text-sm font-medium font-mono text-slate-900 text-right">
                    {selectedCardParticipant.noHp || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan / Panduan */}
            <div className="mt-3.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 leading-snug">
              <p className="font-bold mb-0.5">Ketentuan Kehadiran:</p>
              <p>1. Tunjukkan kartu peserta ini ke meja registrasi khitan di RSUMB.</p>
              <p>2. Harap hadir 15 menit sebelum waktu tindakan dimulai.</p>
            </div>

            <div className="mt-3.5 text-center text-[10px] font-bold text-slate-500 border-t border-slate-200 pt-2">
              Panitia Khitan Berkah RSU Muhammadiyah Babat
            </div>
          </div>
        </div>
      )}

      {/* Modal Generator Surat Kontrol Post-Khitan & WhatsApp Edukasi */}
      <KhitanPostControlModal
        isOpen={isControlModalOpen}
        onClose={() => {
          setIsControlModalOpen(false);
          setSelectedControlParticipant(null);
        }}
        initialParticipant={selectedControlParticipant}
        allParticipants={participants}
        onUpdateParticipant={onUpdateParticipant}
        showToast={showToast}
      />
    </div>
  );
};
