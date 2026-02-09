import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('accessToken')?.value || ''
    const protectedPaths = ['/reports', '/admin']
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    if (isProtectedPath && !token) {
        const url = new URL('/login', request.url)
        url.searchParams.set('callbackUrl', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname === '/login' && token) {
        return NextResponse.redirect(new URL('/reports', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/reports/:path*', '/admin/:path*', '/login'],
}
