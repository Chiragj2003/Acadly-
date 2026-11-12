/**
 * Safe Base64 to binary ArrayBuffer utility.
 * Handles environments where globalThis.atob is missing or binary incompatible (e.g. older Hermes runtimes).
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  if (!base64 || typeof base64 !== 'string') {
    return new Uint8Array(0);
  }

  // Clean data URI scheme prefix if present (e.g. data:application/pdf;base64,...)
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;

  let binaryString: string;
  if (typeof globalThis.atob === 'function') {
    try {
      binaryString = globalThis.atob(cleanBase64);
    } catch {
      binaryString = decodeBase64Fallback(cleanBase64);
    }
  } else {
    binaryString = decodeBase64Fallback(cleanBase64);
  }

  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Pure JavaScript Base64 decoding fallback.
 */
function decodeBase64Fallback(base64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = base64.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 === 1) {
    throw new Error('Invalid base64 string length');
  }

  for (
    let bc = 0, bs = 0, buffer: number, idx = 0;
    (buffer = str.charCodeAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(String.fromCharCode(buffer));
  }

  return output;
}
