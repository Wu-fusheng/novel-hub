import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">请先登录</p>
      </div>
    )
  }

  let novelCount = 0
  let chapterCount = 0
  let recentNovels: any[] = []
  let unreadCommentCount = 0
  let totalUrgingCount = 0
  let novelStats: any[] = []

  try {
    const [novelCountResult, novelsResult] = await Promise.all([
      supabase
        .from('novels')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id),
      supabase
        .from('novels')
        .select('*, profiles(display_name)')
        .eq('author_id', user.id)
        .order('updated_at', { ascending: false }),
    ])

    novelCount = novelCountResult.count || 0
    recentNovels = novelsResult.data || []

    // Get chapter count
    const novelIds = recentNovels.map((n: any) => n.id)
    if (novelIds.length > 0) {
      const chapterCountResult = await supabase
        .from('chapters')
        .select('novel_id', { count: 'exact', head: true })
        .in('novel_id', novelIds)
      chapterCount = chapterCountResult.count || 0
    }

    // Get unread comments count (comments where author hasn't replied)
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .in('novel_id', novelIds)
      .eq('is_deleted', false)
      .neq('user_id', user.id)
    unreadCommentCount = commentCount || 0

    // Get total urging count
    const { count: urgingResult } = await supabase
      .from('urgings')
      .select('*', { count: 'exact', head: true })
      .in('novel_id', novelIds)
    totalUrgingCount = urgingResult || 0

    // Get per-novel stats
    novelStats = await Promise.all(
      recentNovels.map(async (novel: any) => {
        const [commentRes, urgingRes, readRes, ratingRes] = await Promise.all([
          supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('novel_id', novel.id)
            .eq('is_deleted', false),
          supabase
            .from('urgings')
            .select('*', { count: 'exact', head: true })
            .eq('novel_id', novel.id),
          supabase.rpc('get_novel_total_reads', { p_novel_id: novel.id }),
          supabase.rpc('get_novel_rating_overview', { p_novel_id: novel.id }),
        ])

        const ratings = ratingRes.data || []
        const totalRatings = ratings.reduce((sum: number, r: any) => sum + (Number(r.total_ratings) || 0), 0)
        const avgRating = totalRatings > 0
          ? (ratings.reduce((sum: number, r: any) => sum + (Number(r.avg_rating) || 0) * (Number(r.total_ratings) || 0), 0) / totalRatings)
          : 0

        return {
          id: novel.id,
          title: novel.title,
          status: novel.status,
          is_published: novel.is_published,
          commentCount: commentRes.count || 0,
          urgingCount: urgingRes.count || 0,
          readCount: readRes.data || 0,
          avgRating: avgRating.toFixed(1),
          updated_at: novel.updated_at,
        }
      })
    )
  } catch (error) {
    console.error('Failed to load admin data:', error)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理仪表盘</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-amber-600">{novelCount}</div>
          <div className="text-gray-500 mt-1 text-xs">小说总数</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-orange-600">{chapterCount}</div>
          <div className="text-gray-500 mt-1 text-xs">章节总数</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">
            {recentNovels?.filter((n: any) => n.is_published).length || 0}
          </div>
          <div className="text-gray-500 mt-1 text-xs">已发布</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{unreadCommentCount}</div>
          <div className="text-gray-500 mt-1 text-xs">读者留言</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-purple-600">{totalUrgingCount}</div>
          <div className="text-gray-500 mt-1 text-xs">催更总数</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-yellow-600">
            {novelStats.reduce((sum: number, n: any) => sum + Number(n.readCount), 0)}
          </div>
          <div className="text-gray-500 mt-1 text-xs">总阅读量</div>
        </div>
      </div>

      {/* Per-novel stats table */}
      {novelStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">书籍数据概览</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">小说</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">阅读</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">评论</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">催更</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">评分</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {novelStats.map((novel: any) => (
                  <tr key={novel.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <span className="font-medium text-gray-800">{novel.title}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        novel.is_published
                          ? novel.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {novel.is_published
                          ? novel.status === 'ongoing' ? '连载中'
                            : novel.status === 'completed' ? '已完结'
                            : '暂停中'
                          : '草稿'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">{novel.readCount}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">{novel.commentCount}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">{novel.urgingCount}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-amber-600 font-medium">{novel.avgRating}</span>
                      <span className="text-amber-400 text-xs ml-0.5">★</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/admin/novels/${novel.id}/stats`} className="text-blue-600 hover:text-blue-700 text-sm" title="数据">
                          📊
                        </Link>
                        <Link href={`/admin/novels/${novel.id}/comments`} className="text-green-600 hover:text-green-700 text-sm" title="评论">
                          💬
                        </Link>
                        <Link href={`/admin/novels/${novel.id}`} className="text-amber-600 hover:text-amber-700 text-sm" title="编辑">
                          ✏️
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent novels list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">最近更新</h2>
          <Link href="/admin/novels" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            查看全部 →
          </Link>
        </div>
        {recentNovels && recentNovels.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentNovels.slice(0, 5).map((novel: any) => (
              <div key={novel.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{novel.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {novel.status === 'ongoing' ? '连载中' : novel.status === 'completed' ? '已完结' : '暂停中'}
                    {' · '}
                    {new Date(novel.updated_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    novel.is_published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {novel.is_published ? '已发布' : '草稿'}
                  </span>
                  <Link
                    href={`/admin/novels/${novel.id}`}
                    className="text-amber-600 hover:text-amber-700 text-sm"
                  >
                    编辑
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            <p>还没有小说，点击下方按钮开始创作吧！</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/admin/novels/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
        >
          新建小说
        </Link>
      </div>
    </div>
  )
}
