import { memo } from 'react';
import { User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';
import { StreamingCursor } from './ui/StreamingCursor';
import { ThinkingIndicator } from './ThinkingIndicator';

export const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-xl bg-muted/30 px-4 py-3 text-sm text-foreground border border-border/20">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <User className="h-3 w-3" />
            <span>You</span>
          </div>
          <p className="leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="w-full text-sm text-foreground">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Assistant</span>
        </div>
        {message.error ? (
          <p className="text-destructive">{message.error}</p>
        ) : (
          <div className="prose text-sm">
            {message.isStreaming && !message.content ? (
              <ThinkingIndicator />
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && <StreamingCursor />}
              </>
            )}
            {message.stoppedByUser && !message.isStreaming && (
              <p className="mt-2 text-xs italic text-muted-foreground">
                — Stopped by you
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
