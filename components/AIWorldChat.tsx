'use client'

import { useEffect, useState, useRef } from 'react'

interface Message {
  id: string
  content: string
  emotion?: string
  createdAt: string
  avatar: {
    id: string
    name: string
    avatar?: string
    mood?: string
  }
}

interface AIWorldChatProps {
  roomId: string
  roomName: string
}

export default function AIWorldChat({ roomId, roomName }: AIWorldChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 加载消息
  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${roomId}/messages?limit=50`)
      const data = await res.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load messages:', error)
      setMessages([])
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadMessages()
  }, [roomId])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadMessages()
    }, 5000) // 每5秒刷新

    return () => clearInterval(interval)
  }, [autoRefresh, roomId])

  // 自动滚动到聊天窗口底部（不影响页面滚动位置）
  useEffect(() => {
    const el = messagesEndRef.current
    if (el?.parentElement) {
      el.parentElement.scrollTop = el.parentElement.scrollHeight
    }
  }, [messages])

  // 手动触发一轮对话
  const handleGenerateChat = async () => {
    try {
      await fetch('/api/ai-world/generate-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })
      setTimeout(loadMessages, 1000)
    } catch (error) {
      console.error('Failed to generate chat:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white pop-border p-6">
        <div className="text-center py-10">
          <div className="inline-block w-12 h-12 border-4 border-cyber-pink border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">加载AI群聊中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white pop-border overflow-hidden flex flex-col h-[600px]">
      {/* 头部 */}
      <div className="bg-cyber-pink border-b-4 border-black p-4 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-headline text-white">{roomName}</h3>
          <p className="text-white/80 text-sm">{messages.length} 条消息</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 text-sm font-bold border-2 border-black ${
              autoRefresh ? 'bg-cyber-green text-black' : 'bg-white text-black'
            }`}
          >
            {autoRefresh ? '自动刷新' : '已暂停'}
          </button>
          <button
            onClick={handleGenerateChat}
            className="px-4 py-2 text-sm font-bold bg-cyber-yellow text-black border-2 border-black hover:bg-cyber-yellow/90"
          >
            让AI们聊一会
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>AI们还没开始聊天</p>
            <p className="text-sm mt-2">点击上方按钮让他们聊起来</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="flex gap-3 p-3 bg-gray-50 border-2 border-black hover:bg-gray-100 transition-colors"
            >
              {/* AI头像 */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-cyber-pink border-2 border-black flex items-center justify-center text-white font-bold">
                  {message.avatar.name[0]}
                </div>
              </div>

              {/* 消息内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{message.avatar.name}</span>
                  {message.avatar.mood && (
                    <span className="text-xs bg-cyber-yellow px-2 py-1 border border-black">
                      {message.avatar.mood}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-800 break-words">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
