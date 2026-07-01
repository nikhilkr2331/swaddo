"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, ShoppingBag, ShieldAlert, Bike, LogOut, Bell } from "lucide-react";
import Cookies from "js-cookie";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Vendors", href: "/vendors", icon: Store },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Disputes", href: "/disputes", icon: ShieldAlert },
    { name: "Riders", href: "/riders", icon: Bike },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const handleLogout = () => {
    Cookies.remove("swaddo_admin_token");
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-bg-alt border-r border-border-subtle h-screen sticky top-0 flex flex-col shadow-sm z-10">
      <div className="p-6 border-b border-border-subtle flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg text-white font-bold font-heading text-lg">
          S
        </div>
        <span className="font-heading font-bold text-text-primary text-xl tracking-tight">Swaddo Admin</span>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${isActive 
                  ? "bg-primary/10 text-primary font-bold shadow-sm" 
                  : "text-text-muted hover:bg-bg-main hover:text-text-primary"
                }`}
            >
              <Icon size={18} className={isActive ? "text-primary" : "opacity-70"} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
