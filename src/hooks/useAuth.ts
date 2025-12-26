import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { User, UserRole } from '@/types'

export interface UseAuthReturn {
  user: User | null
  supabaseUser: SupabaseUser | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile from users table
  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data as User
  }, [])

  // Handle session changes
  const handleSession = useCallback(async (session: Session | null) => {
    if (session?.user) {
      setSupabaseUser(session.user)
      const profile = await fetchUserProfile(session.user.id)
      if (profile) {
        setUser(profile)
        setRole(profile.role)
      }
    } else {
      setSupabaseUser(null)
      setUser(null)
      setRole(null)
    }
    setIsLoading(false)
  }, [fetchUserProfile])

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        handleSession(session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [handleSession])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setIsLoading(false)
      return { error: new Error(error.message) }
    }

    return { error: null }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setSupabaseUser(null)
    setUser(null)
    setRole(null)
    setIsLoading(false)
  }, [])

  return {
    user,
    supabaseUser,
    role,
    isLoading,
    isAuthenticated: !!supabaseUser,
    signIn,
    signOut,
  }
}
