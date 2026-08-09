'use client';

import { useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

type Step = 'business' | 'bank' | 'identity' | 'settings' | 'review';

const steps: { key: Step; label: string; icon: string }[] = [
  { key: 'business', label: 'Business', icon: '🏢' },
  { key: 'bank', label: 'Bank', icon: '🏦' },
  { key: 'identity', label: 'Identity', icon: '🪪' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'review', label: 'Review', icon: '✓' },
];

export default function KycWizard({ onComplete }: KycWizardProps) {
  const { refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('business');

  // Business info
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxId, setTaxId] = useState('');

  // Bank details
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('057');
  const [feeType, setFeeType] = useState<'percentage' | 'flat'>('percentage');
  const [feeValue, setFeeValue] = useState(1.5);

  // Identity
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
    setLoading(true);
    setError(null);
    try {
      const result = await ApiClient.submitKyc({
        registration_number: registrationNumber || undefined,
        tax_id: taxId || undefined,
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
      {/* Step Progress */}
      <div className="flex items-center mb-10">
        {steps.map((step, i) => (
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
                {i < currentIndex ? '✓' : step.icon}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                i === currentIndex ? 'text-sky-400' : i < currentIndex ? 'text-emerald-400' : 'text-slate-500'
              }`}>{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${i < currentIndex ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass rounded-2xl border border-slate-800/60 p-8">

        {/* Step 1: Business Info */}
        {currentStep === 'business' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Business Information</h3>
              <p className="text-slate-400 text-sm">Provide your business registration details.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                CAC Registration Number <span className="text-slate-600 normal-case">(optional)</span>
              </label>
              <input type="text" value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="RC1234567"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm" />
              <p className="text-xs text-slate-500 mt-1">Your Corporate Affairs Commission registration number</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tax ID / TIN <span className="text-slate-600 normal-case">(optional)</span>
              </label>
              <input type="text" value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="0123456-0001"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm" />
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
              💡 Business registration details are optional for the MVP but required at scale for compliance.
            </div>
          </div>
        )}

        {/* Step 2: Bank Account */}
        {currentStep === 'bank' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Settlement Bank Account</h3>
              <p className="text-slate-400 text-sm">This is where Paystack will settle your customer payments.</p>
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
                Settlement Bank <span className="text-red-400">*</span>
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform Fee Type</label>
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
            {!bankAccountNumber && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400">
                Account number and bank are required to proceed.
              </div>
            )}
          </div>
        )}

        {/* Step 3: Identity */}
        {currentStep === 'identity' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Director Identity</h3>
              <p className="text-slate-400 text-sm">Identity details of the primary business director.</p>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                BVN <span className="text-slate-600 normal-case">(Bank Verification Number)</span>
              </label>
              <input type="text" maxLength={11} value={bvn} onChange={(e) => setBvn(e.target.value)} placeholder="22312345678"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm font-mono" />
              <p className="text-xs text-slate-500 mt-1">BVN is stored masked (last 4 digits only)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                NIN <span className="text-slate-600 normal-case">(National Identification Number — optional)</span>
              </label>
              <input type="text" maxLength={11} value={nin} onChange={(e) => setNin(e.target.value)} placeholder="12345678901"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm font-mono" />
            </div>
          </div>
        )}

        {/* Step 4: Integration Settings */}
        {currentStep === 'settings' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Integration Settings</h3>
              <p className="text-slate-400 text-sm">Optional — configure your webhook and payment callback URLs.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Webhook URL <span className="text-slate-600 normal-case">(receives payment events)</span>
              </label>
              <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://yourapp.com/webhooks/payments"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm font-mono" />
              <p className="text-xs text-slate-500 mt-1">We'll forward charge.success and charge.failed events signed with HMAC SHA-512</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Payment Callback URL <span className="text-slate-600 normal-case">(redirect after checkout)</span>
              </label>
              <input type="url" value={callbackUrl} onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="https://yourapp.com/payment/success"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm font-mono" />
              <p className="text-xs text-slate-500 mt-1">After Paystack checkout, customers are redirected here with ?reference=&status= appended</p>
            </div>
            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-1 text-xs text-slate-400">
              <p className="text-sky-400 font-medium">How webhook signing works:</p>
              <p>Each event forwarded to your webhook URL will have a <code className="text-slate-300">x-skrillpay-signature</code> header with an HMAC-SHA512 signature. Your backend verifies this using the <code className="text-slate-300">PLATFORM_WEBHOOK_SECRET</code> we'll share after activation.</p>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 'review' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Review & Submit</h3>
              <p className="text-slate-400 text-sm">Confirm your details before submitting for review.</p>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: 'CAC Number', value: registrationNumber || '—' },
                { label: 'Tax ID', value: taxId || '—' },
                { label: 'Bank Account', value: bankAccountNumber ? `****${bankAccountNumber.slice(-4)}` : '—' },
                { label: 'Settlement Bank', value: BANKS.find((b) => b.code === bankCode)?.name || bankCode },
                { label: 'Platform Fee', value: `${feeValue}${feeType === 'percentage' ? '%' : '₦'} (${feeType})` },
                { label: 'Director Name', value: `${firstName} ${lastName}`.trim() || '—' },
                { label: 'BVN', value: bvn ? `****${bvn.slice(-4)}` : '—' },
                { label: 'Webhook URL', value: webhookUrl || '—' },
                { label: 'Callback URL', value: callbackUrl || '—' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="text-slate-100 font-medium text-right max-w-xs truncate">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400">
              ✅ After submission, our team will review your KYC and activate your account within 24 hours. You'll receive your API key upon activation.
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
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
                  Submitting...
                </span>
              ) : 'Submit KYC for Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
