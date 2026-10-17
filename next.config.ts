import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  // Modelo de cache anterior (sem Cache Components): toda página logada é dinâmica, o que é
  // o mais simples para um app em que quase tudo depende do usuário.
  poweredByHeader: false,
  images: {
    // Só as fotos do bucket "media" do projeto passam pelo otimizador
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/media/**" }]
      : [],
    deviceSizes: [480, 828, 1200],
    imageSizes: [64, 128, 256],
    minimumCacheTTL: 2678400,
  },
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
