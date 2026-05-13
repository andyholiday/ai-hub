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
 * WARNUNG: Script verweigert Ausfuehrung gegen Prod-DB (*.supabase.co ohne localhost).
 * Fuer Prod-Ausfuehrung: --allow-production Flag oder SEED_ALLOW_PRODUCTION=1 setzen.
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

// ---------------------------------------------------------------------------
// Production-Guard: Abbruch wenn SUPABASE_URL auf *.supabase.co zeigt
// (ausser explizit erlaubt via --allow-production oder SEED_ALLOW_PRODUCTION=1)
// ---------------------------------------------------------------------------
const isProductionUrl =
  supabaseUrl.includes('.supabase.co') &&
  !supabaseUrl.includes('localhost') &&
  !supabaseUrl.includes('127.0.0.1');

if (isProductionUrl) {
  const allowed =
    process.argv.includes('--allow-production') ||
    process.env.SEED_ALLOW_PRODUCTION === '1';
  if (!allowed) {
    console.error('[seed] FEHLER: SUPABASE_URL zeigt auf eine Produktions-DB.');
    console.error('[seed] Seed-Script nicht ausgefuehrt. Nutze --allow-production oder SEED_ALLOW_PRODUCTION=1 um fortzufahren.');
    process.exit(1);
  }
  console.warn('[seed] WARNUNG: Ausfuehrung gegen Produktions-DB erlaubt (--allow-production).');
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

  // Pruefen ob User bereits existiert (mit Pagination-Loop fuer grosse User-Listen)
  let existingUser = null;
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: batch, error: listError } = await supabase.auth.admin.listUsers({ page, perPage });
    if (listError) {
      console.error(`[seed] listUsers Fehler:`, listError.message);
      return null;
    }
    const found = batch?.users?.find((u) => u.email === email);
    if (found) { existingUser = found; break; }
    if (!batch?.users?.length || batch.users.length < perPage) break;
    page++;
  }

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

  // Profile upserten: verhindert silent no-op falls handle_new_user-Trigger noch nicht durch ist
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, role, is_approved: true, full_name: fullName },
      { onConflict: 'id' }
    );

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
