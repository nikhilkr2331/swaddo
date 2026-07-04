"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Check, X, Camera, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import useSWR from "swr";

const PRESET_CATEGORIES = ["Starters", "Main Course", "Beverages", "Desserts", "Snacks", "Chaat", "Combos", "Custom"];
const PRESET_TAGS = ["Bestseller", "Chef's Special", "New", "Spicy", "Healthy"];

export default function MenuPage() {
  useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // For inline price editing
  const [editingItemFullId, setEditingItemFullId] = useState<string | null>(null); // For full modal editing
  const [editPrice, setEditPrice] = useState("");

  // Advanced Form State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [hasAddons, setHasAddons] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "Starters",
    customCategory: "",
    dietaryType: "veg", // veg, non-veg, egg
    inStock: true,
    variants: [{ name: "", price: "" }],
    addons: [{ name: "", price: "" }],
    prepTime: "",
    tags: [] as string[],
    discountPercentage: "",
    photos: [] as string[] // mock array of urls
  });

  const { data: stallData } = useSWR('/stalls/merchant/my-stall', async (url) => {
    const res = await api.get(url);
    return res.data;
  });
  
  const stallId = stallData?.id || null;

  const { data: menuData, error, isLoading: isMenuLoading, mutate: mutateMenu } = useSWR(
    stallId ? `/stalls/${stallId}/menu` : null,
    async (url) => {
      const res = await api.get(url);
      return res.data;
    },
    { revalidateOnFocus: true }
  );

  useEffect(() => {
    if (menuData) {
      setItems(menuData);
      setIsLoading(false);
    }
  }, [menuData]);

  const handleAddItem = async () => {
    // 1. Calculate final category
    const finalCategory = form.category === "Custom" ? form.customCategory : form.category;
    
    // 2. Prepare advanced payload (for logging/future DB migration)
    const advancedPayload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.basePrice) || 0,
      category: finalCategory,
      dietary_type: form.dietaryType,
      is_available: form.inStock,
      has_variants: hasVariants,
      variants: hasVariants ? form.variants.filter(v => v.name && v.price) : [],
      has_addons: hasAddons,
      add_ons: hasAddons ? form.addons.filter(a => a.name && a.price) : [],
      prep_time_minutes: form.prepTime ? parseInt(form.prepTime) : null,
      tags: form.tags,
      has_discount: hasDiscount,
      discount_percentage: hasDiscount ? parseFloat(form.discountPercentage) : null,
      photo_urls: form.photos
    };

    console.warn("TODO: Backend schema requires migration for variants, addons, tags, discount, prep_time, photos!");
    console.log("Full Advanced Payload ready to send:", advancedPayload);

    if (!stallId) return;

    try {
      if (editingItemFullId) {
        const res = await api.put(`/stalls/${stallId}/menu/${editingItemFullId}`, {
          name: form.name,
          description: form.description,
          price: parseFloat(form.basePrice) || 0,
          is_veg: form.dietaryType === "veg",
          is_available: form.inStock,
          category: finalCategory
        });
        setItems(items.map(i => i.id.toString() === editingItemFullId ? res.data : i));
      } else {
        const res = await api.post(`/stalls/${stallId}/menu`, {
          name: form.name,
          description: form.description,
          price: parseFloat(form.basePrice) || 0,
          is_veg: form.dietaryType === "veg",
          is_available: form.inStock,
          category: finalCategory
        });
        setItems([res.data, ...items]);
      }
      setIsAdding(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save item: " + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setForm({
      name: "", description: "", basePrice: "", category: "Starters", customCategory: "",
      dietaryType: "veg", inStock: true, variants: [{ name: "", price: "" }],
      addons: [{ name: "", price: "" }], prepTime: "", tags: [], discountPercentage: "", photos: []
    });
    setEditingItemFullId(null);
    setHasVariants(false);
    setHasAddons(false);
    setHasDiscount(false);
    setShowAdvanced(false);
  };

  const updateItem = async (id: number, updates: any) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
    try {
      await api.put(`/stalls/${stallId}/menu/${id}`, updates);
    } catch (err) {
      console.error(err);
      fetchStallAndMenu();
    }
  };
  const handleSaveEdit = async (itemId: string) => {
    if (!stallId) return;
    try {
      const res = await api.put(`/stalls/${stallId}/menu/${itemId}`, {
        price: parseFloat(editPrice)
      });
      setItems(items.map(item => item.id === itemId ? { ...item, price: res.data.price } : item));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStock = async (item: any) => {
    if (!stallId) return;
    try {
      const newStatus = !item.is_available;
      const res = await api.put(`/stalls/${stallId}/menu/${item.id}`, {
        is_available: newStatus
      });
      setItems(items.map(i => i.id === item.id ? { ...i, is_available: res.data.is_available } : i));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!stallId) return;
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/stalls/${stallId}/menu/${itemId}`);
      setItems(items.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
      fetchStallAndMenu();
    }
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  // Group items by category
  const groupedItems = items.reduce((acc: any, item: any) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-bg-main relative pb-24">
      
      {/* Header */}
      <div className="pt-8 px-6 pb-4 bg-white shadow-sm border-b border-border-subtle sticky top-0 z-10">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Menu Manager</h1>
        <p className="text-text-muted text-sm">Control your offerings & availability</p>
      </div>

      {/* Categories Anchor Bar (Optional sticky under header if we want, but simple list for now) */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-6 py-4 bg-white border-b border-border-subtle sticky top-[88px] z-10">
        {Object.keys(groupedItems).map(cat => (
          <a key={cat} href={`#cat-${cat}`} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-text-primary font-bold text-sm rounded-full whitespace-nowrap transition-colors">
            {cat}
          </a>
        ))}
      </div>

      {/* Menu List */}
      <div className="flex-1 p-6 space-y-8 max-w-md mx-auto w-full">
        {isLoading && (
          <div className="space-y-4 mt-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-24 animate-pulse"></div>
            ))}
          </div>
        )}

        {!isLoading && Object.keys(groupedItems).length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center mt-20 opacity-50">
            <Edit2 size={48} className="mb-4 text-text-muted" />
            <p className="text-center font-bold text-lg text-text-primary">No items yet</p>
            <p className="text-center text-sm text-text-muted">Tap the + button to add your first dish.</p>
          </div>
        )}

        {!isLoading && Object.keys(groupedItems).map(cat => (
          <div key={cat} id={`cat-${cat}`} className="scroll-mt-[150px]">
            <h2 className="font-heading font-bold text-xl text-text-primary mb-4 flex items-center justify-between">
              {cat}
              <span className="text-sm font-medium text-text-muted bg-gray-100 px-2 py-0.5 rounded-md">{groupedItems[cat].length}</span>
            </h2>
            
            <div className="space-y-4">
              {groupedItems[cat].map((item: any) => (
                <div key={item.id} className={`bg-white rounded-2xl p-3 shadow-sm border transition-all ${item.is_available ? 'border-border-subtle' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
                  
                  <div className="flex gap-3">
                    {/* Left: Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Veg/Non-Veg Tag */}
                        <div className="mb-1">
                          <div className={`w-3.5 h-3.5 rounded-[3px] border-2 flex items-center justify-center shrink-0 ${item.is_veg ? 'border-green-600' : 'border-[#8B3A1A]'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-[#8B3A1A]'}`}></div>
                          </div>
                        </div>
                        
                        <h3 className="font-bold text-text-primary text-sm leading-tight mb-1 pr-2">{item.name}</h3>
                        
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-text-primary text-[13px]">Γé╣{item.price}</span>
                          {item.discount_percentage && (
                             <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-sm">{item.discount_percentage}% OFF</span>
                          )}
                        </div>
                        
                        <p className="text-[11px] text-text-muted line-clamp-2 mt-1.5 leading-relaxed max-w-[200px]">
                          {item.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    {/* Right: Image & Action */}
                    <div className="w-[84px] flex flex-col items-end shrink-0 relative">
                      <div className="w-[84px] h-[84px] rounded-xl overflow-hidden bg-gray-100 relative mb-3 border border-border-subtle shadow-sm">
                        {item.photo_urls && item.photo_urls.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.photo_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-heading font-extrabold text-gray-300 text-2xl">
                            {item.name.charAt(0)}
                          </div>
                        )}
                        {!item.is_available && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-gray-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Floating Edit Button over Image */}
                      <button onClick={() => { 
                          setForm({
                            name: item.name,
                            description: item.description || "",
                            basePrice: item.price.toString(),
                            category: ["Starters", "Main Course", "Breads", "Desserts", "Beverages"].includes(item.category) ? item.category : "Custom",
                            customCategory: ["Starters", "Main Course", "Breads", "Desserts", "Beverages"].includes(item.category) ? "" : item.category,
                            dietaryType: item.is_veg ? "veg" : "non-veg",
                            inStock: item.is_available,
                            variants: [{ name: "", price: "" }],
                            addons: [{ name: "", price: "" }],
                            prepTime: item.prep_time_minutes ? item.prep_time_minutes.toString() : "",
                            tags: item.tags || [],
                            discountPercentage: item.discount_percentage ? item.discount_percentage.toString() : "",
                            photos: item.photo_urls || []
                          });
                          setEditingItemFullId(item.id.toString());
                          setIsAdding(true);
                        }} className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-white text-accent border border-gray-200 shadow-md font-extrabold text-[10px] px-4 py-1 rounded-lg uppercase tracking-wide hover:bg-gray-50 transition-colors z-10 whitespace-nowrap">
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Item Status</span>
                    <button onClick={() => toggleStock(item)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.is_available ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${item.is_available ? 'translate-x-5' : 'translate-x-1'}`}/>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsAdding(true)} 
        className="fixed bottom-24 right-6 w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-600 transition-all hover:scale-105 z-20"
      >
        <Plus size={28} />
      </button>

      {/* Add/Edit Item Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/60 p-0 sm:p-6 transition-opacity">
          <div className="bg-bg-alt w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-white shrink-0 shadow-sm z-10 relative">
              <h2 className="font-heading font-bold text-xl text-text-primary">{editingItemFullId ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={() => { setIsAdding(false); resetForm(); }} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* BASIC DETAILS */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Basic Details</h3>
                
                {/* Dietary Type */}
                <div className="flex gap-3">
                  <label className={`flex-1 border p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${form.dietaryType === 'veg' ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-border-subtle hover:border-gray-300'}`}>
                    <input type="radio" name="dietary" checked={form.dietaryType === 'veg'} onChange={() => setForm({...form, dietaryType: 'veg'})} className="hidden" />
                    <div className="w-4 h-4 border-2 border-green-600 rounded-[3px] flex items-center justify-center"><div className="w-2 h-2 bg-green-600 rounded-full"></div></div>
                    <span className="font-bold text-sm text-green-800">Veg</span>
                  </label>
                  <label className={`flex-1 border p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${form.dietaryType === 'non-veg' ? 'bg-red-50 border-[#8B3A1A] shadow-sm' : 'bg-white border-border-subtle hover:border-gray-300'}`}>
                    <input type="radio" name="dietary" checked={form.dietaryType === 'non-veg'} onChange={() => setForm({...form, dietaryType: 'non-veg'})} className="hidden" />
                    <div className="w-4 h-4 border-2 border-[#8B3A1A] rounded-[3px] flex items-center justify-center"><div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-[#8B3A1A]"></div></div>
                    <span className="font-bold text-sm text-[#8B3A1A]">Non-Veg</span>
                  </label>
                  <label className={`flex-1 border p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${form.dietaryType === 'egg' ? 'bg-yellow-50 border-yellow-500 shadow-sm' : 'bg-white border-border-subtle hover:border-gray-300'}`}>
                    <input type="radio" name="dietary" checked={form.dietaryType === 'egg'} onChange={() => setForm({...form, dietaryType: 'egg'})} className="hidden" />
                    <div className="w-4 h-4 border-2 border-yellow-600 rounded-[3px] flex items-center justify-center"><div className="w-2 h-2 bg-yellow-600 rounded-full"></div></div>
                    <span className="font-bold text-sm text-yellow-800">Egg</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Item Name *</label>
                  <input type="text" placeholder="e.g. Paneer Tikka" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white transition-colors" />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Base Price (Γé╣) *</label>
                    <input type="number" placeholder="e.g. 150" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Category *</label>
                    <div className="relative">
                      <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white appearance-none transition-colors">
                        {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {form.category === "Custom" && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Custom Category Name *</label>
                    <input type="text" placeholder="e.g. Chef's Specials" value={form.customCategory} onChange={e => setForm({...form, customCategory: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white transition-colors" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Short Description</label>
                  <textarea placeholder="e.g. Delicious grilled cottage cheese marinated in spices..." rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white resize-none transition-colors" />
                </div>

                {/* Multiple Photos */}
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-2">Photos (up to 3)</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {form.photos.map((url, idx) => (
                      <div key={idx} className="w-24 h-24 rounded-xl border border-border-subtle bg-gray-100 shrink-0 relative overflow-hidden group shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                        <button onClick={() => setForm({...form, photos: form.photos.filter((_, i) => i !== idx)})} className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><Trash2 size={12}/></button>
                        {idx === 0 && <div className="absolute bottom-0 inset-x-0 bg-accent/90 text-white text-[9px] font-bold text-center py-1 tracking-wider">COVER</div>}
                      </div>
                    ))}
                    {form.photos.length < 3 && (
                      <button onClick={() => setForm({...form, photos: [...form.photos, `https://picsum.photos/seed/${Math.random()}/200/200`]} )} className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 flex flex-col items-center justify-center shrink-0 hover:border-accent hover:text-accent transition-colors hover:bg-orange-50">
                        <Camera size={24} className="mb-1.5 opacity-80" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Photo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stock Toggle inside form */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl mt-4">
                  <span className="text-sm font-bold text-text-primary">Currently In Stock?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({...form, inStock: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                  </label>
                </div>
              </div>

              {/* ADVANCED OPTIONS ACCORDION */}
              <div className="border border-border-subtle rounded-2xl bg-white overflow-hidden shadow-sm">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full px-5 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors border-b border-transparent">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-text-primary text-sm mb-0.5">Advanced Options</span>
                    <span className="text-xs text-text-muted">Variants, Add-ons, Tags, Discount & Prep Time</span>
                  </div>
                  <div className={`p-1.5 rounded-full bg-white border border-gray-200 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </button>

                {showAdvanced && (
                  <div className="p-5 space-y-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                    
                    {/* Variants */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-text-primary">Does this item come in different sizes?</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                      </div>
                      {hasVariants && (
                        <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {form.variants.map((v, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input type="text" placeholder="Size (e.g. Half)" value={v.name} onChange={e => { const newV = [...form.variants]; newV[i].name = e.target.value; setForm({...form, variants: newV}); }} className="flex-1 border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                              <input type="number" placeholder="Price (Γé╣)" value={v.price} onChange={e => { const newV = [...form.variants]; newV[i].price = e.target.value; setForm({...form, variants: newV}); }} className="w-24 border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                              <button onClick={() => setForm({...form, variants: form.variants.filter((_, idx) => idx !== i)})} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border border-gray-200"><X size={16} /></button>
                            </div>
                          ))}
                          <button onClick={() => setForm({...form, variants: [...form.variants, {name: "", price: ""}]})} className="text-accent text-sm font-bold flex items-center gap-1.5 hover:underline mt-3"><Plus size={16} /> Add Size</button>
                        </div>
                      )}
                    </div>

                    {/* Add-ons */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-text-primary">Add extra options for this item?</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={hasAddons} onChange={(e) => setHasAddons(e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                      </div>
                      {hasAddons && (
                        <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {form.addons.map((a, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input type="text" placeholder="Add-on (e.g. Extra Cheese)" value={a.name} onChange={e => { const newA = [...form.addons]; newA[i].name = e.target.value; setForm({...form, addons: newA}); }} className="flex-1 border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                              <input type="number" placeholder="+Γé╣" value={a.price} onChange={e => { const newA = [...form.addons]; newA[i].price = e.target.value; setForm({...form, addons: newA}); }} className="w-20 border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                              <button onClick={() => setForm({...form, addons: form.addons.filter((_, idx) => idx !== i)})} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border border-gray-200"><X size={16} /></button>
                            </div>
                          ))}
                          <button onClick={() => setForm({...form, addons: [...form.addons, {name: "", price: ""}]})} className="text-accent text-sm font-bold flex items-center gap-1.5 hover:underline mt-3"><Plus size={16} /> Add Add-on</button>
                        </div>
                      )}
                    </div>

                    {/* Discount & Prep Time */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-text-primary">Apply Discount?</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="sr-only peer" />
                            <div className="w-7 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-[14px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-accent"></div>
                          </label>
                        </div>
                        {hasDiscount && (
                          <div className="mt-2 animate-in fade-in">
                            <input type="number" placeholder="% Off" value={form.discountPercentage} onChange={e => setForm({...form, discountPercentage: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent mb-1.5 bg-white" />
                            {form.basePrice && form.discountPercentage && (
                              <p className="text-[10px] text-text-muted font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                                Prev: <span className="line-through">Γé╣{form.basePrice}</span> ΓåÆ <span className="font-bold">Γé╣{Math.max(0, parseFloat(form.basePrice) * (1 - parseFloat(form.discountPercentage)/100)).toFixed(0)}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-text-primary mb-2">Prep Time</label>
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Mins" value={form.prepTime} onChange={e => setForm({...form, prepTime: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-tight">Leave blank for stall default</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-3">Item Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_TAGS.map(tag => {
                          const isSelected = form.tags.includes(tag);
                          return (
                            <button 
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${isSelected ? 'bg-orange-50 text-accent border-accent shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                              {isSelected && <span className="mr-1">Γ£ô</span>}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-border-subtle bg-white shrink-0 flex justify-end gap-3 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
              <button onClick={() => { setIsAdding(false); resetForm(); }} className="px-6 py-3.5 rounded-xl font-bold text-text-muted hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleAddItem} disabled={!form.name || !form.basePrice} className="px-8 py-3.5 rounded-xl font-bold text-white bg-accent hover:bg-yellow-600 shadow-md transition-all disabled:opacity-50 disabled:shadow-none">
                {editingItemFullId ? "Save Changes" : "Save Item"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
