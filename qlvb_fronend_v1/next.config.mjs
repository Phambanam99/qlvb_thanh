/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone', // ✅ Temporarily disabled to avoid symlink issues on Windows
  devIndicators: false,
  // Cấu hình cho phép truy cập từ các IP trong mạng LAN
  experimental: {
    allowedDevOrigins: [
      '*',   // Cho phép mạng private 172.16-31.x.x
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore sockjs-client warnings about missing supports-color
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'supports-color': false,
      };
    }
    return config;
  },
  
  async rewrites() {
    return [
      {
        source: '/ajax.php',
        destination: '/api/ajax-fallback',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*', // Proxy to Backend
      },
    ]
  },
}

export default nextConfig
