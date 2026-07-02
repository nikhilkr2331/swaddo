"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, ChefHat, Flame } from "lucide-react";

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => {
      setShow(false);
    }, 500); 
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          key="splash-screen"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-primary flex flex-col items-center justify-center touch-none overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 flex justify-center items-center opacity-20 pointer-events-none">
            <div className="w-[300px] h-[300px] bg-white blur-[100px] rounded-full"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Store Icon Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="relative"
            >
              <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl relative z-10">
                <Store size={56} className="text-primary" strokeWidth={2} />
              </div>

              {/* Flame/Chef Hat Pop-up */}
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0 }}
                animate={{ y: -35, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.6 }}
                className="absolute top-0 right-0 -mr-4 bg-accent w-12 h-12 rounded-full border-4 border-primary flex items-center justify-center shadow-lg z-20"
              >
                <Flame size={20} className="text-white fill-white" />
              </motion.div>
            </motion.div>
            
            {/* Text Animation */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 text-center"
            >
              <h1 className="font-heading font-black text-4xl text-white tracking-tight flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                SwaDDo <span className="text-accent text-3xl opacity-90 font-bold">Merchant</span>
              </h1>
              <p className="text-white/80 font-medium mt-2 text-sm">Grow your business with us</p>
            </motion.div>
          </div>
          
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5, delay: 1.2 }}
             className="absolute bottom-12 flex flex-col items-center"
          >
             <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
