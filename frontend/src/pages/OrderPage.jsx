import React, { useEffect, useMemo, useState, useRef } from 'react';
import api from '../api';
import { Search, Plus, Minus, Trash2, Save, Printer, X, ShoppingCart, Tag, Flame, Utensils, Tags, Percent } from 'lucide-react';
import Receipt from '../components/Receipt';

export default function OrderPage() {
  const [sections] = useState(['BBQ', 'Fast Food', 'Deals']);
  const [activeSection, setActiveSection] = useState('BBQ');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState([]);
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/categories').then((r) => {
      setCategories(r.data);
      const bbq = r.data.find((c) => c.section === 'BBQ');
      if (bbq) setActiveCategory(bbq.id);
    });
    api.get('/menu-items').then((r) => setMenuItems(r.data));
    api.get('/deals').then((r) => setDeals(r.data));
    api.get('/settings').then((r) => setSettings(r.data.values));
  }, []);

  const filteredItems = useMemo(() => {
    if (activeSection === 'Deals') return [];
    return menuItems.filter((item) => {
      const inCategory = activeCategory ? item.category_id === activeCategory : true;
      const matches = item.name.toLowerCase().includes(search.toLowerCase());
      return inCategory && matches;
    });
  }, [menuItems, activeCategory, search, activeSection]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [deals, search]);

  const addItem = (item, deal = null) => {
    setOrder((prev) => {
      const isDeal = !!deal;
      const id = isDeal ? deal.id : item.id;
      const existing = prev.find((line) => (isDeal ? line.deal_id : line.menu_item_id) === id);
      if (existing) {
        return prev.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + 1, total: (line.quantity + 1) * line.unit_price } : line
        );
      }
      const line = isDeal
        ? {
            type: 'deal',
            deal_id: deal.id,
            name: deal.name,
            unit_price: Number(deal.price),
            total: Number(deal.price),
            quantity: 1,
            items: deal.deal_items,
          }
        : {
            type: 'item',
            menu_item_id: item.id,
            name: item.name,
            unit_price: Number(item.price),
            total: Number(item.price),
            quantity: 1,
          };
      return [...prev, line];
    });
  };

  const updateQty = (idx, delta) => {
    setOrder((prev) =>
      prev.map((line, i) => {
        if (i !== idx) return line;
        const qty = Math.max(1, line.quantity + delta);
        return { ...line, quantity: qty, total: qty * line.unit_price };
      })
    );
  };

  const removeLine = (idx) => setOrder((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = order.reduce((sum, line) => sum + line.total, 0);
  const taxRate = Number(settings.tax_rate || 0);
  const tax = subtotal * (taxRate / 100);
  const total = Math.max(0, subtotal - Number(discount) + tax);

  const clearOrder = () => {
    setOrder([]);
    setDiscount(0);
    setNotes('');
    setTableNumber('');
    setReceipt(null);
  };

  const saveOrder = async (print = false) => {
    if (order.length === 0) return;
    setLoading(true);
    try {
      const items = order.map((line) => ({
        menu_item_id: line.type === 'item' ? line.menu_item_id : null,
        deal_id: line.type === 'deal' ? line.deal_id : null,
        quantity: line.quantity,
        notes: '',
      }));
      const payload = {
        order_type: orderType,
        table_number: tableNumber ? parseInt(tableNumber) : null,
        payment_method: paymentMethod,
        notes,
        discount: Number(discount || 0),
        items,
      };
      let res = await api.post('/orders', payload);
      res = await api.post(`/orders/${res.data.id}/close`);
      setReceipt(res.data);
      setMessage('Order saved successfully');
      setTimeout(() => setMessage(''), 3000);
      if (print) {
        setTimeout(() => window.print(), 300);
      }
      setOrder([]);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const sectionCats = categories.filter((c) => c.section === activeSection);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-900 text-white">
      {/* Left categories / sections */}
      <div className="w-full lg:w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex gap-2 mb-4">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setActiveSection(s);
                  if (s !== 'Deals') {
                    const first = categories.find((c) => c.section === s);
                    setActiveCategory(first?.id || null);
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                  activeSection === s ? 'bg-brand-500 text-slate-900' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {activeSection !== 'Deals' &&
            sectionCats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
                  activeCategory === cat.id ? 'bg-slate-800 text-brand-500' : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          {activeSection === 'Deals' && (
            <div className="text-sm text-slate-400 px-3 py-2">Click a deal to add it to the bill</div>
          )}
        </div>
      </div>

      {/* Center items */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Order type</span>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            >
              <option value="dine_in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Table"
              className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
          </div>
          {message && (
            <div className="px-3 py-1 rounded-lg bg-green-500/20 text-green-300 text-sm">{message}</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeSection === 'Deals' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDeals.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => addItem(null, deal)}
                  className="text-left p-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-brand-500 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{deal.name}</h3>
                    <span className="text-brand-500 font-bold text-xl">Rs. {Number(deal.price).toFixed(0)}</span>
                  </div>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {deal.deal_items.map((di) => (
                      <li key={di.id}>
                        {di.quantity}x {di.menu_item.name}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="flex flex-col items-start p-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-brand-500 hover:-translate-y-1 transition h-32 justify-between"
                >
                  <span className="font-bold text-base leading-tight text-left">{item.name}</span>
                  <span className="text-brand-500 font-bold text-lg mt-2">Rs. {Number(item.price).toFixed(0)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right order panel */}
      <div className="w-full lg:w-[420px] bg-slate-950 border-l border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShoppingCart size={20} />
            Current Order
          </div>
          <button onClick={clearOrder} className="text-red-400 text-sm hover:text-red-300">
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {order.length === 0 && (
            <div className="text-center text-slate-500 py-10">Tap items or deals to add them to the bill</div>
          )}
          {order.map((line, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-bold">{line.name}</div>
                  {line.type === 'deal' && (
                    <div className="text-xs text-slate-400">
                      {line.items.map((di) => `${di.quantity}x ${di.menu_item.name}`).join(', ')}
                    </div>
                  )}
                </div>
                <div className="font-bold text-brand-500">Rs. {line.total.toFixed(0)}</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(idx, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-medium">{line.quantity}</span>
                  <button onClick={() => updateQty(idx, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700">
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400">Discount</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400">Payment</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm resize-none"
            />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax ({taxRate}%)</span>
              <span>Rs. {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Discount</span>
              <span>Rs. {Number(discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-800">
              <span>Total</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => saveOrder(false)}
              disabled={loading || order.length === 0}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold transition disabled:opacity-50"
            >
              <Save size={18} /> Save
            </button>
            <button
              onClick={() => saveOrder(true)}
              disabled={loading || order.length === 0}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-900 font-bold transition disabled:opacity-50"
            >
              <Printer size={18} /> Print
            </button>
          </div>
        </div>
      </div>

      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
