import { Loader2 } from 'lucide-react';

export function ThinkingIndicator() {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span className="text-sm">Thinking...</span>
    </span>
  );
}
