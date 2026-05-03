import { TicketDetail } from './TicketDetail'
import { EmptyDetail } from './EmptyDetail'
import type { Ticket, TicketStatus } from '../types'

interface TicketDashboardProps {
  tickets: Ticket[]
  selectedId: number | null
  statusFilter: TicketStatus | 'all'
  isLoading: boolean
  onSelect: (id: number) => void
  onFilterChange: (filter: TicketStatus | 'all') => void
}

export function TicketDashboard({ selectedId }: TicketDashboardProps) {
  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 overflow-hidden">
        {selectedId != null ? (
          <TicketDetail key={selectedId} ticketId={selectedId} />
        ) : (
          <EmptyDetail />
        )}
      </div>
    </div>
  )
}
