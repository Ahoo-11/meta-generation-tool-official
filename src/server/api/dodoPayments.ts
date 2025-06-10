import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { supabase as db } from '../../integrations/supabase/client';
import { requireAuth } from '../middleware/auth.js';
import fetch from 'node-fetch';

/**
 * Router for Dodo Payments API endpoints
 */
const router = express.Router();

// Middleware to validate request body against a Zod schema
const validateBody = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ error: error.errors });
  }
};

// Create a payment link for one-time payments or subscriptions
router.post('/createPaymentLink', validateBody(
  z.object({
    productId: z.string(),
    quantity: z.number().optional().default(1),
    customerId: z.string().optional(),
    redirectUrl: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional()
  })
), async (req, res) => {
  try {
    const input = req.validatedBody;
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Dodo Payments API key not configured' });
    }
    
    const paymentData = {
      product_id: input.productId,
      quantity: input.quantity,
      payment_link: true,
      redirect_url: input.redirectUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/subscription-success`,
      metadata: input.metadata || {}
    };
    
    // Add customer if provided
    if (input.customerId) {
      paymentData['customer'] = {
        customer_id: input.customerId
      };
    }
    
    try {
      const response = await fetch(`${process.env.DODO_PAYMENTS_API_URL}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create payment link: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error creating payment link:', error);
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Process webhook events from Dodo Payments
router.post('/webhook', validateBody(
  z.object({
    body: z.any(),
    headers: z.record(z.string(), z.string())
  })
), async (req, res) => {
  try {
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    const webhookSignature = req.headers['webhook-signature'] as string;
    const webhookId = req.headers['webhook-id'] as string;
    const webhookTimestamp = req.headers['webhook-timestamp'] as string;
    
    if (!webhookSignature || !webhookId || !webhookTimestamp) {
      return res.status(400).json({ error: 'Missing webhook signature headers' });
    }
    
    // Verify webhook signature
    const stringToSign = `${webhookId}.${webhookTimestamp}.${JSON.stringify(req.body)}`;
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(stringToSign)
      .digest('hex');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(webhookSignature),
      Buffer.from(computedSignature)
    );
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    // Process the webhook event based on its type
    const { type, data } = req.body;
    
    switch (type) {
      case 'subscription.active':
        await handleSubscriptionActive(data);
        break;
        
      case 'subscription.on_hold':
        await handleSubscriptionOnHold(data);
        break;
        
      case 'subscription.failed':
        await handleSubscriptionFailed(data);
        break;
        
      case 'subscription.renewed':
        await handleSubscriptionRenewed(data);
        break;
        
      case 'subscription.plan_changed':
        await handleSubscriptionPlanChanged(data);
        break;
        
      case 'payment.succeeded':
        await handlePaymentSucceeded(data);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Cancel a subscription
router.post('/subscriptions/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Dodo Payments API key not configured' });
    }
    
    const response = await fetch(`${process.env.DODO_PAYMENTS_API_URL}/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(400).json({ error: `Failed to cancel subscription: ${errorData.message || response.statusText}` });
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Change a subscription plan
router.post('/subscriptions/:subscriptionId/change-plan', validateBody(
  z.object({
    newPlanId: z.string()
  })
), async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { newPlanId } = req.validatedBody;
    
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Dodo Payments API key not configured' });
    }
    
    const response = await fetch(`${process.env.DODO_PAYMENTS_API_URL}/v1/subscriptions/${subscriptionId}/change-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        plan_id: newPlanId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(400).json({ error: `Failed to change subscription plan: ${errorData.message || response.statusText}` });
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Webhook event handlers
async function handleSubscriptionActive(data) {
  // Update the user's subscription status in the database
  const { subscription_id, customer_id, status, current_period_end } = data;
  
  try {
    // Update profile with subscription info
    await db.from('profiles').update({
      subscription_id: subscription_id,
      subscription_status: status,
      subscription_current_period_end: new Date(current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }).eq('customer_id', customer_id);
    
    // Call the manage_profile RPC to update credits based on subscription
    await db.rpc('manage_profile', {
      operation: 'refresh',
      profile_id: customer_id
    });
    
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

async function handleSubscriptionOnHold(data) {
  const { subscription_id, customer_id, status } = data;
  
  try {
    await db.from('profiles').update({
      subscription_status: status,
      updated_at: new Date().toISOString()
    }).eq('customer_id', customer_id);
  } catch (error) {
    console.error('Error updating subscription status to on_hold:', error);
    throw error;
  }
}

async function handleSubscriptionFailed(data) {
  const { subscription_id, customer_id, status } = data;
  
  try {
    await db.from('profiles').update({
      subscription_status: status,
      updated_at: new Date().toISOString()
    }).eq('customer_id', customer_id);
    
    // When subscription fails, reset credits to free tier
    await db.rpc('manage_profile', {
      operation: 'reset',
      profile_id: customer_id
    });
  } catch (error) {
    console.error('Error updating subscription status to failed:', error);
    throw error;
  }
}

async function handleSubscriptionRenewed(data) {
  const { subscription_id, customer_id, current_period_end } = data;
  
  try {
    await db.from('profiles').update({
      subscription_current_period_end: new Date(current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }).eq('customer_id', customer_id);
    
    // Refresh credits for the new billing cycle
    await db.rpc('manage_profile', {
      operation: 'refresh',
      profile_id: customer_id
    });
  } catch (error) {
    console.error('Error updating subscription renewal:', error);
    throw error;
  }
}

async function handleSubscriptionPlanChanged(data) {
  const { 
    subscription_id, 
    customer_id, 
    current_period_end,
    previous_plan,
    new_plan 
  } = data;
  
  try {
    // Update the subscription details in the database
    await db.from('profiles').update({
      subscription_plan: new_plan.id,
      subscription_current_period_end: new Date(current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }).eq('customer_id', customer_id);
    
    // Refresh credits based on the new plan
    await db.rpc('manage_profile', {
      operation: 'refresh',
      profile_id: customer_id
    });
    
    // Log the plan change event
    await db.from('subscription_events').insert({
      profile_id: customer_id,
      subscription_id: subscription_id,
      event_type: 'plan_changed',
      previous_plan: previous_plan.id,
      new_plan: new_plan.id,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling subscription plan change:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(data) {
  const { payment_id, customer_id, amount, currency } = data;
  
  try {
    // Log the successful payment
    await db.from('payment_history').insert({
      profile_id: customer_id,
      payment_id: payment_id,
      amount: amount,
      currency: currency,
      status: 'succeeded',
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging successful payment:', error);
    throw error;
  }
}

async function handlePaymentFailed(data) {
  const { payment_id, customer_id, amount, currency, error } = data;
  
  try {
    // Log the failed payment
    await db.from('payment_history').insert({
      profile_id: customer_id,
      payment_id: payment_id,
      amount: amount,
      currency: currency,
      status: 'failed',
      error_message: error?.message,
      error_code: error?.code,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging failed payment:', error);
    throw error;
  }
}

export default router;
