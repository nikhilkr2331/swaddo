"use client";

import { WifiOff, RotateCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center mb-6">
        <WifiOff size={48} className="text-red-500" />
      </div>
      
      <h1 className="text-3xl font-heading font-extrabold text-text-primary mb-2">
        You're Offline
      </h1>
      <p className="text-text-muted mb-8 max-w-sm">
        It seems like your internet connection is lost. Please check your network settings and try again.
      </p>

      <button 
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-bold transition-all active:scale-95 shadow-md shadow-primary/20"
      >
        <RotateCw size={20} />
        Retry Connection
      </button>

      <div className="mt-12 text-center opacity-50 flex items-center flex-col gap-2">
        <Image src="/icon.svg" alt="SwaDDo Logo" width={32} height={32} className="grayscale" />
        <span className="text-sm font-semibold tracking-widest text-text-muted">SWADDO</span>
      </div>
    </div>
  );
}
