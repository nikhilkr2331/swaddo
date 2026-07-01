"use client";

import { ArrowLeft, BellRing, Package, Tag, Info } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Notifications() {
  const router = useRouter();
  
  const notifications = [
    {
      id: 1,
      type: "order",
      title: "Order Delivered!",
      message: "Your order from 'The Biryani House' has been delivered successfully. Enjoy your meal!",
      time: "10 mins ago",
      icon: Package,
      color: "text-green-500",
      bg: "bg-green-50",
      unread: true,
    },
    {
      id: 2,
      type: "promo",
      title: "50% OFF on your next order 🎉",
      message: "Use code SWADDO50 to get flat 50% off on orders above ₹199. Valid till midnight!",
      time: "2 hours ago",
      icon: Tag,
      color: "text-amber-500",
      bg: "bg-amber-50",
      unread: true,
    },
    {
      id: 3,
      type: "system",
      title: "Welcome to SwaDDo Pro",
      message: "Your free trial of SwaDDo Pro has been activated. Enjoy zero delivery fees!",
      time: "1 day ago",
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-50",
      unread: false,
    },
    {
      id: 4,
      type: "order",
      title: "Rate your last meal",
      message: "How was the 'Paneer Butter Masala' from 'Dhaba Express'? Tap to rate.",
      time: "2 days ago",
      icon: BellRing,
      color: "text-purple-500",
      bg: "bg-purple-50",
      unread: false,
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10 font-body">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm py-4 px-4 sm:px-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-heading font-bold text-gray-900">Notifications</h1>
        <div className="w-10 text-xs font-bold text-primary cursor-pointer text-right">Read all</div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 px-4 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <BellRing size={40} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No notifications yet</h2>
            <p className="text-gray-500 text-sm">When you get updates about your orders or offers, they'll show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 border-b border-gray-100 bg-white flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${notif.unread ? 'bg-orange-50/30' : ''}`}
              >
                <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center ${notif.bg}`}>
                  <notif.icon size={22} className={notif.color} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-bold ${notif.unread ? 'text-gray-900' : 'text-gray-700'}`}>{notif.title}</h3>
                    <span className="text-[11px] font-medium text-gray-400 shrink-0 mt-0.5">{notif.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
