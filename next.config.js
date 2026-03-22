/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: ["https://*.cloudworkstations.dev"],
  },
  transpilePackages: ['react-leaflet', 'leaflet'],
};
module.exports = nextConfig;
