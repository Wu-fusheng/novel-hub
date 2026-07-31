'use client'

import { useState, useEffect } from 'react'
import {
  getNovelStats,
  getNovelChapterCommentCounts,
  getNovelRatingOverview,
  getNovelChapterReadCounts,
} from '@/lib/api/engagement'
import type { NovelStats, ChapterCommentCount, ChapterRatingOverview } from '@/lib/types'

interface NovelStatsClientProps {
  novelId: string
  novelStatus: string
  chapters: { id: string; chapter_number: number; title: string }[]
}

export default function NovelStatsClient({ novelId, novelStatus, chapters }: NovelStatsClientProps) {
  const [stats, setStats] = useState<NovelStats>({
    total_reads: 0,
    monthly_reads: 0,
    daily_reads: 0,
    urging_count: 0,
  })
  const [commentCounts, setCommentCounts] = useState<ChapterCommentCount[]>([])
  const [ratingOverview, setRatingOverview] = useState<ChapterRatingOverview[]>([])
  const [readCounts, setReadCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'ratings'>('overview')

  useEffect(() => {
    loadData()
  }, [novelId])

  const loadData = async () => {
    setLoading(true)
    const [novelStats, comments, ratings] = await Promise.all([
      getNovelStats(novelId),
      getNovelChapterCommentCounts(novelId),
      getNovelRatingOverview(novelId),
    ])

    setStats(novelStats)
    setCommentCounts(comments)
    setRatingOverview(ratings)

    // Load read counts in batch
    const readCountsMap = await getNovelChapterReadCounts(novelId)
    setReadCounts(readCountsMap)
    setLoading(false)
  }

  const totalComments = commentCounts.reduce((sum, c) => sum + c.comment_count, 0)
  const totalRatings = ratingOverview.reduce((sum, r) => sum + r.total_ratings, 0)
  const avgRating = totalRatings > 0
    ? (ratingOverview.reduce((sum, r) => sum + r.avg_rating * r.total_ratings, 0) / totalRatings).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-blue-600">{stats.total_reads}</div>
          <div className="text-gray-500 mt-1 text-sm">总阅读人数</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">{stats.monthly_reads}</div>
          <div className="text-gray-500 mt-1 text-sm">本月阅读</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-orange-600">{stats.daily_reads}</div>
          <div className="text-gray-500 mt-1 text-sm">今日阅读</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-amber-600">{stats.urging_count}</div>
          <div className="text-gray-500 mt-1 text-sm">催更人数</div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{chapters.length}</div>
            <div className="text-gray-500 text-sm">总章节数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{totalComments}</div>
            <div className="text-gray-500 text-sm">总评论数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{avgRating} ⭐</div>
            <div className="text-gray-500 text-sm">平均评分 ({totalRatings}人)</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto -webkit-overflow-scrolling-touch">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-shrink-0 px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📖 章节阅读
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-shrink-0 px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'comments'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💬 章节评论
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`flex-shrink-0 px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'ratings'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⭐ 评分统计
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">章节</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">标题</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">阅读人数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.map((chapter) => (
                      <tr key={chapter.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">第{chapter.chapter_number}章</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{chapter.title}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">
                          {readCounts[chapter.id] || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card layout */}
              <div className="sm:hidden divide-y divide-gray-50">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-400">第{chapter.chapter_number}章</div>
                      <div className="text-sm text-gray-800 truncate">{chapter.title}</div>
                    </div>
                    <div className="ml-3 text-sm font-semibold text-blue-600 flex-shrink-0">
                      {readCounts[chapter.id] || 0}
                      <span className="text-xs text-gray-400 font-normal ml-0.5">阅读</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              {commentCounts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>暂无评论数据</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">章节</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">标题</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">评论数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commentCounts.map((cc) => (
                          <tr key={cc.chapter_id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">第{cc.chapter_number}章</td>
                            <td className="py-3 px-4 text-sm text-gray-800">{cc.chapter_title}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                cc.comment_count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {cc.comment_count}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile card layout */}
                  <div className="sm:hidden divide-y divide-gray-50">
                    {commentCounts.map((cc) => (
                      <div key={cc.chapter_id} className="py-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-400">第{cc.chapter_number}章</div>
                          <div className="text-sm text-gray-800 truncate">{cc.chapter_title}</div>
                        </div>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                          cc.comment_count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {cc.comment_count} 评论
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'ratings' && (
            <div>
              {ratingOverview.length === 0 || totalRatings === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>暂无评分数据</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">章节</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">标题</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">平均评分</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">评分人数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratingOverview.map((ro) => (
                          <tr key={ro.chapter_id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">第{ro.chapter_number}章</td>
                            <td className="py-3 px-4 text-sm text-gray-800">{ro.chapter_title}</td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span className="text-amber-600 font-medium">
                                {ro.avg_rating > 0 ? ro.avg_rating.toFixed(1) : '-'}
                              </span>
                              {ro.avg_rating > 0 && (
                                <span className="text-amber-400 ml-1">⭐</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                ro.total_ratings > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {ro.total_ratings}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile card layout */}
                  <div className="sm:hidden divide-y divide-gray-50">
                    {ratingOverview.map((ro) => (
                      <div key={ro.chapter_id} className="py-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-400">第{ro.chapter_number}章</div>
                          <div className="text-sm text-gray-800 truncate">{ro.chapter_title}</div>
                        </div>
                        <div className="ml-3 text-right flex-shrink-0">
                          <div className="text-sm font-semibold text-amber-600">
                            {ro.avg_rating > 0 ? ro.avg_rating.toFixed(1) : '-'}
                            {ro.avg_rating > 0 && <span className="text-amber-400 ml-0.5">⭐</span>}
                          </div>
                          <div className="text-xs text-gray-400">{ro.total_ratings}人</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
