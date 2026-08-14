import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FORGE Executive Office",
    short_name: "FORGE",
    description: "A private AI executive operating system.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070a",
    theme_color: "#07070a",
    orientation: "portrait",
    icons: [
      {
        src: "/forge-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/forge-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
