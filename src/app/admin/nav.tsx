'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ConfirmModal from '@/components/ConfirmModal'

const navItems = [
  { href: '/admin', label: '仪表盘', icon: '📊' },
  { href: '/admin/novels', label: '小说管理', icon: '📚' },
  { href: '/admin/novels/new', label: '新建小说', icon: '✏️' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profileName, setProfileName] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // 先尝试从 profiles 表获取，兜底从 user_metadata 获取
        supabase.from('profiles').select('display_name').eq('id', user.id).single()
          .then(({ data }) => {
            if (data?.display_name) {
              setProfileName(data.display_name)
            } else {
              setProfileName(user.user_metadata?.display_name || user.user_metadata?.username || user.email || '管理员')
            }
          })
      }
    })
  }, [supabase])

  const handleLogout = async () => {
    localStorage.removeItem('novel-hub-auth')
    localStorage.removeItem('novel-hub-mode')
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-amber-600">
              📖 Novel Hub
            </Link>
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              👤 {profileName || '管理员'}
            </span>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirm Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="退出登录"
        message="确定要退出登录吗？"
        confirmText="确认退出"
        cancelText="取消"
      />
    </nav>
  )
}
