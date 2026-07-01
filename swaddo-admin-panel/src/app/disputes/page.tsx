"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, RefreshCcw } from "lucide-react";

export default function Disputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get("/admin/disputes");
      setDisputes(res.data);
    } catch (error) {
      console.log("Failed to fetch disputes");
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (id: number, action: string) => {
    try {
      await api.patch(`/admin/disputes/\${id}/resolve`, { resolutionAction: action });
      fetchDisputes();
    } catch (error) {
      console.log("Failed to resolve dispute");
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-heading mb-6">Dispute Management</h1>
      <div className="bg-bg-alt rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-main border-b border-border-subtle text-sm text-text-muted">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Reason</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-main/50 transition-colors">
                <td className="p-4 text-text-muted">#{d.id}</td>
                <td className="p-4">#{d.order_id}</td>
                <td className="p-4 font-medium text-text-primary">{d.reason}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    \${d.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  {d.status === 'open' && (
                    <>
                      <button onClick={() => resolveDispute(d.id, 'refund_customer')} className="px-3 py-1.5 bg-accent text-white text-sm font-bold rounded-lg hover:bg-yellow-600 transition-colors">
                        Refund
                      </button>
                      <button onClick={() => resolveDispute(d.id, 'dismiss')} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300 transition-colors">
                        Dismiss
                      </button>
                    </>
                  )}
                  {d.status === 'resolved' && (
                    <span className="text-sm text-text-muted">Resolved</span>
                  )}
                </td>
              </tr>
            ))}
            {disputes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-muted">No disputes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
