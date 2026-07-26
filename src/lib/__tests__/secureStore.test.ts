import { createChunkedStore, type KeyValueStore } from '@/lib/secureStore';

const SECURE_STORE_LIMIT = 2048;

function memoryBackend(): KeyValueStore & { dump: Map<string, string> } {
  const dump = new Map<string, string>();
  return {
    dump,
    getItem: (key) => Promise.resolve(dump.has(key) ? dump.get(key)! : null),
    setItem: (key, value) => {
      if (new TextEncoder().encode(value).length > SECURE_STORE_LIMIT) {
        return Promise.reject(new Error('value exceeds SecureStore size limit'));
      }
      dump.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      dump.delete(key);
      return Promise.resolve();
    },
  };
}

describe('createChunkedStore', () => {
  it('round-trips a small value as a single key', async () => {
    const backend = memoryBackend();
    const store = createChunkedStore(backend);

    await store.setItem('session', 'hello');

    expect(backend.dump.get('session')).toBe('hello');
    expect(await store.getItem('session')).toBe('hello');
  });

  it('round-trips a value far larger than the SecureStore limit', async () => {
    const backend = memoryBackend();
    const store = createChunkedStore(backend);
    const big = 'x'.repeat(10_000);

    await expect(store.setItem('session', big)).resolves.toBeUndefined();
    expect(await store.getItem('session')).toBe(big);
    for (const value of backend.dump.values()) {
      expect(new TextEncoder().encode(value).length).toBeLessThanOrEqual(SECURE_STORE_LIMIT);
    }
  });

  it('preserves multibyte characters across chunk boundaries', async () => {
    const backend = memoryBackend();
    const store = createChunkedStore(backend);
    const value = '🏋️سلام'.repeat(1000);

    await store.setItem('session', value);

    expect(await store.getItem('session')).toBe(value);
  });

  it('reads a legacy raw value written before chunking existed', async () => {
    const backend = memoryBackend();
    const store = createChunkedStore(backend);
    backend.dump.set('session', 'legacy-blob');

    expect(await store.getItem('session')).toBe('legacy-blob');
  });

  it('cleans up stale chunks when a large value shrinks to a small one', async () => {
    const backend = memoryBackend();
    const store = createChunkedStore(backend);

    await store.setItem('session', 'y'.repeat(10_000));
    await store.setItem('session', 'small');

    expect(await store.getItem('session')).toBe('small');
    expect([...backend.dump.keys()]).toEqual(['session']);
  });

  it('removes the manifest and every chunk', async () => {
    const backend = memoryBackend();
    const store = createChunkedStore(backend);

    await store.setItem('session', 'z'.repeat(10_000));
    await store.removeItem('session');

    expect(backend.dump.size).toBe(0);
    expect(await store.getItem('session')).toBeNull();
  });

  it('returns null for a missing key', async () => {
    const store = createChunkedStore(memoryBackend());
    expect(await store.getItem('nope')).toBeNull();
  });
});
