/**
 * Payment Store
 * Manages payment state and operations for the application
 */

import { create } from 'zustand';
import axios from 'axios';
import { PaymentsAPI, CustomersAPI, SubscriptionsAPI } from '../integrations/dodo-payments/api';
import { 
  PaymentResult, 
  Customer, 
  Subscription, 
  CheckoutSession,
  BillingInterval
} from '../integrations/dodo-payments/types';
import { useProfileStore } from './profileStore';

interface PaymentState {
  // Payment state
  isLoading: boolean;
  error: string | null;
  lastCheckoutSession: CheckoutSession | null;
  customerPayments: PaymentResult[];
  activeSubscription: Subscription | null;
  
  // Payment actions
  createCheckoutSession: (
    amount: number, 
    currency?: string,
    metadata?: Record<string, unknown>
  ) => Promise<CheckoutSession>;
  
  redirectToCheckout: (checkoutSession: CheckoutSession) => void;
  
  getActiveSubscription: () => Promise<Subscription | null>;
  
  cancelSubscription: (subscriptionId: string) => Promise<boolean>;
  
  syncCustomerWithProfile: () => Promise<Customer | null>;
  
  fetchCustomerPayments: (limit?: number) => Promise<PaymentResult[]>;
  
  clearPaymentState: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  // Initial state
  isLoading: false,
  error: null,
  lastCheckoutSession: null,
  customerPayments: [],
  activeSubscription: null,
  
  // Actions
  createCheckoutSession: async (amount, currency = 'USD', metadata) => {
    set({ isLoading: true, error: null });
    try {
      // Get profile from profile store
      const profile = useProfileStore.getState().profile;
      
      if (!profile) {
        throw new Error('User profile not found. Please log in first.');
      }
      
      // Create or retrieve customer ID
      let customerId = profile.customer_id;
      
      if (!customerId) {
        // Create a new customer if one doesn't exist
        const customer = await CustomersAPI.createCustomer(
          profile.email || '',
          profile.full_name,
          { profile_id: profile.id }
        );
        customerId = customer.id;
        
        // Update profile with customer ID
        await useProfileStore.getState().updateProfile({
          customer_id: customerId
        });
      }
      
      // Create checkout session
      const checkoutSession = await PaymentsAPI.createCheckoutSession(
        amount,
        currency,
        customerId,
        window.location.origin + '/payment-success',
        window.location.origin + '/payment-cancel',
        {
          ...metadata,
          profile_id: profile.id
        }
      );
      
      set({ 
        lastCheckoutSession: checkoutSession,
        isLoading: false 
      });
      
      return checkoutSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  redirectToCheckout: (checkoutSession) => {
    if (checkoutSession?.url) {
      window.location.href = checkoutSession.url;
    } else {
      set({ error: 'Invalid checkout session' });
    }
  },
  
  getActiveSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = useProfileStore.getState().profile;
      
      if (!profile || !profile.customer_id) {
        set({ activeSubscription: null, isLoading: false });
        return null;
      }
      
      // List subscriptions using the SubscriptionsAPI
      const subscriptions = await SubscriptionsAPI.listSubscriptions(profile.customer_id, 10);
      
      const activeSubscription = Array.isArray(subscriptions) ? 
        subscriptions.find(sub => sub.status === 'active') : null;
      
      set({ 
        activeSubscription: activeSubscription || null,
        isLoading: false 
      });
      
      return activeSubscription || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active subscription';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },
  
  cancelSubscription: async (subscriptionId) => {
    set({ isLoading: true, error: null });
    try {
      await SubscriptionsAPI.cancelSubscription(subscriptionId);
      
      // Refresh subscription state
      await get().getActiveSubscription();
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },
  
  syncCustomerWithProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = useProfileStore.getState().profile;
      
      if (!profile) {
        set({ isLoading: false });
        return null;
      }
      
      // If customer ID exists, update customer details
      if (profile.customer_id) {
        const customer = await CustomersAPI.updateCustomer(
          profile.customer_id,
          {
            email: profile.email || '',
            name: profile.full_name,
            metadata: { profile_id: profile.id }
          }
        );
        
        set({ isLoading: false });
        return customer;
      }
      
      // Create new customer if no customer ID exists
      const customer = await CustomersAPI.createCustomer(
        profile.email || '',
        profile.full_name,
        { profile_id: profile.id }
      );
      
      // Update profile with customer ID
      await useProfileStore.getState().updateProfile({
        customer_id: customer.id
      });
      
      set({ isLoading: false });
      return customer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync customer with profile';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },
  
  fetchCustomerPayments: async (limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const profile = useProfileStore.getState().profile;
      
      if (!profile || !profile.customer_id) {
        set({ customerPayments: [], isLoading: false });
        return [];
      }
      
      const payments = await PaymentsAPI.listCustomerPayments(
        profile.customer_id,
        limit
      );
      
      set({ 
        customerPayments: payments || [],
        isLoading: false 
      });
      
      return payments || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customer payments';
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },
  
  clearPaymentState: () => {
    set({
      lastCheckoutSession: null,
      customerPayments: [],
      activeSubscription: null,
      error: null
    });
  }
}));
