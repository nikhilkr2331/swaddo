"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { MapPin, Navigation, Clock, CheckCircle2, XCircle, BellRing, Store, Siren } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import Link from "next/link";

export default function Home() {
  useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isOnline") === "true";
    }
    return false;
  });
  const [watchId, setWatchId] = useState<number | null>(null);
  const [newJob, setNewJob] = useState<any>(null);
  const [timer, setTimer] = useState(300);
  const [stats, setStats] = useState({ deliveries: 0, earnings: 0, floatingCash: 0, hours: 0 });
  const [mounted, setMounted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const riderIdRef = useRef<string>("");
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    // Initialize audio
    alarmAudio.current = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
    alarmAudio.current.loop = true;

    // Generate a persistent mock rider ID for testing concurrency across multiple tabs
    const storedRiderId = localStorage.getItem("mockRiderId");
    if (!storedRiderId) {
      const newRiderId = `rider_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("mockRiderId", newRiderId);
      riderIdRef.current = newRiderId;
    } else {
      riderIdRef.current = storedRiderId;
    }

    const savedOnline = localStorage.getItem("isOnline");
    if (savedOnline === "true") {
      setIsOnline(true);
    }
    const savedJob = localStorage.getItem("pendingJob");
    const savedTimer = localStorage.getItem("pendingTimer");
    if (savedJob && savedTimer) {
      const remaining = parseInt(savedTimer) - Math.floor(Date.now() / 1000);
      if (remaining > 0) {
        setNewJob(JSON.parse(savedJob));
        setTimer(remaining);
      } else {
        localStorage.removeItem("pendingJob");
        localStorage.removeItem("pendingJob");
        localStorage.removeItem("pendingTimer");
      }
    }
    
    // Fetch real performance stats from backend
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/delivery/dashboard');
        if (res.data) {
          setStats({
            deliveries: res.data.deliveries || 0,
            earnings: res.data.earnings || 0,
            floatingCash: res.data.floatingCash || 0,
            hours: res.data.hours || 0
          });

          // Auto offline if limit exceeded while online
          if (res.data.floatingCash >= 2000 && isOnline) {
            alert("Floating cash limit reached. You have been taken offline. Please deposit cash to receive more orders.");
            setIsOnline(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    fetchDashboardStats();
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Prevent overwriting localStorage on first render before mount

    let intervalId: any;

    if (isOnline) {
      localStorage.setItem("isOnline", "true");
      const socket = connectSocket();
      
      if (socket) {
        socket.on("connect", () => {
          const riderId = localStorage.getItem("mockRiderId");
          socket.emit("rider_online", { riderId });
          console.log(`Socket connected for job updates as ${riderId}`);
        });

        socket.on("job_offer", (data) => {
          setNewJob(data);
          setTimer(300); // 5 minutes to match backend timeout
          localStorage.setItem("pendingJob", JSON.stringify(data));
          localStorage.setItem("pendingTimer", (Math.floor(Date.now() / 1000) + 300).toString());
          if (alarmAudio.current) {
            alarmAudio.current.play().catch(e => console.log('Audio play blocked:', e));
          }
        });

        socket.on("job_revoked", (data) => {
          setNewJob((prev: any) => {
            if (prev && prev.id === data.id) {
              alert("This job was assigned to another rider or expired.");
              localStorage.removeItem("pendingJob");
              localStorage.removeItem("pendingTimer");
              if (alarmAudio.current) { alarmAudio.current.pause(); alarmAudio.current.currentTime = 0; }
              return null;
            }
            return prev;
          });
        });
      }

      // Start pinging GPS
      if ("geolocation" in navigator) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            
            // Sync with backend via API & Socket for Dijkstra assignment
            api.post("/delivery/ping", { lat: latitude, lng: longitude }).catch(() => {});
            const currentSocket = getSocket();
            if (currentSocket) {
              const riderId = localStorage.getItem("mockRiderId");
              currentSocket.emit("rider_sync_location", { riderId, lat: latitude, lng: longitude });
            }
          },
          (error) => {
            // GPS Timeouts (Code 3) are extremely common in desktop browsers / emulators. Just silently ignore.
            if (error.code === error.TIMEOUT) return; 
            
            console.error("GPS Error:", error.message, `(Code: ${error.code})`);
            if (error.code === error.PERMISSION_DENIED) {
              alert("Location access is required to go online.");
              setIsOnline(false);
              localStorage.setItem("isOnline", "false");
            }
          },
          { enableHighAccuracy: false, maximumAge: 10000, timeout: 20000 }
        );
        setWatchId(id);
      }
    } else {
      localStorage.setItem("isOnline", "false");
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      disconnectSocket();
    }

    let pingTimer: NodeJS.Timeout;
    if (isOnline) {
      pingTimer = setInterval(() => {
        api.post('/delivery/ping-time').catch(console.error);
        setStats(prev => ({ ...prev, hours: prev.hours + 1 }));
        
        // Also force sync location if we have it
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            const currentSocket = getSocket();
            if (currentSocket) {
              const riderId = localStorage.getItem("mockRiderId");
              currentSocket.emit("rider_sync_location", { riderId, lat: latitude, lng: longitude });
            }
          }, () => {}, { enableHighAccuracy: false, maximumAge: 10000, timeout: 5000 });
        }
      }, 30000); // Changed to 30 seconds for better assignment accuracy
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      disconnectSocket();
      if (pingTimer) clearInterval(pingTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, mounted]);

  // Handle Modal Timer
  useEffect(() => {
    if (newJob && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    } else if (newJob && timer === 0) {
      setNewJob(null); // Auto decline
      if (alarmAudio.current) { alarmAudio.current.pause(); alarmAudio.current.currentTime = 0; }
    }
  }, [newJob, timer]);

  const acceptJob = async () => {
    if (!newJob) return;
    if (alarmAudio.current) { alarmAudio.current.pause(); alarmAudio.current.currentTime = 0; }
    try {
      await api.patch(`/delivery/assignments/${newJob.id}/accept`, {
        riderId: riderIdRef.current,
        lat: currentLocation?.lat,
        lng: currentLocation?.lng
      });
      // Store active delivery to prevent navigating away
      localStorage.setItem('activeDelivery', newJob.id);
      
      localStorage.removeItem("pendingJob");
      localStorage.removeItem("pendingTimer");
      localStorage.setItem('activeDelivery', newJob.orderId);
      router.push(`/active-delivery?id=${newJob.orderId}`);
    } catch (err: any) {
      console.log(err.message);
      alert(err.response?.data?.message || "Failed to accept job");
      setNewJob(null);
      localStorage.removeItem("pendingJob");
      localStorage.removeItem("pendingTimer");
    }
  };

  const declineJob = () => {
    setNewJob(null);
    localStorage.removeItem("pendingJob");
    localStorage.removeItem("pendingTimer");
    if (alarmAudio.current) { alarmAudio.current.pause(); alarmAudio.current.currentTime = 0; }
  };

  if (!mounted) return null; // Prevent UI flicker on mount

  return (
    <div className="flex flex-col min-h-screen pt-8 px-6 pb-24 max-w-md mx-auto relative">
      
      {/* Header & Toggle */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">Status</h1>
            <p className="text-sm font-medium text-text-muted">
              {isOnline ? "You are online and visible" : "You are currently offline"}
            </p>
          </div>
          <button 
            onClick={() => alert("SOS Emergency Activated! Alerting authorities and support team.")}
            className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-sm border border-red-200 active:scale-95 transition-transform"
          >
            <Siren size={24} />
          </button>
        </div>
        
        {/* Large Toggle */}
        <button 
          onClick={() => {
            if (!isOnline && stats.floatingCash >= 2000) {
              alert("Your floating cash limit (₹2000) has been reached. Please deposit cash to go online and receive new orders.");
              return;
            }
            setIsOnline(!isOnline);
          }}
          className={`w-20 h-10 rounded-full flex items-center p-1 transition-colors duration-300 shadow-inner ${
            isOnline ? "bg-primary" : "bg-border-subtle"
          }`}
        >
          <motion.div 
            className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
            initial={false}
            animate={{ x: isOnline ? 40 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {isOnline ? <CheckCircle2 size={16} className="text-primary" /> : <XCircle size={16} className="text-text-muted" />}
          </motion.div>
        </button>
      </div>

      {/* Stats Cards */}
      <h2 className="text-lg font-heading font-bold text-text-primary mb-4">Today's Performance</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-bg-alt rounded-2xl p-4 border border-border-subtle shadow-sm flex flex-col justify-center">
          <span className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Deliveries</span>
          <span className="text-3xl font-heading font-bold text-accent">{stats.deliveries}</span>
        </div>
        <div className="bg-bg-alt rounded-2xl p-4 border border-border-subtle shadow-sm flex flex-col justify-center">
          <span className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Earnings</span>
          <span className="text-3xl font-heading font-bold text-primary">₹{stats.earnings}</span>
        </div>
        <div className="bg-bg-alt rounded-2xl p-4 border border-border-subtle shadow-sm flex flex-col justify-center">
          <span className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Online Time</span>
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-text-muted" />
            <span className="text-xl font-heading font-bold text-text-primary">
              {Math.floor(stats.hours / 60)}<span className="text-sm ml-1 mr-1">h</span>
              {stats.hours % 60}<span className="text-sm ml-1">m</span>
            </span>
          </div>
        </div>
        <Link href="/floating-cash" className={`bg-[#8B4513]/5 rounded-2xl p-4 border shadow-sm flex flex-col justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] ${stats.floatingCash >= 2000 ? 'border-red-500 bg-red-500/10' : 'border-[#8B4513]/20'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${stats.floatingCash >= 2000 ? 'text-red-600' : 'text-[#8B4513]'}`}>Floating Cash</span>
            <span className="text-xs text-[#8B4513] opacity-60">Limit: ₹2000</span>
          </div>
          <span className={`text-2xl font-heading font-bold ${stats.floatingCash >= 2000 ? 'text-red-600' : 'text-[#8B4513]'}`}>₹{stats.floatingCash}</span>
          {stats.floatingCash >= 2000 && (
            <span className="text-[10px] text-red-600 font-bold uppercase mt-1">Deposit Required</span>
          )}
        </Link>
      </div>

      {/* Main Illustration Area */}
      <div className="flex-1 flex flex-col items-center justify-center mt-4">
        {isOnline ? (
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
              <div className="w-24 h-24 rounded-full border-4 border-primary/40 flex items-center justify-center">
                 <MapPin size={40} className="text-primary animate-bounce" />
              </div>
            </div>
            <p className="text-center text-primary font-bold mt-6">Looking for nearby orders...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center opacity-70">
            <div className="w-24 h-24 rounded-full bg-border-subtle flex items-center justify-center mb-4">
              <Navigation size={40} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-heading font-bold text-text-primary">You're Offline</h3>
            <p className="text-sm text-text-muted mt-2 max-w-[250px]">Go online to start receiving delivery requests in your area.</p>
          </div>
        )}
      </div>

      {/* Job Offer Modal (Full Screen) */}
      <AnimatePresence>
        {newJob && (
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
            
            <h2 className="text-3xl font-heading font-bold text-white mb-2 text-center">New Delivery!</h2>
            <p className="text-white/80 mb-8 text-center text-lg">Accept within {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</p>
            
            <div className="bg-white rounded-2xl w-full p-6 shadow-xl mb-8 space-y-4">
              <div className="flex items-center gap-3">
                <Store className="text-text-muted" size={20} />
                <span className="font-bold text-text-primary text-lg">{newJob.stallName || "Ramu's Chaat Corner"}</span>
              </div>
              <div className="flex justify-between items-center bg-bg-main p-3 rounded-xl border border-border-subtle">
                <div className="flex items-center gap-2 text-text-muted">
                  <MapPin size={16} />
                  <span className="text-sm font-bold">Pickup</span>
                </div>
                <span className="font-bold text-text-primary">{(newJob.pickupDistance && newJob.pickupDistance !== 999999) ? `${newJob.pickupDistance} km` : "Calculating..."}</span>
              </div>
              <div className="flex justify-between items-center bg-bg-main p-3 rounded-xl border border-border-subtle">
                <div className="flex items-center gap-2 text-text-muted">
                  <Navigation size={16} />
                  <span className="text-sm font-bold">Drop-off</span>
                </div>
                <span className="font-bold text-text-primary">{newJob.dropoffDistance ? `${newJob.dropoffDistance} km` : "Calculating..."}</span>
              </div>

              {/* Itemized Payout Section */}
              <div className="flex flex-col gap-2 mt-2 border-t border-border-subtle pt-4">
                {/* Pickup Payout */}
                {newJob.pickupPayout !== undefined && newJob.pickupPayout > 0 && (
                  <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-800">
                      <span className="text-sm font-bold">Pickup Distance Pay</span>
                    </div>
                    <span className="font-bold text-green-700">+ ₹{newJob.pickupPayout}</span>
                  </div>
                )}
                
                {/* Delivery Base Payout */}
                <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 text-orange-800">
                    <span className="text-sm font-bold">Delivery Pay</span>
                  </div>
                  <span className="font-bold text-orange-700">₹{newJob.earnings || 45}</span>
                </div>

                {/* Return Payout */}
                {newJob.returnPayout !== undefined && newJob.returnPayout > 0 && (
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-800">
                      <span className="text-sm font-bold">Return Earning</span>
                    </div>
                    <span className="font-bold text-blue-700">+ ₹{newJob.returnPayout}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-border-subtle pt-4 mt-2">
                <span className="text-text-muted font-bold text-lg">Total Earning</span>
                <span className="text-3xl font-heading font-black text-green-600">₹{(newJob.earnings || 45) + (newJob.pickupPayout || 0) + (newJob.returnPayout || 0)}</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={acceptJob}
                className="w-full bg-white text-primary py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
              >
                Accept Delivery
              </button>
              <button 
                onClick={declineJob}
                disabled={timer > 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-transform border border-white/20 ${timer > 0 ? 'bg-black/10 text-white/50 cursor-not-allowed' : 'bg-black/20 text-white active:scale-95'}`}
              >
                Decline {timer > 0 ? `(${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')})` : ''}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <AnimatePresence>
        {mounted && !newJob && !isOnline && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-6 right-6"
          >
            <button 
              onClick={() => setIsOnline(true)}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgb(226,64,28,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              Go Online Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
