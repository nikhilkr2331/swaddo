"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Check, X, Loader2 } from "lucide-react";

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get("/admin/vendors");
      setVendors(res.data);
    } catch (error) {
      console.log("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const approveVendor = async (id: number) => {
    try {
      await api.patch(`/admin/vendors/\${id}/status`, { status: 'active' });
      fetchVendors();
    } catch (error) {
      console.log("Failed to approve vendor");
    }
  };

  const rejectVendor = async (id: number) => {
    try {
      await api.patch(`/admin/vendors/\${id}/status`, { status: 'rejected' });
      fetchVendors();
    } catch (error) {
      console.log("Failed to reject vendor");
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-heading mb-6">Manage Vendors</h1>
      <div className="bg-bg-alt rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-main border-b border-border-subtle text-sm text-text-muted">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Phone</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-main/50 transition-colors">
                <td className="p-4 text-text-muted">#{v.id}</td>
                <td className="p-4 font-medium text-text-primary">{v.name || 'N/A'}</td>
                <td className="p-4">{v.phone}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    \${v.status === 'active' ? 'bg-green-100 text-green-700' : 
                      v.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {v.status || 'pending_approval'}
                  </span>
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  {v.status !== 'active' && (
                    <button onClick={() => approveVendor(v.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Approve">
                      <Check size={18} />
                    </button>
                  )}
                  {v.status !== 'rejected' && (
                    <button onClick={() => rejectVendor(v.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Reject">
                      <X size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
