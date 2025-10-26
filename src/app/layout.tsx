import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { TourProvider } from "@/contexts/TourContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { SandboxBanner } from "@/components/sandbox/SandboxBanner";

// Configure Manrope font
const manrope = localFont({
  src: [
    {
      path: '../../public/fonts/Manrope/Manrope-VariableFont_wght.ttf',
      weight: '200 800',
      style: 'normal',
    },
  ],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Referra - AI-Powered Referrals",
  description: "Referra connects case managers with pre-vetted service providers in seconds.",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans antialiased`}>
        <Providers>
          <ThemeProvider>
            <TourProvider>
              <SandboxBanner />
              {children}
            </TourProvider>
          </ThemeProvider>
        </Providers>
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
