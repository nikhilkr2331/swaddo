"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/context/LocationContext";
import { ChevronDown, MapPin, Search, X, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LocationSelector({ isMobile = false, customTrigger }: { isMobile?: boolean, customTrigger?: (onClick: () => void) => React.ReactNode }) {
  const { currentLocation, setCurrentLocation, setCoordinates, hasSetLocation } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force open if the user hasn't explicitly set a location yet
  const isMandatoryOpen = mounted && !hasSetLocation;
  const showModal = isOpen || isMandatoryOpen;

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 3) {
      setIsSearching(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
          const res = await fetch(`${baseUrl}/location/autosuggest?query=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setResults([]);
    }
  };

  const handleSelectLocation = async (result: any) => {
    setIsSearching(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
      const res = await fetch(`${baseUrl}/location/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: result.description })
      });
      const geocodeData = await res.json();
      
      if (geocodeData.data) {
        setCoordinates(geocodeData.data.lat, geocodeData.data.lng);
        let locationName = result.mainText || (result.description ? result.description.split(",")[0] : (result.title || "Location"));
        setCurrentLocation(locationName);
        localStorage.setItem("swaddo_location_type", "manual");
        setIsOpen(false);
      } else {
        alert("Failed to fetch exact location coordinates. Please try another place.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch exact location coordinates.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setCurrentLocation("Locating...");
      setIsOpen(false);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setCoordinates(latitude, longitude);
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
            const res = await fetch(`${baseUrl}/location/reverse-geocode`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: latitude, lng: longitude })
            });
            const data = await res.json();
            if (data && data.data) {
              let locationName = data.data.city || "Location found";
              if (data.data.address) {
                const parts = data.data.address.split(',').map((s: string) => s.trim()).filter((s: string) => !s.includes('+') && !s.match(/^[A-Z0-9]{4}\+[A-Z0-9]{2,}/));
                if (parts.length > 0) {
                  locationName = parts[0] + (parts[1] && parts[1] !== data.data.city ? ", " + parts[1] : "");
                }
              }
              setCurrentLocation(locationName);
              localStorage.setItem("swaddo_location_type", "live");
            } else {
              setCurrentLocation("Current Location"); // Fallback text so UI doesn't break
              localStorage.setItem("swaddo_location_type", "live");
            }
          } catch (err) {
            console.error(err);
            setCurrentLocation("Current Location");
            localStorage.setItem("swaddo_location_type", "live");
          }
        },
        (error) => {
          console.error("GPS Denied/Failed", error);
          if (!hasSetLocation) {
             setIsOpen(true); // Re-open modal if they denied GPS and hadn't set location
          }
        }
      );
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {customTrigger ? (
        customTrigger(() => setIsOpen(true))
      ) : isMobile ? (
        <div className="flex flex-col justify-center cursor-pointer" onClick={() => setIsOpen(true)}>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider leading-none mb-1">Delivering to</span>
          <div className="flex items-center gap-1 font-heading font-bold text-sm leading-none text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
            {currentLocation || "Set Location"} <ChevronDown size={14} className="text-primary shrink-0" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-text-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsOpen(true)}>
          <MapPin size={22} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-tight">Delivering to</span>
            <div className="flex items-center gap-1 font-heading font-semibold text-sm">
              {currentLocation || "Set Location"} <ChevronDown size={14} className="text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-bg-main w-full sm:w-96 max-h-[80vh] sm:max-h-[600px] rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border-subtle flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg">
                  {isMandatoryOpen ? "Set Your Location" : "Select Location"}
                </h3>
                {!isMandatoryOpen && (
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-bg-alt rounded-full hover:bg-gray-200">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-border-subtle">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search for area, street name..."
                    value={searchQuery}
                    onChange={handleSearch}
                    autoFocus
                    className="w-full bg-bg-alt border border-border-subtle rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary transition-colors text-sm font-medium"
                  />
                </div>

                <button 
                  onClick={handleUseCurrentLocation}
                  className="w-full mt-4 flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-primary font-bold text-sm"
                >
                  <Navigation size={18} />
                  Use current location
                </button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto p-2">
                {isSearching && <div className="p-4 text-center text-text-muted text-sm">Searching...</div>}
                {!isSearching && results.length === 0 && searchQuery.length > 3 && (
                  <div className="p-4 text-center text-text-muted text-sm">No results found</div>
                )}
                
                {results.map((result, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSelectLocation(result)}
                    className="w-full flex items-start gap-3 p-3 hover:bg-bg-alt rounded-xl text-left transition-colors"
                  >
                    <div className="mt-0.5"><MapPin size={18} className="text-text-muted" /></div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text-primary line-clamp-1">{result.mainText || result.title || result.description}</span><span className="text-xs text-text-muted line-clamp-2 mt-0.5">{result.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
