import { ClipboardList } from 'lucide-react';

export function EmptyDetail() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-background-subtle border border-border mb-4">
          <ClipboardList className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Select a ticket to view details</p>
      </div>
    </div>
  );
}
