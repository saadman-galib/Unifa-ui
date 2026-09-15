import type { Role } from './auth'

/**
 * Demo accounts from the UniFa seed (`npm run seed` on uninexus-server).
 * Shown on the login page in development so a reviewer can pick a portal.
 */
export const DEMO_ACCOUNTS: { role: Role; email: string; password: string; label: string }[] = [
  { role: 'student', email: 'student@unifa.edu', password: 'Password123!', label: 'Student' },
  { role: 'faculty', email: 'teacher@unifa.edu', password: 'Password123!', label: 'Teacher' },
  { role: 'admin', email: 'admin@unifa.edu', password: 'Password123!', label: 'Admin' },
]

export const demoAuthEnabled = () => import.meta.env.DEV

/** @deprecated Fake JWT minting is gone — the UniFa API is the source of identity. */
export const devAuthEnabled = demoAuthEnabled
export const DEV_USERS = DEMO_ACCOUNTS.map((a) => a.role)
