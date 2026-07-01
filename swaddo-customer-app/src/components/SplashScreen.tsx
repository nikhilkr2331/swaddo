"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Pizza, Coffee, Flame } from "lucide-react";

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Increased timeout for a richer animation experience
    // Increased timeout slightly for a better visual experience based on user feedback
    const t = setTimeout(() => {
      setShow(false);
    }, 2300);
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
          {/* Animated Background Gradient */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10"
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          {/* Floating Food Icons Background (Simplified for performance) */}
          <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
             <div className="absolute top-1/4 left-1/4 text-white"><Pizza size={48} /></div>
             <div className="absolute top-1/3 right-1/4 text-white"><Utensils size={40} /></div>
             <div className="absolute bottom-1/4 left-1/3 text-white"><Coffee size={36} /></div>
             <div className="absolute bottom-1/3 right-1/3 text-white"><Flame size={44} /></div>
          </div>

          {/* Main Logo Container */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Ripple Effects behind logo (Removed for performance) */}

            {/* Logo Cube */}
            <motion.div
              initial={{ scale: 0, rotate: -180, borderRadius: "50%" }}
              animate={{ scale: 1, rotate: 0, borderRadius: "24px" }}
              transition={{ 
                type: "spring",
                damping: 12,
                stiffness: 100,
                duration: 0.8
              }}
              className="w-28 h-28 bg-white flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.2)] relative overflow-hidden"
            >
              {/* Shine effect on logo */}
              <motion.div 
                className="absolute w-[200%] h-full bg-primary/10 transform -rotate-45"
                initial={{ left: '-200%' }}
                animate={{ left: '200%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              />
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-heading font-black text-6xl text-primary drop-shadow-sm"
              >
                S
              </motion.span>
            </motion.div>

            {/* Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 flex flex-col items-center"
            >
              <h1 className="font-heading font-black text-4xl tracking-tight text-white flex items-center gap-1">
                SwaDDo
              </h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-white/80 font-bold text-sm tracking-widest uppercase mt-2"
              >
                Cravings Delivered
              </motion.p>
            </motion.div>
          </div>

          {/* Loading Indicator at Bottom */}
          <motion.div 
             initial={{ opacity: 0, bottom: -20 }}
             animate={{ opacity: 1, bottom: 40 }}
             transition={{ duration: 0.5, delay: 1.5 }}
             className="absolute flex flex-col items-center gap-3"
          >
             <div className="flex gap-1.5">
               <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-white" />
               <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2.5 h-2.5 rounded-full bg-white/80" />
               <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2.5 h-2.5 rounded-full bg-white" />
             </div>
             <p className="text-xs text-white/80 font-bold tracking-wider">Preparing your menu...</p>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
