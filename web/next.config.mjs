import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.famouspeople.id' },
      { protocol: 'https', hostname: 'images.famouspeople.id' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['famouspeople.id', 'www.famouspeople.id'] },
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);
