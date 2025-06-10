# Webhook Event Types for Subscriptions

When implementing subscription management with Dodo Payments, you need to handle various webhook event types that notify your system about changes in subscription status. Here are the key event types related to subscriptions:

## Subscription Lifecycle Events

1. **subscription.active**:
   - Triggered when a subscription is successfully activated after payment
   - Indicates that the customer has successfully subscribed to your service
   - You should provision access to your service at this point

2. **subscription.on_hold**:
   - Triggered when a payment fails but the subscription isn't terminated yet
   - Dodo will attempt to retry the payment according to your retry settings
   - You may want to notify the customer about the payment issue

3. **subscription.failed**:
   - Triggered when all payment retry attempts have failed
   - The subscription is no longer active
   - You should restrict access to your service and notify the customer

4. **subscription.renewed**:
   - Triggered when a subscription payment has been successfully renewed
   - Indicates that the next billing cycle has started
   - You should update your records and potentially notify the customer

## Payment-Related Events

1. **payment.succeeded**:
   - Triggered when a payment for a subscription is successful
   - Contains details about the payment
   - Often accompanies subscription.active and subscription.renewed events

2. **payment.failed**:
   - Triggered when a payment attempt fails
   - Contains details about the failed payment
   - Often precedes subscription.on_hold or subscription.failed events

## Handling Webhooks Securely

It's critical to verify that webhooks are genuinely coming from Dodo Payments to prevent security issues. Dodo includes signature headers with each webhook:

```
webhook-id: <webhook-id>
webhook-signature: <webhook-signature>
webhook-timestamp: <webhook-timestamp>
```

You should verify the webhook signature using the webhook secret provided in your Dodo dashboard. The request body is sent as a JSON payload with Content-Type: application/json.

Example of a webhook verification implementation:

```javascript
function verifyWebhookSignature(request, secret) {
  const signature = request.headers['webhook-signature'];
  const timestamp = request.headers['webhook-timestamp'];
  const id = request.headers['webhook-id'];
  const payload = request.body;
  
  // Create string to sign
  const stringToSign = `${id}.${timestamp}.${JSON.stringify(payload)}`;
  
  // Compute HMAC with SHA256
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex');
  
  // Compare signatures using a constant-time comparison function
  // to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}
```

By properly handling these webhook events, you can maintain an up-to-date view of your customers' subscription statuses and take appropriate actions to ensure a smooth experience.