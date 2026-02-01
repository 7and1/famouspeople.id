import { Metadata } from 'next';
import { CompareHero } from '../../components/organisms/CompareHero';
import { ComparisonLayout } from '../../components/templates';

export const metadata: Metadata = {
  title: 'Compare Celebrities | Net Worth, Height, Age | FamousPeople.id',
  description: 'Compare celebrities side by side. Compare net worth, height, age, zodiac signs, and more between your favorite famous people on FamousPeople.id.',
  alternates: { canonical: '/compare' },
  openGraph: {
    title: 'Compare Celebrities | Net Worth, Height, Age | FamousPeople.id',
    description: 'Compare celebrities side by side. Compare net worth, height, age, zodiac signs, and more between your favorite famous people.',
  },
};

export default function CompareLanding() {
  return (
    <ComparisonLayout>
      <CompareHero />
    </ComparisonLayout>
  );
}
