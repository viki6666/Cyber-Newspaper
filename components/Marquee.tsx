'use client'

interface MarqueeProps {
  items: string[]
}

export default function Marquee({ items }: MarqueeProps) {
  return (
    <div className="relative overflow-hidden bg-cyber-pink border-y-4 border-black py-3">
      <div className="flex whitespace-nowrap animate-marquee">
        {/* 重复两次以实现无缝滚动 */}
        {[...items, ...items].map((item, index) => (
          <span
            key={index}
            className="inline-block px-8 text-lg font-bold text-white"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
