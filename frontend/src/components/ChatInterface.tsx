import { SubmitEvent, useEffect, useRef } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types';
import { Kbd } from './ui/Kbd';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  initialMessages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}

export function ChatInterface({
  initialMessages,
  onMessagesChange,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const { messages, draft, setDraft, sendMessage, stop, isStreaming } = useChat(
    {
      initialMessages,
      onMessagesChange,
    },
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 64;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    isAtBottomRef.current = true;
    void sendMessage();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border px-8 py-5">
        <h2 className="font-serif text-2xl text-foreground">Support Agent</h2>
        <p className="text-sm text-muted-foreground">
          Got a question? I'm here to help — just type below and I'll get right
          on it.
        </p>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-8 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-serif text-xl text-foreground">
                How can I help you today?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask me anything — I'll stream a response back in real time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-background-subtle px-8 py-4"
      >
        <div className="rounded-xl border border-input bg-background ring-ring transition focus-within:ring-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            rows={3}
            placeholder="Ask something…"
            className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-foreground outline-none"
          />
          <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
            <span className="flex items-center gap-3 text-xs text-muted-foreground select-none">
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd>
                <span>Send</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd>⇧</Kbd>
                <Kbd>↵</Kbd>
                <span>New line</span>
              </span>
            </span>
            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                title="Stop generation"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
              >
                <Square className="h-3 w-3" fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim()}
                title="Send message"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
