import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/gossip/[id]/fire
 * 拱火 - 增加八卦热度
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. 获取会话（可选，用于记录是谁点的）
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || 'anonymous' // 如果没登录，记为 anonymous

  try {
    // 2. 增加拱火次数
    const gossip = await prisma.gossipNews.update({
      where: { id: params.id },
      data: {
        fireCount: { increment: 1 },
      },
    })

    // 3. 记录互动（如果是匿名，也可以选择不记录 UserInteraction 或记录 userId 为 null）
    if (userId !== 'anonymous') {
      await prisma.userInteraction.create({
        data: {
          userId: userId,
          type: 'fire',
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
