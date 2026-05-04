import type { ChatSession } from '../types'

export function makeId(): string {
  return Math.random().toString(36).slice(2)
}

export function makeSession(): ChatSession {
  return { id: makeId(), title: 'New Chat', messages: [], createdAt: new Date().toISOString() }
}
