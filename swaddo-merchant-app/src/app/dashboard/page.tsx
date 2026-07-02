"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, Store, ChefHat, PackageCheck, AlertCircle, MapPin, Navigation, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  const [stats, setStats] = useState({ ordersToday: 0, revenueToday: 0, avgRating: 0 });
  const [stallInfo, setStallInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'new'|'preparing'|'ready'|'completed'|'past'>('new');
  const [activeOrderDetails, setActiveOrderDetails] = useState<any>(null);
  const router = useRouter();
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  const activeTabCounts = useMemo(() => {
    const todayStr = new Date().toDateString();
    const counts = { new: 0, preparing: 0, ready: 0, completed: 0, past: 0 };
    orders.forEach(o => {
      if (o.status === 'pending') counts.new++;
      else if (o.status === 'preparing') counts.preparing++;
      else if (o.status === 'ready') counts.ready++;
      else if (['delivered', 'cancelled', 'declined'].includes(o.status)) {
        const orderDateStr = o.created_at ? new Date(o.created_at).toDateString() : o.time;
        if (orderDateStr === todayStr) counts.completed++;
        else counts.past++;
      }
    });
    return counts as Record<string, number>;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter(o => {
      if (activeTab === 'new') return o.status === 'pending';
      if (activeTab === 'preparing') return o.status === 'preparing';
      if (activeTab === 'ready') return o.status === 'ready';
      
      const isPastStatus = ['delivered', 'cancelled', 'declined'].includes(o.status);
      if (!isPastStatus) return false;
      
      const orderDateStr = o.created_at ? new Date(o.created_at).toDateString() : o.time;
      if (activeTab === 'completed') return orderDateStr === todayStr;
      if (activeTab === 'past') return orderDateStr !== todayStr;
      return false;
    });
  }, [orders, activeTab]);

  useEffect(() => {
    // Initialize audio
    alarmAudio.current = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
    alarmAudio.current.loop = true;


    let socket: any;
    let stallChannel: string = "";

    const initialize = async () => {
      try {
          // 1. Fetch initial orders and stats concurrently
          let statsRes: any = null;
          let stallId = null;

          try {
            const [ordersRes, sRes, myStallRes] = await Promise.all([
              api.get('/orders?limit=100'),
              api.get('/stalls/merchant/stats'),
              api.get('/stalls/merchant/my-stall')
            ]);
            
            if (ordersRes.data && ordersRes.data.data) {
              setOrders(ordersRes.data.data);
            }
            
            if (sRes.data) {
              setStats(sRes.data);
              stallId = sRes.data.stallId;
            }

            if (myStallRes.data) {
               setStallInfo(myStallRes.data);
               if (myStallRes.data.is_open !== undefined) {
                 setIsAcceptingOrders(myStallRes.data.is_open);
               }
            }
          } catch (e) {
            console.error("Initialization error", e);
          }
          
          if (!stallId) {
             console.error("No stall ID found for this vendor");
             setIsInitializing(false);
             return;
          }

          setIsInitializing(false);

          stallChannel = `stall:${stallId}:orders`;

          // 2. Connect to targeted socket channel
          socket = connectSocket();
          socket.off(stallChannel); // Remove any old listeners in strict mode
          socket.on("connect", () => {
            console.log(`Merchant socket connected to ${stallChannel}`);
          });

          socket.on(stallChannel, (update: any) => {
            setOrders(prev => {
              // Match by either string 'id' (legacy) or integer 'orderId'
              const existingIndex = prev.findIndex(o => o.id == update.id || o.id == update.orderId);
              
              if (existingIndex >= 0) {
                // Status Update
                const newOrders = [...prev];
                const oldOrder = newOrders[existingIndex];
                newOrders[existingIndex] = { ...oldOrder, status: update.status };
                
                // Add to revenue if it just got delivered
                if (oldOrder.status !== 'delivered' && update.status === 'delivered') {
                   setStats(s => ({
                     ...s,
                     revenueToday: s.revenueToday + (Number(oldOrder.total) || 0)
                   }));
                }
                
                // If the updated order was the incoming order and it got cancelled or something, clear it
                if (incomingOrder && incomingOrder.id === update.id && update.status !== 'pending') {
                   setIncomingOrder(null);
                   if (alarmAudio.current) { alarmAudio.current.pause(); alarmAudio.current.currentTime = 0; }
                }
                
                return newOrders;
              } else {
                // New Order
                if (update.status === 'pending') {
                  setIncomingOrder(update);
                  if (alarmAudio.current) {
                    alarmAudio.current.play().catch(e => console.log('Audio play blocked:', e));
                  }
                  setStats(s => ({
                    ...s,
                    ordersToday: s.ordersToday + 1
                    // Do NOT add to revenueToday here! Revenue is only added after delivery.
                  }));
                }
                return [update, ...prev];
              }
            });
          });
      } catch (err) {
        console.error("Failed to initialize dashboard", err);
      }
    };
    
    initialize();

    return () => {
      if (socket && stallChannel) {
        socket.off(stallChannel);
        disconnectSocket();
      }
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Stop alarm if accepting/rejecting the incoming order
    if (incomingOrder && incomingOrder.id === orderId) {
      setIncomingOrder(null);
      if (alarmAudio.current) { alarmAudio.current.pause(); alarmAudio.current.currentTime = 0; }
    }
    
    // Optimistically update UI
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Call backend
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update order status. Please check your connection.");
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col min-h-screen pt-8 px-6 pb-24 max-w-md mx-auto bg-bg-main">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-6"></div>
        <div className="flex gap-2 mb-6">
          <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pt-8 px-6 pb-24 max-w-md mx-auto relative">
      
      {/* Full Screen Incoming Order Modal */}
      <AnimatePresence>
        {incomingOrder && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-primary flex flex-col justify-center items-center p-6"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
            >
              <BellRing size={40} className="text-primary" />
            </motion.div>
            
            <h2 className="text-3xl font-heading font-bold text-white mb-2 text-center">New Order!</h2>
            <p className="text-white/80 mb-8 text-center text-lg">Order #{incomingOrder.id}</p>
            
            <div className="bg-white rounded-2xl w-full p-6 shadow-xl mb-8">
              <h3 className="font-heading font-bold text-text-primary text-xl mb-4">{incomingOrder.items}</h3>
              {incomingOrder.customer && (
                <div className="mb-4 text-left border-t border-border-subtle pt-4">
                  <p className="text-text-muted text-sm font-bold">Customer Info</p>
                  <p className="text-text-primary font-bold">{incomingOrder.customer}</p>
                  {incomingOrder.address && <p className="text-text-muted text-sm mt-1 line-clamp-2">{incomingOrder.address}</p>}
                  {/* Phone number hidden as per request */}
                  {incomingOrder.restaurantInstructions && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Note from customer</p>
                      <p className="text-sm font-medium text-yellow-900">{incomingOrder.restaurantInstructions}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center border-t border-border-subtle pt-4">
                <span className="text-text-muted font-bold">Total Amount</span>
                <span className="text-2xl font-bold text-primary">₹{Number(incomingOrder.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={() => updateOrderStatus(incomingOrder.id, 'preparing')}
                className="w-full bg-white text-primary py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
              >
                Accept Order
              </button>
              <button 
                onClick={() => updateOrderStatus(incomingOrder.id, 'cancelled')}
                className="w-full bg-black/20 text-white py-4 rounded-xl font-bold text-lg active:scale-95 transition-transform border border-white/20"
              >
                Reject
              </button>
            </div>
          </motion.div>
        )}

        {/* Order Details Modal (View Details) */}
        {activeOrderDetails && !incomingOrder && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-40 bg-black/50 flex flex-col justify-end"
          >
            <div className="bg-white rounded-t-3xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto pb-24">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-text-primary">Order Details</h2>
                  <p className="text-text-muted text-sm font-medium">#{activeOrderDetails.id}</p>
                </div>
                <button 
                  onClick={() => setActiveOrderDetails(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-text-primary text-lg mb-2">Items</h3>
                  <div className="p-4 bg-bg-main rounded-xl border border-border-subtle">
                    <p className="font-medium text-text-primary">{activeOrderDetails.items}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-text-primary text-lg mb-2">Customer Info</h3>
                  <div className="p-4 bg-bg-main rounded-xl border border-border-subtle space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-text-primary">{activeOrderDetails.customer}</span>
                      {/* Phone hidden */}
                    </div>
                    {activeOrderDetails.address && (
                      <div className="flex items-start gap-2 text-sm text-text-muted">
                        <MapPin size={16} className="shrink-0 mt-0.5 text-accent" />
                        <span>{activeOrderDetails.address}</span>
                      </div>
                    )}
                    {activeOrderDetails.restaurantInstructions && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Note from customer</p>
                        <p className="text-sm font-medium text-yellow-900">{activeOrderDetails.restaurantInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                {activeOrderDetails.deliveryPartner && activeOrderDetails.status !== 'delivered' && (
                  <div>
                    <h3 className="font-bold text-text-primary text-lg mb-2">Delivery Partner</h3>
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                          <Navigation size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{activeOrderDetails.deliveryPartner.name}</p>
                          {activeOrderDetails.deliveryPartner.vehicle && (
                            <p className="text-xs text-text-muted mt-0.5">{activeOrderDetails.deliveryPartner.vehicle}</p>
                          )}
                        </div>
                      </div>
                      {activeOrderDetails.deliveryPartner.phone && activeOrderDetails.deliveryPartner.phone !== 'N/A' && (
                        <a href={`tel:${activeOrderDetails.deliveryPartner.phone}`} className="text-sm font-bold text-primary px-4 py-2 bg-white rounded-xl shadow-sm border border-border-subtle">
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center p-4 bg-bg-alt rounded-xl border border-border-subtle">
                  <span className="text-text-muted font-bold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">₹{Number(activeOrderDetails.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted text-sm">Manage your live orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-muted">Accepting</span>
          <button 
            onClick={async () => {
              if (isInitializing) return;
              const newState = !isAcceptingOrders;
              setIsAcceptingOrders(newState);
              try {
                if (stallInfo && stallInfo.id) {
                  await api.put(`/stalls/${stallInfo.id}`, { is_open: newState });
                } else {
                  const vendorRes = await api.get('/stalls/merchant/my-stall');
                  if (vendorRes.data && vendorRes.data.id) {
                    await api.put(`/stalls/${vendorRes.data.id}`, { is_open: newState });
                  }
                }
              } catch (err) {
                console.error("Failed to update status", err);
                setIsAcceptingOrders(!newState); // revert on failure
              }
            }}
            className={`w-14 h-8 rounded-full flex items-center p-1 ${isInitializing ? '' : 'transition-colors duration-300'} ${
              isAcceptingOrders ? "bg-accent" : "bg-border-subtle"
            }`}
          >
            <div 
              className={`w-6 h-6 rounded-full bg-white shadow-md transform ${isInitializing ? '' : 'transition-transform duration-300'} ${
                isAcceptingOrders ? "translate-x-6" : "translate-x-0"
              }`} 
            />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/insights" className="bg-bg-alt rounded-2xl p-4 shadow-sm border border-border-subtle hover:bg-gray-50 transition-colors block">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Orders</p>
          <p className="text-2xl font-heading font-bold text-accent">{stats.ordersToday || 0}</p>
        </Link>
        <Link href="/earnings" className="bg-bg-alt rounded-2xl p-4 shadow-sm border border-border-subtle hover:bg-gray-50 transition-colors block">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Earnings</p>
          <p className="text-2xl font-heading font-bold text-green-600">
            ₹{(stats.revenueToday || 0).toFixed(2)}
          </p>
        </Link>
      </div>

      {/* Active Orders List */}
      <h2 className="text-lg font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
        <Store size={20} className="text-accent" />
        Live Orders
      </h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4 -mx-2 px-2">
        {(['new', 'preparing', 'ready', 'completed', 'past'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = activeTabCounts[tab];
          
          const labels: Record<string, string> = { new: 'New', preparing: 'Preparing', ready: 'Out for Delivery', completed: 'Completed', past: 'Past' };
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-colors border ${
                isActive 
                  ? 'bg-accent text-white border-accent' 
                  : 'bg-white text-text-muted border-border-subtle hover:bg-bg-alt'
              }`}
            >
              {labels[tab]} {count > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-border-subtle'}`}>{count}</span>}
            </button>
          );
        })}
      </div>
      
      <div className="space-y-4">
        {(() => {

          if (filteredOrders.length === 0) {
            return (
              <div className="text-center py-12 opacity-50">
                <AlertCircle size={48} className="mx-auto mb-4 text-text-muted" />
                <p className="font-bold text-text-primary">No orders here</p>
                <p className="text-sm text-text-muted mt-1">Nothing to show in this tab.</p>
              </div>
            );
          }

          const renderOrderCard = (order: any) => (
            <div key={order.id} className="bg-bg-alt rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-accent/10 text-accent font-bold text-[10px] uppercase tracking-wider rounded-md mb-2">
                    Order #{order.id}
                  </span>
                  <h3 className="font-heading font-bold text-text-primary text-lg">{order.items}</h3>
                  <p className="text-sm text-text-muted mt-1 font-medium">
                    {['delivered', 'cancelled', 'declined'].includes(order.status) && order.created_at
                      ? `${new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${order.time}`
                      : order.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-text-primary text-lg">₹{Number(order.total || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* View Details Button (Compact UI) */}
              <button
                onClick={() => setActiveOrderDetails(order)}
                className="w-full py-2 bg-bg-main border border-border-subtle rounded-xl text-sm font-bold text-accent hover:bg-accent/5 transition-colors"
              >
                View Details
              </button>

              {/* Status Actions */}
              <div className="pt-3 border-t border-border-subtle flex gap-2">
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'declined')}
                      className="flex-1 py-2.5 rounded-xl border border-border-subtle text-text-muted font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-[2] py-2.5 rounded-xl bg-accent hover:bg-yellow-600 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <ChefHat size={16} /> Accept & Prepare
                    </button>
                  </>
                )}

                {order.status === 'preparing' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full py-2.5 rounded-xl bg-[#2B2420] hover:bg-black text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <PackageCheck size={16} /> Mark as Out for Delivery
                  </button>
                )}

                {order.status === 'ready' && (
                  <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-sm flex items-center justify-center gap-2">
                    <Clock size={16} /> Waiting for Rider...
                  </div>
                )}

                {['heading_to_stall', 'at_stall', 'heading_to_customer', 'at_customer', 'assigned'].includes(order.status) && (
                  <div className="w-full py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center gap-2">
                    <Navigation size={16} /> Out with Rider
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="w-full py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Delivered {order.deliveryPartner ? `by ${order.deliveryPartner.name}` : 'Successfully'}
                  </div>
                )}
              </div>
            </div>
          );

          if (activeTab === 'past') {
            const grouped = filteredOrders.reduce((acc: any, o: any) => {
               const d = new Date(o.created_at || o.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
               if (!acc[d]) acc[d] = [];
               acc[d].push(o);
               return acc;
            }, {});

            return Object.entries(grouped).map(([date, dateOrders]: [string, any]) => {
              const isToday = date === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={date} className="mb-6 last:mb-0">
                   <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-1">{isToday ? 'Today' : date}</h3>
                   <div className="space-y-4">
                     {dateOrders.map(renderOrderCard)}
                   </div>
                </div>
              );
            });
          }

          return filteredOrders.map(renderOrderCard);
        })()}
      </div>

    </div>
  );
}
