'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserMode, AuthContextType } from '@/lib/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MODE_KEY = 'novel-hub-mode'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mode, setModeState] = useState<UserMode>('guest')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data as Profile | null
  }, [supabase])

  const determineMode = useCallback((p: Profile | null): UserMode => {
    if (p?.role === 'admin') return 'admin'
    if (p?.role === 'author') return 'author'
    if (p?.role === 'reader') return 'reader'
    return 'guest'
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      // Check localStorage for guest preference first
      const savedMode = typeof window !== 'undefined' ? localStorage.getItem(MODE_KEY) : null

      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        setUser(authUser)
        const p = await loadProfile(authUser.id)
        setProfile(p)
        const m = determineMode(p)
        setModeState(m)
        if (typeof window !== 'undefined') {
          localStorage.setItem(MODE_KEY, m)
        }
      } else if (savedMode === 'guest') {
        setModeState('guest')
      } else {
        setModeState('guest')
      }
      setIsLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setUser(authUser)
          const p = await loadProfile(authUser.id)
          setProfile(p)
          const m = determineMode(p)
          setModeState(m)
          if (typeof window !== 'undefined') {
            localStorage.setItem(MODE_KEY, m)
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setModeState('guest')
        if (typeof window !== 'undefined') {
          localStorage.removeItem(MODE_KEY)
        }
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, loadProfile, determineMode])

  const setMode = useCallback((newMode: UserMode) => {
    setModeState(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(MODE_KEY, newMode)
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      setUser(authUser)
      const p = await loadProfile(authUser.id)
      setProfile(p)
      const m = determineMode(p)
      setModeState(m)
    } else {
      setUser(null)
      setProfile(null)
      setModeState('guest')
    }
    setIsLoading(false)
  }, [supabase, loadProfile, determineMode])

  return (
    <AuthContext.Provider value={{ user, profile, mode, isLoading, setMode, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
