import { BroadcastPatient } from '../types/broadcastTypes';

/**
 * Format raw telephone string to WhatsApp clean numeric format (628...)
 */
export function sanitizeWhatsAppNumber(raw: string): { display: string; clean: string; isValid: boolean } {
  if (!raw) return { display: '', clean: '', isValid: false };

  // Remove whitespace, dashes, dots, parentheses
  const digitsOnly = raw.replace(/[^\d+]/g, '');

  let clean = '';
  if (digitsOnly.startsWith('+62')) {
    clean = digitsOnly.substring(1);
  } else if (digitsOnly.startsWith('62')) {
    clean = digitsOnly;
  } else if (digitsOnly.startsWith('08')) {
    clean = '62' + digitsOnly.substring(1);
  } else if (digitsOnly.startsWith('8')) {
    clean = '62' + digitsOnly;
  } else {
    clean = digitsOnly;
  }

  // Indonesian mobile numbers are usually 10-15 digits long
  const isValid = /^628\d{8,12}$/.test(clean);

  // Format display as readable 08xx-xxxx-xxxx
  let display = raw.trim();
  if (isValid) {
    const local = '0' + clean.substring(2);
    if (local.length >= 10) {
      display = `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`;
    } else {
      display = local;
    }
  }

  return { display, clean, isValid };
}

/**
 * Parses raw unformatted or semi-structured registration text into structured BroadcastPatient items.
 */
export function parsePatientRawText(rawText: string): BroadcastPatient[] {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.trim();

  // Determine splitting strategy:
  // 1. By custom divider (---, ===, ___)
  // 2. By numbered block (e.g. "1.", "2)", "Pasien 1:")
  // 3. By double newline (\n\s*\n)
  let blocks: string[] = [];

  if (/[=\-_]{3,}/.test(text)) {
    blocks = text.split(/[=\-_]{3,}/);
  } else if (/\n\s*\n/.test(text)) {
    blocks = text.split(/\n\s*\n+/);
  } else if (/^\s*\d+[\.\)]\s+/m.test(text)) {
    // Split by numbered items like "1. ", "2. "
    const splitByNumbers = text.split(/(?=^\s*\d+[\.\)]\s+)/m);
    if (splitByNumbers.length > 1) {
      blocks = splitByNumbers;
    } else {
      blocks = text.split('\n');
    }
  } else {
    // If single lines or tab separated
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    // Check if lines look like individual tab-separated records
    if (lines.some((l) => l.includes('\t') || l.includes(';'))) {
      blocks = lines;
    } else {
      // Group every 3-5 lines or group by phone occurrence
      const grouped: string[] = [];
      let currentGroup: string[] = [];
      for (const line of lines) {
        // If line contains a phone number and current group already has one, push and reset
        const hasPhone = /(?:08|\+?628)\d{8,12}/.test(line.replace(/[\s-.]/g, ''));
        if (hasPhone && currentGroup.some((l) => /(?:08|\+?628)\d{8,12}/.test(l.replace(/[\s-.]/g, '')))) {
          grouped.push(currentGroup.join('\n'));
          currentGroup = [line];
        } else {
          currentGroup.push(line);
        }
      }
      if (currentGroup.length > 0) {
        grouped.push(currentGroup.join('\n'));
      }
      blocks = grouped.length > 0 ? grouped : [text];
    }
  }

  const results: BroadcastPatient[] = [];

  blocks.forEach((block, index) => {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) return;

    // Check if this block is tab-separated (TSV) or comma/semicolon-separated
    if (trimmedBlock.includes('\t') || trimmedBlock.includes(';') || (trimmedBlock.includes('|') && !trimmedBlock.includes('\n'))) {
      const separator = trimmedBlock.includes('\t') ? '\t' : trimmedBlock.includes(';') ? ';' : '|';
      const parts = trimmedBlock.split(separator).map((p) => p.trim()).filter(Boolean);

      let namaPasien = '';
      let rawPhone = '';
      let poliklinik = 'Poliklinik Umum';
      let dokter = 'dr. Dokter Jaga, Sp.';

      parts.forEach((part) => {
        const cleanedPart = part.replace(/[\s-.]/g, '');
        if (/(?:08|\+?628)\d{8,12}/.test(cleanedPart)) {
          rawPhone = part;
        } else if (/^dr\./i.test(part) || /Sp\.[A-Za-z]+/i.test(part)) {
          dokter = part;
        } else if (/Poli/i.test(part)) {
          poliklinik = part;
        } else if (!namaPasien && part.length > 2 && !/^\d+$/.test(part)) {
          namaPasien = part;
        }
      });

      if (namaPasien || rawPhone) {
        const { display, clean } = sanitizeWhatsAppNumber(rawPhone);
        results.push({
          id: `bp-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          namaPasien: namaPasien || `Pasien ${index + 1}`,
          nomorWhatsApp: display || rawPhone,
          nomorWhatsAppClean: clean,
          poliklinik: poliklinik,
          dokter: dokter,
          selected: true,
          statusKirim: 'Belum Dikirim',
          rawText: trimmedBlock
        });
        return;
      }
    }

    const lines = trimmedBlock.split('\n').map((l) => l.trim()).filter(Boolean);

    let namaPasien = '';
    let rawPhone = '';
    let poliklinik = '';
    let dokter = '';
    let tanggalKunjungan = '';

    // Pass 1: Tagged lines (Key: Value)
    lines.forEach((line) => {
      // Phone / WA
      const phoneMatch = line.match(/(?:(?:No\.?\s*)?(?:WhatsApp|WA|HP|Telp|Telepon)|Kontak)[:\s-]*([+0-9\s-]{9,20})/i);
      if (phoneMatch) {
        rawPhone = phoneMatch[1].trim();
      }

      // Nama Pasien
      const nameMatch = line.match(/(?:Nama(?:\s*Pasien)?|Pasien)[:\s-]*([^\n]+)/i);
      if (nameMatch) {
        namaPasien = nameMatch[1].trim();
      }

      // Poliklinik
      const poliMatch = line.match(/(?:Poli(?:klinik)?|Klinik|Unit)[:\s-]*([^\n]+)/i);
      if (poliMatch) {
        poliklinik = poliMatch[1].trim();
      }

      // Dokter
      const docMatch = line.match(/(?:Dokter|DPJP|Operator)[:\s-]*([^\n]+)/i);
      if (docMatch) {
        dokter = docMatch[1].trim();
      }

      // Tanggal
      const tglMatch = line.match(/(?:Tanggal|Tgl|Jadwal)[:\s-]*([^\n]+)/i);
      if (tglMatch) {
        tanggalKunjungan = tglMatch[1].trim();
      }
    });

    // Pass 2: Unlabelled pattern detection
    // 1. Find phone number anywhere in lines if not found
    if (!rawPhone) {
      for (const line of lines) {
        const found = line.match(/(?:\+?62|0)8[0-9-.\s]{8,14}/);
        if (found) {
          rawPhone = found[0].trim();
          break;
        }
      }
    }

    // 2. Find doctor if not found: lines containing "dr." or "dr " or specialized titles
    if (!dokter) {
      for (const line of lines) {
        if (/dr\.\s*[A-Za-z]/i.test(line) || /dr\s+[A-Za-z]/i.test(line) || /,\s*Sp\.[A-Za-z]/i.test(line)) {
          // Remove numbering or "Dokter:"
          dokter = line.replace(/^\d+[\.\)]\s*/, '').replace(/^(?:Dokter|DPJP)[:\s-]*/i, '').trim();
          break;
        }
      }
    }

    // 3. Find poliklinik if not found: lines containing "Poliklinik" or "Poli "
    if (!poliklinik) {
      for (const line of lines) {
        if (/Poliklinik/i.test(line) || /\bPoli\s+[A-Za-z]/i.test(line)) {
          poliklinik = line.replace(/^\d+[\.\)]\s*/, '').replace(/^(?:Poli|Poliklinik)[:\s-]*/i, '').trim();
          break;
        }
      }
    }

    // 4. Find patient name if not found:
    // Look for lines containing suffixes like "NY", "TN", "AN", "SDR", "BY", or prominent uppercase name
    if (!namaPasien) {
      for (const line of lines) {
        const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').trim();
        // Skip lines that are phone, doctor, poli, or meta
        if (
          cleanLine === rawPhone ||
          cleanLine === dokter ||
          cleanLine === poliklinik ||
          /(?:No\.?\s*RM|Nomor\s*Antrean|Tanggal|Biaya|Pendaftaran)/i.test(cleanLine) ||
          /(?:\+?62|0)8[0-9-.\s]{8,14}/.test(cleanLine) ||
          /^dr\./i.test(cleanLine) ||
          /Poli/i.test(cleanLine)
        ) {
          continue;
        }

        // Potential name line
        if (cleanLine.length >= 2 && !/^\d+$/.test(cleanLine)) {
          namaPasien = cleanLine;
          break;
        }
      }
    }

    // Clean up doctor name if inside parentheses in a line (e.g. "dr. I'anatul Ulya, Sp.N (Poliklinik Saraf)")
    if (dokter && !poliklinik && /\(([^)]+)\)/.test(dokter)) {
      const match = dokter.match(/\(([^)]+)\)/);
      if (match && /poli/i.test(match[1])) {
        poliklinik = match[1].trim();
        dokter = dokter.replace(/\s*\([^)]+\)/, '').trim();
      }
    }

    // Normalizations & Cleanups
    if (namaPasien) {
      // Strip initial numbers e.g. "1. KULIYAH. NY" -> "KULIYAH. NY"
      namaPasien = namaPasien.replace(/^\d+[\.\)]\s*/, '').trim();
    }

    // Fallbacks if empty
    if (!namaPasien && rawPhone) {
      namaPasien = `Pasien (${rawPhone})`;
    }
    if (!poliklinik) {
      poliklinik = 'Poliklinik Rawat Jalan';
    }
    if (!dokter) {
      dokter = 'dr. Spesialis RSUMB';
    }

    const { display, clean } = sanitizeWhatsAppNumber(rawPhone);

    // Only add if at least a name or a phone number was detected
    if (namaPasien || clean) {
      results.push({
        id: `bp-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        namaPasien: namaPasien || `Pasien ${index + 1}`,
        nomorWhatsApp: display || rawPhone || '08...',
        nomorWhatsAppClean: clean,
        poliklinik: poliklinik,
        dokter: dokter,
        tanggalKunjungan: tanggalKunjungan || undefined,
        selected: true,
        statusKirim: 'Belum Dikirim',
        rawText: trimmedBlock
      });
    }
  });

  return results;
}

/**
 * Replaces dynamic variables in message text:
 * {nama_pasien}, {nama_dokter}, {poliklinik}
 */
export function compileBroadcastMessage(
  template: string,
  patient: { namaPasien: string; dokter: string; poliklinik: string }
): string {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return template
    .replace(/\{nama_pasien\}/gi, patient.namaPasien || 'Bapak/Ibu')
    .replace(/\{nama_dokter\}/gi, patient.dokter || 'Dokter Spesialis')
    .replace(/\{poliklinik\}/gi, patient.poliklinik || 'Poliklinik RSUMB')
    .replace(/\{tanggal_hari_ini\}/gi, todayStr)
    .replace(/\{rs_nama\}/gi, 'RSU Muhammadiyah Babat (RSUMB)');
}

/**
 * Builds direct WhatsApp Web URL
 */
export function buildWhatsAppLink(phoneClean: string, message: string): string {
  const formattedPhone = phoneClean.replace(/[^\d]/g, '').replace(/^0/, '62');
  return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message.trim())}`;
}

/**
 * Opens WhatsApp Web in a reused tab ('WhatsAppTab')
 * If the tab is already opened, the browser redirects that tab instead of opening new tabs.
 */
export const openWhatsApp = (phone: string, text: string): Window | null => {
  const formattedPhone = phone.replace(/[^\d]/g, '').replace(/^0/, '62');
  const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text.trim())}`;

  // Menggunakan nama window 'WhatsAppTab' agar reusing tab yang sama
  const waWindow = window.open(url, 'WhatsAppTab');

  // Otomatis fokus ke tab WA tersebut jika didukung browser
  if (waWindow) {
    try {
      waWindow.focus();
    } catch {
      // ignore cross-origin focus limitations
    }
  }

  return waWindow;
};
