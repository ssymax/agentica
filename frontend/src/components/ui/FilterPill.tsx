interface FilterPillProps {
  active: boolean
  onClick: () => void
  label: string
  size?: 'sm' | 'md'
}

export function FilterPill({ active, onClick, label, size = 'md' }: FilterPillProps) {
  const padding = size === 'sm' ? 'px-2.5 py-0.5' : 'px-3 py-1'
  return (
    <button
      onClick={onClick}
      className={`rounded-full ${padding} text-xs font-medium transition-colors ${
        active
          ? 'bg-accent text-accent-foreground'
          : 'bg-background-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}
