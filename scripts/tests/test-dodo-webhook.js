// Test script to simulate Dodo Payments webhook events
const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'http://localhost:5175/api/webhooks/dodo-payments';
const WEBHOOK_SECRET = process.env.VITE_DODO_PAYMENTS_WEBHOOK_SECRET || 'whsec_WCNk54MC15TS8FZ8eVIFZk1K';

// Sample webhook events
const events = {
  paymentSucceeded: {
    type: 'payment.succeeded',
    data: {
      id: 'pay_' + crypto.randomBytes(8).toString('hex'),
      customerId: 'cus_' + crypto.randomBytes(8).toString('hex'),
      amount: 1999, // $19.99
      currency: 'USD',
      status: 'succeeded',
      metadata: {
        profile_id: process.argv[2] || '00000000-0000-0000-0000-000000000000', // Pass profile ID as argument
      }
    }
  },
  subscriptionCreated: {
    type: 'subscription.created',
    data: {
      id: 'sub_' + crypto.randomBytes(8).toString('hex'),
      customerId: 'cus_' + crypto.randomBytes(8).toString('hex'),
      status: 'active',
      currentPeriodStart: Math.floor(Date.now() / 1000),
      currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      metadata: {
        profile_id: process.argv[2] || '00000000-0000-0000-0000-000000000000',
        plan_id: 'pro'
      }
    }
  },
  subscriptionCancelled: {
    type: 'subscription.deleted',
    data: {
      id: 'sub_' + crypto.randomBytes(8).toString('hex'),
      customerId: 'cus_' + crypto.randomBytes(8).toString('hex'),
      status: 'canceled',
      metadata: {
        profile_id: process.argv[2] || '00000000-0000-0000-0000-000000000000'
      }
    }
  },
  customerCreated: {
    type: 'customer.created',
    data: {
      id: 'cus_' + crypto.randomBytes(8).toString('hex'),
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: {
        profile_id: process.argv[2] || '00000000-0000-0000-0000-000000000000'
      }
    }
  }
};

// Function to sign the payload
function signPayload(payload) {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

// Function to send a webhook event
async function sendWebhookEvent(eventType) {
  const event = events[eventType];
  if (!event) {
    console.error(`Unknown event type: ${eventType}`);
    return;
  }

  const signature = signPayload(event);

  try {
    console.log(`Sending ${eventType} event to ${WEBHOOK_URL}...`);
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dodo-signature': signature
      },
      body: JSON.stringify(event)
    });

    const responseData = await response.json();
    console.log(`Response (${response.status}):`, responseData);
  } catch (error) {
    console.error('Error sending webhook event:', error);
  }
}

// Main function
async function main() {
  const eventType = process.argv[3] || 'paymentSucceeded';
  
  console.log('Profile ID:', process.argv[2] || '00000000-0000-0000-0000-000000000000');
  console.log('Event Type:', eventType);
  
  await sendWebhookEvent(eventType);
}

main().catch(console.error);
