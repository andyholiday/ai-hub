// =============================================================================
// Embedding Web Worker
// Runs Xenova/all-MiniLM-L6-v2 (ONNX, quantized) inside a Worker thread so
// the main thread is never blocked during inference.
//
// NOTE: @xenova/transformers@2.x is used (latest v3 release under this scope).
// The v4 API ships under @huggingface/transformers — migrate when stable.
// ADR-010: docs/architecture/adr/ADR-010-privacy-mode-local-embeddings.md
// =============================================================================

import { pipeline, env } from '@xenova/transformers';

// Only load models from Hugging Face Hub, not from local paths.
env.allowLocalModels = false;

// Reuse the pipeline across calls — lazy init on first 'init' message.
let pipe: Awaited<ReturnType<typeof pipeline>> | null = null;

// ---------------------------------------------------------------------------
// Message protocol types (inbound)
// ---------------------------------------------------------------------------

interface InitMessage {
  type: 'init';
  requestId: string;
}

interface EmbedMessage {
  type: 'embed';
  requestId: string;
  payload: { text: string };
}

type InboundMessage = InitMessage | EmbedMessage;

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.addEventListener('message', async (e: MessageEvent<unknown>) => {
  // Narrow from unknown — worker messages are untyped at runtime.
  const data = e.data as InboundMessage;
  const { type, requestId } = data;

  if (type === 'init') {
    try {
      pipe = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          quantized: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- progress_callback type not exposed in @xenova/transformers@2.x
          progress_callback: (p: any) => self.postMessage({ type: 'progress', payload: p }),
        },
      );
      self.postMessage({ type: 'ready', requestId });
    } catch (err) {
      self.postMessage({
        type: 'error',
        requestId,
        payload: err instanceof Error ? err.message : String(err),
      });
    }
  } else if (type === 'embed') {
    if (!pipe) {
      self.postMessage({
        type: 'error',
        requestId,
        payload: 'Worker not initialized — send init message first',
      });
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @xenova/transformers@2.x options type is poorly typed (normalize bool overloads)
      const result = await (pipe as any)(data.payload.text, {
        pooling: 'mean',
        normalize: true,
      }) as unknown;
      // result is a Tensor-like object; .data is a Float32Array
      const tensorData = (result as { data: ArrayLike<number> }).data;
      self.postMessage({
        type: 'embedding',
        requestId,
        payload: Array.from(tensorData),
      });
    } catch (err) {
      self.postMessage({
        type: 'error',
        requestId,
        payload: err instanceof Error ? err.message : String(err),
      });
    }
  }
});
