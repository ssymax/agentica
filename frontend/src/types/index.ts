export type TicketStatus = 'open' | 'in_progress' | 'resolved'

export interface Ticket {
  id: number
  title: string
  description: string
  status: TicketStatus
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  stoppedByUser?: boolean
  error?: string
}

export type View = 'chat' | 'tickets'

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}
