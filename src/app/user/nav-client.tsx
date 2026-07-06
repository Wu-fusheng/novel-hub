'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/user/bookshelf', label: '书架', icon: '📚' },
  { href: '/user/notifications', label: '消息', icon: '🔔' },
  { href: '/user/settings', label: '设置', icon: '⚙️' },
]

export default function UserNavClient() {
  const pathname = usePathname()

  return (
    <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            pathname === item.href
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-white'
          }`}
        >
          {item.icon} {item.label}
        </Link>
      ))}
    </div>
  )
}
