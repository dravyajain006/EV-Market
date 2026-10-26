import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Badge } from '../components/common/Badge';

export const AdminPage: React.FC = () => {
  const { role, switchDemoRole } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes]: any = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
      ]);

      if (usersRes.success) setUsers(usersRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'ADMIN') {
      fetchAdminData();
    }
  }, [role]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res: any = await api.patch(`/admin/users/${userId}`, { role: newRole });
      if (res.success) {
        setSuccessMsg(`User role updated to ${newRole}`);
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res: any = await api.patch(`/admin/users/${userId}`, { isActive: !currentStatus });
      if (res.success) {
        setSuccessMsg(`User account ${!currentStatus ? 'activated' : 'deactivated'}`);
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to change account status');
    }
  };

  // If not admin, render access guard with instant demo switcher
  if (role !== 'ADMIN') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 shadow-card space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Administrator Authorization Required</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          You are currently signed in as <strong>{role}</strong>. User management and security audit trail logs are restricted to the <strong>ADMIN</strong> role under university project RBAC requirements.
        </p>
        <button
          onClick={() => switchDemoRole('ADMIN')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Shield className="w-4 h-4" />
          Switch to Administrator Role (Demonstration)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health / Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Backend Server</span>
            <h4 className="text-sm font-bold text-slate-900">Node.js Express (REST v1)</h4>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Healthy &bull; Port 5000
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex items-center gap-3">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Database ORM</span>
            <h4 className="text-sm font-bold text-slate-900">Prisma (16 Relational Tables)</h4>
            <span className="text-[10px] text-teal-600 font-semibold">PostgreSQL / SQLite Dual Mode</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Users & Roles</span>
            <h4 className="text-sm font-bold text-slate-900">{users.length} Registered Accounts</h4>
            <span className="text-[10px] text-purple-600 font-semibold">RBAC Session Enforced</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* User Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            User Account Management & Role Assignment
          </h3>
          <p className="text-xs text-slate-500">
            Manage privileges for Administrator, Senior Analyst, and External Viewer roles
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Full Name / Email</th>
                <th className="py-2.5 px-4 font-semibold">Department</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Role</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{u.fullName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.department || 'General Mobility'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded font-semibold bg-white cursor-pointer"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="ANALYST">ANALYST</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={u.isActive ? 'success' : 'danger'} size="sm">
                      {u.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      disabled={['admindravya@ev', 'adminkaran@ev', 'admin@evmarket.internal'].includes(u.email)}
                      title={['admindravya@ev', 'adminkaran@ev', 'admin@evmarket.internal'].includes(u.email) ? 'Primary admin cannot be suspended' : undefined}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                        ['admindravya@ev', 'adminkaran@ev', 'admin@evmarket.internal'].includes(u.email)
                          ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                          : u.isActive
                          ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Trail Logs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Security & Ingestion Audit Trail
          </h3>
          <p className="text-xs text-slate-500">
            Real-time audit records tracking authentication events, CSV ingestion actions, and privilege modifications
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-700 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">User</th>
                <th className="py-2.5 px-4 font-semibold">Action</th>
                <th className="py-2.5 px-4 font-semibold">Entity</th>
                <th className="py-2.5 px-4 font-semibold">Action Details</th>
                <th className="py-2.5 px-4 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 font-mono">
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    {log.user ? `${log.user.fullName} (${log.user.role})` : 'System Daemon'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{log.entity}</td>
                  <td className="py-2.5 px-4 text-slate-800 font-sans max-w-sm truncate">
                    {log.details || '—'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
