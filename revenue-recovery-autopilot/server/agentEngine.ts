import { db } from './db';
import { runAIDiagnosis } from './geminiService';
import { evaluatePolicy } from './policyEngine';
import { razorpayService } from './razorpayService';
import { RecoveryCase, AuditEvent } from '../src/types';

export class RecoveryAgentEngine {
  /**
   * Process a single case through the full Track 03 pipeline
   */
  public async processCase(
    caseId: string,
    isManualMerchantApproval: boolean = false,
    skipLLM: boolean = false
  ): Promise<{ success: boolean; recoveryCase: RecoveryCase; auditLogs: AuditEvent[] }> {
    const recoveryCase = db.getCaseById(caseId);
    if (!recoveryCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    const auditLogs: AuditEvent[] = [];

    // Step 1: Diagnose using AI Agent
    const diagnosis = await runAIDiagnosis(recoveryCase, skipLLM);
    recoveryCase.aiDiagnosis = diagnosis;
    recoveryCase.recoveryProbability = diagnosis.recoveryProbability;
    recoveryCase.riskLevel = diagnosis.riskLevel;
    recoveryCase.status = 'DIAGNOSED';

    const diagLog = db.addAuditEvent({
      caseId: recoveryCase.id,
      paymentId: recoveryCase.paymentId,
      eventType: 'AI_DIAGNOSIS',
      title: `AI Diagnosis Completed: ${recoveryCase.id}`,
      description: `${diagnosis.summary} Recovery Probability: ${diagnosis.recoveryProbability}%. Recommended: ${diagnosis.suggestedIntervention}.`,
      actor: 'AI_AGENT',
      severity: 'INFO',
      details: {
        probability: diagnosis.recoveryProbability,
        action: diagnosis.suggestedIntervention,
        rootCause: diagnosis.failureRootCause,
        stoppingCondition: diagnosis.stoppingCondition
      }
    });
    auditLogs.push(diagLog);

    // Step 2: Propose Action
    recoveryCase.status = 'ACTION_RECOMMENDED';
    const propLog = db.addAuditEvent({
      caseId: recoveryCase.id,
      paymentId: recoveryCase.paymentId,
      eventType: 'ACTION_PROPOSED',
      title: `Action Proposed: ${diagnosis.suggestedIntervention}`,
      description: diagnosis.whyThisAction,
      actor: 'AI_AGENT',
      severity: 'INFO',
      details: {
        intervention: diagnosis.suggestedIntervention,
        expectedValue: diagnosis.expectedRecoveryValue
      }
    });
    auditLogs.push(propLog);

    // Step 3: Safety / Policy Gate
    const policyConfig = db.getPolicyConfig();
    const policyDecision = evaluatePolicy(recoveryCase, policyConfig, isManualMerchantApproval);
    recoveryCase.policyDecision = policyDecision;

    if (!policyDecision.allowed) {
      if (policyDecision.requiresApproval) {
        recoveryCase.status = 'PENDING_APPROVAL';
        const blockLog = db.addAuditEvent({
          caseId: recoveryCase.id,
          paymentId: recoveryCase.paymentId,
          eventType: 'POLICY_BLOCKED',
          title: `Policy Escalation: Merchant Approval Required`,
          description: policyDecision.reason,
          actor: 'POLICY_ENGINE',
          severity: 'WARNING',
          details: {
            reason: policyDecision.reason,
            ruleViolated: policyDecision.ruleViolated,
            amount: recoveryCase.amount
          }
        });
        auditLogs.push(blockLog);
      } else {
        recoveryCase.status = 'BLOCKED';
        const blockLog = db.addAuditEvent({
          caseId: recoveryCase.id,
          paymentId: recoveryCase.paymentId,
          eventType: 'POLICY_BLOCKED',
          title: `Action Blocked by Safety Policy`,
          description: policyDecision.reason,
          actor: 'POLICY_ENGINE',
          severity: 'BLOCKED',
          details: {
            reason: policyDecision.reason,
            ruleViolated: policyDecision.ruleViolated
          }
        });
        auditLogs.push(blockLog);
      }

      db.updateCase(recoveryCase);
      return { success: false, recoveryCase, auditLogs };
    }

    // Policy Passed!
    const passLog = db.addAuditEvent({
      caseId: recoveryCase.id,
      paymentId: recoveryCase.paymentId,
      eventType: 'POLICY_PASSED',
      title: 'Safety Policy Gate: PASSED',
      description: policyDecision.reason,
      actor: 'POLICY_ENGINE',
      severity: 'SUCCESS',
      details: {
        checkedRulesCount: policyDecision.checkedRules.length
      }
    });
    auditLogs.push(passLog);

    // Step 4: Execute Action (Razorpay TEST API or Retry)
    if (diagnosis.suggestedIntervention === 'DO_NOT_RECOVER') {
      recoveryCase.status = 'BLOCKED';
      db.updateCase(recoveryCase);
      return { success: false, recoveryCase, auditLogs };
    }

    recoveryCase.status = 'RECOVERY_IN_PROGRESS';
    recoveryCase.attemptsCount += 1;

    try {
      if (diagnosis.suggestedIntervention === 'CREATE_PAYMENT_LINK' || isManualMerchantApproval) {
        const linkRes = await razorpayService.createPaymentLink(recoveryCase);

        recoveryCase.actionDetails = {
          type: 'CREATE_PAYMENT_LINK',
          razorpayPaymentLinkId: linkRes.id,
          shortUrl: linkRes.short_url,
          executionStatus: linkRes.isRealRazorpay ? 'REAL_RAZORPAY' : 'DEMO',
          createdAt: new Date().toISOString(),
          executedAt: new Date().toISOString(),
          attempts: recoveryCase.attemptsCount,
          apiResponse: linkRes.raw,
          notes: `Dispatched via ${linkRes.isRealRazorpay ? 'Razorpay TEST Mode' : 'Synthetic Demo Mode'}`
        };

        const linkLog = db.addAuditEvent({
          caseId: recoveryCase.id,
          paymentId: recoveryCase.paymentId,
          eventType: 'PAYMENT_LINK_CREATED',
          title: `Razorpay Payment Link Created (${linkRes.isRealRazorpay ? 'TEST MODE' : 'DEMO'})`,
          description: `Generated Link ID: ${linkRes.id} (${linkRes.short_url}) for ₹${recoveryCase.amount.toLocaleString('en-IN')}`,
          actor: 'RAZORPAY_API',
          severity: 'SUCCESS',
          details: {
            linkId: linkRes.id,
            url: linkRes.short_url,
            isReal: linkRes.isRealRazorpay
          }
        });
        auditLogs.push(linkLog);
      } else if (diagnosis.suggestedIntervention === 'SMART_RETRY_FOLLOWUP') {
        recoveryCase.actionDetails = {
          type: 'SMART_RETRY_FOLLOWUP',
          executionStatus: 'DEMO',
          createdAt: new Date().toISOString(),
          executedAt: new Date().toISOString(),
          attempts: recoveryCase.attemptsCount,
          notes: 'Scheduled smart customer follow-up reminder dispatched.'
        };

        const retryLog = db.addAuditEvent({
          caseId: recoveryCase.id,
          paymentId: recoveryCase.paymentId,
          eventType: 'ACTION_PROPOSED',
          title: 'Smart Retry Follow-Up Dispatched',
          description: `Customer outreach triggered via SMS/Email for case ${recoveryCase.id}.`,
          actor: 'AI_AGENT',
          severity: 'INFO',
          details: {
            method: recoveryCase.transaction.paymentMethod
          }
        });
        auditLogs.push(retryLog);
      }
    } catch (err: any) {
      recoveryCase.status = 'FAILED';
      const failLog = db.addAuditEvent({
        caseId: recoveryCase.id,
        paymentId: recoveryCase.paymentId,
        eventType: 'RECOVERY_FAILED',
        title: 'Action Execution Failed',
        description: err.message || 'Execution error encountered',
        actor: 'SYSTEM',
        severity: 'ERROR'
      });
      auditLogs.push(failLog);
      db.updateCase(recoveryCase);
      return { success: false, recoveryCase, auditLogs };
    }

    db.updateCase(recoveryCase);
    return { success: true, recoveryCase, auditLogs };
  }

  /**
   * Verify and confirm recovery of a payment
   */
  public async verifyAndCompleteRecovery(
    caseId: string,
    simulatedSuccess: boolean = true
  ): Promise<{ success: boolean; recoveryCase: RecoveryCase; auditLog: AuditEvent }> {
    const recoveryCase = db.getCaseById(caseId);
    if (!recoveryCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    if (recoveryCase.status === 'RECOVERED') {
      throw new Error('Case is already marked as RECOVERED.');
    }

    if (simulatedSuccess) {
      recoveryCase.status = 'RECOVERED';
      recoveryCase.paymentStatus = 'recovered';
      recoveryCase.recoveredAmount = recoveryCase.amount;
      recoveryCase.recoveredAt = new Date().toISOString();
      if (recoveryCase.actionDetails) {
        recoveryCase.actionDetails.executionStatus = 'SUCCESS';
      }

      // Step 6: Verify
      db.addAuditEvent({
        caseId: recoveryCase.id,
        paymentId: recoveryCase.paymentId,
        eventType: 'STATUS_VERIFIED',
        title: 'Razorpay Payment Status Verified',
        description: `Payment confirmation received for order ${recoveryCase.transaction.orderId}. Status: PAID.`,
        actor: 'RAZORPAY_API',
        severity: 'SUCCESS',
        details: {
          amount: recoveryCase.amount,
          orderId: recoveryCase.transaction.orderId
        }
      });

      // Step 7: Measure
      const successLog = db.addAuditEvent({
        caseId: recoveryCase.id,
        paymentId: recoveryCase.paymentId,
        eventType: 'RECOVERY_SUCCESSFUL',
        title: `Recovery Succeeded: ₹${recoveryCase.amount.toLocaleString('en-IN')} Recovered`,
        description: `Autonomous agent successfully recovered ₹${recoveryCase.amount.toLocaleString('en-IN')} for merchant.`,
        actor: 'AI_AGENT',
        severity: 'SUCCESS',
        details: {
          recoveredAmount: recoveryCase.amount,
          customer: recoveryCase.customer.name
        }
      });

      // Step 8: Stopping Rule
      db.addAuditEvent({
        caseId: recoveryCase.id,
        paymentId: recoveryCase.paymentId,
        eventType: 'STOP_RULE_TRIGGERED',
        title: 'Stopping Rule Triggered: Payment Confirmed',
        description: 'Payment verified successfully. Further recovery outreach stopped.',
        actor: 'POLICY_ENGINE',
        severity: 'INFO',
        details: {
          reason: 'SUCCESSFUL_VERIFICATION'
        }
      });

      db.updateCase(recoveryCase);
      return { success: true, recoveryCase, auditLog: successLog };
    } else {
      recoveryCase.status = 'FAILED';
      const failLog = db.addAuditEvent({
        caseId: recoveryCase.id,
        paymentId: recoveryCase.paymentId,
        eventType: 'RECOVERY_FAILED',
        title: `Recovery Verification Expired`,
        description: `Customer did not complete payment within 24h window. Outreach ceased.`,
        actor: 'SYSTEM',
        severity: 'WARNING'
      });
      db.updateCase(recoveryCase);
      return { success: false, recoveryCase, auditLog: failLog };
    }
  }

  /**
   * Run Full Batch Simulation across all 100+ cases
   */
  public async runBatchSimulation(): Promise<{
    processedCount: number;
    recoveredCount: number;
    recoveredAmount: number;
    blockedCount: number;
    escalatedCount: number;
  }> {
    const cases = db.getRecoveryCases();
    let processedCount = 0;
    let recoveredCount = 0;
    let recoveredAmount = 0;
    let blockedCount = 0;
    let escalatedCount = 0;

    for (const rCase of cases) {
      if (rCase.status === 'RECOVERED') {
        continue;
      }

      processedCount++;
      const result = await this.processCase(rCase.id, false, true);
      const updated = result.recoveryCase;

      if (updated.status === 'PENDING_APPROVAL') {
        escalatedCount++;
      } else if (updated.status === 'BLOCKED') {
        blockedCount++;
      } else if (updated.status === 'RECOVERY_IN_PROGRESS') {
        // High probability cases (>70%) convert successfully in simulation
        const prob = updated.aiDiagnosis?.recoveryProbability ?? updated.recoveryProbability;
        if (prob >= 70) {
          await this.verifyAndCompleteRecovery(updated.id, true);
          recoveredCount++;
          recoveredAmount += updated.amount;
        } else {
          await this.verifyAndCompleteRecovery(updated.id, false);
        }
      }
    }

    return {
      processedCount,
      recoveredCount,
      recoveredAmount,
      blockedCount,
      escalatedCount
    };
  }
}

export const recoveryAgentEngine = new RecoveryAgentEngine();
