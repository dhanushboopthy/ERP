/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    // Allow images from any domain in production (Railway backend, etc.)
    unoptimized: true,
  },
  // Optimize navigation performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Improve client-side navigation
  swcMinify: true,
  async rewrites() {
    // Only proxy /api/* to local backend in development.
    // In production the browser calls NEXT_PUBLIC_API_URL directly.
    if (process.env.NODE_ENV === 'production') return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
