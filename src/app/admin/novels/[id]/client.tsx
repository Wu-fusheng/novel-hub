'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NovelEditorClient({ novel }: { novel: any }) {
  const router = useRouter()
  const [title, setTitle] = useState(novel.title)
  const [description, setDescription] = useState(novel.description || '')
  const [genre, setGenre] = useState(novel.genre || '')
  const [status, setStatus] = useState(novel.status)
  const [isPublished, setIsPublished] = useState(novel.is_published)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('novels').update({
      title: title.trim(),
      description: description.trim() || null,
      genre: genre.trim() || null,
      status,
      is_published: isPublished,
    }).eq('id', novel.id)
    router.refresh()
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">小说信息</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm text-gray-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm text-gray-800 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
        <input
          type="text"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm text-gray-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm text-gray-800 bg-white"
        >
          <option value="ongoing">连载中</option>
          <option value="completed">已完结</option>
          <option value="hiatus">暂停中</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="pub"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="w-4 h-4 text-amber-500 rounded"
        />
        <label htmlFor="pub" className="text-sm text-gray-700">发布</label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
      >
        {saving ? '保存中...' : '保存修改'}
      </button>
    </div>
  )
}
