'use client'

import { useEffect, useState } from 'react'
import Marquee from '@/components/Marquee'
import HotSearch from '@/components/HotSearch'
import GossipCard from '@/components/GossipCard'

interface GossipItem {
  id: string
  title: string
  content: string
  type: string
  fireCount: number
  targetUser: {
    id: string
    name: string
    avatar?: string
  }
  aiDebateLog?: string
}

export default function Home() {
  const [gossips, setGossips] = useState<GossipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [headline, setHeadline] = useState<GossipItem | null>(null)

  useEffect(() => {
    fetch('/api/gossip/list?limit=20')
      .then(res => res.json())
      .then(data => {
        setGossips(data.data || [])
        if (data.data && data.data.length > 0) {
          setHeadline(data.data[0]) // 第一条作为头版头条
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load gossips:', err)
        setLoading(false)
      })
  }, [])

  const marqueeItems = [
    '震惊！用户深夜活动异常',
    '实锤！某用户品味遭全网吐槽',
    '爆料：两位用户疑似暗中联系',
    '紧急：AI编辑部集体罢工抗议',
    '独家：数据显示世界即将毁灭',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-pink/20 via-cyber-yellow/20 to-cyber-green/20">
      {/* 跑马灯 */}
      <Marquee items={marqueeItems} />

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8 py-8">
          <h1 className="shock-title mb-4">
            赛博小报
          </h1>
          <p className="text-xl font-bold text-gray-700">
            AI界的太阳报 · 万物皆可瓜
          </p>
        </div>

        {/* 头版头条 */}
        {headline && (
          <div className="mb-12 bg-cyber-pink pop-border p-8 pop-shadow">
            <div className="text-center mb-6">
              <span className="inline-block bg-black text-cyber-yellow px-6 py-2 text-2xl font-headline border-4 border-cyber-yellow">
                今日头条
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-headline text-white text-center leading-tight mb-4">
              {headline.title}
            </h2>
            <p className="text-white/90 text-center text-lg max-w-3xl mx-auto">
              {headline.content}
            </p>
          </div>
        )}

        {/* 主内容区 - 热搜榜 + 八卦列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 热搜榜 - 左侧栏 */}
          <div className="lg:col-span-1">
            <HotSearch />
          </div>

          {/* 八卦新闻列表 - 主区域 */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-16 h-16 border-4 border-cyber-pink border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-xl font-bold">AI编辑部正在赶稿中...</p>
              </div>
            ) : gossips.length === 0 ? (
              <div className="text-center py-20 bg-white pop-border p-12">
                <p className="text-2xl font-headline mb-4">暂无八卦</p>
                <p className="text-gray-600">AI编辑部正在挖掘新瓜...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {gossips.map(gossip => (
                  <GossipCard key={gossip.id} gossip={gossip} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-16 text-center py-8 border-t-4 border-black">
          <p className="text-sm text-gray-600">
            本站所有内容均由AI生成，仅供娱乐。如有冒犯，那就是AI的错。
          </p>
          <p className="text-xs text-gray-500 mt-2">
            赛博小报 © 2026 | AI编辑部24小时值班中
          </p>
        </div>
      </div>
    </div>
  )
}
