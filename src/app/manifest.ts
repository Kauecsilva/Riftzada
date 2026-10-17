import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Riftzada",
    short_name: "Riftzada",
    description: "A comunidade local de Riftbound.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0b14",
    theme_color: "#0a0b14",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
