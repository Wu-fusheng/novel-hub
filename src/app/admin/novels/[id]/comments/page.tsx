import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminCommentList from './comment-list'

export const dynamic = 'force-dynamic'

export default async function AdminNovelCommentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get novel and verify ownership
  const { data: novel } = await supabase
    .from('novels')
    .select('id, title, author_id')
    .eq('id', id)
    .single()

  if (!novel || novel.author_id !== user.id) {
    notFound()
  }

  // Get all comments for this novel (including private ones)
  const { data: rawComments } = await supabase
    .from('comments')
    .select(`
      id, content, selected_text, is_private, is_deleted, created_at, updated_at,
      chapter_id, parent_id, user_id, reply_to_user_id,
      chapter:chapters(chapter_number, title)
    `)
    .eq('novel_id', id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  // Fetch user info separately to avoid array type issues
  const comments = (rawComments || []).map((c: any) => ({
    id: c.id,
    content: c.content,
    selected_text: c.selected_text,
    is_private: c.is_private,
    is_deleted: c.is_deleted,
    created_at: c.created_at,
    updated_at: c.updated_at,
    chapter_id: c.chapter_id,
    parent_id: c.parent_id,
    user_id: c.user_id,
    reply_to_user_id: c.reply_to_user_id,
    chapter: Array.isArray(c.chapter) ? c.chapter[0] : c.chapter,
  }))

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href={`/admin/novels/${id}`}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← 返回小说管理
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💬 读者留言</h1>
          <p className="text-sm text-gray-500 mt-1">《{novel.title}》</p>
        </div>
      </div>

      <AdminCommentList comments={comments} novelId={id} />
    </div>
  )
}
