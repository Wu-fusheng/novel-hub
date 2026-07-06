'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import CommentsPanel from './comments-panel'
import AnnotationPopup from './annotation-popup'
import ChapterRating from './chapter-rating'
import UrgeButton from './urge-button'
import { recordChapterRead } from '@/lib/api/engagement'
import { useReadingSettings } from '@/lib/hooks/use-reading-settings'
import { useReadingProgress } from '@/lib/hooks/use-reading-progress'
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'

export default function ChapterReaderClient({
  chapter,
  novel,
  prevChapter,
  nextChapter,
  allChapters,
  novelId,
}: {
  chapter: any
  novel: any
  prevChapter: any
  nextChapter: any
  allChapters: any[]
  novelId: string
}) {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const { settings, updateSettings, loaded } = useReadingSettings()
  const { progress, readingTime, formatReadingTime } = useReadingProgress()
  const [showSidebar, setShowSidebar] = useState(false)
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [annotationRange, setAnnotationRange] = useState({ start: 0, end: 0 })
  const [refreshComments, setRefreshComments] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showFab, setShowFab] = useState(false)

  // Detect scroll position for floating back button
  useEffect(() => {
    const handleScroll = () => {
      setShowFab(window.scrollY > window.innerHeight)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Update reading progress and record read with debounce
  // Wait 2 seconds after entering chapter before recording progress
  // This prevents frequent writes when rapidly jumping between chapters
  useEffect(() => {
    const timer = setTimeout(async () => {
      const updateProgress = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('reading_progress').upsert({
            user_id: user.id,
            novel_id: novelId,
            chapter_id: chapter.id,
            last_read_at: new Date().toISOString(),
          }, { onConflict: 'user_id,novel_id' })
          // Record chapter read for statistics
          await recordChapterRead(chapter.id)
        }
      }
      updateProgress()
    }, 2000) // 2 second debounce

    return () => clearTimeout(timer)
  }, [chapter.id, novelId])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPrev: () => {
      if (prevChapter) router.push(`/novel/${novelId}/chapter/${prevChapter.id}`)
    },
    onNext: () => {
      if (nextChapter) router.push(`/novel/${novelId}/chapter/${nextChapter.id}`)
    },
    onToggleSidebar: () => setShowSidebar(prev => !prev),
    onIncreaseFont: () => updateSettings({ fontSize: Math.min(28, settings.fontSize + 2) }),
    onDecreaseFont: () => updateSettings({ fontSize: Math.max(14, settings.fontSize - 2) }),
  })

  // Handle text selection for annotation
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const text = selection.toString().trim()
    if (!text || text.length < 2) return

    const range = selection.getRangeAt(0)
    const container = document.querySelector('.reading-content')
    if (!container || !container.contains(range.commonAncestorContainer)) return

    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(container)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preCaretRange.toString().length
    const endOffset = startOffset + text.length

    setSelectedText(text)
    setAnnotationRange({ start: startOffset, end: endOffset })
    setShowAnnotationPopup(true)
    selection.removeAllRanges()
  }, [])

  const handleAnnotationSuccess = () => {
    setShowAnnotationPopup(false)
    setSelectedText('')
    setRefreshComments(prev => prev + 1)
  }

  const themeClasses = {
    light: 'bg-white text-gray-800',
    warm: 'bg-amber-50 text-gray-800',
    dark: 'bg-gray-900 text-gray-200',
    green: 'bg-green-50 text-gray-800',
  }

  const themeBarClasses = {
    light: 'bg-white/90 border-gray-100',
    warm: 'bg-amber-50/90 border-amber-100',
    dark: 'bg-gray-900/90 border-gray-800',
    green: 'bg-green-50/90 border-green-100',
  }

  const paragraphs = chapter.content.split('\n').filter((p: string) => p.trim())

  // Estimate reading time
  const estimatedMinutes = Math.max(1, Math.round(chapter.word_count / 500))

  return (
    <div className={`min-h-screen ${themeClasses[settings.theme]} transition-colors duration-300`}>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200/50">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top Bar */}
      <div className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-sm ${themeBarClasses[settings.theme]}`}>
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/novel/${novelId}`} className="text-gray-500 hover:text-gray-700 text-sm flex items-center" title="返回小说详情">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
              {novel.title}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg text-sm"
              title="目录 (Esc)"
            >
              📋
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg text-sm"
              title="阅读设置"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute right-4 top-12 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
            <h3 className="font-semibold text-gray-800 mb-3">阅读设置</h3>
            
            {/* Font Size */}
            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-2 block">字体大小</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 2) })}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                >
                  A-
                </button>
                <span className="flex-1 text-center text-sm font-medium">{settings.fontSize}px</span>
                <button
                  onClick={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 2) })}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Line Height */}
            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-2 block">行间距</label>
              <div className="flex space-x-2">
                {[1.5, 1.8, 2.0, 2.5].map((lh) => (
                  <button
                    key={lh}
                    onClick={() => updateSettings({ lineHeight: lh })}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                      settings.lineHeight === lh
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {lh === 1.5 ? '紧凑' : lh === 1.8 ? '适中' : lh === 2.0 ? '宽松' : '超宽'}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-2 block">主题</label>
              <div className="flex space-x-2">
                {([
                  { key: 'light', label: '默认', bg: 'bg-white' },
                  { key: 'warm', label: '护眼', bg: 'bg-amber-100' },
                  { key: 'dark', label: '夜间', bg: 'bg-gray-800' },
                  { key: 'green', label: '绿色', bg: 'bg-green-100' },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => updateSettings({ theme: t.key })}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                      settings.theme === t.key
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`inline-block w-3 h-3 rounded-full ${t.bg} border border-gray-300 mr-1`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="text-sm text-gray-500 mb-2 block">字体</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                className="w-full p-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="system-ui">系统默认</option>
                <option value="'Noto Serif SC', serif">思源宋体</option>
                <option value="'PingFang SC', 'Microsoft YaHei', sans-serif">苹方/微软雅黑</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 md:relative md:z-auto">
            <div className="fixed inset-0 bg-black/30 md:hidden" onClick={() => setShowSidebar(false)} />
            <div className="fixed right-0 top-12 bottom-0 w-72 bg-white shadow-xl overflow-y-auto z-50 md:relative md:shadow-none md:w-64 md:top-0 md:border-r border-gray-100">
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3">目录</h3>
                <div className="space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  {allChapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/novel/${novelId}/chapter/${ch.id}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        ch.id === chapter.id
                          ? 'bg-amber-100 text-amber-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                      onClick={() => setShowSidebar(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">第{ch.chapter_number}章 {ch.title}</span>
                        {ch.id === chapter.id && (
                          <span className="text-xs ml-2 flex-shrink-0">📖</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 max-w-3xl mx-auto px-6 sm:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              第{chapter.chapter_number}章 {chapter.title}
            </h1>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
              <span>{chapter.word_count} 字</span>
              <span>·</span>
              <span>预计阅读 {estimatedMinutes} 分钟</span>
              {readingTime > 60 && (
                <>
                  <span>·</span>
                  <span>已读 {formatReadingTime(readingTime)}</span>
                </>
              )}
            </div>
          </div>

          <div
            className="reading-content relative"
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              fontFamily: settings.fontFamily,
            }}
            onMouseUp={handleTextSelection}
          >
            {paragraphs.map((p: string, i: number) => (
              <p key={i} className="mb-4 indent-8">{p}</p>
            ))}

            {/* Text selection hint */}
            {authUser && (
              <div className="absolute -top-6 right-0 text-xs text-gray-400 italic">
                选中文字可添加批注
              </div>
            )}
          </div>

          {/* Chapter Rating */}
          <ChapterRating chapterId={chapter.id} />

          {/* Author's Note */}
          {chapter?.author_note && (
            <div className="mt-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-amber-600 font-semibold text-sm">✍️ 作者有话说</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{chapter.author_note}</p>
            </div>
          )}

          {/* Comments Panel */}
          <CommentsPanel
            chapterId={chapter.id}
            novelId={novelId}
            key={refreshComments}
          />

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
            {prevChapter ? (
              <Link
                href={`/novel/${novelId}/chapter/${prevChapter.id}`}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                ← 上一章
              </Link>
            ) : (
              <div />
            )}
            {nextChapter ? (
              <Link
                href={`/novel/${novelId}/chapter/${nextChapter.id}`}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-medium shadow-lg shadow-amber-200"
              >
                下一章 →
              </Link>
            ) : (
              <Link
                href={`/novel/${novelId}`}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-medium shadow-lg shadow-amber-200"
              >
                返回目录
              </Link>
            )}
          </div>

          {/* Urge Button - only show on last chapter of ongoing novels */}
          <UrgeButton
            novelId={novelId}
            isLastChapter={!nextChapter}
          />

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-8 text-center text-xs text-gray-400 space-x-3">
            <span>← 上一章</span>
            <span>→ 下一章</span>
            <span>Ctrl++ 放大字体</span>
            <span>Ctrl+- 缩小字体</span>
            <span>Esc 目录</span>
          </div>
        </div>
      </div>

      {/* Annotation Popup */}
      {showAnnotationPopup && (
        <AnnotationPopup
          selectedText={selectedText}
          annotationStart={annotationRange.start}
          annotationEnd={annotationRange.end}
          novelId={novelId}
          chapterId={chapter.id}
          onClose={() => {
            setShowAnnotationPopup(false)
            setSelectedText('')
          }}
          onSuccess={handleAnnotationSuccess}
        />
      )}

      {/* Floating Back Button (FAB) - appears when scrolling */}
      {showFab && (
        <Link
          href={`/novel/${novelId}`}
          className="fixed right-6 bottom-6 z-40 w-12 h-12 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center hover:bg-white hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 border border-gray-200"
          title="返回小说详情"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      )}
    </div>
  )
}
