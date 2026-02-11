import { NextResponse } from 'next/server'
import { initializeDefaultRooms } from '@/lib/ai-world'

/**
 * POST /api/ai-world/init
 * 初始化AI虚拟世界
 */
export async function POST() {
  try {
    await initializeDefaultRooms()

    return NextResponse.json({
      message: 'AI虚拟世界初始化成功',
      rooms: ['AI咖啡馆', '深夜吐槽间', '技术讨论区', '八卦制造机'],
    })
  } catch (error: any) {
    console.error('Init AI world error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize AI world', detail: error?.message || String(error) },
      { status: 500 }
    )
  }
}
