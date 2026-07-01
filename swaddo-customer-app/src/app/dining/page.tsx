"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, Search, Star, Users, Calendar, Clock, X, CheckCircle2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 flex flex-col relative overflow-hidden">
      <div className="grayscale opacity-50 pointer-events-none select-none blur-[1px] flex-1">
        {/* Header Area */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm rounded-b-3xl xl:px-8 xl:pt-8 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto flex flex-col gap-5">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black font-heading text-xl shadow-md">
                S
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <LocationSelector isMobile={true} />
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search for restaurants to dine out..." 
              className="w-full bg-gray-100 border border-transparent focus:border-primary/30 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 outline-none transition-all shadow-inner text-sm font-medium"
            />
          </div>
        </div>
      </div>

      <div className="px-4 xl:px-8 max-w-7xl mx-auto mt-6">
        {/* Promotional Banner */}
        <div className="w-full relative overflow-hidden rounded-[24px] shadow-sm mb-6 h-[200px] sm:h-[240px] bg-gray-900">
          <Image src="/categories/north_indian.jpg" alt="Dining Offer" fill className="object-cover opacity-70 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          
          <div className="absolute inset-0 p-6 flex flex-col justify-center w-3/4 sm:w-2/3">
            <div className="w-max bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 border border-white/30 shadow-sm flex items-center gap-1.5">
              <span>SPECIAL LAUNCH OFFER</span>
            </div>
            <h3 className="font-heading font-extrabold text-3xl sm:text-4xl mb-1 text-white uppercase tracking-tight drop-shadow-md">
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
          <div className="sticky top-[148px] sm:top-[150px] z-40 bg-gray-50 pt-3 pb-3 -mx-4 px-4 xl:-mx-8 xl:px-8 mb-4 border-b border-gray-200">
            <h2 className="text-xl font-heading font-bold text-text-primary">Trending Dining Spots</h2>
          </div>

          <div className="flex flex-col gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
            {diningStalls.map((stall) => (
              <div key={stall.id} className="bg-white rounded-[20px] p-3 flex gap-4 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
                <div className="relative w-28 h-32 rounded-xl overflow-hidden shrink-0">
                  <Image src={stall.image} alt={stall.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent h-1/2"></div>
                  <div className="absolute top-0 left-0 bg-white/20 backdrop-blur-md border-b border-r border-white/30 text-white text-[10px] font-black px-2 py-1 rounded-br-xl shadow-sm">
                    {stall.offer}
                  </div>
                </div>
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-heading font-extrabold text-[17px] text-text-primary leading-tight line-clamp-1">{stall.name}</h3>
                    <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 ml-2">
                      {stall.rating} <Star size={10} className="fill-white" />
                    </div>
                  </div>
                  <span className="text-xs text-text-muted mb-1 font-medium line-clamp-1">{stall.tags.join(" • ")}</span>
                  <span className="text-[10px] font-bold text-green-600 mb-2 bg-green-50 px-1.5 py-0.5 rounded-md w-max border border-green-100">
                    Book without waiting
                  </span>
                  <span className="text-xs text-text-muted mb-auto flex items-center gap-1 font-medium">
                    <MapPin size={12} className="text-primary" /> {stall.distance} • {stall.costForTwo} for two
                  </span>
                  
                  <button 
                    onClick={() => handleBookTable(stall)}
                    className="mt-3 w-full bg-primary/10 text-primary font-bold text-sm py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors border border-primary/20 hover:border-primary active:scale-95"
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
      <div className="fixed inset-0 flex flex-col items-center justify-center z-[70] pointer-events-none pt-10">
        <div className="bg-white/95 backdrop-blur-md px-10 py-8 rounded-[32px] shadow-2xl border border-gray-200 flex flex-col items-center text-center">
           <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5 shadow-inner">
             <span className="text-4xl">🍽️</span>
           </div>
           <h2 className="text-4xl font-heading font-black text-gray-800 mb-3 tracking-tight">Coming Soon</h2>
           <p className="text-sm font-medium text-gray-500 max-w-[240px] leading-relaxed">We are bringing the best dining experiences to Bihar Sharif very soon.</p>
        </div>
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
              className="bg-white w-full sm:w-[450px] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-heading font-extrabold text-lg text-text-primary line-clamp-1 pr-4">Book Table at {selectedStall.name}</h3>
                <button onClick={() => setSelectedStall(null)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-500 shrink-0">
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

