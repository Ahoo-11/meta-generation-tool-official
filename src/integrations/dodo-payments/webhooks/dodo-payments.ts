/**
 * Dodo Payments Webhook Handler
 * 
 * This API endpoint receives webhooks from Dodo Payments and processes them.
 * It handles events like successful payments, subscription changes, etc.
 */

import { supabase } from '@/integrations/supabase/client';

// Webhook secret from environment variables
const WEBHOOK_SECRET = import.meta.env.VITE_DODO_PAYMENTS_WEBHOOK_SECRET;

export async function handleDodoPaymentsWebhook(req: Request): Promise<Response> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the signature from headers
    const signature = req.headers.get('dodo-signature');
    
    if (!signature || !WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Missing signature or webhook secret' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the webhook signature (implementation depends on Dodo Payments' verification method)
    // This is a placeholder for the actual verification logic
    // const isValid = verifySignature(await req.json(), signature, WEBHOOK_SECRET);
    // if (!isValid) {
    //   return new Response(JSON.stringify({ error: 'Invalid signature' }), {
    //     status: 401,
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    // }

    const event = await req.json();

    // Process different event types
    switch (event.type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data);
        break;
      
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionChange(event.data);
        break;
      
      case 'subscription.deleted':
        await handleSubscriptionCancelled(event.data);
        break;
      
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerChange(event.data);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle successful payment events
 */
async function handlePaymentSucceeded(data: Record<string, unknown>) {
  try {
    const customerId = data.customerId as string;
    const amount = data.amount as number;
    const metadata = data.metadata as Record<string, unknown> || {};
    
    // If this payment is associated with a profile, update the profile
    if (metadata?.profile_id) {
      // Add credits to the user's profile
      const { error } = await supabase.rpc('add_credits', {
        user_id: metadata.profile_id as string,
        amount: calculateCreditsFromPayment(amount),
        description: `Payment ${data.id as string}`
      });
      
      if (error) {
        console.error('Error updating profile credits:', error);
      }
    }
    
    // Record the payment
    try {
      const { error: paymentError } = await supabase.rpc('add_credits', {
        user_id: metadata.profile_id as string,
        amount: calculateCreditsFromPayment(amount),
        description: `Dodo payment ${data.id as string}`
      });
      
      if (paymentError) {
        console.error('Error recording payment:', paymentError);
      }
    } catch (paymentError) {
      console.error('Error processing payment record:', paymentError);
    }
  } catch (error) {
    console.error('Error handling payment succeeded event:', error);
  }
}

/**
 * Handle subscription creation or update events
 */
async function handleSubscriptionChange(data: Record<string, unknown>) {
  try {
    const subscriptionId = data.id as string;
    const customerId = data.customerId as string;
    const status = data.status as string;
    const currentPeriodEnd = data.currentPeriodEnd as number;
    const currentPeriodStart = data.currentPeriodStart as number;
    const metadata = data.metadata as Record<string, unknown> || {};
    
    // If this subscription is associated with a profile, update the profile
    if (metadata?.profile_id) {
      // Update the profile with subscription information
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_id: subscriptionId,
          customer_id: customerId,
          subscription_plan: (metadata.plan_id as string) || 'basic',
          billing_cycle_start: new Date(currentPeriodStart * 1000).toISOString(),
          billing_cycle_end: new Date(currentPeriodEnd * 1000).toISOString(),
          payment_status: status
        })
        .eq('id', metadata.profile_id as string);
      
      if (error) {
        console.error('Error updating profile subscription:', error);
      }
      
      // If this is a new subscription, add the monthly credits
      if (status === 'active' && metadata.plan_id) {
        const planCredits = getPlanCredits(metadata.plan_id as string);
        if (planCredits > 0) {
          const { error: creditError } = await supabase.rpc('add_credits', {
            user_id: metadata.profile_id as string,
            amount: planCredits,
            description: `Subscription credits: ${metadata.plan_id as string} plan`
          });
          
          if (creditError) {
            console.error('Error adding subscription credits:', creditError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error handling subscription change event:', error);
  }
}

/**
 * Get the number of credits for a subscription plan
 */
function getPlanCredits(planId: string): number {
  switch (planId) {
    case 'basic':
      return 1000;
    case 'pro':
      return 5000;
    case 'unlimited':
      return 50000;
    default:
      return 0;
  }
}

/**
 * Handle subscription cancellation events
 */
async function handleSubscriptionCancelled(data: Record<string, unknown>) {
  try {
    const metadata = data.metadata as Record<string, unknown> || {};
    
    // If this subscription is associated with a profile, update the profile
    if (metadata?.profile_id) {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_id: null,
          payment_status: 'canceled'
        })
        .eq('id', metadata.profile_id as string);
      
      if (error) {
        console.error('Error updating profile for cancelled subscription:', error);
      }
    }
  } catch (error) {
    console.error('Error handling subscription cancelled event:', error);
  }
}

/**
 * Handle customer creation or update events
 */
async function handleCustomerChange(data: Record<string, unknown>) {
  try {
    const customerId = data.id as string;
    const metadata = data.metadata as Record<string, unknown> || {};
    
    // If this customer is associated with a profile, update the profile
    if (metadata?.profile_id) {
      const { error } = await supabase
        .from('profiles')
        .update({
          customer_id: customerId
        })
        .eq('id', metadata.profile_id as string);
      
      if (error) {
        console.error('Error updating profile with customer ID:', error);
      }
    }
  } catch (error) {
    console.error('Error handling customer change event:', error);
  }
}

/**
 * Calculate credits to award based on payment amount
 * @param amount Payment amount in cents
 * @returns Number of credits to award
 */
function calculateCreditsFromPayment(amount: number): number {
  // Convert cents to dollars and multiply by credit conversion rate
  // For example, $1 = 10 credits
  const dollars = amount / 100;
  return Math.floor(dollars * 10);
}