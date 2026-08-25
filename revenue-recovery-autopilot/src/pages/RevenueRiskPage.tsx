import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  ArrowUpDown, 
  CreditCard, 
  ExternalLink,
  Bot,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { RecoveryCase } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface RevenueRiskPageProps {
  cases: RecoveryCase[];
  onSelectCase: (c: RecoveryCase) => void;
  onRefreshData: () => void;
}

export const RevenueRiskPage: React.FC<RevenueRiskPageProps> = ({
  cases,
  onSelectCase,
  onRefreshData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'amount' | 'probability' | 'time'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.paymentId.toLowerCase().includes(q) ||
        c.customer.name.toLowerCase().includes(q) ||
        c.customer.email.toLowerCase().includes(q) ||
        c.failureReason.toLowerCase().includes(q) ||
        c.transaction.itemDescription.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Filter Pill
      if (filterType === 'ALL') return true;
      if (filterType === 'HIGH_RISK') return c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL';
      if (filterType === 'MEDIUM_RISK') return c.riskLevel === 'MEDIUM';
      if (filterType === 'LOW_RISK') return c.riskLevel === 'LOW';
      if (filterType === 'FAILED_PAYMENT') return c.paymentStatus === 'failed';
      if (filterType === 'ABANDONED_CHECKOUT') return c.paymentStatus === 'abandoned';
      if (filterType === 'SUBSCRIPTION_FAILURE') return c.failureReason === 'SUBSCRIPTION_RENEWAL_FAILED';
      if (filterType === 'RECOVERABLE') return (c.aiDiagnosis?.recoveryProbability ?? c.recoveryProbability) >= 50;
      if (filterType === 'RECOVERED') return c.status === 'RECOVERED';
      if (filterType === 'BLOCKED') return c.status === 'BLOCKED';
      if (filterType === 'PENDING_APPROVAL') return c.status === 'PENDING_APPROVAL';

      return true;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'amount') {
        valA = a.amount;
        valB = b.amount;
      } else if (sortBy === 'probability') {
        valA = a.aiDiagnosis?.recoveryProbability ?? a.recoveryProbability;
        valB = b.aiDiagnosis?.recoveryProbability ?? b.recoveryProbability;
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [cases, searchQuery, filterType, sortBy, sortOrder]);

  const filterButtons = [
    { id: 'ALL', label: 'All Cases' },
    { id: 'HIGH_RISK', label: 'High Risk' },
    { id: 'MEDIUM_RISK', label: 'Medium Risk' },
    { id: 'LOW_RISK', label: 'Low Risk' },
    { id: 'FAILED_PAYMENT', label: 'Failed Payment' },
    { id: 'ABANDONED_CHECKOUT', label: 'Abandoned Checkout' },
    { id: 'SUBSCRIPTION_FAILURE', label: 'Subscription Failure' },
    { id: 'RECOVERABLE', label: 'Recoverable (≥50%)' },
    { id: 'RECOVERED', label: 'Recovered' },
    { id: 'PENDING_APPROVAL', label: 'Needs Approval' },
    { id: 'BLOCKED', label: 'Blocked' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Revenue Risk Cases</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time monitor of failed, abandoned, and slipping transactions across merchant checkouts.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {filteredCases.length} of {cases.length} cases matching
          </span>
        </div>
      </div>

      {/* Filter Tabs / Quick Selectors */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filterType === btn.id
                ? 'bg-black text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, customer, reason, or order..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-slate-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="time">Recent Timestamp</option>
            <option value="amount">Amount</option>
            <option value="probability">Recovery Probability</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Revenue Risk Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <th className="py-2.5 px-4">Case ID</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Failure Reason</th>
                <th className="py-2.5 px-4">Customer History</th>
                <th className="py-2.5 px-4">Prob.</th>
                <th className="py-2.5 px-4">Risk</th>
                <th className="py-2.5 px-4">Recommended Action</th>
                <th className="py-2.5 px-4 text-center">Case Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No revenue risk cases found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const prob = c.aiDiagnosis?.recoveryProbability ?? c.recoveryProbability;
                  const total = c.customer.totalTransactions || 1;
                  const successRate = ((c.customer.successfulTransactions / total) * 100).toFixed(0);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {c.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{c.customer.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.customer.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap text-right">
                        ₹{c.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge type="payment" value={c.paymentStatus} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-rose-600">
                          {c.failureReason}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700">
                          {successRate}% ({c.customer.successfulTransactions}/{total})
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase">Tier: {c.customer.tier}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={prob >= 70 ? 'text-green-600' : prob >= 40 ? 'text-amber-600' : 'text-slate-400'}>
                          {prob}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge type="risk" value={c.riskLevel} />
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic whitespace-nowrap">
                        {c.recommendedAction ? c.recommendedAction.replace(/_/g, ' ') : 'Pending'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge type="status" value={c.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c);
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
