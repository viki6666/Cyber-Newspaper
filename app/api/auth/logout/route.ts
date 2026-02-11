import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/logout
 * 退出登录
 */
export async function POST() {
  const cookieStore = cookies()
  cookieStore.delete('user_id')

  return NextResponse.json({ success: true })
}
