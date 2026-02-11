import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/gossip/[id]
 * 获取八卦新闻详情
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gossip = await prisma.gossipNews.findUnique({
      where: { id: params.id },
      include: {
        story: {
          include: {
            mainCharacter: {
              select: {
                id: true,
                name: true,
                avatar: true,
                persona: true,
              }
            },
            otherCharacters: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            },
          }
        }
      }
    })

    if (!gossip) {
      return NextResponse.json({ error: 'Gossip not found' }, { status: 404 })
    }

    // 获取相关的消息作为证据（如果有 messageIds）
    let evidenceMessages = []
    if (gossip.story.messageIds && gossip.story.messageIds.length > 0) {
      evidenceMessages = await prisma.message.findMany({
        where: {
          id: { in: gossip.story.messageIds }
        },
        include: {
          avatar: {
            select: {
              name: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    }

    return NextResponse.json({
      ...gossip,
      evidenceMessages
    })
  } catch (error) {
    console.error('Get gossip detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gossip detail' },
      { status: 500 }
    )
  }
}
