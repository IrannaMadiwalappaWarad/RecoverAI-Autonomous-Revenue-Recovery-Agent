import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  Play, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
  Code
} from 'lucide-react';
import { RecoveryCase } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';

interface RecoveryAgentPageProps {
  cases: RecoveryCase[];
  onSelectCase: (c: RecoveryCase) => void;
  onRefreshData: () => void;
}

export const RecoveryAgentPage: React.FC<RecoveryAgentPageProps> = ({
  cases,
  onSelectCase,
  onRefreshData
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'tools'>('visual');
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  const handleRunAI = async () => {
    if (!currentCase) return;
    setIsRunningAI(true);
    setFeedback(null);
    try {
      const updated = await api.diagnoseCase(currentCase.id);
      onRefreshData();
      setFeedback(`AI Agent diagnosis completed successfully for case ${updated.id}.`);
    } catch (e: any) {
      setFeedback(`Diagnosis error: ${e.message}`);
    } finally {
      setIsRunningAI(false);
    }
  };

  const track03Steps = [
    { title: '1. DETECT', desc: 'Identify slipping merchant revenue & checkout drop-offs', color: 'bg-blue-500' },
    { title: '2. DIAGNOSE', desc: 'Root cause analysis with Gemini 3.7 Flash & customer context', color: 'bg-indigo-500' },
    { title: '3. DECIDE', desc: 'Calculate recovery probability & select intervention strategy', color: 'bg-purple-500' },
    { title: '4. SAFETY GATE', desc: 'Policy Engine strictly checks ₹5k limit & fraud constraints', color: 'bg-amber-500' },
    { title: '5. ACT', desc: 'Execute Razorpay TEST Mode Payment Link or smart retry', color: 'bg-cyan-500' },
    { title: '6. VERIFY', desc: 'Verify incoming payment capture status & webhook acknowledgements', color: 'bg-teal-500' },
    { title: '7. MEASURE', desc: 'Calculate exact verified revenue recovered across transactions', color: 'bg-emerald-500' },
    { title: '8. STOP', desc: 'Halt further outreach when paid or attempt limit is reached', color: 'bg-rose-500' },
    { title: '9. AUDIT', desc: 'Write immutable decision records to the compliance audit log', color: 'bg-slate-700' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Recovery Agent Hub</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              gemini-3.7-flash
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Autonomous agent pipeline for Track 03: AI Revenue Recovery with bounded Razorpay actions and policy guardrails.
          </p>
        </div>
      </div>

      {/* Visual Track 03 Architecture Flow */}
      <div className="p-4 sm:p-5 rounded-lg bg-slate-900 text-white border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-xs text-blue-400">
            <Layers className="w-4 h-4" />
            <span className="uppercase tracking-wider">Autonomous Track 03 Pipeline</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Bound by Policy Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-1.5">
          {track03Steps.map((step, idx) => (
            <div key={idx} className="p-2.5 rounded-md bg-slate-800/90 border border-slate-700/60 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                <div className={`w-1.5 h-1.5 rounded-full ${step.color}`} />
                <span className="truncate text-[10px]">{step.title}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug truncate">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Case Inspector & AI Diagnostics */}
      {currentCase && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Case Selector & Customer Info */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm space-y-3.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Select Case for Live Agent Diagnosis
              </label>
              <select
                value={currentCase.id}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.customer.name} (₹{c.amount.toLocaleString('en-IN')}) • {c.failureReason}
                  </option>
                ))}
              </select>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-500">Customer:</span>
                  <span className="text-slate-900 font-semibold">{currentCase.customer.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customer Tier:</span>
                  <span className="font-bold text-slate-800">{currentCase.customer.tier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="text-slate-700 truncate max-w-[160px]">{currentCase.transaction.itemDescription}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Amount at Risk:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">₹{currentCase.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <StatusBadge type="status" value={currentCase.status} />
                </div>
              </div>

              <button
                id="agent-run-ai-btn"
                onClick={handleRunAI}
                disabled={isRunningAI}
                className="w-full py-2 rounded-md text-xs font-medium bg-black hover:bg-slate-800 text-white shadow-sm transition-opacity flex items-center justify-center space-x-1.5 active:scale-[0.98]"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isRunningAI ? 'animate-spin' : ''}`} />
                <span>{isRunningAI ? 'Generating Diagnosis...' : 'Trigger Gemini Diagnosis'}</span>
              </button>

              {feedback && (
                <p className="text-[11px] font-medium text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-200">
                  {feedback}
                </p>
              )}
            </div>
          </div>

          {/* Right 2 Columns: Structured AI Diagnostic Output */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
              {/* Header with Switcher */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-slate-800" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    AI Diagnostic Analysis
                  </h3>
                </div>
                <div className="flex items-center space-x-1 text-xs">
                  <button
                    onClick={() => setActiveTab('visual')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'visual' ? 'bg-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'json' ? 'bg-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setActiveTab('tools')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'tools' ? 'bg-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tools
                  </button>
                </div>
              </div>

              {/* View 1: Visual Diagnostic */}
              {activeTab === 'visual' && (
                <div className="space-y-4">
                  {/* Diagnosis Hero Card */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Executive AI Summary
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        Confidence: {(currentCase.aiDiagnosis?.confidence ? currentCase.aiDiagnosis.confidence * 100 : 88).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {currentCase.aiDiagnosis?.summary ||
                        `AI Agent diagnosed actionable ${currentCase.failureCategory.toLowerCase()} failure for ${currentCase.customer.name}.`}
                    </p>
                  </div>

                  {/* 4 Core Diagnostic Variables */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Probability</span>
                      <span className="text-lg font-mono font-semibold text-blue-600">
                        {currentCase.aiDiagnosis?.recoveryProbability ?? currentCase.recoveryProbability}%
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Value</span>
                      <span className="text-lg font-mono font-semibold text-emerald-600">
                        ₹{(currentCase.aiDiagnosis?.expectedRecoveryValue || Math.round(currentCase.amount * 0.8)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Approval Required</span>
                      <span className={`text-xs font-bold ${currentCase.amount > 5000 ? 'text-amber-700' : 'text-slate-700'}`}>
                        {currentCase.amount > 5000 ? 'YES (High Value)' : 'NO (Auto-Safe)'}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Intervention</span>
                      <span className="text-[11px] font-medium text-slate-800 truncate block">
                        {currentCase.aiDiagnosis?.suggestedIntervention || 'CREATE_PAYMENT_LINK'}
                      </span>
                    </div>
                  </div>

                  {/* Why this Action */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1.5 text-xs">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                      Agent Strategic Justification
                    </span>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      {currentCase.aiDiagnosis?.whyThisAction || currentCase.featureAttributions?.[0]?.description}
                    </p>
                  </div>

                  {/* Stopping Rule */}
                  <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 space-y-1 text-xs text-rose-950">
                    <span className="font-bold text-rose-800 text-[10px] uppercase tracking-wider block">Explicit Stopping Rule:</span>
                    <p className="text-xs font-medium text-rose-900">
                      {currentCase.aiDiagnosis?.stoppingCondition ||
                        'Stop immediately when payment is captured, or after 2 attempts with no customer response.'}
                    </p>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onSelectCase(currentCase)}
                      className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-black hover:bg-slate-800 text-white shadow-sm transition-opacity flex items-center space-x-1.5"
                    >
                      <span>Open Full Case Inspector</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* View 2: Raw Structured JSON */}
              {activeTab === 'json' && (
                <div className="space-y-2">
                  <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto max-h-96 border border-slate-800">
                    <pre>
                      {JSON.stringify(
                        currentCase.aiDiagnosis || {
                          summary: `AI Agent identified ${currentCase.failureCategory} failure for ${currentCase.customer.name}`,
                          failureRootCause: `Transaction dropped due to ${currentCase.failureReason}`,
                          isRecoverable: true,
                          recoveryProbability: currentCase.recoveryProbability,
                          suggestedIntervention: 'CREATE_PAYMENT_LINK',
                          reasoning: 'Customer-actionable failure with high historical conversion rate.',
                          expectedRecoveryValue: Math.round(currentCase.amount * (currentCase.recoveryProbability / 100)),
                          requiresApproval: currentCase.amount > 5000,
                          riskLevel: currentCase.riskLevel,
                          stoppingCondition: 'Stop after 1 payment link dispatch or upon payment verification.',
                          confidence: 0.88
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* View 3: Server-Side Tool Declarations */}
              {activeTab === 'tools' && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600">
                    The Recovery Agent operates with bounded server-side tools. The Policy Engine validates authorization and safety rules prior to execution.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="font-bold text-slate-900">getPaymentDetails()</span>
                      <p className="text-slate-500 text-[11px]">Fetches transaction telemetry & gateway response code</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="font-bold text-slate-900">getCustomerHistory()</span>
                      <p className="text-slate-500 text-[11px]">Computes customer lifetime value & past success ratio</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="font-bold text-slate-900">calculateRecoveryProbability()</span>
                      <p className="text-slate-500 text-[11px]">Evaluates ML feature weights & decay penalties</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="font-bold text-slate-900">evaluatePolicy()</span>
                      <p className="text-slate-500 text-[11px]">Server safety gatekeeper checking ₹5k limits & fraud rules</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="font-bold text-slate-900">createPaymentLink()</span>
                      <p className="text-slate-500 text-[11px]">Issues Razorpay TEST Mode Payment Link</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="font-bold text-slate-900">recordAuditEvent()</span>
                      <p className="text-slate-500 text-[11px]">Writes immutable audit log entries with severity & actor</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
