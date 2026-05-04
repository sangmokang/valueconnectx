import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  // Check if columns already exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('vcx_feed_items')
    .select('item_type, source_url, source_name, headline')
    .limit(1)

  if (!error) {
    console.log('✅ Migration already applied — columns exist')
    return
  }

  console.log('Columns missing:', error.message)
  console.log('Please apply 029_vcx_feed_news_type.sql via Supabase Studio SQL Editor')
}

main().catch(console.error)
