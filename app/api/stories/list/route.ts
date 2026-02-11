import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/stories/list
 * 获取故事列表
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // 可选的类型筛选

    const stories = await prisma.story.findMany({
      where: {
        isPublished: true,
        ...(type && { type }),
      },
      orderBy: [
        { fireCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
      include: {
        mainCharacter: {
          select: {
            name: true,
            avatar: true,
          },
        },
        gossipNews: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({
      stories,
      total: stories.length,
    })
  } catch (error) {
    console.error('List stories error:', error)
    return NextResponse.json(
      { error: 'Failed to list stories' },
      { status: 500 }
    )
  }
}
