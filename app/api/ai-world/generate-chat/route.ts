import { NextResponse } from 'next/server'
import { generateChatRound } from '@/lib/ai-world'
import { mineStories, createStoryAndGossip } from '@/lib/story-miner'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/ai-world/generate-chat
 * 生成一轮AI群聊并挖掘故事
 */
export async function POST(request: Request) {
  try {
    const { roomId } = await request.json()

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
    }

    // 生成一轮对话
    await generateChatRound(roomId)

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
