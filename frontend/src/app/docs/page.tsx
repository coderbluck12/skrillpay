'use client';

import { useState } from 'react';
import { ApiClient } from '@/lib/api';
import {
  RocketLaunch,
  CreditCard,
  CheckCircle,
  Receipt,
  Broadcast,
  WarningOctagon,
  Flask,
  Key,
} from '@phosphor-icons/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

// ─── Types ──────────────────────────────────────────────────────────────────
type Section =
  | 'getting-started'
  | 'auth'
  | 'kyc'
  | 'charge'
  | 'verify'
  | 'receipt'
  | 'webhooks'
  | 'errors'
  | 'playground';

// ─── Code block component ───────────────────────────────────────────────────
function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group mt-3">
      <pre className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-700"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

// ─── Method badge ───────────────────────────────────────────────────────────
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    POST: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    PUT: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    DELETE: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold font-mono border ${colors[method] || 'bg-slate-700 text-slate-300'}`}>
      {method}
    </span>
  );
}

// ─── Parameter table ────────────────────────────────────────────────────────
function ParamTable({ params }: { params: { name: string; type: string; required: boolean; desc: string }[] }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-2 pr-4 text-slate-500 font-semibold uppercase tracking-wider">Parameter</th>
            <th className="text-left py-2 pr-4 text-slate-500 font-semibold uppercase tracking-wider">Type</th>
            <th className="text-left py-2 pr-4 text-slate-500 font-semibold uppercase tracking-wider">Required</th>
            <th className="text-left py-2 text-slate-500 font-semibold uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-slate-800/50">
              <td className="py-2.5 pr-4 font-mono text-sky-400">{p.name}</td>
              <td className="py-2.5 pr-4 text-slate-400">{p.type}</td>
              <td className="py-2.5 pr-4">
                {p.required
                  ? <span className="text-red-400 font-semibold">Yes</span>
                  : <span className="text-slate-500">No</span>}
              </td>
              <td className="py-2.5 text-slate-400 leading-relaxed">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Endpoint card ──────────────────────────────────────────────────────────
function EndpointCard({
  method, path, description, auth, params, requestBody, responseBody, notes,
}: {
  method: string;
  path: string;
  description: string;
  auth?: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  requestBody?: string;
  responseBody?: string;
  notes?: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden mb-4">
      <button
        className="w-full flex items-center gap-3 p-5 hover:bg-slate-800/20 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-slate-200 flex-1">{path}</code>
        <span className="text-xs text-slate-500 hidden md:block truncate max-w-xs">{description}</span>
        <svg
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-800/60 px-5 pb-6 pt-4 space-y-5">
          <p className="text-sm text-slate-300 leading-relaxed">{description}</p>

          {auth && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2">
              <span>🔑</span>
              <span><strong>Authentication:</strong> {auth}</span>
            </div>
          )}

          {notes && notes.length > 0 && (
            <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs text-sky-400 space-y-1">
              {notes.map((n, i) => <p key={i}>ℹ️ {n}</p>)}
            </div>
          )}

          {params && params.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Parameters</p>
              <ParamTable params={params} />
            </div>
          )}

          {requestBody && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Request Body</p>
              <CodeBlock code={requestBody} />
            </div>
          )}

          {responseBody && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Response</p>
              <CodeBlock code={responseBody} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar nav ────────────────────────────────────────────────────────────
const NAV: { id: Section; label: string; IconComponent: any }[] = [
  { id: 'getting-started', label: 'Getting Started', IconComponent: RocketLaunch },
  { id: 'charge', label: 'Accept Payments', IconComponent: CreditCard },
  { id: 'verify', label: 'Verify Transactions', IconComponent: CheckCircle },
  { id: 'receipt', label: 'Receipts', IconComponent: Receipt },
  { id: 'webhooks', label: 'Webhooks', IconComponent: Broadcast },
  { id: 'errors', label: 'Error Reference', IconComponent: WarningOctagon },
  { id: 'playground', label: 'API Playground', IconComponent: Flask },
];

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<Section>('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Playground state
  const [apiKey, setApiKey] = useState('');
  const [chargeAmount, setChargeAmount] = useState(5000);
  const [chargeEmail, setChargeEmail] = useState('customer@example.com');
  const [chargeRef, setChargeRef] = useState('REF_' + Date.now());
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [playgroundAction, setPlaygroundAction] = useState<'charge' | 'verify' | 'receipt'>('charge');
  const [verifyRef, setVerifyRef] = useState('');
  const [receiptRef, setReceiptRef] = useState('');

  const runPlayground = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let data: any;
      if (playgroundAction === 'charge') {
        if (!apiKey) { setResponse({ error: 'API key is required' }); return; }
        data = await ApiClient.initializeCharge(apiKey, {
          amount: chargeAmount,
          email: chargeEmail,
          reference: chargeRef,
        });
      } else if (playgroundAction === 'verify') {
        if (!apiKey) { setResponse({ error: 'API key is required' }); return; }
        const res = await fetch(`${BASE_URL}/transactions/verify/${verifyRef}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        data = await res.json();
      } else if (playgroundAction === 'receipt') {
        const res = await fetch(`${BASE_URL}/receipt/${receiptRef}?format=json`);
        data = await res.json();
      }
      setResponse(data);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (id: Section) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 top-16 left-0 z-40 w-64 glass border-r border-slate-800/60 p-6
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Contents</p>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.IconComponent;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeSection === item.id
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} weight="duotone" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
          <p className="text-xs font-semibold text-indigo-400 mb-1">Base URL</p>
          <code className="text-xs text-slate-300 font-mono break-all">http://localhost:3000/v1</code>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-6 lg:px-10 py-10 max-w-4xl">
        {activeSection === 'getting-started' && (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                <RocketLaunch size={16} weight="duotone" /> Getting Started
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-3">Skrillpay API Reference</h1>
              <p className="text-slate-400 leading-relaxed">
                Skrillpay is a <strong className="text-white">reseller payment gateway</strong> — you integrate once against the Skrillpay API and your customers accept payments through automated subaccounts. Every payment is automatically split between the platform and the merchant, with instant settlement.
              </p>
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6 space-y-4">
              <h2 className="font-bold text-white text-lg">Quick Integration Flow</h2>
              {[
                { step: '1', title: 'Register & Verify Identity', desc: 'Sign up on the Skrillpay web portal and submit your settlement bank details along with BVN/NIN for automated identity verification.' },
                { step: '2', title: 'Get Your API Key', desc: 'Upon activation, your settlement account and secret API Key (sk_live_...) will be issued.' },
                { step: '3', title: 'Accept Payments', desc: 'Call POST /v1/charge with your API Key — redirect customers to checkout_url.' },
                { step: '4', title: 'Verify & Generate Receipts', desc: 'Call GET /v1/transactions/verify/:ref or access /v1/receipt/:ref to issue digital receipts to customers.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-bold shrink-0 mt-0.5">{s.step}</div>
                  <div>
                    <p className="font-semibold text-white text-sm">{s.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h2 className="font-bold text-white mb-3">Base URL & Versioning</h2>
              <CodeBlock code={`# All endpoints are prefixed with /v1\nBASE_URL=http://localhost:3000/v1\n\n# Production (replace with your domain)\nBASE_URL=https://api.skrillpay.com/v1`} lang="bash" />
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h2 className="font-bold text-white mb-3">Authentication</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <Key size={20} weight="duotone" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">API Key (Secret Key)</p>
                    <p className="text-slate-400 text-xs mt-0.5">All developer endpoints (charging, verifying transactions) require your secret API key passed in the <code className="text-sky-400">Authorization</code> header. API keys start with <code className="text-sky-400">sk_live_</code> or <code className="text-sky-400">sk_test_</code>.</p>
                    <CodeBlock code={`Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h2 className="font-bold text-white mb-3">Response Format</h2>
              <p className="text-slate-400 text-sm mb-3">All responses follow a consistent envelope format:</p>
              <CodeBlock code={`// Successful response
{
  "status": true,
  "message": "Operation description",
  "data": { ... }   // Payload (not always present)
}

// Error response
{
  "status": false,
  "message": "Human-readable error description"
}`} />
            </div>
          </div>
        )}

        {/* ── CHARGE ── */}
        {activeSection === 'charge' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                <CreditCard size={16} weight="duotone" /> Accept Payments
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Initialize a Charge</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Use the charge API to create a payment checkout session for your customer. Skrillpay automatically splits the payment between your account and the platform fee using automated settlement accounts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm space-y-2">
              <p className="font-semibold text-emerald-400">How the fee split works</p>
              <p className="text-slate-400 text-xs">When you charge ₦10,000 with a 1.5% platform fee:</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-800">
                  <p className="text-slate-500">Total Charged</p>
                  <p className="text-white font-bold">₦10,000</p>
                </div>
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <p className="text-sky-400">Platform Fee</p>
                  <p className="text-sky-400 font-bold">₦150</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <p className="text-emerald-400">Merchant Receives</p>
                  <p className="text-emerald-400 font-bold">₦9,850</p>
                </div>
              </div>
            </div>

            <EndpointCard
              method="POST" path="/v1/charge"
              description="Initialize a Skrillpay payment transaction. Returns a checkout_url to redirect your customer to your branded payment page. Also returns a receipt_url you can share with the customer after payment."
              auth="API Key required — Authorization: Bearer sk_live_xxxx"
              params={[
                { name: 'amount', type: 'number', required: true, desc: 'Amount in kobo (NGN). e.g. 500000 = ₦5,000. Must be a positive integer.' },
                { name: 'email', type: 'string', required: true, desc: "Customer's email address. Used to identify the payer." },
                { name: 'reference', type: 'string', required: true, desc: 'Your unique transaction reference. Must be unique per transaction. Max 100 chars.' },
                { name: 'callback_url', type: 'string', required: false, desc: 'Override the default callback URL for this transaction only.' },
              ]}
              requestBody={`POST /v1/charge
Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "amount": 500000,
  "email": "customer@gmail.com",
  "reference": "ORDER_20260101_001",
  "callback_url": "https://yourstore.com/payment/success"
}`}
              responseBody={`{
  "status": true,
  "message": "Transaction initialized successfully",
  "data": {
    "checkout_url": "http://localhost:3001/pay/ORDER_20260101_001",
    "access_code": "ORDER_20260101_001",
    "reference": "ORDER_20260101_001",
    "receipt_url": "http://localhost:3000/v1/receipt/ORDER_20260101_001"
  }
}`}
              notes={[
                'Redirect your customer to authorization_url to complete payment.',
                'receipt_url can be emailed to the customer after payment confirmation.',
                'Reference must be globally unique — use order IDs or UUIDs.',
              ]}
            />

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h3 className="font-bold text-white mb-3">Node.js Integration Example</h3>
              <CodeBlock code={`const axios = require('axios');

async function createPayment(orderId, customerEmail, amountNaira) {
  const amountKobo = amountNaira * 100; // Convert to kobo

  const response = await axios.post('http://localhost:3000/v1/charge', {
    amount: amountKobo,
    email: customerEmail,
    reference: \`ORDER_\${orderId}_\${Date.now()}\`,
    callback_url: 'https://yourapp.com/payment/complete',
  }, {
    headers: {
      'Authorization': \`Bearer \${process.env.SKRILLPAY_API_KEY}\`,
      'Content-Type': 'application/json',
    }
  });

  if (response.data.status) {
    const { authorization_url, receipt_url, reference } = response.data.data;
    // Redirect customer to checkout
    return { checkoutUrl: authorization_url, receiptUrl: receipt_url };
  }

  throw new Error(response.data.message);
}`} lang="javascript" />
            </div>
          </div>
        )}

        {/* ── VERIFY ── */}
        {activeSection === 'verify' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4">
                <CheckCircle size={16} weight="duotone" /> Verify a Transaction
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verify a Transaction</h1>
              <p className="text-slate-400 text-sm">Confirm a payment's status directly against Skrillpay Engine. Always verify server-side — never trust client-side confirmation alone.</p>
            </div>

            <EndpointCard
              method="GET" path="/v1/transactions/verify/:reference"
              description="Verify a transaction by reference. Queries Skrillpay directly and updates the local transaction record. Returns full transaction metadata plus your internal status record."
              auth="API Key required"
              params={[
                { name: 'reference', type: 'string (path)', required: true, desc: 'The transaction reference from the charge response.' },
              ]}
              requestBody={`GET /v1/transactions/verify/ORDER_20260101_001
Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
              responseBody={`{
  "status": true,
  "message": "Transaction verification completed",
  "data": {
    "transaction": {
      "id": "uuid-...",
      "reference": "ORDER_20260101_001",
      "amount": 500000,
      "platform_fee": 7500,
      "merchant_amount": 492500,
      "customer_email": "customer@gmail.com",
      "status": "success",
      "currency": "NGN",
      "created_at": "2026-01-01T00:00:00Z"
    },
    "verification_data": {
      "status": "success",
      "reference": "ORDER_20260101_001",
      "amount": 500000,
      "channel": "card",
      "ip_address": "...",
      "authorization": { "card_type": "visa", "last4": "4081", "bank": "Zenith Bank" }
    },
    "receipt_url": "http://localhost:3000/v1/receipt/ORDER_20260101_001"
  }
}`}
              notes={['Always call this endpoint from your backend, not the frontend.', 'status can be: success, pending, or failed.']}
            />
          </div>
        )}

        {/* ── RECEIPT ── */}
        {activeSection === 'receipt' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-4">
                <Receipt size={16} weight="duotone" /> Payment Receipts
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Receipts</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Skrillpay automatically generates a beautifully formatted HTML receipt for every transaction. Share the receipt URL with customers via email or SMS immediately after payment. The receipt includes the full fee breakdown, transaction reference, and a print-to-PDF button.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm space-y-2">
              <p className="font-semibold text-emerald-400">Receipt Features</p>
              <ul className="space-y-1 text-slate-400 text-xs list-disc list-inside">
                <li>Beautiful HTML layout with your branding</li>
                <li>Full fee breakdown (total charged, platform fee, merchant receives)</li>
                <li>Print / Save as PDF button built-in</li>
                <li>Public URL — share directly in emails or SMS</li>
                <li>JSON format for programmatic processing</li>
                <li>No authentication required to view</li>
              </ul>
            </div>

            <EndpointCard
              method="GET" path="/v1/receipt/:reference"
              description="Returns a beautiful HTML receipt page for a completed transaction. This URL is public and can be shared directly with customers. Append ?format=json to receive structured JSON data instead."
              params={[
                { name: 'reference', type: 'string (path)', required: true, desc: 'The transaction reference returned by the charge endpoint.' },
                { name: 'format', type: 'query string', required: false, desc: 'Set to "json" to receive structured JSON instead of HTML.' },
              ]}
              requestBody={`# View HTML receipt (share this URL with customers)
GET /v1/receipt/ORDER_20260101_001

# Get JSON data
GET /v1/receipt/ORDER_20260101_001?format=json`}
              responseBody={`// JSON format (?format=json)
{
  "status": true,
  "data": {
    "reference": "ORDER_20260101_001",
    "amount": 500000,
    "amount_naira": 5000,
    "platform_fee": 7500,
    "merchant_amount": 492500,
    "customer_email": "customer@gmail.com",
    "status": "success",
    "currency": "NGN",
    "business_name": "TechMart Ltd",
    "transaction_reference": "TX_802948...",
    "created_at": "2026-01-01T10:30:00Z",
    "receipt_url": "http://localhost:3000/v1/receipt/ORDER_20260101_001"
  }
}`}
              notes={[
                'The HTML receipt renders in any browser and includes a Print button.',
                'receipt_url is automatically included in both charge and verify responses.',
              ]}
            />

            <EndpointCard
              method="GET" path="/v1/receipt/:reference/download"
              description="Returns the same HTML receipt with Content-Disposition: attachment, prompting browsers to download it as an HTML file (which can be printed as PDF)."
              params={[
                { name: 'reference', type: 'string (path)', required: true, desc: 'Transaction reference.' },
              ]}
              requestBody={`GET /v1/receipt/ORDER_20260101_001/download`}
            />

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h3 className="font-bold text-white mb-3">Sending Receipt via Email (Node.js example)</h3>
              <CodeBlock code={`const nodemailer = require('nodemailer');

async function sendReceiptEmail(customerEmail, reference) {
  const receiptUrl = \`https://api.skrillpay.com/v1/receipt/\${reference}\`;

  await transporter.sendMail({
    to: customerEmail,
    subject: 'Your Payment Receipt – TechMart Ltd',
    html: \`
      <h2>Thank you for your payment!</h2>
      <p>Your transaction has been confirmed.</p>
      <p>
        <a href="\${receiptUrl}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
          View Receipt
        </a>
      </p>
      <p>Reference: <strong>\${reference}</strong></p>
    \`,
  });
}

// Call after verifying a successful payment
app.post('/webhooks/skrillpay', (req, res) => {
  const { event, data } = req.body;
  if (event === 'charge.success') {
    sendReceiptEmail(data.customer.email, data.reference);
  }
  res.sendStatus(200);
});`} lang="javascript" />
            </div>
          </div>
        )}

        {/* ── WEBHOOKS ── */}
        {activeSection === 'webhooks' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                <Broadcast size={16} weight="duotone" /> Webhook Events
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Webhook Events</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Skrillpay forwards payment webhook events to your registered <strong className="text-white">webhook_url</strong>. Each forwarded event is signed with HMAC-SHA512 so you can verify it came from Skrillpay.
              </p>
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6 space-y-4">
              <h2 className="font-bold text-white">How Webhook Forwarding Works</h2>
              {[
                'Customer completes payment → Skrillpay confirms charge.success event',
                'Skrillpay verifies event signature and records the event',
                'Skrillpay updates the transaction status in our database',
                'Skrillpay forwards the event to your webhook_url, signed with our HMAC',
                'Your server verifies the x-skrillpay-signature header and processes the event',
              ].map((s, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">{i + 1}</div>
                  <p className="text-slate-400">{s}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h3 className="font-bold text-white mb-3">Event Payload Structure</h3>
              <CodeBlock code={`// POST to your webhook_url
// Headers:
//   x-skrillpay-signature: <hmac_sha512_hex>
//   x-skrillpay-merchant-id: <your_merchant_id>
//   Content-Type: application/json

{
  "event": "charge.success",
  "data": {
    "id": 123456789,
    "reference": "ORDER_20260101_001",
    "amount": 500000,
    "status": "success",
    "customer": {
      "email": "customer@gmail.com"
    },
    "paid_at": "2026-01-01T10:35:00Z"
  }
}`} />
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h3 className="font-bold text-white mb-3">Verifying Webhook Signatures (Node.js)</h3>
              <CodeBlock code={`const crypto = require('crypto');
const express = require('express');

const app = express();
app.use(express.json());

// Your PLATFORM_WEBHOOK_SECRET (shared by Skrillpay admin upon activation)
const WEBHOOK_SECRET = process.env.SKRILLPAY_WEBHOOK_SECRET;

app.post('/webhooks/skrillpay', (req, res) => {
  const signature = req.headers['x-skrillpay-signature'];
  const payload = JSON.stringify(req.body);

  // Verify HMAC
  const expectedSig = crypto
    .createHmac('sha512', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // ✅ Signature valid — process event
  const { event, data } = req.body;

  if (event === 'charge.success') {
    // Mark order as paid, send confirmation email, etc.
    const { reference, amount, customer } = data;
    console.log(\`Payment received: \${reference} — ₦\${amount / 100}\`);
    
    // Generate and send receipt
    const receiptUrl = \`https://api.skrillpay.com/v1/receipt/\${reference}\`;
    // sendReceiptEmail(customer.email, receiptUrl);
  }

  // Always respond 200 to prevent retries
  res.sendStatus(200);
});`} lang="javascript" />
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h3 className="font-bold text-white mb-3">Supported Events</h3>
              <div className="space-y-2 text-sm">
                {[
                  { event: 'charge.success', desc: 'Fired when a customer successfully completes payment.' },
                  { event: 'charge.failed', desc: 'Fired when a payment attempt fails or is abandoned.' },
                ].map((e) => (
                  <div key={e.event} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40">
                    <code className="text-sky-400 text-xs font-mono mt-0.5 shrink-0">{e.event}</code>
                    <p className="text-slate-400 text-xs">{e.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ERRORS ── */}
        {activeSection === 'errors' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-4">
                <WarningOctagon size={16} weight="duotone" /> Error Reference
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Error Codes</h1>
              <p className="text-slate-400 text-sm">All errors follow the standard response format with <code className="text-red-400">status: false</code> and a human-readable <code className="text-red-400">message</code>.</p>
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-5 py-3 text-left text-xs text-slate-500 font-semibold uppercase">HTTP Code</th>
                    <th className="px-5 py-3 text-left text-xs text-slate-500 font-semibold uppercase">Meaning</th>
                    <th className="px-5 py-3 text-left text-xs text-slate-500 font-semibold uppercase">Common Cause</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: '400', meaning: 'Bad Request', cause: 'Missing required parameters or invalid input format.' },
                    { code: '401', meaning: 'Unauthorized', cause: 'Missing, expired, or invalid API key / JWT token.' },
                    { code: '403', meaning: 'Forbidden', cause: 'Account suspended, or attempting admin actions without admin role.' },
                    { code: '404', meaning: 'Not Found', cause: 'Transaction reference, user, or receipt does not exist.' },
                    { code: '409', meaning: 'Conflict', cause: 'Duplicate transaction reference, or email already registered.' },
                    { code: '422', meaning: 'Unprocessable', cause: 'BVN verification failed via KYC provider.' },
                    { code: '500', meaning: 'Server Error', cause: 'Internal error — check backend logs. Contact support if persistent.' },
                  ].map((e) => (
                    <tr key={e.code} className="border-b border-slate-800/50">
                      <td className="px-5 py-3 font-mono text-red-400 font-bold">{e.code}</td>
                      <td className="px-5 py-3 text-white font-medium">{e.meaning}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{e.cause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h3 className="font-bold text-white mb-3">Example Error Response</h3>
              <CodeBlock code={`// 401 Unauthorized
{
  "status": false,
  "message": "Invalid email or password"
}

// 409 Conflict
{
  "status": false,
  "message": "Transaction reference already exists"
}

// 400 Bad Request
{
  "status": false,
  "message": "Missing required parameters: amount, email, reference"
}`} />
            </div>
          </div>
        )}

        {/* ── PLAYGROUND ── */}
        {activeSection === 'playground' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                <Flask size={16} weight="duotone" /> API Playground
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Interactive API Tester</h1>
              <p className="text-slate-400 text-sm">Test API calls directly from the browser. Requires your API key for charge/verify endpoints.</p>
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              {/* Action selector */}
              <div className="flex rounded-xl bg-slate-900/60 border border-slate-800 p-1 mb-6">
                {[
                  { key: 'charge', label: 'Initialize Charge' },
                  { key: 'verify', label: 'Verify Transaction' },
                  { key: 'receipt', label: 'Get Receipt (JSON)' },
                ] .map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setPlaygroundAction(a.key as any)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      playgroundAction === a.key ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {playgroundAction !== 'receipt' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Merchant API Key</label>
                    <input
                      type="text" value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk_live_xxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono placeholder-slate-600"
                    />
                  </div>
                )}

                {playgroundAction === 'charge' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Amount (Kobo)</label>
                        <input
                          type="number" value={chargeAmount}
                          onChange={(e) => setChargeAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                        />
                        <p className="text-xs text-slate-600 mt-1">= ₦{(chargeAmount / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer Email</label>
                        <input
                          type="email" value={chargeEmail}
                          onChange={(e) => setChargeEmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reference</label>
                      <div className="flex gap-2">
                        <input
                          type="text" value={chargeRef}
                          onChange={(e) => setChargeRef(e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                        />
                        <button
                          onClick={() => setChargeRef('REF_' + Date.now())}
                          className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-all"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {playgroundAction === 'verify' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transaction Reference</label>
                    <input
                      type="text" value={verifyRef}
                      onChange={(e) => setVerifyRef(e.target.value)}
                      placeholder="ORDER_20260101_001"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                    />
                  </div>
                )}

                {playgroundAction === 'receipt' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transaction Reference</label>
                    <input
                      type="text" value={receiptRef}
                      onChange={(e) => setReceiptRef(e.target.value)}
                      placeholder="ORDER_20260101_001"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                    />
                    {receiptRef && (
                      <a
                        href={`${BASE_URL}/receipt/${receiptRef}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 mt-2 inline-block"
                      >
                        🔗 Open HTML receipt in new tab →
                      </a>
                    )}
                  </div>
                )}

                <button
                  onClick={runPlayground}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      Sending request...
                    </span>
                  ) : `Execute ${playgroundAction === 'charge' ? 'POST /v1/charge' : playgroundAction === 'verify' ? 'GET /v1/transactions/verify/:ref' : 'GET /v1/receipt/:ref?format=json'}`}
                </button>

                {response && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Response</p>
                    <pre className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-80 leading-relaxed">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                    {response?.data?.authorization_url && (
                      <a
                        href={response.data.authorization_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
                      >
                        💳 Open Skrillpay Checkout →
                      </a>
                    )}
                    {response?.data?.receipt_url && (
                      <a
                        href={response.data.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-500/20 transition-all"
                      >
                        🧾 View Receipt →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
