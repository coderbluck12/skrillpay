'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import { ShieldCheck, CheckCircle, Warning, LockKey, ArrowClockwise } from '@phosphor-icons/react';

type AdminTab = 'pending' | 'all';

export default function AdminPage() {
  const { isAuthenticated, isLoading, merchant } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [pendingMerchants, setPendingMerchants] = useState<any[]>([]);
  const [allMerchants, setAllMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [approvedKey, setApprovedKey] = useState<{ userId: string; key: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin Fee Control State
  const [editFeeType, setEditFeeType] = useState<'percentage' | 'flat'>('percentage');
  const [editFeeValue, setEditFeeValue] = useState<number>(1.5);
  const [feeUpdating, setFeeUpdating] = useState(false);

  useEffect(() => {
    if (selectedMerchant) {
      setEditFeeType(selectedMerchant.fee_type || 'percentage');
      setEditFeeValue(Number(selectedMerchant.fee_value) || 1.5);
    }
  }, [selectedMerchant]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !merchant?.is_admin)) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, merchant, router]);

  useEffect(() => {
    if (isAuthenticated && merchant?.is_admin) {
      fetchData();
    }
  }, [isAuthenticated, merchant]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, allData] = await Promise.all([
        ApiClient.adminListPendingKyc(),
        ApiClient.adminListMerchants(),
      ]);
      
      if (pendingData.status) {
        setPendingMerchants(pendingData.data?.merchants || []);
      } else {
        console.warn('Pending KYC fetch failed:', pendingData.message);
      }

      if (allData.status) {
        setAllMerchants(allData.data?.merchants || []);
      } else {
        console.warn('All Merchants fetch failed:', allData.message);
        setError(allData.message || 'Failed to load merchants');
      }
    } catch (err: any) {
      console.error('Admin fetchData error:', err);
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, businessName: string) => {
    if (!confirm(`Approve KYC for ${businessName}? Platform fee will be set to ${editFeeValue}${editFeeType === 'percentage' ? '%' : ' NGN'}.`)) return;
    setActionLoading(userId);
    setError(null);
    try {
      const result = await ApiClient.adminApproveKyc(userId, { fee_type: editFeeType, fee_value: editFeeValue });
      if (!result.status) throw new Error(result.message);
      setApprovedKey({ userId, key: result.data.api_key });
      await fetchData();
    } catch (err: any) {
      setError(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateFee = async (userId: string) => {
    setFeeUpdating(true);
    try {
      const res = await ApiClient.adminUpdateMerchantFee(userId, { fee_type: editFeeType, fee_value: editFeeValue });
      if (!res.status) throw new Error(res.message);
      alert('Merchant fee updated successfully!');
      await fetchData();
    } catch (err: any) {
      alert(`Fee update failed: ${err.message}`);
    } finally {
      setFeeUpdating(false);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt('Reason for rejection (will be logged):');
    if (reason === null) return;
    setActionLoading(userId);
    try {
      await ApiClient.adminRejectKyc(userId, reason);
      await fetchData();
    } catch {
      setError('Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId: string, businessName: string) => {
    if (!confirm(`Suspend ${businessName}? They won't be able to process payments.`)) return;
    setActionLoading(userId);
    try {
      await ApiClient.adminSuspendMerchant(userId);
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const copyKey = () => {
    if (approvedKey) navigator.clipboard.writeText(approvedKey.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_kyc: 'bg-slate-800 text-slate-400 border border-slate-700',
      kyc_submitted: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      suspended: 'bg-red-500/10 text-red-400 border border-red-500/20',
    };
    return `inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-800 text-slate-400'}`;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated || !merchant?.is_admin) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <ShieldCheck size={16} weight="duotone" /> Admin Panel
          </div>
          <h1 className="text-2xl font-bold text-white">Merchant Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Review KYC submissions and manage merchant accounts</p>
        </div>
        <button onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all">
          Refresh
        </button>
      </div>

      {/* API Key Modal */}
      {approvedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="glass w-full max-w-md rounded-2xl border border-emerald-500/30 p-8 text-center">
            <div className="mb-5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} weight="fill" />
              </div>
              <h3 className="font-bold text-white text-lg">Merchant Approved!</h3>
              <p className="text-slate-400 text-xs mt-1">Share this API key securely with the merchant. It will NOT be shown again.</p>
            </div>
            <div className="mb-4 text-left">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Generated API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-sky-300 break-all">
                  {approvedKey.key}
                </div>
                <button onClick={copyKey}
                  className="shrink-0 px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-xs font-medium text-slate-300">
                  {copiedKey ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
            <button onClick={() => setApprovedKey(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all">
              Close
            </button>
          </div>
        </div>
      )}

      {/* KYC Detail Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="glass w-full max-w-lg rounded-2xl border border-slate-700 p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-bold text-white text-lg">{selectedMerchant.business_name}</h3>
                <p className="text-slate-400 text-xs">{selectedMerchant.email}</p>
              </div>
              <button onClick={() => setSelectedMerchant(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3 text-sm">
              {Object.entries({
                'Status': <span className={statusBadge(selectedMerchant.kyc_status)}>{selectedMerchant.kyc_status}</span>,
                'Bank Account': selectedMerchant.bank_account_number || 'N/A',
                'Bank Code': selectedMerchant.bank_code || 'N/A',
                'KYC Provider': selectedMerchant.kyc_provider || 'N/A',
                'Submitted At': selectedMerchant.kyc_submitted_at ? new Date(selectedMerchant.kyc_submitted_at).toLocaleString() : 'N/A',
              }).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">{k}</span>
                  <span className="text-slate-100 font-medium">{v}</span>
                </div>
              ))}
              {selectedMerchant.kyc_data && (
                <div className="pt-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">KYC Submission Data</p>
                  <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
                    {JSON.stringify(selectedMerchant.kyc_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Admin Platform Fee Settings Control */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Admin Platform Fee Settings</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fee Model</label>
                    <select
                      value={editFeeType}
                      onChange={(e: any) => setEditFeeType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Rate (NGN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fee Value ({editFeeType === 'percentage' ? '%' : '₦'})</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editFeeValue}
                      onChange={(e) => setEditFeeValue(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>
                {selectedMerchant.kyc_status === 'active' && (
                  <button
                    onClick={() => handleUpdateFee(selectedMerchant.id)}
                    disabled={feeUpdating}
                    className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {feeUpdating ? 'Updating...' : 'Update Platform Fee'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {selectedMerchant.kyc_status === 'kyc_submitted' && (
                <>
                  <button
                    onClick={() => { handleApprove(selectedMerchant.id, selectedMerchant.business_name); setSelectedMerchant(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all">
                    Approve KYC
                  </button>
                  <button
                    onClick={() => { handleReject(selectedMerchant.id); setSelectedMerchant(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition-all">
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <Warning size={18} weight="bold" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Merchants', value: allMerchants.length, color: 'text-slate-100' },
          { label: 'Pending Review', value: pendingMerchants.length, color: 'text-amber-400' },
          { label: 'Active', value: allMerchants.filter((m) => m.kyc_status === 'active').length, color: 'text-emerald-400' },
          { label: 'Suspended', value: allMerchants.filter((m) => m.kyc_status === 'suspended').length, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl border border-slate-800/60 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-slate-900/60 border border-slate-800 p-1 mb-6 w-fit">
        {[{ key: 'pending' as AdminTab, label: `Pending Review (${pendingMerchants.length})` }, { key: 'all' as AdminTab, label: 'All Merchants' }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.key ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* Merchants Table */}
      <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['Business', 'Email', 'Status', 'Bank', 'Submitted', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/40">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 rounded shimmer w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : (activeTab === 'pending' ? pendingMerchants : allMerchants).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    {activeTab === 'pending' ? '🎉 No pending KYC submissions.' : 'No merchants registered yet.'}
                  </td>
                </tr>
              ) : (
                (activeTab === 'pending' ? pendingMerchants : allMerchants).map((m) => (
                  <tr key={m.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedMerchant(m)} className="text-left">
                        <p className="font-medium text-white hover:text-sky-400 transition-colors">{m.business_name}</p>
                        <p className="text-xs text-slate-500">{m.id.slice(0, 8)}...</p>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{m.email}</td>
                    <td className="px-6 py-4"><span className={statusBadge(m.kyc_status)}>{m.kyc_status}</span></td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">{m.bank_account_number ? `****${String(m.bank_account_number).slice(-4)}` : 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {m.kyc_submitted_at ? new Date(m.kyc_submitted_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {m.kyc_status === 'kyc_submitted' && (
                          <>
                            <button
                              onClick={() => handleApprove(m.id, m.business_name)}
                              disabled={actionLoading === m.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all disabled:opacity-50">
                              {actionLoading === m.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(m.id)}
                              disabled={actionLoading === m.id}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all disabled:opacity-50">
                              Reject
                            </button>
                          </>
                        )}
                        {m.kyc_status === 'active' && (
                          <button
                            onClick={() => handleSuspend(m.id, m.business_name)}
                            disabled={actionLoading === m.id}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50">
                            Suspend
                          </button>
                        )}
                        <button onClick={() => setSelectedMerchant(m)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-all">
                          View
                        </button>
                      </div>
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
