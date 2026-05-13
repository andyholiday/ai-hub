/**
 * seed-test-users.mjs
 *
 * Legt zwei Test-User in Supabase an (via Admin-API).
 * Idempotent: bereits existierende User werden uebersprungen.
 *
 * Benoetigt in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   TEST_USER_EMAIL      (z.B. test-user@ai-hub.test)
 *   TEST_USER_PASSWORD
 *   TEST_ADMIN_EMAIL     (z.B. test-admin@ai-hub.test)
 *   TEST_ADMIN_PASSWORD
 *
 * Ausfuehren: node scripts/seed-test-users.mjs
 *
 * WARNUNG: Script prueft auf Prod-DB (kein "supabase.co"-Check) —
 * stelle sicher, dass NEXT_PUBLIC_SUPABASE_URL auf deine lokale/Test-DB zeigt.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Env laden (aus .env.local, analog zu create-test-user.mjs)
// ---------------------------------------------------------------------------
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env.local nicht vorhanden — weiter mit vorhandenen Process-Env-Vars
}

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'test-user@ai-hub.test';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'test-admin@ai-hub.test';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error('[seed] FEHLER: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht gesetzt.');
  process.exit(1);
}

if (!TEST_USER_PASSWORD || !TEST_ADMIN_PASSWORD) {
  console.error('[seed] FEHLER: TEST_USER_PASSWORD und TEST_ADMIN_PASSWORD muessen gesetzt sein.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Hilfsfunktion: User anlegen oder skippen
// ---------------------------------------------------------------------------
async function upsertUser({ email, password, fullName, role }) {
  console.log(`[seed] Pruefe User: ${email} ...`);

  // Pruefen ob User bereits existiert
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error(`[seed] listUsers Fehler:`, listError.message);
    return null;
  }

  const existingUser = existing?.users?.find((u) => u.email === email);

  let userId;

  if (existingUser) {
    console.log(`[seed]   -> User existiert bereits (id: ${existingUser.id}), ueberspringe auth.users-Insert.`);
    userId = existingUser.id;
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      console.error(`[seed]   -> Fehler beim Anlegen:`, authError.message);
      return null;
    }

    userId = authData.user.id;
    console.log(`[seed]   -> User angelegt (id: ${userId}).`);
  }

  // Profile aktualisieren: role + is_approved
  // (Trigger handle_new_user legt Profile an; wir setzen nur was der Trigger nicht setzt)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role,
      is_approved: true,
      full_name: fullName,
    })
    .eq('id', userId);

  if (profileError) {
    console.error(`[seed]   -> Fehler beim Profil-Update:`, profileError.message);
  } else {
    console.log(`[seed]   -> Profil gesetzt: role=${role}, is_approved=true.`);
  }

  return userId;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('[seed] Starte seed-test-users ...');
  console.log(`[seed] Supabase URL: ${supabaseUrl}`);

  await upsertUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    fullName: 'Test User',
    role: 'user',
  });

  await upsertUser({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
    fullName: 'Test Admin',
    role: 'admin',
  });

  console.log('[seed] Fertig.');
}

main().catch((err) => {
  console.error('[seed] Unerwarteter Fehler:', err);
  process.exit(1);
});
