import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FORGE Executive Office",
    short_name: "FORGE",
    description: "TJ's private AI executive operating system.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070a",
    theme_color: "#07070a",
    orientation: "portrait",
    icons: [
      {
        src: "/forge-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
