import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch, AUTH_EXPIRED_EVENT } from '@/hooks/use-api'
import {
  authUserFromStored,
  clearTokens,
  getAccessToken,
  setStoredUser,
  setTokens,
  userFromToken,
  type AuthUser,
} from '@/lib/auth'
import type { UnifaLoginResponse, UnifaMe } from '@/types/unifa'
import { AuthContext } from './auth-context'

function readSession(): AuthUser | null {
  return userFromToken(getAccessToken())
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession)
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    const onExpired = () => logout()
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [logout])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return
    void apiFetch<UnifaMe>('/api/v1/auth/me')
      .then((me) => {
        setStoredUser({
          id: me.id,
          email: me.email,
          role: me.role,
          firstName: me.firstName,
          lastName: me.lastName,
          studentId: me.student?.id,
          teacherId: me.teacher?.id,
          adminId: me.admin?.id,
        })
        const next = authUserFromStored({
          id: me.id,
          email: me.email,
          role: me.role,
          firstName: me.firstName,
          lastName: me.lastName,
          studentId: me.student?.id,
          teacherId: me.teacher?.id,
          adminId: me.admin?.id,
        })
        if (next) {
          next.avatar = me.avatarUrl ?? undefined
          next.subtitle = me.student?.department.name ?? me.teacher?.department.name ?? next.subtitle
          setUser(next)
        }
      })
      .catch(() => {
        /* keep the cached session until a later 401 */
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: raw } = await apiFetch<UnifaLoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setTokens(token)
    setStoredUser(raw)
    const next = authUserFromStored(raw)
    if (!next) {
      clearTokens()
      throw new Error('Signed in, but the account has no portal role.')
    }
    setUser(next)
    return next
  }, [])

  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>
}
