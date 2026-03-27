'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { initAnalytics, identifyUser, resetUser } from '@/lib/analytics'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics()

    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        identifyUser(session.user.id, { email: session.user.email })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        identifyUser(session.user.id, { email: session.user.email })
      } else {
        resetUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
