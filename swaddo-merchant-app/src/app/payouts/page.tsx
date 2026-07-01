"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, IndianRupee, Clock, CheckCircle2 } from "lucide-react";

export default function Payouts() {
  useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stalls/merchant/payouts');
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch payouts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const history = data?.history || [];

  return (
    <div className="flex flex-col min-h-screen pt-8 px-6 pb-24 max-w-md mx-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Payouts</h1>
          <p className="text-text-muted text-sm">Manage your earnings</p>
        </div>
        <button 
          onClick={fetchPayouts}
          className={`p-2 rounded-full bg-bg-alt border border-border-subtle shadow-sm ${loading ? 'animate-spin text-primary' : 'text-text-muted hover:text-primary'}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="bg-bg-alt rounded-2xl p-6 shadow-sm border border-border-subtle mb-8 text-center">
        <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Available Balance</p>
        <h2 className="text-4xl font-heading font-bold text-primary flex items-center justify-center gap-1">
          <IndianRupee size={32} />
          {data?.availableBalance || 0}
        </h2>
        <button className="mt-6 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-colors shadow-sm">
          Withdraw Funds
        </button>
      </div>

      <h2 className="text-lg font-heading font-bold text-text-primary mb-4">Payout History</h2>
      
      <div className="space-y-4">
        {loading && history.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <RefreshCw size={24} className="mx-auto animate-spin mb-2" />
            <p>Loading your history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 opacity-50 bg-bg-alt rounded-2xl border border-border-subtle">
            <p className="font-bold text-text-primary">No payouts yet</p>
          </div>
        ) : (
          history.map((payout: any) => (
            <div key={payout.id} className="bg-bg-alt border border-border-subtle rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payout.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {payout.status === 'completed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-text-primary">₹{payout.amount}</h4>
                  <p className="text-xs text-text-muted">{payout.date}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold uppercase tracking-wider ${payout.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {payout.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
