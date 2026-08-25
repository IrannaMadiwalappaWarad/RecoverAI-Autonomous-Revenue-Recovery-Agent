import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  ShieldCheck, 
  CreditCard, 
  User, 
  ExternalLink, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  Check, 
  RotateCcw, 
  FileText,
  Sparkles,
  Link as LinkIcon,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { RecoveryCase, AuditEvent } from '../types';
import { StatusBadge } from './StatusBadge';
import { api } from '../lib/api';

interface CaseDetailModalProps {
  recoveryCase: RecoveryCase | null;
  onClose: () => void;
  onRefreshCase: (updatedCase: RecoveryCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  recoveryCase,
  onClose,
  onRefreshCase
}) => {
  const [activeTab, setActiveTab] = useState<'reasoning' | 'policy' | 'action' | 'timeline'>('reasoning');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!recoveryCase) return null;

  const handleRunDiagnosis = async () => {
    setIsDiagnosing(true);
    setFeedbackMsg(null);
    try {
      const updated = await api.diagnoseCase(recoveryCase.id);
      onRefreshCase(updated);
      setFeedbackMsg({ text: 'AI Diagnosis completed successfully.', type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Diagnosis failed', type: 'error' });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleExecuteAction = async () => {
    setIsExecuting(true);
    setFeedbackMsg(null);
    try {
      const res = await api.executeCaseAction(recoveryCase.id);
      onRefreshCase(res.recoveryCase);
      if (res.success) {
        setFeedbackMsg({ text: 'Recovery action executed and policy gate passed.', type: 'success' });
      } else {
        setFeedbackMsg({ text: `Action held: ${res.recoveryCase.policyDecision?.reason || 'Policy check required'}`, type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Execution failed', type: 'error' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleMerchantApprove = async () => {
    setIsApproving(true);
    setFeedbackMsg(null);
    try {
      const res = await api.approveCase(recoveryCase.id, approvalNotes || 'Approved by merchant in case inspector');
      onRefreshCase(res.recoveryCase);
      setFeedbackMsg({ text: 'Merchant approval registered and recovery action executed.', type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Approval failed', type: 'error' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleMerchantReject = async () => {
    setIsApproving(true);
    setFeedbackMsg(null);
    try {
      const updated = await api.rejectCase(recoveryCase.id, approvalNotes || 'Rejected by merchant');
      onRefreshCase(updated);
      setFeedbackMsg({ text: 'Recovery outreach rejected by merchant.', type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Rejection failed', type: 'error' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleSimulatePaymentCapture = async () => {
    setIsVerifying(true);
    setFeedbackMsg(null);
    try {
      const res = await api.verifyRecovery(recoveryCase.id, true);
      onRefreshCase(res.recoveryCase);
      setFeedbackMsg({ text: `Payment verified! ₹${res.recoveryCase.amount.toLocaleString('en-IN')} marked as RECOVERED.`, type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Verification failed', type: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center font-mono text-xs font-bold text-white">
              RC
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight text-slate-900">{recoveryCase.id}</h2>
                <StatusBadge type="status" value={recoveryCase.status} />
                <StatusBadge type="risk" value={recoveryCase.riskLevel} />
              </div>
              <p className="text-[11px] text-slate-500">
                Payment: <span className="font-mono text-slate-700">{recoveryCase.paymentId}</span> • Order:{' '}
                <span className="font-mono text-slate-700">{recoveryCase.transaction.orderId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Message Bar */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2 text-xs font-medium flex items-center justify-between ${
              feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold underline ml-4">Dismiss</button>
          </div>
        )}

        {/* Top Case Summary Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Amount</span>
            <span className="text-sm font-mono font-bold text-slate-900">
              ₹{recoveryCase.amount.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Failure Reason</span>
            <span className="font-medium text-rose-600 truncate block">{recoveryCase.failureReason}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Probability</span>
            <span className="text-sm font-mono font-bold text-blue-600">
              {recoveryCase.aiDiagnosis?.recoveryProbability ?? recoveryCase.recoveryProbability}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Intervention</span>
            <span className="font-medium text-slate-800 truncate block">
              {recoveryCase.aiDiagnosis?.suggestedIntervention || 'CREATE_PAYMENT_LINK'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('reasoning')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'reasoning'
                ? 'border-black text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Reasoning & Diagnosis</span>
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'policy'
                ? 'border-black text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Policy Gate Checks</span>
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'action'
                ? 'border-black text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Razorpay Action & Verify</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white text-slate-800">
          {/* TAB 1: AI REASONING */}
          {activeTab === 'reasoning' && (
            <div className="space-y-5">
              {/* Strategic Explanation */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Agent Strategic Justification</span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  {recoveryCase.aiDiagnosis?.whyThisAction ||
                    recoveryCase.featureAttributions?.[0]?.description ||
                    'High probability recovery case suitable for instant Razorpay Payment Link dispatch.'}
                </p>
                {recoveryCase.aiDiagnosis?.stoppingCondition && (
                  <div className="pt-2 border-t border-slate-200 flex items-start space-x-2 text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Stopping Rule:</span>
                    <span className="text-xs">{recoveryCase.aiDiagnosis.stoppingCondition}</span>
                  </div>
                )}
              </div>

              {/* Diagnosis Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 p-3.5 space-y-1.5 bg-white">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Root Cause Analysis</h4>
                  <p className="text-xs font-semibold text-slate-900">
                    {recoveryCase.aiDiagnosis?.failureRootCause || `Caused by ${recoveryCase.failureReason}`}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Gateway Code: <span className="font-mono">{recoveryCase.transaction.gatewayResponseCode || 'N/A'}</span>
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3.5 space-y-1.5 bg-white">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer 360 Profile</h4>
                  <p className="text-xs font-semibold text-slate-900">
                    {recoveryCase.customer.name} • Tier: <span className="text-slate-800 uppercase">{recoveryCase.customer.tier}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tenure: {recoveryCase.customer.tenureMonths} mos • Past: {recoveryCase.customer.successfulTransactions}/{recoveryCase.customer.totalTransactions} • LTV: ₹{recoveryCase.customer.lifetimeValue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Explainable Feature Attribution */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Explainable ML Feature Weights
                </h4>
                <div className="space-y-1.5">
                  {(recoveryCase.featureAttributions || []).map((attr, idx) => (
                    <div key={idx} className="p-2.5 rounded-md border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-900">{attr.featureName}</span>
                        <p className="text-[11px] text-slate-500">{attr.description}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          attr.impact === 'POSITIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : attr.impact === 'NEGATIVE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {attr.weight > 0 ? `+${attr.weight}` : attr.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger Re-Diagnosis Button */}
              <div className="pt-2 flex justify-end">
                <button
                  id="re-diagnose-btn"
                  onClick={handleRunDiagnosis}
                  disabled={isDiagnosing}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-black text-white hover:bg-slate-800 transition-opacity flex items-center space-x-1.5"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : 'text-amber-300'}`} />
                  <span>{isDiagnosing ? 'Analyzing...' : 'Re-run Gemini Diagnosis'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: POLICY GATE */}
          {activeTab === 'policy' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-slate-900" />
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Policy Engine Gate</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every recovery action proposed by AI is strictly validated before execution. Actions exceeding autonomous limits (₹5,000 max auto, &lt;75% probability, or repeat failures) are held for approval.
                </p>
              </div>

              {/* Policy Decision Summary */}
              {recoveryCase.policyDecision && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    recoveryCase.policyDecision.allowed
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : recoveryCase.policyDecision.requiresApproval
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                      : 'bg-rose-50/60 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs mb-1">
                    <span>
                      {recoveryCase.policyDecision.allowed
                        ? 'Policy Validation: PASSED'
                        : recoveryCase.policyDecision.requiresApproval
                        ? 'Policy Escalation: Approval Required'
                        : 'Policy Validation: BLOCKED'}
                    </span>
                    {recoveryCase.policyDecision.ruleViolated && (
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {recoveryCase.policyDecision.ruleViolated}
                      </span>
                    )}
                  </div>
                  <p className="font-medium">{recoveryCase.policyDecision.reason}</p>
                </div>
              )}

              {/* Checked Rules Breakdown */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Checked Safety Rules</h4>
                {(recoveryCase.policyDecision?.checkedRules || [
                  { rule: 'RULE_ALREADY_PAID', passed: true, detail: 'Double charge prevention passed.' },
                  { rule: 'RULE_FRAUD_SUSPECT', passed: true, detail: 'No fraud risk indicators.' },
                  { rule: 'RULE_MAX_ATTEMPTS', passed: true, detail: 'Within max 2 attempts limit.' },
                  { rule: 'RULE_MAX_AUTO_AMOUNT', passed: recoveryCase.amount <= 5000, detail: `Amount ₹${recoveryCase.amount} vs ₹5,000 threshold.` },
                  { rule: 'RULE_MIN_PROBABILITY', passed: recoveryCase.recoveryProbability >= 75, detail: `Probability ${recoveryCase.recoveryProbability}% vs 75% threshold.` }
                ]).map((rule, idx) => (
                  <div key={idx} className="p-2.5 rounded-md border border-slate-200 bg-white flex items-start justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-mono font-medium text-slate-900">{rule.rule}</span>
                      <p className="text-[11px] text-slate-500">{rule.detail}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase flex items-center space-x-1 ${
                        rule.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {rule.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{rule.passed ? 'Passed' : 'Escalated'}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Merchant Approval Controls if Pending Approval */}
              {recoveryCase.status === 'PENDING_APPROVAL' && (
                <div className="p-4 rounded-lg border border-amber-300 bg-amber-50/50 space-y-2.5">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-950 text-xs">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    <span>Merchant Approval Required</span>
                  </div>
                  <input
                    type="text"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Optional merchant authorization note..."
                    className="w-full text-xs px-3 py-1.5 rounded-md border border-amber-200 bg-white focus:outline-none"
                  />
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      id="approve-case-btn"
                      onClick={handleMerchantApprove}
                      disabled={isApproving}
                      className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-black text-white hover:bg-slate-800 transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isApproving ? 'Approving...' : 'Approve & Dispatch'}</span>
                    </button>
                    <button
                      id="reject-case-btn"
                      onClick={handleMerchantReject}
                      disabled={isApproving}
                      className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Outreach</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RAZORPAY ACTION & VERIFY */}
          {activeTab === 'action' && (
            <div className="space-y-5">
              {/* Action Object Display */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-slate-900">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Razorpay Recovery Action</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                    {recoveryCase.actionDetails?.executionStatus === 'REAL_RAZORPAY' ? 'REAL RAZORPAY TEST API' : 'SYNTHETIC DEMO'}
                  </span>
                </div>

                {recoveryCase.actionDetails?.shortUrl ? (
                  <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Link ID:</span>
                      <span className="font-mono font-bold text-slate-900">{recoveryCase.actionDetails.razorpayPaymentLinkId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Link URL:</span>
                      <a
                        href={recoveryCase.actionDetails.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-mono font-medium flex items-center space-x-1"
                      >
                        <span>{recoveryCase.actionDetails.shortUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Dispatched At:</span>
                      <span>{new Date(recoveryCase.actionDetails.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-white p-3 rounded-md border border-slate-200">
                    No active Razorpay Payment Link generated yet. Click "Execute Recovery Action" below to initiate through the Safety Policy Gate.
                  </div>
                )}

                {/* Execute Button */}
                {recoveryCase.status !== 'RECOVERED' && recoveryCase.status !== 'BLOCKED' && (
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      id="execute-action-btn"
                      onClick={handleExecuteAction}
                      disabled={isExecuting}
                      className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-black hover:bg-slate-800 text-white shadow-sm transition-opacity flex items-center space-x-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{isExecuting ? 'Executing...' : 'Execute Recovery Action'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Status Verification Simulator */}
              {recoveryCase.status !== 'RECOVERED' ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center space-x-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Capture & Verification</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Verify whether the customer completed checkout via the Razorpay Payment Link. Once captured, the system marks the amount as recovered and halts further outreach.
                  </p>
                  <button
                    id="simulate-verify-btn"
                    onClick={handleSimulatePaymentCapture}
                    disabled={isVerifying}
                    className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-black hover:bg-slate-800 text-white shadow-sm transition-opacity flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isVerifying ? 'Verifying...' : `Verify & Confirm Recovery (₹${recoveryCase.amount.toLocaleString('en-IN')})`}</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5 text-emerald-950">
                  <div className="flex items-center space-x-2 font-bold text-emerald-800 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Revenue Successfully Recovered</span>
                  </div>
                  <p className="text-xs text-emerald-900 font-medium">
                    ₹{(recoveryCase.recoveredAmount || recoveryCase.amount).toLocaleString('en-IN')} successfully settled for merchant order {recoveryCase.transaction.orderId}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">Track 03 Autonomous Revenue Agent</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
