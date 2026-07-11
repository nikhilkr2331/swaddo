"use client";

import { Home, UtensilsCrossed, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on chat screen so input field isn't covered
  if (pathname?.startsWith('/support/chat')) return null;

  const tabs = [
    { name: "Delivery", href: "/", icon: Home },
    { name: "Dining", href: "/dining", icon: UtensilsCrossed },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Account", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-100 shadow-float xl:hidden z-50 px-2 pt-2 pb-[calc(0.75rem+var(--safe-area-bottom))]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href + "/"));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center relative"
            >
              <motion.div 
                whileTap={{ scale: 0.9 }} 
                className="flex flex-col items-center justify-center"
              >
                <div className={`relative mb-1 transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                   <Icon size={22} className={`transition-colors duration-300 ${isActive ? "text-primary fill-primary/10" : "text-gray-400"}`} />
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-colors duration-300 ${isActive ? "text-primary" : "text-gray-500"}`}>
                  {tab.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
