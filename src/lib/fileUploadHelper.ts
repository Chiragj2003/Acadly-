import * as FileSystem from 'expo-file-system';

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB strictly enforced

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

export interface PreparedUpload {
  blob: Blob;
  contentType: string;
  sizeBytes: number;
}

/**
 * Memory-safe file pre-flight validation and blob preparation:
 * - Checks file extension and MIME type client-side before sending.
 * - Enforces 20 MB maximum size limit.
 * - Streams file as Blob via fetch(fileUri) instead of buffering full Base64 strings in memory.
 */
export async function prepareMemorySafeUpload(
  fileUri: string,
  fileName: string,
  overrideMimeType?: string
): Promise<PreparedUpload> {
  const cleanName = fileName.toLowerCase();
  const ext = cleanName.includes('.') ? `.${cleanName.split('.').pop()}` : '';

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file format "${ext || 'unknown'}". Only PDF documents and images (JPG, PNG, WEBP) are permitted.`
    );
  }

  // 1. Pre-flight file size check via FileSystem if native file://
  if (fileUri.startsWith('file://')) {
    try {
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists && typeof info.size === 'number') {
        if (info.size > MAX_FILE_SIZE_BYTES) {
          const mb = (info.size / (1024 * 1024)).toFixed(1);
          throw new Error(`File size (${mb} MB) exceeds the maximum allowed limit of 20 MB.`);
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('exceeds')) {
        throw e;
      }
    }
  }

  // 2. Memory-safe streaming fetch -> Blob
  const response = await fetch(fileUri);
  const blob = await response.blob();

  // 3. Blob size verification
  if (blob.size > MAX_FILE_SIZE_BYTES) {
    const mb = (blob.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File size (${mb} MB) exceeds the maximum allowed limit of 20 MB.`);
  }

  // 4. Resolve MIME
  let contentType = overrideMimeType || blob.type;
  if (!contentType || contentType === 'application/octet-stream') {
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
  }

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(
      `Disallowed MIME type "${contentType}". Only PDF and images are allowed.`
    );
  }

  return {
    blob,
    contentType,
    sizeBytes: blob.size,
  };
}
