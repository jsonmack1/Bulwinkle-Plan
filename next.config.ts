import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@anthropic-ai/sdk', 'katex'],
  },
  
  // Optimize bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure splitChunks is properly configured
      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {};
      }
      if (!config.optimization.splitChunks.cacheGroups) {
        config.optimization.splitChunks.cacheGroups = {};
      }
      
      // Reduce bundle size by splitting vendor chunks
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        katex: {
          test: /[\\/]node_modules[\\/]katex[\\/]/,
          name: 'katex',
          chunks: 'all',
          priority: 20,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
        },
      };
    }
    return config;
  },

  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // SWC minification is enabled by default in Next.js 13+
  
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
