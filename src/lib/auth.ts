/**
 * JWT token store + session identity for the UniFa API.
 *
 *   POST /api/v1/auth/login  { email, password } → { token, user }
 *   Authorization: Bearer <token>
 *
 * There is no refresh token. A 401 is the end of the session.
 */

const TOKEN_KEY = 'unifa.token'
const USER_KEY = 'unifa.user'

export type Role = 'student' | 'faculty' | 'admin'

export type AuthUser = {
  id: string
  name: string
  role: Role
  email?: string
  avatar?: string
  subtitle?: string
  studentId?: string | null
  teacherId?: string | null
}

type JwtClaims = {
  sub?: string
  email?: string
  role?: string
  exp?: number
}

export type StoredAuthUser = {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
  studentId?: string | null
  teacherId?: string | null
  adminId?: string | null
}

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY)
/** @deprecated UniFa issues a single token. Kept so older call sites compile. */
export const getRefreshToken = () => null

export function setTokens(access: string, _refresh?: string) {
  localStorage.setItem(TOKEN_KEY, access)
}

export function setStoredUser(user: StoredAuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getStoredUser(): StoredAuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuthUser
  } catch {
    return null
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/\//g, '_'))
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}

const ROLES: Role[] = ['student', 'faculty', 'admin']
const isAppRole = (v: unknown): v is Role => ROLES.includes(v as Role)

/** Map UniFa / JWT roles onto the three portal shells. */
export function mapRole(role: string | null | undefined): Role | null {
  if (!role) return null
  const key = role.trim().toUpperCase()
  if (key === 'STUDENT') return 'student'
  if (key === 'TEACHER' || key === 'FACULTY') return 'faculty'
  if (key === 'ADMIN' || key === 'STAFF') return 'admin'
  const lower = role.trim().toLowerCase()
  return isAppRole(lower) ? lower : null
}

export function displayName(user: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.email || 'User'
}

export function authUserFromStored(user: StoredAuthUser): AuthUser | null {
  const role = mapRole(user.role)
  if (!role) return null
  return {
    id: user.id,
    name: displayName(user),
    role,
    email: user.email,
    studentId: user.studentId,
    teacherId: user.teacherId,
  }
}

/** True when the token is absent, unreadable, or past `exp`. Missing `exp` is treated as valid — the API will 401. */
export function isExpired(token: string | null): boolean {
  if (!token) return true
  const claims = decodeJwt(token)
  if (!claims) return true
  if (!claims.exp) return false
  return claims.exp * 1000 <= Date.now()
}

/** Build the app's user object from the stored profile, falling back to JWT claims. */
export function userFromToken(token: string | null): AuthUser | null {
  if (!token || isExpired(token)) return null
  const stored = getStoredUser()
  if (stored) return authUserFromStored(stored)

  const c = decodeJwt(token)
  if (!c) return null
  const role = mapRole(c.role)
  if (!role) return null
  return {
    id: String(c.sub ?? ''),
    name: c.email ?? 'User',
    role,
    email: c.email,
  }
}

/** Landing route for a role — used after login and by the role guard. */
export const homeFor = (role: Role) => `/${role}`
