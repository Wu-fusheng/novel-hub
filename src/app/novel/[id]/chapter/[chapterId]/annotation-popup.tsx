'use client'

import { useState } from 'react'
import { createComment } from '@/lib/api/comments'

interface AnnotationPopupProps {
  selectedText: string
  annotationStart: number
  annotationEnd: number
  novelId: string
  chapterId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AnnotationPopup({
  selectedText,
  annotationStart,
  annotationEnd,
  novelId,
  chapterId,
  onClose,
  onSuccess,
}: AnnotationPopupProps) {
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    setError('')

    try {
      await createComment({
        novel_id: novelId,
        chapter_id: chapterId,
        content: content.trim(),
        selected_text: selectedText,
        annotation_start: annotationStart,
        annotation_end: annotationEnd,
        is_private: isPrivate,
      })
      setContent('')
      onSuccess()
    } catch (err: any) {
      setError(err.message || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">💬 添加批注</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Selected text preview */}
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border-l-4 border-blue-400">
            <p className="text-xs text-blue-500 mb-1">选中的文字：</p>
            <p className="text-sm text-blue-800 italic line-clamp-3">「{selectedText}」</p>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的批注..."
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
              rows={4}
              autoFocus
            />

            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
                />
                <span className="text-sm text-gray-500">仅作者可见</span>
              </label>
            </div>

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-200"
              >
                {submitting ? '发送中...' : '发表批注'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
