"use client";

import { User, Store, LogOut, Settings, Bell, HelpCircle, ChevronRight, Edit2, Check, X, MapPin, LocateFixed, Search, Loader2, Clock, ChefHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#FDFBF7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FDFBF7" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e3e3e3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8c967" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bc62" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9f2f9" }] }
];
const libraries: any = ["places"];
import { useAuth } from "@/hooks/useAuth";

function MapWrapper({ mapboxToken, centerLat, centerLng, mapZoom, setMapZoom, mapRef, handleMapDragEnd }: any) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: mapboxToken,
    libraries
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px] bg-[#FDFBF7]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%", minHeight: "400px" }}
      center={{ lat: centerLat, lng: centerLng }}
      zoom={mapZoom}
      options={{ disableDefaultUI: true, gestureHandling: 'greedy', keyboardShortcuts: false }}
      onLoad={(map) => { mapRef.current = map; }}
      onDragEnd={handleMapDragEnd}
      onZoomChanged={() => {
        if (mapRef.current) {
          const newZoom = mapRef.current.getZoom();
          if (newZoom !== undefined) setMapZoom(newZoom);
        }
      }}
    />
  );
}

export default function ProfilePage() {
  useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setStall({ ...stall, cover_image: base64Image });
        setEditForm({ ...editForm, cover_image: base64Image });
        
        if (stall.id) {
           try {
             await api.put(`/stalls/${stall.id}`, { cover_image: base64Image });
           } catch(err) {
             console.error("Failed to save cover image", err);
           }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
     setStall({ ...stall, cover_image: "" });
     setEditForm({ ...editForm, cover_image: "" });
     if (stall.id) {
        try {
           await api.put(`/stalls/${stall.id}`, { cover_image: "" });
        } catch(err) {}
     }
  };

  const [stall, setStall] = useState({ 
    id: "",
    name: "", 
    location: "",
    latitude: 25.611,
    longitude: 85.130,
    cover_image: "",
    opening_time: "",
    closing_time: "",
    prep_time: 15,
    tags: "North Indian, Biryani",
    offer_text: "",
    is_pure_veg: false
  });
  const [editForm, setEditForm] = useState({ 
    name: "", 
    location: "",
    latitude: 25.611,
    longitude: 85.130,
    cover_image: "",
    opening_time: "",
    closing_time: "",
    prep_time: 15,
    tags: "North Indian, Biryani",
    offer_text: "",
    is_pure_veg: false
  });

  // Advanced Merchant Settings State
  const [merchantSettings, setMerchantSettings] = useState({
    merchant_id: "",
    business_name: "",
    fssai_license: "",
    gst_number: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    pan_number: "",
    aadhaar_number: ""
  });

  const [activeModal, setActiveModal] = useState<"none" | "business" | "bank" | "kyc" | "help">("none");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Map Modal State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");
  const [mapLat, setMapLat] = useState(25.611);
  const [mapLng, setMapLng] = useState(85.130);
  const [mapCenterLat, setMapCenterLat] = useState(25.611);
  const [mapCenterLng, setMapCenterLng] = useState(85.130);
  const [mapZoom, setMapZoom] = useState(17);
  const [mapboxToken, setMapboxToken] = useState("");
  const mapRef = useRef<any>(null);

  // Fetch Mapbox token
  // Fetch Map Token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
        const res = await fetch(`${baseUrl}/location/map-token`);
        const data = await res.json();
        if (data.token) setMapboxToken(data.token);
        else if (data.data?.token) setMapboxToken(data.data.token);
      } catch (err) {
        console.error("Failed to fetch map token", err);
      }
    };
    fetchToken();
  }, []);

  // Token fetch logic remains above. Map load will be handled by LoadScript conditionally.

  const handleMapDragEnd = async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    if (!center) return;
    const lat = center.lat();
    const lng = center.lng();
    setMapLat(lat);
    setMapLng(lng);
    setMapCenterLat(lat);
    setMapCenterLng(lng);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
      const res = await fetch(`${baseUrl}/location/reverse-geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      const data = await res.json();
      if (data && data.status === 'success' && data.data) {
        setMapSearchQuery(data.data.address || data.data.city || "");
      }
    } catch(err) {}
  };

  // When opening map, init lat/lng
  useEffect(() => {
    if (isMapOpen) {
      const initLat = editForm.latitude || 25.611;
      const initLng = editForm.longitude || 85.130;
      setMapLat(initLat);
      setMapLng(initLng);
      setMapCenterLat(initLat);
      setMapCenterLng(initLng);
      setMapSearchQuery(editForm.location || "");
    }
  }, [isMapOpen]);

  useEffect(() => {
    // Debounce map search
    if (!isMapOpen || !mapSearchQuery || mapSearchQuery.length < 3) {
      setMapSuggestions([]);
      return;
    }

    setIsSearchingMap(true);
    setMapSearchError("");

    const timerId = setTimeout(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
        const res = await fetch(`${baseUrl}/location/autosuggest?query=${encodeURIComponent(mapSearchQuery)}`);
        
        const data = await res.json();
        
        if (data && data.status === 'success' && data.data) {
          setMapSuggestions(data.data);
        } else {
          setMapSuggestions([]);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setIsSearchingMap(false);
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [mapSearchQuery, isMapOpen]);

  const handleSuggestionClick = async (suggestion: any) => {
    setMapSearchQuery(suggestion.description);
    setMapSuggestions([]);
    setIsSearchingMap(true);
    setMapSearchError("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
      const res = await fetch(`${baseUrl}/location/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: suggestion.description })
      });
      
      const data = await res.json();
      if (data && data.status === 'success' && data.data) {
        const loc = data.data;
        setMapLat(loc.lat);
        setMapLng(loc.lng);
        setMapCenterLat(loc.lat);
        setMapCenterLng(loc.lng);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: loc.lat, lng: loc.lng });
          mapRef.current.setZoom(16);
        }
      } else {
        setMapSearchError("Location not found.");
      }
    } catch (err) {
      setMapSearchError("Failed to get location.");
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsSearchingMap(true);
      setMapSearchError("");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setMapLat(lat);
          setMapLng(lon);
          setMapCenterLat(lat);
          setMapCenterLng(lon);
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng: lon });
            mapRef.current.setZoom(17.5);
          }
          
          try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
            const res = await fetch(`${baseUrl}/location/reverse-geocode`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lng: lon })
            });
            
            const data = await res.json();
            
            if (data && data.status === 'success' && data.data) {
              setMapSearchQuery(data.data.address || data.data.city || "");
            }
          } catch(e) {}
          
          setIsSearchingMap(false);
        },
        (error) => {
          console.error("Error fetching location", error);
          setMapSearchError("Could not get your current location. Please check browser permissions.");
          setIsSearchingMap(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setMapSearchError("Geolocation is not supported by your browser.");
    }
  };

  const handleConfirmLocation = () => {
    setEditForm(prev => ({ ...prev, latitude: mapLat, longitude: mapLng, location: mapSearchQuery }));
    setIsMapOpen(false);
  };

  useEffect(() => {
    // Fetch initial stall details
    api.get('/stalls/merchant/my-stall').then(res => {
      if (res.data) {
        const myStall = res.data;
        const stallData = {
          id: myStall.id,
          name: myStall.name || "", 
          location: myStall.location || "",
          latitude: Number(myStall.latitude) || 25.611,
          longitude: Number(myStall.longitude) || 85.130,
          cover_image: myStall.cover_image || "",
          opening_time: myStall.opening_time || "",
          closing_time: myStall.closing_time || "",
          prep_time: myStall.prep_time || 15,
          tags: myStall.tags || "North Indian, Biryani",
          offer_text: myStall.offer_text || "",
          is_pure_veg: !!myStall.is_pure_veg
        };
        setStall(stallData);
        setEditForm({ ...stallData, is_pure_veg: false });
        setMerchantSettings({
          merchant_id: myStall.merchant_id || "",
          business_name: myStall.business_name || "",
          fssai_license: myStall.fssai_license || "",
          gst_number: myStall.gst_number || "",
          bank_account_name: myStall.bank_account_name || "",
          bank_account_number: myStall.bank_account_number || "",
          bank_ifsc: myStall.bank_ifsc || "",
          pan_number: myStall.pan_number || "",
          aadhaar_number: myStall.aadhaar_number || ""
        });
        
        // Merchant must manually click edit to edit their stall profile.
      }
    }).catch(console.error);
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.put('/stalls/merchant/profile', merchantSettings);
      setActiveModal("none");
    } catch(err) {
      console.error("Failed to save settings", err);
      alert("Error saving details");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("swaddo_merchant_token");
    router.push("/login");
  };

  const saveDetails = async () => {
    try {
      if (stall.id) {
        await api.put(`/stalls/${stall.id}`, editForm);
      }
      setStall({ ...editForm, id: stall.id });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update stall", err);
      // Optimistically update if backend is not fully connected
      setStall({ ...editForm, id: stall.id });
      setIsEditing(false);
    }
  };

  return (
    <>
    <div className="flex flex-col min-h-screen pb-24 bg-[#F8F9FA]">
      
      {/* Hero Cover Image Section */}
      <div className="relative h-56 bg-border-subtle w-full group">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
        {stall.cover_image ? (
          <>
            <img src={stall.cover_image} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Quick action buttons for Cover Photo */}
            <div className="absolute top-4 right-4 flex gap-3 z-20">
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 rounded-lg shadow-md hover:bg-white font-bold text-xs transition-colors"
               >
                 <Edit2 size={14} /> Change
               </button>
               <button 
                 onClick={handleRemoveImage}
                 className="flex items-center justify-center w-8 h-8 bg-red-500/90 backdrop-blur-sm text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
               >
                 <X size={16} />
               </button>
            </div>
          </>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white/50 cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <Store size={48} className="mb-3 opacity-40" />
            <span className="text-sm font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">Click to Upload Cover Photo</span>
          </div>
        )}
      </div>

      {/* Floating Info Card */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-5 border border-gray-100">
          {!isEditing ? (
            <>
              <div className="flex justify-between items-start mb-1">
                <h1 className="font-heading font-extrabold text-2xl text-text-primary leading-tight w-3/4">
                  {stall.name || "Setup Your Restaurant"}
                </h1>
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-green-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                    4.2 <span className="text-[10px]">★</span>
                  </div>
                </div>
              </div>
              
              <p className="text-text-muted text-sm mb-3 flex items-start gap-1">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span className="line-clamp-1">{stall.location || "Add Location"}</span>
              </p>
              
              <div className="flex items-center gap-4 text-xs font-medium text-text-muted bg-gray-50 p-3 rounded-xl mb-4">
                <div className="flex items-center gap-1.5"><Clock size={14} className="text-primary"/> {stall.opening_time || "10:00"} - {stall.closing_time || "22:00"}</div>
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                <div className="flex items-center gap-1.5"><ChefHat size={14} className="text-accent"/> Prep: {stall.prep_time || 15}m</div>
              </div>

              <button 
                onClick={() => { setEditForm(stall); setIsEditing(true); }} 
                className="w-full py-2.5 bg-bg-alt text-primary font-bold text-sm rounded-xl border border-border-subtle flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={16} /> Edit Restaurant Profile
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="font-heading font-bold text-text-primary mb-2">Edit Details</h2>
              <input 
                type="text" 
                value={editForm.name} 
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                className="w-full text-sm border border-border-subtle rounded-xl p-3 focus:border-accent outline-none bg-gray-50"
                placeholder="Restaurant Name"
              />
              <input 
                type="text" 
                value={editForm.location} 
                onChange={e => setEditForm({...editForm, location: e.target.value})}
                className="w-full text-sm border border-border-subtle rounded-xl p-3 focus:border-accent outline-none bg-gray-50"
                placeholder="Address / Location"
              />
              <input 
                type="text" 
                value={editForm.tags} 
                onChange={e => setEditForm({...editForm, tags: e.target.value})}
                className="w-full text-sm border border-border-subtle rounded-xl p-3 focus:border-accent outline-none bg-gray-50"
                placeholder="Tags (e.g., Desserts, Bakery)"
              />
              <input 
                type="text" 
                value={editForm.offer_text} 
                onChange={e => setEditForm({...editForm, offer_text: e.target.value})}
                className="w-full text-sm border border-border-subtle rounded-xl p-3 focus:border-accent outline-none bg-gray-50"
                placeholder="Stall Offer (e.g., 60% OFF, FREE DELIVERY)"
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={editForm.opening_time} 
                  onChange={e => setEditForm({...editForm, opening_time: e.target.value})}
                  className="w-1/3 text-sm border border-border-subtle rounded-xl p-3 focus:border-accent outline-none bg-gray-50"
                  placeholder="e.g. 11:00 AM"
                />
                <input 
                  type="text" 
                  value={editForm.closing_time} 
                  onChange={e => setEditForm({...editForm, closing_time: e.target.value})}
                  className="w-1/3 text-sm border border-border-subtle rounded-xl p-3 focus:border-accent outline-none bg-gray-50"
                  placeholder="e.g. 09:00 PM"
                />
                <input 
                  type="number" 
                  value={editForm.prep_time} 
                  onChange={e => setEditForm({...editForm, prep_time: parseInt(e.target.value) || 0})}
                  className="w-1/3 text-sm border border-border-subtle rounded-xl p-3 focus:border-accent outline-none bg-gray-50"
                  placeholder="Prep min"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-2">
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Pure Veg Restaurant</span>
                  <span className="text-xs text-gray-500">Only vegetarian food is prepared here</span>
                </div>
                <div 
                  onClick={() => setEditForm({...editForm, is_pure_veg: !editForm.is_pure_veg})}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${editForm.is_pure_veg ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${editForm.is_pure_veg ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <button 
                onClick={() => setIsMapOpen(true)}
                className="w-full flex items-center justify-between text-sm border border-border-subtle rounded-xl p-3 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2 text-text-primary font-bold">
                  <MapPin size={18} className="text-primary" />
                  <span>Pin Location on Map</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>

              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-100 text-text-muted text-sm font-bold rounded-xl">
                  Cancel
                </button>
                <button onClick={saveDetails} className="flex-1 py-3 bg-accent text-white text-sm font-bold rounded-xl shadow-md">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flat List Settings Options */}
      <div className="mt-6 px-4">
        <h3 className="font-bold text-xs text-text-muted uppercase tracking-wider mb-2 px-2">Account Settings</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          <button onClick={() => setActiveModal('business')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Store size={20} className="text-gray-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-text-primary text-sm">Business Details</span>
                <span className="text-xs text-text-muted">FSSAI, GST, Merchant ID</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button onClick={() => setActiveModal('bank')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-600 font-bold text-lg">₹</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-text-primary text-sm">Bank Details</span>
                <span className="text-xs text-text-muted">Account No, IFSC</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button onClick={() => setActiveModal('kyc')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-text-primary text-sm">KYC Documents</span>
                <span className="text-xs text-text-muted">PAN, Aadhaar</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        </div>
      </div>

      <div className="mt-6 px-4">
        <h3 className="font-bold text-xs text-text-muted uppercase tracking-wider mb-2 px-2">Support & More</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell size={20} className="text-gray-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-text-primary text-sm">Notifications</span>
                <span className="text-xs text-text-muted">Alerts & Sound Settings</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button onClick={() => setActiveModal('help')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <HelpCircle size={20} className="text-gray-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-text-primary text-sm">Help & Support</span>
                <span className="text-xs text-text-muted">Raise Ticket, FAQs</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-8 px-4 mb-4">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-red-100 text-red-500 font-bold rounded-2xl shadow-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>

    </div>

      {/* Settings Modals */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-50 bg-bg-main flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h2 className="font-heading font-bold text-lg">
                {activeModal === 'business' && "Business Details"}
                {activeModal === 'bank' && "Bank Details"}
                {activeModal === 'kyc' && "KYC Documents"}
                {activeModal === 'help' && "Help & Support"}
              </h2>
              <button onClick={() => setActiveModal('none')} className="p-2 hover:bg-bg-alt rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {activeModal === 'business' && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Merchant ID</p>
                    <p className="font-mono font-bold text-lg">{merchantSettings.merchant_id || "PENDING"}</p>
                    <p className="text-xs text-text-muted mt-1">Use this ID when contacting support.</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">FSSAI License Number</label>
                    <input 
                      type="text" 
                      value={merchantSettings.fssai_license}
                      onChange={e => setMerchantSettings({...merchantSettings, fssai_license: e.target.value})}
                      placeholder="14-digit FSSAI Number"
                      className="w-full border border-border-subtle rounded-xl p-3 text-sm focus:border-accent outline-none"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">GST Number (Optional)</label>
                    <input 
                      type="text" 
                      value={merchantSettings.gst_number}
                      onChange={e => setMerchantSettings({...merchantSettings, gst_number: e.target.value})}
                      placeholder="15-digit GSTIN"
                      className="w-full border border-border-subtle rounded-xl p-3 text-sm focus:border-accent outline-none"
                    />
                  </div>
                </>
              )}

              {activeModal === 'bank' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Bank Account Name</label>
                    <input 
                      type="text" 
                      value={merchantSettings.bank_account_name}
                      onChange={e => setMerchantSettings({...merchantSettings, bank_account_name: e.target.value})}
                      placeholder="Name as per bank records"
                      className="w-full border border-border-subtle rounded-xl p-3 text-sm focus:border-accent outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Account Number</label>
                    <input 
                      type="text" 
                      value={merchantSettings.bank_account_number}
                      onChange={e => setMerchantSettings({...merchantSettings, bank_account_number: e.target.value})}
                      placeholder="Account Number"
                      className="w-full border border-border-subtle rounded-xl p-3 text-sm focus:border-accent outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">IFSC Code</label>
                    <input 
                      type="text" 
                      value={merchantSettings.bank_ifsc}
                      onChange={e => setMerchantSettings({...merchantSettings, bank_ifsc: e.target.value})}
                      placeholder="e.g. SBIN0001234"
                      className="w-full border border-border-subtle rounded-xl p-3 text-sm focus:border-accent outline-none uppercase"
                    />
                  </div>
                </>
              )}

              {activeModal === 'kyc' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">PAN Number</label>
                    <input 
                      type="text" 
                      value={merchantSettings.pan_number}
                      onChange={e => setMerchantSettings({...merchantSettings, pan_number: e.target.value})}
                      placeholder="10-digit PAN"
                      className="w-full border border-border-subtle rounded-xl p-3 text-sm focus:border-accent outline-none uppercase"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Aadhaar Number</label>
                    <input 
                      type="text" 
                      value={merchantSettings.aadhaar_number}
                      onChange={e => setMerchantSettings({...merchantSettings, aadhaar_number: e.target.value})}
                      placeholder="12-digit Aadhaar"
                      className="w-full border border-border-subtle rounded-xl p-3 text-sm focus:border-accent outline-none"
                    />
                  </div>
                </>
              )}

              {activeModal === 'help' && (
                <div className="flex flex-col items-center justify-center text-center mt-10">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle size={40} className="text-blue-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Need Assistance?</h3>
                  <p className="text-text-muted text-sm px-4 mb-8">
                    Our support team is available 24/7. Call your partner manager or raise a ticket below.
                  </p>
                  <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md" onClick={() => alert("Ticket raised successfully! Support will contact you shortly.")}>
                    Raise a Support Ticket
                  </button>
                </div>
              )}
            </div>

            {activeModal !== 'help' && (
              <div className="p-4 bg-bg-alt border-t border-border-subtle">
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="w-full bg-accent text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center"
                >
                  {isSavingSettings ? <Loader2 className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Modal */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-main flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border-subtle bg-bg-main">
              <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-bg-alt rounded-full">
                <X size={24} />
              </button>
              <h2 className="font-heading font-bold text-lg">Select Store Location</h2>
            </div>
            
            {/* Map Area */}
            <div className="flex-1 relative">
              {/* Search Bar Overlay */}
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="bg-white rounded-xl shadow-md flex items-center px-4 py-3">
                  <Search size={20} className="text-text-muted mr-3" />
                  <input 
                    type="text" 
                    placeholder="Search area, street, landmark..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                  />
                  {isSearchingMap && <Loader2 size={16} className="animate-spin text-primary mx-2" />}
                  {mapSearchQuery && (
                    <button 
                      onClick={() => setEditForm({...editForm, location: mapSearchQuery})}
                      className="ml-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-primary/20 transition-colors"
                    >
                      Fill Below
                    </button>
                  )}
                </div>
                  {mapSearchError && (
                    <div className="mt-2 text-xs font-bold text-white bg-red-500/90 py-1.5 px-3 rounded-lg shadow-sm">
                      {mapSearchError}
                    </div>
                  )}
                  {mapSuggestions.length > 0 && (
                    <div className="mt-2 bg-white rounded-xl shadow-lg max-h-48 overflow-y-auto border border-border-subtle">
                      {mapSuggestions.map((suggestion, index) => (
                        <div 
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-3 text-sm border-b border-border-subtle last:border-0 hover:bg-bg-alt cursor-pointer text-text-primary"
                        >
                          {suggestion.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              {!mapboxToken ? (
                <div className="flex items-center justify-center w-full min-h-[400px] bg-[#FDFBF7]">
                  <Loader2 className="animate-spin text-primary" size={40} />
                </div>
              ) : (
                <MapWrapper 
                  mapboxToken={mapboxToken} 
                  centerLat={mapCenterLat}
                  centerLng={mapCenterLng}
                  mapZoom={mapZoom}
                  setMapZoom={setMapZoom}
                  mapRef={mapRef}
                  handleMapDragEnd={handleMapDragEnd}
                />
              )}
              
              {/* Fixed Center Pin (Unique Teardrop Design) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center z-10">
                <div className="relative flex flex-col items-center -mb-2 animate-bounce-slow">
                  <div className="w-10 h-10 bg-primary rounded-t-full rounded-bl-full rounded-br-sm rotate-45 flex items-center justify-center shadow-lg border-[3px] border-white drop-shadow-[0_4px_8px_rgba(226,64,28,0.5)]">
                    <div className="w-3 h-3 bg-white rounded-full shadow-inner -rotate-45" />
                  </div>
                </div>
                <div className="w-6 h-1.5 bg-black/50 rounded-[100%] mt-2 blur-[1px]"></div>
              </div>
              
              {/* Overlay Instructions */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md text-sm font-bold text-text-primary border border-border-subtle z-10 whitespace-nowrap">
                Drag the pin to your exact location
              </div>
              
              {/* Use Current Location Floating Button */}
              <button 
                onClick={handleUseCurrentLocation}
                className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-border-subtle text-primary hover:bg-bg-main transition-colors z-10"
                title="Use Current Location"
              >
                <LocateFixed size={24} />
              </button>
            </div>

            {/* Address Details Footer */}
            <div className="p-4 bg-bg-alt border-t border-border-subtle shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10 flex flex-col gap-4">
              <input 
                type="text" 
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                placeholder="Address / Location"
                className="w-full bg-bg-main border border-border-subtle rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary transition-colors"
              />
              <button 
                onClick={handleConfirmLocation}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                Confirm Location
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
