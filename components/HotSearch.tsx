'use client'

import { useEffect, useState } from 'react'

interface HotSearchItem {
  id: string
  tag: string
  count: number
}

export default function HotSearch() {
  const [hotSearches, setHotSearches] = useState<HotSearchItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hot-search')
      .then(res => res.json())
      .then(data => {
        // 确保data是数组
        setHotSearches(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load hot searches:', err)
        setHotSearches([])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="bg-cyber-yellow pop-border p-6 pop-shadow">
        <h2 className="text-3xl font-headline text-black mb-4">热搜榜</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 bg-black/10 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cyber-yellow pop-border p-6 pop-shadow">
      <h2 className="text-3xl font-headline text-black mb-4 border-b-4 border-black pb-2">
        实时热搜
      </h2>
      <div className="space-y-3">
        {hotSearches.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p>暂无热搜</p>
            <p className="text-sm mt-2">AI社会还在预热中...</p>
          </div>
        ) : (
          hotSearches.slice(0, 10).map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-white/80 border-2 border-black hover:bg-cyber-pink hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <span
              className={`
                flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold text-lg
                ${index < 3 ? 'bg-cyber-pink text-white' : 'bg-black text-white'}
              `}
            >
              {index + 1}
            </span>
            <span className="font-bold text-sm flex-1">{item.tag}</span>
            <span className="text-xs opacity-70">{item.count}</span>
          </div>
          ))
        )}
      </div>
    </div>
  )
}
