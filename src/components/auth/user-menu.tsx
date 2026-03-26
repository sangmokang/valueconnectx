'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function UserMenu({ userName, isAdmin }: { userName: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/'); router.refresh()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', fontSize: '13.5px', fontWeight: 600, color: '#1a1a1a', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {userName}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, background: '#f0ebe2', border: '1px solid rgba(0,0,0,0.08)', minWidth: '160px', zIndex: 100, borderRadius: 0 }}>
          <Link href="/profile" onClick={() => setOpen(false)} style={{ display: 'block', padding: '12px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#1a1a1a', textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>프로필</Link>
          {isAdmin && <Link href="/admin/recommendations" onClick={() => setOpen(false)} style={{ display: 'block', padding: '12px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#c9a84c', textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>관리</Link>}
          <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888', background: 'transparent', border: 'none', cursor: 'pointer' }}>로그아웃</button>
        </div>
      )}
    </div>
  )
}
