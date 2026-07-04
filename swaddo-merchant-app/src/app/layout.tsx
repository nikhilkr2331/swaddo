import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import PWARegister from "@/components/PWARegister";
import SWRProvider from "@/components/SWRProvider";

import PageTransitionWrapper from "@/components/PageTransitionWrapper";

export const metadata: Metadata = {
  title: "Swaddo Merchant App",
  description: "Manage stall orders and menu.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`font-sans bg-bg-main text-text-primary antialiased`}>
        <SWRProvider>
          <SplashScreen />
          <main className="pb-20">
            <PageTransitionWrapper>
              {children}
            </PageTransitionWrapper>
          </main>
          <PWARegister />
          <BottomNav />
        </SWRProvider>
      </body>
    </html>
  );
}
