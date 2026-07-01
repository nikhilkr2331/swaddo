import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-heading' });



export const metadata: Metadata = {
  title: "Swaddo Admin Panel",
  description: "Internal operations and management for Swaddo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body className="font-sans antialiased bg-bg-main text-text-primary">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 w-full overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
