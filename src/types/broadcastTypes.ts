export interface BroadcastPatient {
  id: string;
  namaPasien: string;
  nomorWhatsApp: string; // Sanitized to 628... or 08...
  nomorWhatsAppClean: string; // digits only for wa.me link (e.g. 6281333618808)
  poliklinik: string;
  dokter: string;
  tanggalKunjungan?: string;
  selected: boolean;
  statusKirim: 'Belum Dikirim' | 'Terkirim' | 'Sedang Mengirim' | 'Gagal / Dilewati';
  waktuKirim?: string;
  rawText?: string;
}

export interface BroadcastTemplatePreset {
  id: string;
  title: string;
  description: string;
  content: string;
}
