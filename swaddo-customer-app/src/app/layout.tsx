import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import NotificationListener from "@/components/NotificationListener";
import { CartProvider } from "@/context/CartContext";
import { LocationProvider } from "@/context/LocationContext";
import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import SplashScreen from "@/components/SplashScreen";
import PWARegister from "@/components/PWARegister";
import SWRProvider from "@/components/SWRProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["latin"], 
  variable: "--font-heading" 
});

export const metadata: Metadata = {
  title: "Swaddo - Street Food Delivery",
  description: "Live tracking for your local street food orders.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`}>
        <SWRProvider>
          <LocationProvider>
            <CartProvider>
              {/* Top Nav for Desktop */}
              <TopNav />
            
            {/* Main Content Area */}
            <main className="pb-20 xl:pb-0 xl:pt-20 min-h-screen relative">
              <SplashScreen />
              <PageTransitionWrapper>
                {children}
              </PageTransitionWrapper>
            </main>
            {/* Notification Listener */}
            <NotificationListener />
            <PWARegister />

            {/* Bottom Nav for Mobile */}
            <BottomNav />
          </CartProvider>
        </LocationProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
