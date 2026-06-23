import { MessageCircle, ClipboardList, Plus, Trash2, Sun, Moon, HeadsetIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { ChatSession, Ticket, TicketStatus, View } from '../types'
import { FilterPill } from './ui/FilterPill'
import { NavItem } from './NavItem'

interface SidebarProps {
  activeView: View
  darkMode: boolean
  onToggleDark: () => void
  // chat
  sessions: ChatSession[]
  activeSessionId: string
  onNewSession: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  // tickets
  tickets: Ticket[]
  statusFilter: TicketStatus | 'all'
  ticketsLoading: boolean
  onFilterChange: (filter: TicketStatus | 'all') => void
}

const STATUS_FILTERS: Array<{ value: TicketStatus | 'all'; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

export function Sidebar({
  activeView,
  darkMode,
  onToggleDark,
  sessions,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  tickets,
  statusFilter,
  ticketsLoading,
  onFilterChange,
}: SidebarProps) {
  const location = useLocation()
  const urlTicketId = location.pathname.match(/\/tickets\/(\d+)/)?.[1]
  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-background-subtle">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
          <HeadsetIcon className="h-4 w-4 text-accent-foreground" />
        </div>
        <h1 className="font-serif text-lg text-foreground">AI Help Desk</h1>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-4 pb-2 space-y-1">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Apps
        </p>

        <Link to="/">
          <NavItem
            active={activeView === 'chat'}
            icon={<MessageCircle className="h-4 w-4" />}
            label="Support Agent"
          />
        </Link>

        <Link to="/tickets">
          <NavItem
            active={activeView === 'tickets'}
            icon={<ClipboardList className="h-4 w-4" />}
            label="Ticket Dashboard"
          />
        </Link>
      </nav>

      {/* Context panel */}
      <div className="flex flex-col flex-1 overflow-hidden px-3 pb-2">
        {activeView === 'chat' ? (
          <>
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conversations
              </p>
              <button
                onClick={onNewSession}
                title="New chat"
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-background-muted hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId
                return (
                  <div
                    key={session.id}
                    className={`group flex items-center rounded-md transition-colors ${
                      isActive
                        ? 'bg-accent-light text-accent ring-1 ring-accent-border'
                        : 'text-muted-foreground hover:bg-background-muted hover:text-foreground'
                    }`}
                  >
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${
                        isActive ? 'font-medium' : ''
                      }`}
                    >
                      {session.title}
                    </button>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      title="Delete chat"
                      aria-label={`Delete ${session.title}`}
                      className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div className="px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Filter
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((f) => (
                  <FilterPill
                    key={f.value}
                    active={statusFilter === f.value}
                    onClick={() => onFilterChange(f.value)}
                    label={f.label}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            <div className="px-3 pt-3 pb-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tickets
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5">
              {ticketsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-3 py-2 animate-pulse">
                    <div className="h-3 w-full rounded bg-muted mb-1.5" />
                    <div className="h-2.5 w-20 rounded bg-muted" />
                  </div>
                ))
              ) : tickets.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground">No tickets.</p>
              ) : (
                tickets.map((ticket) => {
                  const isActive = String(ticket.id) === urlTicketId
                  return (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className={`block rounded-md px-3 py-2 text-left transition-colors ${
                        isActive
                          ? 'bg-accent-light text-accent ring-1 ring-accent-border'
                          : 'text-muted-foreground hover:bg-background-muted hover:text-foreground'
                      }`}
                    >
                      <p className={`text-sm leading-snug line-clamp-2 ${isActive ? 'font-medium' : ''}`}>
                        {ticket.title}
                      </p>
                      <p className="mt-0.5 text-xs opacity-60">
                        #{ticket.id} · {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </Link>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer: dark mode toggle */}
      <div className="border-t border-border px-5 py-4">
        <button
          onClick={onToggleDark}
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-background-muted hover:text-foreground transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <>
              <Sun className="h-4 w-4" />
              Light mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              Dark mode
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
