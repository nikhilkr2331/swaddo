"use client";

import { ArrowLeft, Bell, Moon, Languages, Shield, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Settings() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 xl:pb-12 xl:pt-8 px-4 sm:px-6 xl:px-0 max-w-5xl mx-auto font-body">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F8F9FA] py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-heading font-bold text-text-primary">Settings</h1>
        <div className="w-10"></div>
      </div>

      <div className="mt-4 space-y-6">
        
        {/* App Settings */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">App Preferences</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Bell size={20} className="text-blue-500" />
                </div>
                <span className="font-bold text-text-primary">Push Notifications</span>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800/10 flex items-center justify-center shrink-0">
                  <Moon size={20} className="text-gray-800" />
                </div>
                <span className="font-bold text-text-primary">Dark Mode</span>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Language */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Languages size={20} className="text-teal-500" />
                </div>
                <span className="font-bold text-text-primary">Language</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">English</span>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
            </button>

          </div>
        </div>

        {/* Privacy */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Account & Privacy</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-purple-500" />
                </div>
                <span className="font-bold text-text-primary text-left">Privacy Center<br/><span className="text-xs text-text-muted font-normal">Manage data & permissions</span></span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
