/**
 * Server-side API endpoints for Dodo Payments customer management
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
 * Create a new customer
 * POST /api/customers
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { email, name, metadata } = req.body;

    const response = await dodoApi.post('/customers', {
      email,
      name,
      metadata
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

/**
 * Get customer details
 * GET /api/customers/:customerId
 */
router.get('/:customerId', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const response = await dodoApi.get(`/customers/${customerId}`);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ error: 'Failed to get customer details' });
  }
});

/**
 * Update customer details
 * PATCH /api/customers/:customerId
 */
router.patch('/:customerId', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const updates = req.body;
    
    const response = await dodoApi.patch(`/customers/${customerId}`, updates);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

/**
 * Create customer portal session
 * POST /api/customers/portal
 */
router.post('/portal', requireAuth, async (req, res) => {
  try {
    const { customerId, sendEmail } = req.body;
    
    const response = await dodoApi.post('/customers/customer_portal', {
      customer_id: customerId,
      send_email: sendEmail
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create customer portal session' });
  }
});

export default router;
