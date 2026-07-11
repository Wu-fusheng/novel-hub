'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConfirmModal from '@/components/ConfirmModal'

interface BookshelfItemClient {
  id: string
  novel_id: string
  chapter_id: string | null
  last_read_at: string
  novel: any
  chapter: any
  totalChapters: number
}

interface BookshelfClientProps {
  bookshelf: BookshelfItemClient[]
}

export default function BookshelfClient({ bookshelf }: BookshelfClientProps) {
  const router = useRouter()
  const [removing, setRemoving] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<{ novelId: string; title: string } | null>(null)

  const handleRemove = async () => {
    if (!removeTarget) return
    const novelId = removeTarget.novelId
    setRemoving(novelId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('reading_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('novel_id', novelId)

    if (!error) {
      router.refresh()
    }
    setRemoving(null)
    setRemoveTarget(null)
  }

  const handleContinueReading = (novelId: string, chapterId: string | null) => {
    if (chapterId) {
      router.push(`/novel/${novelId}/chapter/${chapterId}`)
    } else {
      router.push(`/novel/${novelId}`)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  if (bookshelf.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
        <div className="text-5xl mb-4">📚</div>
        <p className="text-gray-400 text-lg mb-4">书架空空如也</p>
        <p className="text-gray-500 text-sm">开始阅读小说后，它们会自动出现在这里</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookshelf.map((item) => {
        const progress = item.totalChapters > 0 && item.chapter
          ? Math.round((item.chapter.chapter_number / item.totalChapters) * 100)
          : 0

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
          >
            {/* Book cover + info row */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-14 h-18 sm:w-20 sm:h-26 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📖</span>
              </div>

              {/* Book info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate text-sm sm:text-base">{item.novel?.title || '未知小说'}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                  {item.novel?.author?.display_name || item.novel?.profiles?.display_name || '匿名作者'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  {item.chapter && (
                    <span className="truncate">
                      读到 第{item.chapter.chapter_number}章 {item.chapter.title}
                    </span>
                  )}
                  <span className="flex-shrink-0">{formatTime(item.last_read_at)}</span>
                </div>
                {/* Progress bar */}
                {progress > 0 && (
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              <button
                onClick={() => handleContinueReading(item.novel_id, item.chapter_id)}
                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
              >
                继续阅读
              </button>
              <button
                onClick={() => setRemoveTarget({ novelId: item.novel_id, title: item.novel?.title || '未知小说' })}
                disabled={removing === item.novel_id}
                className="px-3 py-2 text-gray-400 hover:text-red-500 text-sm transition-colors"
                title="移出书架"
              >
                {removing === item.novel_id ? '...' : '✕'}
              </button>
            </div>
          </div>
        )
      })}

      {/* Remove Confirm Modal */}
      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="移出书架"
        message={`确定要将《${removeTarget?.title || ''}》从书架移除吗？`}
        confirmText="确认移除"
        cancelText="取消"
      />
    </div>
  )
}
