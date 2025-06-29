import type { NextConfig } from "next";

// const getContentSecurityPolicy = () => {
//   const isDevelopment = process.env.NODE_ENV === 'development';
  
//   const cspDirectives = {
//     'default-src': ["'self'"],
//     'script-src': [
//       "'self'",
//       "'unsafe-eval'", // Required for Next.js
//       "'unsafe-inline'", // Required for Next.js
//     ],
//     'style-src': [
//       "'self'",
//       "'unsafe-inline'", // Required for styled-components/CSS-in-JS
//     ],
//     'img-src': [
//       "'self'",
//       'data:',
//       'https:',
//     ],
//     'font-src': [
//       "'self'",
//       'data:',
//     ],
//     'connect-src': [
//       "'self'",
//       ...(isDevelopment ? [
//         'ws://localhost:*',
//         'wss://localhost:*',
//         'http://localhost:*',
//         'https://localhost:*',
//         'ws://127.0.0.1:*',
//         'wss://127.0.0.1:*',
//       ] : [
//         'wss:',
//         'https:',
//         // Add your production WebSocket URLs here
//         // 'wss://your-websocket-server.com',
//       ]),
//     ],
//     'frame-src': ["'none'"],
//     'object-src': ["'none'"],
//     'base-uri': ["'self'"],
//     'form-action': ["'self'"],
//     'frame-ancestors': ["'none'"],
//   };

//   // Convert to CSP string
//   return Object.entries(cspDirectives)
//     .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
//     .join('; ');
// };

const nextConfig: NextConfig = {
  // Environment-specific settings
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Production optimizations
  compress: true,
  generateEtags: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000
},

webpack: async (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  if (!dev && !isServer) {
    // Bundle analyzer in CI/CD
    if (process.env.ANALYZE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = await import('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: '../bundle-report.html',
          })
        );
      } catch (error) {
        console.warn('webpack-bundle-analyzer not available, skipping bundle analysis');
      }
    }
    config.optimization.splitChunks.cacheGroups = {
      ...config.optimization.splitChunks.cacheGroups,
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
    };
  }
  
  return config;
},
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        // {
        //   key: 'Content-Security-Policy',
        //   value: getContentSecurityPolicy(),
        // },
      ],
    },
  ];
},

// Redirects and rewrites
async redirects() {
  return [
    {
      source: '/old-path',
      destination: '/new-path',
      permanent: true,
    },
  ];
},
}



export default nextConfig;
