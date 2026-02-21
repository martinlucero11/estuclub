/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  devIndicators: {
    allowedDevOrigins: ["https://*.cloudworkstations.dev"],
  },
};

module.exports = nextConfig;
