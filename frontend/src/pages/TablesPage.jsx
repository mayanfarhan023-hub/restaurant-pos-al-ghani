import React, { useEffect, useState } from 'react';
import api from '../api';
import { Save, Printer, X, Check, DollarSign, Plus } from 'lucide-react';

const MAX_TABLES = 5;

export default function TablesPage() {
  const [sales, setSales] = useState([]);
  const [openSale, setOpenSale] = useState(null);
  const [message, setMessage] = useState('');

  const fetchSales = () => {
    api.get('/table-sales').then((r) => setSales(r.data));
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const openSales = sales.filter((s) => s.status === 'open');

  const getNextTableNumber = () => {
    const used = new Set(openSales.map((s) => s.table_number));
    if (openSales.length === 0) return 1;
    const maxUsed = Math.max(0, ...openSales.map((s) => s.table_number));
    const next = maxUsed + 1;
    if (next <= MAX_TABLES) return next;
    for (let i = 1; i <= MAX_TABLES; i++) {
      if (!used.has(i)) return i;
    }
    return null;
  };

  const addTable = () => {
    const next = getNextTableNumber();
    if (!next) {
      setMessage('All 5 tables are occupied. Close a table to add a new one.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setOpenSale({
      table_number: next,
      bill_amount: '',
      payment_method: 'cash',
      notes: '',
    });
  };

  const save = async () => {
    try {
      const payload = {
        table_number: openSale.table_number,
        bill_amount: Number(openSale.bill_amount),
        payment_method: openSale.payment_method,
        notes: openSale.notes,
      };
      if (openSale.id) {
        await api.put(`/table-sales/${openSale.id}`, payload);
      } else {
        await api.post('/table-sales', payload);
      }
      setMessage('Saved');
      setOpenSale(null);
      fetchSales();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to save');
    }
  };

  const closeSale = async (id) => {
    await api.post(`/table-sales/${id}/close`);
    fetchSales();
  };

  const printReceipt = (sale) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Receipt Table ${sale.table_number}</title></head>
      <body style="font-family:monospace; padding:20px;">
        <h2>AL GHANI BBQ & FAST FOOD</h2>
        <p>Table #${sale.table_number}</p>
        <p>Amount: Rs. ${Number(sale.bill_amount).toFixed(2)}</p>
        <p>Payment: ${sale.payment_method}</p>
        <p>${sale.notes || ''}</p>
        <p>Date: ${new Date(sale.created_at).toLocaleString()}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const closedTotal = sales
    .filter((s) => s.status === 'closed')
    .reduce((sum, s) => sum + Number(s.bill_amount), 0);

  const canAdd = openSales.length < MAX_TABLES;
  const nextNumber = getNextTableNumber();

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 bg-slate-900 text-white">
      <h2 className="text-2xl font-bold mb-4">Tables</h2>
      {message && <div className="mb-4 p-3 rounded-lg bg-green-500/20 text-green-300 text-sm">{message}</div>}

      <div className="mb-6">
        <button
          onClick={addTable}
          disabled={!canAdd}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm transition ${
            canAdd
              ? 'bg-brand-500 hover:bg-brand-600 text-slate-900'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Plus size={18} />
          {canAdd ? `Add Table ${nextNumber}` : 'All 5 tables occupied'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {openSale && (
          <div className="lg:col-span-1 bg-slate-800 rounded-2xl p-5 border border-slate-700 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Table {openSale.table_number}</h3>
              <button onClick={() => setOpenSale(null)} className="p-1 hover:bg-slate-700 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Bill Amount</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    value={openSale.bill_amount}
                    onChange={(e) => setOpenSale({ ...openSale, bill_amount: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Payment Method</label>
                <select
                  value={openSale.payment_method}
                  onChange={(e) => setOpenSale({ ...openSale, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Notes</label>
                <textarea
                  value={openSale.notes}
                  onChange={(e) => setOpenSale({ ...openSale, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={save} className="flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium text-sm">
                  <Save size={16} /> Save
                </button>
                {openSale.id && (
                  <button onClick={() => closeSale(openSale.id)} className="flex items-center justify-center gap-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-medium text-sm">
                    <Check size={16} /> Close
                  </button>
                )}
              </div>
              {openSale.id && (
                <button onClick={() => printReceipt(openSale)} className="w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-900 font-medium text-sm">
                  <Printer size={16} /> Print Receipt
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden ${openSale ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold">Table Sales History</h3>
            <span className="text-sm text-slate-400">Closed total: Rs. {closedTotal.toFixed(2)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3">Table</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                    <td className="p-3">{s.table_number}</td>
                    <td className="p-3">Rs. {Number(s.bill_amount).toFixed(2)}</td>
                    <td className="p-3 capitalize">{s.payment_method}</td>
                    <td className="p-3 text-slate-400">{s.notes}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${s.status === 'open' ? 'bg-brand-500/20 text-brand-500' : 'bg-green-500/20 text-green-300'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => setOpenSale(s)} className="p-1 hover:text-brand-500">Edit</button>
                        {s.status === 'open' && (
                          <button onClick={() => closeSale(s.id)} className="p-1 hover:text-green-400">Close</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
