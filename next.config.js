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
    // P1.3 Browser-ONNX: don't bundle @xenova/transformers on the server; Browser uses onnxruntime-web (WASM).
    serverComponentsExternalPackages: ["@xenova/transformers", "onnxruntime-node"],
  },

  // Webpack: redirect onnxruntime-node to an empty stub (we use onnxruntime-web/WASM in the browser).
  webpack: (config, { isServer }) => {
    const path = require("path");
    const onnxNodeStub = path.resolve(__dirname, "scripts/onnxruntime-node-stub.js");

    // resolve.alias replaces every `require('onnxruntime-node')` with the empty stub
    // — both in server and client bundles. @xenova/transformers v2.x unconditionally
    // requires onnxruntime-node in src/backends/onnx.js; the stub keeps the import
    // resolvable without dragging in the native .node binary.
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node": onnxNodeStub,
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "onnxruntime-node",
      ];
    }

    return config;
  },

  // Headers for security
  async headers() {
    // Dev needs 'unsafe-eval' for Next.js react-refresh; Production stays strict.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:"
      : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'";

    // Pattern P1.3 Browser-ONNX: onnxruntime-web fetches its WASM-binaries from
    // cdn.jsdelivr.net and HuggingFace serves model files via huggingface.co +
    // cdn-lfs.huggingface.co. Both must be allowed in connect-src for the spike.
    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com https://api.groq.com https://api.mistral.ai https://huggingface.co https://cdn-lfs.huggingface.co https://*.hf.co https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
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
