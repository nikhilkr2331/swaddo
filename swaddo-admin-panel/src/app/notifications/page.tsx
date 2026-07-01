"use client";

import { useState } from "react";
import { Bell, Send, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSending(true);
    setSuccess(false);

    try {
      await api.post("/admin/notifications/send", { title, message });
      setSuccess(true);
      setTitle("");
      setMessage("");
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to send notification", err);
      alert("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-gray-900">Push Notifications</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Bell size={24} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Broadcast Message</h2>
            <p className="text-gray-500 text-sm">Send a real-time notification to all active customers.</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Flash Sale Alert!"
              className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Message</label>
            <textarea 
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. Get 50% off on all items for the next hour!"
              className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
            ></textarea>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl border border-green-200">
              <CheckCircle2 size={20} />
              <span className="font-medium text-sm">Notification broadcasted successfully!</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSending || !title.trim() || !message.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSending ? (
              <span className="animate-pulse">Broadcasting...</span>
            ) : (
              <>
                <Send size={20} />
                Broadcast Now
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
