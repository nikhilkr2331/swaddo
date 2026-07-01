"use client";

import { ArrowLeft, CreditCard, Wallet, Plus, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Payments() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 xl:pb-12 xl:pt-8 px-4 sm:px-6 xl:px-0 max-w-5xl mx-auto font-body relative overflow-hidden">
      <div className="grayscale opacity-50 pointer-events-none select-none blur-[1.5px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F8F9FA] py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-heading font-bold text-text-primary">Payments & Wallets</h1>
        <div className="w-10"></div>
      </div>

      <div className="mt-4 space-y-6">
        
        {/* SwaDDo Wallet */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">SwaDDo Wallet</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Wallet size={24} className="text-primary" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-heading font-bold text-lg text-text-primary">SwaDDo Pay</h3>
                <p className="text-sm text-text-muted">Available Balance</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-xl text-primary">₹0</span>
              <button className="block text-xs font-bold text-blue-500 uppercase mt-1">Add Money</button>
            </div>
          </div>
        </div>

        {/* Saved Cards */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Saved Cards</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <CreditCard size={20} className="text-purple-500" />
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="font-heading font-bold text-text-primary">HDFC Bank Credit Card</h3>
              <p className="text-sm text-text-muted">**** **** **** 4242</p>
            </div>
          </div>
          
          <button className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-dashed border-primary text-primary font-bold shadow-sm hover:bg-primary/5 transition-colors">
            <Plus size={20} />
            <span>Add New Card</span>
          </button>
        </div>
        
        {/* UPI */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">UPI</h2>
          <button className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-dashed border-green-500 text-green-600 font-bold shadow-sm hover:bg-green-50 transition-colors">
            <Plus size={20} />
            <span>Add UPI ID</span>
          </button>
        </div>

      </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="fixed inset-0 flex flex-col items-center justify-center z-[70] pointer-events-none px-4">
        <div className="bg-white/95 backdrop-blur-md px-10 py-8 rounded-[32px] shadow-2xl border border-gray-200 flex flex-col items-center text-center">
           <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5 shadow-inner">
             <span className="text-4xl">💳</span>
           </div>
           <h2 className="text-3xl font-black font-heading text-gray-900 tracking-tight mb-3">Coming Soon</h2>
           <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-[250px]">
             We are working on bringing you a seamless payment experience. Stay tuned!
           </p>
        </div>
      </div>
    </div>
  );
}
