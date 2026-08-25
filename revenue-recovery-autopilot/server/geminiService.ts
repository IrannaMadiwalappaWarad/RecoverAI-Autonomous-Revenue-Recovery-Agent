import { GoogleGenAI, Type } from '@google/genai';
import { RecoveryCase, AIDiagnosis } from '../src/types';
import { computeRecoveryScore } from './scoringEngine';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

export async function runAIDiagnosis(recoveryCase: RecoveryCase, skipLLM: boolean = false): Promise<AIDiagnosis> {
  const ai = getAI();
  const mlScore = computeRecoveryScore(recoveryCase.transaction, recoveryCase.customer, recoveryCase.attemptsCount);

  // If Gemini API Key is missing, in offline mode, or batch processing flag is set, return high-fidelity ML explainable diagnosis
  if (!ai || skipLLM) {
    return {
      summary: `AI Agent identified an actionable ${recoveryCase.failureCategory.toLowerCase()} failure for customer ${recoveryCase.customer.name} (order ${recoveryCase.transaction.orderId}).`,
      failureRootCause: mlScore.featureAttributions[0]?.description || `Transaction failed due to ${recoveryCase.failureReason}`,
      isRecoverable: mlScore.recoveryProbability >= 25 && recoveryCase.failureReason !== 'FRAUD_SUSPECTED',
      recoveryProbability: mlScore.recoveryProbability,
      suggestedIntervention: mlScore.recommendedAction,
      reasoning: mlScore.whyThisAction,
      expectedRecoveryValue: mlScore.expectedRecoveryValue,
      requiresApproval: mlScore.recommendedAction === 'MERCHANT_ESCALATION' || recoveryCase.amount > 5000,
      riskLevel: mlScore.riskLevel,
      stoppingCondition: mlScore.stoppingCondition,
      confidence: mlScore.confidence,
      whyThisAction: mlScore.whyThisAction,
      actionParams: {
        channel: 'SMS_EMAIL',
        expiryHours: 24,
        customMessage: `Hi ${recoveryCase.customer.name.split(' ')[0]}, complete your order for ${recoveryCase.transaction.itemDescription} securely using this instant link.`
      }
    };
  }

  try {
    const prompt = `You are the lead AI Revenue Recovery Agent for Razorpay merchants (Track 03: AI Revenue Recovery).
Analyze this failed/abandoned transaction case and return a structured recovery diagnosis:

CASE DETAILS:
- Case ID: ${recoveryCase.id}
- Transaction Amount: ₹${recoveryCase.amount} INR
- Payment Status: ${recoveryCase.paymentStatus}
- Failure Reason: ${recoveryCase.failureReason}
- Failure Category: ${recoveryCase.failureCategory}
- Gateway Response Code: ${recoveryCase.transaction.gatewayResponseCode || 'N/A'}
- Payment Method: ${recoveryCase.transaction.paymentMethod}
- Item Description: ${recoveryCase.transaction.itemDescription}
- Prior Recovery Attempts: ${recoveryCase.attemptsCount}

CUSTOMER 360:
- Customer: ${recoveryCase.customer.name} (${recoveryCase.customer.tier} tier)
- Tenure: ${recoveryCase.customer.tenureMonths} months
- Lifetime Value: ₹${recoveryCase.customer.lifetimeValue}
- Success Rate: ${recoveryCase.customer.successfulTransactions} / ${recoveryCase.customer.totalTransactions} transactions (${((recoveryCase.customer.successfulTransactions / (recoveryCase.customer.totalTransactions || 1)) * 100).toFixed(0)}%)
- Prior Recovery Conversion: ${recoveryCase.customer.previousRecoveryRate}%

BASELINE ML SCORING:
- Computed Probability: ${mlScore.recoveryProbability}%
- Baseline Action: ${mlScore.recommendedAction}

DIAGNOSTIC MANDATE:
1. Diagnose root cause (customer-actionable, bank switch drop, timeout, or fraud).
2. Assess if recoverable.
3. Compute precise recovery probability (0-100).
4. Select best intervention:
   - 'CREATE_PAYMENT_LINK' (for immediate actionable failures, low amount friction)
   - 'SMART_RETRY_FOLLOWUP' (for insufficient funds/mandate window cutoff)
   - 'MERCHANT_ESCALATION' (for high-value >₹5000 or low confidence)
   - 'DO_NOT_RECOVER' (for fraud or <25% probability)
5. State explicit stopping rule (when should the agent stop trying?).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Executive 1-sentence case diagnosis' },
            failureRootCause: { type: Type.STRING, description: 'Underlying technical or behavioral reason for failure' },
            isRecoverable: { type: Type.BOOLEAN, description: 'Whether this revenue can be recovered' },
            recoveryProbability: { type: Type.INTEGER, description: 'Estimated probability between 0 and 100' },
            suggestedIntervention: {
              type: Type.STRING,
              enum: ['CREATE_PAYMENT_LINK', 'SMART_RETRY_FOLLOWUP', 'MERCHANT_ESCALATION', 'DO_NOT_RECOVER']
            },
            reasoning: { type: Type.STRING, description: 'Detailed reasoning for the chosen intervention' },
            expectedRecoveryValue: { type: Type.INTEGER, description: 'Expected financial value in INR' },
            requiresApproval: { type: Type.BOOLEAN, description: 'Whether human merchant must approve before execution' },
            riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            stoppingCondition: { type: Type.STRING, description: 'Strict condition upon which recovery attempts must halt' },
            confidence: { type: Type.NUMBER, description: 'Model confidence score between 0 and 1' },
            whyThisAction: { type: Type.STRING, description: 'Clear human-readable justification for the merchant' }
          },
          required: [
            'summary',
            'failureRootCause',
            'isRecoverable',
            'recoveryProbability',
            'suggestedIntervention',
            'reasoning',
            'expectedRecoveryValue',
            'requiresApproval',
            'riskLevel',
            'stoppingCondition',
            'confidence',
            'whyThisAction'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      summary: parsed.summary || mlScore.whyThisAction,
      failureRootCause: parsed.failureRootCause || `Failure caused by ${recoveryCase.failureReason}`,
      isRecoverable: typeof parsed.isRecoverable === 'boolean' ? parsed.isRecoverable : mlScore.recoveryProbability >= 25,
      recoveryProbability: parsed.recoveryProbability || mlScore.recoveryProbability,
      suggestedIntervention: parsed.suggestedIntervention || mlScore.recommendedAction,
      reasoning: parsed.reasoning || mlScore.whyThisAction,
      expectedRecoveryValue: parsed.expectedRecoveryValue || mlScore.expectedRecoveryValue,
      requiresApproval: parsed.requiresApproval ?? (recoveryCase.amount > 5000),
      riskLevel: parsed.riskLevel || mlScore.riskLevel,
      stoppingCondition: parsed.stoppingCondition || mlScore.stoppingCondition,
      confidence: parsed.confidence || mlScore.confidence,
      whyThisAction: parsed.whyThisAction || mlScore.whyThisAction,
      actionParams: {
        channel: 'SMS_EMAIL',
        expiryHours: 24,
        customMessage: `Hi ${recoveryCase.customer.name.split(' ')[0]}, complete your order for ${recoveryCase.transaction.itemDescription} securely using this instant link.`
      }
    };
  } catch (err) {
    console.warn('[Gemini API Diagnosis Fallback]', err);
    // Graceful fallback to ML Scoring Engine
    return {
      summary: `AI Agent identified an actionable ${recoveryCase.failureCategory.toLowerCase()} failure for customer ${recoveryCase.customer.name}.`,
      failureRootCause: mlScore.featureAttributions[0]?.description || `Transaction failed due to ${recoveryCase.failureReason}`,
      isRecoverable: mlScore.recoveryProbability >= 25 && recoveryCase.failureReason !== 'FRAUD_SUSPECTED',
      recoveryProbability: mlScore.recoveryProbability,
      suggestedIntervention: mlScore.recommendedAction,
      reasoning: mlScore.whyThisAction,
      expectedRecoveryValue: mlScore.expectedRecoveryValue,
      requiresApproval: mlScore.recommendedAction === 'MERCHANT_ESCALATION' || recoveryCase.amount > 5000,
      riskLevel: mlScore.riskLevel,
      stoppingCondition: mlScore.stoppingCondition,
      confidence: mlScore.confidence,
      whyThisAction: mlScore.whyThisAction,
      actionParams: {
        channel: 'SMS_EMAIL',
        expiryHours: 24,
        customMessage: `Hi ${recoveryCase.customer.name.split(' ')[0]}, complete your order for ${recoveryCase.transaction.itemDescription} securely using this instant link.`
      }
    };
  }
}
