import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/secondme'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/url
 * 获取 SecondMe OAuth 授权 URL
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectUri = searchParams.get('redirect_uri') || `${process.env.NEXTAUTH_URL}/api/auth/callback/secondme`

  const authUrl = getAuthUrl(redirectUri)

  return NextResponse.json({ authUrl })
}
