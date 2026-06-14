'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteNovelButton({ novelId, novelTitle }: { novelId: string; novelTitle: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    const supabase = createClient()
    await supabase.from('novels').delete().eq('id', novelId)
    router.refresh()
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="inline-flex items-center space-x-2 ml-3">
        <span className="text-xs text-red-500">确认删除？</span>
        <button onClick={handleDelete} className="text-red-600 text-sm font-medium hover:text-red-700">
          是
        </button>
        <button onClick={() => setConfirming(false)} className="text-gray-500 text-sm hover:text-gray-700">
          否
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-500 hover:text-red-600 text-sm font-medium ml-3"
    >
      删除
    </button>
  )
}
