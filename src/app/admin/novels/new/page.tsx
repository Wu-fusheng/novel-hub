'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewNovelPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [status, setStatus] = useState<'ongoing' | 'completed' | 'hiatus'>('ongoing')
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      const { error } = await supabase.from('novels').insert({
        title: title.trim(),
        description: description.trim() || null,
        genre: genre.trim() || null,
        status,
        is_published: isPublished,
        author_id: user.id,
      })

      if (error) throw error
      router.push('/admin/novels')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ 新建小说</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">小说标题 *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800"
            placeholder="输入小说标题"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">简介</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 resize-none"
            placeholder="输入小说简介..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">类型/标签</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800"
              placeholder="如：玄幻、都市、科幻"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-white"
            >
              <option value="ongoing">连载中</option>
              <option value="completed">已完结</option>
              <option value="hiatus">暂停中</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="publish"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
          />
          <label htmlFor="publish" className="text-sm text-gray-700">
            立即发布（勾选后读者可以立即看到）
          </label>
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
            {loading ? '创建中...' : '创建小说'}
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
