'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ChapterListClient({ chapters, novelId }: { chapters: any[]; novelId: string }) {
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadProgress = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('reading_progress')
          .select('chapter_id')
          .eq('user_id', user.id)
          .eq('novel_id', novelId)
        if (data) {
          setReadChapters(new Set(data.map((p: any) => p.chapter_id).filter(Boolean)))
        }
      }
    }
    loadProgress()
  }, [novelId])

  return (
    <div className="divide-y divide-gray-50">
      {chapters.map((chapter) => (
        <Link
          key={chapter.id}
          href={`/novel/${novelId}/chapter/${chapter.id}`}
          className="px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-amber-50/50 transition-colors group"
        >
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <span className="text-xs sm:text-sm text-gray-400 w-12 sm:w-16 flex-shrink-0">
              第{chapter.chapter_number}章
            </span>
            <span className="text-gray-700 group-hover:text-amber-600 transition-colors truncate text-sm">
              {chapter.title}
            </span>
            {readChapters.has(chapter.id) && (
              <span className="text-xs text-green-500 flex-shrink-0">✓</span>
            )}
          </div>
          <span className="text-xs text-gray-300 flex-shrink-0 ml-2">{chapter.word_count}字</span>
        </Link>
      ))}
    </div>
  )
}
