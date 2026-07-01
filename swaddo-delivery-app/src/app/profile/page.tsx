"use client";

import { User, LogOut, ChevronDown, CheckCircle2, Clock, Landmark, FileText, IndianRupee, AlertCircle, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

export default function Profile() {
  useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('documents');

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', vehicle: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Bank Form States
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '', ifscCode: '' });
  const [isSavingBank, setIsSavingBank] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/delivery/profile');
      if (res.data && res.data.data) {
        setProfile(res.data.data);
      } else if (res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await api.patch('/delivery/profile', editForm);
      await fetchProfile();
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!bankForm.bankName || !bankForm.accountName || !bankForm.accountNumber || !bankForm.ifscCode) {
      alert("Please fill all bank details.");
      return;
    }
    try {
      setIsSavingBank(true);
      await api.patch('/delivery/profile', { bankDetails: bankForm });
      await fetchProfile();
    } catch (err) {
      console.error("Failed to save bank details", err);
      alert("Failed to save bank details.");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("swaddo_delivery_token");
      router.push("/login");
    }
  };

  const toggleTab = (tab: string) => {
    if (activeTab === tab) setActiveTab(null);
    else setActiveTab(tab);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  }

  return (
    <div className="px-6 pt-8 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-heading font-bold text-text-primary mb-6">Account</h1>

      {/* Partner Info Card */}
      <div className="bg-bg-alt border border-border-subtle rounded-2xl p-6 mb-6 shadow-sm relative">
        {!isEditingProfile ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
              <User size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-heading font-bold text-text-primary">{profile?.name || "Delivery Partner"}</h2>
              <p className="text-sm text-text-muted mt-0.5">{profile?.phone || "N/A"}</p>
              <div className="inline-flex items-center bg-bg-main border border-border-subtle px-2 py-1 rounded-md mt-2">
                <span className="text-xs font-bold text-text-primary">{profile?.vehicle || "Bike"}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setEditForm({ name: profile?.name || '', vehicle: profile?.vehicle || '' });
                setIsEditingProfile(true);
              }}
              className="absolute top-4 right-4 text-primary text-sm font-bold"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">Full Name</label>
              <input 
                type="text" 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full bg-white border border-border-subtle rounded-xl px-4 py-2 text-text-primary font-medium focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">Vehicle Details</label>
              <input 
                type="text" 
                value={editForm.vehicle} 
                onChange={(e) => setEditForm({...editForm, vehicle: e.target.value})}
                className="w-full bg-white border border-border-subtle rounded-xl px-4 py-2 text-text-primary font-medium focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2 rounded-xl font-bold text-text-muted bg-bg-subtle"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-2 rounded-xl font-bold text-white bg-primary disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-10">
        
        {/* Documents & KYC */}
        <div className="bg-bg-alt border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleTab('documents')}
            className="w-full flex items-center justify-between p-4 bg-white active:bg-bg-subtle transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-primary" />
              <span className="font-heading font-bold text-text-primary text-base">Documents & KYC</span>
            </div>
            <ChevronDown size={20} className={`text-text-muted transition-transform duration-300 ${activeTab === 'documents' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'documents' && (
            <div className="p-5 pt-0 border-t border-border-subtle/50 space-y-4 bg-white">
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-bold text-text-primary">Aadhar Card</span>
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <CheckCircle2 size={12} /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">Driving License</span>
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <CheckCircle2 size={12} /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">Vehicle RC</span>
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <CheckCircle2 size={12} /> Verified
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div className="bg-bg-alt border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleTab('bank')}
            className="w-full flex items-center justify-between p-4 bg-white active:bg-bg-subtle transition-colors"
          >
            <div className="flex items-center gap-3">
              <Landmark size={18} className="text-accent" />
              <span className="font-heading font-bold text-text-primary text-base">Bank Details</span>
            </div>
            <ChevronDown size={20} className={`text-text-muted transition-transform duration-300 ${activeTab === 'bank' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'bank' && (
            <div className="p-5 pt-0 border-t border-border-subtle/50 bg-white">
              {!profile?.bankDetails?.accountNumber ? (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-red-500 font-medium mb-2">Note: You can only fill this once. Please double-check details.</p>
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1">Bank Name</label>
                    <input type="text" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} className="w-full bg-bg-subtle border border-border-subtle rounded-xl px-4 py-2" placeholder="State Bank of India" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1">Account Holder Name</label>
                    <input type="text" value={bankForm.accountName} onChange={e => setBankForm({...bankForm, accountName: e.target.value})} className="w-full bg-bg-subtle border border-border-subtle rounded-xl px-4 py-2" placeholder="Rahul Kumar" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1">Account Number</label>
                    <input type="text" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} className="w-full bg-bg-subtle border border-border-subtle rounded-xl px-4 py-2" placeholder="XXXX XXXX 1234" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1">IFSC Code</label>
                    <input type="text" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} className="w-full bg-bg-subtle border border-border-subtle rounded-xl px-4 py-2" placeholder="SBIN000XXXX" />
                  </div>
                  <button onClick={handleSaveBankDetails} disabled={isSavingBank} className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-2 disabled:opacity-50">
                    {isSavingBank ? "Saving..." : "Save Bank Details"}
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="bg-bg-subtle p-4 rounded-xl border border-border-subtle/50 space-y-3">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Bank Name</span>
                      <p className="font-medium text-text-primary">{profile.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Account Name</span>
                      <p className="font-medium text-text-primary">{profile.bankDetails.accountName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Account Number</span>
                      <p className="font-mono text-lg font-bold text-text-primary">{profile.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">IFSC Code</span>
                      <p className="font-mono text-sm font-bold text-text-primary">{profile.bankDetails.ifscCode}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mt-4 text-xs text-text-muted">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <p>To edit or update your bank details, please contact Support.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deposit History */}
        <div className="bg-bg-alt border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleTab('deposits')}
            className="w-full flex items-center justify-between p-4 bg-white active:bg-bg-subtle transition-colors"
          >
            <div className="flex items-center gap-3">
              <IndianRupee size={18} className="text-green-600" />
              <span className="font-heading font-bold text-text-primary text-base">Deposit History</span>
            </div>
            <ChevronDown size={20} className={`text-text-muted transition-transform duration-300 ${activeTab === 'deposit' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'deposit' && (
            <div className="p-5 pt-0 border-t border-border-subtle/50 bg-white">
              {profile?.depositHistory?.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {profile.depositHistory.map((dep: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border-subtle/50 last:border-0">
                      <div>
                        <p className="font-bold text-text-primary">₹{dep.amount}</p>
                        <p className="text-xs text-text-muted">{new Date(dep.date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-bold text-green-600 uppercase tracking-wider bg-green-50 px-2 py-1 rounded">
                        {dep.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted mt-4 text-center py-4">No deposits found.</p>
              )}
            </div>
          )}
        </div>

        {/* Online Sessions */}
        <div className="bg-bg-alt border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleTab('sessions')}
            className="w-full flex items-center justify-between p-4 bg-white active:bg-bg-subtle transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-blue-500" />
              <span className="font-heading font-bold text-text-primary text-base">Online Sessions</span>
            </div>
            <ChevronDown size={20} className={`text-text-muted transition-transform duration-300 ${activeTab === 'sessions' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'sessions' && (
            <div className="p-5 pt-0 border-t border-border-subtle/50 bg-white">
              {profile?.onlineSessions?.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {profile.onlineSessions.map((session: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border-subtle/50 last:border-0">
                      <p className="font-medium text-text-primary">
                        {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="font-bold text-blue-600">
                        {Math.floor(session.online_minutes / 60)}h {session.online_minutes % 60}m
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted mt-4 text-center py-4">No sessions recorded yet.</p>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="space-y-4 mb-6">
        {/* Help & Support Button */}
        <button 
          onClick={() => alert("Contacting Support... Support Number: 1800-123-4567")}
          className="w-full bg-white border border-border-subtle rounded-2xl p-5 shadow-sm flex items-center justify-between active:bg-bg-subtle transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={20} className="text-orange-500" />
            <span className="font-heading font-bold text-text-primary text-lg">Help & Support</span>
          </div>
        </button>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 border border-red-100 rounded-xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
      >
        <LogOut size={20} />
        Log Out
      </button>
    </div>
  );
}
