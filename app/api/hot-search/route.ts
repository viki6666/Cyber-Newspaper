import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/hot-search
 * 获取热搜榜
 */
export async function GET() {
  try {
    const hotSearches = await prisma.hotSearch.findMany({
      orderBy: {
        count: 'desc',
      },
      take: 10,
    })

    return NextResponse.json(hotSearches)
  } catch (error) {
    console.error('Hot search error:', error)
    return NextResponse.json(
      { error: 'Failed to get hot searches' },
      { status: 500 }
    )
  }
}
