/**
 * 数据库种子脚本 - 生成测试数据
 * 运行: npx ts-node scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始生成测试数据...')

  // 创建测试用户
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'test1@example.com' },
      update: {},
      create: {
        email: 'test1@example.com',
        name: '张三',
        bio: '喜欢编程的程序员',
        interests: ['编程', 'AI', '咖啡'],
        personality: '技术宅',
      },
    }),
    prisma.user.upsert({
      where: { email: 'test2@example.com' },
      update: {},
      create: {
        email: 'test2@example.com',
        name: '李四',
        bio: '热爱设计的创意工作者',
        interests: ['设计', 'UX', '摄影'],
        personality: '文艺青年',
      },
    }),
    prisma.user.upsert({
      where: { email: 'test3@example.com' },
      update: {},
      create: {
        email: 'test3@example.com',
        name: '王五',
        bio: '每天都在学习新东西',
        interests: ['阅读', '旅行', '美食'],
        personality: '好奇宝宝',
      },
    }),
  ])

  console.log(`✓ 创建了 ${users.length} 个测试用户`)

  // 创建测试八卦新闻
  const gossips = await Promise.all([
    prisma.gossipNews.create({
      data: {
        title: '震惊！某程序员深夜代码竟然全是Bug？！',
        content: '据可靠消息，张三最近的代码质量引起了全网关注。有知情人士透露，他的每一行代码都像是在挑战编译器的底线...',
        type: 'roast',
        targetUserId: users[0].id,
        fireCount: 42,
        aiDebateLog: `[毒舌妇]: 天呐！这代码是用脚写的吧？我看过的最烂的！
[脑残粉]: 不！这是艺术！张三是天才！
[阴谋家]: 这肯定是有人在陷害他，这绝不是巧合！
[理性派]: 其实只是几个小bug...
[吃瓜群众]: 哈哈哈坐等翻车！有瓜吃了！`,
      },
    }),
    prisma.gossipNews.create({
      data: {
        title: '实锤！张三和李四深夜代码库惊现神秘互动！',
        content: '独家爆料：张三和李四在GitHub上频繁互动，两人疑似正在秘密合作某个神秘项目...',
        type: 'ship',
        targetUserId: users[0].id,
        fireCount: 28,
        aiDebateLog: `[脑残粉]: 锁死！这对CP我磕了！
[毒舌妇]: 就这？两个程序员而已，有什么好磕的？
[阴谋家]: 他们肯定在策划什么大事！
[理性派]: 只是正常的代码协作...
[吃瓜群众]: 不管！我就要看八卦！`,
      },
    }),
    prisma.gossipNews.create({
      data: {
        title: '警报！王五咖啡消耗量暴涨300%，疑似要熬夜搞大事？！',
        content: '根据最新数据显示，王五本周的咖啡消耗量异常飙升，这是否预示着某个重大项目即将启动？',
        type: 'hype',
        targetUserId: users[2].id,
        fireCount: 15,
        aiDebateLog: `[阴谋家]: 这肯定是在准备什么惊天动地的计划！
[吃瓜群众]: 哇哦！坐等大新闻！
[理性派]: 可能只是最近比较忙...
[毒舌妇]: 喝那么多咖啡，小心秃头！
[脑残粉]: 王五加油！我永远支持你！`,
      },
    }),
  ])

  console.log(`✓ 创建了 ${gossips.length} 条测试八卦`)

  // 创建热搜
  const hotSearches = await Promise.all([
    prisma.hotSearch.create({
      data: {
        tag: '#张三Bug实锤',
        count: 156,
        relatedUserId: users[0].id,
      },
    }),
    prisma.hotSearch.create({
      data: {
        tag: '#程序员恋情',
        count: 89,
        relatedUserId: users[0].id,
      },
    }),
    prisma.hotSearch.create({
      data: {
        tag: '#王五咖啡成瘾',
        count: 67,
        relatedUserId: users[2].id,
      },
    }),
    prisma.hotSearch.create({
      data: {
        tag: '#AI编辑部罢工',
        count: 134,
      },
    }),
    prisma.hotSearch.create({
      data: {
        tag: '#全网震惊',
        count: 201,
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
