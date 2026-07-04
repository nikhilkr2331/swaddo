"use client";

import { MapPin, ChevronDown, Bell, Search, Star, Clock, Mic, Percent, User, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { io } from "socket.io-client";
import LocationSelector from "@/components/LocationSelector";
import useSWR from "swr";
import { StallCardShimmer } from "@/components/Shimmer";

const categories = [
  { name: "Biryani", image: "/categories/biryani.png" },
  { name: "North Indian", image: "/categories/north_indian.jpg" },
  { name: "Cake", image: "/categories/cake.jpg" },
  { name: "Pizza", image: "/categories/pizza.jpg" },
  { name: "South Indian", image: "/categories/south_indian.jpg" },
  { name: "Desserts", image: "/categories/desserts.jpg" },
  { name: "Chinese", image: "/categories/chinese.jpg" },
  { name: "Noodles", image: "/categories/noodles.jpg" },
  { name: "Ice Cream", image: "/categories/ice_cream.jpg" },
  { name: "Paratha", image: "/categories/paratha.jpg" },
  { name: "Chole Bhature", image: "/categories/chole_bhature.jpg" },
  { name: "Coffee", image: "/categories/coffee.jpg" },
  { name: "Idli", image: "/categories/idli.jpg" },
  { name: "Pastry", image: "/categories/pastry.jpg" },
  { name: "Rolls", image: "/categories/rolls.png" },
  { name: "Burger", image: "/categories/burger.jpg" },
  { name: "Dosa", image: "/categories/dosa.jpg" },
  { name: "Pasta", image: "/categories/pasta.jpg" },
  { name: "Rasgulla", image: "/categories/rasgulla.jpg" },
  { name: "Gulab Jamun", image: "/categories/gulab_jamun.jpg" }
];

const banners = [
  { 
    id: 1, 
    title: "WE ARE LIVE!", 
    subtitle: "Lowest Price Guarantee", 
    image: "/categories/momos.png",
    brand: "SWADDO",
    ribbon: "GRAND OPENING",
    badge: "LAUNCHED IN OUR 1ST CITY",
    smallText: "BIHAR SHARIF KI APNA FOOD APP"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const getDummyOffer = (id: string) => {
  const num = parseInt(id) || 1;
  if (num % 3 === 0) return "60% OFF up to ₹120";
  if (num % 2 === 0) return "FREE DELIVERY";
  return "₹100 OFF above ₹299";
};

const getDummyTags = (id: string) => {
  const num = parseInt(id) || 1;
  const cuisines = [
    "North Indian, Biryani",
    "South Indian, Dosa",
    "Fast Food, Burgers",
    "Desserts, Bakery",
    "Chinese, Noodles",
    "Pizzas, Italian"
  ];
  return cuisines[num % cuisines.length];
};

const formatAddress = (address: string) => {
  if (!address || address === "Not Set") return "Location not set";
  // Remove plus codes (e.g., "6G3X+38F, " or "6G38+WJF, ")
  let cleanAddress = address.replace(/^[A-Z0-9\+]+\,\s*/, '');
  const parts = cleanAddress.split(',');
  if (parts.length >= 2) {
    return `${parts[0].trim()}, ${parts[1].trim()}`;
  }
  return cleanAddress;
};

export default function Home() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Biryani");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isVegMode, setIsVegMode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState({ lat: 25.611, lng: 85.130, ready: false });

  // Setup SWR fetcher
  const fetcher = (url: string) => api.get(url).then(res => res.data);
  const { data: stallsData, mutate: mutateStalls, isLoading } = useSWR(
    userLocation.ready ? `/stalls?lat=${userLocation.lat}&lng=${userLocation.lng}&vegOnly=${isVegMode}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const favs = JSON.parse(localStorage.getItem("swaddo_favorites") || "[]");
      setFavorites(favs.map((f: any) => f.id));
    }
  }, []);

  const toggleFavorite = (stall: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof window === "undefined") return;
    
    const favs = JSON.parse(localStorage.getItem("swaddo_favorites") || "[]");
    const isFav = favorites.includes(stall.id);
    
    if (isFav) {
      const newFavs = favs.filter((f: any) => f.id !== stall.id);
      localStorage.setItem("swaddo_favorites", JSON.stringify(newFavs));
      setFavorites(favorites.filter(id => id !== stall.id));
    } else {
      const stallSummary = {
        id: stall.id,
        name: stall.name,
        address: stall.address,
        rating: stall.rating,
        image: stall.image,
        category: stall.category
      };
      favs.push(stallSummary);
      localStorage.setItem("swaddo_favorites", JSON.stringify(favs));
      setFavorites([...favorites, stall.id]);
    }
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Attempt to get user location for accurate distance, otherwise default
    let lat = 25.611;
    let lng = 85.130;
    
    if (typeof window !== 'undefined') {
       const savedLoc = localStorage.getItem("swaddo_location");
       if (savedLoc) {
         try {
           const parsed = JSON.parse(savedLoc);
           if (parsed.lat && parsed.lng) {
             lat = parsed.lat;
             lng = parsed.lng;
           }
        } catch(e) {}
      }
      setIsVegMode(localStorage.getItem("swaddo_veg_restaurants_only") === "true");
      setUserLocation({ lat, lng, ready: true });
    }
  }, []);

  // Process stalls from SWR cache
  const stalls = useMemo(() => {
    return stallsData?.data ? stallsData.data.map((s: any) => {
      let dist = s.distance ? parseFloat(s.distance) : (1 + (parseInt(s.id) % 5));
      if (!s.location || s.location === "Not Set") dist = 0;
      const travelTime = Math.round(dist * 5); // 5 mins per km roughly
      const prepTime = s.prep_time || 15;
      const totalDeliveryTime = travelTime + prepTime;

      return {
        id: s.id.toString(),
        name: s.name,
        address: s.location,
        rating: s.rating,
        ratingsCount: s.rating_count ? `${s.rating_count} RATINGS` : "120+ RATINGS",
        time: `${s.opening_time || '09:00 AM'} - ${s.closing_time || '10:00 PM'}`,
        category: s.tags || "North Indian, Biryani", 
        available: s.is_open,
        image: s.cover_image || `https://picsum.photos/seed/${s.id}/400/250`,
        offer: s.offer_text || "",
        priceForTwo: `₹${(parseInt(s.id) % 3 + 1) * 150} for one`,
        deliveryTime: `${totalDeliveryTime} mins`,
        distance: `${dist.toFixed(1)} km`
      };
    }) : [];
  }, [stallsData]);

  useEffect(() => {
    // 2. Setup live socket listener for real-time updates
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL; if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, ""); const socket = io(socketUrl || "http://localhost:5005", { transports: ["websocket"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 5000 });
    socket.on("stall_update", (updatedStall) => {
      mutateStalls((currentData: any) => {
        if (!currentData || !currentData.data) return currentData;
        const prev = currentData.data;
        const index = prev.findIndex((s: any) => s.id == updatedStall.id);
        if (index !== -1) {
          const newData = [...prev];
          newData[index] = { ...newData[index], ...updatedStall };
          return { ...currentData, data: newData };
        }
        return currentData;
      }, false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const toggleVegMode = () => {
    const newVal = !isVegMode;
    setIsVegMode(newVal);
    localStorage.setItem("swaddo_veg_mode", newVal ? "true" : "false");
  };

  useEffect(() => {
    const savedVegMode = localStorage.getItem("swaddo_veg_mode") === "true";
    setIsVegMode(savedVegMode);
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gray-50">
      
      {/* Header Area (Mobile Only) */}
      <div className="bg-white px-4 pt-3 pb-3 shadow-sm rounded-b-2xl xl:hidden sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          
          {/* Top Row: Logo, Location & Bell */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-black font-heading text-lg shadow-md shrink-0">
                S
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <LocationSelector isMobile={true} />
            </div>
            
            <button onClick={() => router.push("/notifications")} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 relative hover:bg-gray-50 transition-colors bg-white shadow-sm shrink-0">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-primary group-focus-within:text-primary-hover transition-colors" size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Restaurant name or a dish..." 
              onClick={() => router.push("/search")}
              className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 pl-10 pr-24 text-[13px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
               
               {/* Veg Toggle */}
               <div 
                 onClick={(e) => { e.stopPropagation(); toggleVegMode(); }}
                 className="flex items-center gap-1.5 px-2 cursor-pointer group"
               >
                 <span className={`text-[10px] font-black tracking-wider transition-colors ${isVegMode ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`}>VEG</span>
                 <div className={`w-6 h-3.5 rounded-full p-0.5 flex items-center transition-colors ${isVegMode ? 'bg-green-600' : 'bg-gray-300'}`}>
                   <div className={`w-2.5 h-2.5 bg-white rounded-full shadow-sm transform transition-transform ${isVegMode ? 'translate-x-2.5' : 'translate-x-0'}`}></div>
                 </div>
               </div>

               <div className="w-px h-4 bg-gray-200 mx-0.5"></div>

               <button onClick={() => router.push("/search")} className="p-2 text-primary hover:bg-red-50 rounded-xl transition-colors">
                 <Mic size={18} />
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 xl:px-8 max-w-7xl mx-auto w-full mt-2">

        {/* Auto-sliding Banner Carousel */}
        <div className="w-[calc(100%+16px)] -mx-2 relative overflow-hidden rounded-[24px] shadow-sm mb-3" style={{ height: '240px' }}>
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full" 
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="w-full h-full flex-shrink-0 relative overflow-hidden bg-gray-900">
                <Image src={banner.image} alt={banner.title} fill sizes="(max-width: 1200px) 100vw, 1200px" className="object-cover opacity-70 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
                
                {/* Optional Ribbon */}
                {banner.ribbon && (
                  <div className="absolute top-6 -right-10 w-40 text-center rotate-45 bg-red-600 text-white font-black text-[10px] tracking-widest uppercase py-1.5 shadow-lg z-20">
                    {banner.ribbon}
                  </div>
                )}
                
                <div className="absolute inset-0 p-6 flex flex-col justify-center w-3/4 sm:w-2/3">
                  {banner.badge && (
                    <div className="w-max bg-white/20 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md mb-1.5 border border-white/30 shadow-sm">
                      {banner.badge}
                    </div>
                  )}
                  {banner.brand && (
                    <span className="text-primary font-heading font-black text-lg sm:text-xl tracking-widest uppercase drop-shadow-md">
                      {banner.brand}
                    </span>
                  )}
                  {banner.smallText && (
                    <span className="text-yellow-400 font-bold text-[10px] sm:text-xs tracking-wider uppercase mb-1 drop-shadow-sm">
                      {banner.smallText}
                    </span>
                  )}
                  <h3 className="font-heading font-extrabold text-3xl sm:text-4xl mb-1 text-white uppercase tracking-tight">{banner.title}</h3>
                  <p className="font-medium text-white/90 text-sm sm:text-base mb-4 drop-shadow-sm">{banner.subtitle}</p>
                  <button className="bg-primary hover:bg-primary-hover text-white font-bold text-sm px-6 py-2.5 rounded-xl w-max shadow-[0_4px_14px_rgba(226,64,28,0.4)] transition-transform active:scale-95">
                    ORDER NOW
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {banners.map((_, idx) => (
                <button 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all ${idx === currentBannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                  onClick={() => setCurrentBannerIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Categories: "What's on your mind?" */}
        <div className="sticky top-[108px] sm:top-[110px] z-40 bg-gray-50 pt-1 pb-0 -mx-4 px-4 xl:-mx-8 xl:px-8 mb-0">
          <div className="flex flex-col mb-2.5">
            <h2 className="text-[22px] font-heading font-black text-gray-900 tracking-tight leading-none">Craving something? 🤤</h2>
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider mt-1.5">Pick a category to explore</p>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pt-2 pb-0 -mx-4 px-4 xl:-mx-8 xl:px-8 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className="flex flex-col items-center gap-2 shrink-0 group outline-none w-[72px]"
              >
                <div className={`relative w-[72px] h-[72px] shrink-0 rounded-full overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ${
                  activeCategory === cat.name ? "ring-[3px] ring-primary ring-offset-2" : "ring-1 ring-gray-200"
                }`}>
                  <Image src={cat.image} alt={cat.name} fill sizes="72px" className="object-cover" />
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight transition-colors ${
                  activeCategory === cat.name ? "text-primary" : "text-gray-500 group-hover:text-gray-900"
                }`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stalls List */}
        <div>
          <div className="sticky top-[272px] sm:top-[274px] z-30 bg-gray-50 pt-2.5 pb-2.5 -mx-4 px-4 xl:-mx-8 xl:px-8 mb-4 border-t border-b border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <h2 className="text-lg font-heading font-black text-gray-900 tracking-tight">Restaurants to explore</h2>
          </div>

          <motion.div 
            className="flex flex-col gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
             {!stallsData && isLoading ? (
              // Skeleton Loaders
              Array.from({ length: 4 }).map((_, i) => (
                <StallCardShimmer key={i} />
              ))
            ) : stalls.filter((stall: any) => stall.category.toLowerCase().includes(activeCategory.toLowerCase())).length === 0 ? (
              <div className="col-span-full py-10 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                   <Search className="text-gray-400" size={32} />
                </div>
                <h3 className="font-heading font-black text-xl text-gray-800 mb-1">No restaurants found</h3>
                <p className="text-gray-500 font-medium text-sm max-w-[250px]">We couldn't find any places serving {activeCategory} right now. Try exploring other categories!</p>
              </div>
            ) : (
              stalls
                .filter((stall: any) => stall.category.toLowerCase().includes(activeCategory.toLowerCase()))
                .map((stall: any) => (
              <motion.div key={stall.id} variants={itemVariants} whileTap={{ scale: 0.98 }}>
                <Link href={`/stall?id=${stall.id}`} className="block group">
                  <div className={`flex flex-col bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/40 overflow-hidden ${!stall.available ? "opacity-70 grayscale-[0.3]" : ""}`}>
                    
                    {/* Image Section */}
                    <div className="relative h-48 sm:h-44 w-full shrink-0 overflow-hidden rounded-t-3xl">
                      <Image src={stall.image} alt={stall.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      
                      {/* Gradient Overlay for Offer text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {!stall.available && (
                          <span className="bg-white/90 backdrop-blur-sm text-red-600 text-[10px] font-extrabold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                            Closed Now
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                         <button 
                           onClick={(e) => toggleFavorite(stall, e)}
                           className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-md border border-white/60 flex items-center justify-center text-gray-800 hover:bg-white hover:text-red-500 transition-all active:scale-95 shadow-sm z-20 relative"
                         >
                           <Heart size={16} className={favorites.includes(stall.id) ? "fill-red-500 text-red-500" : "text-white drop-shadow-md"} />
                         </button>
                      </div>

                      {/* Offer Text */}
                      {stall.offer && (
                        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white">
                          <Percent size={18} className="text-blue-300 fill-blue-400 drop-shadow-md" />
                          <span className="font-heading font-extrabold text-xl tracking-tight leading-none drop-shadow-md">
                            {stall.offer}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4 bg-white/70 backdrop-blur-lg">
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-heading font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{stall.name}</h3>
                        
                        {/* Rating Pill */}
                        <div className="flex flex-col items-center shrink-0 ml-3">
                          <div className="flex items-center gap-1 bg-green-700 px-1.5 py-0.5 rounded-md shadow-sm mb-0.5">
                            <span className="text-xs font-bold text-white">{stall.rating}</span>
                            <Star size={10} className="fill-white text-white" />
                          </div>
                          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">{stall.ratingsCount}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-gray-500 text-sm font-medium mb-1">
                        <p className="line-clamp-1">{stall.category}</p>
                        <p className="shrink-0 ml-2">{stall.priceForTwo}</p>
                      </div>
                      
                      <p className="text-gray-500 text-xs font-medium mb-2 line-clamp-1">{formatAddress(stall.address)}</p>
                      
                      <div className="flex items-center gap-3 text-gray-500 text-xs font-bold mt-3 pt-3 border-t border-gray-100/60">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          <span>{stall.deliveryTime}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{stall.distance}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                        <span className="text-primary font-bold">Live Tracking</span>
                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
                ))
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}

