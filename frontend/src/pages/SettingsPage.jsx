import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { Save, Trash2, Plus, Download, RefreshCw, Settings, Tag, Utensils, Package, Users, X, Check } from 'lucide-react';

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'menu', label: 'Menu', icon: Utensils },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'deals', label: 'Deals', icon: Package },
  { id: 'users', label: 'Users', icon: Users },
];

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/settings').then((r) => setSettings(r.data.values));
    api.get('/categories').then((r) => setCategories(r.data));
    api.get('/menu-items').then((r) => setMenuItems(r.data));
    api.get('/deals').then((r) => setDeals(r.data));
    if (isAdmin) api.get('/users').then((r) => setUsers(r.data));
  }, [isAdmin]);

  const saveSettings = async () => {
    await api.put('/settings', settings);
    setMessage('Settings saved');
    setTimeout(() => setMessage(''), 2000);
  };

  const backup = () => {
    window.open('/api/settings/backup', '_blank');
  };

  const show = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="h-full p-6 bg-slate-900 text-white">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-slate-400 mt-2">Only admins can access settings.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <div className="p-4 lg:p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold">Settings</h2>
        {message && <div className="mt-3 p-3 rounded-lg bg-green-500/20 text-green-300 text-sm inline-block">{message}</div>}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-16 lg:w-56 border-r border-slate-800 flex flex-col p-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-brand-500 text-slate-900' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'general' && (
            <GeneralSettings settings={settings} setSettings={setSettings} onSave={saveSettings} onBackup={backup} />
          )}
          {activeTab === 'menu' && <MenuManager items={menuItems} setItems={setMenuItems} categories={categories} show={show} />}
          {activeTab === 'categories' && <CategoryManager categories={categories} setCategories={setCategories} show={show} />}
          {activeTab === 'deals' && <DealManager deals={deals} setDeals={setDeals} items={menuItems} show={show} />}
          {activeTab === 'users' && <UserManager users={users} setUsers={setUsers} show={show} />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({ settings, setSettings, onSave, onBackup }) {
  const update = (key, value) => setSettings({ ...settings, [key]: value });
  return (
    <div className="max-w-2xl space-y-4">
      <h3 className="font-bold text-lg">Restaurant Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Restaurant Name" value={settings.restaurant_name || ''} onChange={(v) => update('restaurant_name', v)} />
        <Input label="Address" value={settings.restaurant_address || ''} onChange={(v) => update('restaurant_address', v)} />
        <Input label="Phone" value={settings.restaurant_phone || ''} onChange={(v) => update('restaurant_phone', v)} />
        <Input label="Currency" value={settings.currency || 'Rs.'} onChange={(v) => update('currency', v)} />
        <Input label="Tax Rate (%)" value={settings.tax_rate || '0'} onChange={(v) => update('tax_rate', v)} type="number" />
        <Input label="Default Discount (%)" value={settings.default_discount || '0'} onChange={(v) => update('default_discount', v)} type="number" />
        <Input label="Printer Name" value={settings.printer_name || ''} onChange={(v) => update('printer_name', v)} />
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onSave} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-900 font-bold">
          <Save size={18} /> Save Settings
        </button>
        <button onClick={onBackup} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium">
          <Download size={18} /> Backup Database
        </button>
      </div>
    </div>
  );
}

function MenuManager({ items, setItems, categories, show }) {
  const [edit, setEdit] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get('name'),
      price: Number(fd.get('price')),
      category_id: Number(fd.get('category_id')),
      is_active: fd.get('is_active') === 'on',
    };
    if (edit.id) {
      await api.put(`/menu-items/${edit.id}`, payload);
      setItems(items.map((i) => (i.id === edit.id ? { ...i, ...payload } : i)));
    } else {
      const res = await api.post('/menu-items', payload);
      setItems([...items, res.data]);
    }
    setEdit(null);
    show('Menu item saved');
  };

  const remove = async (id) => {
    await api.delete(`/menu-items/${id}`);
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Menu Items</h3>
        <button onClick={() => setEdit({})} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-900 text-sm font-bold">
          <Plus size={16} /> Add Item
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800 text-slate-400">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Category</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                <td className="p-3">{i.name}</td>
                <td className="p-3">Rs. {Number(i.price).toFixed(2)}</td>
                <td className="p-3">{i.category?.name}</td>
                <td className="p-3">{i.is_active ? 'Yes' : 'No'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => setEdit(i)} className="text-brand-500 hover:underline">Edit</button>
                  <button onClick={() => remove(i.id)} className="text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit !== null && (
        <Modal onClose={() => setEdit(null)} title={edit.id ? 'Edit Item' : 'Add Item'}>
          <form onSubmit={save} className="space-y-4">
            <Input label="Name" name="name" defaultValue={edit.name || ''} required />
            <Input label="Price" name="price" type="number" defaultValue={edit.price || ''} required />
            <Select label="Category" name="category_id" defaultValue={edit.category_id || ''} options={categories.map((c) => ({ value: c.id, label: `${c.section} - ${c.name}` }))} required />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={edit.is_active !== false} className="w-4 h-4" /> Active
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg bg-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-brand-500 text-slate-900 font-bold">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CategoryManager({ categories, setCategories, show }) {
  const [edit, setEdit] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { name: fd.get('name'), section: fd.get('section'), sort_order: Number(fd.get('sort_order') || 0) };
    if (edit.id) {
      await api.put(`/categories/${edit.id}`, payload);
      setCategories(categories.map((c) => (c.id === edit.id ? { ...c, ...payload } : c)));
    } else {
      const res = await api.post('/categories', payload);
      setCategories([...categories, res.data]);
    }
    setEdit(null);
    show('Category saved');
  };

  const remove = async (id) => {
    await api.delete(`/categories/${id}`);
    setCategories(categories.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Categories</h3>
        <button onClick={() => setEdit({})} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-900 text-sm font-bold">
          <Plus size={16} /> Add Category
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800 text-slate-400">
            <tr><th className="p-3">Name</th><th className="p-3">Section</th><th className="p-3">Order</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.section}</td>
                <td className="p-3">{c.sort_order}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => setEdit(c)} className="text-brand-500 hover:underline">Edit</button>
                  <button onClick={() => remove(c.id)} className="text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit !== null && (
        <Modal onClose={() => setEdit(null)} title={edit.id ? 'Edit Category' : 'Add Category'}>
          <form onSubmit={save} className="space-y-4">
            <Input label="Name" name="name" defaultValue={edit.name || ''} required />
            <Select label="Section" name="section" defaultValue={edit.section || 'BBQ'} options={[{value:'BBQ',label:'BBQ'},{value:'Fast Food',label:'Fast Food'}]} required />
            <Input label="Sort Order" name="sort_order" type="number" defaultValue={edit.sort_order || 0} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg bg-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-brand-500 text-slate-900 font-bold">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function DealManager({ deals, setDeals, items, show }) {
  const [edit, setEdit] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const dealItems = [];
    items.forEach((it) => {
      const qty = fd.get(`qty-${it.id}`);
      if (qty && Number(qty) > 0) {
        dealItems.push({ menu_item_id: it.id, quantity: Number(qty) });
      }
    });
    const payload = {
      name: fd.get('name'),
      price: Number(fd.get('price')),
      description: fd.get('description'),
      items: dealItems,
    };
    if (edit.id) {
      await api.put(`/deals/${edit.id}`, payload);
      const res = await api.get(`/deals/${edit.id}`);
      setDeals(deals.map((d) => (d.id === edit.id ? res.data : d)));
    } else {
      const res = await api.post('/deals', payload);
      setDeals([...deals, res.data]);
    }
    setEdit(null);
    show('Deal saved');
  };

  const remove = async (id) => {
    await api.delete(`/deals/${id}`);
    setDeals(deals.filter((d) => d.id !== id));
  };

  const openEdit = (deal) => {
    const selected = {};
    deal.deal_items.forEach((di) => { selected[di.menu_item_id] = di.quantity; });
    setEdit({ ...deal, selected });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Deals</h3>
        <button onClick={() => setEdit({ selected: {} })} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-900 text-sm font-bold">
          <Plus size={16} /> Add Deal
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deals.map((d) => (
          <div key={d.id} className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold">{d.name}</h4>
              <span className="text-brand-500 font-bold">Rs. {Number(d.price).toFixed(0)}</span>
            </div>
            <ul className="text-sm text-slate-400 mb-3">
              {d.deal_items.map((di) => <li key={di.id}>{di.quantity}x {di.menu_item.name}</li>)}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => openEdit(d)} className="text-brand-500 hover:underline text-sm">Edit</button>
              <button onClick={() => remove(d.id)} className="text-red-400 hover:underline text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {edit !== null && (
        <Modal onClose={() => setEdit(null)} title={edit.id ? 'Edit Deal' : 'Add Deal'}>
          <form onSubmit={save} className="space-y-4">
            <Input label="Name" name="name" defaultValue={edit.name || ''} required />
            <Input label="Price" name="price" type="number" defaultValue={edit.price || ''} required />
            <Input label="Description" name="description" defaultValue={edit.description || ''} />
            <div className="max-h-60 overflow-y-auto border border-slate-700 rounded-lg p-2">
              <div className="text-sm font-bold mb-2">Included Items</div>
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-300">{it.name}</span>
                  <input
                    type="number"
                    name={`qty-${it.id}`}
                    defaultValue={edit.selected?.[it.id] || 0}
                    min={0}
                    className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg bg-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-brand-500 text-slate-900 font-bold">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function UserManager({ users, setUsers, show }) {
  const [edit, setEdit] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      username: fd.get('username'),
      full_name: fd.get('full_name'),
      role: fd.get('role'),
      password: fd.get('password') || undefined,
    };
    if (edit.id) {
      await api.patch(`/users/${edit.id}`, payload);
      setUsers(users.map((u) => (u.id === edit.id ? { ...u, ...payload } : u)));
    } else {
      const res = await api.post('/users', payload);
      setUsers([...users, res.data]);
    }
    setEdit(null);
    show('User saved');
  };

  const remove = async (id) => {
    await api.delete(`/users/${id}`);
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Users</h3>
        <button onClick={() => setEdit({})} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-900 text-sm font-bold">
          <Plus size={16} /> Add User
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800 text-slate-400">
            <tr><th className="p-3">Username</th><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.full_name}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => setEdit(u)} className="text-brand-500 hover:underline">Edit</button>
                  <button onClick={() => remove(u.id)} className="text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit !== null && (
        <Modal onClose={() => setEdit(null)} title={edit.id ? 'Edit User' : 'Add User'}>
          <form onSubmit={save} className="space-y-4">
            <Input label="Username" name="username" defaultValue={edit.username || ''} required />
            <Input label="Full Name" name="full_name" defaultValue={edit.full_name || ''} />
            <Select label="Role" name="role" defaultValue={edit.role || 'cashier'} options={[{value:'admin',label:'Admin'},{value:'manager',label:'Manager'},{value:'cashier',label:'Cashier'}]} required />
            <Input label={edit.id ? 'New Password (optional)' : 'Password'} name="password" type="password" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg bg-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-brand-500 text-slate-900 font-bold">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Input({ label, name, defaultValue, value, type = 'text', required, onChange }) {
  const isControlled = value !== undefined;
  const [inner, setInner] = React.useState(value !== undefined ? value : defaultValue);
  React.useEffect(() => {
    if (isControlled) setInner(value);
  }, [value, isControlled]);
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={inner}
        required={required}
        onChange={(e) => {
          setInner(e.target.value);
          if (onChange) onChange(e.target.value);
        }}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
      />
    </div>
  );
}

function Select({ label, name, defaultValue, options, required }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <select name={name} defaultValue={defaultValue} required={required} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-slate-700"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
