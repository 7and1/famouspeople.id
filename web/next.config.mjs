/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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

export default nextConfig;
