import type { ReactNode } from 'react';

interface NavItemProps {
  active: boolean;
  icon: ReactNode;
  label: string;
}

export function NavItem({ active, icon, label }: NavItemProps) {
  return (
    <div
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-accent-light text-accent font-medium ring-1 ring-accent-border'
          : 'text-muted-foreground hover:bg-background-muted hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </div>
  );
}
