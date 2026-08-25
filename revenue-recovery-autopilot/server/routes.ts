import { Router } from 'express';
import { db } from './db';
import { razorpayService } from './razorpayService';
import { recoveryAgentEngine } from './agentEngine';
import { runAIDiagnosis } from './geminiService';

export const apiRouter = Router();

// 1. Connection & Platform Status
apiRouter.get('/status', (req, res) => {
  const razorpayStatus = razorpayService.getConnectionStatus();
  const policy = db.getPolicyConfig();
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  res.json({
    appName: 'Revenue Recovery Autopilot',
    version: '1.0.0',
    track: 'Track 03: AI Revenue Recovery',
    razorpay: razorpayStatus,
    aiModel: {
      name: 'gemini-3.7-flash',
      active: hasGeminiKey,
      mode: hasGeminiKey ? 'GEMINI_API_ACTIVE' : 'ML_EXPLAINABLE_SCORING_FALLBACK'
    },
    safetyPolicy: {
      enforced: true,
      maxAutoRecoveryAmount: policy.maxAutoRecoveryAmount,
      minAutoProbability: policy.minAutoProbability
    }
  });
});

// 2. Dashboard Statistics & Visualizations
apiRouter.get('/dashboard/stats', (req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Recovery Cases List with Search & Filtering
apiRouter.get('/cases', (req, res) => {
  try {
    let cases = db.getRecoveryCases();
    const { status, riskLevel, failureReason, search } = req.query;

    if (status && typeof status === 'string' && status !== 'ALL') {
      cases = cases.filter(c => c.status === status);
    }
    if (riskLevel && typeof riskLevel === 'string' && riskLevel !== 'ALL') {
      cases = cases.filter(c => c.riskLevel === riskLevel);
    }
    if (failureReason && typeof failureReason === 'string' && failureReason !== 'ALL') {
      cases = cases.filter(c => c.failureReason === failureReason);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      cases = cases.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.paymentId.toLowerCase().includes(q) ||
        c.customer.name.toLowerCase().includes(q) ||
        c.customer.email.toLowerCase().includes(q) ||
        c.transaction.itemDescription.toLowerCase().includes(q)
      );
    }

    res.json(cases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Single Case Details
apiRouter.get('/cases/:id', (req, res) => {
  try {
    const rCase = db.getCaseById(req.params.id);
    if (!rCase) {
      return res.status(404).json({ error: `Case ${req.params.id} not found` });
    }
    const auditHistory = db.getAuditEvents(50, rCase.id);
    res.json({ ...rCase, auditHistory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Trigger AI Diagnosis on Case
apiRouter.post('/cases/:id/diagnose', async (req, res) => {
  try {
    const rCase = db.getCaseById(req.params.id);
    if (!rCase) {
      return res.status(404).json({ error: `Case ${req.params.id} not found` });
    }
    const diagnosis = await runAIDiagnosis(rCase);
    rCase.aiDiagnosis = diagnosis;
    rCase.recoveryProbability = diagnosis.recoveryProbability;
    rCase.riskLevel = diagnosis.riskLevel;
    rCase.status = 'DIAGNOSED';
    db.updateCase(rCase);

    db.addAuditEvent({
      caseId: rCase.id,
      paymentId: rCase.paymentId,
      eventType: 'AI_DIAGNOSIS',
      title: `On-Demand AI Diagnosis: ${rCase.id}`,
      description: `${diagnosis.summary} (Probability: ${diagnosis.recoveryProbability}%)`,
      actor: 'AI_AGENT',
      severity: 'INFO'
    });

    res.json(rCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Execute Recovery Action through Safety Gate
apiRouter.post('/cases/:id/execute', async (req, res) => {
  try {
    const result = await recoveryAgentEngine.processCase(req.params.id, false);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Merchant Approval for Escalated Case
apiRouter.post('/cases/:id/approve', async (req, res) => {
  try {
    const rCase = db.getCaseById(req.params.id);
    if (!rCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    rCase.merchantDecision = 'APPROVED';
    rCase.merchantNotes = req.body?.notes || 'Merchant approved manual recovery override in dashboard.';
    db.updateCase(rCase);

    db.addAuditEvent({
      caseId: rCase.id,
      paymentId: rCase.paymentId,
      eventType: 'ACTION_APPROVED',
      title: 'Merchant Manual Approval Granted',
      description: `Merchant authorized recovery intervention for case ${rCase.id} (₹${rCase.amount.toLocaleString('en-IN')}).`,
      actor: 'MERCHANT',
      severity: 'SUCCESS',
      details: { notes: rCase.merchantNotes }
    });

    // Execute with manual merchant authorization flag true
    const result = await recoveryAgentEngine.processCase(rCase.id, true);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Merchant Rejection of Action
apiRouter.post('/cases/:id/reject', (req, res) => {
  try {
    const rCase = db.getCaseById(req.params.id);
    if (!rCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    rCase.status = 'BLOCKED';
    rCase.merchantDecision = 'REJECTED';
    rCase.merchantNotes = req.body?.reason || 'Merchant declined recovery outreach.';
    db.updateCase(rCase);

    db.addAuditEvent({
      caseId: rCase.id,
      paymentId: rCase.paymentId,
      eventType: 'ACTION_REJECTED',
      title: 'Merchant Rejected Recovery Action',
      description: `Recovery outreach declined by merchant: "${rCase.merchantNotes}"`,
      actor: 'MERCHANT',
      severity: 'WARNING'
    });

    res.json(rCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Payment Status Verification (Mark Recovered)
apiRouter.post('/cases/:id/verify', async (req, res) => {
  try {
    const simulated = req.body?.simulatedSuccess ?? true;
    const result = await recoveryAgentEngine.verifyAndCompleteRecovery(req.params.id, simulated);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Batch Simulation Run
apiRouter.post('/batch/run-simulation', async (req, res) => {
  try {
    const result = await recoveryAgentEngine.runBatchSimulation();
    const metrics = db.getBatchMetrics();
    res.json({ ...result, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Batch Evaluation Metrics
apiRouter.get('/batch/metrics', (req, res) => {
  try {
    const metrics = db.getBatchMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Reset Database to Seed State
apiRouter.post('/batch/reset', (req, res) => {
  try {
    db.resetDatabase();
    res.json({ success: true, message: 'Database reset to initial 105 synthetic merchant cases.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Audit Trail
apiRouter.get('/audit', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 200;
    const caseId = req.query.caseId ? String(req.query.caseId) : undefined;
    const events = db.getAuditEvents(limit, caseId);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Customers List
apiRouter.get('/customers', (req, res) => {
  try {
    const customers = db.getCustomers();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Policy Config Get & Update
apiRouter.get('/policy', (req, res) => {
  try {
    res.json(db.getPolicyConfig());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/policy', (req, res) => {
  try {
    const updated = db.updatePolicyConfig(req.body);
    db.addAuditEvent({
      eventType: 'POLICY_PASSED',
      title: 'Safety Policy Updated by Merchant',
      description: `Max auto amount: ₹${updated.maxAutoRecoveryAmount}, Min probability: ${updated.minAutoProbability}%`,
      actor: 'MERCHANT',
      severity: 'INFO'
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 16. Webhooks for Razorpay (Payment Captured / Payment Link Paid)
apiRouter.post('/webhooks/razorpay', async (req, res) => {
  try {
    const event = req.body?.event;
    const paymentLinkId = req.body?.payload?.payment_link?.entity?.id;
    const referenceId = req.body?.payload?.payment_link?.entity?.reference_id;

    if (event === 'payment_link.paid' && referenceId) {
      const rCase = db.getCaseById(referenceId);
      if (rCase && rCase.status !== 'RECOVERED') {
        await recoveryAgentEngine.verifyAndCompleteRecovery(rCase.id, true);
      }
    }
    res.json({ status: 'ok', received: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
