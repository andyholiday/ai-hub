import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setAdmin() {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    for (const profile of profiles) {
        console.log('Setting admin role for profile:', profile.full_name, profile.id);

        // Update auth metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
            app_metadata: { role: 'admin' },
            user_metadata: { role: 'admin' }
        });

        // Also update profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', profile.id);

        if (profileError) {
            console.error('Error updating profiles table:', profileError);
        }

        if (updateError) {
            console.error('Error updating user metadata:', updateError);
        } else {
            console.log('Successfully set admin role for', profile.full_name);
        }
    }
}

setAdmin();
