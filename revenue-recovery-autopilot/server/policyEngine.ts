import { RecoveryCase, PolicyConfig, PolicyDecision } from '../src/types';

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  maxAutoRecoveryAmount: 5000,
  maxAttemptsPerCustomer: 2,
  maxAttemptsLimit: 2,
  minAutoProbability: 75,
  cooldownHoursBetweenAttempts: 24,
  requireHighValueApproval: true,
  requireMerchantApprovalForHighValue: true,
  highValueThreshold: 5000,
  stopOnVerificationSuccess: true,
  preventFraudSuspectAction: true,
  blockFraudSuspects: true,
  demoMode: true,
  notificationChannel: 'EMAIL'
};

export function evaluatePolicy(
  recoveryCase: RecoveryCase,
  config: PolicyConfig = DEFAULT_POLICY_CONFIG,
  isManualMerchantApproval: boolean = false
): PolicyDecision {
  const checkedRules: { rule: string; passed: boolean; detail: string }[] = [];
  let allowed = true;
  let reason = 'All policy checks passed. Autonomous recovery permitted.';
  let ruleViolated: string | undefined = undefined;
  let requiresApproval = false;

  // Rule 1: Never perform action if payment is already recovered or captured
  const isAlreadyPaid = recoveryCase.paymentStatus === 'captured' || recoveryCase.paymentStatus === 'recovered' || recoveryCase.status === 'RECOVERED';
  if (isAlreadyPaid) {
    checkedRules.push({
      rule: 'RULE_ALREADY_PAID',
      passed: false,
      detail: `Payment is already verified as ${recoveryCase.paymentStatus}. Duplicate recovery is strictly prohibited.`
    });
    return {
      allowed: false,
      reason: 'Payment already completed or recovered. Action aborted to prevent double charging.',
      ruleViolated: 'RULE_ALREADY_PAID',
      requiresApproval: false,
      checkedRules
    };
  } else {
    checkedRules.push({
      rule: 'RULE_ALREADY_PAID',
      passed: true,
      detail: 'Payment is pending/failed; no double charge risk.'
    });
  }

  // Rule 2: Fraud Check - Never recover fraud-suspected transactions
  if (config.preventFraudSuspectAction && recoveryCase.failureReason === 'FRAUD_SUSPECTED') {
    checkedRules.push({
      rule: 'RULE_FRAUD_SUSPECT',
      passed: false,
      detail: 'Transaction was flagged by risk engine for high fraud probability. Automated recovery blocked.'
    });
    return {
      allowed: false,
      reason: 'Blocked by Anti-Fraud Policy: Suspicious velocity/identity pattern.',
      ruleViolated: 'RULE_FRAUD_SUSPECT',
      requiresApproval: false,
      checkedRules
    };
  } else {
    checkedRules.push({
      rule: 'RULE_FRAUD_SUSPECT',
      passed: true,
      detail: 'No active fraud indicators.'
    });
  }

  // Rule 3: Max Attempts Limit
  if (recoveryCase.attemptsCount >= config.maxAttemptsPerCustomer) {
    checkedRules.push({
      rule: 'RULE_MAX_ATTEMPTS',
      passed: false,
      detail: `Reached maximum limit of ${config.maxAttemptsPerCustomer} recovery attempts. Customer outreach halted.`
    });
    return {
      allowed: false,
      reason: `Maximum recovery attempts (${config.maxAttemptsPerCustomer}) exceeded for this case.`,
      ruleViolated: 'RULE_MAX_ATTEMPTS',
      requiresApproval: false,
      checkedRules
    };
  } else {
    checkedRules.push({
      rule: 'RULE_MAX_ATTEMPTS',
      passed: true,
      detail: `Current attempts (${recoveryCase.attemptsCount}) is within policy limit of ${config.maxAttemptsPerCustomer}.`
    });
  }

  // If this action has received manual merchant approval, bypass auto-limits
  if (isManualMerchantApproval) {
    checkedRules.push({
      rule: 'RULE_MERCHANT_AUTHORIZATION',
      passed: true,
      detail: 'Manual authorization granted by authenticated merchant in dashboard.'
    });
    return {
      allowed: true,
      reason: 'Authorized via explicit Merchant Manual Approval.',
      requiresApproval: false,
      checkedRules
    };
  }

  // Rule 4: High Value Threshold & Max Automatic Recovery Amount
  if (recoveryCase.amount > config.maxAutoRecoveryAmount) {
    requiresApproval = true;
    allowed = false;
    ruleViolated = 'RULE_MAX_AUTO_AMOUNT';
    reason = `Transaction amount (₹${recoveryCase.amount.toLocaleString('en-IN')}) exceeds autonomous limit of ₹${config.maxAutoRecoveryAmount.toLocaleString('en-IN')}. Requires Merchant Approval.`;
    checkedRules.push({
      rule: 'RULE_MAX_AUTO_AMOUNT',
      passed: false,
      detail: `Amount ₹${recoveryCase.amount} > ₹${config.maxAutoRecoveryAmount} limit. Escalated to merchant.`
    });
  } else {
    checkedRules.push({
      rule: 'RULE_MAX_AUTO_AMOUNT',
      passed: true,
      detail: `Amount ₹${recoveryCase.amount} is within autonomous threshold of ₹${config.maxAutoRecoveryAmount}.`
    });
  }

  // Rule 5: Minimum Recovery Probability Threshold
  const prob = recoveryCase.aiDiagnosis?.recoveryProbability ?? recoveryCase.recoveryProbability;
  if (prob < config.minAutoProbability) {
    if (allowed) {
      allowed = false;
      requiresApproval = true;
      ruleViolated = 'RULE_MIN_PROBABILITY';
      reason = `Estimated recovery probability (${prob}%) is below autonomous threshold (${config.minAutoProbability}%). Merchant review advised.`;
    }
    checkedRules.push({
      rule: 'RULE_MIN_PROBABILITY',
      passed: false,
      detail: `Probability ${prob}% < ${config.minAutoProbability}% threshold.`
    });
  } else {
    checkedRules.push({
      rule: 'RULE_MIN_PROBABILITY',
      passed: true,
      detail: `Probability ${prob}% meets or exceeds ${config.minAutoProbability}% threshold.`
    });
  }

  return {
    allowed,
    reason,
    ruleViolated,
    requiresApproval,
    checkedRules
  };
}
