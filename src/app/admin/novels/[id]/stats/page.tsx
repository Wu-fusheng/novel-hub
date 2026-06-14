import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import NovelStatsClient from './stats-client'

export const dynamic = 'force-dynamic'

export default async function NovelStatsPage({
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
    .select('id, title, author_id, status')
    .eq('id', id)
    .single()

  if (!novel || novel.author_id !== user.id) {
    notFound()
  }

  // Get chapters for this novel
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, chapter_number, title')
    .eq('novel_id', id)
    .order('chapter_number', { ascending: true })

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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 数据统计</h1>
        <p className="text-sm text-gray-500 mt-1">《{novel.title}》</p>
      </div>

      <NovelStatsClient
        novelId={id}
        novelStatus={novel.status}
        chapters={chapters || []}
      />
    </div>
  )
}
