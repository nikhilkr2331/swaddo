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
import { Toaster } from "react-hot-toast";
import OfflineOverlay from "@/components/OfflineOverlay";

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
            <main className="app-scroll-container pb-24 xl:pb-0 xl:pt-20 relative">
              <SplashScreen />
              <PageTransitionWrapper>
                {children}
              </PageTransitionWrapper>
            </main>
            {/* Background Handlers */}
            <NotificationListener />
            <PWARegister />
            <Toaster position="top-center" toastOptions={{
              duration: 5000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }} />

            {/* Bottom Nav for Mobile */}
            <BottomNav />
            <OfflineOverlay />
          </CartProvider>
        </LocationProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
