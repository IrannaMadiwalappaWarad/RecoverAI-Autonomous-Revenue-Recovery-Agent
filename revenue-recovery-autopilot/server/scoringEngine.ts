import { Customer, Transaction, FailureReason, FailureCategory, RiskLevel, RecoveryActionType, FeatureAttribution } from '../src/types';

export interface MLScoreResult {
  recoveryProbability: number; // 0 - 100
  riskLevel: RiskLevel;
  recommendedAction: RecoveryActionType;
  expectedRecoveryValue: number;
  confidence: number;
  stoppingCondition: string;
  featureAttributions: FeatureAttribution[];
  whyThisAction: string;
}

export function computeRecoveryScore(
  transaction: Transaction,
  customer: Customer,
  attemptsCount: number = 0
): MLScoreResult {
  const attributions: FeatureAttribution[] = [];
  let baseScore = 50;

  // 1. Failure Reason & Category Impact
  const failureWeights: Record<FailureReason, { score: number; desc: string }> = {
    GATEWAY_DOWNTIME: { score: 32, desc: 'Temporary bank switch downtime is highly recoverable once restored' },
    NETWORK_ERROR: { score: 28, desc: 'Network disconnect right before capture indicates high purchase intent' },
    OTP_TIMEOUT: { score: 24, desc: 'OTP expiration is customer-actionable via one-click fresh payment link' },
    CHECKOUT_DROPOFF: { score: 18, desc: 'Cart abandonment can be salvaged with immediate reminder link' },
    AUTH_FAILED: { score: 12, desc: 'MPIN/credential typo can be resolved upon re-prompting' },
    CARD_EXPIRED: { score: 10, desc: 'Expired card requires fresh instrument or alternate payment method' },
    SUBSCRIPTION_RENEWAL_FAILED: { score: 15, desc: 'Mandate cutoff window can be recovered via instant on-demand link' },
    INSUFFICIENT_FUNDS: { score: -8, desc: 'Account balance insufficiency requires delayed smart follow-up' },
    LIMIT_EXCEEDED: { score: 5, desc: 'Daily limit resets; actionable via alternate card or next-day link' },
    FRAUD_SUSPECTED: { score: -45, desc: 'Security risk engine flagged velocity mismatch - unadvisable to recover' }
  };

  const reasonInfo = failureWeights[transaction.failureReason || 'OTP_TIMEOUT'] || { score: 10, desc: 'Standard payment drop' };
  baseScore += reasonInfo.score;
  attributions.push({
    featureName: `Failure Cause: ${transaction.failureReason}`,
    impact: reasonInfo.score >= 15 ? 'POSITIVE' : reasonInfo.score <= 0 ? 'NEGATIVE' : 'NEUTRAL',
    weight: reasonInfo.score,
    description: reasonInfo.desc
  });

  // 2. Customer Success Ratio & History
  const total = customer.totalTransactions || 1;
  const successRatio = customer.successfulTransactions / total;
  if (successRatio >= 0.8 && total >= 3) {
    baseScore += 18;
    attributions.push({
      featureName: 'Customer Payment History',
      impact: 'POSITIVE',
      weight: 18,
      description: `Strong loyalty record with ${(successRatio * 100).toFixed(0)}% past success rate over ${total} orders`
    });
  } else if (customer.failedTransactions > customer.successfulTransactions && total > 2) {
    baseScore -= 15;
    attributions.push({
      featureName: 'Repeat Failure History',
      impact: 'NEGATIVE',
      weight: -15,
      description: `Customer experienced ${customer.failedTransactions} previous failures against only ${customer.successfulTransactions} successes`
    });
  } else {
    attributions.push({
      featureName: 'Customer History',
      impact: 'NEUTRAL',
      weight: 4,
      description: 'Moderate transaction history with acceptable baseline variance'
    });
  }

  // 3. Customer Tier & Lifetime Value
  if (customer.tier === 'VIP') {
    baseScore += 12;
    attributions.push({
      featureName: 'VIP Customer Tier',
      impact: 'POSITIVE',
      weight: 12,
      description: `High Lifetime Value (₹${customer.lifetimeValue.toLocaleString('en-IN')}) with priority merchant loyalty`
    });
  } else if (customer.tier === 'NEW') {
    baseScore -= 5;
    attributions.push({
      featureName: 'First-time Customer',
      impact: 'NEGATIVE',
      weight: -5,
      description: 'First order with merchant; lacks established multi-month track record'
    });
  }

  // 4. Transaction Amount Friction
  if (transaction.amount <= 3000) {
    baseScore += 10;
    attributions.push({
      featureName: 'Low Amount Friction',
      impact: 'POSITIVE',
      weight: 10,
      description: `Ticket size of ₹${transaction.amount.toLocaleString('en-IN')} has negligible impulse friction`
    });
  } else if (transaction.amount > 20000) {
    baseScore -= 14;
    attributions.push({
      featureName: 'High Ticket Value',
      impact: 'NEGATIVE',
      weight: -14,
      description: `High ticket value (₹${transaction.amount.toLocaleString('en-IN')}) carries higher deliberate consideration`
    });
  }

  // 5. Attempts Count Degradation
  if (attemptsCount >= 1) {
    const penalty = attemptsCount * 22;
    baseScore -= penalty;
    attributions.push({
      featureName: `Prior Recovery Attempts (${attemptsCount})`,
      impact: 'NEGATIVE',
      weight: -penalty,
      description: `Conversion likelihood decays sharply after ${attemptsCount} previous intervention`
    });
  }

  // Clamp probability between 5% and 98%
  let finalProbability = Math.max(5, Math.min(98, Math.round(baseScore)));

  // Special case: Fraud suspected
  if (transaction.failureReason === 'FRAUD_SUSPECTED') {
    finalProbability = Math.min(8, finalProbability);
  }

  // Determine Risk Level
  let riskLevel: RiskLevel = 'MEDIUM';
  if (transaction.failureReason === 'FRAUD_SUSPECTED' || finalProbability < 30) {
    riskLevel = 'CRITICAL';
  } else if (finalProbability >= 75 && transaction.amount <= 5000) {
    riskLevel = 'LOW';
  } else if (transaction.amount > 15000 || finalProbability < 60) {
    riskLevel = 'HIGH';
  } else {
    riskLevel = 'MEDIUM';
  }

  // Determine Recommended Action
  let recommendedAction: RecoveryActionType = 'CREATE_PAYMENT_LINK';
  let whyThisAction = '';
  let stoppingCondition = 'Stop immediately if payment is captured, or after 2 attempts with no customer response.';

  if (transaction.failureReason === 'FRAUD_SUSPECTED' || finalProbability < 25) {
    recommendedAction = 'DO_NOT_RECOVER';
    whyThisAction = 'Case flagged for high fraud risk or sub-25% viability. Cease recovery to protect merchant trust.';
    stoppingCondition = 'Cease all automated outreach immediately due to security risk rules.';
  } else if (transaction.amount > 10000 || (transaction.amount > 5000 && customer.tier !== 'VIP')) {
    recommendedAction = 'MERCHANT_ESCALATION';
    whyThisAction = `Transaction amount (₹${transaction.amount.toLocaleString('en-IN')}) exceeds safe autonomous threshold. Human merchant approval required.`;
    stoppingCondition = 'Hold until merchant manually reviews and approves in dashboard.';
  } else if (transaction.failureReason === 'INSUFFICIENT_FUNDS' || transaction.failureReason === 'LIMIT_EXCEEDED') {
    recommendedAction = 'SMART_RETRY_FOLLOWUP';
    whyThisAction = 'Account balance/limit constraint. Best resolved via scheduled SMS/Email follow-up after salary/daily limit reset.';
    stoppingCondition = 'Send single smart follow-up. Stop if unresponded after 24 hours.';
  } else {
    recommendedAction = 'CREATE_PAYMENT_LINK';
    whyThisAction = `High probability (${finalProbability}%) recovery opportunity. Issue immediate Razorpay Payment Link with multi-channel checkout.`;
    stoppingCondition = 'Stop after 1 payment link dispatch or upon payment capture verification.';
  }

  const expectedRecoveryValue = Math.round((finalProbability / 100) * transaction.amount);
  const confidence = Number((0.75 + (finalProbability / 400)).toFixed(2));

  return {
    recoveryProbability: finalProbability,
    riskLevel,
    recommendedAction,
    expectedRecoveryValue,
    confidence,
    stoppingCondition,
    featureAttributions: attributions,
    whyThisAction
  };
}
