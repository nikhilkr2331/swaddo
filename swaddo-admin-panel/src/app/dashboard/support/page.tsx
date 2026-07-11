"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Search, User, MessageSquare } from "lucide-react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

export default function AdminSupport() {
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { data: tickets, mutate: mutateTickets } = useSWR('/admin/support/tickets', async (url) => {
    const res = await api.get(url);
    return res.data;
  }, { refreshInterval: 10000 });

  const { data: messages, mutate: mutateMessages } = useSWR(
    activeTicketId ? `/support/tickets/${activeTicketId}/messages` : null, 
    async (url) => {
      const res = await api.get(url);
      return res.data;
    }
  );

  useEffect(() => {
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) {
      socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
    }
    const newSocket = io(socketUrl || "http://localhost:5005", { transports: ["websocket"] });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && activeTicketId) {
      socket.emit('join_room', `support_${activeTicketId}`);
      
      const handler = (msg: any) => {
        if (msg.ticket_id == activeTicketId) {
          mutateMessages((prev: any) => {
            if (!prev) return [msg];
            if (prev.find((m: any) => m.id === msg.id)) return prev;
            return [...prev, msg];
          }, false);
          scrollToBottom();
        }
      };

      socket.on('support_message', handler);

      return () => {
        socket.off('support_message', handler);
      };
    }
  }, [socket, activeTicketId, mutateMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (messages) {
      scrollToBottom();
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeTicketId) return;

    const currentMsg = message;
    setMessage("");
    setIsSending(true);

    try {
      const res = await api.post(`/admin/support/tickets/${activeTicketId}/reply`, { message: currentMsg });
      mutateMessages((prev: any) => [...(prev || []), res.data], false);
      scrollToBottom();
    } catch (err) {
      toast.error('Failed to send reply');
      setMessage(currentMsg);
    } finally {
      setIsSending(false);
    }
  };

  const closeTicket = async (ticketId: number) => {
    try {
      await api.patch(`/admin/support/tickets/${ticketId}/status`, { status: 'closed' });
      toast.success('Ticket closed');
      mutateTickets();
      if (activeTicketId === ticketId) setActiveTicketId(null);
    } catch (err) {
      toast.error('Failed to close ticket');
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Left Sidebar - Ticket List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            Support Inbox
          </h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search tickets or users..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!tickets ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No support tickets found.</div>
          ) : (
            tickets.map((ticket: any) => (
              <button 
                key={ticket.id}
                onClick={() => setActiveTicketId(ticket.id)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeTicketId === ticket.id ? 'bg-orange-50/50 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900 text-sm truncate pr-2">{ticket.user_name}</span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2 truncate">#{ticket.id} - {ticket.subject}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-medium text-gray-400">{ticket.phone_number}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {ticket.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Content - Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {!activeTicketId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a ticket from the left to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={20} className="text-gray-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">
                    {tickets?.find((t:any) => t.id === activeTicketId)?.user_name}
                  </h3>
                  <p className="text-xs text-gray-500">Ticket #{activeTicketId}</p>
                </div>
              </div>
              {tickets?.find((t:any) => t.id === activeTicketId)?.status === 'open' && (
                <button 
                  onClick={() => closeTicket(activeTicketId)}
                  className="px-4 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                >
                  Mark as Resolved
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {!messages ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                messages.map((msg: any, i: number) => {
                  const isAdmin = msg.sender_type === 'admin';
                  return (
                    <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
                        isAdmin 
                          ? 'bg-primary text-white rounded-tr-sm' 
                          : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                      }`}>
                        <p className="text-[15px] leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              {tickets?.find((t:any) => t.id === activeTicketId)?.status === 'closed' ? (
                <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                  This ticket has been resolved and closed.
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your reply to the customer..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="px-6 py-3 rounded-xl bg-primary flex items-center justify-center text-white font-bold disabled:opacity-50 hover:bg-primary-hover transition-colors shadow-sm"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <>Reply <Send size={16} className="ml-2" /></>}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
