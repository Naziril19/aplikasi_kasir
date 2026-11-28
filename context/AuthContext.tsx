'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatPhoneDisplay } from '@/services/authService'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  userDisplayName: string
  userIdentifier: string
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  userDisplayName: 'Kasir Toko',
  userIdentifier: '',
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let isMounted = true

    async function getInitialSession() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (isMounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          setIsLoading(false)
        }
      } catch (err) {
        console.warn('Gagal mengambil sesi awal:', err)
        if (isMounted) setIsLoading(false)
      }
    }

    void getInitialSession()

    // Dengarkan perubahan state auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Hitung display name ramah pengguna
  const { userDisplayName, userIdentifier } = useMemo(() => {
    if (!user) {
      return { userDisplayName: 'Kasir Toko', userIdentifier: '' }
    }

    const metaPhone =
      (user.user_metadata?.phone as string | undefined) || user.phone

    if (metaPhone) {
      const display = formatPhoneDisplay(metaPhone)
      return { userDisplayName: display, userIdentifier: metaPhone }
    }

    if (user.email) {
      // Jika email adalah alias nomor telepon
      if (user.email.endsWith('@karsakasir.local')) {
        const match = user.email.match(/^phone_(\d+)@/)
        if (match) {
          const rawPhone = '+' + match[1]
          return {
            userDisplayName: formatPhoneDisplay(rawPhone),
            userIdentifier: rawPhone,
          }
        }
      }
      return { userDisplayName: user.email, userIdentifier: user.email }
    }

    return { userDisplayName: 'Kasir Toko', userIdentifier: user.id.slice(0, 8) }
  }, [user])

  // Handler logout
  const signOut = React.useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      toast.success('Anda telah berhasil keluar.')
      router.push('/login')
    } catch {
      toast.error('Gagal keluar dari akun.')
    }
  }, [supabase, router])

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      userDisplayName,
      userIdentifier,
      signOut,
    }),
    [user, session, isLoading, userDisplayName, userIdentifier, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
