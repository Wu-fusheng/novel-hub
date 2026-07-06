'use client'

import AddToBookshelfButton from '@/components/AddToBookshelfButton'

export default function NovelActions({ novelId, novelTitle }: { novelId: string; novelTitle: string }) {
  return (
    <AddToBookshelfButton novelId={novelId} novelTitle={novelTitle} />
  )
}