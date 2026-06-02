import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "InfluenceAI Studio",
  description:
    "Create, manage, and monetize AI-powered digital influencers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
        <Script
          src="https://whop.com/embed/whop-embed.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
