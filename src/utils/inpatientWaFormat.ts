/**
 * Konversi konten HTML menjadi teks bersih WhatsApp
 */
export const htmlToCleanWhatsAppText = (headerTitle: string, htmlContent: string): string => {
  if (typeof document === 'undefined') {
    return `${headerTitle.trim()}\n\n${htmlContent.replace(/<[^>]*>/g, ' ').trim()}`;
  }

  const container = document.createElement('div');
  container.innerHTML = htmlContent;

  // Ganti tag <br> dan blok div/p dengan newline
  const brElements = container.querySelectorAll('br');
  brElements.forEach((br) => br.replaceWith('\n'));

  const blockElements = container.querySelectorAll('div, p');
  blockElements.forEach((b) => {
    b.before('\n');
  });

  const liElements = container.querySelectorAll('li');
  liElements.forEach((li) => {
    li.before('\n• ');
  });

  const imgElements = container.querySelectorAll('img');
  imgElements.forEach((img) => {
    img.replaceWith('\n[📷 Lampiran Foto/Hasil]\n');
  });

  let rawText = container.textContent || container.innerText || '';

  // Bersihkan karakter spasi & duplikasi newline
  rawText = rawText
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `${headerTitle.trim()}\n\n${rawText}`;
};
