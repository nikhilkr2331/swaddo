"use client";

import { useState, useEffect } from "react";
import { Edit2, LogOut, ChevronRight, ShoppingBag, MapPin, CreditCard, HeadphonesIcon, Settings, Info, Heart, Wallet, UtensilsCrossed, ShieldCheck, Star, X, Loader2 } from "lucide-react";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return alert("Name is required");
    setIsUpdating(true);
    try {
      const res = await api.put('/auth/profile', { name: editName, phone: editPhone });
      setProfileData(res.data);
      if (res.data.phone) localStorage.setItem('swaddo_customer_phone', res.data.phone);
      setShowEditModal(false);
    } catch (error: any) {
      console.error("Failed to update profile", error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = () => {
    setEditName(name !== "Guest User" ? name : "");
    setEditPhone(phone.replace('+91 ', '').replace('+91', ''));
    setShowEditModal(true);
  };
  
  return (
    <div className="app-scroll-container bg-bg-main pb-24 font-body">
      
      {/* Header / Profile Info */}
      <div className="bg-white px-4 sm:px-6 pt-12 pb-6 rounded-b-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] relative mb-5">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] sm:text-[32px] font-heading font-black text-[#1c1c1c] tracking-tight leading-none">{name}</h1>
            <p className="text-[#696969] mt-0.5 font-medium text-[13px] flex items-center gap-1.5">
              <span>{phone.startsWith('+') ? phone : `+91 ${phone}`}</span>
              <span className="text-gray-300 font-bold">•</span> 
              <button onClick={openEditModal} className="text-[#e23744] font-bold cursor-pointer flex items-center gap-1 active:scale-95 transition-transform hover:opacity-80">
                Edit <Edit2 size={11} className="stroke-[3px]" />
              </button>
            </p>
          </div>
          <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-full bg-[#f8f9fa] flex items-center justify-center text-[24px] sm:text-[28px] font-heading font-black text-[#1c1c1c] shadow-sm border border-gray-100 uppercase overflow-hidden shrink-0 ml-4">
            {name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 xl:px-0 flex flex-col gap-5">
        
        {/* Quick Access Horizontal Cards */}
        <div className="flex gap-4">
          <Link href="/orders" className="flex-1 bg-white p-4 rounded-[24px] shadow-native border border-transparent flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform hover:shadow-native-lg">
            <div className="bg-orange-50/80 p-3.5 rounded-[16px] text-primary">
              <ShoppingBag size={24} />
            </div>
            <span className="font-bold text-[13px] text-gray-800 tracking-tight">Orders</span>
          </Link>
          <Link href="/addresses" className="flex-1 bg-white p-4 rounded-[24px] shadow-native border border-transparent flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform hover:shadow-native-lg">
            <div className="bg-blue-50/80 p-3.5 rounded-[16px] text-blue-600">
              <MapPin size={24} />
            </div>
            <span className="font-bold text-[13px] text-gray-800 tracking-tight">Addresses</span>
          </Link>
          <Link href="/payments" className="flex-1 bg-white p-4 rounded-[24px] shadow-native border border-transparent flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform hover:shadow-native-lg">
            <div className="bg-purple-50/80 p-3.5 rounded-[16px] text-purple-600">
              <Wallet size={24} />
            </div>
            <span className="font-bold text-[13px] text-gray-800 tracking-tight">Wallet</span>
          </Link>
        </div>

        {/* Menu Groups */}
        <div className="flex flex-col gap-5 mt-2">
          
          {/* Group 1: Food & Dining */}
          <div className="bg-white rounded-[24px] shadow-native overflow-hidden border border-transparent">
            <Link href="/orders" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                  <ShoppingBag size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-gray-900 text-[15px]">Your Orders</span>
                  <span className="text-[12px] text-gray-500 font-medium mt-0.5">Reorder, track, or get help</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
            
            <button onClick={() => setShowFavoritesModal(true)} className="w-full flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 text-left">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <Heart size={20} className="fill-red-500 text-red-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-gray-900 text-[15px]">Your Favorites</span>
                  <span className="text-[12px] text-gray-500 font-medium mt-0.5">Saved restaurants and stalls</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
            
            <Link href="/dining" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                  <UtensilsCrossed size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-gray-900 text-[15px]">Dining Bookings</span>
                  <span className="text-[12px] text-gray-500 font-medium mt-0.5">View your table reservations</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          </div>

          {/* Group 2: Account Details */}
          <div className="bg-white rounded-[24px] shadow-native overflow-hidden border border-transparent">
            <Link href="/addresses" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                  <MapPin size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-gray-900 text-[15px]">Manage Addresses</span>
                  <span className="text-[12px] text-gray-500 font-medium mt-0.5">Add or edit delivery locations</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <Link href="/payments" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                  <CreditCard size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-gray-900 text-[15px]">Payments & Wallets</span>
                  <span className="text-[12px] text-gray-500 font-medium mt-0.5">Manage cards and refunds</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          </div>

          {/* Group 3: Help & Settings */}
          <div className="bg-white rounded-[24px] shadow-native overflow-hidden border border-transparent mb-4">
            <Link href="/support" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                  <HeadphonesIcon size={20} />
                </div>
                <span className="font-heading font-bold text-gray-900 text-[15px]">Help & Support</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <div className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-gray-900 text-[15px]">Pure Veg Restaurants</span>
                  <span className="text-[12px] text-gray-500 font-medium mt-0.5">Show only pure veg places</span>
                </div>
              </div>
              <div 
                onClick={toggleVegRestaurants}
                className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${vegRestaurantsOnly ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${vegRestaurantsOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>

            <Link href="/settings" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                  <Settings size={20} />
                </div>
                <span className="font-heading font-bold text-gray-900 text-[15px]">Settings</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <Link href="/about" className="flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                  <Info size={20} />
                </div>
                <span className="font-heading font-bold text-gray-900 text-[15px]">About & Terms</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
            
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-between p-4 sm:px-5 hover:bg-red-50 active:bg-red-100 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <LogOut size={20} />
                </div>
                <span className="font-heading font-bold text-red-600 text-[15px]">Log Out</span>
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-[101] flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading font-black text-xl text-gray-900 tracking-tight">Edit Profile</h3>
                <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider">Your Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block tracking-wider">Phone Number</label>
                  <div className="flex">
                    <div className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl px-4 py-3.5 text-[15px] font-bold text-gray-500 shrink-0">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={editPhone}
                      disabled
                      className="w-full border border-gray-200 bg-gray-100 rounded-r-xl px-4 py-3.5 text-[15px] font-medium outline-none text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-orange-600 mt-2 flex items-start gap-1">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>Phone number cannot be changed directly. Please contact support.</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(226,64,28,0.4)] transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                {isUpdating ? <Loader2 size={20} className="animate-spin" /> : "Save Changes"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
