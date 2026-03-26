import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Security Hardening Verification', () => {
  it('S4.5.1: invite accept uses rpc for atomic consumption', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/invites/accept/route.ts'), 'utf-8'
    )
    expect(content).toContain('vcx_consume_invite')
    expect(content).not.toContain(".select('*').eq('token_hash'")
  })

  it('S4.5.2: invite accept does not use listUsers() without filter', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/invites/accept/route.ts'), 'utf-8'
    )
    expect(content).not.toContain('listUsers()')
    // Should use filtered listUsers or alternative
    expect(content).toMatch(/listUsers|getUserByEmail|filter/)
  })

  it('S4.5.3: invite accept updates password for existing users', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/invites/accept/route.ts'), 'utf-8'
    )
    expect(content).toContain('updateUserById')
  })

  it('S4.5.4: invite list escapes search wildcards', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/invites/list/route.ts'), 'utf-8'
    )
    expect(content).toContain('replace(/%/g')
    expect(content).toContain('replace(/_/g')
  })

  it('S4.5.5: getVcxUser logs connectivity errors', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/auth/get-vcx-user.ts'), 'utf-8'
    )
    expect(content).toContain('connectivity')
  })

  it('S4.5.6: migration files for atomic invite and RLS exist', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'supabase/migrations/003_vcx_atomic_invite.sql'))).toBe(true)
    expect(fs.existsSync(path.join(process.cwd(), 'supabase/migrations/004_vcx_members_insert_policy.sql'))).toBe(true)
  })
})
