/** @type {import('next').NextConfig} */
const nextConfig = {
  // ---------------------------------------------------------------------------
  // AI Hub - Next.js Configuration
  // ---------------------------------------------------------------------------

  // React strict mode for development quality
  reactStrictMode: true,

  // Optimized image handling
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Environment variables that are safe for the client
  env: {
    NEXT_PUBLIC_APP_NAME: "AI Hub",
    NEXT_PUBLIC_APP_VERSION: "0.1.0",
  },

  // Experimental features
  experimental: {
    // Server Actions are stable in Next.js 14
    typedRoutes: true,
  },

  // Headers for security
  async headers() {
    // NOTE: 'unsafe-inline' is a compromise required by Next.js inline styles/scripts.
    // A stricter nonce-based CSP is tracked as Phase-3 work.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com https://api.groq.com https://api.mistral.ai",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
