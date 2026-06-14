'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

const PROMPT_KEY = 'novel-hub-prompt-dismissed'

export default function GuestPrompt() {
  const [show, setShow] = useState(false)
  const router = useRouter()
  const { mode, setMode, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    const dismissed = localStorage.getItem(PROMPT_KEY)
    if (!dismissed && mode === 'guest') {
      // Delay showing to avoid flash
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [mode, isLoading])

  const handleLogin = () => {
    setShow(false)
    router.push('/auth/login')
  }

  const handleGuest = () => {
    setMode('guest')
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📖</div>
          <h2 className="text-xl font-bold text-gray-800">欢迎来到 Novel Hub</h2>
          <p className="text-sm text-gray-500 mt-2">选择您的浏览方式</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
          >
            登录 / 注册
          </button>

          <button
            onClick={handleGuest}
            className="w-full py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            游客模式浏览
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            不再提示
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          游客模式可浏览内容，登录后可使用书架、评论、评分等功能
        </p>
      </div>
    </div>
  )
}
