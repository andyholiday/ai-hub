import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleApiKey = process.env.GOOGLE_AI_API_KEY;

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
    console.error('Missing Supabase credentials or GOOGLE_AI_API_KEY in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateKey() {
    const { error } = await supabase
        .from('ai_providers')
        .update({ api_key_encrypted: googleApiKey })
        .eq('provider_key', 'gemini');

    if (error) {
        console.error('Error updating gemini provider:', error);
    } else {
        console.log('Successfully updated Gemini API key in database!');
    }
}

updateKey();
