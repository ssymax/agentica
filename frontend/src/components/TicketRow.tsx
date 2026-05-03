import { memo } from 'react';
import type { Ticket } from '../types';

export const TicketRow = memo(function TicketRow({
  ticket,
  isSelected,
  onSelect,
}: {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: (ticket: Ticket) => void;
}) {
  const date = new Date(ticket.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <button
      onClick={() => onSelect(ticket)}
      className={`w-full text-left border-b border-border-light px-4 py-3 transition-colors ${
        isSelected
          ? 'bg-accent-light border-l-2 border-l-accent'
          : 'hover:bg-background-muted'
      }`}
    >
      <p className={`text-sm font-medium leading-snug line-clamp-2 mb-1.5 ${isSelected ? 'text-accent' : 'text-foreground'}`}>
        {ticket.title}
      </p>
      <p className="text-xs text-muted-foreground">#{ticket.id} · {date}</p>
    </button>
  );
});
