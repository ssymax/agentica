import { useCallback, useEffect, useRef, useState } from 'react'
import { Square, Loader2, Zap, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSSE } from '../hooks/useSSE'
import type { Ticket } from '../types'
import { StatusBadge } from './ui/StatusBadge'
import { StreamingCursor } from './ui/StreamingCursor'

interface TicketDetailProps {
  ticketId: number
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoadingTicket, setIsLoadingTicket] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [summary, setSummary] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoadingTicket(true)
    setFetchError('')
    setTicket(null)
    setSummary('')
    setSummaryError('')

    fetch(`/api/tickets/${ticketId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<Ticket>
      })
      .then((data) => {
        if (!cancelled) setTicket(data)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setFetchError(err instanceof Error ? err.message : 'Failed to load ticket')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTicket(false)
      })

    return () => {
      cancelled = true
    }
  }, [ticketId])

  const handleToken = useCallback((token: string) => {
    setSummary((prev) => prev + token)
    summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])

  const handleDone = useCallback(() => {}, [])

  const handleError = useCallback((msg: string) => {
    setSummaryError(`Failed to generate summary: ${msg}`)
  }, [])

  const { start, stop, isStreaming } = useSSE({
    onToken: handleToken,
    onDone: handleDone,
    onError: handleError,
  })

  const generateSummary = useCallback(async () => {
    setSummary('')
    setSummaryError('')
    await start(`/api/tickets/${ticketId}/summary`)
  }, [ticketId, start])

  if (isLoadingTicket) {
    return (
      <div className="h-full overflow-y-auto px-8 py-6">
        <div className="mb-6 animate-pulse">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="h-8 w-72 rounded-lg bg-muted" />
            <div className="h-7 w-24 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="mb-8">
          <div className="h-5 w-28 rounded bg-muted mb-3" />
          <div className="rounded-xl bg-background-subtle border border-border p-5 space-y-2">
            <div className="h-3.5 w-full rounded bg-muted" />
            <div className="h-3.5 w-5/6 rounded bg-muted" />
            <div className="h-3.5 w-4/6 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (fetchError || !ticket) {
    return (
      <div className="flex h-full items-center justify-center px-8">
        <div className="text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-destructive/10 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Failed to load ticket</p>
          <p className="text-xs text-muted-foreground">{fetchError}</p>
        </div>
      </div>
    )
  }

  const date = new Date(ticket.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      {/* Ticket header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="font-serif text-2xl text-foreground leading-snug">{ticket.title}</h2>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Ticket #{ticket.id}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
      </div>

      {/* Description */}
      <section className="mb-8">
        <h3 className="font-serif text-lg text-foreground mb-3">Description</h3>
        <div className="rounded-xl bg-background-subtle border border-border p-5">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>
      </section>

      {/* AI Summary */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg text-foreground">AI Summary</h3>
          <div className="flex gap-2">
            {isStreaming && (
              <button
                onClick={stop}
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Square className="h-3.5 w-3.5" fill="currentColor" />
                Stop
              </button>
            )}
            <button
              onClick={() => void generateSummary()}
              disabled={isStreaming}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  {summary ? 'Regenerate' : 'Generate Summary'}
                </>
              )}
            </button>
          </div>
        </div>

        {summaryError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            ⚠ {summaryError}
          </div>
        )}

        {(summary || isStreaming) && !summaryError && (
          <div className="rounded-xl border border-accent-border bg-accent-light p-5">
            <div className="prose text-sm" ref={summaryRef}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              {isStreaming && <StreamingCursor />}
            </div>
          </div>
        )}

        {!summary && !isStreaming && !summaryError && (
          <div className="rounded-xl border border-border border-dashed bg-background-subtle px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Click <strong>Generate Summary</strong> to have the AI analyze this ticket.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
