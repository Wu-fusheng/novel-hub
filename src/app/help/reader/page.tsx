import Link from 'next/link'

export const metadata = {
  title: '读者指南 - Novel Hub',
}

export default function ReaderHelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/help" className="text-sm text-amber-600 hover:text-amber-700 mb-6 inline-block">
        ← 返回帮助中心
      </Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">读者指南</h1>

      <div className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">1.</span> 注册与登录
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>Novel Hub 提供两种登录方式：</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>读者登录</strong>：输入用户名和授权密码即可。如果账户不存在会自动注册。</li>
              <li><strong>游客模式</strong>：无需登录即可浏览小说内容，但无法使用评论、评分、书架等互动功能。</li>
            </ul>
            <p>授权密码由开发者提供，用于验证读者身份。</p>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">2.</span> 浏览小说
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>在<strong>小说库</strong>页面可以浏览所有已发布的小说。</li>
              <li>点击小说封面进入详情页，查看简介和章节列表。</li>
              <li>点击章节标题开始阅读。</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">3.</span> 使用书架
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>开始阅读一本小说后，它会自动添加到您的<strong>书架</strong>中。</li>
              <li>书架会记录您每本书的阅读进度（当前章节）。</li>
              <li>点击"继续阅读"可以快速回到上次阅读的位置。</li>
              <li>您也可以将不感兴趣的书籍从书架中移除。</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">4.</span> 互动功能
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>评论</strong>：在章节末尾可以发表留言，也可以回复其他读者的留言。勾选"仅作者可见"可以发送私密留言。</li>
              <li><strong>评分</strong>：为每章打 1-5 星评分，帮助其他读者了解章节质量。</li>
              <li><strong>催更</strong>：在小说最后一章点击"催更"按钮，让作者知道你在等待更新。</li>
              <li><strong>批注</strong>：选中正文中的文字，可以针对特定段落发表评论。</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">5.</span> 阅读设置
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>点击阅读页工具栏的<strong>设置</strong>图标，可以调整字体大小、行间距。</li>
              <li>支持<strong>夜间模式</strong>切换，保护眼睛。</li>
              <li>阅读进度会自动保存。</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">6.</span> 快捷键
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-4 text-gray-500 font-medium">快捷键</th>
                  <th className="text-left py-2 px-4 text-gray-500 font-medium">功能</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-50"><td className="py-2 px-4"><kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">←</kbd></td><td className="py-2 px-4">上一章</td></tr>
                <tr className="border-b border-gray-50"><td className="py-2 px-4"><kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">→</kbd></td><td className="py-2 px-4">下一章</td></tr>
                <tr className="border-b border-gray-50"><td className="py-2 px-4"><kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd></td><td className="py-2 px-4">关闭弹窗/目录</td></tr>
                <tr><td className="py-2 px-4"><kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">T</kbd></td><td className="py-2 px-4">切换夜间模式</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
