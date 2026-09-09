import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isTokenValid(token: string): boolean {
    if (!token) return false
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return false
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8')
        const payload = JSON.parse(payloadJson)
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            return false
        }
        return true
    } catch {
        return false
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('accessToken')?.value || ''
    const isValid = isTokenValid(token)
    const protectedPaths = ['/reports', '/admin', '/payroll', '/refunds']
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    if (isProtectedPath && !isValid) {
        const url = new URL('/login', request.url)
        url.searchParams.set('callbackUrl', request.nextUrl.pathname)
        const response = NextResponse.redirect(url)
        if (token) {
            response.cookies.delete('accessToken')
        }
        return response
    }

    if (request.nextUrl.pathname === '/login' && isValid) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    const response = NextResponse.next()
    if (!isValid && token) {
        response.cookies.delete('accessToken')
    }
    return response
}

export const config = {
    matcher: ['/reports/:path*', '/admin/:path*', '/payroll/:path*', '/refunds/:path*', '/login'],
}
