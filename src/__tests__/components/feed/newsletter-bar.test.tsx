import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NewsletterBar } from '@/components/feed/newsletter-bar'

vi.mock('lucide-react', () => ({
  Check: () => 'CheckIcon',
  Mail: () => 'MailIcon',
  Send: () => 'SendIcon',
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

function jsonResponse(body: object, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response
}

describe('NewsletterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('빈 이메일 제출 시 입력 안내를 보여준다', async () => {
    render(<NewsletterBar />)

    fireEvent.click(screen.getByRole('button', { name: /구독 시작/ }))

    expect(await screen.findByText('이메일 주소를 입력해주세요.')).toBeInTheDocument()
  })

  it('구독 API 실패 메시지를 보여준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ error: '유효한 이메일 주소를 입력해주세요' }, false)
    ))
    render(<NewsletterBar />)

    fireEvent.change(screen.getByLabelText('뉴스레터 이메일 주소'), {
      target: { value: 'member@vcx.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: /구독 시작/ }))

    expect(await screen.findByText('유효한 이메일 주소를 입력해주세요')).toBeInTheDocument()
  })

  it('구독 성공 상태를 보여준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: { id: 'sub-1' } }, true)))
    render(<NewsletterBar />)

    fireEvent.change(screen.getByLabelText('뉴스레터 이메일 주소'), {
      target: { value: ' member@vcx.test ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /구독 시작/ }))

    await waitFor(() => {
      expect(screen.getByText('구독 완료.')).toBeInTheDocument()
    })
    expect(screen.getByText(/member@vcx.test 으로 매주 월요일 발송됩니다/)).toBeInTheDocument()
  })
})
