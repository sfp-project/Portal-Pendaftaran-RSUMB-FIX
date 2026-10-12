/**
 * Helper khusus pencetakan menggunakan Window Popup / New Tab
 * Solusi 100% andal untuk lingkungan sandbox iframe AI Studio & browser modern.
 */

export interface PrintWindowOptions {
  title: string;
  bodyHtml: string;
  styles?: string;
  autoPrint?: boolean;
  paperWidth?: '80mm' | '58mm' | 'A4' | string;
}

export interface PrintWindowResult {
  success: boolean;
  method: 'popup' | 'blob_tab' | 'iframe';
  win?: Window | null;
}

export function printViaWindowPopup({
  title,
  bodyHtml,
  styles = '',
  autoPrint = true
}: PrintWindowOptions): PrintWindowResult {
  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #000000 !important;
    }
    .print-control-bar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: #005d42;
      color: #ffffff;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.18);
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    }
    .print-control-bar .title {
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .print-control-bar .btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .print-control-bar button {
      background: #ffffff;
      color: #005d42;
      border: 1px solid #ffffff;
      padding: 6px 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    .print-control-bar button:hover {
      background: #f0fdf4;
    }
    .print-control-bar button.btn-close {
      background: rgba(255,255,255,0.18);
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.4);
    }
    .print-control-bar button.btn-close:hover {
      background: rgba(255,255,255,0.3);
    }
    @media print {
      .no-print, .print-control-bar {
        display: none !important;
      }
      body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
    ${styles}
  </style>
</head>
<body>
  <div class="print-control-bar no-print">
    <div class="title">🏥 RSU MUHAMMADIYAH BABAT &bull; ${title}</div>
    <div class="btn-group">
      <button onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
      <button class="btn-close" onclick="window.close()">✖️ Tutup</button>
    </div>
  </div>
  <div class="print-document-body">
    ${bodyHtml}
  </div>
  ${
    autoPrint
      ? `<script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Auto-print error:', e);
        }
      }, 500);
    });
    setTimeout(function() {
      try {
        window.focus();
        window.print();
      } catch (e) {}
    }, 800);
  </script>`
      : ''
  }
</body>
</html>`;

  // METODE 1: window.open (Window Popup)
  let printWin: Window | null = null;
  try {
    printWin = window.open(
      '',
      '_blank',
      'width=850,height=950,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    );
  } catch (err) {
    console.warn('window.open diblokir atau gagal:', err);
  }

  if (printWin && !printWin.closed) {
    try {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      printWin.focus();
      if (autoPrint) {
        setTimeout(() => {
          try {
            printWin?.focus();
            printWin?.print();
          } catch (e) {
            console.warn('Gagal memanggil printWin.print():', e);
          }
        }, 500);
      }
      return { success: true, method: 'popup', win: printWin };
    } catch (writeErr) {
      console.warn('Gagal menulis dokumen popup:', writeErr);
    }
  }

  // METODE 2: Blob URL di tab baru (Bypass popup blocker)
  try {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { success: true, method: 'blob_tab' };
  } catch (blobErr) {
    console.warn('Fallback Blob tab gagal:', blobErr);
  }

  // METODE 3: Fallback ke window.print langsung
  try {
    window.print();
    return { success: true, method: 'iframe' };
  } catch (printErr) {
    console.error('Seluruh metode cetak gagal:', printErr);
    return { success: false, method: 'iframe' };
  }
}
