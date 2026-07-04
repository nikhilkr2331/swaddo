"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, Search, Star, Users, Calendar, Clock, X, CheckCircle2, ChevronDown } from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import BottomNav from "@/components/BottomNav";

// Dummy Data
const diningStalls = [
  {
    id: "1",
    name: "The Royal Kitchen",
    location: "Kargil Chowk, Bihar Sharif",
    rating: 4.5,
    distance: "1.2 km",
    costForTwo: "₹800",
    image: "/categories/north_indian.jpg",
    tags: ["Fine Dining", "North Indian"],
    offer: "Flat 10% OFF"
  },
  {
    id: "2",
    name: "Cafe Hangout",
    location: "Ramchandrapur, Bihar Sharif",
    rating: 4.2,
    distance: "2.5 km",
    costForTwo: "₹500",
    image: "/categories/pizza.jpg",
    tags: ["Cafe", "Fast Food", "Italian"],
    offer: "Flat 10% OFF"
  },
  {
    id: "3",
    name: "Spice Symphony",
    location: "Sohsarai, Bihar Sharif",
    rating: 4.7,
    distance: "3.1 km",
    costForTwo: "₹1200",
    image: "/categories/biryani.png",
    tags: ["Family Dining", "Mughlai"],
    offer: "Flat 10% OFF"
  }
];

export default function DiningPage() {
  const [selectedStall, setSelectedStall] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState("Today");
  const [time, setTime] = useState("08:00 PM");

  const handleBookTable = (stall: any) => {
    setSelectedStall(stall);
    setBookingStep(1);
  };

  const searchPlaceholderItems = useMemo(() => ["Fine Dining", "Cafe", "Family Restaurant", "Buffet", "Romantic Dinner"], []);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholderItems.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [searchPlaceholderItems]);

  return (
    <div className="min-h-screen bg-bg-main pb-24 flex flex-col relative overflow-hidden app-scroll-container font-body">
      <div className="grayscale opacity-50 pointer-events-none select-none blur-[1px] flex-1">
      {/* Header Area */}
      <div className="bg-primary px-4 pt-2 pb-2 xl:hidden sticky top-0 z-[60] shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-white p-0.5 shadow-sm">
                <Image src="/icon.svg" alt="Logo" width={32} height={32} className="object-cover rounded-full" />
              </div>
              <LocationSelector customTrigger={(onClick) => (
                <div className="flex flex-col flex-1 truncate cursor-pointer active:opacity-70 transition-opacity" onClick={onClick}>
                   <div className="flex items-center gap-1">
                      <MapPin size={13} className="text-white fill-white/20" />
                      <span className="font-heading font-extrabold text-white text-sm tracking-tight leading-none">Dining</span>
                      <ChevronDown size={13} className="text-white/80" />
                   </div>
                   <span className="text-[10px] text-white/90 font-medium truncate pr-4 leading-tight mt-0.5">
                      Bihar Sharif, Bihar
                   </span>
                </div>
              )} />
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-1.5">
            <div className="relative group flex-1 bg-white rounded-[14px] shadow-inner h-[34px] cursor-text overflow-hidden">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="text-primary group-focus-within:text-primary-hover transition-colors" size={16} />
              </div>
              <div className="absolute inset-0 pl-9 pr-4 flex items-center pointer-events-none overflow-hidden">
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
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 xl:px-8 max-w-7xl mx-auto mt-6">
        {/* Promotional Banner */}
        <div className="w-full relative overflow-hidden rounded-[32px] shadow-native border border-transparent mb-6 h-[200px] sm:h-[240px] bg-gray-900">
          <Image src="/categories/north_indian.jpg" alt="Dining Offer" fill className="object-cover opacity-70 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          
          <div className="absolute inset-0 p-6 flex flex-col justify-center w-3/4 sm:w-2/3">
            <div className="w-max bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-[8px] mb-2 border border-white/30 shadow-sm flex items-center gap-1.5">
              <span>SPECIAL LAUNCH OFFER</span>
            </div>
            <h3 className="font-heading font-black text-3xl sm:text-4xl mb-1 text-white uppercase tracking-tight drop-shadow-md">
              Flat 10% OFF
            </h3>
            <p className="font-medium text-white/90 text-sm sm:text-base drop-shadow-sm mb-3">
              On your first 3 dining bookings in Bihar Sharif!
            </p>
            <span className="text-[11px] sm:text-xs font-bold text-yellow-400 bg-black/40 px-3 py-1.5 rounded-lg w-max border border-yellow-400/30 backdrop-blur-sm">
              Book without waiting
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 pb-2 -mx-4 px-4 xl:mx-0 xl:px-0">
          {["Nearest", "Rating 4.0+", "Pure Veg", "Outdoor Seating", "Romantic", "Family Friendly"].map(filter => (
            <button key={filter} className="shrink-0 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-primary hover:text-primary transition-colors shadow-sm whitespace-nowrap">
              {filter}
            </button>
          ))}
        </div>

        <div className="w-full h-px bg-gray-200 mb-6"></div>

        {/* Restaurants List */}
        <div>
          <div className="sticky top-[148px] sm:top-[150px] z-40 bg-bg-main/90 backdrop-blur-md pt-4 pb-3 -mx-4 px-4 xl:-mx-8 xl:px-8 mb-4 border-b border-border-subtle/50">
            <h2 className="text-[18px] font-heading font-black text-text-primary uppercase tracking-tight">Trending Dining Spots</h2>
          </div>

          <div className="flex flex-col gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
            {diningStalls.map((stall) => (
              <div key={stall.id} className="bg-white rounded-[24px] p-4 flex gap-4 shadow-native border border-transparent relative overflow-hidden transition-all hover:scale-[1.02]">
                <div className="relative w-[110px] h-[130px] rounded-[16px] overflow-hidden shrink-0">
                  <Image src={stall.image} alt={stall.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent h-1/2"></div>
                  <div className="absolute top-0 left-0 bg-white/20 backdrop-blur-md border-b border-r border-white/30 text-white text-[10px] font-black px-2 py-1 rounded-br-[12px] shadow-sm uppercase tracking-wide">
                    {stall.offer}
                  </div>
                </div>
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-heading font-black text-[17px] text-text-primary leading-tight line-clamp-1">{stall.name}</h3>
                    <div className="bg-green-700 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-[6px] flex items-center gap-0.5 shrink-0 ml-2 shadow-sm">
                      {stall.rating} <Star size={10} className="fill-white" />
                    </div>
                  </div>
                  <span className="text-[12px] text-text-muted mb-1.5 font-bold line-clamp-1">{stall.tags.join(" • ")}</span>
                  <span className="text-[10px] font-black text-green-700 mb-2.5 bg-green-50 px-2 py-1 rounded-[8px] w-max border border-green-100 uppercase tracking-widest">
                    Book without waiting
                  </span>
                  <span className="text-[12px] text-gray-500 mb-auto flex items-center gap-1 font-bold">
                    <MapPin size={14} className="text-primary" /> {stall.distance} • {stall.costForTwo} for two
                  </span>
                  
                  <button 
                    onClick={() => handleBookTable(stall)}
                    className="mt-3.5 w-full bg-primary/10 text-primary font-black text-[14px] py-2.5 rounded-[12px] hover:bg-primary hover:text-white transition-colors active:scale-95 uppercase tracking-wide border border-primary/20"
                  >
                    Book Table
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="fixed inset-0 flex flex-col items-center justify-center z-[70] pointer-events-none pt-6 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="bg-white/70 backdrop-blur-3xl px-6 py-6 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 flex flex-col items-center text-center relative overflow-hidden max-w-[280px] w-full before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:pointer-events-none"
        >
           <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
           <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl pointer-events-none"></div>
           
           <div className="w-16 h-16 bg-gradient-to-tr from-primary to-orange-400 rounded-[20px] rotate-3 shadow-xl flex items-center justify-center mb-5 relative z-10">
             <div className="absolute inset-0 bg-white/20 rounded-[20px] backdrop-blur-sm -rotate-6 scale-105 -z-10"></div>
             <span className="text-3xl drop-shadow-md">🥂</span>
           </div>
           
           <h2 className="text-2xl font-heading font-black text-gray-900 mb-2 tracking-tight relative z-10 leading-tight">
             Coming <br/><span className="text-primary">Very Soon</span>
           </h2>
           
           <p className="text-xs font-semibold text-gray-600 leading-relaxed mb-5 relative z-10 px-1">
             We're bringing the best dining experiences to Bihar Sharif! Get ready to explore top restaurants and book tables easily.
           </p>
           
           <div className="bg-black/5 rounded-xl p-3 w-full border border-black/5 relative z-10 flex flex-col gap-0.5 shadow-inner">
             <span className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Stay tuned</span>
             <span className="text-xs font-bold text-gray-800">Exclusive perks await</span>
             <span className="text-[10px] font-semibold text-gray-500">Don't miss out on our launch!</span>
           </div>
        </motion.div>
      </div>

      <BottomNav />

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedStall && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-bg-main w-full sm:w-[450px] rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_-12px_40px_rgba(0,0,0,0.1)]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-10">
                <h3 className="font-heading font-black text-[18px] text-text-primary line-clamp-1 pr-4 uppercase tracking-tight">Book Table at {selectedStall.name}</h3>
                <button onClick={() => setSelectedStall(null)} className="p-2 bg-gray-50 rounded-full shadow-sm hover:bg-gray-100 text-gray-500 shrink-0 active:scale-90 transition-transform">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
                {bookingStep === 1 ? (
                  <div className="space-y-6">
                    {/* Offer Banner */}
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex gap-3 items-center shadow-sm">
                      <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0"><Star size={20} className="fill-red-600" /></div>
                      <div>
                        <p className="font-bold text-sm text-red-700">10% OFF applied!</p>
                        <p className="text-[11px] font-medium text-red-600/90 mt-0.5">Valid on your first 3 bookings at Swaddo Dining.</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-text-primary mb-3 flex items-center gap-2"><Users size={16} className="text-gray-400" /> Number of Guests</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {[1, 2, 3, 4, 5, "6+"].map(num => (
                          <button 
                            key={num}
                            onClick={() => setGuests(typeof num === 'number' ? num : 6)}
                            className={`w-11 h-11 shrink-0 rounded-full font-bold flex items-center justify-center border-2 transition-all ${guests === (typeof num === 'number' ? num : 6) ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-text-primary mb-3 flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> Select Date</h4>
                      <div className="flex gap-3">
                        {["Today", "Tomorrow"].map(d => (
                          <button 
                            key={d}
                            onClick={() => setDate(d)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${date === d ? 'bg-primary/10 text-primary border-primary' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-text-primary mb-3 flex items-center gap-2"><Clock size={16} className="text-gray-400" /> Select Time</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {["07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM"].map(t => (
                          <button 
                            key={t}
                            onClick={() => setTime(t)}
                            className={`py-2.5 rounded-xl font-bold text-xs border-2 transition-all ${time === t ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setBookingStep(2)}
                      className="w-full bg-primary text-white font-extrabold text-base py-4 rounded-xl shadow-lg mt-4 active:scale-95 transition-transform"
                    >
                      Confirm Booking
                    </button>
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2 shadow-sm"
                    >
                      <CheckCircle2 size={40} className="text-green-600" />
                    </motion.div>
                    <h3 className="font-heading font-extrabold text-2xl text-text-primary">Booking Confirmed!</h3>
                    <p className="text-sm font-medium text-text-muted px-4 leading-relaxed">
                      Your table for <strong className="text-gray-800">{guests}</strong> at <strong className="text-gray-800">{selectedStall.name}</strong> is confirmed for <strong className="text-gray-800">{date} at {time}</strong>.
                    </p>
                    <div className="bg-green-50 text-green-700 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border border-green-200 mt-4 shadow-sm w-full max-w-[280px]">
                      10% OFF will be applied to your final bill!
                    </div>
                    <button 
                      onClick={() => { setSelectedStall(null); setBookingStep(1); }}
                      className="mt-6 font-bold text-primary hover:underline px-4 py-2"
                    >
                      Back to Dining
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

