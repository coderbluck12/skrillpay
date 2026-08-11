'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import KycWizard from '@/components/KycWizard';
import { Link as LinkIcon, Key, ArrowClockwise, Sparkle } from '@phosphor-icons/react';

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

  // Payment Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkAmountNaira, setLinkAmountNaira] = useState(5000);
  const [linkCustomerEmail, setLinkCustomerEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState<{ checkoutUrl: string; receiptUrl: string; reference: string } | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeKey = apiKey || merchant?.api_key || localStorage.getItem('merchant_api_key') || '';

    if (!activeKey) {
      alert('Please copy or enter your Secret API key first to generate payment links');
      setShowApiKeyInput(true);
      return;
    }

    setLinkLoading(true);
    setError(null);
    try {
      const ref = `LINK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const amountInKobo = Math.round(Number(linkAmountNaira) * 100);
      const result = await ApiClient.initializeCharge(activeKey, {
        amount: amountInKobo,
        email: linkCustomerEmail || 'customer@skrillpay.com',
        reference: ref,
      });

      if (result.status && result.data) {
        setGeneratedLink({
          checkoutUrl: result.data.checkout_url || result.data.authorization_url,
          receiptUrl: result.data.receipt_url,
          reference: ref,
        });
      } else {
        throw new Error(result.message || 'Failed to generate payment link');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating link');
    } finally {
      setLinkLoading(false);
    }
  };

  // Route guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load dashboard data when merchant is active
  useEffect(() => {
    if (merchant?.kyc_status === 'active') {
      const activeKey = merchant.api_key || localStorage.getItem('merchant_api_key') || apiKey || '';
      if (activeKey) {
        setApiKey(activeKey);
        localStorage.setItem('merchant_api_key', activeKey);
        loadDashboardData(activeKey);
      }
    }
  }, [merchant?.kyc_status, merchant?.api_key]);

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
              { step: '1', text: 'Our system verifies your BVN / NIN via Korapay Identity API' },
              { step: '2', text: 'A Korapay subaccount is generated for automated split settlements' },
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
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <LinkIcon size={18} weight="bold" /> Create Payment Link
          </button>
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

      {/* API Key Banner Card */}
      {merchant.api_key && (
        <div className="glass rounded-2xl border border-sky-500/30 p-5 mb-8 bg-sky-500/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                <Key size={18} weight="duotone" /> Your Secret API Key
              </div>
              <p className="text-xs text-slate-400">
                Use this API key to authenticate all request calls to <code>/v1/charge</code> and <code>/v1/transactions/verify</code>.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text" readOnly value={merchant.api_key}
                className="flex-1 md:w-80 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-sky-300 select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(merchant.api_key || '');
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shrink-0"
              >
                {copiedKey ? '✓ Copied' : 'Copy Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Payment Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="glass w-full max-w-md rounded-2xl border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">🔗 Create Quick Payment Link</h3>
              <button onClick={() => { setShowLinkModal(false); setGeneratedLink(null); }} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleCreatePaymentLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Amount (in Naira ₦)</label>
                  <input
                    type="number" required min="100" value={linkAmountNaira}
                    onChange={(e) => setLinkAmountNaira(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Formatted: ₦{Number(linkAmountNaira).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer Email (optional)</label>
                  <input
                    type="email" value={linkCustomerEmail}
                    onChange={(e) => setLinkCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm"
                  />
                </div>
                <button
                  type="submit" disabled={linkLoading}
                  className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all disabled:opacity-50"
                >
                  {linkLoading ? 'Generating Link...' : 'Generate Shareable Link'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-3xl block mb-2">🎉</span>
                  <p className="font-bold text-emerald-400 text-sm">Payment Link Ready!</p>
                  <p className="text-xs text-slate-400 mt-1">Share this link directly with your customer to collect payment.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Checkout URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text" readOnly value={generatedLink.checkoutUrl}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-sky-400 truncate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink.checkoutUrl);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                    >
                      {linkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <a
                    href={generatedLink.checkoutUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all"
                  >
                    Open Link ↗
                  </a>
                  <button
                    onClick={() => setGeneratedLink(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Key Input */}
      {showApiKeyInput && (
        <div className="glass rounded-2xl border border-slate-800/60 p-6 mb-6">
          <p className="text-sm text-slate-300 mb-3 font-medium">Enter your Skrillpay API key to load your dashboard data:</p>
          <form onSubmit={handleApiKeySubmit} className="flex gap-3">
            <input
              type="text" value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_key_xxxxxxxxxxxxxxxx"
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-white text-lg">Integration Settings</h3>
            <p className="text-xs text-slate-400">Configure where payment notifications (webhooks) and user redirects (callback) are sent.</p>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const webhookUrl = (form.elements.namedItem('webhook_url') as HTMLInputElement).value;
            const callbackUrl = (form.elements.namedItem('callback_url') as HTMLInputElement).value;
            try {
              const res = await ApiClient.updateWebhookSettings({ webhook_url: webhookUrl, callback_url: callbackUrl });
              if (res.status) {
                alert('Integration settings updated successfully');
                refreshProfile();
              } else {
                alert(res.message || 'Failed to update settings');
              }
            } catch (err: any) {
              alert(err.message || 'Error updating settings');
            }
          }}
          className="space-y-4 text-sm"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Webhook URL</label>
              <input
                type="url" name="webhook_url"
                defaultValue={merchant.webhook_url || ''}
                placeholder="https://yourdomain.com/api/webhooks/skrillpay"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 placeholder-slate-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">We send transaction event payloads to this URL.</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Default Callback URL</label>
              <input
                type="url" name="callback_url"
                defaultValue={merchant.callback_url || ''}
                placeholder="https://yourdomain.com/payment/complete"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 placeholder-slate-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">Redirect customers here after payment completion.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-sky-500/20"
            >
              Save Integration Settings
            </button>
          </div>
        </form>
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
