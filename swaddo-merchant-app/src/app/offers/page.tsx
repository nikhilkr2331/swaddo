"use client";

import { useAuth } from "@/hooks/useAuth";
import { Tag, Plus, Megaphone, CheckCircle2, ChevronRight, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function OffersPage() {
  useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("Flat 20% OFF");
  const [discount, setDiscount] = useState("20");
  const [minOrder, setMinOrder] = useState("199");
  const [maxDiscount, setMaxDiscount] = useState("50");

  const fetcher = (url: string) => api.get(url).then(res => res.data);
  const { data: stallRes, mutate } = useSWR('/stalls/merchant/my-stall', fetcher);

  const stall = stallRes;
  const hasOffer = stall?.active_offer_title;
  const isActive = stall?.active_offer_is_active;

  const handleToggleOffer = async (turnOn: boolean) => {
    if (!stall) return;
    try {
      await api.put('/stalls/merchant/offer', {
        title: stall.active_offer_title,
        discount_percentage: stall.active_offer_discount,
        min_order_value: stall.active_offer_min,
        max_discount: stall.active_offer_max,
        is_active: turnOn
      });
      mutate();
    } catch (err) {
      alert("Failed to update offer status.");
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put('/stalls/merchant/offer', {
        title,
        discount_percentage: parseFloat(discount),
        min_order_value: parseFloat(minOrder),
        max_discount: parseFloat(maxDiscount),
        is_active: true
      });
      await mutate();
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to save offer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (stall && stall.active_offer_title) {
      setTitle(stall.active_offer_title);
      setDiscount(stall.active_offer_discount?.toString() || "");
      setMinOrder(stall.active_offer_min?.toString() || "");
      setMaxDiscount(stall.active_offer_max?.toString() || "");
    } else {
      setTitle("Flat 20% OFF");
      setDiscount("20");
      setMinOrder("199");
      setMaxDiscount("50");
    }
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-bg-main pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-border-subtle shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-heading font-extrabold text-text-primary">Offers & Campaigns</h1>
          <p className="text-sm text-text-muted mt-1">Boost sales with discounts</p>
        </div>
        <button 
          onClick={openEditModal}
          className="bg-accent text-white p-2 rounded-full shadow-md active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mt-4 space-x-4 border-b border-border-subtle">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'active' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-primary'}`}
        >
          My Campaign
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
            {!stall ? (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle h-40 animate-pulse flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="w-32 h-5 bg-gray-200 rounded"></div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-full h-8 bg-gray-200 rounded-xl mt-2"></div>
                </div>
              </div>
            ) : !hasOffer ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-border-subtle text-center">
                <Tag className="mx-auto text-text-muted mb-3" size={40} />
                <h3 className="font-heading font-bold text-text-primary text-lg mb-2">No Active Offers</h3>
                <p className="text-sm text-text-muted mb-6">Create a discount campaign to attract more customers and boost your daily sales.</p>
                <button 
                  onClick={openEditModal}
                  className="bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg w-full"
                >
                  Create Offer
                </button>
              </div>
            ) : (
              <div className={`bg-white p-4 rounded-2xl shadow-sm border ${isActive ? 'border-accent' : 'border-border-subtle opacity-75'} relative overflow-hidden transition-all`}>
                {isActive && <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full -z-10" />}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`${isActive ? 'bg-accent' : 'bg-text-muted'} text-white p-1.5 rounded-lg`}>
                      <Tag size={16} />
                    </div>
                    <h3 className="font-heading font-bold text-text-primary">{stall.active_offer_title}</h3>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isActive ? 'text-green-500 bg-green-50' : 'text-text-muted bg-gray-100'}`}>
                    {isActive ? <><CheckCircle2 size={12} /> Live</> : 'Paused'}
                  </div>
                </div>
                <p className="text-xs text-text-muted mb-4">
                  Flat {stall.active_offer_discount}% off on orders above ₹{stall.active_offer_min}. Max discount ₹{stall.active_offer_max}.
                </p>
                
                <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-4">
                  <button onClick={openEditModal} className="text-xs font-bold text-primary underline">
                    Edit Details
                  </button>
                  {isActive ? (
                    <button 
                      onClick={() => handleToggleOffer(false)}
                      className="text-red-500 text-xs font-bold bg-red-50 px-4 py-2 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      Pause Offer
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleToggleOffer(true)}
                      className="text-green-600 text-xs font-bold bg-green-50 px-4 py-2 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      Resume Offer
                    </button>
                  )}
                </div>
              </div>
            )}
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
              <button 
                onClick={() => {
                  setTitle("Monsoon Special 15% OFF");
                  setDiscount("15");
                  setMinOrder("149");
                  setMaxDiscount("40");
                  setIsModalOpen(true);
                }}
                className="bg-indigo-600 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md w-full flex justify-center items-center gap-2 active:scale-95 transition-transform"
              >
                Apply This Campaign <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl w-full p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-bold text-text-primary">Configure Offer</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveOffer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Offer Title</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" placeholder="e.g. Flat 20% OFF" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Discount %</label>
                    <input required type="number" min="1" max="100" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" placeholder="20" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Max Discount (₹)</label>
                    <input required type="number" min="1" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" placeholder="50" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Min Order Value (₹)</label>
                  <input required type="number" min="0" value={minOrder} onChange={e => setMinOrder(e.target.value)} className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" placeholder="199" />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Saving...</> : 'Save & Make Live'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
