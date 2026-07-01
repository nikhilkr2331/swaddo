"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/admin/orders");
        setOrders(res.data);
      } catch (error) {
        console.log("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-heading mb-6">Recent Orders</h1>
      <div className="bg-bg-alt rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-main border-b border-border-subtle text-sm text-text-muted">
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-main/50 transition-colors">
                <td className="p-4 text-text-muted">#{o.id}</td>
                <td className="p-4 font-medium text-text-primary">₹{o.total_amount}</td>
                <td className="p-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">
                    {o.status}
                  </span>
                </td>
                <td className="p-4 text-sm">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
