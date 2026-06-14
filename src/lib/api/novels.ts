import { createClient } from '@/lib/supabase/client'
import type { Novel, Chapter } from '@/lib/types'

export async function getPublishedNovels(options?: {
  limit?: number
  offset?: number
  orderBy?: string
  genre?: string
}): Promise<{ novels: Novel[]; count: number }> {
  const supabase = createClient()
  const limit = options?.limit || 20
  const offset = options?.offset || 0
  const orderBy = options?.orderBy || 'updated_at'

  let query = supabase
    .from('novels')
    .select('*, profiles(display_name)', { count: 'exact' })
    .eq('is_published', true)
    .order(orderBy, { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.genre) {
    query = query.eq('genre', options.genre)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching novels:', error)
    return { novels: [], count: 0 }
  }

  return { novels: (data || []) as Novel[], count: count || 0 }
}

export async function getNovelById(id: string): Promise<Novel | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('novels')
    .select('*, profiles(display_name)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching novel:', error)
    return null
  }

  return data as Novel
}

export async function getNovelChapters(novelId: string): Promise<Chapter[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .eq('is_published', true)
    .order('chapter_number', { ascending: true })

  if (error) {
    console.error('Error fetching chapters:', error)
    return []
  }

  return (data || []) as Chapter[]
}

export async function getChapterWithNeighbors(chapterId: string, novelId: string): Promise<{
  prev: Chapter | null
  current: Chapter | null
  next: Chapter | null
}> {
  const supabase = createClient()
  const { data: current } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single()

  if (!current) return { prev: null, current: null, next: null }

  const chapterNumber = current.chapter_number

  const [prevResult, nextResult] = await Promise.all([
    supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .eq('is_published', true)
      .eq('chapter_number', chapterNumber - 1)
      .single(),
    supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .eq('is_published', true)
      .eq('chapter_number', chapterNumber + 1)
      .single(),
  ])

  return {
    prev: prevResult.data as Chapter | null,
    current: current as Chapter,
    next: nextResult.data as Chapter | null,
  }
}
