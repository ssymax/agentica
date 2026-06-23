import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { ChatInterface } from './components/ChatInterface'
import { TicketDashboard } from './components/TicketDashboard'
import { TicketLayout } from './components/TicketLayout'
import { TicketDetailRoute } from './components/TicketDetailRoute'
import type { ChatMessage, ChatSession, Ticket, TicketStatus, View } from './types'
import { makeSession } from './utils/session'

const firstSession = makeSession()

export function App() {
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([firstSession])
  const [activeSessionId, setActiveSessionId] = useState(firstSession.id)

  // Ticket state lifted here so sidebar and dashboard share it
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('open')
  const [ticketsLoading, setTicketsLoading] = useState(false)

  const currentView: View = location.pathname.startsWith('/tickets') ? 'tickets' : 'chat'

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
    if (currentView === 'tickets') void fetchTickets(statusFilter)
  }, [currentView, statusFilter, fetchTickets])

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
  }, [])

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id)
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
        activeView={currentView}
        darkMode={darkMode}
        onToggleDark={toggleDark}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={createSession}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        tickets={tickets}
        statusFilter={statusFilter}
        ticketsLoading={ticketsLoading}
        onFilterChange={setStatusFilter}
      />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <ChatInterface
                key={activeSession.id}
                initialMessages={activeSession.messages}
                onMessagesChange={handleMessagesChange}
              />
            }
          />
          <Route
            path="/tickets"
            element={
              <TicketLayout
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                statusFilter={statusFilter}
                ticketsLoading={ticketsLoading}
                onFilterChange={setStatusFilter}
              />
            }
          >
            <Route
              index
              element={
                <TicketDashboard
                  tickets={tickets}
                  selectedId={selectedTicketId}
                  statusFilter={statusFilter}
                  isLoading={ticketsLoading}
                  onSelect={setSelectedTicketId}
                  onFilterChange={setStatusFilter}
                />
              }
            />
            <Route path=":id" element={<TicketDetailRoute />} />
          </Route>
        </Routes>
      </main>
    </div>
  )
}
