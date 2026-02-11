import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/gossip/[id]/fire
 * 拱火 - 增加八卦热度
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // 1. 获取会话（可选，用于记录是谁点的）
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  try {
    // 2. 增加拱火次数
    const gossip = await prisma.gossipNews.update({
      where: { id: params.id },
      data: {
        fireCount: { increment: 1 },
      },
    })

    // 3. 记录互动（仅当用户已登录时）
    if (userId) {
      await prisma.userInteraction.create({
        data: {
          userId: userId,
          type: 'fire',
          targetType: 'gossip',
          targetId: params.id,
        },
      })
    }

    return NextResponse.json({
      message: '拱火成功！AI们笑得更开心了',
      fireCount: gossip.fireCount,
    })
  } catch (error) {
    console.error('Fire gossip error:', error)
    return NextResponse.json(
      { error: 'Failed to fire gossip' },
      { status: 500 }
    )
  }
}
