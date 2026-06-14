'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type LoginType = 'author' | 'reader'

// 读者授权密码 - 开发者预设
const READER_AUTH_PASSWORD = 'novelhub2025'

export default function LoginPage() {
  const router = useRouter()
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
      const supabase = createClient()

      if (loginType === 'author') {
        // 作者登录：邮箱 + 密码，若账户不存在则自动注册
        const trimmedEmail = email.trim()
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })

        if (signInError) {
          const msg = signInError.message || ''
          if (msg.includes('Invalid login') || msg.includes('User not found')) {
            // 用户不存在，自动注册
            const { error: signUpError } = await supabase.auth.signUp({
              email: trimmedEmail,
              password,
              options: {
                data: {
                  email: trimmedEmail,
                  role: 'author',
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            })
            if (signUpError) throw signUpError

            // signUp 不会自动登录，需要手动登录
            const loginResult = await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password,
            })
            if (loginResult.error) throw loginResult.error
          } else {
            throw signInError
          }
        }
      } else {
        // 读者登录：验证授权密码
        const trimmedUsername = username.trim()
        const trimmedAuthCode = authCode.trim()

        if (!trimmedUsername) {
          throw new Error('请输入用户名')
        }
        if (trimmedAuthCode !== READER_AUTH_PASSWORD) {
          throw new Error('授权密码错误，请联系开发者获取访问权限')
        }

        // 读者使用固定邮箱格式登录
        // 策略：先通过 profiles 表查找用户名对应的 auth 用户邮箱，再用邮箱登录
        // 这样可以处理 username 被添加后缀（如 _1, _2）的情况
        const safeUsername = trimmedUsername.replace(/[^a-zA-Z0-9_-]/g, '_')

        // 尝试多种邮箱格式
        const emailCandidates = [
          `reader_${safeUsername}@mail.novelhub.app`,
          `reader_${safeUsername}@novelhub.local`,
        ]

        // 同时通过 profiles 表查找可能匹配的用户（处理 username 后缀情况）
        const { data: matchingProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .like('username', `${trimmedUsername}%`)
          .limit(5)

        if (matchingProfiles && matchingProfiles.length > 0) {
          // 通过 auth admin API 获取这些用户的实际邮箱
          for (const profile of matchingProfiles) {
            try {
              // 尝试用 getUser 获取用户信息（需要已登录，这里用另一种方式）
              // 直接尝试常见的邮箱格式组合
              const profileSafe = profile.username.replace(/[^a-zA-Z0-9_-]/g, '_')
              const candidateEmails = [
                `reader_${profileSafe}@mail.novelhub.app`,
                `reader_${profileSafe}@novelhub.local`,
              ]
              for (const email of candidateEmails) {
                if (!emailCandidates.includes(email)) {
                  emailCandidates.push(email)
                }
              }
            } catch {
              // ignore
            }
          }
        }

        let loggedIn = false

        // 依次尝试所有候选邮箱
        for (const candidateEmail of emailCandidates) {
          const signInResult = await supabase.auth.signInWithPassword({
            email: candidateEmail,
            password: trimmedAuthCode,
          })

          if (!signInResult.error && signInResult.data.session) {
            loggedIn = true
            break
          }
        }

        // 所有候选邮箱都失败，尝试注册新用户
        if (!loggedIn) {
          const newReaderEmail = emailCandidates[0]
          const { error: signUpError } = await supabase.auth.signUp({
            email: newReaderEmail,
            password: trimmedAuthCode,
            options: {
              data: {
                username: trimmedUsername,
                display_name: trimmedUsername,
                role: 'reader',
              },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
          if (signUpError) throw signUpError

          // signUp 不会自动登录，需要手动登录
          const loginResult = await supabase.auth.signInWithPassword({
            email: newReaderEmail,
            password: trimmedAuthCode,
          })
          if (loginResult.error) throw loginResult.error
        }
      }

      // 登录成功后清除游客模式标记
      localStorage.removeItem('novel-hub-mode')

      router.push('/')
      router.refresh()
    } catch (err) {
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
