'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">出了点问题</h2>
          <p className="text-gray-500 mb-6">页面加载时遇到了错误，请稍后重试。</p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  )
}
