import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

describe('migration safety', () => {
  it('guards the notifications insert policy so reapplying the migration stays safe', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'supabase/migrations/024_vcx_notifications_insert_policy.sql'),
      'utf-8'
    )

    expect(content).toContain('pg_policies')
    expect(content).toContain('Users cannot insert notifications')
    expect(content).toContain('WITH CHECK (false)')
  })
})
