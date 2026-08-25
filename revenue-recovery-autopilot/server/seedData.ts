import { Customer, Transaction, FailureReason, FailureCategory, PaymentStatus } from '../src/types';

// Deterministic seed generator for 100+ realistic Indian merchant transactions
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Pari', 'Myra', 'Riya', 'Anika', 'Isha',
  'Rohan', 'Vikram', 'Pooja', 'Neha', 'Rahul', 'Sneha', 'Amit', 'Priya', 'Karan', 'Meera',
  'Deepak', 'Tanvi', 'Siddharth', 'Kavya', 'Manish', 'Shreya', 'Gaurav', 'Divya', 'Sanjay', 'Swati'
];

const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Gupta', 'Mehta', 'Nair', 'Iyer', 'Joshi', 'Kulkarni',
  'Deshmukh', 'Singhania', 'Chopra', 'Malhotra', 'Bhatia', 'Menon', 'Rao', 'Bose', 'Chatterjee', 'Agarwal'
];

const cities = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh'];

const itemCatalog = [
  { name: 'SaaS Pro Annual Subscription', amount: 14999, method: 'CREDIT_CARD' as const, isSub: true },
  { name: 'SaaS Starter Monthly Plan', amount: 999, method: 'SUBSCRIPTION' as const, isSub: true },
  { name: 'Developer Cloud Credits (Pack B)', amount: 4999, method: 'NET_BANKING' as const, isSub: false },
  { name: 'Ergonomic Standing Desk', amount: 24999, method: 'CREDIT_CARD' as const, isSub: false },
  { name: 'Noise-Cancelling Headphones Pro', amount: 8499, method: 'UPI' as const, isSub: false },
  { name: 'AI Copywriter Premium Yearly', amount: 7999, method: 'CREDIT_CARD' as const, isSub: true },
  { name: 'Organic Grocery Super Basket', amount: 2499, method: 'UPI' as const, isSub: false },
  { name: 'Designer Leather Laptop Sleeve', amount: 1899, method: 'UPI' as const, isSub: false },
  { name: 'Enterprise Analytics Tier 1', amount: 48000, method: 'NET_BANKING' as const, isSub: true },
  { name: 'Fintech Masterclass Live Pass', amount: 3499, method: 'UPI' as const, isSub: false },
  { name: 'Mechanical Keyboard RGB Custom', amount: 6299, method: 'DEBIT_CARD' as const, isSub: false },
  { name: 'Fitness Gym App 6-Month Pass', amount: 4499, method: 'UPI' as const, isSub: true },
  { name: 'Artisan Coffee Subscription Box', amount: 1299, method: 'SUBSCRIPTION' as const, isSub: true },
  { name: 'Smart Home Security Cam 2K', amount: 3799, method: 'UPI' as const, isSub: false },
  { name: 'B2B API High-Throughput Addon', amount: 32000, method: 'NET_BANKING' as const, isSub: false }
];

export interface SeedDataset {
  customers: Customer[];
  transactions: Transaction[];
}

export function generateSeedDataset(): SeedDataset {
  const customers: Customer[] = [];
  const transactions: Transaction[] = [];

  // Generate 45 realistic customer profiles
  for (let i = 1; i <= 45; i++) {
    const fn = firstNames[(i * 7) % firstNames.length];
    const ln = lastNames[(i * 11) % lastNames.length];
    const city = cities[(i * 3) % cities.length];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;
    const phone = `+91 98${(10000000 + i * 83741).toString().slice(0, 8)}`;
    
    // Determine profile tier and traits
    let tier: 'VIP' | 'REGULAR' | 'NEW' = 'REGULAR';
    let totalTx = 4 + (i % 12);
    let successTx = Math.max(1, totalTx - (i % 3));
    let failTx = totalTx - successTx;
    let tenure = 3 + (i % 36);
    let riskScore = 15 + ((i * 17) % 65);
    let prevRecovery = 60 + ((i * 13) % 40);

    if (i % 5 === 0) {
      tier = 'VIP';
      totalTx = 18 + (i % 10);
      successTx = totalTx - 1;
      failTx = 1;
      tenure = 24 + (i % 24);
      riskScore = 8;
      prevRecovery = 95;
    } else if (i % 7 === 0) {
      tier = 'NEW';
      totalTx = 1;
      successTx = 0;
      failTx = 1;
      tenure = 1;
      riskScore = 78;
      prevRecovery = 20;
    }

    const avgAmount = 3000 + ((i * 997) % 8000);
    const lifetimeValue = successTx * avgAmount;

    customers.push({
      id: `CUST-${1000 + i}`,
      name: `${fn} ${ln}`,
      email,
      phone,
      tenureMonths: tenure,
      totalTransactions: totalTx,
      successfulTransactions: successTx,
      failedTransactions: failTx,
      lifetimeValue,
      tier,
      riskScore,
      previousRecoveryRate: prevRecovery,
      city
    });
  }

  // Pre-configured distinct failure templates to create 105 realistic cases
  const failureScenarios: {
    reason: FailureReason;
    category: FailureCategory;
    gatewayCode: string;
    description: string;
    recoverable: boolean;
  }[] = [
    {
      reason: 'OTP_TIMEOUT',
      category: 'CUSTOMER_ACTIONABLE',
      gatewayCode: 'BAD_REQUEST_OTP_EXPIRED',
      description: 'Customer did not enter bank OTP within 180 seconds window',
      recoverable: true
    },
    {
      reason: 'INSUFFICIENT_FUNDS',
      category: 'CUSTOMER_ACTIONABLE',
      gatewayCode: 'DECLINED_INSUFFICIENT_BALANCE',
      description: 'Customer account had insufficient balance at moment of mandate execution',
      recoverable: true
    },
    {
      reason: 'GATEWAY_DOWNTIME',
      category: 'TECHNICAL',
      gatewayCode: 'ISSUER_DOWNTIME_HTTP_504',
      description: 'Issuing bank switch was temporarily unresponsive during 3D Secure verification',
      recoverable: true
    },
    {
      reason: 'NETWORK_ERROR',
      category: 'TECHNICAL',
      gatewayCode: 'NETWORK_SOCKET_TIMEOUT',
      description: 'Mobile browser connection dropped right before payment capture acknowledgement',
      recoverable: true
    },
    {
      reason: 'CARD_EXPIRED',
      category: 'CUSTOMER_ACTIONABLE',
      gatewayCode: 'CARD_VALIDITY_EXPIRED',
      description: 'Saved mandate card validity expired this calendar month',
      recoverable: true
    },
    {
      reason: 'CHECKOUT_DROPOFF',
      category: 'ABANDONMENT',
      gatewayCode: 'USER_CLOSED_MODAL',
      description: 'User initiated checkout and viewed payment options but dismissed Razorpay modal',
      recoverable: true
    },
    {
      reason: 'SUBSCRIPTION_RENEWAL_FAILED',
      category: 'BANK_FAILURE',
      gatewayCode: 'AUTODEBIT_MANDATE_REJECTED',
      description: 'Recurring e-mandate declined due to temporary bank processing cutoff window',
      recoverable: true
    },
    {
      reason: 'AUTH_FAILED',
      category: 'CUSTOMER_ACTIONABLE',
      gatewayCode: 'MPIN_INCORRECT_ATTEMPTS',
      description: 'Customer typed incorrect UPI MPIN twice in UPI app',
      recoverable: true
    },
    {
      reason: 'LIMIT_EXCEEDED',
      category: 'BANK_FAILURE',
      gatewayCode: 'DAILY_TRANSACTION_LIMIT_REACHED',
      description: 'Customer crossed daily UPI per-transaction limit set by issuing bank',
      recoverable: true
    },
    {
      reason: 'FRAUD_SUSPECTED',
      category: 'FRAUD_RISK',
      gatewayCode: 'RISK_ENGINE_VELOCITY_TRIGGER',
      description: 'High velocity IP mismatch flagged by automated risk rules',
      recoverable: false
    }
  ];

  // Generate 105 realistic transaction records
  for (let i = 1; i <= 105; i++) {
    const custIndex = (i * 3) % customers.length;
    const customer = customers[custIndex];
    const catalogItem = itemCatalog[(i * 7) % itemCatalog.length];
    const scenario = failureScenarios[(i * 11) % failureScenarios.length];

    // Determine status (mostly failed/abandoned for recovery cases, a few captured for baseline)
    let status: PaymentStatus = 'failed';
    if (scenario.reason === 'CHECKOUT_DROPOFF') {
      status = 'abandoned';
    }

    // Determine timestamp within last 14 days
    const hoursAgo = (i * 3.1) % 336; // up to 14 days
    const date = new Date(Date.now() - hoursAgo * 3600 * 1000);

    const txId = `pay_test_${(100000000 + i * 39821).toString().slice(0, 8)}`;
    const orderId = `order_${(900000000 + i * 49173).toString().slice(0, 9)}`;

    transactions.push({
      id: txId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      amount: catalogItem.amount,
      currency: 'INR',
      status,
      failureReason: scenario.reason,
      failureCategory: scenario.category,
      gatewayResponseCode: scenario.gatewayCode,
      paymentMethod: catalogItem.method,
      timestamp: date.toISOString(),
      razorpayPaymentId: txId,
      orderId,
      itemDescription: catalogItem.name
    });
  }

  return { customers, transactions };
}
