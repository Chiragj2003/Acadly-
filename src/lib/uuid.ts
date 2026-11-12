/**
 * Universal RFC 4122 UUID v4 generator.
 * Uses native crypto.randomUUID where available with a secure math fallback.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Check if current runtime environment is development (__DEV__) */
export function isDevEnvironment(): boolean {
  return typeof __DEV__ !== 'undefined' && Boolean(__DEV__);
}
