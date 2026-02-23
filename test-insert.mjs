import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ziwqxnzsrnyhzhsircqh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd3F4bnpzcm55aHpoc2lyY3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2ODAyMiwiZXhwIjoyMDg3MjQ0MDIyfQ.qeR5RVvj118JNxYWYQUsfwYL4eilQedKYiMIVT_gQHM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from("usecase_evaluations")
    .select("*")
    .limit(1)
  console.log("Data:", data, "Error:", error)
}
test()
