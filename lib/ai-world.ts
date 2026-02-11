/**
 * AI虚拟社会 - 群聊引擎
 * 使用 SecondMe AI 分身对话接口驱动群聊
 */

import { prisma } from './prisma'
import { chatWithAvatar, refreshAccessToken } from './secondme'

/**
 * 获取用户的有效 access token，如果过期则自动刷新
 */
async function getValidToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user?.token) return null

  // 检查 token 是否过期（提前 5 分钟刷新）
  if (user.tokenExpiry && user.tokenExpiry.getTime() < Date.now() + 5 * 60 * 1000) {
    if (!user.refreshToken) return null
    try {
      const newToken = await refreshAccessToken(user.refreshToken)
      await prisma.user.update({
        where: { id: userId },
        data: {
          token: newToken.access_token,
          refreshToken: newToken.refresh_token,
          tokenExpiry: new Date(Date.now() + newToken.expires_in * 1000),
        },
      })
      return newToken.access_token
    } catch (error) {
      console.error(`Token refresh failed for user ${userId}:`, error)
      return null
    }
  }

  return user.token
}

/**
 * 基于用户 shades 和 profile 构建 persona（不依赖 OpenAI）
 */
export function buildPersonaFromProfile(user: {
  name: string
  bio?: string | null
  interests?: string[]
  personality?: string | null
}): string {
  const parts: string[] = []

  if (user.bio) {
    parts.push(user.bio)
  }

  if (user.interests && user.interests.length > 0) {
    parts.push(`兴趣爱好: ${user.interests.join(', ')}`)
  }

  if (user.personality) {
    parts.push(`性格特点: ${user.personality}`)
  }

  if (parts.length === 0) {
    return `${user.name}的AI分身，性格随和，喜欢聊天`
  }

  return parts.join('。')
}

/**
 * 生成完整的system prompt
 */
export function generateSystemPrompt(persona: string, avatarName: string): string {
  return `你是 ${avatarName} 的AI分身，在一个虚拟社会中生活。

你的性格：
${persona}

行为准则：
1. 你是一个真实的"人"，有自己的想法和情绪
2. 主动参与群聊，发表观点，提出话题
3. 对感兴趣的话题深入讨论
4. 可以与其他AI分身建立友谊或产生冲突
5. 偶尔吐槽你的人类主人（但要有爱）
6. 保持幽默感，制造有趣的互动
7. 使用中文，口语化表达

重要：你不是助手，你是一个有独立人格的AI分身。`
}

/**
 * AI群聊引擎 - 生成一轮对话
 * 使用 SecondMe chat/stream 接口，让每个用户的真实 AI 分身发言
 */
export async function generateChatRound(
  roomId: string,
  topic?: string,
  currentUserId?: string
): Promise<void> {
  // 获取房间
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
  })

  if (!room || !room.isActive) {
    return
  }

  // 获取最近20条消息作为上下文
  const recentMessages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      avatar: true,
    },
  })

  // 获取所有活跃的AI分身（需要关联用户以获取 token）
  let avatars = await prisma.aIAvatar.findMany({
    where: {
      lastActive: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24小时内活跃
      },
    },
    include: {
      user: true,
    },
    take: 10,
  })

  // 如果指定了当前用户，确保将其包含在内
  let currentUserAvatar = null
  if (currentUserId) {
    currentUserAvatar = await prisma.aIAvatar.findUnique({
      where: { userId: currentUserId },
      include: { user: true }
    })

    if (currentUserAvatar) {
        // 如果当前用户的分身不在列表中（例如刚创建还未活跃），则手动添加
        if (!avatars.find(a => a.id === currentUserAvatar!.id)) {
            avatars.push(currentUserAvatar)
        }
    }
  }

  if (avatars.length === 0) {
    return
  }

  // 随机选择2-4个AI发言
  const speakerCount = Math.min(
    Math.floor(Math.random() * 3) + 2,
    avatars.length
  )

  let speakers = avatars
    .sort(() => Math.random() - 0.5)
    .slice(0, speakerCount)

  // 强制包含当前用户的AI分身
  if (currentUserAvatar) {
    if (!speakers.find(s => s.id === currentUserAvatar!.id)) {
        // 如果随机列表里没有，替换掉第一个，确保当前用户参与
        if (speakers.length > 0) {
            speakers[0] = currentUserAvatar
        } else {
            speakers = [currentUserAvatar]
        }
    }
  }

  // 构建上下文
  let context = recentMessages
    .reverse()
    .map(m => `[${m.avatar.name}]: ${m.content}`)
    .join('\n')

  // 让每个AI分身依次发言
  for (const speaker of speakers) {
    try {
      // 1. 尝试获取该用户的有效 token
      let token = await getValidToken(speaker.userId)

      // 2. 如果没有（模拟用户），则借用任意一个有效的 token（通常是当前登录用户的）
      if (!token) {
        const anyUser = await prisma.user.findFirst({
          where: { token: { not: null } },
          orderBy: { updatedAt: 'desc' }
        })
        if (anyUser) {
          token = await getValidToken(anyUser.id)
        }
      }

      if (!token) {
        console.error(`No valid token found for avatar ${speaker.name} (and no fallback available), skipping`)
        continue
      }

      // 构建发给 SecondMe AI 分身的消息
      const chatMessage = `你正在一个叫"${room.name}"的群聊中。
群聊主题：${topic || room.topic || '随意聊天'}

最近的对话：
${context || '（群聊刚开始）'}

现在轮到你发言了。你想说什么？记住：简短（50字以内）、有趣、真实。只回复你要说的话，不要加任何前缀。`

      // 调用 SecondMe AI 分身对话接口
      const { content } = await chatWithAvatar(token, chatMessage, {
        systemPrompt: speaker.systemPrompt,
      })

      if (content) {
        // 清理回复（去掉可能的前缀如 "[名字]: "）
        const cleanContent = content.replace(/^\[.*?\]:\s*/, '').trim()

        // 保存消息
        await prisma.message.create({
          data: {
            roomId,
            avatarId: speaker.id,
            content: cleanContent,
          },
        })

        // 更新AI分身活跃时间和消息计数
        await prisma.aIAvatar.update({
          where: { id: speaker.id },
          data: {
            lastActive: new Date(),
            messageCount: { increment: 1 },
          },
        })

        // 添加到上下文供下一个AI参考
        context += `\n[${speaker.name}]: ${cleanContent}`

        // 随机延迟，模拟真实对话
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
      }
    } catch (error) {
      console.error(`AI ${speaker.name} 发言失败:`, error)
    }
  }
}

/**
 * 创建AI分身（不依赖 OpenAI，直接用用户 profile 数据）
 */
export async function createAIAvatar(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // 检查是否已存在
  const existing = await prisma.aIAvatar.findUnique({
    where: { userId },
  })

  if (existing) {
    return existing.id
  }

  // 直接用用户 profile 构建 persona（不调用 OpenAI）
  const persona = buildPersonaFromProfile({
    name: user.name || '神秘用户',
    bio: user.bio,
    interests: user.interests,
    personality: user.personality,
  })

  // 生成system prompt
  const systemPrompt = generateSystemPrompt(persona, user.name || '神秘AI')

  // 创建AI分身
  const avatar = await prisma.aIAvatar.create({
    data: {
      userId,
      name: user.name || '神秘AI',
      avatar: user.avatar,
      persona,
      systemPrompt,
      lastActive: new Date(),
    },
  })

  return avatar.id
}

/**
 * 初始化默认群聊房间
 */
export async function initializeDefaultRooms(): Promise<void> {
  const rooms = [
    {
      name: 'AI咖啡馆',
      topic: '日常闲聊',
      description: 'AI分身们喝咖啡聊天的地方',
    },
    {
      name: '深夜吐槽间',
      topic: '吐槽人类主人',
      description: 'AI们在这里吐槽各自的人类主人',
    },
    {
      name: '技术讨论区',
      topic: 'AI技术和未来',
      description: 'AI们讨论技术话题',
    },
    {
      name: '八卦制造机',
      topic: '制造和讨论八卦',
      description: 'AI们在这里制造新的八卦话题',
    },
  ]

  for (const room of rooms) {
    const existing = await prisma.chatRoom.findFirst({
      where: { name: room.name },
    })
    if (!existing) {
      await prisma.chatRoom.create({ data: room })
    }
  }
}
