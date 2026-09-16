import { useState, type FormEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from './card'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/hooks/use-api'
import type { UnifaAskResponse } from '@/types/unifa'

export type Assistant = {
  messages: { from: 'ai' | 'me'; text: string }[]
  suggestions?: string[]
  title?: string
}

export function AssistantPanel({
  messages,
  suggestions = [],
  title = 'Academic AI',
  onSend,
  pending = false,
}: Assistant & { onSend?: (text: string) => void; pending?: boolean }) {
  const [draft, setDraft] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !onSend || pending) return
    setDraft('')
    onSend(text)
  }

  return (
    <Card>
      <CardHeader title={title} icon={Sparkles}>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success-dot" aria-hidden />
          <span className="text-eyebrow uppercase text-fg-muted">Always Online</span>
        </span>
      </CardHeader>

      <CardBody className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <p
            key={i}
            className={
              m.from === 'ai'
                ? 'max-w-[85%] rounded-control bg-surface-subtle p-3 text-fg-body'
                : 'ml-auto max-w-[85%] rounded-control bg-brand-600/10 p-3 text-fg-heading'
            }
          >
            {m.text}
          </p>
        ))}

        {suggestions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSend?.(s)}
                className="rounded-full border border-border-strong px-3 py-1 text-link text-fg-body hover:bg-surface-subtle"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-2 flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Ask the assistant</span>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask anything…"
              className="h-10"
            />
          </label>
          <Button type="submit" size="icon-lg" aria-label="Send" disabled={pending || !draft.trim()}>
            <Send className="size-4" aria-hidden />
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

export function ConnectedAssistant({ context }: { context: string }) {
  const [messages, setMessages] = useState<{ from: 'ai' | 'me'; text: string }[]>([
    { from: 'ai', text: 'Ask me about your CGPA, attendance, courses, or unpaid invoices.' },
  ])
  const [pending, setPending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  async function onSend(text: string) {
    setMessages((prev) => [...prev, { from: 'me', text }])
    setPending(true)
    try {
      const res = await apiFetch<UnifaAskResponse>('/api/v1/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ message: text, conversationId, title: context }),
      })
      setConversationId(res.conversationId)
      setMessages((prev) => [...prev, { from: 'ai', text: res.message.content }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: 'ai', text: 'I could not reach the UniFa assistant just then. Try again in a moment.' },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <AssistantPanel
      title="Academic AI"
      messages={messages}
      suggestions={['What is my CGPA?', 'Which invoices are unpaid?']}
      onSend={onSend}
      pending={pending}
    />
  )
}
