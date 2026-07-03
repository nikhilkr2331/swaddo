"use client";

import { ShoppingCart, User, Search, MapPin, ChevronDown, Bell } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import LocationSelector from "./LocationSelector";

export default function TopNav() {
  const { cartItemCount } = useCart();
  return (
    <div className="hidden xl:flex fixed top-0 w-full h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] z-50 px-8 items-center justify-between">
      
      {/* Left Section: Logo & Location */}
      <div className="flex items-center gap-8">
        {/* Brand Logo */}
        <Link href="/" className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            S
          </div>
          Swaddo
        </Link>

        {/* Location Selector (Desktop) */}
        <LocationSelector isMobile={false} />
      </div>

      {/* Centered Search Bar */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            placeholder="Search for local stalls, dishes..."
            className="w-full bg-bg-main border border-border-subtle rounded-full py-2.5 pl-10 pr-4 outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-6">
        <button className="relative text-text-primary hover:text-primary transition-colors">
          <Bell size={22} />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary"></span>
        </button>

        <Link href="/cart" className="relative text-text-primary hover:text-primary transition-colors">
          <ShoppingCart size={24} />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </Link>
        
        <Link href="/profile" className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors">
          <div className="w-10 h-10 rounded-full bg-bg-main border border-border-subtle flex items-center justify-center overflow-hidden">
             <User size={20} className="text-text-muted" />
          </div>
          <span className="font-medium text-sm">Profile</span>
        </Link>
      </div>
    </div>
  );
}
