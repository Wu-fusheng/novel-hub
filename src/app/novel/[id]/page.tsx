import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ChapterListClient from './chapter-list-client'
import NovelActions from './novel-actions'
import { cache } from 'react'

export const dynamic = 'force-dynamic'

const getNovel = cache(async (id: string) => {
  const supabase = await createClient()
  return supabase
    .from('novels')
    .select('*, profiles(display_name)')
    .eq('id', id)
    .single()
})

const getChapters = cache(async (novelId: string) => {
  const supabase = await createClient()
  return supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .eq('is_published', true)
    .order('chapter_number', { ascending: true })
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { data: novel } = await getNovel(id)
    return {
      title: novel ? `${novel.title} - Novel Hub` : '小说 - Novel Hub',
      description: novel?.description || '',
    }
  } catch {
    return { title: '小说 - Novel Hub' }
  }
}

export default async function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let novel: any = null
  let chapters: any[] = []

  try {
    const [novelResult, chaptersResult] = await Promise.all([
      getNovel(id),
      getChapters(id),
    ])
    novel = novelResult.data
    chapters = chaptersResult.data || []
  } catch (error) {
    console.error('Failed to load novel:', error)
  }

  if (!novel) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Novel Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-32 h-44 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-5xl">📖</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">{novel.title}</h1>
            <p className="text-gray-600 leading-relaxed mb-4">
              {novel.description || '暂无简介'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                novel.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                novel.status === 'completed' ? 'bg-green-100 text-green-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {novel.status === 'ongoing' ? '连载中' : novel.status === 'completed' ? '已完结' : '暂停中'}
              </span>
              {novel.genre && (
                <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
                  {novel.genre}
                </span>
              )}
              <span className="text-sm text-gray-400">
                {chapters?.length || 0} 章
              </span>
              <span className="text-sm text-gray-400">
                作者：{novel.profiles?.display_name || '未知'}
              </span>
            </div>
            {chapters && chapters.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/novel/${id}/chapter/${chapters[0].id}`}
                  className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200 text-sm"
                >
                  开始阅读
                </Link>
                <NovelActions novelId={id} novelTitle={novel.title} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">目录 · {chapters?.length || 0} 章</h2>
        </div>
        {chapters && chapters.length > 0 ? (
          <ChapterListClient chapters={chapters} novelId={id} />
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            <p>暂无章节</p>
          </div>
        )}
      </div>
    </div>
  )
}
