"use client";

import { useState, useEffect } from "react";
import { Edit2, LogOut, ChevronRight, ShoppingBag, MapPin, CreditCard, HeadphonesIcon, Settings, Info, Heart, Wallet, UtensilsCrossed, ShieldCheck, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

export default function Profile() {
  useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileData, setProfileData] = useState<{name?: string, phone?: string} | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [vegRestaurantsOnly, setVegRestaurantsOnly] = useState(false);

  useEffect(() => {
    setMounted(true);
    api.get('/auth/me')
      .then(res => setProfileData(res.data))
      .catch(err => console.error("Failed to fetch profile", err));
      
    // Load favorites
    const favs = JSON.parse(localStorage.getItem("swaddo_favorites") || "[]");
    setFavorites(favs);
    
    // Load veg setting
    const isVegOnly = localStorage.getItem("swaddo_veg_restaurants_only") === "true";
    setVegRestaurantsOnly(isVegOnly);
  }, []);

  const toggleVegRestaurants = () => {
    const newVal = !vegRestaurantsOnly;
    setVegRestaurantsOnly(newVal);
    localStorage.setItem("swaddo_veg_restaurants_only", newVal ? "true" : "false");
  };

  const handleRemoveFavorite = (id: string, e: any) => {
    e.stopPropagation();
    const newFavs = favorites.filter((f) => f.id !== id);
    setFavorites(newFavs);
    localStorage.setItem("swaddo_favorites", JSON.stringify(newFavs));
  };
  
  const phone = profileData?.phone || (mounted ? localStorage.getItem('swaddo_customer_phone') || '+91 98765 43210' : '+91 98765 43210');
  const name = profileData?.name || "Guest User";
  
  const handleLogout = () => {
    localStorage.removeItem('swaddo_customer_token');
    localStorage.removeItem('swaddo_customer_phone');
    router.push('/login');
  };
  
  return (
    <div className="min-h-screen bg-[#f4f4f5] pb-24 font-body">
      
      {/* Header / Profile Info */}
      <div className="bg-white px-6 pt-10 pb-6 rounded-b-[24px] shadow-sm relative mb-4">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex flex-col">
            <h1 className="text-[28px] font-heading font-black text-gray-900 tracking-tight leading-tight">{name}</h1>
            <p className="text-gray-500 mt-1 font-medium text-sm flex items-center gap-2">
              {phone.startsWith('+') ? phone : `+91 ${phone}`} 
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span> 
              <span className="text-primary font-bold cursor-pointer flex items-center gap-1">Edit <Edit2 size={12}/></span>
            </p>
          </div>
          <div className="w-[72px] h-[72px] rounded-full bg-gray-100 flex items-center justify-center text-2xl font-heading font-black text-gray-700 shadow-inner border border-gray-200 uppercase">
            {name.substring(0, 2)}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 xl:px-0 flex flex-col gap-4">
        
        {/* Quick Access Horizontal Cards */}
        <div className="flex gap-4 mb-1">
          <Link href="/orders" className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <div className="bg-orange-50 p-3 rounded-full text-primary">
              <ShoppingBag size={22} />
            </div>
            <span className="font-bold text-sm text-gray-800">Orders</span>
          </Link>
          <Link href="/addresses" className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <div className="bg-green-50 p-3 rounded-full text-green-600">
              <MapPin size={22} />
            </div>
            <span className="font-bold text-sm text-gray-800">Addresses</span>
          </Link>
          <Link href="/payments" className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <div className="bg-purple-50 p-3 rounded-full text-purple-600">
              <Wallet size={22} />
            </div>
            <span className="font-bold text-sm text-gray-800">Wallet</span>
          </Link>
        </div>

        {/* Menu Groups */}
        <div className="flex flex-col gap-4">
          
          {/* Group 1: Food & Dining */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <Link href="/orders" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                  <ShoppingBag size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">Your Orders</span>
                  <span className="text-xs text-gray-500 font-medium">Reorder, track, or get help</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
            
            <button onClick={() => setShowFavoritesModal(true)} className="w-full flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <Heart size={20} className="fill-red-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">Your Favorites</span>
                  <span className="text-xs text-gray-500 font-medium">Saved restaurants and stalls</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
            
            <Link href="/dining" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                  <UtensilsCrossed size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">Dining Bookings</span>
                  <span className="text-xs text-gray-500 font-medium">View your table reservations</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          </div>

          {/* Group 2: Account Details */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <Link href="/addresses" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                  <MapPin size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">Manage Addresses</span>
                  <span className="text-xs text-gray-500 font-medium">Add or edit delivery locations</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <Link href="/payments" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                  <CreditCard size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">Payments & Wallets</span>
                  <span className="text-xs text-gray-500 font-medium">Manage cards and refunds</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          </div>

          {/* Group 3: Help & Settings */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 mb-2">
            <Link href="/support" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                  <HeadphonesIcon size={20} />
                </div>
                <span className="font-bold text-gray-800 text-sm">Help & Support</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <div className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">Pure Veg Restaurants</span>
                  <span className="text-xs text-gray-500 font-medium">Show only pure veg places</span>
                </div>
              </div>
              <div 
                onClick={toggleVegRestaurants}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${vegRestaurantsOnly ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${vegRestaurantsOnly ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>

            <Link href="/settings" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                  <Settings size={20} />
                </div>
                <span className="font-bold text-gray-800 text-sm">Settings</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <Link href="/about" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                  <Info size={20} />
                </div>
                <span className="font-bold text-gray-800 text-sm">About & Terms</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
            
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-between p-4 sm:px-5 hover:bg-red-50 active:bg-red-100 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <LogOut size={20} />
                </div>
                <span className="font-bold text-red-600 text-sm">Log Out</span>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center pb-8 mt-2">
          <p className="text-xs text-gray-400 font-medium">App Version 1.0.0 (Build 42)</p>
          <p className="text-[10px] text-gray-300 font-medium mt-1">Made with <Heart size={10} className="inline text-gray-300" /> in Bihar</p>
        </div>

      </div>

      <BottomNav />

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] bg-white rounded-[32px] shadow-2xl p-6 z-[101] text-center"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                <LogOut size={32} />
              </div>
              <h3 className="font-heading font-black text-2xl text-gray-900 mb-2 tracking-tight">Log Out?</h3>
              <p className="text-gray-500 text-sm mb-8 font-medium px-4">Are you sure you want to log out of your SwaDDo account?</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 transition-colors shadow-sm active:scale-95"
                >
                  Yes, Log Out
                </button>
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Favorites Modal */}
      <AnimatePresence>
        {showFavoritesModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFavoritesModal(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-[32px] shadow-2xl z-[101] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                    <Heart size={20} className="fill-red-500" />
                  </div>
                  <h3 className="font-heading font-black text-xl text-gray-900 tracking-tight">Your Favorites</h3>
                </div>
                <button onClick={() => setShowFavoritesModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {favorites.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Heart size={32} />
                    </div>
                    <p className="font-bold text-gray-800 text-lg mb-1">No favorites yet</p>
                    <p className="text-gray-500 text-sm">Tap the heart icon on any restaurant to save it here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="flex gap-4 p-3 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white items-center cursor-pointer" onClick={() => router.push(`/stall?id=${fav.id}`)}>
                        <div className="w-[80px] h-[80px] rounded-xl overflow-hidden shrink-0 relative">
                          <img src={fav.image} alt={fav.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <h4 className="font-bold text-gray-900 line-clamp-1 text-base">{fav.name}</h4>
                          <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{fav.category}</p>
                          <div className="flex items-center gap-1 bg-green-700 px-1.5 py-0.5 rounded text-white w-max mt-2 shadow-sm">
                            <span className="text-[10px] font-bold">{fav.rating}</span>
                            <Star size={8} className="fill-white" />
                          </div>
                        </div>
                        <button onClick={(e) => handleRemoveFavorite(fav.id, e)} className="p-2 text-red-500 hover:bg-red-50 rounded-full shrink-0">
                          <Heart size={20} className="fill-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
