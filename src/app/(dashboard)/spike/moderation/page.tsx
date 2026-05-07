'use client';

// =============================================================================
// Route: /spike/moderation
// Browser-ONNX Toxicity Spike — DEV only
// =============================================================================

import { redirect } from 'next/navigation';
import { ModerationSpikePage } from '@/components/features/moderation/moderation-spike-page';

if (process.env.NODE_ENV === 'production') {
  redirect('/');
}

export default function SpikeModerationPage() {
  return <ModerationSpikePage />;
}
