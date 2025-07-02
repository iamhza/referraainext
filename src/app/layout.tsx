import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Referra | AI-Powered Referral Platform",
  description: "Referra connects case managers with pre-vetted service providers instantly. Save time and improve outcomes with intelligent referral matching.",
  keywords: "referrals, case management, service providers, AI matching, social services, healthcare referrals, mental health services, community resources, human services, social work, care coordination, patient referrals, welfare services, non-profit organizations, resource matching, service navigation, case coordination, behavioral health, medical referrals, housing assistance, family services, elder care, disability services, veteran services, substance abuse treatment, crisis intervention, homelessness services, public assistance, child welfare, telehealth, community support",
  openGraph: {
    title: "Referra | AI-Powered Referrals",
    description: "Connect case managers with pre-vetted service providers in seconds.",
    url: "https://referraai.com",
    siteName: "Referra",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Referra | AI-Powered Referrals",
    description: "Connect case managers with pre-vetted service providers in seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
