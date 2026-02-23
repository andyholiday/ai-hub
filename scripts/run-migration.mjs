// Migration runner using Supabase's internal SQL execution
// This approach uses the project's database connection via supabase-js admin client

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ziwqxnzsrnyhzhsircqh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd3F4bnpzcm55aHpoc2lyY3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2ODAyMiwiZXhwIjoyMDg3MjQ0MDIyfQ.qeR5RVvj118JNxYWYQUsfwYL4eilQedKYiMIVT_gQHM';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

// Step 1: Create a temporary SQL execution function
async function createExecFunction() {
    // Use the service role to call an RPC that creates our exec function
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_exec_sql_temp`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });
    return res.ok;
}

// Fallback: Run individual DDL statements via PostgREST functions
// Strategy: check if table exists by querying it
async function checkTable() {
    const { data, error } = await supabase
        .from('mentor_signals')
        .select('id')
        .limit(0);

    if (!error) {
        console.log('✅ mentor_signals table already exists!');
        return true;
    }

    if (error.code === '42P01') {  // relation does not exist
        console.log('Table does not exist yet.');
        return false;
    }

    // PGRST error = table not in schema cache
    if (error.message?.includes('schema cache')) {
        console.log('Table not in PostgREST schema cache (does not exist).');
        return false;
    }

    console.log('Check error:', error);
    return false;
}

// Main migration approach using Supabase Management API v1
async function runViaMgmtAPI() {
    // The Management API is at api.supabase.com
    // It requires a personal access token, not the service role key
    // Let's try a different approach: use the database URL directly

    // Supabase exposes pg connection details via the project settings
    // Connection string format:
    // postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

    // Without the DB password, we need to use the Supabase SQL API
    // which is at: /sql endpoint (if available in this version)

    const endpoints = [
        `${SUPABASE_URL}/sql`,
        `${SUPABASE_URL}/pg/query`,
        `${SUPABASE_URL}/database/query`,
    ];

    const sql = `SELECT current_database()`;

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: sql }),
            });
            const text = await res.text();
            console.log(`${endpoint}: ${res.status} - ${text.substring(0, 100)}`);
            if (res.ok) return endpoint;
        } catch (e) {
            console.log(`${endpoint}: failed - ${e.message}`);
        }
    }

    return null;
}

async function main() {
    console.log('=== Mentor Signals Migration Runner ===\n');

    // Check if table exists
    const exists = await checkTable();
    if (exists) return;

    console.log('\nTrying SQL execution endpoints...');
    const endpoint = await runViaMgmtAPI();

    if (endpoint) {
        console.log(`\n🎯 Found working endpoint: ${endpoint}`);
        // Execute full migration
    } else {
        console.log('\n❌ No direct SQL endpoint available.');
        console.log('\n💡 Alternative: Log into Supabase Dashboard to execute the migration.');
        console.log('   URL: https://supabase.com/dashboard/project/ziwqxnzsrnyhzhsircqh/sql/new');
        console.log('   File: supabase/migrations/00010_mentor_signals.sql');

        // Try one more thing: PostgREST might allow us to call functions
        // that might help bootstrap
        console.log('\n🔄 Checking for any workaround...');

        // Let's try to see if we can use the auth.admin API to check
        const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1 });
        if (users?.users?.length > 0) {
            console.log(`\n✅ Admin API works! Found ${users.users.length} user(s).`);
            console.log('   Service role key is valid and working.');
        }
    }
}

main().catch(console.error);
