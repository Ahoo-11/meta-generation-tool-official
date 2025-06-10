/**
 * API service for Dodo Payments integration
 * This file provides a clean API for interacting with the Dodo Payments API
 * via our server-side endpoints
 */

import axios from 'axios';
import { 
  PaymentResult, 
  Customer, 
  Subscription, 
  CheckoutSession,
  BillingInterval
} from './types';
import { supabase } from '../supabase/client';

// Configure axios instance for our server API
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('Error getting auth session:', error);
  }
  return config;
});


/**
 * Payment API functions
 */
export const PaymentsAPI = {
  /**
   * Create a checkout session for a one-time payment
   */
  createCheckoutSession: async (
    amount: number,
    currency: string = 'USD',
    customerId?: string,
    successUrl: string = window.location.origin + '/subscription-success',
    cancelUrl: string = window.location.origin + '/subscription-cancel',
    metadata?: Record<string, unknown>
  ): Promise<CheckoutSession> => {
    try {
      // Format request for Dodo Payments API
      const paymentData = {
        billing_currency: currency,
        allowed_payment_method_types: ['credit', 'debit'],
        product_cart: [
          {
            amount: Math.round(amount * 100), // Convert to cents
            product_id: 'custom', // Use a placeholder product ID
            quantity: 1
          }
        ],
        return_url: successUrl,
        payment_link: true,
        metadata: metadata || {}
      };
      
      // Add customer if provided
      if (customerId) {
        paymentData['customer'] = {
          customer_id: customerId
        };
      }
      
      // Make API request to our server endpoint
      const response = await apiClient.post('/payments/checkout', paymentData);
      
      // Return checkout session data
      return {
        id: response.data.id,
        url: response.data.url,
        expiresAt: response.data.expires_at || Date.now() + 30 * 60 * 1000
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  /**
   * Get payment details by ID
   */
  getPayment: async (paymentId: string): Promise<PaymentResult> => {
    try {
      const response = await apiClient.get(`/payments/${paymentId}`);
      
      if (!response.data) {
        throw new Error(`Payment not found: ${paymentId}`);
      }
      
      // Map Dodo Payments response to our PaymentResult type
      return {
        id: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        status: response.data.status,
        customerId: response.data.customer_id,
        createdAt: new Date(response.data.created_at).getTime()
      };
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error;
    }
  },

  /**
   * List payments for a customer
   */
  listCustomerPayments: async (
    customerId: string,
    limit: number = 10,
    startingAfter?: string
  ): Promise<PaymentResult[]> => {
    try {
      const response = await apiClient.get('/payments', {
        params: {
          customerId,
          limit,
          startingAfter
        }
      });
      
      if (!response.data || !Array.isArray(response.data.data)) {
        return []; // Return empty array if no payments found
      }
      
      // Map Dodo Payments response to our PaymentResult type
      return response.data.data.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        customerId: payment.customer_id,
        createdAt: new Date(payment.created_at).getTime()
      }));
    } catch (error) {
      console.error('Error listing customer payments:', error);
      throw error;
    }
  }
};

/**
 * Customer API functions
 */
export const CustomersAPI = {
  /**
   * Create a new customer
   */
  createCustomer: async (
    email: string,
    name?: string,
    metadata?: Record<string, unknown>
  ): Promise<Customer> => {
    try {
      const response = await apiClient.post('/customers', {
        email,
        name,
        metadata
      });
      
      if (!response.data) {
        throw new Error('Failed to create customer');
      }
      
      // Map Dodo Payments response to our Customer type
      return {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        createdAt: new Date(response.data.created_at).getTime(),
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  /**
   * Get customer details by ID
   */
  getCustomer: async (customerId: string): Promise<Customer> => {
    try {
      const response = await apiClient.get(`/customers/${customerId}`);
      if (!response.data) {
        throw new Error(`Customer not found: ${customerId}`);
      }
      
      // Map Dodo Payments response to our Customer type
      return {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        createdAt: new Date(response.data.created_at).getTime(),
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  },

  /**
   * Update customer details
   */
  updateCustomer: async (
    customerId: string,
    updates: {
      email?: string;
      name?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Customer> => {
    try {
      const response = await apiClient.patch(`/customers/${customerId}`, updates);
      if (!response.data) {
        throw new Error(`Failed to update customer: ${customerId}`);
      }
      
      // Map Dodo Payments response to our Customer type
      return {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        createdAt: new Date(response.data.created_at).getTime(),
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }
};

/**
 * Subscription API functions
 */
export const SubscriptionsAPI = {
  /**
   * List subscriptions for a customer
   */
  listSubscriptions: async (
    customerId: string,
    limit: number = 10,
    startingAfter?: string
  ): Promise<Subscription[]> => {
    try {
      const response = await apiClient.get('/subscriptions', {
        params: {
          customerId,
          limit,
          startingAfter
        }
      });
      
      if (!response.data || !Array.isArray(response.data.data)) {
        return []; // Return empty array if no subscriptions found
      }
      
      // Map Dodo Payments response to our Subscription type
      return response.data.data.map(subscription => ({
        id: subscription.id,
        customerId: subscription.customer_id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end).getTime(),
        currentPeriodStart: new Date(subscription.current_period_start).getTime(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        priceId: subscription.price_id,
        quantity: subscription.quantity || 1,
        metadata: subscription.metadata
      }));
    } catch (error) {
      console.error('Error listing subscriptions:', error);
      throw error;
    }
  },
  
  /**
   * Create a new subscription
   */
  createSubscription: async (
    customerId: string,
    priceId: string,
    quantity: number = 1,
    metadata?: Record<string, unknown>,
    trialPeriodDays?: number
  ): Promise<Subscription> => {
    try {
      const subscriptionData = {
        customerId,
        priceId,
        quantity,
        metadata: metadata || {},
        trialPeriodDays
      };
      
      const response = await apiClient.post('/subscriptions', subscriptionData);
      
      if (!response.data) {
        throw new Error('Failed to create subscription');
      }
      
      // Map Dodo Payments response to our Subscription type
      return {
        id: response.data.id,
        customerId: response.data.customer_id,
        status: response.data.status,
        currentPeriodEnd: new Date(response.data.current_period_end).getTime(),
        currentPeriodStart: new Date(response.data.current_period_start).getTime(),
        cancelAtPeriodEnd: response.data.cancel_at_period_end || false,
        priceId: response.data.price_id,
        quantity: response.data.quantity || 1,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  /**
   * Get subscription details by ID
   */
  getSubscription: async (subscriptionId: string): Promise<Subscription> => {
    try {
      const response = await apiClient.get(`/subscriptions/${subscriptionId}`);
      
      if (!response.data) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Map Dodo Payments response to our Subscription type
      return {
        id: response.data.id,
        customerId: response.data.customer_id,
        status: response.data.status,
        currentPeriodEnd: new Date(response.data.current_period_end).getTime(),
        currentPeriodStart: new Date(response.data.current_period_start).getTime(),
        cancelAtPeriodEnd: response.data.cancel_at_period_end || false,
        priceId: response.data.price_id,
        quantity: response.data.quantity || 1,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  },

  /**
   * Update subscription details
   */
  updateSubscription: async (
    subscriptionId: string,
    updates: {
      priceId?: string;
      quantity?: number;
      cancelAtPeriodEnd?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Subscription> => {
    try {
      // Format request for Dodo Payments API
      const updateData: Record<string, unknown> = {};
      
      if (updates.priceId) updateData.priceId = updates.priceId;
      if (updates.quantity) updateData.quantity = updates.quantity;
      if (updates.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = updates.cancelAtPeriodEnd;
      if (updates.metadata) updateData.metadata = updates.metadata;
      
      const response = await apiClient.patch(`/subscriptions/${subscriptionId}`, updateData);
      
      if (!response.data) {
        throw new Error(`Failed to update subscription: ${subscriptionId}`);
      }
      
      // Map Dodo Payments response to our Subscription type
      return {
        id: response.data.id,
        customerId: response.data.customer_id,
        status: response.data.status,
        currentPeriodEnd: new Date(response.data.current_period_end).getTime(),
        currentPeriodStart: new Date(response.data.current_period_start).getTime(),
        cancelAtPeriodEnd: response.data.cancel_at_period_end || false,
        priceId: response.data.price_id,
        quantity: response.data.quantity || 1,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  /**
   * Cancel a subscription at the end of the current billing period
   */
  cancelSubscription: async (subscriptionId: string): Promise<Subscription> => {
    try {
      // Set cancel_at_period_end to true to cancel at the end of the billing period
      const response = await apiClient.patch(`/subscriptions/${subscriptionId}`, {
        cancelAtPeriodEnd: true
      });
      
      if (!response.data) {
        throw new Error(`Failed to cancel subscription: ${subscriptionId}`);
      }
      
      // Map Dodo Payments response to our Subscription type
      return {
        id: response.data.id,
        customerId: response.data.customer_id,
        status: response.data.status,
        currentPeriodEnd: new Date(response.data.current_period_end).getTime(),
        currentPeriodStart: new Date(response.data.current_period_start).getTime(),
        cancelAtPeriodEnd: true,
        priceId: response.data.price_id,
        quantity: response.data.quantity || 1,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
};
