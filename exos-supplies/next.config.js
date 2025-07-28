/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for development
  // output: 'export',
  // trailingSlash: true,
  
  // Development optimizations
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
  
  // Optimize images
  images: {
    unoptimized: true
  },
  
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
    
    // Development optimizations
    if (dev) {
      // Disable source maps in development for faster compilation
      config.devtool = 'eval';
      
      // Optimize module resolution
      config.resolve.modules = ['node_modules'];
    }
    
    return config;
  }
};

module.exports = nextConfig; 