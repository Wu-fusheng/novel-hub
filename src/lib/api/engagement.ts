import { createClient } from '@/lib/supabase/client'
import type { ChapterRatingStats, NovelStats, ChapterCommentCount, ChapterRatingOverview } from '@/lib/types'

// ========== URGINGS (催更) ==========

export async function getNovelUrgingCount(novelId: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_novel_urging_count', { p_novel_id: novelId })

  if (error) {
    console.error('Error fetching urging count:', error)
    return 0
  }
  return data || 0
}

export async function hasUserUrged(novelId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('urgings')
    .select('id')
    .eq('novel_id', novelId)
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking urging:', error)
  }
  return !!data
}

export async function urgeNovel(novelId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('请先登录后再催更')
  }

  const { error } = await supabase
    .from('urgings')
    .insert({ novel_id: novelId, user_id: user.id })

  if (error) {
    if (error.code === '23505') {
      throw new Error('你已经催更过了')
    }
    console.error('Error urging novel:', error)
    throw new Error(error.message)
  }
}

export async function cancelUrge(novelId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('请先登录')
  }

  const { error } = await supabase
    .from('urgings')
    .delete()
    .eq('novel_id', novelId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error canceling urge:', error)
    throw new Error(error.message)
  }
}

// ========== CHAPTER RATINGS (章节评分) ==========

export async function getChapterRatingStats(chapterId: string): Promise<ChapterRatingStats> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_chapter_rating_stats', { p_chapter_id: chapterId })

  if (error) {
    console.error('Error fetching rating stats:', error)
    return { avg_rating: 0, total_count: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 }
  }

  if (data && data.length > 0) {
    const row = data[0]
    return {
      avg_rating: Number(row.avg_rating) || 0,
      total_count: Number(row.total_count) || 0,
      rating_1: Number(row.rating_1) || 0,
      rating_2: Number(row.rating_2) || 0,
      rating_3: Number(row.rating_3) || 0,
      rating_4: Number(row.rating_4) || 0,
      rating_5: Number(row.rating_5) || 0,
    }
  }
  return { avg_rating: 0, total_count: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 }
}

export async function getUserChapterRating(chapterId: string): Promise<number | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('chapter_ratings')
    .select('rating')
    .eq('chapter_id', chapterId)
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user rating:', error)
  }
  return data?.rating || null
}

export async function rateChapter(chapterId: string, rating: number): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('请先登录后再评分')
  }

  if (rating < 1 || rating > 5) {
    throw new Error('评分必须在1-5星之间')
  }

  const { error } = await supabase
    .from('chapter_ratings')
    .upsert(
      { chapter_id: chapterId, user_id: user.id, rating },
      { onConflict: 'chapter_id,user_id' }
    )

  if (error) {
    console.error('Error rating chapter:', error)
    throw new Error(error.message)
  }
}

// ========== CHAPTER READS (阅读统计) ==========

export async function recordChapterRead(chapterId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .rpc('record_chapter_read', {
      p_chapter_id: chapterId,
      p_user_id: user.id
    })

  if (error) {
    console.error('Error recording chapter read:', error)
  }
}

export async function getChapterReadCount(chapterId: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_chapter_read_count', { p_chapter_id: chapterId })

  if (error) {
    console.error('Error fetching read count:', error)
    return 0
  }
  return data || 0
}

// ========== NOVEL STATS (小说统计 - 作者端) ==========

export async function getNovelStats(novelId: string): Promise<NovelStats> {
  const supabase = createClient()
  const [totalReads, monthlyReads, dailyReads, urgingCount] = await Promise.all([
    supabase.rpc('get_novel_total_reads', { p_novel_id: novelId }),
    supabase.rpc('get_novel_monthly_reads', { p_novel_id: novelId }),
    supabase.rpc('get_novel_daily_reads', { p_novel_id: novelId }),
    supabase.rpc('get_novel_urging_count', { p_novel_id: novelId }),
  ])

  return {
    total_reads: totalReads.data || 0,
    monthly_reads: monthlyReads.data || 0,
    daily_reads: dailyReads.data || 0,
    urging_count: urgingCount.data || 0,
  }
}

export async function getNovelChapterCommentCounts(novelId: string): Promise<ChapterCommentCount[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_novel_chapter_comment_counts', { p_novel_id: novelId })

  if (error) {
    console.error('Error fetching comment counts:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    chapter_id: row.chapter_id,
    chapter_number: row.chapter_number,
    chapter_title: row.chapter_title,
    comment_count: Number(row.comment_count) || 0,
  }))
}

export async function getNovelRatingOverview(novelId: string): Promise<ChapterRatingOverview[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_novel_rating_overview', { p_novel_id: novelId })

  if (error) {
    console.error('Error fetching rating overview:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    chapter_id: row.chapter_id,
    chapter_number: row.chapter_number,
    chapter_title: row.chapter_title,
    avg_rating: Number(row.avg_rating) || 0,
    total_ratings: Number(row.total_ratings) || 0,
  }))
}

export async function getNovelChapterReadCounts(novelId: string): Promise<Record<string, number>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_novel_chapter_read_counts', { p_novel_id: novelId })

  if (error) {
    console.error('Error fetching chapter read counts:', error)
    return {}
  }

  const result: Record<string, number> = {}
  if (data) {
    for (const row of data) {
      result[row.chapter_id] = Number(row.read_count) || 0
    }
  }
  return result
}
