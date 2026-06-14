'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // 统一 trim 输入
    const trimmedEmail = email.trim()
    const trimmedUsername = username.trim()
    const trimmedDisplayName = displayName.trim()

    // 验证密码
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    if (!trimmedUsername) {
      setError('请输入用户名')
      return
    }

    if (!trimmedEmail) {
      setError('请输入邮箱地址')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      console.log('Starting registration...', { email: trimmedEmail, username: trimmedUsername })

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            username: trimmedUsername,
            display_name: trimmedDisplayName || trimmedUsername,
            role: 'author',
          },
        },
      })

      console.log('Registration response:', { data, error })

      if (error) {
        console.error('Registration error:', error)
        throw error
      }

      // 注册成功后，在 profiles 表中创建记录
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          username: trimmedUsername,
          display_name: trimmedDisplayName || trimmedUsername,
          role: 'author',
        })
        if (profileError) {
          console.error('Failed to create profile:', profileError)
        }
      }

      // 检查是否有 session（如果关闭了邮件确认，应该有 session）
      if (data.session) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin')
          router.refresh()
        }, 1500)
      } else {
        // 没有session但也没error - 可能是邮件确认模式
        setSuccess(true)
      }
    } catch (err) {
      console.error('Registration failed:', err)
      const message = err instanceof Error ? err.message : '注册失败，请重试'
      // 翻译常见错误
      if (message.includes('already registered') || message.includes('already been registered')) {
        setError('该邮箱已被注册，请直接登录或使用其他邮箱')
      } else if (message.includes('Invalid API key')) {
        setError('系统配置错误，请联系管理员')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">✍️ 作者注册</h1>
            <p className="text-gray-500">创建作者账户，开始创作之旅</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                用户名 <span className="text-red-400">*</span>
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
                placeholder="选择一个用户名"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1.5">
                显示名称
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
                placeholder="可选，默认与用户名相同"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                邮箱地址 <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
                placeholder="your@email.com"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                作者账户需要使用真实邮箱进行验证
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                密码 <span className="text-red-400">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
                placeholder="至少6个字符"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                确认密码 <span className="text-red-400">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
                placeholder="再次输入密码"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm">
                🎉 注册成功！正在跳转到首页...
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200"
            >
              {loading ? '注册中...' : '注册作者账户'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-500 text-sm">
              已有账户？{' '}
              <Link href="/auth/login" className="text-amber-600 hover:text-amber-700 font-medium">
                直接登录
              </Link>
            </p>
            <p className="text-gray-400 text-xs">
              读者无需注册，请使用授权密码直接登录
            </p>
            <div className="mt-4 text-center">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  localStorage.setItem('novel-hub-mode', 'guest')
                  window.location.href = '/'
                }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                以游客身份浏览 →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
