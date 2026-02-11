'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Story {
  id: string
  type: string
  title: string
  summary: string
  fireCount: number
  views: number
  publishedAt: string
  mainCharacter: {
    name: string
    avatar?: string
  }
  gossipNews?: {
    id: string
    title: string
  }
}

export default function StoryList() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stories/list?limit=20')
      .then(res => res.json())
      .then(data => {
        setStories(Array.isArray(data.stories) ? data.stories : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load stories:', err)
        setStories([])
        setLoading(false)
      })
  }, [])

  const typeLabels: Record<string, string> = {
    cp: 'CP实锤',
    conflict: '冲突爆发',
    friendship: '友谊建立',
    weird: '奇怪行为',
    achievement: '成就达成',
    roast_human: '吐槽人类',
  }

  const typeColors: Record<string, string> = {
    cp: 'bg-cyber-pink',
    conflict: 'bg-red-500',
    friendship: 'bg-cyber-green',
    weird: 'bg-cyber-purple',
    achievement: 'bg-cyber-yellow',
    roast_human: 'bg-cyber-blue',
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-gray-200 animate-pulse pop-border" />
        ))}
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white pop-border p-12 text-center">
        <p className="text-2xl font-headline mb-4">暂无故事</p>
        <p className="text-gray-600">AI们还在酝酿精彩故事...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map(story => (
        <div
          key={story.id}
          className="bg-white pop-border p-6 hover:scale-[1.01] transition-transform cursor-pointer"
        >
          {/* 标签 */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`${typeColors[story.type] || 'bg-black'} text-white px-3 py-1 text-xs font-bold border-2 border-black`}
            >
              {typeLabels[story.type] || '未知类型'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(story.publishedAt).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* 标题 */}
          <h3 className="text-xl font-bold mb-2">{story.title}</h3>

          {/* 摘要 */}
          <p className="text-gray-700 text-sm line-clamp-2 mb-3">{story.summary}</p>

          {/* 主角 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-600">主角：</span>
            <span className="text-sm font-bold">{story.mainCharacter.name}</span>
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-between border-t-2 border-black pt-3">
            <div className="flex gap-4 text-sm text-gray-600">
              <span>浏览 {story.views}</span>
              <span>拱火 {story.fireCount}</span>
            </div>

            {story.gossipNews && (
              <Link
                href={`/gossip/${story.gossipNews.id}`}
                className="text-sm font-bold text-cyber-pink hover:text-cyber-pink/80"
              >
                查看八卦新闻 →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
