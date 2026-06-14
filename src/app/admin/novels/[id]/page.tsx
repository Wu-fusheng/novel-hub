import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import NovelEditorClient from './client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditNovelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: novel } = await supabase
    .from('novels')
    .select('*')
    .eq('id', id)
    .single()

  if (!novel) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', id)
    .order('chapter_number', { ascending: true })

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <Link href="/admin/novels" className="text-gray-400 hover:text-gray-600">
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">编辑小说</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <NovelEditorClient novel={novel} />
          <div className="mt-4 space-y-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <Link
                href={`/admin/novels/${id}/comments`}
                className="flex items-center justify-between text-gray-700 hover:text-amber-600 transition-colors"
              >
                <span className="font-medium">💬 读者留言</span>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <Link
                href={`/admin/novels/${id}/stats`}
                className="flex items-center justify-between text-gray-700 hover:text-amber-600 transition-colors"
              >
                <span className="font-medium">📊 数据统计</span>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">章节列表</h2>
              <AddChapterButton novelId={id} chapterCount={chapters?.length || 0} />
            </div>
            {chapters && chapters.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {chapters.map((chapter) => (
                  <ChapterRow key={chapter.id} chapter={chapter} novelId={id} />
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-400">
                <p>还没有章节，点击上方按钮添加</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddChapterButton({ novelId, chapterCount }: { novelId: string; chapterCount: number }) {
  return (
    <a
      href={`/admin/novels/${novelId}/chapters/new?number=${chapterCount + 1}`}
      className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
    >
      + 添加章节
    </a>
  )
}

function ChapterRow({ chapter, novelId }: { chapter: any; novelId: string }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-400 w-8">第{chapter.chapter_number}章</span>
        <div>
          <h3 className="font-medium text-gray-800">{chapter.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {chapter.word_count} 字 · {new Date(chapter.updated_at).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          chapter.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {chapter.is_published ? '已发布' : '草稿'}
        </span>
        <a
          href={`/admin/novels/${novelId}/chapters/${chapter.id}`}
          className="text-amber-600 hover:text-amber-700 text-sm font-medium"
        >
          编辑
        </a>
      </div>
    </div>
  )
}
