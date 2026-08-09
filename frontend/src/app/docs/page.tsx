'use client';

import { useState } from 'react';
import { ApiClient } from '@/lib/api';

export default function DocsPage() {
  const [apiKey, setApiKey] = useState('');
  const [chargeAmount, setChargeAmount] = useState(500000);
  const [chargeEmail, setChargeEmail] = useState('customer@example.com');
  const [chargeRef, setChargeRef] = useState('REF_' + Math.floor(Math.random() * 1000000));
  
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testChargeApi = async () => {
    if (!apiKey) {
      alert('Please enter your Merchant API key');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const data = await ApiClient.initializeCharge(apiKey, {
        amount: Number(chargeAmount),
        email: chargeEmail,
        reference: chargeRef,
      });

      setResponse(data);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-100 mb-2">API Documentation & Runner</h1>
        <p className="text-slate-400 text-sm">Explore endpoints for Paystack subaccount onboarding, charges, and webhooks.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: API Specs */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-3 mb-3">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                POST
              </span>
              <span className="font-mono text-slate-200 text-sm">/v1/merchants/onboard</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Collects business details and settlement bank info, registers a Paystack subaccount, and generates a hashed API key.
            </p>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-3 mb-3">
              <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-400 font-mono text-xs font-bold">
                POST
              </span>
              <span className="font-mono text-slate-200 text-sm">/v1/charge</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Auth: <code className="text-sky-300">Authorization: Bearer &lt;merchant_api_key&gt;</code><br />
              Initializes a Paystack transaction with split subaccount payment and platform fee deduction in Kobo.
            </p>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-3 mb-3">
              <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-400 font-mono text-xs font-bold">
                GET
              </span>
              <span className="font-mono text-slate-200 text-sm">/v1/transactions/verify/:reference</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Verifies transaction status directly from Paystack and updates the local record.
            </p>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-3 mb-3">
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                POST
              </span>
              <span className="font-mono text-slate-200 text-sm">/v1/webhooks/paystack</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Handles Paystack webhooks with mandatory HMAC SHA512 signature validation and database idempotency checks.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive API Playground */}
        <div className="glass p-6 rounded-xl border border-slate-800 h-fit sticky top-24">
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
            <span>🧪 Interactive Charge API Tester</span>
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Merchant API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_test_xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (in Kobo)</label>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer Email</label>
                <input
                  type="email"
                  value={chargeEmail}
                  onChange={(e) => setChargeEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Transaction Reference</label>
              <input
                type="text"
                value={chargeRef}
                onChange={(e) => setChargeRef(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              onClick={testChargeApi}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all text-xs shadow-lg shadow-sky-500/20"
            >
              {loading ? 'Sending Request...' : 'Execute POST /v1/charge'}
            </button>

            {response && (
              <div className="mt-4">
                <span className="block text-xs font-semibold text-slate-400 mb-1">Response Payload</span>
                <pre className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-cyan-300 overflow-x-auto max-h-60 border border-slate-900">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
