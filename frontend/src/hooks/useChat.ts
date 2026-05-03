import { useCallback, useEffect, useRef, useState } from 'react'
import { useSSE } from './useSSE'
import type { ChatMessage } from '../types'

function makeId() {
  return crypto.randomUUID()
}

interface UseChatOptions {
  initialMessages: ChatMessage[]
  onMessagesChange: (messages: ChatMessage[]) => void
}

export function useChat({ initialMessages, onMessagesChange }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const activeAssistantIdRef = useRef<string | null>(null)

  useEffect(() => {
    onMessagesChange(messages)
  }, [messages, onMessagesChange])

  const handleToken = useCallback((token: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === activeAssistantIdRef.current ? { ...m, content: m.content + token } : m,
      ),
    )
  }, [])

  const handleDone = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === activeAssistantIdRef.current ? { ...m, isStreaming: false } : m,
      ),
    )
    activeAssistantIdRef.current = null
  }, [])

  const handleError = useCallback((message: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === activeAssistantIdRef.current
          ? { ...m, isStreaming: false, error: message || 'Streaming failed' }
          : m,
      ),
    )
    activeAssistantIdRef.current = null
  }, [])

  const { start, stop: sseStop, isStreaming } = useSSE({
    onToken: handleToken,
    onDone: handleDone,
    onError: handleError,
  })

  const stop = useCallback(() => {
    if (activeAssistantIdRef.current) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === activeAssistantIdRef.current
            ? { ...m, isStreaming: false, stoppedByUser: true }
            : m,
        ),
      )
      activeAssistantIdRef.current = null
    }
    sseStop()
  }, [sseStop])

  const sendMessage = useCallback(async () => {
    const content = draft.trim()
    if (!content || isStreaming) return

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content }
    const assistantMessage: ChatMessage = {
      id: makeId(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    }

    activeAssistantIdRef.current = assistantMessage.id
    const nextMessages = [...messages, userMessage, assistantMessage]
    setDraft('')
    setMessages(nextMessages)

    await start('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: nextMessages
          .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    })
  }, [draft, isStreaming, messages, start])

  return {
    messages,
    draft,
    setDraft,
    sendMessage,
    stop,
    isStreaming,
  }
}
