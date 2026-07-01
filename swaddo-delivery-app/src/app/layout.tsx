import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["latin"], 
  variable: "--font-heading" 
});

export const metadata: Metadata = {
  title: "Swaddo Delivery Partner",
  description: "Delivery partner app for Swaddo.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-body bg-bg-main text-text-primary antialiased`}>
        <SplashScreen />
        <main className="pb-20">
          {children}
        </main>
        <PWARegister />
        <BottomNav />
      </body>
    </html>
  );
}
