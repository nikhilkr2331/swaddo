"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BarChart3, TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Loader2 } from "lucide-react";

export default function InsightsPage() {
  useAuth();
  const [period, setPeriod] = useState("this_week");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stalls/merchant/insights?period=${period}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch insights", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [period]);

  const periodLabel = period === 'today' ? 'Today' : period === 'this_week' ? 'This Week' : 'This Month';

  return (
    <div className="min-h-screen bg-bg-main pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-border-subtle shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-heading font-extrabold text-text-primary">Business Insights</h1>
          <p className="text-sm text-text-muted mt-1">Track your growth and performance</p>
        </div>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-100 text-sm font-bold text-text-primary px-3 py-2 rounded-xl outline-none"
        >
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
        </select>
      </div>

      {loading ? (
        <div className="p-4 space-y-6">
          {/* Skeleton Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle h-28 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle h-28 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
            </div>
          </div>
          
          {/* Skeleton Sales Chart Placeholder */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-border-subtle h-56 animate-pulse flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex-1 flex items-end justify-between gap-2">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="bg-gray-200 rounded-t-md w-full" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle">
              <div className="flex items-center text-text-muted mb-2">
                <IndianRupee size={16} className="mr-1" />
                <span className="text-xs font-bold uppercase tracking-wider">{periodLabel} Revenue</span>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1">₹{Number(data?.totalRevenue || 0).toFixed(2)}</div>
              <div className="flex items-center text-green-500 text-xs font-bold">
                <TrendingUp size={14} className="mr-1" />
                +{data?.growthRevenue || 0}% vs last period
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle">
              <div className="flex items-center text-text-muted mb-2">
                <ShoppingBag size={16} className="mr-1" />
                <span className="text-xs font-bold uppercase tracking-wider">{periodLabel} Orders</span>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1">{data?.totalOrders || 0}</div>
              <div className="flex items-center text-green-500 text-xs font-bold">
                <TrendingUp size={14} className="mr-1" />
                +{data?.growthOrders || 0}% vs last period
              </div>
            </div>
          </div>

          {/* Sales Chart Placeholder */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-border-subtle">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading font-bold text-text-primary">Sales Trend</h2>
              <span className="text-xs font-bold text-accent bg-yellow-50 px-2 py-1 rounded-md">{periodLabel}</span>
            </div>
            <div className="h-40 flex items-end justify-between gap-2">
              {data?.chartData && data.chartData.length > 0 ? (
                data.chartData.map((point: any, i: number) => {
                  // Very basic mock calculation for bar height visually
                  const maxVal = Math.max(...data.chartData.map((d:any)=>d.value)) || 1;
                  const height = Math.max(10, (point.value / maxVal) * 100);
                  return (
                    <div key={i} className="flex-1 bg-accent/20 rounded-t-md relative group flex justify-center cursor-pointer" style={{ height: `${height}%`, minWidth: '10px' }}>
                      <div className="absolute bottom-0 w-full bg-accent rounded-t-md transition-all duration-300" style={{ height: `100%` }}></div>
                      <span className="absolute -bottom-5 text-[10px] text-text-muted font-bold truncate max-w-full">
                        {point.label}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        ₹{Number(point.value).toFixed(2)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                  No sales data yet for {periodLabel.toLowerCase()}
                </div>
              )}
            </div>
            <div className="mt-8 border-t border-border-subtle pt-3 flex justify-between text-xs text-text-muted">
              <span>Performance timeline</span>
            </div>
          </div>

          {/* Top Selling Items (Mocked UI for now) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-text-primary">Top Selling Items</h2>
              <BarChart3 size={18} className="text-accent" />
            </div>
            {data?.topItems && data.topItems.length > 0 ? (
              <div className="space-y-4">
                {data.topItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-accent font-bold text-sm">{idx + 1}</div>
                      <div>
                        <p className="font-bold text-text-primary text-sm">{item.name}</p>
                        <p className="text-[10px] text-text-muted">Most ordered this {period === 'this_month' ? 'month' : period === 'this_week' ? 'week' : 'day'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm">{item.orders} orders</span>
                  </div>
                ))}
              </div>
            ) : (
               <p className="text-center text-sm text-gray-400 py-4">No top items yet.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
