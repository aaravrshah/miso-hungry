import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f8efe1",
    description: "A personal recipe tracker for favorite meals, pantry notes, and grocery planning.",
    display: "standalone",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        purpose: "maskable",
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    id: "/",
    name: "Miso Hungry",
    orientation: "portrait-primary",
    scope: "/",
    short_name: "Miso Hungry",
    start_url: "/",
    theme_color: "#bc5a43",
  };
}
