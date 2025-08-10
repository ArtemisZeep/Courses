import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuth = !!req.auth
  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/auth')
  const isSignOutPage = pathname.startsWith('/auth/signout')
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')

  // Если пользователь на странице аутентификации и уже авторизован
  // Разрешаем доступ к странице выхода даже авторизованным
  if (isAuthPage && isAuth && !isSignOutPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Если пользователь не авторизован и пытается попасть на защищенную страницу
  if (!isAuth && (isDashboard || isAdminPage)) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Проверка доступа к админ панели
  if (isAdminPage && (!isAuth || !req.auth?.user?.isAdmin)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*'],
}