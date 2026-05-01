export const DEV_QA_EMAIL = 'sangmokang@valueconnect.kr'
export const DEV_QA_COOKIE = 'vcx_dev_qa'

export function isDevQaEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export function isDevQaEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEV_QA_EMAIL
}

export function isDevQaCookieValue(value?: string | null): boolean {
  return isDevQaEnabled() && value === DEV_QA_EMAIL
}

export const devQaUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  name: 'Sangmo Kang',
  email: DEV_QA_EMAIL,
  memberTier: 'core',
  systemRole: 'member',
  avatarUrl: null,
} as const
