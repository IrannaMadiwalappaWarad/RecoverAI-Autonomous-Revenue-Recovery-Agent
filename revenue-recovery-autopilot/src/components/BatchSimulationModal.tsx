import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Bot, 
  ArrowRight, 
  Clock, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { BatchEvaluationMetrics } from '../types';

interface BatchSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationComplete: () => void;
}

export const BatchSimulationModal: React.FC<BatchSimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulationComplete
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('Ready to start batch analysis');
  const [metrics, setMetrics] = useState<BatchEvaluationMetrics | null>(null);
  const [logs, setLogs] = useState<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'block' }[]>([]);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setProgress(5);
    setLogs([]);
    setMetrics(null);

    const appendLog = (text: string, type: 'info' | 'success' | 'warn' | 'block' = 'info') => {
      const now = new Date().toLocaleTimeString();
      setLogs(prev => [{ id: Math.random().toString(), time: now, text, type }, ...prev.slice(0, 15)]);
    };

    // Step 1: Detect
    setCurrentStep('1. Detecting 105 revenue-at-risk merchant cases...');
    appendLog('Revenue Risk Detection: Scanned 105 failed & abandoned checkout events.', 'info');
    setProgress(15);
    await new Promise(r => setTimeout(r, 600));

    // Step 2: Diagnose
    setCurrentStep('2. Running AI root-cause diagnosis (Gemini 3.7 Flash & explainable ML)...');
    appendLog('AI Diagnosis: Evaluated customer tenure, LTV, failure category, and prior attempt decay.', 'info');
    setProgress(35);
    await new Promise(r => setTimeout(r, 800));

    // Step 3: Decide & Safety Gate
    setCurrentStep('3. Applying Policy Gate checks (₹5,000 auto limit, anti-fraud rules)...');
    appendLog('Policy Engine: Evaluated 10 Golden Safety Rules. Held high-value transactions for approval.', 'warn');
    setProgress(55);
    await new Promise(r => setTimeout(r, 700));

    // Step 4: Act (Razorpay Test Links)
    setCurrentStep('4. Dispatching Razorpay TEST Mode Payment Links & smart follow-ups...');
    appendLog('Razorpay Action: Generated payment links with 24h expiry and automatic reminder notices.', 'info');
    setProgress(75);
    await new Promise(r => setTimeout(r, 700));

    // Step 5: Verify & Measure
    setCurrentStep('5. Verifying payment captures and computing final recovered revenue...');
    setProgress(90);

    try {
      const res = await api.runBatchSimulation();
      setMetrics(res.metrics);
      setProgress(100);
      setCurrentStep('Batch Recovery Complete! Measured revenue calculated.');
      appendLog(`Simulation Complete: Successfully recovered ₹${res.recoveredAmount.toLocaleString('en-IN')} across ${res.recoveredCount} cases!`, 'success');
      triggerConfetti();
      onSimulationComplete();
    } catch (err: any) {
      appendLog(`Batch simulation encountered an error: ${err.message}`, 'block');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Batch Recovery Simulation</h3>
              <p className="text-[11px] text-slate-500">Autonomous Track 03 Pipeline Evaluation (105 Cases)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Track 03 Pipeline Steps Banner */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Workflow Stages</span>
              <span className="text-slate-900 font-mono text-xs">105 Synthetic Cases</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
              <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-800">1. DETECT</div>
              <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-800">2. DIAGNOSE</div>
              <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-800">3. GATE & ACT</div>
              <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-800">4. VERIFY</div>
              <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-800">5. MEASURE</div>
            </div>
          </div>

          {/* Progress Bar & Current Status */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-700">{currentStep}</span>
              <span className="text-slate-900 font-mono font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-black h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Simulation Results Metrics (When Done) */}
          {metrics && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs uppercase tracking-wider">Batch Results Summary</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {metrics.recoveryRatePercentage}% Recovery Rate
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Recovered</span>
                  <span className="text-base font-mono font-bold text-emerald-600">
                    ₹{metrics.revenueActuallyRecovered.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Success</span>
                  <span className="text-base font-mono font-bold text-slate-900">
                    {metrics.successfulRecoveries}
                  </span>
                </div>
                <div className="p-3 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Blocked</span>
                  <span className="text-base font-mono font-bold text-rose-600">
                    {metrics.blockedActions}
                  </span>
                </div>
                <div className="p-3 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Escalated</span>
                  <span className="text-base font-mono font-bold text-amber-600">
                    {metrics.escalatedCases}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Activity Ticker */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agent Execution Stream</h4>
            <div className="h-32 overflow-y-auto bg-slate-900 rounded-md p-3 space-y-1 font-mono text-[11px] text-slate-300 border border-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-500 py-3 text-center">Click "Start 60-Second Batch Simulation" below to begin.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2">
                    <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-400 font-semibold'
                          : log.type === 'warn'
                          ? 'text-amber-300'
                          : log.type === 'block'
                          ? 'text-rose-400'
                          : 'text-slate-200'
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            {metrics ? 'Close & View Dashboard' : 'Cancel'}
          </button>

          <button
            id="start-simulation-trigger-btn"
            onClick={handleStartSimulation}
            disabled={isRunning}
            className="px-4 py-2 rounded-md text-xs font-medium bg-black hover:bg-slate-800 text-white shadow-sm transition-opacity flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Processing 105 Cases...' : 'Start 60-Second Batch Simulation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
