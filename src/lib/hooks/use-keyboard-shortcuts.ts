'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcuts {
  onPrev?: () => void
  onNext?: () => void
  onToggleSidebar?: () => void
  onIncreaseFont?: () => void
  onDecreaseFont?: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    switch (e.key) {
      case 'ArrowLeft':
        if (shortcuts.onPrev) {
          e.preventDefault()
          shortcuts.onPrev()
        }
        break
      case 'ArrowRight':
      case ' ':
        if (shortcuts.onNext) {
          e.preventDefault()
          shortcuts.onNext()
        }
        break
      case 'Escape':
        if (shortcuts.onToggleSidebar) {
          shortcuts.onToggleSidebar()
        }
        break
      case '+':
      case '=':
        if (e.ctrlKey && shortcuts.onIncreaseFont) {
          e.preventDefault()
          shortcuts.onIncreaseFont()
        }
        break
      case '-':
        if (e.ctrlKey && shortcuts.onDecreaseFont) {
          e.preventDefault()
          shortcuts.onDecreaseFont()
        }
        break
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
