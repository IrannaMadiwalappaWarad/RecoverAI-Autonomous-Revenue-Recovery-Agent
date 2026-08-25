import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { CaseDetailModal } from './components/CaseDetailModal';
import { BatchSimulationModal } from './components/BatchSimulationModal';
import { DashboardPage } from './pages/DashboardPage';
import { RevenueRiskPage } from './pages/RevenueRiskPage';
import { RecoveryAgentPage } from './pages/RecoveryAgentPage';
import { RecoveryEvaluationPage } from './pages/RecoveryEvaluationPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { CustomersPage } from './pages/CustomersPage';
import { SettingsPage } from './pages/SettingsPage';
import { api, SystemStatus } from './lib/api';
import { DashboardStats, RecoveryCase } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [sysStatus, dashStats, casesData] = await Promise.all([
        api.getStatus(),
        api.getDashboardStats(),
        api.getCases()
      ]);
      setStatus(sysStatus);
      setStats(dashStats);
      setCases(casesData);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await api.resetDatabase();
      await loadData();
    } catch (e) {
      console.error('Failed to reset dataset:', e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCaseUpdated = (updated: RecoveryCase) => {
    setSelectedCase(updated);
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    // Refresh dashboard stats
    api.getDashboardStats().then(setStats).catch(console.error);
  };

  const pendingEscalations = cases.filter((c) => c.status === 'PENDING_APPROVAL').length;
  const revenueAtRiskCount = cases.filter((c) => c.status !== 'RECOVERED' && c.status !== 'BLOCKED').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        status={status}
        onOpenSimulation={() => setSimulationModalOpen(true)}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Main App Container (Sidebar + Content) */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row shadow-sm">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingEscalationsCount={pendingEscalations}
          revenueAtRiskCount={revenueAtRiskCount}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50 min-h-[85vh]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600" />
              <p className="text-sm font-semibold">Initializing Revenue Recovery Autopilot...</p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardPage
                  stats={stats}
                  cases={cases}
                  onSelectCase={(c) => setSelectedCase(c)}
                  onOpenSimulation={() => setSimulationModalOpen(true)}
                />
              )}

              {currentTab === 'revenue-risk' && (
                <RevenueRiskPage
                  cases={cases}
                  onSelectCase={(c) => setSelectedCase(c)}
                  onRefreshData={loadData}
                />
              )}

              {currentTab === 'recovery-agent' && (
                <RecoveryAgentPage
                  cases={cases}
                  onSelectCase={(c) => setSelectedCase(c)}
                  onRefreshData={loadData}
                />
              )}

              {currentTab === 'recovery-evaluation' && (
                <RecoveryEvaluationPage
                  onOpenSimulation={() => setSimulationModalOpen(true)}
                  onResetData={handleResetData}
                />
              )}

              {currentTab === 'audit-trail' && <AuditTrailPage />}

              {currentTab === 'customers' && <CustomersPage />}

              {currentTab === 'settings' && (
                <SettingsPage
                  status={status}
                  onResetData={handleResetData}
                  isResetting={isResetting}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <CaseDetailModal
        recoveryCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onRefreshCase={handleCaseUpdated}
      />

      <BatchSimulationModal
        isOpen={simulationModalOpen}
        onClose={() => setSimulationModalOpen(false)}
        onSimulationComplete={loadData}
      />
    </div>
  );
}
