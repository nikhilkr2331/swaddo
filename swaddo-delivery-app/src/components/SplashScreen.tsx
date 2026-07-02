"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Package, Wind } from "lucide-react";

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Increase time slightly so the animation can play out fully
    const t = setTimeout(() => {
      setShow(false);
    }, 100); 
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          key="splash-screen"
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-primary overflow-hidden flex flex-col items-center justify-center touch-none"
        >
          {/* Street / Road Background Effect */}
          <div className="absolute inset-0 opacity-10 flex flex-col justify-center">
             <div className="w-full h-32 border-y-4 border-dashed border-white"></div>
          </div>

          {/* Animated Bike */}
          <div className="relative z-10 h-40 flex items-end justify-center w-full">
            <motion.div
              initial={{ x: -300, y: 0 }}
              animate={{ 
                x: [ -300, 20, 0 ], 
                y: [ 0, -10, 0, -5, 0 ],
              }}
              transition={{ 
                x: { duration: 1.2, ease: "easeOut" },
                y: { duration: 1.2, ease: "easeInOut", times: [0, 0.4, 0.7, 0.9, 1] }
              }}
              className="relative"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10 border-4 border-primary-light">
                <Bike size={48} className="text-primary translate-x-1" strokeWidth={2.5} />
              </div>
              
              {/* Wind / Speed lines */}
              <motion.div 
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: [0, 1, 0], x: [-10, -30] }}
                transition={{ duration: 0.4, repeat: 2, delay: 0.8 }}
                className="absolute top-1/2 -left-8 -translate-y-1/2 text-white/50"
              >
                <Wind size={24} />
              </motion.div>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 text-center z-10 relative"
          >
            <h1 className="font-heading font-black text-4xl text-white tracking-tight flex items-center justify-center gap-2">
              SwaDDo <span className="text-accent text-3xl opacity-90 font-bold">Delivery</span>
            </h1>
            <p className="text-white/80 font-medium mt-2 text-sm">Swift • Safe • Secure</p>
          </motion.div>
          
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5, delay: 1.2 }}
             className="absolute bottom-12 flex flex-col items-center"
          >
             <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
