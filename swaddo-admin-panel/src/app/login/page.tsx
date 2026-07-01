"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Lock, Shield, Loader2, ArrowRight } from "lucide-react";
import Cookies from "js-cookie";

export default function AdminLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/request-otp", { phone, role: "admin" });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", { phone, otp, role: "admin" });
      const token = res.data.token;

      Cookies.set("swaddo_admin_token", token);
      Cookies.set("token", token);
      Cookies.set("role", "admin");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      
      <div className="w-full max-w-md bg-bg-alt rounded-3xl p-8 shadow-xl border border-border-subtle relative z-10">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">Admin Portal</h1>
          <p className="text-text-muted text-sm">Sign in to manage the Swaddo platform.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-[#B82F12] p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={requestOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Admin Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit number"
                className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 px-4 outline-none focus:border-primary transition-colors font-medium text-text-primary"
                maxLength={10}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Send OTP"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Enter OTP</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="4-digit OTP"
                  className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-colors font-medium text-text-primary tracking-widest"
                  maxLength={4}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Verify & Login"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
