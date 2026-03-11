import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Echo OCR",
  description: "Response card scanning and management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="relative flex min-h-screen">
            <div className="gradient-mesh pointer-events-none fixed inset-0 z-0" />
            <Sidebar />
            <main className="relative z-10 flex-1 pt-16 md:pt-0 md:pl-[260px]">
              <div className="p-4 sm:p-6 md:p-8">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
