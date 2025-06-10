import { Request, Response } from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: Request, res: Response) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const signature = req.headers['webhook-signature'] as string;
    const id = req.headers['webhook-id'] as string;
    const timestamp = req.headers['webhook-timestamp'] as string;
    
    if (!signature || !id || !timestamp) {
      console.error('Missing webhook signature headers');
      return res.status(400).json({ error: 'Missing webhook signature headers' });
    }

    // Create string to sign
    const payload = req.body;
    const stringToSign = `${id}.${timestamp}.${JSON.stringify(payload)}`;
    
    // Compute HMAC with SHA256
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(stringToSign)
      .digest('hex');
    
    // Compare signatures using a constant-time comparison function
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Process the webhook event
    const { type, data } = payload;
    console.log(`Processing webhook event: ${type}`);

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

    // Return a 200 success response
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Error processing webhook' });
  }
}

// Webhook event handler functions
async function handleSubscriptionActive(data) {
  const { subscription_id, customer_id, status, current_period_end } = data;
  
  try {
    // Update profile with subscription info
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_id: subscription_id,
        subscription_status: status,
        subscription_current_period_end: new Date(current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);
    
    if (error) throw error;
    
    // Call the manage_profile RPC to update credits based on subscription
    const { error: rpcError } = await supabase.rpc('manage_profile', {
      operation: 'refresh',
      profile_id: customer_id
    });
    
    if (rpcError) throw rpcError;
    
    console.log(`Subscription ${subscription_id} activated for customer ${customer_id}`);
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

async function handleSubscriptionOnHold(data) {
  const { subscription_id, customer_id, status } = data;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);
    
    if (error) throw error;
    
    console.log(`Subscription ${subscription_id} on hold for customer ${customer_id}`);
  } catch (error) {
    console.error('Error updating subscription status to on_hold:', error);
    throw error;
  }
}

async function handleSubscriptionFailed(data) {
  const { subscription_id, customer_id, status } = data;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);
    
    if (error) throw error;
    
    // When subscription fails, reset credits to free tier
    const { error: rpcError } = await supabase.rpc('manage_profile', {
      operation: 'reset',
      profile_id: customer_id
    });
    
    if (rpcError) throw rpcError;
    
    console.log(`Subscription ${subscription_id} failed for customer ${customer_id}`);
  } catch (error) {
    console.error('Error updating subscription status to failed:', error);
    throw error;
  }
}

async function handleSubscriptionRenewed(data) {
  const { subscription_id, customer_id, current_period_end } = data;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_current_period_end: new Date(current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);
    
    if (error) throw error;
    
    // Refresh credits for the new billing cycle
    const { error: rpcError } = await supabase.rpc('manage_profile', {
      operation: 'refresh',
      profile_id: customer_id
    });
    
    if (rpcError) throw rpcError;
    
    console.log(`Subscription ${subscription_id} renewed for customer ${customer_id}`);
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
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: new_plan.id,
        subscription_current_period_end: new Date(current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);
    
    if (error) throw error;
    
    // Refresh credits based on the new plan
    const { error: rpcError } = await supabase.rpc('manage_profile', {
      operation: 'refresh',
      profile_id: customer_id
    });
    
    if (rpcError) throw rpcError;
    
    // Log the plan change event
    const { error: insertError } = await supabase
      .from('subscription_events')
      .insert({
        profile_id: customer_id,
        subscription_id: subscription_id,
        event_type: 'plan_changed',
        previous_plan: previous_plan.id,
        new_plan: new_plan.id,
        created_at: new Date().toISOString()
      });
    
    if (insertError) throw insertError;
    
    console.log(`Subscription ${subscription_id} plan changed from ${previous_plan.id} to ${new_plan.id} for customer ${customer_id}`);
  } catch (error) {
    console.error('Error handling subscription plan change:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(data) {
  const { payment_id, customer_id, amount, currency } = data;
  
  try {
    const { error } = await supabase
      .from('payment_history')
      .insert({
        profile_id: customer_id,
        payment_id: payment_id,
        amount: amount,
        currency: currency,
        status: 'succeeded',
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    console.log(`Payment ${payment_id} succeeded for customer ${customer_id}`);
  } catch (error) {
    console.error('Error logging successful payment:', error);
    throw error;
  }
}

async function handlePaymentFailed(data) {
  const { payment_id, customer_id, amount, currency, error: paymentError } = data;
  
  try {
    const { error } = await supabase
      .from('payment_history')
      .insert({
        profile_id: customer_id,
        payment_id: payment_id,
        amount: amount,
        currency: currency,
        status: 'failed',
        error_message: paymentError?.message,
        error_code: paymentError?.code,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    console.log(`Payment ${payment_id} failed for customer ${customer_id}`);
  } catch (error) {
    console.error('Error logging failed payment:', error);
    throw error;
  }
}
