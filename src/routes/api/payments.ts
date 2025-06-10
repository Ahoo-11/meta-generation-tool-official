/**
 * Payment API Routes
 * Handles payment-related API requests
 */

import { Router } from 'express';
import * as PaymentsAPI from '../../integrations/dodo-payments/payments.js';
import { requireAuth } from '../../server/middleware/auth.js';

const router = Router();

/**
 * Create checkout session
 * POST /api/payments/checkout
 */
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { 
      amount, 
      currency, 
      customerId, 
      successUrl, 
      cancelUrl, 
      metadata 
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const session = await PaymentsAPI.createCheckoutSession(
      amount,
      currency || 'USD',
      customerId,
      successUrl,
      cancelUrl,
      metadata
    );

    return res.status(200).json(session);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get payment details
 * GET /api/payments/:paymentId
 */
router.get('/:paymentId', requireAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = await PaymentsAPI.getPayment(paymentId);
    return res.status(200).json(payment);
  } catch (error) {
    console.error('Error retrieving payment:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create customer
 * POST /api/payments/customers
 */
router.post('/customers', requireAuth, async (req, res) => {
  try {
    const { email, name, metadata } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customer = await PaymentsAPI.createCustomer(email, name, metadata);
    return res.status(200).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ 
      error: 'Failed to create customer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get customer details
 * GET /api/payments/customers/:customerId
 */
router.get('/customers/:customerId', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const customer = await PaymentsAPI.getCustomer(customerId);
    return res.status(200).json(customer);
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve customer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create subscription
 * POST /api/payments/subscriptions
 */
router.post('/subscriptions', requireAuth, async (req, res) => {
  try {
    const { customerId, priceId, quantity, metadata } = req.body;
    
    if (!customerId || !priceId) {
      return res.status(400).json({ error: 'Customer ID and Price ID are required' });
    }

    const subscription = await PaymentsAPI.createSubscription(
      customerId,
      priceId,
      quantity,
      metadata
    );
    
    return res.status(200).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
