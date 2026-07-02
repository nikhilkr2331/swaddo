"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";

export default function NotificationListener() {
  const [notification, setNotification] = useState<{title: string; message: string} | null>(null);

  useEffect(() => {
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL; if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, ""); const socket = io(socketUrl || "http://localhost:5005", { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 5000 });

    socket.on("connect", () => {
      console.log("Connected to notification server");
    });

    socket.on("admin_notification", (payload) => {
      console.log("Admin notification received", payload);
      setNotification({ title: payload.title, message: payload.message });
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        setNotification(null);
      }, 8000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Bell size={18} className="animate-pulse" />
              <span>{notification.title}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-4 text-gray-700 text-sm leading-relaxed">
            {notification.message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

