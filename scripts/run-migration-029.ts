import { readFileSync } from 'fs'
import { join } from 'path'

const url = 'https://uhguznqdilfclfvjgses.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3V6bnFkaWxmY2xmdmpnc2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ0MjE3NSwiZXhwIjoyMDkzMDE4MTc1fQ.VIF1TIEZ_gn_WPushAdByI4q8Wa1cgW8tXCkKZ6TGvE'

// Extract project ref from URL
const projectRef = 'uhguznqdilfclfvjgses'

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/029_vcx_feed_news_type.sql'), 'utf8')

async function main() {
  // Use Supabase Management API to run SQL
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await res.text()
  console.log('Management API status:', res.status)
  console.log('Response:', text.slice(0, 500))

  if (res.ok) {
    console.log('✅ Migration 029 applied successfully')
  } else {
    console.log('Management API failed. Trying pg REST approach...')
    // Try direct postgres REST
    const res2 = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    })
    console.log('REST status:', res2.status, await res2.text().catch(() => ''))
  }
}

main().catch(console.error)
