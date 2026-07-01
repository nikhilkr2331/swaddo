"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft, Share2, Star, Clock, MapPin, Plus, Minus, ShoppingBag, Loader2, Heart } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import { api } from "@/lib/api";

const VegIcon = () => (
  <div className="w-4 h-4 border-[1.5px] border-green-700 flex items-center justify-center rounded-[3px] shrink-0">
    <div className="w-2 h-2 bg-green-700 rounded-full"></div>
  </div>
);

const NonVegIcon = () => (
  <div className="w-4 h-4 border-[1.5px] border-[#8B3A1A] flex items-center justify-center rounded-[3px] shrink-0">
    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-[#8B3A1A]"></div>
  </div>
);

function StallDetailContent() {
  const router = useRouter();
  const { latitude, longitude, liveLatitude, liveLongitude } = useLocation();
  
  const searchParams = useSearchParams();
  const stallId = searchParams.get('id');
  
  const [stallData, setStallData] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemMarkup, setItemMarkup] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [itemFavorites, setItemFavorites] = useState<string[]>([]);
  const [isVegMode, setIsVegMode] = useState(false);

  useEffect(() => {
    if (stallId && typeof window !== "undefined") {
      const favs = JSON.parse(localStorage.getItem("swaddo_favorites") || "[]");
      setIsFavorite(favs.some((fav: any) => fav.id === stallId));
      
      const itemFavs = JSON.parse(localStorage.getItem("swaddo_item_favorites") || "[]");
      setItemFavorites(itemFavs);

      const savedVegMode = localStorage.getItem("swaddo_veg_mode") === "true";
      setIsVegMode(savedVegMode);
    }
  }, [stallId]);

  const toggleFavorite = () => {
    if (!stallData || typeof window === "undefined") return;
    
    const favs = JSON.parse(localStorage.getItem("swaddo_favorites") || "[]");
    const stallSummary = {
      id: stallId,
      name: stallData.name,
      address: stallData.address || stallData.location,
      rating: stallData.rating,
      image: stallData.image || stallData.cover_image,
      category: stallData.tags || "Food"
    };

    if (isFavorite) {
      const newFavs = favs.filter((f: any) => f.id !== stallId);
      localStorage.setItem("swaddo_favorites", JSON.stringify(newFavs));
      setIsFavorite(false);
    } else {
      favs.push(stallSummary);
      localStorage.setItem("swaddo_favorites", JSON.stringify(favs));
      setIsFavorite(true);
    }
  };

  const toggleItemFavorite = (id: string, e: any) => {
    e.stopPropagation();
    let newFavs = [...itemFavorites];
    if (newFavs.includes(id)) {
      newFavs = newFavs.filter((fid: string) => fid !== id);
    } else {
      newFavs.push(id);
    }
    setItemFavorites(newFavs);
    localStorage.setItem("swaddo_item_favorites", JSON.stringify(newFavs));
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const { cart, updateQuantity, cartItemCount, cartTotal } = useCart();

  useEffect(() => {
    if (!stallId) return;

    let active = true;

    const fetchData = async () => {
      try {
        const stallPromise = api.get(`/stalls/${stallId}`);
        const menuPromise = api.get(`/stalls/${stallId}/menu`);
        
        const stallRes = await stallPromise;
        const stall = stallRes.data;
        if (active) {
          setStallData(stall);
          setIsLoading(false); 
        }
        
        let currentItemMarkup = 0;
        
        if (stall?.latitude && stall?.longitude) {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
            
            let browsingDistanceKm = 0;
            if (latitude && longitude) {
               const routeRes = await fetch(`${baseUrl}/location/route`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   originLat: parseFloat(stall.latitude),
                   originLng: parseFloat(stall.longitude),
                   destLat: latitude,
                   destLng: longitude
                 })
               });
               const data = await routeRes.json();
               if (data.status === 'success' && data.data) {
                 browsingDistanceKm = data.data.distanceKm;
               }
            }
            
            let physicalDistanceKm = 0;
            if (liveLatitude && liveLongitude) {
               const liveRouteRes = await fetch(`${baseUrl}/location/route`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   originLat: parseFloat(stall.latitude),
                   originLng: parseFloat(stall.longitude),
                   destLat: liveLatitude,
                   destLng: liveLongitude
                 })
               });
               const liveData = await liveRouteRes.json();
               if (liveData.status === 'success' && liveData.data) {
                 physicalDistanceKm = liveData.data.distanceKm;
               }
            }
            
            if (active) {
              if (browsingDistanceKm >= 4.0 || physicalDistanceKm >= 4.0) {
                currentItemMarkup = 20;
              }
            }
          } catch (e) {
            console.error("Failed to fetch road distance:", e);
            if (active) {
              let browsingDist = 0;
              if (latitude && longitude) {
                 browsingDist = getDistance(parseFloat(stall.latitude), parseFloat(stall.longitude), latitude, longitude);
              }
              let physicalDist = 0;
              if (liveLatitude && liveLongitude) {
                 physicalDist = getDistance(parseFloat(stall.latitude), parseFloat(stall.longitude), liveLatitude, liveLongitude);
              }
              
              if (browsingDist >= 3.2 || physicalDist >= 3.2) {
                 currentItemMarkup = 20;
              }
            }
          }
        }
        
        if (active) setItemMarkup(currentItemMarkup);

        const menuRes = await menuPromise;
        const menuData = menuRes.data;
        const mappedItems = menuData.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            description: item.description || "",
            price: Number(item.price), 
            isVeg: item.is_veg ?? true,
            isSoldOut: item.is_available === false,
            category: (item.category && item.category.trim().toLowerCase() !== "all") ? item.category : "Others",
            image: item.image_url || `https://source.unsplash.com/400x300/?food,${item.name.split(' ')[0]}`
        }));
        
        if (active) {
          setItems(mappedItems);
        }
      } catch (err) {
        console.error("Failed to fetch stall data", err);
        if (active) setIsLoading(false);
      }
    };

    fetchData();

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5005";
    const socket = io(socketUrl);
    const channel = `stall:${stallId}:menu`;
    
    socket.on("connect", () => {
      socket.emit("join_room", channel);
    });
    
    socket.on(channel, (payload) => {
      const { type, item } = payload;
      
      setItems((prev) => {
        switch (type) {
          case "item_added":
            const newItem = {
              id: item.id.toString(),
              name: item.name,
              description: item.description || "",
              price: Number(item.price), 
              isVeg: item.is_veg ?? true,
              isSoldOut: item.is_available === false,
              category: (item.category && item.category.trim().toLowerCase() !== "all") ? item.category : "Others",
              image: item.image_url || `https://source.unsplash.com/400x300/?food,${item.name.split(' ')[0]}`
            };
            return [newItem, ...prev];
            
          case "item_updated":
            return prev.map(p => p.id === item.id.toString() ? {
              ...p,
              name: item.name,
              description: item.description || p.description,
              price: Number(item.price), 
              isVeg: item.is_veg ?? p.isVeg,
              category: (item.category && item.category.trim().toLowerCase() !== "all") ? item.category : (p.category && p.category.trim().toLowerCase() !== "all" ? p.category : "Others")
            } : p);
            
          case "stock_changed":
            return prev.map(p => p.id === item.id.toString() ? { ...p, isSoldOut: item.is_available === false } : p);
            
          case "item_deleted":
            return prev.filter(p => p.id !== item.id.toString());
            
          default:
            return prev;
        }
      });
    });

    socket.on("stall_update", (updatedStall) => {
      if (updatedStall.id.toString() === stallId) {
        setStallData((prev: any) => ({
          ...prev,
          isOpen: updatedStall.is_open,
          openingTime: updatedStall.opening_time,
          closingTime: updatedStall.closing_time,
          image: updatedStall.cover_image || prev?.image,
          name: updatedStall.name,
          address: updatedStall.location || prev?.address
        }));
      }
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [stallId, latitude, longitude]);

  const handleUpdateCartLocal = (item: any, delta: number) => {
    updateQuantity(stallId as string, stallData.name, { id: item.id.toString(), name: item.name, price: Number(item.price), markup: itemMarkup, isVeg: item.isVeg ?? true }, delta);
  };

  const dynamicCategories = ["All", ...Array.from(new Set(items.map(i => i.category)))];

  const categoriesToRender = activeCategory === "All" 
    ? dynamicCategories.filter(c => c !== "All")
    : [activeCategory];

  if (isLoading || !stallData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Sleek Banner Section */}
      <div className="relative w-full h-[180px] xl:h-[240px]">
        {/* Gradient Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40 z-10"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stallData.image} alt={stallData.name} className="w-full h-full object-cover" />
        
        {/* Floating Actions */}
        <div className="absolute top-4 xl:top-6 left-4 xl:left-8 right-4 xl:right-8 flex justify-between items-center z-20">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md text-gray-800 hover:bg-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-3">
            <button 
              onClick={toggleFavorite}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white transition-colors"
            >
              <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-800"} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md text-gray-800 hover:bg-white transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto">
        
        {/* Overlapping Info Card (Zomato/Swiggy style) */}
        <div className="px-4 sm:px-6 xl:px-0">
          <div className="relative -mt-10 bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-20 mb-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h1 className="text-[22px] font-black text-gray-900 leading-tight mb-1">{stallData.name}</h1>
                <p className="text-gray-500 text-sm line-clamp-1">{stallData.address}</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-green-700 text-white rounded-lg px-2 py-1.5 shadow-sm">
                <div className="flex items-center gap-1 font-bold text-sm">
                  {stallData.rating} <Star size={12} className="fill-white text-white" />
                </div>
                <div className="w-full h-[1px] bg-white/30 my-0.5"></div>
                <span className="text-[9px] font-medium uppercase tracking-wider">{stallData.rating_count || '120'} RATINGS</span>
              </div>
            </div>

            <div className="w-full h-[1px] border-t border-dashed border-gray-200 my-3"></div>

            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-1.5 text-gray-700">
                <Clock size={16} className={stallData.isOpen ? "text-green-600" : "text-red-500"} />
                <span className={stallData.isOpen ? "text-gray-800" : "text-red-500 font-bold"}>
                  {stallData.isOpen ? `Open • ${stallData.openingTime || '09:00 AM'} - ${stallData.closingTime || '10:00 PM'}` : `Closed`}
                </span>
              </div>
              {stallData.prep_time && (
                <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <span className="font-bold">{stallData.prep_time}-{stallData.prep_time + 5} mins</span> delivery
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Chips (Sticky) */}
        <div className="sticky top-0 z-30 bg-gray-50 pt-2 pb-3 px-4 sm:px-6 xl:px-0">
          <div className="flex overflow-x-auto gap-3 scrollbar-hide pb-2">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-bold border transition-all ${
                  activeCategory === cat 
                    ? "bg-gray-800 text-white border-gray-800 shadow-md" 
                    : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu List */}
        <div className="space-y-6 min-h-[400px] bg-white px-4 py-2 sm:px-6 xl:px-0 rounded-t-3xl">
          {items.length === 0 && !isLoading && (
            <div className="flex justify-center items-center h-40">
               <Loader2 className="animate-spin text-primary" size={30} />
            </div>
          )}
          
          {categoriesToRender.map(cat => {
            const currentItems = items.filter(item => item.category === cat && (!isVegMode || item.isVeg));
            if (currentItems.length === 0) return null;

            return (
              <div key={cat} className="pt-4">
                <div className="mb-4">
                  <h2 className="text-xl font-black text-gray-900">{cat}</h2>
                </div>
                
                <div className="flex flex-col">
                  <AnimatePresence>
                    {currentItems.map(item => {
                      const qty = cart.stallId === stallId ? (cart.items.find(i => i.id === item.id.toString())?.quantity || 0) : 0;
                      
                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          key={item.id} 
                          className={`flex gap-4 py-6 border-b border-gray-100 last:border-b-0 ${item.isSoldOut ? "opacity-60 grayscale-[0.2]" : ""}`}
                        >
                          {/* Left Info */}
                          <div className="flex-1 flex flex-col justify-start pr-2">
                            <div className="flex items-center gap-2 mb-1">
                              {item.isVeg ? <VegIcon /> : <NonVegIcon />}
                            </div>
                            <h3 className="font-bold text-gray-800 text-[17px] leading-tight mb-1">{item.name}</h3>
                            <p className="font-bold text-gray-900 text-[15px] mb-2">₹{Number(item.price) + itemMarkup}</p>
                            <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>
                          
                          {/* Right Image & Action */}
                          <div className="relative shrink-0 flex flex-col items-center w-[130px]">
                            <div className="w-[130px] h-[130px] rounded-2xl overflow-hidden bg-gray-50 shadow-sm border border-gray-100 relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              
                              <button 
                                 onClick={(e) => toggleItemFavorite(item.id, e)}
                                 className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm transition-transform active:scale-95"
                              >
                                 <Heart size={14} className={itemFavorites.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                              </button>
                            </div>
                            
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24">
                              {item.isSoldOut || !stallData?.isOpen ? (
                                <div className="w-full py-2 bg-white text-gray-500 shadow-[0_3px_8px_rgba(0,0,0,0.12)] border border-gray-200 text-[11px] font-black text-center rounded-xl uppercase tracking-wider">
                                  {!stallData?.isOpen ? "Closed" : "Sold Out"}
                                </div>
                              ) : qty === 0 ? (
                                <button 
                                  onClick={() => handleUpdateCartLocal(item, 1)}
                                  className="w-full py-2 bg-white text-green-700 shadow-[0_3px_8px_rgba(0,0,0,0.12)] border border-gray-100 font-black text-[15px] text-center rounded-xl uppercase hover:bg-gray-50 transition-colors"
                                >
                                  ADD
                                </button>
                              ) : (
                                <div className="flex items-center justify-between w-full h-10 bg-white text-green-700 font-black text-lg rounded-xl shadow-[0_3px_8px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
                                  <button onClick={() => stallData?.is_open && handleUpdateCartLocal(item, -1)} className="w-1/3 h-full flex justify-center items-center hover:bg-green-50 text-gray-600"><Minus size={16} /></button>
                                  <span className="text-[15px]">{qty}</span>
                                  <button onClick={() => stallData?.is_open && handleUpdateCartLocal(item, 1)} className="w-1/3 h-full flex justify-center items-center hover:bg-green-50"><Plus size={16} /></button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[84px] xl:bottom-6 left-0 right-0 z-40 px-4 sm:px-6 xl:px-0 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-between bg-green-600 text-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
              <div className="flex items-center gap-3">
                <ShoppingBag size={24} className="opacity-90" />
                <div className="flex flex-col">
                  <span className="font-bold text-[15px]">{cartItemCount} item{cartItemCount > 1 ? 's' : ''} added</span>
                  <span className="text-xs font-medium opacity-90">₹{cartTotal} total</span>
                </div>
              </div>
              <Link href="/cart" className="font-bold text-sm bg-white text-green-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 shadow-sm transition-colors uppercase tracking-wide">
                View Cart
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StallDetail() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <StallDetailContent />
    </Suspense>
  )
}
