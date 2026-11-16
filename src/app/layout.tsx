import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

// 1. Direct map to Tailwind's default sans variable
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// 2. Direct map to Tailwind's default mono variable
const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoLedger ",
  description: "Advanced financial tracking",
  icons : {
    icon:'/logo.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* 3. Inject variables and apply font-sans as base */}
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans antialiased bg-[var(--color-vanta)] text-[var(--color-coolwhite)]`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}