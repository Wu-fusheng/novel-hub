import Link from 'next/link'

export const metadata = {
  title: '作者指南 - Novel Hub',
}

export default function AuthorHelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/help" className="text-sm text-amber-600 hover:text-amber-700 mb-6 inline-block">
        ← 返回帮助中心
      </Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">作者指南</h1>

      <div className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">1.</span> 作者注册
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>在登录页面选择"作者登录"标签，输入邮箱和密码。如果账户不存在会自动创建作者账户。</p>
            <p>作者账户拥有管理后台权限，可以创建和管理小说。</p>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">2.</span> 创建与管理小说
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>在管理后台点击"新建小说"创建作品，填写标题、简介、类型等信息。</li>
              <li>小说可以设为<strong>草稿</strong>或<strong>已发布</strong>状态。</li>
              <li>支持设置小说状态：连载中、已完结、暂停中。</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">3.</span> 章节编辑与发布
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>在小说管理页面点击"新建章节"添加新内容。</li>
              <li>填写章节标题、序号和正文内容。</li>
              <li>可以使用<strong>"作者有话说"</strong>功能，在每章末尾给读者留言（会显示在评论区顶部）。</li>
              <li>章节可以单独发布或保存为草稿。</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">4.</span> 数据统计
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>仪表盘</strong>：查看所有小说的总体数据概览。</li>
              <li><strong>书籍统计</strong>：查看单本小说的阅读量、评论数、评分分布、催更人数等详细数据。</li>
              <li><strong>章节阅读数据</strong>：了解每章的阅读人数变化趋势。</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">5.</span> 评论管理
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>在管理后台可以查看所有读者留言。</li>
              <li>支持回复读者留言，回复会显示在原文下方。</li>
              <li>私密留言仅作者可见。</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
