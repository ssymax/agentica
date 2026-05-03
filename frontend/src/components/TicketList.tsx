import type { Ticket, TicketStatus } from '../types'
import { FilterPill } from './ui/FilterPill'
import { TicketRow } from './TicketRow'
import { LoadingSkeleton } from './LoadingSkeleton'

interface TicketListProps {
  tickets: Ticket[]
  selectedId: number | null
  statusFilter: TicketStatus | 'all'
  onSelect: (ticket: Ticket) => void
  onFilterChange: (filter: TicketStatus | 'all') => void
  isLoading: boolean
}

const FILTERS: Array<{ value: TicketStatus | 'all'; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

export function TicketList({
  tickets,
  selectedId,
  statusFilter,
  onSelect,
  onFilterChange,
  isLoading,
}: TicketListProps) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-background-subtle">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="font-serif text-lg text-foreground mb-3">Tickets</h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <FilterPill
              key={f.value}
              active={statusFilter === f.value}
              onClick={() => onFilterChange(f.value)}
              label={f.label}
            />
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : tickets.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No tickets match this filter.
          </p>
        ) : (
          tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              isSelected={ticket.id === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
