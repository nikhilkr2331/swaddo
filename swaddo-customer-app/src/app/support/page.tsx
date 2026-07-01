"use client";

import { ArrowLeft, MessageSquare, PhoneCall, Mail, FileQuestion } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Support() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 xl:pb-12 xl:pt-8 px-4 sm:px-6 xl:px-0 max-w-5xl mx-auto font-body">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F8F9FA] py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-heading font-bold text-text-primary">Help & Support</h1>
        <div className="w-10"></div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Contact Options */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <MessageSquare size={24} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-text-primary text-lg">Chat with us</h3>
              <p className="text-sm text-text-muted">Typically replies within 2 minutes</p>
            </div>
          </button>

          <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <PhoneCall size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-text-primary text-lg">Call Support</h3>
              <p className="text-sm text-text-muted">Available 24x7 for active orders</p>
            </div>
          </button>

          <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <Mail size={24} className="text-orange-500" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-text-primary text-lg">Email us</h3>
              <p className="text-sm text-text-muted">support@swaddo.com</p>
            </div>
          </button>
        </div>

        {/* FAQs */}
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 mt-8 px-1">FAQs</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {["Where is my order?", "I want to cancel my order", "I have a payment issue", "Partner with us"].map((q, i) => (
            <button key={i} className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${i !== 3 ? 'border-b border-gray-100' : ''} text-left`}>
              <span className="font-medium text-text-primary">{q}</span>
              <FileQuestion size={18} className="text-gray-400" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
