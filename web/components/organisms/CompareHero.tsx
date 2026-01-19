'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../atoms';

export function CompareHero() {
  const router = useRouter();
  const [value, setValue] = useState('');

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
      <h1 className="text-2xl font-semibold text-text-primary">Compare Celebrities</h1>
      <p className="mt-2 text-sm text-text-secondary">Enter 2-5 slugs separated by commas (e.g., elon-musk,jeff-bezos).</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="flex-1 rounded-md border border-surface-border px-4 py-2 text-sm"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="elon-musk, jeff-bezos"
        />
        <Button
          onClick={() => {
            const ids = value.split(',').map((v) => v.trim()).filter(Boolean);
            if (ids.length < 2) return;
            const sorted = [...ids].sort();
            router.push(`/compare/${sorted.join('-vs-')}`);
          }}
        >
          Compare
        </Button>
      </div>
    </div>
  );
}
