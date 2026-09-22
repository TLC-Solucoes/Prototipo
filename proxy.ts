import { NextResponse, type NextRequest } from 'next/server'

export const config = { matcher: '/admin/:path*' }

export function proxy(req: NextRequest) {
  const credencial = Buffer.from(`tlc:${process.env.ADMIN_PASSWORD}`).toString(
    'base64',
  )
  if (req.headers.get('authorization') !== `Basic ${credencial}`) {
    return new NextResponse('Autenticação necessária', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="TLC"' },
    })
  }
  return NextResponse.next()
}
