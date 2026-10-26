import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface PatientFormRegistrationData {
  nama?: string;
  nik?: string;
  noHp?: string;
  tglLahir?: string;
  alamat?: string;
  penanggungJawab?: string;
  hubungan?: string;
  jenisKelamin?: 'L' | 'P';
  statusPasien?: 'Baru' | 'Lama';
  jenisPembayaran?: string;
}

interface PrintableRegistrationFormProps {
  multiple?: boolean;
  patientData?: PatientFormRegistrationData;
}

export const PrintableRegistrationForm: React.FC<PrintableRegistrationFormProps> = ({
  multiple = false,
  patientData
}) => {
  const qrString = patientData && (patientData.nama || patientData.nik || patientData.noHp)
    ? `RSUMB|NAMA:${patientData.nama || '-'}|NIK:${patientData.nik || '-'}|HP:${patientData.noHp || '-'}|STATUS:${patientData.statusPasien || 'BARU'}|BAYAR:${patientData.jenisPembayaran || 'BPJS'}`
    : 'RSUMB|REG-MANUAL|PASIEN-BARU|PORTAL-ADMISI';

  // Komponen satu lembar slip 1/3 F4
  const renderSingleSlip = (index: number = 0) => (
    <div
      key={index}
      className="registration-slip-box"
      style={{
        width: '100%',
        maxWidth: '205mm',
        height: '101mm',
        maxHeight: '102mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
        fontSize: '9pt',
        lineHeight: 1.25,
        padding: '5mm 6mm',
        boxSizing: 'border-box',
        border: '1px solid #111111',
        borderRadius: '3px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      {/* 1. KOP SURAT RATA TENGAH & QR CODE DI KANAN ATAS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          {/* Sisi Kiri / Spacer Penyeimbang agar Kop tetap presisi di tengah */}
          <div style={{ width: '56px', flexShrink: 0 }} />

          {/* Kop Surat Bersih Rata Tengah */}
          <div style={{ textAlign: 'center', flex: 1, paddingBottom: '2px' }}>
            <div
              style={{
                fontWeight: 900,
                fontSize: '11.5pt',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: '#000000',
                lineHeight: 1.15
              }}
            >
              RSU MUHAMMADIYAH BABAT
            </div>
            <div style={{ fontSize: '7.5pt', color: '#222222', marginTop: '1px' }}>
              Jl. Raya Babat-Surabaya KM. 4, Babat, Lamongan &bull; Telp: (0322) 451125 / 0857-8407-2740
            </div>
            <div style={{ fontSize: '7pt', color: '#444444' }}>
              Email: rsumbabat@yahoo.co.id &bull; Layanan 24 Jam
            </div>
          </div>

          {/* QR Code Unik di Pojok Kanan Atas (Gunakan SVG agar tajam & tidak hilang saat window.print) */}
          <div
            style={{
              width: '56px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #222',
              padding: '2px',
              backgroundColor: '#fff',
              borderRadius: '2px'
            }}
          >
            <QRCodeSVG value={qrString} size={42} level="M" />
            <span style={{ fontSize: '5.5pt', fontWeight: 800, color: '#000', marginTop: '1px', letterSpacing: '0.2px' }}>
              SCAN ADMISI
            </span>
          </div>
        </div>

        {/* Garis Pembatas Kop Surat */}
        <div style={{ borderBottom: '2px solid #000000', marginTop: '3px', marginBottom: '4px' }} />

        {/* Judul Formulir & Status Pasien */}
        <div style={{ textAlign: 'center', marginBottom: '5px' }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: '9.5pt',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: '#000000'
            }}
          >
            FORMULIR PENDAFTARAN PASIEN (TANPA IDENTITAS)
          </div>
          <div style={{ fontSize: '8pt', fontWeight: 600, color: '#111111', marginTop: '1px' }}>
            Status Pasien : &nbsp;&nbsp;&nbsp;
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '1.2px solid #000',
                verticalAlign: '-2px',
                marginRight: '4px',
                textAlign: 'center',
                lineHeight: '10px',
                fontSize: '8pt',
                fontWeight: 900
              }}
            >
              {patientData?.statusPasien === 'Baru' ? '✓' : ''}
            </span>
            Baru &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '1.2px solid #000',
                verticalAlign: '-2px',
                marginRight: '4px',
                textAlign: 'center',
                lineHeight: '10px',
                fontSize: '8pt',
                fontWeight: 900
              }}
            >
              {patientData?.statusPasien === 'Lama' ? '✓' : ''}
            </span>
            Lama
          </div>
        </div>
      </div>

      {/* 2. TABEL STRUKTUR ISIAN BERGARIS TITIK-TITIK / LURUS TEMPAT PENA */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '8.5pt',
          color: '#000000',
          tableLayout: 'fixed'
        }}
      >
        <tbody>
          {/* Baris 1: Nama Pasien [Garis] | NIK (Jika Ada): [Garis] */}
          <tr>
            <td style={{ width: '50%', padding: '2.5px 6px 2.5px 0', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', width: '92px' }}>Nama Pasien</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #333333',
                    minHeight: '16px',
                    paddingLeft: '4px',
                    fontWeight: 600,
                    fontSize: '8.5pt'
                  }}
                >
                  {patientData?.nama || ''}
                </div>
              </div>
            </td>
            <td style={{ width: '50%', padding: '2.5px 0 2.5px 6px', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', width: '96px' }}>NIK (Jika Ada)</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #333333',
                    minHeight: '16px',
                    paddingLeft: '4px',
                    fontWeight: 600,
                    fontSize: '8.5pt'
                  }}
                >
                  {patientData?.nik || ''}
                </div>
              </div>
            </td>
          </tr>

          {/* Baris 2: Tempat/Tgl Lahir: [Garis] | Jenis Kelamin : L/P */}
          <tr>
            <td style={{ width: '50%', padding: '2.5px 6px 2.5px 0', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', width: '92px' }}>Tempat/Tgl Lahir</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #333333',
                    minHeight: '16px',
                    paddingLeft: '4px',
                    fontSize: '8.5pt'
                  }}
                >
                  {patientData?.tglLahir || ''}
                </div>
              </div>
            </td>
            <td style={{ width: '50%', padding: '2.5px 0 2.5px 6px', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', width: '96px' }}>Jenis Kelamin</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '1.2px solid #000',
                        textAlign: 'center',
                        lineHeight: '10px',
                        fontSize: '8pt',
                        fontWeight: 900
                      }}
                    >
                      {patientData?.jenisKelamin === 'L' ? '✓' : ''}
                    </span>
                    <span>Laki-laki (L)</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '1.2px solid #000',
                        textAlign: 'center',
                        lineHeight: '10px',
                        fontSize: '8pt',
                        fontWeight: 900
                      }}
                    >
                      {patientData?.jenisKelamin === 'P' ? '✓' : ''}
                    </span>
                    <span>Perempuan (P)</span>
                  </label>
                </div>
              </div>
            </td>
          </tr>

          {/* Baris 3: Alamat Lengkap (RT/RW/Desa/Kec/Kab): [Garis Penuh] */}
          <tr>
            <td colSpan={2} style={{ padding: '2.5px 0', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Alamat Lengkap (RT/RW/Desa/Kec/Kab)</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #333333',
                    minHeight: '16px',
                    paddingLeft: '4px',
                    fontWeight: 600,
                    fontSize: '8.5pt'
                  }}
                >
                  {patientData?.alamat || ''}
                </div>
              </div>
            </td>
          </tr>

          {/* Baris 4: No. HP / WhatsApp: [Garis] */}
          <tr>
            <td colSpan={2} style={{ padding: '2.5px 0', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', width: '135px' }}>No. HP / WhatsApp</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #333333',
                    minHeight: '16px',
                    paddingLeft: '4px',
                    fontWeight: 600,
                    fontSize: '8.5pt'
                  }}
                >
                  {patientData?.noHp || ''}
                </div>
              </div>
            </td>
          </tr>

          {/* Baris 5: Nama Penanggung Jawab: [Garis] | Hubungan Keluarga: [Garis] */}
          <tr>
            <td style={{ width: '50%', padding: '2.5px 6px 2.5px 0', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', width: '135px' }}>Nama Penanggung Jawab</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #333333',
                    minHeight: '16px',
                    paddingLeft: '4px',
                    fontWeight: 600,
                    fontSize: '8.5pt'
                  }}
                >
                  {patientData?.penanggungJawab || ''}
                </div>
              </div>
            </td>
            <td style={{ width: '50%', padding: '2.5px 0 2.5px 6px', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', width: '110px' }}>Hubungan Keluarga</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #333333',
                    minHeight: '16px',
                    paddingLeft: '4px',
                    fontWeight: 600,
                    fontSize: '8.5pt'
                  }}
                >
                  {patientData?.hubungan || ''}
                </div>
              </div>
            </td>
          </tr>

          {/* Baris 6: Jenis Pembayaran: [ ] BPJS  [ ] UMUM */}
          <tr>
            <td colSpan={2} style={{ padding: '3px 0 1px 0', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', width: '135px' }}>Jenis Pembayaran</span>
                <span style={{ margin: '0 4px', fontWeight: 700 }}>:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '1.2px solid #000',
                        textAlign: 'center',
                        lineHeight: '10px',
                        fontSize: '8pt',
                        fontWeight: 900
                      }}
                    >
                      {patientData?.jenisPembayaran?.toLowerCase().includes('bpjs') ? '✓' : ''}
                    </span>
                    <span style={{ fontWeight: 600 }}>BPJS Kesehatan</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '1.2px solid #000',
                        textAlign: 'center',
                        lineHeight: '10px',
                        fontSize: '8pt',
                        fontWeight: 900
                      }}
                    >
                      {patientData?.jenisPembayaran?.toLowerCase().includes('umum') ? '✓' : ''}
                    </span>
                    <span style={{ fontWeight: 600 }}>UMUM / Mandiri</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '1.2px solid #000',
                        textAlign: 'center',
                        lineHeight: '10px',
                        fontSize: '8pt',
                        fontWeight: 900
                      }}
                    >
                      {patientData?.jenisPembayaran?.toLowerCase().includes('asuransi') ? '✓' : ''}
                    </span>
                    <span style={{ fontWeight: 600 }}>Asuransi Lain</span>
                  </label>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Catatan Kaki Slip Ringkas */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #777777',
          paddingTop: '2px',
          marginTop: '3px',
          fontSize: '6.5pt',
          color: '#555555'
        }}
      >
        <span>* Formulir fisik khusus pendaftaran pasien belum ber-KTP/BPJS fisik untuk arsip loket admisi RSUMB</span>
        <span>Ukuran: 1/3 F4 (215 x 110 mm)</span>
      </div>
    </div>
  );

  return (
    <div id="patientRegistrationPaper" style={{ width: '100%', maxWidth: '215mm', margin: '0 auto' }}>
      {multiple ? (
        <div className="print-3-in-1-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[0, 1, 2].map((idx) => (
            <React.Fragment key={idx}>
              <div className="print-3-in-1" style={{ pageBreakInside: 'avoid', marginBottom: '0' }}>
                {renderSingleSlip(idx)}
              </div>
              {idx < 2 && (
                <div
                  className="cut-line-indicator"
                  style={{
                    borderTop: '1.5px dashed #444444',
                    margin: '3mm 0',
                    position: 'relative',
                    textAlign: 'center',
                    height: '1px'
                  }}
                >
                  <span
                    style={{
                      position: 'relative',
                      top: '-8px',
                      backgroundColor: '#ffffff',
                      padding: '0 8px',
                      fontSize: '6.5pt',
                      color: '#444444',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}
                  >
                    ✂ Gunting Disini (Batas Slip 1/3 F4) ✂
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div style={{ margin: '0 auto' }}>
          {renderSingleSlip(0)}
        </div>
      )}
    </div>
  );
};
