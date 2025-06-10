/**
 * Server-side API endpoints for Dodo Payments subscription management
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
 * List subscriptions for a customer
 * GET /api/subscriptions
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { customerId, limit, startingAfter } = req.query;
    
    const response = await dodoApi.get('/subscriptions', {
      params: {
        customer_id: customerId,
        limit: limit || 10,
        starting_after: startingAfter
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

/**
 * Create a new subscription
 * POST /api/subscriptions
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { customerId, priceId, quantity, metadata, trialPeriodDays } = req.body;
    
    const subscriptionData = {
      customer: {
        customer_id: customerId
      },
      product_id: priceId,
      quantity: quantity || 1,
      metadata: metadata || {},
      trial_period_days: trialPeriodDays
    };
    
    const response = await dodoApi.post('/subscriptions', subscriptionData);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * Get subscription details
 * GET /api/subscriptions/:subscriptionId
 */
router.get('/:subscriptionId', requireAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const response = await dodoApi.get(`/subscriptions/${subscriptionId}`);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Failed to get subscription details' });
  }
});

/**
 * Update subscription details
 * PATCH /api/subscriptions/:subscriptionId
 */
router.patch('/:subscriptionId', requireAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { priceId, quantity, cancelAtPeriodEnd, metadata } = req.body;
    
    // Format request for Dodo Payments API
    const updateData: Record<string, unknown> = {};
    
    if (priceId) updateData.price_id = priceId;
    if (quantity) updateData.quantity = quantity;
    if (cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = cancelAtPeriodEnd;
    if (metadata) updateData.metadata = metadata;
    
    const response = await dodoApi.patch(`/subscriptions/${subscriptionId}`, updateData);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

/**
 * Cancel a subscription
 * DELETE /api/subscriptions/:subscriptionId
 */
router.delete('/:subscriptionId', requireAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Set cancel_at_period_end to true to cancel at the end of the billing period
    const response = await dodoApi.patch(`/subscriptions/${subscriptionId}`, {
      cancel_at_period_end: true
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;
