'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const startTimeRef = useRef(Date.now())
  const rafRef = useRef<number>()

  const updateProgress = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const currentProgress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0
    setProgress(currentProgress)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateProgress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateProgress()

    // Update reading time every 30 seconds
    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setReadingTime(elapsed)
    }, 30000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearInterval(timeInterval)
    }
  }, [updateProgress])

  const formatReadingTime = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`
  }, [])

  return { progress, readingTime, formatReadingTime }
}
