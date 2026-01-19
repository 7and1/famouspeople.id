import type { ReactNode } from 'react';

export function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-10">
      {children}
    </div>
  );
}
