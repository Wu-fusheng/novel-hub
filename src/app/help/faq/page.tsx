import Link from 'next/link'

export const metadata = {
  title: '常见问题 - Novel Hub',
}

const faqs = [
  {
    q: '如何成为读者？',
    a: '在登录页面选择"读者登录"，输入用户名和授权密码即可。如果账户不存在会自动注册。授权密码由开发者提供。',
  },
  {
    q: '如何成为作者？',
    a: '在登录页面选择"作者登录"，输入邮箱和密码。如果账户不存在会自动创建作者账户。作者账户拥有管理后台权限。',
  },
  {
    q: '游客模式有什么限制？',
    a: '游客可以浏览所有已发布的小说内容，但无法使用评论、评分、催更、书架等互动功能。登录后即可解锁全部功能。',
  },
  {
    q: '如何催更？',
    a: '登录后，在小说最后一章的页面底部点击"催更"按钮即可。每位读者对每本小说只能催更一次。',
  },
  {
    q: '忘记密码怎么办？',
    a: '读者请联系开发者获取帮助。作者可以通过 Supabase 的密码重置功能重置密码。',
  },
  {
    q: '如何使用书架？',
    a: '开始阅读一本小说后，它会自动添加到您的书架中。书架会记录阅读进度，方便您随时继续阅读。',
  },
  {
    q: '什么是"作者有话说"？',
    a: '作者在发布章节时可以填写一段话，这段话会显示在该章评论区顶部，方便作者与读者交流。',
  },
  {
    q: '如何查看消息通知？',
    a: '登录后，点击导航栏的"消息"按钮（带红色数字角标）即可查看。当您关注的小说有新章节发布时会收到通知。',
  },
  {
    q: '支持哪些快捷键？',
    a: '阅读页面支持：左右箭头键翻页、Esc 关闭弹窗、T 切换夜间模式。',
  },
  {
    q: '如何联系开发者？',
    a: '如有问题或建议，请通过 GitHub Issues 或直接联系开发者。',
  },
]

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/help" className="text-sm text-amber-600 hover:text-amber-700 mb-6 inline-block">
        ← 返回帮助中心
      </Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">常见问题</h1>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">{faq.q}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
