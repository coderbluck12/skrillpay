'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import KycWizard from '@/components/KycWizard';

export default function DashboardPage() {
  const { isAuthenticated, isLoading, merchant, refreshProfile } = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Route guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load dashboard data when merchant is active
  useEffect(() => {
    if (merchant?.kyc_status === 'active' && apiKey) {
      loadDashboardData(apiKey);
    }
  }, [merchant?.kyc_status, apiKey]);

  const loadDashboardData = async (key: string) => {
    setDataLoading(true);
    setError(null);
    try {
      const [balData, txData] = await Promise.all([
        ApiClient.getMerchantBalance(key),
        ApiClient.getMerchantTransactions(key),
      ]);
      if (balData.status) setBalance(balData.data);
      if (txData.status) setTransactions(txData.data?.transactions || []);
    } catch {
      setError('Failed to load dashboard data. Check your backend is running.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey) {
      localStorage.setItem('merchant_api_key', apiKey);
      loadDashboardData(apiKey);
      setShowApiKeyInput(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !merchant) return null;

  const kycStatus = merchant.kyc_status;

  // ─── KYC Not Started ───────────────────────────────────────────────────────
  if (kycStatus === 'pending_kyc') {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            KYC Required
          </div>
          <h1 className="text-2xl font-bold text-white">Complete Your Business Verification</h1>
          <p className="text-slate-400 text-sm mt-1">
            Your account needs KYC verification before you can start accepting payments. This takes less than 5 minutes.
          </p>
        </div>
        <KycWizard onComplete={refreshProfile} />
      </div>
    );
  }

  // ─── KYC Submitted — Under Review ──────────────────────────────────────────
  if (kycStatus === 'kyc_submitted') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 border border-sky-500/20 flex items-center justify-center text-4xl mx-auto mb-6 float-animation">
            🔍
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">KYC Under Review</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            We've received your business verification details. Our team is reviewing your submission and you'll be notified within <strong className="text-white">24 hours</strong> once your account is activated.
          </p>
          <div className="glass rounded-2xl border border-slate-800/60 p-6 text-left space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">What happens next?</p>
            {[
              { step: '1', text: 'Our team verifies your bank account and identity details' },
              { step: '2', text: 'A Paystack subaccount is created in your name' },
              { step: '3', text: 'Your unique API key is generated and shared with you' },
              { step: '4', text: 'You\'re ready to accept payments via the Skrillpay API' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-bold shrink-0 mt-0.5">
                  {item.step}
                </div>
                <p className="text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => refreshProfile()}
            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  // ─── Active — Full Dashboard ────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back, {merchant.business_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </div>
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all"
          >
            {apiKey ? 'Change API Key' : 'Enter API Key'}
          </button>
          {apiKey && (
            <button
              onClick={() => loadDashboardData(apiKey)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* API Key Input */}
      {showApiKeyInput && (
        <div className="glass rounded-2xl border border-slate-800/60 p-6 mb-6">
          <p className="text-sm text-slate-300 mb-3 font-medium">Enter your Skrillpay API key to load your dashboard data:</p>
          <form onSubmit={handleApiKeySubmit} className="flex gap-3">
            <input
              type="text" value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_live_xxxxxxxxxxxxxxxx"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm font-mono placeholder-slate-600"
            />
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all">
              Load
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-2">Your API key was shared with you when your KYC was approved.</p>
        </div>
      )}

      {!apiKey && !showApiKeyInput && (
        <div className="glass rounded-2xl border border-amber-500/20 p-6 mb-8 flex items-center gap-4">
          <div className="text-2xl">🔑</div>
          <div>
            <p className="font-medium text-white text-sm">Enter your API key to view your dashboard metrics</p>
            <p className="text-slate-400 text-xs mt-0.5">Your API key was sent when your KYC was approved by our team.</p>
          </div>
          <button onClick={() => setShowApiKeyInput(true)} className="ml-auto px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition-all">
            Enter Key
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Volume', value: `₦${Number(balance?.balance?.total_volume || 0).toLocaleString()}`, sub: 'Gross processed', color: 'white' },
          { label: 'Merchant Earnings', value: `₦${Number(balance?.balance?.merchant_earned || 0).toLocaleString()}`, sub: 'Net settled', color: 'emerald' },
          { label: 'Platform Fees', value: `₦${Number(balance?.balance?.platform_fees || 0).toLocaleString()}`, sub: 'Auto-collected', color: 'sky' },
          { label: 'Transactions', value: String(transactions.length), sub: `${balance?.counts?.successful ?? 0} success`, color: 'indigo' },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl border border-slate-800/60 p-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{card.label}</p>
            {dataLoading ? (
              <div className="h-8 w-24 rounded-lg shimmer mb-2" />
            ) : (
              <div className={`text-2xl font-black mb-1 ${
                card.color === 'emerald' ? 'text-emerald-400' :
                card.color === 'sky' ? 'text-sky-400' :
                card.color === 'indigo' ? 'text-indigo-400' : 'text-white'
              }`}>{card.value}</div>
            )}
            <p className="text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Integration Settings Card */}
      <div className="glass rounded-2xl border border-slate-800/60 p-6 mb-6">
        <h3 className="font-bold text-white mb-4">Integration Settings</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Webhook URL</p>
            <p className="font-mono text-slate-300 text-xs truncate">{merchant.webhook_url || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Callback URL</p>
            <p className="font-mono text-slate-300 text-xs truncate">{merchant.callback_url || '—'}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/60 flex justify-between items-center">
          <h2 className="font-bold text-white">Recent Transactions</h2>
          <span className="text-xs text-slate-500">{transactions.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['Reference', 'Customer', 'Amount', 'Platform Fee', 'Merchant Net', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/40">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded shimmer" style={{ width: `${60 + (j * 10) % 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !apiKey ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500 text-sm">
                    Enter your API key above to view transactions
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="text-3xl mb-3">📭</div>
                    <p className="text-slate-500 text-sm">No transactions yet. Use the charge API to start accepting payments.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-sky-400">{tx.reference}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{tx.customer_email}</td>
                    <td className="px-6 py-4 font-semibold text-white">₦{(Number(tx.amount) / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sky-400">₦{(Number(tx.platform_fee) / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 text-emerald-400">₦{(Number(tx.merchant_amount) / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        tx.status === 'success' ? 'badge-success' : tx.status === 'pending' ? 'badge-pending' : 'badge-failed'
                      }`}>{tx.status}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(tx.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
