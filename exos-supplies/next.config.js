/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Firebase hosting
  output: 'export',
  trailingSlash: true,
  
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
    
    return config;
  }
};

module.exports = nextConfig; 