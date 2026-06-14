'use client'

import { useState, useEffect } from 'react'
import { getChapterRatingStats, getUserChapterRating, rateChapter } from '@/lib/api/engagement'
import type { ChapterRatingStats } from '@/lib/types'

interface ChapterRatingProps {
  chapterId: string
}

export default function ChapterRating({ chapterId }: ChapterRatingProps) {
  const [stats, setStats] = useState<ChapterRatingStats>({
    avg_rating: 0, total_count: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0
  })
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [chapterId])

  const loadData = async () => {
    setLoading(true)
    const [statsData, userData] = await Promise.all([
      getChapterRatingStats(chapterId),
      getUserChapterRating(chapterId),
    ])
    setStats(statsData)
    setUserRating(userData)
    setLoading(false)
  }

  const handleRate = async (rating: number) => {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await rateChapter(chapterId, rating)
      setUserRating(rating)
      setSuccess('评分成功！')
      // Refresh stats
      const newStats = await getChapterRatingStats(chapterId)
      setStats(newStats)
      setTimeout(() => setSuccess(''), 2000)
    } catch (err: any) {
      setError(err.message || '评分失败')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || submitting}
            onClick={() => interactive && handleRate(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`transition-transform ${interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
              ${submitting ? 'opacity-50' : ''}`}
          >
            <svg
              className={`w-6 h-6 ${
                star <= (interactive && hoverRating ? hoverRating : rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={star <= (interactive && hoverRating ? hoverRating : rating) ? 0 : 1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        ⭐ 本章评分
        {stats.total_count > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({stats.avg_rating.toFixed(1)} 分 · {stats.total_count} 人评分)
          </span>
        )}
      </h3>

      {/* Rating distribution */}
      {stats.total_count > 0 && (
        <div className="mb-4 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats[`rating_${star}` as keyof ChapterRatingStats] as number
            const percentage = stats.total_count > 0 ? (count / stats.total_count) * 100 : 0
            return (
              <div key={star} className="flex items-center space-x-2 text-sm">
                <span className="w-8 text-gray-500">{star}星</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-400 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* User rating */}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600">你的评分：</span>
        {renderStars(userRating || 0, true)}
        {userRating && (
          <span className="text-sm text-amber-600 font-medium">{userRating} 星</span>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-500">{success}</p>}
    </div>
  )
}
