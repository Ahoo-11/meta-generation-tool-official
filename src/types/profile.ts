/**
 * Profile related types for the application
 */

/**
 * User profile information
 */
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  subscription_id?: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_current_period_end?: string;
  credits_remaining: number;
  credits_total: number;
  permanent_credits: number;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
}

/**
 * Subscription status types
 */
export type SubscriptionStatus = 
  | 'active'
  | 'on_hold'
  | 'failed'
  | 'cancelled'
  | 'past_due';

/**
 * Subscription plan types
 */
export type SubscriptionPlan = 
  | 'free'
  | 'basic'
  | 'unlimited'
  | 'custom';

/**
 * Credit operation types
 */
export type CreditOperation = 
  | 'create'
  | 'reset'
  | 'refresh'
  | 'change_plan'
  | 'add_permanent_credits';

/**
 * Subscription event types
 */
export type SubscriptionEventType = 
  | 'plan_changed'
  | 'active'
  | 'on_hold'
  | 'failed'
  | 'renewed'
  | 'cancelled';

/**
 * Payment status types
 */
export type PaymentStatus = 
  | 'succeeded'
  | 'failed'
  | 'pending'
  | 'refunded';
