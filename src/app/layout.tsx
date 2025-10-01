import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TourProvider } from "@/contexts/TourContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import InitDatabase from "./init-db";

export const metadata: Metadata = {
  title: "Referra - AI-Powered Referrals",
  description: "Referra connects case managers with pre-vetted service providers in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-suisse antialiased" style={{ fontFamily: 'var(--font-suisse)' }}>
        {/* Initialize MongoDB collections */}
        <InitDatabase />
        <Providers>
          <ThemeProvider>
            <TourProvider>
              {children}
            </TourProvider>
          </ThemeProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
