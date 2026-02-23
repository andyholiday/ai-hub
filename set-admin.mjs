import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Superbase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setAdmin() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  for (const user of data.users) {
    console.log(`Setting admin for: ${user.email} (${user.id})`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { role: 'admin' },
      user_metadata: { ...user.user_metadata, role: 'admin' }
    });
    
    // Also update profiles table
    await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
    
    if (updateError) {
      console.error("Error updating user:", updateError);
    } else {
      console.log("Success!");
    }
  }
}

setAdmin();
