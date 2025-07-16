import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { TourProvider } from "@/contexts/TourContext";
import { Toaster } from "@/components/ui/toaster";
import InitDatabase from "./init-db";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Initialize MongoDB collections */}
        <InitDatabase />
        <AuthProvider>
          <TourProvider>
            {children}
          </TourProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
