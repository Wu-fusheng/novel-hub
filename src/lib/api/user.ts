import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data as Profile | null
}

export async function getUserRole(): Promise<string | null> {
  const profile = await getCurrentProfile()
  return profile?.role || null
}
