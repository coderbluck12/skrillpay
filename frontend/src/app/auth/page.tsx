'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regName, setRegName] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [showRegPassword, setShowRegPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    const result = await login(loginEmail.trim(), loginPassword);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setLoginError(result.error || 'Login failed');
    }
    setLoginLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters');
      return;
    }
    setRegLoading(true);
    setRegError(null);
    const result = await register(regEmail.trim(), regPassword, regName.trim());
    if (result.success) {
      router.push('/dashboard');
    } else {
      setRegError(result.error || 'Registration failed');
    }
    setRegLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-sky-500/20 mx-auto mb-5">
            S
          </div>
          <h1 className="text-2xl font-bold text-white">
            {activeTab === 'login' ? 'Sign in to Skrillpay' : 'Create your account'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === 'login'
              ? 'Enter your credentials to access your dashboard'
              : 'Register your business. KYC can be completed after login.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-900/60 border border-slate-800 p-1 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'login' ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'register' ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <div className="glass rounded-2xl border border-slate-800/60 p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email" required value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="merchant@business.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm pr-12"
                  />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></svg>
                  {loginError}
                </div>
              )}

              <button type="submit" disabled={loginLoading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {loginLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-xs text-slate-500 mt-6">
              No account?{' '}
              <button onClick={() => setActiveTab('register')} className="text-sky-400 hover:text-sky-300 font-medium">
                Register your business
              </button>
            </p>
          </div>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <div className="glass rounded-2xl border border-slate-800/60 p-8">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Business Name
                </label>
                <input
                  type="text" required value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="TechMart Ltd"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email" required value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="finance@techmart.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm pr-12"
                  />
                  <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
                    {showRegPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <input
                  type="password" required value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-slate-100 placeholder-slate-600 text-sm ${
                    regConfirm && regConfirm !== regPassword ? 'border-red-500/50' : 'border-slate-800'
                  }`}
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs text-sky-400">
                ℹ️ After registration, you'll complete your business KYC from the dashboard. No payment details needed yet.
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></svg>
                  {regError}
                </div>
              )}

              <button type="submit" disabled={regLoading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50">
                {regLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-xs text-slate-500 mt-6">
              Already have an account?{' '}
              <button onClick={() => setActiveTab('login')} className="text-sky-400 hover:text-sky-300 font-medium">
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
