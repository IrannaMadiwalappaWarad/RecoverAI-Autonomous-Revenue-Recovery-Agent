import React, { useEffect, useState } from 'react';
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  CreditCard, 
  RotateCcw, 
  Save, 
  Check, 
  AlertCircle,
  ExternalLink,
  Lock,
  Zap
} from 'lucide-react';
import { PolicyConfig } from '../types';
import { SystemStatus, api } from '../lib/api';

interface SettingsPageProps {
  status: SystemStatus | null;
  onResetData: () => void;
  isResetting?: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  status,
  onResetData,
  isResetting = false
}) => {
  const [policy, setPolicy] = useState<PolicyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const p = await api.getPolicy();
        setPolicy(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updatePolicy(policy);
      setPolicy(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !policy) {
    return <div className="p-8 text-center text-slate-500">Loading settings & safety parameters...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Safety Policy & Settings</h2>
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Enforced
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure autonomous agent safety guardrails, human-in-the-loop escalation thresholds, and Razorpay connectivity.
        </p>
      </div>

      {/* Safety Policy Guardrails Form */}
      <form onSubmit={handleSavePolicy} className="p-5 rounded-lg border border-slate-200 bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-slate-900" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Autonomous Safety Policy Engine</h3>
          </div>
          {savedSuccess && (
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Guardrails Active</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Max Auto Recovery Amount */}
          <div className="space-y-1.5">
            <label className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
              Max Auto-Recovery Amount (₹ INR)
            </label>
            <input
              type="number"
              value={policy.maxAutoRecoveryAmount}
              onChange={(e) => setPolicy({ ...policy, maxAutoRecoveryAmount: Number(e.target.value) })}
              min={100}
              max={100000}
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Transactions exceeding this amount strictly require manual merchant approval before outreach.
            </p>
          </div>

          {/* Min Auto Probability */}
          <div className="space-y-1.5">
            <label className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
              Min Auto-Probability Threshold (%)
            </label>
            <input
              type="number"
              value={policy.minAutoProbability}
              onChange={(e) => setPolicy({ ...policy, minAutoProbability: Number(e.target.value) })}
              min={10}
              max={99}
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Only cases with ML probability at or above this threshold will execute without escalation.
            </p>
          </div>

          {/* Max Attempts */}
          <div className="space-y-1.5">
            <label className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
              Max Retry / Recovery Attempts Limit
            </label>
            <input
              type="number"
              value={policy.maxAttemptsLimit ?? policy.maxAttemptsPerCustomer ?? 2}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPolicy({ ...policy, maxAttemptsLimit: val, maxAttemptsPerCustomer: val });
              }}
              min={1}
              max={5}
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Hard ceiling on recovery interventions per checkout to prevent customer spamming.
            </p>
          </div>

          {/* Cooldown Hours */}
          <div className="space-y-1.5">
            <label className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
              Cooldown Window Between Attempts (Hours)
            </label>
            <input
              type="number"
              value={policy.cooldownHoursBetweenAttempts ?? 24}
              onChange={(e) => setPolicy({ ...policy, cooldownHoursBetweenAttempts: Number(e.target.value) })}
              min={1}
              max={72}
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Minimum time required before secondary reminders or alternative link delivery.
            </p>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={policy.requireMerchantApprovalForHighValue ?? policy.requireHighValueApproval ?? true}
              onChange={(e) => {
                const checked = e.target.checked;
                setPolicy({ ...policy, requireMerchantApprovalForHighValue: checked, requireHighValueApproval: checked });
              }}
              className="w-4 h-4 rounded text-black focus:ring-0 border-slate-300"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 block">Escalate high-value transactions (&gt;₹5,000) for human merchant sign-off</span>
              <span className="text-slate-500">Prevents automatic execution on large corporate or custom wholesale orders.</span>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={policy.blockFraudSuspects ?? policy.preventFraudSuspectAction ?? true}
              onChange={(e) => {
                const checked = e.target.checked;
                setPolicy({ ...policy, blockFraudSuspects: checked, preventFraudSuspectAction: checked });
              }}
              className="w-4 h-4 rounded text-black focus:ring-0 border-slate-300"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 block">Automatically block fraud risk indicators</span>
              <span className="text-slate-500">Blocks cases with flagged velocity or mismatched billing signals.</span>
            </div>
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md text-xs font-medium bg-black hover:bg-slate-800 text-white shadow-sm transition-opacity flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Safety Guardrails'}</span>
          </button>
        </div>
      </form>

      {/* Razorpay Connectivity Section */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-slate-900" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Razorpay API Integration</h3>
        </div>

        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Integration Mode:</span>
            <span className="font-mono font-bold text-slate-900">
              {status?.razorpay.modeLabel || 'DEMO / SYNTHETIC MODE (High-Fidelity)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Key ID Configured:</span>
            <span className="font-mono text-slate-700">
              {status?.razorpay.keyIdMasked || 'None (Running in synthetic test mode)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">API Endpoint Target:</span>
            <span className="font-mono text-slate-600">https://api.razorpay.com/v1/payment_links</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          The application safely uses Razorpay TEST MODE keys via environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).
          When keys are omitted, the app operates in high-fidelity Demo / Synthetic mode for complete offline demonstration.
        </p>
      </div>

      {/* Dataset Reset Section */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Reset Synthetic Test Benchmark</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset the in-memory database to the original 105 synthetic merchant cases for benchmark reproducibility.
          </p>
        </div>

        <button
          onClick={onResetData}
          disabled={isResetting}
          className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting Data...' : 'Reset to 105 Seed Cases'}</span>
        </button>
      </div>
    </div>
  );
};
