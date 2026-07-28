import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORGE Executive Office",
  description: "A premium AI operating system for executive leadership and multi-provider orchestration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}