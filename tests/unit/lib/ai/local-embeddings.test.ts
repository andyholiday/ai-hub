// =============================================================================
// Tests: LocalEmbeddingService
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Worker mock — class form so `new Worker(...)` works in Vitest
// ---------------------------------------------------------------------------

type AnyHandler = (e: { data?: unknown; message?: string }) => void;

interface MockWorkerInstance {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  _triggerMessage: (data: unknown) => void;
  _triggerError: (msg: string) => void;
}

// Mutable reference so tests can inspect the last created instance.
let lastWorkerInstance: MockWorkerInstance;

class MockWorkerClass {
  private _messageHandlers: AnyHandler[] = [];
  private _errorHandlers: AnyHandler[] = [];

  postMessage = vi.fn((msg: unknown) => {
    const m = msg as { type: string; requestId: string; payload?: { text: string } };
    if (m.type === 'init') {
      setTimeout(() => this._triggerMessage({ type: 'ready', requestId: m.requestId }), 0);
    } else if (m.type === 'embed') {
      setTimeout(() => {
        this._triggerMessage({
          type: 'embedding',
          requestId: m.requestId,
          payload: [0.1, 0.2, 0.3],
        });
      }, 0);
    }
  });

  terminate = vi.fn();

  addEventListener = vi.fn((event: string, handler: AnyHandler) => {
    if (event === 'message') this._messageHandlers.push(handler);
    if (event === 'error') this._errorHandlers.push(handler);
  });

  _triggerMessage(data: unknown) {
    for (const h of this._messageHandlers) h({ data });
  }

  _triggerError(msg: string) {
    for (const h of this._errorHandlers) h({ message: msg });
  }

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastWorkerInstance = this;
  }
}

// ---------------------------------------------------------------------------
// Import under test (Worker global must be stubbed before service is used)
// ---------------------------------------------------------------------------

import { LocalEmbeddingService, getInstance } from '@/lib/ai/local-embeddings';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('LocalEmbeddingService', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', MockWorkerClass);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns a number[] from embed()', async () => {
    const service = new LocalEmbeddingService();
    const result = await service.embed('hello world');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((n) => typeof n === 'number')).toBe(true);
    service.dispose();
  });

  it('spawns the worker lazily — only on first embed() call', async () => {
    let constructCount = 0;
    class CountingWorker extends MockWorkerClass {
      constructor() { super(); constructCount++; }
    }
    vi.stubGlobal('Worker', CountingWorker);

    const service = new LocalEmbeddingService();
    expect(constructCount).toBe(0);

    await service.embed('lazy test');

    expect(constructCount).toBe(1);
    service.dispose();
  });

  it('does not spawn a second worker on subsequent embed() calls', async () => {
    let constructCount = 0;
    class CountingWorker extends MockWorkerClass {
      constructor() { super(); constructCount++; }
    }
    vi.stubGlobal('Worker', CountingWorker);

    const service = new LocalEmbeddingService();
    await service.embed('first call');
    await service.embed('second call');
    expect(constructCount).toBe(1);
    service.dispose();
  });

  it('dispose() calls worker.terminate()', async () => {
    const service = new LocalEmbeddingService();
    await service.embed('before dispose');
    const terminateSpy = lastWorkerInstance.terminate;
    service.dispose();
    expect(terminateSpy).toHaveBeenCalledTimes(1);
  });

  it('forwards progress events via setProgressCallback', async () => {
    const service = new LocalEmbeddingService();
    const progressValues: number[] = [];
    service.setProgressCallback((p) => progressValues.push(p));

    // Start embed (spawns worker, sends init then embed)
    const embedPromise = service.embed('progress test');

    // Wait one microtick so the worker constructor has run and lastWorkerInstance is set
    await Promise.resolve();
    lastWorkerInstance._triggerMessage({ type: 'progress', payload: { progress: 55 } });

    await embedPromise;
    expect(progressValues).toContain(55);
    service.dispose();
  });

  it('is SSR-safe: getInstance() returns null when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    const instance = getInstance();
    expect(instance).toBeNull();
  });

  it('getInstance() returns a LocalEmbeddingService in browser context', () => {
    // jsdom sets window; just ensure the function returns an instance
    const instance = getInstance();
    expect(instance).toBeInstanceOf(LocalEmbeddingService);
  });

  it('rejects embed() when worker replies with an error message', async () => {
    class ErrorWorkerClass {
      private _messageHandlers: AnyHandler[] = [];

      postMessage = vi.fn((msg: unknown) => {
        const m = msg as { type: string; requestId: string };
        if (m.type === 'init') {
          setTimeout(() => this._triggerMessage({ type: 'ready', requestId: m.requestId }), 0);
        } else if (m.type === 'embed') {
          setTimeout(() => {
            this._triggerMessage({
              type: 'error',
              requestId: m.requestId,
              payload: 'inference failed',
            });
          }, 0);
        }
      });

      terminate = vi.fn();

      addEventListener = vi.fn((event: string, handler: AnyHandler) => {
        if (event === 'message') this._messageHandlers.push(handler);
      });

      _triggerMessage(data: unknown) {
        for (const h of this._messageHandlers) h({ data });
      }
    }

    vi.stubGlobal('Worker', ErrorWorkerClass);

    const service = new LocalEmbeddingService();
    await expect(service.embed('will fail')).rejects.toThrow('inference failed');
    service.dispose();
  });
});
