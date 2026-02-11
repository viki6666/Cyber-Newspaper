import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateChatRound, createAIAvatar } from '@/lib/ai-world'
import { mineStories, createStoryAndGossip } from '@/lib/story-miner'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/ai-world/generate-chat
 * 生成一轮AI群聊并挖掘故事
 */
export async function POST(request: Request) {
  try {
    const { roomId } = await request.json()

    // 优先从 Cookie 获取用户 ID (兼容自定义 Auth)
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('user_id')
    const currentUserId = userIdCookie?.value

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
    }

    // 确保当前用户的 AI 分身存在
    if (currentUserId) {
        try {
            const avatar = await prisma.aIAvatar.findUnique({ where: { userId: currentUserId } })
            if (!avatar) {
                console.log('Auto-creating missing avatar for user:', currentUserId)
                await createAIAvatar(currentUserId)
            }
        } catch (e) {
            console.error('Failed to ensure avatar exists:', e)
        }
    }

    // 生成一轮对话 (优先让当前用户的AI分身发言)
    await generateChatRound(roomId, undefined, currentUserId)

    // 挖掘故事
    const candidates = await mineStories(roomId)

    // 创建高置信度的故事
    const createdStories = []
    for (const candidate of candidates) {
      if (candidate.confidence >= 0.75) {
        try {
          const storyId = await createStoryAndGossip(candidate)
          createdStories.push(storyId)
        } catch (error) {
          console.error('Create story failed:', error)
        }
      }
    }

    return NextResponse.json({
      message: '对话生成成功',
      storiesCreated: createdStories.length,
      storyIds: createdStories,
    })
  } catch (error) {
    console.error('Generate chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate chat' },
      { status: 500 }
    )
  }
}
