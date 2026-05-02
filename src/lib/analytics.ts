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
  | 'feed_viewed'
  | 'feed_interested'
  | 'feed_skipped'
  | 'feed_detail_opened'
  | 'feed_item_click'
  | 'interests_saved'
  | 'newsletter_subscribed'
  | 'session_feedback_submit'

export type AnalyticsEventProperties = {
  page_view: { path: string; title?: string }
  coffeechat_applied: { session_id: string; session_title: string; type: 'ceo' | 'peer' }
  coffeechat_accepted: { session_id: string; session_title: string }
  position_interested: { position_id: string; interest_type: 'interested' | 'bookmark' | 'not_interested' | null }
  community_posted: { category: string; is_anonymous: boolean }
  profile_updated: { fields_updated: string[] }
  user_login: { method?: string }
  user_signup: { method?: string }
  feed_viewed: { item_count: number }
  feed_interested: { item_id: string; role: string; company: string }
  feed_skipped: { item_id: string; role: string; company: string }
  feed_detail_opened: { item_id: string; role: string; company: string }
  feed_item_click: { item_id: string; role: string; company: string; surface: 'card_detail' }
  interests_saved: { chips: string[]; count: number }
  newsletter_subscribed: Record<string, never>
  session_feedback_submit: { session_id: string; application_id: string; type: 'ceo' | 'peer' }
}

type Mixpanel = {
  init: (token: string, config?: Record<string, unknown>) => void
  track: (event: string, properties?: Record<string, unknown>) => void
  identify: (userId: string) => void
  people: { set: (traits: Record<string, unknown>) => void }
  reset: () => void
}

type PostHog = {
  capture: (event: string, properties?: Record<string, unknown>) => void
}

function getPostHog(): PostHog | null {
  if (typeof window === 'undefined') return null
  return (window as typeof window & { posthog?: PostHog }).posthog ?? null
}

function capturePostHog(event: string, properties?: Record<string, unknown>): void {
  try {
    getPostHog()?.capture(event, properties)
  } catch (e) {
    console.warn('[Analytics] PostHog capture failed:', e)
  }
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
    capturePostHog(name, properties as Record<string, unknown>)
    console.log('[Analytics] trackEvent:', name, properties)
    return
  }
  try {
    capturePostHog(name, properties as Record<string, unknown>)
    if (!mixpanel) return
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
