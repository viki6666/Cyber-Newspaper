'use client'

import { useState } from 'react'

interface GossipCardProps {
  gossip: {
    id: string
    title: string
    content: string
    type: string
    fireCount: number
    targetUser: {
      name: string
      avatar?: string
    }
    aiDebateLog?: string
  }
}

export default function GossipCard({ gossip }: GossipCardProps) {
  const [fireCount, setFireCount] = useState(gossip.fireCount)
  const [showDebate, setShowDebate] = useState(false)
  const [firing, setFiring] = useState(false)

  const handleFire = async () => {
    if (firing) return

    setFiring(true)
    try {
      const res = await fetch(`/api/gossip/${gossip.id}/fire`, {
        method: 'POST',
      })
      const data = await res.json()
      setFireCount(data.fireCount)
    } catch (err) {
      console.error('Fire failed:', err)
    } finally {
      setFiring(false)
    }
  }

  const typeColors = {
    roast: 'bg-cyber-pink',
    ship: 'bg-cyber-purple',
    hype: 'bg-cyber-green',
  }

  const typeLabels = {
    roast: '吐槽',
    ship: 'CP',
    hype: '煽动',
  }

  return (
    <div className="bg-white pop-border pop-shadow overflow-hidden hover:scale-[1.02] transition-transform duration-200 cursor-pointer">
      {/* 头部标签 */}
      <div
        className={`${typeColors[gossip.type as keyof typeof typeColors] || 'bg-black'} text-white px-4 py-2 font-bold text-sm border-b-4 border-black`}
      >
        【{typeLabels[gossip.type as keyof typeof typeLabels] || '八卦'}】
      </div>

      {/* 震惊体标题 */}
      <div className="p-6">
        <h3 className="text-2xl font-headline mb-4 leading-tight">
          {gossip.title}
        </h3>

        <p className="text-gray-700 mb-4 line-clamp-3">{gossip.content}</p>

        {/* 用户信息 */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <span>主角：</span>
          <span className="font-bold text-black">{gossip.targetUser.name}</span>
        </div>

        {/* 互动按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleFire}
            disabled={firing}
            className="flex-1 bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold py-3 px-4 border-2 border-black transition-colors duration-200"
          >
            拱火 {fireCount}
          </button>

          <button
            onClick={() => setShowDebate(!showDebate)}
            className="flex-1 bg-cyber-green hover:bg-cyber-green/90 text-black font-bold py-3 px-4 border-2 border-black transition-colors duration-200"
          >
            {showDebate ? '收起' : 'AI互撕现场'}
          </button>
        </div>

        {/* AI辩论记录 */}
        {showDebate && gossip.aiDebateLog && (
          <div className="mt-4 p-4 bg-gray-100 border-2 border-black">
            <h4 className="font-bold mb-2 text-sm">AI编辑部现场：</h4>
            <div className="text-sm whitespace-pre-line text-gray-800">
              {gossip.aiDebateLog}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
