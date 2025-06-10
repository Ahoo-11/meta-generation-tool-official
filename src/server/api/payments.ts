/**
 * Server-side API endpoints for Dodo Payments integration
 */
import axios from 'axios';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

// Dodo Payments API configuration
const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY || 'Y5h-0edhftQ-_aWv.UDaLs-NfZ0DRsjzWCVZztJH_9xCF9UL7dHbe34fZZyDQd6Ij';
const DODO_API_URL = 'https://api.dodopayments.com/v1';

// Configure axios instance for Dodo Payments API
const dodoApi = axios.create({
  baseURL: DODO_API_URL,
  headers: {
    'Authorization': `Bearer ${DODO_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const router = Router();

/**
 * Create a checkout session
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

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount. Amount must be a positive number.'
      });
    }

    // Format request for Dodo Payments API
    const paymentData = {
      billing_currency: currency || 'USD',
      allowed_payment_method_types: ['credit', 'debit'],
      product_cart: [
        {
          amount: Math.round(Number(amount) * 100), // Convert to cents
          product_id: 'custom', // Use a placeholder product ID
          quantity: 1
        }
      ],
      return_url: successUrl || 'http://localhost:5174/payment-success',
      payment_link: true,
      metadata: metadata || {}
    };
    
    // Add customer if provided
    if (customerId) {
      paymentData['customer'] = {
        customer_id: customerId
      };
    }
    
    // Check if we're in development/test mode and API is not reachable
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    try {
      // Make API request to Dodo Payments
      const response = await dodoApi.post('/payments', paymentData);
    
      // Return checkout session data
      res.json({
        id: response.data.id,
        url: response.data.url,
        checkout_url: response.data.checkout_url,
        status: response.data.status,
        expires_at: response.data.expires_at
      });
    } catch (apiError) {
      // If API is not reachable in development, return a mock response
      if (isDevelopment && (apiError.code === 'ENOTFOUND' || apiError.code === 'ECONNREFUSED')) {
        console.warn('Dodo Payments API not reachable in development. Returning mock response.');
        const mockResponse = {
          id: `mock_payment_${Date.now()}`,
          url: 'https://checkout.dodopayments.com/mock-session',
          checkout_url: 'https://checkout.dodopayments.com/mock-session',
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
        return res.json(mockResponse);
      }
      
      // Re-throw the error if it's not a development DNS issue
      throw apiError;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Get payment details
 * GET /api/payments/:paymentId
 */
router.get('/:paymentId', requireAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const response = await dodoApi.get(`/payments/${paymentId}`);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ error: 'Failed to get payment details' });
  }
});

/**
 * List payments for a customer
 * GET /api/payments
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { customerId, limit, startingAfter } = req.query;
    
    const response = await dodoApi.get('/payments', {
      params: {
        customer_id: customerId,
        limit: limit || 10,
        starting_after: startingAfter
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error listing payments:', error);
    res.status(500).json({ error: 'Failed to list payments' });
  }
});

export default router;
