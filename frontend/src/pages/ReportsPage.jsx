import React, { useEffect, useState } from 'react';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [period, setPeriod] = useState('today');
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get(`/reports/summary?period=${period}`).then((r) => setSummary(r.data));
    api.get(`/reports/items?period=${period}`).then((r) => setItems(r.data));
  }, [period]);

  const categoryData = summary?.category_sales || [];
  const itemData = items?.items || [];

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 bg-slate-900 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${
                period === p.value ? 'bg-brand-500 text-slate-900' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
            <div className="text-slate-400 text-sm">Total Revenue</div>
            <div className="text-2xl font-bold text-brand-500">Rs. {summary.total_revenue.toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
            <div className="text-slate-400 text-sm">Orders</div>
            <div className="text-2xl font-bold">{summary.order_count}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
            <div className="text-slate-400 text-sm">Items Sold</div>
            <div className="text-2xl font-bold">{summary.total_items}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
            <div className="text-slate-400 text-sm">Most Sold</div>
            <div className="text-lg font-bold truncate">{summary.most_sold || '-'}</div>
            <div className="text-xs text-slate-500">Least: {summary.least_sold || '-'}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
          <h3 className="font-bold mb-4">Category Sales</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="category" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
          <h3 className="font-bold mb-4">Category Quantity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="quantity" nameKey="category" outerRadius={80} label>
                  {categoryData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 font-bold">Item Sales</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {itemData.map((it, idx) => (
                <tr key={idx} className="border-t border-slate-700 hover:bg-slate-700/50">
                  <td className="p-3">{it.name}</td>
                  <td className="p-3">{it.quantity}</td>
                  <td className="p-3">Rs. {it.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
