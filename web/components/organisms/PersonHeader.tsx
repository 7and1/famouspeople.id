import { Avatar } from '../atoms';
import { SocialLinks } from '../molecules';

interface PersonHeaderProps {
  name: string;
  imageUrl?: string | null;
  occupation?: string[];
  country?: string[];
  socialLinks?: Record<string, string | null>;
}

export function PersonHeader({ name, imageUrl, occupation = [], country = [], socialLinks = {} }: PersonHeaderProps) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-surface-border bg-white p-6 shadow-card md:flex-row md:items-center">
      <Avatar src={imageUrl} alt={name} size="xl" />
      <div className="flex-1">
        <h1 className="text-3xl font-semibold text-text-primary">{name}</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {occupation.slice(0, 3).join(', ') || '—'}
          {country.length ? ` · ${country.join(', ')}` : ''}
        </p>
        <div className="mt-4">
          <SocialLinks links={socialLinks} />
        </div>
      </div>
    </section>
  );
}
