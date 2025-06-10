# Setting Up Recurring Payments with Dodo Payments

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Understanding Dodo Payments Subscription Model](#understanding-dodo-payments-subscription-model)
4. [Setting Up Your Development Environment](#setting-up-your-development-environment)
5. [Creating Subscription Plans](#creating-subscription-plans)
6. [Integrating Dodo Payments API](#integrating-dodo-payments-api)
7. [Implementing Webhooks](#implementing-webhooks)
8. [Testing Your Integration](#testing-your-integration)
9. [Going Live](#going-live)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Introduction

This comprehensive guide will walk you through the process of setting up recurring payments for your SaaS application using Dodo Payments. Recurring payments are essential for subscription-based business models, allowing you to automatically bill your customers on a regular schedule without requiring manual intervention. Dodo Payments provides a robust API and infrastructure for managing subscriptions, handling payment processing, and tracking payment statuses.

## Prerequisites

Before you begin implementing recurring payments with Dodo Payments, ensure you have the following:

1. **A verified Dodo Payments account**: You mentioned you already have this set up.
2. **API credentials**: You'll need your API keys from the Dodo Payments Dashboard.
3. **Development environment**: Set up a secure development environment for testing.
4. **Basic knowledge of RESTful APIs**: Understanding how to make HTTP requests and process responses.
5. **Server-side implementation capability**: You'll need a backend system capable of making secure API calls and receiving webhooks.

## Understanding Dodo Payments Subscription Model

Dodo Payments uses a subscription-based model for recurring payments with the following key components:

- **Products**: Represent what you're selling (your SaaS tiers/plans)
- **Customers**: Your users who will be billed recurringly
- **Subscriptions**: The connection between a customer and a product with billing terms
- **Payment methods**: How customers pay (credit cards, etc.)
- **Webhooks**: Real-time notifications about subscription events

A subscription in Dodo Payments has a lifecycle with several states:
- Active: Subscription is current and payments are being processed successfully
- On Hold: Temporary issue with processing payments
- Failed: Multiple failed payment attempts
- Canceled: Subscription has been terminated

## Setting Up Your Development Environment

Before implementing recurring payments in your production environment, you should set up a development environment for testing:

1. **Use the test API endpoints**: Dodo Payments provides a sandbox environment at `https://test.dodopayments.com` that allows you to simulate transactions without processing real payments.

2. **Obtain test API keys**: In your Dodo Payments dashboard, generate API keys specifically for the test environment.

3. **Set up a webhook receiver**: Create an endpoint in your application that can receive and process webhook events from Dodo Payments. During development, you can use tools like ngrok to expose your local server to the internet.

4. **Install necessary libraries**: Depending on your tech stack, install the appropriate Dodo Payments SDK or HTTP client library. Dodo provides official SDKs for several popular languages including Node.js, Python, PHP, Go, Ruby, Java, and Kotlin.

Example for Node.js:
```javascript
// Install the Dodo Payments Node.js SDK
npm install dodopayments

// Basic setup
import DodoPayments from 'dodopayments';
const client = new DodoPayments({
  bearerToken: process.env['DODO_PAYMENTS_API_KEY'], // This is the default and can be omitted
});
```

## Creating Subscription Plans

Before you can offer subscriptions to your customers, you need to set up your product plans in Dodo Payments:

1. **Define your pricing tiers**: Determine what subscription plans you want to offer (e.g., Basic, Premium, Enterprise).

2. **Create products via API or Dashboard**: You can create products either through the Dodo Payments Dashboard or via the API.

Using the API:
```javascript
async function createProduct() {
  const product = await client.products.create({
    name: 'Premium Plan',
    description: 'Premium tier with advanced features',
    type: 'service',
    active: true,
    price: 4999, // $49.99 in cents
    recurring: {
      interval: 'month',
      interval_count: 1, // bill every 1 month
    },
    metadata: {
      features: 'advanced_analytics,priority_support,unlimited_projects'
    }
  });
  
  return product;
}
```

3. **Set billing cycles**: Determine how often you want to bill customers (monthly, annually, etc.).

4. **Define trial periods**: If you're offering free trials, configure the trial period duration.

## Integrating Dodo Payments API

To implement recurring payments, you'll need to integrate with Dodo Payments API to create subscriptions when users sign up:

1. **Create customers**: When a user signs up for your service, create a customer in Dodo Payments.

```javascript
async function createCustomer(userData) {
  const customer = await client.customers.create({
    email: userData.email,
    name: userData.name,
    metadata: {
      user_id: userData.internalId,
      signup_date: new Date().toISOString()
    }
  });
  
  return customer;
}
```

2. **Create subscriptions**: When a customer selects a plan, create a subscription linking the customer to the product.

```javascript
async function createSubscription() {
  const subscription = await client.subscriptions.create({
    customer: { customer_id: 'customer_id' },
    billing: { 
      city: 'city', 
      country: 'AF', 
      state: 'state', 
      street: 'street', 
      zipcode: 'zipcode' 
    },
    payment_link: '<string>', // Optional - Create a subscription & return a payment link
    product_id: 'product_id',
    subscription_id: 'custom_subscription_id', // Optional - Your custom subscription ID
    metadata: {} // Optional - Custom metadata
  });
  
  return subscription;
}
```

3. **Handle subscription activation**: After a successful payment, the subscription becomes active.

## Implementing Webhooks

Webhooks are a critical component of your recurring payment implementation, as they allow Dodo Payments to send real-time notifications about subscription events:

1. **Configure webhook endpoints**: In your Dodo Payments Dashboard, configure webhook endpoints where Dodo can send notifications.

2. **Set up a webhook handler**: Create an endpoint in your application to receive and process webhook events.

```javascript
// Example webhook handler in Express.js
app.post('/webhooks/dodo', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['dodo-signature'];
  let event;
  
  try {
    // Verify the webhook signature to ensure it came from Dodo
    event = client.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'subscription.active':
      handleSubscriptionActive(event.data.object);
      break;
    case 'subscription.on_hold':
      handleSubscriptionOnHold(event.data.object);
      break;
    case 'subscription.failed':
      handleSubscriptionFailed(event.data.object);
      break;
    case 'subscription.renewed':
      handleSubscriptionRenewed(event.data.object);
      break;
    case 'payment.succeeded':
      handlePaymentSucceeded(event.data.object);
      break;
    case 'payment.failed':
      handlePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.send();
});
```

3. **Implement webhook event handlers**: Create functions to handle different webhook events.

```javascript
function handleSubscriptionActive(subscription) {
  // Update your database to mark the subscription as active
  // Provision access to your service
  console.log('Subscription activated:', subscription.id);
}

function handleSubscriptionOnHold(subscription) {
  // Update your database, possibly notify the customer
  console.log('Subscription on hold:', subscription.id);
}

function handleSubscriptionFailed(subscription) {
  // Update your database, notify the customer, possibly restrict service
  console.log('Subscription failed:', subscription.id);
}
```

## Testing Your Integration

Before going live, thoroughly test your recurring payment integration in the Dodo Payments test environment:

1. **Test customer creation**: Create test customers and verify they appear in your Dodo dashboard.

2. **Test subscription creation**: Create subscriptions for test customers and verify they are correctly configured.

3. **Test payment flows**: Simulate successful and failed payments to ensure your system handles them correctly.

4. **Test webhook processing**: Trigger webhook events and verify your system processes them correctly.

5. **Test subscription lifecycle**: Test the entire subscription lifecycle, including trials, renewals, and cancellations.

6. **Test error handling**: Deliberately introduce errors to verify your system handles them gracefully.

Dodo Payments provides test card numbers that you can use to simulate different payment scenarios:

- For successful payments: 4242 4242 4242 4242
- For payment requiring authentication: 4000 0000 0000 3220
- For declined payment: 4000 0000 0000 9995

## Going Live

Once you've thoroughly tested your integration, you can transition to the live environment:

1. **Switch to production API keys**: Replace your test API keys with production API keys.

2. **Update API endpoints**: Switch from the test endpoint (`https://test.dodopayments.com`) to the live endpoint (`https://live.dodopayments.com`).

3. **Update webhook URLs**: Ensure your webhook configuration points to your production webhook endpoints.

4. **Monitor initial transactions**: Closely monitor the first few transactions to ensure everything is working correctly.

5. **Set up alerting**: Configure alerts to notify you of critical issues, such as failed webhooks or subscription failures.

## Best Practices

Follow these best practices to ensure a successful recurring payment implementation:

1. **Secure your API keys**: Never expose your API keys in client-side code or public repositories.

2. **Implement proper error handling**: Always handle API errors gracefully and provide clear feedback to users.

3. **Use idempotency keys**: For critical operations, use idempotency keys to prevent duplicate operations due to network issues.

4. **Store subscription data**: Maintain a database of subscription information in your system, synced with Dodo Payments.

5. **Implement retry logic**: For critical API calls, implement retry logic with exponential backoff to handle temporary failures.

6. **Provide clear pricing information**: Make your pricing and billing terms clear to customers before they subscribe.

7. **Send email receipts**: Notify customers via email when they're billed.

8. **Implement dunning management**: Handle failed payments proactively by notifying customers and retrying payments.

9. **Set up monitoring**: Monitor webhook deliveries and API responses to quickly identify issues.

10. **Maintain PCI compliance**: Never handle raw card data unless you're PCI compliant; use Dodo's secure payment forms instead.

## Troubleshooting

Common issues and their solutions:

1. **Webhook verification failures**: Check that you're using the correct webhook secret and that the signature header is being correctly passed to your verification function.

2. **API authentication errors**: Verify that you're using the correct API keys for the environment (test vs. production).

3. **Subscription creation failures**: Check the API response for error details and verify that all required fields are provided.

4. **Missing webhook events**: Verify that your webhook URL is correctly configured and accessible from the internet.

5. **Unexpected subscription states**: Use the Dodo dashboard to manually verify subscription states and compare with your database.

If you encounter issues not covered here, consult the Dodo Payments documentation or contact their developer support for assistance.

---

By following this guide, you should now have a solid understanding of how to set up recurring payments for your SaaS application using Dodo Payments. Remember to thoroughly test your integration before going live, and continuously monitor your payment flows to ensure a smooth experience for your customers.