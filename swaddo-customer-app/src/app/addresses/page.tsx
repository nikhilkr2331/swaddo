"use client";

import { ArrowLeft, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Addresses() {
  const router = useRouter();
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
        <button className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-dashed border-primary text-primary font-bold shadow-sm hover:bg-primary/5 transition-colors">
          <Plus size={20} />
          <span>Add New Address</span>
        </button>

        {/* Existing Address */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-1">
            <MapPin size={20} className="text-green-500" />
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading font-bold text-lg text-text-primary">Home</h3>
              <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Primary</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              123, Sunrise Apartments, Near Metro Station, MG Road, New Delhi, 110001
            </p>
            <div className="flex gap-4 mt-4">
              <button className="text-sm font-bold text-primary hover:underline">Edit</button>
              <button className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
