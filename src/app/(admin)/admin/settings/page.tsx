import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin · Settings',
};

export default function SettingsAdminPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="font-display text-2xl font-bold text-surface-900">System-Einstellungen</h1>
      <p className="text-surface-500">
        Dieses Modul ist im Backlog. Tracking-Issue:{' '}
        <a
          href="https://github.com/andyholiday/ai-hub/issues"
          className="underline"
        >
          Issues
        </a>
        .
      </p>
      <p className="text-sm text-surface-400">
        Status: Planung. Reale Implementation folgt in einem spaeterem Wave.
      </p>
    </div>
  );
}
