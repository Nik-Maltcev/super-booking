import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { User, UserRole } from '@/types'

// Helper to generate slug from full name
function generateSlug(fullName: string): string {
  return fullName
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      }
      return map[char] || char
    })
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface UseAuthReturn {
  user: User | null
  supabaseUser: SupabaseUser | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, specialization: string) => Promise<{ error: Error | null }>
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

  // Sign up as lawyer
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    fullName: string,
    specialization: string
  ) => {
    setIsLoading(true)
    
    const slug = generateSlug(fullName) + '-' + Date.now().toString(36)

    // 1. Create auth user with metadata (trigger will create user profile)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'lawyer',
        },
      },
    })

    if (authError) {
      setIsLoading(false)
      return { error: new Error(authError.message) }
    }

    if (!authData.user) {
      setIsLoading(false)
      return { error: new Error('Не удалось создать пользователя') }
    }

    const userId = authData.user.id

    // 2. Create lawyer profile (user profile is created by trigger)
    // Small delay to ensure trigger has completed
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { error: lawyerError } = await supabase
      .from('lawyers')
      .insert({
        user_id: userId,
        slug,
        specialization,
      } as never)

    if (lawyerError) {
      setIsLoading(false)
      return { error: new Error(lawyerError.message) }
    }

    setIsLoading(false)
    return { error: null }
  }, [])

  return {
    user,
    supabaseUser,
    role,
    isLoading,
    isAuthenticated: !!supabaseUser,
    signIn,
    signUp,
    signOut,
  }
}
