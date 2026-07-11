import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';

export default function Receipt({ order, onClose }) {
  const [el, setEl] = useState(null);

  useEffect(() => {
    const div = document.createElement('div');
    div.id = 'receipt-print';
    document.body.appendChild(div);
    setEl(div);
    return () => {
      document.body.removeChild(div);
    };
  }, []);

  const items = useMemo(() => {
    return order.order_items.map((it) => ({
      name: it.menu_item?.name || it.deal?.name || 'Unknown',
      qty: it.quantity,
      price: Number(it.total_price),
      isDeal: !!it.deal_id,
      dealItems: it.deal?.deal_items,
    }));
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  const content = (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h3 className="font-bold">Receipt Preview</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 text-sm">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg">{order.restaurant_name || 'AL GHANI BBQ & FAST FOOD'}</h2>
            <p className="text-slate-500">Receipt #{order.id}</p>
            <p className="text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
          </div>

          <div className="border-t border-dashed border-slate-300 py-3 space-y-2">
            {items.map((it, idx) => (
              <div key={idx}>
                <div className="flex justify-between font-medium">
                  <span>
                    {it.qty}x {it.name}
                  </span>
                  <span>Rs. {it.price.toFixed(2)}</span>
                </div>
                {it.isDeal && it.dealItems && (
                  <div className="text-xs text-slate-500 pl-4">
                    {it.dealItems.map((di) => `${di.quantity}x ${di.menu_item.name}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 py-3 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>Rs. {Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span>Rs. {Number(order.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span>Rs. {Number(order.discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-dashed border-slate-300">
              <span>Total</span>
              <span>Rs. {Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-slate-500 mt-4 text-xs">
            Thank you for dining with us!
          </div>
        </div>
      </div>
    </div>
  );

  if (!el) return null;
  return createPortal(content, el);
}
