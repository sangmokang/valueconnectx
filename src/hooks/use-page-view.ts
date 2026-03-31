'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

// pathname 변경 시 page_view 이벤트를 자동으로 트래킹하는 훅
export function usePageView() {
  const pathname = usePathname()

  useEffect(() => {
    trackEvent('page_view', {
      path: pathname,
      title: typeof document !== 'undefined' ? document.title : '',
    })
  }, [pathname])
}
