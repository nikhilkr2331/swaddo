"use client";

import { useAuth } from "@/hooks/useAuth";
import { Tag, Plus, Megaphone, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { useState } from "react";

export default function OffersPage() {
  useAuth();
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div className="min-h-screen bg-bg-main pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-border-subtle shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-heading font-extrabold text-text-primary">Offers & Campaigns</h1>
          <p className="text-sm text-text-muted mt-1">Boost sales with discounts</p>
        </div>
        <button className="bg-accent text-white p-2 rounded-full shadow-md">
          <Plus size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mt-4 space-x-4 border-b border-border-subtle">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'active' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-primary'}`}
        >
          Active Campaigns
        </button>
        <button 
          onClick={() => setActiveTab('recommended')}
          className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'recommended' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-primary'}`}
        >
          Recommended
        </button>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'active' ? (
          <>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full -z-10" />
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-accent text-white p-1.5 rounded-lg">
                    <Tag size={16} />
                  </div>
                  <h3 className="font-heading font-bold text-text-primary">Flat 20% OFF</h3>
                </div>
                <div className="flex items-center gap-1 text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle2 size={12} /> Live
                </div>
              </div>
              <p className="text-xs text-text-muted mb-4">On orders above ₹199. Max discount ₹50.</p>
              
              <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                <div className="text-xs">
                  <div className="text-text-muted">Usage today</div>
                  <div className="font-bold text-text-primary text-sm mt-0.5">14 Orders</div>
                </div>
                <div className="text-xs">
                  <div className="text-text-muted">Est. Cost</div>
                  <div className="font-bold text-text-primary text-sm mt-0.5">₹420</div>
                </div>
                <button className="text-red-500 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <XCircle size={14} /> Stop
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle relative overflow-hidden opacity-75">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-text-muted text-white p-1.5 rounded-lg">
                    <Tag size={16} />
                  </div>
                  <h3 className="font-heading font-bold text-text-primary">Free Delivery</h3>
                </div>
                <div className="flex items-center gap-1 text-text-muted text-xs font-bold bg-bg-alt px-2 py-1 rounded-full">
                  Expired
                </div>
              </div>
              <p className="text-xs text-text-muted">On all orders above ₹99.</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl shadow-sm border border-indigo-100 relative">
              <div className="absolute top-4 right-4 text-indigo-200">
                <Megaphone size={40} />
              </div>
              <h3 className="font-heading font-extrabold text-indigo-900 text-lg w-3/4 leading-tight mb-2">
                Boost orders during rainy days!
              </h3>
              <p className="text-xs text-indigo-700/80 mb-5 w-4/5">
                Run a 'Monsoon Special' 15% discount. Restaurants similar to yours saw a 30% jump in orders!
              </p>
              <button className="bg-indigo-600 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md w-full flex justify-center items-center gap-2">
                Create Campaign <ChevronRight size={16} />
              </button>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-2xl shadow-sm border border-orange-100 relative mt-4">
              <div className="absolute top-4 right-4 text-orange-200">
                <Tag size={40} />
              </div>
              <h3 className="font-heading font-extrabold text-orange-900 text-lg w-3/4 leading-tight mb-2">
                BOGO on Top Item
              </h3>
              <p className="text-xs text-orange-700/80 mb-5 w-4/5">
                Buy 1 Get 1 Free on your top selling Chicken Biryani to attract new customers.
              </p>
              <button className="bg-accent text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md w-full flex justify-center items-center gap-2">
                Run BOGO Offer <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
