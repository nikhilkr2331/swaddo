"use client";

import { ArrowLeft, ExternalLink, ScrollText, ShieldCheck, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function About() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 xl:pb-12 xl:pt-8 px-4 sm:px-6 xl:px-0 max-w-5xl mx-auto font-body">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F8F9FA] py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-heading font-bold text-text-primary">About & Terms</h1>
        <div className="w-10"></div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
          <span className="font-heading font-black text-5xl text-white">S</span>
        </div>
        <h2 className="font-heading font-black text-2xl text-text-primary tracking-tight">SwaDDo</h2>
        <p className="text-sm text-text-muted font-medium mt-1">Version 1.0.0 (Build 42)</p>
        <div className="flex items-center gap-1 text-xs text-text-muted mt-2">
          Made with <Heart size={12} className="text-primary fill-primary mx-0.5" /> in India
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <ScrollText size={20} className="text-gray-600" />
              </div>
              <span className="font-bold text-text-primary">Terms of Service</span>
            </div>
            <ExternalLink size={18} className="text-gray-300" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-gray-600" />
              </div>
              <span className="font-bold text-text-primary">Privacy Policy</span>
            </div>
            <ExternalLink size={18} className="text-gray-300" />
          </button>

        </div>
      </div>
    </div>
  );
}
