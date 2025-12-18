import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "BURNROOM | Self-Destructing Chat",
  description: "Encrypted ephemeral conversations that vanish forever. No logs. No traces. No evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <div className="noise" />
        <div className="scanlines" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
