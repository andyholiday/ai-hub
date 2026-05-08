// =============================================================================
// LocalEmbeddingService — Client wrapper for the embedding Web Worker.
// Spawns the worker lazily on first embed() call, SSR-safe.
//
// Pattern P4.1 | ADR-010: Privacy Mode — Local Embeddings
// NOTE: @xenova/transformers@2.x used (v3 latest). See worker file comment.
// =============================================================================

// ---------------------------------------------------------------------------
// Worker outbound message types
// ---------------------------------------------------------------------------

interface WorkerReadyMessage {
  type: 'ready';
  requestId: string;
}

interface WorkerErrorMessage {
  type: 'error';
  requestId: string;
  payload: string;
}

interface WorkerEmbeddingMessage {
  type: 'embedding';
  requestId: string;
  payload: number[];
}

interface WorkerProgressMessage {
  type: 'progress';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- progress shape from @xenova/transformers is untyped
  payload: any;
}

type WorkerOutboundMessage =
  | WorkerReadyMessage
  | WorkerErrorMessage
  | WorkerEmbeddingMessage
  | WorkerProgressMessage;

// ---------------------------------------------------------------------------
// Progress callback type
// ---------------------------------------------------------------------------

export type ProgressCallback = (progress: number) => void;

// ---------------------------------------------------------------------------
// Pending request bookkeeping
// ---------------------------------------------------------------------------

interface PendingRequest {
  resolve: (value: number[]) => void;
  reject: (reason: Error) => void;
}

// ---------------------------------------------------------------------------
// LocalEmbeddingService
// ---------------------------------------------------------------------------

export class LocalEmbeddingService {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private pending = new Map<string, PendingRequest>();
  private onProgress: ProgressCallback | null = null;
  private requestCounter = 0;

  /** Register a callback for model download/init progress (0–100). */
  setProgressCallback(cb: ProgressCallback): void {
    this.onProgress = cb;
  }

  /**
   * Explicitly initialise the worker + model.
   * Calling this is optional — embed() calls it lazily.
   */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._spawnAndInit();
    return this.initPromise;
  }

  /**
   * Generate a 384-dimensional embedding for the given text.
   * Spawns and initialises the worker on first call (SSR-safe).
   */
  async embed(text: string): Promise<number[]> {
    await this.init();

    const worker = this.worker;
    if (!worker) {
      throw new Error('[LocalEmbeddingService] Worker unavailable');
    }

    const requestId = `embed-${++this.requestCounter}`;

    return new Promise<number[]>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      worker.postMessage({ type: 'embed', requestId, payload: { text } });
    });
  }

  /** Terminate the worker and release resources. */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initPromise = null;
    this.pending.clear();
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private _spawnAndInit(): Promise<void> {
    // SSR guard: Worker is not available in Node / edge runtime.
    if (typeof window === 'undefined') {
      return Promise.reject(
        new Error('[LocalEmbeddingService] Workers are only available in the browser'),
      );
    }

    // Spawn the worker. The `import.meta.url` pattern lets Next.js bundle the
    // worker file correctly via webpack 5's worker loader.
    this.worker = new Worker(
      new URL('./workers/embedding.worker.ts', import.meta.url),
      { type: 'module' },
    );

    const worker = this.worker;

    worker.addEventListener('message', (e: MessageEvent<unknown>) => {
      this._handleMessage(e.data as WorkerOutboundMessage);
    });

    worker.addEventListener('error', (e: ErrorEvent) => {
      const err = new Error(e.message ?? 'Worker error');
      // Reject all pending requests if the worker dies.
      for (const [, req] of this.pending) {
        req.reject(err);
      }
      this.pending.clear();
    });

    const requestId = 'init';
    return new Promise<void>((resolve, reject) => {
      this.pending.set(requestId, {
        resolve: () => resolve(),
        reject,
      });
      worker.postMessage({ type: 'init', requestId });
    });
  }

  private _handleMessage(msg: WorkerOutboundMessage): void {
    if (msg.type === 'progress') {
      if (this.onProgress && msg.payload) {
        // @xenova/transformers reports progress as { progress: number (0-100) }
        const raw = msg.payload as { progress?: number };
        if (typeof raw.progress === 'number') {
          this.onProgress(raw.progress);
        }
      }
      return;
    }

    if (msg.type === 'ready') {
      const req = this.pending.get(msg.requestId);
      if (req) {
        this.pending.delete(msg.requestId);
        req.resolve([]);
      }
      return;
    }

    if (msg.type === 'embedding') {
      const req = this.pending.get(msg.requestId);
      if (req) {
        this.pending.delete(msg.requestId);
        req.resolve(msg.payload);
      }
      return;
    }

    if (msg.type === 'error') {
      const req = this.pending.get(msg.requestId);
      if (req) {
        this.pending.delete(msg.requestId);
        req.reject(new Error(msg.payload));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton accessor
// ---------------------------------------------------------------------------

let _instance: LocalEmbeddingService | null = null;

/** Returns the shared LocalEmbeddingService instance. SSR-safe (returns null on server). */
export function getInstance(): LocalEmbeddingService | null {
  if (typeof window === 'undefined') return null;
  if (!_instance) {
    _instance = new LocalEmbeddingService();
  }
  return _instance;
}
