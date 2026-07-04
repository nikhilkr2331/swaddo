"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Plus, Loader2, Home, Briefcase, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function Addresses() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [tag, setTag] = useState("Home");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/auth/addresses');
      setAddresses(res.data);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async () => {
    if (!fullAddress.trim() || !name.trim() || !phone.trim()) {
      return alert("Please fill all required fields");
    }
    setIsSaving(true);
    try {
      await api.post('/auth/addresses', {
        tag,
        name,
        phone,
        house_number: houseNumber,
        full_address: fullAddress,
        lat: 25.611, // Defaulting to Patna for now
        lng: 85.130
      });
      setShowAddModal(false);
      setHouseNumber("");
      setFullAddress("");
      setName("");
      setPhone("");
      fetchAddresses();
    } catch (error) {
      console.error("Failed to save address", error);
      alert("Failed to save address");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/auth/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error("Failed to delete address", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 xl:pb-12 xl:pt-8 px-4 sm:px-6 xl:px-0 max-w-5xl mx-auto font-body">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F8F9FA] py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-heading font-bold text-text-primary">Addresses</h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="mt-4 space-y-4">
        {/* Add New */}
        <button onClick={() => setShowAddModal(true)} className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-dashed border-primary text-primary font-bold shadow-sm hover:bg-primary/5 transition-colors active:scale-95">
          <Plus size={20} />
          <span>Add New Address</span>
        </button>

        {/* Address List */}
        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="font-bold text-lg text-gray-700">No addresses saved</p>
            <p className="text-sm mt-1">Add a new address for faster checkout</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${addr.tag === 'Home' ? 'bg-green-500/10 text-green-500' : addr.tag === 'Work' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                {addr.tag === 'Home' ? <Home size={20} /> : addr.tag === 'Work' ? <Briefcase size={20} /> : <MapPin size={20} />}
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-heading font-bold text-lg text-text-primary">{addr.tag}</h3>
                </div>
                <p className="text-sm font-bold text-gray-800">{addr.name} - {addr.phone}</p>
                <p className="text-sm text-text-muted leading-relaxed mt-1">
                  {addr.house_number ? `${addr.house_number}, ` : ''}{addr.full_address}
                </p>
                <div className="flex gap-4 mt-4">
                  <button onClick={() => handleDelete(addr.id)} className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto bg-white rounded-t-[32px] shadow-2xl z-[101] flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading font-black text-xl text-gray-900 tracking-tight">Add Address</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Save As</label>
                  <div className="flex gap-3">
                    {['Home', 'Work', 'Other'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTag(t)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${tag === t ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Contact Details</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Receiver Name" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-[15px] font-medium outline-none focus:border-primary mb-2" />
                  <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="Receiver Phone" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-[15px] font-medium outline-none focus:border-primary" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Address Details</label>
                  <input type="text" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} placeholder="House / Flat / Block No." className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-[15px] font-medium outline-none focus:border-primary mb-2" />
                  <textarea value={fullAddress} onChange={e => setFullAddress(e.target.value)} placeholder="Full Street Address / Area" rows={3} className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-[15px] font-medium outline-none focus:border-primary resize-none" />
                </div>
              </div>

              <button onClick={handleSave} disabled={isSaving} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(226,64,28,0.4)] transition-all active:scale-95 flex justify-center items-center gap-2">
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : "Save Address"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
