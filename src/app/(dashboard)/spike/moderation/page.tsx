'use client';

// =============================================================================
// Route: /spike/moderation
// Browser-ONNX Toxicity Spike — DEV only
// ssr: false weil @xenova/transformers nur im Browser laeuft (WASM/WebGPU).
// =============================================================================

import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

const ModerationSpikePage = dynamic(
  () =>
    import('@/components/features/moderation/moderation-spike-page').then(
      (m) => m.ModerationSpikePage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-sm text-zinc-500">
        Lade Browser-ONNX-Spike…
      </div>
    ),
  },
);

if (process.env.NODE_ENV === 'production') {
  redirect('/');
}

export default function SpikeModerationPage() {
  return <ModerationSpikePage />;
}
