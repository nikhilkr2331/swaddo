"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search as SearchIcon, Mic, Clock, TrendingUp, X, MapPin, Star, Percent, Plus, Minus, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";

const popularCuisines = ["North Indian", "Chinese", "South Indian", "Biryani", "Desserts", "Burgers"];

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

export default function Search() {
  const router = useRouter();
  const { cart, updateQuantity } = useCart();
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [SpeechRec, setSpeechRec] = useState<any>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewState, setViewState] = useState<'empty' | 'typing' | 'results'>('empty');
  const [searchType, setSearchType] = useState<'dish' | 'restaurant'>('dish');
  const [results, setResults] = useState<{ restaurants: any[], dishes: any[] }>({ restaurants: [], dishes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isVegMode, setIsVegMode] = useState(false);
  
  useEffect(() => {
    inputRef.current?.focus();
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechRec(new SpeechRecognition());
      }
      
      const savedSearches = JSON.parse(localStorage.getItem('swaddo_recent_searches') || '[]');
      setRecentSearches(savedSearches);

      const savedVegMode = localStorage.getItem("swaddo_veg_mode") === "true";
      setIsVegMode(savedVegMode);
    }
  }, []);

  useEffect(() => {
    if (!query) {
      setViewState('empty');
      return;
    }
    if (viewState === 'results') return; 
    setViewState('typing');
  }, [query]);

  const saveRecentSearch = (term: string) => {
    let newSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 4);
    setRecentSearches(newSearches);
    localStorage.setItem('swaddo_recent_searches', JSON.stringify(newSearches));
  };

  const executeSearch = async (term: string, type: 'dish' | 'restaurant' = 'dish') => {
    if (!term.trim()) return;
    setQuery(term);
    setSearchType(type);
    saveRecentSearch(term);
    setViewState('results');
    setIsLoading(true);
    
    try {
      const res = await api.get(`/stalls/search/all?q=${encodeURIComponent(term)}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceSearch = () => {
    setIsListening(true);
    if (SpeechRec) {
      SpeechRec.start();
      SpeechRec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        executeSearch(transcript, 'dish');
        setIsListening(false);
      };
      SpeechRec.onerror = () => setIsListening(false);
      SpeechRec.onend = () => setIsListening(false);
    } else {
      setTimeout(() => {
        setQuery("Paneer");
        executeSearch("Paneer", 'dish');
        setIsListening(false);
      }, 2500);
    }
  };

  const handleUpdateCartLocal = (dish: any, delta: number) => {
    updateQuantity(
      dish.stall_id.toString(), 
      dish.stall_name, 
      { id: dish.id.toString(), name: dish.name, price: Number(dish.price), markup: 0, isVeg: dish.is_veg ?? true }, 
      delta
    );
  };

  // Extract all matched restaurants (direct + from dishes)
  const allStallsMap = new Map();
  results.restaurants.forEach(r => allStallsMap.set(r.id, r));
  results.dishes.forEach(d => {
    if (!allStallsMap.has(d.stall_id)) {
      allStallsMap.set(d.stall_id, {
        id: d.stall_id,
        name: d.stall_name,
        location: d.location,
        rating: d.rating,
        rating_count: d.rating_count,
        cover_image: d.stall_image,
        is_open: d.is_open
      });
    }
  });
  const allMatchedStalls = Array.from(allStallsMap.values());

  return (
    <div className="min-h-screen bg-bg-main font-body pb-24 app-scroll-container">
      {/* Header & Search Bar */}
      <div className="sticky top-0 z-30 bg-bg-main/90 backdrop-blur-xl pt-4 pb-4 px-4 sm:px-6 xl:px-8 flex items-center gap-3 border-b border-border-subtle/50">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        
        <div className="flex-1 relative">
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (viewState === 'results') setViewState('typing');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                executeSearch(query, 'dish');
              }
            }}
            placeholder="Search for restaurants and food" 
            className="w-full bg-white border border-transparent rounded-[16px] py-3.5 pl-5 pr-14 text-[14px] font-medium outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
              <X size={16} />
            </button>
          ) : (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 flex items-center pr-1 border-l border-gray-100 pl-2">
              <button onClick={startVoiceSearch} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors active:scale-95">
                 <Mic size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 xl:px-8 mt-6 max-w-3xl mx-auto">
        {viewState === 'empty' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {recentSearches.length > 0 && (
              <>
                <h3 className="font-heading font-black text-[15px] uppercase tracking-tight text-text-primary mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2.5 mb-8">
                  {recentSearches.map(s => (
                    <button key={s} onClick={() => executeSearch(s, 'dish')} className="px-4 py-2 rounded-[12px] border border-gray-200 text-[13px] font-bold text-gray-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors bg-white shadow-sm flex items-center gap-1.5">
                      <SearchIcon size={12} className="text-gray-400" /> {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            <h3 className="font-heading font-black text-[15px] uppercase tracking-tight text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Popular Cuisines
            </h3>
            <div className="flex flex-wrap gap-3">
              {popularCuisines.map(c => (
                <button key={c} onClick={() => executeSearch(c, 'dish')} className="px-4 py-2.5 rounded-[14px] bg-white border border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[13px] font-bold text-gray-700 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all">
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {viewState === 'typing' && (
          <div className="flex flex-col gap-1 bg-white rounded-[24px] p-2 shadow-native border border-transparent">
            <button 
              onClick={() => executeSearch(query, 'dish')}
              className="w-full text-left py-3.5 px-3 border-b border-gray-50 flex items-center gap-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl group"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0 group-hover:bg-white group-hover:shadow-sm">
                <SearchIcon size={18} />
              </div>
              <span className="font-bold text-gray-800 text-[15px]">{query}</span>
            </button>
            <button 
              onClick={() => executeSearch(query, 'restaurant')}
              className="w-full text-left py-3.5 px-3 flex items-center gap-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl group"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <SearchIcon size={18} />
              </div>
              <div className="flex-1">
                <span className="font-bold text-gray-800 text-[15px]">{query} <span className="text-gray-500 font-medium">in all restaurants</span></span>
              </div>
              <ArrowUpRight size={18} className="text-gray-400 mr-2 group-hover:text-primary transition-colors" />
            </button>
          </div>
        )}

        {viewState === 'results' && (
          <div className="flex flex-col">
            {isLoading ? (
              <div className="text-center pt-10 text-gray-500 font-medium animate-pulse">
                Searching...
              </div>
            ) : searchType === 'dish' ? (
              // Dish Results (Direct Add to Cart)
              (() => {
                const filteredDishes = isVegMode ? results.dishes.filter(d => d.is_veg) : results.dishes;
                return filteredDishes.length === 0 ? (
                <div className="text-center pt-10 text-gray-500 font-medium">
                  No dishes found for "{query}" {isVegMode && " (Pure Veg)"}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {filteredDishes.map(dish => {
                    const qty = cart.stallId === dish.stall_id.toString() ? (cart.items.find(i => i.id === dish.id.toString())?.quantity || 0) : 0;
                    
                    return (
                      <div key={dish.id} className={`flex flex-col bg-white p-4 sm:p-5 rounded-[24px] shadow-native border border-transparent ${!dish.is_open ? 'opacity-70 grayscale-[0.2]' : ''}`}>
                        
                        {/* Restaurant Context Header */}
                        <Link href={`/stall?id=${dish.stall_id}`} className="flex items-center justify-between border-b border-gray-100/50 pb-3 mb-3 hover:bg-gray-50/50 -mt-2 -mx-2 sm:-mx-3 px-2 sm:px-3 pt-2 rounded-t-2xl transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-[13px] text-gray-500 flex items-center gap-1.5 hover:text-primary uppercase tracking-wide">
                              By {dish.stall_name} <ArrowUpRight size={12} />
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-gray-600 font-bold flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded-md"><Star size={10} className="fill-green-600 text-green-600"/> {dish.rating}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-[11px] text-gray-400 font-medium">{dish.location}</span>
                            </div>
                          </div>
                        </Link>
                        
                        {/* Dish Content */}
                        <div className="flex gap-4">
                          <div className="flex-1 flex flex-col justify-start pr-2">
                            <div className="flex items-center gap-2 mb-1.5">
                              {dish.is_veg ? <VegIcon /> : <NonVegIcon />}
                            </div>
                            <h3 className="font-heading font-bold text-gray-900 text-[17px] leading-tight mb-1.5">{dish.name}</h3>
                            <p className="font-bold text-gray-900 text-[15px] mb-2">₹{Number(dish.price)}</p>
                            <p className="text-gray-500 text-[13px] line-clamp-2 leading-relaxed font-medium">{dish.description || 'Delicious and freshly prepared.'}</p>
                          </div>
                          
                          <div className="relative shrink-0 flex flex-col items-center w-[130px]">
                            <div className="w-[130px] h-[130px] rounded-[20px] overflow-hidden bg-gray-50 shadow-sm border border-gray-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={dish.image_url || `https://source.unsplash.com/400x300/?food,${dish.name.split(' ')[0]}`} alt={dish.name} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[100px]">
                              {!dish.is_open ? (
                                <div className="w-full py-2 bg-gray-100 text-gray-500 shadow-md border border-gray-200 text-[11px] font-black text-center rounded-[12px] uppercase tracking-wider">
                                  Closed
                                </div>
                              ) : qty === 0 ? (
                                <button 
                                  onClick={() => handleUpdateCartLocal(dish, 1)}
                                  className="w-full py-2 bg-white text-primary shadow-md border border-gray-100 font-black text-[15px] text-center rounded-[12px] uppercase hover:bg-gray-50 active:scale-95 transition-all"
                                >
                                  ADD
                                </button>
                              ) : (
                                <div className="flex items-center justify-between w-full h-10 bg-white text-primary font-black text-lg rounded-[12px] shadow-md border border-gray-100 overflow-hidden">
                                  <button onClick={() => dish.is_open && handleUpdateCartLocal(dish, -1)} className="w-1/3 h-full flex justify-center items-center hover:bg-primary/5 text-gray-600"><Minus size={14} /></button>
                                  <span className="text-[15px]">{qty}</span>
                                  <button onClick={() => dish.is_open && handleUpdateCartLocal(dish, 1)} className="w-1/3 h-full flex justify-center items-center hover:bg-primary/5"><Plus size={14} /></button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
              })()
            ) : (
              // Restaurant Results (Grouped)
              allMatchedStalls.length === 0 ? (
                <div className="text-center pt-10 text-gray-500 font-medium">
                  No restaurants found for "{query}"
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <h3 className="font-heading font-black text-[15px] uppercase tracking-tight text-gray-800 mb-2">Restaurants for {query}</h3>
                  {allMatchedStalls.map(stall => (
                    <Link key={stall.id} href={`/stall?id=${stall.id}`} className="block">
                      <div className={`flex gap-4 p-4 bg-white rounded-[24px] shadow-native border border-transparent transition-all hover:scale-[1.01] ${!stall.is_open ? "opacity-70 grayscale-[0.3]" : ""}`}>
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] overflow-hidden shrink-0 relative bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={stall.cover_image || `https://picsum.photos/seed/${stall.id}/200`} alt={stall.name} className="w-full h-full object-cover" />
                          {!stall.is_open && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-[10px] font-black text-white bg-black/60 px-2 py-1 rounded-[6px] tracking-wider">CLOSED</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col flex-1 py-1">
                          <div className="flex justify-between items-start mb-1.5">
                            <h3 className="font-heading font-bold text-[18px] text-gray-900 line-clamp-1">{stall.name}</h3>
                            <div className="flex items-center gap-1 bg-green-700 px-1.5 py-0.5 rounded-[6px] shadow-sm shrink-0">
                              <span className="text-[12px] font-bold text-white">{stall.rating || 4.5}</span>
                              <Star size={10} className="fill-white text-white" />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-gray-500 text-[13px] font-medium mb-3">
                            <MapPin size={14} />
                            <span className="line-clamp-1">{stall.location || stall.tags || 'Food & Dining'}</span>
                          </div>
                          
                          <div className="mt-auto flex items-center gap-1.5 text-primary text-[11px] font-black bg-primary/10 w-max px-2.5 py-1.5 rounded-[8px] uppercase tracking-wide">
                            <Percent size={12} />
                            60% OFF up to ₹120
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Listening Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm flex flex-col items-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
              
              <h2 className="text-xl font-heading font-black text-gray-900 mb-8 relative z-10">Listening...</h2>
              
              <div className="relative flex justify-center items-center w-24 h-24 mb-6">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-primary/20 rounded-full"
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }} 
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  className="absolute inset-2 bg-primary/30 rounded-full"
                />
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                  <Mic size={28} />
                </div>
              </div>
              
              <p className="text-gray-500 text-sm font-medium relative z-10">Speak your dish or restaurant name</p>
              
              <button 
                onClick={() => setIsListening(false)}
                className="mt-8 px-6 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors relative z-10"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
