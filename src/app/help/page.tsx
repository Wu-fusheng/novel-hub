import Link from 'next/link'

export const metadata = {
  title: '帮助中心 - Novel Hub',
}

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">帮助中心</h1>
      <p className="text-gray-500 mb-8">了解如何使用 Novel Hub 的各项功能</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/help/reader" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group-hover:-translate-y-1">
            <div className="text-4xl mb-4">📖</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-amber-600 transition-colors">读者指南</h2>
            <p className="text-sm text-gray-500">注册登录、浏览小说、使用书架、评论评分、快捷键等</p>
          </div>
        </Link>

        <Link href="/help/author" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group-hover:-translate-y-1">
            <div className="text-4xl mb-4">✍️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-amber-600 transition-colors">作者指南</h2>
            <p className="text-sm text-gray-500">注册作者账户、创建小说、发布章节、查看数据统计等</p>
          </div>
        </Link>

        <Link href="/help/faq" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group-hover:-translate-y-1">
            <div className="text-4xl mb-4">❓</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-amber-600 transition-colors">常见问题</h2>
            <p className="text-sm text-gray-500">登录问题、功能说明、游客模式、快捷键等常见疑问</p>
          </div>
        </Link>

        <Link href="/" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group-hover:-translate-y-1">
            <div className="text-4xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-amber-600 transition-colors">返回首页</h2>
            <p className="text-sm text-gray-500">回到 Novel Hub 首页开始阅读</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
