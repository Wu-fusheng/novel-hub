'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AddToBookshelfButtonProps {
  novelId: string
  novelTitle: string
}

export default function AddToBookshelfButton({ novelId, novelTitle }: AddToBookshelfButtonProps) {
  const [inBookshelf, setInBookshelf] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Check if novel is already in bookshelf
  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('novel_id', novelId)
        .maybeSingle()
      setInBookshelf(!!data)
      setLoading(false)
    }
    check()
  }, [novelId])

  const handleClick = async () => {
    if (inBookshelf || submitting) return

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('请先登录')
      setSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: user.id,
        novel_id: novelId,
        chapter_id: null,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'user_id,novel_id' })

    if (!error) {
      setInBookshelf(true)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <span className="px-4 py-2 text-sm text-gray-400">
        ...
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={inBookshelf || submitting}
      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
        inBookshelf
          ? 'bg-gray-100 text-gray-400 cursor-default'
          : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
      }`}
    >
      {inBookshelf ? '📖 已在书架' : '📖 加入书架'}
    </button>
  )
}