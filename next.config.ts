import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
};

export default nextConfig;
