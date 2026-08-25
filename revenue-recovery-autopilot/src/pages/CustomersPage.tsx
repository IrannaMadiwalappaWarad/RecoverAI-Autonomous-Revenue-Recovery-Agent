import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Customer } from '../types';
import { api } from '../lib/api';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await api.getCustomers();
        setCustomers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (selectedTier !== 'ALL' && c.tier !== selectedTier) return false;
    return true;
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">PLATINUM</span>;
      case 'GOLD':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">GOLD</span>;
      case 'SILVER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">SILVER</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-50 text-slate-600 border border-slate-200">BRONZE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Customer 360 Profiles</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
              {customers.length} Profiles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical transaction metrics, lifetime value (LTV), and customer risk scoring.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Filter Tier:</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none"
          >
            <option value="ALL">All Tiers</option>
            <option value="PLATINUM">Platinum</option>
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
            <option value="BRONZE">Bronze</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Lifetime Value</th>
                <th className="py-3 px-4">Success Ratio</th>
                <th className="py-3 px-4">Tenure</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => {
                const total = c.totalTransactions || 1;
                const rate = ((c.successfulTransactions / total) * 100).toFixed(0);

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                    </td>
                    <td className="py-3 px-4">{getTierBadge(c.tier)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{c.lifetimeValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-emerald-700">
                        {rate}% ({c.successfulTransactions}/{c.totalTransactions})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {c.tenureMonths} mos
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        c.riskScore > 60 ? 'bg-rose-50 text-rose-700 border border-rose-200' : c.riskScore > 30 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {c.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {c.preferredChannel}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
