'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type LoginType = 'author' | 'reader'

// 读者授权密码 - 开发者预设
const READER_AUTH_PASSWORD = 'novelhub2025'

// 带超时的Promise包装器
function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 请求超时，请检查网络连接后重试`)), ms)
    )
  ])
}

export default function LoginPage() {
  const router = useRouter()
  const { injectAuth } = useAuth()
  const [loginType, setLoginType] = useState<LoginType>('reader')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (loginType === 'author') {
        // 作者登录：通过 API 代理请求 Supabase（自动注册新用户）
        const trimmedEmail = email.trim()
        const res = await withTimeout(
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: trimmedEmail,
              password,
              autoRegister: true,
              role: 'author',
            }),
            credentials: 'include',
          }),
          15000,
          '作者登录'
        )
        const data = await res.json()
        if (!data.success || !data.session || !data.user) {
          throw new Error(data.error || '作者登录失败')
        }
        injectAuth(data.user, data.profile || null, {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        })
      } else {
        // 读者登录：验证授权密码，通过 API 代理请求 Supabase
        const trimmedUsername = username.trim()
        const trimmedAuthCode = authCode.trim()

        if (!trimmedUsername) {
          throw new Error('请输入用户名')
        }
        if (trimmedAuthCode !== READER_AUTH_PASSWORD) {
          throw new Error('授权密码错误，请联系开发者获取访问权限')
        }

        // 读者使用固定邮箱格式登录
        const safeUsername = trimmedUsername.replace(/[^a-zA-Z0-9_-]/g, '_')

        // 生成多种可能的邮箱格式（包括常见后缀变体）
        const emailCandidates = [
          `reader_${safeUsername}@mail.novelhub.app`,
          `reader_${safeUsername}@novelhub.local`,
          `reader_${safeUsername}_1@mail.novelhub.app`,
          `reader_${safeUsername}_1@novelhub.local`,
          `reader_${safeUsername}_2@mail.novelhub.app`,
          `reader_${safeUsername}_2@novelhub.local`,
        ]

        // 通过 API 代理进行登录的辅助函数
        // 返回 session tokens、user 和 profile 以便前端注入到 AuthContext
        const proxyLogin = async (candidateEmail: string): Promise<{
          success: boolean
          error?: string
          session?: { access_token: string; refresh_token: string; expires_in: number; expires_at: number }
          user?: { id: string; email: string; user_metadata: any }
          profile?: any
        }> => {
          try {
            const res = await withTimeout(
              fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: candidateEmail, password: trimmedAuthCode }),
                credentials: 'include',
              }),
              12000,
              '读者登录'
            )
            const data = await res.json()
            if (data.success && data.session) {
              return { success: true, session: data.session, user: data.user, profile: data.profile }
            }
            return { success: false, error: data.error || '登录失败' }
          } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : '请求失败' }
          }
        }

        let loggedIn = false
        let lastError = ''
        let loginData: { session: { access_token: string; refresh_token: string; expires_at: number }; user: any; profile: any } | null = null

        // 第一阶段：先尝试基本邮箱格式
        for (const candidateEmail of emailCandidates) {
          const result = await proxyLogin(candidateEmail)
          if (result.success && result.session && result.user) {
            loggedIn = true
            loginData = { session: result.session, user: result.user, profile: result.profile }
            break
          }
          if (result.error) {
            lastError = result.error
          }
        }

        // 所有候选邮箱都失败，尝试通过 API 代理注册新用户
        if (!loggedIn) {
          const newReaderEmail = emailCandidates[0]
          const registerRes = await withTimeout(
            fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: newReaderEmail,
                password: trimmedAuthCode,
                autoRegister: true,
                role: 'reader',
                metadata: {
                  username: trimmedUsername,
                  display_name: trimmedUsername,
                },
              }),
              credentials: 'include',
            }),
            15000,
            '读者注册'
          )
          const registerData = await registerRes.json()
          if (!registerData.success || !registerData.session || !registerData.user) {
            throw new Error(`登录失败：${lastError || registerData.error || '注册失败'}`)
          }
          loginData = { session: registerData.session, user: registerData.user, profile: registerData.profile }
        }

        // 将服务端获取的 user 和 profile 注入到 AuthContext
        // 同时持久化 tokens 到 localStorage，确保页面刷新后仍可恢复
        if (loginData) {
          injectAuth(loginData.user, loginData.profile || null, {
            access_token: loginData.session.access_token,
            refresh_token: loginData.session.refresh_token,
            expires_at: loginData.session.expires_at,
          })
        }
      }

      // 登录成功后清除游客模式标记
      localStorage.removeItem('novel-hub-mode')

      // Use Next.js router for SPA navigation (preserves React state from injectAuth)
      // Do NOT use router.refresh() as it triggers SSR which may override injected state
      router.push('/')
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestBrowse = () => {
    localStorage.setItem('novel-hub-mode', 'guest')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 欢迎来到 Novel Hub</h1>
            <p className="text-gray-500">登录您的 Novel Hub 账户</p>
          </div>

          {/* 登录类型选择 */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setLoginType('reader')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                loginType === 'reader'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👤 读者登录
            </button>
            <button
              type="button"
              onClick={() => setLoginType('author')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                loginType === 'author'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ✍️ 作者登录
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginType === 'author' ? (
              // 作者登录/注册表单
              <>
                <p className="text-sm text-gray-500">
                  输入邮箱和密码登录，若账户不存在将自动注册
                </p>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    邮箱地址
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
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    密码
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              // 读者登录表单
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                    用户名
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="输入您的用户名"
                  />
                </div>

                <div>
                  <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                    授权密码
                  </label>
                  <input
                    id="authCode"
                    type="password"
                    required
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="请输入开发者提供的授权密码"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    授权密码由开发者提供，用于验证读者身份
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              {loginType === 'author' ? (
                <span className="text-gray-400">输入邮箱和密码即可，新用户将自动创建作者账户</span>
              ) : (
                <>
                  需要获取授权密码？{' '}
                  <span className="text-gray-400">请联系开发者</span>
                </>
              )}
            </p>
          </div>

          {/* 游客模式 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleGuestBrowse}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            >
              以游客身份浏览
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
