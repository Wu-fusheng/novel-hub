'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmModal from '@/components/ConfirmModal'

export function DeleteNovelButton({ novelId, novelTitle }: { novelId: string; novelTitle: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    const supabase = createClient()
    const { error } = await supabase.from('novels').delete().eq('id', novelId)
    if (!error) {
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-500 hover:text-red-600 text-sm font-medium ml-3"
      >
        删除
      </button>
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="删除小说"
        message={`确定要删除《${novelTitle}》吗？此操作不可撤销，所有章节和评论将一并删除。`}
        confirmText="确认删除"
        cancelText="取消"
      />
    </>
  )
}

export function UnpublishNovelButton({ novelId, novelTitle }: { novelId: string; novelTitle: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleUnpublish = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from('novels')
      .update({ is_published: false })
      .eq('id', novelId)
    if (!error) {
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-orange-500 hover:text-orange-600 text-sm font-medium ml-3"
      >
        退回
      </button>
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleUnpublish}
        title="退回草稿"
        message={`确定要将《${novelTitle}》退回草稿状态吗？读者将无法看到此小说。`}
        confirmText="确认退回"
        cancelText="取消"
      />
    </>
  )
}
