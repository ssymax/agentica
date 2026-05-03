import { AlertCircle } from 'lucide-react'

interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-3 text-destructive-foreground shadow-lg animate-in slide-in-from-bottom-2 text-sm max-w-sm">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
