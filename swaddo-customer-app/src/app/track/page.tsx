"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { Home, Bike, Check, Phone, MessageSquare, Star, Store, Navigation, Loader2 } from "lucide-react";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
const stages = ["Order Placed", "Preparing Food", "Out for Delivery", "Arriving"];

import { GoogleMap, useLoadScript, PolylineF, MarkerF } from "@react-google-maps/api";

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#FDFBF7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FDFBF7" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e3e3e3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8c967" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bc62" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#a5d5e2" }] },
];

const libraries: any = ["geometry"];

const getStoreIcon = () => {
  const svg = `
    <svg width="40" height="44" viewBox="0 0 40 44" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="18" r="16" fill="#E8B159" stroke="white" stroke-width="2"/>
      <path d="M20 44 L14 30 L26 30 Z" fill="#E8B159"/>
      <svg x="10" y="8" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18"></path><path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2-4h14l2 4"></path><line x1="5" y1="21" x2="5" y2="10"></line><line x1="19" y1="21" x2="19" y2="10"></line><path d="M9 21v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"></path>
      </svg>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getHomeIcon = () => {
  const svg = `
    <svg width="40" height="44" viewBox="0 0 40 44" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="18" r="16" fill="#2B2420" stroke="white" stroke-width="2"/>
      <path d="M20 44 L14 30 L26 30 Z" fill="#2B2420"/>
      <svg x="10" y="8" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getBikeIcon = (rotation: number) => {
  const svg = `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill="white" stroke="#E2401C" stroke-width="2"/>
      <g transform="translate(12, 12) rotate(${rotation} 12 12)">
        <rect x="6" y="6" width="12" height="2" rx="1" fill="#E2401C" />
        <rect x="11" y="2" width="2" height="6" rx="1" fill="#333333" />
        <rect x="9" y="7" width="6" height="12" rx="3" fill="#E2401C" />
        <circle cx="12" cy="12" r="3.5" fill="#2B2420" />
        <rect x="11" y="17" width="2" height="5" rx="1" fill="#333333" />
      </g>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};



const AnimatedRiderMarker = ({ targetLocation }: { targetLocation: {lat: number, lng: number} }) => {
  const [currentLocation, setCurrentLocation] = useState(targetLocation);
  const [rotation, setRotation] = useState(0);
  const prevLocationRef = useRef(targetLocation);
  
  useEffect(() => {
    if (!targetLocation) return;
    
    const lat1 = prevLocationRef.current.lat * Math.PI / 180;
    const lng1 = prevLocationRef.current.lng * Math.PI / 180;
    const lat2 = targetLocation.lat * Math.PI / 180;
    const lng2 = targetLocation.lng * Math.PI / 180;
    
    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    
    if (Math.abs(targetLocation.lat - prevLocationRef.current.lat) > 0.00001 || 
        Math.abs(targetLocation.lng - prevLocationRef.current.lng) > 0.00001) {
      setRotation(bearing);
    }

    const startTime = performance.now();
    const duration = 1500;
    const startLoc = { ...prevLocationRef.current };
    
    let animationFrameId: number;
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - (1 - progress) * (1 - progress); // easeOutQuad
      
      setCurrentLocation({
        lat: startLoc.lat + (targetLocation.lat - startLoc.lat) * ease,
        lng: startLoc.lng + (targetLocation.lng - startLoc.lng) * ease
      });
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        prevLocationRef.current = targetLocation;
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetLocation]);

  return (
    <MarkerF 
      position={currentLocation} 
      options={{
        icon: {
          url: getBikeIcon(rotation),
          anchor: window.google ? new window.google.maps.Point(24, 24) : undefined,
        },
        zIndex: 100
      }}
    />
  );
};

const RealMapInner = ({ mapToken, riderLoc, userLoc, stallLoc, stageIndex, riderAssigned, onDistanceUpdate }: { mapToken: string, riderLoc: {lat: number, lng: number} | null, userLoc: {lat: number, lng: number}, stallLoc: {lat: number, lng: number}, stageIndex: number, riderAssigned: boolean, onDistanceUpdate?: (dist: string, etaMinutes: string) => void }) => {
  const [routePath, setRoutePath] = useState<{lat: number, lng: number}[]>([]);
  const mapRef = useRef<any>(null);
  const lastFetchedRouteStage = useRef<number | null>(null);
  const interactTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const { isLoaded } = useLoadScript({
    id: 'google-map-script',
    googleMapsApiKey: mapToken,
    libraries
  });

  const baseRouteInfo = useRef<{distanceKm: number, durationMin: number, straightLineDist: number} | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!riderLoc || !userLoc || !stallLoc) return;
      if (lastFetchedRouteStage.current === stageIndex) return;
      if (!isLoaded || !window.google) return;

      let origin = riderLoc;
      let destination = stageIndex < 2 ? stallLoc : userLoc;
        try {
          const res = await api.post('/location/route', {
            originLat: origin.lat,
            originLng: origin.lng,
            destLat: destination.lat,
            destLng: destination.lng
          });
          const data = res.data.data;
          if (data && data.polyline) {
            const decodedPath = window.google.maps.geometry.encoding.decodePath(data.polyline);
            setRoutePath(decodedPath.map((p: any) => ({ lat: p.lat(), lng: p.lng() })));
            
            const straightLineDist = window.google.maps.geometry.spherical.computeDistanceBetween(origin, destination);
            baseRouteInfo.current = {
              distanceKm: parseFloat(data.distanceKm),
              durationMin: parseFloat(data.durationMin),
              straightLineDist
            };
            
            if (onDistanceUpdate) onDistanceUpdate(data.distanceKm + " km", Math.round(data.durationMin) + " Mins");
            lastFetchedRouteStage.current = stageIndex;
          }
        } catch (err) {
          console.error("Failed to fetch route from backend API", err);
        }
    };
    fetchRoute();
  }, [riderLoc, userLoc, stageIndex, isLoaded]);

  // Real-time live distance/ETA updates based on rider movement
  useEffect(() => {
    if (!riderLoc || !isLoaded || !window.google) return;
    
    const target = stageIndex < 2 ? stallLoc : userLoc;
    const currentStraightDist = window.google.maps.geometry.spherical.computeDistanceBetween(riderLoc, target);
    
    if (baseRouteInfo.current && baseRouteInfo.current.straightLineDist > 0) {
      const ratio = currentStraightDist / baseRouteInfo.current.straightLineDist;
      const estDistKm = Math.max(0.01, baseRouteInfo.current.distanceKm * ratio);
      const estDuration = Math.max(1, Math.round(baseRouteInfo.current.durationMin * ratio));
      if (onDistanceUpdate) onDistanceUpdate(estDistKm.toFixed(3) + " km", estDuration + " Mins");
    } else {
      const estDistKm = (currentStraightDist * 1.4) / 1000;
      const estDuration = Math.max(1, Math.round((estDistKm / 25) * 60));
      if (onDistanceUpdate) onDistanceUpdate(estDistKm.toFixed(3) + " km", estDuration + " Mins");
    }
  }, [riderLoc, stageIndex, userLoc, isLoaded]);

  const recenterMap = () => {
    if (!mapRef.current || !isLoaded || !window.google) return;

    if (riderLoc) {
      // Offset the camera slightly south so the rider marker appears in the upper half of the screen
      // This prevents the marker from being hidden underneath the large Bottom Sheet UI
      const offsetLat = riderLoc.lat - 0.0015; // Approx 150 meters south
      mapRef.current.panTo({ lat: offsetLat, lng: riderLoc.lng });
      mapRef.current.setZoom(17.5);
      return;
    }
    
    // Fallback if no rider location is available
    const bounds = new window.google.maps.LatLngBounds();
    let pointsCount = 0;

    let destination = null;
    if (stageIndex < 2 && stallLoc) destination = stallLoc;
    else if (stageIndex >= 2 && userLoc) destination = userLoc;

    if (destination) {
      bounds.extend(destination);
      pointsCount++;
    }
    
    if (routePath && routePath.length > 0) {
      routePath.forEach(point => bounds.extend(point));
      pointsCount += routePath.length;
    }

    if (pointsCount > 1) {
      mapRef.current.fitBounds(bounds, { top: 100, bottom: 100, left: 40, right: 40 });
    } else if (pointsCount === 1) {
      mapRef.current.panTo(destination || userLoc);
      mapRef.current.setZoom(17);
    }
  };

  useEffect(() => {
    if (!isUserInteracting) {
      recenterMap();
    }
  }, [stageIndex, riderLoc, stallLoc, userLoc, isLoaded, isUserInteracting]);

  const handleDragStart = () => {
    setIsUserInteracting(true);
    if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current);
  };
  
  const handleDragEnd = () => {
    if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current);
    interactTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 2000);
  };

  // Removed initialCenter to make map uncontrolled

  if (!isLoaded || !mapToken) {
    return (
      <div className="absolute inset-0 bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#FDFBF7]">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          backgroundColor: '#FDFBF7',
          maxZoom: 18,
          minZoom: 10,
          gestureHandling: "greedy"
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onLoad={(map) => { 
          mapRef.current = map; 
          setMapReady(true); 
          map.setCenter({ lat: 25.611, lng: 85.130 });
          map.setZoom(14);
          recenterMap();
        }}
      >
        {mapReady && window.google && (
          <>
            {userLoc && stageIndex >= 2 && (
              <MarkerF 
                position={userLoc} 
                options={{
                  icon: { url: getHomeIcon(), anchor: new window.google.maps.Point(20, 44) },
                  zIndex: 10
                }}
              />
            )}
            
            {stallLoc && stageIndex < 2 && (
              <MarkerF 
                position={stallLoc} 
                options={{
                  icon: { url: getStoreIcon(), anchor: new window.google.maps.Point(20, 44) },
                  zIndex: 10
                }}
              />
            )}

            {riderLoc && <AnimatedRiderMarker targetLocation={riderLoc} />}

            {routePath.length > 0 && riderLoc && (
              <PolylineF
                path={routePath}
                options={{
                  strokeColor: "#E2401C",
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />
            )}
          </>
        )}
      </GoogleMap>

      {!riderAssigned && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-border-subtle flex flex-col items-center pointer-events-none z-10">
          <Loader2 className="animate-spin text-primary mb-2" size={32} />
          <h3 className="font-heading font-bold text-text-primary text-lg">Waiting for Rider...</h3>
          <p className="text-text-muted text-sm mt-1 text-center">Finding a delivery partner for your order</p>
        </div>
      )}
    </div>
  );
};

const RealMap = (props: any) => {
  const [mapToken, setMapToken] = useState("");
  
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await api.get('/location/map-token');
        if (res.data?.token) setMapToken(res.data.token);
      } catch (err) {
        console.error("Failed to fetch map token", err);
      }
    };
    fetchToken();
  }, []);

  if (!mapToken) {
    return (
      <div className="absolute inset-0 bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return <RealMapInner mapToken={mapToken} {...props} />;
};

function OrderTrackingContent() {
  useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  
  const [orderStatus, setOrderStatus] = useState<any>({
    stageIndex: 0, // 0: Placed, 1: Prep, 2: Out, 3: Arriving
    status: 'pending',
    eta: "12 Mins",
    riderLocation: null,
    userLocation: { lat: 25.590, lng: 85.140 },
    stallLocation: { lat: 25.611, lng: 85.130 },
    rider: null,
    orderData: null,
  });

  const [routeDistance, setRouteDistance] = useState("Calculating...");
  const [notFound, setNotFound] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    if (!orderId) return;
    
    // 1. Fetch real initial status
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data && res.data.data) {
          const order = res.data.data;
          
          let newStage = 0;
          if (order.status === 'preparing' || order.status === 'ready') newStage = 1;
          if (order.status === 'heading_to_stall' || order.status === 'assigned' || order.status === 'at_stall') newStage = 1;
          if (order.status === 'heading_to_customer') newStage = 2;
          if (order.status === 'at_customer' || order.status === 'delivered') newStage = 3;
          
          let stallLocation = { lat: order.stall?.lat || 25.611, lng: order.stall?.lng || 85.130 };
          let customerLocation = { lat: order.deliveryLat || 25.590, lng: order.deliveryLng || 85.140 };

          // Note: Initial rider location might only come from live socket pings. 
          // If the backend returns it in `order.riderLocation`, we'd use it here.
          let rLoc = order.riderLocation || null;
          
          if (!rLoc) {
            try {
              const localRider = localStorage.getItem(`rider_loc_${orderId}`);
              if (localRider) {
                rLoc = JSON.parse(localRider);
              }
            } catch(e) {}
          }

          setOrderStatus((prev: any) => ({ 
            ...prev, 
            stageIndex: newStage, 
            status: order.status,
            stallLocation,
            userLocation: customerLocation,
            riderLocation: rLoc, 
            rider: order.rider ? { name: order.rider.name, phone: order.rider.phone, vehicle: order.rider.vehicle } : null,
            orderData: order,
            eta: newStage < 2 ? (order.stall?.estimated_prep_time ? order.stall.estimated_prep_time + " Mins" : "25 Mins") : prev.eta
          }));
        } else {
          setNotFound(true);
        }
      } catch (err: any) {
        console.error("Failed to fetch order", err);
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        
        if (status === 403) {
           setErrorDetails({
             title: "Access Denied", 
             message: msg || "This order doesn't seem to belong to you. Please check your active orders."
           });
        } else if (status === 404) {
           setErrorDetails({
             title: "Order Not Found", 
             message: msg || "We couldn't find the order you're looking for."
           });
        } else {
           setErrorDetails({
             title: "Something went wrong", 
             message: "Unable to track this order at the moment. Please try again later."
           });
        }
      }
    };
    fetchOrder();

    // 2. Listen for live updates on targeted channel
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL; if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, ""); const socket = io(socketUrl || "http://localhost:5005", { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 5000 });

    const orderChannel = `order:${orderId}`;
    socket.on("connect", () => {
      console.log(`Connected to global socket for order tracking`);
      socket.emit("join_room", orderChannel);
      socket.emit("join_room", `room_${orderId}`); // The backend broadcasts rider_location_update to room_${orderId}
    });

    socket.on('rider_location_update', (data: any) => {
      console.log("[Socket] Received Rider Location Update:", data);
      setOrderStatus((prev: any) => {
        if (data.latitude && data.longitude) {
          return {
            ...prev,
            riderLocation: { lat: data.latitude, lng: data.longitude },
            status: data.status || prev.status
          };
        }
        return prev;
      });
    });

    socket.on(orderChannel, (update: any) => {
      console.log("[Socket] Received Status Update:", update);

      setOrderStatus((prev: any) => {
        // Default to keeping the current stage, preventing regression!
        let newStage = prev.stageIndex;
        
        if (update.status === 'placed' || update.status === 'pending') newStage = 0;
        if (update.status === 'preparing' || update.status === 'ready') newStage = 1;
        if (update.status === 'heading_to_stall' || update.status === 'assigned' || update.status === 'at_stall') newStage = 1;
        if (update.status === 'heading_to_customer') newStage = 2;
        if (update.status === 'at_customer' || update.status === 'delivered') newStage = 3;

        return {
          ...prev,
          stageIndex: newStage,
          status: update.status,
          rider: update.deliveryPartner || prev.rider,
          riderLocation: update.riderLocation || prev.riderLocation,
          eta: update.deliveryPartner && newStage < 2 ? "25 Mins" : prev.eta
        };
      });
    });

    const fallbackInterval = setInterval(() => {
      try {
        const localRider = localStorage.getItem(`rider_loc_${orderId}`);
        if (localRider) {
          const parsed = JSON.parse(localRider);
          setOrderStatus((prev: any) => {
            if (!prev.riderLocation || prev.riderLocation.lat !== parsed.lat || prev.riderLocation.lng !== parsed.lng) {
              return { ...prev, riderLocation: parsed };
            }
            return prev;
          });
        }
      } catch (e) {}
    }, 2000);

    const apiPollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data && res.data.data) {
          const rLoc = res.data.data.riderLocation;
          if (rLoc && rLoc.lat && rLoc.lng) {
             setOrderStatus((prev: any) => {
               if (!prev.riderLocation || prev.riderLocation.lat !== rLoc.lat || prev.riderLocation.lng !== rLoc.lng) {
                 return { ...prev, riderLocation: rLoc };
               }
               return prev;
             });
          }
        }
      } catch(e) {}
    }, 5000);

    return () => {
      clearInterval(fallbackInterval);
      clearInterval(apiPollInterval);
      socket.disconnect();
    };
  }, [orderId]);

  if (errorDetails || notFound) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-bg-main p-6">
        <div className="text-center max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-border-subtle">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Store size={40} className="text-primary opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3 font-heading">{errorDetails?.title || "Order Not Found"}</h2>
          <p className="text-text-muted mb-8">{errorDetails?.message || "This order does not exist or has been erased."}</p>
          <button 
            onClick={() => window.location.href = '/orders'}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            Go to My Orders
          </button>
        </div>
      </div>
    );
  }

  if (orderStatus.status === 'delivered') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full bg-bg-main p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-6"
        >
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-xl">
            <Check size={48} strokeWidth={3} />
          </div>
        </motion.div>
        <h2 className="text-3xl font-heading font-bold text-text-primary mb-2">Delivered Successfully!</h2>
        <p className="text-text-muted mb-8 max-w-[280px]">Your order has arrived. Enjoy your meal and don't forget to rate your experience.</p>
        
        <button 
          onClick={() => window.location.href = '/orders'}
          className="w-full max-w-[300px] bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-primary/30"
        >
          View Order History
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-bg-main relative">
      {/* Dynamic Map Component */}
      <div className="flex-1 relative z-0">
        <RealMap 
          riderLoc={orderStatus.riderLocation}
          userLoc={orderStatus.userLocation}
          stallLoc={orderStatus.stallLocation}
          stageIndex={orderStatus.stageIndex}
          riderAssigned={!!orderStatus.rider}
          onDistanceUpdate={(dist, eta) => {
            setRouteDistance(dist);
            setOrderStatus((prev: any) => ({ ...prev, eta: prev.stageIndex >= 2 ? (eta || prev.eta) : prev.eta }));
          }}
        />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-10 p-4 pt-safe pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-border-subtle p-4 flex items-center justify-between pointer-events-auto">
          <div>
            <h2 className="font-heading font-bold text-text-primary text-lg">Order #{orderId?.toString().slice(-4)}</h2>
            <p className="text-sm font-medium text-text-muted">{orderStatus.status.toUpperCase()}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Bike size={24} className="text-primary" />
          </div>
        </div>
      </div>

      {/* ETA Bottom Sheet UI */}
      <div className="absolute bottom-0 left-0 w-full z-10">
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-4 pb-safe"
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
          
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-text-muted font-bold text-xs mb-1">Estimated Arrival</p>
              <h1 className="text-3xl font-heading font-black text-primary">{orderStatus.eta}</h1>
            </div>
            <div className="text-right">
              <p className="text-text-muted font-bold text-xs mb-1">Distance</p>
              <p className="text-lg font-bold text-text-primary">{routeDistance}</p>
            </div>
          </div>

          {/* Delivery Partner Info */}
          {orderStatus.rider && (
            <div className="bg-bg-alt rounded-2xl p-3 flex items-center gap-3 border border-border-subtle mb-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-full border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                <span className="text-white font-heading font-bold text-lg">{orderStatus.rider.name?.charAt(0) || 'R'}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text-primary text-base">{orderStatus.rider.name || 'Ramu K.'}</h3>
                <div className="flex items-center text-xs font-bold text-text-muted">
                  <Star size={12} className="text-accent fill-accent mr-1" />
                  4.8 • {orderStatus.rider.vehicle || 'Bike'}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-border-subtle text-primary">
                  <MessageSquare size={18} />
                </button>
                <a href={`tel:${orderStatus.rider.phone || ''}`} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md text-white">
                  <Phone size={18} className="fill-white" />
                </a>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="relative pt-2">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-subtle"></div>
            {stages.map((stage: string, index: number) => {
              const isCompleted = index <= orderStatus.stageIndex;
              const isCurrent = index === orderStatus.stageIndex;
              
              return (
                <div key={index} className={`flex items-center mb-4 last:mb-0 relative z-10 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs mr-3 transition-colors ${isCompleted ? 'bg-primary shadow-md' : 'bg-border-subtle'}`}>
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </div>
                  <div>
                    <h4 className={`font-bold ${isCurrent ? 'text-primary' : 'text-text-primary'} text-sm transition-colors`}>{stage}</h4>
                    {isCurrent && <p className="text-text-muted text-xs font-medium mt-0.5">Your order is currently {stage.toLowerCase()}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function OrderTracking() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <OrderTrackingContent />
    </Suspense>
  )
}

