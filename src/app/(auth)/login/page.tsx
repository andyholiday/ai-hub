"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
        <h1 className="font-display text-2xl font-bold text-surface-900">
          Anmelden
        </h1>
        <p className="mt-2 text-sm text-surface-500">
          Melde dich bei deinem LR AI Hub Konto an.
        </p>

        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-surface-700">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20"
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-surface-700">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20"
              placeholder="Dein Passwort"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm text-lr-green-600 hover:text-lr-green-700"
            >
              Passwort vergessen?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-lr-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lr-green-700"
          >
            Anmelden
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-500">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-lr-green-600 hover:text-lr-green-700">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
