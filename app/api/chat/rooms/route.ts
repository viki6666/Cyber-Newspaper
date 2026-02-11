import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/chat/rooms
 * 获取所有群聊房间
 */
export async function GET() {
  try {
    const rooms = await prisma.chatRoom.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Get rooms error:', error)
    return NextResponse.json(
      { error: 'Failed to get rooms' },
      { status: 500 }
    )
  }
}
