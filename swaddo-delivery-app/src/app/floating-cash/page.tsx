"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Landmark, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function FloatingCashPage() {
  useAuth();
  const router = useRouter();
  const [floatingCash, setFloatingCash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/delivery/dashboard');
        if (res.data) {
          setFloatingCash(res.data.floatingCash || 0);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  const handleDeposit = async () => {
    if (floatingCash <= 0) return;
    setSubmitting(true);
    try {
      await api.post('/delivery/deposit');
      alert("Cash marked as deposited successfully!");
      router.push('/home');
    } catch (err) {
      console.error(err);
      alert("Failed to confirm deposit. Please try again.");
      setSubmitting(false);
    }
  };

  const limitReached = floatingCash >= 2000;
  const progressPercent = Math.min((floatingCash / 2000) * 100, 100);

  if (loading) {
    return <div className="min-h-screen bg-bg-main flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-main">
      {/* Header */}
      <div className="bg-bg-alt sticky top-0 z-10 border-b border-border-subtle shadow-sm">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-bg-subtle active:bg-border-subtle transition-colors"
          >
            <ChevronLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-lg font-heading font-bold text-text-primary">Floating Cash</h1>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-6 pb-24 overflow-y-auto">
        
        {/* Floating Cash Status */}
        <div className="bg-bg-alt rounded-2xl p-6 border border-border-subtle shadow-sm mb-6 relative overflow-hidden">
          {limitReached && (
            <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-1 uppercase tracking-wider">
              Limit Exceeded
            </div>
          )}
          
          <div className={`mt-2 flex flex-col items-center ${limitReached ? 'text-red-600' : 'text-[#8B4513]'}`}>
            <span className="text-sm font-bold uppercase tracking-wider mb-1">Current Balance</span>
            <span className="text-5xl font-heading font-bold">₹{floatingCash}</span>
            <span className="text-sm mt-1 opacity-80">Limit: ₹2000</span>
          </div>

          <div className="mt-6 w-full h-3 bg-border-subtle rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${limitReached ? 'bg-red-600' : 'bg-[#8B4513]'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {limitReached && (
            <div className="mt-4 flex items-start gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-tight">
                You have reached your floating cash limit. You cannot receive new order jobs until you deposit the cash.
              </p>
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div className="bg-bg-alt rounded-2xl p-5 border border-border-subtle shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Landmark size={20} className="text-primary" />
            <h2 className="text-md font-heading font-bold text-text-primary">Company Bank Details</h2>
          </div>
          <p className="text-xs text-text-muted mb-4">
            Transfer your floating cash to the following bank account and click "Confirm Deposit" below.
          </p>

          <div className="space-y-3 bg-bg-subtle p-4 rounded-xl border border-border-subtle/50">
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Bank Name</span>
              <p className="font-medium text-text-primary">State Bank of India</p>
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Account Name</span>
              <p className="font-medium text-text-primary">SwaDDo Foods Pvt Ltd</p>
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Account Number</span>
              <p className="font-mono text-lg font-bold text-text-primary tracking-widest">34567890123</p>
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">IFSC Code</span>
              <p className="font-mono text-sm font-bold text-text-primary">SBIN0001234</p>
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">UPI ID</span>
              <p className="font-medium text-primary">swaddo@sbi</p>
            </div>
          </div>
        </div>

        {/* Deposit Action */}
        <button
          onClick={handleDeposit}
          disabled={floatingCash <= 0 || submitting}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-[0.98] hover:bg-primary-hover disabled:opacity-50 disabled:active:scale-100"
        >
          {submitting ? "Processing..." : (
            <>
              <CheckCircle2 size={20} />
              Confirm Deposit (₹{floatingCash})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
