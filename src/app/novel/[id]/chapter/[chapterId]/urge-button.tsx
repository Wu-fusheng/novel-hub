'use client'

import { useState, useEffect } from 'react'
import { getNovelUrgingCount, hasUserUrged, urgeNovel, cancelUrge } from '@/lib/api/engagement'

interface UrgeButtonProps {
  novelId: string
  isLastChapter: boolean
}

export default function UrgeButton({ novelId, isLastChapter }: UrgeButtonProps) {
  const [urgingCount, setUrgingCount] = useState(0)
  const [hasUrged, setHasUrged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [novelId])

  const loadData = async () => {
    setLoading(true)
    const [count, urged] = await Promise.all([
      getNovelUrgingCount(novelId),
      hasUserUrged(novelId),
    ])
    setUrgingCount(count)
    setHasUrged(urged)
    setLoading(false)
  }

  const handleUrge = async () => {
    setSubmitting(true)
    setError('')
    try {
      if (hasUrged) {
        await cancelUrge(novelId)
        setHasUrged(false)
        setUrgingCount(prev => Math.max(0, prev - 1))
      } else {
        await urgeNovel(novelId)
        setHasUrged(true)
        setUrgingCount(prev => prev + 1)
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLastChapter) return null

  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        onClick={handleUrge}
        disabled={submitting || loading}
        className={`group relative px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300
          ${hasUrged
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300'
            : 'bg-white border-2 border-amber-400 text-amber-600 hover:bg-amber-50'
          }
          ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        `}
      >
        <span className="flex items-center space-x-2">
          <svg
            className={`w-5 h-5 transition-transform ${hasUrged ? 'animate-bounce' : 'group-hover:animate-pulse'}`}
            fill={hasUrged ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span>{hasUrged ? '已催更' : '催更'}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${hasUrged ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>
            {urgingCount}
          </span>
        </span>
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <p className="mt-2 text-xs text-gray-400">
        {hasUrged ? '感谢你的催更，作者会更有动力更新！' : '点击催更，让作者知道你在等待更新'}
      </p>
    </div>
  )
}
