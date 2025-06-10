/**
 * Type definitions for Dodo Payments integration
 */

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  created: number;
  customerId: string;
  isDefault: boolean;
  details: CardDetails | BankAccountDetails;
}

export interface CardDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface BankAccountDetails {
  bankName: string;
  last4: string;
  accountType: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodEnd: number;
  currentPeriodStart: number;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  defaultPaymentMethodId?: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'failed';
  customerId: string;
  createdAt: number;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export interface CheckoutSession {
  id: string;
  url: string;
  expiresAt: number;
}

export type BillingInterval = 'month' | 'year'; 