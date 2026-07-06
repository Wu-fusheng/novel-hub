'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import type { Profile } from '@/lib/types'

interface SettingsClientProps {
  userId: string
  initialProfile: Profile | null
}

export default function SettingsClient({ userId, initialProfile }: SettingsClientProps) {
  const router = useRouter()
  const { updateProfile } = useAuth()
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '')
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = createClient()

    // 8-second timeout to prevent hanging
    let timedOut = false
    const timeoutPromise = new Promise<{ timedOut: boolean }>((resolve) => {
      setTimeout(() => {
        timedOut = true
        resolve({ timedOut: true })
      }, 8000)
    })

    const savePromise = (async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      return { timedOut: false, error }
    })()

    const result = await Promise.race([savePromise, timeoutPromise])

    if (result.timedOut) {
      setMessage({ type: 'error', text: '保存超时，请检查网络后重试' })
    } else if ('error' in result && result.error) {
      setMessage({ type: 'error', text: '保存失败：' + result.error.message })
    } else {
      // Update local state via AuthContext
      updateProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      })
      setMessage({ type: 'success', text: '保存成功！' })
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">个人设置</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Pen Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1.5">
            笔名
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white"
            placeholder="输入您的笔名"
            maxLength={50}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            笔名将显示在您的小说和评论中。留空将使用用户名。
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1.5">
            个人简介
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-800 bg-gray-50 focus:bg-white resize-none"
            placeholder="介绍一下自己..."
            rows={4}
            maxLength={500}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            {bio.length}/500 字
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-200"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </form>
    </div>
  )
}