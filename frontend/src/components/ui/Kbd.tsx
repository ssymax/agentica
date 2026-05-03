export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-background-subtle px-1 py-0.5 font-mono text-[10px] leading-none text-muted-foreground">
      {children}
    </kbd>
  )
}
