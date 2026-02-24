// Server Component (no client-side interactivity needed for this placeholder)

export const metadata = {
  title: "Benachrichtigungen | AI Hub",
  description: "Deine Benachrichtigungen im AI Hub",
};

export default function NotificationsPage() {
  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold text-surface-900">
        Benachrichtigungen
      </h1>
      <p className="mt-2 text-surface-500">
        Deine Benachrichtigungen werden bald verfuegbar sein.
      </p>
    </div>
  );
}
