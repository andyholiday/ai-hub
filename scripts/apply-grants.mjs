#!/usr/bin/env node
// =============================================================================
// Apply GRANT Statements to Supabase
// Executes migration 00008 (GRANTs) and key parts of 00009 (DB functions)
// using the Service Role Key.
//
// Usage: node scripts/apply-grants.mjs
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ziwqxnzsrnyhzhsircqh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd3F4bnpzcm55aHpoc2lyY3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2ODAyMiwiZXhwIjoyMDg3MjQ0MDIyfQ.qeR5RVvj118JNxYWYQUsfwYL4eilQedKYiMIVT_gQHM';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Test basic connectivity
// ---------------------------------------------------------------------------
async function testConnection() {
    console.log('🔄 Testing Supabase connection...');

    // Test 1: Check if we can read profiles (admin should always work)
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

    if (error) {
        console.log(`❌ Profiles access: ${error.message}`);
        return false;
    }

    console.log(`✅ Profiles access works! Found ${data?.length ?? 0} row(s)`);
    return true;
}

// ---------------------------------------------------------------------------
// Try to execute SQL via the database endpoint
// ---------------------------------------------------------------------------
async function executeSQLViaMgmtAPI(sql, label) {
    // Method 1: Supabase Management API (requires access token)
    // We don't have it, so this will likely fail, but let's try

    // Method 2: Try PostgREST SQL function
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (!error) {
        console.log(`✅ ${label}: Executed via RPC`);
        return true;
    }

    // Method 3: Try raw SQL endpoint
    const endpoints = [
        `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    ];

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ sql_query: sql }),
            });
            if (res.ok) {
                console.log(`✅ ${label}: Executed via ${endpoint}`);
                return true;
            }
        } catch {
            // Continue to next method
        }
    }

    return false;
}

// ---------------------------------------------------------------------------
// Create a SQL execution function via PostgREST
// ---------------------------------------------------------------------------
async function createExecFunction() {
    console.log('🔄 Attempting to create SQL execution function...');

    // The service_role should be able to create functions
    const createFnSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
        RETURNS JSON
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_query;
            RETURN json_build_object('status', 'ok');
        EXCEPTION WHEN OTHERS THEN
            RETURN json_build_object('status', 'error', 'message', SQLERRM);
        END;
        $$;
    `;

    // We can't create the function via PostgREST directly...
    // But we can try using the `pg_net` extension or `dblink` if available

    // Alternative: Check if there's an existing way to execute SQL
    const { data, error } = await supabase.rpc('execute_sql', { query: 'SELECT 1' });
    if (!error) {
        console.log('✅ Found existing execute_sql function!');
        return 'execute_sql';
    }

    console.log('❌ No SQL execution function found');
    return null;
}

// ---------------------------------------------------------------------------
// Apply GRANTs by testing if they're already in place
// ---------------------------------------------------------------------------
async function checkAndReportPermissions() {
    console.log('\n📋 Checking current table permissions...\n');

    const tables = [
        'profiles', 'best_practices', 'courses', 'lessons',
        'community_posts', 'comments', 'badges', 'user_badges',
        'achievements', 'user_achievements', 'challenges', 'user_challenges',
        'notifications', 'upvotes', 'innovation_radar_items', 'feature_flags',
        'learning_paths', 'learning_path_courses',
    ];

    const results = [];

    for (const table of tables) {
        try {
            const { error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                results.push({ table, accessible: false, error: error.message });
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                results.push({ table, accessible: true });
                console.log(`✅ ${table}: accessible`);
            }
        } catch (e) {
            results.push({ table, accessible: false, error: e.message });
            console.log(`❌ ${table}: ${e.message}`);
        }
    }

    const failedTables = results.filter(r => !r.accessible);
    console.log(`\n📊 Results: ${results.length - failedTables.length}/${results.length} tables accessible`);

    if (failedTables.length > 0) {
        console.log('\n⚠️  Tables with permission issues:');
        failedTables.forEach(r => console.log(`   - ${r.table}: ${r.error}`));
    }

    return failedTables;
}

// ---------------------------------------------------------------------------
// Check RPC functions
// ---------------------------------------------------------------------------
async function checkRPCFunctions() {
    console.log('\n📋 Checking RPC functions...\n');

    const functions = [
        { name: 'get_user_profile_data', args: { target_user_id: '00000000-0000-0000-0000-000000000000' } },
        { name: 'get_leaderboard_optimized', args: { current_user_id: null, limit_count: 1 } },
    ];

    const results = [];

    for (const fn of functions) {
        const { error } = await supabase.rpc(fn.name, fn.args);
        if (error) {
            if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
                results.push({ name: fn.name, exists: false });
                console.log(`❌ ${fn.name}: NOT FOUND (needs migration 00009)`);
            } else {
                results.push({ name: fn.name, exists: true, note: 'exists but returned error' });
                console.log(`⚠️  ${fn.name}: exists but error: ${error.message}`);
            }
        } else {
            results.push({ name: fn.name, exists: true });
            console.log(`✅ ${fn.name}: working`);
        }
    }

    return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    console.log('=== Supabase Permission Checker & Migration Helper ===\n');

    // Step 1: Test basic connection
    const connected = await testConnection();
    if (!connected) {
        console.log('\n⚠️  Service role cannot read profiles table.');
        console.log('   This means the table-level GRANTs are missing.');
        console.log('   Migration 00008_fix_grants.sql must be executed.\n');
    }

    // Step 2: Check all tables
    const failedTables = await checkAndReportPermissions();

    // Step 3: Check RPC functions
    await checkRPCFunctions();

    // Step 4: Try to execute GRANTs
    console.log('\n🔧 Attempting to apply GRANTs...\n');

    const fnName = await createExecFunction();
    if (fnName) {
        console.log(`✅ Using ${fnName} to apply GRANTs...`);
        // Execute the GRANT statements
        const grantSQL = `
            GRANT USAGE ON SCHEMA public TO authenticated;
            GRANT USAGE ON SCHEMA public TO anon;
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
            GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
            GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
            GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
        `;
        await executeSQLViaMgmtAPI(grantSQL, 'GRANTs');
    } else {
        console.log('\n❌ Cannot automatically apply GRANTs.');
        console.log('\n📋 MANUAL STEPS REQUIRED:');
        console.log('   1. Go to: https://supabase.com/dashboard/project/ziwqxnzsrnyhzhsircqh/sql/new');
        console.log('   2. Copy and paste the contents of: supabase/migrations/00008_fix_grants.sql');
        console.log('   3. Click "Run"');
        console.log('   4. Then paste and run: supabase/migrations/00009_optimize_rls_jwt_roles.sql');
        console.log('   5. Refresh the app');
    }
}

main().catch(console.error);
