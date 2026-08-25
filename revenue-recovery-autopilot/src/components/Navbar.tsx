import React from 'react';
import { ShieldCheck, Sparkles, RefreshCw, Zap, ExternalLink } from 'lucide-react';
import { SystemStatus } from '../lib/api';

interface NavbarProps {
  status: SystemStatus | null;
  onOpenSimulation: () => void;
  onResetData: () => void;
  isResetting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  onOpenSimulation,
  onResetData,
  isResetting = false
}) => {
  return (
    <header id="app-header" className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center shrink-0">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-black text-sm shrink-0">
            R
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-base font-bold leading-none text-slate-900">
                Revenue Recovery Autopilot
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                Track 03
              </span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
              AI Agent • Razorpay Buildathon 2026
            </span>
          </div>
        </div>

        {/* Status Indicators & Action CTA */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Demo Mode / Real Razorpay Badge */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-medium text-amber-700 whitespace-nowrap">
              {status?.razorpay.isRealTestApi ? 'RAZORPAY TEST API' : 'DEMO MODE (SYNTHETIC)'}
            </span>
          </div>

          {/* AI Status */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
            <Sparkles className="w-3 h-3 text-slate-600" />
            <span className="text-slate-500 text-[11px]">AI:</span>
            <span className="font-semibold text-slate-800 text-[11px]">gemini-3.7-flash</span>
          </div>

          {/* Safety Gate */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Safety Gate Active</span>
          </div>

          {/* Reset Batch CTA */}
          <button
            id="reset-batch-btn"
            onClick={onResetData}
            disabled={isResetting}
            className="p-1.5 sm:p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            title="Reset dataset (105 synthetic cases)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          </button>

          {/* Primary Black Button */}
          <button
            id="run-full-simulation-btn"
            onClick={onOpenSimulation}
            className="bg-black hover:bg-slate-800 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md font-medium transition-opacity flex items-center space-x-1.5 shadow-sm active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Run Full Recovery Simulation</span>
            <span className="sm:hidden">Simulation</span>
          </button>
        </div>
      </div>
    </header>
  );
};
