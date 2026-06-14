import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { NovelCardSkeleton } from '@/components/skeleton'

export const dynamic = 'force-dynamic'

async function RecentNovels() {
  const supabase = await createClient()

  const [novelsResult, countResult] = await Promise.all([
    supabase
      .from('novels')
      .select('*, profiles(display_name)')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('novels')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true),
  ])

  const novels = novelsResult.data || []
  const totalNovels = countResult.count || 0

  return (
    <>
      <div className="mt-8 flex justify-center space-x-8 text-sm text-gray-500">
        <span>📚 {totalNovels} 部作品</span>
        <span>📖 沉浸式阅读</span>
        <span>📱 多端适配</span>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">最近更新</h2>
          <Link href="/novels" className="text-amber-600 hover:text-amber-700 font-medium text-sm">
            查看全部 →
          </Link>
        </div>

        {novels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {novels.map((novel: any) => (
              <Link key={novel.id} href={`/novel/${novel.id}`} className="group">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group-hover:-translate-y-1">
                  <div className="aspect-[3/4] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative overflow-hidden">
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">📖</span>
                    {novel.status === 'ongoing' && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                        连载中
                      </span>
                    )}
                    {novel.status === 'completed' && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                        已完结
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {novel.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {novel.description || '暂无简介'}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {novel.profiles?.display_name || '匿名作者'}
                      </span>
                      {novel.genre && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {novel.genre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-400 text-lg">暂无作品，敬请期待</p>
          </div>
        )}
      </section>
    </>
  )
}

export default async function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Novel Hub
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            一个优雅的小说阅读平台，沉浸式阅读体验
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/novels"
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
            >
              开始阅读
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 border-2 border-amber-300 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-colors"
            >
              登录 / 注册
            </Link>
          </div>
          <Suspense fallback={
            <div className="mt-8 flex justify-center space-x-8 text-sm text-gray-400">
              <span>📚 加载中...</span>
              <span>📖 沉浸式阅读</span>
              <span>📱 多端适配</span>
            </div>
          }>
            <RecentNovels />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
