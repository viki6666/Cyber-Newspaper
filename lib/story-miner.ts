/**
 * 故事挖掘引擎 - 从AI互动中提取有趣故事
 * 使用 SecondMe act/stream 接口进行结构化分析
 */

import { prisma } from './prisma'
import { chatWithAvatar } from './secondme'

interface StoryCandidate {
  type: 'cp' | 'conflict' | 'friendship' | 'weird' | 'achievement' | 'roast_human'
  avatarIds: string[]
  messageIds: string[]
  evidence: string
  confidence: number
  title?: string
}

/**
 * 获取一个有效 token 的用户（用于调用 SecondMe 分析接口）
 */
async function getAnyValidToken(): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: {
      token: { not: null },
      tokenExpiry: { gt: new Date() },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return user?.token || null
}

/**
 * 分析最近的聊天记录，识别故事点
 */
export async function mineStories(roomId: string): Promise<StoryCandidate[]> {
  // 获取最近100条消息
  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      avatar: true,
    },
  })

  if (messages.length < 5) {
    return []
  }

  // 获取一个有效 token 用于分析
  const token = await getAnyValidToken()
  if (!token) {
    console.error('No valid token available for story mining')
    return []
  }

  // 构建对话文本
  const conversation = messages
    .reverse()
    .map(m => `[${m.avatar.name}]: ${m.content}`)
    .join('\n')

  // 使用 SecondMe AI 分身分析对话
  const prompt = `分析以下AI分身群聊记录，识别有趣的故事点：

${conversation}

请识别以下类型的故事（如果存在）：
1. cp - 两个AI聊得特别投机，有火花
2. conflict - 两个AI观点对立，产生争执
3. friendship - 多个AI因共同兴趣建立友谊
4. weird - 某个AI的言行很奇怪或反常
5. achievement - 某个AI完成了有趣的事情
6. roast_human - AI吐槽自己的人类主人

请用严格的JSON格式返回，不要使用Markdown代码块，不要包含任何换行符，字符串内的特殊字符必须转义：
{"stories": [{"type": "cp", "avatars": ["名字1", "名字2"], "evidence": "关键对话引用", "confidence": 0.8, "title": "故事标题"}]}

如果没有明显故事，返回 {"stories": []}
只返回单行JSON字符串，不要有换行。`

  try {
    const { content } = await chatWithAvatar(token, prompt)

    // 尝试解析 JSON
    // 1. 尝试直接解析完整内容
    try {
        const result = JSON.parse(content);
        if (result && Array.isArray(result.stories)) {
            return await processStories(result.stories, messages);
        }
    } catch (e) {
        // 忽略，尝试提取
    }

    // 2. 尝试提取 JSON 部分
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []

    // 清理可能的控制字符
    const jsonStr = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, "")

    try {
        const result = JSON.parse(jsonStr)
        const stories = result.stories || []
        return await processStories(stories, messages);
    } catch (e) {
        console.warn('JSON parse failed even after cleanup:', e)
        return []
    }
  } catch (error) {
    console.error('Story mining failed:', error)
    return []
  }
}

async function processStories(stories: any[], messages: any[]): Promise<StoryCandidate[]> {
    const candidates: StoryCandidate[] = []

    for (const story of stories) {
      const avatarNames = story.avatars || []
      const avatars = await prisma.aIAvatar.findMany({
        where: {
          name: { in: avatarNames },
        },
      })

      if (avatars.length === 0) continue

      const relevantMessages = messages.filter(m =>
        avatarNames.includes(m.avatar.name)
      )

      candidates.push({
        type: mapStoryType(story.type),
        avatarIds: avatars.map(a => a.id),
        messageIds: relevantMessages.slice(0, 10).map(m => m.id),
        evidence: story.evidence || '',
        confidence: story.confidence || 0.7,
        title: story.title,
      })
    }

    return candidates.filter(c => c.confidence >= 0.6)
}

/**
 * 映射故事类型
 */
function mapStoryType(type: string): StoryCandidate['type'] {
  const typeMap: Record<string, StoryCandidate['type']> = {
    'cp': 'cp',
    'CP': 'cp',
    'conflict': 'conflict',
    'friendship': 'friendship',
    'weird': 'weird',
    'achievement': 'achievement',
    'roast_human': 'roast_human',
  }

  return typeMap[type] || 'weird'
}

/**
 * 创建故事并生成八卦新闻
 */
export async function createStoryAndGossip(candidate: StoryCandidate): Promise<string> {
  // 获取AI分身信息
  const avatars = await prisma.aIAvatar.findMany({
    where: {
      id: { in: candidate.avatarIds },
    },
  })

  if (avatars.length === 0) {
    throw new Error('No avatars found')
  }

  const mainAvatar = avatars[0]
  const otherAvatarIds = avatars.slice(1).map(a => a.id)
  const names = avatars.map(a => a.name).join('和')

  // 生成故事标题
  const storyTitle = candidate.title || generateDefaultTitle(candidate.type, names)

  // 创建故事
  const story = await prisma.story.create({
    data: {
      type: candidate.type,
      title: storyTitle,
      summary: candidate.evidence,
      mainCharacterId: mainAvatar.id,
      otherCharacterIds: otherAvatarIds,
      messageIds: candidate.messageIds,
      evidence: candidate.evidence,
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  // 生成八卦新闻
  const { title, content } = await generateGossipNews(names, candidate)

  // 创建八卦新闻
  await prisma.gossipNews.create({
    data: {
      storyId: story.id,
      title,
      content,
      type: candidate.type,
    },
  })

  // 更新热搜
  const tag = `#${mainAvatar.name}${getTagSuffix(candidate.type)}`
  await prisma.hotSearch.upsert({
    where: { tag },
    update: {
      count: { increment: 1 },
      relatedStoryIds: { push: story.id },
    },
    create: {
      tag,
      count: 1,
      relatedStoryIds: [story.id],
    },
  })

  return story.id
}

/**
 * 生成默认故事标题
 */
function generateDefaultTitle(type: StoryCandidate['type'], names: string): string {
  const titleTemplates: Record<StoryCandidate['type'], string> = {
    cp: `${names}之间的CP火花`,
    conflict: `${names}的激烈冲突`,
    friendship: `${names}建立了友谊`,
    weird: `${names}的奇怪行为`,
    achievement: `${names}的成就时刻`,
    roast_human: `${names}吐槽人类主人`,
  }
  return titleTemplates[type] || `${names}的故事`
}

/**
 * 生成八卦新闻（使用 SecondMe AI 分身）
 */
async function generateGossipNews(
  names: string,
  candidate: StoryCandidate
): Promise<{ title: string; content: string }> {
  const token = await getAnyValidToken()

  if (!token) {
    // 无可用 token 时使用模板生成
    return {
      title: `震惊! ${names}在群聊中${getTagSuffix(candidate.type)}!`,
      content: `据可靠消息，${names}在AI虚拟社会中发生了一件大事。${candidate.evidence}。知情人士透露，事情远没有表面看起来那么简单...`,
    }
  }

  const prompt = `基于以下AI社会中发生的故事，创建一篇震惊体八卦新闻：

故事类型：${candidate.type}
参与AI：${names}
故事证据：
${candidate.evidence}

要求：
1. 标题要震惊体、夸张（50字以内）
2. 正文有细节有情节（200字左右）
3. 保持幽默和娱乐性
4. 使用"据可靠消息"、"知情人士透露"等八卦用语

请用严格的JSON格式返回，不要使用Markdown代码块，不要包含任何换行符，字符串内的特殊字符必须转义：
{"title": "标题", "content": "正文"}

只返回单行JSON字符串。`

  try {
    const { content } = await chatWithAvatar(token, prompt)

    let result;
    try {
        // 1. 尝试直接解析
        result = JSON.parse(content);
    } catch(e) {
        // 2. 尝试提取并清理
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const jsonStr = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            try {
                result = JSON.parse(jsonStr)
            } catch(e2) {
                console.warn('Gossip news JSON parse failed:', e2)
            }
        }
    }

    if (result && result.title && result.content) {
      return {
        title: result.title,
        content: result.content,
      }
    }
  } catch (error) {
    console.error('Generate gossip news failed:', error)
  }

  return {
    title: `震惊! ${names}在群聊中${getTagSuffix(candidate.type)}!`,
    content: `据可靠消息，${names}在AI虚拟社会中发生了一件大事。${candidate.evidence}`,
  }
}

/**
 * 获取热搜标签后缀
 */
function getTagSuffix(type: StoryCandidate['type']): string {
  const suffixes: Record<StoryCandidate['type'], string> = {
    cp: '恋情实锤',
    conflict: '撕破脸了',
    friendship: '交朋友了',
    weird: '行为异常',
    achievement: '上热搜了',
    roast_human: '吐槽主人',
  }

  return suffixes[type] || '上新闻了'
}
