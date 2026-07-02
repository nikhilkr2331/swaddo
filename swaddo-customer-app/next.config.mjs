/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Disabled for Vercel deployment
  images: {
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
