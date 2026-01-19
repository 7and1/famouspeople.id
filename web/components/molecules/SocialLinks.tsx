import { Instagram, Youtube, Twitter } from 'lucide-react';

interface SocialLinksProps {
  links: Record<string, string | null | undefined>;
}

const iconMap: Record<string, any> = {
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  youtube: Youtube,
};

export function SocialLinks({ links }: SocialLinksProps) {
  const entries = Object.entries(links || {}).filter(([, value]) => value);
  if (!entries.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => {
        const Icon = iconMap[key] || null;
        const url = value?.startsWith('http') ? value : `https://${key}.com/${value}`;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-surface-border px-3 py-1 text-xs text-text-secondary hover:text-brand-700"
          >
            {Icon ? <Icon size={14} /> : null}
            {key}
          </a>
        );
      })}
    </div>
  );
}
