"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Star, CheckCircle2, XCircle, Loader2, ChevronRight, MapPin, RefreshCw, Route, ThumbsUp, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";

const getRestaurantImage = (stallName: string) => {
  const name = stallName.toLowerCase();
  if (name.includes('pizza')) return '/categories/pizza.jpg';
  if (name.includes('biryani')) return '/categories/biryani.png';
  if (name.includes('burger')) return '/categories/burger.jpg';
  if (name.includes('cake') || name.includes('sweet')) return '/categories/cake.jpg';
  if (name.includes('dosa') || name.includes('south')) return '/categories/south_indian.jpg';
  if (name.includes('chinese')) return '/categories/chinese.jpg';
  return '/categories/north_indian.jpg'; // fallback
};

interface RatingState {
  score: number;
  timestamp: number | null;
}

interface OrderRating {
  app: RatingState;
  restaurant: RatingState;
  rider: RatingState;
}

export default function Orders() {
  useAuth();
  const router = useRouter();
  const { clearCart, updateQuantity } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rating Modal States
  const [orderToRate, setOrderToRate] = useState<any | null>(null);
  const [currentRatings, setCurrentRatings] = useState<OrderRating>({
    app: { score: 0, timestamp: null },
    restaurant: { score: 0, timestamp: null },
    rider: { score: 0, timestamp: null }
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        const json = res.data;
        const mapped = json.data.map((o: any) => {
            const itemsArray = (o.items || "1x Order Item").split(',').map((i: string) => {
              const parts = i.trim().split('x ');
              return { qty: parseInt(parts[0]) || 1, name: parts[1] || parts[0] };
            });

            return {
              id: o.id,
              stall: o.stall_name || o.stall || "Stall",
              date: `${o.date}, ${o.time}`,
              items: itemsArray,
              summary: o.items_summary || o.items || "Order Items",
              total: o.total,
              status: o.status,
              location: o.stall_location || "Gondia City, Maharashtra",
              // Store rating data internally for demo
              ratingData: {
                app: { score: 0, timestamp: null },
                restaurant: { score: 0, timestamp: null },
                rider: { score: 0, timestamp: null }
              }
            };
          });
          setOrders(mapped);

          // Listen to real-time updates for active orders
          let socketUrl = process.env.NEXT_PUBLIC_WS_URL; if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, ""); const socket = io(socketUrl || "http://localhost:5005", { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 5000 });
          
          mapped.forEach((o: any) => {
            if (!['delivered', 'cancelled', 'declined'].includes(o.status)) {
              socket.on(`order:${o.id}`, (update: any) => {
                setOrders(prev => prev.map(order => order.id === update.id || order.id.toString() === update.id ? { ...order, status: update.status } : order));
              });
            }
          });
          
          // Cleanup socket on unmount
          return () => socket.disconnect();

      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    let cleanupSocket: any;
    fetchOrders().then(cleanup => cleanupSocket = cleanup);

    return () => {
      if (cleanupSocket) cleanupSocket();
    };
  }, []);

  const handleReorder = (order: any) => {
    clearCart();
    
    order.items.forEach((item: any) => {
      updateQuantity(order.id.toString(), order.stall, {
        id: `item-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: item.name,
        price: 150 // Since we don't have price in order summary currently, using fallback
      }, item.qty);
    });

    alert('Items added to cart!');
    router.push('/cart');
  };

  const openRatingModal = (order: any) => {
    setOrderToRate(order);
    setCurrentRatings(JSON.parse(JSON.stringify(order.ratingData))); // Deep copy
  };

  const isLocked = (timestamp: number | null) => {
    if (!timestamp) return false;
    return (Date.now() - timestamp) > 10 * 60 * 1000; // 10 minutes in ms
  };

  const handleStarClick = (category: keyof OrderRating, score: number) => {
    if (isLocked(currentRatings[category].timestamp)) return;
    
    setCurrentRatings(prev => ({
      ...prev,
      [category]: { ...prev[category], score }
    }));
  };

  const submitRatings = () => {
    if (!orderToRate) return;

    // Update timestamps for newly rated items
    const updatedRatings = { ...currentRatings };
    const now = Date.now();

    if (updatedRatings.app.score > 0 && !updatedRatings.app.timestamp) updatedRatings.app.timestamp = now;
    if (updatedRatings.restaurant.score > 0 && !updatedRatings.restaurant.timestamp) updatedRatings.restaurant.timestamp = now;
    if (updatedRatings.rider.score > 0 && !updatedRatings.rider.timestamp) updatedRatings.rider.timestamp = now;

    // Save back to the orders list
    setOrders(prev => prev.map(o => o.id === orderToRate.id ? { ...o, ratingData: updatedRatings } : o));
    
    setOrderToRate(null);
    alert('Ratings submitted successfully!');
  };

  const isFullyRated = (ratingData: OrderRating) => {
    return ratingData.app.score > 0 && ratingData.restaurant.score > 0 && ratingData.rider.score > 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-32 xl:pb-12 font-body">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm py-4 px-4 sm:px-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex flex-col">
           <h1 className="text-lg font-heading font-black text-gray-900 leading-tight">Past Orders</h1>
           <p className="text-xs text-gray-500 font-medium">Food delivery & dining</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-4 px-4 sm:px-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary mb-4" size={32} />
            <p className="text-gray-500 font-medium">Loading your delicious history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
               <Clock size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-500 text-sm">Looks like you haven't ordered anything yet.</p>
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            
            {/* Top Info */}
            <div className="p-4 flex gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 shadow-sm relative">
                <Image src={getRestaurantImage(order.stall)} alt={order.stall} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-heading font-black text-gray-900 text-lg leading-tight truncate">{order.stall}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1 truncate">{order.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-gray-900">₹{order.total}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-4 border-t border-dashed border-gray-200"></div>

            {/* Items List */}
            <div className="px-4 py-3 bg-gray-50/50">
               <div className="space-y-1.5">
                  {order.items.map((item: any, idx: number) => (
                     <div key={idx} className="flex gap-2 text-sm">
                        <span className="text-gray-500 font-medium shrink-0">{item.qty} x</span>
                        <span className="text-gray-800 font-medium">{item.name}</span>
                     </div>
                  ))}
               </div>
               <div className="mt-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  {order.date}
               </div>
            </div>

            {/* Status & Actions */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {order.status === "delivered" ? (
                  <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-md">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Delivered</span>
                  </div>
                ) : order.status === "cancelled" ? (
                  <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                    <XCircle size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Cancelled</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                    <Clock size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">{order.status.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {order.status === "delivered" ? (
                  <>
                    <button 
                      onClick={() => openRatingModal(order)} 
                      className={`flex items-center gap-1.5 font-bold py-2 px-4 rounded-xl transition-colors text-xs ${isFullyRated(order.ratingData) ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    >
                      {isFullyRated(order.ratingData) ? <CheckCircle2 size={14} /> : <ThumbsUp size={14} />} 
                      {isFullyRated(order.ratingData) ? 'Rated' : 'Rate'}
                    </button>
                    <button onClick={() => handleReorder(order)} className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold py-2 px-4 rounded-xl transition-colors text-xs">
                      <RefreshCw size={14} /> Reorder
                    </button>
                  </>
                ) : order.status === "cancelled" ? (
                  <button onClick={() => handleReorder(order)} className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold py-2 px-4 rounded-xl transition-colors text-xs">
                    <RefreshCw size={14} /> Reorder
                  </button>
                ) : (
                  <Link href={`/track?id=${order.id}`} className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary-hover font-bold py-2 px-4 rounded-xl transition-colors text-xs">
                    <Route size={14} /> Track
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Rating Modal */}
      {orderToRate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl my-8">
            
            <h3 className="text-xl font-heading font-black text-gray-900 mb-2 text-center">Rate Your Experience</h3>
            
            {/* Ordered Items Context */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">You ordered from {orderToRate.stall}</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {orderToRate.items.map((item: any, idx: number) => (
                   <p key={idx} className="text-sm font-medium text-gray-800">{item.qty}x {item.name}</p>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              
              {/* Restaurant Rating */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Restaurant & Food</span>
                  {isLocked(currentRatings.restaurant.timestamp) && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Lock size={10}/> Locked</span>}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => handleStarClick('restaurant', star)}
                      disabled={isLocked(currentRatings.restaurant.timestamp)}
                      className={`p-1 transition-transform ${isLocked(currentRatings.restaurant.timestamp) ? 'cursor-not-allowed opacity-80' : 'hover:scale-110 active:scale-95'}`}
                    >
                      <Star size={32} className={`${star <= currentRatings.restaurant.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Rider Rating */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Delivery Partner</span>
                  {isLocked(currentRatings.rider.timestamp) && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Lock size={10}/> Locked</span>}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => handleStarClick('rider', star)}
                      disabled={isLocked(currentRatings.rider.timestamp)}
                      className={`p-1 transition-transform ${isLocked(currentRatings.rider.timestamp) ? 'cursor-not-allowed opacity-80' : 'hover:scale-110 active:scale-95'}`}
                    >
                      <Star size={32} className={`${star <= currentRatings.rider.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* App Rating */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">SwaDDo App Experience</span>
                  {isLocked(currentRatings.app.timestamp) && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Lock size={10}/> Locked</span>}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => handleStarClick('app', star)}
                      disabled={isLocked(currentRatings.app.timestamp)}
                      className={`p-1 transition-transform ${isLocked(currentRatings.app.timestamp) ? 'cursor-not-allowed opacity-80' : 'hover:scale-110 active:scale-95'}`}
                    >
                      <Star size={32} className={`${star <= currentRatings.app.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>

            </div>
            
            <p className="text-[11px] text-center text-gray-400 mt-6 leading-relaxed bg-gray-50 p-2 rounded-lg">
              Ratings are permanently locked 10 minutes after being submitted. You can rate categories independently.
            </p>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setOrderToRate(null)} 
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitRatings} 
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all active:scale-95"
              >
                Submit Ratings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

