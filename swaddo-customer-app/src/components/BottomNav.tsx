"use client";

import { Home, UtensilsCrossed, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Delivery", href: "/", icon: Home },
    { name: "Dining", href: "/dining", icon: UtensilsCrossed },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Account", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] xl:hidden z-50 rounded-t-3xl px-6 py-4 pb-safe">
      <div className="flex justify-between items-center relative">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href + "/"));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className="relative flex flex-col items-center justify-center w-16 h-12"
            >
              <motion.div 
                whileTap={{ scale: 0.85 }} 
                className="flex flex-col items-center justify-center z-10"
              >
                <Icon size={24} className={`transition-colors duration-300 ${isActive ? "text-primary" : "text-gray-400"}`} />
                <span className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${isActive ? "text-primary" : "text-gray-400"}`}>
                  {tab.name}
                </span>
              </motion.div>
              
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl -z-0"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
