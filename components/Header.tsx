'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  avatar?: string
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查登录状态
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="bg-black border-b-4 border-cyber-pink">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-headline text-cyber-pink hover:text-cyber-green transition-colors">
          赛博小报
        </Link>

        {/* 右侧 */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-8 h-8 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
          ) : user ? (
            <>
              {/* 已登录 */}
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 border-2 border-cyber-green">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-cyber-green"
                  />
                )}
                <span className="text-white font-bold">{user.name}</span>
              </div>
              <button
                onClick={() => {
                  fetch('/api/auth/logout', { method: 'POST' })
                    .then(() => window.location.reload())
                }}
                className="bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold px-4 py-2 border-2 border-black transition-colors"
              >
                退出
              </button>
            </>
          ) : (
            <>
              {/* 未登录 */}
              <Link
                href="/login"
                className="bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold px-6 py-2 border-2 border-black transition-colors"
              >
                登录
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
