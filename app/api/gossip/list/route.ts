import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gossip/list
 * 获取八卦新闻列表
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const gossips = await prisma.gossipNews.findMany({
      where: {
        removed: false,
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            mainCharacter: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: [
        { fireCount: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await prisma.gossipNews.count({
      where: { removed: false },
    })

    return NextResponse.json({
      data: gossips,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('List gossip error:', error)
    return NextResponse.json(
      { error: 'Failed to list gossip' },
      { status: 500 }
    )
  }
}
