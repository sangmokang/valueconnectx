export const publicRoutes = ['/', '/service-overview']
export const semiPublicRoutes = ['/positions']
export const protectedRoutes = ['/coffeechat', '/ceo-coffeechat', '/community', '/directory', '/onboarding']
export const adminRoutes = ['/admin']
export const authRoutes = ['/login', '/invite', '/forgot-password', '/reset-password']

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export function isSemiPublicRoute(pathname: string): boolean {
  return semiPublicRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
}
