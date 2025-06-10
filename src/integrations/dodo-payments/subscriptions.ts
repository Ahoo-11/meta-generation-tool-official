/**
 * Subscription-related operations with Dodo Payments
 */
import { Subscription, CheckoutSession, BillingInterval } from './types';
import { callMcp } from './mcp-utils';

/**
 * Creates a checkout session for subscription
 */
export async function createSubscriptionCheckout(
  priceId: string,
  customerId?: string,
  successUrl: string = window.location.origin + '/subscription-success',
  cancelUrl: string = window.location.origin + '/subscription-cancel',
  trialPeriodDays?: number,
  metadata?: Record<string, unknown>
): Promise<CheckoutSession> {
  try {
    const request = {
      priceId,
      customerId,
      successUrl,
      cancelUrl,
      trialPeriodDays,
      metadata
    };
    
    const prompt = `Create a checkout session for subscription with: ${JSON.stringify(request)}`;
    return await callMcp<CheckoutSession>(prompt);
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    throw error;
  }
}

/**
 * Retrieves subscription details by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Subscription> {
  try {
    const prompt = `Retrieve subscription with ID: ${subscriptionId} from Dodo Payments`;
    return await callMcp<Subscription>(prompt);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Lists all subscriptions for a customer
 */
export async function listCustomerSubscriptions(
  customerId: string,
  limit: number = 10,
  status?: 'active' | 'canceled' | 'all'
): Promise<Subscription[]> {
  try {
    const request = {
      customerId,
      limit,
      status: status || 'all'
    };
    
    const prompt = `List subscriptions for customer with ID: ${customerId} with parameters: ${JSON.stringify(request)}`;
    return await callMcp<Subscription[]>(prompt);
  } catch (error) {
    console.error('Error listing customer subscriptions:', error);
    throw error;
  }
}

/**
 * Updates a subscription (e.g., change price, quantity)
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: {
    priceId?: string;
    quantity?: number;
    trialEnd?: number | 'now';
    cancelAtPeriodEnd?: boolean;
    metadata?: Record<string, unknown>;
  }
): Promise<Subscription> {
  try {
    const prompt = `Update subscription with ID: ${subscriptionId} with parameters: ${JSON.stringify(updates)}`;
    return await callMcp<Subscription>(prompt);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Cancels a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Subscription> {
  try {
    const request = {
      cancelAtPeriodEnd
    };
    
    const prompt = `Cancel subscription with ID: ${subscriptionId} with parameters: ${JSON.stringify(request)}`;
    return await callMcp<Subscription>(prompt);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Creates/updates subscription pricing plans
 */
export async function createSubscriptionPlan(
  name: string,
  amount: number,
  currency: string = 'usd',
  interval: BillingInterval = 'month',
  metadata?: Record<string, unknown>
): Promise<string> {
  try {
    const request = {
      name,
      amount,
      currency,
      interval,
      metadata
    };
    
    const prompt = `Create subscription plan with parameters: ${JSON.stringify(request)}`;
    const result = await callMcp<{ id: string }>(prompt);
    return result.id;
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    throw error;
  }
} 