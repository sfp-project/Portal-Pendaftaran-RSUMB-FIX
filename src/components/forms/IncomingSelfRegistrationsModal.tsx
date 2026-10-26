import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Trash2,
  Printer,
  Search,
  CheckCircle2,
  Phone,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  FilterX
} from 'lucide-react';
import { PatientSelfRegistrationItem } from '../../types';
import {
  subscribePatientSelfRegistrations,
  deletePatientSelfRegistrationDoc,
  markAllSelfRegistrationsAsRead
} from '../../services/firestoreSync';

interface IncomingSelfRegistrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintPatientSlip: (item: PatientSelfRegistrationItem) => void;
  showToast?: (message: string) => void;
}

export const IncomingSelfRegistrationsModal: React.FC<IncomingSelfRegistrationsModalProps> = ({
  isOpen,
  onClose,
  onPrintPatientSlip,
  showToast
}) => {
  const [items, setItems] = useState<PatientSelfRegistrationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Baru' | 'Lama'>('all');
  const [filterBayar, setFilterBayar] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inModalToast, setInModalToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Begitu modal dibuka oleh petugas admisi, ubah status notifikasi menjadi "sudah dibaca" (read)
  // dan reset indikator lonceng / kedipan seketika
  useEffect(() => {
    if (isOpen) {
      markAllSelfRegistrationsAsRead();
      window.dispatchEvent(new CustomEvent('rsumb_modal_incoming_scan_qr_opened'));
    }
  }, [isOpen]);

  // Subscribe real-time Firestore & LocalStorage fallback
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribePatientSelfRegistrations((list) => {
      setItems(list);
    });
    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Auto-dismiss in-modal toast
  useEffect(() => {
    if (!inModalToast) return;
    const timer = setTimeout(() => {
      setInModalToast(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [inModalToast]);

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchTerm.trim() ||
        item.namaPasien.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (item.nik && item.nik.includes(searchTerm.trim())) ||
        item.noHp.includes(searchTerm.trim()) ||
        item.alamat.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchStatus = filterStatus === 'all' || item.statusPasien === filterStatus;

      let matchBayar = true;
      if (filterBayar !== 'all') {
        const itemBayarLower = (item.jenisPembayaran || '').toLowerCase();
        if (filterBayar === 'BPJS Kesehatan') {
          matchBayar = itemBayarLower.includes('bpjs');
        } else if (filterBayar === 'UMUM') {
          matchBayar = itemBayarLower.includes('umum') || itemBayarLower.includes('mandiri');
        } else if (filterBayar === 'Asuransi Swasta') {
          matchBayar = itemBayarLower.includes('asuransi') || itemBayarLower.includes('swasta');
        } else {
          matchBayar = item.jenisPembayaran === filterBayar;
        }
      }

      return matchSearch && matchStatus && matchBayar;
    });
  }, [items, searchTerm, filterStatus, filterBayar]);

  const hasActiveFilters = searchTerm.trim() !== '' || filterStatus !== 'all' || filterBayar !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterBayar('all');
  };

  // 1. HANDLER SALIN TEKS SIMRS
  const handleCopySimrs = (item: PatientSelfRegistrationItem) => {
    const text = `=== DATA PENDAFTARAN PASIEN (RSU MUHAMMADIYAH BABAT) ===
Status Pasien    : Pasien ${item.statusPasien}
Nama Lengkap     : ${item.namaPasien}
NIK              : ${item.nik || '-'}
Tempat/Tgl Lahir : ${item.tempatLahir ? `${item.tempatLahir}, ` : ''}${item.tanggalLahir || '-'}
Jenis Kelamin    : ${item.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
Alamat Lengkap   : ${item.alamat}
No. HP / WA      : ${item.noHp}
Penanggung Jawab : ${item.namaPenanggungJawab || '-'} (${item.hubunganKeluarga || '-'})
Jenis Pembayaran : ${item.jenisPembayaran}
Waktu Registrasi : ${item.waktuDaftar}`;

    try {
      navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setInModalToast('Data Berhasil Disalin!');
      if (showToast) {
        showToast('Data Berhasil Disalin!');
      }
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // 2. HANDLER HAPUS DATA PASIEN (IKON TEMPAT SAMPAH)
  const handleDeletePatient = async (patientId: string) => {
    const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus data pasien ini dari daftar?');
    if (!isConfirmed) return;

    try {
      setDeletingId(patientId);

      // Reaktif seketika: perbarui state utama langsung sehingga kartu pasien seketika hilang dari UI
      setItems((prevItems) => prevItems.filter((item) => item.id !== patientId));

      // Bersihkan data dari penyimpanan lokal (LocalStorage) & database Firestore
      await deletePatientSelfRegistrationDoc(patientId);

      setInModalToast('Data pasien berhasil dihapus dari daftar.');
      if (showToast) {
        showToast('Data pendaftaran pasien berhasil dihapus dari sistem.');
      }
    } catch (error) {
      console.error('Gagal menghapus data pasien:', error);
      alert('Gagal menghapus data pasien. Silakan coba lagi.');
    } finally {
      setDeletingId(null);
    }
  };

  // 3. HANDLER HUBUNGI WHATSAPP
  const handleOpenWhatsApp = (noHp: string, nama: string) => {
    let clean = (noHp || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }

    const message = encodeURIComponent(
      `Assalamualaikum Wr. Wb. Yth. Bapak/Ibu ${nama},\n\nData pendaftaran mandiri Anda telah kami terima di Loket Admisi RSU Muhammadiyah Babat. Silakan langsung menuju ke loket admisi pendaftaran untuk konfirmasi dan pengambilan nomor antrean poliklinik.\n\nTerima kasih.\n_RSU Muhammadiyah Babat - Pelayanan Cepat & Islami_`
    );

    window.open(`https://wa.me/${clean}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto relative">
        {/* Floating Toast Notification */}
        {inModalToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 border border-emerald-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{inModalToast}</span>
          </div>
        )}

        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center relative shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 animate-ping" />
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                  Data Masuk Scan QR Pasien (Real-Time)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                  {hasActiveFilters && filteredItems.length !== items.length
                    ? `${filteredItems.length} dari ${items.length} Data Tersedia`
                    : `${items.length} Data Tersedia`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pendaftaran mandiri yang diisi langsung oleh pasien / keluarga lewat scan QR Code meja admisi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl cursor-pointer transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pasien, NIK, No. HP, atau alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Status Pasien */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Status (Baru/Lama)</option>
              <option value="Baru">Pasien Baru</option>
              <option value="Lama">Pasien Lama</option>
            </select>

            {/* Filter Jenis Bayar */}
            <select
              value={filterBayar}
              onChange={(e) => setFilterBayar(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="BPJS Kesehatan">BPJS Kesehatan</option>
              <option value="UMUM">UMUM / Mandiri</option>
              <option value="Asuransi Swasta">Asuransi Swasta</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset semua filter pencarian"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 bg-slate-100/60">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2.5 bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                {items.length === 0 ? 'Belum Ada Data Masuk Terbaru' : 'Tidak Ada Data yang Sesuai Filter'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {items.length === 0
                  ? 'Data akan otomatis muncul secara real-time di sini begitu pasien menyelesaikan pengisian formulir melalui pemindaian QR Code di meja loket admisi.'
                  : 'Coba ubah kata kunci pencarian atau reset opsi filter status & pembayaran di atas.'}
              </p>
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    deletingId === item.id ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  {/* Kolom Informasi Pasien */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          item.statusPasien === 'Baru'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        Pasien {item.statusPasien}
                      </span>

                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.jenisPembayaran}
                      </span>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.waktuDaftar}</span>
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">
                        {item.namaPasien}
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        ({item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">NIK:</span>{' '}
                        <strong className="text-slate-800 font-mono">{item.nik || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">No. HP / WA:</span>{' '}
                        <strong className="text-slate-800 font-mono">{item.noHp}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Tempat, Tgl Lahir:</span>{' '}
                        <span className="text-slate-800 font-medium">
                          {item.tempatLahir ? `${item.tempatLahir}, ` : ''}
                          {item.tanggalLahir || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Penanggung Jawab:</span>{' '}
                        <span className="text-slate-800 font-medium">
                          {item.namaPenanggungJawab || '-'} ({item.hubunganKeluarga || '-'})
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400">Alamat Lengkap:</span>{' '}
                        <span className="text-slate-800 font-medium">{item.alamat}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Tombol Aksi Lengkap */}
                  <div className="flex sm:flex-col md:flex-row items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* Tombol Salin Teks SIMRS */}
                    <button
                      type="button"
                      onClick={() => handleCopySimrs(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                        copiedId === item.id
                          ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                      title="Salin ringkasan data pasien ke clipboard (Nama, TTL, Alamat, No. HP, Pembayaran)"
                    >
                      {copiedId === item.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{copiedId === item.id ? 'Tersalin!' : 'Salin Teks SIMRS'}</span>
                    </button>

                    {/* Tombol Cetak Slip 1/3 F4 */}
                    <button
                      type="button"
                      onClick={() => onPrintPatientSlip(item)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm"
                      title="Buka pratinjau dan cetak formulir slip 1/3 F4 khusus pasien ini"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Cetak Slip 1/3 F4</span>
                    </button>

                    {/* Tombol Hubungi WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(item.noHp, item.namaPasien)}
                      className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 hover:border-teal-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                      title="Kirim pesan konfirmasi WhatsApp ke nomor pasien"
                    >
                      <MessageSquare className="w-4 h-4 text-teal-700" />
                    </button>

                    {/* Tombol Hapus (Ikon Tempat Sampah) */}
                    <button
                      type="button"
                      onClick={() => handleDeletePatient(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                      title="Hapus data pasien ini dari daftar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sinkronisasi otomatis dengan database Firestore & LocalStorage RSUMB</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
