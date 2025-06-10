/**
 * Payment-related operations with Dodo Payments
 */
import { PaymentResult, CheckoutSession } from './types';

/**
 * Creates a checkout session for one-time payment
 */
export async function createCheckoutSession(
  amount: number,
  currency: string,
  customerId?: string,
  successUrl: string = 'http://localhost:5174/payment-success',
  cancelUrl: string = 'http://localhost:5174/payment-cancel',
  metadata?: Record<string, unknown>
): Promise<CheckoutSession> {
  try {
    // Direct API call to Dodo Payments without MCP
    const response = await fetch('https://api.dodopayments.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY || 'Y5h-0edhftQ-_aWv.UDaLs-NfZ0DRsjzWCVZztJH_9xCF9UL7dHbe34fZZyDQd6Ij'}`
      },
      body: JSON.stringify({
        billing_currency: currency,
        allowed_payment_method_types: ['credit', 'debit'],
        product_cart: [{
          amount: Math.round(amount * 100), // Convert to cents
          product_id: 'custom',
          quantity: 1
        }],
        return_url: successUrl,
        payment_link: true,
        metadata: metadata || {},
        ...(customerId && { customer: { customer_id: customerId } })
      })
    });

    if (!response.ok) {
      throw new Error(`Payment API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      id: result.id,
      url: result.url || result.checkout_url,
      expiresAt: result.expires_at || Date.now() + 30 * 60 * 1000
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieves payment details by ID
 */
export async function getPayment(paymentId: string): Promise<PaymentResult> {
  try {
    const response = await fetch(`https://api.dodopayments.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY || 'Y5h-0edhftQ-_aWv.UDaLs-NfZ0DRsjzWCVZztJH_9xCF9UL7dHbe34fZZyDQd6Ij'}`
      }
    });

    if (!response.ok) {
      throw new Error(`Payment API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      customerId: result.customer_id,
      createdAt: new Date(result.created_at).getTime(),
      metadata: result.metadata
    };
  } catch (error) {
    console.error('Error retrieving payment:', error);
    throw error;
  }
}

/**
 * Lists payments for a customer
 */
export async function listCustomerPayments(
  customerId: string,
  limit: number = 10,
  startingAfter?: string
): Promise<PaymentResult[]> {
  try {
    const params = new URLSearchParams({
      customer_id: customerId,
      limit: limit.toString(),
      ...(startingAfter && { starting_after: startingAfter })
    });

    const response = await fetch(`https://api.dodopayments.com/v1/payments?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY || 'Y5h-0edhftQ-_aWv.UDaLs-NfZ0DRsjzWCVZztJH_9xCF9UL7dHbe34fZZyDQd6Ij'}`
      }
    });

    if (!response.ok) {
      throw new Error(`Payment API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error listing customer payments:', error);
    throw error;
  }
}

/**
 * Creates a refund for a payment
 */
export async function createRefund(
  paymentId: string,
  amount?: number,
  reason?: 'requested_by_customer' | 'duplicate' | 'fraudulent'
): Promise<PaymentResult> {
  try {
    const response = await fetch(`https://api.dodopayments.com/v1/payments/${paymentId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY || 'Y5h-0edhftQ-_aWv.UDaLs-NfZ0DRsjzWCVZztJH_9xCF9UL7dHbe34fZZyDQd6Ij'}`
      },
      body: JSON.stringify({
        ...(amount && { amount }),
        ...(reason && { reason })
      })
    });

    if (!response.ok) {
      throw new Error(`Refund API error: ${response.status}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      customerId: result.customer_id,
      createdAt: new Date(result.created_at).getTime(),
      metadata: result.metadata
    };
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
}