import {withSentryConfig} from '@sentry/nextjs';
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
output: 'standalone',

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



export default withSentryConfig(nextConfig, {
// For all available options, see:
// https://www.npmjs.com/package/@sentry/webpack-plugin#options

org: "algobiz",
project: "sonarlabs",

// Only print logs for uploading source maps in CI
silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Upload a larger set of source maps for prettier stack traces (increases build time)
widenClientFileUpload: true,

// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
tunnelRoute: "/monitoring",

// Automatically tree-shake Sentry logger statements to reduce bundle size
disableLogger: true,

// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
automaticVercelMonitors: true,
});