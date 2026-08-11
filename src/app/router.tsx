import { Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router'
import { AppShell } from '@/layouts/app-shell'
import { LoadingState } from '@/components/states'
import { LoginPage } from '@/features/auth/login-page'
import { Placeholder } from './placeholder'
import { SCREENS } from './routes'
import { SCREEN_COMPONENTS } from './screens'
import type { Role } from '@/lib/auth'

/**
 * Nav destinations with no entry in the Figma inventory. They still need a
 * route; whether they render a real screen or a placeholder is decided by
 * SCREEN_COMPONENTS, exactly as for inventory screens.
 */
const EXTRA_ROUTES: { path: string; title: string }[] = [
  { path: '/student/library', title: 'Library' },
  { path: '/student/services', title: 'Student Services' },
  { path: '/student/clubs', title: 'Clubs' },
  { path: '/student/transport', title: 'Transport' },
  { path: '/student/hostel', title: 'Hostel' },
  { path: '/student/digital-id', title: 'Digital ID' },
  { path: '/student/career', title: 'Career' },
  { path: '/student/communication', title: 'Communication' },
  { path: '/student/settings', title: 'Settings' },
  { path: '/faculty/settings', title: 'Settings' },
  { path: '/faculty/support', title: 'Support' },
  { path: '/admin/health', title: 'System Health' },
  { path: '/admin/settings', title: 'Settings' },
  { path: '/admin/support', title: 'Support' },
]

/**
 * One resolution rule for every route: render the built screen if one is
 * registered, otherwise a placeholder naming the Figma node (when there is
 * one). Keeping this in a single place is why adding a screen only ever means
 * adding an entry to SCREEN_COMPONENTS.
 */
function routeFor(base: string, entry: { path: string; title: string; node?: string }): RouteObject {
  const Component = SCREEN_COMPONENTS[entry.path]
  const isIndex = entry.path === base

  return {
    // The index route carries no path; otherwise strip the shell's base prefix.
    path: isIndex ? undefined : entry.path.slice(base.length + 1),
    index: isIndex ? true : undefined,
    element: Component ? (
      <Component />
    ) : (
      <Placeholder title={entry.title} node={entry.node} path={entry.path} />
    ),
  }
}

function routesFor(role: Role): RouteObject[] {
  const base = `/${role}`
  const mine = (p: string) => p === base || p.startsWith(`${base}/`)

  return [
    ...SCREENS.filter((s) => mine(s.path)),
    ...EXTRA_ROUTES.filter((e) => mine(e.path)),
  ].map((entry) => routeFor(base, entry))
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Navigate to="/login" replace /> },
  ...(['student', 'faculty', 'admin'] as const).map((role) => ({
    path: `/${role}`,
    element: <AppShell role={role} />,
    children: routesFor(role),
  })),
  { path: '*', element: <Placeholder title="Page not found" /> },
])

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingState className="min-h-screen" />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
