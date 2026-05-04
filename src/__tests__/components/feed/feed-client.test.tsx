import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FeedClient } from '@/components/feed/feed-client'
import type { FeedItem } from '@/types'

vi.mock('lucide-react', () => ({
  AlertCircle: () => 'AlertCircleIcon',
  BarChart3: () => 'BarChart3Icon',
  BriefcaseBusiness: () => 'BriefcaseBusinessIcon',
  Check: () => 'CheckIcon',
  CheckCircle2: () => 'CheckCircle2Icon',
  ChevronRight: () => 'ChevronRightIcon',
  Eye: () => 'EyeIcon',
  Info: () => 'InfoIcon',
  Loader2: () => 'Loader2Icon',
  Mail: () => 'MailIcon',
  MapPin: () => 'MapPinIcon',
  Plus: () => 'PlusIcon',
  Send: () => 'SendIcon',
  Users: () => 'UsersIcon',
  X: () => 'XIcon',
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

const feedItem: FeedItem = {
  id: 'feed-1',
  company: '토스',
  company_tag: '핀테크',
  role: '프로덕트 리드',
  level: '리드',
  team_size: '20명',
  salary_band: '협의',
  location: '서울',
  tags: ['핀테크 B2B'],
  summary: '신규 사업 실행을 맡는 역할',
  exclusive: false,
  published_at: '2026-05-01T09:00:00+09:00',
  user_response: null,
}

function renderFeedClient() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <FeedClient />
    </SWRConfig>
  )
}

function jsonResponse(body: object, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response
}

describe('FeedClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('관심 분야 확인 전에는 준비 상태를 보여준다', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    renderFeedClient()

    expect(screen.getByText('피드를 준비하는 중입니다')).toBeInTheDocument()
    expect(screen.getByText('관심 분야를 먼저 확인하고 있습니다.')).toBeInTheDocument()
  })

  it('관심 분야를 불러오지 못하면 전체 큐레이션을 보여준다', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/feed/interests') {
        return Promise.resolve(jsonResponse({ error: 'server error' }, false))
      }
      return Promise.resolve(jsonResponse({ data: [feedItem], total: 1 }))
    }))

    renderFeedClient()

    expect(await screen.findByText('관심 분야를 불러오지 못했습니다. 우선 전체 큐레이션을 보여드립니다.')).toBeInTheDocument()
    expect(await screen.findByText('프로덕트 리드')).toBeInTheDocument()
  })

  it('피드 API 실패 상태를 한국어로 보여준다', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/feed/interests') {
        return Promise.resolve(jsonResponse({ chips: [] }))
      }
      return Promise.resolve(jsonResponse({ error: 'server error' }, false))
    }))

    renderFeedClient()

    expect(await screen.findByText('피드를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByText('잠시 후 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('관심 반응 저장 실패를 화면에 표시한다', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/feed/interests') {
        return Promise.resolve(jsonResponse({ chips: [] }))
      }
      if (url === '/api/feed?limit=10') {
        return Promise.resolve(jsonResponse({ data: [feedItem], total: 1 }))
      }
      return Promise.resolve(jsonResponse({ error: 'server error' }, false))
    }))

    renderFeedClient()

    fireEvent.click(await screen.findByRole('button', { name: /관심 있음/ }))

    await waitFor(() => {
      expect(screen.getByText('선택을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument()
    })
  })
})
