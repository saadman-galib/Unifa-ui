import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/hooks/use-api'
import { mapAdvisor, mapAiOverview, mapAskToMessage, mapConversation, mapRecommendations } from '@/lib/unifa'
import type {
  AiAdvisorResponse,
  AiConversationResponse,
  AiMessage,
  AiOverviewResponse,
  AssignmentHelperRequest,
  AssignmentHelperResponse,
  GenerateNoteRequest,
  GenerateQuizRequest,
  GeneratedNoteResponse,
  GeneratedQuizResponse,
  QuizGeneratorOptionsResponse,
  RecommendationsResponse,
  StudyPlanResponse,
  StudyPlannerOptionsResponse,
  StudyPlannerRequest,
} from '@/types'
import type {
  UnifaAskResponse,
  UnifaConversation,
  UnifaCourse,
  UnifaExam,
  UnifaStudentDashboard,
} from '@/types/unifa'

export const useAiOverview = () =>
  useQuery({
    queryKey: ['ai', 'overview'],
    queryFn: async (): Promise<AiOverviewResponse> =>
      mapAiOverview(await apiFetch<UnifaConversation[]>('/api/v1/ai/conversations')),
  })

export const useAdvisor = () =>
  useQuery({
    queryKey: ['ai', 'advisor'],
    queryFn: async (): Promise<AiAdvisorResponse> =>
      mapAdvisor(await apiFetch<UnifaStudentDashboard>('/api/v1/dashboard/student')),
  })

export const useRecommendations = () =>
  useQuery({
    queryKey: ['ai', 'recommendations'],
    queryFn: async (): Promise<RecommendationsResponse> =>
      mapRecommendations(await apiFetch<UnifaCourse[]>('/api/v1/academic/courses')),
  })

export const useConversation = (id: string) =>
  useQuery({
    queryKey: ['ai', 'conversation', id],
    queryFn: async (): Promise<AiConversationResponse> => {
      const all = await apiFetch<UnifaConversation[]>('/api/v1/ai/conversations')
      const found = all.find((c) => c.id === id)
      if (found) return mapConversation(found)
      return { id, title: 'New conversation', messages: [] }
    },
  })

export function useAiStream(conversationId: string) {
  const queryClient = useQueryClient()
  const [appended, setAppended] = useState<AiMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState(conversationId)

  async function send(text: string) {
    const mine: AiMessage = {
      id: `tmp-${crypto.randomUUID()}`,
      from: 'me',
      text,
      createdAt: new Date().toISOString(),
    }
    setAppended((prev) => [...prev, mine])
    setStreaming(true)
    setError(null)
    try {
      const res = await apiFetch<UnifaAskResponse>('/api/v1/ai/ask', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          conversationId: activeId || null,
          title: text.slice(0, 80),
        }),
      })
      setActiveId(res.conversationId)
      const mapped = mapAskToMessage(res)
      setAppended((prev) => [...prev, mapped.message])
      void queryClient.invalidateQueries({ queryKey: ['ai'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The assistant is unavailable.')
    } finally {
      setStreaming(false)
    }
  }

  return { appended, streaming, error, send, conversationId: activeId }
}

async function ask(message: string, title: string) {
  const res = await apiFetch<UnifaAskResponse>('/api/v1/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ message, conversationId: null, title }),
  })
  return res.message.content
}

export const useStudyPlannerOptions = () =>
  useQuery({
    queryKey: ['ai', 'study-planner', 'options'],
    queryFn: async (): Promise<StudyPlannerOptionsResponse> => {
      const exams = await apiFetch<UnifaExam[]>('/api/v1/exams').catch(() => [])
      return {
        exams: exams.map((e) => ({
          id: e.id,
          label: e.title,
          startsAt: e.schedules[0]?.startsAt ?? new Date().toISOString(),
        })),
        targetGrades: ['A+', 'A', 'B+', 'B'],
        dailyHourChoices: [1, 2, 3, 4],
      }
    },
  })

export const useGenerateStudyPlan = () =>
  useMutation({
    mutationFn: async (vars: StudyPlannerRequest): Promise<StudyPlanResponse> => {
      await ask(
        `Create a study plan for exam ${vars.examId}, target ${vars.targetGrade}, ${vars.dailyHours} hours/day.`,
        'Study plan',
      )
      const start = new Date()
      return {
        id: crypto.randomUUID(),
        nextExamAt: start.toISOString(),
        days: [
          {
            date: start.toISOString().slice(0, 10),
            topic: 'Review core topics',
            blocks: [{ startsAt: '09:00', durationMinutes: vars.dailyHours * 60, note: 'Generated from UniFa AI.' }],
          },
        ],
      }
    },
  })

export const useGenerateNote = () =>
  useMutation({
    mutationFn: async (vars: GenerateNoteRequest): Promise<GeneratedNoteResponse> => {
      const intro = await ask(`Write study notes on: ${vars.topic}. Depth: ${vars.depth}.`, 'Notes')
      return {
        id: crypto.randomUUID(),
        title: vars.topic,
        tableOfContents: [vars.topic],
        intro,
        keyFacts: [],
        generatedAt: new Date().toISOString(),
      }
    },
  })

export const useQuizGeneratorOptions = () =>
  useQuery({
    queryKey: ['ai', 'quiz', 'options'],
    queryFn: async (): Promise<QuizGeneratorOptionsResponse> => ({
      courses: [],
      questionCounts: [5, 10, 15],
      types: [{ id: 'MCQ', label: 'Multiple choice' }],
      difficulties: [
        { id: 'EASY', label: 'Easy' },
        { id: 'MEDIUM', label: 'Medium' },
        { id: 'HARD', label: 'Hard' },
      ],
      focus: null,
    }),
  })

export const useGenerateQuiz = () =>
  useMutation({
    mutationFn: async (vars: GenerateQuizRequest): Promise<GeneratedQuizResponse> => {
      const insight = await ask(`Generate a quiz: ${JSON.stringify(vars)}`, 'Quiz')
      return { id: crypto.randomUUID(), questions: [], insight }
    },
  })

export const useAssignmentHelper = () =>
  useMutation({
    mutationFn: async (vars: AssignmentHelperRequest): Promise<AssignmentHelperResponse> => {
      const rewrittenDraft = await ask(
        `Help with this assignment draft:\n${vars.draft}`,
        'Assignment helper',
      )
      return { outline: ['Review the brief', 'Draft', 'Cite sources'], rewrittenDraft, suggestions: [] }
    },
  })
