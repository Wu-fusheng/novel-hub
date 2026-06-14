'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReadingSettings {
  fontSize: number
  lineHeight: number
  theme: 'light' | 'warm' | 'dark' | 'green'
  fontFamily: string
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  theme: 'light',
  fontFamily: 'system-ui',
}

const STORAGE_KEY = 'novel-hub-reading-settings'

export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (e) {
      console.error('Failed to load reading settings:', e)
    }
    setLoaded(true)
  }, [])

  const updateSettings = useCallback((updates: Partial<ReadingSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      } catch (e) {
        console.error('Failed to save reading settings:', e)
      }
      return newSettings
    })
  }, [])

  return { settings, updateSettings, loaded }
}
