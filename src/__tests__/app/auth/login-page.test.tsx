import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from '@/app/(auth)/login/page'

const { loginFormMock } = vi.hoisted(() => ({
  loginFormMock: vi.fn(({ redirectTo }: { redirectTo?: string }) => (
    <div data-testid="login-form">redirect:{redirectTo ?? 'none'}</div>
  )),
}))

vi.mock('@/components/auth/login-form', () => ({
  LoginForm: loginFormMock,
}))

describe('LoginPage', () => {
  it('서버 인증 조회 없이 로그인 폼과 보조 링크를 즉시 렌더한다', async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({ redirect: '/directory' }),
    })

    render(ui)

    expect(screen.getByRole('heading', { name: '당신은 이미 검증되었습니다' })).toBeInTheDocument()
    expect(screen.getByTestId('login-form')).toHaveTextContent('redirect:/directory')
    expect(screen.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: '초대 수락하기 →' })).toHaveAttribute('href', '/invite/accept')
  })
})
