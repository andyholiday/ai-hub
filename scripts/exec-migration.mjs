#!/usr/bin/env node
// Execute SQL on Supabase Cloud via Management API
// Reads access token from macOS Keychain (stored by `supabase login`)

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const PROJECT_REF = 'ziwqxnzsrnyhzhsircqh';

function getToken() {
    // Try env var first
    if (process.env.SUPABASE_ACCESS_TOKEN) {
        return process.env.SUPABASE_ACCESS_TOKEN;
    }
    // macOS Keychain (CLI stores base64-encoded token with prefix)
    try {
        const raw = execSync('security find-generic-password -s "Supabase CLI" -w', {
            encoding: 'utf-8', timeout: 5000,
        }).trim();
        if (raw.startsWith('go-keyring-base64:')) {
            const b64 = raw.replace('go-keyring-base64:', '');
            return Buffer.from(b64, 'base64').toString('utf-8');
        }
        return raw;
    } catch { /* ignore */ }
    return null;
}

async function runSQL(sql, token) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return await res.text();
}

async function main() {
    const files = process.argv.slice(2);
    if (files.length === 0) {
        console.log('Usage: node scripts/exec-migration.mjs <file.sql> [file2.sql]');
        process.exit(1);
    }

    const token = getToken();
    if (!token) {
        console.error('❌ No access token. Run: npx supabase login');
        process.exit(1);
    }
    console.log(`✅ Token: ${token.substring(0, 10)}... (${token.length} chars)\n`);

    for (const f of files) {
        if (!existsSync(f)) { console.error(`❌ Not found: ${f}`); continue; }
        const sql = readFileSync(f, 'utf-8');
        console.log(`📄 Running: ${f} (${sql.length} bytes)...`);
        try {
            const result = await runSQL(sql, token);
            console.log(`✅ ${f}: SUCCESS`);
            if (result.length > 2) console.log(`   ${result.substring(0, 300)}\n`);
        } catch (e) {
            console.error(`❌ ${f}: ${e.message}\n`);
        }
    }
}

main();
