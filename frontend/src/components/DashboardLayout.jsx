import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { Flame, Utensils, Tags, LayoutGrid, BarChart3, Settings, LogOut, Menu } from 'lucide-react';

const nav = [
  { to: '/', label: 'Order', icon: Utensils },
  { to: '/tables', label: 'Tables', icon: LayoutGrid },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static z-20 w-64 h-full bg-slate-950 border-r border-slate-800 flex flex-col transition-transform`}>
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-brand-500 rounded-lg text-slate-900">
            <Flame size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">AL GHANI</h1>
            <p className="text-xs text-slate-400">POS</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-brand-500 text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 mb-2">Logged in as</div>
          <div className="font-medium truncate">{user?.full_name || user?.username}</div>
          <div className="text-xs text-slate-500 capitalize mb-3">{user?.role}</div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-600 transition text-sm font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-500 rounded-lg text-slate-900">
            <Flame size={20} />
          </div>
          <span className="font-bold">AL GHANI POS</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg bg-slate-800">
          <Menu size={20} />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto lg:overflow-hidden pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
