'use client';

import { useEffect, useId, useState } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import clsx from 'clsx';

interface SearchBoxProps {
  value?: string;
  placeholder?: string;
  variant?: 'default' | 'hero';
  onSubmit?: (value: string) => void;
}

export function SearchBox({ value = '', placeholder = 'Search for a celebrity...', variant = 'default', onSubmit }: SearchBoxProps) {
  const [query, setQuery] = useState(value);
  const inputId = useId();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <form
      className={clsx(
        'flex w-full items-center gap-2 rounded-xl border border-surface-border bg-white p-2 shadow-card',
        variant === 'hero' && 'p-3'
      )}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(query.trim());
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search
      </label>
      <Input
        id={inputId}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={clsx('border-0 shadow-none focus:ring-0', variant === 'hero' && 'text-base')}
      />
      <Button type="submit" variant="primary" size={variant === 'hero' ? 'lg' : 'md'}>
        Search
      </Button>
    </form>
  );
}
