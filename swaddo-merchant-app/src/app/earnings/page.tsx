"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, IndianRupee, Clock, CheckCircle2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EarningsPage() {
  useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState("this_week");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stalls/merchant/payouts?period=${period}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch earnings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [period]);

  const handlePayout = async () => {
    setRequesting(true);
    try {
      const res = await api.post('/stalls/merchant/payouts/request');
      setMessage(res.data.message || "Payout requested successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
       console.error(err);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-main pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-border-subtle shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-text-primary">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-heading font-extrabold text-text-primary">Earnings & Payouts</h1>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-6">
          {/* Skeleton Balance Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-border-subtle h-48 animate-pulse flex flex-col justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mt-2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-12 bg-gray-200 rounded-xl w-full mt-4"></div>
          </div>
          
          {/* Skeleton History */}
          <div>
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="h-6 bg-gray-200 rounded w-2/5 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-4 rounded-2xl h-20 shadow-sm animate-pulse flex justify-between items-center">
                  <div className="space-y-2 w-1/2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          
          {/* Balance Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-border-subtle text-center">
             <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Available Balance</p>
             <h2 className="text-4xl font-heading font-bold text-green-600 mb-6">₹{data?.availableBalance?.toFixed(2) || '0.00'}</h2>
             
             {message && (
               <div className="mb-4 bg-green-50 text-green-700 text-sm font-bold p-3 rounded-xl border border-green-200 flex items-center justify-center gap-2">
                 <CheckCircle2 size={16} /> {message}
               </div>
             )}

             <button 
                onClick={handlePayout}
                disabled={requesting || !data?.availableBalance || data.availableBalance <= 0}
                className="w-full bg-text-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {requesting ? <Loader2 className="animate-spin" size={20} /> : <IndianRupee size={20} />}
                Withdraw to Bank
             </button>
             <p className="text-xs text-text-muted mt-3">Transfers usually take 1-2 business days.</p>
          </div>

          {/* History Section */}
          <div>
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-heading font-bold text-lg text-text-primary">Order Earnings History</h3>
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-gray-100 text-xs font-bold text-text-primary px-3 py-1.5 rounded-lg outline-none"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>

            <div className="space-y-3">
              {data?.history && data.history.length > 0 ? (
                data.history.map((day: any, i: number) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-sm">
                          {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{day.orders} orders completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">₹{Number(day.amount || 0).toFixed(2)}</p>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">Settled</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-border-subtle shadow-sm">
                  <Clock className="mx-auto mb-3 text-gray-300" size={32} />
                  <p className="font-bold text-text-primary">No earnings yet</p>
                  <p className="text-sm text-text-muted mt-1">History for this period will appear here.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
