import { useCallback, useRef, useState } from 'react'

interface UseSSEOptions {
  onToken: (token: string) => void
  onDone: () => void
  onError: (message: string) => void
}

const TYPEWRITER_DELAY_MS = 14

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function emitSmoothly(
  content: string,
  signal: AbortSignal,
  onToken: (token: string) => void,
) {
  for (const character of content) {
    if (signal.aborted) return
    onToken(character)
    await wait(TYPEWRITER_DELAY_MS)
  }
}

async function processLine(
  line: string,
  signal: AbortSignal,
  onToken: (token: string) => void,
  onError: (message: string) => void,
): Promise<'done' | 'error' | null> {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data: ')) return null

  const data = trimmed.slice(6)
  if (data === '[DONE]') return 'done'

  try {
    const parsed = JSON.parse(data) as { content?: string; error?: string }
    if (parsed.error) {
      onError(parsed.error)
      return 'error'
    }
    if (parsed.content) {
      await emitSmoothly(parsed.content, signal, onToken)
    }
  } catch {
    // Malformed JSON in SSE line — skip
  }

  return null
}

export function useSSE({ onToken, onDone, onError }: UseSSEOptions) {
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(
    async (url: string, options?: RequestInit) => {
      // Cancel any in-flight request before starting a new one
      if (abortRef.current) {
        abortRef.current.abort()
      }

      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)

      try {
        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        if (!res.ok) {
          onError(`HTTP ${res.status}: ${res.statusText}`)
          return
        }

        if (!res.body) {
          onError('Response has no body')
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode the Uint8Array chunk into text, appending to buffer
          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE lines from the buffer
          const lines = buffer.split('\n')
          // Keep the last (possibly incomplete) line in the buffer
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const result = await processLine(line, controller.signal, onToken, onError)
            if (result === 'done') { onDone(); return }
            if (result === 'error') return
          }
        }

        // Flush remaining decoder bytes
        const remaining = decoder.decode()
        if (remaining) {
          for (const line of remaining.split('\n')) {
            const result = await processLine(line, controller.signal, onToken, onError)
            if (result === 'done' || result === 'error') break
          }
        }

        onDone()
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          onError(err instanceof Error ? err.message : 'Unknown streaming error')
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [onToken, onDone, onError],
  )

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsStreaming(false)
  }, [])

  return { start, stop, isStreaming }
}
