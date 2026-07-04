"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, Wallet, CreditCard, Banknote, ChevronDown, ChevronUp, Loader2, Info, X, Search, LocateFixed, Check, Home, Briefcase } from "lucide-react";
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
  <div className="w-3 h-3 border border-green-700 flex items-center justify-center rounded-[2px] shrink-0">
    <div className="w-1.5 h-1.5 bg-green-700 rounded-full"></div>
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

export default function Checkout() {
  useAuth();
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { currentLocation, setCurrentLocation, latitude, longitude, setCoordinates } = useLocation();
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi"); // 'upi' or 'cod'
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [phone, setPhone] = useState("+91 98765 43210");
  const [houseNumber, setHouseNumber] = useState("");

  // Address Management State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [restaurantInstructions, setRestaurantInstructions] = useState("");
  
  // Map Modal State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapLat, setMapLat] = useState(latitude || 25.611);
  const [mapLng, setMapLng] = useState(longitude || 85.130);
  const [mapAddressTag, setMapAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");
  const mapRef = useRef<any>(null);
  const isProgrammaticMapSearch = useRef(false);
  const [editAddressId, setEditAddressId] = useState<string | null>(null);

  const [mapboxToken, setMapboxToken] = useState("");

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
    if (latitude && longitude) {
      setMapLat(latitude);
      setMapLng(longitude);
    }
  }, [latitude, longitude]);

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
    let finalAddress = "Location Selected on Map";
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
      const res = await fetch(`${baseUrl}/location/reverse-geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: mapLat, lng: mapLng })
      });
      
      const data = await res.json();
      
      if (data && data.status === 'success' && data.data) {
        const mapData = data.data;
        if (mapData.results && mapData.results.length > 0) {
          finalAddress = mapData.results[0].formatted_address;
        } else if (mapData.display_name) {
          finalAddress = mapData.display_name;
        }
      }
    } catch (err) {
      console.error(err);
    }

    const newAddress: SavedAddress = {
      id: editAddressId || Date.now().toString(),
      tag: mapAddressTag,
      customerName,
      customerPhone,
      houseNumber: houseNumber || "",
      street: "",
      fullAddress: finalAddress,
      latitude: mapLat,
      longitude: mapLng
    };

    const updatedAddresses = editAddressId 
      ? savedAddresses.map(addr => addr.id === editAddressId ? newAddress : addr)
      : [...savedAddresses, newAddress];

    setSavedAddresses(updatedAddresses);
    setSelectedAddressId(newAddress.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('swaddo_saved_addresses', JSON.stringify(updatedAddresses));
    }
    
    setIsMapOpen(false);
    setHouseNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setEditAddressId(null);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPhone = localStorage.getItem('swaddo_customer_phone');
      if (storedPhone) setPhone(storedPhone);

      const storedAddresses = localStorage.getItem('swaddo_saved_addresses');
      if (storedAddresses) {
        try {
          const parsed = JSON.parse(storedAddresses);
          setSavedAddresses(parsed);
          if (parsed.length > 0) {
            setSelectedAddressId(parsed[0].id);
          }
        } catch(e) {}
      }
    }
  }, []);

  const [stallCoords, setStallCoords] = useState<{lat: number, lng: number} | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(20); 

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

  useEffect(() => {
    if (cart.stallId) {
      api.get(`/stalls/${cart.stallId}`).then(res => {
        if (res.data && res.data.latitude && res.data.longitude) {
          setStallCoords({ lat: parseFloat(res.data.latitude), lng: parseFloat(res.data.longitude) });
        }
      }).catch(console.error);
    }
  }, [cart.stallId]);

  useEffect(() => {
    if (stallCoords && mapLat && mapLng) {
      const dist = getDistance(stallCoords.lat, stallCoords.lng, mapLat, mapLng);
      let fee = 18;
      if (dist <= 1.4) {
        fee = 18;
      } else if (dist <= 2.0) {
        fee = 18 + ((dist - 1.4) / 0.6) * 5;
      } else if (dist <= 3.0) {
        fee = 23 + ((dist - 2.0) / 1.0) * 6;
      } else if (dist <= 4.0) {
        fee = 29 + ((dist - 3.0) / 1.0) * 7;
      } else {
        fee = 36;
      }
      fee = Math.round(fee * 100) / 100;
      setDeliveryFee(fee);
    }
  }, [stallCoords, mapLat, mapLng]);

  const taxAndFees = Math.round(cartTotal * 0.05);
  const finalTotal = cartTotal + taxAndFees + deliveryFee;

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
          quantity: item.quantity || item.qty || 1
        }))
      };
      
      if (paymentMethod === 'cod') {
        const res = await api.post("/orders", payload);
        if (res.data && res.data.order) {
          clearCart();
          setShowSuccessModal(true);
          setTimeout(() => {
            router.push(`/track?id=${res.data.order.id}`);
          }, 2000);
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
              
              clearCart();
              setShowSuccessModal(true);
              setTimeout(() => {
                router.push(`/track?id=${orderRes.data.order_id}`);
              }, 2000);
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

  if (!cart.stallId || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-heading font-bold mb-4">Your cart is empty!</h2>
        <button onClick={() => router.push('/')} className="bg-primary text-white font-bold py-3 px-6 rounded-xl">
          Browse Stalls
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="app-scroll-container bg-bg-main pb-48 xl:pb-12 xl:pt-8 font-body">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-bg-main/90 backdrop-blur-md py-4 px-4 sm:px-6 flex items-center gap-3 xl:mb-6 border-b border-border-subtle/50">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm xl:hidden">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-heading font-black text-text-primary uppercase tracking-tight">Checkout</h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start px-4 sm:px-6 xl:px-0 max-w-5xl mx-auto mt-4">
        
        <div className="flex-1 w-full space-y-6">
          
          <div className="bg-white rounded-[24px] border border-transparent shadow-native p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading font-black text-[18px] text-text-primary uppercase tracking-tight">Deliver to</h2>
              <button onClick={() => setIsMapOpen(true)} className="text-primary text-[13px] font-bold flex items-center gap-1 hover:text-primary-hover transition-colors">
                <MapPin size={14} /> Add New
              </button>
            </div>
            
            <div className="space-y-4">
              {savedAddresses.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-border-subtle rounded-xl">
                  <MapPin className="mx-auto text-text-muted mb-2" size={32} />
                  <p className="text-text-muted text-sm mb-4">No saved addresses yet</p>
                  <button onClick={() => setIsMapOpen(true)} className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg text-sm">
                    Add an Address
                  </button>
                </div>
              ) : (
                savedAddresses.map(addr => (
                  <label key={addr.id} className={`flex items-start gap-4 p-4 rounded-[16px] cursor-pointer transition-all border ${selectedAddressId === addr.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}>
                    <input 
                      type="radio" 
                      name="deliveryAddress" 
                      className="mt-1 accent-primary w-4 h-4 shrink-0" 
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[14px] text-text-primary flex items-center gap-1.5">{addr.tag === 'Home' ? <Home size={14} /> : addr.tag === 'Work' ? <Briefcase size={14} /> : <MapPin size={14} />} {addr.tag}</span>
                        {addr.customerName && <span className="text-[10px] bg-white border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded uppercase font-bold">{addr.customerName}</span>}
                      </div>
                      <p className="text-text-primary text-[13px] font-bold mt-1">
                        {addr.houseNumber}
                      </p>
                      <p className="text-text-muted text-[12px] leading-relaxed mt-0.5">
                        {addr.fullAddress}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

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

          <div className="pt-2 pb-6">
            <h2 className="font-heading font-black text-[18px] text-text-primary mb-4 uppercase tracking-tight pl-1">Payment Method</h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => setPaymentMethod("upi")}
                className={`w-full flex items-center gap-4 p-4 rounded-[16px] border transition-all text-left ${
                  paymentMethod === "upi" 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-transparent bg-white shadow-native hover:shadow-native-lg"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === "upi" ? "bg-primary text-white" : "bg-gray-50 text-text-muted"}`}>
                  <Wallet size={20} />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-text-primary text-[14px]">Pay via UPI</span>
                  <span className="text-[11px] text-text-muted mt-0.5 font-medium">Google Pay, PhonePe, Paytm</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "upi" ? "border-primary" : "border-border-subtle"}`}>
                  {paymentMethod === "upi" && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod("cod")}
                className={`w-full flex items-center gap-4 p-4 rounded-[16px] border transition-all text-left ${
                  paymentMethod === "cod" 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-transparent bg-white shadow-native hover:shadow-native-lg"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === "cod" ? "bg-primary text-white" : "bg-gray-50 text-text-muted"}`}>
                  <Banknote size={20} />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-text-primary text-[14px]">Cash on Delivery</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-primary" : "border-border-subtle"}`}>
                  {paymentMethod === "cod" && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                </div>
              </button>
            </div>
          </div>

        </div>

        <div className="w-full xl:w-[400px] shrink-0 space-y-6 xl:sticky xl:top-[120px] pb-6">
          
          <div className="bg-white rounded-[24px] border border-transparent shadow-native overflow-hidden">
            <button 
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="w-full p-5 flex justify-between items-center bg-bg-alt hover:bg-bg-main transition-colors text-left"
            >
              <div className="flex flex-col">
                <span className="font-heading font-bold text-text-primary text-lg">{cart.stallName}</span>
                <span className="text-text-muted text-sm">{cart.items.length} items</span>
              </div>
              <div className="flex items-center gap-2 text-primary text-sm font-bold">
                View Details {isSummaryExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isSummaryExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-border-subtle"
                >
                  <div className="p-5 space-y-4 bg-bg-alt/50">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex gap-2 items-start">
                          <div className="mt-1"><VegIcon /></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-sm">{item.name}</span>
                            <span className="text-xs text-text-muted mt-0.5">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-bold text-text-primary text-sm">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-white rounded-[24px] border border-transparent shadow-native p-5">
            <h3 className="font-heading font-black text-text-primary text-[16px] mb-4 uppercase tracking-tight">Bill Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-text-primary">
                <span>Item Total</span>
                <span>₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Taxes & Fees</span>
                <span>₹{taxAndFees}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              
              <div className="border-t border-border-subtle pt-3 mt-3 flex justify-between font-bold text-text-primary text-lg">
                <span>To Pay</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>
          </div>

          <div className="hidden xl:block">
            <button 
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-[16px] shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isPlacingOrder ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                `Place Order • ₹${finalTotal}`
              )}
            </button>
          </div>

        </div>
      </div>

      <div className="xl:hidden fixed bottom-[85px] left-4 right-4 z-40">
        <button 
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-[16px] shadow-[0_8px_30px_rgba(226,64,28,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          {isPlacingOrder ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            `Place Order • ₹${finalTotal}`
          )}
        </button>
      </div>

    </div>

      <AnimatePresence>
        {isMapOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-bg-main flex flex-col"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border-subtle bg-bg-main">
              <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-bg-alt rounded-full">
                <X size={24} />
              </button>
              <h2 className="font-heading font-bold text-lg">Select Delivery Location</h2>
            </div>
            
            <div className="flex-1 relative">
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
                        onClick={async () => {
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
                    if (latitude && longitude) {
                      setMapLat(latitude);
                      setMapLng(longitude);
                      if (mapRef.current) {
                        mapRef.current.panTo({ lat: latitude, lng: longitude });
                        mapRef.current.setZoom(17.5);
                      }
                    } else {
                      setCoordinates(25.611, 85.130);
                    }
                  }}
                  className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg text-primary hover:bg-gray-50 transition-colors z-20 border border-border-subtle"
                >
                  <LocateFixed size={24} />
                </button>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center z-10">
                  <div className="relative flex flex-col items-center -mb-2 animate-bounce-slow">
                    <div className="w-10 h-10 bg-primary rounded-t-full rounded-bl-full rounded-br-sm rotate-45 flex items-center justify-center shadow-lg border-[3px] border-white drop-shadow-[0_4px_8px_rgba(226,64,28,0.5)]">
                      <div className="w-3 h-3 bg-white rounded-full shadow-inner -rotate-45" />
                    </div>
                  </div>
                  <div className="w-6 h-1.5 bg-black/50 rounded-[100%] mt-2 blur-[1px]"></div>
                </div>
              </div>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md text-sm font-bold text-text-primary border border-border-subtle z-10 whitespace-nowrap">
                Drag the pin to your exact location
              </div>
            </div>

            <div className="p-4 bg-bg-alt border-t border-border-subtle shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10 flex flex-col gap-4">
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Recipient Name"
                className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <input 
                type="text" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone Number (Required)"
                className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <input 
                type="text" 
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="House / Flat No., Landmark"
                className="w-full bg-bg-main border border-border-subtle rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary transition-colors"
              />
              <div className="flex gap-3">
                {['Home', 'Work', 'Other'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setMapAddressTag(tag as any)}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl border ${mapAddressTag === tag ? 'bg-primary/10 border-primary text-primary' : 'bg-bg-main border-border-subtle text-text-muted'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleSaveAddress}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                Confirm Location
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
              className="bg-white rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-2xl max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-50 to-transparent"></div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 mb-6 relative z-10"
              >
                <Check size={40} className="text-white" strokeWidth={3} />
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-heading font-black text-gray-900 mb-2 relative z-10"
              >
                Order Placed!
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-medium text-gray-500 relative z-10"
              >
                Your delicious food is on the way. Taking you to the tracking page...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
