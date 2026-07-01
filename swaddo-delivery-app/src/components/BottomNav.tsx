"use client";

import { Home, Wallet, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on login or active-delivery map views
  if (pathname === '/login' || pathname.startsWith('/active-delivery')) return null;

  const navItems = [
    { name: "Home", icon: Home, path: "/home" },
    { name: "Earnings", icon: Wallet, path: "/earnings" },
    { name: "Account", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-bg-alt border-t border-border-subtle pb-safe pt-1 px-6 shadow-[0_-4px_20px_rgba(43,36,32,0.05)] z-40">
      <div className="flex justify-around items-center py-2 h-[72px]">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                isActive ? "text-primary" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon size={24} className={isActive ? "fill-primary/10" : ""} />
              <span className={`text-[10px] font-bold ${isActive ? "text-primary" : "text-text-muted"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
