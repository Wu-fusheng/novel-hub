'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function EditChapterPage() {
  const router = useRouter()
  const params = useParams()
  const novelId = params.id as string
  const chapterId = params.chapterId as string

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [chapterNumber, setChapterNumber] = useState(1)
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadChapter = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single()
      if (data) {
        setTitle(data.title)
        setContent(data.content)
        setChapterNumber(data.chapter_number)
        setIsPublished(data.is_published)
      }
      setLoading(false)
    }
    loadChapter()
  }, [chapterId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const supabase = createClient()
      const wordCount = content.replace(/\s/g, '').length

      const { error } = await supabase.from('chapters').update({
        title: title.trim(),
        content,
        chapter_number: chapterNumber,
        word_count: wordCount,
        is_published: isPublished,
      }).eq('id', chapterId)

      if (error) throw error
      router.push(`/admin/novels/${novelId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ 编辑章节</h1>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">章节标题 *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800"
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
          />
          <p className="text-xs text-gray-400 mt-1">
            当前字数：{content.replace(/\s/g, '').length}
          </p>
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
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-200"
          >
            {saving ? '保存中...' : '保存修改'}
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
