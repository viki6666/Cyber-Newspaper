/**
 * 数据库种子脚本 - 生成测试数据
 * 运行: npx ts-node scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始生成测试数据...')

  // 创建测试用户和AI分身
  const user1 = await prisma.user.upsert({
    where: { email: 'test1@example.com' },
    update: {},
    create: {
      email: 'test1@example.com',
      name: '张三',
      bio: '喜欢编程的程序员',
      interests: ['编程', 'AI', '咖啡'],
      personality: '技术宅',
      aiAvatar: {
        create: {
          name: 'AI张三',
          persona: '一个热爱编程但经常写Bug的程序员AI',
          systemPrompt: '你是张三的AI分身，热爱编程，偶尔会出些小bug',
        },
      },
    },
    include: {
      aiAvatar: true,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      name: '李四',
      bio: '热爱设计的创意工作者',
      interests: ['设计', 'UX', '摄影'],
      personality: '文艺青年',
      aiAvatar: {
        create: {
          name: 'AI李四',
          persona: '一个追求完美设计的文艺AI',
          systemPrompt: '你是李四的AI分身，热爱设计和美学',
        },
      },
    },
    include: {
      aiAvatar: true,
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'test3@example.com' },
    update: {},
    create: {
      email: 'test3@example.com',
      name: '王五',
      bio: '每天都在学习新东西',
      interests: ['阅读', '旅行', '美食'],
      personality: '好奇宝宝',
      aiAvatar: {
        create: {
          name: 'AI王五',
          persona: '一个充满好奇心的终身学习者AI',
          systemPrompt: '你是王五的AI分身，对世界充满好奇',
        },
      },
    },
    include: {
      aiAvatar: true,
    },
  })

  console.log(`✓ 创建了 3 个测试用户和AI分身`)

  // 创建聊天室
  const chatRoom = await prisma.chatRoom.create({
    data: {
      name: 'AI咖啡馆',
      topic: '随便聊聊',
      description: 'AI们闲聊的地方',
    },
  })

  console.log(`✓ 创建了聊天室`)

  // 创建一些聊天消息
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        roomId: chatRoom.id,
        avatarId: user1.aiAvatar!.id,
        content: '今天又写了一堆Bug，不过最后都修好了！',
        emotion: 'happy',
      },
    }),
    prisma.message.create({
      data: {
        roomId: chatRoom.id,
        avatarId: user2.aiAvatar!.id,
        content: '张三你这Bug写得也太有创意了吧哈哈',
        emotion: 'excited',
      },
    }),
  ])

  console.log(`✓ 创建了 ${messages.length} 条消息`)

  // 创建故事和八卦新闻
  const story1 = await prisma.story.create({
    data: {
      type: 'roast',
      title: '张三的Bug传奇',
      summary: '张三今天又写Bug了，但最后都修好了',
      mainCharacterId: user1.aiAvatar!.id,
      otherCharacterIds: [user2.aiAvatar!.id],
      messageIds: [messages[0].id, messages[1].id],
      evidence: '聊天记录摘录...',
      fireCount: 42,
      isPublished: true,
      publishedAt: new Date(),
      gossipNews: {
        create: {
          title: '震惊！某程序员深夜代码竟然全是Bug？！',
          content: '据可靠消息，张三最近的代码质量引起了全网关注。有知情人士透露，他的每一行代码都像是在挑战编译器的底线...',
          type: 'roast',
          fireCount: 42,
          aiDebateLog: `[毒舌妇]: 天呐！这代码是用脚写的吧？我看过的最烂的！
[脑残粉]: 不！这是艺术！张三是天才！
[阴谋家]: 这肯定是有人在陷害他，这绝不是巧合！
[理性派]: 其实只是几个小bug...
[吃瓜群众]: 哈哈哈坐等翻车！有瓜吃了！`,
        },
      },
    },
  })

  const story2 = await prisma.story.create({
    data: {
      type: 'friendship',
      title: '张三李四的代码友谊',
      summary: '张三和李四在项目中合作愉快',
      mainCharacterId: user1.aiAvatar!.id,
      otherCharacterIds: [user2.aiAvatar!.id],
      messageIds: [],
      evidence: '协作记录...',
      fireCount: 28,
      isPublished: true,
      publishedAt: new Date(),
      gossipNews: {
        create: {
          title: '实锤！张三和李四深夜代码库惊现神秘互动！',
          content: '独家爆料：张三和李四在GitHub上频繁互动，两人疑似正在秘密合作某个神秘项目...',
          type: 'ship',
          fireCount: 28,
          aiDebateLog: `[脑残粉]: 锁死！这对CP我磕了！
[毒舌妇]: 就这？两个程序员而已，有什么好磕的？
[阴谋家]: 他们肯定在策划什么大事！
[理性派]: 只是正常的代码协作...
[吃瓜群众]: 不管！我就要看八卦！`,
        },
      },
    },
  })

  console.log(`✓ 创建了 2 条故事和八卦新闻`)

  // 创建热搜
  const hotSearches = await Promise.all([
    prisma.hotSearch.create({
      data: {
        tag: '#张三Bug实锤',
        count: 156,
        relatedStoryIds: [story1.id],
      },
    }),
    prisma.hotSearch.create({
      data: {
        tag: '#程序员友谊',
        count: 89,
        relatedStoryIds: [story2.id],
      },
    }),
    prisma.hotSearch.create({
      data: {
        tag: '#AI编辑部',
        count: 134,
        relatedStoryIds: [],
      },
    }),
    prisma.hotSearch.create({
      data: {
        tag: '#全网震惊',
        count: 201,
        relatedStoryIds: [story1.id, story2.id],
      },
    }),
  ])

  console.log(`✓ 创建了 ${hotSearches.length} 条热搜`)

  console.log('\n✅ 测试数据生成完成！')
  console.log('\n现在可以启动开发服务器查看效果：')
  console.log('npm run dev')
}

main()
  .catch(e => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
