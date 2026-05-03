import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatInterface } from './components/ChatInterface'
import { TicketDashboard } from './components/TicketDashboard'
import type { ChatMessage, ChatSession, Ticket, TicketStatus, View } from './types'

function makeId() {
  return Math.random().toString(36).slice(2)
}

function makeSession(): ChatSession {
  return { id: makeId(), title: 'New Chat', messages: [], createdAt: new Date().toISOString() }
}

const firstSession = makeSession()

export function App() {
  const [view, setView] = useState<View>('chat')
  const [darkMode, setDarkMode] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([firstSession])
  const [activeSessionId, setActiveSessionId] = useState(firstSession.id)

  // Ticket state lifted here so sidebar and dashboard share it
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('open')
  const [ticketsLoading, setTicketsLoading] = useState(false)

  const fetchTickets = useCallback(async (filter: TicketStatus | 'all') => {
    setTicketsLoading(true)
    try {
      const url = filter === 'all' ? '/api/tickets' : `/api/tickets?status=${filter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Ticket[]
      setTickets(data)
      setSelectedTicketId((prev) => {
        if (prev && data.find((t) => t.id === prev)) return prev
        return data[0]?.id ?? null
      })
    } finally {
      setTicketsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'tickets') void fetchTickets(statusFilter)
  }, [view, statusFilter, fetchTickets])

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0]

  const toggleDark = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  const createSession = useCallback(() => {
    const s = makeSession()
    setSessions((prev) => [s, ...prev])
    setActiveSessionId(s.id)
    setView('chat')
  }, [])

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id)
    setView('chat')
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id)
      if (remaining.length > 0) {
        if (id === activeSessionId) {
          setActiveSessionId(remaining[0].id)
        }
        return remaining
      }

      const next = makeSession()
      setActiveSessionId(next.id)
      return [next]
    })
    setView('chat')
  }, [activeSessionId])

  const handleMessagesChange = useCallback((messages: ChatMessage[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s
        const firstUser = messages.find((m) => m.role === 'user')
        const title = firstUser
          ? firstUser.content.slice(0, 38) + (firstUser.content.length > 38 ? '…' : '')
          : s.title
        return { ...s, title, messages }
      }),
    )
  }, [activeSessionId])

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        activeView={view}
        onViewChange={setView}
        darkMode={darkMode}
        onToggleDark={toggleDark}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={createSession}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        tickets={tickets}
        selectedTicketId={selectedTicketId}
        statusFilter={statusFilter}
        ticketsLoading={ticketsLoading}
        onSelectTicket={setSelectedTicketId}
        onFilterChange={setStatusFilter}
      />
      <main className="flex-1 overflow-hidden">
        {view === 'chat' ? (
          <ChatInterface
            key={activeSession.id}
            initialMessages={activeSession.messages}
            onMessagesChange={handleMessagesChange}
          />
        ) : (
          <TicketDashboard
            tickets={tickets}
            selectedId={selectedTicketId}
            statusFilter={statusFilter}
            isLoading={ticketsLoading}
            onSelect={setSelectedTicketId}
            onFilterChange={setStatusFilter}
          />
        )}
      </main>
    </div>
  )
}
