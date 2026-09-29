import React from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Briefcase,
  Building2,
  FileText,
  Plus
} from 'lucide-react';
import { LetterCategory, LetterType } from '../../types/letterTypes';
import { getLetterTypeLabel } from '../../data/letterData';

interface CategoryTabConfig {
  id: LetterCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  templates: { type: LetterType; title: string; badge: string; desc: string }[];
}

export const CATEGORY_CONFIGS: CategoryTabConfig[] = [
  {
    id: 'medis',
    label: 'Surat Medis',
    icon: Stethoscope,
    description: 'Penerbitan surat keterangan medis resmi dokter, skrining narkoba 6 parameter, dan klaim AdMedika.',
    templates: [
      {
        type: 'SKBN',
        title: 'Surat Bebas Narkoba (SKBN)',
        badge: 'Uji 6 Parameter',
        desc: 'Amphetamine, Methamphetamine, Cocaine, THC, Morphine, Benzodiazepine (Default: Negatif)'
      },
      {
        type: 'ADMEDIKA',
        title: 'Klaim & Resume AdMedika RJ/Gigi',
        badge: 'Korporat / Asuransi',
        desc: 'Resume medis rawat jalan & gigi, kode ICD-10, tindakan, dan rincian obat penjamin AdMedika'
      },
      {
        type: 'SEHAT',
        title: 'Surat Keterangan Sehat',
        badge: 'MCU Umum',
        desc: 'Pemeriksaan fisik diagnostik, tanda vital (TD/TB/BB), tes buta warna & status kebugaran'
      },
      {
        type: 'DOKTER',
        title: 'Surat Keterangan Sakit (Dokter)',
        badge: 'Izin Istirahat Medis',
        desc: 'Keterangan diagnosis medis DPJP & anjuran istirahat rawat jalan/sakit pasien'
      }
    ]
  },
  {
    id: 'penjaminan',
    label: 'Penjaminan & Kuasa',
    icon: ShieldCheck,
    description: 'Edukasi persyaratan tindakan operasi lanjutan dan surat kuasa klaim santunan Jasa Raharja.',
    templates: [
      {
        type: 'EDUKASI_OP2',
        title: 'Edukasi Operasi Kedua (Jasa Raharja)',
        badge: 'Kecelakaan Lalin',
        desc: 'Checklist syarat penjaminan JR max 20jt, rujukan Faskes 1, LP Polisi, dan kwitansi RS 1'
      },
      {
        type: 'KUASA_JR',
        title: 'Surat Kuasa Santunan Jasa Raharja',
        badge: 'Materai 10.000',
        desc: 'Kuasa klaim biaya perawatan RSUMB, terbilang otomatis, dan penandatanganan Pihak I & II'
      }
    ]
  },
  {
    id: 'bpjstk',
    label: 'BPJS Ketenagakerjaan',
    icon: Briefcase,
    description: 'Formulir resmi pelaporan, keterangan medis dokter, dan penyelesaian kecelakaan kerja (KK1-KK3).',
    templates: [
      {
        type: 'BPJS_KK1',
        title: 'Form KK1 - Laporan Kecelakaan Tahap I',
        badge: 'Pelaporan Awal',
        desc: 'Kronologi insiden kerja, lokasi, jam kejadian, NPP perusahaan, dan rincian cidera tubuh'
      },
      {
        type: 'BPJS_KK2',
        title: 'Form KK2 - Keterangan Dokter Tahap II',
        badge: 'Pemeriksaan Medis',
        desc: 'Diagnosis DPJP, tindakan, lama perawatan, dan status Sementara Tidak Mampu Bekerja (STMB)'
      },
      {
        type: 'BPJS_KK3',
        title: 'Form KK3 - Laporan Kasus Tahap III',
        badge: 'Penyelesaian Klaim',
        desc: 'Evaluasi akhir: sembuh tanpa cacat, cacat fungsi, atau tanggal kembali bekerja'
      }
    ]
  },
  {
    id: 'admisi',
    label: 'Admisi & Rawat Inap',
    icon: Building2,
    description: 'Administrasi kamar inap, surat pernyataan titip kelas saat kamar penuh, dan kendala biometrik sidik jari.',
    templates: [
      {
        type: 'TITIP_KELAS',
        title: 'Pernyataan Titip Kelas Rawat Inap',
        badge: 'Kamar Penuh',
        desc: 'Pernyataan penempatan sementara ruang inap lebih tinggi saat hak kelas BPJS penuh'
      },
      {
        type: 'PESAN_KAMAR',
        title: 'Formulir Pemesanan Kamar Inap',
        badge: 'Reservasi Kamar',
        desc: 'Pemesanan kamar VVIP/VIP/Kelas 1-3/HCU/ICU/NICU/ODC lengkap tarif & fasilitas'
      },
      {
        type: 'GAGAL_FINGERPRINT',
        title: 'Pernyataan Gagal Fingerprint BPJS',
        badge: 'Kendala Biometrik',
        desc: 'Pernyataan kendala sidik jari (sensor aus/darurat/rusak) dengan penanggung jawab klaim'
      }
    ]
  }
];

interface LetterCategoryTabsProps {
  activeCategory: LetterCategory;
  onSelectCategory: (cat: LetterCategory) => void;
  categoryCounts: Record<LetterCategory, number>;
  onOpenCreateWithTemplate: (type: LetterType) => void;
}

export const LetterCategoryTabs: React.FC<LetterCategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
  onOpenCreateWithTemplate
}) => {
  const currentConfig = CATEGORY_CONFIGS.find((c) => c.id === activeCategory) || CATEGORY_CONFIGS[0];

  return (
    <div className="flex flex-col gap-5 print:hidden no-print">
      {/* 4 Main Sub-Tabs Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {CATEGORY_CONFIGS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            const count = categoryCounts[tab.id] || 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategory(tab.id)}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-[#005d42] text-white shadow-md shadow-emerald-900/15'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-[#005d42] shadow-xs'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-semibold leading-tight ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                      Kategori
                    </p>
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {tab.label}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Template Launcher Cards for Active Sub-Tab */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-slate-50 border border-emerald-100 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Template Cepat Sub-Tab: {currentConfig.label}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentConfig.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {currentConfig.templates.map((tpl) => (
            <div
              key={tpl.type}
              className="bg-white p-3.5 rounded-xl border border-emerald-100/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {tpl.badge}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-400">
                    {tpl.type}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#005d42] transition-colors line-clamp-1">
                  {tpl.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {tpl.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreateWithTemplate(tpl.type)}
                className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-50 hover:bg-[#005d42] text-emerald-800 hover:text-white rounded-lg text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Form Ini</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
