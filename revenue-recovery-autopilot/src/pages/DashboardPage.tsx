import React from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Percent, 
  FileSearch, 
  ShieldAlert, 
  ExternalLink,
  Bot,
  ArrowUpRight,
  Sparkles,
  Zap,
  CreditCard
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { DashboardStats, RecoveryCase } from '../types';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardPageProps {
  stats: DashboardStats | null;
  cases: RecoveryCase[];
  onSelectCase: (c: RecoveryCase) => void;
  onOpenSimulation: () => void;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  cases,
  onSelectCase,
  onOpenSimulation
}) => {
  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        Loading merchant telemetry and calculated recovery metrics...
      </div>
    );
  }

  const recentCases = cases.slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Welcome / Action Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Merchant Revenue Overview
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              Live Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Autonomous detection, Gemini 3.7 Flash diagnosis, policy gating, and Razorpay TEST Mode recovery actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSimulation}
            className="bg-black hover:bg-slate-800 text-white px-4 py-2 text-xs sm:text-sm rounded-md font-medium transition-opacity flex items-center space-x-1.5 shadow-sm active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Run Batch Simulation</span>
          </button>
        </div>
      </div>

      {/* 6 Core KPI Cards (Dynamically Calculated) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KPICard
          id="kpi-revenue-at-risk"
          title="Revenue at Risk"
          value={`₹${stats.revenueAtRisk.toLocaleString('en-IN')}`}
          subtitle={`${stats.totalCases} Total Cases`}
          icon={AlertTriangle}
          variant="rose"
        />
        <KPICard
          id="kpi-recoverable-revenue"
          title="Recoverable"
          value={`₹${stats.recoverableRevenue.toLocaleString('en-IN')}`}
          subtitle="Prob. ≥ 50%"
          icon={TrendingUp}
          variant="blue"
        />
        <KPICard
          id="kpi-revenue-recovered"
          title="Recovered"
          value={`₹${stats.revenueRecovered.toLocaleString('en-IN')}`}
          subtitle="Verified Capture"
          icon={CheckCircle2}
          variant="emerald"
        />
        <KPICard
          id="kpi-recovery-rate"
          title="Recovery Rate"
          value={`${stats.recoveryRate}%`}
          subtitle="Recovered / Risk"
          icon={Percent}
          variant="slate"
        />
        <KPICard
          id="kpi-cases-analyzed"
          title="Cases Analyzed"
          value={stats.casesAnalyzed}
          subtitle="AI Diagnosed"
          icon={FileSearch}
          variant="slate"
        />
        <KPICard
          id="kpi-successful-recoveries"
          title="Success Cases"
          value={stats.successfulRecoveries}
          subtitle={`${stats.blockedActions} Blocked`}
          icon={ShieldAlert}
          variant="slate"
        />
      </div>

      {/* Analytics Row: Trend Chart & Agent Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Revenue at Risk vs Recovered Over Time */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recovery vs Risk Trend (Daily)
              </span>
              <p className="text-[11px] text-slate-500">7-Day trend of detected risk vs measured recovery</p>
            </div>
            <div className="flex gap-4 text-[10px]">
              <div className="flex items-center gap-1.5 font-medium text-slate-600">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div> Recovered
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-600">
                <div className="w-2.5 h-2.5 bg-slate-300 rounded-sm"></div> At Risk
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timeline}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }}
                />
                <Area type="monotone" dataKey="atRisk" name="Revenue at Risk (₹)" stroke="#94A3B8" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="recovered" name="Revenue Recovered (₹)" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRec)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Agent Activity Log */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-lg p-4 sm:p-5 flex flex-col justify-between border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Agent Activity Log</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Autonomous Gate</span>
            </div>
            <div className="text-[11px] font-mono space-y-2 overflow-hidden leading-relaxed">
              <div className="text-emerald-400">[14:32:04] Case #RR-1021 detected. Amount: ₹2,499.</div>
              <div className="text-slate-300">[14:32:06] AI Diagnosis: Insufficient funds on initial retry.</div>
              <div className="text-blue-300">[14:32:07] Policy Check: PASSED. Score: 87%.</div>
              <div className="text-slate-300">[14:32:08] Created Razorpay TEST Link: pay_Lzk82n...</div>
              <div className="text-emerald-400">[14:34:11] Payment verified via webhook. SUCCESS.</div>
              <div className="text-slate-400 opacity-75">[14:35:01] Case #RR-1022 analyzed. Escalated (₹48,000).</div>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Safety Gate: ₹5,000 Auto Ceiling</span>
            <span className="text-emerald-400 font-semibold">100% Policy Bound</span>
          </div>
        </div>
      </div>

      {/* Secondary Metric Breakdown Visuals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Failure Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revenue Loss by Failure</span>
            <p className="text-[10px] text-slate-500">Top failure reasons by slipping amount</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.failureDistribution.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={9} tickFormatter={(v) => `₹${v / 1000}k`} tickLine={false} />
                <YAxis dataKey="reason" type="category" stroke="#94A3B8" fontSize={9} width={90} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Loss Amount']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="amount" name="Loss Amount (₹)" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recovery Actions</span>
            <span className="text-[10px] text-slate-500 font-mono">{stats.casesAnalyzed} Cases</span>
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.actionsDistribution}
                  dataKey="count"
                  nameKey="action"
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={52}
                  paddingAngle={3}
                >
                  {stats.actionsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-xs">
            {stats.actionsDistribution.slice(0, 3).map((act, i) => (
              <div key={act.action} className="flex items-center justify-between text-slate-600 text-[11px]">
                <div className="flex items-center space-x-1.5 truncate">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{act.action.replace(/_/g, ' ')}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{act.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcome Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Outcome Breakdown</span>
            <span className="text-[10px] text-slate-500 font-mono">Status %</span>
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.outcomeBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={52}
                  paddingAngle={3}
                >
                  {stats.outcomeBreakdown.map((entry, index) => (
                    <Cell key={`cell-out-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-xs">
            {stats.outcomeBreakdown.slice(0, 3).map((out, i) => (
              <div key={out.status} className="flex items-center justify-between text-slate-600 text-[11px]">
                <div className="flex items-center space-x-1.5 truncate">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
                  <span className="truncate">{out.status.replace(/_/g, ' ')}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{out.count} ({out.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section: Revenue Risk Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Revenue Risk Management</h3>
          <div className="flex gap-2">
            <span className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-600">
              {cases.length} Tracked Cases
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Case ID</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Prob.</th>
                  <th className="px-4 py-2.5">Recommended Action</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {recentCases.map((c) => {
                  const prob = c.aiDiagnosis?.recoveryProbability ?? c.recoveryProbability;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{c.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {c.customer.name}{' '}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({c.customer.segment})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ₹{c.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={prob >= 70 ? 'text-green-600' : prob >= 40 ? 'text-amber-600' : 'text-slate-400'}>
                          {prob}%
                        </span>
                      </td>
                      <td className="px-4 py-3 italic text-slate-600">
                        {c.recommendedAction ? c.recommendedAction.replace(/_/g, ' ') : 'Pending Diagnosis'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge type="status" value={c.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent High-Priority Cases Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Revenue-at-Risk Cases</h3>
            <p className="text-xs text-slate-500">High priority checkout drop-offs requiring intervention</p>
          </div>
          <span className="text-xs font-semibold text-slate-600">Showing {recentCases.length} of {cases.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-3">Case ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Failure Reason</th>
                <th className="pb-3">Probability</th>
                <th className="pb-3">Risk Level</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 font-mono font-bold text-slate-900">{c.id}</td>
                  <td className="py-3.5">
                    <div className="font-semibold text-slate-900">{c.customer.name}</div>
                    <div className="text-[11px] text-slate-500">{c.customer.email}</div>
                  </td>
                  <td className="py-3.5 font-extrabold text-slate-900">
                    ₹{c.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5">
                    <span className="text-rose-700 font-semibold">{c.failureReason}</span>
                  </td>
                  <td className="py-3.5 font-bold text-blue-700">
                    {c.aiDiagnosis?.recoveryProbability ?? c.recoveryProbability}%
                  </td>
                  <td className="py-3.5">
                    <StatusBadge type="risk" value={c.riskLevel} />
                  </td>
                  <td className="py-3.5">
                    <StatusBadge type="status" value={c.status} />
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    >
                      Inspect Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
