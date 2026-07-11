"use client";

import { ArrowLeft, BellRing, Package, Tag, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const router = useRouter();
  
  const { data: notifications, mutate, isLoading } = useSWR('/notifications/inbox', async (url) => {
    const res = await api.get(url);
    return res.data;
  });

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/inbox/${id}/read`);
      mutate(); // Refresh the list
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const markAllRead = async () => {
    if (!notifications) return;
    const unread = notifications.filter((n: any) => !n.is_read);
    for (const n of unread) {
      await api.patch(`/notifications/inbox/${n.id}/read`);
    }
    mutate();
  };

  const getIconAndStyle = (type: string) => {
    switch(type) {
      case 'promo': return { icon: Tag, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'order': return { icon: Package, color: 'text-green-500', bg: 'bg-green-50' };
      case 'system': return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' };
      default: return { icon: BellRing, color: 'text-purple-500', bg: 'bg-purple-50' };
    }
  };

  return (
    <div className="min-h-screen bg-bg-main xl:bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="xl:hidden bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm border-b border-border-subtle">
        <button onClick={() => router.back()} className="text-text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-heading font-bold text-text-primary">Notifications</h1>
      </div>

      <div className="flex-1 p-6 xl:p-8 xl:max-w-4xl xl:mx-auto xl:w-full">
        {/* Desktop Header */}
        <div className="hidden xl:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">Notifications</h1>
            <p className="text-text-muted">Stay updated with your orders and special offers</p>
          </div>
          <button 
            onClick={markAllRead}
            className="text-primary font-medium hover:underline px-4 py-2 bg-primary/10 rounded-full"
          >
            Mark all as read
          </button>
        </div>

        {/* Mobile Mark all as read */}
        <div className="xl:hidden flex justify-end mb-6">
          <button onClick={markAllRead} className="text-primary text-sm font-medium">
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading && <p className="text-center text-text-muted mt-10">Loading...</p>}
          {!isLoading && notifications?.length === 0 && (
            <div className="text-center mt-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellRing size={32} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text-primary mb-2">No new notifications</h2>
              <p className="text-text-muted">We'll notify you when something arrives!</p>
            </div>
          )}
          
          {notifications?.map((notification: any) => {
            const { icon: Icon, color, bg } = getIconAndStyle(notification.type);
            return (
              <div 
                key={notification.id} 
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all flex gap-4 ${
                  !notification.is_read ? 'border-primary shadow-primary/5' : 'border-border-subtle'
                }`}
                onClick={() => {
                  if (!notification.is_read) handleMarkAsRead(notification.id);
                }}
              >
                <div className={`w-12 h-12 rounded-full ${bg} ${color} flex items-center justify-center shrink-0`}>
                  <Icon size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-heading font-semibold text-text-primary truncate">{notification.title}</h3>
                    <span className="text-xs text-text-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{notification.body}</p>
                </div>

                {!notification.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shrink-0"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
