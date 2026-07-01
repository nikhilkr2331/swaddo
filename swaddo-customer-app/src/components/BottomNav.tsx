"use client";

import { Home, UtensilsCrossed, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Delivery", href: "/", icon: Home },
    { name: "Dining", href: "/dining", icon: UtensilsCrossed },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Account", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-bg-alt border-t border-border-subtle shadow-xl xl:hidden z-50 rounded-t-2xl px-6 py-4">
      <div className="flex justify-between items-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon size={24} className={isActive ? "fill-primary/10" : ""} />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
