export type PaymentStatus = 
  | 'failed' 
  | 'abandoned' 
  | 'captured' 
  | 'recovered' 
  | 'refunded' 
  | 'processing';

export type FailureReason = 
  | 'AUTH_FAILED' 
  | 'INSUFFICIENT_FUNDS' 
  | 'OTP_TIMEOUT' 
  | 'GATEWAY_DOWNTIME' 
  | 'CARD_EXPIRED' 
  | 'NETWORK_ERROR' 
  | 'CHECKOUT_DROPOFF' 
  | 'SUBSCRIPTION_RENEWAL_FAILED'
  | 'LIMIT_EXCEEDED'
  | 'FRAUD_SUSPECTED';

export type FailureCategory = 
  | 'TECHNICAL' 
  | 'CUSTOMER_ACTIONABLE' 
  | 'BANK_FAILURE' 
  | 'ABANDONMENT' 
  | 'FRAUD_RISK';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CaseStatus = 
  | 'DETECTED' 
  | 'DIAGNOSED' 
  | 'ACTION_RECOMMENDED' 
  | 'PENDING_APPROVAL' 
  | 'RECOVERY_IN_PROGRESS' 
  | 'RECOVERED' 
  | 'FAILED' 
  | 'BLOCKED' 
  | 'EXPIRED';

export type RecoveryActionType = 
  | 'CREATE_PAYMENT_LINK' 
  | 'SMART_RETRY_FOLLOWUP' 
  | 'MERCHANT_ESCALATION' 
  | 'DO_NOT_RECOVER';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tenureMonths: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  lifetimeValue: number;
  tier: 'VIP' | 'REGULAR' | 'NEW' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | string;
  riskScore: number; // 0-100
  previousRecoveryRate: number; // 0-100%
  city: string;
  preferredChannel?: string;
  lastPaymentDate?: string;
  segment?: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number; // In INR
  currency: string;
  status: PaymentStatus;
  failureReason?: FailureReason;
  failureCategory?: FailureCategory;
  gatewayResponseCode?: string;
  paymentMethod: 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET' | 'SUBSCRIPTION';
  timestamp: string;
  razorpayPaymentId?: string;
  orderId: string;
  itemDescription: string;
}

export interface AIDiagnosis {
  summary: string;
  failureRootCause: string;
  isRecoverable: boolean;
  recoveryProbability: number; // 0-100
  suggestedIntervention: RecoveryActionType;
  reasoning: string;
  expectedRecoveryValue: number;
  requiresApproval: boolean;
  riskLevel: RiskLevel;
  stoppingCondition: string;
  confidence: number;
  whyThisAction: string;
  actionParams?: {
    channel?: 'SMS_EMAIL' | 'WHATSAPP' | 'DIRECT_LINK';
    discountCode?: string;
    expiryHours?: number;
    customMessage?: string;
  };
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  ruleViolated?: string;
  requiresApproval: boolean;
  checkedRules: {
    rule: string;
    passed: boolean;
    detail: string;
  }[];
}

export interface ActionDetails {
  type: RecoveryActionType;
  razorpayPaymentLinkId?: string;
  shortUrl?: string;
  executionStatus: 'DEMO' | 'REAL_RAZORPAY' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'BLOCKED';
  createdAt: string;
  executedAt?: string;
  attempts: number;
  apiResponse?: any;
  notes?: string;
}

export interface FeatureAttribution {
  featureName: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  weight: number;
  description: string;
}

export interface RecoveryCase {
  id: string;
  paymentId: string;
  customerId: string;
  customer: Customer;
  transaction: Transaction;
  amount: number;
  paymentStatus: PaymentStatus;
  failureReason: FailureReason;
  failureCategory: FailureCategory;
  recoveryProbability: number;
  riskLevel: RiskLevel;
  status: CaseStatus;
  recommendedAction?: RecoveryActionType | string;
  aiDiagnosis?: AIDiagnosis;
  featureAttributions?: FeatureAttribution[];
  policyDecision?: PolicyDecision;
  actionDetails?: ActionDetails;
  recoveredAmount?: number;
  recoveredAt?: string;
  merchantNotes?: string;
  merchantDecision?: 'APPROVED' | 'REJECTED';
  attemptsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyConfig {
  maxAutoRecoveryAmount: number; // Default 5000 INR
  maxAttemptsPerCustomer: number; // Default 2
  maxAttemptsLimit?: number;
  minAutoProbability: number; // Default 75%
  cooldownHoursBetweenAttempts?: number;
  requireHighValueApproval: boolean; // Default true
  requireMerchantApprovalForHighValue?: boolean;
  highValueThreshold: number; // Default 10000 INR
  stopOnVerificationSuccess: boolean; // Default true
  preventFraudSuspectAction: boolean; // Default true
  blockFraudSuspects?: boolean;
  demoMode: boolean; // Default true (can switch with Razorpay keys)
  notificationChannel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'WEBHOOK';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  caseId?: string;
  paymentId?: string;
  eventType: 
    | 'RISK_DETECTED' 
    | 'AI_DIAGNOSIS' 
    | 'ACTION_PROPOSED' 
    | 'POLICY_PASSED' 
    | 'POLICY_BLOCKED' 
    | 'ACTION_APPROVED' 
    | 'ACTION_REJECTED' 
    | 'PAYMENT_LINK_CREATED' 
    | 'STATUS_VERIFIED' 
    | 'RECOVERY_SUCCESSFUL' 
    | 'RECOVERY_FAILED' 
    | 'STOP_RULE_TRIGGERED';
  title: string;
  description: string;
  actor: 'AI_AGENT' | 'POLICY_ENGINE' | 'MERCHANT' | 'RAZORPAY_API' | 'SYSTEM';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'BLOCKED';
  details?: Record<string, any>;
}

export interface DashboardStats {
  revenueAtRisk: number;
  recoverableRevenue: number;
  revenueRecovered: number;
  recoveryRate: number;
  casesAnalyzed: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  blockedActions: number;
  escalatedCases: number;
  totalCases: number;
  currency: string;
  timeline: {
    date: string;
    atRisk: number;
    recovered: number;
    casesCount: number;
  }[];
  failureDistribution: {
    reason: string;
    category: string;
    amount: number;
    count: number;
  }[];
  actionsDistribution: {
    action: string;
    count: number;
    recoveredAmount: number;
  }[];
  outcomeBreakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

export interface ConfusionMatrix {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

export interface BatchEvaluationMetrics {
  totalCases: number;
  totalRevenueAtRisk: number;
  potentiallyRecoverableRevenue: number;
  recoveryActionsAttempted: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  blockedActions: number;
  escalatedCases: number;
  revenueActuallyRecovered: number;
  recoveryRatePercentage: number;
  precision: string | number;
  recall: string | number;
  f1Score: string | number;
  accuracy: string | number;
  confusionMatrix: ConfusionMatrix;
  ruleBasedPrecision: number;
  ruleBasedRecall: number;
  ruleBasedF1: number;
  evaluationNote: string;
  simulatedTimeSeconds: number;
}
