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

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data as Profile | null
  }, [])

  const determineMode = useCallback((p: Profile | null): UserMode => {
    if (p?.role === 'admin') return 'admin'
    if (p?.role === 'author') return 'author'
    if (p?.role === 'reader') return 'reader'
    return 'guest'
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const initAuth = async () => {
      // Check localStorage for guest preference first
      const savedMode = typeof window !== 'undefined' ? localStorage.getItem(MODE_KEY) : null

      // Try getUser first, fallback to getSession (getUser can return null when middleware refreshes tokens)
      let authUser = null
      const { data: { user: getUserResult } } = await supabase.auth.getUser()
      if (getUserResult) {
        authUser = getUserResult
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        authUser = session?.user || null
      }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle all auth state changes, not just SIGNED_IN/SIGNED_OUT
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        const authUserData = session?.user || null
        if (authUserData) {
          setUser(authUserData)
          const p = await loadProfile(authUserData.id)
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
  }, [loadProfile, determineMode])

  const setMode = useCallback((newMode: UserMode) => {
    setModeState(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(MODE_KEY, newMode)
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    // Try getUser first, fallback to getSession
    let authUser = null
    const { data: { user: getUserResult } } = await supabase.auth.getUser()
    if (getUserResult) {
      authUser = getUserResult
    } else {
      const { data: { session } } = await supabase.auth.getSession()
      authUser = session?.user || null
    }
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
  }, [loadProfile, determineMode])

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
