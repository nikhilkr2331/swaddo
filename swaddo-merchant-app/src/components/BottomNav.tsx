"use client";

import { LayoutDashboard, Menu as MenuIcon, User, BarChart3, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const navItems = [
    { name: "Orders", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Menu", icon: MenuIcon, path: "/menu" },
    { name: "Insights", icon: BarChart3, path: "/insights" },
    { name: "Offers", icon: Tag, path: "/offers" },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-md mx-auto left-1/2 -translate-x-1/2 bg-bg-alt border-t border-border-subtle pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(43,36,32,0.05)] z-40">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                isActive ? "text-accent" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon size={24} className={isActive ? "fill-accent/10" : ""} />
              <span className={`text-[10px] font-bold ${isActive ? "text-accent" : "text-text-muted"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
