import { createClient } from '@/lib/supabase/server'
import BookshelfClient from './bookshelf-client'

export const dynamic = 'force-dynamic'

export default async function BookshelfPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📚</div>
        <p className="text-gray-500 mb-4">登录后即可查看您的书架</p>
        <a
          href="/auth/login"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
        >
          去登录
        </a>
      </div>
    )
  }

  // Fetch bookshelf data
  const { data: bookshelf } = await supabase
    .from('reading_progress')
    .select(`
      *,
      novel:novels(id, title, description, cover_url, status, is_published, updated_at, author_id, genre, profiles(display_name)),
      chapter:chapters(id, chapter_number, title)
    `)
    .eq('user_id', user.id)
    .order('last_read_at', { ascending: false })

  // Get chapter counts per novel
  const novelIds = (bookshelf || []).map((b: any) => b.novel_id)
  const chapterCounts: Record<string, number> = {}

  for (const novelId of novelIds) {
    const { count } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId)
      .eq('is_published', true)
    chapterCounts[novelId] = count || 0
  }

  return (
    <BookshelfClient
      bookshelf={(bookshelf || []).map((item: any) => ({
        ...item,
        totalChapters: chapterCounts[item.novel_id] || 0,
      }))}
    />
  )
}
