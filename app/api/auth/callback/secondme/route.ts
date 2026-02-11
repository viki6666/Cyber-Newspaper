import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeToken, getUserProfile, getUserShades } from '@/lib/secondme'
import { prisma } from '@/lib/prisma'
import { createAIAvatar } from '@/lib/ai-world'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    // 换取 token
    const tokenData = await exchangeToken(code, `${process.env.NEXTAUTH_URL}/api/auth/callback/secondme`)

    // 获取用户资料
    const userProfile = await getUserProfile(tokenData.access_token)

    // 获取用户兴趣标签 (Shades)
    let interests: string[] = []
    let personality: string | undefined
    try {
      const shades = await getUserShades(tokenData.access_token)
      if (shades.length > 0) {
        interests = shades.map(s => s.shadeName)
        personality = shades
          .slice(0, 3)
          .map(s => s.shadeDescription || s.shadeContent)
          .filter(Boolean)
          .join('; ')
      }
    } catch (error) {
      console.error('Failed to get user shades:', error)
      // 不阻断登录流程
    }

    // 计算过期时间
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000)

    // 存储用户
    const user = await prisma.user.upsert({
      where: { email: userProfile.email || userProfile.id },
      update: {
        name: userProfile.name,
        avatar: userProfile.avatar,
        bio: userProfile.bio,
        interests,
        personality,
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
      },
      create: {
        email: userProfile.email || userProfile.id,
        name: userProfile.name,
        avatar: userProfile.avatar,
        bio: userProfile.bio,
        interests,
        personality,
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
      },
    })

    // 自动创建 AI 分身（如果还没有）
    try {
      await createAIAvatar(user.id)
    } catch (error) {
      console.error('Failed to create AI avatar:', error)
      // 不阻断登录流程
    }

    // 设置登录 Cookie
    const cookieStore = cookies()
    cookieStore.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
    })

    // 登录成功，重定向到首页
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
