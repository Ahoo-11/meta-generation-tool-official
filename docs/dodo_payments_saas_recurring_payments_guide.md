# Setup SaaS Recurring Payment with Dodo Payments

## Table of Contents
1. [Introduction](#introduction)
2. [Understanding Dodo Payments](#understanding-dodo-payments)
3. [Setting Up Recurring Payments](#setting-up-recurring-payments)
4. [Testing in Test Mode](#testing-in-test-mode)
5. [Webhook Integration](#webhook-integration)
6. [Best Practices](#best-practices)
7. [Going Live](#going-live)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

## Introduction

This guide provides a comprehensive overview of how to set up recurring payments for your SaaS application using Dodo Payments. It covers the entire process from initial setup to testing and going live, along with best practices to ensure a smooth implementation.

Dodo Payments is a Merchant of Record (MoR) solution that handles payments, taxes, and compliance for digital businesses selling globally. It provides robust support for recurring payments, making it ideal for SaaS businesses with subscription-based revenue models.

## Understanding Dodo Payments

### What is Dodo Payments?

Dodo Payments is a global merchant of record platform that helps businesses boost revenue by offering localized payment methods worldwide. It eliminates the need to set up individual payment entities and integrate various payment systems by providing a comprehensive solution that includes:

- Automated recurring billing
- Flexible pricing models (monthly, annual, custom)
- Subscription analytics (tracking MRR and churn)
- Failed payment handling with retries and customer notifications
- Secure PCI-compliant payment processing
- Global payment support with multiple currencies
- Automated tax and compliance management

### Test Mode vs. Live Mode

Dodo Payments operates in two modes:

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Create Products | ✓ | ✓ |
| Generate Payment Links | ✓ | ✓ |
| Simulate Payments | ✓ | ✗ |
| Process Real Payments | ✗ | ✓ |
| Issue Refunds | ✓ (Simulated) | ✓ (Real) |
| Access Transaction History | ✓ (Simulated) | ✓ (Real) |
| Download Invoices | ✓ (Simulated) | ✓ (Real) |
| Link Bank Account | ✓ | ✓ |
| Payouts to Bank Account | ✗ | ✓ |
| Simulate Failed Transactions | ✓ | ✗ |
| API Keys Generation | ✓ | ✓ |

## Setting Up Recurring Payments

### Step 1: Create an Account on Dodo Payments

Begin by creating and verifying your account on Dodo Payments. This involves setting up your business profile, verifying your identity, and configuring your payout methods.

### Step 2: Set Up Subscription Products

1. **Navigate to the Dashboard**:
   - Log in to your Dodo Payments dashboard.

2. **Go to the Products Section**:
   - From the sidebar menu, click on **Products** to view your current catalog.

3. **Add a New Product**:
   - Click the **Add New Product** button.
   - Select the **Subscription** option in **Pricing type**.

4. **Enter Subscription Details**:
   - **Subscription Name**: Provide a descriptive name for the subscription plan (e.g., "Premium Membership" or "Pro Plan").
   - **Description**: Write a detailed explanation of what the subscription includes, its benefits, and any special features.
   - **Pricing**: Set the recurring price (e.g., $100/year).

5. **Configure the Billing Cycle**:
   - Set how often the customer will be billed (e.g., **monthly**, **quarterly**, **yearly**). You can also create custom billing intervals if needed.

6. **Optional: Add a Free Trial Period**:
   - Offer a **Free Trial** period to attract new subscribers. For example, provide a 7-day or 30-day trial, after which the customer will be automatically billed if they don't cancel.

### Step 3: Integrate with Your SaaS Application

#### Using API

The recommended approach for SaaS applications is to implement Dodo Payments via their API. Here's a basic integration example in JavaScript:

```javascript
async function main() {
  const subscription = await client.subscriptions.create({
    billing: { city: 'city', country: 'IN', state: 'state', street: 'street', zipcode: 89789 },
    customer: { customer_id: 'customer_id' },
    product_id: 'product_id',
    payment_link: true,
    return_url: 'https://example.com/success',
    quantity: 1,
  });

  console.log(subscription.subscription_id);
}

main();
```

#### Using SDKs

Dodo Payments provides SDKs for various programming languages including Node.js, Python, PHP, Go, Ruby, Java, and Kotlin to simplify the integration process.

## Testing in Test Mode

Testing is crucial before going live. Dodo Payments provides a comprehensive testing environment.

### Test Card Details

For testing, you can use the following test card details:

**Successful Payments (International)**:
- Card Number: 4242424242424242
- Expiry Date: 06/32
- CVV/CVC: 123

**Successful Payments (India)**:
- Card Number: 6074825972083818
- Expiry Date: 06/32
- CVV/CVC: 123

**Declined Payment (International)**:
- Card Number: 4000000000000002
- Expiry Date: 06/32
- CVV/CVC: 123

**Declined Payment (India)**:
- Card Number: 4000000000000127
- Expiry Date: 06/32
- CVV/CVC: 123

### Test UPI Details

**SUCCESS**:
- UPI ID: success@upi

**FAILURE**:
- UPI ID: failure@upi

### Testing the Subscription Flow

1. Create a subscription product in Test Mode
2. Generate a payment link
3. Complete the purchase using test card details
4. Verify the subscription activation
5. Test payment renewal (if applicable)
6. Test various failure scenarios
7. Test subscription cancellation

## Webhook Integration

Webhooks are essential for tracking subscription lifecycle events. Dodo Payments sends webhook events that you should listen for and handle accordingly.

### Setting Up Webhook Endpoint

To set up your webhook endpoint, follow the Detailed Integration Guide provided by Dodo Payments. This involves creating an endpoint on your server that can receive POST requests from Dodo Payments.

### Subscription Event Types

When integrating subscriptions, you'll receive webhooks to track the subscription lifecycle:

1. `subscription.active` - Indicates subscription activation
2. `payment.succeeded` - Confirms the initial payment:
   - For immediate billing (0 trial days): Expect within 2-10 minutes
   - For trial days: whenever that ends
3. `subscription.renewed` - Indicates payment deduction and renewal for next cycle (Along with `subscription.renewal` and `payment.succeeded` webhooks)

### Payment Scenarios

#### Successful Payment Flow

When a payment succeeds, you'll receive:
1. `subscription.active` - Indicates subscription activation
2. `payment.succeeded` - Confirms the initial payment
3. `subscription.renewed` - Indicates payment deduction and renewal for next cycle

#### Payment Failure Scenarios

For subscription failures, you should handle:
1. `subscription.past_due` - Payment attempt was unsuccessful
2. `subscription.cancelled` - Subscription is cancelled due to repeated payment failures

### Sample Webhook Event Payload

```json
{
  "business_id": "string",
  "timestamp": "string",
  "type": "string",
  "data": {
    // Event-specific data
  }
}
```

### Best Practice

To simplify implementation, focus primarily on tracking subscription events for managing the subscription lifecycle.

## Best Practices

### 1. Implement Proper Error Handling

Implement robust error handling to manage payment failures, declined cards, and other edge cases. This includes providing clear error messages to users and setting up appropriate retry mechanisms.

### 2. Use Webhooks for Real-time Updates

Leverage webhooks to keep your application in sync with the payment status. This ensures your users have access to the features they've paid for and helps manage subscription state changes effectively.

### 3. Secure Your Integration

- Store API keys securely
- Implement proper authentication for your webhook endpoints
- Validate webhook signatures to ensure they come from Dodo Payments

### 4. Provide Clear Subscription Information

Make subscription terms, billing frequency, and cancellation policies clear to your users to reduce chargebacks and improve customer satisfaction.

### 5. Test All Scenarios

Thoroughly test different payment scenarios, including successful payments, failed payments, subscription cancellations, and plan changes.

### 6. Monitor and Analyze

Regularly monitor subscription metrics such as churn rate, monthly recurring revenue (MRR), and customer lifetime value (CLV) to optimize your pricing and retention strategies.

## Going Live

Once you've thoroughly tested your integration, you can move to the live environment. Here's how:

### 1. Complete the Verification Process

Before going live, ensure you have completed the identity verification and business verification processes on Dodo Payments.

### 2. Switch from Test Mode to Live Mode

In your Dodo Payments dashboard, switch from Test Mode to Live Mode. Note that the data in Test Mode is separate from Live Mode.

### 3. Update API Keys

Replace your test API keys with live API keys in your application. Never expose these keys in client-side code.

### 4. Conduct End-to-End Testing

Even in live mode, perform a few real transactions to ensure everything works as expected before announcing the feature to all your users.

### 5. Monitor Initial Transactions

Closely monitor the initial transactions to catch any unexpected issues quickly.

## API Reference

For detailed API documentation, refer to:

1. **Create Subscription**: `POST /subscriptions`
2. **Get Subscription Detail**: `GET /subscriptions/{subscription_id}`
3. **List Subscriptions**: `GET /subscriptions`
4. **Change Plan**: `POST /subscriptions/{subscription_id}/change-plan`
5. **Update Subscription**: `PATCH /subscriptions/{subscription_id}`
6. **Create On-Demand Charge**: `POST /subscriptions/{subscription_id}/charge`

## Troubleshooting

### Common Issues and Solutions

1. **Webhook Events Not Received**
   - Verify your webhook endpoint is publicly accessible
   - Check if the webhook URL is correctly configured in the Dodo Payments dashboard
   - Ensure your server is properly handling POST requests

2. **Payment Failures**
   - Verify the customer's billing information is correct
   - Check if the card has sufficient funds
   - Look for any restrictions on the customer's card

3. **Subscription Not Activated After Payment**
   - Verify webhook events are being properly processed
   - Check if there are any issues with your webhook handling code
   - Ensure the payment was successfully completed

4. **API Integration Errors**
   - Validate your API credentials
   - Check the request format against the API documentation
   - Review error responses for specific error codes and messages

For additional help, contact Dodo Payments support through their Discord community, email, or chat support.

---

This guide provides a comprehensive overview of setting up and managing SaaS recurring payments with Dodo Payments. For specific API details or advanced features, refer to the official [Dodo Payments Documentation](https://docs.dodopayments.com/).