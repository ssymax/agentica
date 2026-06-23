import { useParams } from 'react-router-dom'
import { TicketDetail } from './TicketDetail'
import { EmptyDetail } from './EmptyDetail'

export function TicketDetailRoute() {
  const { id } = useParams<{ id: string }>()
  const ticketId = id ? Number(id) : null
  return ticketId ? <TicketDetail ticketId={ticketId} /> : <EmptyDetail />
}
