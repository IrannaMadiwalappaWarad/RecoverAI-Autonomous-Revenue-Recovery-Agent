import { 
  DashboardStats, 
  RecoveryCase, 
  Customer, 
  AuditEvent, 
  PolicyConfig, 
  BatchEvaluationMetrics 
} from '../types';

export interface SystemStatus {
  appName: string;
  version: string;
  track: string;
  razorpay: {
    status: string;
    modeLabel: string;
    isRealTestApi: boolean;
    keyIdMasked: string;
  };
  aiModel: {
    name: string;
    active: boolean;
    mode: string;
  };
  safetyPolicy: {
    enforced: boolean;
    maxAutoRecoveryAmount: number;
    minAutoProbability: number;
  };
}

export const api = {
  async getStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getCases(params?: { status?: string; riskLevel?: string; failureReason?: string; search?: string }): Promise<RecoveryCase[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.riskLevel) query.append('riskLevel', params.riskLevel);
    if (params?.failureReason) query.append('failureReason', params.failureReason);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`/api/cases?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch recovery cases');
    return res.json();
  },

  async getCaseById(id: string): Promise<RecoveryCase & { auditHistory: AuditEvent[] }> {
    const res = await fetch(`/api/cases/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch case ${id}`);
    return res.json();
  },

  async diagnoseCase(id: string): Promise<RecoveryCase> {
    const res = await fetch(`/api/cases/${id}/diagnose`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to diagnose case ${id}`);
    return res.json();
  },

  async executeCaseAction(id: string): Promise<{ success: boolean; recoveryCase: RecoveryCase; auditLogs: AuditEvent[] }> {
    const res = await fetch(`/api/cases/${id}/execute`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to execute recovery action for case ${id}`);
    return res.json();
  },

  async approveCase(id: string, notes?: string): Promise<{ success: boolean; recoveryCase: RecoveryCase; auditLogs: AuditEvent[] }> {
    const res = await fetch(`/api/cases/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    if (!res.ok) throw new Error(`Failed to approve case ${id}`);
    return res.json();
  },

  async rejectCase(id: string, reason?: string): Promise<RecoveryCase> {
    const res = await fetch(`/api/cases/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error(`Failed to reject case ${id}`);
    return res.json();
  },

  async verifyRecovery(id: string, simulatedSuccess: boolean = true): Promise<{ success: boolean; recoveryCase: RecoveryCase; auditLog: AuditEvent }> {
    const res = await fetch(`/api/cases/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulatedSuccess })
    });
    if (!res.ok) throw new Error(`Failed to verify recovery for case ${id}`);
    return res.json();
  },

  async runBatchSimulation(): Promise<{
    processedCount: number;
    recoveredCount: number;
    recoveredAmount: number;
    blockedCount: number;
    escalatedCount: number;
    metrics: BatchEvaluationMetrics;
  }> {
    const res = await fetch('/api/batch/run-simulation', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run batch simulation');
    return res.json();
  },

  async getBatchMetrics(): Promise<BatchEvaluationMetrics> {
    const res = await fetch('/api/batch/metrics');
    if (!res.ok) throw new Error('Failed to fetch batch metrics');
    return res.json();
  },

  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/batch/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset dataset');
    return res.json();
  },

  async getAuditEvents(limit: number = 200, caseId?: string): Promise<AuditEvent[]> {
    const query = new URLSearchParams();
    query.append('limit', String(limit));
    if (caseId) query.append('caseId', caseId);

    const res = await fetch(`/api/audit?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch audit events');
    return res.json();
  },

  async getCustomers(): Promise<Customer[]> {
    const res = await fetch('/api/customers');
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async getPolicy(): Promise<PolicyConfig> {
    const res = await fetch('/api/policy');
    if (!res.ok) throw new Error('Failed to fetch policy configuration');
    return res.json();
  },

  async updatePolicy(policy: Partial<PolicyConfig>): Promise<PolicyConfig> {
    const res = await fetch('/api/policy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    });
    if (!res.ok) throw new Error('Failed to update policy');
    return res.json();
  }
};
