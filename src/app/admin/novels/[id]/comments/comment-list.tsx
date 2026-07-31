'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ConfirmModal from '@/components/ConfirmModal'

interface CommentItem {
  id: string
  content: string
  selected_text: string | null
  is_private: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  chapter_id: string | null
  parent_id: string | null
  user_id: string
  reply_to_user_id: string | null
  chapter: { chapter_number: number; title: string } | null
}

interface AdminCommentListProps {
  comments: CommentItem[]
  novelId: string
}

export default function AdminCommentList({ comments, novelId }: AdminCommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localComments, setLocalComments] = useState(comments)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; preview: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', deleteTarget.id)
    if (!error) {
      setLocalComments(prev => prev.filter(c => c.id !== deleteTarget.id))
    } else {
      alert('删除失败: ' + error.message)
    }
    setDeleteTarget(null)
    setDeleting(false)
  }

  const handleReply = async (commentId: string, chapterId: string | null) => {
    if (!replyContent.trim()) return

    setSubmitting(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('请先登录')
      setSubmitting(false)
      return
    }

    const parentComment = localComments.find(c => c.id === commentId)
    const { error } = await supabase.from('comments').insert({
      novel_id: novelId,
      chapter_id: chapterId,
      user_id: user.id,
      content: replyContent.trim(),
      parent_id: commentId,
      reply_to_user_id: parentComment?.user_id || null,
    })

    if (error) {
      alert('回复失败: ' + error.message)
    } else {
      setReplyContent('')
      setReplyingTo(null)
      // Refresh page to show new reply
      window.location.reload()
    }

    setSubmitting(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (localComments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-4xl mb-4">💬</div>
        <p className="text-gray-400">还没有读者留言</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {localComments.map((comment) => (
        <div
          key={comment.id}
          className={`bg-white rounded-xl shadow-sm border ${
            comment.is_private ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
          } p-3 sm:p-5`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                {comment.user_id ? comment.user_id.slice(0, 2).toUpperCase() : '匿'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-medium text-gray-800 text-sm">
                    读者
                  </span>
                  {comment.is_private && (
                    <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                      仅作者可见
                    </span>
                  )}
                  {comment.selected_text && (
                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                      批注
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                  <span className="whitespace-nowrap">{formatTime(comment.created_at)}</span>
                  {comment.chapter && (
                    <Link
                      href={`/novel/${novelId}/chapter/${comment.chapter_id}`}
                      className="text-amber-600 hover:text-amber-700 truncate"
                    >
                      第{comment.chapter.chapter_number}章 {comment.chapter.title}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {comment.selected_text && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-700 italic">「{comment.selected_text}」</p>
            </div>
          )}

          <p className="mt-3 text-gray-700 text-sm leading-relaxed">{comment.content}</p>

                {replyingTo === comment.id ? (
              <div className="mt-3 space-y-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="回复读者..."
                  className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                    className="px-3 sm:px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleReply(comment.id, comment.chapter_id)}
                    disabled={submitting || !replyContent.trim()}
                    className="px-4 sm:px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all"
                  >
                    {submitting ? '发送中...' : '回复'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  回复
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: comment.id, preview: comment.content.substring(0, 30) })}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  删除
                </button>
              </div>
            )}
          </div>
      ))}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除留言"
        message={`确定要删除这条留言吗？${deleteTarget?.preview && deleteTarget.preview.length > 0 ? ` 预览：${deleteTarget.preview}...` : ''}`}
        confirmText="确认删除"
        cancelText="取消"
      />
    </div>
  )
}
