'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConfirmModal from '@/components/ConfirmModal'

interface DeleteChapterButtonProps {
  chapterId: string
  chapterTitle: string
}

export default function DeleteChapterButton({ chapterId, chapterTitle }: DeleteChapterButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId)
    if (!error) {
      router.refresh()
    } else {
      alert('删除失败：' + error.message)
    }
    setDeleting(false)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        className="text-red-500 hover:text-red-700 text-sm hover:underline disabled:opacity-50"
        title="删除此章节"
      >
        {deleting ? '删除中...' : '🗑️ 删除'}
      </button>
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="删除章节"
        message={`确定要删除章节"${chapterTitle}"吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
      />
    </>
  )
}