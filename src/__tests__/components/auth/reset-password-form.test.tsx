import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

const { mockUpdateUser, mockCreateClient, mockPush } = vi.hoisted(() => {
  const mockUpdateUser = vi.fn()
  const mockCreateClient = vi.fn(() => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  }))
  const mockPush = vi.fn()
  return { mockUpdateUser, mockCreateClient, mockPush }
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: mockCreateClient,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders password and confirm inputs', () => {
    render(<ResetPasswordForm />)
    const inputs = screen.getAllByPlaceholderText('••••••••')
    expect(inputs).toHaveLength(2)
    expect(screen.getByRole('button', { name: '비밀번호 변경하기' })).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    render(<ResetPasswordForm />)

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'different123' } })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경하기' }))

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
    })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('shows error when password is shorter than 8 characters', async () => {
    render(<ResetPasswordForm />)

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    fireEvent.change(confirmInput, { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경하기' }))

    await waitFor(() => {
      expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument()
    })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('calls updateUser with new password on success', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null })

    render(<ResetPasswordForm />)

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경하기' }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
    })
  })

  it('redirects to /login on success', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null })

    render(<ResetPasswordForm />)

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경하기' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})
