import {
  Award,
  Banknote,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  BusFront,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileBadge,
  FileSpreadsheet,
  FlaskConical,
  GraduationCap,
  Home,
  Landmark,
  LayoutDashboard,
  Library,
  LifeBuoy,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/lib/auth'

/**
 * Sidebar contents — measured from the Figma frames, not invented:
 *   student 6:7179 · faculty 1:2 · admin 7:15548
 *
 * Single source for all three sidebars. Adding a screen means adding a route
 * in app/router.tsx and (if it is top-level) an entry here.
 */
export type NavEntry =
  | { kind: 'divider' }
  | { kind: 'spacer' }
  | {
      kind: 'link'
      label: string
      to: string
      icon: LucideIcon
      /** `end` for index routes, so `/student` isn't active on every child. */
      end?: boolean
      /** The AI Assistant item carries its own tinted overlay. */
      emphasis?: boolean
      /** No designed screen yet — routed to a placeholder. */
      undesigned?: boolean
    }

export const NAV: Record<Role, NavEntry[]> = {
  student: [
    { kind: 'link', label: 'Dashboard', to: '/student', icon: LayoutDashboard, end: true },
    { kind: 'link', label: 'My Profile', to: '/student/profile', icon: UserRound },
    { kind: 'link', label: 'Academic', to: '/student/academic/courses', icon: GraduationCap },
    { kind: 'link', label: 'Learning (LMS)', to: '/student/lms', icon: BookOpen },
    { kind: 'link', label: 'Attendance', to: '/student/attendance', icon: CalendarCheck },
    { kind: 'link', label: 'Examination', to: '/student/exams', icon: ClipboardList },
    { kind: 'link', label: 'Finance', to: '/student/finance', icon: Wallet },
    { kind: 'link', label: 'Library', to: '/student/library', icon: Library, undesigned: true },
    { kind: 'link', label: 'Student Services', to: '/student/services', icon: LifeBuoy, undesigned: true },
    { kind: 'link', label: 'Clubs', to: '/student/clubs', icon: Users, undesigned: true },
    { kind: 'link', label: 'Transport', to: '/student/transport', icon: BusFront, undesigned: true },
    { kind: 'link', label: 'Hostel', to: '/student/hostel', icon: Home, undesigned: true },
    { kind: 'divider' },
    { kind: 'link', label: 'AI Assistant', to: '/student/ai', icon: Sparkles, emphasis: true },
    { kind: 'link', label: 'Certificates', to: '/student/certificates', icon: Award },
    { kind: 'link', label: 'Digital ID', to: '/student/digital-id', icon: FileBadge, undesigned: true },
    { kind: 'link', label: 'Career', to: '/student/career', icon: Briefcase, undesigned: true },
    { kind: 'link', label: 'Communication', to: '/student/communication', icon: MessageSquare, undesigned: true },
    { kind: 'spacer' },
    { kind: 'link', label: 'Settings', to: '/student/settings', icon: Settings, undesigned: true },
  ],

  faculty: [
    { kind: 'link', label: 'Dashboard', to: '/faculty', icon: LayoutDashboard, end: true },
    { kind: 'link', label: 'My Profile', to: '/faculty/profile', icon: UserRound },
    { kind: 'link', label: 'Academic', to: '/faculty/academic', icon: GraduationCap },
    { kind: 'link', label: 'Courses', to: '/faculty/courses', icon: BookOpen },
    { kind: 'link', label: 'Examination', to: '/faculty/exams', icon: ClipboardList },
    { kind: 'link', label: 'Attendance', to: '/faculty/attendance', icon: CalendarCheck },
    { kind: 'link', label: 'Gradebook', to: '/faculty/gradebook', icon: FileSpreadsheet },
    { kind: 'link', label: 'Research', to: '/faculty/research', icon: FlaskConical },
    { kind: 'link', label: 'Library', to: '/faculty/library', icon: Library },
    { kind: 'link', label: 'Finance', to: '/faculty/finance', icon: Wallet },
    { kind: 'spacer' },
    { kind: 'link', label: 'Settings', to: '/faculty/settings', icon: Settings, undesigned: true },
    { kind: 'link', label: 'Support', to: '/faculty/support', icon: LifeBuoy, undesigned: true },
  ],

  admin: [
    { kind: 'link', label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { kind: 'link', label: 'User Management', to: '/admin/users', icon: UserCog },
    { kind: 'link', label: 'Academic', to: '/admin/academic', icon: GraduationCap },
    { kind: 'link', label: 'Admissions', to: '/admin/admissions', icon: Building2 },
    { kind: 'link', label: 'Examination', to: '/admin/exams', icon: ClipboardList },
    { kind: 'link', label: 'Finance', to: '/admin/finance', icon: Landmark },
    { kind: 'link', label: 'System Health', to: '/admin/health', icon: BarChart3, undesigned: true },
    { kind: 'spacer' },
    { kind: 'link', label: 'Settings', to: '/admin/settings', icon: Settings, undesigned: true },
    { kind: 'link', label: 'Support', to: '/admin/support', icon: LifeBuoy, undesigned: true },
  ],
}

/** Sub-navigation shown inside a module, keyed by the module's base path. */
export const SUB_NAV: Record<string, { label: string; to: string; end?: boolean }[]> = {
  '/student/profile': [
    { label: 'Personal Info', to: '/student/profile', end: true },
    { label: 'Academic', to: '/student/profile/academic' },
    { label: 'Documents', to: '/student/profile/documents' },
    { label: 'Activity Log', to: '/student/profile/activity' },
  ],
  '/student/academic': [
    { label: 'My Courses', to: '/student/academic/courses' },
    { label: 'Curriculum', to: '/student/academic/curriculum' },
    { label: 'Degree Progress', to: '/student/academic/degree-progress' },
    { label: 'Credit Progress', to: '/student/academic/credits' },
    { label: 'Class Routine', to: '/student/academic/routine' },
    { label: 'Calendar', to: '/student/academic/calendar' },
    { label: 'Faculty', to: '/student/academic/faculty' },
    { label: 'Classrooms', to: '/student/academic/classrooms' },
    { label: 'Semester Reg.', to: '/student/academic/registration/semester' },
    { label: 'Course Reg.', to: '/student/academic/registration/courses' },
    { label: 'Drop / Add', to: '/student/academic/registration/drop-add' },
  ],
  '/student/lms': [
    { label: 'Overview', to: '/student/lms', end: true },
    { label: 'My Courses', to: '/student/lms/courses' },
    { label: 'Assignments', to: '/student/lms/assignments' },
    { label: 'Quizzes', to: '/student/lms/quizzes' },
    { label: 'Live Classes', to: '/student/lms/live' },
    { label: 'Recordings', to: '/student/lms/recordings' },
    { label: 'Forum', to: '/student/lms/forum' },
    { label: 'Notes', to: '/student/lms/notes' },
    { label: 'Progress', to: '/student/lms/progress' },
    { label: 'Gradebook', to: '/student/lms/gradebook' },
    { label: 'Analytics', to: '/student/lms/analytics' },
    { label: 'Announcements', to: '/student/lms/announcements' },
    { label: 'Downloads', to: '/student/lms/downloads' },
  ],
  '/student/attendance': [
    { label: 'Overview', to: '/student/attendance', end: true },
    { label: 'Daily', to: '/student/attendance/daily' },
    { label: 'By Course', to: '/student/attendance/by-course' },
    { label: 'History', to: '/student/attendance/history' },
    { label: 'Analytics', to: '/student/attendance/analytics' },
  ],
  '/student/exams': [
    { label: 'Overview', to: '/student/exams', end: true },
    { label: 'Schedule', to: '/student/exams/schedule' },
    { label: 'Upcoming', to: '/student/exams/upcoming' },
    { label: 'Admit Card', to: '/student/exams/admit-card' },
    { label: 'Results', to: '/student/exams/results' },
    { label: 'Grade Report', to: '/student/exams/grade-report' },
    { label: 'Revaluation', to: '/student/exams/revaluation' },
    { label: 'Attendance Sheet', to: '/student/exams/attendance' },
    { label: 'Analytics', to: '/student/exams/analytics' },
  ],
  '/student/finance': [
    { label: 'Overview', to: '/student/finance', end: true },
    { label: 'Make Payment', to: '/student/finance/pay' },
    { label: 'Fee Statement', to: '/student/finance/statement' },
    { label: 'Invoices', to: '/student/finance/invoices' },
    { label: 'Installments', to: '/student/finance/installments' },
    { label: 'History', to: '/student/finance/history' },
  ],
  '/student/ai': [
    { label: 'Overview', to: '/student/ai', end: true },
    { label: 'Chat', to: '/student/ai/chat' },
    { label: 'Study Planner', to: '/student/ai/study-planner' },
    { label: 'Notes', to: '/student/ai/notes' },
    { label: 'Quiz', to: '/student/ai/quiz' },
    { label: 'Assignment Helper', to: '/student/ai/assignment-helper' },
    { label: 'Advisor', to: '/student/ai/advisor' },
    { label: 'Recommendations', to: '/student/ai/recommendations' },
  ],
}

export const BRAND_SUBTITLE: Record<Role, string> = {
  student: 'Academic Portal',
  faculty: 'Faculty Portal',
  admin: 'Institutional Admin',
}

export const BRAND_ICON: Record<Role, LucideIcon> = {
  student: GraduationCap,
  faculty: GraduationCap,
  admin: ShieldCheck,
}

/** Re-exported so shells can render quick-action rows without new imports. */
export { Banknote, Bot, CreditCard }
