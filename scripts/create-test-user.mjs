import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
    const email = 'newuser@lr-ai-hub.test';
    const password = 'TestPassword123!';

    // 1. Create User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Lisa Neu',
            role: 'user'
        }
    });

    if (authError) {
        if (authError.message.includes('already exists')) {
            console.log('User already exists. Skipping creation.');
        } else {
            console.error('Error creating user:', authError);
            return;
        }
    } else {
        console.log('Successfully created test user:', authData.user.email);

        // 2. We also need to update their profile to ensure onboarding is not completed
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                onboarding_completed: false,
                xp: 0,
                level: 1,
                full_name: 'Lisa Neu'
            })
            .eq('id', authData.user.id);

        if (profileError) {
            console.error('Error updating profile:', profileError);
        } else {
            console.log('Test user profile initialized for onboarding.');
            console.log(`\nEmail: ${email}\nPassword: ${password}`);
        }
    }
}

createTestUser();
