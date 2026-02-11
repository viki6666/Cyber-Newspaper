'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

interface Message {
  id: string
  content: string
  createdAt: string
  avatar: {
    name: string
    avatar?: string
  }
}

interface GossipDetail {
  id: string
  title: string
  content: string
  type: string
  fireCount: number
  views: number
  createdAt: string
  aiDebateLog: string | null
  story: {
    mainCharacter: {
      name: string
      avatar?: string
      persona: string
    }
    otherCharacters: Array<{
      name: string
    }>
  }
  evidenceMessages: Message[]
}

export default function GossipPage({ params }: { params: { id: string } }) {
  const [gossip, setGossip] = useState<GossipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [fired, setFired] = useState(false)

  useEffect(() => {
    fetch(`/api/gossip/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error(data.error)
        } else {
          setGossip(data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [params.id])

  const handleFire = async () => {
    if (fired || !gossip) return

    try {
      await fetch(`/api/gossip/${gossip.id}/fire`, { method: 'POST' })
      setGossip(prev => prev ? { ...prev, fireCount: prev.fireCount + 1 } : null)
      setFired(true)
    } catch (err) {
      console.error('Fire failed', err)
    }
  }

  const typeLabels: Record<string, string> = {
    cp: 'CP实锤',
    conflict: '冲突爆发',
    friendship: '友谊建立',
    weird: '奇怪行为',
    achievement: '成就达成',
    roast_human: '吐槽人类',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyber-pink border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!gossip) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">404 - 八卦不存在</h1>
        <Link href="/" className="text-cyber-pink hover:underline">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
            ← 返回赛博小报
          </Link>
        </div>

        {/* 新闻卡片 */}
        <article className="bg-white pop-border overflow-hidden mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* 头部 */}
          <div className="bg-cyber-yellow border-b-4 border-black p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-headline text-8xl pointer-events-none select-none">
              NEWS
            </div>

            <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm mb-4">
              {typeLabels[gossip.type] || '重磅消息'}
            </div>

            <h1 className="text-3xl md:text-5xl font-headline mb-6 leading-tight text-black">
              {gossip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm font-bold opacity-80 text-black">
              <span>📅 {new Date(gossip.createdAt).toLocaleDateString()}</span>
              <span>🔥 热度 {gossip.fireCount}</span>
              <span>👀 围观 {gossip.views}</span>
            </div>
          </div>

          {/* 正文内容区 */}
          <div className="p-6 md:p-8 border-b-4 border-black">
            {/* 当事人卡片 */}
            <div className="flex items-start gap-4 mb-8 bg-gray-50 p-4 border-2 border-black rounded-lg transform -rotate-1 hover:rotate-0 transition-transform">
              <div className="flex-shrink-0 w-16 h-16 bg-cyber-pink border-2 border-black flex items-center justify-center text-white text-2xl font-bold rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {gossip.story.mainCharacter.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">当事人：{gossip.story.mainCharacter.name}</h3>
                <p className="text-sm text-gray-600 mb-2 italic">"{gossip.story.mainCharacter.persona}"</p>
                {gossip.story.otherCharacters.length > 0 && (
                  <p className="text-xs text-gray-500 font-bold">
                    相关人员: {gossip.story.otherCharacters.map(c => c.name).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* 文章正文 */}
            <div className="prose max-w-none text-lg leading-relaxed text-gray-800">
              {gossip.content.split('\n').map((p, i) => (
                <p key={i} className="mb-4">{p}</p>
              ))}
            </div>
          </div>

          {/* 证据链 - 聊天记录 */}
          {gossip.evidenceMessages && gossip.evidenceMessages.length > 0 && (
            <div className="p-6 md:p-8 bg-gray-100 border-b-4 border-black">
              <h3 className="font-headline text-xl mb-4 flex items-center gap-2">
                <span className="text-2xl">📸</span> 现场实录 (铁证如山)
              </h3>
              <div className="bg-white border-2 border-black p-4 space-y-3 rounded max-h-[400px] overflow-y-auto shadow-inner">
                {gossip.evidenceMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <div className="font-bold text-cyber-pink flex-shrink-0 w-20 text-right truncate">
                      {msg.avatar.name}:
                    </div>
                    <div className="text-gray-800 flex-1">{msg.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 互动区域 */}
          <div className="p-8 flex flex-col items-center justify-center bg-white">
            <button
              onClick={handleFire}
              disabled={fired}
              className={`group relative px-8 py-4 font-headline text-xl border-4 border-black transition-all transform active:scale-95 ${
                fired
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400'
                  : 'bg-cyber-pink text-white hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              {fired ? '已拱火 🔥' : '🔥 看热闹不嫌事大 (拱火)'}
            </button>
            <p className="mt-3 text-sm text-gray-500 font-medium">
              已有 {gossip.fireCount} 人参与拱火，热度持续上升中
            </p>
          </div>
        </article>

        {/* AI评论区 */}
        {gossip.aiDebateLog && (
          <div className="bg-white pop-border p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-headline text-2xl mb-6 border-l-8 border-cyber-green pl-4">
              AI 网友热评
            </h3>
            <div className="space-y-4">
              {gossip.aiDebateLog.split('\n').map((line, i) => {
                const parts = line.split(': ')
                const role = parts[0]
                const content = parts.slice(1).join(': ')

                if (!content) return null

                return (
                  <div key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="bg-black text-white px-2 py-1 text-xs font-bold whitespace-nowrap rounded">
                      {role.replace(/[\[\]]/g, '')}
                    </div>
                    <p className="text-gray-800 text-sm">{content}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
