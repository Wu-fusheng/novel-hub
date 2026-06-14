'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

const navItems = [
  { href: '/admin', label: '仪表盘', icon: '📊' },
  { href: '/admin/novels', label: '小说管理', icon: '📚' },
  { href: '/admin/novels/new', label: '新建小说', icon: '✏️' },
]

export default function AdminNavSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, refresh } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('novel-hub-mode')
    refresh()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/admin" className="text-lg font-bold text-amber-600">
          📖 管理后台
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          前台
        </Link>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 bg-white h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <Link href="/" className="text-xl font-bold text-amber-600">
                📖 Novel Hub
              </Link>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                  {(profile?.display_name || profile?.username || '管').charAt(0)}
                </div>
                <span className="text-sm text-gray-700 font-medium truncate">
                  {profile?.display_name || profile?.username || '管理员'}
                </span>
              </div>
              <div className="flex space-x-2">
                <Link
                  href="/"
                  className="flex-1 text-center px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  返回前台
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/" className="text-xl font-bold text-amber-600">
              📖 Novel Hub
            </Link>
          </div>
          <div className="mt-6 flex-grow px-3">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              管理后台
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 px-4 border-t border-gray-100 pt-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                {(profile?.display_name || profile?.username || '管').charAt(0)}
              </div>
              <span className="text-sm text-gray-700 font-medium truncate">
                {profile?.display_name || profile?.username || '管理员'}
              </span>
            </div>
            <div className="flex space-x-2">
              <Link
                href="/"
                className="flex-1 text-center px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                返回前台
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
