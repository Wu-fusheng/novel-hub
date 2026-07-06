import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DeleteNovelButton, UnpublishNovelButton } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminNovelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="text-center py-12"><p className="text-gray-500">请先登录</p></div>
  }

  const { data: novels } = await supabase
    .from('novels')
    .select('*, chapters(count)')
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  // Fetch stats for each novel
  const novelStats: Record<string, { reads: number; comments: number; urges: number }> = {}
  if (novels) {
    for (const novel of novels) {
      const [{ count: readCount }, { count: commentCount }, { count: urgeCount }] = await Promise.all([
        supabase.from('chapter_reads').select('*', { count: 'exact', head: true }).eq('novel_id', novel.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('novel_id', novel.id).is('parent_id', null),
        supabase.from('urges').select('*', { count: 'exact', head: true }).eq('novel_id', novel.id),
      ])
      novelStats[novel.id] = {
        reads: readCount || 0,
        comments: commentCount || 0,
        urges: urgeCount || 0,
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📚 小说管理</h1>
        <Link
          href="/admin/novels/new"
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200 text-sm"
        >
          + 新建小说
        </Link>
      </div>

      {novels && novels.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">章节数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发布</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">
                  <span className="hidden lg:inline">阅读量</span>
                  <span className="lg:hidden">读</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">
                  <span className="hidden lg:inline">评论数</span>
                  <span className="lg:hidden">评</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">
                  <span className="hidden lg:inline">催更</span>
                  <span className="lg:hidden">催</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {novels.map((novel: any) => {
                  const stats = novelStats[novel.id] || { reads: 0, comments: 0, urges: 0 }
                  return (
                <tr key={novel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{novel.title}</div>
                    {novel.genre && (
                      <div className="text-sm text-gray-400 mt-0.5">{novel.genre}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      novel.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                      novel.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {novel.status === 'ongoing' ? '连载中' : novel.status === 'completed' ? '已完结' : '暂停中'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {novel.chapters?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      novel.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {novel.is_published ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{stats.reads}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{stats.comments}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{stats.urges}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(novel.updated_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/novels/${novel.id}`}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                    >
                      编辑
                    </Link>
                    <Link
                      href={`/admin/novels/${novel.id}/stats`}
                      className="text-gray-400 hover:text-gray-600 text-sm font-medium ml-3"
                      title="数据统计"
                    >
                      📊
                    </Link>
                    <Link
                      href={`/admin/novels/${novel.id}/comments`}
                      className="text-gray-400 hover:text-gray-600 text-sm font-medium ml-2"
                      title="留言管理"
                    >
                      💬
                    </Link>
                    <Link
                      href={`/novel/${novel.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-3"
                    >
                      预览
                    </Link>
                    {novel.is_published && (
                      <UnpublishNovelButton novelId={novel.id} novelTitle={novel.title} />
                    )}
                    <DeleteNovelButton novelId={novel.id} novelTitle={novel.title} />
                  </td>
                </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-400 mb-4">还没有小说</p>
          <Link
            href="/admin/novels/new"
            className="inline-flex items-center px-5 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors text-sm"
          >
            创建第一部小说
          </Link>
        </div>
      )}
    </div>
  )
}
