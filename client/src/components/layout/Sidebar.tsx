import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  MapPin,
  Building2,
  UploadCloud,
  ShieldCheck,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Zap,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  minRole?: UserRole;
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { user, role, logout, switchDemoRole } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Overview', path: '/overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Market Analysis', path: '/market-analysis', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Geographic EV Adoption', path: '/geographic', icon: <MapPin className="w-4 h-4" /> },
    { name: 'Manufacturers & OEMs', path: '/manufacturers', icon: <Building2 className="w-4 h-4" /> },
    { name: 'Data Management', path: '/data-management', icon: <UploadCloud className="w-4 h-4" /> },
    { name: 'Data Quality & Audit', path: '/data-quality', icon: <ShieldCheck className="w-4 h-4" /> },
    { name: 'Power BI Reports', path: '/power-bi', icon: <PieChart className="w-4 h-4" />, badge: 'BI' },
    { name: 'Forecasting & 2030', path: '/forecasting', icon: <TrendingUp className="w-4 h-4" />, badge: 'AI' },
    { name: 'Reports & Export', path: '/reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { name: 'Administration', path: '/admin', icon: <Settings className="w-4 h-4" />, minRole: 'ADMIN' },
  ];

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'ANALYST':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              EV ANALYTICS <span className="text-xs font-normal text-teal-400">BI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">India & Global Insights</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Platform Modules
          </div>

          {navItems.map((item) => {
            if (item.minRole === 'ADMIN' && role !== 'ADMIN') return null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-800 text-teal-400 border border-teal-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Quick Evaluator Role Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-800 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Demonstration Role Switcher
            </span>
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => switchDemoRole('ADMIN', 'admindravya@ev')}
                  className={`py-1 px-1 rounded font-medium transition-all text-center ${
                    role === 'ADMIN' && user?.email === 'admindravya@ev'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-400/90 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Switch to Dravya Jain (admindravya@ev)"
                >
                  Dravya (Admin)
                </button>
                <button
                  onClick={() => switchDemoRole('ADMIN', 'adminkaran@ev')}
                  className={`py-1 px-1 rounded font-medium transition-all text-center ${
                    role === 'ADMIN' && user?.email === 'adminkaran@ev'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-400/90 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Switch to Karan Raikwar (adminkaran@ev)"
                >
                  Karan (Admin)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => switchDemoRole('ANALYST')}
                  className={`py-1 rounded font-medium transition-all ${
                    role === 'ANALYST'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Analyst
                </button>
                <button
                  onClick={() => switchDemoRole('VIEWER')}
                  className={`py-1 rounded font-medium transition-all ${
                    role === 'VIEWER'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Viewer
                </button>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 leading-tight">
              Switch roles to evaluate RBAC permission controls.
            </p>
          </div>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-teal-300 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.fullName || 'Active Session'}
                </p>
                <span
                  className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                    role
                  )}`}
                >
                  {role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout session"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
