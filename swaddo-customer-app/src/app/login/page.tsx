"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/firebase";
import { Phone, Lock, ArrowRight, Loader2, User } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/request-otp", { phone, role: "customer" });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", { phone, otp, role: "customer" });
      const token = res.data.token;

      localStorage.setItem("swaddo_customer_token", token);
      localStorage.setItem("swaddo_customer_phone", phone);
      
      try {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          await api.post("/notifications/register-token", { token: fcmToken, deviceType: 'web' }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (e) {
        console.warn("Failed to register FCM token", e);
      }
      
      // Redirect back to intended page or home
      const redirectTo = localStorage.getItem("swaddo_redirect_to") || "/";
      localStorage.removeItem("swaddo_redirect_to");
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-main relative overflow-hidden pb-24">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="w-full max-w-md bg-bg-alt rounded-3xl p-8 shadow-xl border border-border-subtle relative z-10">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">Welcome to Swaddo</h1>
          <p className="text-text-muted text-sm">Sign in to order your favorite food.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-[#B82F12] p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={requestOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                <span className="absolute left-11 top-1/2 -translate-y-1/2 text-text-primary font-medium">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter your mobile number"
                  className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 pl-[85px] pr-4 outline-none focus:border-primary transition-colors font-medium text-text-primary"
                  maxLength={10}
                />
              </div>
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
              <p className="text-xs text-text-muted mt-3 text-center">
                OTP sent to +91 {phone}. <button type="button" onClick={() => setStep(1)} className="text-primary font-bold hover:underline">Edit</button>
              </p>
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
