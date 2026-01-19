interface ItemListSchemaProps {
  items: Array<{
    slug: string;
    full_name: string;
    image_url?: string | null;
  }>;
  offset?: number;
  siteUrl?: string;
}

export function ItemListSchema({ items, offset = 0, siteUrl = 'https://famouspeople.id' }: ItemListSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((person, index) => ({
      '@type': 'ListItem',
      position: offset + index + 1,
      item: {
        '@type': 'Person',
        name: person.full_name,
        url: `${siteUrl}/people/${person.slug}`,
        ...(person.image_url && { image: person.image_url }),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
