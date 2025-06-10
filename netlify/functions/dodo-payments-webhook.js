// Netlify serverless function to handle Dodo Payments webhooks
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://alywdwwqrtddplqsbksd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Webhook secret from environment variables
const WEBHOOK_SECRET = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get the signature from headers
    const signature = event.headers['dodo-signature'];
    
    if (!signature || !WEBHOOK_SECRET) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing signature or webhook secret' })
      };
    }

    // Verify the webhook signature (implementation depends on Dodo Payments' verification method)
    // This is a placeholder for the actual verification logic
    // const isValid = verifySignature(event.body, signature, WEBHOOK_SECRET);
    // if (!isValid) {
    //   return {
    //     statusCode: 401,
    //     body: JSON.stringify({ error: 'Invalid signature' })
    //   };
    // }

    // Parse the webhook payload
    const payload = JSON.parse(event.body);

    // Process different event types
    switch (payload.type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(payload.data);
        break;
      
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionChange(payload.data);
        break;
      
      case 'subscription.deleted':
        await handleSubscriptionCancelled(payload.data);
        break;
      
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerChange(payload.data);
        break;
      
      default:
        console.log(`Unhandled event type: ${payload.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

/**
 * Handle successful payment events
 */
async function handlePaymentSucceeded(data) {
  try {
    const { customerId, amount, metadata } = data;
    
    // If this payment is associated with a profile, update the profile
    if (metadata?.profile_id) {
      const { error } = await supabase.rpc('manage_profile', {
        p_profile_id: metadata.profile_id,
        p_operation: 'add_credits',
        p_credits: calculateCreditsFromPayment(amount)
      });
      
      if (error) {
        console.error('Error updating profile credits:', error);
      }
    }
    
    // Log the payment in the payments table
    const { error } = await supabase
      .from('payments')
      .insert({
        user_id: metadata?.profile_id,
        customer_id: customerId,
        amount,
        status: 'succeeded',
        metadata
      });
    
    if (error) {
      console.error('Error logging payment:', error);
    }
  } catch (error) {
    console.error('Error handling payment succeeded event:', error);
  }
}

/**
 * Handle subscription creation or update events
 */
async function handleSubscriptionChange(data) {
  try {
    const { 
      id: subscriptionId, 
      customerId, 
      status, 
      currentPeriodEnd, 
      currentPeriodStart,
      metadata 
    } = data;
    
    // If this subscription is associated with a profile, update the profile
    if (metadata?.profile_id) {
      const { error } = await supabase.rpc('manage_profile', {
        p_profile_id: metadata.profile_id,
        p_operation: 'update_subscription',
        p_subscription_data: {
          subscription_id: subscriptionId,
          customer_id: customerId,
          subscription_plan: metadata.plan_id || 'basic',
          billing_cycle_start: currentPeriodStart,
          billing_cycle_end: currentPeriodEnd,
          payment_status: status
        }
      });
      
      if (error) {
        console.error('Error updating profile subscription:', error);
      }
    }
  } catch (error) {
    console.error('Error handling subscription change event:', error);
  }
}

/**
 * Handle subscription cancellation events
 */
async function handleSubscriptionCancelled(data) {
  try {
    const { metadata } = data;
    
    // If this subscription is associated with a profile, update the profile
    if (metadata?.profile_id) {
      const { error } = await supabase.rpc('manage_profile', {
        p_profile_id: metadata.profile_id,
        p_operation: 'cancel_subscription'
      });
      
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
async function handleCustomerChange(data) {
  try {
    const { id: customerId, metadata } = data;
    
    // If this customer is associated with a profile, update the profile
    if (metadata?.profile_id) {
      const { error } = await supabase
        .from('profiles')
        .update({
          customer_id: customerId
        })
        .eq('id', metadata.profile_id);
      
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
 */
function calculateCreditsFromPayment(amount) {
  // Convert amount from cents to dollars and apply a conversion rate
  // Example: $1 = 10 credits
  const dollars = amount / 100;
  return Math.floor(dollars * 10);
}
