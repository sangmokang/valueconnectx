import { headers } from 'next/headers'
import { LoginWall } from '@/components/auth/login-wall'

export async function ProtectedPageWrapper({
  children,
  currentPath,
}: {
  children: React.ReactNode
  currentPath: string
}) {
  const headersList = await headers()
  const isAuthenticated = headersList.get('x-vcx-authenticated') === 'true'

  return (
    <>
      {children}
      {!isAuthenticated && <LoginWall currentPath={currentPath} />}
    </>
  )
}
