import { createClient } from '@/lib/supabase/server'
import NotificationsClient from './notifications-client'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔔</div>
        <p className="text-gray-500 mb-4">登录后即可查看消息</p>
        <a
          href="/auth/login"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
        >
          去登录
        </a>
      </div>
    )
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, novels(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <NotificationsClient
      notifications={(notifications || []).map((n: any) => ({
        id: n.id,
        user_id: n.user_id,
        novel_id: n.novel_id,
        type: n.type,
        title: n.title,
        content: n.content,
        is_read: n.is_read,
        created_at: n.created_at,
        novel: n.novels ? { title: n.novels.title } : undefined,
      }))}
      unreadCount={unreadCount || 0}
    />
  )
}
