import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

const { mockResetPasswordForEmail, mockCreateClient } = vi.hoisted(() => {
  const mockResetPasswordForEmail = vi.fn()
  const mockCreateClient = vi.fn(() => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }))
  return { mockResetPasswordForEmail, mockCreateClient }
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: mockCreateClient,
}))

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom does not provide window.location.origin by default
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost' },
      writable: true,
    })
  })

  it('renders email input and submit button', () => {
    render(<ForgotPasswordForm />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재설정 링크 보내기' })).toBeInTheDocument()
  })

  it('calls resetPasswordForEmail with email and redirectTo', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null })

    render(<ForgotPasswordForm />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }))

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'http://localhost/reset-password',
      })
    })
  })

  it('shows "이메일을 확인해주세요" after successful send', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null })

    render(<ForgotPasswordForm />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }))

    await waitFor(() => {
      expect(screen.getByText('이메일을 확인해주세요')).toBeInTheDocument()
    })
  })

  it('shows error on failure', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: new Error('send failed') })

    render(<ForgotPasswordForm />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'fail@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }))

    await waitFor(() => {
      expect(screen.getByText('오류가 발생했습니다. 잠시 후 다시 시도해주세요')).toBeInTheDocument()
    })
  })
})
