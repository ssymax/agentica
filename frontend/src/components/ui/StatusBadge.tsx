import type { TicketStatus } from '../../types'

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string; dot: string }> = {
  open: {
    label: 'Open',
    className: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
    dot: 'bg-destructive',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-accent-light text-accent ring-1 ring-accent-border',
    dot: 'bg-accent',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-muted text-muted-foreground ring-1 ring-border',
    dot: 'bg-muted-foreground',
  },
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
