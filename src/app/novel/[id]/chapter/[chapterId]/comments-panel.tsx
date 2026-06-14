'use client'

import { useState, useEffect, useCallback } from 'react'
import { getChapterComments, createComment, deleteComment, isNovelAuthor } from '@/lib/api/comments'
import { useAuth } from '@/lib/auth-context'
import type { Comment } from '@/lib/types'

interface CommentsPanelProps {
  chapterId: string
  novelId: string
}

export default function CommentsPanel({ chapterId, novelId }: CommentsPanelProps) {
  const { user: authUser, profile: authProfile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthor, setIsAuthor] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [error, setError] = useState('')

  // Derive currentUser from auth context
  const currentUser = authUser ? { ...authUser, profile: authProfile } : null

  const loadComments = useCallback(async () => {
    setLoading(true)
    const [commentsData, authorStatus] = await Promise.all([
      getChapterComments(chapterId),
      isNovelAuthor(novelId),
    ])
    setComments(commentsData)
    setIsAuthor(authorStatus)
    setLoading(false)
  }, [chapterId, novelId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    setError('')

    try {
      await createComment({
        novel_id: novelId,
        chapter_id: chapterId,
        content: newComment.trim(),
        is_private: isPrivate,
        parent_id: replyTo?.id || null,
        reply_to_user_id: replyTo?.user_id || null,
      })
      setNewComment('')
      setIsPrivate(false)
      setReplyTo(null)
      await loadComments()
    } catch (err: any) {
      setError(err.message || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条留言吗？')) return
    try {
      await deleteComment(commentId)
      await loadComments()
    } catch (err: any) {
      setError(err.message || '删除失败')
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-12 mt-3' : 'mt-4'} p-4 rounded-xl ${
        comment.is_author_note
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-gray-100'
      } border shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
            {(comment.display_name || comment.username || '匿').charAt(0)}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">
              {comment.display_name || comment.username || '匿名用户'}
            </span>
            {comment.isAuthor && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">作者</span>
            )}
            {comment.is_author_note && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-200 text-amber-800 rounded font-medium">置顶</span>
            )}
            {comment.is_private && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">仅作者可见</span>
            )}
            {comment.selected_text && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">批注</span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">{formatTime(comment.created_at)}</span>
      </div>

      {comment.selected_text && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-blue-700 italic line-clamp-2">「{comment.selected_text}」</p>
        </div>
      )}

      <p className="mt-2 text-gray-700 text-sm leading-relaxed">{comment.content}</p>

      <div className="mt-3 flex items-center space-x-4">
        {currentUser && (
          <button
            onClick={() => setReplyTo(replyTo?.id === comment.id ? null : comment)}
            className="text-xs text-gray-500 hover:text-amber-600 transition-colors"
          >
            {replyTo?.id === comment.id ? '取消回复' : '回复'}
          </button>
        )}
        {currentUser?.id === comment.user_id && (
          <button
            onClick={() => handleDelete(comment.id)}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            删除
          </button>
        )}
      </div>

      {/* Reply form */}
      {replyTo?.id === comment.id && (
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs text-gray-500">回复 @{comment.display_name || comment.username}:</span>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的回复..."
            className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
            rows={2}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '发送中...' : '发送回复'}
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        💬 读者留言
        {comments.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">({comments.length})</span>
        )}
      </h3>

      {/* New comment form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {(currentUser.profile?.display_name || currentUser.profile?.username || '我').charAt(0)}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? `回复 @${replyTo.display_name || replyTo.username}...` : '分享你的想法...'}
                className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
                rows={3}
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
                  />
                  <span className="text-sm text-gray-500">仅作者可见</span>
                </label>
                <div className="flex items-center space-x-2">
                  {replyTo && (
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      取消回复
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-200"
                  >
                    {submitting ? '发送中...' : replyTo ? '回复' : '发表留言'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-500">登录后即可发表留言</p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">还没有留言，来做第一个留言的人吧！</p>
        </div>
      ) : (
        <div>
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  )
}
