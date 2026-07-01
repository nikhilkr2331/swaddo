"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { motion, useDragControls } from "framer-motion";

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone || 
                    document.referrer.includes('android-app://');
      setIsStandalone(isPWA);
      if (!isPWA) setShowInstallBtn(true);
      
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(console.error);
      }

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBtn(true);
      });

      window.addEventListener('appinstalled', () => {
        setShowInstallBtn(false);
        setDeferredPrompt(null);
      });
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowInstallBtn(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowFallbackModal(true);
    }
  };

  if (!showInstallBtn || isStandalone) return null;

  return (
    <>
      <motion.div 
        drag="y"
        dragConstraints={{ top: -200, bottom: 200 }}
        dragElastic={0.2}
        dragControls={dragControls}
        whileDrag={{ scale: 1.02, cursor: "grabbing" }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[50] w-[95%] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300 touch-none"
      >
        <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center justify-between cursor-grab">
          <div className="flex items-center gap-3 pointer-events-none">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Download size={22} className="text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">Install SWADDO MERCHANT</h4>
              <p className="text-xs text-text-muted mt-0.5">Manage orders easily</p>
            </div>
          </div>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleInstallClick}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-primary/30 hover:bg-primary-dark active:scale-95 transition-all ml-2"
          >
            Install
          </button>
        </div>
      </motion.div>

      {/* Graceful Fallback Modal */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 touch-none" onPointerDown={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-center text-text-primary mb-2">Install SWADDO MERCHANT</h3>
            <p className="text-center text-text-muted text-sm mb-6">
              Looks like your browser blocked the automatic install. You can easily install it manually:
            </p>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">1</span>
                <span className="text-sm font-medium text-text-primary">Tap the 3-dots menu (<strong className="text-xl leading-none">⋮</strong>) in the top right corner of your browser.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">2</span>
                <span className="text-sm font-medium text-text-primary">Select <strong className="text-primary">"Install App"</strong> or <strong className="text-primary">"Add to Home Screen"</strong>.</span>
              </li>
            </ul>
            <button onClick={() => setShowFallbackModal(false)} className="w-full bg-bg-main text-text-primary font-bold py-3 rounded-xl border border-border-subtle hover:bg-gray-50 transition-colors">
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
