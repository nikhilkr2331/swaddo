"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        setIsStandalone(true);
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
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowFallbackModal(true);
    }
  };

  if (!mounted) return null;
  
  // If the app is already installed natively, show nothing
  if (isStandalone) return null;

  // If the user clicked 'X', show a mini floating button instead
  if (isDismissed) {
    return (
      <button 
        onClick={() => {
          setIsDismissed(false);
          setShowInstallBtn(true);
        }}
        className="fixed bottom-24 right-6 z-[50] w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_30px_rgb(226,64,28,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all animate-in zoom-in duration-300"
        aria-label="Install App"
      >
        <Download size={24} />
      </button>
    );
  }

  if (!showInstallBtn) return null;

  // The full install banner
  return (
    <>
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[50] w-[95%] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center justify-between relative">
          
          {/* Close Button */}
          <button 
            onClick={() => {
              setIsDismissed(true);
              setShowInstallBtn(false);
            }} 
            className="absolute -top-3 -right-2 bg-white text-gray-400 hover:text-gray-600 rounded-full p-1.5 shadow-md border border-gray-100 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Download size={22} className="text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">Install SWADDO FOOD</h4>
              <p className="text-xs text-text-muted mt-0.5">Order faster, track live</p>
            </div>
          </div>
          
          <button 
            onClick={handleInstallClick}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-primary/30 hover:bg-primary-dark active:scale-95 transition-all ml-2"
          >
            Install
          </button>
        </div>
      </div>

      {/* Graceful Fallback Modal */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setShowFallbackModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-1.5 transition-colors">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Download size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-center text-text-primary mb-2">Install SWADDO FOOD</h3>
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
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">3</span>
                <span className="text-sm font-medium text-text-primary">Confirm to install and enjoy!</span>
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
