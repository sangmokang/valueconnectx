'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { initAnalytics, identifyUser, resetUser } from '@/lib/analytics'
import { usePageView } from '@/hooks/use-page-view'

export default function Providers({ children }: { children: React.ReactNode }) {
  // 페이지 이동 시 page_view 이벤트 자동 트래킹
  usePageView()

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
