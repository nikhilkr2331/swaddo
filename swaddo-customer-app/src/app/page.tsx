"use client";

import { MapPin, ChevronDown, Bell, Search, Star, Clock, Mic, Percent, User, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { io } from "socket.io-client";
import LocationSelector from "@/components/LocationSelector";
import { useLocation } from "@/context/LocationContext";
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
  const [pureVegRestaurantsOnly, setPureVegRestaurantsOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { currentLocation, latitude, longitude, isLocationLoading } = useLocation();

  // Setup SWR fetcher
  const fetcher = (url: string) => api.get(url).then(res => res.data);
  const { data: stallsData, mutate: mutateStalls, isLoading } = useSWR(
    latitude && longitude ? `/stalls?lat=${latitude}&lng=${longitude}&vegOnly=${pureVegRestaurantsOnly}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const favs = JSON.parse(localStorage.getItem("swaddo_favorites") || "[]");
      setFavorites(favs.map((f: any) => f.id));
      
      const savedPureVeg = localStorage.getItem("swaddo_veg_restaurants_only") === "true";
      setPureVegRestaurantsOnly(savedPureVeg);
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

  const searchPlaceholderItems = useMemo(() => {
    if (isVegMode) {
      return ["Paneer Tikka", "Veg Pizza", "Chole Bhature", "Masala Dosa", "Veg Burger", "Sweets", "North Indian"];
    }
    return ["Biryani", "Pizza", "Burger", "Cake", "Chicken", "Rolls", "North Indian"];
  }, [isVegMode]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholderItems.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [searchPlaceholderItems]);
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
    <div className="flex flex-col min-h-screen pb-24 bg-bg-main app-scroll-container">
      
      {/* Header Area (Mobile Only) */}
      <div className="bg-primary px-4 pt-2 pb-2 xl:hidden sticky top-0 z-[60] shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          
          {/* Top Row: Logo, Location & Bell */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-white p-0.5 shadow-sm">
                <Image src="/icon.svg" alt="Logo" width={32} height={32} className="object-cover rounded-full" />
              </div>
              <LocationSelector customTrigger={(onClick) => (
                <div className="flex flex-col flex-1 truncate cursor-pointer active:opacity-70 transition-opacity" onClick={onClick}>
                   <div className="flex items-center gap-1">
                      <MapPin size={13} className="text-white fill-white/20" />
                      <span className="font-heading font-extrabold text-white text-sm tracking-tight leading-none">Home</span>
                      <ChevronDown size={13} className="text-white/80" />
                   </div>
                   <span className="text-[10px] text-white/90 font-medium truncate pr-4 leading-tight mt-0.5">
                      {formatAddress(currentLocation || (isLocationLoading ? "Fetching location..." : "Location not set"))}
                   </span>
                </div>
              )} />
            </div>
            
            <button onClick={() => router.push("/profile")} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white relative hover:bg-white/10 transition-colors bg-black/10 shadow-sm shrink-0">
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-yellow-400 rounded-full border border-primary"></span>
            </button>
          </div>

          {/* Search Bar & Veg Toggle */}
          <div className="flex items-center gap-1.5">
            <div className="relative group flex-1 bg-white rounded-[14px] shadow-inner h-[34px] cursor-text overflow-hidden" onClick={() => router.push("/search")}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="text-primary group-focus-within:text-primary-hover transition-colors" size={16} />
              </div>
              <div className="absolute inset-0 pl-9 pr-9 flex items-center pointer-events-none overflow-hidden">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={placeholderIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex items-center whitespace-nowrap absolute"
                  >
                    <span className="text-[13px] font-medium text-gray-500">Search for &quot;</span>
                    <span className="text-[13px] font-bold text-gray-700 ml-1">{searchPlaceholderItems[placeholderIndex]}</span>
                    <span className="text-[13px] font-medium text-gray-500">&quot;...</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="absolute inset-y-0 right-0 pr-1 flex items-center z-10">
                 <button onClick={(e) => { e.stopPropagation(); router.push("/search"); }} className="p-1.5 text-primary rounded-lg transition-colors">
                   <Mic size={16} />
                 </button>
              </div>
            </div>
            
            {/* Veg Toggle Filter */}
            <div 
               onClick={(e) => { e.stopPropagation(); toggleVegMode(); }}
               className="flex items-center gap-1 px-2 h-[34px] rounded-[14px] border border-white/20 bg-black/10 cursor-pointer group shadow-sm transition-all shrink-0"
             >
               <span className={`text-[9px] font-black tracking-wider transition-colors ${isVegMode ? 'text-green-400' : 'text-white'}`}>VEG</span>
               <div className={`w-5 h-3 rounded-full p-0.5 flex items-center transition-colors ${isVegMode ? 'bg-green-500' : 'bg-white/30'}`}>
                 <div className={`w-2 h-2 bg-white rounded-full shadow-sm transform transition-transform ${isVegMode ? 'translate-x-2' : 'translate-x-0'}`}></div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 xl:px-8 max-w-7xl mx-auto w-full mt-4">

        {/* Auto-sliding Banner Carousel */}
        <div className="w-[calc(100%+16px)] -mx-2 relative overflow-hidden rounded-[24px] shadow-sm" style={{ height: '240px' }}>
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

        {/* Sticky Section for Categories and Restaurants Header */}
        <div className="sticky top-[90px] sm:top-[75px] z-[50] bg-bg-main -mx-4 px-4 xl:-mx-8 xl:px-8 pb-3 mb-4">
          
          {/* Categories: "What's on your mind?" */}
          <div className="pt-2 pb-2 border-b border-gray-100/50">
            <div className="flex flex-col mb-3">
               <h2 className="text-[20px] font-heading font-black text-gray-900 tracking-tight leading-none">Craving something? 🤤</h2>
               <span className="text-[#e23744] text-[10px] font-bold tracking-widest uppercase mt-1">Pick a category to explore</span>
            </div>
            
            <div className="flex overflow-x-auto gap-3 pb-1 no-scrollbar snap-x snap-mandatory -mx-4 px-4 xl:-mx-8 xl:px-8">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group outline-none snap-start"
                >
                  <div className={`rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ${
                    activeCategory === cat.name ? "border-[2px] border-[#e23744]" : "border-[2px] border-transparent"
                  }`}>
                    <div className="relative w-[70px] h-[70px] sm:w-[78px] sm:h-[78px] rounded-full overflow-hidden bg-gray-50 shadow-inner">
                      <Image src={cat.image} alt={cat.name} fill sizes="84px" className="object-cover" />
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold text-center leading-tight transition-colors ${
                    activeCategory === cat.name ? "text-[#e23744]" : "text-gray-600 group-hover:text-gray-900"
                  }`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stalls List Header */}
          <div className="flex justify-between items-center py-2 mt-1">
            <h2 className="text-[18px] font-heading font-black text-gray-900 tracking-tight">Restaurants to explore</h2>
          </div>
        </div>

        {/* Stalls List */}
        <div>

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
                  <div className={`flex flex-col bg-white rounded-[24px] shadow-native overflow-hidden border border-transparent hover:border-gray-100 hover:shadow-native-lg transition-all duration-300 ${!stall.available ? "opacity-70 grayscale-[0.3]" : ""}`}>
                    
                    {/* Image Section */}
                    <div className="relative h-[200px] sm:h-48 w-full shrink-0 overflow-hidden">
                      <Image src={stall.image} alt={stall.name} fill sizes="(max-width: 768px) 100vw, (maxwidth: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      
                      {/* Gradient Overlay for Offer text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {!stall.available && (
                          <span className="bg-white/95 text-red-600 text-[10px] font-extrabold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                            Closed Now
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                         <button 
                           onClick={(e) => toggleFavorite(stall, e)}
                           className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-gray-800 hover:bg-white hover:text-red-500 transition-all active:scale-95 z-20 relative"
                         >
                           <Heart size={16} className={favorites.includes(stall.id) ? "fill-red-500 text-red-500" : "text-white drop-shadow-md"} />
                         </button>
                      </div>

                      {/* Offer Text (Zomato/Swiggy style huge text at bottom of image) */}
                      {stall.active_offer_is_active && stall.active_offer_title && (
                        <div className="absolute bottom-2 left-3 text-white">
                          <span className="font-heading font-black text-[22px] tracking-tight leading-none text-white/95">
                            {stall.active_offer_title.split(' ').slice(0, 2).join(' ')}
                          </span>
                          <span className="block font-bold text-xs text-white/80 uppercase tracking-widest mt-0.5">
                            {stall.active_offer_title.split(' ').slice(2).join(' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4 pt-3 bg-white">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="font-heading font-bold text-[18px] text-gray-900 line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{stall.name}</h3>
                        
                        {/* Rating Pill */}
                        <div className="flex items-center gap-1 bg-green-600 px-1.5 py-0.5 rounded shadow-sm shrink-0 ml-3">
                          <span className="text-[11px] font-bold text-white">{stall.rating}</span>
                          <Star size={10} className="fill-white text-white" />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-gray-500 text-[13px] font-medium mb-1.5">
                        <p className="line-clamp-1 truncate">{stall.category}</p>
                        <p className="shrink-0 ml-2 text-[12px]">{stall.priceForTwo}</p>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-[12px] font-medium gap-1.5">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          <span>{stall.deliveryTime}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span>{stall.distance}</span>
                      </div>
                      
                      {stall.available && (
                         <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                             <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                             </div>
                             <span className="text-[11px] text-gray-500 font-medium">Live tracking available</span>
                         </div>
                      )}
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

