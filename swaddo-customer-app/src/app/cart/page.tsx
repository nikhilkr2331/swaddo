"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, Wallet, CreditCard, Banknote, ChevronDown, ChevronUp, Loader2, Info, X, Search, LocateFixed, Check, ShoppingBag, Plus, Minus, Trash2, Home, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import Script from "next/script";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const mapStyles = [
  { elementType: "labels.text.stroke", stylers: [{ color: "#FDFBF7" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e3e3e3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8c967" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bc62" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9f2f9" }] }
];

export interface SavedAddress {
  id: string;
  tag: 'Home' | 'Work' | 'Other';
  customerName?: string;
  customerPhone?: string;
  houseNumber: string;
  street: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

const VegIcon = () => (
  <div className="w-3 h-3 border-[1px] border-green-700 flex items-center justify-center rounded-[2px] shrink-0">
    <div className="w-1.5 h-1.5 bg-green-700 rounded-full"></div>
  </div>
);

const NonVegIcon = () => (
  <div className="w-3 h-3 border-[1px] border-[#8B3A1A] flex items-center justify-center rounded-[2px] shrink-0">
    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-[#8B3A1A]"></div>
  </div>
);

const MapTilesWrapper = ({ mapToken, mapLat, mapLng, setMapLat, setMapLng, mapRef, handleMapDragEnd }: any) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: mapToken,
    libraries
  });

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={{ lat: mapLat, lng: mapLng }}
      zoom={17}
      options={{
        styles: mapStyles,
        disableDefaultUI: true,
        backgroundColor: '#FDFBF7',
        gestureHandling: "greedy"
      }}
      onLoad={(map) => { mapRef.current = map; }}
      onDragEnd={handleMapDragEnd}
    />
  );
};

export default function Cart() {
  useAuth();
  const router = useRouter();
  const { cart, updateQuantity, clearCart, cartTotal, cartItemCount } = useCart();
  const { currentLocation, latitude, longitude, setCoordinates, setCurrentLocation, resetToLiveLocation, liveLatitude, liveLongitude } = useLocation();
  const mapLatInitial = latitude || 25.611;
  const mapLngInitial = longitude || 85.130;
  
  // States
  const [isBillExpanded, setIsBillExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Cart & Suggestion States
  const [stallCoords, setStallCoords] = useState<{lat: number, lng: number} | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(20);
  const [foodMarkup, setFoodMarkup] = useState(0);
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);

  // Order Options
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [restaurantInstructions, setRestaurantInstructions] = useState("");

  // Address States
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // Map Modal States
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapLat, setMapLat] = useState(mapLatInitial);
  const [mapLng, setMapLng] = useState(mapLngInitial);
  const [mapAddressTag, setMapAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");
  const [editAddressId, setEditAddressId] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const isProgrammaticMapSearch = useRef(false);
  const [mapboxToken, setMapboxToken] = useState("");

  // Distance logic
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch Token
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

  // Fetch Cart Stall Info & Suggested Items
  useEffect(() => {
    if (cart.stallId) {
      api.get(`/stalls/${cart.stallId}`).then(res => {
        if (res.data && res.data.latitude && res.data.longitude) {
          setStallCoords({ lat: parseFloat(res.data.latitude), lng: parseFloat(res.data.longitude) });
        }
      }).catch(console.error);

      api.get(`/stalls/${cart.stallId}/menu`).then(res => {
        const allItems = res.data || [];
        const filtered = allItems.filter((i: any) => !cart.items.find(ci => ci.id === i.id.toString()));
        setSuggestedItems(filtered);
      }).catch(console.error);
    }
  }, [cart.stallId, cart.items]);

  // Delivery Fee Calculation
  useEffect(() => {
    const calculateDistance = async () => {
      if (!cart.stallId) return;
      const activeAddress = savedAddresses.find((a: any) => a._id === selectedAddressId || a.id === selectedAddressId) || null;
      const targetLat = activeAddress ? activeAddress.latitude : mapLatInitial;
      const targetLng = activeAddress ? activeAddress.longitude : mapLngInitial;
      
      // Sync global location context with the selected delivery address so browsing remains consistent
      // We only update coordinates so the text on the UI (e.g., 'Patna') remains what the user expects, but prices use the new location.
      if (activeAddress && (activeAddress.latitude !== latitude || activeAddress.longitude !== longitude)) {
        setCoordinates(activeAddress.latitude, activeAddress.longitude);
      }

      if (stallCoords && targetLat && targetLng) {
        // Haversine base for fee calculation
        const haversineDist = getDistance(stallCoords.lat, stallCoords.lng, targetLat, targetLng);
        let fee = 18;
        if (haversineDist <= 1.4) {
          fee = 18;
        } else if (haversineDist <= 2.0) {
          fee = 18 + ((haversineDist - 1.4) / 0.6) * 5;
        } else if (haversineDist <= 3.0) {
          fee = 23 + ((haversineDist - 2.0) / 1.0) * 6;
        } else if (haversineDist <= 4.0) {
          fee = 29 + ((haversineDist - 3.0) / 1.0) * 7;
        } else {
          fee = 36;
        }
        fee = Math.round(fee * 100) / 100;
        setDeliveryFee(fee);
        
        // Dynamic Food Markup based on exact road distance (matching stall/page.tsx)
        let newMarkup = 0;
        
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
          
          let deliveryDistanceKm = 0;
          const routeRes = await fetch(`${baseUrl}/location/route`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originLat: stallCoords.lat,
              originLng: stallCoords.lng,
              destLat: targetLat,
              destLng: targetLng
            })
          });
          const data = await routeRes.json();
          if (data.status === 'success' && data.data) {
             deliveryDistanceKm = data.data.distanceKm;
          }
          
          let physicalDistanceKm = 0;
          if (liveLatitude && liveLongitude) {
             const liveRouteRes = await fetch(`${baseUrl}/location/route`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 originLat: stallCoords.lat,
                 originLng: stallCoords.lng,
                 destLat: liveLatitude,
                 destLng: liveLongitude
               })
             });
             const liveData = await liveRouteRes.json();
             if (liveData.status === 'success' && liveData.data) {
                physicalDistanceKm = liveData.data.distanceKm;
             }
          }

          if (deliveryDistanceKm >= 4.0 || physicalDistanceKm >= 4.0) {
            newMarkup = 20;
          }
        } catch (e) {
          // Fallback to Haversine if API fails
          let physicalDist = 0;
          if (liveLatitude && liveLongitude) {
             physicalDist = getDistance(stallCoords.lat, stallCoords.lng, liveLatitude, liveLongitude);
          }
          if (haversineDist >= 3.2 || physicalDist >= 3.2) {
            newMarkup = 20;
          }
        }
          
        // Check if any items in cart have a stale markup
        if (cart.items.length > 0) {
          const hasMismatchedMarkup = cart.items.some(item => (item.markup || 0) !== newMarkup);
          if (hasMismatchedMarkup) {
            alert("Location changed. Cart cleared due to new pricing. Please re-add items.");
            clearCart();
            return; // stop execution so we don't render stale data
          }
        }
        
        setFoodMarkup(newMarkup);
      }
    };
    
    calculateDistance();
  }, [stallCoords, mapLatInitial, mapLngInitial, savedAddresses, selectedAddressId, cart.items.length]);

  // Map logic
  const handleMapDragEnd = async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    if (!center) return;
    const lat = center.lat();
    const lng = center.lng();
    setMapLat(lat);
    setMapLng(lng);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
      const res = await fetch(`${baseUrl}/location/reverse-geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      const data = await res.json();
      if (data && data.status === 'success' && data.data) {
        isProgrammaticMapSearch.current = true;
        setMapSearchQuery(data.data.address || data.data.city || "");
      }
    } catch(err) {}
  };

  useEffect(() => {
    if (isProgrammaticMapSearch.current) {
      isProgrammaticMapSearch.current = false;
      return;
    }
    if (!mapSearchQuery || mapSearchQuery.length < 3) {
      setMapSearchResults([]);
      return;
    }

    setIsSearchingMap(true);
    setMapSearchError("");
    const timerId = setTimeout(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions({ input: mapSearchQuery, componentRestrictions: { country: 'in' } }, (predictions, status) => {
          setIsSearchingMap(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setMapSearchResults(predictions.map(p => ({ 
              description: p.description, 
              place_id: p.place_id, 
              mainText: p.structured_formatting?.main_text 
            })));
          } else {
            setMapSearchResults([]);
            setMapSearchError("No results found");
          }
        });
      } else {
        setIsSearchingMap(false);
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [mapSearchQuery]);

  const handleSaveAddress = async () => {
    const finalAddress = mapSearchQuery || "Location Selected on Map";

    let updatedAddresses = [];
    if (editAddressId) {
       updatedAddresses = savedAddresses.map(addr => {
          if (addr.id === editAddressId) {
             return {
                ...addr,
                tag: mapAddressTag,
                customerName: customerName,
                customerPhone: customerPhone,
                houseNumber: houseNumber || "",
                fullAddress: finalAddress,
                latitude: mapLat,
                longitude: mapLng
             };
          }
          return addr;
       });
    } else {
      const newAddress: SavedAddress = {
        id: Date.now().toString(),
        tag: mapAddressTag,
        customerName: customerName,
        customerPhone: customerPhone,
        houseNumber: houseNumber || "",
        street: "",
        fullAddress: finalAddress,
        latitude: mapLat,
        longitude: mapLng
      };
      updatedAddresses = [...savedAddresses, newAddress];
    }
    
    setSavedAddresses(updatedAddresses);
    
    // Auto-select ONLY if it's the very first address being added
    if (updatedAddresses.length === 1 && !editAddressId) {
       setSelectedAddressId(updatedAddresses[0].id);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('swaddo_saved_addresses', JSON.stringify(updatedAddresses));
    }
    
    setIsMapOpen(false);
    setHouseNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setEditAddressId(null);
  };

  const handleEditAddress = (e: React.MouseEvent, addr: SavedAddress) => {
     e.stopPropagation();
     setEditAddressId(addr.id);
     setMapLat(addr.latitude);
     setMapLng(addr.longitude);
     setMapAddressTag(addr.tag);
     setHouseNumber(addr.houseNumber || "");
     setCustomerName(addr.customerName || "");
     setCustomerPhone(addr.customerPhone || "");
     setMapSearchQuery(addr.fullAddress);
     setIsMapOpen(true);
  };

  const handleDeleteAddress = (e: React.MouseEvent, id: string) => {
     e.stopPropagation();
     if (!confirm("Delete this address?")) return;
     const updated = savedAddresses.filter(a => a.id !== id);
     setSavedAddresses(updated);
     if (selectedAddressId === id) setSelectedAddressId(null);
     if (typeof window !== 'undefined') {
        localStorage.setItem('swaddo_saved_addresses', JSON.stringify(updated));
     }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAddresses = localStorage.getItem('swaddo_saved_addresses');
      if (storedAddresses) {
        try {
          const parsed = JSON.parse(storedAddresses);
          setSavedAddresses(parsed);
          if (parsed.length === 1) {
            setSelectedAddressId(parsed[0].id);
          }
        } catch(e) {}
      }
    }
  }, []);

  const itemTotal = cartTotal + (foodMarkup * cartItemCount);
  const GST = Math.round(itemTotal * 0.05);
  const finalTotal = itemTotal + GST + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!cart.stallId || cart.items.length === 0) return;
    setIsPlacingOrder(true);
    
    const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
    if (!selectedAddr) {
      alert("Please select or add a delivery address.");
      setIsPlacingOrder(false);
      return;
    }
    
    const baseDeliveryAddress = selectedAddr.houseNumber 
      ? `${selectedAddr.houseNumber}, ${selectedAddr.fullAddress}` 
      : selectedAddr.fullAddress;
      
    const finalDeliveryAddress = selectedAddr.customerName
      ? `${selectedAddr.customerName} | ${baseDeliveryAddress}`
      : baseDeliveryAddress;

    try {
      const payload = {
        stallId: cart.stallId,
        totalAmount: finalTotal,
        deliveryAddress: finalDeliveryAddress,
        deliveryLat: selectedAddr.latitude,
        deliveryLng: selectedAddr.longitude,
        customerPhone: selectedAddr.customerPhone || undefined,
        deliveryInstructions,
        restaurantInstructions,
        paymentMethod,
        items: cart.items.map((item: any) => ({
          ...item,
          price: item.price + foodMarkup,
          quantity: item.quantity || item.qty || 1
        }))
      };
      
      if (paymentMethod === 'cod') {
        const res = await api.post("/orders", payload);
        if (res.data && res.data.order) {
          alert("Order Placed Successfully!");
          clearCart();
          if (typeof window !== "undefined") {
             resetToLiveLocation();
             router.push(`/track?id=${res.data.order.id}`);
          }
        } else {
          alert("Failed to place order.");
          setIsPlacingOrder(false);
        }
      } else {
        const orderRes = await api.post("/payments/create-order", payload);
        if (!orderRes.data || !orderRes.data.razorpay_order_id) {
          throw new Error("Failed to initialize payment");
        }
        
        const options = {
          key: orderRes.data.key_id,
          amount: Math.round(finalTotal * 100),
          currency: "INR",
          name: "SwaDDo",
          description: "Food Order",
          order_id: orderRes.data.razorpay_order_id,
          handler: async function (response: any) {
            try {
              setIsPlacingOrder(true);
              await api.post("/payments/verify", {
                swaddo_order_id: orderRes.data.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              
              alert("Order Placed Successfully!");
              clearCart();
              if (typeof window !== "undefined") {
                 resetToLiveLocation();
                 router.push(`/track?id=${orderRes.data.order_id}`);
              }
            } catch (err: any) {
              console.error(err);
              alert("Payment verification failed: " + (err.response?.data?.message || err.message));
              setIsPlacingOrder(false);
            }
          },
          theme: { color: "#D32F2F" },
          modal: {
            ondismiss: function() {
              alert("Payment cancelled. You can try again.");
              setIsPlacingOrder(false);
            }
          }
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert("Payment failed: " + response.error.description);
          setIsPlacingOrder(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      alert("Failed to place order: " + errorMessage);
      setIsPlacingOrder(false);
    }
  };

  if (cartItemCount === 0) {
    return (
      <div className="min-h-[100vh] flex flex-col items-center justify-center p-6 text-center bg-bg-main">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} className="text-text-muted opacity-50" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">Your cart is empty</h2>
        <p className="text-text-muted mb-8 max-w-xs">Looks like you haven't added anything to your cart yet. Let's get some delicious street food!</p>
        <button 
          onClick={() => router.push('/')}
          className="bg-primary hover:bg-yellow-600 text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-md"
        >
          Browse Stalls
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-bg-main pb-40">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm border-b border-border-subtle">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-bg-alt text-text-primary transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="font-heading font-bold text-xl leading-tight">{cart.stallName}</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          
          {/* Saved Addresses Section */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-text-primary">Deliver to</h2>
              <button onClick={() => setIsMapOpen(true)} className="text-primary text-sm font-bold flex items-center gap-1">
                <MapPin size={16} /> Add New Address
              </button>
            </div>
            
            <div className="space-y-3">
              {savedAddresses.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-border-subtle rounded-xl bg-bg-alt">
                  <p className="text-text-muted text-sm mb-2">No saved addresses yet</p>
                  <button onClick={() => { setEditAddressId(null); setIsMapOpen(true); }} className="text-primary font-bold text-sm">Add Address</button>
                </div>
              ) : (
                savedAddresses.map(addr => (
                  <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border-subtle'}`}>
                    <input 
                      type="radio" 
                      name="deliveryAddress" 
                      className="mt-1 accent-primary w-4 h-4 shrink-0" 
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-text-primary flex items-center gap-1.5">{addr.tag === 'Home' ? <Home size={14} /> : addr.tag === 'Work' ? <Briefcase size={14} /> : <MapPin size={14} />} {addr.tag}</span>
                        {addr.customerName && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{addr.customerName}</span>}
                      </div>
                      <p className="text-text-muted text-xs leading-relaxed mt-0.5 line-clamp-2 pr-2">
                        {addr.houseNumber ? `${addr.houseNumber}, ` : ""}{addr.fullAddress}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                       <button onClick={(e) => handleEditAddress(e, addr)} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                       </button>
                       <button onClick={(e) => handleDeleteAddress(e, addr.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </label>
                ))
              )}
            </div>
            
            {/* Delivery Instructions Section */}
            {savedAddresses.length > 0 && selectedAddressId && (
              <div className="mt-5 pt-5 border-t border-border-subtle">
                <h3 className="font-bold text-sm text-text-primary mb-3">Delivery Instructions</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['Leave at door', 'Don\'t ring bell', 'Avoid calling'].map(inst => (
                    <button 
                      key={inst}
                      onClick={() => setDeliveryInstructions(deliveryInstructions === inst ? "" : inst)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${deliveryInstructions === inst ? 'bg-primary/10 border-primary text-primary' : 'bg-bg-main border-border-subtle text-text-muted hover:bg-bg-alt'}`}
                    >
                      {inst}
                    </button>
                  ))}
                </div>
                
                <h3 className="font-bold text-sm text-text-primary mb-3 mt-4">Restaurant Instructions</h3>
                <textarea
                  placeholder="Any cooking instructions (e.g. less spicy)?"
                  value={restaurantInstructions}
                  onChange={(e) => setRestaurantInstructions(e.target.value)}
                  className="w-full bg-bg-main border border-border-subtle rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary transition-colors resize-none"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-sm">
            <h2 className="font-bold text-text-primary mb-4">Items Added</h2>
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1">{item.isVeg ? <VegIcon /> : <NonVegIcon />}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary text-sm leading-tight mb-1">{item.name}</h3>
                    <p className="font-bold text-text-primary text-sm">₹{item.price + foodMarkup}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center justify-between w-[80px] py-1 bg-white text-primary font-bold text-sm rounded-lg border border-primary">
                      <button onClick={() => updateQuantity(cart.stallId!, cart.stallName!, item, -1)} className="w-1/3 flex justify-center py-1"><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(cart.stallId!, cart.stallName!, item, 1)} className="w-1/3 flex justify-center py-1"><Plus size={14} /></button>
                    </div>
                    <span className="font-bold text-text-primary text-xs">₹{(item.price + foodMarkup) * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={clearCart} className="mt-4 text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors">
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>

          {/* Suggested Items (Zomato style) */}
          {suggestedItems.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-sm">
              <h2 className="font-bold text-text-primary mb-3">Complete your meal with</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {suggestedItems.map(item => (
                  <div key={item.id} className="min-w-[130px] max-w-[130px] bg-bg-main border border-border-subtle rounded-xl p-3 flex flex-col snap-start shrink-0 relative">
                    <div className="mb-2">{item.isVeg ? <VegIcon /> : <NonVegIcon />}</div>
                    <h3 className="font-bold text-xs text-text-primary line-clamp-2 mb-1 h-8">{item.name}</h3>
                    <p className="font-semibold text-text-primary text-xs mb-3">₹{item.price + foodMarkup}</p>
                    <button 
                      onClick={() => updateQuantity(cart.stallId!, cart.stallName!, { id: item.id.toString(), name: item.name, price: Number(item.price), markup: foodMarkup, isVeg: item.isVeg }, 1)}
                      className="w-full py-1.5 bg-white border border-border-subtle text-primary font-bold text-xs rounded-lg hover:border-primary transition-colors shadow-sm mt-auto"
                    >
                      ADD +
                    </button>
                  </div>
                ))}
              </div>
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>
          )}

          {/* Delivery Details */}
          <div className="bg-bg-alt rounded-2xl p-4 border border-border-subtle shadow-sm">
            <p className="text-xs text-text-muted mb-2">Delivery is managed by the restaurant. This order will be delivered by their own fleet</p>
            <div className="flex items-center gap-1.5 text-text-primary font-bold text-sm">
              <MapPin size={16} /> Delivery in 30-40 mins
            </div>
          </div>

          {/* Collapsible Bill Details */}
          <div className="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
            <button 
              onClick={() => setIsBillExpanded(!isBillExpanded)}
              className="w-full p-4 flex justify-between items-center text-left hover:bg-bg-alt transition-colors"
            >
              <div className="flex items-center gap-2">
                <Banknote size={20} className="text-text-muted" />
                <span className="text-text-primary font-medium text-sm">Total Bill</span>
                <span className="font-bold text-text-primary text-base ml-1">₹{finalTotal}</span>
              </div>
              <div className="text-text-muted flex items-center gap-1 text-xs">
                {isBillExpanded ? 'Hide Details' : 'Show Details'}
                {isBillExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            
            <AnimatePresence>
              {isBillExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-border-subtle bg-bg-main"
                >
                  <div className="p-4 space-y-3 text-sm text-text-muted">
                    <div className="flex justify-between">
                      <span>Item Total</span>
                      <span>₹{itemTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>₹{deliveryFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & Charges (5%)</span>
                      <span>₹{GST}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cancellation Policy */}
          <div className="py-2 px-1 text-center sm:text-left">
            <h3 className="text-xs font-bold text-text-muted tracking-wider mb-1">CANCELLATION POLICY</h3>
            <p className="text-[11px] text-text-muted leading-relaxed">
              A 100% cancellation charge will apply. This helps us compensate the restaurant partner for food preparation.
            </p>
          </div>
        </div>

        {/* Floating Payment Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 xl:px-0 max-w-2xl mx-auto pb-4">
          <div className="bg-white rounded-2xl shadow-[0_-8px_20px_rgba(0,0,0,0.08)] border border-border-subtle overflow-hidden">
            
            {/* Payment Method Selector */}
            <div className="flex border-b border-border-subtle bg-bg-alt">
              <button 
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${paymentMethod === 'upi' ? 'bg-white text-primary border-b-2 border-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              >
                <Wallet size={16} /> Pay via UPI
              </button>
              <button 
                onClick={() => setPaymentMethod('cod')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${paymentMethod === 'cod' ? 'bg-white text-primary border-b-2 border-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              >
                <Banknote size={16} /> Cash on Delivery
              </button>
            </div>

            {/* Place Order Button Area */}
            <div className="p-4 bg-white">
              <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !selectedAddressId}
                className="w-full font-bold text-white bg-primary hover:bg-primary-hover py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isPlacingOrder ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  `Place Order • ₹${finalTotal}`
                )}
              </button>
              {!selectedAddressId && (
                 <p className="text-red-500 text-[10px] text-center mt-2 font-semibold">Please select a delivery address to place your order.</p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Map Modal */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[999] bg-bg-main flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border-subtle bg-white">
              <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-bg-alt rounded-full">
                <X size={24} />
              </button>
              <h2 className="font-heading font-bold text-lg">Select Delivery Location</h2>
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
                    className="flex-1 bg-transparent outline-none text-sm text-text-primary"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                  />
                  {isSearchingMap && <Loader2 size={16} className="animate-spin text-primary mx-2" />}
                </div>
                
                {mapSearchResults.length > 0 && (
                  <div className="mt-2 bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {mapSearchResults.map((loc: any, i: number) => (
                      <div 
                        key={i} 
                        className="px-4 py-3 border-b border-border-subtle hover:bg-bg-alt cursor-pointer flex flex-col"
                        onClick={() => {
                          const suggestionText = loc.mainText || loc.description.split(",")[0];
                          setMapSearchQuery(suggestionText);
                          setMapSearchResults([]);
                          setIsSearchingMap(true);
                          try {
                            const geocoder = new window.google.maps.Geocoder();
                            geocoder.geocode({ placeId: loc.place_id, address: loc.description }, (results, status) => {
                              if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                                const location = results[0].geometry.location;
                                setMapLat(location.lat());
                                setMapLng(location.lng());
                                if (mapRef.current) {
                                  mapRef.current.panTo(location);
                                  mapRef.current.setZoom(17.5);
                                }
                              }
                              setIsSearchingMap(false);
                            });
                          } catch (e) {
                            setIsSearchingMap(false);
                          }
                        }}
                      >
                        <span className="font-bold text-sm text-text-primary">{loc.mainText || loc.description.split(",")[0]}</span>
                        <span className="text-xs text-text-muted">{loc.description}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {mapSearchError && (
                  <div className="mt-2 text-xs font-bold text-white bg-red-500/90 py-1.5 px-3 rounded-lg shadow-sm">
                    {mapSearchError}
                  </div>
                )}
              </div>

              <div className="absolute inset-0 w-full h-full bg-[#f5f5f5]">
                {!mapboxToken ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#FDFBF7]">
                    <Loader2 className="animate-spin text-primary" size={40} />
                  </div>
                ) : (
                  <MapTilesWrapper 
                    mapToken={mapboxToken}
                    mapLat={mapLat}
                    mapLng={mapLng}
                    setMapLat={setMapLat}
                    setMapLng={setMapLng}
                    mapRef={mapRef}
                    handleMapDragEnd={handleMapDragEnd}
                  />
                )}
                
                <button 
                  onClick={() => {
                    if (liveLatitude && liveLongitude) {
                      setMapLat(liveLatitude);
                      setMapLng(liveLongitude);
                      if (mapRef.current) {
                        mapRef.current.panTo({ lat: liveLatitude, lng: liveLongitude });
                        mapRef.current.setZoom(17.5);
                      }
                    } else {
                      resetToLiveLocation();
                    }
                  }}
                  className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg text-primary hover:bg-gray-50 transition-colors z-20 border border-border-subtle"
                >
                  <LocateFixed size={24} />
                </button>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center z-10">
                  <div className="w-10 h-10 bg-primary rounded-t-full rounded-bl-full rounded-br-sm rotate-45 flex items-center justify-center shadow-lg border-[3px] border-white drop-shadow-[0_4px_8px_rgba(226,64,28,0.5)]">
                    <div className="w-3 h-3 bg-white rounded-full shadow-inner -rotate-45" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form */}
            <div className="bg-white rounded-t-3xl p-5 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] z-20">
              <h3 className="font-bold text-text-primary mb-4">Enter Complete Address</h3>
              
              <div className="mb-4">
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Recipient Name"
                  className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors mb-2"
                />
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number (Required)"
                  className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors mb-2"
                />
                <input 
                  type="text" 
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="House / Flat / Block No."
                  className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Save as</label>
                <div className="flex gap-3">
                  {['Home', 'Work', 'Other'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setMapAddressTag(tag as any)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${mapAddressTag === tag ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-border-subtle text-text-muted'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSaveAddress}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
              >
                Save & Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
