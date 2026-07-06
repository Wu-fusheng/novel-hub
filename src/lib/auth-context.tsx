'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserMode, AuthContextType } from '@/lib/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MODE_KEY = 'novel-hub-mode'
// Custom localStorage key for storing auth data (tokens + user + profile)
// This is used as a fallback when Supabase SDK cannot connect to the server
const AUTH_STORAGE_KEY = 'novel-hub-auth'

interface StoredAuth {
  access_token: string
  refresh_token: string
  expires_at: number
  user: any
  profile: Profile | null
}

function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Check if token is expired (with 5 min buffer)
    if (parsed.expires_at && parsed.expires_at * 1000 < Date.now() + 300000) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function setStoredAuth(auth: StoredAuth | null) {
  if (typeof window === 'undefined') return
  if (auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mode, setModeState] = useState<UserMode>('guest')
  const [isLoading, setIsLoading] = useState(true)
  // Track externally injected auth data (from API proxy login)
  const injectedRef = useRef<{ user: any; profile: Profile | null } | null>(null)

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
      const savedMode = typeof window !== 'undefined' ? localStorage.getItem(MODE_KEY) : null

      // Priority 1: Check if auth data was externally injected (e.g., from API proxy login)
      if (injectedRef.current) {
        const { user: injectedUser, profile: injectedProfile } = injectedRef.current
        setUser(injectedUser)
        setProfile(injectedProfile)
        const m = determineMode(injectedProfile)
        setModeState(m)
        if (typeof window !== 'undefined') {
          localStorage.setItem(MODE_KEY, m)
        }
        injectedRef.current = null
        setIsLoading(false)
        return
      }

      // Priority 2: Try Supabase SDK (getUser -> getSession)
      // Use short timeout for getUser since it requires network call to Supabase
      let authUser = null
      let supabaseSession = null
      try {
        const { data: { user: getUserResult } } = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getUser timeout')), 5000)
          )
        ])
        if (getUserResult) {
          authUser = getUserResult
        }
      } catch {
        // getUser failed or timed out - fall through to getSession
      }

      if (!authUser) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          authUser = session?.user || null
          supabaseSession = session
        } catch {
          // getSession also failed
        }
      }

      // Priority 3: Fallback to localStorage-stored auth data
      if (!authUser) {
        const stored = getStoredAuth()
        if (stored && stored.user) {
          authUser = stored.user
          // Try to restore session in Supabase SDK (best-effort, no await)
          supabase.auth.setSession({
            access_token: stored.access_token,
            refresh_token: stored.refresh_token,
          }).catch(() => {
            // Ignore - we'll use localStorage data directly
          })
        }
      }

      if (authUser) {
        setUser(authUser)
        // Try to load profile from Supabase, fallback to localStorage
        let p: Profile | null = null
        try {
          p = await loadProfile(authUser.id)
        } catch {
          // Network error, try localStorage
          const stored = getStoredAuth()
          p = stored?.profile || null
        }
        if (!p) {
          const stored = getStoredAuth()
          p = stored?.profile || null
        }
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
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        const authUserData = session?.user || null
        if (authUserData) {
          setUser(authUserData)
          let p: Profile | null = null
          try {
            p = await loadProfile(authUserData.id)
          } catch {
            const stored = getStoredAuth()
            p = stored?.profile || null
          }
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
        setStoredAuth(null)
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

  // Inject auth data from external source (e.g., API proxy login)
  // This also persists tokens to localStorage for cross-page-refresh recovery
  const injectAuth = useCallback((injectedUser: any, injectedProfile: Profile | null, tokens?: { access_token: string; refresh_token: string; expires_at: number }) => {
    injectedRef.current = { user: injectedUser, profile: injectedProfile }
    setUser(injectedUser)
    setProfile(injectedProfile)
    const m = determineMode(injectedProfile)
    setModeState(m)
    if (typeof window !== 'undefined') {
      localStorage.setItem(MODE_KEY, m)
    }
    // Persist tokens to localStorage for recovery after page refresh
    if (tokens) {
      setStoredAuth({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
        user: injectedUser,
        profile: injectedProfile,
      })
    }
  }, [determineMode])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    let authUser = null
    try {
      const { data: { user: getUserResult } } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('getUser timeout')), 5000)
        )
      ])
      if (getUserResult) {
        authUser = getUserResult
      }
    } catch {
      const { data: { session } } = await supabase.auth.getSession()
      authUser = session?.user || null
    }
    if (!authUser) {
        const { data: { session } } = await supabase.auth.getSession()
        authUser = session?.user || null
      }
      if (!authUser) {
        const stored = getStoredAuth()
        if (stored?.user) authUser = stored.user
      }
    if (authUser) {
      setUser(authUser)
      let p: Profile | null = null
      try {
        p = await loadProfile(authUser.id)
      } catch {
        const stored = getStoredAuth()
        p = stored?.profile || null
      }
      setProfile(p)
      const m = determineMode(p)
      setModeState(m)
    } else {
      setUser(null)
      setProfile(null)
      setModeState('guest')
      setStoredAuth(null)
    }
    setIsLoading(false)
  }, [loadProfile, determineMode])

  return (
    <AuthContext.Provider value={{ user, profile, mode, isLoading, setMode, refresh, injectAuth }}>
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
