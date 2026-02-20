export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <div className="rounded-full bg-surface-100 p-4">
        <svg
          className="h-8 w-8 text-surface-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h2 className="font-display text-xl font-bold text-surface-900">
        Seite nicht gefunden
      </h2>
      <p className="text-center text-sm text-surface-500">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
    </div>
  );
}
