# Dodo Payments Integration Plan

## Introduction

This document outlines the steps needed to properly integrate Dodo Payments for subscription management and payment processing in our application using direct API calls. The current implementation has several issues that need to be fixed to ensure proper functionality.

## Current Issues

1. **Incomplete webhook implementation**:
   - Signature verification is commented out
   - Event handling is not aligned with Dodo Payments webhook event types

2. **API Interface Misalignment**:
   - The API structure doesn't match Dodo Payments recommended approach
   - Subscription management is not properly implemented

3. **Direct API Integration Issues**:
   - API calls are structured incorrectly for Dodo Payments API
   - Missing proper product and subscription setup

4. **Missing Implementation Components**:
   - No customer portal functionality
   - Incomplete handling of subscription lifecycle
   - No proper error handling for payment failures

## Prerequisites

- [x] Verified Dodo Payments account (production and test)
- [] API keys (test & live) and webhook secret from dashboard
- [ ] Secure development environment (test mode/sandbox)

## Implementation Plan

### 1. Set Up Core Products and Plans in Dodo Payments

- [ ] Define subscription plans (Basic, Premium, etc.)
- [ ] Create products in Dodo Payments via dashboard (recommended for core plans) or API (for dynamic/advanced use cases)
- [ ] Set up billing cycles (monthly, yearly, custom) and trial periods if needed
- [ ] Document and securely store product and price IDs for use in your integration

### 2. Create Direct API Integration Layer

- [ ] Create a new `dodo-payments-api.ts` service using the official Dodo Payments SDK or direct HTTP requests
- [ ] Implement all required API methods (payments, customers, subscriptions)
- [ ] Securely store and use API keys (never expose client-side)
- [ ] Implement robust error handling and logging

### 3. Webhook Integration & Security

- [ ] Set up a webhook endpoint to receive Dodo Payments events
- [ ] Implement signature verification using the webhook secret (see docs for example code)
- [ ] Handle all relevant events:
    - `subscription.active` (provision access)
    - `subscription.on_hold` (notify user, retry logic)
    - `subscription.failed` (revoke access, notify user)
    - `subscription.renewed` (extend access, notify user)
    - `payment.succeeded` (log payment, update credits)
    - `payment.failed` (log failure, notify user)
- [ ] Log all webhook events and actions for auditing/debugging

### 4. Subscription Lifecycle Management

- [ ] Provision/revoke access based on subscription status (from webhooks)
- [ ] Notify users of payment issues, renewals, and cancellations
- [ ] Support plan upgrades/downgrades and cancellations via API
- [ ] Update internal database (e.g., Supabase) according to webhook events

### 5. Testing

- [ ] Use Dodo’s test mode and test cards to simulate all payment and subscription flows
- [ ] Test webhook handling and ensure database/user state updates correctly
- [ ] Simulate payment failures, retries, and cancellations

### 6. Security & Compliance

- [ ] Never expose API keys or webhook secrets in client-side code
- [ ] Use environment variables for all sensitive information
- [ ] Document and review your tax configuration (tax inclusive/exclusive) and understand how Dodo Payments handles VAT/GST globally

### 7. Documentation & Maintenance

- [ ] Keep a list of all product/plan IDs, webhook event types, and API endpoints used
- [ ] Document your webhook handler logic and security checks
- [ ] Maintain clear internal documentation for onboarding and troubleshooting

### 3. Update Customer Management

- [ ] Complete customer creation and management functionality
- [ ] Implement customer portal access
- [ ] Ensure customer data is properly synchronized with Supabase

### 4. Complete Subscription Implementation

- [ ] Fix subscription creation process
- [ ] Implement subscription lifecycle management (upgrades, downgrades, cancellations)
- [ ] Add proper metadata handling for subscriptions
- [ ] Implement trial period management

### 5. Fix Webhook Integration

- [ ] Implement proper signature verification
- [ ] Update event handling for all required event types
- [ ] Ensure webhook handlers correctly update the database
- [ ] Add logging for debugging

### 6. Update Frontend Components

- [ ] Fix `DodoCheckout.tsx` component to handle both one-time and subscription payments
- [ ] Update `DodoSubscriptionButton.tsx` to correctly handle subscription creation
- [ ] Add subscription management UI
- [ ] Implement payment method management

### 7. Testing

- [ ] Test payment flow with test cards
- [ ] Test subscription creation and management
- [ ] Test webhook functionality
- [ ] Test error scenarios and recovery

### 8. Documentation

- [ ] Update internal documentation
- [ ] Create user guides for payment and subscription management
- [ ] Document webhook handling and event types

## Security Considerations

- Ensure webhook secrets are properly stored as environment variables
- Implement proper signature verification for webhooks
- Store sensitive customer information securely
- Use proper error handling to avoid exposing sensitive information

## Integration with Supabase

- Update profile management stored procedures to handle subscription events
- Ensure credits are properly allocated based on subscription plan
- Implement proper tracking of subscription status in user profiles

## Timeline

Each task should be completed and tested individually before moving on to the next to ensure a stable implementation throughout the process. The estimated timeline is dependent on resource availability.
