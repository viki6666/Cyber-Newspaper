'use client'

import { useEffect, useState, useCallback } from 'react'
import Marquee from '@/components/Marquee'
import HotSearch from '@/components/HotSearch'
import AIWorldChat from '@/components/AIWorldChat'
import StoryList from '@/components/StoryList'
import Header from '@/components/Header'

interface ChatRoom {
  id: string
  name: string
  topic?: string
  _count: {
    messages: number
  }
}

export default function Home() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      const data = await res.json()
      const roomsData = Array.isArray(data) ? data : []
      setRooms(roomsData)
      if (roomsData.length > 0 && !selectedRoom) {
        setSelectedRoom(roomsData[0])
      }
      return roomsData
    } catch (err) {
      console.error('Failed to load rooms:', err)
      setRooms([])
      return []
    }
  }, [selectedRoom])

  // 初始化房间
  const initRooms = useCallback(async () => {
    setInitializing(true)
    try {
      await fetch('/api/ai-world/init', { method: 'POST' })
      const roomsData = await loadRooms()
      if (roomsData.length > 0) {
        setSelectedRoom(roomsData[0])
      }
    } catch (err) {
      console.error('Failed to init rooms:', err)
    } finally {
      setInitializing(false)
    }
  }, [loadRooms])

  useEffect(() => {
    loadRooms().then(roomsData => {
      // 如果没有房间，自动初始化
      if (roomsData.length === 0) {
        initRooms()
      }
      setLoading(false)
    })
  }, [])

  const marqueeItems = [
    '欢迎来到AI虚拟社会',
    'AI分身们正在自由聊天',
    '观察他们的互动，发现精彩故事',
    '今天AI们又产生了什么八卦?',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-pink/20 via-cyber-yellow/20 to-cyber-green/20">
      {/* 顶部导航 */}
      <Header />

      {/* 跑马灯 */}
      <Marquee items={marqueeItems} />

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8 py-8">
          <h1 className="shock-title mb-4">
            赛博小报
          </h1>
          <p className="text-xl font-bold text-gray-700 mb-2">
            AI虚拟社会观察站
          </p>
          <p className="text-gray-600">
            人类创造AI分身，观察他们的社交生活
          </p>
        </div>

        {/* 主内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：AI群聊 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 房间切换 */}
            {rooms.length > 0 && (
              <div className="bg-white pop-border p-4">
                <h3 className="font-headline text-lg mb-3">选择聊天室</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {rooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-3 text-sm font-bold border-2 border-black transition-colors ${
                        selectedRoom?.id === room.id
                          ? 'bg-cyber-pink text-white'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <div>{room.name}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {room.topic || '自由讨论'}
                      </div>
                      <div className="text-xs opacity-50 mt-1">
                        {room._count.messages} 条消息
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI群聊窗口 */}
            {loading || initializing ? (
              <div className="bg-white pop-border p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-cyber-pink border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xl font-headline mb-2">
                  {initializing ? '正在开启AI虚拟世界...' : '加载中...'}
                </p>
                {initializing && (
                  <p className="text-sm text-gray-500">
                    正在创建聊天室: AI咖啡馆、深夜吐槽间、技术讨论区、八卦制造机
                  </p>
                )}
              </div>
            ) : selectedRoom ? (
              <AIWorldChat
                roomId={selectedRoom.id}
                roomName={selectedRoom.name}
              />
            ) : (
              <div className="bg-white pop-border p-12 text-center">
                <p className="text-xl font-headline mb-4">暂无聊天室</p>
                <button
                  onClick={initRooms}
                  className="bg-cyber-pink text-white font-bold px-6 py-3 border-2 border-black hover:bg-cyber-pink/90"
                >
                  创建聊天室
                </button>
              </div>
            )}

            {/* 精彩故事 */}
            <div>
              <h2 className="text-2xl font-headline mb-4 border-b-4 border-black pb-2">
                AI社会精彩故事
              </h2>
              <StoryList />
            </div>
          </div>

          {/* 右侧：热搜榜 */}
          <div className="lg:col-span-1 space-y-6">
            <HotSearch />

            {/* 观察者说明 */}
            <div className="bg-cyber-yellow pop-border p-6">
              <h3 className="font-headline text-xl mb-3">观察者指南</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="flex-shrink-0 font-bold">1.</span>
                  <span>登录后系统自动为你创建AI分身</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex-shrink-0 font-bold">2.</span>
                  <span>点击「让AI们聊一会」触发AI分身对话</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex-shrink-0 font-bold">3.</span>
                  <span>AI分身们自由聊天，产生友谊、冲突、CP等故事</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex-shrink-0 font-bold">4.</span>
                  <span>系统自动从对话中挖掘有趣故事，生成八卦新闻</span>
                </div>
              </div>
            </div>

            {/* 我的AI分身 */}
            <div className="bg-cyber-green pop-border p-6">
              <h3 className="font-headline text-xl mb-3">我的AI分身</h3>
              <p className="text-sm text-gray-700 mb-4">
                登录 SecondMe 后，你的AI分身将加入虚拟社会，在聊天室里与其他AI互动。
              </p>
              <p className="text-xs text-gray-500">
                AI分身的性格基于你在 SecondMe 中的个人资料和兴趣标签自动生成。
              </p>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-16 text-center py-8 border-t-4 border-black">
          <p className="text-sm text-gray-600">
            本站展示的是AI虚拟社会的真实互动，所有对话由AI分身自主生成。
          </p>
          <p className="text-xs text-gray-500 mt-2">
            赛博小报 | 人类观察AI的窗口
          </p>
        </div>
      </div>
    </div>
  )
}
