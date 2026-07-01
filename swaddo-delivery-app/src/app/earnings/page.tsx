"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, PackageX } from "lucide-react";

export default function Earnings() {
  useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/delivery/earnings');
      if (res.data && res.data.data) {
        setData(res.data.data);
      } else if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.log("Failed to fetch earnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const dailyBreakdown = data?.dailyBreakdown || Array(7).fill({ earnings: 0, dayName: '?' });
  const chartData = dailyBreakdown.map((d: any) => d.earnings);
  const maxEarnings = Math.max(...chartData, 1);
  const deliveries = data?.deliveryHistory || [];

  return (
    <div className="px-6 pt-8 pb-24 max-w-md mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Earnings</h1>
        <button 
          onClick={fetchEarnings}
          className={`p-2 rounded-full bg-bg-alt border border-border-subtle shadow-sm ${loading ? 'animate-spin text-primary' : 'text-text-muted hover:text-primary'}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-bg-alt border border-border-subtle rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">This Week</p>
          <h2 className="text-3xl font-heading font-bold text-accent">₹{data?.weekEarnings || 0}</h2>
        </div>
        <div className="bg-bg-alt border border-border-subtle rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">This Month</p>
          <h2 className="text-3xl font-heading font-bold text-primary">₹{data?.monthEarnings || 0}</h2>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="bg-bg-alt border border-border-subtle rounded-2xl p-5 mb-8 shadow-sm">
        <h3 className="text-sm font-bold text-text-primary mb-4">Past 7 Days</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {chartData.map((val: number, idx: number) => {
            const heightPct = (val / maxEarnings) * 100;
            const isToday = idx === chartData.length - 1;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 gap-2">
                <div className="w-full relative h-full flex items-end">
                  <div 
                    className={`w-full rounded-sm transition-all duration-1000 ${isToday ? 'bg-primary' : 'bg-border-subtle'}`} 
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-muted font-medium">{dailyBreakdown[idx].dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* History List */}
      <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Recent Deliveries</h3>
      <div className="space-y-3">
        {loading && deliveries.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <RefreshCw size={24} className="mx-auto animate-spin mb-2" />
            <p>Loading your earnings...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-12 opacity-50 bg-bg-alt rounded-2xl border border-border-subtle">
            <PackageX size={48} className="mx-auto mb-4 text-text-muted" />
            <p className="font-bold text-text-primary">No deliveries yet</p>
            <p className="text-sm text-text-muted mt-1">Complete an order to see earnings!</p>
          </div>
        ) : (
          deliveries.map((delivery: any) => (
            <div key={delivery.id} className="bg-bg-alt border border-border-subtle rounded-2xl p-4 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-border-subtle/50">
                <div>
                  <h4 className="font-heading font-bold text-text-primary">{delivery.stall}</h4>
                  <p className="text-xs text-text-muted">{delivery.date} • {delivery.distance}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-text-muted mb-0.5">Your Payout</p>
                  <span className="font-bold text-primary text-lg">₹{delivery.amount}</span>
                </div>
              </div>
              
              <div className="mt-2 pt-3 border-t border-border-subtle/30 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Pickup Pay</span>
                  <span className="font-medium">₹{delivery.breakdown?.pickup || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Drop Pay</span>
                  <span className="font-medium">₹{delivery.breakdown?.drop || 0}</span>
                </div>
                {delivery.breakdown?.return > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Return Pay</span>
                    <span className="font-medium">₹{delivery.breakdown.return}</span>
                  </div>
                )}
              </div>

              {delivery.codAmount > 0 && (
                <div className="bg-[#8B4513]/10 border border-[#8B4513]/20 rounded-lg p-2 flex justify-between items-center mt-1">
                  <span className="text-xs font-bold text-[#8B4513]">COD Collected</span>
                  <span className="text-sm font-bold text-[#8B4513]">₹{delivery.codAmount}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
