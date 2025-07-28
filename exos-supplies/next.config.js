/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Firebase hosting
  output: 'export',
  trailingSlash: true,
  
  // Optimize images
  images: {
    unoptimized: true
  },
  
  // Build optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react']
  },
  
  // Reduce bundle size
  swcMinify: true,
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Handle Firebase compatibility issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Optimize for production builds
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  }
};

module.exports = nextConfig; 