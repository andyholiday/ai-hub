import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://ziwqxnzsrnyhzhsircqh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd3F4bnpzcm55aHpoc2lyY3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2ODAyMiwiZXhwIjoyMDg3MjQ0MDIyfQ.qeR5RVvj118JNxYWYQUsfwYL4eilQedKYiMIVT_gQHM')

async function run() {
  const { data } = await supabase.from('community_posts').select('*').eq('type', 'idea').order('created_at', { ascending: false }).limit(1)
  console.log(JSON.stringify(data, null, 2))
}
run()
