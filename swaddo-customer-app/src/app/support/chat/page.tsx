"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import useSWR from "swr";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

export default function SupportChat() {
  const router = useRouter();
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch or create ticket on load
  const { data: tickets, mutate: mutateTickets } = useSWR('/support/tickets', async (url) => {
    const res = await api.get(url);
    return res.data;
  });

  const activeTicket = tickets?.find((t: any) => t.status === 'open');

  useEffect(() => {
    if (tickets && !activeTicket && tickets.length >= 0 && !ticketId) {
      // Auto create a ticket if none exists when they enter chat
      api.post('/support/tickets', { subject: 'Support Request', initialMessage: 'Hi, I need help.' })
        .then(res => {
          setTicketId(res.data.id);
          mutateTickets();
        })
        .catch(() => toast.error('Failed to initiate chat'));
    } else if (activeTicket && !ticketId) {
      setTicketId(activeTicket.id);
    }
  }, [tickets, activeTicket, ticketId, mutateTickets]);

  const { data: messages, mutate: mutateMessages } = useSWR(
    ticketId ? `/support/tickets/${ticketId}/messages` : null, 
    async (url) => {
      const res = await api.get(url);
      return res.data;
    },
    { refreshInterval: 0 } // handled by sockets mostly
  );

  useEffect(() => {
    if (ticketId) {
      let socketUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) {
        socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
      }
      const newSocket = io(socketUrl || "http://localhost:5005", { transports: ["websocket"] });
      
      newSocket.on('connect', () => {
        newSocket.emit('join_room', `support_${ticketId}`);
      });

      newSocket.on('support_message', (msg) => {
        mutateMessages((prev: any) => {
          if (!prev) return [msg];
          if (prev.find((m: any) => m.id === msg.id)) return prev;
          return [...prev, msg];
        }, false);
        scrollToBottom();
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [ticketId, mutateMessages]);

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
    if (!message.trim() || !ticketId) return;

    const currentMsg = message;
    setMessage("");
    setIsSending(true);

    try {
      const res = await api.post(`/support/tickets/${ticketId}/messages`, { message: currentMsg });
      mutateMessages((prev: any) => [...(prev || []), res.data], false);
      scrollToBottom();
    } catch (err) {
      toast.error('Failed to send message');
      setMessage(currentMsg);
    } finally {
      setIsSending(false);
    }
  };

  if (!ticketId || !messages) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="mt-4 text-text-muted font-medium">Connecting to support...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] font-body max-w-5xl mx-auto border-x border-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 shadow-sm flex items-center justify-between shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-text-primary" />
          </button>
          <div>
            <h1 className="text-lg font-heading font-bold text-text-primary leading-tight">Live Support</h1>
            <p className="text-xs text-green-500 font-medium">Online</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center">
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Ticket #{ticketId}
          </span>
        </div>

        {messages.map((msg: any, i: number) => {
          const isUser = msg.sender_type === 'user';
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                isUser 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-white text-text-primary rounded-tl-sm border border-gray-100'
              }`}>
                <p className="text-[15px] leading-relaxed">{msg.message}</p>
                <p className={`text-[10px] mt-1 text-right ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-100 shrink-0 mb-safe pb-safe">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm"
          />
          <button 
            type="submit"
            disabled={!message.trim() || isSending}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
          </button>
        </form>
      </div>
    </div>
  );
}
