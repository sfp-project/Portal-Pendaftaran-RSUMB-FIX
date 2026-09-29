import React from 'react';
import { DoctorPosterItem, PosterDoctorData } from './DoctorPosterItem';
import { RSUMB_LOGO_BASE64 } from '../../assets/logoRsumbBase64';
import {
  Phone,
  MapPin,
  Instagram,
  HeartHandshake,
  Smartphone,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  ShieldCheck
} from 'lucide-react';

interface DailySchedulePosterProps {
  doctors: PosterDoctorData[];
  dateString: string; // e.g. "Rabu, 9 September 2026"
  isInteractive?: boolean;
  onToggleStatus?: (id: string) => void;
  scale?: number;
}

export const DailySchedulePoster: React.FC<DailySchedulePosterProps> = ({
  doctors,
  dateString,
  isInteractive = false,
  onToggleStatus
}) => {
  return (
    <div
      id="poster-jadwal-container"
      className="bg-white text-slate-900 mx-auto relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all"
      style={{
        width: '840px',
        minHeight: '1188px', // A4 proportional aspect ratio 1 : 1.414
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* ========================================================
          1. HEADER ATAS (KOP RESMI POSTER RSUMB)
      ======================================================== */}
      <header className="relative bg-gradient-to-b from-slate-50 via-white to-white px-8 pt-7 pb-4 border-b-2 border-[#00A859]/30">
        {/* Top bar: Logos & Accreditation Badges */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo RSU Muhammadiyah Babat di kiri */}
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md border-2 border-[#00A859] p-0.5 shrink-0 flex items-center justify-center">
              <img
                src={RSUMB_LOGO_BASE64}
                alt="Logo RSU Muhammadiyah Babat"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#00A859] tracking-wider uppercase">
                <span>Majelis Pembina Kesehatan Umum</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-[#0A2540] leading-tight">
                RSU MUHAMMADIYAH BABAT
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Komitmen Melayani Sepenuh Hati • Akreditasi Paripurna KARS
              </p>
            </div>
          </div>

          {/* Banner Akreditasi & Logo Jaringan: ISTIMEWA, PARIPURNA, HALAL INDONESIA, MUHAMMADIYAH */}
          <div className="flex items-center gap-2">
            {/* Badge PARIPURNA (KARS Bintang 5) */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg bg-gradient-to-b from-amber-50 to-amber-100/80 border border-amber-300 shadow-2xs">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[9px]">★</span>
                ))}
              </div>
              <span className="text-[9px] font-black text-amber-900 tracking-wider">
                PARIPURNA
              </span>
              <span className="text-[7px] font-bold text-amber-700">KARS BINTANG 5</span>
            </div>

            {/* Badge HALAL INDONESIA */}
            <div className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span className="text-[8px] font-black text-purple-900 tracking-tighter mt-0.5">
                HALAL
              </span>
              <span className="text-[6.5px] font-bold text-purple-600">INDONESIA</span>
            </div>

            {/* Badge MUHAMMADIYAH */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 shadow-2xs">
              <span className="text-emerald-700 text-xs">☀️</span>
              <span className="text-[8px] font-black text-emerald-950 tracking-tighter">
                MUHAMMADIYAH
              </span>
              <span className="text-[6.5px] font-bold text-emerald-700">BERSINAR</span>
            </div>

            {/* Badge ISTIMEWA */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#005d42] to-[#00A859] text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[8px] font-black tracking-wider mt-0.5">
                ISTIMEWA
              </span>
              <span className="text-[6.5px] text-emerald-100 font-semibold">UNGGUL</span>
            </div>
          </div>
        </div>

        {/* Judul Utama Poster */}
        <div className="mt-5 text-center">
          <h1 className="text-2xl font-black text-[#0A2540] tracking-tight uppercase">
            Jadwal Poliklinik Rawat Jalan
          </h1>
          <p className="text-xs font-semibold text-[#00A859] uppercase tracking-wider mt-0.5">
            RSU Muhammadiyah Babat - Pelayanan Dokter Spesialis
          </p>

          {/* Badge Tanggal Dinamis di Tengah Berkapsul Hijau */}
          <div className="mt-3 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-[#00A859] via-[#008f4c] to-[#00A859] text-white shadow-md border-2 border-white">
            <Calendar className="w-4 h-4 text-emerald-100" />
            <span className="text-sm font-extrabold tracking-wide uppercase">
              {dateString}
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. BAGIAN ISI LIST DOKTER (2 KOLOM GRID)
      ======================================================== */}
      <main className="flex-1 px-8 py-5">
        {doctors.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {doctors.map((doc) => (
              <DoctorPosterItem
                key={doc.id}
                doctor={doc}
                isInteractive={isInteractive}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-bold text-slate-600">Tidak ada jadwal dokter untuk hari ini.</p>
            <p className="text-xs text-slate-400 mt-1">Pilih hari lain atau tambahkan jadwal pada master dokter.</p>
          </div>
        )}

        {/* ========================================================
            3. WIDGET PENDAFTARAN & ILUSTRASI (KANAN BAWAH / BOTTOM BAR)
        ======================================================== */}
        <div className="mt-5 grid grid-cols-12 gap-3.5 items-stretch">
          {/* Box Info Pendaftaran WhatsApp & Mobile JKN */}
          <div className="col-span-8 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 p-3.5 rounded-2xl border-2 border-[#00A859]/40 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#00A859] text-white flex items-center justify-center shadow-md shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#00A859] text-white">
                    WhatsApp Center
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Online 24 Jam
                  </span>
                </div>
                <h5 className="text-sm font-black text-slate-900 mt-0.5">
                  Pendaftaran Rawat Jalan: <span className="text-[#00A859] tracking-wider">0811-3222-440</span>
                </h5>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                  Ketik pesan: <span className="font-mono font-bold text-emerald-800">Daftar#Nama#Poli#Tgl</span> untuk reservasi mudah
                </p>
              </div>
            </div>

            {/* Logo & Info Mobile JKN BPJS */}
            <div className="shrink-0 text-right pr-2 border-l border-emerald-200 pl-4">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-900 text-white text-[9px] font-black">
                <span>📱 MOBILE JKN</span>
              </div>
              <p className="text-[9px] font-bold text-blue-900 mt-1">
                Daftar Antrean Faskes
              </p>
              <p className="text-[8px] text-slate-500">
                Bisa dari Rumah
              </p>
            </div>
          </div>

          {/* Slogan & Maklumat Singkat */}
          <div className="col-span-4 bg-gradient-to-br from-[#0A2540] to-[#1E3A8A] text-white p-3.5 rounded-2xl shadow-xs flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Maklumat Pasien</span>
            </div>
            <p className="text-[11px] font-bold text-slate-100 mt-1 leading-snug">
              Harap datang 30 menit sebelum jam praktik dimulai membawa KTP & Kartu BPJS/Asuransi.
            </p>
          </div>
        </div>
      </main>

      {/* ========================================================
          4. FOOTER BAWAH (BACKGROUND GEDUNG & KONTAK BIRU TUA)
      ======================================================== */}
      <footer className="relative mt-auto">
        {/* Ilustrasi Arsitektur Gedung Megah RSU Muhammadiyah Babat */}
        <div className="w-full h-16 relative overflow-hidden bg-gradient-to-t from-slate-200/90 via-slate-100/60 to-transparent flex items-end justify-center">
          <svg
            viewBox="0 0 840 70"
            className="w-full h-16 opacity-80"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Sky / Trees */}
            <path d="M0,70 L0,50 Q100,35 200,48 Q300,30 420,45 Q550,28 680,42 Q780,30 840,40 L840,70 Z" fill="#E2E8F0" />
            {/* Hospital Building Wing Left */}
            <rect x="70" y="24" width="130" height="46" rx="2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
            <rect x="85" y="30" width="16" height="12" rx="1" fill="#93C5FD" />
            <rect x="110" y="30" width="16" height="12" rx="1" fill="#93C5FD" />
            <rect x="135" y="30" width="16" height="12" rx="1" fill="#93C5FD" />
            <rect x="160" y="30" width="16" height="12" rx="1" fill="#93C5FD" />
            <rect x="85" y="46" width="16" height="12" rx="1" fill="#93C5FD" />
            <rect x="110" y="46" width="16" height="12" rx="1" fill="#93C5FD" />
            <rect x="135" y="46" width="16" height="12" rx="1" fill="#93C5FD" />
            <rect x="160" y="46" width="16" height="12" rx="1" fill="#93C5FD" />

            {/* Central Main Hospital Tower (RSUMB) */}
            <rect x="220" y="10" width="380" height="60" rx="3" fill="#F8FAFC" stroke="#005d42" strokeWidth="1.5" />
            {/* Green Hospital Accent Band */}
            <rect x="220" y="22" width="380" height="5" fill="#00A859" />
            {/* Hospital Cross / Emblem */}
            <circle cx="410" cy="16" r="5" fill="#005d42" />
            <path d="M410 13 L410 19 M407 16 L413 16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

            {/* Central Tower Windows Grid */}
            <g fill="#60A5FA" opacity="0.85">
              <rect x="240" y="31" width="22" height="10" rx="1" />
              <rect x="270" y="31" width="22" height="10" rx="1" />
              <rect x="300" y="31" width="22" height="10" rx="1" />
              <rect x="330" y="31" width="22" height="10" rx="1" />
              <rect x="360" y="31" width="22" height="10" rx="1" />
              <rect x="440" y="31" width="22" height="10" rx="1" />
              <rect x="470" y="31" width="22" height="10" rx="1" />
              <rect x="500" y="31" width="22" height="10" rx="1" />
              <rect x="530" y="31" width="22" height="10" rx="1" />
              <rect x="560" y="31" width="22" height="10" rx="1" />

              <rect x="240" y="45" width="22" height="10" rx="1" />
              <rect x="270" y="45" width="22" height="10" rx="1" />
              <rect x="300" y="45" width="22" height="10" rx="1" />
              <rect x="330" y="45" width="22" height="10" rx="1" />
              <rect x="360" y="45" width="22" height="10" rx="1" />
              <rect x="440" y="45" width="22" height="10" rx="1" />
              <rect x="470" y="45" width="22" height="10" rx="1" />
              <rect x="500" y="45" width="22" height="10" rx="1" />
              <rect x="530" y="45" width="22" height="10" rx="1" />
              <rect x="560" y="45" width="22" height="10" rx="1" />
            </g>

            {/* Main Entrance Canopy & Glass Lobby */}
            <polygon points="380,48 440,48 450,70 370,70" fill="#005d42" opacity="0.8" />
            <rect x="395" y="54" width="30" height="16" fill="#38BDF8" />

            {/* Right Wing */}
            <rect x="620" y="24" width="150" height="46" rx="2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
            <g fill="#93C5FD">
              <rect x="635" y="30" width="16" height="12" rx="1" />
              <rect x="660" y="30" width="16" height="12" rx="1" />
              <rect x="685" y="30" width="16" height="12" rx="1" />
              <rect x="710" y="30" width="16" height="12" rx="1" />
              <rect x="735" y="30" width="16" height="12" rx="1" />
              <rect x="635" y="46" width="16" height="12" rx="1" />
              <rect x="660" y="46" width="16" height="12" rx="1" />
              <rect x="685" y="46" width="16" height="12" rx="1" />
              <rect x="710" y="46" width="16" height="12" rx="1" />
              <rect x="735" y="46" width="16" height="12" rx="1" />
            </g>
          </svg>
        </div>

        {/* Baris Kontak Footer Biru Tua (#1E3A8A / #0A2540) */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#1E3A8A] to-[#0A2540] text-white px-8 py-3.5 border-t-2 border-amber-400">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Alamat */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-200">
                Jl. Raya Babat Surabaya Km. 04 Babat-Lamongan
              </span>
            </div>

            {/* No. Telp */}
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-white">
                (0322) 451125 / 0811-3222-440
              </span>
            </div>

            {/* Sosmed */}
            <div className="flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="font-bold text-white">
                @rsumbabat
              </span>
            </div>
          </div>

          {/* Slogan Resmi */}
          <div className="mt-2 pt-2 border-t border-blue-800/80 flex items-center justify-between text-[11px] text-blue-200">
            <span className="font-medium">
              Rumah Sakit Umum Muhammadiyah Babat - Pelayanan Islami & Terpercaya
            </span>
            <span className="font-black text-amber-300 tracking-wide uppercase">
              &quot;Melayani dengan Profesional, Santun dan Berdedikasi&quot;
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
