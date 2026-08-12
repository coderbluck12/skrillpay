'use client';

import Link from 'next/link';
import { Bank, Scissors, ShieldCheck, Key, ChartLineUp, Coins } from '@phosphor-icons/react';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">


        {/* Headlining */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 max-w-5xl mx-auto">
          Accept payments &{' '}
          <br className="hidden md:block" />
          <span className="gradient-text">split fees automatically</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Onboard merchants onto automated settlement accounts in minutes. Every transaction automatically splits your platform fee with zero manual accounting work.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-0.5"
          >
            Start for free
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-slate-300 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
          >
            View API Docs
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-xs text-slate-600 mt-6">Instant onboarding · Test mode ready · Automated settlements</p>
      </section>

      {/* Code preview */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="glass gradient-border rounded-2xl overflow-hidden">
          {/* Terminal header */}
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-800/60">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-xs text-slate-500 font-mono">Skrillpay Charge API</span>
          </div>
          <pre className="p-6 text-sm font-mono leading-relaxed overflow-x-auto" style={{ color: '#94a3b8' }}>
            <span style={{ color: '#64748b' }}># Initialize a payment charge with automatic fee split</span>{'\n'}
            <span style={{ color: '#38bdf8' }}>curl</span>{' '}
            <span style={{ color: '#f59e0b' }}>-X POST</span>{' '}
            <span style={{ color: '#34d399' }}>https://api.skrillpay.com/v1/charge</span>{' '}
            <span style={{ color: '#94a3b8' }}>-H</span>{' '}
            <span style={{ color: '#f1f5f9' }}>"Authorization: Bearer sk_key_..."</span>{' '}
            <span style={{ color: '#94a3b8' }}>-d</span>{' '}
            <span style={{ color: '#f1f5f9' }}>{'\'{"amount":500000,"email":"buyer@gmail.com","reference":"REF_12345"}\''}</span>{'\n\n'}
            <span style={{ color: '#64748b' }}># Returns your branded checkout URL for payment</span>
          </pre>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            IconComponent: Bank,
            title: 'Automated Accounts',
            desc: 'Verification triggers settlement account creation in real-time. Merchants are onboarded and settlement-ready in minutes.',
            color: 'sky',
          },
          {
            IconComponent: Scissors,
            title: 'Automatic Fee Splits',
            desc: 'Define percentage or flat fees per merchant. Skrillpay splits the funds on every transaction — nothing to reconcile.',
            color: 'indigo',
          },
          {
            IconComponent: ShieldCheck,
            title: 'Secure Webhooks',
            desc: 'HMAC SHA-512 signature verification and DB-level idempotency ensure events are processed once and never spoofed.',
            color: 'emerald',
          },
          {
            IconComponent: Key,
            title: 'API Key Auth',
            desc: 'Each merchant gets a hashed API key. We never store the plaintext — SHA-256 hashed at rest from day one.',
            color: 'sky',
          },
          {
            IconComponent: ChartLineUp,
            title: 'Merchant Dashboard',
            desc: 'Real-time volume, earnings, and fee analytics for every merchant. Filter and export transaction history.',
            color: 'indigo',
          },
          {
            IconComponent: Coins,
            title: 'Subunit Precision',
            desc: 'All monetary amounts stored in Kobo (integer subunits) to eliminate floating-point rounding errors.',
            color: 'emerald',
          },
        ].map((f) => {
          const Icon = f.IconComponent;
          return (
            <div
              key={f.title}
              className="glass rounded-2xl p-7 border border-slate-800/60 hover:border-slate-700 transition-all group"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5 transition-transform group-hover:scale-110 ${
                  f.color === 'sky' ? 'bg-sky-500/10 text-sky-400' : f.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                <Icon size={24} weight="duotone" />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="glass gradient-border rounded-3xl p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.05) 0%, rgba(129,140,248,0.05) 100%)' }}>
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">
            Ready to go live?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Onboard your first merchant and start accepting payments in minutes.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-xl shadow-sky-500/20"
          >
            Onboard a Merchant →
          </Link>
        </div>
      </section>
    </div>
  );
}
