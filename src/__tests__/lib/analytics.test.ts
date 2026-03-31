import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * analytics.ts의 DEV_MODE는 모듈 로드 시점에 평가되는 상수입니다.
 * (const DEV_MODE = !process.env.NEXT_PUBLIC_MIXPANEL_TOKEN)
 *
 * 각 describe 블록에서 vi.resetModules() + 동적 import를 사용해
 * 환경변수를 세팅한 상태에서 모듈을 다시 로드합니다.
 *
 * vi.isolateModules는 Vitest 4.x에서 제거됨 → vi.resetModules() 사용.
 */

// mixpanel-browser 전역 모킹 (vi.mock은 호이스팅되므로 상단에 위치)
const mockMixpanelInit = vi.fn()
const mockMixpanelTrack = vi.fn()
const mockMixpanelIdentify = vi.fn()
const mockMixpanelPeopleSet = vi.fn()
const mockMixpanelReset = vi.fn()

vi.mock('mixpanel-browser', () => ({
  default: {
    init: mockMixpanelInit,
    track: mockMixpanelTrack,
    identify: mockMixpanelIdentify,
    people: { set: mockMixpanelPeopleSet },
    reset: mockMixpanelReset,
  },
}))

// ─────────────────────────────────────────────
// DEV MODE (토큰 없음)
// ─────────────────────────────────────────────
describe('DEV_MODE (NEXT_PUBLIC_MIXPANEL_TOKEN 없음)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 토큰 없음이 기본값이지만, 혹시 이전 테스트가 세팅했을 경우를 위해 명시적으로 제거
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('initAnalytics가 console.log를 출력한다', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { initAnalytics } = await import('@/lib/analytics')
    await initAnalytics()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Analytics] Dev mode')
    )
    consoleSpy.mockRestore()
  })

  it('trackEvent가 console.log로 이벤트를 기록한다', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { trackEvent } = await import('@/lib/analytics')
    trackEvent('page_view', { path: '/home' })
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Analytics] trackEvent:',
      'page_view',
      { path: '/home' }
    )
    consoleSpy.mockRestore()
  })

  it('identifyUser가 console.log로 유저 ID를 기록한다', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { identifyUser } = await import('@/lib/analytics')
    identifyUser('user-123', { name: '강상모' })
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Analytics] identifyUser:',
      'user-123',
      { name: '강상모' }
    )
    consoleSpy.mockRestore()
  })

  it('resetUser가 console.log를 출력한다', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { resetUser } = await import('@/lib/analytics')
    resetUser()
    expect(consoleSpy).toHaveBeenCalledWith('[Analytics] resetUser')
    consoleSpy.mockRestore()
  })
})

// ─────────────────────────────────────────────
// 프로덕션 모드 (토큰 있음)
// ─────────────────────────────────────────────
describe('프로덕션 모드 (NEXT_PUBLIC_MIXPANEL_TOKEN 있음)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_MIXPANEL_TOKEN', 'test-token-prod')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('initAnalytics가 mixpanel.init을 호출한다', async () => {
    const { initAnalytics } = await import('@/lib/analytics')
    await initAnalytics()
    expect(mockMixpanelInit).toHaveBeenCalledWith(
      'test-token-prod',
      expect.objectContaining({ track_pageview: false })
    )
  })

  it('trackEvent가 mixpanel.track을 호출한다', async () => {
    const { initAnalytics, trackEvent } = await import('@/lib/analytics')
    await initAnalytics()
    trackEvent('user_login', { method: 'email' })
    expect(mockMixpanelTrack).toHaveBeenCalledWith('user_login', { method: 'email' })
  })

  it('identifyUser가 mixpanel.identify와 people.set을 호출한다', async () => {
    const { initAnalytics, identifyUser } = await import('@/lib/analytics')
    await initAnalytics()
    identifyUser('user-456', { plan: 'core' })
    expect(mockMixpanelIdentify).toHaveBeenCalledWith('user-456')
    expect(mockMixpanelPeopleSet).toHaveBeenCalledWith({ plan: 'core' })
  })

  it('identifyUser에 traits 없이 호출하면 people.set을 호출하지 않는다', async () => {
    const { initAnalytics, identifyUser } = await import('@/lib/analytics')
    await initAnalytics()
    identifyUser('user-789')
    expect(mockMixpanelIdentify).toHaveBeenCalledWith('user-789')
    expect(mockMixpanelPeopleSet).not.toHaveBeenCalled()
  })

  it('resetUser가 mixpanel.reset을 호출한다', async () => {
    const { initAnalytics, resetUser } = await import('@/lib/analytics')
    await initAnalytics()
    resetUser()
    expect(mockMixpanelReset).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// 엣지 케이스
// ─────────────────────────────────────────────
describe('엣지 케이스', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('SSR 환경(window undefined)에서 initAnalytics가 아무것도 하지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MIXPANEL_TOKEN', 'test-token-ssr')
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // window를 undefined로 만들어 SSR 환경 시뮬레이션
    const originalWindow = globalThis.window
    // @ts-expect-error SSR 환경 시뮬레이션을 위해 window 삭제
    delete globalThis.window

    try {
      const { initAnalytics } = await import('@/lib/analytics')
      await initAnalytics()
      // DEV_MODE=false이지만 window가 없으므로 early return — init 호출 없음
      expect(mockMixpanelInit).not.toHaveBeenCalled()
      expect(consoleSpy).not.toHaveBeenCalled()
    } finally {
      globalThis.window = originalWindow
      consoleSpy.mockRestore()
      warnSpy.mockRestore()
    }
  })

  it('초기화 전 trackEvent 호출 시 에러 없이 무시된다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MIXPANEL_TOKEN', 'test-token-noinit')
    const { trackEvent } = await import('@/lib/analytics')
    // initAnalytics 호출 없이 trackEvent 직접 호출 → mixpanel이 null이므로 무시
    expect(() =>
      trackEvent('community_posted', { category: 'general', is_anonymous: false })
    ).not.toThrow()
    expect(mockMixpanelTrack).not.toHaveBeenCalled()
  })

  it('mixpanel import 실패 시 console.warn을 출력하고 에러를 던지지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MIXPANEL_TOKEN', 'test-token-fail')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // mixpanel-browser import를 실패하도록 재모킹
    vi.doMock('mixpanel-browser', () => {
      throw new Error('mixpanel load failed')
    })
    vi.resetModules()

    try {
      const { initAnalytics } = await import('@/lib/analytics')
      await expect(initAnalytics()).resolves.toBeUndefined()
      expect(warnSpy).toHaveBeenCalledWith(
        '[Analytics] Mixpanel init failed:',
        expect.any(Error)
      )
    } finally {
      // 원래 모킹으로 복원
      vi.doMock('mixpanel-browser', () => ({
        default: {
          init: mockMixpanelInit,
          track: mockMixpanelTrack,
          identify: mockMixpanelIdentify,
          people: { set: mockMixpanelPeopleSet },
          reset: mockMixpanelReset,
        },
      }))
      warnSpy.mockRestore()
    }
  })
})
