"use client";

import { createContext, useContext, useState, useEffect } from "react";

type LocationContextType = {
  currentLocation: string;
  setCurrentLocation: (loc: string) => void;
  latitude: number | null;
  longitude: number | null;
  setCoordinates: (lat: number, lng: number, saveToStorage?: boolean) => void;
  hasSetLocation: boolean;
  isLocationLoading: boolean;
  resetToLiveLocation: () => void;
  liveLatitude: number | null;
  liveLongitude: number | null;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [liveLatitude, setLiveLatitude] = useState<number | null>(null);
  const [liveLongitude, setLiveLongitude] = useState<number | null>(null);
  const [hasSetLocation, setHasSetLocation] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    // Show slow network warning if it takes too long
    const timeoutId = setTimeout(() => {
      setIsSlow(true);
    }, 3000);

    // Try to load from localStorage first
    const savedLoc = localStorage.getItem("swaddo_location");
    const savedLat = localStorage.getItem("swaddo_lat");
    const savedLng = localStorage.getItem("swaddo_lng");
    const savedLiveLat = localStorage.getItem("swaddo_live_lat");
    const savedLiveLng = localStorage.getItem("swaddo_live_lng");
    const locationType = localStorage.getItem("swaddo_location_type");
    
    if (savedLiveLat) setLiveLatitude(parseFloat(savedLiveLat));
    if (savedLiveLng) setLiveLongitude(parseFloat(savedLiveLng));

    if (savedLoc) {
      setCurrentLocation(savedLoc);
      setHasSetLocation(true);
      if (savedLat) setLatitude(parseFloat(savedLat));
      if (savedLng) setLongitude(parseFloat(savedLng));
      
      // If user manually chose a location, DO NOT overwrite with live GPS!
      if (locationType === "manual") {
         setIsLocationLoading(false);
         clearTimeout(timeoutId);
         return;
      }
    }

    // Otherwise, auto-fetch live GPS (this fulfills the automatic relocation request)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setCoordinates(latitude, longitude, true);
            setLiveLatitude(latitude);
            setLiveLongitude(longitude);
            localStorage.setItem("swaddo_live_lat", latitude.toString());
            localStorage.setItem("swaddo_live_lng", longitude.toString());
            
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
                  locationName = parts[0];
                }
              }
              setCurrentLocation(locationName);
              localStorage.setItem("swaddo_location", locationName);
              setHasSetLocation(true);
              localStorage.setItem("swaddo_location_type", "live");
            } else {
              if (!savedLoc) setCurrentLocation("");
            }
          } catch (err) {
            console.error("Geocoding failed", err);
            if (!savedLoc) setCurrentLocation("");
          } finally {
            setIsLocationLoading(false);
            clearTimeout(timeoutId);
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          if (!savedLoc) setCurrentLocation("");
          setIsLocationLoading(false);
          clearTimeout(timeoutId);
        }
      );
    } else {
      if (!savedLoc) setCurrentLocation("");
      setIsLocationLoading(false);
      clearTimeout(timeoutId);
    }
    
    return () => clearTimeout(timeoutId);
  }, []);

  const setCoordinates = (lat: number, lng: number, saveToStorage = true) => {
    setLatitude(lat);
    setLongitude(lng);
    if (saveToStorage) {
      localStorage.setItem("swaddo_lat", lat.toString());
      localStorage.setItem("swaddo_lng", lng.toString());
    }
  };

  const handleSetLocation = (loc: string) => {
    setCurrentLocation(loc);
    setHasSetLocation(true);
    localStorage.setItem("swaddo_location", loc);
  };

  const resetToLiveLocation = () => {
    localStorage.removeItem("swaddo_location_type");
    setIsLocationLoading(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setCoordinates(latitude, longitude, true);
            setLiveLatitude(latitude);
            setLiveLongitude(longitude);
            localStorage.setItem("swaddo_live_lat", latitude.toString());
            localStorage.setItem("swaddo_live_lng", longitude.toString());
            
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
                  locationName = parts[0];
                }
              }
              setCurrentLocation(locationName);
              localStorage.setItem("swaddo_location", locationName);
              setHasSetLocation(true);
              localStorage.setItem("swaddo_location_type", "live");
            }
          } catch (err) {
            console.error("Geocoding failed during reset", err);
          } finally {
            setIsLocationLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error during reset", error);
          setIsLocationLoading(false);
        }
      );
    } else {
      setIsLocationLoading(false);
    }
  };

  return (
    <LocationContext.Provider value={{ currentLocation, setCurrentLocation: handleSetLocation, latitude, longitude, setCoordinates, hasSetLocation, isLocationLoading, resetToLiveLocation, liveLatitude, liveLongitude }}>
      {isLocationLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center pointer-events-auto">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-primary font-bold text-lg">Fetching accurate location...</p>
          {isSlow && (
            <p className="text-red-500 font-bold mt-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
              Slow network connection...
            </p>
          )}
        </div>
      )}
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
