/**
 * Mixpanel Analytics 모듈
 * NEXT_PUBLIC_MIXPANEL_TOKEN 환경변수 없으면 dev mode (console.log만)
 */

export type AnalyticsEventName =
  | 'page_view'
  | 'coffeechat_applied'
  | 'coffeechat_accepted'
  | 'position_interested'
  | 'community_posted'
  | 'profile_updated'
  | 'user_login'
  | 'user_signup'

export type AnalyticsEventProperties = {
  page_view: { path: string; title?: string }
  coffeechat_applied: { session_id: string; session_title: string; type: 'ceo' | 'peer' }
  coffeechat_accepted: { session_id: string; session_title: string }
  position_interested: { position_id: string; interest_type: 'interested' | 'bookmark' | 'not_interested' | null }
  community_posted: { category: string; is_anonymous: boolean }
  profile_updated: { fields_updated: string[] }
  user_login: { method?: string }
  user_signup: { method?: string }
}

type Mixpanel = {
  init: (token: string, config?: Record<string, unknown>) => void
  track: (event: string, properties?: Record<string, unknown>) => void
  identify: (userId: string) => void
  people: { set: (traits: Record<string, unknown>) => void }
  reset: () => void
}

let mixpanel: Mixpanel | null = null
let initialized = false
const DEV_MODE = !process.env.NEXT_PUBLIC_MIXPANEL_TOKEN

export async function initAnalytics(): Promise<void> {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  if (DEV_MODE) {
    console.log('[Analytics] Dev mode: no NEXT_PUBLIC_MIXPANEL_TOKEN set')
    return
  }

  try {
    const mp = await import('mixpanel-browser')
    mixpanel = mp.default as unknown as Mixpanel
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: false,
      persistence: 'localStorage',
    })
  } catch (e) {
    console.warn('[Analytics] Mixpanel init failed:', e)
  }
}

export function trackEvent<K extends AnalyticsEventName>(
  name: K,
  properties?: AnalyticsEventProperties[K]
): void {
  if (DEV_MODE) {
    console.log('[Analytics] trackEvent:', name, properties)
    return
  }
  if (!mixpanel) return
  try {
    mixpanel.track(name, properties as Record<string, unknown>)
  } catch (e) {
    console.warn('[Analytics] trackEvent failed:', e)
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (DEV_MODE) {
    console.log('[Analytics] identifyUser:', userId, traits)
    return
  }
  if (!mixpanel) return
  try {
    mixpanel.identify(userId)
    if (traits) {
      mixpanel.people.set(traits)
    }
  } catch (e) {
    console.warn('[Analytics] identifyUser failed:', e)
  }
}

export function resetUser(): void {
  if (DEV_MODE) {
    console.log('[Analytics] resetUser')
    return
  }
  if (!mixpanel) return
  try {
    mixpanel.reset()
  } catch (e) {
    console.warn('[Analytics] resetUser failed:', e)
  }
}
