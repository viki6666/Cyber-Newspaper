import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/chat/[roomId]/messages
 * 获取群聊消息
 */
export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // 消息ID，用于分页

    const messages = await prisma.message.findMany({
      where: {
        roomId: params.roomId,
        ...(before && {
          createdAt: {
            lt: new Date(before),
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
            avatar: true,
            mood: true,
          },
        },
      },
    })

    return NextResponse.json({
      messages: messages.reverse(), // 返回正序
      hasMore: messages.length === limit,
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}
