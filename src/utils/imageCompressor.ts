/**
 * Reusable utility to compress images (File, Blob, or base64 data URL)
 * before persisting to localStorage or IndexedDB.
 * This prevents QuotaExceededError while maintaining crisp visuals for room cards.
 */

export async function compressImage(
  source: File | Blob | string,
  maxWidth = 1000,
  maxHeight = 750,
  quality = 0.75
): Promise<string> {
  // If string and not a data URL (e.g. http/https or relative path), return as is
  if (typeof source === 'string') {
    if (!source.startsWith('data:image/')) {
      return source;
    }
    // If data URL is already tiny (< 30KB), skip recompression
    if (source.length < 40000) {
      return source;
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate aspect ratio scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG format with specified quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // If for any reason compressed is larger than source (rare), pick the smaller one
        if (typeof source === 'string' && source.length < compressedDataUrl.length) {
          resolve(source);
        } else {
          resolve(compressedDataUrl);
        }
      } catch (err) {
        console.warn('Image compression canvas processing failed, using fallback:', err);
        resolve(typeof source === 'string' ? source : '');
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for compression:', err);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      resolve(typeof source === 'string' ? source : '');
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }
  });
}
