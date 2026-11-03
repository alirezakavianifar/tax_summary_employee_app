import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function decodeJwtPayload(token: string): any | null {
    if (!token) return null
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4) {
            base64 += '='
        }
        let jsonStr: string
        if (typeof Buffer !== 'undefined') {
            jsonStr = Buffer.from(base64, 'base64').toString('utf-8')
        } else {
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i)
            }
            jsonStr = new TextDecoder().decode(bytes)
        }
        return JSON.parse(jsonStr)
    } catch {
        return null
    }
}

function isTokenValid(token: string): boolean {
    const payload = decodeJwtPayload(token)
    if (!payload) return false
    // Allow 30 seconds clock skew tolerance
    if (payload.exp && Date.now() >= (payload.exp + 30) * 1000) {
        return false
    }
    return true
}

function getBackendBaseUrl(): string {
    if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL.replace(/\/api\/?$/, '')
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    return 'http://127.0.0.1:5000'
}

export async function middleware(request: NextRequest) {
    let token = request.cookies.get('accessToken')?.value || ''
    let isValid = isTokenValid(token)
    const protectedPaths = ['/reports', '/admin', '/payroll', '/refunds', '/reporting']
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    // If access token is invalid or expired, but we have a refreshToken cookie, attempt silent refresh
    let refreshedAccessToken: string | null = null
    let rotatedRefreshToken: string | null = null

    if (isProtectedPath && !isValid) {
        const refreshTokenCookie = request.cookies.get('refreshToken')?.value
        if (refreshTokenCookie) {
            try {
                const backendUrl = getBackendBaseUrl()
                const refreshRes = await fetch(`${backendUrl}/api/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Cookie': `refreshToken=${refreshTokenCookie}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (refreshRes.ok) {
                    const data = await refreshRes.json()
                    if (data?.accessToken && isTokenValid(data.accessToken)) {
                        token = data.accessToken
                        isValid = true
                        refreshedAccessToken = data.accessToken

                        const setCookieHeader = refreshRes.headers.get('set-cookie')
                        if (setCookieHeader) {
                            const match = setCookieHeader.match(/refreshToken=([^;]+)/)
                            if (match && match[1]) {
                                rotatedRefreshToken = match[1]
                            }
                        }
                    }
                }
            } catch {
                // If backend is unreachable or refresh fails, proceed to login redirect
            }
        }
    }

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
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
        const target = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('/login')
            ? callbackUrl
            : '/'
        return NextResponse.redirect(new URL(target, request.url))
    }

    const response = NextResponse.next()

    // If token was refreshed during middleware check, set the cookie on the response
    if (refreshedAccessToken) {
        response.cookies.set('accessToken', refreshedAccessToken, {
            path: '/',
            maxAge: 3600,
            sameSite: 'lax',
            secure: request.url.startsWith('https:')
        })
    }
    if (rotatedRefreshToken) {
        response.cookies.set('refreshToken', rotatedRefreshToken, {
            path: '/',
            httpOnly: true,
            maxAge: 7 * 86400,
            sameSite: 'lax',
            secure: request.url.startsWith('https:')
        })
    }

    if (!isValid && token) {
        response.cookies.delete('accessToken')
    }

    return response
}

export const config = {
    matcher: ['/reports/:path*', '/admin/:path*', '/payroll/:path*', '/refunds/:path*', '/reporting/:path*', '/login'],
}

