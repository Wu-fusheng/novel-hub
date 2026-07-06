'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const router = useRouter()
  const { user, profile, mode, isLoading, setMode } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const isLoggedIn = !!user
  const isAuthor = mode === 'author' || mode === 'admin'
  const displayName = profile?.display_name || profile?.username || ''

  // Fetch unread notification count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    const loadUnreadCount = async () => {
      try {
        const supabase = createClient()
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
        setUnreadCount(count || 0)
      } catch {
        // Ignore errors
      }
    }

    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = async () => {
    // Clear localStorage FIRST so that the SIGNED_OUT event handler
    // in auth-context can distinguish intentional logout from SDK errors
    localStorage.removeItem('novel-hub-auth')
    localStorage.removeItem('novel-hub-mode')

    const supabase = createClient()
    try {
      await supabase.auth.signOut()
    } catch {
      // Network error - already cleared above
    }
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-lg font-bold text-amber-600 flex items-center space-x-1.5">
              <span>📖</span>
              <span>Novel Hub</span>
            </Link>

            <div className="hidden sm:flex items-center space-x-1">
              <Link
                href="/novels"
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                📚 小说库
              </Link>

              {isLoggedIn && !isAuthor && (
                <Link
                  href="/user/bookshelf"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  📖 书架
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  href="/user/notifications"
                  className="relative px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  🔔 消息
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {isAuthor && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  ⚙️ 管理后台
                </Link>
              )}
            </div>
          </div>

          {/* Right: User actions */}
          <div className="flex items-center space-x-3">
            <Link
              href="/help"
              className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              帮助
            </Link>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {displayName.charAt(0) || '?'}
                  </div>
                  <span className="text-sm text-gray-700 font-medium max-w-[100px] truncate">
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                >
                  退出
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
              >
                登录
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/novels"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              📚 小说库
            </Link>

            {isLoggedIn && !isAuthor && (
              <Link
                href="/user/bookshelf"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                📖 书架
              </Link>
            )}

            {isLoggedIn && (
              <Link
                href="/user/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                🔔 消息 {unreadCount > 0 && `(${unreadCount})`}
              </Link>
            )}

            {isAuthor && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                ⚙️ 管理后台
              </Link>
            )}

            <Link
              href="/help"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              帮助
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
