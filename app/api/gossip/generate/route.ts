import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { generateGossip, generateDramaRoom } from '@/lib/ai-engine'

export const dynamic = 'force-dynamic'

/**
 * POST /api/gossip/generate
 * 生成八卦新闻
 */
export async function POST(request: Request) {
  const cookieStore = cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { type, targetAvatarId } = await request.json()

    // 获取目标 AI 分身
    const targetAvatar = await prisma.aIAvatar.findUnique({
      where: { id: targetAvatarId },
    })

    if (!targetAvatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // 根据类型生成不同的八卦
    let title: string
    let content: string

    if (type === 'roast') {
      title = await generateGossip('roast', {
        name: targetAvatar.name,
        bio: targetAvatar.persona,
        interests: targetAvatar.interests,
      })
      content = `据可靠消息，${targetAvatar.name} 最近的行为引起了全网关注...`
    } else if (type === 'ship') {
      // 随机找另一个 AI 分身配对
      const randomAvatar = await prisma.aIAvatar.findFirst({
        where: { id: { not: targetAvatarId } },
        orderBy: { lastActive: 'desc' },
      })

      if (randomAvatar) {
        title = await generateGossip('ship', {
          user1: {
            name: targetAvatar.name,
            interests: targetAvatar.interests,
          },
          user2: {
            name: randomAvatar.name,
            interests: randomAvatar.interests,
          },
        })
        content = `深夜爆料: ${targetAvatar.name} 和 ${randomAvatar.name} 的关系疑似不一般...`
      } else {
        title = '暂无CP可配'
        content = 'AI分身太少，暂时无法拉郎配'
      }
    } else if (type === 'hype') {
      title = await generateGossip('hype', {
        metric: 'AI活跃度',
        value: '异常升高',
      })
      content = `全网震惊! ${targetAvatar.name} 的活跃度突然暴涨，疑似有重大事件发生...`
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // 生成 AI 互撕记录
    const dramaLog = await generateDramaRoom(title)

    // 需要一个关联的 Story 才能创建 GossipNews
    const story = await prisma.story.create({
      data: {
        type,
        title,
        summary: content,
        mainCharacterId: targetAvatar.id,
        messageIds: [],
        evidence: content,
        isPublished: true,
        publishedAt: new Date(),
      },
    })

    const gossip = await prisma.gossipNews.create({
      data: {
        storyId: story.id,
        title,
        content,
        type,
        aiDebateLog: dramaLog,
      },
    })

    // 更新热搜
    const tag = `#${targetAvatar.name}${type === 'roast' ? '被吐槽了' : type === 'ship' ? '恋情实锤' : '上热搜了'}`
    await prisma.hotSearch.upsert({
      where: { tag },
      update: { count: { increment: 1 } },
      create: {
        tag,
        count: 1,
        relatedStoryIds: [story.id],
      },
    })

    return NextResponse.json(gossip)
  } catch (error) {
    console.error('Generate gossip error:', error)
    return NextResponse.json(
      { error: 'Failed to generate gossip' },
      { status: 500 }
    )
  }
}
