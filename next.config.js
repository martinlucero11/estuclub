/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporary change to invalidate build cache
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
