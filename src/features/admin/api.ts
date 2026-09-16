import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/hooks/use-api'
import { mapUsers, num } from '@/lib/unifa'
import type { Cursored } from '@/types'
import type {
  AcademicManagementResponse,
  AdminFinanceResponse,
  AdmissionsResponse,
  ApplicationDetailResponse,
  AssignSlotRequest,
  AuditEntry,
  ChangeUserStatusRequest,
  ChangeUserStatusResult,
  CreateUserRequest,
  DecideApplicationRequest,
  DecideApplicationResult,
  ExamHubResponse,
  ExamScheduleResponse,
  LedgerEntry,
  MarksEntryResponse,
  PublishMarksRequest,
  PublishMarksResult,
  SaveMarksRequest,
  SaveMarksResult,
  SlotState,
  UserManagementResponse,
  UserRow,
  UserSecurityProfileResponse,
} from '@/types/admin'
import type {
  UnifaDepartment,
  UnifaDirectoryUser,
  UnifaExam,
  UnifaFinanceReport,
  UnifaInvoice,
} from '@/types/unifa'

export type UserFilters = { q: string; role: string; status: string; page: number }

const usersKey = (f: UserFilters) => ['admin', 'users', f.q, f.role, f.status, f.page]

export const useAdminAcademic = () =>
  useQuery({
    queryKey: ['admin', 'academic'],
    queryFn: async (): Promise<AcademicManagementResponse> => {
      const departments = await apiFetch<UnifaDepartment[]>('/api/v1/academic/departments')
      return {
        metrics: [{ label: 'Departments', value: String(departments.length), tone: 'brand' }],
        departments: departments.map((d) => ({
          department: { id: d.id, name: d.name, code: d.code },
          programmeCount: d.programs?.length ?? 0,
          facultyCount: 0,
          studentCount: 0,
          headName: d.head?.user ? `${d.head.user.firstName ?? ''} ${d.head.user.lastName ?? ''}`.trim() : null,
        })),
      }
    },
  })

export const useUserManagement = (f: UserFilters) =>
  useQuery({
    queryKey: usersKey(f),
    queryFn: async (): Promise<UserManagementResponse> => {
      const all = mapUsers(await apiFetch<UnifaDirectoryUser[]>('/api/v1/auth/users'))
      const needle = f.q.trim().toLowerCase()
      let results = all.results.filter((u) => {
        if (f.role !== 'ALL' && u.role !== f.role) return false
        if (f.status !== 'ALL' && u.status !== f.status) return false
        if (!needle) return true
        return `${u.fullName} ${u.email}`.toLowerCase().includes(needle)
      })
      const count = results.length
      const start = (f.page - 1) * 20
      results = results.slice(start, start + 20)
      return {
        ...all,
        count,
        results,
        next: start + 20 < count ? String(f.page + 1) : null,
        previous: f.page > 1 ? String(f.page - 1) : null,
      }
    },
  })

export const useCreateUser = (_f: UserFilters) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: CreateUserRequest): Promise<UserRow> => {
      const [firstName, ...rest] = vars.fullName.split(' ')
      const lastName = rest.join(' ') || firstName
      const password = 'Password123!'
      if (vars.role === 'student') {
        await apiFetch('/api/v1/people/students', {
          method: 'POST',
          body: JSON.stringify({
            email: vars.email,
            password,
            firstName,
            lastName,
            studentNo: `NEW-${Date.now()}`,
            departmentId: vars.departmentId,
            programId: vars.departmentId,
            admissionYear: new Date().getFullYear(),
          }),
        })
      } else if (vars.role === 'faculty') {
        await apiFetch('/api/v1/people/teachers', {
          method: 'POST',
          body: JSON.stringify({
            email: vars.email,
            password,
            firstName,
            lastName,
            employeeNo: `TCH-${Date.now()}`,
            departmentId: vars.departmentId,
            designation: 'Lecturer',
          }),
        })
      } else {
        throw new ApiError(400, { error: 'Create admin/staff accounts from the server seed for now.' })
      }
      return {
        id: vars.email,
        reference: 'NEW',
        fullName: vars.fullName,
        email: vars.email,
        role: vars.role,
        department: null,
        status: 'ACTIVE',
        lastActiveAt: null,
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export const useSecurityProfile = (userId: string) =>
  useQuery({
    queryKey: ['admin', 'users', userId, 'security'],
    queryFn: async (): Promise<UserSecurityProfileResponse> => {
      const users = await apiFetch<UnifaDirectoryUser[]>('/api/v1/auth/users')
      const u = users.find((x) => x.id === userId)
      if (!u) throw new ApiError(404, { error: 'User not found' })
      return {
        user: {
          id: u.id,
          reference: u.id.slice(-6).toUpperCase(),
          fullName: `${u.firstName} ${u.lastName}`.trim(),
          email: u.email,
          role: u.role === 'TEACHER' ? 'faculty' : u.role === 'STUDENT' ? 'student' : 'admin',
          department: null,
          status: u.status === 'INACTIVE' ? 'DEACTIVATED' : u.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
          lastActiveAt: u.lastLoginAt ?? null,
        },
        contact: { phone: u.phone ?? null, address: null },
        stats: [],
        sessions: [],
        recentLogins: [],
        notes: [],
        audit: [],
      }
    },
  })

export const useChangeUserStatus = (userId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: ChangeUserStatusRequest): Promise<ChangeUserStatusResult> => {
      const status =
        vars.status === 'DEACTIVATED' || vars.status === 'INVITED' ? 'INACTIVE' : vars.status
      const row = await apiFetch<{ id: string; email: string; status: string }>(
        `/api/v1/auth/users/${userId}/status`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
      )
      return {
        user: {
          id: row.id,
          reference: row.id.slice(-6).toUpperCase(),
          fullName: row.email,
          email: row.email,
          role: 'admin',
          department: null,
          status: row.status === 'INACTIVE' ? 'DEACTIVATED' : row.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
          lastActiveAt: null,
        },
        audit: {
          id: crypto.randomUUID(),
          action: 'user.status',
          actorName: 'You',
          at: new Date().toISOString(),
          summary: `Status set to ${row.status}`,
        },
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export const useRevokeSession = (_userId: string) =>
  useMutation({
    mutationFn: async (_sessionId: string): Promise<AuditEntry> => {
      throw new ApiError(400, { error: 'Session revoke is not on the UniFa API.' })
    },
  })

export const useSendPasswordReset = (_userId: string) =>
  useMutation({
    mutationFn: async (): Promise<AuditEntry> => {
      throw new ApiError(400, { error: 'Password reset email is not on the UniFa API.' })
    },
  })

export type AdmissionFilters = { q: string; status: string; page: number }

export const useAdmissions = (f: AdmissionFilters) =>
  useQuery({
    queryKey: ['admin', 'admissions', f.q, f.status, f.page],
    queryFn: async (): Promise<AdmissionsResponse> => ({
      metrics: [{ label: 'Applications', value: '0', tone: 'brand' }],
      programmes: [],
      count: 0,
      next: null,
      previous: null,
      results: [],
    }),
  })

export const useApplicationDetail = (id: string) =>
  useQuery({
    queryKey: ['admin', 'admissions', id],
    queryFn: async (): Promise<ApplicationDetailResponse> => {
      throw new ApiError(404, { error: 'Admissions are not on the UniFa API yet.' })
    },
  })

export const useDecideApplication = (_id: string) =>
  useMutation({
    mutationFn: async (_vars: DecideApplicationRequest): Promise<DecideApplicationResult> => {
      throw new ApiError(400, { error: 'Admissions are not on the UniFa API yet.' })
    },
  })

export const useExamHub = () =>
  useQuery({
    queryKey: ['admin', 'exams'],
    queryFn: async (): Promise<ExamHubResponse> => {
      const exams = await apiFetch<UnifaExam[]>('/api/v1/exams')
      return {
        metrics: [{ label: 'Exams', value: String(exams.length), tone: 'brand' }],
        ongoing: exams.flatMap((e) =>
          e.schedules.map((s) => ({
            id: s.id,
            title: e.title,
            venue: s.room ?? 'TBA',
            startsAt: s.startsAt,
          })),
        ),
        log: [],
      }
    },
  })

const SCHEDULE_KEY = ['admin', 'exams', 'schedule']

export const useExamSchedule = () =>
  useQuery({
    queryKey: SCHEDULE_KEY,
    queryFn: async (): Promise<ExamScheduleResponse> => {
      const exams = await apiFetch<UnifaExam[]>('/api/v1/exams')
      return {
        metrics: [{ label: 'Slots', value: String(exams.length), tone: 'brand' }],
        halls: [],
        proctors: [],
        slots: exams.flatMap((e) =>
          e.schedules.map((s) => ({
            id: s.id,
            course: e.course,
            startsAt: s.startsAt,
            endsAt: s.startsAt,
            hall: s.room ?? null,
            proctorName: null,
            state: (s.room ? 'CONFIRMED' : 'UNASSIGNED') as SlotState,
            conflictReason: null,
          })),
        ),
      }
    },
  })

export const useAssignSlot = (_slotId: string) =>
  useMutation({
    mutationFn: async (_vars: AssignSlotRequest): Promise<ExamScheduleResponse> => {
      throw new ApiError(400, { error: 'Assign halls with POST /api/v1/exams/:id/schedule.' })
    },
  })

export const useMarksEntry = () =>
  useQuery({
    queryKey: ['admin', 'exams', 'marks'],
    queryFn: async (): Promise<MarksEntryResponse> => ({
      course: { id: '', code: '—', title: 'Select an exam', credits: 0 },
      sectionName: '—',
      assessment: { id: '', label: '—', maxPoints: 100, weightPercent: 100 },
      rows: [],
      editable: false,
      status: 'DRAFT',
      insight: 'Enter marks with POST /api/v1/exams/:id/results, then approve them.',
    }),
  })

export const useSaveMarks = () =>
  useMutation({
    mutationFn: async (_vars: SaveMarksRequest): Promise<SaveMarksResult> => {
      throw new ApiError(400, { error: 'Enter marks with POST /api/v1/exams/:id/results.' })
    },
  })

export const usePublishMarks = () =>
  useMutation({
    mutationFn: async (vars: PublishMarksRequest): Promise<PublishMarksResult> => {
      await apiFetch(`/api/v1/exams/results/${vars.sectionId}/approve`, { method: 'POST' })
      return { publishedCount: 1, audit: { id: crypto.randomUUID(), action: 'publish', actorName: 'You', at: new Date().toISOString(), summary: 'Results approved' } }
    },
  })

export const useAdminFinance = () =>
  useQuery({
    queryKey: ['admin', 'finance'],
    queryFn: async (): Promise<AdminFinanceResponse> => {
      const [report, invoices] = await Promise.all([
        apiFetch<UnifaFinanceReport>('/api/v1/finance/reports'),
        apiFetch<UnifaInvoice[]>('/api/v1/finance/invoices').catch(() => []),
      ])
      return {
        currency: 'BDT',
        metrics: [
          { label: 'Collected', value: String(report.collected), tone: 'success' },
          { label: 'Outstanding', value: String(report.outstanding), tone: 'warning' },
        ],
        revenueBreakdown: report.methods.map((m, i) => ({
          id: m.gateway,
          label: m.gateway,
          percent: 0,
          amount: String(num(m._sum.amount)),
          tone: i === 0 ? 'brand' : 'accent',
        })),
        recentEntries: invoices.slice(0, 8).map((inv) => ({
          id: inv.id,
          title: inv.invoiceNo,
          party: inv.student?.user ? `${inv.student.user.firstName ?? ''} ${inv.student.user.lastName ?? ''}`.trim() : 'Student',
          amount: String(inv.total),
          inbound: inv.status === 'PAID',
          at: inv.dueDate,
          reference: inv.invoiceNo,
        })),
      }
    },
  })

export const useLedger = (direction: string) =>
  useQuery({
    queryKey: ['admin', 'finance', 'ledger', direction],
    queryFn: async (): Promise<Cursored<LedgerEntry>> => {
      const invoices = await apiFetch<UnifaInvoice[]>('/api/v1/finance/invoices')
      const results = invoices.map((inv) => ({
        id: inv.id,
        title: inv.invoiceNo,
        party: 'Student',
        amount: String(inv.total),
        inbound: inv.status === 'PAID',
        at: inv.dueDate,
        reference: inv.invoiceNo,
      }))
      return { nextCursor: null, results }
    },
  })

export { useAdminSettings, useSaveSettings, useSupport, useSystemHealth, useUpdateTicket } from './api-ops'

export type { UserRow }
