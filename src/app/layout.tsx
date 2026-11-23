import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";
import { Toaster } from "sonner";

// 1. Direct map to Tailwind's default sans variable
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// 2. Direct map to Tailwind's default mono variable
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var allowed = [
      "industrial-forge",
      "cyber-circuit",
      "cobalt-blueprint",
      "sovereign-vault",
      "acid-reactor"
    ];
    var saved = localStorage.getItem("al_theme_id");
    var theme = allowed.indexOf(saved) !== -1 ? saved : "industrial-forge";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "industrial-forge");
  }
})();
`;

export const metadata: Metadata = {
  title: "AutoLedger",
  description: "Advanced financial tracking",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      {/* 3. Inject variables and apply font-sans as base */}
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans antialiased bg-[var(--color-vanta)] text-[var(--color-coolwhite)]`}
      >
        <AuthProvider>
  {children}
  <Toaster position="bottom-right" expand={false} />
</AuthProvider>
      </body>
    </html>
  );
}