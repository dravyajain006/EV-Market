import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/overview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole, specificEmail?: string) => {
    setLoading(true);
    try {
      await switchDemoRole(role, specificEmail);
      navigate('/overview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-500/30">
          <Zap className="w-7 h-7 fill-white" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-white tracking-tight">
          EV Market Analysis & BI Platform
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Academic Capstone Final-Year Project Demonstration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/90 border border-slate-700/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admindravya@ev or adminkaran@ev"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Analytics'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Project Evaluators */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-3">
              One-Click Evaluator Sign-In
            </span>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN', 'admindravya@ev')}
                className="py-2 px-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all text-center flex flex-col items-center"
              >
                <span>Dravya Jain</span>
                <span className="text-[9px] text-amber-400/80 font-normal">ADMIN (admindravya@ev)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN', 'adminkaran@ev')}
                className="py-2 px-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all text-center flex flex-col items-center"
              >
                <span>Karan Raikwar</span>
                <span className="text-[9px] text-amber-400/80 font-normal">ADMIN (adminkaran@ev)</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('ANALYST')}
                className="py-1.5 px-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-[11px] font-bold transition-all text-center"
              >
                ANALYST
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('VIEWER')}
                className="py-1.5 px-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 border border-slate-600 text-[11px] font-bold transition-all text-center"
              >
                VIEWER
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Bypasses manual typing for fast college evaluation and viva presentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
