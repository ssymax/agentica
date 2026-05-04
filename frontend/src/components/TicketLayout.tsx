import { Outlet } from 'react-router-dom'
import type { Ticket, TicketStatus } from '../types'

interface TicketLayoutProps {
  tickets: Ticket[]
  selectedTicketId: number | null
  statusFilter: TicketStatus | 'all'
  ticketsLoading: boolean
  onFilterChange: (filter: TicketStatus | 'all') => void
}

export function TicketLayout({
  tickets,
  selectedTicketId,
  statusFilter,
  ticketsLoading,
  onFilterChange,
}: TicketLayoutProps) {
  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 overflow-hidden">
        <Outlet context={{ tickets, selectedTicketId, statusFilter, ticketsLoading, onFilterChange }} />
      </div>
    </div>
  )
}
