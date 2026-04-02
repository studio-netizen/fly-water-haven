import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

const defaultOptions = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.8,
};

const avatarOptions = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 400,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.8,
};

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Il file supera il limite di ${MAX_FILE_SIZE_MB}MB. Scegli un file più piccolo.`;
  }
  const type = file.type || '';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const validExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
  if (!ACCEPTED_TYPES.includes(type) && !validExt.includes(ext)) {
    return 'Formato non supportato. Usa JPG, PNG, WebP o HEIC.';
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function compressImage(
  file: File,
  type: 'default' | 'avatar' = 'default'
): Promise<CompressionResult> {
  const originalSize = file.size;
  const options = type === 'avatar' ? avatarOptions : defaultOptions;

  try {
    const compressed = await imageCompression(file, options);
    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
      wasCompressed: true,
    };
  } catch {
    // Fallback: upload original
    return {
      file,
      originalSize,
      compressedSize: file.size,
      wasCompressed: false,
    };
  }
}
