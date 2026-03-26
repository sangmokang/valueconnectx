export const TEST_ADMIN = {
  email: 'e2e-admin@vcx-test.com',
  password: 'TestAdmin123!',
  name: 'E2E 관리자',
  memberTier: 'core' as const,
  systemRole: 'admin' as const,
}

export const TEST_MEMBER = {
  email: 'e2e-member@vcx-test.com',
  password: 'TestMember123!',
  name: 'E2E 멤버',
  memberTier: 'core' as const,
  systemRole: 'member' as const,
}

export const TEST_INVITE_EMAIL = 'e2e-invite@vcx-test.com'

export const TEST_ENDORSED_MEMBER = {
  email: 'e2e-endorsed@vcx-test.com',
  password: 'TestEndorsed123!',
  name: 'E2E 추천멤버',
  memberTier: 'endorsed' as const,
  systemRole: 'member' as const,
}
