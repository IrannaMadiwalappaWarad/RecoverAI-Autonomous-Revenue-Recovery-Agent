import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Bot, 
  BarChart3, 
  ScrollText, 
  Users, 
  SlidersHorizontal,
  ArrowUpRight
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'revenue-risk' 
  | 'recovery-agent' 
  | 'recovery-evaluation' 
  | 'audit-trail' 
  | 'customers' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingEscalationsCount?: number;
  revenueAtRiskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingEscalationsCount = 0,
  revenueAtRiskCount = 0
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Recovered Revenue'
    },
    {
      id: 'revenue-risk' as NavTab,
      label: 'Revenue Risk',
      icon: AlertTriangle,
      description: 'Detect & Filter Slipping Cases',
      badge: revenueAtRiskCount > 0 ? `${revenueAtRiskCount}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'recovery-agent' as NavTab,
      label: 'Recovery Agent',
      icon: Bot,
      description: 'AI Diagnosis & Track 03 Pipeline',
      badge: pendingEscalationsCount > 0 ? `${pendingEscalationsCount} Approval` : undefined,
      badgeColor: 'bg-orange-100 text-orange-800 animate-pulse'
    },
    {
      id: 'recovery-evaluation' as NavTab,
      label: 'Recovery Evaluation',
      icon: BarChart3,
      description: 'Batch Performance & Metrics'
    },
    {
      id: 'audit-trail' as NavTab,
      label: 'Audit Trail',
      icon: ScrollText,
      description: 'Immutable Decision Logs'
    },
    {
      id: 'customers' as NavTab,
      label: 'Customers',
      icon: Users,
      description: 'Customer 360 & Profiles'
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: SlidersHorizontal,
      description: 'Safety Policy & Razorpay Config'
    }
  ];

  return (
    <aside id="app-sidebar" className="w-full lg:w-60 bg-white text-slate-700 flex-shrink-0 border-r border-slate-200 p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 ml-2">
          Main Menu
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left font-medium transition-colors text-sm ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-200 text-slate-900' : item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Health Check Card */}
      <div className="mt-8 p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          System Health Check
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600">Recovery Agent</span>
          <span className="text-emerald-600 font-bold">ACTIVE</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600">Safety Policy</span>
          <span className="text-slate-900 font-semibold">10 RULES</span>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
          <span className="text-slate-500">Track 03 Autopilot</span>
          <span className="font-mono text-slate-700">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
