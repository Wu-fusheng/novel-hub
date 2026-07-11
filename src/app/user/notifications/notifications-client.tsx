'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

interface NotificationsClientProps {
  notifications: Notification[]
  unreadCount: number
}

export default function NotificationsClient({ notifications: initialNotifications, unreadCount: initialUnread }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleMarkAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
    setLoading(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'chapter_update': return '📖'
      case 'author_reply': return '💬'
      default: return '📢'
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
        <div className="text-5xl mb-4">🔔</div>
        <p className="text-gray-400 text-lg">暂无消息</p>
      </div>
    )
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">{unreadCount} 条未读消息</span>
          <button
            onClick={handleMarkAllAsRead}
            disabled={loading}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50"
          >
            {loading ? '处理中...' : '全部标为已读'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
            className={`p-4 rounded-xl border transition-colors cursor-pointer ${
              notification.is_read
                ? 'bg-white border-gray-100'
                : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{getIcon(notification.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-gray-800 truncate">{notification.title}</h4>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(notification.created_at)}</span>
                </div>
                {notification.content && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.content}</p>
                )}
                {notification.novel && (
                  <p className="text-xs text-amber-600 mt-1">{notification.novel.title}</p>
                )}
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
