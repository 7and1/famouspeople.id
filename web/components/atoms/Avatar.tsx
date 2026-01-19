import Image from 'next/image';
import clsx from 'clsx';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes: Record<string, number> = {
  xs: 28,
  sm: 40,
  md: 64,
  lg: 96,
  xl: 140,
};

export function Avatar({ src, alt = '', size = 'md', className }: AvatarProps) {
  const dimension = sizes[size];
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-subtle text-text-muted',
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      {src ? (
        <Image src={src} alt={alt} width={dimension} height={dimension} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-semibold">FP</span>
      )}
    </div>
  );
}
