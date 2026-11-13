import * as SecureStore from 'expo-secure-store';
import { ExpoSecureStoreChunkedAdapter, CHUNK_SIZE } from '@/lib/supabase';

describe('ExpoSecureStoreChunkedAdapter', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  const testKey = 'supabase.auth.token';

  it('stores and retrieves small payload within a single chunk', async () => {
    const smallPayload = 'simple-token-data-12345';
    await ExpoSecureStoreChunkedAdapter.setItem(testKey, smallPayload);

    // Verify chunk count metadata is set to "1"
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${testKey}_chunks`, '1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${testKey}_0`, smallPayload);

    const retrieved = await ExpoSecureStoreChunkedAdapter.getItem(testKey);
    expect(retrieved).toBe(smallPayload);
  });

  it('splits large > 5 KB session token into multiple chunks and reconstructs it', async () => {
    // Generate ~5000 character payload simulating full Supabase session JWT
    const largePayload = 'A'.repeat(CHUNK_SIZE) + 'B'.repeat(CHUNK_SIZE) + 'C'.repeat(500);
    expect(largePayload.length).toBe(CHUNK_SIZE * 2 + 500); // 4100 chars, 3 chunks

    await ExpoSecureStoreChunkedAdapter.setItem(testKey, largePayload);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${testKey}_chunks`, '3');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${testKey}_0`, 'A'.repeat(CHUNK_SIZE));
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${testKey}_1`, 'B'.repeat(CHUNK_SIZE));
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${testKey}_2`, 'C'.repeat(500));

    const retrieved = await ExpoSecureStoreChunkedAdapter.getItem(testKey);
    expect(retrieved).toBe(largePayload);
    expect(retrieved?.length).toBe(largePayload.length);
  });

  it('cleans up stale higher-indexed chunks when payload shrinks', async () => {
    // First write 3 chunks
    const largePayload = 'X'.repeat(CHUNK_SIZE * 3);
    await ExpoSecureStoreChunkedAdapter.setItem(testKey, largePayload);

    // Now overwrite with 1 chunk
    const smallPayload = 'Y'.repeat(500);
    await ExpoSecureStoreChunkedAdapter.setItem(testKey, smallPayload);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(`${testKey}_chunks`, '1');
    // Stale chunks 1 and 2 must have been deleted
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${testKey}_1`);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${testKey}_2`);

    const retrieved = await ExpoSecureStoreChunkedAdapter.getItem(testKey);
    expect(retrieved).toBe(smallPayload);
  });

  it('removes all chunks and chunk counter on removeItem', async () => {
    const payload = 'Z'.repeat(CHUNK_SIZE * 2);
    await ExpoSecureStoreChunkedAdapter.setItem(testKey, payload);

    await ExpoSecureStoreChunkedAdapter.removeItem(testKey);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${testKey}_chunks`);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${testKey}_0`);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(`${testKey}_1`);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(testKey);

    const retrieved = await ExpoSecureStoreChunkedAdapter.getItem(testKey);
    expect(retrieved).toBeNull();
  });

  it('returns null if any chunk is missing in the chain', async () => {
    const payload = 'M'.repeat(CHUNK_SIZE * 2);
    await ExpoSecureStoreChunkedAdapter.setItem(testKey, payload);

    // Corrupt by deleting chunk 1
    await SecureStore.deleteItemAsync(`${testKey}_1`);

    const retrieved = await ExpoSecureStoreChunkedAdapter.getItem(testKey);
    expect(retrieved).toBeNull();
  });
});
