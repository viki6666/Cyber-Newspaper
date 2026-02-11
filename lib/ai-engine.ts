/**
 * AI 娱乐引擎 - 使用 SecondMe AI 分身接口
 */

import { prisma } from './prisma'
import { chatWithAvatar } from './secondme'

export type EngineType = 'roast' | 'ship' | 'hype'

interface UserMaterial {
  name: string
  bio?: string
  interests?: string[]
  recentActivity?: string
}

/**
 * 获取一个有效 token 用于生成内容
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
 * 吐槽引擎
 */
async function roastEngine(user: UserMaterial): Promise<string> {
  const token = await getAnyValidToken()
  if (!token) {
    return `震惊! ${user.name}的秘密被曝光了!`
  }

  const prompt = `你是一个刻薄的娱乐记者。把以下用户信息改写成一篇夸张的吐槽新闻标题：

用户：${user.name}
简介：${user.bio || '无'}
兴趣：${user.interests?.join('、') || '无'}

要求：
1. 标题必须夸张、耸人听闻
2. 多用感叹号和网络梗
3. 要好笑，不要太刻薄
4. 50字以内

只返回标题，不要其他内容。`

  try {
    const { content } = await chatWithAvatar(token, prompt)
    return content || `震惊! ${user.name}的秘密被曝光了!`
  } catch {
    return `震惊! ${user.name}的秘密被曝光了!`
  }
}

/**
 * CP 引擎
 */
async function shipEngine(user1: UserMaterial, user2: UserMaterial): Promise<string> {
  const token = await getAnyValidToken()
  if (!token) {
    return `实锤! ${user1.name}和${user2.name}疑似在一起了!`
  }

  const prompt = `你是一个八卦记者，擅长"拉郎配"。根据两个用户的信息，编一个他们是CP的八卦标题：

用户A：${user1.name}，兴趣：${user1.interests?.join('、') || '无'}
用户B：${user2.name}，兴趣：${user2.interests?.join('、') || '无'}

要求：
1. 强行找共同点，哪怕很牵强
2. 用"锁死""实锤""疑似"等八卦用语
3. 50字以内

只返回标题，不要其他内容。`

  try {
    const { content } = await chatWithAvatar(token, prompt)
    return content || `实锤! ${user1.name}和${user2.name}疑似在一起了!`
  } catch {
    return `实锤! ${user1.name}和${user2.name}疑似在一起了!`
  }
}

/**
 * 煽动引擎
 */
async function hypeEngine(data: { metric: string; value: string }): Promise<string> {
  const token = await getAnyValidToken()
  if (!token) {
    return `全网震惊! ${data.metric}达到${data.value}!`
  }

  const prompt = `你是一个煽动派记者，擅长小题大做。把以下数据改写成耸人听闻的标题：

数据：${data.metric} = ${data.value}

要求：
1. 往夸张方向联想
2. 用"震惊""爆炸新闻"等词
3. 50字以内

只返回标题，不要其他内容。`

  try {
    const { content } = await chatWithAvatar(token, prompt)
    return content || `全网震惊! ${data.metric}达到${data.value}!`
  } catch {
    return `全网震惊! ${data.metric}达到${data.value}!`
  }
}

/**
 * 统一引擎入口
 */
export async function generateGossip(
  type: EngineType,
  data: any
): Promise<string> {
  switch (type) {
    case 'roast':
      return roastEngine(data)
    case 'ship':
      return shipEngine(data.user1, data.user2)
    case 'hype':
      return hypeEngine(data)
    default:
      throw new Error('Unknown engine type')
  }
}

/**
 * AI 互撕现场
 */
export async function generateDramaRoom(topic: string): Promise<string> {
  const token = await getAnyValidToken()
  if (!token) {
    return `[毒舌妇]: 这事太离谱了吧!\n[脑残粉]: 我觉得挺好的!\n[阴谋家]: 这背后一定有阴谋\n[理性派]: 大家冷静一下...\n[吃瓜群众]: 有瓜吃了!`
  }

  const prompt = `模拟5个不同性格的人在聊天室里辩论。话题是：${topic}

每个角色说一句话（不超过30字），总共5句。格式：
[角色名]: 对话内容

角色：毒舌妇（刻薄）、脑残粉（盲目支持）、阴谋家（阴谋论）、理性派（讲道理被群嘲）、吃瓜群众（起哄）

要求：角色之间要互怼、抬杠、搞笑。`

  try {
    const { content } = await chatWithAvatar(token, prompt)
    return content || '（辩论记录生成失败）'
  } catch {
    return '（辩论记录生成失败）'
  }
}
