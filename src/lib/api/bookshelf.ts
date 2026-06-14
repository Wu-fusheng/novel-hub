import { createClient } from '@/lib/supabase/client'
import type { ReadingProgress, Novel, Chapter } from '@/lib/types'

export interface BookshelfItem {
  id: string
  user_id: string
  novel_id: string
  chapter_id: string | null
  last_read_at: string
  novel: Novel & {
    chapter_count?: number
  }
  chapter?: Chapter | null
}

export async function getBookshelf(userId: string): Promise<BookshelfItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reading_progress')
    .select(`
      *,
      novel:novels(*),
      chapter:chapters(id, chapter_number, title)
    `)
    .eq('user_id', userId)
    .order('last_read_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookshelf:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    novel_id: row.novel_id,
    chapter_id: row.chapter_id,
    last_read_at: row.last_read_at,
    novel: row.novel,
    chapter: row.chapter,
  }))
}

export async function removeFromBookshelf(userId: string, novelId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('reading_progress')
    .delete()
    .eq('user_id', userId)
    .eq('novel_id', novelId)

  if (error) {
    console.error('Error removing from bookshelf:', error)
    throw new Error(error.message)
  }
}
