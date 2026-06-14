'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { Suspense } from 'react'

function NewChapterForm({ novelId }: { novelId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [chapterNumber, setChapterNumber] = useState(1)
  const [isPublished, setIsPublished] = useState(false)
  const [authorNote, setAuthorNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize chapter number from search params
  useEffect(() => {
    const num = searchParams.get('number')
    if (num) {
      setChapterNumber(parseInt(num) || 1)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const wordCount = content.replace(/\s/g, '').length

      const { error } = await supabase.from('chapters').insert({
        novel_id: novelId,
        chapter_number: chapterNumber,
        title: title.trim(),
        content,
        word_count: wordCount,
        is_published: isPublished,
        author_note: authorNote.trim() || null,
      })

      if (error) throw error
      router.push(`/admin/novels/${novelId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ 新建章节</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">章节标题 *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800"
              placeholder="输入章节标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">章节序号</label>
            <input
              type="number"
              min={1}
              value={chapterNumber}
              onChange={(e) => setChapterNumber(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">章节内容 *</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800 font-serif leading-relaxed resize-y"
            placeholder="在此输入章节内容..."
          />
          <p className="text-xs text-gray-400 mt-1">
            当前字数：{content.replace(/\s/g, '').length}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">作者有话说</label>
          <textarea
            value={authorNote}
            onChange={(e) => setAuthorNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800 resize-y"
            placeholder="写点什么给读者看吧（可选，将显示在评论区顶部）"
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="publish"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 text-amber-500 rounded"
          />
          <label htmlFor="publish" className="text-sm text-gray-700">发布此章节</label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-200"
          >
            {loading ? '保存中...' : '保存章节'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewChapterPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <NewChapterPageInner />
    </Suspense>
  )
}

function NewChapterPageInner() {
  const params = useParams()
  const novelId = params.id as string
  return <NewChapterForm novelId={novelId} />
}
