"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Check, X } from "lucide-react";

export default function Riders() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const res = await api.get("/admin/riders");
      setRiders(res.data);
    } catch (error) {
      console.log("Failed to fetch riders");
    } finally {
      setLoading(false);
    }
  };

  const approveRider = async (id: number) => {
    try {
      await api.patch(`/admin/riders/\${id}/status`, { status: 'active' });
      fetchRiders();
    } catch (error) {
      console.log("Failed to approve rider");
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-heading mb-6">Manage Riders</h1>
      <div className="bg-bg-alt rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-main border-b border-border-subtle text-sm text-text-muted">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Phone</th>
              <th className="p-4 font-medium">Vehicle</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((r) => (
              <tr key={r.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-main/50 transition-colors">
                <td className="p-4 text-text-muted">#{r.id}</td>
                <td className="p-4 font-medium text-text-primary">{r.name || 'N/A'}</td>
                <td className="p-4">{r.phone}</td>
                <td className="p-4">{r.vehicle_type}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    \${r.status === 'active' ? 'bg-green-100 text-green-700' : 
                      r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.status || 'pending_approval'}
                  </span>
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  {r.status !== 'active' && (
                    <button onClick={() => approveRider(r.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Approve">
                      <Check size={18} />
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
