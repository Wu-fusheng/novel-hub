import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*, novels(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    novel_id: row.novel_id,
    type: row.type,
    title: row.title,
    content: row.content,
    is_read: row.is_read,
    created_at: row.created_at,
    novel: row.novels ? { title: row.novels.title } : undefined,
  }))
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw new Error(error.message)
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error(error.message)
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }
  return count || 0
}
