import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ChapterReaderClient from './reader-client'
import { cache } from 'react'

export const dynamic = 'force-dynamic'

const getChapter = cache(async (chapterId: string, novelId: string) => {
  const supabase = await createClient()
  return supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('novel_id', novelId)
    .eq('is_published', true)
    .single()
})

const getNovel = cache(async (id: string) => {
  const supabase = await createClient()
  return supabase
    .from('novels')
    .select('title')
    .eq('id', id)
    .single()
})

const getAllChapters = cache(async (novelId: string) => {
  const supabase = await createClient()
  return supabase
    .from('chapters')
    .select('id, title, chapter_number')
    .eq('novel_id', novelId)
    .eq('is_published', true)
    .order('chapter_number', { ascending: true })
})

export async function generateMetadata({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = await params
  try {
    const [chapterResult, novelResult] = await Promise.all([
      getChapter(chapterId, id),
      getNovel(id),
    ])
    const chapter = chapterResult.data
    const novel = novelResult.data
    return {
      title: chapter ? `${chapter.title} - ${novel?.title || ''} - Novel Hub` : '阅读 - Novel Hub',
    }
  } catch {
    return { title: '阅读 - Novel Hub' }
  }
}

export default async function ChapterReaderPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = await params

  let chapter: any = null
  let novel: any = null
  let prevChapter: any = null
  let nextChapter: any = null
  let allChapters: any[] = []

  try {
    const supabase = await createClient()

    // Fetch chapter, novel, and all chapters in parallel
    const [chapterResult, novelResult, allChaptersResult] = await Promise.all([
      getChapter(chapterId, id),
      getNovel(id),
      getAllChapters(id),
    ])

    chapter = chapterResult.data
    novel = novelResult.data
    allChapters = allChaptersResult.data || []

    if (!chapter) notFound()

    // Find prev/next from the already-fetched chapter list
    const currentIndex = allChapters.findIndex(c => c.id === chapterId)
    if (currentIndex > 0) {
      prevChapter = allChapters[currentIndex - 1]
    }
    if (currentIndex < allChapters.length - 1) {
      nextChapter = allChapters[currentIndex + 1]
    }
  } catch (error) {
    console.error('Failed to load chapter:', error)
    notFound()
  }

  return (
    <ChapterReaderClient
      chapter={chapter}
      novel={novel || { title: '' }}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      allChapters={allChapters}
      novelId={id}
    />
  )
}
