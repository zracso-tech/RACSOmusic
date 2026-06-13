import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las imágenes remotas (avatares de Google, etc.) se habilitarán por dominio
  // cuando se necesiten. De momento, configuración mínima.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
