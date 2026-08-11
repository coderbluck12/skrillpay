'use client';

import { useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Bank, IdentificationCard, CheckCircle, Lightning } from '@phosphor-icons/react';

const BANKS = [
  { name: 'Zenith Bank', code: '057' },
  { name: 'GTBank', code: '058' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'First Bank', code: '011' },
  { name: 'Access Bank', code: '044' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Stanbic IBTC', code: '221' },
  { name: 'FCMB', code: '214' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Wema Bank / ALAT', code: '035' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Union Bank', code: '032' },
];

interface KycWizardProps {
  onComplete: () => void;
}

type Step = 'bank' | 'identity' | 'review';

const steps: { key: Step; label: string; IconComponent: any }[] = [
  { key: 'bank', label: 'Settlement Bank', IconComponent: Bank },
  { key: 'identity', label: 'Identity (BVN/NIN)', IconComponent: IdentificationCard },
  { key: 'review', label: 'Review & Activate', IconComponent: CheckCircle },
];

export default function KycWizard({ onComplete }: KycWizardProps) {
  const { refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('bank');

  // Bank details
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('057');
  const [feeType, setFeeType] = useState<'percentage' | 'flat'>('percentage');
  const [feeValue, setFeeValue] = useState(1.5);

  // Identity (BVN / NIN only - simplified)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');

  // Settings
  const [webhookUrl, setWebhookUrl] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');

  // Submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  const goNext = () => {
    const next = steps[currentIndex + 1];
    if (next) setCurrentStep(next.key);
  };

  const goPrev = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setCurrentStep(prev.key);
  };

  const handleSubmit = async () => {
    if (!bvn && !nin) {
      setError('Please provide at least a BVN or NIN for instant identity verification');
      setCurrentStep('identity');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await ApiClient.submitKyc({
        bank_account_number: bankAccountNumber,
        bank_code: bankCode,
        fee_type: feeType,
        fee_value: feeValue,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
        bvn: bvn || undefined,
        nin: nin || undefined,
        webhook_url: webhookUrl || undefined,
        callback_url: callbackUrl || undefined,
      });

      if (!result.status) throw new Error(result.message || 'KYC submission failed');

      await refreshProfile();
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Progress Bar */}
      <div className="flex items-center mb-8">
        {steps.map((step, i) => {
          const StepIcon = step.IconComponent;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < currentIndex && setCurrentStep(step.key)}
                className={`flex flex-col items-center gap-1 ${i < currentIndex ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  i < currentIndex ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  i === currentIndex ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30' :
                  'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {i < currentIndex ? (
                    <CheckCircle size={20} weight="fill" className="text-emerald-400" />
                  ) : (
                    <StepIcon size={20} weight={i === currentIndex ? 'bold' : 'regular'} />
                  )}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  i === currentIndex ? 'text-sky-400' : i < currentIndex ? 'text-emerald-400' : 'text-slate-500'
                }`}>{step.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 transition-all ${i < currentIndex ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="glass rounded-2xl border border-slate-800/60 p-8">

        {/* Step 1: Settlement Bank */}
        {currentStep === 'bank' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Settlement Bank Account</h3>
              <p className="text-slate-400 text-sm">Where your customer payouts and earnings will be deposited.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Account Number <span className="text-red-400">*</span>
              </label>
              <input type="text" required maxLength={10} value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="0123456789"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Bank Name <span className="text-red-400">*</span>
              </label>
              <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm">
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform Fee Model</label>
                <select value={feeType} onChange={(e: any) => setFeeType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Rate (NGN)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Fee Value ({feeType === 'percentage' ? '%' : '₦'})
                </label>
                <input type="number" step="0.1" min="0" value={feeValue}
                  onChange={(e) => setFeeValue(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Instant Identity Verification (BVN / NIN) */}
        {currentStep === 'identity' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Instant Identity Verification</h3>
              <p className="text-slate-400 text-sm">Automated verification for instant account activation.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                BVN <span className="text-emerald-400 font-normal">(Bank Verification Number)</span>
              </label>
              <input type="text" maxLength={11} value={bvn} onChange={(e) => setBvn(e.target.value)} placeholder="22312345678"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm font-mono" />
              <p className="text-xs text-slate-500 mt-1">Stored securely & masked (only last 4 digits visible)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                NIN <span className="text-slate-500 font-normal">(Optional alternative)</span>
              </label>
              <input type="text" maxLength={11} value={nin} onChange={(e) => setNin(e.target.value)} placeholder="12345678901"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm font-mono" />
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400">
              ⚡ Account verification completes instantly with zero paperwork required.
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 'review' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Review & Activate</h3>
              <p className="text-slate-400 text-sm">Confirm your details before activation.</p>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: 'Bank Account Number', value: bankAccountNumber ? `****${bankAccountNumber.slice(-4)}` : '—' },
                { label: 'Settlement Bank', value: BANKS.find((b) => b.code === bankCode)?.name || bankCode },
                { label: 'Fee Rate', value: `${feeValue}${feeType === 'percentage' ? '%' : '₦'} (${feeType})` },
                { label: 'Director Name', value: `${firstName} ${lastName}`.trim() || '—' },
                { label: 'BVN Status', value: bvn ? `****${bvn.slice(-4)} (Verified)` : '—' },
                { label: 'NIN Status', value: nin ? `****${nin.slice(-4)}` : '—' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2.5 border-b border-slate-800/60">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="text-slate-100 font-medium text-right max-w-xs truncate">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400">
              ✅ Once submitted, your merchant settlement account is activated and your Secret API Key is issued.
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-800/60">
          <button onClick={goPrev} disabled={currentIndex === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            ← Back
          </button>

          {currentStep !== 'review' ? (
            <button
              onClick={goNext}
              disabled={currentStep === 'bank' && !bankAccountNumber}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20">
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Verifying Identity...
                </span>
              ) : 'Submit & Activate Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
