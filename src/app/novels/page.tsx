import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { NovelCardSkeleton } from '@/components/skeleton'

export const dynamic = 'force-dynamic'

async function NovelsList() {
  const supabase = await createClient()

  const { data: novels, error } = await supabase
    .from('novels')
    .select('*, profiles(display_name)')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to load novels:', error)
    return (
      <div className="text-center py-16">
        <p className="text-red-500">加载失败，请稍后重试</p>
      </div>
    )
  }

  if (!novels || novels.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
        <div className="text-5xl mb-4">📝</div>
        <p className="text-gray-400 text-lg">暂无作品，敬请期待</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
  )
}

export default async function NovelsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📚 小说库</h1>
        <p className="text-gray-500 mt-2">发现精彩作品，开启阅读之旅</p>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <NovelCardSkeleton key={i} />
          ))}
        </div>
      }>
        <NovelsList />
      </Suspense>
    </div>
  )
}
