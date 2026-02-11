import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('user_id')

    if (!userIdCookie) {
      return NextResponse.json({ user: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdCookie.value },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ user: null })
  }
}
