import type { ReactNode } from 'react';

export function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      {children}
    </div>
  );
}
